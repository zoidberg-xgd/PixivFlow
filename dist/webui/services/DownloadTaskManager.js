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
    taskLogs = new Map();
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
            logs: [],
        };
        this.tasks.set(taskId, taskStatus);
        this.taskLogs.set(taskId, []);
        // Add initial log entry
        this.addLog(taskId, 'info', `下载任务 ${taskId} 已启动`);
        const promise = (async () => {
            try {
                this.addLog(taskId, 'info', '开始执行下载任务...');
                logger_1.logger.info(`Starting download task ${taskId}`);
                await downloadManager.runAllTargets();
                taskStatus.status = 'completed';
                taskStatus.endTime = new Date();
                this.addLog(taskId, 'info', '下载任务完成');
                logger_1.logger.info(`Download task ${taskId} completed`);
            }
            catch (error) {
                taskStatus.status = 'failed';
                const errorMessage = error instanceof Error ? error.message : String(error);
                taskStatus.error = errorMessage;
                taskStatus.endTime = new Date();
                this.addLog(taskId, 'error', `下载任务失败: ${errorMessage}`);
                if (error instanceof Error && error.stack) {
                    this.addLog(taskId, 'error', `错误堆栈: ${error.stack}`);
                }
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
            this.addLog(taskId, 'warn', '下载任务已停止');
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
            const logMessage = message
                ? `进度: ${current}/${total} (${percentage}%) - ${message}`
                : `进度: ${current}/${total} (${percentage}%)`;
            this.addLog(taskId, 'info', logMessage);
            if (message) {
                logger_1.logger.info(`[${taskId}] Progress: ${current}/${total} (${percentage}%) - ${message}`);
            }
            else {
                logger_1.logger.info(`[${taskId}] Progress: ${current}/${total} (${percentage}%)`);
            }
        };
    }
    /**
     * Add a log entry for a task
     */
    addLog(taskId, level, message) {
        const logs = this.taskLogs.get(taskId) || [];
        const entry = {
            timestamp: new Date(),
            level,
            message,
        };
        logs.push(entry);
        // Keep only last 1000 log entries per task
        if (logs.length > 1000) {
            logs.shift();
        }
        this.taskLogs.set(taskId, logs);
        // Also update the task status logs
        const task = this.tasks.get(taskId);
        if (task) {
            task.logs = [...logs];
        }
        // Also output to backend logger system (console and log file)
        const logMessage = `[Task ${taskId}] ${message}`;
        switch (level) {
            case 'debug':
                logger_1.logger.debug(logMessage, { taskId });
                break;
            case 'info':
                logger_1.logger.info(logMessage, { taskId });
                break;
            case 'warn':
                logger_1.logger.warn(logMessage, { taskId });
                break;
            case 'error':
                logger_1.logger.error(logMessage, { taskId });
                break;
        }
    }
    /**
     * Get logs for a task
     */
    getTaskLogs(taskId, limit) {
        const logs = this.taskLogs.get(taskId) || [];
        if (limit) {
            return logs.slice(-limit);
        }
        return logs;
    }
    /**
     * Clear logs for a task
     */
    clearTaskLogs(taskId) {
        this.taskLogs.delete(taskId);
        const task = this.tasks.get(taskId);
        if (task) {
            task.logs = [];
        }
    }
}
exports.DownloadTaskManager = DownloadTaskManager;
// Singleton instance
exports.downloadTaskManager = new DownloadTaskManager();
//# sourceMappingURL=DownloadTaskManager.js.map