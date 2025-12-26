"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dependencies = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const https = __importStar(require("https"));
const child_process = __importStar(require("child_process"));
class Dependencies {
    constructor(logger) {
        this.logger = logger;
        this.wakatimeCLIVersion = '1.73.1';
        const homeDir = os.homedir();
        this.wakatimeCLIPath = path.join(homeDir, '.wakatime', 'wakatime-cli');
        if (os.platform() === 'win32') {
            this.wakatimeCLIPath += '.exe';
        }
    }
    async checkAndInstall() {
        if (await this.isInstalled()) {
            this.logger.debug('WakaTime CLI already installed');
            return true;
        }
        this.logger.info('Installing WakaTime CLI...');
        return await this.install();
    }
    async isInstalled() {
        return fs.existsSync(this.wakatimeCLIPath);
    }
    async install() {
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
        }
        catch (error) {
            this.logger.error('Failed to install WakaTime CLI:', error);
            return false;
        }
    }
    getDownloadUrl() {
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
    downloadFile(url, dest) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest);
            https.get(url, (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    // Follow redirect
                    file.close();
                    fs.unlinkSync(dest);
                    return this.downloadFile(response.headers.location, dest)
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
    getCLIPath() {
        return this.wakatimeCLIPath;
    }
    async getVersion() {
        try {
            const result = child_process.execSync(`"${this.wakatimeCLIPath}" --version`, {
                encoding: 'utf8'
            });
            return result.trim();
        }
        catch (error) {
            this.logger.error('Failed to get CLI version:', error);
            return null;
        }
    }
}
exports.Dependencies = Dependencies;
//# sourceMappingURL=dependencies.js.map