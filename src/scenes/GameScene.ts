import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import DepthConverter from '../utils/DepthConverter.js';
import { SpriteGenerator } from '../utils/SpriteGenerator.js';
import Lure from '../entities/Lure.js';
import FishFight from '../entities/FishFight.js';
import FishingLine from '../entities/FishingLine.js';
import { FishingLineModel } from '../models/FishingLineModel.js';
import { ReelModel } from '../models/ReelModel.js';

// Import new sprite classes for Groups
import { FishSprite } from '../sprites/FishSprite.js';
import { CrayfishSprite } from '../sprites/CrayfishSprite.js';
import { ZooplanktonSprite } from '../sprites/ZooplanktonSprite.js';
import { OrganismSprite } from '../sprites/OrganismSprite.js';

// Import all systems
import SpawningSystem from './systems/SpawningSystem.js';
import InputSystem from './systems/InputSystem.js';
import CollisionSystem from './systems/CollisionSystem.js';
import DebugSystem from './systems/DebugSystem.js';
import NotificationSystem from './systems/NotificationSystem.js';
import SchoolManager from '../systems/SchoolManager.js';
import FoodChainSystem from '../systems/FoodChainSystem.js';

/**
 * Hookset window state
 */
interface HooksetWindow {
    active: boolean;
    fish: FishSprite | null;
    startTime: number;
    duration: number;
    hasHookset: boolean;
}

/**
 * Jig detection state for pike summoning
 */
interface JigDetection {
    lastStickY: number;
    jigCount: number;
    lastJigTime: number;
    jigTimeout: number;
    needsReset: boolean;
    threshold: number;
}

/**
 * Tackle box button states
 */
interface TackleBoxButtonStates {
    select: boolean;
    circle: boolean;
    start: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    x: boolean;
}

/**
 * Tackle box selection indices
 */
interface TackleBoxSelection {
    lure: number;
    line: number;
    reel: number;
    lineTest: number;
}

/**
 * Gear option (lure/line/reel)
 */
interface GearOption {
    label: string;
    value: number | string;
    desc: string;
}

/**
 * Tackle box gear configurations
 */
interface TackleBoxGear {
    lureWeights: GearOption[];
    lineTypes: GearOption[];
    lineTestStrengths: GearOption[];
    reelTypes: GearOption[];
}

/**
 * Caught fish data for game over screen
 */
