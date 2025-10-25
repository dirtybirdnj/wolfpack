import GameConfig from '../config/GameConfig.js';
import { getBathymetricData } from '../utils/BathymetricData.js';

/**
 * NavigationScene - Top-down lake navigation mode
 * Player drives/paddles around Lake Champlain looking for good fishing spots
 * Similar to overworld map in RPGs, but for fishing
 */
export class NavigationScene extends Phaser.Scene {
    constructor() {
        super({ key: 'NavigationScene' });
    }

    create() {
        console.log('🗺️ Navigation Scene starting');

        // Get fishing type and game mode from registry
        this.fishingType = this.registry.get('fishingType') || GameConfig.FISHING_TYPE_KAYAK;
        this.gameMode = this.registry.get('gameMode') || GameConfig.GAME_MODE_UNLIMITED;

        // Get bathymetric data
        this.bathyData = getBathymetricData();

        // Player position in world coordinates
        this.playerWorldX = 0;
        this.playerWorldY = 5000; // Middle of map north-south

        // Set starting position based on game mode
        this.setStartingPosition();

        // Camera/viewport settings
        this.cameraScale = 1.0; // Can zoom in/out later
        this.viewportWidth = GameConfig.CANVAS_WIDTH;
        this.viewportHeight = GameConfig.CANVAS_HEIGHT;

        // Movement physics
        this.velocity = { x: 0, y: 0 };
        this.speed = 0;
        this.heading = 0; // 0 = north, 90 = east, 180 = south, 270 = west
        this.isMoving = false;

        // Watercraft properties based on type
        if (this.fishingType === GameConfig.FISHING_TYPE_KAYAK) {
            this.maxSpeed = 3.0; // Slower
            this.acceleration = 0.08;
            this.deceleration = 0.15; // Stops fairly quickly
            this.turnRate = 2.5; // degrees per frame
            this.tiredness = 0;
        } else if (this.fishingType === GameConfig.FISHING_TYPE_MOTORBOAT) {
            this.maxSpeed = 8.0; // Much faster
            this.acceleration = 0.15;
            this.deceleration = 0.08; // Coasts longer
            this.turnRate = 1.8; // Wider turns
            this.gasLevel = 100;
        } else {
            // Ice fishing - shouldn't use navigation, but provide defaults
            this.maxSpeed = 2.0;
            this.acceleration = 0.1;
            this.deceleration = 0.2;
            this.turnRate = 3.0;
        }

        // Graphics layers
        this.waterGraphics = this.add.graphics();
        this.depthGraphics = this.add.graphics();
        this.boatGraphics = this.add.graphics();
        this.uiGraphics = this.add.graphics();

        // Minimap fishfinder
        this.fishfinderActive = true;

        // Set up input
        this.setupInput();

        // Create UI elements
        this.createUI();

        // Show initial message
        this.showInstruction('Hold X to move forward, D-pad to steer, Triangle to fish');

        console.log(`🚤 Starting at position (${this.playerWorldX}, ${this.playerWorldY})`);
        console.log(`   Depth: ${this.bathyData.getDepthAtPosition(this.playerWorldX, this.playerWorldY).toFixed(1)}ft`);
    }

    setStartingPosition() {
        /**
         * Set player starting position based on game mode
         */
        if (this.gameMode === GameConfig.GAME_MODE_ARCADE) {
            // Arcade mode: Start in a good spot with moderate depth (perch territory)
            const goodSpots = this.bathyData.findGoodFishingSpots(25, 45, 10);
            if (goodSpots.length > 0) {
                const spot = goodSpots[Math.floor(Math.random() * goodSpots.length)];
                this.playerWorldX = spot.x;
                this.playerWorldY = spot.y;
                console.log(`🎯 Arcade mode: Starting at good fishing spot (${spot.depth.toFixed(0)}ft)`);
            } else {
                // Fallback
                this.playerWorldX = 2500;
                this.playerWorldY = 5000;
            }
        } else {
            // Unlimited mode: Start near shore, make them explore
            this.playerWorldX = 800; // Near Burlington waterfront
            this.playerWorldY = 5000;
            console.log('🏖️ Unlimited mode: Starting near shore - explore to find fish');
        }
    }

