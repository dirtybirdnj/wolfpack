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
        // UI text style
        const textStyle = {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#00ff00'
        };
        
        const headerStyle = {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#ffff00'
        };
        
        // Top panel background
        const topPanel = this.add.graphics();
        topPanel.fillStyle(0x000000, 0.7);
        topPanel.fillRect(0, 0, GameConfig.CANVAS_WIDTH, 80);
        
        // Title
        this.add.text(10, 5, 'LAKE CHAMPLAIN SONAR', headerStyle);
        
        // Score display
        this.scoreText = this.add.text(10, 25, 'Score: 0', textStyle);
        this.fishCaughtText = this.add.text(10, 45, 'Caught: 0', textStyle);
        this.fishLostText = this.add.text(10, 60, 'Lost: 0', textStyle);
        this.fishLostText.setColor('#ff6666'); // Red for lost fish
        
        // Lure info
        this.depthText = this.add.text(150, 25, 'Depth: 0 ft', textStyle);
        this.lureSpeedText = this.add.text(150, 45, 'Speed: 0.0', textStyle);
        
        // Water conditions
        this.waterTempText = this.add.text(300, 25, 'Water: 40°F', textStyle);
        this.timeText = this.add.text(300, 45, 'Time: 0:00', textStyle);
        
        // Current zone
        this.zoneText = this.add.text(450, 25, 'Zone: Surface', textStyle);
        this.add.text(450, 45, 'Target: Lake Trout', textStyle);
        
        // Side panel for detailed info
        const sidePanel = this.add.graphics();
        sidePanel.fillStyle(0x000000, 0.5);
        sidePanel.fillRect(GameConfig.CANVAS_WIDTH - 150, 100, 145, 200);
        
        this.add.text(GameConfig.CANVAS_WIDTH - 145, 105, 'FISH FINDER', headerStyle);
        
        // Fish in range indicator
        this.fishInRangeText = this.add.text(
            GameConfig.CANVAS_WIDTH - 145, 130,
            'Fish: None', textStyle
        );
        
        // Retrieve speed indicator
        this.retrieveIndicator = this.add.graphics();

        // Create retrieve speed text once
        this.retrieveSpeedText = this.add.text(
            GameConfig.CANVAS_WIDTH - 140, 163,
            'Retrieve: 2.0',
            {
                fontSize: '12px',
                fontFamily: 'Courier New',
                color: '#ffffff'
            }
        );

        this.updateRetrieveIndicator(2.0);
        
        // Tips display
        const tipsY = 350;
        this.add.text(GameConfig.CANVAS_WIDTH - 145, tipsY, 'TIPS:', headerStyle);
        this.tipText = this.add.text(
            GameConfig.CANVAS_WIDTH - 145, tipsY + 20,
            'Lake trout\nprefer depths\nof 60-100ft\nin winter',
            {
                fontSize: '11px',
                fontFamily: 'Courier New',
                color: '#88ff88',
                wordWrap: { width: 135 }
            }
        );
        
        // Listen for events from GameScene
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.on('updateScore', this.updateScore, this);
            gameScene.events.on('updateLureInfo', this.updateLureInfo, this);
            gameScene.events.on('updateTime', this.updateTime, this);
            gameScene.events.on('updateWaterTemp', this.updateWaterTemp, this);
            gameScene.events.on('updateFishLost', this.updateFishLost, this);
        }
        
        // Update loop for dynamic info
        this.time.addEvent({
            delay: 100,
            callback: this.updateDynamicInfo,
            callbackScope: this,
            loop: true
        });
        
        // Rotate tips
        this.time.addEvent({
            delay: 10000,
            callback: this.rotateTip,
            callbackScope: this,
            loop: true
        });
    }
    
    updateScore(data) {
        this.score = data.score;
        this.fishCaught = data.caught;
        this.scoreText.setText(`Score: ${this.score}`);
        this.fishCaughtText.setText(`Fish: ${this.fishCaught}`);
    }
    
    updateLureInfo(info) {
        if (!info) return;
        
        this.depthText.setText(`Depth: ${info.depth} ft`);
        this.lureSpeedText.setText(`Speed: ${info.speed}`);
        
        // Update zone based on depth using depth zones from config
        const zones = GameConfig.DEPTH_ZONES;
        let zone = 'Surface';
        let zoneColor = '#00ff00';

        if (info.depth >= zones.BOTTOM.min) {
            zone = zones.BOTTOM.name;
            zoneColor = '#888888'; // Gray for bottom
        } else if (info.depth >= zones.MID_COLUMN.min) {
            zone = zones.MID_COLUMN.name;
            zoneColor = '#00ff00'; // Green for mid-column
        } else {
            zone = zones.SURFACE.name;
            zoneColor = '#ffff00'; // Yellow for surface
        }

        this.zoneText.setText(`Zone: ${zone}`);
        this.zoneText.setColor(zoneColor);
        
        // Update retrieve speed indicator
        this.updateRetrieveIndicator(parseFloat(info.retrieveSpeed));
    }
    
    updateRetrieveIndicator(speed) {
        this.retrieveIndicator.clear();

        const x = GameConfig.CANVAS_WIDTH - 145;
        const y = 160;
        const maxWidth = 135;

        // Background bar
        this.retrieveIndicator.fillStyle(0x003300, 0.5);
        this.retrieveIndicator.fillRect(x, y, maxWidth, 20);

        // Speed bar
        const speedPercent = (speed - GameConfig.LURE_MIN_RETRIEVE_SPEED) /
                           (GameConfig.LURE_MAX_RETRIEVE_SPEED - GameConfig.LURE_MIN_RETRIEVE_SPEED);
        const barWidth = speedPercent * maxWidth;

        // Color based on optimal speed
        let color = 0x00ff00;
        const optimalDiff = Math.abs(speed - GameConfig.OPTIMAL_LURE_SPEED);
        if (optimalDiff < 0.5) {
            color = 0xffff00; // Perfect speed
        } else if (optimalDiff > 1.5) {
            color = 0xff6600; // Too fast/slow
        }

        this.retrieveIndicator.fillStyle(color, 0.8);
        this.retrieveIndicator.fillRect(x, y, barWidth, 20);

        // Update speed text (reuse existing text object)
        this.retrieveSpeedText.setText(`Retrieve: ${speed.toFixed(1)}`);

        // Optimal marker
        const optimalX = x + ((GameConfig.OPTIMAL_LURE_SPEED - GameConfig.LURE_MIN_RETRIEVE_SPEED) /
                              (GameConfig.LURE_MAX_RETRIEVE_SPEED - GameConfig.LURE_MIN_RETRIEVE_SPEED)) * maxWidth;
        this.retrieveIndicator.lineStyle(2, 0xffffff, 0.8);
        this.retrieveIndicator.lineBetween(optimalX, y - 2, optimalX, y + 22);
    }
    
    updateTime(seconds) {
        this.gameTime = seconds;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        this.timeText.setText(`Time: ${minutes}:${secs.toString().padStart(2, '0')}`);
    }
    
    updateWaterTemp(temp) {
        this.waterTemp = temp;
        this.waterTempText.setText(`Water: ${Math.floor(temp)}°F`);
    }

    updateFishLost(count) {
        this.fishLost = count;
        this.fishLostText.setText(`Lost: ${count}`);
    }

    updateDynamicInfo() {
        // Check for fish in range of lure
        const gameScene = this.scene.get('GameScene');
        if (!gameScene || !gameScene.lure) return;
        
        let nearbyFish = 0;
        let closestDistance = Infinity;
        
        if (gameScene.fishes) {
            gameScene.fishes.forEach(fish => {
                const dist = Math.sqrt(
                    Math.pow(fish.x - gameScene.lure.x, 2) + 
                    Math.pow(fish.y - gameScene.lure.y, 2)
                );
                
                if (dist < GameConfig.DETECTION_RANGE * 2) {
                    nearbyFish++;
                    if (dist < closestDistance) {
                        closestDistance = dist;
                    }
                }
            });
        }
        
        // Update fish indicator
        if (nearbyFish > 0) {
            let rangeText = 'Far';
            if (closestDistance < GameConfig.DETECTION_RANGE) rangeText = 'Close!';
            if (closestDistance < GameConfig.STRIKE_DISTANCE) rangeText = 'STRIKE!';
            
            this.fishInRangeText.setText(`Fish: ${nearbyFish} (${rangeText})`);
            this.fishInRangeText.setColor(closestDistance < GameConfig.DETECTION_RANGE ? '#ffff00' : '#00ff00');
        } else {
            this.fishInRangeText.setText('Fish: None');
            this.fishInRangeText.setColor('#00ff00');
        }
    }
    
    rotateTip() {
        const tips = [
            'Lake trout\nprefer depths\nof 60-100ft\nin winter',
            'Vary retrieve\nspeed to\ntrigger strikes',
            'Fish are most\nactive during\nlow light',
            'Lake Champlain\nmax depth:\n400 feet',
            'Optimal lure\nspeed: 2.0\nfor lakers',
            'Trophy fish\noften found\nnear bottom',
            'Watch for\nthermoclines\nat 25-45ft',
            'Burlington Bay\navg depth:\n65 feet'
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        // Fade transition
        this.tweens.add({
            targets: this.tipText,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.tipText.setText(randomTip);
                this.tweens.add({
                    targets: this.tipText,
                    alpha: 1,
                    duration: 300
                });
            }
        });
    }
}

export default UIScene;
