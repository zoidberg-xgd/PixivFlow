"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class Logger {
    static levelOrder = {
        debug: 10,
        info: 20,
        warn: 30,
        error: 40,
    };
    threshold = 'info';
    logPath = null;
    setLevel(level) {
        this.threshold = level;
    }
    setLogPath(path) {
        this.logPath = path;
        // Ensure log directory exists
        const logDir = (0, path_1.join)(path, '..');
        if (!(0, fs_1.existsSync)(logDir)) {
            (0, fs_1.mkdirSync)(logDir, { recursive: true });
        }
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
        const logLine = `[${timestamp}] [${level.toUpperCase()}] ${payload}`;
        // Output to console
        switch (level) {
            case 'debug':
                console.debug(logLine);
                break;
            case 'info':
                console.info(logLine);
                break;
            case 'warn':
                console.warn(logLine);
                break;
            case 'error':
                console.error(logLine);
                break;
            default:
                console.log(logLine);
        }
        // Write to file if log path is set
        if (this.logPath) {
            try {
                (0, fs_1.appendFileSync)(this.logPath, logLine + '\n', 'utf-8');
            }
            catch (error) {
                // Silently fail if file write fails to avoid breaking the application
                console.error('Failed to write to log file', error);
            }
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map