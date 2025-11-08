import { Router, Request, Response } from 'express';
import { Database } from '../../storage/Database';
import { loadConfig, getConfigPath } from '../../config';
import { logger } from '../../logger';
import DatabaseDriver from 'better-sqlite3';

const router = Router();

/**
 * GET /api/stats/overview
 * Get overview statistics
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const configPath = getConfigPath();
    const config = loadConfig(configPath);
    const database = new Database(config.storage!.databasePath!);

    // Access database directly (we need to add helper methods to Database class)
    // For now, use a workaround to access the internal db
    const db = (database as any).db as DatabaseDriver.Database;
    
    // Get total downloads
    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM downloads');
    const totalRow = totalStmt.get() as { total: number };
    const totalDownloads = totalRow.total || 0;
    
    // Get downloads by type
    const illustrationsStmt = db.prepare(
      "SELECT COUNT(*) as total FROM downloads WHERE type = 'illustration'"
    );
    const illustrationsRow = illustrationsStmt.get() as { total: number };
    const illustrations = illustrationsRow.total || 0;

    const novelsStmt = db.prepare(
      "SELECT COUNT(*) as total FROM downloads WHERE type = 'novel'"
    );
    const novelsRow = novelsStmt.get() as { total: number };
    const novels = novelsRow.total || 0;

    // Get recent downloads (last 7 days)
    const recentStmt = db.prepare(
      `SELECT COUNT(*) as total FROM downloads 
       WHERE downloaded_at >= datetime('now', '-7 days')`
    );
    const recentRow = recentStmt.get() as { total: number };
    const recentDownloads = recentRow.total || 0;

    res.json({
      totalDownloads,
      illustrations,
      novels,
      recentDownloads,
    });
  } catch (error) {
    logger.error('Failed to get overview stats', { error });
    res.status(500).json({ error: 'Failed to get overview stats' });
  }
});

/**
 * GET /api/stats/downloads
 * Get download statistics
 */
router.get('/downloads', async (req: Request, res: Response) => {
  try {
    const { period = '7d' } = req.query;
    const configPath = getConfigPath();
    const config = loadConfig(configPath);
    const database = new Database(config.storage!.databasePath!);

    // Parse period (e.g., '7d', '30d', '1y')
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '1y' ? 365 : 7;
    const db = (database as any).db as DatabaseDriver.Database;
    const stmt = db.prepare(
      `SELECT * FROM downloads 
       WHERE downloaded_at >= datetime('now', '-${days} days')
       ORDER BY downloaded_at DESC`
    );
    const downloads = stmt.all() as any[];

    res.json({
      period,
      downloads: downloads.length,
      data: downloads,
    });
  } catch (error) {
    logger.error('Failed to get download stats', { error });
    res.status(500).json({ error: 'Failed to get download stats' });
  }
});

/**
 * GET /api/stats/tags
 * Get tag statistics
 */
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const configPath = getConfigPath();
    const config = loadConfig(configPath);
    const database = new Database(config.storage!.databasePath!);
    const db = (database as any).db as DatabaseDriver.Database;

    // Get tag statistics
    const stmt = db.prepare(
      `SELECT tag, COUNT(*) as count 
       FROM downloads 
       GROUP BY tag 
       ORDER BY count DESC 
       LIMIT ?`
    );
    const tags = stmt.all(Number(limit)) as Array<{ tag: string; count: number }>;

    res.json({
      tags: tags.map(t => ({ name: t.tag, count: t.count })),
    });
  } catch (error) {
    logger.error('Failed to get tag stats', { error });
    res.status(500).json({ error: 'Failed to get tag stats' });
  }
});

/**
 * GET /api/stats/authors
 * Get author statistics
 */
router.get('/authors', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const configPath = getConfigPath();
    const config = loadConfig(configPath);
    const database = new Database(config.storage!.databasePath!);
    const db = (database as any).db as DatabaseDriver.Database;

    // Get author statistics
    const stmt = db.prepare(
      `SELECT author, COUNT(*) as count 
       FROM downloads 
       WHERE author IS NOT NULL
       GROUP BY author 
       ORDER BY count DESC 
       LIMIT ?`
    );
    const authors = stmt.all(Number(limit)) as Array<{ author: string; count: number }>;

    res.json({
      authors: authors.map(a => ({ name: a.author, count: a.count })),
    });
  } catch (error) {
    logger.error('Failed to get author stats', { error });
    res.status(500).json({ error: 'Failed to get author stats' });
  }
});

export default router;

