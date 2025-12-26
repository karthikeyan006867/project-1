// WakaTime Extension Core
// Based on github.com/wakatime/vscode-wakatime

import * as vscode from 'vscode';
import { Dependencies } from './dependencies';
import { Logger } from './logger';
import { WakaTimeAPI } from './wakatime-api';
import { ActivityTracker } from './activity-tracker';
import { StatusBar } from './status-bar';
import { ConfigManager } from './config-manager';

export class WakaTime {
  private dependencies: Dependencies;
  private logger: Logger;
  private api: WakaTimeAPI;
  private tracker: ActivityTracker;
  private statusBar: StatusBar;
  private config: ConfigManager;
  private disposable!: vscode.Disposable;
  private lastFile: string = '';
  private lastHeartbeat: number = 0;
  private debounceMs: number = 2000;

  constructor(private context: vscode.ExtensionContext) {
    this.logger = new Logger('WakaTime');
    this.config = new ConfigManager();
    this.dependencies = new Dependencies(this.logger);
    this.api = new WakaTimeAPI(this.config, this.logger);
    this.tracker = new ActivityTracker(this.api, this.logger);
    this.statusBar = new StatusBar();
  }

  public async initialize(): Promise<void> {
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

  private setupEventListeners(): void {
    const subscriptions: vscode.Disposable[] = [];

    // Document change events
    subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        this.onDocumentChange(e);
      })
    );

    // Document save events
    subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        this.onDocumentSave(doc);
      })
    );

    // Document open events
    subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        this.onDocumentOpen(doc);
      })
    );

    // Window focus events
    subscriptions.push(
      vscode.window.onDidChangeWindowState((state) => {
        if (state.focused) {
          this.sendHeartbeat(false);
        }
      })
    );

    // Active editor change
    subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.onEditorChange(editor);
        }
      })
    );

    // Debug session events
    subscriptions.push(
      vscode.debug.onDidStartDebugSession(() => {
        this.tracker.setCategory('debugging');
      })
    );

    subscriptions.push(
      vscode.debug.onDidTerminateDebugSession(() => {
        this.tracker.setCategory('coding');
      })
    );

    this.disposable = vscode.Disposable.from(...subscriptions);
    this.context.subscriptions.push(this.disposable);
  }

  private onDocumentChange(e: vscode.TextDocumentChangeEvent): void {
    if (e.document.uri.scheme === 'file') {
      this.sendHeartbeat(false);
    }
  }

  private onDocumentSave(doc: vscode.TextDocument): void {
    if (doc.uri.scheme === 'file') {
      this.sendHeartbeat(true);
    }
  }

  private onDocumentOpen(doc: vscode.TextDocument): void {
    if (doc.uri.scheme === 'file') {
      this.sendHeartbeat(false);
    }
  }

  private onEditorChange(editor: vscode.TextEditor): void {
    if (editor.document.uri.scheme === 'file') {
      this.sendHeartbeat(false);
    }
  }

  private async sendHeartbeat(isWrite: boolean): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;
    if (doc.uri.scheme !== 'file') return;

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

  private async getProject(file: string): Promise<string | undefined> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(file));
    if (workspaceFolder) {
      return workspaceFolder.name;
    }

    // Try to detect project from git
    try {
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (gitExtension) {
        const git = gitExtension.exports.getAPI(1);
        const repo = git.repositories.find((r: any) => 
          file.startsWith(r.rootUri.fsPath)
        );
        if (repo) {
          return repo.rootUri.fsPath.split(/[\\/]/).pop();
        }
      }
    } catch (error) {
      this.logger.debug('Error detecting project from git:', error);
    }

    return undefined;
  }

  private async getBranch(file: string): Promise<string | undefined> {
    try {
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (gitExtension) {
        const git = gitExtension.exports.getAPI(1);
        const repo = git.repositories.find((r: any) => 
          file.startsWith(r.rootUri.fsPath)
        );
        if (repo && repo.state.HEAD) {
          return repo.state.HEAD.name;
        }
      }
    } catch (error) {
      this.logger.debug('Error detecting branch:', error);
    }

    return undefined;
  }

  private async getDependencies(doc: vscode.TextDocument): Promise<string[]> {
    const deps: string[] = [];
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

  private async promptForApiKey(): Promise<void> {
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

  public async showDashboard(): Promise<void> {
    const url = 'https://wakatime.com/dashboard';
    await vscode.env.openExternal(vscode.Uri.parse(url));
  }

  public async showToday(): Promise<void> {
    const stats = await this.api.getToday();
    if (stats) {
      const hours = (stats.grand_total.total_seconds / 3600).toFixed(2);
      vscode.window.showInformationMessage(
        `Today's coding time: ${hours} hours`
      );
    }
  }

  public dispose(): void {
    this.disposable?.dispose();
    this.statusBar?.dispose();
  }
}

export function activate(context: vscode.ExtensionContext) {
  const wakatime = new WakaTime(context);
  
  wakatime.initialize().catch(err => {
    console.error('Failed to initialize WakaTime:', err);
  });

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('wakatime.dashboard', () => {
      wakatime.showDashboard();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('wakatime.today', () => {
      wakatime.showToday();
    })
  );

  return wakatime;
}

export function deactivate() {
  // Cleanup handled by dispose
}
