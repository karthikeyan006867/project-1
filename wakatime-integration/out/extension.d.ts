import * as vscode from 'vscode';
export declare class WakaTime {
    private context;
    private dependencies;
    private logger;
    private api;
    private tracker;
    private statusBar;
    private config;
    private disposable;
    private lastFile;
    private lastHeartbeat;
    private debounceMs;
    constructor(context: vscode.ExtensionContext);
    initialize(): Promise<void>;
    private setupEventListeners;
    private onDocumentChange;
    private onDocumentSave;
    private onDocumentOpen;
    private onEditorChange;
    private sendHeartbeat;
    private getProject;
    private getBranch;
    private getDependencies;
    private promptForApiKey;
    showDashboard(): Promise<void>;
    showToday(): Promise<void>;
    dispose(): void;
}
export declare function activate(context: vscode.ExtensionContext): WakaTime;
export declare function deactivate(): void;
//# sourceMappingURL=extension.d.ts.map