import GameConfig from '../config/GameConfig.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Get game data from registry
        const gameMode = this.registry.get('gameMode');
        const finalScore = this.registry.get('finalScore') || 0;
        const fishCaught = this.registry.get('finalFishCaught') || 0;
        const fishLost = this.registry.get('finalFishLost') || 0;
        const gameTime = this.registry.get('finalGameTime') || 0;
        const caughtFishData = this.registry.get('caughtFishData') || [];

        // Add background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a2f3a, 0x1a2f3a, 0x3a4f5a, 0x3a4f5a, 1);
        bg.fillRect(0, 0, width, height);

        // Add background image if available
        if (this.textures.exists('bg-sunset')) {
            const bgImage = this.add.image(width / 2, height / 2, 'bg-sunset');
            bgImage.setAlpha(0.2);
            bgImage.setDisplaySize(width, height);
        }

        // Title
        const title = gameMode === GameConfig.GAME_MODE_ARCADE ? 'TIME\'S UP!' : 'SESSION COMPLETE';
        this.add.text(width / 2, 40, title, {
            fontSize: '32px',
            fontFamily: 'Courier New',
            color: '#ff6600',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Game stats
        const minutes = Math.floor(gameTime / 60);
        const secs = gameTime % 60;
        const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;

        const statsY = 90;
        this.add.text(width / 2, statsY, 'GAME STATISTICS', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const stats = [
            `Score: ${finalScore} points`,
            `Fish Caught: ${fishCaught}`,
            `Fish Lost: ${fishLost}`,
            `Time: ${timeStr}`
        ];

        stats.forEach((stat, index) => {
            this.add.text(width / 2, statsY + 35 + (index * 20), stat, {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#00ff00'
            }).setOrigin(0.5);
        });

        // Caught fish display
        if (caughtFishData.length > 0) {
            const fishListY = statsY + 140;
            this.add.text(width / 2, fishListY, 'FISH CAUGHT', {
                fontSize: '18px',
                fontFamily: 'Courier New',
                color: '#00ffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Create scrollable fish list
            const listStartY = fishListY + 35;
            const maxDisplay = 6;
            const displayCount = Math.min(caughtFishData.length, maxDisplay);

            caughtFishData.slice(0, displayCount).forEach((fish, index) => {
                const y = listStartY + (index * 50);
                this.createFishCard(width / 2, y, fish, index + 1);
            });

            if (caughtFishData.length > maxDisplay) {
                this.add.text(width / 2, listStartY + (maxDisplay * 50) + 10,
                    `...and ${caughtFishData.length - maxDisplay} more!`, {
                    fontSize: '11px',
                    fontFamily: 'Courier New',
                    color: '#888888',
                    fontStyle: 'italic'
                }).setOrigin(0.5);
            }
        } else {
            this.add.text(width / 2, 260, 'NO FISH CAUGHT', {
                fontSize: '18px',
                fontFamily: 'Courier New',
                color: '#ff0000',
                fontStyle: 'italic'
            }).setOrigin(0.5);

            this.add.text(width / 2, 290, 'Better luck next time!', {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#888888'
            }).setOrigin(0.5);
        }

        // Buttons
        const buttonY = height - 60;
        this.createButton(width / 2 - 120, buttonY, 'PLAY AGAIN', () => {
            this.restartGame();
        });

        this.createButton(width / 2 + 120, buttonY, 'MAIN MENU', () => {
            this.goToMenu();
        });

        // Controls hint
        this.add.text(width / 2, height - 20, 'ESC - Return to Menu', {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#88ff88'
        }).setOrigin(0.5);

        // ESC to menu
        this.input.keyboard.once('keydown-ESC', () => {
            this.goToMenu();
        });

        // Fade in
        this.cameras.main.fadeIn(500);
    }

    createFishCard(x, y, fish, number) {
        const container = this.add.container(x, y);

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x2a4a3a, 0.8);
        bg.lineStyle(2, 0x00ff00, 0.5);
        bg.fillRoundedRect(-200, -20, 400, 40, 5);
        bg.strokeRoundedRect(-200, -20, 400, 40, 5);

        // Fish icon
        const icon = fish.isEmergencyFish ? '🔥' : '🐟';

        // Fish number and name
        const nameText = this.add.text(-190, 0, `${number}. ${icon} ${fish.name}`, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        // Weight and points
        const statsText = this.add.text(190, 0,
            `${fish.weight} | ${fish.points}pts | ${fish.depthZone}`, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#88ff88'
        }).setOrigin(1, 0.5);

        container.add([bg, nameText, statsText]);

        return container;
    }

    createButton(x, y, text, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x2a4a3a, 1);
        bg.lineStyle(2, 0x00ff00, 1);
        bg.fillRoundedRect(-80, -20, 160, 40, 8);
        bg.strokeRoundedRect(-80, -20, 160, 40, 8);

        const buttonText = this.add.text(0, 0, text, {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, buttonText]);

        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-80, -20, 160, 40);
        container.setSize(160, 40);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x3a5a4a, 1);
            bg.lineStyle(2, 0x00ffff, 1);
            bg.fillRoundedRect(-80, -20, 160, 40, 8);
            bg.strokeRoundedRect(-80, -20, 160, 40, 8);
            buttonText.setColor('#00ffff');
        });

        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x2a4a3a, 1);
            bg.lineStyle(2, 0x00ff00, 1);
            bg.fillRoundedRect(-80, -20, 160, 40, 8);
            bg.strokeRoundedRect(-80, -20, 160, 40, 8);
            buttonText.setColor('#00ff00');
        });

        container.on('pointerdown', callback);

        return container;
    }

    restartGame() {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }

    goToMenu() {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }
}

export default GameOverScene;
