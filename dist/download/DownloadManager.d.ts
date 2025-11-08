import { StandaloneConfig } from '../config';
import { PixivClient } from '../pixiv/PixivClient';
import { Database } from '../storage/Database';
import { FileService } from './FileService';
export declare class DownloadManager {
    private readonly config;
    private readonly client;
    private readonly database;
    private readonly fileService;
    constructor(config: StandaloneConfig, client: PixivClient, database: Database, fileService: FileService);
    initialise(): Promise<void>;
    runAllTargets(): Promise<void>;
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
     * Process items in parallel with concurrency control
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
    private downloadIllustration;
    private downloadNovel;
    private getIllustrationPages;
    private resolveImageUrl;
    private extractExtension;
}
//# sourceMappingURL=DownloadManager.d.ts.map