    setupInput() {
        /**
         * Set up keyboard and gamepad input
         */

        // Keyboard input
        this.keys = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            x: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
            triangle: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            square: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            circle: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };

        // Gamepad support
        this.input.gamepad.once('connected', (pad) => {
            console.log('🎮 Gamepad connected for navigation');
            this.gamepad = pad;
        });
    }

    update(time, delta) {
        // Handle input
        this.handleInput();

        // Update physics
        this.updateMovement();

        // Update resources (tiredness/gas)
        this.updateResources();

        // Render everything
        this.render();

        // Update UI
        this.updateUI();
    }

    handleInput() {
        /**
         * Process player input for navigation
         */

        let movePressed = false;
        let steerLeft = false;
        let steerRight = false;
        let fishPressed = false;

        // Keyboard input
        if (this.keys.x.isDown) {
            movePressed = true;
        }
        if (this.keys.left.isDown) {
            steerLeft = true;
        }
        if (this.keys.right.isDown) {
            steerRight = true;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.triangle)) {
            fishPressed = true;
        }

        // Gamepad input
        if (this.gamepad) {
            // X button (Cross on PlayStation, A on Xbox)
            if (this.gamepad.buttons[0] && this.gamepad.buttons[0].pressed) {
                movePressed = true;
            }

            // D-pad or left stick for steering
            const leftStickX = this.gamepad.axes[0] ? this.gamepad.axes[0].getValue() : 0;
            const dpadLeft = this.gamepad.left || (this.gamepad.buttons[14] && this.gamepad.buttons[14].pressed);
            const dpadRight = this.gamepad.right || (this.gamepad.buttons[15] && this.gamepad.buttons[15].pressed);

            if (dpadLeft || leftStickX < -0.3) {
                steerLeft = true;
            }
            if (dpadRight || leftStickX > 0.3) {
                steerRight = true;
            }

            // Triangle button (Y on Xbox)
            if (this.gamepad.buttons[3] && Phaser.Input.Keyboard.JustDown(this.gamepad.buttons[3])) {
                fishPressed = true;
            }
        }

        // Apply steering
        if (steerLeft && this.speed > 0.5) {
            this.heading -= this.turnRate;
            if (this.heading < 0) this.heading += 360;
        }
        if (steerRight && this.speed > 0.5) {
            this.heading += this.turnRate;
            if (this.heading >= 360) this.heading -= 360;
        }

        // Apply acceleration/deceleration
        if (movePressed) {
            this.isMoving = true;
            this.speed += this.acceleration;
            this.speed = Math.min(this.speed, this.maxSpeed);
        } else {
            this.isMoving = false;
            this.speed -= this.deceleration;
            this.speed = Math.max(0, this.speed);
        }

        // Fish button - transition to fishing mode
        if (fishPressed && this.speed < 0.5) {
            this.startFishing();
        } else if (fishPressed && this.speed >= 0.5) {
            this.showInstruction('Slow down to start fishing!');
        }
    }

    updateMovement() {
        /**
         * Update player position based on velocity
         */

        if (this.speed > 0) {
            // Convert heading to radians
            const radians = (this.heading - 90) * (Math.PI / 180);

            // Update velocity
            this.velocity.x = Math.cos(radians) * this.speed;
            this.velocity.y = Math.sin(radians) * this.speed;

            // Update position
            this.playerWorldX += this.velocity.x;
            this.playerWorldY += this.velocity.y;

            // Keep player in bounds
            this.playerWorldX = Math.max(0, Math.min(10000, this.playerWorldX));
            this.playerWorldY = Math.max(0, Math.min(10000, this.playerWorldY));
        }
    }

    updateResources() {
        /**
         * Update tiredness (kayak) or gas (motorboat)
         */

        if (this.fishingType === GameConfig.FISHING_TYPE_KAYAK) {
            if (this.isMoving && this.speed > 1.0) {
                this.tiredness += GameConfig.KAYAK_TIREDNESS_RATE;
                this.tiredness = Math.min(100, this.tiredness);

                if (this.tiredness >= GameConfig.KAYAK_TIREDNESS_THRESHOLD) {
                    // Force slow down
                    this.maxSpeed = 1.0;
                    if (Math.random() < 0.02) {
                        this.showInstruction('Too tired! Rest to recover');
                    }
                }
            } else {
                // Recover when resting
                this.tiredness -= GameConfig.KAYAK_RECOVERY_RATE;
                this.tiredness = Math.max(0, this.tiredness);

                if (this.tiredness < GameConfig.KAYAK_TIREDNESS_THRESHOLD) {
                    this.maxSpeed = 3.0;
                }
            }
        } else if (this.fishingType === GameConfig.FISHING_TYPE_MOTORBOAT) {
            if (this.isMoving && this.speed > 2.0) {
                this.gasLevel -= GameConfig.MOTORBOAT_GAS_USAGE;
                this.gasLevel = Math.max(0, this.gasLevel);

                if (this.gasLevel <= 0) {
                    this.maxSpeed = 0;
                    this.showInstruction('Out of gas! Game over');
                    this.time.delayedCall(2000, () => {
                        this.scene.start('GameOverScene');
                    });
                }
            } else {
                // Regenerate gas slowly when idle
                this.gasLevel += 0.05;
                this.gasLevel = Math.min(100, this.gasLevel);
            }
        }
    }

    render() {
        /**
         * Render the navigation view
         */

        // Clear graphics
        this.waterGraphics.clear();
        this.depthGraphics.clear();
        this.boatGraphics.clear();
        this.uiGraphics.clear();

        // Draw water background
        this.renderWater();

        // Draw depth visualization (bathymetric contours)
        this.renderDepthContours();

        // Draw the boat/kayak
        this.renderWatercraft();

        // Draw fishfinder minimap
        if (this.fishfinderActive) {
            this.renderFishfinder();
        }
    }

    renderWater() {
        /**
         * Draw water background
         */
        this.waterGraphics.fillStyle(0x2a4a5a, 1.0);
        this.waterGraphics.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

        // Add some wave texture
        this.waterGraphics.lineStyle(1, 0x3a5a6a, 0.3);
        const waveOffset = (Date.now() * 0.02) % 50;
        for (let y = -50; y < this.viewportHeight + 50; y += 25) {
            const y1 = y + Math.sin((y + waveOffset) * 0.05) * 3;
            const y2 = y + 25 + Math.sin((y + 25 + waveOffset) * 0.05) * 3;
            this.waterGraphics.lineBetween(0, y1, this.viewportWidth, y2);
        }
    }

    renderDepthContours() {
        /**
         * Draw depth contours around player position
         * Shows shallow/deep areas for navigation
         */

        const centerScreenX = this.viewportWidth / 2;
        const centerScreenY = this.viewportHeight / 2;

        // Sample depth in a grid around player
        const sampleRadius = 400; // Game units
        const gridSize = 50; // Sample every 50 units

        for (let dy = -sampleRadius; dy <= sampleRadius; dy += gridSize) {
            for (let dx = -sampleRadius; dx <= sampleRadius; dx += gridSize) {
                const worldX = this.playerWorldX + dx;
                const worldY = this.playerWorldY + dy;

                if (worldX < 0 || worldX >= 10000 || worldY < 0 || worldY >= 10000) continue;

                const depth = this.bathyData.getDepthAtPosition(worldX, worldY);

                // Convert world offset to screen position
                const screenX = centerScreenX + dx;
                const screenY = centerScreenY + dy;

                // Color based on depth
                let color, alpha;
                if (depth < 30) {
                    color = 0x88ccff; // Very light blue - shallow
                    alpha = 0.3;
                } else if (depth < 60) {
                    color = 0x5599cc; // Light blue
                    alpha = 0.2;
                } else if (depth < 100) {
                    color = 0x336699; // Medium blue
                    alpha = 0.15;
                } else {
                    color = 0x1a3a5a; // Dark blue - deep
                    alpha = 0.1;
                }

                this.depthGraphics.fillStyle(color, alpha);
                this.depthGraphics.fillRect(screenX, screenY, gridSize, gridSize);
            }
        }
    }

    renderWatercraft() {
        /**
         * Draw the boat or kayak in center of screen
         */

        const centerX = this.viewportWidth / 2;
        const centerY = this.viewportHeight / 2;

        // Save graphics state
        this.boatGraphics.save();

        // Rotate based on heading
        this.boatGraphics.translateCanvas(centerX, centerY);
        this.boatGraphics.rotateCanvas(this.heading * (Math.PI / 180));

        if (this.fishingType === GameConfig.FISHING_TYPE_KAYAK) {
            // Draw kayak
            this.boatGraphics.fillStyle(0xff6600, 1.0);
            this.boatGraphics.fillEllipse(0, 0, 40, 15);

            // Paddle if moving
            if (this.speed > 0.5) {
                const paddleAnim = Math.sin(Date.now() * 0.01) * 20;
                this.boatGraphics.lineStyle(3, 0x8b4513, 1.0);
                this.boatGraphics.lineBetween(-15 + paddleAnim, 0, -25 + paddleAnim, -10);
            }
        } else {
            // Draw motorboat
            this.boatGraphics.fillStyle(0xffffff, 1.0);
            this.boatGraphics.fillRoundedRect(-30, -15, 60, 30, 8);

            // Motor
            this.boatGraphics.fillStyle(0x666666, 1.0);
            this.boatGraphics.fillRect(-35, -8, 10, 16);

            // Wake if moving fast
            if (this.speed > 3.0) {
                this.boatGraphics.lineStyle(2, 0xffffff, 0.5);
                this.boatGraphics.lineBetween(-40, -12, -60, -20);
                this.boatGraphics.lineBetween(-40, 12, -60, 20);
            }
        }

        // Restore graphics state
        this.boatGraphics.restore();
    }

    renderFishfinder() {
        /**
         * Draw fishfinder minimap in corner
         * Shows depth profile ahead of the boat
         */

        const fWidth = 280;
        const fHeight = 180;
        const fX = this.viewportWidth - fWidth - 20;
        const fY = 20;

        // Background
        this.uiGraphics.fillStyle(0x000000, 0.8);
        this.uiGraphics.fillRoundedRect(fX, fY, fWidth, fHeight, 8);

        // Border
        this.uiGraphics.lineStyle(2, 0x00ff00, 1.0);
        this.uiGraphics.strokeRoundedRect(fX, fY, fWidth, fHeight, 8);

        // Title
        const titleStyle = {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        };
        const title = this.add.text(fX + 10, fY + 8, 'FISHFINDER', titleStyle);
        title.setDepth(1000);
        this.time.delayedCall(50, () => title.destroy());

        // Current depth
        const currentDepth = this.bathyData.getDepthAtPosition(this.playerWorldX, this.playerWorldY);
        const depthText = this.add.text(fX + fWidth - 10, fY + 8, `${currentDepth.toFixed(0)}ft`, titleStyle);
        depthText.setOrigin(1, 0);
        depthText.setDepth(1000);
        this.time.delayedCall(50, () => depthText.destroy());

        // Draw depth profile
        const profileLength = 1000; // Look ahead 1000 game units
        const profile = this.bathyData.getDepthProfile(
            this.playerWorldX,
            this.playerWorldY,
            'horizontal',
            profileLength
        );

        // Draw bottom contour
        this.uiGraphics.lineStyle(2, 0xaa8844, 1.0);
        this.uiGraphics.beginPath();

        for (let i = 0; i < profile.length; i++) {
            const px = fX + 10 + (i / profile.length) * (fWidth - 20);
            const depth = profile[i].depth;
            const py = fY + 40 + ((depth / 150) * (fHeight - 50));

            if (i === 0) {
                this.uiGraphics.moveTo(px, py);
            } else {
                this.uiGraphics.lineTo(px, py);
            }
        }
        this.uiGraphics.strokePath();

        // Fill below bottom
        this.uiGraphics.fillStyle(0x6a5a4a, 0.4);
        this.uiGraphics.fillRect(fX + 10, fY + 40, fWidth - 20, fHeight - 50);

        // Structure indicator
        const structure = this.bathyData.getStructureDescription(this.playerWorldX, this.playerWorldY);
        const structText = this.add.text(fX + 10, fY + fHeight - 25, structure, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#ffff00'
        });
        structText.setDepth(1000);
        this.time.delayedCall(50, () => structText.destroy());

        // Depth description
        const depthDesc = this.bathyData.getDepthDescription(currentDepth);
        const descText = this.add.text(fX + 10, fY + fHeight - 12, depthDesc, {
            fontSize: '9px',
            fontFamily: 'Courier New',
            color: '#88ff88'
        });
        descText.setDepth(1000);
        this.time.delayedCall(50, () => descText.destroy());
    }

    createUI() {
        /**
         * Create persistent UI elements
         */

        // Speed indicator
        this.speedText = this.add.text(20, 20, '', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });
        this.speedText.setDepth(1000);

        // Heading indicator
        this.headingText = this.add.text(20, 45, '', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });
        this.headingText.setDepth(1000);

        // Resource meter (tiredness or gas)
        this.resourceText = this.add.text(20, 70, '', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });
        this.resourceText.setDepth(1000);

        // Instruction text
        this.instructionText = this.add.text(this.viewportWidth / 2, this.viewportHeight - 30, '', {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });
        this.instructionText.setOrigin(0.5, 0);
        this.instructionText.setDepth(1000);
    }

    updateUI() {
        /**
         * Update UI text elements
         */

        // Speed
        const speedMph = (this.speed * 2).toFixed(1);
        this.speedText.setText(`Speed: ${speedMph} mph`);

        // Heading
        const headingNames = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const headingIndex = Math.round(this.heading / 45) % 8;
        this.headingText.setText(`Heading: ${headingNames[headingIndex]} (${Math.round(this.heading)}°)`);

        // Resource
        if (this.fishingType === GameConfig.FISHING_TYPE_KAYAK) {
            const color = this.tiredness >= 80 ? '#ff0000' : '#00ff00';
            this.resourceText.setText(`Stamina: ${Math.floor(100 - this.tiredness)}%`);
            this.resourceText.setColor(color);
        } else if (this.fishingType === GameConfig.FISHING_TYPE_MOTORBOAT) {
            const color = this.gasLevel <= 20 ? '#ff0000' : '#00ff00';
            this.resourceText.setText(`Gas: ${Math.floor(this.gasLevel)}%`);
            this.resourceText.setColor(color);
        }
    }

    showInstruction(message) {
        /**
         * Show temporary instruction message
         */
        this.instructionText.setText(message);

        // Clear after a few seconds
        this.time.delayedCall(3000, () => {
            this.instructionText.setText('');
        });
    }

    startFishing() {
        /**
         * Transition to fishing mode (GameScene)
         * Store current position for terrain generation
         */

        console.log('🎣 Starting fishing mode...');

        // Store position in registry for GameScene to use
        this.registry.set('fishingWorldX', this.playerWorldX);
        this.registry.set('fishingWorldY', this.playerWorldY);

        // Get current depth
        const depth = this.bathyData.getDepthAtPosition(this.playerWorldX, this.playerWorldY);
        console.log(`   Position: (${this.playerWorldX}, ${this.playerWorldY})`);
        console.log(`   Depth: ${depth.toFixed(1)}ft`);

        // Fade out and transition to GameScene
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
            this.scene.start('UIScene');
        });
    }

    shutdown() {
        // Clean up
        if (this.speedText) this.speedText.destroy();
        if (this.headingText) this.headingText.destroy();
        if (this.resourceText) this.resourceText.destroy();
        if (this.instructionText) this.instructionText.destroy();
    }
}

export default NavigationScene;
