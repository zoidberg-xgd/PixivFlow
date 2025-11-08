import { StandaloneConfig } from '../config';
import { PixivClient } from '../pixiv/PixivClient';
import { Database } from '../storage/Database';
import { FileService } from './FileService';
export declare class DownloadManager {
    private readonly config;
    private readonly client;
    private readonly database;
    private readonly fileService;
    private progressCallback?;
    constructor(config: StandaloneConfig, client: PixivClient, database: Database, fileService: FileService);
    /**
     * Set progress callback
     */
    setProgressCallback(callback: (current: number, total: number, message?: string) => void): void;
    initialise(): Promise<void>;
    runAllTargets(): Promise<void>;
    /**
     * Update progress
     */
    private updateProgress;
    /**
     * Calculate popularity score for an illustration or novel
     * Uses total_bookmarks (preferred) or bookmark_count as primary metric
     */
    private getPopularityScore;
    /**
     * Sort items by popularity and log top results
     */
    private sortByPopularityAndLog;
    /**
     * Sort items by date (newest first)
     */
    private sortByDate;
    /**
     * Process items in parallel with intelligent concurrency control
     * Features:
     * - Queue-based processing (maintains stable concurrency)
     * - Request delay between API calls (rate limiting protection)
     * - Dynamic concurrency adjustment (reduces on rate limit errors)
     */
    private processInParallel;
    /**
     * Handle download error and determine if should skip
     */
    private handleDownloadError;
    /**
     * Filter items based on minBookmarks, startDate, and endDate criteria
     */
    private filterItems;
    /**
     * Generic download loop for illustrations or novels
     */
    private downloadItems;
    private handleIllustrationTarget;
    private handleNovelTarget;
    /**
     * Format date in YYYY-MM-DD format (Japan timezone)
     * Pixiv rankings are based on Japan time (JST, UTC+9)
     */
    private formatDateInJST;
    /**
     * Get today's date in YYYY-MM-DD format (Japan timezone)
     * Pixiv rankings are based on Japan time (JST, UTC+9)
     */
    private getTodayDate;
    /**
     * Get yesterday's date in YYYY-MM-DD format (Japan timezone)
     * Pixiv rankings are based on Japan time (JST, UTC+9)
     */
    private getYesterdayDate;
    /**
     * Get this week's Monday date in YYYY-MM-DD format (Japan timezone)
     * Pixiv rankings are based on Japan time (JST, UTC+9)
     */
    private getThisWeekMonday;
    /**
     * Get last week's Monday date in YYYY-MM-DD format (Japan timezone)
     * Pixiv rankings are based on Japan time (JST, UTC+9)
     */
    private getLastWeekMonday;
    /**
     * Get ranking illustrations with automatic fallback for week mode
     * If week ranking fails, automatically tries:
     * 1. This week's ranking (without date or with this week's date)
     * 2. Day ranking with last week's Monday date
     */
    private getRankingIllustrationsWithFallback;
    /**
     * Get ranking novels with automatic fallback for week mode
     * If week ranking API throws an error, automatically tries:
     * 1. This week's ranking (without date or with this week's date)
     * 2. Day ranking with last week's Monday date
     */
    private getRankingNovelsWithFallback;
    /**
     * Check if illustration files already exist in the file system
     * Returns array of existing file paths, or empty array if none found
     */
    private findExistingIllustrationFiles;
    private downloadIllustration;
    private downloadNovel;
    private getIllustrationPages;
    private resolveImageUrl;
    private extractExtension;
}
//# sourceMappingURL=DownloadManager.d.ts.map