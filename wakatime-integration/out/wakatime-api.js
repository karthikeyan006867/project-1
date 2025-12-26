"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WakaTimeAPI = void 0;
// WakaTime API Client
const axios_1 = __importDefault(require("axios"));
class WakaTimeAPI {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.apiUrl = 'https://api.wakatime.com/api/v1';
        this.client = axios_1.default.create({
            baseURL: this.apiUrl,
            timeout: 30000,
            headers: {
                'User-Agent': 'wakatime-vscode-integration/1.0.0'
            }
        });
        // Add request interceptor for auth
        this.client.interceptors.request.use(async (config) => {
            const apiKey = await this.config.getApiKey();
            if (apiKey) {
                config.headers.Authorization = `Bearer ${apiKey}`;
            }
            return config;
        });
        // Add response interceptor for logging
        this.client.interceptors.response.use((response) => response, (error) => {
            this.logger.error('API request failed:', error.message);
            return Promise.reject(error);
        });
    }
    async sendHeartbeat(heartbeat) {
        try {
            const response = await this.client.post('/users/current/heartbeats', {
                ...heartbeat,
                entity_type: heartbeat.type
            });
            this.logger.debug('Heartbeat sent successfully:', heartbeat.entity);
            return response.status === 201 || response.status === 202;
        }
        catch (error) {
            this.logger.error('Failed to send heartbeat:', error);
            return false;
        }
    }
    async sendBulkHeartbeats(heartbeats) {
        try {
            const response = await this.client.post('/users/current/heartbeats.bulk', heartbeats.map(hb => ({
                ...hb,
                entity_type: hb.type
            })));
            this.logger.debug(`Sent ${heartbeats.length} heartbeats in bulk`);
            return response.status === 201 || response.status === 202;
        }
        catch (error) {
            this.logger.error('Failed to send bulk heartbeats:', error);
            return false;
        }
    }
    async getToday() {
        try {
            const response = await this.client.get('/users/current/summaries', {
                params: {
                    start: new Date().toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0]
                }
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to get today stats:', error);
            return null;
        }
    }
    async getStats(range = 'last_7_days') {
        try {
            const response = await this.client.get(`/users/current/stats/${range}`);
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to get stats:', error);
            return null;
        }
    }
    async getProjects() {
        try {
            const response = await this.client.get('/users/current/projects');
            return response.data.data || [];
        }
        catch (error) {
            this.logger.error('Failed to get projects:', error);
            return [];
        }
    }
    async getUserInfo() {
        try {
            const response = await this.client.get('/users/current');
            return response.data.data;
        }
        catch (error) {
            this.logger.error('Failed to get user info:', error);
            return null;
        }
    }
    async getLeaderboards() {
        try {
            const response = await this.client.get('/leaders');
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to get leaderboards:', error);
            return null;
        }
    }
    async getGoals() {
        try {
            const response = await this.client.get('/users/current/goals');
            return response.data.data || [];
        }
        catch (error) {
            this.logger.error('Failed to get goals:', error);
            return [];
        }
    }
}
exports.WakaTimeAPI = WakaTimeAPI;
//# sourceMappingURL=wakatime-api.js.map