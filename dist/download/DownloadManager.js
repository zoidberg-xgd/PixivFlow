"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadManager = void 0;
const logger_1 = require("../logger");
class DownloadManager {
    config;
    client;
    database;
    fileService;
    constructor(config, client, database, fileService) {
        this.config = config;
        this.client = client;
        this.database = database;
        this.fileService = fileService;
    }
    async initialise() {
        await this.fileService.initialise();
    }
    async runAllTargets() {
        for (const target of this.config.targets) {
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
                const fetchLimit = target.filterTag ? Math.max((target.limit || 10) * 5, 50) : target.limit;
                logger_1.logger.info(`Fetching ranking illustrations (mode: ${rankingMode}, date: ${rankingDate})`);
                illusts = await this.client.getRankingIllustrations(rankingMode, rankingDate, fetchLimit);
                // Filter by tag if specified
                if (target.filterTag) {
                    logger_1.logger.info(`Filtering ranking results by tag: ${target.filterTag}`);
                    const filtered = [];
                    let skippedCount = 0;
                    for (const illust of illusts) {
                        if (filtered.length >= (target.limit || 10)) {
                            break;
                        }
                        // Get detail with tags
                        try {
                            const { illust: detail, tags } = await this.client.getIllustDetailWithTags(illust.id);
                            const tagNames = tags.map(t => t.name.toLowerCase());
                            const translatedNames = tags.map(t => t.translated_name?.toLowerCase()).filter(Boolean);
                            const filterTagLower = target.filterTag.toLowerCase();
                            if (tagNames.includes(filterTagLower) || translatedNames.includes(filterTagLower)) {
                                filtered.push(detail);
                            }
                        }
                        catch (error) {
                            // Skip illustrations that are deleted, private, or inaccessible
                            skippedCount++;
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            if (errorMessage.includes('404')) {
                                // Silently skip deleted illustrations
                            }
                            else {
                                logger_1.logger.warn(`Failed to get tags for illust ${illust.id}`, { error: errorMessage });
                            }
                        }
                    }
                    if (skippedCount > 0) {
                        logger_1.logger.info(`Skipped ${skippedCount} illustration(s) (deleted, private, or inaccessible)`);
                    }
                    illusts = filtered;
                }
            }
            else {
                // Search by tag (default mode)
                illusts = await this.client.searchIllustrations(target);
            }
            let downloaded = 0;
            let skippedCount = 0;
            const tagForLog = target.filterTag || target.tag || 'unknown';
            // Random selection mode
            if (target.random && illusts.length > 0) {
                // Filter out already downloaded items
                let available = illusts.filter(illust => !this.database.hasDownloaded(String(illust.id), 'illustration'));
                if (available.length === 0) {
                    logger_1.logger.info('All search results have already been downloaded');
                }
                else {
                    // Try random illustrations until we find one that works or exhaust all options
                    const maxAttempts = Math.min(available.length, 50); // Limit attempts to avoid infinite loops
                    const triedIds = new Set();
                    for (let attempt = 0; attempt < maxAttempts && downloaded < (target.limit || 1); attempt++) {
                        // Filter out already tried illustrations
                        const remaining = available.filter(illust => !triedIds.has(illust.id));
                        if (remaining.length === 0) {
                            logger_1.logger.info('All available illustrations have been tried');
                            break;
                        }
                        // Randomly select from remaining illustrations
                        const randomIndex = Math.floor(Math.random() * remaining.length);
                        const randomIllust = remaining[randomIndex];
                        triedIds.add(randomIllust.id);
                        logger_1.logger.info(`Randomly selected illustration ${randomIllust.id} from ${remaining.length} remaining results (attempt ${attempt + 1}/${maxAttempts})`);
                        try {
                            await this.downloadIllustration(randomIllust, tagForLog);
                            downloaded++;
                            // If we only need one and got it, we're done
                            if ((target.limit || 1) === 1) {
                                break;
                            }
                        }
                        catch (error) {
                            // Skip illustrations that are deleted, private, or inaccessible
                            skippedCount++;
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            if (errorMessage.includes('404')) {
                                logger_1.logger.debug(`Illustration ${randomIllust.id} not found (deleted or private), trying another random illustration...`);
                                // Continue to next random selection
                                continue;
                            }
                            else {
                                logger_1.logger.warn(`Failed to download illustration ${randomIllust.id}`, { error: errorMessage });
                                // For non-404 errors, continue trying (might be temporary issues)
                                continue;
                            }
                        }
                    }
                }
            }
            else {
                for (const illust of illusts) {
                    if (this.database.hasDownloaded(String(illust.id), 'illustration')) {
                        logger_1.logger.debug(`Illustration ${illust.id} already downloaded, skipping`);
                        continue;
                    }
                    try {
                        await this.downloadIllustration(illust, tagForLog);
                        downloaded++;
                    }
                    catch (error) {
                        // Skip illustrations that are deleted, private, or inaccessible
                        skippedCount++;
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        if (errorMessage.includes('404')) {
                            logger_1.logger.debug(`Illustration ${illust.id} not found (deleted or private), skipping`);
                        }
                        else {
                            logger_1.logger.warn(`Failed to download illustration ${illust.id}`, { error: errorMessage });
                        }
                    }
                }
            }
            if (skippedCount > 0) {
                logger_1.logger.info(`Skipped ${skippedCount} illustration(s) (deleted, private, or inaccessible)`);
            }
            this.database.logExecution(tagForLog, 'illustration', 'success', `${downloaded} items downloaded`);
            logger_1.logger.info(`Illustration ${mode === 'ranking' ? 'ranking' : 'tag'} ${tagForLog} completed`, { downloaded });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.database.logExecution(displayTag, 'illustration', 'failed', message);
            logger_1.logger.error(`Illustration ${mode === 'ranking' ? 'ranking' : 'tag'} ${displayTag} failed`, { error: message });
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
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger_1.logger.error(`Failed to download novel ${target.novelId}`, {
                    error: errorMessage,
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
                const fetchLimit = target.filterTag ? Math.max((target.limit || 10) * 5, 50) : target.limit;
                logger_1.logger.info(`Fetching ranking novels (mode: ${rankingMode}, date: ${rankingDate})`);
                novels = await this.client.getRankingNovels(rankingMode, rankingDate, fetchLimit);
                // Filter by tag if specified
                if (target.filterTag) {
                    logger_1.logger.info(`Filtering ranking results by tag: ${target.filterTag}`);
                    const filtered = [];
                    let skippedCount = 0;
                    for (const novel of novels) {
                        if (filtered.length >= (target.limit || 10)) {
                            break;
                        }
                        // Get detail with tags
                        try {
                            const { novel: detail, tags } = await this.client.getNovelDetailWithTags(novel.id);
                            const tagNames = tags.map(t => t.name.toLowerCase());
                            const translatedNames = tags.map(t => t.translated_name?.toLowerCase()).filter(Boolean);
                            const filterTagLower = target.filterTag.toLowerCase();
                            if (tagNames.includes(filterTagLower) || translatedNames.includes(filterTagLower)) {
                                filtered.push(detail);
                            }
                        }
                        catch (error) {
                            // Skip novels that are deleted, private, or inaccessible
                            skippedCount++;
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            if (errorMessage.includes('404')) {
                                // Silently skip deleted novels
                            }
                            else {
                                logger_1.logger.warn(`Failed to get tags for novel ${novel.id}`, { error: errorMessage });
                            }
                        }
                    }
                    if (skippedCount > 0) {
                        logger_1.logger.info(`Skipped ${skippedCount} novel(s) (deleted, private, or inaccessible)`);
                    }
                    novels = filtered;
                }
            }
            else {
                // Search by tag (default mode)
                // For search mode, fetch more results upfront to handle 404s
                // If limit is small (especially 1), fetch many more to ensure we can find valid novels
                const targetLimit = target.limit || 10;
                const searchLimit = targetLimit <= 5 ? Math.max(targetLimit * 20, 100) : targetLimit * 2;
                const searchTarget = { ...target, limit: searchLimit };
                logger_1.logger.info(`Fetching up to ${searchLimit} search results to find ${targetLimit} valid novel(s)`);
                novels = await this.client.searchNovels(searchTarget);
                logger_1.logger.info(`Found ${novels.length} search results`);
            }
            let downloaded = 0;
            let skippedCount = 0;
            const tagForLog = target.filterTag || target.tag || 'unknown';
            const targetLimit = target.limit || 10;
            // Random selection mode
            if (target.random && novels.length > 0) {
                // Filter out already downloaded items
                let available = novels.filter(novel => !this.database.hasDownloaded(String(novel.id), 'novel'));
                if (available.length === 0) {
                    logger_1.logger.info('All search results have already been downloaded');
                }
                else {
                    // Try random novels until we find one that works or exhaust all options
                    const maxAttempts = Math.min(available.length, 50); // Limit attempts to avoid infinite loops
                    const triedIds = new Set();
                    for (let attempt = 0; attempt < maxAttempts && downloaded < targetLimit; attempt++) {
                        // Filter out already tried novels
                        const remaining = available.filter(novel => !triedIds.has(novel.id));
                        if (remaining.length === 0) {
                            logger_1.logger.info('All available novels have been tried');
                            break;
                        }
                        // Randomly select from remaining novels
                        const randomIndex = Math.floor(Math.random() * remaining.length);
                        const randomNovel = remaining[randomIndex];
                        triedIds.add(randomNovel.id);
                        logger_1.logger.info(`Randomly selected novel ${randomNovel.id} from ${remaining.length} remaining results (attempt ${attempt + 1}/${maxAttempts})`);
                        try {
                            await this.downloadNovel(randomNovel, tagForLog);
                            downloaded++;
                            logger_1.logger.info(`Successfully downloaded novel ${randomNovel.id} (${downloaded}/${targetLimit})`);
                            // If we only need one and got it, we're done
                            if (targetLimit === 1) {
                                break;
                            }
                        }
                        catch (error) {
                            // Skip novels that are deleted, private, or inaccessible
                            skippedCount++;
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            if (errorMessage.includes('404')) {
                                logger_1.logger.debug(`Novel ${randomNovel.id} not found (deleted or private), trying another random novel...`);
                                // Continue to next random selection
                                continue;
                            }
                            else {
                                logger_1.logger.warn(`Failed to download novel ${randomNovel.id}`, {
                                    error: errorMessage,
                                    novelTitle: randomNovel.title,
                                    novelId: randomNovel.id
                                });
                                // For non-404 errors, continue trying (might be temporary issues)
                                continue;
                            }
                        }
                    }
                }
            }
            else {
                // Smart retry logic: try each novel in order, skip 404s and continue
                for (let i = 0; i < novels.length && downloaded < targetLimit; i++) {
                    const novel = novels[i];
                    if (this.database.hasDownloaded(String(novel.id), 'novel')) {
                        logger_1.logger.debug(`Novel ${novel.id} already downloaded, skipping`);
                        continue;
                    }
                    try {
                        await this.downloadNovel(novel, tagForLog);
                        downloaded++;
                        logger_1.logger.info(`Successfully downloaded novel ${novel.id} (${downloaded}/${targetLimit})`);
                        // If we only need one and got it, we're done
                        if (targetLimit === 1) {
                            break;
                        }
                    }
                    catch (error) {
                        // Skip novels that are deleted, private, or inaccessible
                        skippedCount++;
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        if (errorMessage.includes('404')) {
                            logger_1.logger.debug(`Novel ${novel.id} not found (deleted or private), trying next result...`);
                            // Continue to next novel
                            continue;
                        }
                        else {
                            logger_1.logger.warn(`Failed to download novel ${novel.id}`, {
                                error: errorMessage,
                                novelTitle: novel.title,
                                novelId: novel.id
                            });
                            // For non-404 errors, continue trying (might be temporary issues)
                            continue;
                        }
                    }
                }
            }
            if (downloaded < targetLimit && skippedCount > 0) {
                logger_1.logger.warn(`Only downloaded ${downloaded} out of ${targetLimit} requested novel(s). ${skippedCount} novel(s) were skipped due to 404 errors or other issues.`);
            }
            if (skippedCount > 0) {
                logger_1.logger.info(`Skipped ${skippedCount} novel(s) (deleted, private, or inaccessible)`);
            }
            this.database.logExecution(tagForLog, 'novel', 'success', `${downloaded} items downloaded`);
            logger_1.logger.info(`Novel ${mode === 'ranking' ? 'ranking' : 'tag'} ${tagForLog} completed`, { downloaded });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.database.logExecution(displayTag, 'novel', 'failed', message);
            logger_1.logger.error(`Novel ${mode === 'ranking' ? 'ranking' : 'tag'} ${displayTag} failed`, { error: message });
        }
    }
    /**
     * Get today's date in YYYY-MM-DD format (Japan timezone)
     * Pixiv rankings are based on Japan time (JST, UTC+9)
     */
    getTodayDate() {
        // Get current time in Japan timezone (JST = UTC+9)
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const parts = formatter.formatToParts(now);
        const year = parts.find(p => p.type === 'year').value;
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        return `${year}-${month}-${day}`;
    }
    /**
     * Get yesterday's date in YYYY-MM-DD format (Japan timezone)
     * Pixiv rankings are based on Japan time (JST, UTC+9)
     */
    getYesterdayDate() {
        // Get current time in Japan timezone (JST = UTC+9)
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
        // Format the yesterday date
        const yesterdayParts = formatter.formatToParts(jstNoon);
        const yesterdayYear = yesterdayParts.find(p => p.type === 'year').value;
        const yesterdayMonth = yesterdayParts.find(p => p.type === 'month').value;
        const yesterdayDay = yesterdayParts.find(p => p.type === 'day').value;
        return `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;
    }
    async downloadIllustration(illust, tag) {
        const detail = await this.client.getIllustDetail(illust.id);
        const pages = this.getIllustrationPages(detail);
        for (let index = 0; index < pages.length; index++) {
            const page = pages[index];
            const originalUrl = this.resolveImageUrl(page, detail);
            if (!originalUrl) {
                logger_1.logger.warn('Original image url missing', { illustId: detail.id, index });
                continue;
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
            this.database.insertDownload({
                pixivId: String(detail.id),
                type: 'illustration',
                tag,
                title: detail.title,
                filePath,
                author: detail.user?.name,
                userId: detail.user?.id,
            });
            logger_1.logger.info(`Saved illustration ${detail.id} page ${index + 1}`, { filePath });
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