export interface CaughtFishData {
    species: string;
    weight: number;
    length: number;
    points: number;
    fightDuration: number;
    hooksetQuality: string;
}

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
    // Entity arrays (legacy - will be deprecated in favor of unified pool)
    public fishes: FishSprite[] = [];
    public zooplankton: ZooplanktonSprite[] = [];
    public crayfish: CrayfishSprite[] = [];

    // Unified organism pool - ALL entities (fish, crayfish, zooplankton, etc.)
    public organisms: OrganismSprite[] = [];

    // Selected fish for detailed view
    public selectedFish: FishSprite | null = null;

    // Spawn mode state
    public spawnMode: boolean = false;
    public selectedSpawnButton: number = 0;

    // Game state
    public fishCaught: number = 0;
    public fishLost: number = 0;
    public gameTime: number = 0;
    public waterTemp: number = 40;
    public debugMode: boolean = false;
    public visionRangeDebug: boolean = false;
    public currentFight: FishFight | null = null;
    public controllerTestMode: boolean = false;
    public controllerTestUI: any = null;
    public selectedFishId: string | null = null;

    // Hookset window state
    public hooksetWindow: HooksetWindow;

    // Jig detection state (for pike summoning)
    public jigDetection: JigDetection;

    // Caught fish data
    public caughtFishData: CaughtFishData[] = [];

    // Game components
    public lure!: Lure;
    public fishingLine!: FishingLine;
    public fishingLineModel!: FishingLineModel;
    public reelModel!: ReelModel;
    public depthConverter!: DepthConverter;
    public fishingType!: string;
    public maxDepth!: number;

    // Systems (initialized in create())
    public spawningSystem!: SpawningSystem;
    public inputSystem!: InputSystem;
    public collisionSystem!: CollisionSystem;
    public debugSystem!: DebugSystem;
    public schoolManager!: SchoolManager;
    public foodChainSystem!: FoodChainSystem;
    public notificationSystem!: NotificationSystem;

    // Phaser Groups for entity pooling
    public fishGroup!: Phaser.GameObjects.Group;
    public baitfishSchools: FishSprite[] = [];
    public schools: any[] = [];

    // Graphics layers
    private zooplanktonGraphics?: Phaser.GameObjects.Graphics;
    private schoolEffectsGraphics?: Phaser.GameObjects.Graphics;

    // Controller test mode
    private controllerTestUpdate?: () => void;

    // Gamepad event handlers
    private gamepadDisconnectedHandler?: (gamepad: any) => void;
    private gamepadConnectedHandler?: (gamepad: any) => void;

    // Tackle box state
    public tackleBoxOpen: boolean = false;
    public tackleBoxTab: number = 0;
    public tackleBoxSelected: TackleBoxSelection;
    public lineTabFocus: number = 0;
    public switchingToPauseMenu: boolean = false;
    public catchPopupActive: boolean = false;
    public tackleBoxButtonStates: TackleBoxButtonStates;
    public tackleBoxGear: TackleBoxGear;
    public tackleBoxGraphics: Phaser.GameObjects.Graphics | null = null;

    constructor() {
        super({ key: 'GameScene' });

        // Bind select fish method so it can be called from Fish entities
        this.selectFish = this.selectFish.bind(this);

        // Initialize hookset window state
        this.hooksetWindow = {
            active: false,
            fish: null,
            startTime: 0,
            duration: 45,
            hasHookset: false
        };

        // Initialize jig detection state
        this.jigDetection = {
            lastStickY: 0,
            jigCount: 0,
            lastJigTime: 0,
            jigTimeout: 2000,
            needsReset: false,
            threshold: 0.5
        };

        // Initialize tackle box selected state
        this.tackleBoxSelected = { lure: 0, line: 0, reel: 0, lineTest: 1 };

        // Initialize tackle box button states
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

        // Initialize tackle box gear
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
    }

    /**
     * Create game scene and initialize all systems
     */
    create(): void {
        try {
            // Generate sprite textures for all entities (done once)
            if (!this.registry.get('texturesGenerated')) {
                SpriteGenerator.generateAllTextures(this);
                this.registry.set('texturesGenerated', true);
            }

            // Get fishing type from registry (set by MenuScene)
            this.fishingType = this.registry.get('fishingType') || GameConfig.FISHING_TYPE_ICE;

            // Get actual depth from bathymetric data (set by NavigationScene)
            this.maxDepth = this.registry.get('currentDepth') || GameConfig.MAX_DEPTH;
            console.log(`Starting game: ${this.fishingType} fishing`);
            console.log(`Water depth at location: ${this.maxDepth.toFixed(1)}ft`);

            // Initialize game timer (always counts up from zero for diagnostics)
            this.gameTime = 0;

            // Set up game timer (updates every second)
            this.time.addEvent({
                delay: 1000,
                callback: () => {
                    this.gameTime++;
                },
                loop: true
            });

            // Create depth converter (shared coordinate system)
            this.depthConverter = new DepthConverter(this.scale.height, this.maxDepth);

            // Launch WaterColumn scene (base rendering layer)
            this.scene.launch('WaterColumn', {
                depthConverter: this.depthConverter,
                maxDepth: this.maxDepth
            });

            // Launch overlay scenes
            this.scene.launch('GameHUD'); // Main in-game HUD (replaces HTML UI)
            //this.scene.launch('InfoBar');  // Deprecated - replaced by GameHUD
            //this.scene.launch('FishStatus'); // Deprecated - replaced by GameHUD

            // Set initial registry data for overlays
            this.registry.set('currentDepth', this.maxDepth);
            this.registry.set('waterTemp', this.waterTemp);
            this.registry.set('elapsedTime', 0);
            this.registry.set('gameMode', 'Ice Fishing');

            // Create the player's lure - start ABOVE water in observing mode
            // Use actual game width to center on any screen size
            const actualGameWidth = this.scale.width;
            this.lure = new Lure(this, actualGameWidth / 2, -20); // Start 20px above surface

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
     * Set water temperature (ice fishing only)
     */
    private initializeWaterTemp(): void {
        // Always use winter/ice fishing water temp
        this.waterTemp = Utils.randomBetween(GameConfig.WATER_TEMP_MIN, GameConfig.WATER_TEMP_MAX);
    }

    /**
     * Initialize creature groups with Phaser pooling
     * Now using Phaser Groups for automatic rendering and object pooling
     */
    private initializeCreatureGroups(): void {
        console.log('🌊 Initializing creature groups with pooling...');

        // Phaser Group for ALL fish (bait + predators) with object pooling
        this.fishGroup = this.add.group({
            classType: FishSprite,
            maxSize: 150, // Increased for baitfish + predators
            runChildUpdate: true // Automatically calls preUpdate on all active fish
        });

        // Phaser Group for crayfish with object pooling
        this.crayfishGroup = this.add.group({
            classType: CrayfishSprite,
            maxSize: 50,
            runChildUpdate: true
        });

        // Phaser Group for zooplankton with object pooling
        this.zooplanktonGroup = this.add.group({
            classType: ZooplanktonSprite,
            maxSize: 500, // Large pool for abundant zooplankton
            runChildUpdate: true
        });

        // Legacy arrays for compatibility during migration (will gradually phase out)
        this.fishes = []; // Will be replaced by fishGroup.getChildren()
        this.crayfish = []; // Will be replaced by crayfishGroup.getChildren()
        this.zooplankton = []; // Will be replaced by zooplanktonGroup.getChildren()

        // Array for schooling baitfish (using new unified Fish class with Boids)
        this.baitfishSchools = [];

        // Array of school metadata (tracks center position and velocity for each school)
        this.schools = [];

        console.log('✅ Creature groups initialized with pooling (fish, crayfish, zooplankton)');
    }

    /**
     * Get ALL fish (predators + baitfish) - unified access for systems
     * @returns {Array} All fish sprites
     */
    public getAllFish(): FishSprite[] {
        return [
            ...this.fishes,           // Predators (scene.add.existing)
            ...this.baitfishSchools   // Baitfish (array, will migrate to group)
        ];
    }

    /**
     * Get all active organisms (for collision detection, AI, etc.)
     * @returns {Object} All organisms by type
     */
    public getAllOrganisms(): (FishSprite | ZooplanktonSprite | CrayfishSprite)[] {
        // Filter from unified organisms pool instead of legacy arrays
        const activeOrganisms = this.organisms.filter(o => o.active && o.visible);

        return {
            predators: activeOrganisms.filter(o => o instanceof FishSprite && o.type === 'predator'),
            baitfish: activeOrganisms.filter(o => o instanceof FishSprite && o.type === 'bait' && !o.consumed),
            zooplankton: activeOrganisms.filter(o => o instanceof ZooplanktonSprite && !o.consumed),
            crayfish: activeOrganisms.filter(o => o instanceof CrayfishSprite && !o.consumed)
        };
    }

    /**
     * Spawn a fish from the object pool
     * @param {number} worldX - World X position
     * @param {number} y - Y position
     * @param {string} size - Fish size category
     * @param {string} species - Fish species
     * @returns {FishSprite} The spawned fish
     */
    public spawnPooledFish(worldX: number, y: number, size: string, species: string): FishSprite | null {
        // Try to get inactive fish from pool
        const fish = this.fishGroup.getFirstDead(false);

        if (fish) {
            // Reuse existing fish
            fish.reset(worldX, y, size, species);
            return fish;
        }

        // Pool is full or no dead fish available
        // For now, still create using old system (will migrate SpawningSystem next)
        return null;
    }

    /**
     * Initialize all game systems
     */
    private initializeSystems(): void {
        this.spawningSystem = new SpawningSystem(this);
        this.inputSystem = new InputSystem(this);
        this.collisionSystem = new CollisionSystem(this);
        this.debugSystem = new DebugSystem(this);
        this.notificationSystem = new NotificationSystem(this);
        this.schoolManager = new SchoolManager(this);
        this.foodChainSystem = new FoodChainSystem(this);

        console.log('All game systems initialized (including SchoolManager and FoodChainSystem)');
    }

    /**
     * Main update loop - orchestrates all systems
     * @param {number} time - Current game time
     * @param {number} delta - Time since last frame
     */
    update(time: number, delta: number): void {
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

        // Update registry data for overlay scenes (GameHUD)
        this.registry.set('elapsedTime', this.gameTime);
        this.registry.set('depth', this.lure.depth);
        this.registry.set('mode', this.lure.y < 0 ? 'OBSERVING' : 'FISHING');

        // Update meter values
        if (this.currentFight && this.currentFight.active) {
            // During fight - show tension and drag
            const tension = this.currentFight.lineTension / 100;
            this.registry.set('lineTension', tension);
            this.registry.set('lineStrain', this.fishingLineModel.getStrain());
        } else {
            // Not fighting - show drop/reel speed
            this.registry.set('lineTension', 0);
            this.registry.set('lineStrain', 0);
        }

        // Drop and reel speed (based on lure velocity)
        const dropSpeed = Math.max(0, this.lure.velocity / 10); // Normalize to 0-1
        const reelSpeed = Math.max(0, -this.lure.velocity / 10); // Normalize to 0-1
        this.registry.set('dropSpeed', Math.min(1, dropSpeed));
        this.registry.set('reelSpeed', Math.min(1, reelSpeed));

        // Drag setting
        const dragSetting = this.fishingLineModel ? (this.fishingLineModel.dragSetting || 0.5) : 0.5;
        this.registry.set('dragSetting', dragSetting);

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

        // Update new ecosystem systems
        // SchoolManager handles both baitfish and predator schools
        // Get all FishSprite instances from display list
        const allFishSprites = this.children.list.filter(obj =>
            obj.constructor.name === 'FishSprite'
        );
        this.schoolManager.update(allFishSprites);
        this.foodChainSystem.update();

        // Check for emergency fish spawn (arcade mode)
        this.spawningSystem.checkEmergencySpawn();

        // Update fish status sidebar
        this.updateFishStatusDisplay();
    }

    /**
     * Update fish status display in GameHUD
     */
    private updateFishStatusDisplay(): void {
        // Count entities from unified organisms pool
        const activeOrganisms = this.organisms.filter(o => o.active && o.visible);

        const predatorFish = activeOrganisms.filter(o => o instanceof FishSprite && o.type === 'predator') as FishSprite[];
        const baitfish = activeOrganisms.filter(o => o instanceof FishSprite && o.type === 'bait') as FishSprite[];
        const crayfish = activeOrganisms.filter(o => o instanceof CrayfishSprite) as CrayfishSprite[];
        const zooplankton = activeOrganisms.filter(o => o instanceof ZooplanktonSprite) as ZooplanktonSprite[];

        const fishCount = predatorFish.length;
        const baitfishCount = baitfish.length;
        const crayfishCount = crayfish.length;
        const zooplanktonCount = zooplankton.length;

        // Count schools from SchoolManager (single source of truth)
        const baitCloudCount = this.schoolManager ? this.schoolManager.getSchoolCount('baitfish') : 0;
        const predatorPackCount = this.schoolManager ? this.schoolManager.getSchoolCount('predator') : 0;

        const entityCounts = `🐟 ${fishCount} 🐠 ${baitfishCount} ☁️ ${baitCloudCount} 🦞 ${crayfishCount} 🪳 ${zooplanktonCount}`;
        this.registry.set('entityCounts', entityCounts);

        // Build fish list data - send as array of objects for proper styling
        if (fishCount > 0) {
            const fishListData = predatorFish
                .map((f, i) => ({
                    id: f.id,
                    name: f.name || 'Fish-' + i,
                    gender: f.gender,
                    weight: f.weight,
                    state: (f.ai && f.ai.currentState) ? f.ai.currentState : 'idle',
                    hunger: f.hunger || 0,
                    health: f.health || 100,
                    depth: f.y ? Math.floor(f.y / (this.sonarDisplay ? this.sonarDisplay.getDepthScale() : 10)) : 0,
                    baitfishEaten: f.stomachContents ? f.stomachContents.length : 0,
                    isSelected: this.selectedFish === f
                }));
            this.registry.set('fishList', fishListData);
        } else {
            this.registry.set('fishList', null);
        }

        // Fish detail - show selected fish or first fish
        const detailFish = this.selectedFish || (fishCount > 0 ? predatorFish[0] : null);
        if (detailFish) {
            const species = detailFish.species || 'Unknown';
            const name = detailFish.name || 'Unknown';
            const weight = detailFish.weight ? detailFish.weight.toFixed(1) : '?';
            const length = detailFish.length ? detailFish.length.toFixed(1) : '?';
            const gender = detailFish.gender === 'male' ? '♂ Male' : '♀ Female';
            const age = detailFish.age || '?';
            const depth = detailFish.y ? Math.floor(detailFish.y / (this.sonarDisplay ? this.sonarDisplay.getDepthScale() : 10)) : '?';
            const zone = detailFish.zone || 'Unknown';
            const hunger = detailFish.hunger || 0;
            const health = detailFish.health || 100;
            const state = detailFish.ai ? detailFish.ai.currentState : 'unknown';
            const isFrenzying = detailFish.ai ? detailFish.ai.isFrenzying : false;
            const baitfishEaten = detailFish.stomachContents ? detailFish.stomachContents.length : 0;
            const speed = detailFish.baseSpeed || 1.0;

            // Create detail object for structured rendering
            const detailData = {
                name: `${name} (${species})`,
                weight: `${weight} lbs`,
                length: `${length} in`,
                gender: gender,
                age: `${age} years`,
                depth: `${depth}ft`,
                zone: zone,
                hunger: hunger,
                health: health,
                state: state,
                frenzy: isFrenzying ? 'YES' : 'NO',
                baitfishEaten: baitfishEaten,
                speed: speed.toFixed(1)
            };
            this.registry.set('fishDetail', detailData);
        } else {
            this.registry.set('fishDetail', 'No fish to display');
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
     * Spawn a baitfish school using unified Fish class with Boids algorithm
     * @param {number} worldX - World X position
     * @param {number} y - Screen Y position
     * @param {number} count - Number of fish in school
     * @param {string} species - Species name (rainbow_smelt, alewife, sculpin)
     */
    public spawnBaitfishSchool(worldX: number, y: number, count: number, species: string = 'rainbow_smelt'): void {
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

        // Pre-calculate all fish positions in a schooling formation to prevent "bloom" effect
        // Use a more natural circular/elliptical distribution
        const positions = [];
        const radius = 50; // School radius
        const angleStep = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            // Use golden angle spiral for natural-looking distribution
            const angle = i * angleStep + Math.random() * 0.5;
            const distance = Math.sqrt(Math.random()) * radius; // Sqrt gives more uniform density
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance * 0.6; // Flatten vertically

            positions.push({ offsetX, offsetY });
        }

        // Now spawn all fish at their pre-calculated positions
        for (let i = 0; i < count; i++) {
            const { offsetX, offsetY } = positions[i];

            // Create baitfish using unified FishSprite (no size param for bait)
            const fish = new FishSprite(
                this,
                worldX + offsetX,
                y + offsetY,
                species,
                'MEDIUM' // Size doesn't matter for baitfish, but FishSprite requires it
            );

            // NOTE: No longer manually assigning schoolId - SchoolManager handles this
            // Let fish spawn close together, SchoolManager will detect the cluster and create a school

            // Set initial velocity for natural movement
            fish.velocity.x = Utils.randomBetween(-0.3, 0.3);
            fish.velocity.y = Utils.randomBetween(-0.1, 0.1);

            // Add to arrays
            school.members.push(fish);
            this.baitfishSchools.push(fish);
            this.organisms.push(fish); // Unified pool
        }

        this.schools.push(school);
        console.log(`✅ School spawned: ${this.baitfishSchools.length} total baitfish in ${this.schools.length} schools`);
    }

    /**
     * Wrapper method for spawning baitfish cloud via spawning system
     * Used by spawn mode UI for consistency with NatureSimulationScene
     */
    trySpawnBaitfishCloud() {
        // Use spawning system to spawn new baitfish school
        if (this.spawningSystem) {
            try {
                const success = this.spawningSystem.trySpawnBaitfishSchool();
                if (!success) {
                    console.log('⚠️ Could not spawn baitfish (max schools reached)');
                }
            } catch (error) {
                console.error('Error spawning baitfish:', error);
            }
        }
    }

    /**
     * Get the player's center position (always at center of actual canvas width)
     * This adapts to any screen size/resolution
     */
    public getPlayerCenterX(): number {
        return this.scale.width / 2;
    }

    /**
     * Render fog effects and fish counts behind baitfish schools
     * NOTE: This is a perfect test case for future shader implementation!
     * For now using simple graphics, but shaders could make this look amazing.
     */
    private renderSchoolEffects(): void {
        // DISABLED: No school visualization for simplified gameplay restoration
        return;

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
            const visibleFish = school.members.filter(f => !f.consumed && f.visible);
            if (visibleFish.length === 0) return; // Skip if no visible fish

            // Calculate school bounds (find extents of all visible fish)
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;

            visibleFish.forEach(fish => {
                minX = Math.min(minX, fish.x);
                maxX = Math.max(maxX, fish.x);
                minY = Math.min(minY, fish.y);
                maxY = Math.max(maxY, fish.y);
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
            const visibleFish = school.members.filter(f => !f.consumed && f.visible);
            if (visibleFish.length === 0) return; // Skip if no visible fish

            // Find school bounds for text positioning
            const fishX = visibleFish.map(f => f.x);
            const fishY = visibleFish.map(f => f.y);
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
    private spawnFishWhistleFish(): void {
        console.log('🎵 Fish whistle: Spawning trophy fish and large bait clouds...');

        // Use center of screen as player position
        const playerWorldX = this.getPlayerCenterX();

        // Spawn 1 trophy fish of each species (only species with generated textures)
        const species = ['lake_trout', 'northern_pike', 'smallmouth_bass'];

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

            const y = this.depthConverter.depthToY(depth);

            // All TROPHY size - using FishSprite (species, size order!)
            const fish = new FishSprite(this, worldX, y, speciesName, 'TROPHY');

            // Set movement direction
            fish.ai.idleDirection = Math.random() < 0.5 ? -1 : 1;

            // Add to legacy array and unified pool
            this.fishes.push(fish);
            this.organisms.push(fish); // Unified pool
            console.log(`  Spawned trophy ${speciesName} at ${depth}ft`);
        });

        // Spawn 2 extra large bait schools (using new school system)
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 200;
            const worldX = playerWorldX + Math.cos(angle) * distance;

            // Random depth between 20-70 feet
            const depth = Utils.randomBetween(20, 70);
            const y = this.depthConverter.depthToY(depth);

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
    public getAdaptedSchoolsForAI(): any[] {
        return this.schools.map(school => {
            return {
                // Cloud properties expected by FishAI
                visible: school.members.length > 0,
                members: school.members,          // Array of Fish objects (unified naming)
                baitfish: school.members,         // Also provide as baitfish for legacy compatibility
                centerWorldX: school.centerWorldX, // World X position (PRIMARY for distance checks)
                centerY: school.centerY,          // Screen Y position
                speciesType: school.species,      // Species name (for diet preference)
                lakersChasing: [],                // Predators currently chasing this school

                // Method: Check if lure is in cloud
                isPlayerLureInCloud(lure) {
                    // Use Phaser's optimized distance calculation (use worldX)
                    const distance = Phaser.Math.Distance.Between(
                        lure.worldX || lure.x, lure.y,
                        school.centerWorldX, school.centerY
                    );
                    return distance < GameConfig.BAITFISH_CLOUD_RADIUS;
                },

                // Track the last closest baitfish found (so we consume the RIGHT one)
                _lastClosestBaitfish: null,

                // Method: Find best baitfish to target (prefers edge fish on predator's side)
                // IMPORTANT: x parameter is in worldX coordinates from predator mouth
                getClosestBaitfish(x, y) {
                    if (school.members.length === 0) {
                        return { baitfish: null, distance: Infinity };
                    }

                    // Calculate actual school center from member positions (use worldX)
                    let schoolCenterX = 0, schoolCenterY = 0;
                    let validCount = 0;
                    for (const fish of school.members) {
                        if (!fish.consumed) {
                            schoolCenterX += fish.worldX;
                            schoolCenterY += fish.y;
                            validCount++;
                        }
                    }
                    if (validCount === 0) {
                        return { baitfish: null, distance: Infinity };
                    }
                    schoolCenterX /= validCount;
                    schoolCenterY /= validCount;

                    // Calculate direction from school center to predator (worldX)
                    const dirX = x - schoolCenterX;
                    const dirY = y - schoolCenterY;
                    // Use Phaser's optimized distance calculation
                    const dirLength = Phaser.Math.Distance.Between(schoolCenterX, schoolCenterY, x, y);
                    const normalizedDirX = dirLength > 0 ? dirX / dirLength : 0;
                    const normalizedDirY = dirLength > 0 ? dirY / dirLength : 0;

                    // Score each baitfish: prefer fish on the edge facing the predator
                    let bestFish = null;
                    let bestScore = -Infinity;

                    for (const fish of school.members) {
                        if (fish.consumed) continue;

                        // Distance from predator to this fish (use worldX)
                        const distToPredator = Phaser.Math.Distance.Between(x, y, fish.worldX, fish.y);

                        // Distance from school center to this fish (edge detection, use worldX)
                        const distToCenter = Phaser.Math.Distance.Between(
                            fish.worldX, fish.y,
                            schoolCenterX, schoolCenterY
                        );

                        // Direction from school center to this fish (use worldX)
                        const fishDirX = fish.worldX - schoolCenterX;
                        const fishDirY = fish.y - schoolCenterY;
                        const fishDirLength = Phaser.Math.Distance.Between(schoolCenterX, schoolCenterY, fish.worldX, fish.y);

                        // Dot product: is this fish on the same side as predator?
                        const alignment = fishDirLength > 0
                            ? (fishDirX * normalizedDirX + fishDirY * normalizedDirY) / fishDirLength
                            : 0;

                        // SCORING:
                        // - Prefer fish aligned with predator direction (edge fish on predator's side)
                        // - Prefer fish farther from center (on the edge)
                        // - Slightly prefer closer fish
                        const alignmentScore = alignment * 100;  // -100 to +100
                        const edgeScore = distToCenter;          // Farther from center = better
                        const proximityScore = -distToPredator * 0.1; // Closer = slightly better

                        const totalScore = alignmentScore + edgeScore + proximityScore;

                        if (totalScore > bestScore) {
                            bestScore = totalScore;
                            bestFish = fish;
                        }
                    }

                    // Store the best fish so consumeBaitfish() eats the RIGHT one
                    this._lastClosestBaitfish = bestFish;

                    // Use Phaser's optimized distance calculation (x is in worldX coordinates)
                    const finalDistance = bestFish ?
                        Phaser.Math.Distance.Between(x, y, bestFish.worldX, bestFish.y) :
                        Infinity;

                    return { baitfish: bestFish, distance: finalDistance };
                },

                // Method: Consume the SPECIFIC baitfish that was targeted (not random!)
                consumeBaitfish() {
                    // Consume the specific fish that was found by getClosestBaitfish()
                    if (this._lastClosestBaitfish && !this._lastClosestBaitfish.consumed) {
                        const target = this._lastClosestBaitfish;
                        target.markConsumed(); // BaitfishSprite handles visibility
                        this._lastClosestBaitfish = null; // Clear reference
                        return target;
                    }

                    // Fallback: consume random available fish (shouldn't happen now)
                    const available = school.members.filter(f => !f.consumed);
                    if (available.length > 0) {
                        const target = available[Math.floor(Math.random() * available.length)];
                        target.markConsumed();
                        return target;
                    }
                    return null;
                }
            };
        });
    }

    private updateEntities(): void {
        // Create/clear zooplankton graphics layer (lazy initialization)
        if (!this.zooplanktonGraphics) {
            this.zooplanktonGraphics = this.add.graphics();
            this.zooplanktonGraphics.setDepth(10); // Well above background, below fish (50)
        }

        // Update zooplankton (sprites render automatically, no manual render needed)
        this.zooplankton = this.zooplankton.filter(zp => {
            if (zp.visible && !zp.consumed) {
                // ZooplanktonSprite.preUpdate() is called automatically by Phaser
                // No need to call update() or render() manually
                return true;
            } else{
                zp.destroy();
                return false;
            }
        });

        // Update crayfish
        this.crayfish = this.crayfish.filter(cf => {
            if (cf.visible && !cf.consumed) {
                // Find nearby zooplankton for hunting
                const nearbyZooplankton = this.zooplankton.filter(zp => {
                    // Use Phaser's optimized distance calculation
                    return Phaser.Math.Distance.Between(cf.x, cf.y, zp.x, zp.y) < 150;
                });

                // Check if smallmouth bass nearby (predators)
                const predatorsNearby = this.fishes.some(f => {
                    if (f.species !== 'smallmouth_bass') {return false;}
                    // Use Phaser's optimized distance calculation
                    return Phaser.Math.Distance.Between(cf.x, cf.y, f.x, f.y) < 200;
                });

                cf.update(nearbyZooplankton, predatorsNearby);
                return true;
            } else {
                cf.destroy();
                return false;
            }
        });

        // OLD BAITFISH CLOUD SYSTEM COMPLETELY REMOVED (was lines 983-1072)
        // Now using unified Fish-based schools with Boids behavior

        // Update school centers first (they drift/wander like BaitfishCloud)
        this.schools.forEach(school => {
            school.age++;

            // Track zooplankton in vicinity of school (MUCH larger radius to detect food at bottom)
            const zooplanktonSearchRadius = 300; // Pixels - can detect food from surface to bottom
            const nearbyZooplankton = (this.zooplankton || []).filter(zp => {
                if (!zp.visible || zp.consumed) return false;
                // Use Phaser's optimized distance calculation
                const dist = Phaser.Math.Distance.Between(zp.x, zp.y, school.centerWorldX, school.centerY);
                return dist < zooplanktonSearchRadius;
            });

            // Initialize food tracking if not present
            if (school.nearbyFoodCount === undefined) {
                school.nearbyFoodCount = nearbyZooplankton.length;
                school.lowFoodTimer = 0;
            }

            // Update food count
            school.nearbyFoodCount = nearbyZooplankton.length;

            // If food is depleted, start migration behavior
            const FOOD_DEPLETED_THRESHOLD = 5; // Less than 5 zooplankton = depleted
            const MIGRATION_TRIGGER_TIME = 600; // 10 seconds of low food triggers migration (was 3 seconds)

            if (school.nearbyFoodCount < FOOD_DEPLETED_THRESHOLD) {
                school.lowFoodTimer++;

                // After prolonged low food, trigger migration away from screen
                if (school.lowFoodTimer > MIGRATION_TRIGGER_TIME && !school.migrating) {
                    school.migrating = true;
                    // Pick direction to migrate (away from center toward edge)
                    // Use CURRENT canvas width (handles window resize)
                    const screenCenter = this.scale.width / 2;
                    school.migrationDirection = school.centerWorldX > screenCenter ? 1 : -1;
                    console.log(`🌊 School ${school.id} food depleted - migrating ${school.migrationDirection > 0 ? 'right' : 'left'}`);
                }
            } else {
                // Food available, reset migration
                school.lowFoodTimer = Math.max(0, school.lowFoodTimer - 1);
                if (school.migrating && school.nearbyFoodCount > FOOD_DEPLETED_THRESHOLD * 2) {
                    school.migrating = false;
                    console.log(`🌊 School ${school.id} found food - stopping migration`);
                }
            }

            // FOOD-SEEKING BEHAVIOR: Pull school center toward zooplankton clusters
            if (!school.migrating && nearbyZooplankton.length > 0) {
                // Find center of mass of nearby zooplankton
                let avgZooplanktonX = 0;
                let avgZooplanktonY = 0;
                nearbyZooplankton.forEach(zp => {
                    avgZooplanktonX += zp.worldX;
                    avgZooplanktonY += zp.y;
                });
                avgZooplanktonX /= nearbyZooplankton.length;
                avgZooplanktonY /= nearbyZooplankton.length;

                // Pull school center toward food (STRONG attraction)
                const dx = avgZooplanktonX - school.centerWorldX;
                const dy = avgZooplanktonY - school.centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    // Strong food attraction for school center (0.4 = very motivated to reach food)
                    school.velocity.x += (dx / dist) * 0.4;
                    school.velocity.y += (dy / dist) * 0.4;
                }
            }

            // Migration behavior - steady movement toward edge
            if (school.migrating) {
                school.velocity.x += school.migrationDirection * 0.15; // Steady push toward edge
                // Still allow vertical movement when migrating (for navigating obstacles)
                if (Math.random() < 0.05) {
                    school.velocity.y += Utils.randomBetween(-0.2, 0.2);
                }
            } else {
                // Normal wandering behavior (reduced when food-seeking is active)
                // More active wandering - increased frequency and magnitude
                if (Math.random() < 0.08) { // 8% chance per frame (more frequent)
                    school.velocity.x += Utils.randomBetween(-0.3, 0.3); // Reduced from 0.6 so food-seeking dominates
                    school.velocity.y += Utils.randomBetween(-0.15, 0.15); // Reduced from 0.3
                }

                // Add constant gentle drift to prevent stagnation
                school.velocity.x += Utils.randomBetween(-0.05, 0.05);
                school.velocity.y += Utils.randomBetween(-0.02, 0.02);
            }

            // Minimal velocity decay when seeking food (maintains diving momentum)
            const hasFood = !school.migrating && nearbyZooplankton.length > 0;
            const velocityDecay = hasFood ? 0.98 : 0.99; // Less decay when actively seeking food
            school.velocity.x *= velocityDecay;
            school.velocity.y *= velocityDecay;

            // Clamp velocity (MUCH faster vertical movement when seeking food)
            const maxVelX = school.migrating ? 3.0 : 2.0;
            // Allow VERY fast vertical movement when seeking food (not migrating)
            const maxVelY = school.migrating ? 1.0 : 5.0; // Can dive FAST to reach zooplankton (was 2.0)
            school.velocity.x = Math.max(-maxVelX, Math.min(maxVelX, school.velocity.x));
            school.velocity.y = Math.max(-maxVelY, Math.min(maxVelY, school.velocity.y));

            // Update center position
            school.centerWorldX += school.velocity.x;
            school.centerY += school.velocity.y;

            // NOTE: School center is NOT constrained - individual baitfish enforce their own boundaries
            // This allows the school center to move freely while fish physically stay in water
            // If the center tries to go above surface, fish will cluster below it naturally
        });

        // Render school fog and count labels BEFORE individual fish
        this.renderSchoolEffects();

        // Update baitfish schools (BaitfishSprite with Boids schooling)
        // BaitfishSprite.preUpdate() is called automatically by Phaser (via scene.add.existing())
        // Fish spawn within visible window and despawn when they swim off-screen
        this.baitfishSchools = this.baitfishSchools.filter(fish => {
            // BaitfishSprite IS the model (no .model wrapper needed)
            if (fish.visible && !fish.consumed) {
                // Find this fish's school center
                const school = this.schools.find(s => s.id === fish.schoolId);
                fish.schoolCenter = school ? {
                    worldX: school.centerWorldX,
                    y: school.centerY
                } : null;

                // Boids behavior happens in school update below
                return true;
            } else {
                fish.destroy();
                return false;
            }
        });

        // IMPORTANT: Clean up consumed/inactive fish from school.members arrays FIRST
        this.schools.forEach(school => {
            const beforeCount = school.members.length;

            // Filter out consumed/invisible/inactive fish (BaitfishSprite IS the model)
            school.members = school.members.filter(fish => {
                const keep = fish.visible && fish.active && !fish.consumed;
                if (!keep && beforeCount > 0) {
                    console.log(`🗑️ Removing fish from school ${school.id}: visible=${fish.visible}, active=${fish.active}, consumed=${fish.consumed}`);
                }
                return keep;
            });

            if (beforeCount > 0 && school.members.length === 0) {
                console.log(`⚠️ School ${school.id} lost all ${beforeCount} fish! This shouldn't happen on spawn.`);
            }

            // Then remove duplicates using Set (ensures each fish only appears once)
            const uniqueFish = new Set(school.members);
            school.members = Array.from(uniqueFish);
        });

        // NOTE: Old school management code disabled - SchoolManager now handles all schooling
        // SchoolManager detects clusters, creates/disbands schools, and applies boids movement
        // The legacy this.schools array is kept for compatibility with getAdaptedSchoolsForAI()

        // Update fish (predators)
        // FishSprite.preUpdate() is called automatically by Phaser Group (runChildUpdate: true)
        // We just need to clean up inactive fish from the legacy array
        this.fishes = this.fishes.filter(fish => {
            // Remove fish that are no longer active or visible
            if (!fish.active || !fish.visible) {
                // Fish is already destroyed or deactivated
                return false;
            }
            return true; // Keep fish
        });
    }

    /**
     * Update fish fight mechanics
     * @param {number} time - Current game time
     */
    private updateFishFight(time: number): void {
        const reelInput = this.inputSystem.handleFishFightInput(); // Analog 0-1 from R2 trigger

        // Update the fight
        this.currentFight.update(time, reelInput);

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
            } else if (reelInput > 0) {
                this.rumbleGamepad(50, 0.2, 0.1);
            }
        }
    }

    /**
     * Handle fish strike event - opens hookset window
     * @param {Fish} fish - The fish that struck at the lure
     */
    private handleFishStrike(fish: FishSprite): void {
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
    private handleFishCaught(fish: FishSprite): void {
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
    private handleFishBump(fish: FishSprite): void {
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

        // Create dark overlay - reduced opacity to see game
        // Use dynamic scale dimensions instead of hardcoded GameConfig values
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.4);
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);
        overlay.setDepth(2000);

        // Create test window
        const windowBg = this.add.graphics();
        windowBg.fillStyle(0x1a1a2e, 0.95);
        windowBg.fillRoundedRect(80, 40, 480, 400, 10);
        windowBg.lineStyle(2, 0x00aaff, 1);
        windowBg.strokeRoundedRect(80, 40, 480, 400, 10);
        windowBg.setDepth(2001);

        // Title
        const title = this.add.text(this.scale.width / 2, 64, 'CONTROLLER TEST', {
            fontSize: '19px',
            fontFamily: 'Courier New',
            color: '#00aaff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0);
        title.setDepth(2002);

        // Instructions
        const instructions = this.add.text(this.scale.width / 2, 96, 'Press buttons on your controller to test', {
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

        const okText = this.add.text(this.scale.width / 2, 396, 'OK', {
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

    private closeControllerTest(): void {
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
    private toggleTackleBox(): void {
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
    private handleTackleBoxInput(): void {
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

        // NEW 4-COLUMN NAVIGATION
        // Column switching with left/right
        // 0=Lure, 1=LineType, 2=LineTest, 3=Reel
        if (leftPressed) {
            this.tackleBoxTab--;
            if (this.tackleBoxTab < 0) {this.tackleBoxTab = 3;}
        }
        if (rightPressed) {
            this.tackleBoxTab++;
            if (this.tackleBoxTab > 3) {this.tackleBoxTab = 0;}
        }

        // Navigate within column with up/down
        if (this.tackleBoxTab === 0) {
            // COLUMN 1: LURE WEIGHT
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
            // COLUMN 2: LINE TYPE
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
        } else if (this.tackleBoxTab === 2) {
            // COLUMN 3: LINE TEST STRENGTH
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
        } else if (this.tackleBoxTab === 3) {
            // COLUMN 4: REEL TYPE
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

        // Semi-transparent overlay - reduced opacity to see game area
        // Use dynamic scale dimensions instead of hardcoded GameConfig values
        this.tackleBoxGraphics.fillStyle(0x000000, 0.4);
        this.tackleBoxGraphics.fillRect(0, 0, this.scale.width, this.scale.height);

        // Panel - larger size to fit all content, center based on actual canvas size
        const panelWidth = 900;
        const panelHeight = 520;
        const panelX = (this.scale.width - panelWidth) / 2;
        const panelY = (this.scale.height - panelHeight) / 2;

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

        // Four column layout - no tabs needed
        const col1X = panelX + 30;
        const col2X = panelX + 240;
        const col3X = panelX + 450;
        const col4X = panelX + 660;
        const contentY = panelY + 65;

        // COLUMN 1: LURE WEIGHT
        const lureHeaderText = this.add.text(col1X, contentY, 'LURE WEIGHT', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: this.tackleBoxTab === 0 ? '#00ffff' : '#ffaa00',
            fontStyle: 'bold'
        });
        lureHeaderText.setDepth(2001);
        this.time.delayedCall(16, () => lureHeaderText.destroy());

        this.tackleBoxGear.lureWeights.forEach((lure, index) => {
            const itemY = contentY + 30 + index * 30;
            const isSelected = this.tackleBoxTab === 0 && index === this.tackleBoxSelected.lure;
            const isCurrent = this.lure.weight === lure.value;

            const labelText = this.add.text(col1X, itemY, lure.label, {
                fontSize: isSelected ? '14px' : '12px',
                fontFamily: 'Courier New',
                color: isSelected ? '#00ffff' : (isCurrent ? '#ffff00' : '#00ff00'),
                fontStyle: isSelected ? 'bold' : 'normal'
            });
            labelText.setDepth(2001);
            this.time.delayedCall(16, () => labelText.destroy());

            const descText = this.add.text(col1X, itemY + 13, lure.desc, {
                fontSize: '9px',
                fontFamily: 'Courier New',
                color: '#888888'
            });
            descText.setDepth(2001);
            this.time.delayedCall(16, () => descText.destroy());
        });

        // COLUMN 2: LINE TYPE
        const lineTypeHeaderText = this.add.text(col2X, contentY, 'LINE TYPE', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: this.tackleBoxTab === 1 ? '#00ffff' : '#ffaa00',
            fontStyle: 'bold'
        });
        lineTypeHeaderText.setDepth(2001);
        this.time.delayedCall(16, () => lineTypeHeaderText.destroy());

        this.tackleBoxGear.lineTypes.forEach((line, index) => {
            const itemY = contentY + 30 + index * 28;
            const isSelected = this.tackleBoxTab === 1 && index === this.tackleBoxSelected.line;
            const isCurrent = this.fishingLine.lineType === line.value;

            const labelText = this.add.text(col2X, itemY, line.label, {
                fontSize: isSelected ? '13px' : '11px',
                fontFamily: 'Courier New',
                color: isSelected ? '#00ffff' : (isCurrent ? '#ffff00' : '#00ff00'),
                fontStyle: isSelected ? 'bold' : 'normal'
            });
            labelText.setDepth(2001);
            this.time.delayedCall(16, () => labelText.destroy());

            const descText = this.add.text(col2X, itemY + 12, line.desc, {
                fontSize: '9px',
                fontFamily: 'Courier New',
                color: '#888888'
            });
            descText.setDepth(2001);
            this.time.delayedCall(16, () => descText.destroy());
        });

        // COLUMN 3: LINE TEST STRENGTH
        const lineTestHeaderText = this.add.text(col3X, contentY, 'LINE TEST', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: this.tackleBoxTab === 2 ? '#00ffff' : '#ffaa00',
            fontStyle: 'bold'
        });
        lineTestHeaderText.setDepth(2001);
        this.time.delayedCall(16, () => lineTestHeaderText.destroy());

        this.tackleBoxGear.lineTestStrengths.forEach((lineTest, index) => {
            const itemY = contentY + 30 + index * 22;
            const isSelected = this.tackleBoxTab === 2 && index === this.tackleBoxSelected.lineTest;
            const isCurrent = this.reelModel.lineTestStrength === lineTest.value;

            const labelText = this.add.text(col3X, itemY, lineTest.label, {
                fontSize: isSelected ? '12px' : '11px',
                fontFamily: 'Courier New',
                color: isSelected ? '#00ffff' : (isCurrent ? '#ffff00' : '#00ff00'),
                fontStyle: isSelected ? 'bold' : 'normal'
            });
            labelText.setDepth(2001);
            this.time.delayedCall(16, () => labelText.destroy());

            const descText = this.add.text(col3X, itemY + 11, lineTest.desc, {
                fontSize: '9px',
                fontFamily: 'Courier New',
                color: '#888888'
            });
            descText.setDepth(2001);
            this.time.delayedCall(16, () => descText.destroy());
        });

        // COLUMN 4: REEL TYPE
        const reelHeaderText = this.add.text(col4X, contentY, 'REEL TYPE', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: this.tackleBoxTab === 3 ? '#00ffff' : '#ffaa00',
            fontStyle: 'bold'
        });
        reelHeaderText.setDepth(2001);
        this.time.delayedCall(16, () => reelHeaderText.destroy());

        this.tackleBoxGear.reelTypes.forEach((reel, index) => {
            const itemY = contentY + 30 + index * 35;
            const isSelected = this.tackleBoxTab === 3 && index === this.tackleBoxSelected.reel;
            const isCurrent = this.reelModel.reelType === reel.value;

            const labelText = this.add.text(col4X, itemY, reel.label, {
                fontSize: isSelected ? '14px' : '12px',
                fontFamily: 'Courier New',
                color: isSelected ? '#00ffff' : (isCurrent ? '#ffff00' : '#00ff00'),
                fontStyle: isSelected ? 'bold' : 'normal'
            });
            labelText.setDepth(2001);
            this.time.delayedCall(16, () => labelText.destroy());

            const descText = this.add.text(col4X, itemY + 13, reel.desc, {
                fontSize: '9px',
                fontFamily: 'Courier New',
                color: '#888888'
            });
            descText.setDepth(2001);
            this.time.delayedCall(16, () => descText.destroy());
        });

        // Instructions for unified layout
        const hintText = this.add.text(panelX + panelWidth / 2, panelY + panelHeight - 25,
            'L/R Arrows: Switch Column | Up/Down: Navigate | X: Select | TAB/Select: Close', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#aaaaaa'
        });
        hintText.setOrigin(0.5, 0.5);
        hintText.setDepth(2001);
        this.time.delayedCall(16, () => hintText.destroy());

        // Column separators for visual clarity (3 vertical lines for 4 columns)
        this.tackleBoxGraphics.lineStyle(1, 0x00ff0030, 1.0);
        this.tackleBoxGraphics.lineBetween(col2X - 15, panelY + 60, col2X - 15, panelY + panelHeight - 50);
        this.tackleBoxGraphics.lineBetween(col3X - 15, panelY + 60, col3X - 15, panelY + panelHeight - 50);
        this.tackleBoxGraphics.lineBetween(col4X - 15, panelY + 60, col4X - 15, panelY + panelHeight - 50);
    }


    /**
     * Clean up scene resources
     */
    shutdown(): void {
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
        // Phaser Groups automatically destroy their children
        if (this.fishGroup) {
            this.fishGroup.clear(true, true); // Remove all, destroy them
        }
        this.baitfishSchools.forEach(fish => fish.destroy());
        this.zooplankton.forEach(zp => zp.destroy());

        // Clean up core components
        this.lure.destroy();
        this.fishingLine.destroy();

        // Stop overlay scenes
        this.scene.stop('WaterColumn');
        this.scene.stop('InfoBar');
        this.scene.stop('FishStatus');

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

    /**
     * Select a fish to show detailed info
     */
    public selectFish(fish: FishSprite): void {
        this.selectedFish = fish;
        this.selectedFishId = fish ? fish.id : null;
        // UI will update on next frame via updateFishStatus in index.js
    }
}

export default GameScene;
