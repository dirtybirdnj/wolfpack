import GameConfig from '../../config/GameConfig.js';

/**
 * NotificationSystem - Handles all in-game notifications and messages
 *
 * @module scenes/systems/NotificationSystem
 *
 * Responsibilities:
 * - Show catch notifications
 * - Display game mode messages
 * - Show pause overlay
 * - Display temporary messages (warnings, tips, etc.)
 * - Handle all tween-based text animations
 *
 * COMMON TASKS:
 * - Add new notification type → add new show*() method
 * - Change notification styling → modify text style parameters
 * - Adjust animation timing → modify tween duration/delay
 *
 * @example
 * const notificationSystem = new NotificationSystem(scene);
 * notificationSystem.showCatchNotification(fish);
 */
export class NotificationSystem {
    /**
     * @param {Phaser.Scene} scene - The game scene
     */
    constructor(scene) {
        this.scene = scene;
        this.pauseOverlay = null;
        this.isPaused = false;

        // Menu navigation state
        this.selectedButtonIndex = 0; // 0 = Resume, 1 = Tackle Box, 2 = Controls, 3 = Main Menu
        this.buttons = [];
        this.buttonStates = {
            up: false,
            down: false,
            x: false,
            circle: false
        };

        // Controls dialog state
        this.controlsDialogOpen = false;

        // Flag to signal switching to tackle box
        this.switchToTackleBox = false;
    }

    /**
     * Show game mode notification at start
     */
    showGameModeNotification() {
        const modeText = this.scene.gameMode === GameConfig.GAME_MODE_ARCADE ?
            'ARCADE MODE\n2 Minutes - Catch as many as you can!' :
            'UNLIMITED MODE\nRelax and fish at your own pace';

        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 120, modeText, {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3
        });
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 3000,
            delay: 1000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * Show fish caught notification
     * @param {Fish} fish - The fish that was caught
     */
    showCatchNotification(fish) {
        const info = fish.getInfo();
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 240,
            `FISH ON!\n${info.weight}\n+${fish.points} points`,
            {
                fontSize: '19px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        // Animate and remove
        this.scene.tweens.add({
            targets: text,
            y: 200,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
            }
        });
    }

