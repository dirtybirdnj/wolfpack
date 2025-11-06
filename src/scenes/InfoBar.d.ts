/**
 * InfoBar - Top overlay scene showing game status information
 *
 * Displays:
 * - Current depth
 * - Water temperature
 * - Time elapsed
 * - Species counts
 * - Current game mode
 */
export default class InfoBar {
    create(): void;
    canvasWidth: any;
    canvasHeight: any;
    backgroundBar: any;
    depthText: any;
    tempText: any;
    timeText: any;
    modeText: any;
    /**
     * Handle data changes from game registry
     */
    handleDataChange(parent: any, key: any, value: any): void;
    /**
     * Update depth display
     */
    updateDepth(depth: any): void;
    /**
     * Update temperature display
     */
    updateTemp(temp: any): void;
    /**
     * Update time display
     */
    updateTime(seconds: any): void;
    /**
     * Update game mode display
     */
    updateMode(mode: any): void;
    /**
     * Handle resize
     */
    handleResize(gameSize: any): void;
    /**
     * Clean up
     */
    shutdown(): void;
}
//# sourceMappingURL=InfoBar.d.ts.map