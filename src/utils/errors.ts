/**
 * Unified error handling utilities
 * Provides consistent error types and handling patterns across the application
 */

export class PixivFlowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PixivFlowError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PixivFlowError);
    }
  }
}

export class ConfigError extends PixivFlowError {
  constructor(message: string, cause?: Error) {
    super(message, 'CONFIG_ERROR', 400, cause);
    this.name = 'ConfigError';
  }
}

export class AuthenticationError extends PixivFlowError {
  constructor(message: string, cause?: Error) {
    super(message, 'AUTH_ERROR', 401, cause);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends PixivFlowError {
  constructor(message: string, public readonly url?: string, cause?: Error) {
    super(message, 'NETWORK_ERROR', undefined, cause);
    this.name = 'NetworkError';
  }
}

export class DownloadError extends PixivFlowError {
  constructor(
    message: string,
    public readonly itemId?: number,
    public readonly itemType?: 'illustration' | 'novel',
    cause?: Error
  ) {
    super(message, 'DOWNLOAD_ERROR', undefined, cause);
    this.name = 'DownloadError';
  }
}

export class DatabaseError extends PixivFlowError {
  constructor(message: string, cause?: Error) {
    super(message, 'DATABASE_ERROR', 500, cause);
    this.name = 'DatabaseError';
  }
}

/**
 * Check if an error is a 404 (not found) error
 */
export function is404Error(error: unknown): boolean {
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
export function isSkipableError(error: unknown): boolean {
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
    
    return skipablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }
  
  return false;
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
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
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

