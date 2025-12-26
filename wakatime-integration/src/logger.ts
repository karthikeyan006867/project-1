// Logger utility
import * as vscode from 'vscode';

export class Logger {
  private outputChannel: vscode.OutputChannel;
  private debugMode: boolean = false;

  constructor(name: string = 'WakaTime') {
    this.outputChannel = vscode.window.createOutputChannel(name);
  }

  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  public debug(message: string, ...args: any[]): void {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      const formattedMessage = this.formatMessage('DEBUG', timestamp, message, args);
      this.outputChannel.appendLine(formattedMessage);
    }
  }

  public info(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = this.formatMessage('INFO', timestamp, message, args);
    this.outputChannel.appendLine(formattedMessage);
  }

  public warn(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = this.formatMessage('WARN', timestamp, message, args);
    this.outputChannel.appendLine(formattedMessage);
    
    if (this.debugMode) {
      vscode.window.showWarningMessage(`WakaTime: ${message}`);
    }
  }

  public error(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = this.formatMessage('ERROR', timestamp, message, args);
    this.outputChannel.appendLine(formattedMessage);
    
    if (args.length > 0 && args[0] instanceof Error) {
      this.outputChannel.appendLine(args[0].stack || '');
    }
  }

  public show(): void {
    this.outputChannel.show();
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }

  private formatMessage(level: string, timestamp: string, message: string, args: any[]): string {
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
