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
exports.StatusBar = void 0;
// Status Bar Manager
const vscode = __importStar(require("vscode"));
class StatusBar {
    constructor() {
        this.lastUpdate = 0;
        this.status = 'Idle';
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    }
    initialize() {
        this.statusBarItem.text = '$(pulse) WakaTime';
        this.statusBarItem.tooltip = 'Click to view WakaTime dashboard';
        this.statusBarItem.command = 'wakatime.dashboard';
        this.statusBarItem.show();
    }
    updateStatus(status, message) {
        this.status = status;
        this.lastUpdate = Date.now();
        switch (status) {
            case 'Active':
                this.statusBarItem.text = '$(pulse) WakaTime: Active';
                this.statusBarItem.tooltip = message || 'Tracking time...';
                this.statusBarItem.backgroundColor = undefined;
                break;
            case 'Idle':
                this.statusBarItem.text = '$(circle-outline) WakaTime: Idle';
                this.statusBarItem.tooltip = message || 'Waiting for activity...';
                this.statusBarItem.backgroundColor = undefined;
                break;
            case 'Error':
                this.statusBarItem.text = '$(alert) WakaTime: Error';
                this.statusBarItem.tooltip = message || 'Error occurred';
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
        }
    }
    updateCodingTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        let timeStr = '';
        if (hours > 0) {
            timeStr = `${hours}h ${minutes}m`;
        }
        else {
            timeStr = `${minutes}m`;
        }
        this.statusBarItem.text = `$(pulse) ${timeStr} today`;
        this.statusBarItem.tooltip = `WakaTime: ${timeStr} coded today\nClick to view dashboard`;
    }
    hide() {
        this.statusBarItem.hide();
    }
    show() {
        this.statusBarItem.show();
    }
    dispose() {
        this.statusBarItem.dispose();
    }
}
exports.StatusBar = StatusBar;
//# sourceMappingURL=status-bar.js.map