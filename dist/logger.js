"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    static levelOrder = {
        debug: 10,
        info: 20,
        warn: 30,
        error: 40,
    };
    threshold = 'info';
    setLevel(level) {
        this.threshold = level;
    }
    debug(message, meta) {
        this.write('debug', message, meta);
    }
    info(message, meta) {
        this.write('info', message, meta);
    }
    warn(message, meta) {
        this.write('warn', message, meta);
    }
    error(message, meta) {
        this.write('error', message, meta);
    }
    write(level, message, meta) {
        if (Logger.levelOrder[level] < Logger.levelOrder[this.threshold]) {
            return;
        }
        const timestamp = new Date().toISOString();
        const payload = meta ? `${message} ${JSON.stringify(meta)}` : message;
        switch (level) {
            case 'debug':
                console.debug(`[${timestamp}] [DEBUG] ${payload}`);
                break;
            case 'info':
                console.info(`[${timestamp}] [INFO] ${payload}`);
                break;
            case 'warn':
                console.warn(`[${timestamp}] [WARN] ${payload}`);
                break;
            case 'error':
                console.error(`[${timestamp}] [ERROR] ${payload}`);
                break;
            default:
                console.log(`[${timestamp}] ${payload}`);
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map