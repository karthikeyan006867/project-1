import { Logger } from './logger';
import { ConfigManager } from './config-manager';
export interface Heartbeat {
    entity: string;
    type: 'file' | 'app' | 'domain';
    category?: string;
    time: number;
    project?: string;
    branch?: string;
    language?: string;
    dependencies?: string[];
    isWrite?: boolean;
    lineCount?: number;
    lineno?: number;
    cursorpos?: number;
}
export interface TodayStats {
    data: {
        grand_total: {
            total_seconds: number;
            digital: string;
            text: string;
        };
        categories: Array<{
            name: string;
            total_seconds: number;
            percent: number;
        }>;
        languages: Array<{
            name: string;
            total_seconds: number;
            percent: number;
        }>;
        projects: Array<{
            name: string;
            total_seconds: number;
            percent: number;
        }>;
    };
}
export declare class WakaTimeAPI {
    private config;
    private logger;
    private client;
    private apiUrl;
    constructor(config: ConfigManager, logger: Logger);
    sendHeartbeat(heartbeat: Heartbeat): Promise<boolean>;
    sendBulkHeartbeats(heartbeats: Heartbeat[]): Promise<boolean>;
    getToday(): Promise<TodayStats | null>;
    getStats(range?: 'last_7_days' | 'last_30_days' | 'last_6_months' | 'last_year'): Promise<any>;
    getProjects(): Promise<any[]>;
    getUserInfo(): Promise<any>;
    getLeaderboards(): Promise<any>;
    getGoals(): Promise<any[]>;
}
//# sourceMappingURL=wakatime-api.d.ts.map