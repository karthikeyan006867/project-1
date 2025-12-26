export declare class Logger {
    private outputChannel;
    private debugMode;
    constructor(name?: string);
    setDebugMode(enabled: boolean): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    show(): void;
    dispose(): void;
    private formatMessage;
}
//# sourceMappingURL=logger.d.ts.map