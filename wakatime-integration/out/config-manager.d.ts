export declare class ConfigManager {
    private configSection;
    private configFile;
    constructor();
    getApiKey(): Promise<string | undefined>;
    setApiKey(apiKey: string): Promise<void>;
    private readApiKeyFromFile;
    private writeApiKeyToFile;
    getDebugMode(): boolean;
    getDisabled(): boolean;
    getProxy(): string | undefined;
    getStatusBarEnabled(): boolean;
    getHeartbeatInterval(): number;
}
//# sourceMappingURL=config-manager.d.ts.map