    /**
     * Show fish hooked notification (start of fight)
     */
    showFishHookedNotification() {
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 160,
            'FISH ON!\nTAP SPACEBAR OR R2 TO REEL!',
            {
                fontSize: '22px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * Show gamepad connected notification
     * @param {string} gamepadId - The gamepad identifier
     */
    showGamepadConnected(gamepadId) {
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 40, 'Gamepad Connected!', {
            fontSize: '13px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            delay: 1000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * Show generic message
     * @param {string} title - Message title
     * @param {string} description - Message description
     * @param {number} y - Y position (default: 100)
     */
    showMessage(title, description, y = 100) {
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, y,
            `${title}\n${description}`,
            {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.createPauseOverlay();
            console.log('Game paused');
        } else {
            this.destroyPauseOverlay();
            console.log('Game resumed');
        }

        return this.isPaused;
    }

    /**
     * Create pause overlay
     */
    createPauseOverlay() {
        if (this.pauseOverlay) return; // Already exists

        // Semi-transparent black overlay
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        overlay.setDepth(2000);

        // PAUSED text
        const pausedText = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 180, 'PAUSED', {
            fontSize: '42px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        pausedText.setOrigin(0.5, 0.5);
        pausedText.setDepth(2001);

        // Reset button selection
        this.selectedButtonIndex = 0;
        this.buttons = [];

        // Create menu buttons
        const centerY = GameConfig.CANVAS_HEIGHT / 2 + 10;
        const buttonSpacing = 65;

        const resumeButton = this.createPauseMenuButton(
            GameConfig.CANVAS_WIDTH / 2,
            centerY,
            'RESUME',
            () => this.togglePause()
        );
        this.buttons.push(resumeButton);

        const tackleBoxButton = this.createPauseMenuButton(
            GameConfig.CANVAS_WIDTH / 2,
            centerY + buttonSpacing,
            'TACKLE BOX',
            () => this.openTackleBox()
        );
        this.buttons.push(tackleBoxButton);

        const controlsButton = this.createPauseMenuButton(
            GameConfig.CANVAS_WIDTH / 2,
            centerY + buttonSpacing * 2,
            'CONTROLS',
            () => this.showControlsDialog()
        );
        this.buttons.push(controlsButton);

        const mainMenuButton = this.createPauseMenuButton(
            GameConfig.CANVAS_WIDTH / 2,
            centerY + buttonSpacing * 3,
            'MAIN MENU',
            () => this.goToMainMenu()
        );
        this.buttons.push(mainMenuButton);

        // Controls hint
        const hintText = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT - 60,
            'D-Pad/Arrows: Navigate | X/Enter: Select | CIRCLE/ESC: Resume', {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#88ff88',
            stroke: '#000000',
            strokeThickness: 2
        });
        hintText.setOrigin(0.5, 0.5);
        hintText.setDepth(2001);

        // Update button highlights
        this.updatePauseMenuHighlight();

        this.pauseOverlay = {
            overlay,
            pausedText,
            hintText,
            buttons: this.buttons
        };
    }

    /**
     * Create a pause menu button
     */
    createPauseMenuButton(x, y, text, callback) {
        const container = this.scene.add.container(x, y);
        container.setDepth(2001);

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2a4a3a, 1);
        bg.lineStyle(2, 0x00ff00, 1);
        bg.fillRoundedRect(-100, -25, 200, 50, 8);
        bg.strokeRoundedRect(-100, -25, 200, 50, 8);

        const buttonText = this.scene.add.text(0, 0, text, {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        buttonText.setOrigin(0.5);

        container.add([bg, buttonText]);

        return {
            container: container,
            bg: bg,
            text: buttonText,
            callback: callback
        };
    }

    /**
     * Update visual highlight for selected button in pause menu
     */
    updatePauseMenuHighlight() {
        this.buttons.forEach((button, index) => {
            const isSelected = index === this.selectedButtonIndex;

            button.bg.clear();

            if (isSelected) {
                // Highlight selected button
                button.bg.fillStyle(0x3a5a4a, 1);
                button.bg.lineStyle(3, 0x00ffff, 1);
                button.bg.fillRoundedRect(-100, -25, 200, 50, 8);
                button.bg.strokeRoundedRect(-100, -25, 200, 50, 8);
                button.text.setColor('#00ffff');
                button.text.setFontSize('18px');
            } else {
                // Normal button appearance
                button.bg.fillStyle(0x2a4a3a, 1);
                button.bg.lineStyle(2, 0x00ff00, 1);
                button.bg.fillRoundedRect(-100, -25, 200, 50, 8);
                button.bg.strokeRoundedRect(-100, -25, 200, 50, 8);
                button.text.setColor('#00ff00');
                button.text.setFontSize('16px');
            }
        });
    }

    /**
     * Close controls dialog
     */
    closeControlsDialog() {
        if (!this.controlsDialogOpen) return;

        // Destroy all dialog elements
        this.controlsDialog.background.destroy();
        this.controlsDialog.elements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });

        this.controlsDialog = null;
        this.controlsDialogOpen = false;
    }

    /**
     * Handle input for pause menu navigation
     */
    handlePauseMenuInput() {
        // If controls dialog is open, handle closing it
        if (this.controlsDialogOpen) {
            let closePressed = false;

            // Keyboard input
            if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)) ||
                Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X)) ||
                Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC))) {
                closePressed = true;
            }

            // Gamepad input
            if (this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
                const gamepad = this.scene.input.gamepad.getPad(0);
                if (gamepad) {
                    const xButton = gamepad.buttons[0]; // X/A button
                    const circleButton = gamepad.buttons[1]; // Circle/B button

                    const xPressed = xButton ? xButton.pressed : false;
                    const circlePressed = circleButton ? circleButton.pressed : false;

                    if ((xPressed && !this.buttonStates.x) ||
                        (circlePressed && !this.buttonStates.circle)) {
                        closePressed = true;
                    }

                    this.buttonStates.x = xPressed;
                    this.buttonStates.circle = circlePressed;
                }
            }

            if (closePressed) {
                this.closeControlsDialog();
            }

            return; // Don't process menu navigation while dialog is open
        }

        if (!this.isPaused) return;

        let upPressed = false;
        let downPressed = false;
        let confirmPressed = false;

        // Keyboard input
        const cursors = this.scene.input.keyboard.createCursorKeys();
        if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
            upPressed = true;
        }
        if (Phaser.Input.Keyboard.JustDown(cursors.down)) {
            downPressed = true;
        }
        if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)) ||
            Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X))) {
            confirmPressed = true;
        }

        // Gamepad input
        let circlePressed = false;

        if (window.gamepadManager && window.gamepadManager.isConnected()) {
            const circleButton = window.gamepadManager.getButton('Circle');

            // CIRCLE button - close pause menu and return to game
            if (circleButton && circleButton.pressed && !this.buttonStates.circle) {
                circlePressed = true;
            }
            this.buttonStates.circle = circleButton ? circleButton.pressed : false;
        }

        if (this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
            const gamepad = this.scene.input.gamepad.getPad(0);

            if (gamepad) {
                // D-pad up/down
                const dpadUpButton = gamepad.buttons[12];
                const dpadDownButton = gamepad.buttons[13];
                const dpadUp = dpadUpButton ? dpadUpButton.pressed : false;
                const dpadDown = dpadDownButton ? dpadDownButton.pressed : false;

                // Left stick
                const leftStickY = gamepad.axes.length > 1 ? gamepad.axes[1].getValue() : 0;

                if ((dpadUp || leftStickY < -0.5) && !this.buttonStates.up) {
                    upPressed = true;
                }
                if ((dpadDown || leftStickY > 0.5) && !this.buttonStates.down) {
                    downPressed = true;
                }

                this.buttonStates.up = dpadUp || leftStickY < -0.5;
                this.buttonStates.down = dpadDown || leftStickY > 0.5;

                // X button (Cross on PlayStation, A on Xbox)
                const xButton = gamepad.buttons[0];
                const xButtonPressed = xButton ? xButton.pressed : false;

                if (xButtonPressed && !this.buttonStates.x) {
                    confirmPressed = true;
                }

                this.buttonStates.x = xButtonPressed;
            }
        }

        // Navigate buttons
        if (upPressed) {
            this.selectedButtonIndex--;
            if (this.selectedButtonIndex < 0) {
                this.selectedButtonIndex = this.buttons.length - 1;
            }
            this.updatePauseMenuHighlight();
        }

        if (downPressed) {
            this.selectedButtonIndex++;
            if (this.selectedButtonIndex >= this.buttons.length) {
                this.selectedButtonIndex = 0;
            }
            this.updatePauseMenuHighlight();
        }

        // Confirm selection
        if (confirmPressed) {
            const selectedButton = this.buttons[this.selectedButtonIndex];
            if (selectedButton && selectedButton.callback) {
                selectedButton.callback();
            }
        }

        // CIRCLE button - close pause menu and return to gameplay
        if (circlePressed) {
            this.togglePause(); // Unpause and return to game
        }
    }

    /**
     * Show controls dialog
     */
    showControlsDialog() {
        if (this.controlsDialogOpen) return;

        this.controlsDialogOpen = true;

        // Create controls dialog overlay
        const dialogBg = this.scene.add.graphics();
        dialogBg.fillStyle(0x000000, 0.95);
        dialogBg.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        dialogBg.setDepth(2100);

        // Title
        const title = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 30, 'CONTROLS', {
            fontSize: '32px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        title.setOrigin(0.5);
        title.setDepth(2101);

        // Create two-column layout for controls
        const leftX = 120;
        const rightX = 520;
        let currentY = 80;

        // Keyboard controls section
        const kbTitle = this.scene.add.text(leftX, currentY, 'KEYBOARD CONTROLS', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        kbTitle.setDepth(2101);

        currentY += 30;

        const keyboardControls = [
            { key: 'SPACE / ↓', action: 'Release Spool (Drop)' },
            { key: '↑', action: 'Engage Clutch & Retrieve' },
            { key: 'Release ↑', action: 'Hold Position' },
            { key: '← →', action: 'Adjust Reel Speed' },
            { key: 'R', action: 'Reset to Surface' },
            { key: 'ESC / P / START', action: 'Pause / Resume' },
            { key: 'D / BACKSPACE', action: 'Toggle Debug Mode' }
        ];

        keyboardControls.forEach(control => {
            const controlText = this.scene.add.text(leftX, currentY, `${control.key}`, {
                fontSize: '11px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 1
            });
            controlText.setDepth(2101);

            const actionText = this.scene.add.text(leftX + 140, currentY, control.action, {
                fontSize: '11px',
                fontFamily: 'Courier New',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 1
            });
            actionText.setDepth(2101);

            currentY += 20;
        });

        // Gamepad controls section
        currentY = 80;
        const gpTitle = this.scene.add.text(rightX, currentY, 'GAMEPAD CONTROLS', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        gpTitle.setDepth(2101);

        currentY += 30;

        // Fishing mode controls
        const fishingLabel = this.scene.add.text(rightX, currentY, 'FISHING MODE', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#ff9900',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        });
        fishingLabel.setDepth(2101);
        currentY += 22;

        const gamepadFishingControls = [
            { key: 'X (PS: ×)', action: 'Release Spool (Drop)' },
            { key: 'D-PAD ↓', action: 'Release Spool (Alt)' },
            { key: 'R2', action: 'Reel (Pressure Sensitive)' },
            { key: 'D-PAD ↑', action: 'Reel (Fixed Speed)' },
            { key: 'R-STICK ↕', action: 'Jigging (Fine Control)' },
            { key: 'CIRCLE (PS: ○)', action: 'Reset to Surface' },
            { key: 'SQUARE (PS: □)', action: 'Toggle Debug Mode' },
            { key: 'START', action: 'Pause / Resume' }
        ];

        gamepadFishingControls.forEach(control => {
            const controlText = this.scene.add.text(rightX, currentY, `${control.key}`, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 1
            });
            controlText.setDepth(2101);

            const actionText = this.scene.add.text(rightX + 130, currentY, control.action, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 1
            });
            actionText.setDepth(2101);

            currentY += 18;
        });

        // Movement mode controls
        currentY += 10;
        const movementLabel = this.scene.add.text(rightX, currentY, 'MOVEMENT MODE (Ice Fishing)', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#ff9900',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        });
        movementLabel.setDepth(2101);
        currentY += 22;

        const gamepadMovementControls = [
            { key: 'TRIANGLE (PS: △)', action: 'Toggle Move/Fish Mode' },
            { key: 'D-PAD ←→', action: 'Walk on Ice' },
            { key: 'L-STICK ←→', action: 'Walk on Ice (Alt)' },
            { key: 'SQUARE (PS: □)', action: 'Drill New Hole' }
        ];

        gamepadMovementControls.forEach(control => {
            const controlText = this.scene.add.text(rightX, currentY, `${control.key}`, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 1
            });
            controlText.setDepth(2101);

            const actionText = this.scene.add.text(rightX + 130, currentY, control.action, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 1
            });
            actionText.setDepth(2101);

            currentY += 18;
        });

        // Boat/Kayak controls
        currentY += 10;
        const boatLabel = this.scene.add.text(rightX, currentY, 'BOAT/KAYAK MODE', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#ff9900',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        });
        boatLabel.setDepth(2101);
        currentY += 22;

        const boatControls = [
            { key: 'D-PAD ←→', action: 'Move Boat/Kayak' },
            { key: 'L-STICK ←→', action: 'Move Boat/Kayak (Alt)' },
            { key: 'SELECT', action: 'Navigation Map' }
        ];

        boatControls.forEach(control => {
            const controlText = this.scene.add.text(rightX, currentY, `${control.key}`, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 1
            });
            controlText.setDepth(2101);

            const actionText = this.scene.add.text(rightX + 130, currentY, control.action, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 1
            });
            actionText.setDepth(2101);

            currentY += 18;
        });

        // Close button hint
        const closeHint = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT - 30,
            'Press X, ENTER, or CIRCLE to close', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#88ff88',
            stroke: '#000000',
            strokeThickness: 2
        });
        closeHint.setOrigin(0.5);
        closeHint.setDepth(2101);

        // Store dialog elements
        this.controlsDialog = {
            background: dialogBg,
            elements: [title, kbTitle, gpTitle, fishingLabel, movementLabel, boatLabel, closeHint]
        };

        // Add all control text elements
        this.scene.children.list.forEach(child => {
            if (child.depth === 2101 && child !== title && child !== kbTitle && child !== gpTitle &&
                child !== fishingLabel && child !== movementLabel && child !== boatLabel && child !== closeHint) {
                this.controlsDialog.elements.push(child);
            }
        });
    }

    /**
     * Open tackle box from pause menu
     */
    openTackleBox() {
        this.switchToTackleBox = true;
        this.togglePause(); // Close pause menu (game stays paused via tackle box)
    }

    /**
     * Go to main menu
     */
    goToMainMenu() {
        this.destroyPauseOverlay();
        this.isPaused = false;
        this.scene.cameras.main.fadeOut(500);
        this.scene.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.scene.start('MenuScene');
        });
    }

    /**
     * Destroy pause overlay
     */
    destroyPauseOverlay() {
        if (!this.pauseOverlay) return;

        // Close controls dialog if open
        if (this.controlsDialogOpen) {
            this.closeControlsDialog();
        }

        this.pauseOverlay.overlay.destroy();
        this.pauseOverlay.pausedText.destroy();
        this.pauseOverlay.hintText.destroy();

        // Destroy all buttons
        this.pauseOverlay.buttons.forEach(button => {
            button.container.destroy();
        });

        this.pauseOverlay = null;
        this.buttons = [];
    }

    /**
     * Check if game is paused
     * @returns {boolean} True if paused
     */
    isPausedState() {
        return this.isPaused;
    }

    /**
     * Update notification system each frame
     * @param {number} time - Current game time
     * @param {number} delta - Time since last frame
     */
    update(time, delta) {
        // Handle pause menu input when paused
        if (this.isPaused) {
            this.handlePauseMenuInput();
        }
    }

    /**
     * Clean up notification system
     */
    destroy() {
        if (this.pauseOverlay) {
            this.destroyPauseOverlay();
        }
    }
}

export default NotificationSystem;
