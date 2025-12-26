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
exports.ConfigManager = void 0;
// Configuration Manager
const vscode = __importStar(require("vscode"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class ConfigManager {
    constructor() {
        this.configSection = 'wakatime';
        this.configFile = path.join(os.homedir(), '.wakatime.cfg');
    }
    async getApiKey() {
        // Try VS Code settings first
        const config = vscode.workspace.getConfiguration(this.configSection);
        let apiKey = config.get('apiKey');
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
    async setApiKey(apiKey) {
        // Save to VS Code settings
        const config = vscode.workspace.getConfiguration(this.configSection);
        await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
        // Also save to .wakatime.cfg file
        this.writeApiKeyToFile(apiKey);
    }
    readApiKeyFromFile() {
        try {
            if (fs.existsSync(this.configFile)) {
                const content = fs.readFileSync(this.configFile, 'utf8');
                const match = content.match(/api_key\s*=\s*([a-zA-Z0-9-_]+)/);
                if (match) {
                    return match[1];
                }
            }
        }
        catch (error) {
            console.error('Error reading API key from file:', error);
        }
        return undefined;
    }
    writeApiKeyToFile(apiKey) {
        try {
            let content = '';
            if (fs.existsSync(this.configFile)) {
                content = fs.readFileSync(this.configFile, 'utf8');
            }
            if (content.includes('api_key')) {
                content = content.replace(/api_key\s*=\s*[^\n]*/, `api_key = ${apiKey}`);
            }
            else {
                content += `\n[settings]\napi_key = ${apiKey}\n`;
            }
            fs.writeFileSync(this.configFile, content, 'utf8');
        }
        catch (error) {
            console.error('Error writing API key to file:', error);
        }
    }
    getDebugMode() {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get('debug', false);
    }
    getDisabled() {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get('disabled', false);
    }
    getProxy() {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get('proxy');
    }
    getStatusBarEnabled() {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get('statusBarEnabled', true);
    }
    getHeartbeatInterval() {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get('heartbeatInterval', 120);
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config-manager.js.map