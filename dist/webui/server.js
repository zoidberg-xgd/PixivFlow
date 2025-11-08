"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebUIServer = void 0;
exports.startWebUI = startWebUI;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../logger");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const config_1 = __importDefault(require("./routes/config"));
const download_1 = __importDefault(require("./routes/download"));
const stats_1 = __importDefault(require("./routes/stats"));
const logs_1 = __importDefault(require("./routes/logs"));
const files_1 = __importDefault(require("./routes/files"));
// WebSocket handlers
const LogStream_1 = require("./websocket/LogStream");
class WebUIServer {
    app;
    server;
    io;
    port;
    host;
    constructor(options = {}) {
        this.port = options.port || 3000;
        this.host = options.host || 'localhost';
        // Initialize Express app
        this.app = (0, express_1.default)();
        // Middleware
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // CORS configuration
        if (options.enableCors !== false) {
            this.app.use((0, cors_1.default)({
                origin: options.corsOrigin || '*',
                credentials: true,
            }));
        }
        // Request logging
        this.app.use((req, res, next) => {
            logger_1.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('user-agent'),
            });
            next();
        });
        // API routes
        this.setupRoutes();
        // Error handler
        this.app.use(this.errorHandler);
        // Serve static files (frontend build)
        if (options.staticPath) {
            this.app.use(express_1.default.static(options.staticPath));
            // SPA fallback
            this.app.get('*', (req, res) => {
                if (!req.path.startsWith('/api')) {
                    res.sendFile(path_1.default.join(options.staticPath, 'index.html'));
                }
            });
        }
        // Create HTTP server
        this.server = (0, http_1.createServer)(this.app);
        // Initialize Socket.IO
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: options.corsOrigin || '*',
                credentials: true,
            },
        });
        // Setup WebSocket handlers
        (0, LogStream_1.setupLogStream)(this.io);
    }
    setupRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
        // API routes
        this.app.use('/api/auth', auth_1.default);
        this.app.use('/api/config', config_1.default);
        this.app.use('/api/download', download_1.default);
        this.app.use('/api/stats', stats_1.default);
        this.app.use('/api/logs', logs_1.default);
        this.app.use('/api/files', files_1.default);
    }
    errorHandler(err, req, res, next) {
        logger_1.logger.error('API Error', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
        });
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
    start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, this.host, () => {
                logger_1.logger.info(`WebUI server started on http://${this.host}:${this.port}`);
                resolve();
            });
            this.server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    logger_1.logger.error(`Port ${this.port} is already in use`);
                }
                else {
                    logger_1.logger.error('Server error', { error: err.message });
                }
                reject(err);
            });
        });
    }
    stop() {
        return new Promise((resolve) => {
            this.io.close(() => {
                this.server.close(() => {
                    logger_1.logger.info('WebUI server stopped');
                    resolve();
                });
            });
        });
    }
    getApp() {
        return this.app;
    }
    getIO() {
        return this.io;
    }
}
exports.WebUIServer = WebUIServer;
/**
 * Start WebUI server
 */
async function startWebUI(options) {
    // Set up log file path
    const logPath = path_1.default.join(process.cwd(), 'data', 'pixiv-downloader.log');
    logger_1.logger.setLogPath(logPath);
    const server = new WebUIServer(options);
    await server.start();
    // Graceful shutdown
    const shutdown = async () => {
        logger_1.logger.info('Shutting down WebUI server...');
        await server.stop();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
//# sourceMappingURL=server.js.map