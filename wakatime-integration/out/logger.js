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
exports.Logger = void 0;
// Logger utility
const vscode = __importStar(require("vscode"));
class Logger {
    constructor(name = 'WakaTime') {
        this.debugMode = false;
        this.outputChannel = vscode.window.createOutputChannel(name);
    }
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    debug(message, ...args) {
        if (this.debugMode) {
            const timestamp = new Date().toISOString();
            const formattedMessage = this.formatMessage('DEBUG', timestamp, message, args);
            this.outputChannel.appendLine(formattedMessage);
        }
    }
    info(message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedMessage = this.formatMessage('INFO', timestamp, message, args);
        this.outputChannel.appendLine(formattedMessage);
    }
    warn(message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedMessage = this.formatMessage('WARN', timestamp, message, args);
        this.outputChannel.appendLine(formattedMessage);
        if (this.debugMode) {
            vscode.window.showWarningMessage(`WakaTime: ${message}`);
        }
    }
    error(message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedMessage = this.formatMessage('ERROR', timestamp, message, args);
        this.outputChannel.appendLine(formattedMessage);
        if (args.length > 0 && args[0] instanceof Error) {
            this.outputChannel.appendLine(args[0].stack || '');
        }
    }
    show() {
        this.outputChannel.show();
    }
    dispose() {
        this.outputChannel.dispose();
    }
    formatMessage(level, timestamp, message, args) {
        let formatted = `[${timestamp}] [${level}] ${message}`;
        if (args.length > 0) {
            formatted += ' ' + args.map(arg => {
                if (typeof arg === 'object') {
                    return JSON.stringify(arg, null, 2);
                }
                return String(arg);
            }).join(' ');
        }
        return formatted;
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map