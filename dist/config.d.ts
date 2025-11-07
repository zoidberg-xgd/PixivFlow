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
    /**
     * Download mode: 'search' (default) or 'ranking'
     * - 'search': Search by tag
     * - 'ranking': Download from ranking, then filter by tag
     */
    mode?: 'search' | 'ranking';
    /**
     * Ranking mode (only used when mode='ranking')
     * - 'day': Daily ranking
     * - 'week': Weekly ranking
     * - 'month': Monthly ranking
     * - 'day_male', 'day_female', 'day_ai': Daily ranking by category
     */
    rankingMode?: 'day' | 'week' | 'month' | 'day_male' | 'day_female' | 'day_ai' | 'week_original' | 'week_rookie' | 'day_r18' | 'day_male_r18' | 'day_female_r18';
    /**
     * Date for ranking (YYYY-MM-DD format, e.g., '2024-01-15')
     * If not specified, uses today's date
     */
    rankingDate?: string;
    /**
     * Filter ranking results by tag (only used when mode='ranking')
     * If specified, only downloads works that contain this tag
     */
    filterTag?: string;
    /**
     * Random selection mode
     * If true, randomly selects from search results instead of downloading in order
     * When enabled, limit specifies how many results to fetch, then randomly selects one to download
     */
    random?: boolean;
}
export interface PixivCredentialConfig {
    clientId: string;
    clientSecret: string;
    deviceToken: string;
    refreshToken: string;
    userAgent: string;
}
export interface NetworkConfig {
    /**
     * Request timeout in milliseconds
     * Default: 30000 (30 seconds)
     */
    timeoutMs?: number;
    /**
     * Number of retries for failed requests
     * Default: 3
     */
    retries?: number;
    /**
     * Delay between retries in milliseconds
     * Default: 1000 (1 second)
     */
    retryDelay?: number;
    /**
     * Proxy configuration
     */
    proxy?: {
        enabled: boolean;
        host: string;
        port: number;
        protocol?: 'http' | 'https' | 'socks4' | 'socks5';
        username?: string;
        password?: string;
    };
}
export interface StorageConfig {
    /**
     * Path to SQLite database file
     * Default: ./data/pixiv-downloader.db
     */
    databasePath?: string;
    /**
     * Root directory for downloads
     * Default: ./downloads
     */
    downloadDirectory?: string;
    /**
     * Directory for illustrations (relative to downloadDirectory or absolute)
     * Default: {downloadDirectory}/illustrations
     */
    illustrationDirectory?: string;
    /**
     * Directory for novels (relative to downloadDirectory or absolute)
     * Default: {downloadDirectory}/novels
     */
    novelDirectory?: string;
}
export interface SchedulerConfig {
    enabled: boolean;
    cron: string;
    timezone?: string;
    /**
     * Maximum number of times the scheduler will execute.
     * If set, scheduler will stop after reaching this count.
     * undefined means unlimited executions.
     */
    maxExecutions?: number;
    /**
     * Minimum interval between executions (in milliseconds).
     * If a job is triggered too soon after the previous one, it will be skipped.
     * Default: 0 (no minimum interval)
     */
    minInterval?: number;
    /**
     * Maximum execution time for a single job (in milliseconds).
     * If a job exceeds this time, it will be terminated.
     * undefined means no timeout.
     */
    timeout?: number;
    /**
     * Maximum consecutive failures before stopping the scheduler.
     * If set, scheduler will stop after this many consecutive failures.
     * undefined means unlimited failures.
     */
    maxConsecutiveFailures?: number;
    /**
     * Delay before retrying after a failure (in milliseconds).
     * If set, scheduler will wait this long before the next execution after a failure.
     * Default: 0 (no delay)
     */
    failureRetryDelay?: number;
}
export interface StandaloneConfig {
    /**
     * Pixiv API credentials
     */
    pixiv: PixivCredentialConfig;
    /**
     * Network configuration
     */
    network?: NetworkConfig;
    /**
     * Storage configuration
     */
    storage?: StorageConfig;
    /**
     * Scheduler configuration
     */
    scheduler?: SchedulerConfig;
    /**
     * Download targets (tags to download)
     */
    targets: TargetConfig[];
    /**
     * Log level: 'debug' | 'info' | 'warn' | 'error'
     * Default: 'info'
     */
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    /**
     * Initial delay before starting download (in milliseconds)
     * Useful for testing or when you want to delay the start of downloads
     * Default: 0 (no delay)
     */
    initialDelay?: number;
    /**
     * Download configuration
     */
    download?: {
        /**
         * Maximum concurrent downloads
         * Default: 3
         */
        concurrency?: number;
        /**
         * Maximum retries per download
         * Default: 3
         */
        maxRetries?: number;
        /**
         * Delay between retries (in milliseconds)
         * Default: 2000
         */
        retryDelay?: number;
        /**
         * Download timeout (in milliseconds)
         * Default: 60000
         */
        timeout?: number;
    };
}
/**
 * Get the resolved configuration file path
 */
export declare function getConfigPath(configPath?: string): string;
/**
 * Load configuration from file with environment variable support
 */
export declare function loadConfig(configPath?: string): StandaloneConfig;
/**
 * Generate a default configuration template
 */
export declare function generateDefaultConfig(): StandaloneConfig;
/**
 * Validate and format configuration file
 */
export declare function validateConfigFile(configPath: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Validation error with detailed information
 */
export declare class ConfigValidationError extends Error {
    readonly errors: string[];
    readonly warnings: string[];
    constructor(message: string, errors: string[], warnings?: string[]);
}
//# sourceMappingURL=config.d.ts.map