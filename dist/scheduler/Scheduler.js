"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("../logger");
class Scheduler {
    config;
    database;
    task = null;
    running = false;
    lastExecutionTime = 0;
    executionCount = 0;
    consecutiveFailures = 0;
    timeoutHandle = null;
    stopped = false;
    constructor(config, database) {
        this.config = config;
        this.database = database;
    }
    start(job) {
        if (!node_cron_1.default.validate(this.config.cron)) {
            throw new Error(`Invalid cron expression: ${this.config.cron}`);
        }
        // Load initial execution count from database
        if (this.database) {
            const stats = this.database.getSchedulerStats();
            this.executionCount = stats.totalExecutions;
            this.consecutiveFailures = this.database.getConsecutiveFailures();
        }
        logger_1.logger.info('Scheduler initialised', {
            cron: this.config.cron,
            timezone: this.config.timezone ?? 'system',
            maxExecutions: this.config.maxExecutions ?? 'unlimited',
            minInterval: this.config.minInterval ? `${this.config.minInterval}ms` : 'none',
            timeout: this.config.timeout ? `${this.config.timeout}ms` : 'none',
            maxConsecutiveFailures: this.config.maxConsecutiveFailures ?? 'unlimited',
            currentExecutionCount: this.executionCount,
            currentConsecutiveFailures: this.consecutiveFailures,
        });
        this.task = node_cron_1.default.schedule(this.config.cron, async () => {
            await this.executeJob(job);
        }, {
            timezone: this.config.timezone,
        });
    }
    async executeJob(job) {
        // Check if already running
        if (this.running) {
            logger_1.logger.warn('Skipping scheduled job because previous run is still in progress');
            return;
        }
        // Check if stopped
        if (this.stopped) {
            logger_1.logger.info('Scheduler is stopped, skipping execution');
            return;
        }
        // Check minimum interval
        const now = Date.now();
        if (this.config.minInterval && this.lastExecutionTime > 0) {
            const timeSinceLastExecution = now - this.lastExecutionTime;
            if (timeSinceLastExecution < this.config.minInterval) {
                logger_1.logger.warn(`Skipping scheduled job: minimum interval not met (${timeSinceLastExecution}ms < ${this.config.minInterval}ms)`);
                return;
            }
        }
        // Check max executions
        if (this.config.maxExecutions && this.executionCount >= this.config.maxExecutions) {
            logger_1.logger.info(`Maximum executions reached (${this.executionCount}/${this.config.maxExecutions}), stopping scheduler`);
            this.stop();
            return;
        }
        // Check consecutive failures
        if (this.config.maxConsecutiveFailures &&
            this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
            logger_1.logger.error(`Maximum consecutive failures reached (${this.consecutiveFailures}/${this.config.maxConsecutiveFailures}), stopping scheduler`);
            this.stop();
            return;
        }
        // Apply failure retry delay if needed
        if (this.config.failureRetryDelay && this.consecutiveFailures > 0) {
            logger_1.logger.info(`Waiting ${this.config.failureRetryDelay}ms before retry after ${this.consecutiveFailures} consecutive failures`);
            await new Promise((resolve) => setTimeout(resolve, this.config.failureRetryDelay));
        }
        this.running = true;
        this.lastExecutionTime = now;
        this.executionCount++;
        const executionNumber = this.database?.getNextExecutionNumber() ?? this.executionCount;
        const startTime = new Date();
        let status = 'success';
        let errorMessage = null;
        let itemsDownloaded = 0;
        let timeoutOccurred = false;
        logger_1.logger.info(`Starting scheduled Pixiv download job (execution #${executionNumber})`);
        // Set up timeout if configured
        if (this.config.timeout) {
            this.timeoutHandle = setTimeout(() => {
                if (this.running) {
                    logger_1.logger.error(`Job execution timeout after ${this.config.timeout}ms`);
                    timeoutOccurred = true;
                    status = 'timeout';
                    errorMessage = `Execution timeout after ${this.config.timeout}ms`;
                    this.running = false;
                }
            }, this.config.timeout);
        }
        try {
            // Wrap job execution to track items downloaded
            await this.executeWithTracking(job, (count) => {
                itemsDownloaded = count;
            });
            if (timeoutOccurred) {
                // Timeout occurred
                status = 'timeout';
                this.consecutiveFailures++;
            }
            else {
                status = 'success';
                this.consecutiveFailures = 0;
                logger_1.logger.info(`Scheduled Pixiv download job completed (execution #${executionNumber})`, {
                    itemsDownloaded,
                });
            }
        }
        catch (error) {
            status = 'failed';
            errorMessage = error instanceof Error ? error.message : String(error);
            this.consecutiveFailures++;
            logger_1.logger.error(`Scheduled Pixiv download job failed (execution #${executionNumber})`, {
                error: errorMessage,
                consecutiveFailures: this.consecutiveFailures,
            });
        }
        finally {
            // Clear timeout
            if (this.timeoutHandle) {
                clearTimeout(this.timeoutHandle);
                this.timeoutHandle = null;
            }
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            // Log to database if available
            if (this.database) {
                this.database.logSchedulerExecution(executionNumber, status, startTime, endTime, duration, errorMessage, itemsDownloaded);
            }
            this.running = false;
            // Check if we should stop after this execution
            if ((this.config.maxExecutions && this.executionCount >= this.config.maxExecutions) ||
                (this.config.maxConsecutiveFailures &&
                    this.consecutiveFailures >= this.config.maxConsecutiveFailures)) {
                logger_1.logger.info('Stopping scheduler due to limit reached');
                this.stop();
            }
        }
    }
    /**
     * Execute job with tracking of downloaded items
     * This is a simplified version - in a real implementation, you might want to
     * pass a callback to DownloadManager to track items as they're downloaded
     */
    async executeWithTracking(job, onItemsDownloaded) {
        // For now, we'll just execute the job
        // In a more sophisticated implementation, we could track downloads
        // by intercepting DownloadManager calls or using a shared counter
        await job();
        // Note: itemsDownloaded tracking would need to be implemented
        // by modifying DownloadManager to report counts, or by querying the database
    }
    stop() {
        this.stopped = true;
        if (this.task) {
            this.task.stop();
            this.task = null;
        }
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = null;
        }
        logger_1.logger.info('Scheduler stopped', {
            totalExecutions: this.executionCount,
            consecutiveFailures: this.consecutiveFailures,
        });
    }
    getStats() {
        return {
            executionCount: this.executionCount,
            consecutiveFailures: this.consecutiveFailures,
            running: this.running,
            stopped: this.stopped,
            lastExecutionTime: this.lastExecutionTime,
        };
    }
}
exports.Scheduler = Scheduler;
//# sourceMappingURL=Scheduler.js.map