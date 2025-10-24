import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import SonarDisplay from '../utils/SonarDisplay.js';
import Lure from '../entities/Lure.js';
import Fish from '../entities/Fish.js';
import FishFight from '../entities/FishFight.js';
import BaitfishCloud from '../entities/BaitfishCloud.js';
import IceHoleManager from '../managers/IceHoleManager.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.fishes = [];
        this.baitfishClouds = [];
        this.score = 0;
        this.fishCaught = 0;
        this.fishLost = 0; // Track fish that broke the line
        this.gameTime = 0;
        this.waterTemp = 40; // Typical Lake Champlain winter temp
        this.debugMode = false; // Dev tools debug mode
        this.debugGraphics = null;
        this.currentFight = null; // Active fish fight
        this.controllerTestMode = false; // Controller test window active
        this.controllerTestUI = null; // Test UI elements
    }
    
    create() {
        // Set up ice hole manager (must be first!)
        this.iceHoleManager = new IceHoleManager(this);

        // Set up the sonar display
        this.sonarDisplay = new SonarDisplay(this);

        // Create the player's lure - start at better viewing depth
        this.lure = new Lure(this, GameConfig.CANVAS_WIDTH / 2, 100); // Centered, 25ft deep

        // Set up input handlers
        this.setupInput();
        
        // Set water temperature (affects fish behavior)
        this.waterTemp = Utils.randomBetween(GameConfig.WATER_TEMP_MIN, GameConfig.WATER_TEMP_MAX);
        
        // Event listeners
        this.events.on('fishCaught', this.handleFishCaught, this);
        
        // Start spawning fish
        this.time.addEvent({
            delay: 1000,
            callback: this.trySpawnFish,
            callbackScope: this,
            loop: true
        });

        // Start spawning baitfish clouds
        this.time.addEvent({
            delay: 2000,
            callback: this.trySpawnBaitfishCloud,
            callbackScope: this,
            loop: true
        });

        // Fade in
        this.cameras.main.fadeIn(500);

        // Ambient game timer
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.gameTime++;
                this.updateGameStats();
            },
            callbackScope: this,
            loop: true
        });
    }
    
    setupInput() {
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        // Mouse/touch controls (optional enhancement)
        this.input.on('pointerdown', (pointer) => {
            if (pointer.y > 100) {
                this.lure.drop();
            }
        });

        // Gamepad support setup
        this.setupGamepad();
    }

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
            lastY: false // Triangle/Y button for movement mode
        };
    }

    showGamepadConnectedNotification(gamepadId) {
        const text = this.add.text(400, 50, 'Gamepad Connected!', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            delay: 1000,
            onComplete: () => text.destroy()
        });
    }
    
    update(time, delta) {
        // Controller test mode - update test UI and block game inputs
        if (this.controllerTestMode && this.controllerTestUpdate) {
            this.controllerTestUpdate();
            return; // Block all game logic
        }

        // If fighting a fish, handle that instead of normal gameplay
        if (this.currentFight && this.currentFight.active) {
            const spacePressed = Phaser.Input.Keyboard.JustDown(this.spaceKey);

            // Check R2 trigger for gamepad (rapid tapping) using native API
            let r2Pressed = false;
            if (window.gamepadManager && window.gamepadManager.isConnected()) {
                const r2Button = window.gamepadManager.getButton('R2');
                const currentTime = this.time.now;

                // Trigger pressed (value > 0.5 threshold) and enough time has passed
                if (r2Button.value > 0.5 && currentTime - this.gamepadState.lastR2Press >= this.gamepadState.r2MinInterval) {
                    r2Pressed = true;
                    this.gamepadState.lastR2Press = currentTime;
                }
            }

            // Pass either keyboard or gamepad input to fish fight
            this.currentFight.update(time, spacePressed || r2Pressed);

            // Check if fight is still active after update (fish might have been landed/lost)
            if (!this.currentFight || !this.currentFight.active) {
                return; // Fight ended, continue to normal gameplay
            }

            // Add periodic rumble during fish fight based on line tension
            if (window.gamepadManager && window.gamepadManager.isConnected()) {
                const tension = this.currentFight.lineTension / 100; // 0-1 value

                // Rumble intensity increases with tension
                if (tension > 0.9 && time % 500 < 50) {
                    // Critical tension - strong rumble
                    this.rumbleGamepad(100, 0.8, 0.4);
                } else if (tension > 0.7 && time % 800 < 50) {
                    // High tension - medium rumble
                    this.rumbleGamepad(80, 0.5, 0.3);
                } else if (r2Pressed) {
                    // Light rumble on each reel
                    this.rumbleGamepad(50, 0.2, 0.1);
                }
            }

            return;
        }

        // Update ice hole manager (must be before input)
        this.iceHoleManager.update();

        // Update sonar display
        this.sonarDisplay.update();

        // Handle input (keyboard + gamepad)
        this.handleInput();
        this.handleGamepadInput();

        // Update lure
        this.lure.update();

        // Continuously update lure info in UI
        this.updateSpeedDisplay();

        // Update all baitfish clouds
        this.baitfishClouds = this.baitfishClouds.filter(cloud => {
            if (cloud.visible) {
                cloud.update(this.fishes);
                return true;
            } else {
                cloud.destroy();
                return false;
            }
        });

        // Update all fish - pass baitfish clouds for hunting behavior
        this.fishes.forEach((fish, index) => {
            fish.update(this.lure, this.fishes, this.baitfishClouds);

            // Remove fish that are no longer visible or caught
            if (!fish.visible) {
                fish.destroy();
                this.fishes.splice(index, 1);
            }
        });

        // Spawn fish based on chance
        if (Math.random() < GameConfig.FISH_SPAWN_CHANCE) {
            this.trySpawnFish();
        }

        // Spawn baitfish clouds based on chance
        if (Math.random() < GameConfig.BAITFISH_CLOUD_SPAWN_CHANCE) {
            this.trySpawnBaitfishCloud();
        }

        // Debug visualization
        if (this.debugMode) {
            this.renderDebugInfo();
        } else if (this.debugGraphics) {
            this.debugGraphics.clear();
        }
    }
    
    handleInput() {
        // Drop lure with space or down arrow
        if (this.spaceKey.isDown || this.cursors.down.isDown) {
            this.lure.drop();
        }

        // Retrieve lure with up arrow
        if (this.cursors.up.isDown) {
            this.lure.retrieve();
        } else {
            this.lure.stopRetrieve();
        }

        // Adjust retrieve speed with left/right arrows
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.lure.adjustSpeed(-1);
            this.updateSpeedDisplay();
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.lure.adjustSpeed(1);
            this.updateSpeedDisplay();
        }

        // Reset lure with R key
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.lure.reset();
        }
    }

    handleGamepadInput() {
        // Exit if no gamepad connected using native API
        if (!window.gamepadManager || !window.gamepadManager.isConnected()) {
            return;
        }

        const currentTime = this.time.now;

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

        // === ICE HOLE MOVEMENT MODE ===
        // Triangle/Y button: Toggle movement mode (walk on ice)
        if (yBtn.pressed && !this.gamepadState.lastY) {
            if (this.iceHoleManager.movementMode) {
                this.iceHoleManager.exitMovementMode();
            } else {
                this.iceHoleManager.enterMovementMode();
            }
        }
        this.gamepadState.lastY = yBtn.pressed;

        // If in movement mode, different controls apply
        if (this.iceHoleManager.movementMode) {
            // L/R movement on ice surface - slower, more sensitive
            // Controls are inverted: left button moves holes left (player moves right in world)
            const moveSpeed = 2;
            if (dpadLeftBtn.pressed || leftStickX < -DEAD_ZONE) {
                this.iceHoleManager.movePlayer(moveSpeed); // Move player right, holes appear to move left
            }
            if (dpadRightBtn.pressed || leftStickX > DEAD_ZONE) {
                this.iceHoleManager.movePlayer(-moveSpeed); // Move player left, holes appear to move right
            }

            // Square/X button: Drill new hole
            if (xBtn.pressed && !this.gamepadState.lastX) {
                this.iceHoleManager.drillNewHole();
            }
            this.gamepadState.lastX = xBtn.pressed;

            // Exit early - don't process fishing controls
            return;
        }

        // === FISHING MODE (normal controls) ===
        // D-pad UP or Left Stick UP: Retrieve line
        const dpadUp = dpadUpBtn.pressed || (leftStickY < -DEAD_ZONE);
        if (dpadUp) {
            this.lure.retrieve();
        } else {
            // Only stop retrieve if keyboard also isn't retrieving
            if (!this.cursors.up.isDown) {
                this.lure.stopRetrieve();
            }
        }

        // D-pad DOWN or Left Stick DOWN: Drop line
        const dpadDown = dpadDownBtn.pressed || (leftStickY > DEAD_ZONE);
        if (dpadDown) {
            this.lure.drop();
        }

        // Speed adjustments with debouncing
        const canAdjustSpeed = currentTime - this.gamepadState.lastSpeedAdjust >= this.gamepadState.speedAdjustDelay;

        if (canAdjustSpeed) {
            // D-pad LEFT or L1 or Left Stick LEFT: Decrease speed
            const dpadLeft = dpadLeftBtn.pressed || (leftStickX < -DEAD_ZONE);
            const l1Pressed = l1Btn.pressed;

            if ((dpadLeft && !this.gamepadState.lastDpadLeft) || (l1Pressed && !this.gamepadState.lastL1)) {
                this.lure.adjustSpeed(-1);
                this.updateSpeedDisplay();
                this.gamepadState.lastSpeedAdjust = currentTime;
            }

            // D-pad RIGHT or R1 or Left Stick RIGHT: Increase speed
            const dpadRight = dpadRightBtn.pressed || (leftStickX > DEAD_ZONE);
            const r1Pressed = r1Btn.pressed;

            if ((dpadRight && !this.gamepadState.lastDpadRight) || (r1Pressed && !this.gamepadState.lastR1)) {
                this.lure.adjustSpeed(1);
                this.updateSpeedDisplay();
                this.gamepadState.lastSpeedAdjust = currentTime;
            }

            // Update state tracking
            this.gamepadState.lastDpadLeft = dpadLeft;
            this.gamepadState.lastDpadRight = dpadRight;
            this.gamepadState.lastL1 = l1Pressed;
            this.gamepadState.lastR1 = r1Pressed;
        }

        // Face buttons for secondary actions
        // A button (X on PS4): Quick drop/retrieve toggle
        if (aBtn.pressed && !this.gamepadState.lastA) {
            if (this.lure.state === 'RETRIEVING') {
                this.lure.stopRetrieve();
            } else {
                this.lure.drop();
            }
        }
        this.gamepadState.lastA = aBtn.pressed;

        // B button (Circle on PS4): Reset lure
        if (bBtn.pressed && !this.gamepadState.lastB) {
            this.lure.reset();
        }
        this.gamepadState.lastB = bBtn.pressed;

        // X button (Square on PS4): Toggle debug mode
        if (xBtn.pressed && !this.gamepadState.lastX) {
            this.debugMode = !this.debugMode;
        }
        this.gamepadState.lastX = xBtn.pressed;
    }

    rumbleGamepad(duration = 200, strongMagnitude = 0.5, weakMagnitude = 0.5) {
        // Trigger gamepad vibration using native API
        if (!window.gamepadManager || !window.gamepadManager.isConnected()) {
            return;
        }

        const gamepad = window.gamepadManager.getGamepad();
        if (!gamepad || !gamepad.vibrationActuator) {
            return; // Vibration not supported
        }

        // Use the native Gamepad Vibration API
        try {
            gamepad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: duration,
                weakMagnitude: weakMagnitude,   // 0.0 to 1.0
                strongMagnitude: strongMagnitude // 0.0 to 1.0
            });
        } catch (error) {
            console.warn('Gamepad vibration not supported:', error);
        }
    }

    showControllerTest() {
        if (!window.gamepadManager || !window.gamepadManager.isConnected() || this.controllerTestMode) return;

        this.controllerTestMode = true;

        // Create dark overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        overlay.setDepth(2000);

        // Create test window
        const windowBg = this.add.graphics();
        windowBg.fillStyle(0x1a1a2e, 0.95);
        windowBg.fillRoundedRect(100, 50, 600, 500, 10);
        windowBg.lineStyle(2, 0x00aaff, 1);
        windowBg.strokeRoundedRect(100, 50, 600, 500, 10);
        windowBg.setDepth(2001);

        // Title
        const title = this.add.text(400, 80, 'CONTROLLER TEST', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#00aaff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0);
        title.setDepth(2002);

        // Instructions
        const instructions = this.add.text(400, 120, 'Press buttons on your controller to test', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#888888'
        });
        instructions.setOrigin(0.5, 0);
        instructions.setDepth(2002);

        // Input status text
        const statusTexts = {
            dpadUp: this.createTestText(150, 170, 'D-Pad UP'),
            dpadDown: this.createTestText(150, 200, 'D-Pad DOWN'),
            dpadLeft: this.createTestText(150, 230, 'D-Pad LEFT'),
            dpadRight: this.createTestText(150, 260, 'D-Pad RIGHT'),
            buttonA: this.createTestText(450, 170, 'A Button'),
            buttonB: this.createTestText(450, 200, 'B Button'),
            buttonX: this.createTestText(450, 230, 'X Button'),
            buttonY: this.createTestText(450, 260, 'Y Button'),
            l1: this.createTestText(150, 310, 'L1/LB'),
            r1: this.createTestText(450, 310, 'R1/RB'),
            l2: this.createTestText(150, 340, 'L2/LT'),
            r2: this.createTestText(450, 340, 'R2/RT'),
            leftStick: this.createTestText(150, 390, 'Left Stick'),
            rightStick: this.createTestText(450, 390, 'Right Stick')
        };

        // OK Button
        const okButton = this.add.graphics();
        okButton.fillStyle(0x00aaff, 1);
        okButton.fillRoundedRect(300, 470, 200, 50, 5);
        okButton.setDepth(2002);
        okButton.setInteractive(new Phaser.Geom.Rectangle(300, 470, 200, 50), Phaser.Geom.Rectangle.Contains);

        const okText = this.add.text(400, 495, 'OK', {
            fontSize: '20px',
            fontFamily: 'Courier New',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        okText.setOrigin(0.5, 0.5);
        okText.setDepth(2003);

        okButton.on('pointerdown', () => {
            this.closeControllerTest();
        });

        okButton.on('pointerover', () => {
            okButton.clear();
            okButton.fillStyle(0x00ddff, 1);
            okButton.fillRoundedRect(300, 470, 200, 50, 5);
        });

        okButton.on('pointerout', () => {
            okButton.clear();
            okButton.fillStyle(0x00aaff, 1);
            okButton.fillRoundedRect(300, 470, 200, 50, 5);
        });

        // Store UI elements
        this.controllerTestUI = {
            overlay,
            windowBg,
            title,
            instructions,
            statusTexts,
            okButton,
            okText
        };

        // Update loop for controller test using native API
        this.controllerTestUpdate = () => {
            if (!this.controllerTestMode || !window.gamepadManager || !window.gamepadManager.isConnected()) return;

            const DEAD_ZONE = 0.2;

            // Get button states using native API
            this.updateTestButton(statusTexts.dpadUp, window.gamepadManager.getButton('DpadUp').pressed);
            this.updateTestButton(statusTexts.dpadDown, window.gamepadManager.getButton('DpadDown').pressed);
            this.updateTestButton(statusTexts.dpadLeft, window.gamepadManager.getButton('DpadLeft').pressed);
            this.updateTestButton(statusTexts.dpadRight, window.gamepadManager.getButton('DpadRight').pressed);
            this.updateTestButton(statusTexts.buttonA, window.gamepadManager.getButton('X').pressed); // X on PS4 = A
            this.updateTestButton(statusTexts.buttonB, window.gamepadManager.getButton('Circle').pressed); // Circle = B
            this.updateTestButton(statusTexts.buttonX, window.gamepadManager.getButton('Square').pressed); // Square = X
            this.updateTestButton(statusTexts.buttonY, window.gamepadManager.getButton('Triangle').pressed); // Triangle = Y
            this.updateTestButton(statusTexts.l1, window.gamepadManager.getButton('L1').pressed);
            this.updateTestButton(statusTexts.r1, window.gamepadManager.getButton('R1').pressed);
            this.updateTestButton(statusTexts.l2, window.gamepadManager.getButton('L2').value > 0.5);
            this.updateTestButton(statusTexts.r2, window.gamepadManager.getButton('R2').value > 0.5);

            // Update analog sticks
            const leftStickX = window.gamepadManager.getAxis(0);
            const leftStickY = window.gamepadManager.getAxis(1);
            const rightStickX = window.gamepadManager.getAxis(2);
            const rightStickY = window.gamepadManager.getAxis(3);
            const leftStickActive = Math.abs(leftStickX) > DEAD_ZONE || Math.abs(leftStickY) > DEAD_ZONE;
            const rightStickActive = Math.abs(rightStickX) > DEAD_ZONE || Math.abs(rightStickY) > DEAD_ZONE;
            this.updateTestButton(statusTexts.leftStick, leftStickActive);
            this.updateTestButton(statusTexts.rightStick, rightStickActive);
        };
    }

    createTestText(x, y, label) {
        const text = this.add.text(x, y, `${label}: ⬜`, {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#ffffff'
        });
        text.setDepth(2002);
        return text;
    }

    updateTestButton(textObj, isPressed) {
        if (isPressed) {
            textObj.setColor('#00ff00');
            textObj.setText(textObj.text.replace('⬜', '✅'));
        } else {
            textObj.setColor('#ffffff');
            textObj.setText(textObj.text.replace('✅', '⬜'));
        }
    }

    closeControllerTest() {
        if (!this.controllerTestUI) return;

        // Destroy all UI elements
        const ui = this.controllerTestUI;
        ui.overlay.destroy();
        ui.windowBg.destroy();
        ui.title.destroy();
        ui.instructions.destroy();
        ui.okButton.destroy();
        ui.okText.destroy();

        Object.values(ui.statusTexts).forEach(text => text.destroy());

        this.controllerTestUI = null;
        this.controllerTestMode = false;
        this.controllerTestUpdate = null;
    }

    trySpawnFish() {
        // Don't spawn too many fish at once
        if (this.fishes.length >= 4) {
            return;
        }

        // Get current hole position in world coordinates
        const currentHole = this.iceHoleManager.getCurrentHole();
        if (!currentHole) return;

        const playerWorldX = currentHole.x;

        // Determine fish spawn depth based on realistic lake trout behavior
        let depth;
        const tempFactor = (this.waterTemp - 38) / 7; // 0 to 1 based on temp range

        // Lake trout prefer different depths based on temperature
        if (tempFactor < 0.3) {
            // Cold water - fish can be shallower
            depth = Utils.randomBetween(15, 80);
        } else {
            // Warmer water - fish go deeper
            depth = Utils.randomBetween(30, 120);
        }

        // Determine fish size
        const sizeRoll = Math.random();
        let size;
        if (sizeRoll < 0.5) {
            size = 'SMALL';
        } else if (sizeRoll < 0.8) {
            size = 'MEDIUM';
        } else if (sizeRoll < 0.95) {
            size = 'LARGE';
        } else {
            size = 'TROPHY';
        }

        // Spawn fish in world coordinates relative to player's hole
        // Fish spawn at random distances around the player (200-400 units away)
        const spawnDistance = Utils.randomBetween(200, 400);
        const fromLeft = Math.random() < 0.5;
        const worldX = playerWorldX + (fromLeft ? -spawnDistance : spawnDistance);
        const y = depth * GameConfig.DEPTH_SCALE;

        // Create the fish (worldX will be used internally, x will be calculated for screen)
        const fish = new Fish(this, worldX, y, size);

        // Set initial movement direction - fish swim toward and past the player
        if (fromLeft) {
            fish.ai.idleDirection = 1; // Swim right (toward and past player)
        } else {
            fish.ai.idleDirection = -1; // Swim left (toward and past player)
        }

        this.fishes.push(fish);
    }

    trySpawnBaitfishCloud() {
        // Don't spawn too many clouds at once
        if (this.baitfishClouds.length >= 3) {
            return;
        }

        // Determine cloud size
        const cloudSize = Math.floor(
            Utils.randomBetween(
                GameConfig.BAITFISH_CLOUD_MIN_COUNT,
                GameConfig.BAITFISH_CLOUD_MAX_COUNT
            )
        );

        // Baitfish prefer certain depth zones (typically shallower than lake trout)
        let depth;
        const depthRoll = Math.random();
        if (depthRoll < 0.4) {
            // Shallow - 20-40 ft
            depth = Utils.randomBetween(20, 40);
        } else if (depthRoll < 0.8) {
            // Mid depth - 40-70 ft
            depth = Utils.randomBetween(40, 70);
        } else {
            // Deeper - 70-100 ft
            depth = Utils.randomBetween(70, 100);
        }

        // Spawn from left or right edge
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -50 : GameConfig.CANVAS_WIDTH + 50;
        const y = depth * GameConfig.DEPTH_SCALE;

        // Create the baitfish cloud
        const cloud = new BaitfishCloud(this, x, y, cloudSize);

        // Set initial drift direction
        cloud.velocity.x = fromLeft ? Utils.randomBetween(0.3, 0.8) : Utils.randomBetween(-0.8, -0.3);

        this.baitfishClouds.push(cloud);
    }

    handleFishCaught(fish) {
        // Start fish fight!
        console.log('Fish hooked! Starting fight...');

        // Rumble on fish bite!
        this.rumbleGamepad(300, 0.6, 0.3); // 300ms, strong motor 60%, weak motor 30%

        // Show hook notification
        const text = this.add.text(400, 200,
            'FISH ON!\nTAP SPACEBAR OR R2 TO REEL!',
            {
                fontSize: '28px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });

        // Start the fight
        this.currentFight = new FishFight(this, fish, this.lure);
    }
    
    showCatchNotification(fish) {
        const info = fish.getInfo();
        const text = this.add.text(400, 300, 
            `FISH ON!\n${info.weight}\n+${fish.points} points`, 
            {
                fontSize: '24px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        text.setOrigin(0.5, 0.5);
        
        // Animate and remove
        this.tweens.add({
            targets: text,
            y: 250,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
            }
        });
    }
    
    checkAchievements() {
        // Check for various achievements
        if (this.fishCaught === 1) {
            this.showAchievement('First Catch!', 'Welcome to Lake Champlain');
        } else if (this.fishCaught === 5) {
            this.showAchievement('Getting the Hang of It', '5 Lake Trout Caught');
        } else if (this.fishCaught === 10) {
            this.showAchievement('Experienced Angler', '10 Lake Trout Caught');
        } else if (this.score >= 500) {
            this.showAchievement('High Scorer', '500 Points Earned');
        }
    }
    
    showAchievement(title, description) {
        const achievementText = this.add.text(400, 100,
            `🏆 ${title} 🏆\n${description}`,
            {
                fontSize: '18px',
                fontFamily: 'Courier New',
                color: '#00ff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        achievementText.setOrigin(0.5, 0.5);
        achievementText.setAlpha(0);
        
        this.tweens.add({
            targets: achievementText,
            alpha: 1,
            duration: 500,
            yoyo: true,
            hold: 2000,
            onComplete: () => {
                achievementText.destroy();
            }
        });
    }
    
    updateSpeedDisplay() {
        const lureInfo = this.lure.getInfo();
        this.events.emit('updateLureInfo', lureInfo);
    }
    
    updateGameStats() {
        // Send game stats to UI
        this.events.emit('updateTime', this.gameTime);
        this.events.emit('updateWaterTemp', this.waterTemp);
    }

    renderDebugInfo() {
        // Create debug graphics if needed
        if (!this.debugGraphics) {
            this.debugGraphics = this.add.graphics();
            this.debugGraphics.setDepth(1000);
        }

        this.debugGraphics.clear();

        // Draw detection range around lure
        this.debugGraphics.lineStyle(2, 0xffff00, 0.3);
        this.debugGraphics.strokeCircle(this.lure.x, this.lure.y, GameConfig.DETECTION_RANGE);

        // Draw strike distance around lure
        this.debugGraphics.lineStyle(2, 0xff0000, 0.5);
        this.debugGraphics.strokeCircle(this.lure.x, this.lure.y, GameConfig.STRIKE_DISTANCE);

        // Draw fish info
        this.fishes.forEach(fish => {
            // Draw line from fish to lure
            const dist = Math.sqrt(
                Math.pow(fish.x - this.lure.x, 2) +
                Math.pow(fish.y - this.lure.y, 2)
            );

            if (dist < GameConfig.DETECTION_RANGE * 2) {
                this.debugGraphics.lineStyle(1, 0x00ffff, 0.3);
                this.debugGraphics.lineBetween(fish.x, fish.y, this.lure.x, this.lure.y);
            }

            // Draw fish state
            const stateColors = {
                'IDLE': 0x888888,
                'INTERESTED': 0xffff00,
                'CHASING': 0xff8800,
                'STRIKING': 0xff0000,
                'FLEEING': 0x8888ff
            };
            const color = stateColors[fish.ai.state] || 0xffffff;
            this.debugGraphics.fillStyle(color, 0.3);
            this.debugGraphics.fillCircle(fish.x, fish.y, 15);

            // Draw fish detection circle
            this.debugGraphics.lineStyle(1, color, 0.2);
            this.debugGraphics.strokeCircle(fish.x, fish.y, GameConfig.DETECTION_RANGE);
        });
    }

    shutdown() {
        // Clean up
        this.fishes.forEach(fish => fish.destroy());
        this.baitfishClouds.forEach(cloud => cloud.destroy());
        this.lure.destroy();
        this.sonarDisplay.destroy();
        this.iceHoleManager.destroy();
        if (this.debugGraphics) {
            this.debugGraphics.destroy();
        }
    }
}

export default GameScene;
