export declare class StatusBar {
    private statusBarItem;
    private lastUpdate;
    private status;
    constructor();
    initialize(): void;
    updateStatus(status: 'Active' | 'Idle' | 'Error', message?: string): void;
    updateCodingTime(seconds: number): void;
    hide(): void;
    show(): void;
    dispose(): void;
}
//# sourceMappingURL=status-bar.d.ts.map