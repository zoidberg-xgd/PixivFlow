"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../logger");
const DownloadTaskManager_1 = require("../services/DownloadTaskManager");
const Database_1 = require("../../storage/Database");
const config_1 = require("../../config");
const path_1 = require("path");
const router = (0, express_1.Router)();
/**
 * Convert host file path to container path if needed
 * This handles the case where database contains host paths but we're running in Docker
 */
function convertFilePathToContainerPath(filePath, config) {
    // If already using container paths, return as is
    if (filePath.startsWith('/app/')) {
        return filePath;
    }
    // Try to extract relative path from host absolute path
    // Common patterns:
    // - /Users/.../downloads/downloads/illustrations/... -> /app/downloads/downloads/illustrations/...
    // - /Users/.../downloads/downloads/novels/... -> /app/downloads/downloads/novels/...
    const illustrationDir = config.storage?.illustrationDirectory || '';
    const novelDir = config.storage?.novelDirectory || '';
    // Check if file path is under illustration directory
    if (illustrationDir && filePath.includes('illustrations')) {
        // Extract the relative path from the illustrations directory
        // Pattern: .../illustrations/filename.jpg
        const match = filePath.match(/illustrations\/(.+)$/);
        if (match) {
            return (0, path_1.join)(illustrationDir, match[1]);
        }
    }
    // Check if file path is under novel directory
    if (novelDir && filePath.includes('novels')) {
        // Pattern: .../novels/filename.txt
        const match = filePath.match(/novels\/(.+)$/);
        if (match) {
            return (0, path_1.join)(novelDir, match[1]);
        }
    }
    // If we can't convert, return original path
    // The file preview route will handle the error
    return filePath;
}
/**
 * POST /api/download/start
 * Start a download task
 */
