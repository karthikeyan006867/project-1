// Configuration Manager
import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export class ConfigManager {
  private configSection = 'wakatime';
  private configFile: string;

  constructor() {
    this.configFile = path.join(os.homedir(), '.wakatime.cfg');
  }

  public async getApiKey(): Promise<string | undefined> {
    // Try VS Code settings first
    const config = vscode.workspace.getConfiguration(this.configSection);
    let apiKey = config.get<string>('apiKey');

    if (apiKey) {
      return apiKey;
    }

    // Try .wakatime.cfg file
    apiKey = this.readApiKeyFromFile();
    if (apiKey) {
      return apiKey;
    }

    // Try environment variable
    apiKey = process.env.WAKATIME_API_KEY;
    if (apiKey) {
      return apiKey;
    }

    return undefined;
  }

  public async setApiKey(apiKey: string): Promise<void> {
    // Save to VS Code settings
    const config = vscode.workspace.getConfiguration(this.configSection);
    await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);

    // Also save to .wakatime.cfg file
    this.writeApiKeyToFile(apiKey);
  }

  private readApiKeyFromFile(): string | undefined {
    try {
      if (fs.existsSync(this.configFile)) {
        const content = fs.readFileSync(this.configFile, 'utf8');
        const match = content.match(/api_key\s*=\s*([a-zA-Z0-9-_]+)/);
        if (match) {
          return match[1];
        }
      }
    } catch (error) {
      console.error('Error reading API key from file:', error);
    }
    return undefined;
  }

  private writeApiKeyToFile(apiKey: string): void {
    try {
      let content = '';
      
      if (fs.existsSync(this.configFile)) {
        content = fs.readFileSync(this.configFile, 'utf8');
      }

      if (content.includes('api_key')) {
        content = content.replace(/api_key\s*=\s*[^\n]*/, `api_key = ${apiKey}`);
      } else {
        content += `\n[settings]\napi_key = ${apiKey}\n`;
      }

      fs.writeFileSync(this.configFile, content, 'utf8');
    } catch (error) {
      console.error('Error writing API key to file:', error);
    }
  }

  public getDebugMode(): boolean {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<boolean>('debug', false);
  }

  public getDisabled(): boolean {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<boolean>('disabled', false);
  }

  public getProxy(): string | undefined {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<string>('proxy');
  }

  public getStatusBarEnabled(): boolean {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<boolean>('statusBarEnabled', true);
  }

  public getHeartbeatInterval(): number {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<number>('heartbeatInterval', 120);
  }
}
