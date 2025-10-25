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
        this.showInstruction('Hold X to move forward, D-pad to steer');

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
            select: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB),
        };

        // Menu system
        this.menuOpen = false;
        this.menuSelectedIndex = 0;
        this.menuItems = [
            { label: 'Navigation Map', action: 'navigationMap' },
            { label: 'Tackle Box', action: 'tackleBox' },
            { label: 'Text for Help', action: 'textHelp' },
            { label: 'Fish Whistle', action: 'fishWhistle' }
        ];

        // Sub-menu states
        this.subMenuActive = null; // 'navMap', 'tackleBox', 'tips', null
        this.navMapCursorX = this.playerWorldX;
        this.navMapCursorY = this.playerWorldY;
        this.tackleBoxTab = 0; // 0=lure, 1=line, 2=rod, 3=reel
        this.tackleBoxSelected = { lure: 0, line: 0, rod: 0, reel: 0 };

        // Fishing tips pool
        this.fishingTips = [
            "Fish are most active during dawn and dusk periods.",
            "Match your lure size to the baitfish in the area.",
            "Lake trout prefer cooler water - try fishing deeper.",
            "Drop-offs and ledges are excellent structure for predators.",
            "Perch often school in large numbers over rocky bottoms.",
            "Slow down your retrieve when water temperature drops.",
            "Pike ambush from cover - try fishing near weed beds.",
            "Use lighter line in clear water for more bites.",
            "Watch your sonar for baitfish clouds - predators follow.",
            "Smallmouth bass love rocky points and underwater humps.",
            "Vary your retrieve speed until you find what works.",
            "Heavier lures sink faster to reach deep fish quickly.",
            "In thermoclines, fish often suspend just above or below.",
            "Use your fishfinder to identify bottom structure.",
            "Trophy fish are often alone - look away from schools."
        ];

        // Gamepad support - check for already connected gamepad
        if (this.input.gamepad.total > 0) {
            this.gamepad = this.input.gamepad.getPad(0);
            console.log('🎮 Using existing gamepad for navigation');
        }

        this.input.gamepad.once('connected', (pad) => {
            console.log('🎮 Gamepad connected for navigation');
            this.gamepad = pad;
        });

        // Track button states for "JustDown" detection
        this.buttonStates = {
            triangle: false,
            x: false,
            select: false,
            up: false,
            down: false,
            left: false,
            right: false
        };
    }

    update(time, delta) {
        // Check for menu toggle
        this.handleMenuToggle();

        // If menu is open, handle menu input instead
        if (this.menuOpen) {
            if (this.subMenuActive === 'navMap') {
                this.handleNavMapInput();
                this.renderNavMap();
            } else if (this.subMenuActive === 'tackleBox') {
                this.handleTackleBoxInput();
                this.renderTackleBox();
            } else if (this.subMenuActive === 'tips') {
                this.handleTipsInput();
                this.renderTips();
            } else {
                this.handleMenuInput();
                this.renderMenu();
            }
            return; // Skip normal game updates
        }

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
            if (!this._debugLoggedKeyboard) {
                console.log('✓ X key detected (keyboard)');
                this._debugLoggedKeyboard = true;
            }
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
            // X button (Cross on PlayStation, A on Xbox) - button index 0
            const xButton = this.gamepad.buttons[0];
            if (xButton && xButton.pressed) {
                movePressed = true;
                if (!this._debugLoggedGamepad) {
                    console.log('✓ X button detected (gamepad)');
                    this._debugLoggedGamepad = true;
                }
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

            // Triangle button (Y on Xbox) - button index 3
            // Detect "JustDown" - button is pressed now but wasn't pressed last frame
            const triangleButton = this.gamepad.buttons[3];
            const trianglePressed = triangleButton && triangleButton.pressed;

            if (trianglePressed && !this.buttonStates.triangle) {
                fishPressed = true;
            }

            // Update button state for next frame
            this.buttonStates.triangle = trianglePressed;
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

            if (!this._debugLoggedMovement) {
                console.log(`✓ Movement active - speed: ${this.speed.toFixed(2)}, heading: ${this.heading.toFixed(0)}°`);
                this._debugLoggedMovement = true;
            }
        } else {
            this.isMoving = false;
            this.speed -= this.deceleration;
            this.speed = Math.max(0, this.speed);
        }

        // Fish button - transition to fishing mode
        if (fishPressed && this.speed < 0.5) {
            this.startFishing();
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

        // Draw overview map
        this.renderOverviewMap();
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
         * Draw fishfinder with BOTTOM LOCK feature
         * Bottom of lake always at bottom of display, with depth tick marks
         */

        const fWidth = 280;
        const fHeight = 180;
        const fX = this.viewportWidth - fWidth - 20;
        const fY = 20;
        const chartX = fX + 10;
        const chartY = fY + 30;
        const chartWidth = fWidth - 50; // Leave room for tick marks on right
        const chartHeight = fHeight - 40;

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
        const title = this.add.text(chartX, fY + 8, 'FISHFINDER', titleStyle);
        title.setDepth(1000);
        this.time.delayedCall(50, () => title.destroy());

        // Get depth profile
        const profileLength = 1000; // Look ahead 1000 game units
        const profile = this.bathyData.getDepthProfile(
            this.playerWorldX,
            this.playerWorldY,
            'horizontal',
            profileLength
        );

        // Find depth range for bottom-lock
        let maxDepth = 0;
        let minDepth = 999;
        for (let i = 0; i < profile.length; i++) {
            maxDepth = Math.max(maxDepth, profile[i].depth);
            minDepth = Math.min(minDepth, profile[i].depth);
        }

        // Add some margin above the shallowest point
        const depthRange = maxDepth - minDepth;
        const displayMinDepth = Math.max(0, minDepth - depthRange * 0.2);
        const displayMaxDepth = maxDepth;
        const displayRange = displayMaxDepth - displayMinDepth;

        // Determine tick interval based on depth range
        let tickInterval;
        if (displayRange <= 30) {
            tickInterval = 5;
        } else if (displayRange <= 60) {
            tickInterval = 10;
        } else if (displayRange <= 120) {
            tickInterval = 15;
        } else {
            tickInterval = 20;
        }

        // Draw depth tick marks on right side
        const tickX = chartX + chartWidth + 5;
        const tickTextStyle = {
            fontSize: '9px',
            fontFamily: 'Courier New',
            color: '#888888'
        };

        const startTick = Math.floor(displayMinDepth / tickInterval) * tickInterval;
        for (let depth = startTick; depth <= displayMaxDepth + tickInterval; depth += tickInterval) {
            if (depth < displayMinDepth) continue;

            // Bottom-lock: 0 at top, max depth at bottom
            const normalizedDepth = (depth - displayMinDepth) / displayRange;
            const tickY = chartY + normalizedDepth * chartHeight;

            if (tickY >= chartY && tickY <= chartY + chartHeight) {
                // Tick mark
                this.uiGraphics.lineStyle(1, 0x888888, 0.8);
                this.uiGraphics.lineBetween(tickX, tickY, tickX + 5, tickY);

                // Depth label
                const tickLabel = this.add.text(tickX + 8, tickY, `${depth}`, tickTextStyle);
                tickLabel.setOrigin(0, 0.5);
                tickLabel.setDepth(1000);
                this.time.delayedCall(50, () => tickLabel.destroy());

                // Horizontal grid line
                this.uiGraphics.lineStyle(1, 0x444444, 0.3);
                this.uiGraphics.lineBetween(chartX, tickY, chartX + chartWidth, tickY);
            }
        }

        // Draw water surface line at top
        this.uiGraphics.lineStyle(2, 0x0088ff, 0.6);
        this.uiGraphics.lineBetween(chartX, chartY, chartX + chartWidth, chartY);

        // Draw bottom contour (BOTTOM LOCK - max depth at bottom)
        this.uiGraphics.lineStyle(2, 0xaa8844, 1.0);
        this.uiGraphics.beginPath();

        const bottomPoints = [];
        for (let i = 0; i < profile.length; i++) {
            const px = chartX + (i / profile.length) * chartWidth;
            const depth = profile[i].depth;

            // Bottom-lock scaling: deeper depths appear lower on screen
            const normalizedDepth = (depth - displayMinDepth) / displayRange;
            const py = chartY + normalizedDepth * chartHeight;

            bottomPoints.push({ x: px, y: py });

            if (i === 0) {
                this.uiGraphics.moveTo(px, py);
            } else {
                this.uiGraphics.lineTo(px, py);
            }
        }
        this.uiGraphics.strokePath();

        // Fill below bottom (sediment)
        if (bottomPoints.length > 0) {
            this.uiGraphics.fillStyle(0x6a5a4a, 0.5);
            this.uiGraphics.beginPath();
            this.uiGraphics.moveTo(bottomPoints[0].x, bottomPoints[0].y);
            for (let i = 1; i < bottomPoints.length; i++) {
                this.uiGraphics.lineTo(bottomPoints[i].x, bottomPoints[i].y);
            }
            this.uiGraphics.lineTo(chartX + chartWidth, chartY + chartHeight);
            this.uiGraphics.lineTo(chartX, chartY + chartHeight);
            this.uiGraphics.closePath();
            this.uiGraphics.fillPath();
        }

        // Current depth indicator (boat position)
        const currentDepth = this.bathyData.getDepthAtPosition(this.playerWorldX, this.playerWorldY);
        const depthText = this.add.text(fX + fWidth - 10, fY + 8, `${currentDepth.toFixed(0)}ft`, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#ffff00',
            fontStyle: 'bold'
        });
        depthText.setOrigin(1, 0);
        depthText.setDepth(1000);
        this.time.delayedCall(50, () => depthText.destroy());
    }

    renderOverviewMap() {
        /**
         * Draw overview map in bottom-right corner
         * Shows player position in Burlington Bay
         */

        const mapWidth = 200;
        const mapHeight = 150;
        const mapX = this.viewportWidth - mapWidth - 20;
        const mapY = this.viewportHeight - mapHeight - 20;

        // Background
        this.uiGraphics.fillStyle(0x000000, 0.8);
        this.uiGraphics.fillRoundedRect(mapX, mapY, mapWidth, mapHeight, 8);

        // Border
        this.uiGraphics.lineStyle(2, 0x00ff00, 1.0);
        this.uiGraphics.strokeRoundedRect(mapX, mapY, mapWidth, mapHeight, 8);

        // Title
        const titleStyle = {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        };
        const title = this.add.text(mapX + 10, mapY + 8, 'BURLINGTON BAY', titleStyle);
        title.setDepth(1000);
        this.time.delayedCall(50, () => title.destroy());

        // Map area (inside padding)
        const chartX = mapX + 15;
        const chartY = mapY + 28;
        const chartWidth = mapWidth - 30;
        const chartHeight = mapHeight - 38;

        // Draw depth zones as colored areas
        // East (shallow) to West (deep)
        const zones = [
            { start: 0, end: 0.15, color: 0x88ccff, name: 'Shore' },      // 0-1500: Very shallow (10-25ft)
            { start: 0.15, end: 0.35, color: 0x6699cc, name: 'Shelf' },   // 1500-3500: Shelf (25-50ft)
            { start: 0.35, end: 0.60, color: 0x4466aa, name: 'Drop' },    // 3500-6000: Transitional (50-90ft)
            { start: 0.60, end: 1.0, color: 0x223388, name: 'Deep' }      // 6000-10000: Deep (90-150ft)
        ];

        zones.forEach(zone => {
            const zoneX = chartX + zone.start * chartWidth;
            const zoneWidth = (zone.end - zone.start) * chartWidth;
            this.uiGraphics.fillStyle(zone.color, 0.6);
            this.uiGraphics.fillRect(zoneX, chartY, zoneWidth, chartHeight);
        });

        // Draw shoreline (left edge - Burlington waterfront)
        this.uiGraphics.lineStyle(3, 0x00ff00, 0.8);
        this.uiGraphics.lineBetween(chartX, chartY, chartX, chartY + chartHeight);

        // Draw player position
        const playerXNorm = this.playerWorldX / 10000; // Normalize 0-1
        const playerYNorm = this.playerWorldY / 10000;

        const playerScreenX = chartX + playerXNorm * chartWidth;
        const playerScreenY = chartY + playerYNorm * chartHeight;

        // Player dot
        this.uiGraphics.fillStyle(0xff0000, 1.0);
        this.uiGraphics.fillCircle(playerScreenX, playerScreenY, 5);

        // Player heading indicator
        const headingRad = (this.heading - 90) * (Math.PI / 180);
        const arrowLength = 12;
        const arrowX = playerScreenX + Math.cos(headingRad) * arrowLength;
        const arrowY = playerScreenY + Math.sin(headingRad) * arrowLength;

        this.uiGraphics.lineStyle(2, 0xff0000, 1.0);
        this.uiGraphics.lineBetween(playerScreenX, playerScreenY, arrowX, arrowY);

        // Distance from shore
        const distFromShore = this.playerWorldX; // Units from left edge
        const distMiles = (distFromShore / 1000 * 0.2).toFixed(1); // Rough conversion

        const distText = this.add.text(mapX + mapWidth / 2, mapY + mapHeight - 8, `${distMiles}mi from shore`, {
            fontSize: '9px',
            fontFamily: 'Courier New',
            color: '#88ff88'
        });
        distText.setOrigin(0.5, 0);
        distText.setDepth(1000);
        this.time.delayedCall(50, () => distText.destroy());
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

        // Persistent controls hint
        this.controlsText = this.add.text(this.viewportWidth / 2, this.viewportHeight - 60, 'X: Move  |  D-Pad: Steer', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#88ff88',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        });
        this.controlsText.setOrigin(0.5, 0);
        this.controlsText.setDepth(1000);

        // Fishing action hint (changes based on speed)
        this.actionText = this.add.text(this.viewportWidth / 2, this.viewportHeight - 30, '', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 12, y: 6 },
            fontStyle: 'bold'
        });
        this.actionText.setOrigin(0.5, 0);
        this.actionText.setDepth(1001);

        // Instruction text (for temporary messages)
        this.instructionText = this.add.text(this.viewportWidth / 2, this.viewportHeight - 95, '', {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#00ffff',
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

        // Action hint - changes based on speed
        if (this.speed < 0.5) {
            // Stopped - ready to fish!
            this.actionText.setText('▲ TRIANGLE: START FISHING');
            this.actionText.setColor('#00ff00');
            // Make it flash
            const alpha = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
            this.actionText.setAlpha(alpha);
        } else {
            // Moving - need to stop first
            this.actionText.setText('Release X to stop');
            this.actionText.setColor('#ffaa00');
            this.actionText.setAlpha(1.0);
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

    handleMenuToggle() {
        /**
         * Check if Select button was pressed to toggle menu
         */

        let selectPressed = false;

        // Keyboard
        if (Phaser.Input.Keyboard.JustDown(this.keys.select)) {
            selectPressed = true;
        }

        // Gamepad - Select button (button 8 on most controllers)
        if (this.gamepad) {
            const selectButton = this.gamepad.buttons[8];
            const selectButtonPressed = selectButton && selectButton.pressed;

            if (selectButtonPressed && !this.buttonStates.select) {
                selectPressed = true;
            }

            this.buttonStates.select = selectButtonPressed;
        }

        if (selectPressed) {
            this.menuOpen = !this.menuOpen;
            if (this.menuOpen) {
                this.menuSelectedIndex = 0; // Reset selection
                console.log('📋 Menu opened');
            } else {
                console.log('📋 Menu closed');
            }
        }
    }

    handleMenuInput() {
        /**
         * Handle menu navigation input
         */

        let upPressed = false;
        let downPressed = false;
        let confirmPressed = false;

        // Keyboard
        if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
            upPressed = true;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
            downPressed = true;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.x)) {
            confirmPressed = true;
        }

        // Gamepad
        if (this.gamepad) {
            // D-pad up/down
            const dpadUp = this.gamepad.buttons[12] && this.gamepad.buttons[12].pressed;
            const dpadDown = this.gamepad.buttons[13] && this.gamepad.buttons[13].pressed;

            if (dpadUp && !this.buttonStates.up) {
                upPressed = true;
            }
            if (dpadDown && !this.buttonStates.down) {
                downPressed = true;
            }

            this.buttonStates.up = dpadUp;
            this.buttonStates.down = dpadDown;

            // X button (Cross on PlayStation, A on Xbox) - button index 0
            const xButton = this.gamepad.buttons[0];
            const xButtonPressed = xButton && xButton.pressed;

            if (xButtonPressed && !this.buttonStates.x) {
                confirmPressed = true;
            }

            this.buttonStates.x = xButtonPressed;
        }

        // Navigate menu
        if (upPressed) {
            this.menuSelectedIndex--;
            if (this.menuSelectedIndex < 0) {
                this.menuSelectedIndex = this.menuItems.length - 1;
            }
        }

        if (downPressed) {
            this.menuSelectedIndex++;
            if (this.menuSelectedIndex >= this.menuItems.length) {
                this.menuSelectedIndex = 0;
            }
        }

        // Confirm selection
        if (confirmPressed) {
            this.executeMenuAction(this.menuItems[this.menuSelectedIndex].action);
        }
    }

    executeMenuAction(action) {
        /**
         * Execute the selected menu action
         */

        console.log(`🎯 Menu action: ${action}`);

        switch (action) {
            case 'navigationMap':
                this.subMenuActive = 'navMap';
                this.navMapCursorX = this.playerWorldX;
                this.navMapCursorY = this.playerWorldY;
                break;

            case 'tackleBox':
                this.subMenuActive = 'tackleBox';
                this.tackleBoxTab = 0;
                break;

            case 'textHelp':
                this.subMenuActive = 'tips';
                this.selectedTips = this.getRandomTips(5);
                break;

            case 'fishWhistle':
                this.activateFishWhistle();
                this.menuOpen = false;
                this.subMenuActive = null;
                break;
        }
    }

    getRandomTips(count) {
        const shuffled = [...this.fishingTips].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    activateFishWhistle() {
        console.log('🎵 Fish whistle activated!');
        this.showInstruction('🎵 *WHISTLE* Attracting fish nearby...');

        // Set registry flag for GameScene to spawn trophy fish and bait clouds
        this.registry.set('fishWhistleActive', true);

        // TODO: Play whistle sound here when audio is implemented
    }

    renderMenu() {
        /**
         * Draw the menu overlay
         */

        // Clear previous UI graphics
        this.uiGraphics.clear();

        // Semi-transparent overlay
        this.uiGraphics.fillStyle(0x000000, 0.85);
        this.uiGraphics.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

        // Menu panel
        const menuWidth = 400;
        const menuHeight = 350;
        const menuX = (this.viewportWidth - menuWidth) / 2;
        const menuY = (this.viewportHeight - menuHeight) / 2;

        // Panel background
        this.uiGraphics.fillStyle(0x1a2a3a, 1.0);
        this.uiGraphics.fillRoundedRect(menuX, menuY, menuWidth, menuHeight, 12);

        // Panel border
        this.uiGraphics.lineStyle(3, 0x00ff00, 1.0);
        this.uiGraphics.strokeRoundedRect(menuX, menuY, menuWidth, menuHeight, 12);

        // Title
        const titleText = this.add.text(menuX + menuWidth / 2, menuY + 30, 'PAUSE MENU', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5, 0.5);
        titleText.setDepth(1001);
        this.time.delayedCall(50, () => titleText.destroy());

        // Menu items
        const itemStartY = menuY + 80;
        const itemHeight = 50;

        this.menuItems.forEach((item, index) => {
            const itemY = itemStartY + index * itemHeight;
            const isSelected = index === this.menuSelectedIndex;

            // Item background (highlight if selected)
            if (isSelected) {
                this.uiGraphics.fillStyle(0x3a5a4a, 1.0);
                this.uiGraphics.fillRoundedRect(menuX + 20, itemY - 20, menuWidth - 40, 45, 8);
                this.uiGraphics.lineStyle(2, 0x00ffff, 1.0);
                this.uiGraphics.strokeRoundedRect(menuX + 20, itemY - 20, menuWidth - 40, 45, 8);
            }

            // Item text
            const itemText = this.add.text(menuX + menuWidth / 2, itemY, item.label, {
                fontSize: isSelected ? '20px' : '18px',
                fontFamily: 'Courier New',
                color: isSelected ? '#00ffff' : '#aaffaa',
                fontStyle: isSelected ? 'bold' : 'normal'
            });
            itemText.setOrigin(0.5, 0.5);
            itemText.setDepth(1001);
            this.time.delayedCall(50, () => itemText.destroy());
        });

        // Controls hint
        const hintText = this.add.text(menuX + menuWidth / 2, menuY + menuHeight - 30, '↑↓: Navigate | X: Select | TAB: Close', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#888888'
        });
        hintText.setOrigin(0.5, 0.5);
        hintText.setDepth(1001);
        this.time.delayedCall(50, () => hintText.destroy());
    }

    handleNavMapInput() {
        /**
         * Handle navigation map cursor movement and fast travel
         */

        const moveSpeed = 100; // Units per frame
        let moved = false;

        // Arrow keys or D-pad for cursor movement
        if (this.keys.left.isDown || (this.gamepad && this.gamepad.left)) {
            this.navMapCursorX -= moveSpeed;
            moved = true;
        }
        if (this.keys.right.isDown || (this.gamepad && this.gamepad.right)) {
            this.navMapCursorX += moveSpeed;
            moved = true;
        }
        if (this.keys.up.isDown || (this.gamepad && this.gamepad.up)) {
            this.navMapCursorY -= moveSpeed;
            moved = true;
        }
        if (this.keys.down.isDown || (this.gamepad && this.gamepad.down)) {
            this.navMapCursorY += moveSpeed;
            moved = true;
        }

        // Clamp cursor to map bounds
        this.navMapCursorX = Math.max(0, Math.min(10000, this.navMapCursorX));
        this.navMapCursorY = Math.max(0, Math.min(10000, this.navMapCursorY));

        // X button (B on 8bitdo) to fast travel
        let confirmPressed = false;
        if (Phaser.Input.Keyboard.JustDown(this.keys.x)) {
            confirmPressed = true;
        }
        if (this.gamepad) {
            const xButton = this.gamepad.buttons[0];
            const xButtonPressed = xButton && xButton.pressed;
            if (xButtonPressed && !this.buttonStates.x) {
                confirmPressed = true;
            }
            this.buttonStates.x = xButtonPressed;
        }

        if (confirmPressed) {
            // Fast travel to cursor position
            this.playerWorldX = this.navMapCursorX;
            this.playerWorldY = this.navMapCursorY;
            console.log(`⚡ Fast traveled to (${this.playerWorldX}, ${this.playerWorldY})`);
            this.showInstruction(`Fast Traveled! Depth: ${this.bathyData.getDepthAtPosition(this.playerWorldX, this.playerWorldY).toFixed(0)}ft`);
            this.menuOpen = false;
            this.subMenuActive = null;
        }

        // Select/TAB to close
        if (Phaser.Input.Keyboard.JustDown(this.keys.select)) {
            this.subMenuActive = null;
        }
        if (this.gamepad) {
            const selectButton = this.gamepad.buttons[8];
            const selectButtonPressed = selectButton && selectButton.pressed;
            if (selectButtonPressed && !this.buttonStates.select) {
                this.subMenuActive = null;
            }
            this.buttonStates.select = selectButtonPressed;
        }
    }

    renderNavMap() {
        /**
         * Render full Burlington Bay navigation map with cursor
         */

        // Clear previous UI graphics
        this.uiGraphics.clear();

        // Semi-transparent overlay
        this.uiGraphics.fillStyle(0x000000, 0.9);
        this.uiGraphics.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

        // Map panel - larger, centered
        const mapWidth = 600;
        const mapHeight = 500;
        const mapX = (this.viewportWidth - mapWidth) / 2;
        const mapY = (this.viewportHeight - mapHeight) / 2;

        // Panel background
        this.uiGraphics.fillStyle(0x0a1a2a, 1.0);
        this.uiGraphics.fillRoundedRect(mapX, mapY, mapWidth, mapHeight, 12);

        // Panel border
        this.uiGraphics.lineStyle(3, 0x00ff00, 1.0);
        this.uiGraphics.strokeRoundedRect(mapX, mapY, mapWidth, mapHeight, 12);

        // Title
        const titleText = this.add.text(mapX + mapWidth / 2, mapY + 25, 'BURLINGTON BAY - NAVIGATION MAP', {
            fontSize: '20px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5, 0.5);
        titleText.setDepth(1001);
        this.time.delayedCall(50, () => titleText.destroy());

        // Map area
        const chartX = mapX + 40;
        const chartY = mapY + 60;
        const chartWidth = mapWidth - 80;
        const chartHeight = mapHeight - 120;

        // Draw depth zones
        const zones = [
            { start: 0, end: 0.15, color: 0x88ccff },      // Shore
            { start: 0.15, end: 0.35, color: 0x6699cc },   // Shelf
            { start: 0.35, end: 0.60, color: 0x4466aa },   // Drop
            { start: 0.60, end: 1.0, color: 0x223388 }     // Deep
        ];

        zones.forEach(zone => {
            const zoneX = chartX + zone.start * chartWidth;
            const zoneWidth = (zone.end - zone.start) * chartWidth;
            this.uiGraphics.fillStyle(zone.color, 0.8);
            this.uiGraphics.fillRect(zoneX, chartY, zoneWidth, chartHeight);
        });

        // Draw shoreline
        this.uiGraphics.lineStyle(4, 0x00ff00, 1.0);
        this.uiGraphics.lineBetween(chartX, chartY, chartX, chartY + chartHeight);

        // Draw player current position
        const playerXNorm = this.playerWorldX / 10000;
        const playerYNorm = this.playerWorldY / 10000;
        const playerScreenX = chartX + playerXNorm * chartWidth;
        const playerScreenY = chartY + playerYNorm * chartHeight;

        this.uiGraphics.fillStyle(0xffff00, 1.0);
        this.uiGraphics.fillCircle(playerScreenX, playerScreenY, 6);
        this.uiGraphics.lineStyle(2, 0xffff00, 1.0);
        this.uiGraphics.strokeCircle(playerScreenX, playerScreenY, 10);

        // Draw cursor position
        const cursorXNorm = this.navMapCursorX / 10000;
        const cursorYNorm = this.navMapCursorY / 10000;
        const cursorScreenX = chartX + cursorXNorm * chartWidth;
        const cursorScreenY = chartY + cursorYNorm * chartHeight;

        this.uiGraphics.fillStyle(0xff0000, 1.0);
        this.uiGraphics.fillCircle(cursorScreenX, cursorScreenY, 8);
        this.uiGraphics.lineStyle(3, 0xff0000, 1.0);
        this.uiGraphics.strokeCircle(cursorScreenX, cursorScreenY, 15);

        // Cursor depth
        const cursorDepth = this.bathyData.getDepthAtPosition(this.navMapCursorX, this.navMapCursorY);
        const cursorText = this.add.text(cursorScreenX, cursorScreenY - 30, `${cursorDepth.toFixed(0)}ft`, {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        });
        cursorText.setOrigin(0.5, 0.5);
        cursorText.setDepth(1001);
        this.time.delayedCall(50, () => cursorText.destroy());

        // Controls hint
        const hintText = this.add.text(mapX + mapWidth / 2, mapY + mapHeight - 30, 'Arrow Keys: Move Cursor | X: Fast Travel | TAB: Cancel', {
            fontSize: '13px',
            fontFamily: 'Courier New',
            color: '#aaaaaa'
        });
        hintText.setOrigin(0.5, 0.5);
        hintText.setDepth(1001);
        this.time.delayedCall(50, () => hintText.destroy());
    }

    handleTackleBoxInput() {
        /**
         * Handle tackle box navigation
         */

        // TAB to close
        if (Phaser.Input.Keyboard.JustDown(this.keys.select)) {
            this.subMenuActive = null;
        }
        if (this.gamepad) {
            const selectButton = this.gamepad.buttons[8];
            const selectButtonPressed = selectButton && selectButton.pressed;
            if (selectButtonPressed && !this.buttonStates.select) {
                this.subMenuActive = null;
            }
            this.buttonStates.select = selectButtonPressed;
        }

        // Left/Right to change tabs
        let leftPressed = false;
        let rightPressed = false;

        if (Phaser.Input.Keyboard.JustDown(this.keys.left)) leftPressed = true;
        if (Phaser.Input.Keyboard.JustDown(this.keys.right)) rightPressed = true;

        if (this.gamepad) {
            const dpadLeft = this.gamepad.buttons[14] && this.gamepad.buttons[14].pressed;
            const dpadRight = this.gamepad.buttons[15] && this.gamepad.buttons[15].pressed;

            if (dpadLeft && !this.buttonStates.left) leftPressed = true;
            if (dpadRight && !this.buttonStates.right) rightPressed = true;

            this.buttonStates.left = dpadLeft;
            this.buttonStates.right = dpadRight;
        }

        if (leftPressed) {
            this.tackleBoxTab--;
            if (this.tackleBoxTab < 0) this.tackleBoxTab = 3;
        }
        if (rightPressed) {
            this.tackleBoxTab++;
            if (this.tackleBoxTab > 3) this.tackleBoxTab = 0;
        }
    }

    renderTackleBox() {
        /**
         * Render tackle box selection screen
         */

        // Clear previous UI graphics
        this.uiGraphics.clear();

        // Semi-transparent overlay
        this.uiGraphics.fillStyle(0x000000, 0.9);
        this.uiGraphics.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

        // Panel
        const panelWidth = 600;
        const panelHeight = 450;
        const panelX = (this.viewportWidth - panelWidth) / 2;
        const panelY = (this.viewportHeight - panelHeight) / 2;

        // Panel background
        this.uiGraphics.fillStyle(0x1a2a1a, 1.0);
        this.uiGraphics.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);

        // Panel border
        this.uiGraphics.lineStyle(3, 0x00ff00, 1.0);
        this.uiGraphics.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);

        // Title
        const titleText = this.add.text(panelX + panelWidth / 2, panelY + 25, 'TACKLE BOX', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5, 0.5);
        titleText.setDepth(1001);
        this.time.delayedCall(50, () => titleText.destroy());

        // Tab headers
        const tabs = ['LURE', 'LINE', 'ROD', 'REEL'];
        const tabWidth = (panelWidth - 80) / 4;
        const tabY = panelY + 60;

        tabs.forEach((tab, index) => {
            const tabX = panelX + 40 + index * tabWidth;
            const isActive = index === this.tackleBoxTab;

            if (isActive) {
                this.uiGraphics.fillStyle(0x3a5a3a, 1.0);
                this.uiGraphics.fillRoundedRect(tabX, tabY, tabWidth - 10, 40, 6);
                this.uiGraphics.lineStyle(2, 0x00ffff, 1.0);
                this.uiGraphics.strokeRoundedRect(tabX, tabY, tabWidth - 10, 40, 6);
            }

            const tabText = this.add.text(tabX + (tabWidth - 10) / 2, tabY + 20, tab, {
                fontSize: isActive ? '16px' : '14px',
                fontFamily: 'Courier New',
                color: isActive ? '#00ffff' : '#88aa88',
                fontStyle: isActive ? 'bold' : 'normal'
            });
            tabText.setOrigin(0.5, 0.5);
            tabText.setDepth(1001);
            this.time.delayedCall(50, () => tabText.destroy());
        });

        // Content area
        const contentText = this.add.text(panelX + panelWidth / 2, panelY + 200, 'Gear selection coming soon!\n\nChoose your lures, lines,\nrods, and reels.', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#aaffaa',
            align: 'center'
        });
        contentText.setOrigin(0.5, 0.5);
        contentText.setDepth(1001);
        this.time.delayedCall(50, () => contentText.destroy());

        // Controls hint
        const hintText = this.add.text(panelX + panelWidth / 2, panelY + panelHeight - 30, '← →: Change Tab | TAB: Close', {
            fontSize: '13px',
            fontFamily: 'Courier New',
            color: '#888888'
        });
        hintText.setOrigin(0.5, 0.5);
        hintText.setDepth(1001);
        this.time.delayedCall(50, () => hintText.destroy());
    }

    handleTipsInput() {
        /**
         * Handle fishing tips screen input
         */

        // Any button to close
        if (Phaser.Input.Keyboard.JustDown(this.keys.x) || Phaser.Input.Keyboard.JustDown(this.keys.select)) {
            this.subMenuActive = null;
        }

        if (this.gamepad) {
            const xButton = this.gamepad.buttons[0];
            const selectButton = this.gamepad.buttons[8];
            const xButtonPressed = xButton && xButton.pressed;
            const selectButtonPressed = selectButton && selectButton.pressed;

            if ((xButtonPressed && !this.buttonStates.x) || (selectButtonPressed && !this.buttonStates.select)) {
                this.subMenuActive = null;
            }

            this.buttonStates.x = xButtonPressed;
            this.buttonStates.select = selectButtonPressed;
        }
    }

    renderTips() {
        /**
         * Render fishing tips screen
         */

        // Clear previous UI graphics
        this.uiGraphics.clear();

        // Semi-transparent overlay
        this.uiGraphics.fillStyle(0x000000, 0.9);
        this.uiGraphics.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

        // Panel
        const panelWidth = 600;
        const panelHeight = 500;
        const panelX = (this.viewportWidth - panelWidth) / 2;
        const panelY = (this.viewportHeight - panelHeight) / 2;

        // Panel background
        this.uiGraphics.fillStyle(0x1a1a2a, 1.0);
        this.uiGraphics.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);

        // Panel border
        this.uiGraphics.lineStyle(3, 0x00ff00, 1.0);
        this.uiGraphics.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);

        // Title
        const titleText = this.add.text(panelX + panelWidth / 2, panelY + 30, '📱 FISHING TIPS', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5, 0.5);
        titleText.setDepth(1001);
        this.time.delayedCall(50, () => titleText.destroy());

        // Display 5 tips
        const tipStartY = panelY + 80;
        const tipSpacing = 70;

        this.selectedTips.forEach((tip, index) => {
            const tipY = tipStartY + index * tipSpacing;

            // Tip number
            const numberText = this.add.text(panelX + 50, tipY, `${index + 1}.`, {
                fontSize: '18px',
                fontFamily: 'Courier New',
                color: '#ffaa00',
                fontStyle: 'bold'
            });
            numberText.setDepth(1001);
            this.time.delayedCall(50, () => numberText.destroy());

            // Tip text
            const tipText = this.add.text(panelX + 80, tipY, tip, {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#aaffaa',
                wordWrap: { width: panelWidth - 140 }
            });
            tipText.setDepth(1001);
            this.time.delayedCall(50, () => tipText.destroy());
        });

        // Controls hint
        const hintText = this.add.text(panelX + panelWidth / 2, panelY + panelHeight - 30, 'X or TAB: Close', {
            fontSize: '13px',
            fontFamily: 'Courier New',
            color: '#888888'
        });
        hintText.setOrigin(0.5, 0.5);
        hintText.setDepth(1001);
        this.time.delayedCall(50, () => hintText.destroy());
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
        if (this.controlsText) this.controlsText.destroy();
        if (this.actionText) this.actionText.destroy();
        if (this.instructionText) this.instructionText.destroy();
    }
}

export default NavigationScene;
