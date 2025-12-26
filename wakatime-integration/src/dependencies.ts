// Dependencies Manager
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Logger } from './logger';
import * as https from 'https';
import * as child_process from 'child_process';

export class Dependencies {
  private wakatimeCLIPath: string;
  private wakatimeCLIVersion: string = '1.73.1';
  
  constructor(private logger: Logger) {
    const homeDir = os.homedir();
    this.wakatimeCLIPath = path.join(homeDir, '.wakatime', 'wakatime-cli');
    
    if (os.platform() === 'win32') {
      this.wakatimeCLIPath += '.exe';
    }
  }

  public async checkAndInstall(): Promise<boolean> {
    if (await this.isInstalled()) {
      this.logger.debug('WakaTime CLI already installed');
      return true;
    }

    this.logger.info('Installing WakaTime CLI...');
    return await this.install();
  }

  private async isInstalled(): Promise<boolean> {
    return fs.existsSync(this.wakatimeCLIPath);
  }

  private async install(): Promise<boolean> {
    try {
      const downloadUrl = this.getDownloadUrl();
      
      const wakatimeDir = path.dirname(this.wakatimeCLIPath);
      if (!fs.existsSync(wakatimeDir)) {
        fs.mkdirSync(wakatimeDir, { recursive: true });
      }

      await this.downloadFile(downloadUrl, this.wakatimeCLIPath);

      // Make executable on Unix
      if (os.platform() !== 'win32') {
        fs.chmodSync(this.wakatimeCLIPath, '755');
      }

      this.logger.info('WakaTime CLI installed successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to install WakaTime CLI:', error);
      return false;
    }
  }

  private getDownloadUrl(): string {
    const platform = os.platform();
    const arch = os.arch();
    const baseUrl = 'https://github.com/wakatime/wakatime-cli/releases/download';
    
    let osName = '';
    let archName = '';

    switch (platform) {
      case 'win32':
        osName = 'windows';
        break;
      case 'darwin':
        osName = 'darwin';
        break;
      case 'linux':
        osName = 'linux';
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    switch (arch) {
      case 'x64':
        archName = 'amd64';
        break;
      case 'arm64':
        archName = 'arm64';
        break;
      case 'ia32':
        archName = '386';
        break;
      default:
        archName = 'amd64';
    }

    const filename = platform === 'win32' 
      ? `wakatime-cli-${osName}-${archName}.exe`
      : `wakatime-cli-${osName}-${archName}`;

    return `${baseUrl}/v${this.wakatimeCLIVersion}/${filename}`;
  }

  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          file.close();
          fs.unlinkSync(dest);
          return this.downloadFile(response.headers.location!, dest)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          fs.unlinkSync(dest);
          reject(err);
        });
      }).on('error', (err) => {
        fs.unlinkSync(dest);
        reject(err);
      });
    });
  }

  public getCLIPath(): string {
    return this.wakatimeCLIPath;
  }

  public async getVersion(): Promise<string | null> {
    try {
      const result = child_process.execSync(`"${this.wakatimeCLIPath}" --version`, {
        encoding: 'utf8'
      });
      return result.trim();
    } catch (error) {
      this.logger.error('Failed to get CLI version:', error);
      return null;
    }
  }
}
