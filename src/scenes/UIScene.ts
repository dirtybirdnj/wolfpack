import GameConfig from '../config/GameConfig.js';

interface LureInfo {
    depth?: number;
    velocity?: number;
    [key: string]: any;
}

export class UIScene extends Phaser.Scene {
    public fishCaught: number;
    public fishLost: number;
    public gameTime: number;
    public waterTemp: number;
    public uiEnabled: boolean;

    constructor() {
        super({ key: 'UIScene' });
        this.fishCaught = 0;
        this.fishLost = 0;
        this.gameTime = 0;
        this.waterTemp = 40;
        this.uiEnabled = false;
    }

    create(): void {
        // NOTE: UI overlays disabled - all UI now rendered in HTML panels
        // Keeping UIScene active for event handling and future enhancements

        // Listen for events from GameScene (kept for compatibility)
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            // Events kept for future use if needed
            gameScene.events.on('updateLureInfo', this.updateLureInfo, this);
            gameScene.events.on('updateTime', this.updateTime, this);
            gameScene.events.on('updateWaterTemp', this.updateWaterTemp, this);
            gameScene.events.on('updateFishLost', this.updateFishLost, this);
        }
    }

    updateLureInfo(info: LureInfo | null): void {
        // Data stored for compatibility
        if (!info) return;
    }

    updateRetrieveIndicator(speed: number): void {
        // Disabled - UI now in HTML panels
    }

    updateTime(seconds: number): void {
        // Data stored for compatibility
        this.gameTime = seconds;
    }

    updateWaterTemp(temp: number): void {
        // Data stored for compatibility
        this.waterTemp = temp;
    }

    updateFishLost(count: number): void {
        // Data stored for compatibility
        this.fishLost = count;
    }

    updateDynamicInfo(): void {
        // Disabled - UI now in HTML panels
    }
}

export default UIScene;
