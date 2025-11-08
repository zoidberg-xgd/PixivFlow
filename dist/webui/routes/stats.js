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
    try {
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        const database = new Database_1.Database(config.storage.databasePath);
        // Access database directly (we need to add helper methods to Database class)
        // For now, use a workaround to access the internal db
        const db = database.db;
        // Get total downloads
        const totalStmt = db.prepare('SELECT COUNT(*) as total FROM downloads');
        const totalRow = totalStmt.get();
        const totalDownloads = totalRow.total || 0;
        // Get downloads by type
        const illustrationsStmt = db.prepare("SELECT COUNT(*) as total FROM downloads WHERE type = 'illustration'");
        const illustrationsRow = illustrationsStmt.get();
        const illustrations = illustrationsRow.total || 0;
        const novelsStmt = db.prepare("SELECT COUNT(*) as total FROM downloads WHERE type = 'novel'");
        const novelsRow = novelsStmt.get();
        const novels = novelsRow.total || 0;
        // Get recent downloads (last 7 days)
        const recentStmt = db.prepare(`SELECT COUNT(*) as total FROM downloads 
       WHERE downloaded_at >= datetime('now', '-7 days')`);
        const recentRow = recentStmt.get();
        const recentDownloads = recentRow.total || 0;
        res.json({
            totalDownloads,
            illustrations,
            novels,
            recentDownloads,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get overview stats', { error });
        res.status(500).json({ error: 'Failed to get overview stats' });
    }
});
/**
 * GET /api/stats/downloads
 * Get download statistics
 */
router.get('/downloads', async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        const database = new Database_1.Database(config.storage.databasePath);
        // Parse period (e.g., '7d', '30d', '1y')
        const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '1y' ? 365 : 7;
        const db = database.db;
        const stmt = db.prepare(`SELECT * FROM downloads 
       WHERE downloaded_at >= datetime('now', '-${days} days')
       ORDER BY downloaded_at DESC`);
        const downloads = stmt.all();
        res.json({
            period,
            downloads: downloads.length,
            data: downloads,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get download stats', { error });
        res.status(500).json({ error: 'Failed to get download stats' });
    }
});
/**
 * GET /api/stats/tags
 * Get tag statistics
 */
router.get('/tags', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        const database = new Database_1.Database(config.storage.databasePath);
        const db = database.db;
        // Get tag statistics
        const stmt = db.prepare(`SELECT tag, COUNT(*) as count 
       FROM downloads 
       GROUP BY tag 
       ORDER BY count DESC 
       LIMIT ?`);
        const tags = stmt.all(Number(limit));
        res.json({
            tags: tags.map(t => ({ name: t.tag, count: t.count })),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get tag stats', { error });
        res.status(500).json({ error: 'Failed to get tag stats' });
    }
});
/**
 * GET /api/stats/authors
 * Get author statistics
 */
router.get('/authors', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        const database = new Database_1.Database(config.storage.databasePath);
        const db = database.db;
        // Get author statistics
        const stmt = db.prepare(`SELECT author, COUNT(*) as count 
       FROM downloads 
       WHERE author IS NOT NULL
       GROUP BY author 
       ORDER BY count DESC 
       LIMIT ?`);
        const authors = stmt.all(Number(limit));
        res.json({
            authors: authors.map(a => ({ name: a.author, count: a.count })),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get author stats', { error });
        res.status(500).json({ error: 'Failed to get author stats' });
    }
});
exports.default = router;
//# sourceMappingURL=stats.js.map