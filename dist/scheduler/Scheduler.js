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
    task = null;
    running = false;
    constructor(config) {
        this.config = config;
    }
    start(job) {
        if (!node_cron_1.default.validate(this.config.cron)) {
            throw new Error(`Invalid cron expression: ${this.config.cron}`);
        }
        this.task = node_cron_1.default.schedule(this.config.cron, async () => {
            if (this.running) {
                logger_1.logger.warn('Skipping scheduled job because previous run is still in progress');
                return;
            }
            this.running = true;
            logger_1.logger.info('Starting scheduled Pixiv download job');
            try {
                await job();
                logger_1.logger.info('Scheduled Pixiv download job completed');
            }
            catch (error) {
                logger_1.logger.error('Scheduled Pixiv download job failed', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            finally {
                this.running = false;
            }
        }, {
            timezone: this.config.timezone,
        });
        logger_1.logger.info('Scheduler initialised', {
            cron: this.config.cron,
            timezone: this.config.timezone ?? 'system',
        });
    }
    stop() {
        if (this.task) {
            this.task.stop();
            this.task = null;
        }
    }
}
exports.Scheduler = Scheduler;
//# sourceMappingURL=Scheduler.js.map