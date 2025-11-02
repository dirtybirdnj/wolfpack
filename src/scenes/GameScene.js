import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import SonarDisplay from '../utils/SonarDisplay.js';
import Lure from '../entities/Lure.js';
import Fish from '../entities/Fish.js';
import Crayfish from '../entities/Crayfish.js';
import FishFight from '../entities/FishFight.js';
import FishingLine from '../entities/FishingLine.js';
import { FishingLineModel } from '../models/FishingLineModel.js';
import { ReelModel } from '../models/ReelModel.js';

// Import all systems
import SpawningSystem from './systems/SpawningSystem.js';
import InputSystem from './systems/InputSystem.js';
import CollisionSystem from './systems/CollisionSystem.js';
import DebugSystem from './systems/DebugSystem.js';
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
 * - NotificationSystem: In-game messages and overlays
 *
 * @module scenes/GameScene
 *
 * COMMON TASKS:
 * - Modify fish spawning → src/scenes/systems/SpawningSystem.js
 * - Change controls → src/scenes/systems/InputSystem.js
 * - Adjust debug display → src/scenes/systems/DebugSystem.js
 */
export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        // Entity arrays
        this.fishes = [];
        this.baitfishClouds = [];
        this.zooplankton = [];
        this.crayfish = [];

        // Game state
        this.fishCaught = 0;
        this.fishLost = 0;
        this.gameTime = 0;
        this.waterTemp = 40;
        this.debugMode = false;
        this.currentFight = null;
        this.controllerTestMode = false;
        this.controllerTestUI = null;

        // Hookset window state
        this.hooksetWindow = {
            active: false,
            fish: null,
            startTime: 0,
            duration: 45, // frames (~750ms at 60fps) to perform hookset
            hasHookset: false
        };

        // Jig detection state (for pike summoning)
        this.jigDetection = {
            lastStickY: 0,
            jigCount: 0,
            lastJigTime: 0,
            jigTimeout: 2000, // Reset jig count if 2 seconds pass between jigs
            needsReset: false, // Track if we need to reset to neutral position
            threshold: 0.5 // Stick movement threshold
        };

        // Game mode specific
        this.gameMode = null; // 'arcade' or 'unlimited'
        this.timeRemaining = 0;
        this.caughtFishData = [];

        // Systems (initialized in create())
        this.spawningSystem = null;
        this.inputSystem = null;
        this.collisionSystem = null;
        this.debugSystem = null;
        this.notificationSystem = null;

        // Tackle box state
        this.tackleBoxOpen = false;
        this.tackleBoxTab = 0; // 0=lure, 1=line, 2=reel
        this.tackleBoxSelected = { lure: 0, line: 0, reel: 0, lineTest: 1 }; // Default to 10 lb test (index 1)
        this.lineTabFocus = 0; // 0=line type section, 1=line test section
        this.switchingToPauseMenu = false; // Flag to keep game paused when switching menus
        this.catchPopupActive = false; // Flag to block input when catch popup is displayed
        this.tackleBoxButtonStates = {
            select: false,
            circle: false,
            start: false,
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
            ],
            lineTestStrengths: [
                { label: '4 lb', value: 4, desc: 'Ultralight - panfish, perch' },
                { label: '6 lb', value: 6, desc: 'Light - small fish' },
                { label: '8 lb', value: 8, desc: 'Light-medium - versatile' },
                { label: '10 lb', value: 10, desc: 'Medium - general purpose' },
                { label: '15 lb', value: 15, desc: 'Medium-heavy - lake trout' },
                { label: '20 lb', value: 20, desc: 'Heavy - big fish' },
                { label: '30 lb', value: 30, desc: 'Extra heavy - trophy fish' }
            ],
            reelTypes: [
                { label: 'Baitcaster', value: 'baitcaster', desc: 'High performance, backlash risk' },
                { label: 'Spincaster', value: 'spincaster', desc: 'Beginner-friendly, forgiving' }
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

            // Initialize timer based on game mode
            if (this.gameMode === GameConfig.GAME_MODE_ARCADE) {
                this.timeRemaining = GameConfig.ARCADE_TIME_LIMIT;
                this.gameTime = 0;
            } else {
                this.timeRemaining = 0;
                this.gameTime = 0;
            }

            // Hide unnecessary UI panels
            this.hideUnusedPanels();

            // Set up the sonar display
            this.sonarDisplay = new SonarDisplay(this);

            // Create the player's lure - start at surface (0 feet)
            // Use actual game width (not hardcoded CANVAS_WIDTH) to center on any screen size
            const actualGameWidth = this.scale.width || GameConfig.CANVAS_WIDTH;
            this.lure = new Lure(this, actualGameWidth / 2, 0);

            // Apply lure weight from tackle box selection
            const lureWeight = this.registry.get('lureWeight');
            if (lureWeight !== undefined) {
                this.lure.weight = lureWeight;
                console.log(`🎣 Lure weight set to ${lureWeight}oz`);
            }

            // Create fishing line
            this.fishingLine = new FishingLine(this);

            // Initialize fishing line model
            this.fishingLineModel = new FishingLineModel();

            // Initialize reel model
            this.reelModel = new ReelModel();

            // Apply reel type from tackle box selection
            const reelType = this.registry.get('reelType');
            if (reelType !== undefined) {
                this.reelModel.setReelType(reelType);
                console.log(`🎣 Reel type set to ${this.reelModel.getDisplayName()}`);
            }

            // Apply line test strength from tackle box selection
            const lineTestStrength = this.registry.get('lineTestStrength');
            if (lineTestStrength !== undefined) {
                this.reelModel.setLineTestStrength(lineTestStrength);
                console.log(`🧵 Line test strength set to ${lineTestStrength} lb`);
            }

            // Apply line type from tackle box selection
            const lineType = this.registry.get('lineType');
            const braidColor = this.registry.get('braidColor');
            if (lineType !== undefined) {
                this.fishingLine.setLineType(lineType, braidColor);
                this.fishingLineModel.setLineType(lineType);
                if (lineType === 'braid' && braidColor) {
                    this.fishingLineModel.setBraidColor(braidColor);
                }
                console.log(`🧵 Line type set to ${lineType}${lineType === 'braid' ? ' (' + braidColor + ')' : ''}`);
            }

            // Set water temperature
            this.initializeWaterTemp();

            // Initialize creature groups (Phaser Groups for all life forms)
            this.initializeCreatureGroups();

            // Initialize all game systems
            this.initializeSystems();

            // Event listeners
            this.events.on('fishStrike', this.handleFishStrike, this);
            this.events.on('fishCaught', this.handleFishCaught, this);
            this.events.on('fishBump', this.handleFishBump, this);

            // Gamepad disconnect listener - show warning when controller dies
            // Store references for cleanup
            if (window.gamepadManager) {
                this.gamepadDisconnectedHandler = (gamepad) => {
                    console.log('🎮 Controller disconnected during gameplay');
                    this.notificationSystem.showGamepadDisconnected();
                };

                this.gamepadConnectedHandler = (gamepad) => {
                    console.log('🎮 Controller reconnected');
                    // Auto-dismiss warning if it's showing
                    if (this.notificationSystem.hasDisconnectWarning()) {
                        this.notificationSystem.dismissDisconnectWarning();
                    }
                };

                window.gamepadManager.on('disconnected', this.gamepadDisconnectedHandler);
                window.gamepadManager.on('connected', this.gamepadConnectedHandler);
            }

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
     * Hide unused UI panels
     */
    hideUnusedPanels() {
        // Hide all movement-related UI panels
        const iceDrillPanel = document.getElementById('ice-drill-panel');
        const kayakPanel = document.getElementById('kayak-tiredness-panel');
        const boatPanel = document.getElementById('motorboat-gas-panel');

        if (iceDrillPanel) {iceDrillPanel.style.display = 'none';}
        if (kayakPanel) {kayakPanel.style.display = 'none';}
        if (boatPanel) {boatPanel.style.display = 'none';}
    }

    /**
     * Set water temperature (ice fishing only)
     */
    initializeWaterTemp() {
        // Always use winter/ice fishing water temp
        this.waterTemp = Utils.randomBetween(GameConfig.WATER_TEMP_MIN, GameConfig.WATER_TEMP_MAX);
    }

    /**
     * Initialize creature arrays (ecological organization)
     * Note: Using arrays instead of Phaser Groups because Fish entities aren't GameObjects
     * Future: Refactor Fish to extend Phaser.GameObjects.Container to use Groups
     */
    initializeCreatureGroups() {
        console.log('🌊 Initializing creature arrays...');

        // Array for schooling baitfish (using new unified Fish class with Boids)
        this.baitfishSchools = [];

        // Array of school metadata (tracks center position and velocity for each school)
        this.schools = [];

        console.log('✅ Creature arrays initialized');
    }

    /**
     * Initialize all game systems
     */
    initializeSystems() {
        this.spawningSystem = new SpawningSystem(this);
        this.inputSystem = new InputSystem(this);
        this.collisionSystem = new CollisionSystem(this);
        this.debugSystem = new DebugSystem(this);
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

        // Check for pause input (but not when tackle box is open or catch popup is active)
        if (!this.tackleBoxOpen && !this.catchPopupActive && this.inputSystem.checkPauseInput()) {
            this.notificationSystem.togglePause();
        }

        // Update notification system (but skip pause menu input if catch popup is active)
        if (!this.catchPopupActive) {
            this.notificationSystem.update(time, delta);
        }

        // Check if pause menu requested switch to tackle box
        if (this.notificationSystem.switchToTackleBox) {
            this.notificationSystem.switchToTackleBox = false;
            this.toggleTackleBox(); // Open tackle box (will stay paused)
        }

        // If paused but tackle box is closed, skip all game updates
        if (this.notificationSystem.isPausedState() && !this.tackleBoxOpen) {
            return;
        }

        // Check for tackle box toggle (TAB key or Select button)
        // Block tackle box when catch popup is active
        if (!this.tackleBoxOpen && !this.notificationSystem.isPausedState() && !this.catchPopupActive) {
            const tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
            if (Phaser.Input.Keyboard.JustDown(tabKey)) {
                this.toggleTackleBox();
            }

            if (window.gamepadManager && window.gamepadManager.isConnected()) {
                const selectButton = window.gamepadManager.getButton('Select');
                if (selectButton && selectButton.pressed && !this.tackleBoxButtonStates.select) {
                    this.toggleTackleBox();
                    this.tackleBoxButtonStates.select = true;
                    // Don't update button state again until released to prevent double-toggle
                    return;
                }
                this.tackleBoxButtonStates.select = selectButton ? selectButton.pressed : false;
            }
        }

        // If tackle box is open, handle its input and render it
        if (this.tackleBoxOpen) {
            this.handleTackleBoxInput();

            // Only render if still open (might have been closed by input handler)
            if (this.tackleBoxOpen) {
                this.renderTackleBox();
            }
            return; // Skip normal game updates while tackle box is open
        }

        // Handle hookset window
        if (this.hooksetWindow.active) {
            const elapsed = time - this.hooksetWindow.startTime;

            // Check if window expired
            if (elapsed > this.hooksetWindow.duration * (1000 / 60)) {
                console.log('Hookset window expired - fish got away!');
                this.hooksetWindow.active = false;
                this.hooksetWindow.fish = null;
                // Fish escapes (already fleeing from FishAI)
            } else if (!this.hooksetWindow.hasHookset) {
                // Check for hookset input (right stick up OR R trigger full press)
                if (window.gamepadManager && window.gamepadManager.isConnected()) {
                    const rightStickY = window.gamepadManager.getAxis(3); // Right stick Y axis
                    const r2Trigger = window.gamepadManager.getButton('R2');

                    // Detect upward motion on right stick (negative Y is up) OR full R trigger press
                    const stickHookset = rightStickY < -0.5;
                    const triggerHookset = r2Trigger && r2Trigger.value >= 0.95; // 95%+ trigger press

                    if (stickHookset || triggerHookset) {
                        // Successful hookset!
                        const method = stickHookset ? 'stick up' : 'full reel';
                        console.log(`HOOKSET! (${method}) Fish is hooked!`);
                        this.hooksetWindow.hasHookset = true;

                        // Mark fish as caught and trigger catch event
                        const fish = this.hooksetWindow.fish;
                        fish.caught = true;
                        this.events.emit('fishCaught', fish);
                    }
                }
            }
        }

        // Jig detection for pike summoning (only when not fighting)
        if ((!this.currentFight || !this.currentFight.active) && window.gamepadManager && window.gamepadManager.isConnected()) {
            const rightStickY = window.gamepadManager.getAxis(3);
            const currentTime = time;

            // Check if too much time has passed - reset jig count
            if (currentTime - this.jigDetection.lastJigTime > this.jigDetection.jigTimeout) {
                this.jigDetection.jigCount = 0;
                this.jigDetection.needsReset = false;
            }

            // Detect stick movement
            if (this.jigDetection.needsReset) {
                // Waiting for stick to return to neutral
                if (Math.abs(rightStickY) < 0.2) {
                    this.jigDetection.needsReset = false;
                }
            } else {
                // Check for up movement (negative Y is up)
                if (rightStickY < -this.jigDetection.threshold && this.jigDetection.lastStickY > -this.jigDetection.threshold) {
                    // Upward jig detected!
                    this.jigDetection.jigCount++;
                    this.jigDetection.lastJigTime = currentTime;
                    this.jigDetection.needsReset = true;
                    console.log(`Jig ${this.jigDetection.jigCount}/5`);

                    // Check if we've reached 5 jigs
                    if (this.jigDetection.jigCount >= 5) {
                        this.summonPikeAttack();
                        this.jigDetection.jigCount = 0;
                        this.jigDetection.needsReset = false;
                    }
                }
            }

            this.jigDetection.lastStickY = rightStickY;
        }

        // Handle fish fight if active
        if (this.currentFight && this.currentFight.active) {
            this.updateFishFight(time);
            // Don't return - let entities continue to update during fight
        }

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
        } else {
            // During fight, still need to render the lure (position is updated by FishFight)
            this.lure.render();
        }

        // Update fishing line
        const hookedFish = this.currentFight && this.currentFight.active ? this.currentFight.fish : null;
        this.fishingLine.update(this.lure, hookedFish);

        // Continuously update lure info in UI
        this.updateSpeedDisplay();

        // Update all entities
        this.updateEntities();

        // Update all systems
        this.spawningSystem.update(time, delta);
        this.collisionSystem.update(time, delta);
        this.debugSystem.update(time, delta);

        // Check for emergency fish spawn (arcade mode)
        this.spawningSystem.checkEmergencySpawn();
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
     * Spawn a baitfish school using unified Fish class with Boids algorithm
     * @param {number} worldX - World X position
     * @param {number} y - Screen Y position
     * @param {number} count - Number of fish in school
     * @param {string} species - Species name (rainbow_smelt, alewife, sculpin)
     */
    spawnBaitfishSchool(worldX, y, count, species = 'rainbow_smelt') {
        console.log(`🐟 Spawning ${count} ${species} at (${worldX}, ${y})`);

        // Create school metadata (like BaitfishCloud, tracks center and velocity)
        const schoolId = `school_${Date.now()}_${Math.random()}`;
        const school = {
            id: schoolId,
            species,
            centerWorldX: worldX,
            centerY: y,
            velocity: {
                x: Utils.randomBetween(-0.3, 0.3),
                y: Utils.randomBetween(-0.1, 0.1)
            },
            members: [],
            age: 0
        };

        for (let i = 0; i < count; i++) {
            // Spread fish in a cluster
            const offsetX = Phaser.Math.Between(-40, 40);
            const offsetY = Phaser.Math.Between(-25, 25);

            // Create baitfish using unified Fish class (will detect species and enable schooling)
            const fish = new Fish(
                this,
                worldX + offsetX,
                y + offsetY,
                'TINY',
                species
            );

            // Associate fish with school
            fish.schoolId = schoolId;
            fish.schoolingOffset = {
                x: offsetX,
                y: offsetY
            };

            // Add to arrays
            school.members.push(fish);
            this.baitfishSchools.push(fish);
        }

        this.schools.push(school);
        console.log(`✅ School spawned: ${this.baitfishSchools.length} total baitfish in ${this.schools.length} schools`);
    }

    /**
     * Get the player's center position (always at center of actual canvas width)
     * This adapts to any screen size/resolution
     */
    getPlayerCenterX() {
        return (this.scale.width || GameConfig.CANVAS_WIDTH) / 2;
    }

    /**
     * Render fog effects and fish counts behind baitfish schools
     * NOTE: This is a perfect test case for future shader implementation!
     * For now using simple graphics, but shaders could make this look amazing.
     */
    renderSchoolEffects() {
        if (!this.schoolEffectsGraphics) {
            this.schoolEffectsGraphics = this.add.graphics();
            this.schoolEffectsGraphics.setDepth(3); // Behind fish (depth 5) but above background
        }

        if (!this.schoolCountTexts) {
            this.schoolCountTexts = [];
        }

        this.schoolEffectsGraphics.clear();

        // Hide all text objects first (we'll show only the ones we need)
        this.schoolCountTexts.forEach(text => text.setVisible(false));

        // Draw fog and count for each school
        this.schools.forEach(school => {
            if (school.members.length === 0) return;

            // Filter to only visible, non-consumed fish
            const visibleFish = school.members.filter(f => !f.model.consumed && f.model.visible);
            if (visibleFish.length === 0) return; // Skip if no visible fish

            // Calculate school bounds (find extents of all visible fish)
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;

            visibleFish.forEach(fish => {
                minX = Math.min(minX, fish.model.x);
                maxX = Math.max(maxX, fish.model.x);
                minY = Math.min(minY, fish.model.y);
                maxY = Math.max(maxY, fish.model.y);
            });

            // Skip if no valid fish (shouldn't happen but safety check)
            if (!isFinite(minX)) return;

            // Calculate school center and size
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const width = (maxX - minX) + 40; // Add padding
            const height = (maxY - minY) + 30; // Add padding

            // Draw subtle fog (elliptical glow)
            // TODO: Replace with shader for smoother gradient and better performance
            const fogColor = school.species === 'alewife' ? 0x88ccff :
                           school.species === 'rainbow_smelt' ? 0x88ffcc :
                           school.species === 'yellow_perch' ? 0xffdd88 :
                           school.species === 'cisco' ? 0xccccff :
                           0x88cccc; // sculpin or default

            // Draw multiple layers for smooth gradient effect
            for (let i = 3; i > 0; i--) {
                const radius = (width / 2) * (i / 3);
                const radiusY = (height / 2) * (i / 3);
                const alpha = 0.06 / i; // Subtle, fading outward

                this.schoolEffectsGraphics.fillStyle(fogColor, alpha);
                this.schoolEffectsGraphics.fillEllipse(centerX, centerY, radius * 2, radiusY * 2);
            }

            // Draw fish count below school
            const visibleCount = visibleFish.length; // Already filtered above
            const textY = maxY + 15; // Below the school

            // Draw count with background
            const textWidth = visibleCount >= 100 ? 30 : visibleCount >= 10 ? 24 : 18;
            this.schoolEffectsGraphics.fillStyle(0x000000, 0.5);
            this.schoolEffectsGraphics.fillRoundedRect(centerX - textWidth/2, textY - 8, textWidth, 14, 3);
        });

        // Draw count numbers using text objects (reuse from pool)
        let textIndex = 0;
        this.schools.forEach((school, index) => {
            if (school.members.length === 0) return;

            // Filter to only visible, non-consumed fish
            const visibleFish = school.members.filter(f => !f.model.consumed && f.model.visible);
            if (visibleFish.length === 0) return; // Skip if no visible fish

            // Find school bounds for text positioning
            const fishX = visibleFish.map(f => f.model.x);
            const fishY = visibleFish.map(f => f.model.y);
            const minX = Math.min(...fishX);
            const maxX = Math.max(...fishX);
            const maxY = Math.max(...fishY);

            const centerX = (minX + maxX) / 2;
            const visibleCount = visibleFish.length;
            const textY = maxY + 15;

            // Get or create text object
            if (textIndex >= this.schoolCountTexts.length) {
                const text = this.add.text(0, 0, '', {
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2
                });
                text.setOrigin(0.5, 0.5);
                text.setDepth(4); // Above fog, below fish
                this.schoolCountTexts.push(text);
            }

            const text = this.schoolCountTexts[textIndex];
            text.setText(visibleCount.toString());
            text.setPosition(centerX, textY);
            text.setVisible(true);
            textIndex++;
        });
    }

    /**
     * Fish whistle - spawn trophy fish of each species + large bait clouds
     */
    spawnFishWhistleFish() {
        console.log('🎵 Fish whistle: Spawning trophy fish and large bait clouds...');

        // Use center of screen as player position
        const playerWorldX = this.getPlayerCenterX();

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
            const fish = new Fish(this, worldX, y, 'TROPHY', speciesName);

            // Set movement direction
            fish.ai.idleDirection = Math.random() < 0.5 ? -1 : 1;

            this.fishes.push(fish);
            console.log(`  Spawned trophy ${speciesName} at ${depth}ft`);
        });

        // Spawn 2 extra large bait schools (using new school system)
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 200;
            const worldX = playerWorldX + Math.cos(angle) * distance;

            // Random depth between 20-70 feet
            const depth = Utils.randomBetween(20, 70);
            const y = depth * GameConfig.DEPTH_SCALE;

            // Large school size (80-120 fish)
            const schoolSize = Math.floor(Utils.randomBetween(80, 120));

            // Random baitfish species
            const baitSpecies = ['alewife', 'rainbow_smelt', 'yellow_perch'][Math.floor(Math.random() * 3)];

            // Use new school spawning system
            this.spawnBaitfishSchool(worldX, y, schoolSize, baitSpecies);
            console.log(`  Spawned large ${baitSpecies} school (${schoolSize} fish) at ${depth}ft`);
        }

        // Show notification
        this.notificationSystem.showMessage('Fish Whistle!', 'Trophy fish attracted to the area!');
    }

    /**
     * Update all entities (fish, baitfish, zooplankton, crayfish)
     */

    /**
     * Adapt new schools to look like old BaitfishClouds for FishAI compatibility
     * This creates a bridge layer so predators can hunt the new baitfish schools
     * @returns {Array} Array of cloud-like objects that FishAI can understand
     */
    getAdaptedSchoolsForAI() {
        return this.schools.map(school => {
            // Convert school center worldX to screen X
            const playerWorldX = this.getPlayerCenterX();
            const offsetFromPlayer = school.centerWorldX - playerWorldX;
            const centerX = this.getPlayerCenterX() + offsetFromPlayer;

            return {
                // Cloud properties expected by FishAI
                visible: school.members.length > 0,
                baitfish: school.members,      // Array of Fish objects
                centerX: centerX,              // Screen X position
                centerY: school.centerY,       // Screen Y position
                worldX: school.centerWorldX,   // World X position
                speciesType: school.species,   // Species name (for diet preference)
                lakersChasing: [],             // Predators currently chasing this school

                // Method: Check if lure is in cloud
                isPlayerLureInCloud(lure) {
                    const distance = Math.sqrt(
                        Math.pow(lure.x - centerX, 2) +
                        Math.pow(lure.y - school.centerY, 2)
                    );
                    return distance < GameConfig.BAITFISH_CLOUD_RADIUS;
                },

                // Track the last closest baitfish found (so we consume the RIGHT one)
                _lastClosestBaitfish: null,

                // Method: Find closest baitfish to predator
                getClosestBaitfish(x, y) {
                    let closest = null;
                    let minDistance = Infinity;

                    for (const fish of school.members) {
                        if (fish.model.consumed) continue;

                        const distance = Math.sqrt(
                            Math.pow(x - fish.model.x, 2) +
                            Math.pow(y - fish.model.y, 2)
                        );

                        if (distance < minDistance) {
                            minDistance = distance;
                            closest = fish;
                        }
                    }

                    // Store the closest fish so consumeBaitfish() eats the RIGHT one
                    this._lastClosestBaitfish = closest;

                    return { baitfish: closest, distance: minDistance };
                },

                // Method: Consume the SPECIFIC baitfish that was targeted (not random!)
                consumeBaitfish() {
                    // Consume the specific fish that was found by getClosestBaitfish()
                    if (this._lastClosestBaitfish && !this._lastClosestBaitfish.model.consumed) {
                        const target = this._lastClosestBaitfish;
                        target.model.consumed = true;
                        target.model.visible = false; // Hide immediately
                        this._lastClosestBaitfish = null; // Clear reference
                        return target;
                    }

                    // Fallback: consume random available fish (shouldn't happen now)
                    const available = school.members.filter(f => !f.model.consumed);
                    if (available.length > 0) {
                        const target = available[Math.floor(Math.random() * available.length)];
                        target.model.consumed = true;
                        target.model.visible = false;
                        return target;
                    }
                    return null;
                }
            };
        });
    }

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

        // Update crayfish
        this.crayfish = this.crayfish.filter(cf => {
            if (cf.visible && !cf.consumed) {
                // Find nearby zooplankton for hunting
                const nearbyZooplankton = this.zooplankton.filter(zp => {
                    const dx = cf.x - zp.x;
                    const dy = cf.y - zp.y;
                    return Math.sqrt(dx * dx + dy * dy) < 150;
                });

                // Check if smallmouth bass nearby (predators)
                const predatorsNearby = this.fishes.some(f => {
                    if (f.species !== 'smallmouth_bass') {return false;}
                    const dx = cf.x - f.x;
                    const dy = cf.y - f.y;
                    return Math.sqrt(dx * dx + dy * dy) < 200;
                });

                cf.update(nearbyZooplankton, predatorsNearby);
                return true;
            } else {
                cf.destroy();
                return false;
            }
        });

        // Update baitfish clouds (old system)
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

        // Update school centers first (they drift/wander like BaitfishCloud)
        this.schools.forEach(school => {
            school.age++;

            // More active wandering - increased frequency and magnitude
            if (Math.random() < 0.08) { // 8% chance per frame (more frequent)
                school.velocity.x += Utils.randomBetween(-0.6, 0.6); // Larger changes
                school.velocity.y += Utils.randomBetween(-0.3, 0.3);
            }

            // Add constant gentle drift to prevent stagnation
            school.velocity.x += Utils.randomBetween(-0.05, 0.05);
            school.velocity.y += Utils.randomBetween(-0.02, 0.02);

            // Reduced velocity decay (keeps momentum longer)
            school.velocity.x *= 0.99; // Was 0.98
            school.velocity.y *= 0.99;

            // Clamp velocity (allow faster horizontal movement)
            school.velocity.x = Math.max(-2.0, Math.min(2.0, school.velocity.x)); // Was -1.5 to 1.5
            school.velocity.y = Math.max(-1.0, Math.min(1.0, school.velocity.y)); // Was -0.8 to 0.8

            // Update center position
            school.centerWorldX += school.velocity.x;
            school.centerY += school.velocity.y;

            // Keep school center in bounds
            const depthScale = this.sonarDisplay ? this.sonarDisplay.getDepthScale() : GameConfig.DEPTH_SCALE;
            const bottomDepth = this.maxDepth || GameConfig.MAX_DEPTH;
            const minY = 20; // Min 20px from surface for school center
            const maxY = (bottomDepth - 5) * depthScale;
            school.centerY = Math.max(minY, Math.min(maxY, school.centerY));
        });

        // Render school fog and count labels BEFORE individual fish
        this.renderSchoolEffects();

        // Update baitfish schools (new unified Fish with Boids schooling)
        this.baitfishSchools = this.baitfishSchools.filter(fish => {
            if (fish.model.visible && !fish.model.consumed) {
                // Find this fish's school center
                const school = this.schools.find(s => s.id === fish.schoolId);
                fish.schoolCenter = school ? {
                    worldX: school.centerWorldX,
                    y: school.centerY
                } : null;

                // Pass all baitfish schools so each fish can find neighbors for Boids
                fish.update(this.lure, this.baitfishSchools, []);
                return true;
            } else {
                fish.destroy();
                return false;
            }
        });

        // Clean up consumed fish from school.members arrays
        this.schools.forEach(school => {
            school.members = school.members.filter(fish => fish.model.visible && !fish.model.consumed);
        });

        // Update fish (predators)
        // Create adapted schools that look like clouds to FishAI
        const adaptedSchools = this.getAdaptedSchoolsForAI();
        // Combine old clouds (if any remain) with new adapted schools
        const allBaitfishTargets = [...this.baitfishClouds, ...adaptedSchools];

        this.fishes.forEach((fish, index) => {
            fish.update(this.lure, this.fishes, allBaitfishTargets);

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
     * Handle fish strike event - opens hookset window
     * @param {Fish} fish - The fish that struck at the lure
     */
    handleFishStrike(fish) {
        console.log(`Fish ${fish.name} strikes! Hookset window opening...`);

        // Open hookset window
        this.hooksetWindow.active = true;
        this.hooksetWindow.fish = fish;
        this.hooksetWindow.startTime = this.time.now;
        this.hooksetWindow.hasHookset = false;

        // Always show visual feedback - stronger shake for strike
        this.lure.vibrate(5, 30); // Stronger vibration for strike (5px, 30 frames = ~500ms)

        // Get line type's haptic sensitivity
        const hapticSensitivity = this.fishingLineModel.getHapticSensitivity();

        // Roll for whether player feels the strike (based on line sensitivity)
        if (Math.random() <= hapticSensitivity) {
            // Player feels the strike! Scale haptic intensity by line sensitivity
            // Base haptic for strike: 200ms duration, 0.5/0.25 magnitude (stronger than bump)
            // Scale by sensitivity: Braid (100%) = full strength, Mono (40%) = 40% strength
            const strongMagnitude = 0.5 * hapticSensitivity;
            const weakMagnitude = 0.25 * hapticSensitivity;

            this.rumbleGamepad(200, strongMagnitude, weakMagnitude);
            console.log(`Strike felt! (${(hapticSensitivity * 100).toFixed(0)}% sensitivity - ${this.fishingLineModel.getDisplayName()}) - Haptic: ${strongMagnitude.toFixed(2)}/${weakMagnitude.toFixed(2)}`);
        } else {
            console.log(`Strike occurred but not felt! (${(hapticSensitivity * 100).toFixed(0)}% sensitivity) - Better watch the lure!`);
        }
    }

    /**
     * Handle fish caught event (start fish fight)
     * @param {Fish} fish - The fish that was caught
     */
    handleFishCaught(fish) {
        console.log('Fish hooked! Starting fight...');

        // Close hookset window
        this.hooksetWindow.active = false;
        this.hooksetWindow.fish = null;

        // Rumble on successful hookset
        this.rumbleGamepad(300, 0.6, 0.3);

        // Show hook notification
        this.notificationSystem.showFishHookedNotification();

        // Start the fight with reel and line models
        this.currentFight = new FishFight(this, fish, this.lure, this.fishingLineModel, this.reelModel);
    }

    /**
     * Handle fish bump event - haptic feedback based on line sensitivity
     * @param {Fish} fish - The fish that bumped the lure
     */
    handleFishBump(fish) {
        // Always show visual feedback - lure vibrates regardless of whether player feels it
        this.lure.vibrate(3, 20); // 3px intensity, 20 frames (~333ms)

        // Get line type's haptic sensitivity
        const hapticSensitivity = this.fishingLineModel.getHapticSensitivity();

        // Roll for whether player feels the bump (based on line sensitivity)
        if (Math.random() <= hapticSensitivity) {
            // Player feels the bump! Scale haptic intensity by line sensitivity
            // Base haptic for bump: 150ms duration, 0.3/0.15 magnitude
            // Scale by sensitivity: Braid (100%) = full strength, Mono (40%) = 40% strength
            const strongMagnitude = 0.3 * hapticSensitivity;
            const weakMagnitude = 0.15 * hapticSensitivity;

            this.rumbleGamepad(150, strongMagnitude, weakMagnitude);
            console.log(`Fish bump detected! (${(hapticSensitivity * 100).toFixed(0)}% sensitivity - ${this.fishingLineModel.getDisplayName()}) - Haptic: ${strongMagnitude.toFixed(2)}/${weakMagnitude.toFixed(2)}`);
        } else {
            console.log(`Fish bump occurred but not felt (${(hapticSensitivity * 100).toFixed(0)}% sensitivity)`);
        }
    }

    /**
     * Summon all pike on screen to attack the lure once
     */
    summonPikeAttack() {
        console.log('🎣 PIKE SUMMONED! All northern pike are attacking!');

        // Find all northern pike fish
        const pike = this.fishes.filter(fish => fish.species === 'northern_pike' && fish.visible);

        if (pike.length === 0) {
            console.log('No pike on screen to summon');
            return;
        }

        console.log(`Summoning ${pike.length} pike to attack`);

        // SCARE OTHER PREDATORS - Pike rushing scares other species
        let scaredCount = 0;
        this.fishes.forEach(otherFish => {
            // Skip pike themselves
            if (otherFish.species === 'northern_pike' || !otherFish.visible) {return;}

            // Check if this fish can see any of the rushing pike
            for (const rushingPike of pike) {
                const dx = Math.abs(otherFish.x - rushingPike.x);
                const dy = Math.abs(otherFish.y - rushingPike.y);

                // Within horizontal and vertical detection range?
                if (dx < GameConfig.DETECTION_RANGE && dy < GameConfig.VERTICAL_DETECTION_RANGE) {
                    // Fish sees the pike rush! Make it flee
                    otherFish.ai.state = Constants.FISH_STATE.FLEEING;
                    otherFish.ai.decisionCooldown = 3000; // Flee for 3 seconds
                    scaredCount++;
                    break; // One pike is enough to scare this fish
                }
            }
        });

        if (scaredCount > 0) {
            console.log(`Pike rush scared ${scaredCount} other fish away!`);
        }

        // PUSH BAITFISH CLOUDS AWAY - Apply repulsion force
        this.baitfishClouds.forEach(cloud => {
            if (!cloud.visible) {return;}

            // Find closest pike to this cloud
            let closestPike = null;
            let minDistance = Infinity;

            pike.forEach(rushingPike => {
                const dx = cloud.centerX - rushingPike.x;
                const dy = cloud.centerY - rushingPike.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < minDistance) {
                    minDistance = dist;
                    closestPike = rushingPike;
                }
            });

            // Apply repulsion if pike is close enough (within 200 pixels)
            if (closestPike && minDistance < 200) {
                const dx = cloud.centerX - closestPike.x;
                const dy = cloud.centerY - closestPike.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    // Push away from pike - stronger when closer
                    const repulsionStrength = 1.5 * (1 - minDistance / 200);
                    cloud.velocity.x += (dx / dist) * repulsionStrength;
                    cloud.velocity.y += (dy / dist) * repulsionStrength;

                    // Cap velocity to prevent fleeing off screen
                    const maxVelocity = 2.0;
                    const currentSpeed = Math.sqrt(cloud.velocity.x ** 2 + cloud.velocity.y ** 2);
                    if (currentSpeed > maxVelocity) {
                        cloud.velocity.x = (cloud.velocity.x / currentSpeed) * maxVelocity;
                        cloud.velocity.y = (cloud.velocity.y / currentSpeed) * maxVelocity;
                    }
                }
            }
        });

        // Make each pike attack once
        pike.forEach(fish => {
            // Force pike into striking behavior
            fish.ai.state = Constants.FISH_STATE.STRIKING;
            fish.ai.targetX = this.lure.x;
            fish.ai.targetY = this.lure.y;
            fish.ai.decisionCooldown = 50;

            // After strike, force them to flee and return to ambush
            setTimeout(() => {
                if (fish.ai.state === Constants.FISH_STATE.STRIKING || fish.ai.state === Constants.FISH_STATE.CHASING) {
                    fish.ai.state = Constants.FISH_STATE.FLEEING;
                    fish.ai.decisionCooldown = 2000;
                    console.log(`Pike ${fish.name} retreating to ambush position`);
                }
            }, 1000); // Give them 1 second to strike
        });

        // Visual/audio feedback
        this.rumbleGamepad(400, 0.8, 0.4); // Strong rumble
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
        if (!window.gamepadManager || !window.gamepadManager.isConnected() || this.controllerTestMode) {return;}

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
            if (!this.controllerTestMode || !window.gamepadManager || !window.gamepadManager.isConnected()) {return;}

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
        if (!this.controllerTestUI) {return;}

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

        // Pause/unpause game when tackle box opens/closes
        if (this.tackleBoxOpen) {
            // Opening tackle box - pause the game
            this.notificationSystem.isPaused = true;
        } else {
            // Closing tackle box - unpause only if not switching to pause menu
            if (!this.switchingToPauseMenu) {
                this.notificationSystem.isPaused = false;
            }
            // Clear graphics when closing
            if (this.tackleBoxGraphics) {
                this.tackleBoxGraphics.clear();
            }
        }

        console.log(`Tackle box ${this.tackleBoxOpen ? 'opened' : 'closed'}`);
    }

    /**
     * Handle tackle box input
     */
    handleTackleBoxInput() {
        // TAB/Select to close and return to gameplay
        const tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        if (Phaser.Input.Keyboard.JustDown(tabKey)) {
            this.toggleTackleBox();
            return;
        }

        // Gamepad buttons
        if (window.gamepadManager && window.gamepadManager.isConnected()) {
            const selectButton = window.gamepadManager.getButton('Select');
            const circleButton = window.gamepadManager.getButton('Circle'); // B on Xbox, A on 8bitdo
            const startButton = window.gamepadManager.getButton('Start');

            // Select or Circle button - close tackle box and return to gameplay
            if (selectButton && selectButton.pressed && !this.tackleBoxButtonStates.select) {
                this.toggleTackleBox();
                this.tackleBoxButtonStates.select = true;
                return;
            }

            if (circleButton && circleButton.pressed && !this.tackleBoxButtonStates.circle) {
                this.toggleTackleBox();
                this.tackleBoxButtonStates.circle = true;
                return;
            }

            // Start button - close tackle box AND open pause menu (stay paused)
            if (startButton && startButton.pressed && !this.tackleBoxButtonStates.start) {
                this.switchingToPauseMenu = true;
                this.toggleTackleBox(); // Close tackle box (stays paused due to flag)
                this.tackleBoxButtonStates.start = true;
                // Open pause menu
                this.notificationSystem.togglePause();
                this.switchingToPauseMenu = false;
                return;
            }

            this.tackleBoxButtonStates.select = selectButton ? selectButton.pressed : false;
            this.tackleBoxButtonStates.circle = circleButton ? circleButton.pressed : false;
            this.tackleBoxButtonStates.start = startButton ? startButton.pressed : false;
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

            if (dpadLeft.pressed && !this.tackleBoxButtonStates.left) {leftPressed = true;}
            if (dpadRight.pressed && !this.tackleBoxButtonStates.right) {rightPressed = true;}
            if (dpadUp.pressed && !this.tackleBoxButtonStates.up) {upPressed = true;}
            if (dpadDown.pressed && !this.tackleBoxButtonStates.down) {downPressed = true;}
            if (xButton.pressed && !this.tackleBoxButtonStates.x) {confirmPressed = true;}

            this.tackleBoxButtonStates.left = dpadLeft.pressed;
            this.tackleBoxButtonStates.right = dpadRight.pressed;
            this.tackleBoxButtonStates.up = dpadUp.pressed;
            this.tackleBoxButtonStates.down = dpadDown.pressed;
            this.tackleBoxButtonStates.x = xButton.pressed;
        }

        // Tab switching (except in reel tab where L/R switches sections)
        if (this.tackleBoxTab !== 2) {
            if (leftPressed) {
                this.tackleBoxTab--;
                if (this.tackleBoxTab < 0) {this.tackleBoxTab = 2;}
            }
            if (rightPressed) {
                this.tackleBoxTab++;
                if (this.tackleBoxTab > 2) {this.tackleBoxTab = 0;}
            }
        }

        // Navigate within tab
        if (this.tackleBoxTab === 0) {
            // LURE tab
            const maxIndex = this.tackleBoxGear.lureWeights.length - 1;
            if (upPressed) {
                this.tackleBoxSelected.lure--;
                if (this.tackleBoxSelected.lure < 0) {this.tackleBoxSelected.lure = maxIndex;}
            }
            if (downPressed) {
                this.tackleBoxSelected.lure++;
                if (this.tackleBoxSelected.lure > maxIndex) {this.tackleBoxSelected.lure = 0;}
            }
            if (confirmPressed) {
                const selected = this.tackleBoxGear.lureWeights[this.tackleBoxSelected.lure];
                this.lure.weight = selected.value;
                console.log(`🎣 Lure weight changed to ${selected.label}`);
            }
        } else if (this.tackleBoxTab === 1) {
            // LINE tab - has two sections: line type and line test strength
            // Use left/right to switch between sections (overrides tab switching in this tab)
            if (leftPressed) {
                this.lineTabFocus = 0; // Focus on line type
            }
            if (rightPressed) {
                this.lineTabFocus = 1; // Focus on line test strength
            }

            if (this.lineTabFocus === 0) {
                // Navigating line type
                const maxIndex = this.tackleBoxGear.lineTypes.length - 1;
                if (upPressed) {
                    this.tackleBoxSelected.line--;
                    if (this.tackleBoxSelected.line < 0) {this.tackleBoxSelected.line = maxIndex;}
                }
                if (downPressed) {
                    this.tackleBoxSelected.line++;
                    if (this.tackleBoxSelected.line > maxIndex) {this.tackleBoxSelected.line = 0;}
                }
                if (confirmPressed) {
                    const selected = this.tackleBoxGear.lineTypes[this.tackleBoxSelected.line];
                    this.fishingLine.setLineType(selected.value, 'neon-green');
                    this.fishingLineModel.setLineType(selected.value);
                    console.log(`🧵 Line type changed to ${selected.label}`);
                }
            } else if (this.lineTabFocus === 1) {
                // Navigating line test strength
                const maxIndex = this.tackleBoxGear.lineTestStrengths.length - 1;
                if (upPressed) {
                    this.tackleBoxSelected.lineTest--;
                    if (this.tackleBoxSelected.lineTest < 0) {this.tackleBoxSelected.lineTest = maxIndex;}
                }
                if (downPressed) {
                    this.tackleBoxSelected.lineTest++;
                    if (this.tackleBoxSelected.lineTest > maxIndex) {this.tackleBoxSelected.lineTest = 0;}
                }
                if (confirmPressed) {
                    const selected = this.tackleBoxGear.lineTestStrengths[this.tackleBoxSelected.lineTest];
                    this.reelModel.setLineTestStrength(selected.value);
                    console.log(`🧵 Line test changed to ${selected.label}`);
                }
            }
        } else if (this.tackleBoxTab === 2) {
            // REEL tab - just reel type selection
            const maxIndex = this.tackleBoxGear.reelTypes.length - 1;
            if (upPressed) {
                this.tackleBoxSelected.reel--;
                if (this.tackleBoxSelected.reel < 0) {this.tackleBoxSelected.reel = maxIndex;}
            }
            if (downPressed) {
                this.tackleBoxSelected.reel++;
                if (this.tackleBoxSelected.reel > maxIndex) {this.tackleBoxSelected.reel = 0;}
            }
            if (confirmPressed) {
                const selected = this.tackleBoxGear.reelTypes[this.tackleBoxSelected.reel];
                this.reelModel.setReelType(selected.value);
                console.log(`🎣 Reel type changed to ${selected.label}`);
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
        const tabs = ['LURE', 'LINE', 'REEL'];
        const tabWidth = 180;
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
            // LINE tab - shows line type and line test strength
            const titleText = this.add.text(panelX + panelWidth / 2, contentY - 20, 'SELECT LINE TYPE & TEST', {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#cccccc'
            });
            titleText.setOrigin(0.5, 0.5);
            titleText.setDepth(2001);
            this.time.delayedCall(16, () => titleText.destroy());

            // Line Type Section
            const lineTypeSectionY = contentY;
            const lineTypeSectionActive = this.lineTabFocus === 0;
            const lineTypeHeaderText = this.add.text(contentX, lineTypeSectionY, lineTypeSectionActive ? '→ LINE TYPE:' : 'LINE TYPE:', {
                fontSize: '12px',
                fontFamily: 'Courier New',
                color: lineTypeSectionActive ? '#00ffff' : '#ffaa00',
                fontStyle: 'bold'
            });
            lineTypeHeaderText.setDepth(2001);
            this.time.delayedCall(16, () => lineTypeHeaderText.destroy());

            this.tackleBoxGear.lineTypes.forEach((line, index) => {
                const itemY = lineTypeSectionY + 25 + index * 30;
                const isSelected = index === this.tackleBoxSelected.line;
                const isCurrent = this.fishingLine.lineType === line.value;

                const labelText = this.add.text(contentX + 10, itemY, line.label, {
                    fontSize: isSelected ? '15px' : '13px',
                    fontFamily: 'Courier New',
                    color: isSelected ? '#00ffff' : '#00ff00',
                    fontStyle: isSelected ? 'bold' : 'normal'
                });
                labelText.setDepth(2001);
                this.time.delayedCall(16, () => labelText.destroy());

                const descText = this.add.text(contentX + 160, itemY, line.desc, {
                    fontSize: '11px',
                    fontFamily: 'Courier New',
                    color: isSelected ? '#cccccc' : '#888888'
                });
                descText.setDepth(2001);
                this.time.delayedCall(16, () => descText.destroy());

                if (isCurrent) {
                    const currentText = this.add.text(contentX + 420, itemY, '← CURRENT', {
                        fontSize: '11px',
                        fontFamily: 'Courier New',
                        color: '#ffff00'
                    });
                    currentText.setDepth(2001);
                    this.time.delayedCall(16, () => currentText.destroy());
                }
            });

            // Line Test Strength Section
            const lineTestSectionY = contentY + 120;
            const lineTestSectionActive = this.lineTabFocus === 1;
            const lineTestHeaderText = this.add.text(contentX, lineTestSectionY, lineTestSectionActive ? '→ LINE TEST STRENGTH:' : 'LINE TEST STRENGTH:', {
                fontSize: '12px',
                fontFamily: 'Courier New',
                color: lineTestSectionActive ? '#00ffff' : '#ffaa00',
                fontStyle: 'bold'
            });
            lineTestHeaderText.setDepth(2001);
            this.time.delayedCall(16, () => lineTestHeaderText.destroy());

            this.tackleBoxGear.lineTestStrengths.forEach((lineTest, index) => {
                const itemY = lineTestSectionY + 25 + index * 25;
                const isSelected = index === this.tackleBoxSelected.lineTest;
                const isCurrent = this.reelModel.lineTestStrength === lineTest.value;

                const labelText = this.add.text(contentX + 10, itemY, lineTest.label, {
                    fontSize: isSelected ? '14px' : '12px',
                    fontFamily: 'Courier New',
                    color: isSelected ? '#00ffff' : '#00ff00',
                    fontStyle: isSelected ? 'bold' : 'normal'
                });
                labelText.setDepth(2001);
                this.time.delayedCall(16, () => labelText.destroy());

                const descText = this.add.text(contentX + 100, itemY, lineTest.desc, {
                    fontSize: '10px',
                    fontFamily: 'Courier New',
                    color: isSelected ? '#cccccc' : '#888888'
                });
                descText.setDepth(2001);
                this.time.delayedCall(16, () => descText.destroy());

                if (isCurrent) {
                    const currentText = this.add.text(contentX + 420, itemY, '← CURRENT', {
                        fontSize: '10px',
                        fontFamily: 'Courier New',
                        color: '#ffff00'
                    });
                    currentText.setDepth(2001);
                    this.time.delayedCall(16, () => currentText.destroy());
                }
            });
        } else if (this.tackleBoxTab === 2) {
            // REEL tab - just reel type selection
            const titleText = this.add.text(panelX + panelWidth / 2, contentY - 20, 'SELECT REEL TYPE', {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#cccccc'
            });
            titleText.setOrigin(0.5, 0.5);
            titleText.setDepth(2001);
            this.time.delayedCall(16, () => titleText.destroy());

            this.tackleBoxGear.reelTypes.forEach((reel, index) => {
                const itemY = contentY + index * 40;
                const isSelected = index === this.tackleBoxSelected.reel;
                const isCurrent = this.reelModel.reelType === reel.value;

                const labelText = this.add.text(contentX, itemY, reel.label, {
                    fontSize: isSelected ? '16px' : '14px',
                    fontFamily: 'Courier New',
                    color: isSelected ? '#00ffff' : '#00ff00',
                    fontStyle: isSelected ? 'bold' : 'normal'
                });
                labelText.setDepth(2001);
                this.time.delayedCall(16, () => labelText.destroy());

                const descText = this.add.text(contentX + 150, itemY, reel.desc, {
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

        // Instructions - different for line tab
        let hintMessage = 'Arrow Keys: Navigate | X: Select | TAB/Select: Close';
        if (this.tackleBoxTab === 1) {
            hintMessage = 'L/R: Switch Section | Up/Down: Navigate | X: Select | TAB: Close';
        }
        const hintText = this.add.text(panelX + panelWidth / 2, panelY + panelHeight - 20, hintMessage, {
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
        // Remove event listeners first to prevent memory leaks
        this.events.off('fishStrike', this.handleFishStrike, this);
        this.events.off('fishCaught', this.handleFishCaught, this);
        this.events.off('fishBump', this.handleFishBump, this);

        // Remove gamepad event listeners
        if (window.gamepadManager) {
            if (this.gamepadDisconnectedHandler) {
                window.gamepadManager.off('disconnected', this.gamepadDisconnectedHandler);
            }
            if (this.gamepadConnectedHandler) {
                window.gamepadManager.off('connected', this.gamepadConnectedHandler);
            }
        }

        // Clean up entities
        this.fishes.forEach(fish => fish.destroy());
        this.baitfishClouds.forEach(cloud => cloud.destroy());
        this.baitfishSchools.forEach(fish => fish.destroy());
        this.zooplankton.forEach(zp => zp.destroy());

        // Clean up core components
        this.lure.destroy();
        this.fishingLine.destroy();
        this.sonarDisplay.destroy();

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
