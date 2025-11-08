"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Database_1 = require("../../storage/Database");
const config_1 = require("../../config");
const logger_1 = require("../../logger");
const router = (0, express_1.Router)();
/**
 * GET /api/stats/overview
 * Get overview statistics
 */
router.get('/overview', async (req, res) => {
    let database = null;
    try {
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        database = new Database_1.Database(config.storage.databasePath);
        database.migrate(); // Ensure database tables exist
        const stats = database.getOverviewStats();
        database.close();
        database = null;
        res.json(stats);
    }
    catch (error) {
        if (database) {
            try {
                database.close();
            }
            catch (closeError) {
                // Ignore close errors
            }
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('Failed to get overview stats', { error: { message: errorMessage } });
        res.status(500).json({ error: 'Failed to get overview stats' });
    }
});
/**
 * GET /api/stats/downloads
 * Get download statistics
 */
router.get('/downloads', async (req, res) => {
    let database = null;
    try {
        const { period = '7d' } = req.query;
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        database = new Database_1.Database(config.storage.databasePath);
        database.migrate(); // Ensure database tables exist
        // Parse period (e.g., '7d', '30d', '1y')
        const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '1y' ? 365 : 7;
        const downloads = database.getDownloadsByPeriod(days);
        database.close();
        database = null;
        res.json({
            period,
            downloads: downloads.length,
            data: downloads,
        });
    }
    catch (error) {
        if (database) {
            try {
                database.close();
            }
            catch (closeError) {
                // Ignore close errors
            }
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('Failed to get download stats', { error: { message: errorMessage } });
        res.status(500).json({ error: 'Failed to get download stats' });
    }
});
/**
 * GET /api/stats/tags
 * Get tag statistics
 */
router.get('/tags', async (req, res) => {
    let database = null;
    try {
        const { limit = 10 } = req.query;
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        database = new Database_1.Database(config.storage.databasePath);
        database.migrate(); // Ensure database tables exist
        const tags = database.getTagStats(Number(limit));
        database.close();
        database = null;
        res.json({ tags });
    }
    catch (error) {
        if (database) {
            try {
                database.close();
            }
            catch (closeError) {
                // Ignore close errors
            }
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('Failed to get tag stats', { error: { message: errorMessage } });
        res.status(500).json({ error: 'Failed to get tag stats' });
    }
});
/**
 * GET /api/stats/authors
 * Get author statistics
 */
router.get('/authors', async (req, res) => {
    let database = null;
    try {
        const { limit = 10 } = req.query;
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        database = new Database_1.Database(config.storage.databasePath);
        database.migrate(); // Ensure database tables exist
        const authors = database.getAuthorStats(Number(limit));
        database.close();
        database = null;
        res.json({ authors });
    }
    catch (error) {
        if (database) {
            try {
                database.close();
            }
            catch (closeError) {
                // Ignore close errors
            }
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('Failed to get author stats', { error: { message: errorMessage } });
        res.status(500).json({ error: 'Failed to get author stats' });
    }
});
exports.default = router;
//# sourceMappingURL=stats.js.map