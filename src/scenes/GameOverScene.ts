import GameConfig from '../config/GameConfig.js';

interface CaughtFish {
    name: string;
    weight: string;
    points: string;
    depthZone: string;
    isEmergencyFish?: boolean;
}

interface ButtonContainer {
    container: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
    callback: () => void;
}

interface ButtonStates {
    left: boolean;
    right: boolean;
    x: boolean;
}

export class GameOverScene extends Phaser.Scene {
    private selectedButtonIndex: number = 0;
    private buttons: ButtonContainer[] = [];
    private buttonStates: ButtonStates;
    private gamepad?: Phaser.Input.Gamepad.Gamepad;

    constructor() {
        super({ key: 'GameOverScene' });

        this.buttonStates = {
            left: false,
            right: false,
            x: false
        };
    }

    create(): void {
        // Set up gamepad
        if (this.input.gamepad.total > 0) {
            this.gamepad = this.input.gamepad.getPad(0);
            console.log('🎮 Using existing gamepad for game over menu');
        }

        this.input.gamepad.once('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
            console.log('🎮 Gamepad connected for game over menu');
            this.gamepad = pad;
        });

        const { width, height } = this.cameras.main;

        // Get game data from registry
        const fishCaught = this.registry.get('finalFishCaught') || 0;
        const fishLost = this.registry.get('finalFishLost') || 0;
        const gameTime = this.registry.get('finalGameTime') || 0;
        const caughtFishData: CaughtFish[] = this.registry.get('caughtFishData') || [];

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
        this.add.text(width / 2, 40, 'SESSION COMPLETE', {
            fontSize: '32px',
            fontFamily: 'Courier New',
            color: '#ff6600',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Game stats - Format time as HH:MM:SS
        const hours = Math.floor(gameTime / 3600);
        const minutes = Math.floor((gameTime % 3600) / 60);
        const secs = gameTime % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        const statsY = 90;
        this.add.text(width / 2, statsY, 'GAME STATISTICS', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const stats = [
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
        const playAgainButton = this.createButton(width / 2 - 120, buttonY, 'PLAY AGAIN', () => {
            this.restartGame();
        });
        this.buttons.push(playAgainButton);

        const mainMenuButton = this.createButton(width / 2 + 120, buttonY, 'MAIN MENU', () => {
            this.goToMenu();
        });
        this.buttons.push(mainMenuButton);

        // Controls hint
        this.add.text(width / 2, height - 20, 'D-Pad/Arrows: Select | X/Enter: Confirm | ESC: Menu', {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#88ff88'
        }).setOrigin(0.5);

        // ESC to menu
        this.input.keyboard.once('keydown-ESC', () => {
            this.goToMenu();
        });

        // Highlight the first button initially
        this.updateButtonHighlight();

        // Fade in
        this.cameras.main.fadeIn(500);
    }

    update(): void {
        // Handle gamepad/keyboard input for button navigation
        this.handleMenuInput();
    }

    private handleMenuInput(): void {
        /**
         * Handle gamepad and keyboard input for button navigation
         */

        let leftPressed = false;
        let rightPressed = false;
        let confirmPressed = false;

        // Keyboard input
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT))) {
            leftPressed = true;
        }
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT))) {
            rightPressed = true;
        }
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)) ||
            Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X))) {
            confirmPressed = true;
        }

        // Gamepad input
        if (this.gamepad) {
            // D-pad left/right
            const dpadLeft = this.gamepad.buttons[14] && this.gamepad.buttons[14].pressed;
            const dpadRight = this.gamepad.buttons[15] && this.gamepad.buttons[15].pressed;

            // Left stick
            const leftStickX = this.gamepad.axes[0] ? this.gamepad.axes[0].getValue() : 0;

            if ((dpadLeft || leftStickX < -0.5) && !this.buttonStates.left) {
                leftPressed = true;
            }
            if ((dpadRight || leftStickX > 0.5) && !this.buttonStates.right) {
                rightPressed = true;
            }

            this.buttonStates.left = dpadLeft || leftStickX < -0.5;
            this.buttonStates.right = dpadRight || leftStickX > 0.5;

            // X button (Cross on PlayStation, A on Xbox) - button index 0
            const xButton = this.gamepad.buttons[0];
            const xButtonPressed = xButton && xButton.pressed;

            if (xButtonPressed && !this.buttonStates.x) {
                confirmPressed = true;
            }

            this.buttonStates.x = xButtonPressed;
        }

        // Navigate buttons
        if (leftPressed) {
            this.selectedButtonIndex--;
            if (this.selectedButtonIndex < 0) {
                this.selectedButtonIndex = this.buttons.length - 1;
            }
            this.updateButtonHighlight();
        }

        if (rightPressed) {
            this.selectedButtonIndex++;
            if (this.selectedButtonIndex >= this.buttons.length) {
                this.selectedButtonIndex = 0;
            }
            this.updateButtonHighlight();
        }

        // Confirm selection
        if (confirmPressed) {
            const selectedButton = this.buttons[this.selectedButtonIndex];
            if (selectedButton && selectedButton.callback) {
                selectedButton.callback();
            }
        }
    }

    private updateButtonHighlight(): void {
        /**
         * Update visual highlight for selected button
         */

        this.buttons.forEach((button, index) => {
            const isSelected = index === this.selectedButtonIndex;

            button.bg.clear();

            if (isSelected) {
                // Highlight selected button
                button.bg.fillStyle(0x3a5a4a, 1);
                button.bg.lineStyle(3, 0x00ffff, 1);
                button.bg.fillRoundedRect(-80, -20, 160, 40, 8);
                button.bg.strokeRoundedRect(-80, -20, 160, 40, 8);
                button.text.setColor('#00ffff');
                button.text.setFontSize(16);
            } else {
                // Normal button appearance
                button.bg.fillStyle(0x2a4a3a, 1);
                button.bg.lineStyle(2, 0x00ff00, 1);
                button.bg.fillRoundedRect(-80, -20, 160, 40, 8);
                button.bg.strokeRoundedRect(-80, -20, 160, 40, 8);
                button.text.setColor('#00ff00');
                button.text.setFontSize(14);
            }
        });
    }

    private createFishCard(x: number, y: number, fish: CaughtFish, number: number): Phaser.GameObjects.Container {
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

    private createButton(x: number, y: number, text: string, callback: () => void): ButtonContainer {
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
            // Update selected index when hovering with mouse
            const buttonIndex = this.buttons.findIndex(btn => btn.container === container);
            if (buttonIndex !== -1) {
                this.selectedButtonIndex = buttonIndex;
                this.updateButtonHighlight();
            }
        });

        container.on('pointerdown', callback);

        // Return button data structure
        return {
            container: container,
            bg: bg,
            text: buttonText,
            callback: callback
        };
    }

    private restartGame(): void {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }

    private goToMenu(): void {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }
}

export default GameOverScene;
