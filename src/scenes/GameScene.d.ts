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
export class GameScene {
    fishes: any[];
    zooplankton: any[];
    crayfish: any[];
    selectedFish: any;
    spawnMode: boolean;
    selectedSpawnButton: number;
    /**
     * Select a fish to show detailed info
     */
    selectFish(fish: any): void;
    fishCaught: number;
    fishLost: number;
    gameTime: number;
    waterTemp: number;
    debugMode: boolean;
    visionRangeDebug: boolean;
    currentFight: FishFight | null;
    controllerTestMode: boolean;
    controllerTestUI: {
        overlay: any;
        windowBg: any;
        title: any;
        instructions: any;
        statusTexts: {
            dpadUp: any;
            dpadDown: any;
            dpadLeft: any;
            dpadRight: any;
            buttonA: any;
            buttonB: any;
            buttonX: any;
            buttonY: any;
            l1: any;
            r1: any;
            l2: any;
            r2: any;
            leftStick: any;
            rightStick: any;
        };
        okButton: any;
        okText: any;
    } | null;
    selectedFishId: any;
    hooksetWindow: {
        active: boolean;
        fish: null;
        startTime: number;
        duration: number;
        hasHookset: boolean;
    };
    jigDetection: {
        lastStickY: number;
        jigCount: number;
        lastJigTime: number;
        jigTimeout: number;
        needsReset: boolean;
        threshold: number;
    };
    caughtFishData: any[];
    spawningSystem: SpawningSystem | null;
    inputSystem: InputSystem | null;
    collisionSystem: CollisionSystem | null;
    debugSystem: DebugSystem | null;
    schoolManager: SchoolManager | null;
    foodChainSystem: FoodChainSystem | null;
    notificationSystem: NotificationSystem | null;
    tackleBoxOpen: boolean;
    tackleBoxTab: number;
    tackleBoxSelected: {
        lure: number;
        line: number;
        reel: number;
        lineTest: number;
    };
    lineTabFocus: number;
    switchingToPauseMenu: boolean;
    catchPopupActive: boolean;
    tackleBoxButtonStates: {
        select: boolean;
        circle: boolean;
        start: boolean;
        left: boolean;
        right: boolean;
        up: boolean;
        down: boolean;
        x: boolean;
    };
    tackleBoxGear: {
        lureWeights: {
            label: string;
            value: number;
            desc: string;
        }[];
        lineTypes: {
            label: string;
            value: string;
            desc: string;
        }[];
        lineTestStrengths: {
            label: string;
            value: number;
            desc: string;
        }[];
        reelTypes: {
            label: string;
            value: string;
            desc: string;
        }[];
    };
    tackleBoxGraphics: any;
    /**
     * Create game scene and initialize all systems
     */
    create(): void;
    fishingType: any;
    maxDepth: any;
    depthConverter: DepthConverter | undefined;
    lure: Lure | undefined;
    fishingLine: FishingLine | undefined;
    fishingLineModel: FishingLineModel | undefined;
    reelModel: ReelModel | undefined;
    gamepadDisconnectedHandler: ((gamepad: any) => void) | undefined;
    gamepadConnectedHandler: ((gamepad: any) => void) | undefined;
    /**
     * Set water temperature (ice fishing only)
     */
    initializeWaterTemp(): void;
    /**
     * Initialize creature groups with Phaser pooling
     * Now using Phaser Groups for automatic rendering and object pooling
     */
    initializeCreatureGroups(): void;
    fishGroup: any;
    crayfishGroup: any;
    zooplanktonGroup: any;
    baitfishSchools: any;
    schools: any;
    /**
     * Get ALL fish (predators + baitfish) - unified access for systems
     * @returns {Array} All fish sprites
     */
    getAllFish(): any[];
    /**
     * Get all active organisms (for collision detection, AI, etc.)
     * @returns {Object} All organisms by type
     */
    getAllOrganisms(): Object;
    /**
     * Spawn a fish from the object pool
     * @param {number} worldX - World X position
     * @param {number} y - Y position
     * @param {string} size - Fish size category
     * @param {string} species - Fish species
     * @returns {FishSprite} The spawned fish
     */
    spawnPooledFish(worldX: number, y: number, size: string, species: string): FishSprite;
    /**
     * Initialize all game systems
     */
    initializeSystems(): void;
    /**
     * Main update loop - orchestrates all systems
     * @param {number} time - Current game time
     * @param {number} delta - Time since last frame
     */
    update(time: number, delta: number): void;
    /**
     * Update fish status display in GameHUD
     */
    updateFishStatusDisplay(): void;
    /**
     * Wrapper for debug panel - delegates to SpawningSystem
     */
    trySpawnFish(): void;
    /**
     * Spawn a baitfish school using unified Fish class with Boids algorithm
     * @param {number} worldX - World X position
     * @param {number} y - Screen Y position
     * @param {number} count - Number of fish in school
     * @param {string} species - Species name (rainbow_smelt, alewife, sculpin)
     */
    spawnBaitfishSchool(worldX: number, y: number, count: number, species?: string): void;
    /**
     * Wrapper method for spawning baitfish cloud via spawning system
     * Used by spawn mode UI for consistency with NatureSimulationScene
     */
    trySpawnBaitfishCloud(): void;
    /**
     * Get the player's center position (always at center of actual canvas width)
     * This adapts to any screen size/resolution
     */
    getPlayerCenterX(): number;
    /**
     * Render fog effects and fish counts behind baitfish schools
     * NOTE: This is a perfect test case for future shader implementation!
     * For now using simple graphics, but shaders could make this look amazing.
     */
    renderSchoolEffects(): void;
    schoolEffectsGraphics: any;
    schoolCountTexts: any[] | undefined;
    /**
     * Fish whistle - spawn trophy fish of each species + large bait clouds
     */
    spawnFishWhistleFish(): void;
    /**
     * Update all entities (fish, baitfish, zooplankton, crayfish)
     */
    /**
     * Adapt new schools to look like old BaitfishClouds for FishAI compatibility
     * This creates a bridge layer so predators can hunt the new baitfish schools
     * @returns {Array} Array of cloud-like objects that FishAI can understand
     */
    getAdaptedSchoolsForAI(): any[];
    updateEntities(): void;
    zooplanktonGraphics: any;
    /**
     * Update fish fight mechanics
     * @param {number} time - Current game time
     */
    updateFishFight(time: number): void;
    /**
     * Handle fish strike event - opens hookset window
     * @param {Fish} fish - The fish that struck at the lure
     */
    handleFishStrike(fish: Fish): void;
    /**
     * Handle fish caught event (start fish fight)
     * @param {Fish} fish - The fish that was caught
     */
    handleFishCaught(fish: Fish): void;
    /**
     * Handle fish bump event - haptic feedback based on line sensitivity
     * @param {Fish} fish - The fish that bumped the lure
     */
    handleFishBump(fish: Fish): void;
    /**
     * Summon all pike on screen to attack the lure once
     */
    summonPikeAttack(): void;
    /**
     * Trigger gamepad rumble
     * @param {number} duration - Rumble duration in ms
     * @param {number} strongMagnitude - Strong motor magnitude (0-1)
     * @param {number} weakMagnitude - Weak motor magnitude (0-1)
     */
    rumbleGamepad(duration?: number, strongMagnitude?: number, weakMagnitude?: number): void;
    /**
     * Update speed display in UI
     */
    updateSpeedDisplay(): void;
    /**
     * Show controller test window (debug feature)
     */
    showControllerTest(): void;
    controllerTestUpdate: (() => void) | null | undefined;
    createTestText(x: any, y: any, label: any): any;
    updateTestButton(textObj: any, isPressed: any): void;
    closeControllerTest(): void;
    /**
     * Toggle tackle box menu
     */
    toggleTackleBox(): void;
    /**
     * Handle tackle box input
     */
    handleTackleBoxInput(): void;
    /**
     * Render tackle box UI
     */
    renderTackleBox(): void;
    /**
     * Clean up scene resources
     */
    shutdown(): void;
}
export default GameScene;
import FishFight from '../entities/FishFight.js';
import SpawningSystem from './systems/SpawningSystem.js';
import InputSystem from './systems/InputSystem.js';
import CollisionSystem from './systems/CollisionSystem.js';
import DebugSystem from './systems/DebugSystem.js';
import SchoolManager from '../systems/SchoolManager.js';
import FoodChainSystem from '../systems/FoodChainSystem.js';
import NotificationSystem from './systems/NotificationSystem.js';
import DepthConverter from '../utils/DepthConverter.js';
import Lure from '../entities/Lure.js';
import FishingLine from '../entities/FishingLine.js';
import { FishingLineModel } from '../models/FishingLineModel.js';
import { ReelModel } from '../models/ReelModel.js';
import { FishSprite } from '../sprites/FishSprite.js';
//# sourceMappingURL=GameScene.d.ts.map