router.post('/start', async (req, res) => {
    try {
        const { targetId, config } = req.body;
        // Check if there's already an active task
        if (DownloadTaskManager_1.downloadTaskManager.hasActiveTask()) {
            return res.status(409).json({
                error: 'Another download task is already running',
            });
        }
        const taskId = `task_${Date.now()}`;
        // Start task in background
        DownloadTaskManager_1.downloadTaskManager.startTask(taskId, targetId, config).catch((error) => {
            logger_1.logger.error('Background task error', { error, taskId });
        });
        res.json({
            success: true,
            taskId,
            message: 'Download task started',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start download', { error });
        res.status(500).json({
            error: 'Failed to start download',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
/**
 * POST /api/download/stop
 * Stop a download task
 */
router.post('/stop', async (req, res) => {
    try {
        const { taskId } = req.body;
        if (!taskId) {
            return res.status(400).json({
                error: 'Task ID is required',
            });
        }
        await DownloadTaskManager_1.downloadTaskManager.stopTask(taskId);
        res.json({
            success: true,
            message: 'Download task stopped',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to stop download', { error });
        res.status(500).json({
            error: 'Failed to stop download',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
/**
 * GET /api/download/status
 * Get download task status
 */
router.get('/status', async (req, res) => {
    try {
        const { taskId } = req.query;
        if (taskId) {
            const status = DownloadTaskManager_1.downloadTaskManager.getTaskStatus(taskId);
            if (!status) {
                return res.status(404).json({
                    error: 'Task not found',
                });
            }
            return res.json(status);
        }
        // Return all tasks and active task info
        const allTasks = DownloadTaskManager_1.downloadTaskManager.getAllTasks();
        const activeTask = DownloadTaskManager_1.downloadTaskManager.getActiveTask();
        res.json({
            activeTask,
            allTasks,
            hasActiveTask: DownloadTaskManager_1.downloadTaskManager.hasActiveTask(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get download status', { error });
        res.status(500).json({ error: 'Failed to get download status' });
    }
});
/**
 * GET /api/download/history
 * Get download history from database
 */
router.get('/history', async (req, res) => {
    let database = null;
    try {
        const { page = 1, limit = 20, type, tag } = req.query;
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        database = new Database_1.Database(config.storage.databasePath);
        database.migrate(); // Ensure database tables exist
        const result = database.getDownloadHistory({
            page: Number(page),
            limit: Number(limit),
            type: type,
            tag: tag,
        });
        database.close();
        database = null;
        // Convert file paths from host paths to container paths if needed
        const convertedResult = {
            ...result,
            items: result.items.map(item => ({
                ...item,
                filePath: convertFilePathToContainerPath(item.filePath, config),
            })),
        };
        res.json(convertedResult);
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
        const errorDetails = error instanceof Error ? { message: errorMessage, stack: error.stack } : { message: errorMessage };
        logger_1.logger.error('Failed to get download history', { error: errorDetails });
        res.status(500).json({
            error: 'Failed to get download history',
            message: errorMessage
        });
    }
});
/**
 * POST /api/download/run-all
 * Run all targets (equivalent to npm run download)
 */
router.post('/run-all', async (req, res) => {
    try {
        if (DownloadTaskManager_1.downloadTaskManager.hasActiveTask()) {
            return res.status(409).json({
                error: 'Another download task is already running',
            });
        }
        const taskId = `task_all_${Date.now()}`;
        // Start task in background
        DownloadTaskManager_1.downloadTaskManager.startTask(taskId).catch((error) => {
            logger_1.logger.error('Background task error', { error, taskId });
        });
        res.json({
            success: true,
            taskId,
            message: 'Download all targets started',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start download all', { error });
        res.status(500).json({
            error: 'Failed to start download all',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
// 热门标签列表，用于随机选择
const POPULAR_TAGS = [
    '風景', 'イラスト', 'オリジナル', '女の子', '男の子',
    '猫', '犬', '空', '海', '桜', '花', '星空', '夕日',
    'illustration', 'art', 'anime', 'manga', 'cute',
    'beautiful', 'nature', 'sky', 'sunset', 'flower'
];
// 小说热门标签列表
const POPULAR_NOVEL_TAGS = [
    'オリジナル', '創作', '小説', '物語', 'ストーリー',
    '恋愛', 'ファンタジー', '日常', '青春', '冒険',
    'ミステリー', 'ホラー', 'SF', '歴史', '現代',
    'original', 'story', 'novel', 'romance', 'fantasy',
    'daily', 'youth', 'adventure', 'mystery', 'horror'
];
/**
 * POST /api/download/random
 * Download a random illustration or novel
 */
router.post('/random', async (req, res) => {
    try {
        if (DownloadTaskManager_1.downloadTaskManager.hasActiveTask()) {
            return res.status(409).json({
                error: 'Another download task is already running',
            });
        }
        const { type } = req.body;
        const targetType = type === 'novel' ? 'novel' : 'illustration';
        // Select random tag
        const tagList = targetType === 'novel' ? POPULAR_NOVEL_TAGS : POPULAR_TAGS;
        const randomTag = tagList[Math.floor(Math.random() * tagList.length)];
        logger_1.logger.info(`Randomly selected tag: ${randomTag} (type: ${targetType})`);
        // Create temporary config for random download
        const configPath = (0, config_1.getConfigPath)();
        const baseConfig = (0, config_1.loadConfig)(configPath);
        const tempConfig = {
            ...baseConfig,
            targets: [
                {
                    type: targetType,
                    tag: randomTag,
                    limit: 1,
                    searchTarget: 'partial_match_for_tags',
                    random: true, // Enable random selection
                },
            ],
        };
        const taskId = `task_random_${targetType}_${Date.now()}`;
        // Start task in background
        DownloadTaskManager_1.downloadTaskManager.startTask(taskId, undefined, tempConfig).catch((error) => {
            logger_1.logger.error('Background task error', { error, taskId });
        });
        res.json({
            success: true,
            taskId,
            message: `Random ${targetType} download started`,
            tag: randomTag,
            type: targetType,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start random download', { error });
        res.status(500).json({
            error: 'Failed to start random download',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.default = router;
//# sourceMappingURL=download.js.map