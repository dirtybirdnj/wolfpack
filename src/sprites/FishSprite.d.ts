import { OrganismSprite } from './OrganismSprite.js';
import { FishData } from '../config/OrganismData.js';
import { FishState, FishSizeCategory, FishSize } from '../utils/Constants.js';
import FishAI from '../entities/FishAI.js';
/**
 * Fish type: 'bait' for prey fish, 'predator' for game fish
 */
export type FishType = 'bait' | 'predator';
/**
 * Fish gender (predators only)
 */
export type FishGender = 'male' | 'female';
/**
 * Fish engagement state (predators only)
 */
export type EngagementState = 'waiting' | 'attacking' | 'loitering';
/**
 * 2D velocity vector
 */
export interface Velocity {
    x: number;
    y: number;
}
/**
 * Schooling behavior forces (Boids algorithm)
 */
export interface SchoolingForces {
    separation: Velocity;
    cohesion: Velocity;
    alignment: Velocity;
    isPanicking?: boolean;
    panicSpeed?: number;
    scaredLevel?: number;
}
/**
 * Depth zone with behavior modifiers
 */
export interface DepthZone {
    min: number;
    max: number;
    name: string;
    speedMultiplier: number;
    aggressivenessBonus: number;
    interestThreshold: number;
}
/**
 * Stomach contents entry (predators only)
 */
export interface StomachContent {
    species: string;
    timestamp: number;
}
/**
 * Extended OrganismInfo with fish-specific data
 */
export interface FishInfo {
    worldX: string;
    screenX: string;
    y: string;
    depth: string;
    frameAge: number;
    consumed: boolean;
    active: boolean;
    visible: boolean;
    name?: string;
    species: string;
    gender?: FishGender;
    biologicalAge?: string;
    weight?: string;
    length?: string;
    state?: FishState;
    points?: number;
    hunger?: string;
    health?: string;
    inFrenzy?: boolean;
    frenzyIntensity?: string;
    schoolId?: string | null;
    isPanicking?: boolean;
}
/**
 * Unified FishSprite class
 */
export declare class FishSprite extends OrganismSprite {
    id: string;
    species: string;
    speciesData: FishData;
    type: FishType;
    size: number | FishSize;
    length: number;
    baseSpeed: number;
    speed: number;
    velocity: Velocity;
    schoolId: string | null;
    schooling: SchoolingForces;
    sizeCategory?: FishSizeCategory;
    weight?: number;
    points?: number;
    depthZone?: DepthZone;
    biologicalAge?: number;
    gender?: FishGender;
    name?: string;
    ai?: FishAI;
    sonarStrength?: number;
    caught?: boolean;
    hunger?: number;
    health?: number;
    lastFed?: number;
    metabolism?: number;
    inFrenzy?: boolean;
    frenzyTimer?: number;
    frenzyIntensity?: number;
    frenzyTargetCloud?: any;
    stomachContents?: StomachContent[];
    interestFlash?: number;
    interestFlashDecay?: number;
    speedPreference?: number;
    swipeChances?: number;
    maxSwipeChances?: number;
    isEngaged?: boolean;
    engagementState?: EngagementState;
    lastStateChange?: number;
    isFastFleeing?: boolean;
    hasCalmedDown?: boolean;
    directionArrow?: Phaser.GameObjects.Graphics;
    panicSpeed?: number;
    lastFeedTime?: number;
    feedCooldown?: number;
    depthInFeet?: number;
    /**
     * @param scene - Game scene
     * @param worldX - World X position
     * @param y - Y position
     * @param species - Species key from OrganismData (e.g., 'alewife', 'smallmouth_bass')
     * @param size - Size category for predators ('SMALL', 'MEDIUM', 'LARGE')
     */
    constructor(scene: Phaser.Scene, worldX: number, y: number, species: string, size?: FishSizeCategory);
    /**
     * Initialize predator fish properties
     * (from FishSprite.js)
     */
    private initPredatorProperties;
    /**
     * Initialize baitfish properties
     * (from BaitfishSprite.js)
     */
    private initBaitProperties;
    /**
     * Calculate fish length from weight (predators only)
     */
    private calculateLength;
    /**
     * Calculate biological age (predators only)
     */
    private calculateBiologicalAge;
    /**
     * Calculate sonar strength (predators only)
     */
    private calculateSonarStrength;
    /**
     * Get depth zone based on current depth (needed by FishAI)
     * @returns Depth zone with name, speedMultiplier, aggressivenessBonus, interestThreshold
     */
    getDepthZone(): DepthZone;
    /**
     * Draw arrow showing swimming direction (debug, predators only)
     */
    private drawDirectionArrow;
    /**
     * Phaser preUpdate - called automatically every frame
     * Delegates to type-specific update methods
     */
    preUpdate(time: number, delta: number): void;
    /**
     * Update predator fish
     * (from FishSprite.js updateFish method)
     */
    private updatePredator;
    /**
     * Update baitfish
     * (from BaitfishSprite.js preUpdate method)
     * Note: Boids movement is applied externally via applyBoidsMovement()
     */
    private updateBait;
    /**
     * Apply Boids movement (called by school update for baitfish)
     */
    applyBoidsMovement(separation: Velocity, cohesion: Velocity, alignment: Velocity, foodAttraction?: Velocity): void;
    /**
     * Feed on prey (predators only)
     * @param preySpecies - Species of prey consumed
     */
    feedOnPrey(preySpecies: string): void;
    /**
     * Feed on baitfish (alias for feedOnPrey, needed by FishAI)
     * @param preySpecies - Species of baitfish consumed
     */
    feedOnBaitfish(preySpecies: string): void;
    /**
     * Feed on crayfish (needed by FishAI)
     */
    feedOnCrayfish(): void;
    /**
     * Trigger visual interest flash (predators only, called by AI)
     */
    triggerInterestFlash(intensity?: number): void;
    /**
     * Get fish information for UI display
     */
    getInfo(): FishInfo;
    /**
     * Reset fish for object pooling
     */
    reset(worldX: number, y: number, species?: string, size?: FishSizeCategory): void;
    /**
     * Clean up fish
     */
    destroy(fromScene?: boolean): void;
}
export default FishSprite;
//# sourceMappingURL=FishSprite.d.ts.map