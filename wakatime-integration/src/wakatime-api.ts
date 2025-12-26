// WakaTime API Client
import axios, { AxiosInstance } from 'axios';
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

export class WakaTimeAPI {
  private client: AxiosInstance;
  private apiUrl: string = 'https://api.wakatime.com/api/v1';

  constructor(
    private config: ConfigManager,
    private logger: Logger
  ) {
    this.client = axios.create({
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
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error('API request failed:', error.message);
        return Promise.reject(error);
      }
    );
  }

  public async sendHeartbeat(heartbeat: Heartbeat): Promise<boolean> {
    try {
      const response = await this.client.post('/users/current/heartbeats', {
        ...heartbeat,
        entity_type: heartbeat.type
      });

      // Also send to HackaTime (Hack Club) via local server
      try {
        await axios.post('http://localhost:5000/api/hackatime/heartbeat', heartbeat);
        this.logger.debug('Heartbeat sent to HackaTime');
      } catch (hackatimeError: any) {
        this.logger.warn('Failed to send to HackaTime:', hackatimeError.message);
      }

      this.logger.debug('Heartbeat sent successfully:', heartbeat.entity);
      return response.status === 201 || response.status === 202;
    } catch (error) {
      this.logger.error('Failed to send heartbeat:', error);
      return false;
    }
  }

  public async sendBulkHeartbeats(heartbeats: Heartbeat[]): Promise<boolean> {
    try {
      const response = await this.client.post('/users/current/heartbeats.bulk', 
        heartbeats.map(hb => ({
          ...hb,
          entity_type: hb.type
        }))
      );

      // Also send to HackaTime (Hack Club) via local server
      try {
        await axios.post('http://localhost:5000/api/hackatime/heartbeats', heartbeats);
        this.logger.debug(`Sent ${heartbeats.length} heartbeats to HackaTime`);
      } catch (hackatimeError: any) {
        this.logger.warn('Failed to send bulk to HackaTime:', hackatimeError.message);
      }

      this.logger.debug(`Sent ${heartbeats.length} heartbeats in bulk`);
      return response.status === 201 || response.status === 202;
    } catch (error) {
      this.logger.error('Failed to send bulk heartbeats:', error);
      return false;
    }
  }

  public async getToday(): Promise<TodayStats | null> {
    try {
      const response = await this.client.get<TodayStats>('/users/current/summaries', {
        params: {
          start: new Date().toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get today stats:', error);
      return null;
    }
  }

  public async getStats(range: 'last_7_days' | 'last_30_days' | 'last_6_months' | 'last_year' = 'last_7_days'): Promise<any> {
    try {
      const response = await this.client.get(`/users/current/stats/${range}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get stats:', error);
      return null;
    }
  }

  public async getProjects(): Promise<any[]> {
    try {
      const response = await this.client.get('/users/current/projects');
      return response.data.data || [];
    } catch (error) {
      this.logger.error('Failed to get projects:', error);
      return [];
    }
  }

  public async getUserInfo(): Promise<any> {
    try {
      const response = await this.client.get('/users/current');
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to get user info:', error);
      return null;
    }
  }

  public async getLeaderboards(): Promise<any> {
    try {
      const response = await this.client.get('/leaders');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get leaderboards:', error);
      return null;
    }
  }

  public async getGoals(): Promise<any[]> {
    try {
      const response = await this.client.get('/users/current/goals');
      return response.data.data || [];
    } catch (error) {
      this.logger.error('Failed to get goals:', error);
      return [];
    }
  }
}
