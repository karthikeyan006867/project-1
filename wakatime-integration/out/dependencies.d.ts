import { Logger } from './logger';
export declare class Dependencies {
    private logger;
    private wakatimeCLIPath;
    private wakatimeCLIVersion;
    constructor(logger: Logger);
    checkAndInstall(): Promise<boolean>;
    private isInstalled;
    private install;
    private getDownloadUrl;
    private downloadFile;
    getCLIPath(): string;
    getVersion(): Promise<string | null>;
}
//# sourceMappingURL=dependencies.d.ts.map