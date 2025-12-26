// Activity Tracker
import { WakaTimeAPI, Heartbeat } from './wakatime-api';
import { Logger } from './logger';

export class ActivityTracker {
  private heartbeatQueue: Heartbeat[] = [];
  private category: string = 'coding';
  private flushInterval: NodeJS.Timeout | null = null;
  private maxQueueSize: number = 100;
  private flushIntervalMs: number = 60000; // 1 minute

  constructor(
    private api: WakaTimeAPI,
    private logger: Logger
  ) {
    this.startFlushInterval();
  }

  public async sendHeartbeat(heartbeat: Heartbeat): Promise<void> {
    try {
      // Add to queue
      this.heartbeatQueue.push({
        ...heartbeat,
        category: heartbeat.category || this.category
      });

      // Flush if queue is full
      if (this.heartbeatQueue.length >= this.maxQueueSize) {
        await this.flush();
      }
    } catch (error) {
      this.logger.error('Error adding heartbeat to queue:', error);
    }
  }

  public setCategory(category: string): void {
    this.category = category;
    this.logger.debug(`Category changed to: ${category}`);
  }

  public getCategory(): string {
    return this.category;
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  public async flush(): Promise<void> {
    if (this.heartbeatQueue.length === 0) return;

    const heartbeats = [...this.heartbeatQueue];
    this.heartbeatQueue = [];

    try {
      if (heartbeats.length === 1) {
        await this.api.sendHeartbeat(heartbeats[0]);
      } else {
        await this.api.sendBulkHeartbeats(heartbeats);
      }
      
      this.logger.debug(`Flushed ${heartbeats.length} heartbeat(s)`);
    } catch (error) {
      this.logger.error('Failed to flush heartbeats:', error);
      // Re-add failed heartbeats to queue
      this.heartbeatQueue.unshift(...heartbeats);
    }
  }

  public dispose(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush remaining heartbeats
    this.flush();
  }
}
