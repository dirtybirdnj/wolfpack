import GameConfig from '../config/GameConfig.js';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Add background gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a2f3a, 0x1a2f3a, 0x3a4f5a, 0x3a4f5a, 1);
        bg.fillRect(0, 0, width, height);

        // Add background image if available
        if (this.textures.exists('bg-ice')) {
            const bgImage = this.add.image(width / 2, height / 2, 'bg-ice');
            bgImage.setAlpha(0.3);
            bgImage.setDisplaySize(width, height);
        }

        // Add Wolfpack logo if available
        if (this.textures.exists('logo-wolfpack')) {
            const logo = this.add.image(width / 2, 120, 'logo-wolfpack');
            logo.setScale(0.4);
        } else {
            // Fallback text logo
            this.add.text(width / 2, 100, 'WOLFPACK', {
                fontSize: '64px',
                fontFamily: 'Courier New',
                color: '#ff6600',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        }

        // Subtitle
        this.add.text(width / 2, 180, 'VERTICAL TUBE JIG', {
            fontSize: '20px',
            fontFamily: 'Courier New',
            color: '#ff3300',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 210, 'Lake Champlain Ice Fishing', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#00ff00'
        }).setOrigin(0.5);

        // Game mode selection
        this.add.text(width / 2, 270, 'SELECT GAME MODE', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Arcade Mode Button
        const arcadeBtn = this.createModeButton(width / 2, 330, 'ARCADE MODE',
            '2 Minutes\nCatch as many fish as you can!', 'arcade');

        // Unlimited Mode Button
        const unlimitedBtn = this.createModeButton(width / 2, 470, 'UNLIMITED MODE',
            'No time limit\nRelax and fish at your own pace', 'unlimited');

        // Controls hint
        this.add.text(width / 2, 590, 'Click a mode to begin | ESC to return to menu', {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#88ff88',
            align: 'center'
        }).setOrigin(0.5);

        // Check for gamepad
        this.gamepadDetected = false;
        if (window.gamepadManager && window.gamepadManager.isConnected()) {
            this.gamepadDetected = true;
            this.add.text(width / 2, 610, 'Gamepad Detected!', {
                fontSize: '11px',
                fontFamily: 'Courier New',
                color: '#00ffff'
            }).setOrigin(0.5);
        }
    }

    createModeButton(x, y, title, description, mode) {
        const container = this.add.container(x, y);

        // Button background
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x2a4a3a, 1);
        btnBg.lineStyle(3, 0x00ff00, 1);
        btnBg.fillRoundedRect(-200, -50, 400, 100, 10);
        btnBg.strokeRoundedRect(-200, -50, 400, 100, 10);

        // Title
        const titleText = this.add.text(0, -20, title, {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Description
        const descText = this.add.text(0, 15, description, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#88ff88',
            align: 'center',
            lineSpacing: 3
        }).setOrigin(0.5);

        container.add([btnBg, titleText, descText]);

        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-200, -50, 400, 100);
        container.setSize(400, 100);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        // Hover effects
        container.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0x3a5a4a, 1);
            btnBg.lineStyle(3, 0x00ffff, 1);
            btnBg.fillRoundedRect(-200, -50, 400, 100, 10);
            btnBg.strokeRoundedRect(-200, -50, 400, 100, 10);
            titleText.setColor('#00ffff');
        });

        container.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0x2a4a3a, 1);
            btnBg.lineStyle(3, 0x00ff00, 1);
            btnBg.fillRoundedRect(-200, -50, 400, 100, 10);
            btnBg.strokeRoundedRect(-200, -50, 400, 100, 10);
            titleText.setColor('#00ff00');
        });

        container.on('pointerdown', () => {
            this.startGame(mode);
        });

        return container;
    }

    startGame(mode) {
        // Store game mode in registry for GameScene to access
        this.registry.set('gameMode', mode);

        // Fade out and start game
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
            this.scene.start('UIScene');
        });
    }
}

export default MenuScene;
