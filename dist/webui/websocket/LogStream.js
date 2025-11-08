"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLogStream = setupLogStream;
const logger_1 = require("../../logger");
const fs_1 = require("fs");
const path_1 = require("path");
const readline_1 = __importDefault(require("readline"));
function setupLogStream(io, options = {}) {
    const logPath = options.logPath || (0, path_1.join)(process.cwd(), 'data', 'pixiv-downloader.log');
    const maxLines = options.maxLines || 1000;
    io.on('connection', (socket) => {
        logger_1.logger.info('WebSocket client connected', { socketId: socket.id });
        // Send recent logs on connection
        if ((0, fs_1.existsSync)(logPath)) {
            sendRecentLogs(socket, logPath, maxLines);
        }
        // Watch log file for changes
        let watcher = null;
        let lastPosition = 0;
        if ((0, fs_1.existsSync)(logPath)) {
            // Get initial file size
            const stats = require('fs').statSync(logPath);
            lastPosition = stats.size;
            // Watch for file changes
            watcher = setInterval(() => {
                try {
                    const currentStats = require('fs').statSync(logPath);
                    if (currentStats.size > lastPosition) {
                        // File has grown, read new lines
                        readNewLogs(socket, logPath, lastPosition);
                        lastPosition = currentStats.size;
                    }
                }
                catch (error) {
                    logger_1.logger.error('Error watching log file', { error });
                }
            }, 1000); // Check every second
        }
        socket.on('disconnect', () => {
            logger_1.logger.info('WebSocket client disconnected', { socketId: socket.id });
            if (watcher) {
                clearInterval(watcher);
            }
        });
    });
}
function sendRecentLogs(socket, logPath, maxLines) {
    try {
        const readStream = (0, fs_1.createReadStream)(logPath, { encoding: 'utf-8' });
        const rl = readline_1.default.createInterface({
            input: readStream,
            crlfDelay: Infinity,
        });
        const lines = [];
        rl.on('line', (line) => {
            lines.push(line);
            if (lines.length > maxLines) {
                lines.shift();
            }
        });
        rl.on('close', () => {
            socket.emit('logs', {
                type: 'initial',
                lines: lines.slice(-maxLines),
            });
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to send recent logs', { error });
    }
}
function readNewLogs(socket, logPath, startPosition) {
    try {
        const readStream = (0, fs_1.createReadStream)(logPath, {
            encoding: 'utf-8',
            start: startPosition,
        });
        const rl = readline_1.default.createInterface({
            input: readStream,
            crlfDelay: Infinity,
        });
        rl.on('line', (line) => {
            socket.emit('logs', {
                type: 'new',
                line,
            });
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to read new logs', { error });
    }
}
//# sourceMappingURL=LogStream.js.map