"use strict";
// WakaTime Extension Core
// Based on github.com/wakatime/vscode-wakatime
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
exports.WakaTime = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const dependencies_1 = require("./dependencies");
const logger_1 = require("./logger");
const wakatime_api_1 = require("./wakatime-api");
const activity_tracker_1 = require("./activity-tracker");
const status_bar_1 = require("./status-bar");
const config_manager_1 = require("./config-manager");
class WakaTime {
    constructor(context) {
        this.context = context;
        this.lastFile = '';
        this.lastHeartbeat = 0;
        this.debounceMs = 2000;
        this.logger = new logger_1.Logger('WakaTime');
        this.config = new config_manager_1.ConfigManager();
        this.dependencies = new dependencies_1.Dependencies(this.logger);
        this.api = new wakatime_api_1.WakaTimeAPI(this.config, this.logger);
        this.tracker = new activity_tracker_1.ActivityTracker(this.api, this.logger);
        this.statusBar = new status_bar_1.StatusBar();
    }
    async initialize() {
        this.logger.info('Initializing WakaTime extension...');
        // Check dependencies
        await this.dependencies.checkAndInstall();
        // Get API key
        const apiKey = await this.config.getApiKey();
        if (!apiKey) {
            await this.promptForApiKey();
        }
        // Setup event listeners
        this.setupEventListeners();
        // Initialize status bar
        this.statusBar.initialize();
        // Send initial heartbeat
        this.sendHeartbeat(true);
        this.logger.info('WakaTime extension initialized successfully');
    }
    setupEventListeners() {
        const subscriptions = [];
        // Document change events
        subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => {
            this.onDocumentChange(e);
        }));
        // Document save events
        subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => {
            this.onDocumentSave(doc);
        }));
        // Document open events
        subscriptions.push(vscode.workspace.onDidOpenTextDocument((doc) => {
            this.onDocumentOpen(doc);
        }));
        // Window focus events
        subscriptions.push(vscode.window.onDidChangeWindowState((state) => {
            if (state.focused) {
                this.sendHeartbeat(false);
            }
        }));
        // Active editor change
        subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                this.onEditorChange(editor);
            }
        }));
        // Debug session events
        subscriptions.push(vscode.debug.onDidStartDebugSession(() => {
            this.tracker.setCategory('debugging');
        }));
        subscriptions.push(vscode.debug.onDidTerminateDebugSession(() => {
            this.tracker.setCategory('coding');
        }));
        this.disposable = vscode.Disposable.from(...subscriptions);
        this.context.subscriptions.push(this.disposable);
    }
    onDocumentChange(e) {
        if (e.document.uri.scheme === 'file') {
            this.sendHeartbeat(false);
        }
    }
    onDocumentSave(doc) {
        if (doc.uri.scheme === 'file') {
            this.sendHeartbeat(true);
        }
    }
    onDocumentOpen(doc) {
        if (doc.uri.scheme === 'file') {
            this.sendHeartbeat(false);
        }
    }
    onEditorChange(editor) {
        if (editor.document.uri.scheme === 'file') {
            this.sendHeartbeat(false);
        }
    }
    async sendHeartbeat(isWrite) {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const doc = editor.document;
        if (doc.uri.scheme !== 'file')
            return;
        const file = doc.fileName;
        const time = Date.now();
        // Debounce heartbeats
        if (file === this.lastFile && time - this.lastHeartbeat < this.debounceMs && !isWrite) {
            return;
        }
        this.lastFile = file;
        this.lastHeartbeat = time;
        const language = doc.languageId;
        const project = await this.getProject(file);
        const branch = await this.getBranch(file);
        const lineCount = doc.lineCount;
        const cursorPosition = editor.selection.active;
        await this.tracker.sendHeartbeat({
            entity: file,
            type: 'file',
            category: this.tracker.getCategory(),
            time: time / 1000,
            project,
            branch,
            language,
            isWrite,
            lineCount,
            lineno: cursorPosition.line + 1,
            cursorpos: cursorPosition.character + 1,
            dependencies: await this.getDependencies(doc)
        });
        this.statusBar.updateStatus('Active');
    }
    async getProject(file) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(file));
        if (workspaceFolder) {
            return workspaceFolder.name;
        }
        // Try to detect project from git
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            if (gitExtension) {
                const git = gitExtension.exports.getAPI(1);
                const repo = git.repositories.find((r) => file.startsWith(r.rootUri.fsPath));
                if (repo) {
                    return repo.rootUri.fsPath.split(/[\\/]/).pop();
                }
            }
        }
        catch (error) {
            this.logger.debug('Error detecting project from git:', error);
        }
        return undefined;
    }
    async getBranch(file) {
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            if (gitExtension) {
                const git = gitExtension.exports.getAPI(1);
                const repo = git.repositories.find((r) => file.startsWith(r.rootUri.fsPath));
                if (repo && repo.state.HEAD) {
                    return repo.state.HEAD.name;
                }
            }
        }
        catch (error) {
            this.logger.debug('Error detecting branch:', error);
        }
        return undefined;
    }
    async getDependencies(doc) {
        const deps = [];
        const text = doc.getText();
        // Detect dependencies based on language
        switch (doc.languageId) {
            case 'javascript':
            case 'typescript':
                const importRegex = /from\s+['"]([^'"]+)['"]/g;
                const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
                let match;
                while ((match = importRegex.exec(text)) !== null) {
                    deps.push(match[1]);
                }
                while ((match = requireRegex.exec(text)) !== null) {
                    deps.push(match[1]);
                }
                break;
            case 'python':
                const pythonImportRegex = /(?:from|import)\s+(\S+)/g;
                while ((match = pythonImportRegex.exec(text)) !== null) {
                    deps.push(match[1]);
                }
                break;
            case 'java':
                const javaImportRegex = /import\s+([\w.]+)/g;
                while ((match = javaImportRegex.exec(text)) !== null) {
                    deps.push(match[1]);
                }
                break;
        }
        return deps.slice(0, 10); // Limit to 10 dependencies
    }
    async promptForApiKey() {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your WakaTime API Key',
            placeHolder: 'waka_xxxxxxxxxxxx',
            password: true,
            validateInput: (value) => {
                if (!value || value.length < 10) {
                    return 'Please enter a valid API key';
                }
                return null;
            }
        });
        if (apiKey) {
            await this.config.setApiKey(apiKey);
            this.logger.info('API key saved successfully');
        }
    }
    async showDashboard() {
        const url = 'https://wakatime.com/dashboard';
        await vscode.env.openExternal(vscode.Uri.parse(url));
    }
    async showToday() {
        const stats = await this.api.getToday();
        if (stats) {
            const hours = (stats.grand_total.total_seconds / 3600).toFixed(2);
            vscode.window.showInformationMessage(`Today's coding time: ${hours} hours`);
        }
    }
    dispose() {
        this.disposable?.dispose();
        this.statusBar?.dispose();
    }
}
exports.WakaTime = WakaTime;
function activate(context) {
    const wakatime = new WakaTime(context);
    wakatime.initialize().catch(err => {
        console.error('Failed to initialize WakaTime:', err);
    });
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('wakatime.dashboard', () => {
        wakatime.showDashboard();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('wakatime.today', () => {
        wakatime.showToday();
    }));
    return wakatime;
}
function deactivate() {
    // Cleanup handled by dispose
}
//# sourceMappingURL=extension.js.map