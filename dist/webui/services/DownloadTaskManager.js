"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadTaskManager = exports.DownloadTaskManager = void 0;
const DownloadManager_1 = require("../../download/DownloadManager");
const PixivClient_1 = require("../../pixiv/PixivClient");
const AuthClient_1 = require("../../pixiv/AuthClient");
const Database_1 = require("../../storage/Database");
const FileService_1 = require("../../download/FileService");
const config_1 = require("../../config");
const logger_1 = require("../../logger");
class DownloadTaskManager {
    tasks = new Map();
    activeTask = null;
    /**
     * Start a download task
     */
    async startTask(taskId, targetId, customConfig) {
        // Check if there's already an active task
        if (this.activeTask) {
            throw new Error('Another download task is already running');
        }
        const configPath = (0, config_1.getConfigPath)();
        let config = (0, config_1.loadConfig)(configPath);
        // Merge custom config if provided
        if (customConfig) {
            config = { ...config, ...customConfig };
        }
        // If targetId is provided, filter targets
        if (targetId && config.targets) {
            const target = config.targets.find((t, idx) => idx.toString() === targetId || t.tag === targetId);
            if (target) {
                config = { ...config, targets: [target] };
            }
        }
        const database = new Database_1.Database(config.storage.databasePath);
        database.migrate();
        const auth = new AuthClient_1.PixivAuth(config.pixiv, config.network, database, configPath);
        const pixivClient = new PixivClient_1.PixivClient(auth, config);
        const fileService = new FileService_1.FileService(config.storage);
        const downloadManager = new DownloadManager_1.DownloadManager(config, pixivClient, database, fileService);
        // Set progress callback
        const progressCallback = this.getProgressCallback(taskId);
        downloadManager.setProgressCallback(progressCallback);
        await downloadManager.initialise();
        const abortController = new AbortController();
        const taskStatus = {
            taskId,
            status: 'running',
            startTime: new Date(),
            targetId,
        };
        this.tasks.set(taskId, taskStatus);
        const promise = (async () => {
            try {
                logger_1.logger.info(`Starting download task ${taskId}`);
                await downloadManager.runAllTargets();
                taskStatus.status = 'completed';
                taskStatus.endTime = new Date();
                logger_1.logger.info(`Download task ${taskId} completed`);
            }
            catch (error) {
                taskStatus.status = 'failed';
                taskStatus.error = error instanceof Error ? error.message : String(error);
                taskStatus.endTime = new Date();
                logger_1.logger.error(`Download task ${taskId} failed`, { error });
                throw error;
            }
            finally {
                database.close();
                this.activeTask = null;
            }
        })();
        this.activeTask = {
            taskId,
            manager: downloadManager,
            database,
            promise,
            abortController,
        };
        // Don't await - let it run in background
        promise.catch(() => {
            // Error already handled in promise
        });
    }
    /**
     * Stop the active download task
     */
    async stopTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }
        if (task.status !== 'running') {
            throw new Error(`Task ${taskId} is not running`);
        }
        if (this.activeTask && this.activeTask.taskId === taskId) {
            // Signal abort
            this.activeTask.abortController.abort();
            // Close database
            this.activeTask.database.close();
            task.status = 'stopped';
            task.endTime = new Date();
            this.activeTask = null;
            logger_1.logger.info(`Download task ${taskId} stopped`);
        }
    }
    /**
     * Get task status
     */
    getTaskStatus(taskId) {
        return this.tasks.get(taskId) || null;
    }
    /**
     * Get all tasks
     */
    getAllTasks() {
        return Array.from(this.tasks.values()).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    }
    /**
     * Get active task
     */
    getActiveTask() {
        if (!this.activeTask) {
            return null;
        }
        return this.tasks.get(this.activeTask.taskId) || null;
    }
    /**
     * Check if there's an active task
     */
    hasActiveTask() {
        return this.activeTask !== null;
    }
    /**
     * Update progress for a task
     */
    updateProgress(taskId, progress) {
        const task = this.tasks.get(taskId);
        if (task) {
            task.progress = progress;
        }
    }
    /**
     * Get progress callback for a task
     */
    getProgressCallback(taskId) {
        return (current, total, message) => {
            this.updateProgress(taskId, { current, total, message });
            // Log progress to console for real-time visibility
            const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
            if (message) {
                logger_1.logger.info(`[${taskId}] Progress: ${current}/${total} (${percentage}%) - ${message}`);
            }
            else {
                logger_1.logger.info(`[${taskId}] Progress: ${current}/${total} (${percentage}%)`);
            }
        };
    }
}
exports.DownloadTaskManager = DownloadTaskManager;
// Singleton instance
exports.downloadTaskManager = new DownloadTaskManager();
//# sourceMappingURL=DownloadTaskManager.js.map