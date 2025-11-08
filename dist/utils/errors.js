"use strict";
/**
 * Unified error handling utilities
 * Provides consistent error types and handling patterns across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = exports.DownloadError = exports.NetworkError = exports.AuthenticationError = exports.ConfigError = exports.PixivFlowError = void 0;
exports.is404Error = is404Error;
exports.isSkipableError = isSkipableError;
exports.getErrorMessage = getErrorMessage;
exports.getErrorStack = getErrorStack;
class PixivFlowError extends Error {
    code;
    statusCode;
    cause;
    constructor(message, code, statusCode, cause) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.cause = cause;
        this.name = 'PixivFlowError';
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PixivFlowError);
        }
    }
}
exports.PixivFlowError = PixivFlowError;
class ConfigError extends PixivFlowError {
    constructor(message, cause) {
        super(message, 'CONFIG_ERROR', 400, cause);
        this.name = 'ConfigError';
    }
}
exports.ConfigError = ConfigError;
class AuthenticationError extends PixivFlowError {
    constructor(message, cause) {
        super(message, 'AUTH_ERROR', 401, cause);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class NetworkError extends PixivFlowError {
    url;
    constructor(message, url, cause) {
        super(message, 'NETWORK_ERROR', undefined, cause);
        this.url = url;
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
class DownloadError extends PixivFlowError {
    itemId;
    itemType;
    constructor(message, itemId, itemType, cause) {
        super(message, 'DOWNLOAD_ERROR', undefined, cause);
        this.itemId = itemId;
        this.itemType = itemType;
        this.name = 'DownloadError';
    }
}
exports.DownloadError = DownloadError;
class DatabaseError extends PixivFlowError {
    constructor(message, cause) {
        super(message, 'DATABASE_ERROR', 500, cause);
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Check if an error is a 404 (not found) error
 */
function is404Error(error) {
    if (error instanceof Error) {
        return error.message.includes('404') ||
            error.message.includes('not found') ||
            (error instanceof NetworkError && error.statusCode === 404);
    }
    return String(error).includes('404');
}
/**
 * Check if an error should be skipped (non-fatal)
 */
function isSkipableError(error) {
    if (is404Error(error)) {
        return true;
    }
    if (error instanceof Error) {
        // Network timeouts and connection errors are usually skipable
        const skipablePatterns = [
            'timeout',
            'ECONNREFUSED',
            'ENOTFOUND',
            'ETIMEDOUT',
            'ECONNRESET',
            '403', // Forbidden (private content)
        ];
        return skipablePatterns.some(pattern => error.message.toLowerCase().includes(pattern.toLowerCase()));
    }
    return false;
}
/**
 * Extract error message safely
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return String(error);
}
/**
 * Extract error stack trace safely
 */
function getErrorStack(error) {
    if (error instanceof Error) {
        return error.stack;
    }
    return undefined;
}
//# sourceMappingURL=errors.js.map