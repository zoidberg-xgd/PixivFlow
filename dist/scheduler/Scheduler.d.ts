import { SchedulerConfig } from '../config';
export declare class Scheduler {
    private readonly config;
    private task;
    private running;
    constructor(config: SchedulerConfig);
    start(job: () => Promise<void>): void;
    stop(): void;
}
//# sourceMappingURL=Scheduler.d.ts.map