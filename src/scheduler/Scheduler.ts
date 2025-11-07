import cron, { ScheduledTask } from 'node-cron';

import { SchedulerConfig } from '../config';
import { logger } from '../logger';

export class Scheduler {
  private task: ScheduledTask | null = null;
  private running = false;

  constructor(private readonly config: SchedulerConfig) {}

  public start(job: () => Promise<void>) {
    if (!cron.validate(this.config.cron)) {
      throw new Error(`Invalid cron expression: ${this.config.cron}`);
    }

    this.task = cron.schedule(
      this.config.cron,
      async () => {
        if (this.running) {
          logger.warn('Skipping scheduled job because previous run is still in progress');
          return;
        }

        this.running = true;
        logger.info('Starting scheduled Pixiv download job');
        try {
          await job();
          logger.info('Scheduled Pixiv download job completed');
        } catch (error) {
          logger.error('Scheduled Pixiv download job failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        } finally {
          this.running = false;
        }
      },
      {
        timezone: this.config.timezone,
      }
    );

    logger.info('Scheduler initialised', {
      cron: this.config.cron,
      timezone: this.config.timezone ?? 'system',
    });
  }

  public stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
  }
}

