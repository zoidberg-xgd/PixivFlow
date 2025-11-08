"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = require("fs");
const logger_1 = require("../../logger");
const config_1 = require("../../config");
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
/**
 * GET /api/logs
 * Get logs with pagination
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 100, level, search } = req.query;
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        // Default log path
        const logPath = path_1.default.join(process.cwd(), 'data', 'pixiv-downloader.log');
        if (!(0, fs_1.existsSync)(logPath)) {
            return res.json({
                logs: [],
                total: 0,
                page: Number(page),
                limit: Number(limit),
            });
        }
        // Read log file
        const logContent = (0, fs_1.readFileSync)(logPath, 'utf-8');
        const lines = logContent.split('\n').filter((line) => line.trim());
        // Filter by level if specified
        let filteredLines = lines;
        if (level) {
            filteredLines = lines.filter((line) => line.toLowerCase().includes(`[${level}]`));
        }
        // Search if specified
        if (search) {
            filteredLines = filteredLines.filter((line) => line.toLowerCase().includes(String(search).toLowerCase()));
        }
        // Paginate
        const start = (Number(page) - 1) * Number(limit);
        const end = start + Number(limit);
        const paginatedLines = filteredLines.slice(start, end);
        res.json({
            logs: paginatedLines,
            total: filteredLines.length,
            page: Number(page),
            limit: Number(limit),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get logs', { error });
        res.status(500).json({ error: 'Failed to get logs' });
    }
});
/**
 * DELETE /api/logs
 * Clear logs
 */
router.delete('/', async (req, res) => {
    try {
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        const logPath = path_1.default.join(process.cwd(), 'data', 'pixiv-downloader.log');
        if ((0, fs_1.existsSync)(logPath)) {
            // Truncate log file
            require('fs').writeFileSync(logPath, '', 'utf-8');
        }
        res.json({
            success: true,
            message: 'Logs cleared successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to clear logs', { error });
        res.status(500).json({ error: 'Failed to clear logs' });
    }
});
exports.default = router;
//# sourceMappingURL=logs.js.map