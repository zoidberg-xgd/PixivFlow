import { SchedulerConfig } from '../config';
import { Database } from '../storage/Database';
export declare class Scheduler {
    private readonly config;
    private readonly database?;
    private task;
    private running;
    private lastExecutionTime;
    private executionCount;
    private consecutiveFailures;
    private timeoutHandle;
    private stopped;
    constructor(config: SchedulerConfig, database?: Database | undefined);
    start(job: () => Promise<void>): void;
    private executeJob;
    /**
     * Execute job with tracking of downloaded items
     * This is a simplified version - in a real implementation, you might want to
     * pass a callback to DownloadManager to track items as they're downloaded
     */
    private executeWithTracking;
    stop(): void;
    getStats(): {
        executionCount: number;
        consecutiveFailures: number;
        running: boolean;
        stopped: boolean;
        lastExecutionTime: number;
    };
}
//# sourceMappingURL=Scheduler.d.ts.map