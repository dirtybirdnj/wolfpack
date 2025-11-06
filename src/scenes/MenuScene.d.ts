export class MenuScene {
    selectedMode: number;
    buttons: any[];
    MENU_FADE_IN_DURATION: number;
    preload(): void;
    createProgrammaticAssets(): void;
    create(): void;
    bgGraphics: any;
    bgImage: any;
    wolfpackLogo: any;
    vtjLogo: any;
    gameModeText: any;
    controlsText: any;
    gamepadState: {
        lastDpadLeft: boolean;
        lastDpadRight: boolean;
        lastL1: boolean;
        lastR1: boolean;
        lastX: boolean;
        lastA: boolean;
        lastAnalogLeft: boolean;
        lastAnalogRight: boolean;
    } | undefined;
    gamepadText: any;
    cursors: any;
    enterKey: any;
    spaceKey: any;
    blackOverlay: any;
    createModeButton(x: any, y: any, title: any, description: any, modeConfig: any, index: any): any;
    updateSelection(): void;
    clearSelection(button: any): void;
    update(): void;
    drawBackground(): void;
    handleResize(gameSize: any): void;
    startGame(modeConfig: any): void;
    /**
     * Clean up scene resources to prevent memory leaks
     */
    shutdown(): void;
}
export default MenuScene;
//# sourceMappingURL=MenuScene.d.ts.map