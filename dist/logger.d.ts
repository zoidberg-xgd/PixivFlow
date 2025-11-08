export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface LogMeta {
    [key: string]: unknown;
}
declare class Logger {
    private static readonly levelOrder;
    private threshold;
    setLevel(level: LogLevel): void;
    debug(message: string, meta?: LogMeta): void;
    info(message: string, meta?: LogMeta): void;
    warn(message: string, meta?: LogMeta): void;
    error(message: string, meta?: LogMeta): void;
    private write;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map