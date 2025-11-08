/**
 * Unified error handling utilities
 * Provides consistent error types and handling patterns across the application
 */
export declare class PixivFlowError extends Error {
    readonly code: string;
    readonly statusCode?: number | undefined;
    readonly cause?: Error | undefined;
    constructor(message: string, code: string, statusCode?: number | undefined, cause?: Error | undefined);
}
export declare class ConfigError extends PixivFlowError {
    constructor(message: string, cause?: Error);
}
export declare class AuthenticationError extends PixivFlowError {
    constructor(message: string, cause?: Error);
}
export declare class NetworkError extends PixivFlowError {
    readonly url?: string | undefined;
    readonly isRateLimit?: boolean;
    readonly waitTime?: number;
    constructor(message: string, url?: string | undefined, cause?: Error, metadata?: {
        isRateLimit?: boolean;
        waitTime?: number;
    });
}
export declare class DownloadError extends PixivFlowError {
    readonly itemId?: number | undefined;
    readonly itemType?: "illustration" | "novel" | undefined;
    constructor(message: string, itemId?: number | undefined, itemType?: "illustration" | "novel" | undefined, cause?: Error);
}
export declare class DatabaseError extends PixivFlowError {
    constructor(message: string, cause?: Error);
}
/**
 * Check if an error is a 404 (not found) error
 */
export declare function is404Error(error: unknown): boolean;
/**
 * Check if an error should be skipped (non-fatal)
 */
export declare function isSkipableError(error: unknown): boolean;
/**
 * Extract error message safely
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Get detailed error information including cause and suggestions
 */
export declare function getDetailedErrorInfo(error: unknown): {
    message: string;
    type: string;
    cause?: string;
    suggestions?: string[];
};
/**
 * Extract error stack trace safely
 */
export declare function getErrorStack(error: unknown): string | undefined;
//# sourceMappingURL=errors.d.ts.map