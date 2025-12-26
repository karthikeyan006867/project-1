"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityTracker = void 0;
class ActivityTracker {
    constructor(api, logger) {
        this.api = api;
        this.logger = logger;
        this.heartbeatQueue = [];
        this.category = 'coding';
        this.flushInterval = null;
        this.maxQueueSize = 100;
        this.flushIntervalMs = 60000; // 1 minute
        this.startFlushInterval();
    }
    async sendHeartbeat(heartbeat) {
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
        }
        catch (error) {
            this.logger.error('Error adding heartbeat to queue:', error);
        }
    }
    setCategory(category) {
        this.category = category;
        this.logger.debug(`Category changed to: ${category}`);
    }
    getCategory() {
        return this.category;
    }
    startFlushInterval() {
        this.flushInterval = setInterval(() => {
            this.flush();
        }, this.flushIntervalMs);
    }
    async flush() {
        if (this.heartbeatQueue.length === 0)
            return;
        const heartbeats = [...this.heartbeatQueue];
        this.heartbeatQueue = [];
        try {
            if (heartbeats.length === 1) {
                await this.api.sendHeartbeat(heartbeats[0]);
            }
            else {
                await this.api.sendBulkHeartbeats(heartbeats);
            }
            this.logger.debug(`Flushed ${heartbeats.length} heartbeat(s)`);
        }
        catch (error) {
            this.logger.error('Failed to flush heartbeats:', error);
            // Re-add failed heartbeats to queue
            this.heartbeatQueue.unshift(...heartbeats);
        }
    }
    dispose() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        // Flush remaining heartbeats
        this.flush();
    }
}
exports.ActivityTracker = ActivityTracker;
//# sourceMappingURL=activity-tracker.js.map