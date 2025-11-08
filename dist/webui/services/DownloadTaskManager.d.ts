import { StandaloneConfig } from '../../config';
export interface TaskLogEntry {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
}
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
    logs?: TaskLogEntry[];
}
export declare class DownloadTaskManager {
    private tasks;
    private taskLogs;
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
    /**
     * Update progress for a task
     */
    updateProgress(taskId: string, progress: {
        current: number;
        total: number;
        message?: string;
    }): void;
    /**
     * Get progress callback for a task
     */
    getProgressCallback(taskId: string): (current: number, total: number, message?: string) => void;
    /**
     * Add a log entry for a task
     */
    addLog(taskId: string, level: 'info' | 'warn' | 'error' | 'debug', message: string): void;
    /**
     * Get logs for a task
     */
    getTaskLogs(taskId: string, limit?: number): TaskLogEntry[];
    /**
     * Clear logs for a task
     */
    clearTaskLogs(taskId: string): void;
}
export declare const downloadTaskManager: DownloadTaskManager;
//# sourceMappingURL=DownloadTaskManager.d.ts.map