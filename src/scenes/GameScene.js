import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import SonarDisplay from '../utils/SonarDisplay.js';
import Lure from '../entities/Lure.js';
import Fish from '../entities/Fish.js';
import BaitfishCloud from '../entities/BaitfishCloud.js';
import FishFight from '../entities/FishFight.js';
import IceHoleManager from '../managers/IceHoleManager.js';
import BoatManager from '../managers/BoatManager.js';
import FishingLine from '../entities/FishingLine.js';
import { FishingLineModel } from '../models/FishingLineModel.js';

// Import all systems
import SpawningSystem from './systems/SpawningSystem.js';
import InputSystem from './systems/InputSystem.js';
import CollisionSystem from './systems/CollisionSystem.js';
import DebugSystem from './systems/DebugSystem.js';
import ScoreSystem from './systems/ScoreSystem.js';
import NotificationSystem from './systems/NotificationSystem.js';

/**
 * GameScene - Main game logic orchestrator
 *
 * This scene has been refactored to use a systems-based architecture.
 * Game logic is now split into focused, testable systems:
 * - SpawningSystem: Fish/baitfish/zooplankton spawning
 * - InputSystem: Keyboard and gamepad handling
 * - CollisionSystem: Collision detection and interactions
 * - DebugSystem: Debug visualization
 * - ScoreSystem: Score tracking and achievements
 * - NotificationSystem: In-game messages and overlays
 *
 * @module scenes/GameScene
 *
 * COMMON TASKS:
 * - Modify fish spawning → src/scenes/systems/SpawningSystem.js
 * - Change controls → src/scenes/systems/InputSystem.js
 * - Add achievements → src/scenes/systems/ScoreSystem.js
 * - Adjust debug display → src/scenes/systems/DebugSystem.js
 */
