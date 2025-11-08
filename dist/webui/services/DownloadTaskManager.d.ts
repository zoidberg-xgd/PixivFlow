import { StandaloneConfig } from '../../config';
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
export declare class DownloadTaskManager {
    private tasks;
    private activeTask;
    /**
     * Start a download task
     */
    startTask(taskId: string, targetId?: string, customConfig?: Partial<StandaloneConfig>): Promise<void>;
    /**
     * Stop the active download task
     */
    stopTask(taskId: string): Promise<void>;
    /**
     * Get task status
     */
    getTaskStatus(taskId: string): TaskStatus | null;
    /**
     * Get all tasks
     */
    getAllTasks(): TaskStatus[];
    /**
     * Get active task
     */
    getActiveTask(): TaskStatus | null;
    /**
     * Check if there's an active task
     */
    hasActiveTask(): boolean;
}
export declare const downloadTaskManager: DownloadTaskManager;
//# sourceMappingURL=DownloadTaskManager.d.ts.map