import GameConfig from '../config/GameConfig.js';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.score = 0;
        this.fishCaught = 0;
        this.fishLost = 0;
        this.gameTime = 0;
        this.waterTemp = 40;
    }
    
    create() {
        // NOTE: UI overlays disabled - all UI now rendered in HTML panels
        // Keeping UIScene active for event handling and future enhancements

        // Store references for potential future use
        this.uiEnabled = false;

        // Listen for events from GameScene (kept for compatibility)
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            // Events kept for future use if needed
            gameScene.events.on('updateScore', this.updateScore, this);
            gameScene.events.on('updateLureInfo', this.updateLureInfo, this);
            gameScene.events.on('updateTime', this.updateTime, this);
            gameScene.events.on('updateWaterTemp', this.updateWaterTemp, this);
            gameScene.events.on('updateFishLost', this.updateFishLost, this);
        }
    }
    
    updateScore(data) {
        // Data stored for compatibility
        this.score = data.score;
        this.fishCaught = data.caught;
    }

    updateLureInfo(info) {
        // Data stored for compatibility
        if (!info) {return;}
    }

    updateRetrieveIndicator(speed) {
        // Disabled - UI now in HTML panels
    }

    updateTime(seconds) {
        // Data stored for compatibility
        this.gameTime = seconds;
    }

    updateWaterTemp(temp) {
        // Data stored for compatibility
        this.waterTemp = temp;
    }

    updateFishLost(count) {
        // Data stored for compatibility
        this.fishLost = count;
    }

    updateDynamicInfo() {
        // Disabled - UI now in HTML panels
    }
    
}

export default UIScene;
