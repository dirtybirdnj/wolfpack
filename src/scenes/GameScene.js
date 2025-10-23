import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import SonarDisplay from '../utils/SonarDisplay.js';
import Lure from '../entities/Lure.js';
import Fish from '../entities/Fish.js';
import FishFight from '../entities/FishFight.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.fishes = [];
        this.score = 0;
        this.fishCaught = 0;
        this.fishLost = 0; // Track fish that broke the line
        this.gameTime = 0;
        this.waterTemp = 40; // Typical Lake Champlain winter temp
        this.debugMode = false; // Dev tools debug mode
        this.debugGraphics = null;
        this.currentFight = null; // Active fish fight
    }
    
    create() {
        // Set up the sonar display
        this.sonarDisplay = new SonarDisplay(this);
        
        // Create the player's lure - start at better viewing depth
        this.lure = new Lure(this, 400, 100); // Centered horizontally, 25ft deep
        
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
        
        // Fade in
        this.cameras.main.fadeIn(500);

        // Show welcome instructions
        this.showWelcomeMessage();

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
        // Enable gamepad input
        this.input.gamepad.once('connected', (pad) => {
            console.log('Gamepad connected:', pad.id);
            this.gamepad = pad;

            // Show notification
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
        });

        // Gamepad state tracking
        this.gamepadState = {
            lastR2Press: 0,
            r2MinInterval: 50, // Minimum milliseconds between R2 taps
            lastSpeedAdjust: 0,
            speedAdjustDelay: 150, // Delay between speed adjustments
            lastDpadUp: false,
            lastDpadDown: false,
            lastL1: false,
            lastR1: false
        };
    }
    
    update(time, delta) {
        // If fighting a fish, handle that instead of normal gameplay
        if (this.currentFight && this.currentFight.active) {
            const spacePressed = Phaser.Input.Keyboard.JustDown(this.spaceKey);

            // Check R2 trigger for gamepad (rapid tapping)
            let r2Pressed = false;
            if (this.gamepad && this.gamepad.connected) {
                const r2Value = this.gamepad.R2; // Right trigger
                const currentTime = this.time.now;

                // Trigger pressed (value > 0.5 threshold) and enough time has passed
                if (r2Value > 0.5 && currentTime - this.gamepadState.lastR2Press >= this.gamepadState.r2MinInterval) {
                    r2Pressed = true;
                    this.gamepadState.lastR2Press = currentTime;
                }
            }

            // Pass either keyboard or gamepad input to fish fight
            this.currentFight.update(time, spacePressed || r2Pressed);

            // Add periodic rumble during fish fight based on line tension
            if (this.gamepad && this.gamepad.connected) {
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

        // Update sonar display
        this.sonarDisplay.update();

        // Handle input (keyboard + gamepad)
        this.handleInput();
        this.handleGamepadInput();

        // Update lure
        this.lure.update();

        // Continuously update lure info in UI
        this.updateSpeedDisplay();

        // Update all fish
        this.fishes.forEach((fish, index) => {
            fish.update(this.lure, this.fishes);

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
        // Exit if no gamepad connected
        if (!this.gamepad || !this.gamepad.connected) {
            return;
        }

        const pad = this.gamepad;
        const currentTime = this.time.now;

        // Dead zone for analog inputs
        const DEAD_ZONE = 0.2;

        // D-pad UP: Retrieve line
        const dpadUp = pad.up || (pad.leftStick.y < -DEAD_ZONE);
        if (dpadUp) {
            this.lure.retrieve();
        } else {
            // Only stop retrieve if keyboard also isn't retrieving
            if (!this.cursors.up.isDown) {
                this.lure.stopRetrieve();
            }
        }

        // D-pad DOWN: Drop line
        const dpadDown = pad.down || (pad.leftStick.y > DEAD_ZONE);
        if (dpadDown) {
            this.lure.drop();
        }

        // Speed adjustments with debouncing
        const canAdjustSpeed = currentTime - this.gamepadState.lastSpeedAdjust >= this.gamepadState.speedAdjustDelay;

        if (canAdjustSpeed) {
            // D-pad LEFT or L1: Decrease speed
            const dpadLeft = pad.left || (pad.leftStick.x < -DEAD_ZONE);
            const l1Pressed = pad.L1;

            if ((dpadLeft && !this.gamepadState.lastDpadLeft) || (l1Pressed && !this.gamepadState.lastL1)) {
                this.lure.adjustSpeed(-1);
                this.updateSpeedDisplay();
                this.gamepadState.lastSpeedAdjust = currentTime;
            }

            // D-pad RIGHT or R1: Increase speed
            const dpadRight = pad.right || (pad.leftStick.x > DEAD_ZONE);
            const r1Pressed = pad.R1;

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
        // A button (button 0): Quick drop/retrieve toggle
        if (pad.A && !this.gamepadState.lastA) {
            if (this.lure.state === 'RETRIEVING') {
                this.lure.stopRetrieve();
            } else {
                this.lure.drop();
            }
        }
        this.gamepadState.lastA = pad.A;

        // B button (button 1): Reset lure
        if (pad.B && !this.gamepadState.lastB) {
            this.lure.reset();
        }
        this.gamepadState.lastB = pad.B;

        // X button (button 2): Toggle debug mode
        if (pad.X && !this.gamepadState.lastX) {
            this.debugMode = !this.debugMode;
        }
        this.gamepadState.lastX = pad.X;
    }

    rumbleGamepad(duration = 200, strongMagnitude = 0.5, weakMagnitude = 0.5) {
        // Trigger gamepad vibration if supported
        if (!this.gamepad || !this.gamepad.connected || !this.gamepad.vibration) {
            return; // Vibration not supported
        }

        // Use the Gamepad Vibration API
        try {
            this.gamepad.vibration.playEffect('dual-rumble', {
                startDelay: 0,
                duration: duration,
                weakMagnitude: weakMagnitude,   // 0.0 to 1.0
                strongMagnitude: strongMagnitude // 0.0 to 1.0
            });
        } catch (error) {
            console.warn('Gamepad vibration not supported:', error);
        }
    }

    trySpawnFish() {
        // Don't spawn too many fish at once
        if (this.fishes.length >= 4) {
            return;
        }
        
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
        
        // Spawn from left or right edge
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -30 : GameConfig.CANVAS_WIDTH + 30;
        const y = depth * GameConfig.DEPTH_SCALE;
        
        // Create the fish
        const fish = new Fish(this, x, y, size);

        // Set initial movement direction based on spawn side
        if (fromLeft) {
            fish.ai.idleDirection = 1; // Swim right
        } else {
            fish.ai.idleDirection = -1; // Swim left
        }

        this.fishes.push(fish);
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

    showWelcomeMessage() {
        // Create welcome instruction panel
        const centerX = 400;
        const centerY = 300;

        // Semi-transparent background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.85);
        bg.fillRoundedRect(150, 200, 500, 200, 10);
        bg.lineStyle(3, 0x00ff00, 1);
        bg.strokeRoundedRect(150, 200, 500, 200, 10);

        // Title
        const title = this.add.text(centerX, 230, 'WELCOME TO THE ICE!', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        // Instructions
        const instructions = this.add.text(centerX, 290,
            'SPACE/DOWN - Release spool (lure drops)\n' +
            'UP arrow - Engage clutch & retrieve\n' +
            'Release UP - Hold position (clutch engaged)\n' +
            'LEFT/RIGHT - Adjust retrieve speed\n\n' +
            'Heavier lure drops faster!\n' +
            'Lake trout prefer 60-100 feet deep',
            {
                fontSize: '13px',
                fontFamily: 'Courier New',
                color: '#00ff00',
                align: 'center',
                lineSpacing: 5
            }
        ).setOrigin(0.5, 0.5);

        // "Press any key" prompt
        const prompt = this.add.text(centerX, 375, 'Press any key to start fishing...', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#88ff88',
            fontStyle: 'italic'
        }).setOrigin(0.5, 0.5);

        // Blinking effect for prompt
        this.tweens.add({
            targets: prompt,
            alpha: { from: 1, to: 0.3 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        // Dismiss on any key press
        const dismissHandler = () => {
            this.tweens.add({
                targets: [bg, title, instructions, prompt],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    bg.destroy();
                    title.destroy();
                    instructions.destroy();
                    prompt.destroy();
                }
            });
        };

        this.input.keyboard.once('keydown', dismissHandler);
        this.input.once('pointerdown', dismissHandler);
    }

    shutdown() {
        // Clean up
        this.fishes.forEach(fish => fish.destroy());
        this.lure.destroy();
        this.sonarDisplay.destroy();
        if (this.debugGraphics) {
            this.debugGraphics.destroy();
        }
    }
}

export default GameScene;
