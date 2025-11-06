/**
 * Fish state colors for debug visualization
 */
export interface StateColors {
    [state: string]: number;
}
/**
 * DebugSystem - Handles debug visualization and developer tools
 *
 * @module scenes/systems/DebugSystem
 *
 * Responsibilities:
 * - Draw detection ranges around lure
 * - Visualize fish states and behavior
 * - Show connection lines between fish and lure
 * - Display fish AI state colors
 * - Render debug graphics overlay
 *
 * COMMON TASKS:
 * - Add new debug visualizations → render() method
 * - Change debug colors → stateColors constant
 * - Toggle debug elements → this.enabled boolean
 *
 * @example
 * const debugSystem = new DebugSystem(scene);
 * debugSystem.setEnabled(true);
 * debugSystem.update(time, delta);
 */
export declare class DebugSystem {
    private scene;
    private debugGraphics;
    private enabled;
    /**
     * @param scene - The game scene
     */
    constructor(scene: Phaser.Scene);
    /**
     * Enable or disable debug visualization
     * @param enabled - True to enable debug mode
     */
    setEnabled(enabled: boolean): void;
    /**
     * Toggle debug mode on/off
     * @returns New debug mode state
     */
    toggle(): boolean;
    /**
     * Create debug graphics object if needed
     */
    private ensureGraphics;
    /**
     * Render all debug information
     */
    render(): void;
    /**
     * Render debug information for all fish
     */
    private renderFishDebug;
    /**
     * Draw debug text for a fish
     * @param fish - The fish to draw info for
     * @param color - Color for the text
     */
    private drawFishInfo;
    /**
     * Update debug system each frame
     * @param time - Current game time
     * @param delta - Time since last frame
     */
    update(time: number, delta: number): void;
    /**
     * Clean up debug system
     */
    destroy(): void;
}
export default DebugSystem;
//# sourceMappingURL=DebugSystem.d.ts.map