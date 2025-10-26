import GameConfig from '../config/GameConfig.js';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.selectedMode = 0; // 0-6 for 7 game combinations (6 + nature simulation)
        this.buttons = [];
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

        // Add Wolfpack logo if available - moved up and scaled better
        if (this.textures.exists('logo-wolfpack')) {
            const logo = this.add.image(width / 2, 160, 'logo-wolfpack');
            logo.setScale(0.5);  // Increased from 0.4 to show more
        } else {
            // Fallback text logo
            this.add.text(width / 2, 100, 'WOLFPACK', {
                fontSize: '64px',
                fontFamily: 'Courier New',
                color: '#ff6600',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        }

        // Subtitle - moved down to accommodate larger logo
        this.add.text(width / 2, 290, 'VERTICAL TUBE JIG', {
            fontSize: '20px',
            fontFamily: 'Courier New',
            color: '#ff3300',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 320, 'Lake Champlain Ice Fishing', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#00ff00'
        }).setOrigin(0.5);

        // Game mode selection
        this.add.text(width / 2, 300, 'SELECT FISHING TYPE & MODE', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Single horizontal row layout for all 7 game modes
        const buttonWidth = 130;
        const buttonHeight = 70;
        const buttonSpacing = 25;
        const centerX = width / 2;
        const buttonY = 400;

        // Calculate starting X position to center all buttons
        const totalWidth = (buttonWidth * 7) + (buttonSpacing * 6);
        const startX = centerX - (totalWidth / 2) + (buttonWidth / 2);

        // Create all 7 buttons in a single row
        const iceArcade = this.createModeButton(
            startX + (buttonWidth + buttonSpacing) * 0, buttonY,
            'ICE',
            'Arcade',
            { fishingType: GameConfig.FISHING_TYPE_ICE, gameMode: GameConfig.GAME_MODE_ARCADE },
            0
        );

        const iceUnlimited = this.createModeButton(
            startX + (buttonWidth + buttonSpacing) * 1, buttonY,
            'ICE',
            'Unlimited',
            { fishingType: GameConfig.FISHING_TYPE_ICE, gameMode: GameConfig.GAME_MODE_UNLIMITED },
            1
        );

        const kayakArcade = this.createModeButton(
            startX + (buttonWidth + buttonSpacing) * 2, buttonY,
            'KAYAK',
            'Arcade',
            { fishingType: GameConfig.FISHING_TYPE_KAYAK, gameMode: GameConfig.GAME_MODE_ARCADE },
            2
        );

        const kayakUnlimited = this.createModeButton(
            startX + (buttonWidth + buttonSpacing) * 3, buttonY,
            'KAYAK',
            'Unlimited',
            { fishingType: GameConfig.FISHING_TYPE_KAYAK, gameMode: GameConfig.GAME_MODE_UNLIMITED },
            3
        );

        const boatArcade = this.createModeButton(
            startX + (buttonWidth + buttonSpacing) * 4, buttonY,
            'BOAT',
            'Arcade',
            { fishingType: GameConfig.FISHING_TYPE_MOTORBOAT, gameMode: GameConfig.GAME_MODE_ARCADE },
            4
        );

        const boatUnlimited = this.createModeButton(
            startX + (buttonWidth + buttonSpacing) * 5, buttonY,
            'BOAT',
            'Unlimited',
            { fishingType: GameConfig.FISHING_TYPE_MOTORBOAT, gameMode: GameConfig.GAME_MODE_UNLIMITED },
            5
        );

        const natureSimulation = this.createModeButton(
            startX + (buttonWidth + buttonSpacing) * 6, buttonY,
            'NATURE',
            'Simulation',
            { fishingType: GameConfig.FISHING_TYPE_NATURE_SIMULATION, gameMode: null },
            6
        );

        this.buttons = [iceArcade, iceUnlimited, kayakArcade, kayakUnlimited, boatArcade, boatUnlimited, natureSimulation];

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
            this.gamepadText = this.add.text(width / 2, 590, '← → or D-Pad to select | X or A to confirm', {
                fontSize: '11px',
                fontFamily: 'Courier New',
                color: '#00ffff'
            }).setOrigin(0.5);

            // Setup gamepad state tracking
            this.gamepadState = {
                lastDpadLeft: false,
                lastDpadRight: false,
                lastX: false,
                lastA: false,
                lastAnalogLeft: false,
                lastAnalogRight: false
            };

            // Highlight the first button
            this.updateSelection();
        }

        // Setup keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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
        // Handle keyboard navigation - single horizontal row
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            if (this.selectedMode > 0) {
                this.selectedMode--;
                this.updateSelection();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            if (this.selectedMode < this.buttons.length - 1) {
                this.selectedMode++;
                this.updateSelection();
            }
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
            // D-Pad navigation - single horizontal row
            const dpadLeft = window.gamepadManager.getButton('DpadLeft');
            const dpadRight = window.gamepadManager.getButton('DpadRight');

            if (dpadLeft.pressed && !this.gamepadState.lastDpadLeft) {
                if (this.selectedMode > 0) {
                    this.selectedMode--;
                    this.updateSelection();
                }
            }

            if (dpadRight.pressed && !this.gamepadState.lastDpadRight) {
                if (this.selectedMode < this.buttons.length - 1) {
                    this.selectedMode++;
                    this.updateSelection();
                }
            }

            this.gamepadState.lastDpadLeft = dpadLeft.pressed;
            this.gamepadState.lastDpadRight = dpadRight.pressed;

            // Analog stick navigation - single horizontal row
            const leftStickX = window.gamepadManager.getAxis('LeftStickX');
            const analogThreshold = 0.5;

            const analogLeft = leftStickX < -analogThreshold;
            const analogRight = leftStickX > analogThreshold;

            if (analogLeft && !this.gamepadState.lastAnalogLeft) {
                if (this.selectedMode > 0) {
                    this.selectedMode--;
                    this.updateSelection();
                }
            }

            if (analogRight && !this.gamepadState.lastAnalogRight) {
                if (this.selectedMode < this.buttons.length - 1) {
                    this.selectedMode++;
                    this.updateSelection();
                }
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
        } else if (modeConfig.fishingType === GameConfig.FISHING_TYPE_KAYAK ||
                   modeConfig.fishingType === GameConfig.FISHING_TYPE_MOTORBOAT) {
            // Kayak and motorboat modes start with navigation (top-down lake view)
            startingScene = 'NavigationScene';
        } else {
            // Ice fishing goes directly to GameScene (no navigation needed on ice)
            // Clear previous navigation position data to use default deep water location
            this.registry.set('fishingWorldX', null);
            this.registry.set('fishingWorldY', 5000);
            this.registry.set('currentDepth', GameConfig.MAX_DEPTH);
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
