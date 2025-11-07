export type TargetType = 'illustration' | 'novel';
export interface TargetConfig {
    type: TargetType;
    tag: string;
    /**
     * Maximum works to download per execution for this tag.
     */
    limit?: number;
    /**
     * Search target parameter for Pixiv API.
     */
    searchTarget?: 'partial_match_for_tags' | 'exact_match_for_tags' | 'title_and_caption';
    restrict?: 'public' | 'private';
}
export interface PixivCredentialConfig {
    clientId: string;
    clientSecret: string;
    deviceToken: string;
    refreshToken: string;
    userAgent: string;
}
export interface NetworkConfig {
    timeoutMs: number;
    retries: number;
}
export interface StorageConfig {
    databasePath: string;
    downloadDirectory: string;
    illustrationDirectory?: string;
    novelDirectory?: string;
}
export interface SchedulerConfig {
    enabled: boolean;
    cron: string;
    timezone?: string;
}
export interface StandaloneConfig {
    pixiv: PixivCredentialConfig;
    network: NetworkConfig;
    storage: StorageConfig;
    scheduler: SchedulerConfig;
    targets: TargetConfig[];
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
export declare function loadConfig(configPath?: string): StandaloneConfig;
//# sourceMappingURL=config.d.ts.map