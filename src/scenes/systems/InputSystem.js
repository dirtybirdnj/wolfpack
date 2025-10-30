import GameConfig from '../../config/GameConfig.js';
import { Constants } from '../../utils/Constants.js';

/**
 * InputSystem - Handles all input (keyboard, gamepad, mouse)
 *
 * @module scenes/systems/InputSystem
 *
 * Responsibilities:
 * - Keyboard input handling
 * - Gamepad input handling with native Gamepad API
 * - Mouse/touch input
 * - Input state tracking
 * - Mode-specific controls (ice fishing vs boat)
 *
 * COMMON TASKS:
 * - Add new keyboard controls → handleKeyboardInput() method
 * - Add new gamepad controls → handleGamepadInput() method
 * - Change control mappings → setupInput() method
 *
 * @example
 * const inputSystem = new InputSystem(scene);
 * inputSystem.update(time, delta);
 */
export class InputSystem {
    /**
     * @param {Phaser.Scene} scene - The game scene
     */
    constructor(scene) {
        this.scene = scene;
        this.gamepadState = null;
        this.setupInput();
    }

    /**
     * Set up all input handlers (keyboard, mouse, gamepad)
     */
    setupInput() {
        // Keyboard controls
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.rKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

        // Mouse/touch controls (optional enhancement)
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.y > 100) {
                this.scene.lure.drop();
            }
        });

        // Gamepad support setup
        this.setupGamepad();
    }

    /**
     * Set up gamepad input handling
     */
    setupGamepad() {
        // Use native gamepad manager
        if (!window.gamepadManager) {
            console.warn('Native gamepad manager not available');
            return;
        }

        // Check if already connected
        if (window.gamepadManager.isConnected()) {
            const gamepad = window.gamepadManager.getGamepad();
            console.log('Gamepad already connected in game:', gamepad.id);
            this.showGamepadConnectedNotification(gamepad.id);
        }

        // Listen for new connections during gameplay
        window.gamepadManager.on('connected', (gamepad) => {
            console.log('Gamepad connected in game:', gamepad.id);
            this.showGamepadConnectedNotification(gamepad.id);
        });

        // Gamepad state tracking
        this.gamepadState = {
            lastR2Press: 0,
            r2MinInterval: 50, // Minimum milliseconds between R2 taps
            lastSpeedAdjust: 0,
            speedAdjustDelay: 150, // Delay between speed adjustments
            lastDpadUp: false,
            lastDpadDown: false,
            lastDpadLeft: false,
            lastDpadRight: false,
            lastL1: false,
            lastR1: false,
            lastA: false,
            lastB: false,
            lastX: false,
            lastY: false, // Triangle/Y button for movement mode
            lastStart: false // Start button for pause
        };
    }

    /**
     * Show a notification when gamepad connects
     * @param {string} gamepadId - The gamepad identifier
     */
    showGamepadConnectedNotification(gamepadId) {
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
     * Handle keyboard input
     */
    handleKeyboardInput() {
        // Check if in boat mode
        const isBoatMode = this.scene.boatManager !== null;

        if (isBoatMode) {
            // Boat mode: left/right moves the boat (but only if lure is at surface)
            if (this.cursors.left.isDown || this.cursors.right.isDown) {
                // Check if lure is at surface before allowing movement
                if (this.scene.lure.state === Constants.LURE_STATE.SURFACE) {
                    if (this.cursors.left.isDown) {
                        this.scene.boatManager.movePlayer(-1);
                    } else if (this.cursors.right.isDown) {
                        this.scene.boatManager.movePlayer(1);
                    }
                } else {
                    // Show warning if trying to move with lure down
                    if (!this.movementWarningShown) {
                        this.showMovementWarning();
                        this.movementWarningShown = true;
                        // Reset warning flag after a delay
                        this.scene.time.delayedCall(2000, () => {
                            this.movementWarningShown = false;
                        });
                    }
                    this.scene.boatManager.stopMoving();
                }
            } else {
                this.scene.boatManager.stopMoving();
            }

            // Up/down still controls lure
            if (this.spaceKey.isDown || this.cursors.down.isDown) {
                this.scene.lure.drop();
            }

            if (this.cursors.up.isDown) {
                this.scene.lure.retrieve();
            } else {
                this.scene.lure.stopRetrieve();
            }
        } else {
            // Ice fishing mode: original controls
            // Drop lure with space or down arrow
            if (this.spaceKey.isDown || this.cursors.down.isDown) {
                this.scene.lure.drop();
            }

            // Retrieve lure with up arrow
            if (this.cursors.up.isDown) {
                this.scene.lure.retrieve();
            } else {
                this.scene.lure.stopRetrieve();
            }

            // Adjust retrieve speed with left/right arrows
            if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
                this.scene.lure.adjustSpeed(-1);
                this.updateSpeedDisplay();
            }
            if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
                this.scene.lure.adjustSpeed(1);
                this.updateSpeedDisplay();
            }
        }

        // Reset lure with R key (all modes)
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.lure.reset();
        }
    }

    /**
     * Handle gamepad input
     */
    handleGamepadInput() {
        // Exit if no gamepad connected using native API
        if (!window.gamepadManager || !window.gamepadManager.isConnected()) {
            return;
        }

        const currentTime = this.scene.time.now;

        // Dead zone for analog inputs
        const DEAD_ZONE = 0.2;

        // Get button states using native API
        const dpadUpBtn = window.gamepadManager.getButton('DpadUp');
        const dpadDownBtn = window.gamepadManager.getButton('DpadDown');
        const dpadLeftBtn = window.gamepadManager.getButton('DpadLeft');
        const dpadRightBtn = window.gamepadManager.getButton('DpadRight');
        const l1Btn = window.gamepadManager.getButton('L1');
        const r1Btn = window.gamepadManager.getButton('R1');
        const aBtn = window.gamepadManager.getButton('X'); // X button on PS4 = A on Xbox
        const bBtn = window.gamepadManager.getButton('Circle'); // Circle on PS4 = B on Xbox
        const xBtn = window.gamepadManager.getButton('Square'); // Square on PS4 = X on Xbox
        const yBtn = window.gamepadManager.getButton('Triangle'); // Triangle on PS4 = Y on Xbox

        // Get analog stick axes
        const leftStickX = window.gamepadManager.getAxis(0); // Left stick X
        const leftStickY = window.gamepadManager.getAxis(1); // Left stick Y

        // === ICE HOLE MOVEMENT MODE (Ice fishing only) ===
        if (this.scene.iceHoleManager) {
            // Triangle/Y button: Toggle movement mode (walk on ice)
            if (yBtn.pressed && !this.gamepadState.lastY) {
                if (this.scene.iceHoleManager.movementMode) {
                    this.scene.iceHoleManager.exitMovementMode();
                } else {
                    this.scene.iceHoleManager.enterMovementMode();
                }
            }
            this.gamepadState.lastY = yBtn.pressed;

            // If in movement mode, different controls apply
            if (this.scene.iceHoleManager.movementMode) {
                // L/R movement on ice surface - slower, more sensitive
                // Controls are inverted: left button moves holes left (player moves right in world)
                const moveSpeed = 2;
                if (dpadLeftBtn.pressed || leftStickX < -DEAD_ZONE) {
                    this.scene.iceHoleManager.movePlayer(moveSpeed); // Move player right, holes appear to move left
                }
                if (dpadRightBtn.pressed || leftStickX > DEAD_ZONE) {
                    this.scene.iceHoleManager.movePlayer(-moveSpeed); // Move player left, holes appear to move right
                }

                // Square/X button: Drill new hole
                if (xBtn.pressed && !this.gamepadState.lastX) {
                    this.scene.iceHoleManager.drillNewHole();
                }
                this.gamepadState.lastX = xBtn.pressed;

                // Exit early - don't process fishing controls
                return;
            }
        }

        // === BOAT/KAYAK MOVEMENT (Summer modes only) ===
        if (this.scene.boatManager) {
            // D-pad left/right and left stick X: Move boat/kayak (but only if lure is at surface)
            const movingLeft = dpadLeftBtn.pressed || leftStickX < -DEAD_ZONE;
            const movingRight = dpadRightBtn.pressed || leftStickX > DEAD_ZONE;

            if (movingLeft || movingRight) {
                // Check if lure is at surface before allowing movement
                if (this.scene.lure.state === Constants.LURE_STATE.SURFACE) {
                    if (movingLeft) {
                        this.scene.boatManager.movePlayer(-1);
                    } else if (movingRight) {
                        this.scene.boatManager.movePlayer(1);
                    }
                } else {
                    // Show warning if trying to move with lure down
                    if (!this.movementWarningShown) {
                        this.showMovementWarning();
                        this.movementWarningShown = true;
                        // Reset warning flag after a delay
                        this.scene.time.delayedCall(2000, () => {
                            this.movementWarningShown = false;
                        });
                    }
                    this.scene.boatManager.stopMoving();
                }
            } else {
                this.scene.boatManager.stopMoving();
            }
        }

        // === FISHING MODE (normal controls) ===

        // === RIGHT TRIGGER (R2): VARIABLE SPEED REELING ===
        // R2 trigger controls reel speed based on pressure (like a real baitcaster)
        // Tapping R2 while dropping engages the clutch and stops the drop
        const r2Trigger = window.gamepadManager.getButton('R2');
        const triggerThreshold = 0.1; // Minimum trigger pressure to start reeling

        if (r2Trigger.value > triggerThreshold) {
            // Use trigger pressure to control reel speed
            // Light pressure = slow retrieve, full pressure = fast retrieve
            this.scene.lure.retrieveWithTrigger(r2Trigger.value);
        } else {
            // R2 not pressed - check D-pad up for binary retrieve (backwards compatibility)
            if (dpadUpBtn.pressed) {
                this.scene.lure.retrieve();
            } else {
                // Only stop retrieve if keyboard also isn't retrieving
                if (!this.cursors.up.isDown) {
                    this.scene.lure.stopRetrieve();
                }
            }
        }

        // D-pad DOWN: Drop line (release spool)
        if (dpadDownBtn.pressed) {
            this.scene.lure.drop();
        }

        // X button (A on Xbox, X on PS4): Drop line (release spool)
        if (aBtn.pressed && !this.gamepadState.lastA) {
            this.scene.lure.drop();
        }
        this.gamepadState.lastA = aBtn.pressed;

        // B button (Circle on PS4): Reset lure
        if (bBtn.pressed && !this.gamepadState.lastB) {
            this.scene.lure.reset();
        }
        this.gamepadState.lastB = bBtn.pressed;

        // X button (Square on PS4): Toggle debug mode
        if (xBtn.pressed && !this.gamepadState.lastX) {
            this.scene.debugMode = !this.scene.debugMode;
        }
        this.gamepadState.lastX = xBtn.pressed;

        // === RIGHT STICK: JIGGING CONTROL ===
        // Right stick Y-axis for fine vertical lure control (1-2 inch movements)
        const rightStickY = window.gamepadManager.getAxis(3); // Right stick Y axis
        this.scene.lure.applyJig(rightStickY, DEAD_ZONE);

        // === L1/R1 BUMPERS: DRAG ADJUSTMENT ===
        // L1: Decrease drag by 10%
        // R1: Increase drag by 10%
        if (this.scene.reelModel) {
            // L1 pressed - decrease drag
            if (l1Btn.pressed && !this.gamepadState.lastL1) {
                this.scene.reelModel.adjustDrag(-10);
                console.log(`Drag decreased to ${this.scene.reelModel.dragSetting}% (${this.scene.reelModel.getCurrentDragForce().toFixed(1)} lbs)`);
            }
            this.gamepadState.lastL1 = l1Btn.pressed;

            // R1 pressed - increase drag
            if (r1Btn.pressed && !this.gamepadState.lastR1) {
                this.scene.reelModel.adjustDrag(+10);
                console.log(`Drag increased to ${this.scene.reelModel.dragSetting}% (${this.scene.reelModel.getCurrentDragForce().toFixed(1)} lbs)`);
            }
            this.gamepadState.lastR1 = r1Btn.pressed;
        }
    }

    /**
     * Handle fish fight input (spacebar or R2 rapid tapping)
     * @returns {boolean} True if reel input was pressed this frame
     */
    handleFishFightInput() {
        const spacePressed = Phaser.Input.Keyboard.JustDown(this.spaceKey);

        // Check R2 trigger for gamepad (rapid tapping) using native API
        let r2Pressed = false;
        if (window.gamepadManager && window.gamepadManager.isConnected()) {
            const r2Button = window.gamepadManager.getButton('R2');
            const currentTime = this.scene.time.now;

            // Trigger pressed (value > 0.5 threshold) and enough time has passed
            if (r2Button.value > 0.5 && currentTime - this.gamepadState.lastR2Press >= this.gamepadState.r2MinInterval) {
                r2Pressed = true;
                this.gamepadState.lastR2Press = currentTime;
            }
        }

        return spacePressed || r2Pressed;
    }

    /**
     * Check for pause input
     * @returns {boolean} True if pause button was pressed
     */
    checkPauseInput() {
        // Check keyboard
        if (Phaser.Input.Keyboard.JustDown(this.escKey) || Phaser.Input.Keyboard.JustDown(this.pKey)) {
            return true;
        }

        // Check gamepad
        if (window.gamepadManager && window.gamepadManager.isConnected()) {
            const startBtn = window.gamepadManager.getButton('Start');
            if (startBtn.pressed && !this.gamepadState.lastStart) {
                this.gamepadState.lastStart = true;
                return true;
            }
            this.gamepadState.lastStart = startBtn.pressed;
        }

        return false;
    }

    /**
     * Show movement warning when trying to move with lure down
     */
    showMovementWarning() {
        // This will be moved to NotificationSystem later
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 100,
            'Reel Up First\nReel up to move locations',
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
     * Update speed display in UI
     */
    updateSpeedDisplay() {
        const lureInfo = this.scene.lure.getInfo();
        this.scene.events.emit('updateLureInfo', lureInfo);
    }

    /**
     * Update input system each frame
     * @param {number} time - Current game time
     * @param {number} delta - Time since last frame
     */
    update(time, delta) {
        // Input is handled in different phases during GameScene update
        // This method is here for future expansion if needed
    }

    /**
     * Clean up input system
     */
    destroy() {
        // Input handlers are managed by Phaser scene
        this.gamepadState = null;
    }
}

export default InputSystem;
