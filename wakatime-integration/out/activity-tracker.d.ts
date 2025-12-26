import { WakaTimeAPI, Heartbeat } from './wakatime-api';
import { Logger } from './logger';
export declare class ActivityTracker {
    private api;
    private logger;
    private heartbeatQueue;
    private category;
    private flushInterval;
    private maxQueueSize;
    private flushIntervalMs;
    constructor(api: WakaTimeAPI, logger: Logger);
    sendHeartbeat(heartbeat: Heartbeat): Promise<void>;
    setCategory(category: string): void;
    getCategory(): string;
    private startFlushInterval;
    flush(): Promise<void>;
    dispose(): void;
}
//# sourceMappingURL=activity-tracker.d.ts.map