export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        // Entity arrays
        this.fishes = [];
        this.baitfishClouds = [];
        this.zooplankton = [];

        // Game state
        this.score = 0;
        this.fishCaught = 0;
        this.fishLost = 0;
        this.gameTime = 0;
        this.waterTemp = 40;
        this.debugMode = false;
        this.currentFight = null;
        this.controllerTestMode = false;
        this.controllerTestUI = null;

        // Game mode specific
        this.gameMode = null; // 'arcade' or 'unlimited'
        this.timeRemaining = 0;
        this.caughtFishData = [];

        // Systems (initialized in create())
        this.spawningSystem = null;
        this.inputSystem = null;
        this.collisionSystem = null;
        this.debugSystem = null;
        this.scoreSystem = null;
        this.notificationSystem = null;

        // Tackle box state
        this.tackleBoxOpen = false;
        this.tackleBoxTab = 0; // 0=lure, 1=line
        this.tackleBoxSelected = { lure: 0, line: 0 };
        this.tackleBoxButtonStates = {
            select: false,
            left: false,
            right: false,
            up: false,
            down: false,
            x: false
        };
        this.tackleBoxGear = {
            lureWeights: [
                { label: '1/4 oz', value: 0.25, desc: 'Ultralight - slow sink' },
                { label: '1/2 oz', value: 0.5, desc: 'Light - versatile' },
                { label: '1 oz', value: 1.0, desc: 'Medium - good depth' },
                { label: '2 oz', value: 2.0, desc: 'Heavy - fast sink' },
                { label: '3 oz', value: 3.0, desc: 'Very heavy - deep water' },
                { label: '4 oz', value: 4.0, desc: 'Extreme - deepest water' }
            ],
            lineTypes: [
                { label: 'Braided', value: 'braid', desc: 'No stretch, high visibility' },
                { label: 'Monofilament', value: 'monofilament', desc: 'Stretchy, invisible' },
                { label: 'Fluorocarbon', value: 'fluorocarbon', desc: 'Low visibility, abrasion resistant' }
            ]
        };
        this.tackleBoxGraphics = null;
    }

    /**
     * Create game scene and initialize all systems
     */
    create() {
        try {
            // Get fishing type and game mode from registry (set by MenuScene)
            this.fishingType = this.registry.get('fishingType') || GameConfig.FISHING_TYPE_ICE;
            this.gameMode = this.registry.get('gameMode') || GameConfig.GAME_MODE_UNLIMITED;

            // Get actual depth from bathymetric data (set by NavigationScene)
            this.maxDepth = this.registry.get('currentDepth') || GameConfig.MAX_DEPTH;
            console.log(`Starting game: ${this.fishingType} fishing in ${this.gameMode} mode`);
            console.log(`Water depth at location: ${this.maxDepth.toFixed(1)}ft`);

            // Calculate dynamic depth scale to keep bottom at consistent screen position
            // Target: bottom at 85% down screen, leaving 15% for bottom visualization
            const TARGET_BOTTOM_RATIO = 0.85;
            const MIN_DISPLAY_RANGE = 175; // Always show at least 175ft range

            // Calculate required display range to position bottom correctly
            const idealDisplayRange = this.maxDepth / TARGET_BOTTOM_RATIO;
            const displayRange = Math.max(idealDisplayRange, MIN_DISPLAY_RANGE);

            // Calculate pixels per foot based on display range
            GameConfig.DEPTH_SCALE = GameConfig.CANVAS_HEIGHT / displayRange;

            console.log(`Display range: 0-${displayRange.toFixed(1)}ft (${GameConfig.DEPTH_SCALE.toFixed(2)} px/ft)`);
            console.log(`Bottom position: ${(this.maxDepth * GameConfig.DEPTH_SCALE).toFixed(1)}px (${((this.maxDepth * GameConfig.DEPTH_SCALE / GameConfig.CANVAS_HEIGHT) * 100).toFixed(1)}% down screen)`);

            // Store display range for depth markers
            this.displayRange = displayRange;

            // Initialize timer based on game mode
            if (this.gameMode === GameConfig.GAME_MODE_ARCADE) {
                this.timeRemaining = GameConfig.ARCADE_TIME_LIMIT;
                this.gameTime = 0;
            } else {
                this.timeRemaining = 0;
                this.gameTime = 0;
            }

            // Set up appropriate manager based on fishing type
            this.initializeManagers();

            // Set up the sonar display
            this.sonarDisplay = new SonarDisplay(this, this.fishingType);

            // Create the player's lure - start at surface (0 feet)
            this.lure = new Lure(this, GameConfig.CANVAS_WIDTH / 2, 0);

            // Apply lure weight from tackle box selection
            const lureWeight = this.registry.get('lureWeight');
            if (lureWeight !== undefined) {
                this.lure.weight = lureWeight;
                console.log(`🎣 Lure weight set to ${lureWeight}oz`);
            }

            // Create fishing line
            this.fishingLine = new FishingLine(this);

            // Apply line type from tackle box selection
            const lineType = this.registry.get('lineType');
            const braidColor = this.registry.get('braidColor');
            if (lineType !== undefined) {
                this.fishingLine.setLineType(lineType, braidColor);
                console.log(`🧵 Line type set to ${lineType}${lineType === 'braid' ? ' (' + braidColor + ')' : ''}`);
            }

            // Initialize fishing line model
            this.fishingLineModel = new FishingLineModel();

            // Set water temperature
            this.initializeWaterTemp();

            // Initialize all game systems
            this.initializeSystems();

            // Event listeners
            this.events.on('fishCaught', this.handleFishCaught, this);

            // Fade in
            this.cameras.main.fadeIn(500);

            // Show game mode notification
            this.notificationSystem.showGameModeNotification();

            // Check for fish whistle activation from NavigationScene
            if (this.registry.get('fishWhistleActive')) {
                this.spawnFishWhistleFish();
                this.registry.set('fishWhistleActive', false);
            }

        } catch (error) {
            console.error('Failed to initialize GameScene:', error);
            // Fallback to boot scene
            this.scene.start('BootScene');
        }
    }

    /**
     * Initialize location managers (ice hole or boat)
     */
    initializeManagers() {
        const isSummerMode = this.fishingType === GameConfig.FISHING_TYPE_KAYAK ||
                             this.fishingType === GameConfig.FISHING_TYPE_MOTORBOAT;

        if (isSummerMode) {
            this.boatManager = new BoatManager(this, this.fishingType);
            this.iceHoleManager = null;
        } else {
            this.iceHoleManager = new IceHoleManager(this);
            this.boatManager = null;
        }

        // Show/hide UI panels based on fishing mode
        const iceDrillPanel = document.getElementById('ice-drill-panel');
        const kayakPanel = document.getElementById('kayak-tiredness-panel');
        const boatPanel = document.getElementById('motorboat-gas-panel');

        if (this.fishingType === GameConfig.FISHING_TYPE_ICE) {
            if (iceDrillPanel) iceDrillPanel.style.display = 'block';
            if (kayakPanel) kayakPanel.style.display = 'none';
            if (boatPanel) boatPanel.style.display = 'none';
        } else if (this.fishingType === GameConfig.FISHING_TYPE_KAYAK) {
            if (iceDrillPanel) iceDrillPanel.style.display = 'none';
            if (kayakPanel) kayakPanel.style.display = 'block';
            if (boatPanel) boatPanel.style.display = 'none';
        } else if (this.fishingType === GameConfig.FISHING_TYPE_MOTORBOAT) {
            if (iceDrillPanel) iceDrillPanel.style.display = 'none';
            if (kayakPanel) kayakPanel.style.display = 'none';
            if (boatPanel) boatPanel.style.display = 'block';
        }
    }

    /**
     * Set water temperature based on fishing type
     */
    initializeWaterTemp() {
        const isSummerMode = this.fishingType === GameConfig.FISHING_TYPE_KAYAK ||
                             this.fishingType === GameConfig.FISHING_TYPE_MOTORBOAT;

        if (isSummerMode) {
            this.waterTemp = Utils.randomBetween(GameConfig.SUMMER_WATER_TEMP_MIN, GameConfig.SUMMER_WATER_TEMP_MAX);
        } else {
            this.waterTemp = Utils.randomBetween(GameConfig.WATER_TEMP_MIN, GameConfig.WATER_TEMP_MAX);
        }
    }

    /**
     * Initialize all game systems
     */
    initializeSystems() {
        this.spawningSystem = new SpawningSystem(this);
        this.inputSystem = new InputSystem(this);
        this.collisionSystem = new CollisionSystem(this);
        this.debugSystem = new DebugSystem(this);
        this.scoreSystem = new ScoreSystem(this);
        this.notificationSystem = new NotificationSystem(this);

        console.log('All game systems initialized');
    }

    /**
     * Main update loop - orchestrates all systems
     * @param {number} time - Current game time
     * @param {number} delta - Time since last frame
     */
    update(time, delta) {
        // Controller test mode - update test UI and block game inputs
        if (this.controllerTestMode && this.controllerTestUpdate) {
            this.controllerTestUpdate();
            return;
        }

        // Check for pause input
        if (this.inputSystem.checkPauseInput()) {
            this.notificationSystem.togglePause();
        }

        // Always update notification system (handles pause menu input)
        this.notificationSystem.update(time, delta);

        // If paused, skip all game updates
        if (this.notificationSystem.isPausedState()) {
            return;
        }

        // Check for tackle box toggle (TAB key or Select button)
        if (!this.tackleBoxOpen) {
            const tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
            if (Phaser.Input.Keyboard.JustDown(tabKey)) {
                this.toggleTackleBox();
            }

            if (window.gamepadManager && window.gamepadManager.isConnected()) {
                const selectButton = window.gamepadManager.getButton('Select');
                if (selectButton && selectButton.pressed && !this.tackleBoxButtonStates.select) {
                    this.toggleTackleBox();
                }
                this.tackleBoxButtonStates.select = selectButton ? selectButton.pressed : false;
            }
        }

        // If tackle box is open, handle its input and render it
        if (this.tackleBoxOpen) {
            this.handleTackleBoxInput();
            this.renderTackleBox();
            return; // Skip normal game updates while tackle box is open
        }

        // Handle fish fight if active
        if (this.currentFight && this.currentFight.active) {
            this.updateFishFight(time);
            // Don't return - let entities continue to update during fight
        }

        // Update managers
        this.updateManagers();

        // Update sonar display
        this.sonarDisplay.update();

        // Handle input (only if not fighting)
        if (!this.currentFight || !this.currentFight.active) {
            this.inputSystem.handleKeyboardInput();
            this.inputSystem.handleGamepadInput();
        }

        // Update lure (only if not fighting)
        if (!this.currentFight || !this.currentFight.active) {
            this.lure.update();
        }

        // Update fishing line
        const hookedFish = this.currentFight && this.currentFight.active ? this.currentFight.fish : null;
        const manager = this.iceHoleManager || this.boatManager;
        this.fishingLine.update(this.lure, hookedFish, manager);

        // Continuously update lure info in UI
        this.updateSpeedDisplay();

        // Update all entities
        this.updateEntities();

        // Update all systems
        this.spawningSystem.update(time, delta);
        this.collisionSystem.update(time, delta);
        this.debugSystem.update(time, delta);
        this.scoreSystem.update(time, delta);

        // Check for emergency fish spawn (arcade mode)
        this.spawningSystem.checkEmergencySpawn();
    }

    /**
     * Update managers (ice hole or boat)
     */
    updateManagers() {
        if (this.iceHoleManager) {
            this.iceHoleManager.update();
        } else if (this.boatManager) {
            this.boatManager.update();
        }
    }

    /**
     * Wrapper for debug panel - delegates to SpawningSystem
     */
    trySpawnFish() {
        if (this.spawningSystem) {
            this.spawningSystem.trySpawnFish();
        }
    }

    /**
     * Fish whistle - spawn trophy fish of each species + large bait clouds
     */
    spawnFishWhistleFish() {
        console.log('🎵 Fish whistle: Spawning trophy fish and large bait clouds...');

        // Get player position
        let playerWorldX;
        if (this.iceHoleManager) {
            const currentHole = this.iceHoleManager.getCurrentHole();
            if (!currentHole) return;
            playerWorldX = currentHole.x;
        } else if (this.boatManager) {
            playerWorldX = this.boatManager.getPlayerWorldX();
        } else {
            return;
        }

        // Spawn 1 trophy fish of each species
        const species = ['yellow_perch', 'lake_trout', 'northern_pike', 'smallmouth_bass'];

        species.forEach((speciesName, index) => {
            // Space them out around the player
            const angle = (index / species.length) * Math.PI * 2;
            const distance = 300 + Math.random() * 100;
            const worldX = playerWorldX + Math.cos(angle) * distance;

            // Depth based on species preference
            let depth;
            if (speciesName === 'yellow_perch') {
                depth = Utils.randomBetween(15, 35); // Shallow-mid
            } else if (speciesName === 'northern_pike') {
                depth = Utils.randomBetween(10, 25); // Shallow
            } else if (speciesName === 'smallmouth_bass') {
                depth = Utils.randomBetween(20, 40); // Mid
            } else { // lake_trout
                depth = Utils.randomBetween(50, 90); // Deep
            }

            const y = depth * GameConfig.DEPTH_SCALE;

            // All TROPHY size
            const fish = new Fish(this, worldX, y, 'TROPHY', this.fishingType, speciesName);

            // Set movement direction
            fish.ai.idleDirection = Math.random() < 0.5 ? -1 : 1;

            this.fishes.push(fish);
            console.log(`  Spawned trophy ${speciesName} at ${depth}ft`);
        });

        // Spawn 2 extra large bait clouds
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 200;
            const worldX = playerWorldX + Math.cos(angle) * distance;

            // Random depth between 20-70 feet
            const depth = Utils.randomBetween(20, 70);
            const y = depth * GameConfig.DEPTH_SCALE;

            // Large cloud size (80-120 fish)
            const cloudSize = Math.floor(Utils.randomBetween(80, 120));

            // Random baitfish species
            const baitSpecies = ['alewife', 'rainbow_smelt', 'yellow_perch'][Math.floor(Math.random() * 3)];

            const cloud = new BaitfishCloud(this, worldX, y, cloudSize, this.fishingType, baitSpecies);

            this.baitfishClouds.push(cloud);
            console.log(`  Spawned large ${baitSpecies} cloud (${cloudSize} fish) at ${depth}ft`);
        }

        // Show notification
        this.notificationSystem.showMessage('Fish Whistle!', 'Trophy fish attracted to the area!');
    }

    /**
     * Update all entities (fish, baitfish, zooplankton)
     */
    updateEntities() {
        // Update zooplankton
        this.zooplankton = this.zooplankton.filter(zp => {
            if (zp.visible && !zp.consumed) {
                zp.update();
                zp.render();
                return true;
            } else {
                zp.destroy();
                return false;
            }
        });

        // Update baitfish clouds
        const newCloudsFromSplits = [];
        this.baitfishClouds = this.baitfishClouds.filter(cloud => {
            if (cloud.visible) {
                const newCloud = cloud.update(this.fishes, this.zooplankton);
                // If cloud split, add the new cloud to our collection
                if (newCloud) {
                    newCloudsFromSplits.push(newCloud);
                }
                return true;
            } else {
                cloud.destroy();
                return false;
            }
        });
        // Add any new clouds created by splitting
        this.baitfishClouds.push(...newCloudsFromSplits);

        // Update fish
        this.fishes.forEach((fish, index) => {
            fish.update(this.lure, this.fishes, this.baitfishClouds);

            // Remove fish that are no longer visible or caught
            if (!fish.visible) {
                fish.destroy();
                this.fishes.splice(index, 1);
            }
        });
    }

    /**
     * Update fish fight mechanics
     * @param {number} time - Current game time
     */
    updateFishFight(time) {
        const reelPressed = this.inputSystem.handleFishFightInput();

        // Update the fight
        this.currentFight.update(time, reelPressed);

        // Check if fight is still active
        if (!this.currentFight || !this.currentFight.active) {
            return;
        }

        // Add periodic rumble during fish fight based on line tension
        if (window.gamepadManager && window.gamepadManager.isConnected()) {
            const tension = this.currentFight.lineTension / 100;

            if (tension > 0.9 && time % 500 < 50) {
                this.rumbleGamepad(100, 0.8, 0.4);
            } else if (tension > 0.7 && time % 800 < 50) {
                this.rumbleGamepad(80, 0.5, 0.3);
            } else if (reelPressed) {
                this.rumbleGamepad(50, 0.2, 0.1);
            }
        }
    }

    /**
     * Handle fish caught event (start fish fight)
     * @param {Fish} fish - The fish that was caught
     */
    handleFishCaught(fish) {
        console.log('Fish hooked! Starting fight...');

        // Rumble on fish bite
        this.rumbleGamepad(300, 0.6, 0.3);

        // Show hook notification
        this.notificationSystem.showFishHookedNotification();

        // Start the fight
        this.currentFight = new FishFight(this, fish, this.lure);
    }

    /**
     * Trigger gamepad rumble
     * @param {number} duration - Rumble duration in ms
     * @param {number} strongMagnitude - Strong motor magnitude (0-1)
     * @param {number} weakMagnitude - Weak motor magnitude (0-1)
     */
    rumbleGamepad(duration = 200, strongMagnitude = 0.5, weakMagnitude = 0.5) {
        if (!window.gamepadManager || !window.gamepadManager.isConnected()) {
            return;
        }

        const gamepad = window.gamepadManager.getGamepad();
        if (!gamepad || !gamepad.vibrationActuator) {
            return;
        }

        try {
            gamepad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: duration,
                weakMagnitude: weakMagnitude,
                strongMagnitude: strongMagnitude
            });
        } catch (error) {
            console.warn('Gamepad vibration not supported:', error);
        }
    }

    /**
     * Update speed display in UI
     */
    updateSpeedDisplay() {
        const lureInfo = this.lure.getInfo();
        this.events.emit('updateLureInfo', lureInfo);
    }

    /**
     * Show controller test window (debug feature)
     */
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
        windowBg.fillRoundedRect(80, 40, 480, 400, 10);
        windowBg.lineStyle(2, 0x00aaff, 1);
        windowBg.strokeRoundedRect(80, 40, 480, 400, 10);
        windowBg.setDepth(2001);

        // Title
        const title = this.add.text(GameConfig.CANVAS_WIDTH / 2, 64, 'CONTROLLER TEST', {
            fontSize: '19px',
            fontFamily: 'Courier New',
            color: '#00aaff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0);
        title.setDepth(2002);

        // Instructions
        const instructions = this.add.text(GameConfig.CANVAS_WIDTH / 2, 96, 'Press buttons on your controller to test', {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#888888'
        });
        instructions.setOrigin(0.5, 0);
        instructions.setDepth(2002);

        // Input status text
        const statusTexts = {
            dpadUp: this.createTestText(120, 136, 'D-Pad UP'),
            dpadDown: this.createTestText(120, 160, 'D-Pad DOWN'),
            dpadLeft: this.createTestText(120, 184, 'D-Pad LEFT'),
            dpadRight: this.createTestText(120, 208, 'D-Pad RIGHT'),
            buttonA: this.createTestText(360, 136, 'A Button'),
            buttonB: this.createTestText(360, 160, 'B Button'),
            buttonX: this.createTestText(360, 184, 'X Button'),
            buttonY: this.createTestText(360, 208, 'Y Button'),
            l1: this.createTestText(120, 248, 'L1/LB'),
            r1: this.createTestText(360, 248, 'R1/RB'),
            l2: this.createTestText(120, 272, 'L2/LT'),
            r2: this.createTestText(360, 272, 'R2/RT'),
            leftStick: this.createTestText(120, 312, 'Left Stick'),
            rightStick: this.createTestText(360, 312, 'Right Stick')
        };

        // OK Button
        const okButton = this.add.graphics();
        okButton.fillStyle(0x00aaff, 1);
        okButton.fillRoundedRect(240, 376, 160, 40, 5);
        okButton.setDepth(2002);
        okButton.setInteractive(new Phaser.Geom.Rectangle(240, 376, 160, 40), Phaser.Geom.Rectangle.Contains);

        const okText = this.add.text(GameConfig.CANVAS_WIDTH / 2, 396, 'OK', {
            fontSize: '16px',
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
            okButton.fillRoundedRect(240, 376, 160, 40, 5);
        });

        okButton.on('pointerout', () => {
            okButton.clear();
            okButton.fillStyle(0x00aaff, 1);
            okButton.fillRoundedRect(240, 376, 160, 40, 5);
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
            this.updateTestButton(statusTexts.buttonA, window.gamepadManager.getButton('X').pressed);
            this.updateTestButton(statusTexts.buttonB, window.gamepadManager.getButton('Circle').pressed);
            this.updateTestButton(statusTexts.buttonX, window.gamepadManager.getButton('Square').pressed);
            this.updateTestButton(statusTexts.buttonY, window.gamepadManager.getButton('Triangle').pressed);
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
            fontSize: '11px',
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

    /**
     * Toggle tackle box menu
     */
    toggleTackleBox() {
        this.tackleBoxOpen = !this.tackleBoxOpen;

        // If closing, clear all graphics immediately
        if (!this.tackleBoxOpen && this.tackleBoxGraphics) {
            this.tackleBoxGraphics.clear();
        }

        console.log(`Tackle box ${this.tackleBoxOpen ? 'opened' : 'closed'}`);
    }

    /**
     * Handle tackle box input
     */
    handleTackleBoxInput() {
        // TAB/Select to close
        const tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        if (Phaser.Input.Keyboard.JustDown(tabKey)) {
            this.toggleTackleBox();
            return;
        }

        // Gamepad select button
        if (window.gamepadManager && window.gamepadManager.isConnected()) {
            const selectButton = window.gamepadManager.getButton('Select');
            if (selectButton && selectButton.pressed && !this.tackleBoxButtonStates.select) {
                this.toggleTackleBox();
                this.tackleBoxButtonStates.select = true;
                return; // Exit early after toggling
            }
            this.tackleBoxButtonStates.select = selectButton ? selectButton.pressed : false;
        }

        // Arrow keys for navigation
        const leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        const rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        const upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        const downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        const xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

        let leftPressed = Phaser.Input.Keyboard.JustDown(leftKey);
        let rightPressed = Phaser.Input.Keyboard.JustDown(rightKey);
        let upPressed = Phaser.Input.Keyboard.JustDown(upKey);
        let downPressed = Phaser.Input.Keyboard.JustDown(downKey);
        let confirmPressed = Phaser.Input.Keyboard.JustDown(xKey);

        // Gamepad D-pad
        if (window.gamepadManager && window.gamepadManager.isConnected()) {
            const dpadLeft = window.gamepadManager.getButton('DpadLeft');
            const dpadRight = window.gamepadManager.getButton('DpadRight');
            const dpadUp = window.gamepadManager.getButton('DpadUp');
            const dpadDown = window.gamepadManager.getButton('DpadDown');
            const xButton = window.gamepadManager.getButton('X');

            if (dpadLeft.pressed && !this.tackleBoxButtonStates.left) leftPressed = true;
            if (dpadRight.pressed && !this.tackleBoxButtonStates.right) rightPressed = true;
            if (dpadUp.pressed && !this.tackleBoxButtonStates.up) upPressed = true;
            if (dpadDown.pressed && !this.tackleBoxButtonStates.down) downPressed = true;
            if (xButton.pressed && !this.tackleBoxButtonStates.x) confirmPressed = true;

            this.tackleBoxButtonStates.left = dpadLeft.pressed;
            this.tackleBoxButtonStates.right = dpadRight.pressed;
            this.tackleBoxButtonStates.up = dpadUp.pressed;
            this.tackleBoxButtonStates.down = dpadDown.pressed;
            this.tackleBoxButtonStates.x = xButton.pressed;
        }

        // Tab switching
        if (leftPressed) {
            this.tackleBoxTab--;
            if (this.tackleBoxTab < 0) this.tackleBoxTab = 1;
        }
        if (rightPressed) {
            this.tackleBoxTab++;
            if (this.tackleBoxTab > 1) this.tackleBoxTab = 0;
        }

        // Navigate within tab
        if (this.tackleBoxTab === 0) {
            // LURE tab
            const maxIndex = this.tackleBoxGear.lureWeights.length - 1;
            if (upPressed) {
                this.tackleBoxSelected.lure--;
                if (this.tackleBoxSelected.lure < 0) this.tackleBoxSelected.lure = maxIndex;
            }
            if (downPressed) {
                this.tackleBoxSelected.lure++;
                if (this.tackleBoxSelected.lure > maxIndex) this.tackleBoxSelected.lure = 0;
            }
            if (confirmPressed) {
                const selected = this.tackleBoxGear.lureWeights[this.tackleBoxSelected.lure];
                this.lure.weight = selected.value;
                console.log(`🎣 Lure weight changed to ${selected.label}`);
            }
        } else if (this.tackleBoxTab === 1) {
            // LINE tab
            const maxIndex = this.tackleBoxGear.lineTypes.length - 1;
            if (upPressed) {
                this.tackleBoxSelected.line--;
                if (this.tackleBoxSelected.line < 0) this.tackleBoxSelected.line = maxIndex;
            }
            if (downPressed) {
                this.tackleBoxSelected.line++;
                if (this.tackleBoxSelected.line > maxIndex) this.tackleBoxSelected.line = 0;
            }
            if (confirmPressed) {
                const selected = this.tackleBoxGear.lineTypes[this.tackleBoxSelected.line];
                this.fishingLine.setLineType(selected.value, 'neon-green');
                console.log(`🧵 Line type changed to ${selected.label}`);
            }
        }
    }

    /**
     * Render tackle box UI
     */
    renderTackleBox() {
        if (!this.tackleBoxGraphics) {
            this.tackleBoxGraphics = this.add.graphics();
            this.tackleBoxGraphics.setDepth(2000);
        }

        this.tackleBoxGraphics.clear();

        // Semi-transparent overlay
        this.tackleBoxGraphics.fillStyle(0x000000, 0.9);
        this.tackleBoxGraphics.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

        // Panel
        const panelWidth = 600;
        const panelHeight = 400;
        const panelX = (GameConfig.CANVAS_WIDTH - panelWidth) / 2;
        const panelY = (GameConfig.CANVAS_HEIGHT - panelHeight) / 2;

        // Panel background
        this.tackleBoxGraphics.fillStyle(0x1a2a1a, 1.0);
        this.tackleBoxGraphics.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);

        // Panel border
        this.tackleBoxGraphics.lineStyle(3, 0x00ff00, 1.0);
        this.tackleBoxGraphics.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);

        // Title
        const titleText = this.add.text(panelX + panelWidth / 2, panelY + 25, 'TACKLE BOX', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5, 0.5);
        titleText.setDepth(2001);
        this.time.delayedCall(16, () => titleText.destroy());

        // Tab headers
        const tabs = ['LURE', 'LINE'];
        const tabWidth = 250;
        const tabY = panelY + 60;

        tabs.forEach((tab, index) => {
            const tabX = panelX + 50 + index * (tabWidth + 20);
            const isActive = index === this.tackleBoxTab;

            if (isActive) {
                this.tackleBoxGraphics.fillStyle(0x3a5a3a, 1.0);
                this.tackleBoxGraphics.fillRoundedRect(tabX, tabY, tabWidth, 40, 6);
                this.tackleBoxGraphics.lineStyle(2, 0x00ffff, 1.0);
                this.tackleBoxGraphics.strokeRoundedRect(tabX, tabY, tabWidth, 40, 6);
            }

            const tabText = this.add.text(tabX + tabWidth / 2, tabY + 20, tab, {
                fontSize: isActive ? '16px' : '14px',
                fontFamily: 'Courier New',
                color: isActive ? '#00ffff' : '#88aa88',
                fontStyle: isActive ? 'bold' : 'normal'
            });
            tabText.setOrigin(0.5, 0.5);
            tabText.setDepth(2001);
            this.time.delayedCall(16, () => tabText.destroy());
        });

        // Content area
        const contentY = panelY + 130;
        const contentX = panelX + 60;

        if (this.tackleBoxTab === 0) {
            // LURE tab
            const titleText = this.add.text(panelX + panelWidth / 2, contentY - 20, 'SELECT LURE WEIGHT', {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#cccccc'
            });
            titleText.setOrigin(0.5, 0.5);
            titleText.setDepth(2001);
            this.time.delayedCall(16, () => titleText.destroy());

            this.tackleBoxGear.lureWeights.forEach((lure, index) => {
                const itemY = contentY + index * 35;
                const isSelected = index === this.tackleBoxSelected.lure;
                const isCurrent = this.lure.weight === lure.value;

                const labelText = this.add.text(contentX, itemY, lure.label, {
                    fontSize: isSelected ? '16px' : '14px',
                    fontFamily: 'Courier New',
                    color: isSelected ? '#00ffff' : '#00ff00',
                    fontStyle: isSelected ? 'bold' : 'normal'
                });
                labelText.setDepth(2001);
                this.time.delayedCall(16, () => labelText.destroy());

                const descText = this.add.text(contentX + 150, itemY, lure.desc, {
                    fontSize: '12px',
                    fontFamily: 'Courier New',
                    color: isSelected ? '#cccccc' : '#888888'
                });
                descText.setDepth(2001);
                this.time.delayedCall(16, () => descText.destroy());

                if (isCurrent) {
                    const currentText = this.add.text(contentX + 400, itemY, '← CURRENT', {
                        fontSize: '12px',
                        fontFamily: 'Courier New',
                        color: '#ffff00'
                    });
                    currentText.setDepth(2001);
                    this.time.delayedCall(16, () => currentText.destroy());
                }
            });
        } else if (this.tackleBoxTab === 1) {
            // LINE tab
            const titleText = this.add.text(panelX + panelWidth / 2, contentY - 20, 'SELECT LINE TYPE', {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#cccccc'
            });
            titleText.setOrigin(0.5, 0.5);
            titleText.setDepth(2001);
            this.time.delayedCall(16, () => titleText.destroy());

            this.tackleBoxGear.lineTypes.forEach((line, index) => {
                const itemY = contentY + index * 35;
                const isSelected = index === this.tackleBoxSelected.line;
                const isCurrent = this.fishingLine.lineType === line.value;

                const labelText = this.add.text(contentX, itemY, line.label, {
                    fontSize: isSelected ? '16px' : '14px',
                    fontFamily: 'Courier New',
                    color: isSelected ? '#00ffff' : '#00ff00',
                    fontStyle: isSelected ? 'bold' : 'normal'
                });
                labelText.setDepth(2001);
                this.time.delayedCall(16, () => labelText.destroy());

                const descText = this.add.text(contentX + 180, itemY, line.desc, {
                    fontSize: '12px',
                    fontFamily: 'Courier New',
                    color: isSelected ? '#cccccc' : '#888888'
                });
                descText.setDepth(2001);
                this.time.delayedCall(16, () => descText.destroy());

                if (isCurrent) {
                    const currentText = this.add.text(contentX + 450, itemY, '← CURRENT', {
                        fontSize: '12px',
                        fontFamily: 'Courier New',
                        color: '#ffff00'
                    });
                    currentText.setDepth(2001);
                    this.time.delayedCall(16, () => currentText.destroy());
                }
            });
        }

        // Instructions
        const hintText = this.add.text(panelX + panelWidth / 2, panelY + panelHeight - 20, 'Arrow Keys: Navigate | X: Select | TAB/Select: Close', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#aaaaaa'
        });
        hintText.setOrigin(0.5, 0.5);
        hintText.setDepth(2001);
        this.time.delayedCall(16, () => hintText.destroy());
    }

    /**
     * Clean up scene resources
     */
    shutdown() {
        // Clean up entities
        this.fishes.forEach(fish => fish.destroy());
        this.baitfishClouds.forEach(cloud => cloud.destroy());
        this.zooplankton.forEach(zp => zp.destroy());

        // Clean up core components
        this.lure.destroy();
        this.fishingLine.destroy();
        this.sonarDisplay.destroy();

        // Clean up managers
        if (this.iceHoleManager) {
            this.iceHoleManager.destroy();
        }
        if (this.boatManager) {
            this.boatManager.destroy();
        }

        // Clean up systems
        if (this.spawningSystem) {
            this.spawningSystem.destroy();
        }
        if (this.inputSystem) {
            this.inputSystem.destroy();
        }
        if (this.collisionSystem) {
            this.collisionSystem.destroy();
        }
        if (this.debugSystem) {
            this.debugSystem.destroy();
        }
        if (this.scoreSystem) {
            this.scoreSystem.destroy();
        }
        if (this.notificationSystem) {
            this.notificationSystem.destroy();
        }

        // Clean up tackle box graphics
        if (this.tackleBoxGraphics) {
            this.tackleBoxGraphics.destroy();
            this.tackleBoxGraphics = null;
        }
    }
}

export default GameScene;
