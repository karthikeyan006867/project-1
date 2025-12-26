// Status Bar Manager
import * as vscode from 'vscode';

export class StatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private lastUpdate: number = 0;
  private status: 'Active' | 'Idle' | 'Error' = 'Idle';

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      1
    );
  }

  public initialize(): void {
    this.statusBarItem.text = '$(pulse) WakaTime';
    this.statusBarItem.tooltip = 'Click to view WakaTime dashboard';
    this.statusBarItem.command = 'wakatime.dashboard';
    this.statusBarItem.show();
  }

  public updateStatus(status: 'Active' | 'Idle' | 'Error', message?: string): void {
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

  public updateCodingTime(seconds: number): void {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    let timeStr = '';
    if (hours > 0) {
      timeStr = `${hours}h ${minutes}m`;
    } else {
      timeStr = `${minutes}m`;
    }

    this.statusBarItem.text = `$(pulse) ${timeStr} today`;
    this.statusBarItem.tooltip = `WakaTime: ${timeStr} coded today\nClick to view dashboard`;
  }

  public hide(): void {
    this.statusBarItem.hide();
  }

  public show(): void {
    this.statusBarItem.show();
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
