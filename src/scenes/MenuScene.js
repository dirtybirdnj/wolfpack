import GameConfig from '../config/GameConfig.js';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.selectedMode = 2; // Start with Nature Simulation mode (index 2) pre-selected
        this.buttons = [];

        // Configurable fade-in duration for smooth transition from boot screen (in milliseconds)
        this.MENU_FADE_IN_DURATION = 1000; // 1 second
    }

    preload() {
        // Load logo assets
        this.load.image('wolfpack-logo', 'samples/assets/wolfpack-text-transparent.png');
        this.load.image('vtj-logo', 'samples/assets/vtj-circle-thickborder.png');

        // Load sample images for theming (previously loaded by BootScene)
        this.load.image('logo-wolfpack', 'samples/screenshots/pr7-snes-wolfpack-artwork.jpg');
        this.load.image('bg-ice', 'samples/assets/pr7-adirondacks-chunky-ice.jpg');
        this.load.image('bg-sunset', 'samples/assets/pr7-tip-up-sunrise.jpg');
        this.load.image('bg-rod', 'samples/assets/pr7-rod-box-drill-hole-bridge.jpg');
        this.load.image('fish-trophy', 'samples/assets/pr2-lake-trout-photo-1.jpg');

        // Create programmatic assets (previously created by BootScene)
        this.load.on('complete', () => {
            this.createProgrammaticAssets();
        });
    }

    createProgrammaticAssets() {
        // Create simple textures programmatically

        // Lure texture
        const lureGraphics = this.add.graphics();
        lureGraphics.fillStyle(GameConfig.COLOR_LURE, 1);
        lureGraphics.fillCircle(16, 16, 8);
        lureGraphics.generateTexture('lure', 32, 32);
        lureGraphics.destroy();

        // Fish texture (different sizes)
        const fishSizes = ['small', 'medium', 'large'];
        fishSizes.forEach((size, index) => {
            const fishGraphics = this.add.graphics();
            const sizeMultiplier = (index + 1) * 5;
            fishGraphics.fillStyle(GameConfig.COLOR_FISH_MEDIUM, 1);
            fishGraphics.fillEllipse(20, 16, sizeMultiplier * 2, sizeMultiplier);
            fishGraphics.generateTexture(`fish_${size}`, 40, 32);
            fishGraphics.destroy();
        });

        // Particle texture for effects
        const particleGraphics = this.add.graphics();
        particleGraphics.fillStyle(0xffffff, 1);
        particleGraphics.fillCircle(4, 4, 4);
        particleGraphics.generateTexture('particle', 8, 8);
        particleGraphics.destroy();
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

        // Title - Wolfpack Logo (moved down 1 inch = 96 pixels)
        const wolfpackLogo = this.add.image(width / 2, 196, 'wolfpack-logo');
        wolfpackLogo.setOrigin(0.5);
        wolfpackLogo.setScale(0.5); // Adjust scale as needed

        // VTJ Logo (bottom right, moved down 1/4 inch, half size, clickable)
        const vtjLogo = this.add.image(width - 80, height - 56, 'vtj-logo');
        vtjLogo.setOrigin(0.5);
        vtjLogo.setScale(0.075); // Half the original size
        vtjLogo.setInteractive({ useHandCursor: true });
        vtjLogo.on('pointerdown', () => {
            window.open('https://www.verticaltubejig.com', '_blank');
        });

        // Game mode selection (moved up 1/4 inch = 24 pixels from 376)
        const gameModeText = this.add.text(width / 2, 352, 'SELECT GAME MODE', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add fade in/out animation to indicate readiness
        this.tweens.add({
            targets: gameModeText,
            alpha: 0.3,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Three button layout centered on screen
        const buttonWidth = 150;
        const buttonHeight = 80;
        const buttonSpacing = 40;
        const centerX = width / 2;
        const buttonY = 496; // Moved down 1 inch (96 pixels)

        // Calculate starting X position to center all three buttons
        const totalWidth = (buttonWidth * 3) + (buttonSpacing * 2);
        const startX = centerX - (totalWidth / 2) + (buttonWidth / 2);

        // Create Arcade, Unlimited, and Nature Simulation buttons
        const arcade = this.createModeButton(
            startX, buttonY,
            'ARCADE',
            'timed challenge',
            { fishingType: GameConfig.FISHING_TYPE_ICE, gameMode: GameConfig.GAME_MODE_ARCADE },
            0
        );

        const unlimited = this.createModeButton(
            startX + (buttonWidth + buttonSpacing), buttonY,
            'UNLIMITED',
            'no time limit',
            { fishingType: GameConfig.FISHING_TYPE_ICE, gameMode: GameConfig.GAME_MODE_UNLIMITED },
            1
        );

        const simulation = this.createModeButton(
            startX + (buttonWidth + buttonSpacing) * 2, buttonY,
            'SIMULATION',
            'observe behavior',
            { fishingType: GameConfig.FISHING_TYPE_NATURE_SIMULATION, gameMode: null },
            2
        );

        this.buttons = [arcade, unlimited, simulation];

        // Controls hint
        const controlsY = 570;
        this.controlsText = this.add.text(width / 2, controlsY, 'Click a mode to begin | ESC to return to menu', {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#88ff88',
            align: 'center'
        }).setOrigin(0.5);

        // Check for gamepad
        this.gamepadDetected = false;
        if (window.gamepadManager && window.gamepadManager.isConnected()) {
            this.gamepadDetected = true;
            this.gamepadText = this.add.text(width / 2, 590, 'L1/R1 or D-Pad to select | X or A to confirm', {
                fontSize: '11px',
                fontFamily: 'Courier New',
                color: '#00ffff'
            }).setOrigin(0.5);

            // Setup gamepad state tracking
            this.gamepadState = {
                lastDpadLeft: false,
                lastDpadRight: false,
                lastL1: false,
                lastR1: false,
                lastX: false,
                lastA: false,
                lastAnalogLeft: false,
                lastAnalogRight: false
            };

            // Highlight the selected button (Unlimited mode by default)
            this.updateSelection();
        }

        // Setup keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Add black overlay for smooth transition from boot screen
        this.blackOverlay = this.add.graphics();
        this.blackOverlay.fillStyle(0x000000, 1);
        this.blackOverlay.fillRect(0, 0, width, height);
        this.blackOverlay.setDepth(10000); // Ensure it's on top of everything

        // Fade out the black overlay
        this.tweens.add({
            targets: this.blackOverlay,
            alpha: 0,
            duration: this.MENU_FADE_IN_DURATION,
            ease: 'Power2',
            onComplete: () => {
                this.blackOverlay.destroy(); // Clean up after fade
            }
        });
    }

    createModeButton(x, y, title, description, modeConfig, index) {
        const container = this.add.container(x, y);

        // Button size for 3x2 grid
        const btnWidth = 180;
        const btnHeight = 70;

        // Button background
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x2a4a3a, 1);
        btnBg.lineStyle(3, 0x00ff00, 1);
        btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
        btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);

        // Title
        const titleText = this.add.text(0, -15, title, {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Description
        const descText = this.add.text(0, 15, description, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#88ff88',
            align: 'center',
            lineSpacing: 2
        }).setOrigin(0.5);

        container.add([btnBg, titleText, descText]);

        // Store references for highlighting
        container.btnBg = btnBg;
        container.titleText = titleText;
        container.descText = descText;
        container.modeConfig = modeConfig; // Store both fishingType and gameMode
        container.index = index;
        container.btnWidth = btnWidth;
        container.btnHeight = btnHeight;

        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
        container.setSize(btnWidth, btnHeight);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        // Hover effects
        container.on('pointerover', () => {
            this.selectedMode = index;
            this.updateSelection();
        });

        container.on('pointerout', () => {
            // Only deselect if not using gamepad
            if (!this.gamepadDetected) {
                this.clearSelection(container);
            }
        });

        container.on('pointerdown', () => {
            this.startGame(modeConfig);
        });

        return container;
    }

    updateSelection() {
        // Clear all buttons first
        this.buttons.forEach(btn => this.clearSelection(btn));

        // Highlight selected button
        const selected = this.buttons[this.selectedMode];
        if (selected) {
            selected.btnBg.clear();
            selected.btnBg.fillStyle(0x3a5a4a, 1);
            selected.btnBg.lineStyle(4, 0x00ffff, 1);
            selected.btnBg.fillRoundedRect(-selected.btnWidth / 2, -selected.btnHeight / 2,
                selected.btnWidth, selected.btnHeight, 10);
            selected.btnBg.strokeRoundedRect(-selected.btnWidth / 2, -selected.btnHeight / 2,
                selected.btnWidth, selected.btnHeight, 10);
            selected.titleText.setColor('#00ffff');
            selected.descText.setColor('#aaffff');
        }
    }

    clearSelection(button) {
        button.btnBg.clear();
        button.btnBg.fillStyle(0x2a4a3a, 1);
        button.btnBg.lineStyle(3, 0x00ff00, 1);
        button.btnBg.fillRoundedRect(-button.btnWidth / 2, -button.btnHeight / 2,
            button.btnWidth, button.btnHeight, 10);
        button.btnBg.strokeRoundedRect(-button.btnWidth / 2, -button.btnHeight / 2,
            button.btnWidth, button.btnHeight, 10);
        button.titleText.setColor('#00ff00');
        button.descText.setColor('#88ff88');
    }

    update() {
        // Handle keyboard navigation - single horizontal row with wrap-around
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.selectedMode--;
            if (this.selectedMode < 0) {
                this.selectedMode = this.buttons.length - 1; // Wrap to last button
            }
            this.updateSelection();
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.selectedMode++;
            if (this.selectedMode >= this.buttons.length) {
                this.selectedMode = 0; // Wrap to first button
            }
            this.updateSelection();
        }

        if (Phaser.Input.Keyboard.JustDown(this.enterKey) ||
            Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            const selectedButton = this.buttons[this.selectedMode];
            if (selectedButton) {
                this.startGame(selectedButton.modeConfig);
            }
        }

        // Handle gamepad navigation
        if (this.gamepadDetected && window.gamepadManager && window.gamepadManager.isConnected()) {
            // D-Pad navigation - single horizontal row with wrap-around
            const dpadLeft = window.gamepadManager.getButton('DpadLeft');
            const dpadRight = window.gamepadManager.getButton('DpadRight');

            if (dpadLeft.pressed && !this.gamepadState.lastDpadLeft) {
                this.selectedMode--;
                if (this.selectedMode < 0) {
                    this.selectedMode = this.buttons.length - 1; // Wrap to last button
                }
                this.updateSelection();
            }

            if (dpadRight.pressed && !this.gamepadState.lastDpadRight) {
                this.selectedMode++;
                if (this.selectedMode >= this.buttons.length) {
                    this.selectedMode = 0; // Wrap to first button
                }
                this.updateSelection();
            }

            this.gamepadState.lastDpadLeft = dpadLeft.pressed;
            this.gamepadState.lastDpadRight = dpadRight.pressed;

            // L1/R1 Bumper navigation - single horizontal row with wrap-around
            const l1Btn = window.gamepadManager.getButton('L1');
            const r1Btn = window.gamepadManager.getButton('R1');

            if (l1Btn.pressed && !this.gamepadState.lastL1) {
                this.selectedMode--;
                if (this.selectedMode < 0) {
                    this.selectedMode = this.buttons.length - 1; // Wrap to last button
                }
                this.updateSelection();
            }

            if (r1Btn.pressed && !this.gamepadState.lastR1) {
                this.selectedMode++;
                if (this.selectedMode >= this.buttons.length) {
                    this.selectedMode = 0; // Wrap to first button
                }
                this.updateSelection();
            }

            this.gamepadState.lastL1 = l1Btn.pressed;
            this.gamepadState.lastR1 = r1Btn.pressed;

            // Analog stick navigation - single horizontal row with wrap-around
            const leftStickX = window.gamepadManager.getAxis('LeftStickX');
            const analogThreshold = 0.5;

            const analogLeft = leftStickX < -analogThreshold;
            const analogRight = leftStickX > analogThreshold;

            if (analogLeft && !this.gamepadState.lastAnalogLeft) {
                this.selectedMode--;
                if (this.selectedMode < 0) {
                    this.selectedMode = this.buttons.length - 1; // Wrap to last button
                }
                this.updateSelection();
            }

            if (analogRight && !this.gamepadState.lastAnalogRight) {
                this.selectedMode++;
                if (this.selectedMode >= this.buttons.length) {
                    this.selectedMode = 0; // Wrap to first button
                }
                this.updateSelection();
            }

            this.gamepadState.lastAnalogLeft = analogLeft;
            this.gamepadState.lastAnalogRight = analogRight;

            // Confirm with X or A button
            const xButton = window.gamepadManager.getButton('X');
            const aButton = window.gamepadManager.getButton('A');

            if ((xButton.pressed && !this.gamepadState.lastX) ||
                (aButton.pressed && !this.gamepadState.lastA)) {
                const selectedButton = this.buttons[this.selectedMode];
                if (selectedButton) {
                    this.startGame(selectedButton.modeConfig);
                }
            }

            this.gamepadState.lastX = xButton.pressed;
            this.gamepadState.lastA = aButton.pressed;
        }
    }

    startGame(modeConfig) {
        // Store fishing type and game mode in registry
        this.registry.set('fishingType', modeConfig.fishingType);
        this.registry.set('gameMode', modeConfig.gameMode);

        // Determine which scene to start
        let startingScene;
        if (modeConfig.fishingType === GameConfig.FISHING_TYPE_NATURE_SIMULATION) {
            // Nature simulation goes to its own scene
            startingScene = 'NatureSimulationScene';
        } else {
            // Ice fishing goes directly to GameScene (no navigation needed on ice)
            // Clear previous navigation position data to use default deep water location
            this.registry.set('fishingWorldX', null);
            this.registry.set('fishingWorldY', 5000);
            this.registry.set('currentDepth', 90); // Start ice fishing at 90ft depth
            startingScene = 'GameScene';
        }

        console.log(`Starting ${modeConfig.fishingType} fishing in ${modeConfig.gameMode} mode`);
        console.log(`-> Going to ${startingScene}`);

        // Fade out and start game
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(startingScene);
            // Only start UIScene for GameScene (navigation has its own UI)
            if (startingScene === 'GameScene') {
                this.scene.start('UIScene');
            }
        });
    }
}

export default MenuScene;
