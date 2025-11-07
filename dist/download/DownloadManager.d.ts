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
    private handleIllustrationTarget;
    private handleNovelTarget;
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