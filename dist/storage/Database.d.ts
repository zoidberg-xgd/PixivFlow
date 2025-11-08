export interface AccessTokenStore {
    accessToken: string;
    expiresAt: number;
    refreshToken?: string;
    tokenType: string;
}
export interface DownloadRecordInput {
    pixivId: string;
    type: 'illustration' | 'novel';
    tag: string;
    title: string;
    filePath: string;
    userId?: string;
    author?: string;
}
export type ExecutionStatus = 'success' | 'partial' | 'failed';
export interface SchedulerExecutionRecord {
    id: number;
    executionNumber: number;
    status: 'success' | 'failed' | 'timeout' | 'skipped';
    startTime: string;
    endTime: string | null;
    duration: number | null;
    errorMessage: string | null;
    itemsDownloaded: number;
}
export declare class Database {
    private readonly databasePath;
    private db;
    constructor(databasePath: string);
    migrate(): void;
    getToken(key: string): AccessTokenStore | null;
    setToken(key: string, value: AccessTokenStore): void;
    hasDownloaded(pixivId: string, type: 'illustration' | 'novel'): boolean;
    /**
     * Batch check if multiple items are already downloaded
     * Returns a Set of pixivIds that are already downloaded
     * Optimized for large batches by chunking queries
     */
    getDownloadedIds(pixivIds: string[], type: 'illustration' | 'novel'): Set<string>;
    insertDownload(record: DownloadRecordInput): void;
    logExecution(tag: string, type: 'illustration' | 'novel', status: ExecutionStatus, message?: string): void;
    /**
     * Get the next execution number for the scheduler
     */
    getNextExecutionNumber(): number;
    /**
     * Log a scheduler execution
     */
    logSchedulerExecution(executionNumber: number, status: 'success' | 'failed' | 'timeout' | 'skipped', startTime: Date, endTime: Date | null, durationMs: number | null, errorMessage: string | null, itemsDownloaded?: number): void;
    /**
     * Get scheduler execution statistics
     */
    getSchedulerStats(): {
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        lastExecutionTime: string | null;
        averageDuration: number | null;
        totalItemsDownloaded: number;
    };
    /**
     * Get recent scheduler executions
     */
    getRecentSchedulerExecutions(limit?: number): SchedulerExecutionRecord[];
    /**
     * Get consecutive failure count
     */
    getConsecutiveFailures(): number;
    close(): void;
}
//# sourceMappingURL=Database.d.ts.map