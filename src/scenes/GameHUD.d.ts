/**
 * GameHUD - In-game HUD with all meters and status info rendered as graphics
 *
 * Replaces HTML UI elements with GPU-rendered Phaser graphics.
 * Uses RenderTextures and cached gradients for optimal performance.
 *
 * Top Bar Meters:
 * - Line Strain (gradient: green → yellow → orange → red)
 * - Depth
 * - Mode
 * - Tension (gradient: green → yellow → orange → red)
 * - Drop Speed (gradient: orange → yellow → green)
 * - Reel Speed (gradient: green → yellow → orange)
 * - Drag Setting (gradient: green → yellow → orange)
 * - Time
 *
 * Right Sidebar:
 * - Fish status panel
 * - Entity counts
 * - Selected fish details
 */
export default class GameHUD {
    create(): void;
    canvasWidth: any;
    canvasHeight: any;
    topBarContainer: any;
    fishStatusContainer: any;
    topBarVisible: any;
    sidebarVisible: any;
    /**
     * Setup keyboard shortcuts for toggling UI elements
     */
    setupKeyboardShortcuts(): void;
    /**
     * Create top bar with all meters
     */
    createTopBar(): void;
    topBarBg: any;
    lineStrainMeter: {
        label: any;
        bg: any;
        fill: any;
        percent: any;
        maxWidth: any;
        x: any;
        y: any;
        reversed: boolean;
    } | undefined;
    tensionMeter: {
        label: any;
        bg: any;
        fill: any;
        percent: any;
        maxWidth: any;
        x: any;
        y: any;
        reversed: boolean;
    } | undefined;
    dropMeter: {
        label: any;
        bg: any;
        fill: any;
        percent: any;
        maxWidth: any;
        x: any;
        y: any;
        reversed: boolean;
    } | undefined;
    reelMeter: {
        label: any;
        bg: any;
        fill: any;
        percent: any;
        maxWidth: any;
        x: any;
        y: any;
        reversed: boolean;
    } | undefined;
    dragMeter: {
        label: any;
        bg: any;
        fill: any;
        percent: any;
        maxWidth: any;
        x: any;
        y: any;
        reversed: boolean;
    } | undefined;
    /**
     * Create a meter with gradient fill bar
     */
    createMeter(x: any, y: any, width: any, height: any, label: any, labelStyle: any, valueStyle: any, reversed?: boolean): {
        label: any;
        bg: any;
        fill: any;
        percent: any;
        maxWidth: any;
        x: any;
        y: any;
        reversed: boolean;
    };
    /**
     * Create gradient texture for meters
     * Green → Yellow → Orange → Red (or reversed)
     */
    createGradientTexture(width: any, height: any, reversed?: boolean): string;
    /**
     * Create simple value display (no meter bar)
     */
    createValueDisplay(x: any, y: any, label: any, defaultValue: any, labelStyle: any, valueStyle: any, key: any): any;
    valueDisplays: {} | undefined;
    /**
     * Create gamepad and book icons
     */
    createIcons(): void;
    gamepadIcon: any;
    bookIcon: any;
    /**
     * Create right sidebar for fish status
     */
    createRightSidebar(): void;
    sidebarBg: any;
    sidebarHeader: any;
    entityCountText: any;
    fishListContainer: any;
    fishRows: any[] | undefined;
    detailPanelBg: any;
    fishDetailContainer: any;
    fishDetailElements: any[] | undefined;
    /**
     * Update meter fill based on percentage (0-1)
     */
    updateMeter(meter: any, percent: any): void;
    /**
     * Handle data changes from game registry
     */
    handleDataChange(parent: any, key: any, value: any): void;
    /**
     * Update fish list with styled rows matching the example design
     */
    updateFishList(fishListData: any): void;
    /**
     * Update fish detail section with colors matching example
     */
    updateFishDetail(detailData: any): void;
    /**
     * Toggle top bar visibility
     */
    toggleTopBar(): void;
    /**
     * Toggle sidebar visibility
     */
    toggleSidebar(): void;
    /**
     * Handle resize
     */
    handleResize(gameSize: any): void;
    /**
     * Clean up
     */
    shutdown(): void;
}
//# sourceMappingURL=GameHUD.d.ts.map