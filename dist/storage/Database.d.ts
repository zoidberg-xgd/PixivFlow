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
export declare class Database {
    private readonly databasePath;
    private db;
    constructor(databasePath: string);
    migrate(): void;
    getToken(key: string): AccessTokenStore | null;
    setToken(key: string, value: AccessTokenStore): void;
    hasDownloaded(pixivId: string, type: 'illustration' | 'novel'): boolean;
    insertDownload(record: DownloadRecordInput): void;
    logExecution(tag: string, type: 'illustration' | 'novel', status: ExecutionStatus, message?: string): void;
    close(): void;
}
//# sourceMappingURL=Database.d.ts.map