"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadManager = void 0;
const logger_1 = require("../logger");
const errors_1 = require("../utils/errors");
class DownloadManager {
    config;
    client;
    database;
    fileService;
    progressCallback;
    constructor(config, client, database, fileService) {
        this.config = config;
        this.client = client;
        this.database = database;
        this.fileService = fileService;
    }
    /**
     * Set progress callback
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }
    async initialise() {
        await this.fileService.initialise();
    }
    async runAllTargets() {
        const totalTargets = this.config.targets.length;
        let currentTarget = 0;
        for (const target of this.config.targets) {
            currentTarget++;
            const targetName = target.filterTag || target.tag || 'unknown';
            this.updateProgress(currentTarget, totalTargets, `处理目标: ${targetName} (${target.type})`);
            switch (target.type) {
                case 'illustration':
                    await this.handleIllustrationTarget(target);
                    break;
                case 'novel':
                    await this.handleNovelTarget(target);
                    break;
                default:
                    logger_1.logger.warn(`Unsupported target type ${target.type}`);
            }
        }
        if (this.progressCallback) {
            this.progressCallback(totalTargets, totalTargets, '所有目标处理完成');
        }
    }
    /**
     * Update progress
     */
    updateProgress(current, total, message) {
        if (this.progressCallback) {
            this.progressCallback(current, total, message);
        }
    }
    /**
     * Calculate popularity score for an illustration or novel
     * Uses total_bookmarks (preferred) or bookmark_count as primary metric
     */
    getPopularityScore(item) {
        // Prefer total_bookmarks, fallback to bookmark_count
        const bookmarks = item.total_bookmarks ?? item.bookmark_count ?? 0;
        // Use view count as secondary metric (weighted lower)
        const views = item.total_view ?? item.view_count ?? 0;
        // Combined score: bookmarks are primary, views are secondary (divide by 1000 to normalize)
        return bookmarks + (views / 1000);
    }
    /**
     * Sort items by popularity and log top results
     */
    sortByPopularityAndLog(items, limit, itemType) {
        if (items.length === 0) {
            return;
        }
        items.sort((a, b) => {
            const scoreA = this.getPopularityScore(a);
            const scoreB = this.getPopularityScore(b);
            return scoreB - scoreA; // Descending order
        });
        const topN = Math.min(items.length, limit);
        const typeLabel = itemType === 'illustration' ? 'Illust' : 'Novel';
        logger_1.logger.info(`Sorted ${items.length} matching ${itemType}s by popularity`);
        for (let i = 0; i < topN; i++) {
            const item = items[i];
            const bookmarks = item.total_bookmarks ?? item.bookmark_count ?? 0;
            const views = item.total_view ?? item.view_count ?? 0;
            logger_1.logger.info(`  Rank ${i + 1}: ${typeLabel} ${item.id} - ${bookmarks} bookmarks, ${views} views`, {
                [`${itemType}Id`]: item.id,
                title: item.title,
                bookmarks,
                views,
            });
        }
    }
    /**
     * Sort items by date (newest first)
     */
    sortByDate(items, ascending = false) {
        items.sort((a, b) => {
            const dateA = a.create_date ? new Date(a.create_date).getTime() : 0;
            const dateB = b.create_date ? new Date(b.create_date).getTime() : 0;
            return ascending ? dateA - dateB : dateB - dateA;
        });
    }
    /**
     * Process items in parallel with concurrency control
     */
    async processInParallel(items, processor, concurrency = 3) {
        const results = [];
        // Process in batches to control concurrency
        for (let i = 0; i < items.length; i += concurrency) {
            const batch = items.slice(i, i + concurrency);
            const batchResults = await Promise.allSettled(batch.map(item => processor(item)));
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push({ success: true, result: result.value });
                }
                else {
                    results.push({ success: false, error: result.reason });
                }
            }
        }
        return results;
    }
    /**
     * Handle download error and determine if should skip
     */
    handleDownloadError(error, itemId, itemType, itemTitle) {
        const errorMessage = (0, errors_1.getErrorMessage)(error);
        const is404 = (0, errors_1.is404Error)(error);
        const shouldSkip = (0, errors_1.isSkipableError)(error);
        if (is404) {
            logger_1.logger.debug(`${itemType === 'illustration' ? 'Illustration' : 'Novel'} ${itemId} not found (deleted or private), skipping`);
            return { shouldSkip: true, is404: true, message: errorMessage };
        }
        else if (shouldSkip) {
            logger_1.logger.warn(`Failed to download ${itemType} ${itemId} (will skip)`, {
                error: errorMessage,
                ...(itemTitle && { [`${itemType}Title`]: itemTitle }),
                [`${itemType}Id`]: itemId,
            });
            return { shouldSkip: true, is404: false, message: errorMessage };
        }
        else {
            // Non-skipable error - log as error
            logger_1.logger.error(`Failed to download ${itemType} ${itemId}`, {
                error: errorMessage,
                ...(itemTitle && { [`${itemType}Title`]: itemTitle }),
                [`${itemType}Id`]: itemId,
            });
            return { shouldSkip: false, is404: false, message: errorMessage };
        }
    }
    /**
     * Filter items based on minBookmarks, startDate, and endDate criteria
     */
    filterItems(items, target, itemType) {
        let filtered = [...items];
        const originalCount = filtered.length;
        // Filter by minimum bookmarks
        if (target.minBookmarks !== undefined) {
            const beforeCount = filtered.length;
            filtered = filtered.filter(item => {
                const bookmarks = item.total_bookmarks ?? item.bookmark_count ?? 0;
                return bookmarks >= target.minBookmarks;
            });
            if (filtered.length < beforeCount) {
                logger_1.logger.info(`Filtered by minBookmarks (>= ${target.minBookmarks}): ${beforeCount} -> ${filtered.length} ${itemType}(s)`);
            }
        }
        // Filter by date range
        if (target.startDate || target.endDate) {
            const beforeCount = filtered.length;
            const startDate = target.startDate ? new Date(target.startDate + 'T00:00:00') : null;
            const endDate = target.endDate ? new Date(target.endDate + 'T23:59:59') : null;
            filtered = filtered.filter(item => {
                if (!item.create_date) {
                    return false; // Skip items without create_date
                }
                const itemDate = new Date(item.create_date);
                if (startDate && itemDate < startDate) {
                    return false;
                }
                if (endDate && itemDate > endDate) {
                    return false;
                }
                return true;
            });
            if (filtered.length < beforeCount) {
                const dateRange = [
                    target.startDate || 'unlimited',
                    target.endDate || 'unlimited'
                ].join(' ~ ');
                logger_1.logger.info(`Filtered by date range (${dateRange}): ${beforeCount} -> ${filtered.length} ${itemType}(s)`);
            }
        }
        if (filtered.length < originalCount) {
            logger_1.logger.info(`Total filtering: ${originalCount} -> ${filtered.length} ${itemType}(s) after applying all filters`);
        }
        return filtered;
    }
    /**
     * Generic download loop for illustrations or novels
     */
    async downloadItems(items, target, itemType, downloadFn) {
        let downloaded = 0;
        let skippedCount = 0;
        const tagForLog = target.filterTag || target.tag || 'unknown';
        const targetLimit = target.limit || (itemType === 'illustration' ? 10 : 10);
        // Apply filters (minBookmarks, startDate, endDate)
        const filteredItems = this.filterItems(items, target, itemType);
        // Update progress: starting download
        this.updateProgress(0, targetLimit, `准备下载 ${itemType === 'illustration' ? '插画' : '小说'}: ${tagForLog}`);
        // Batch check for already downloaded items to optimize database queries
        const itemIds = filteredItems.map(item => String(item.id));
        const downloadedIds = this.database.getDownloadedIds(itemIds, itemType);
        // Random selection mode
        if (target.random && filteredItems.length > 0) {
            // Filter out already downloaded items
            let available = filteredItems.filter(item => !downloadedIds.has(String(item.id)));
            if (available.length === 0) {
                logger_1.logger.info('All search results have already been downloaded');
            }
            else {
                // Try random items until we find one that works or exhaust all options
                const maxAttempts = Math.min(available.length, 50);
                const triedIds = new Set();
                for (let attempt = 0; attempt < maxAttempts && downloaded < targetLimit; attempt++) {
                    // Filter out already tried items
                    const remaining = available.filter(item => !triedIds.has(item.id));
                    if (remaining.length === 0) {
                        logger_1.logger.info(`All available ${itemType}s have been tried`);
                        break;
                    }
                    // Randomly select from remaining items
                    const randomIndex = Math.floor(Math.random() * remaining.length);
                    const randomItem = remaining[randomIndex];
                    triedIds.add(randomItem.id);
                    const typeLabel = itemType === 'illustration' ? 'Illustration' : 'Novel';
                    logger_1.logger.info(`Randomly selected ${typeLabel.toLowerCase()} ${randomItem.id} from ${remaining.length} remaining results (attempt ${attempt + 1}/${maxAttempts})`);
                    try {
                        await downloadFn(randomItem, tagForLog);
                        downloaded++;
                        this.updateProgress(downloaded, targetLimit, `已下载 ${itemType === 'illustration' ? '插画' : '小说'} ${randomItem.id} (${downloaded}/${targetLimit})`);
                        if (itemType === 'novel') {
                            logger_1.logger.info(`Successfully downloaded novel ${randomItem.id} (${downloaded}/${targetLimit})`);
                        }
                        // If we only need one and got it, we're done
                        if (targetLimit === 1) {
                            break;
                        }
                    }
                    catch (error) {
                        skippedCount++;
                        const { shouldSkip } = this.handleDownloadError(error, randomItem.id, itemType, randomItem.title);
                        if (!shouldSkip) {
                            // For non-skip errors, continue trying
                            continue;
                        }
                    }
                }
            }
        }
        else {
            // Sequential download mode
            for (let i = 0; i < filteredItems.length && downloaded < targetLimit; i++) {
                const item = filteredItems[i];
                if (downloadedIds.has(String(item.id))) {
                    logger_1.logger.debug(`${itemType === 'illustration' ? 'Illustration' : 'Novel'} ${item.id} already downloaded, skipping`);
                    continue;
                }
                try {
                    await downloadFn(item, tagForLog);
                    downloaded++;
                    this.updateProgress(downloaded, targetLimit, `已下载 ${itemType === 'illustration' ? '插画' : '小说'} ${item.id} (${downloaded}/${targetLimit})`);
                    if (itemType === 'novel') {
                        logger_1.logger.info(`Successfully downloaded novel ${item.id} (${downloaded}/${targetLimit})`);
                    }
                    // If we only need one and got it, we're done
                    if (targetLimit === 1) {
                        break;
                    }
                }
                catch (error) {
                    skippedCount++;
                    this.handleDownloadError(error, item.id, itemType, item.title);
                    // Continue to next item
                    continue;
                }
            }
        }
        // Update progress: completed
        this.updateProgress(downloaded, targetLimit, `完成下载: ${downloaded} 个 ${itemType === 'illustration' ? '插画' : '小说'}`);
        return { downloaded, skipped: skippedCount };
    }
    async handleIllustrationTarget(target) {
        const mode = target.mode || 'search';
        const displayTag = target.filterTag || target.tag || 'unknown';
        logger_1.logger.info(`Processing illustration ${mode === 'ranking' ? 'ranking' : 'tag'} ${displayTag}`);
        try {
            let illusts = [];
            if (mode === 'ranking') {
                // Get ranking illustrations
                const rankingMode = target.rankingMode || 'day';
                let rankingDate = target.rankingDate || this.getTodayDate();
                // Process YESTERDAY placeholder
                if (rankingDate === 'YESTERDAY') {
                    rankingDate = this.getYesterdayDate();
                }
                // Fetch more illustrations if filtering, to account for deleted/private works
                // Increase fetch limit significantly to get enough matches for sorting
                const fetchLimit = target.filterTag ? Math.max((target.limit || 10) * 10, 100) : target.limit;
                logger_1.logger.info(`Fetching ranking illustrations (mode: ${rankingMode}, date: ${rankingDate})`);
                illusts = await this.client.getRankingIllustrations(rankingMode, rankingDate, fetchLimit);
                // If ranking API returns no results, fallback to search mode with popularity sort
                if (illusts.length === 0) {
                    logger_1.logger.warn(`Ranking API returned 0 results. Falling back to search mode with popularity sort.`);
                    logger_1.logger.info(`Searching for illustrations with tag: ${target.filterTag || target.tag || 'unknown'}, sorted by popularity`);
                    const searchTarget = {
                        ...target,
                        tag: target.filterTag || target.tag,
                        sort: 'popular_desc',
                        limit: target.filterTag ? Math.max((target.limit || 10) * 2, 50) : target.limit,
                    };
                    illusts = await this.client.searchIllustrations(searchTarget);
                    logger_1.logger.info(`Found ${illusts.length} illustration(s) from search mode (sorted by popularity)`);
                }
                // Filter by tag if specified
                if (target.filterTag) {
                    logger_1.logger.info(`Filtering ranking results by tag: ${target.filterTag}`);
                    logger_1.logger.info(`Will collect all matching illustrations, then sort by popularity and select top ${target.limit || 10}`);
                    // Use parallel processing to fetch details with tags
                    const concurrency = this.config.download?.concurrency || 3;
                    logger_1.logger.info(`Processing ${illusts.length} illustrations in parallel (concurrency: ${concurrency})`);
                    const results = await this.processInParallel(illusts, async (illust) => {
                        const { illust: detail, tags } = await this.client.getIllustDetailWithTags(illust.id);
                        return { detail, tags, illustId: illust.id };
                    }, concurrency);
                    const filtered = [];
                    let skippedCount = 0;
                    const filterTagLower = target.filterTag.toLowerCase();
                    for (const result of results) {
                        if (result.success) {
                            const { detail, tags } = result.result;
                            const tagNames = tags.map(t => t.name.toLowerCase());
                            const translatedNames = tags.map(t => t.translated_name?.toLowerCase()).filter(Boolean);
                            if (tagNames.includes(filterTagLower) || translatedNames.includes(filterTagLower)) {
                                filtered.push(detail);
                            }
                        }
                        else {
                            skippedCount++;
                            const errorMessage = result.error.message;
                            if (!errorMessage.includes('404')) {
                                // Try to get illust ID from error if available
                                const illustId = result.error instanceof Error && 'illustId' in result.error
                                    ? result.error.illustId
                                    : 'unknown';
                                logger_1.logger.warn(`Failed to get tags for illust ${illustId}`, { error: errorMessage });
                            }
                        }
                    }
                    if (skippedCount > 0) {
                        logger_1.logger.info(`Skipped ${skippedCount} illustration(s) (deleted, private, or inaccessible)`);
                    }
                    logger_1.logger.info(`Found ${filtered.length} illustration(s) matching tag ${target.filterTag}`);
                    // Sort by popularity and log top results
                    this.sortByPopularityAndLog(filtered, target.limit || 10, 'illustration');
                    // Select top N
                    illusts = filtered.slice(0, target.limit || 10);
                    logger_1.logger.info(`Selected top ${illusts.length} illustration(s) by popularity`);
                }
            }
            else {
                // Search by tag (default mode)
                // Optimize fetch limit for search mode to handle 404s better
                // If using popularity sort, fetch more results to ensure we get enough valid ones
                const targetLimit = target.limit || 10;
                const searchLimit = target.sort === 'popular_desc'
                    ? (targetLimit <= 5 ? Math.max(targetLimit * 20, 100) : targetLimit * 2)
                    : (targetLimit <= 5 ? Math.max(targetLimit * 10, 50) : targetLimit * 2);
                const searchTarget = { ...target, limit: searchLimit };
                if (searchLimit > targetLimit) {
                    logger_1.logger.info(`Fetching up to ${searchLimit} search results to find ${targetLimit} valid illustration(s)`);
                }
                illusts = await this.client.searchIllustrations(searchTarget);
                logger_1.logger.info(`Found ${illusts.length} search results`);
                // If using popularity sort, results are already sorted by API
                // But we can still apply our own sorting for consistency
                if (target.sort === 'popular_desc') {
                    this.sortByPopularityAndLog(illusts, targetLimit, 'illustration');
                }
            }
            const { downloaded, skipped: skippedCount } = await this.downloadItems(illusts, target, 'illustration', (illust, tag) => this.downloadIllustration(illust, tag));
            const targetLimit = target.limit || 10;
            const tagForLog = target.filterTag || target.tag || 'unknown';
            // Check if download actually succeeded
            if (downloaded === 0 && targetLimit > 0) {
                const errorMessage = `Failed to download any illustrations. Requested ${targetLimit}, but all ${skippedCount} attempt(s) failed or were skipped.`;
                this.database.logExecution(tagForLog, 'illustration', 'failed', errorMessage);
                logger_1.logger.error(`Illustration ${mode === 'ranking' ? 'ranking' : 'tag'} ${tagForLog} failed: ${errorMessage}`);
                throw new Error(errorMessage);
            }
            // Warn if downloaded significantly less than requested
            if (downloaded > 0 && downloaded < targetLimit * 0.5 && skippedCount > 0) {
                logger_1.logger.warn(`Only downloaded ${downloaded} out of ${targetLimit} requested illustration(s). ${skippedCount} illustration(s) were skipped due to errors.`);
            }
            if (skippedCount > 0) {
                logger_1.logger.info(`Skipped ${skippedCount} illustration(s) (deleted, private, or inaccessible)`);
            }
            this.database.logExecution(tagForLog, 'illustration', 'success', `${downloaded} items downloaded`);
            logger_1.logger.info(`Illustration ${mode === 'ranking' ? 'ranking' : 'tag'} ${tagForLog} completed`, { downloaded });
        }
        catch (error) {
            // Get detailed error information
            let errorMessage = error instanceof Error ? error.message : String(error);
            // Add more context if it's a NetworkError
            if (error instanceof errors_1.NetworkError && error.cause) {
                const causeMsg = error.cause instanceof Error ? error.cause.message : String(error.cause);
                errorMessage = `${errorMessage} (原因: ${causeMsg})`;
            }
            // Add URL information if available
            if (error instanceof errors_1.NetworkError && error.url) {
                errorMessage = `${errorMessage} [URL: ${error.url}]`;
            }
            this.database.logExecution(displayTag, 'illustration', 'failed', errorMessage);
            logger_1.logger.error(`Illustration ${mode === 'ranking' ? 'ranking' : 'tag'} ${displayTag} failed`, {
                error: errorMessage,
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                stack: error instanceof Error ? error.stack : undefined
            });
            // Re-throw to allow upper level handling
            throw error;
        }
    }
    async handleNovelTarget(target) {
        // Check if this is a single novel download
        if (target.novelId) {
            logger_1.logger.info(`Processing single novel ${target.novelId}`);
            try {
                if (this.database.hasDownloaded(String(target.novelId), 'novel')) {
                    logger_1.logger.info(`Novel ${target.novelId} already downloaded, skipping`);
                    return;
                }
                // Get novel detail first
                const detail = await this.client.getNovelDetail(target.novelId);
                const novel = {
                    id: detail.id,
                    title: detail.title,
                    user: detail.user,
                    create_date: detail.create_date,
                };
                await this.downloadNovel(novel, `novel-${target.novelId}`);
                logger_1.logger.info(`Successfully downloaded novel ${target.novelId}`);
            }
            catch (error) {
                // Get detailed error information
                let errorMessage = error instanceof Error ? error.message : String(error);
                // Add more context if it's a NetworkError
                if (error instanceof errors_1.NetworkError && error.cause) {
                    const causeMsg = error.cause instanceof Error ? error.cause.message : String(error.cause);
                    errorMessage = `${errorMessage} (原因: ${causeMsg})`;
                }
                // Add URL information if available
                if (error instanceof errors_1.NetworkError && error.url) {
                    errorMessage = `${errorMessage} [URL: ${error.url}]`;
                }
                logger_1.logger.error(`Failed to download novel ${target.novelId}`, {
                    error: errorMessage,
                    errorType: error instanceof Error ? error.constructor.name : typeof error,
                    stack: error instanceof Error ? error.stack : undefined
                });
                throw error;
            }
            return;
        }
        // Check if this is a series download
        if (target.seriesId) {
            logger_1.logger.info(`Processing novel series ${target.seriesId}`);
            try {
                const novels = await this.client.getNovelSeries(target.seriesId);
                logger_1.logger.info(`Found ${novels.length} novels in series ${target.seriesId}`);
                let downloaded = 0;
                const targetLimit = target.limit || novels.length; // Default to all novels in series
                for (let i = 0; i < novels.length && downloaded < targetLimit; i++) {
                    const novel = novels[i];
                    if (this.database.hasDownloaded(String(novel.id), 'novel')) {
                        logger_1.logger.debug(`Novel ${novel.id} already downloaded, skipping`);
                        continue;
                    }
                    try {
                        await this.downloadNovel(novel, `series-${target.seriesId}`);
                        downloaded++;
                        logger_1.logger.info(`Successfully downloaded novel ${novel.id} from series (${downloaded}/${Math.min(targetLimit, novels.length)})`);
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        logger_1.logger.warn(`Failed to download novel ${novel.id} from series`, {
                            error: errorMessage,
                            novelTitle: novel.title,
                            novelId: novel.id
                        });
                        // Continue with next novel
                        continue;
                    }
                }
                logger_1.logger.info(`Series download completed: ${downloaded} novel(s) downloaded from series ${target.seriesId}`);
                return;
            }
            catch (error) {
                logger_1.logger.error(`Failed to download novel series ${target.seriesId}`, {
                    error: error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        }
        const mode = target.mode || 'search';
        const displayTag = target.filterTag || target.tag || 'unknown';
        logger_1.logger.info(`Processing novel ${mode === 'ranking' ? 'ranking' : 'tag'} ${displayTag}`);
        try {
            let novels = [];
            if (mode === 'ranking') {
                // Get ranking novels
                const rankingMode = target.rankingMode || 'day';
                let rankingDate = target.rankingDate || this.getTodayDate();
                // Process YESTERDAY placeholder
                if (rankingDate === 'YESTERDAY') {
                    rankingDate = this.getYesterdayDate();
                }
                // Fetch more novels if filtering, to account for deleted/private novels
                // Increase fetch limit significantly when filtering to handle high 404 rates
                const fetchLimit = target.filterTag ? Math.max((target.limit || 10) * 10, 100) : target.limit;
                logger_1.logger.info(`Fetching ranking novels (mode: ${rankingMode}, date: ${rankingDate})`);
                novels = await this.client.getRankingNovels(rankingMode, rankingDate, fetchLimit);
                logger_1.logger.info(`Fetched ${novels.length} novels from ranking API (ordered by Pixiv ranking algorithm)`);
                // If ranking API returns no results, fallback to search mode with popularity sort
                if (novels.length === 0) {
                    logger_1.logger.warn(`Ranking API returned 0 results. Falling back to search mode with popularity sort.`);
                    logger_1.logger.info(`Searching for novels with tag: ${target.filterTag || target.tag || 'unknown'}, sorted by popularity`);
                    const searchTarget = {
                        ...target,
                        tag: target.filterTag || target.tag,
                        sort: 'popular_desc',
                        limit: target.filterTag ? Math.max((target.limit || 10) * 2, 50) : target.limit,
                    };
                    novels = await this.client.searchNovels(searchTarget);
                    logger_1.logger.info(`Found ${novels.length} novel(s) from search mode (sorted by popularity)`);
                }
                // Filter by tag if specified
                if (target.filterTag) {
                    logger_1.logger.info(`Filtering ranking results by tag: ${target.filterTag}`);
                    logger_1.logger.info(`Will collect all matching novels, then sort by popularity and select top ${target.limit || 10}`);
                    // Use parallel processing to fetch details with tags
                    const concurrency = this.config.download?.concurrency || 3;
                    logger_1.logger.info(`Processing ${novels.length} novels in parallel (concurrency: ${concurrency})`);
                    const results = await this.processInParallel(novels, async (novel) => {
                        const { novel: detail, tags } = await this.client.getNovelDetailWithTags(novel.id);
                        return { detail, tags, novelId: novel.id };
                    }, concurrency);
                    const filtered = [];
                    let skippedCount = 0;
                    const filterTagLower = target.filterTag.toLowerCase();
                    for (const result of results) {
                        if (result.success) {
                            const { detail, tags } = result.result;
                            const tagNames = tags.map(t => t.name.toLowerCase());
                            const translatedNames = tags.map(t => t.translated_name?.toLowerCase()).filter(Boolean);
                            if (tagNames.includes(filterTagLower) || translatedNames.includes(filterTagLower)) {
                                filtered.push(detail);
                            }
                        }
                        else {
                            skippedCount++;
                            const errorMessage = result.error.message;
                            if (!errorMessage.includes('404')) {
                                // Try to get novel ID from error if available
                                const novelId = result.error instanceof Error && 'novelId' in result.error
                                    ? result.error.novelId
                                    : 'unknown';
                                logger_1.logger.warn(`Failed to get tags for novel ${novelId}`, { error: errorMessage });
                            }
                        }
                    }
                    if (skippedCount > 0) {
                        logger_1.logger.info(`Skipped ${skippedCount} novel(s) (deleted, private, or inaccessible)`);
                    }
                    logger_1.logger.info(`Found ${filtered.length} novel(s) matching tag ${target.filterTag}`);
                    // Sort by popularity and log top results
                    this.sortByPopularityAndLog(filtered, target.limit || 10, 'novel');
                    // Select top N
                    novels = filtered.slice(0, target.limit || 10);
                    logger_1.logger.info(`Selected top ${novels.length} novel(s) by popularity`);
                    if (novels.length === 0 && filtered.length === 0) {
                        logger_1.logger.warn(`No novels found matching tag "${target.filterTag}" after checking ranking results. This could mean:`);
                        logger_1.logger.warn(`  1. The tag "${target.filterTag}" is not present in the ranking results`);
                        logger_1.logger.warn(`  2. All matching novels were deleted or made private`);
                        logger_1.logger.warn(`  3. Try using search mode instead of ranking mode for better results`);
                    }
                }
            }
            else {
                // Search by tag (default mode)
                // Optimize fetch limit for search mode to handle 404s better
                // If using popularity sort, fetch more results to ensure we get enough valid ones
                const targetLimit = target.limit || 10;
                const searchLimit = target.sort === 'popular_desc'
                    ? (targetLimit <= 5 ? Math.max(targetLimit * 20, 100) : targetLimit * 2)
                    : (targetLimit <= 5 ? Math.max(targetLimit * 10, 50) : targetLimit * 2);
                const searchTarget = { ...target, limit: searchLimit };
                if (searchLimit > targetLimit) {
                    logger_1.logger.info(`Fetching up to ${searchLimit} search results to find ${targetLimit} valid novel(s)`);
                }
                novels = await this.client.searchNovels(searchTarget);
                logger_1.logger.info(`Found ${novels.length} search results`);
                // If using popularity sort, results are already sorted by API
                // But we can still apply our own sorting for consistency
                if (target.sort === 'popular_desc') {
                    this.sortByPopularityAndLog(novels, targetLimit, 'novel');
                }
            }
            const targetLimit = target.limit || 10;
            const { downloaded, skipped: skippedCount } = await this.downloadItems(novels, target, 'novel', (novel, tag) => this.downloadNovel(novel, tag));
            const tagForLog = target.filterTag || target.tag || 'unknown';
            // Check if download actually succeeded
            if (downloaded === 0 && targetLimit > 0) {
                const errorMessage = `Failed to download any novels. Requested ${targetLimit}, but all ${skippedCount} attempt(s) failed or were skipped.`;
                this.database.logExecution(tagForLog, 'novel', 'failed', errorMessage);
                logger_1.logger.error(`Novel ${mode === 'ranking' ? 'ranking' : 'tag'} ${tagForLog} failed: ${errorMessage}`);
                throw new Error(errorMessage);
            }
            // Warn if downloaded significantly less than requested
            if (downloaded > 0 && downloaded < targetLimit * 0.5 && skippedCount > 0) {
                logger_1.logger.warn(`Only downloaded ${downloaded} out of ${targetLimit} requested novel(s). ${skippedCount} novel(s) were skipped due to 404 errors or other issues.`);
            }
            if (skippedCount > 0) {
                logger_1.logger.info(`Skipped ${skippedCount} novel(s) (deleted, private, or inaccessible)`);
            }
            this.database.logExecution(tagForLog, 'novel', 'success', `${downloaded} items downloaded`);
            logger_1.logger.info(`Novel ${mode === 'ranking' ? 'ranking' : 'tag'} ${tagForLog} completed`, { downloaded });
        }
        catch (error) {
            // Get detailed error information
            let errorMessage = error instanceof Error ? error.message : String(error);
            // Add more context if it's a NetworkError
            if (error instanceof errors_1.NetworkError && error.cause) {
                const causeMsg = error.cause instanceof Error ? error.cause.message : String(error.cause);
                errorMessage = `${errorMessage} (原因: ${causeMsg})`;
            }
            // Add URL information if available
            if (error instanceof errors_1.NetworkError && error.url) {
                errorMessage = `${errorMessage} [URL: ${error.url}]`;
            }
            this.database.logExecution(displayTag, 'novel', 'failed', errorMessage);
            logger_1.logger.error(`Novel ${mode === 'ranking' ? 'ranking' : 'tag'} ${displayTag} failed`, {
                error: errorMessage,
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                stack: error instanceof Error ? error.stack : undefined
            });
            // Re-throw to allow upper level handling
            throw error;
        }
    }
    /**
     * Format date in YYYY-MM-DD format (Japan timezone)
     * Pixiv rankings are based on Japan time (JST, UTC+9)
     */
    formatDateInJST(date) {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const parts = formatter.formatToParts(date);
        const year = parts.find(p => p.type === 'year').value;
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        return `${year}-${month}-${day}`;
    }
    /**
     * Get today's date in YYYY-MM-DD format (Japan timezone)
     * Pixiv rankings are based on Japan time (JST, UTC+9)
     */
    getTodayDate() {
        return this.formatDateInJST(new Date());
    }
    /**
     * Get yesterday's date in YYYY-MM-DD format (Japan timezone)
     * Pixiv rankings are based on Japan time (JST, UTC+9)
     */
    getYesterdayDate() {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        // Get current date components in JST
        const todayParts = formatter.formatToParts(now);
        const year = parseInt(todayParts.find(p => p.type === 'year').value, 10);
        const month = parseInt(todayParts.find(p => p.type === 'month').value, 10) - 1; // 0-indexed
        const day = parseInt(todayParts.find(p => p.type === 'day').value, 10);
        // Create a date object in JST and subtract one day
        // We create a date at noon JST to avoid timezone edge cases
        const jstNoon = new Date(Date.UTC(year, month, day, 3, 0, 0, 0)); // 12:00 JST = 03:00 UTC
        jstNoon.setUTCDate(jstNoon.getUTCDate() - 1);
        return this.formatDateInJST(jstNoon);
    }
    async downloadIllustration(illust, tag) {
        const detail = await this.client.getIllustDetail(illust.id);
        const pages = this.getIllustrationPages(detail);
        // Use parallel download for multiple pages to improve performance
        const concurrency = this.config.download?.concurrency || 3;
        const downloadConcurrency = Math.min(concurrency, pages.length);
        if (pages.length > 1) {
            logger_1.logger.debug(`Downloading ${pages.length} pages for illustration ${detail.id} in parallel (concurrency: ${downloadConcurrency})`);
        }
        const downloadResults = await this.processInParallel(pages.map((page, index) => ({ page, index })), async ({ page, index }) => {
            const originalUrl = this.resolveImageUrl(page, detail);
            if (!originalUrl) {
                throw new Error(`Original image url missing for page ${index + 1}`);
            }
            const extension = this.extractExtension(originalUrl) ?? '.jpg';
            const fileName = this.fileService.sanitizeFileName(`${detail.id}_${detail.title}_${index + 1}${extension}`);
            const metadata = {
                author: detail.user?.name,
                tag: tag,
                date: detail.create_date ? new Date(detail.create_date) : new Date(),
            };
            const buffer = await this.client.downloadImage(originalUrl);
            const filePath = await this.fileService.saveImage(buffer, fileName, metadata);
            return { filePath, index: index + 1 };
        }, downloadConcurrency);
        // Insert download records and log results
        let successCount = 0;
        for (const result of downloadResults) {
            if (result.success) {
                this.database.insertDownload({
                    pixivId: String(detail.id),
                    type: 'illustration',
                    tag,
                    title: detail.title,
                    filePath: result.result.filePath,
                    author: detail.user?.name,
                    userId: detail.user?.id,
                });
                logger_1.logger.info(`Saved illustration ${detail.id} page ${result.result.index}`, {
                    filePath: result.result.filePath
                });
                successCount++;
            }
            else {
                logger_1.logger.warn(`Failed to download page ${result.error.message}`, {
                    illustId: detail.id,
                    error: result.error.message
                });
            }
        }
        if (successCount === 0) {
            throw new Error(`Failed to download any pages for illustration ${detail.id}`);
        }
    }
    async downloadNovel(novel, tag) {
        // First verify the novel exists and get updated details
        const detail = await this.client.getNovelDetail(novel.id);
        // Then get the novel text
        const text = await this.client.getNovelText(novel.id);
        const header = [
            `Title: ${detail.title}`,
            `Author: ${detail.user?.name ?? 'Unknown'}`,
            `Author ID: ${detail.user?.id ?? 'Unknown'}`,
            `Tag: ${tag}`,
            `Created: ${new Date(detail.create_date).toISOString()}`,
            '',
            '---',
            '',
        ].join('\n');
        const content = `${header}\n${text}`;
        const fileName = this.fileService.sanitizeFileName(`${detail.id}_${detail.title}.txt`);
        const metadata = {
            author: detail.user?.name,
            tag: tag,
            date: detail.create_date ? new Date(detail.create_date) : new Date(),
        };
        const filePath = await this.fileService.saveText(content, fileName, metadata);
        this.database.insertDownload({
            pixivId: String(detail.id),
            type: 'novel',
            tag,
            title: detail.title,
            filePath,
            author: detail.user?.name,
            userId: detail.user?.id,
        });
        logger_1.logger.info(`Saved novel ${detail.id}`, { filePath });
    }
    getIllustrationPages(detail) {
        if (detail.meta_pages && detail.meta_pages.length > 0) {
            return detail.meta_pages;
        }
        return [
            {
                image_urls: {
                    square_medium: detail.image_urls.square_medium,
                    medium: detail.image_urls.medium,
                    large: detail.image_urls.large,
                    original: detail.meta_single_page?.original_image_url,
                },
                meta_single_page: detail.meta_single_page,
            },
        ];
    }
    resolveImageUrl(page, detail) {
        if (page.meta_single_page?.original_image_url) {
            return page.meta_single_page.original_image_url;
        }
        const imageUrls = page.image_urls;
        if (imageUrls.original) {
            return imageUrls.original;
        }
        if (detail.meta_single_page?.original_image_url) {
            return detail.meta_single_page.original_image_url;
        }
        return imageUrls.large ?? imageUrls.medium;
    }
    extractExtension(url) {
        const path = new URL(url).pathname;
        const index = path.lastIndexOf('.');
        if (index === -1) {
            return null;
        }
        return path.slice(index);
    }
}
exports.DownloadManager = DownloadManager;
//# sourceMappingURL=DownloadManager.js.map