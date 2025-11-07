export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
declare class Logger {
    private static levelOrder;
    private threshold;
    setLevel(level: LogLevel): void;
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    private write;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map