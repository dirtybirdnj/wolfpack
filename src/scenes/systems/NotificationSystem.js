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
            circle: false,
            select: false
        };

        // Controls dialog state
        this.controlsDialogOpen = false;

        // Flag to signal switching to tackle box
        this.switchToTackleBox = false;

        // Gamepad disconnect warning state
        this.disconnectWarning = null;
        this.controllerReconnected = false; // Track when controller reconnects
        this.xButtonWasPressed = false; // Track X button state for disconnect warning
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
     * Show gamepad disconnected warning
     * Important notification when controller dies during gameplay
     */
    showGamepadDisconnected() {
        // Create persistent overlay that stays until dismissed - reduced opacity
        // Use dynamic scale dimensions instead of hardcoded GameConfig values
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.4);
        overlay.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
        overlay.setDepth(3000);

        // Warning title - use dynamic scale for centering
        const centerX = this.scene.scale.width / 2;
        const title = this.scene.add.text(centerX, 130, '⚠️ CONTROLLER DISCONNECTED', {
            fontSize: '32px',
            fontFamily: 'Courier New',
            color: '#ff6600',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        title.setOrigin(0.5, 0.5);
        title.setDepth(3001);

        // Warning message
        const message = this.scene.add.text(centerX, 210,
            'Your controller has been disconnected.\n\n' +
            'Check battery or connection, then press\n' +
            'any button on the controller to reconnect.\n\n' +
            'Or use keyboard controls to continue.',
            {
                fontSize: '16px',
                fontFamily: 'Courier New',
                color: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2,
                lineSpacing: 8
            }
        );
        message.setOrigin(0.5, 0.5);
        message.setDepth(3001);

        // Continue hint
        const hint = this.scene.add.text(centerX, 330,
            'Press SPACEBAR or ESC to dismiss',
            {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#88ff88',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        hint.setOrigin(0.5, 0.5);
        hint.setDepth(3001);

        // Pulse animation for title
        this.scene.tweens.add({
            targets: title,
            alpha: 0.6,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Store reference for dismissal
        this.disconnectWarning = {
            overlay: overlay,
            title: title,
            message: message,
            hint: hint
        };

        // Pause the game using the same system as START button
        // This freezes the game state so player doesn't lose fish
        this.isPaused = true;
        this.controllerReconnected = false;
        this.xButtonWasPressed = false;

        return this.disconnectWarning;
    }

    /**
     * Dismiss gamepad disconnected warning
     */
    dismissDisconnectWarning() {
        if (!this.disconnectWarning) return;

        this.disconnectWarning.overlay.destroy();
        this.disconnectWarning.title.destroy();
        this.disconnectWarning.message.destroy();
        this.disconnectWarning.hint.destroy();

        this.disconnectWarning = null;
        this.controllerReconnected = false;

        // Resume the game using the same system as START button
        this.isPaused = false;
    }

    /**
     * Check if disconnect warning is active
     */
    hasDisconnectWarning() {
        return this.disconnectWarning !== null && this.disconnectWarning !== undefined;
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

        // Semi-transparent black overlay - reduced opacity to see game
        // Use dynamic scale dimensions instead of hardcoded GameConfig values
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.4);
        overlay.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
        overlay.setDepth(2000);

        // PAUSED text - use dynamic scale for centering
        const centerX = this.scene.scale.width / 2;
        const pausedText = this.scene.add.text(centerX, 180, 'PAUSED', {
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

        // Create menu buttons - use dynamic scale for positioning
        const centerY = this.scene.scale.height / 2 + 10;
        const buttonSpacing = 65;

        const resumeButton = this.createPauseMenuButton(
            centerX,
            centerY,
            'RESUME',
            () => this.togglePause()
        );
        this.buttons.push(resumeButton);

        const tackleBoxButton = this.createPauseMenuButton(
            centerX,
            centerY + buttonSpacing,
            'TACKLE BOX',
            () => this.openTackleBox()
        );
        this.buttons.push(tackleBoxButton);

        const controlsButton = this.createPauseMenuButton(
            centerX,
            centerY + buttonSpacing * 2,
            'CONTROLS',
            () => this.showControlsDialog()
        );
        this.buttons.push(controlsButton);

        const mainMenuButton = this.createPauseMenuButton(
            centerX,
            centerY + buttonSpacing * 3,
            'MAIN MENU',
            () => this.goToMainMenu()
        );
        this.buttons.push(mainMenuButton);

        // Controls hint - use dynamic scale for positioning
        const hintText = this.scene.add.text(centerX, this.scene.scale.height - 60,
            'D-Pad/Arrows: Navigate | X: Select | SELECT: Tackle Box | CIRCLE: Resume', {
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
        let selectPressed = false;

        if (window.gamepadManager && window.gamepadManager.isConnected()) {
            const circleButton = window.gamepadManager.getButton('Circle');
            const selectButton = window.gamepadManager.getButton('Select');

            // CIRCLE button - close pause menu and return to game
            if (circleButton && circleButton.pressed && !this.buttonStates.circle) {
                circlePressed = true;
            }
            this.buttonStates.circle = circleButton ? circleButton.pressed : false;

            // SELECT button - open tackle box
            if (selectButton && selectButton.pressed && !this.buttonStates.select) {
                selectPressed = true;
            }
            this.buttonStates.select = selectButton ? selectButton.pressed : false;
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

        // SELECT button - open tackle box (same as selecting Tackle Box button)
        if (selectPressed) {
            this.openTackleBox();
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

        // Create controls dialog overlay - reduced opacity to see game
        // Use dynamic scale dimensions instead of hardcoded GameConfig values
        const dialogBg = this.scene.add.graphics();
        dialogBg.fillStyle(0x000000, 0.4);
        dialogBg.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
        dialogBg.setDepth(2100);

        // Title - use dynamic scale for centering
        const centerX = this.scene.scale.width / 2;
        const title = this.scene.add.text(centerX, 30, 'CONTROLS', {
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

        // Movement controls removed - simplified gameplay

        // Close button hint - use dynamic scale for centering
        const closeHint = this.scene.add.text(centerX, this.scene.scale.height - 30,
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
        // Handle pause menu input when paused (but NOT when disconnect warning is showing)
        if (this.isPaused && !this.hasDisconnectWarning()) {
            this.handlePauseMenuInput();
        }

        // Handle disconnect warning dismissal
        if (this.hasDisconnectWarning()) {
            // Check if controller reconnected
            if (window.gamepadManager && window.gamepadManager.isConnected() && !this.controllerReconnected) {
                // Controller just reconnected - update message to show "Press X to continue"
                this.controllerReconnected = true;

                // Update the hint text
                this.disconnectWarning.hint.setText('🎮 Controller Reconnected!\nPress X to continue');
                this.disconnectWarning.hint.setColor('#00ff00');

                // Stop the title pulsing animation (controller is back!)
                this.scene.tweens.killTweensOf(this.disconnectWarning.title);
                this.disconnectWarning.title.setAlpha(1);
                this.disconnectWarning.title.setColor('#00ff00');
            }

            // If controller is reconnected, wait for X button to continue
            if (this.controllerReconnected) {
                let xButtonPressed = false;
                let dismissWarning = false;

                // Check X button on gamepad (with JustDown logic)
                if (window.gamepadManager && window.gamepadManager.isConnected()) {
                    const xButton = window.gamepadManager.getButton('X');
                    xButtonPressed = xButton && xButton.pressed;

                    // JustDown = pressed now but wasn't pressed before
                    if (xButtonPressed && !this.xButtonWasPressed) {
                        dismissWarning = true;
                    }
                }

                // Update button state for next frame
                this.xButtonWasPressed = xButtonPressed;

                // Also allow keyboard X or SPACE
                const xKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
                const spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

                if (Phaser.Input.Keyboard.JustDown(xKey) || Phaser.Input.Keyboard.JustDown(spaceKey) || dismissWarning) {
                    this.dismissDisconnectWarning();
                }
            } else {
                // Controller still disconnected - allow keyboard dismissal
                const spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
                const escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

                if (Phaser.Input.Keyboard.JustDown(spaceKey) || Phaser.Input.Keyboard.JustDown(escKey)) {
                    this.dismissDisconnectWarning();
                }
            }
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
