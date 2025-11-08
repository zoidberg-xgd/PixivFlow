import { DownloadManager } from '../../download/DownloadManager';
import { PixivClient } from '../../pixiv/PixivClient';
import { PixivAuth } from '../../pixiv/AuthClient';
import { Database } from '../../storage/Database';
import { FileService } from '../../download/FileService';
import { StandaloneConfig, loadConfig, getConfigPath } from '../../config';
import { logger } from '../../logger';

export interface TaskStatus {
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  progress?: {
    current: number;
    total: number;
    message?: string;
  };
  startTime: Date;
  endTime?: Date;
  error?: string;
  targetId?: string;
}

export class DownloadTaskManager {
  private tasks = new Map<string, TaskStatus>();
  private activeTask: {
    taskId: string;
    manager: DownloadManager;
    database: Database;
    promise: Promise<void>;
    abortController: AbortController;
  } | null = null;

  /**
   * Start a download task
   */
  async startTask(
    taskId: string,
    targetId?: string,
    customConfig?: Partial<StandaloneConfig>
  ): Promise<void> {
    // Check if there's already an active task
    if (this.activeTask) {
      throw new Error('Another download task is already running');
    }

    const configPath = getConfigPath();
    let config = loadConfig(configPath);

    // Merge custom config if provided
    if (customConfig) {
      config = { ...config, ...customConfig };
    }

    // If targetId is provided, filter targets
    if (targetId && config.targets) {
      const target = config.targets.find((t, idx) => 
        idx.toString() === targetId || t.tag === targetId
      );
      if (target) {
        config = { ...config, targets: [target] };
      }
    }

    const database = new Database(config.storage!.databasePath!);
    database.migrate();

    const auth = new PixivAuth(config.pixiv, config.network!, database, configPath);
    const pixivClient = new PixivClient(auth, config);
    const fileService = new FileService(config.storage!);
    const downloadManager = new DownloadManager(config, pixivClient, database, fileService);

    await downloadManager.initialise();

    const abortController = new AbortController();
    const taskStatus: TaskStatus = {
      taskId,
      status: 'running',
      startTime: new Date(),
      targetId,
    };
    this.tasks.set(taskId, taskStatus);

    const promise = (async () => {
      try {
        logger.info(`Starting download task ${taskId}`);
        await downloadManager.runAllTargets();
        
        taskStatus.status = 'completed';
        taskStatus.endTime = new Date();
        logger.info(`Download task ${taskId} completed`);
      } catch (error) {
        taskStatus.status = 'failed';
        taskStatus.error = error instanceof Error ? error.message : String(error);
        taskStatus.endTime = new Date();
        logger.error(`Download task ${taskId} failed`, { error });
        throw error;
      } finally {
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
  async stopTask(taskId: string): Promise<void> {
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
      
      logger.info(`Download task ${taskId} stopped`);
    }
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): TaskStatus | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Get all tasks
   */
  getAllTasks(): TaskStatus[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime()
    );
  }

  /**
   * Get active task
   */
  getActiveTask(): TaskStatus | null {
    if (!this.activeTask) {
      return null;
    }
    return this.tasks.get(this.activeTask.taskId) || null;
  }

  /**
   * Check if there's an active task
   */
  hasActiveTask(): boolean {
    return this.activeTask !== null;
  }
}

// Singleton instance
export const downloadTaskManager = new DownloadTaskManager();

