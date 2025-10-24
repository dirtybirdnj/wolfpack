import GameConfig from '../config/GameConfig.js';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.selectedMode = 0; // 0 = arcade, 1 = unlimited, 2 = kayak, 3 = motorboat
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
        this.add.text(width / 2, 330, 'SELECT GAME MODE', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 2x2 Grid layout for 4 modes
        const buttonWidth = 200;
        const buttonHeight = 80;
        const buttonSpacingX = 240;
        const buttonSpacingY = 100;
        const centerX = width / 2;
        const startY = 400;

        // Row 1: Ice Fishing Modes
        // Arcade Mode Button (top left)
        const arcadeBtn = this.createModeButton(
            centerX - buttonSpacingX / 2, startY,
            'ARCADE MODE',
            '2 Minutes\nIce Fishing',
            'arcade', 0
        );

        // Unlimited Mode Button (top right)
        const unlimitedBtn = this.createModeButton(
            centerX + buttonSpacingX / 2, startY,
            'UNLIMITED MODE',
            'No time limit\nIce Fishing',
            'unlimited', 1
        );

        // Row 2: Summer Fishing Modes
        // Kayak Mode Button (bottom left)
        const kayakBtn = this.createModeButton(
            centerX - buttonSpacingX / 2, startY + buttonSpacingY,
            'KAYAK FISHING',
            'Summer\nSlow paddling',
            'kayak', 2
        );

        // Motor Boat Mode Button (bottom right)
        const motorboatBtn = this.createModeButton(
            centerX + buttonSpacingX / 2, startY + buttonSpacingY,
            'MOTOR BOAT',
            'Summer\nFind deep water',
            'motorboat', 3
        );

        this.buttons = [arcadeBtn, unlimitedBtn, kayakBtn, motorboatBtn];

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
                lastDpadUp: false,
                lastDpadDown: false,
                lastX: false,
                lastA: false,
                lastAnalogLeft: false,
                lastAnalogRight: false,
                lastAnalogUp: false,
                lastAnalogDown: false
            };

            // Highlight the first button
            this.updateSelection();
        }

        // Setup keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    createModeButton(x, y, title, description, mode, index) {
        const container = this.add.container(x, y);

        // Smaller button for horizontal layout
        const btnWidth = 200;
        const btnHeight = 80;

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
        container.mode = mode;
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
            this.startGame(mode);
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
        // Handle keyboard navigation - 2x2 grid navigation
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            // Move left in grid (0->1, 1->0, 2->3, 3->2)
            if (this.selectedMode % 2 === 1) {
                this.selectedMode--;
            } else {
                this.selectedMode++;
            }
            this.updateSelection();
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            // Move right in grid (same as left - toggle)
            if (this.selectedMode % 2 === 1) {
                this.selectedMode--;
            } else {
                this.selectedMode++;
            }
            this.updateSelection();
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            // Move up in grid (2->0, 3->1)
            if (this.selectedMode >= 2) {
                this.selectedMode -= 2;
                this.updateSelection();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            // Move down in grid (0->2, 1->3)
            if (this.selectedMode < 2) {
                this.selectedMode += 2;
                this.updateSelection();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.enterKey) ||
            Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            const selectedButton = this.buttons[this.selectedMode];
            if (selectedButton) {
                this.startGame(selectedButton.mode);
            }
        }

        // Handle gamepad navigation
        if (this.gamepadDetected && window.gamepadManager && window.gamepadManager.isConnected()) {
            // D-Pad navigation - 2x2 grid
            const dpadLeft = window.gamepadManager.getButton('DpadLeft');
            const dpadRight = window.gamepadManager.getButton('DpadRight');
            const dpadUp = window.gamepadManager.getButton('DpadUp');
            const dpadDown = window.gamepadManager.getButton('DpadDown');

            if (dpadLeft.pressed && !this.gamepadState.lastDpadLeft) {
                if (this.selectedMode % 2 === 1) {
                    this.selectedMode--;
                } else {
                    this.selectedMode++;
                }
                this.updateSelection();
            }

            if (dpadRight.pressed && !this.gamepadState.lastDpadRight) {
                if (this.selectedMode % 2 === 1) {
                    this.selectedMode--;
                } else {
                    this.selectedMode++;
                }
                this.updateSelection();
            }

            if (dpadUp.pressed && !this.gamepadState.lastDpadUp) {
                if (this.selectedMode >= 2) {
                    this.selectedMode -= 2;
                    this.updateSelection();
                }
            }

            if (dpadDown.pressed && !this.gamepadState.lastDpadDown) {
                if (this.selectedMode < 2) {
                    this.selectedMode += 2;
                    this.updateSelection();
                }
            }

            this.gamepadState.lastDpadLeft = dpadLeft.pressed;
            this.gamepadState.lastDpadRight = dpadRight.pressed;
            this.gamepadState.lastDpadUp = dpadUp.pressed;
            this.gamepadState.lastDpadDown = dpadDown.pressed;

            // Analog stick navigation - 2x2 grid
            const leftStickX = window.gamepadManager.getAxis('LeftStickX');
            const leftStickY = window.gamepadManager.getAxis('LeftStickY');
            const analogThreshold = 0.5;

            const analogLeft = leftStickX < -analogThreshold;
            const analogRight = leftStickX > analogThreshold;
            const analogUp = leftStickY < -analogThreshold;
            const analogDown = leftStickY > analogThreshold;

            if (analogLeft && !this.gamepadState.lastAnalogLeft) {
                if (this.selectedMode % 2 === 1) {
                    this.selectedMode--;
                } else {
                    this.selectedMode++;
                }
                this.updateSelection();
            }

            if (analogRight && !this.gamepadState.lastAnalogRight) {
                if (this.selectedMode % 2 === 1) {
                    this.selectedMode--;
                } else {
                    this.selectedMode++;
                }
                this.updateSelection();
            }

            if (analogUp && !this.gamepadState.lastAnalogUp) {
                if (this.selectedMode >= 2) {
                    this.selectedMode -= 2;
                    this.updateSelection();
                }
            }

            if (analogDown && !this.gamepadState.lastAnalogDown) {
                if (this.selectedMode < 2) {
                    this.selectedMode += 2;
                    this.updateSelection();
                }
            }

            this.gamepadState.lastAnalogLeft = analogLeft;
            this.gamepadState.lastAnalogRight = analogRight;
            this.gamepadState.lastAnalogUp = analogUp;
            this.gamepadState.lastAnalogDown = analogDown;

            // Confirm with X or A button
            const xButton = window.gamepadManager.getButton('X');
            const aButton = window.gamepadManager.getButton('A');

            if ((xButton.pressed && !this.gamepadState.lastX) ||
                (aButton.pressed && !this.gamepadState.lastA)) {
                const selectedButton = this.buttons[this.selectedMode];
                if (selectedButton) {
                    this.startGame(selectedButton.mode);
                }
            }

            this.gamepadState.lastX = xButton.pressed;
            this.gamepadState.lastA = aButton.pressed;
        }
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
