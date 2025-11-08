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
 * Helper function to serialize TaskStatus for JSON response
 */
function serializeTaskStatus(task) {
    if (!task)
        return null;
    return {
        ...task,
        startTime: task.startTime instanceof Date ? task.startTime.toISOString() : task.startTime,
        endTime: task.endTime instanceof Date ? task.endTime.toISOString() : task.endTime,
    };
}
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
            return res.json(serializeTaskStatus(status));
        }
        // Return all tasks and active task info
        const allTasks = DownloadTaskManager_1.downloadTaskManager.getAllTasks();
        const activeTask = DownloadTaskManager_1.downloadTaskManager.getActiveTask();
        res.json({
            activeTask: serializeTaskStatus(activeTask),
            allTasks: allTasks.map(serializeTaskStatus),
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
        const { page = 1, limit = 20, type, tag, author, startDate, endDate, sortBy, sortOrder } = req.query;
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        database = new Database_1.Database(config.storage.databasePath);
        database.migrate(); // Ensure database tables exist
        const result = database.getDownloadHistory({
            page: Number(page),
            limit: Number(limit),
            type: type,
            tag: tag,
            author: author,
            startDate: startDate,
            endDate: endDate,
            sortBy: sortBy || 'downloadedAt',
            sortOrder: sortOrder || 'desc',
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
 * GET /api/download/incomplete
 * Get incomplete download tasks
 */
router.get('/incomplete', async (req, res) => {
    let database = null;
    try {
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        database = new Database_1.Database(config.storage.databasePath);
        database.migrate();
        const incompleteTasks = database.getIncompleteTasks(50);
        database.close();
        database = null;
        res.json({
            success: true,
            tasks: incompleteTasks,
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
        logger_1.logger.error('Failed to get incomplete tasks', { error });
        res.status(500).json({
            error: 'Failed to get incomplete tasks',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
/**
 * DELETE /api/download/incomplete/:id
 * Delete an incomplete download task by id
 */
router.delete('/incomplete/:id', async (req, res) => {
    let database = null;
    try {
        // Parse and validate task ID
        const rawId = req.params.id;
        const id = parseInt(rawId, 10);
        if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
            logger_1.logger.warn('Invalid task ID provided for deletion', {
                rawId,
                parsedId: id
            });
            return res.status(400).json({
                error: 'Invalid task ID',
                message: `Task ID must be a valid positive integer, got: ${rawId}`,
            });
        }
        logger_1.logger.info('Attempting to delete incomplete task', { taskId: id });
        // Initialize database connection
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        if (!config.storage?.databasePath) {
            logger_1.logger.error('Database path not configured');
            return res.status(500).json({
                error: 'Database not configured',
                message: 'Database path is not set in configuration',
            });
        }
        try {
            database = new Database_1.Database(config.storage.databasePath);
            database.migrate();
        }
        catch (dbError) {
            logger_1.logger.error('Failed to initialize database', {
                error: dbError instanceof Error ? dbError.message : String(dbError),
                databasePath: config.storage.databasePath,
            });
            return res.status(500).json({
                error: 'Database initialization failed',
                message: dbError instanceof Error ? dbError.message : String(dbError),
            });
        }
        // Perform deletion
        const result = database.deleteIncompleteTask(id);
        // Close database connection immediately after operation
        try {
            database.close();
            database = null;
        }
        catch (closeError) {
            logger_1.logger.warn('Error closing database connection', {
                error: closeError instanceof Error ? closeError.message : String(closeError)
            });
        }
        // Handle result
        if (!result.success) {
            const statusCode = result.message?.includes('not found') ? 404 : 400;
            logger_1.logger.warn('Failed to delete incomplete task', {
                taskId: id,
                reason: result.message
            });
            return res.status(statusCode).json({
                error: result.message || 'Task not found or cannot be deleted',
                message: result.message || 'Task not found or cannot be deleted',
            });
        }
        logger_1.logger.info('Successfully deleted incomplete task via API', { taskId: id });
        res.json({
            success: true,
            message: 'Task deleted successfully',
        });
    }
    catch (error) {
        // Ensure database is closed even on error
        if (database) {
            try {
                database.close();
            }
            catch (closeError) {
                logger_1.logger.warn('Error closing database connection in error handler', {
                    error: closeError instanceof Error ? closeError.message : String(closeError)
                });
            }
        }
        logger_1.logger.error('Unexpected error while deleting incomplete task', {
            error,
            taskId: req.params.id,
            parsedTaskId: parseInt(req.params.id, 10),
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
            error: 'Failed to delete incomplete task',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
/**
 * GET /api/download/incomplete/test
 * Test endpoint to verify database connection and incomplete tasks query
 */
router.get('/incomplete/test', async (req, res) => {
    let database = null;
    try {
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        if (!config.storage?.databasePath) {
            return res.status(500).json({
                error: 'Database not configured',
                message: 'Database path is not set in configuration',
            });
        }
        database = new Database_1.Database(config.storage.databasePath);
        database.migrate();
        // Test query
        const tasks = database.getIncompleteTasks(10);
        database.close();
        database = null;
        res.json({
            success: true,
            message: 'Database connection successful',
            taskCount: tasks.length,
            sampleTasks: tasks.slice(0, 3),
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
        logger_1.logger.error('Database test failed', { error });
        res.status(500).json({
            error: 'Database test failed',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
/**
 * POST /api/download/resume
 * Resume an incomplete download task by tag
 */
router.post('/resume', async (req, res) => {
    try {
        const { tag, type } = req.body;
        if (!tag || !type) {
            return res.status(400).json({
                error: 'Tag and type are required',
            });
        }
        // Check if there's already an active task
        if (DownloadTaskManager_1.downloadTaskManager.hasActiveTask()) {
            return res.status(409).json({
                error: 'Another download task is already running',
            });
        }
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        // Find target by tag
        const target = config.targets?.find((t) => (t.tag === tag || t.filterTag === tag) && t.type === type);
        if (!target) {
            return res.status(404).json({
                error: `Target not found for tag "${tag}" and type "${type}"`,
            });
        }
        const targetIndex = config.targets.indexOf(target);
        const taskId = `task_resume_${tag}_${Date.now()}`;
        // Start task in background with the specific target
        DownloadTaskManager_1.downloadTaskManager.startTask(taskId, targetIndex.toString()).catch((error) => {
            logger_1.logger.error('Background task error', { error, taskId });
        });
        res.json({
            success: true,
            taskId,
            message: `Resuming download task for tag "${tag}" (${type})`,
            tag,
            type,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to resume download', { error });
        res.status(500).json({
            error: 'Failed to resume download',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
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