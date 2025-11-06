import { OrganismSprite } from './OrganismSprite.js';
import { getOrganismData, FishData } from '../config/OrganismData.js';
import GameConfig from '../config/GameConfig.js';
import { Constants, Utils, FishState, FishSizeCategory, FishSize } from '../utils/Constants.js';
import FishAI from '../entities/FishAI.js';

/**
 * FishSprite - Unified fish class for ALL fish types (bait and predators)
 *
 * Extends OrganismSprite to provide consistent architecture with other water organisms
 * Uses component composition pattern for different behaviors:
 * - Schooling (all fish can school, with different parameters)
 * - Hunting (predators only)
 * - Biology (predators only: hunger, health, metabolism)
 *
 * fish.type determines behavior:
 * - 'bait': Small schooling fish, prey only, Boids behavior
 * - 'predator': Game fish with AI, hunting, biology systems
 *
 * Debug Settings:
 * DEBUG_SHOW_DIRECTION_ARROWS: Show red arrows indicating fish movement direction
 */
const DEBUG_SHOW_DIRECTION_ARROWS = true;

// Fish name pools (for predators)
const MALE_NAMES: string[] = [
    'Dave', 'Bob', 'Steve', 'Mike', 'Tom', 'Jim', 'Frank', 'Bill', 'Joe', 'Dan',
    'Rick', 'Gary', 'Larry', 'Barry', 'Jerry', 'Terry', 'Carl', 'Paul', 'Ron', 'Don',
    'Mark', 'John', 'Jeff', 'Pete', 'Chad', 'Brad', 'Kyle', 'Jake', 'Sam', 'Max'
];

const FEMALE_NAMES: string[] = [
    'Susan', 'Linda', 'Karen', 'Nancy', 'Betty', 'Lisa', 'Sarah', 'Emily', 'Mary', 'Anna',
    'Ruth', 'Carol', 'Diane', 'Janet', 'Julie', 'Kelly', 'Laura', 'Marie', 'Alice', 'Rose',
    'Grace', 'Helen', 'Donna', 'Joyce', 'Paula', 'Martha', 'Cindy', 'Sandy', 'Wendy', 'Pam'
];

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
export class FishSprite extends OrganismSprite {
    // Common properties
    public id: string;
    public species: string;
    public speciesData: FishData;
    public type: FishType;
    public size: number | FishSize;
    public length: number;
    public baseSpeed: number;
    public speed: number;
    public velocity: Velocity;
    public schoolId: string | null;
    public schooling: SchoolingForces;

    // Predator-specific properties
    public sizeCategory?: FishSizeCategory;
    public weight?: number;
    public points?: number;
    public depthZone?: DepthZone;
    public biologicalAge?: number;
    public gender?: FishGender;
    public name?: string;
    public ai?: FishAI;
    public sonarStrength?: number;
    public caught?: boolean;
    public hunger?: number;
    public health?: number;
    public lastFed?: number;
    public metabolism?: number;
    public inFrenzy?: boolean;
    public frenzyTimer?: number;
    public frenzyIntensity?: number;
    public frenzyTargetCloud?: any;
    public stomachContents?: StomachContent[];
    public interestFlash?: number;
    public interestFlashDecay?: number;
    public speedPreference?: number;
    public swipeChances?: number;
    public maxSwipeChances?: number;
    public isEngaged?: boolean;
    public engagementState?: EngagementState;
    public lastStateChange?: number;
    public isFastFleeing?: boolean;
    public hasCalmedDown?: boolean;
    public directionArrow?: Phaser.GameObjects.Graphics;

    // Baitfish-specific properties
    public panicSpeed?: number;
    public lastFeedTime?: number;
    public feedCooldown?: number;
    public depthInFeet?: number;

    /**
     * @param scene - Game scene
     * @param worldX - World X position
     * @param y - Y position
     * @param species - Species key from OrganismData (e.g., 'alewife', 'smallmouth_bass')
     * @param size - Size category for predators ('SMALL', 'MEDIUM', 'LARGE')
     */
    constructor(scene: Phaser.Scene, worldX: number, y: number, species: string, size: FishSizeCategory = 'MEDIUM') {
        // Get species configuration
        const speciesData = getOrganismData(species) as FishData | undefined;
        if (!speciesData) {
            console.error(`Unknown fish species: ${species}`);
            throw new Error(`Unknown fish species: ${species}`);
        }

        // Determine texture key based on fish type
        // Both 'prey' and 'predator_prey' use baitfish textures when spawned in schools
        const textureKey = (speciesData.category === 'prey' || speciesData.category === 'predator_prey') ?
            `baitfish_${species}` :
            `fish_${species}_${size}`;

        // Call parent constructor
        super(scene, worldX, y, textureKey);

        // Store species and type
        this.species = species;
        this.speciesData = speciesData;
        // 'prey' and 'predator_prey' act as baitfish, only pure 'predator' gets full AI
        this.type = (speciesData.category === 'prey' || speciesData.category === 'predator_prey') ? 'bait' : 'predator';

        // Set depth for rendering order (behind lure at 60, baitfish at 40, predators at 50)
        this.setDepth(this.type === 'bait' ? 40 : 50);

        // Initialize common properties (will be set in init methods)
        this.id = '';
        this.size = 1;
        this.length = 0;
        this.baseSpeed = 0;
        this.speed = 0;
        this.velocity = { x: 0, y: 0 };
        this.schoolId = null;
        this.schooling = {
            separation: { x: 0, y: 0 },
            cohesion: { x: 0, y: 0 },
            alignment: { x: 0, y: 0 }
        };

        // Initialize properties based on type
        if (this.type === 'predator') {
            this.initPredatorProperties(scene, size);
        } else {
            this.initBaitProperties(scene);
        }

        // Create direction arrow for debug (predators only for now)
        if (DEBUG_SHOW_DIRECTION_ARROWS && this.type === 'predator') {
            this.directionArrow = scene.add.graphics();
            this.directionArrow.setDepth(this.depth + 10);
        }

        // Update screen position (parent OrganismSprite now handles setVisible/setActive)
        this.updateScreenPosition();
    }

    /**
     * Initialize predator fish properties
     * (from FishSprite.js)
     */
    private initPredatorProperties(scene: Phaser.Scene, size: FishSizeCategory): void {
        // Unique identifier
        this.id = `fish_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Size and weight (predators have variable sizes)
        this.sizeCategory = size;
        this.size = Constants.FISH_SIZE[size];
        if (!this.size) {
            console.warn(`Invalid size ${size} for ${this.species}, using MEDIUM`);
            this.size = Constants.FISH_SIZE.MEDIUM;
        }

        this.weight = Utils.randomBetween(this.size.min, this.size.max);
        this.length = this.calculateLength();
        this.points = this.size.points;

        // Speed and movement
        this.baseSpeed = this.speciesData.speed.base;
        this.speed = this.baseSpeed;

        // Depth zone behavior (needed by FishAI)
        this.depthZone = this.getDepthZone();
        this.speed = this.baseSpeed * this.depthZone.speedMultiplier;

        // Biological age
        this.biologicalAge = this.calculateBiologicalAge();

        // Personality (predators have names and gender)
        this.gender = Math.random() < 0.5 ? 'male' : 'female';
        this.name = this.gender === 'male'
            ? MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)]
            : FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)];

        // AI controller (predators only)
        if (this.speciesData.hunting?.enabled) {
            this.ai = new FishAI(this);
        }

        // Sonar strength
        this.sonarStrength = this.calculateSonarStrength();

        // State
        this.caught = false;

        // Biological properties (predators only)
        if (this.speciesData.biology) {
            this.hunger = Utils.randomBetween(75, 95);
            this.health = Utils.randomBetween(40, 70);
            this.lastFed = 0;
            this.metabolism = Utils.randomBetween(0.8, 1.2);

            // Frenzy behavior
            this.inFrenzy = false;
            this.frenzyTimer = 0;
            this.frenzyIntensity = 0;
            this.frenzyTargetCloud = null;

            // Stomach contents
            this.stomachContents = [];
        }

        // Visual feedback
        this.interestFlash = 0;
        this.interestFlashDecay = 0.02;

        // Chase mechanics
        this.speedPreference = Utils.randomBetween(1.0, 4.0);
        this.swipeChances = 0;
        this.maxSwipeChances = 0;
        this.isEngaged = false;
        this.engagementState = 'waiting';
        this.lastStateChange = 0;
        this.isFastFleeing = false;
        this.hasCalmedDown = false;

        // Schooling velocity (if schooling enabled)
        if (this.speciesData.schooling?.enabled) {
            this.velocity = {
                x: Utils.randomBetween(-0.5, 0.5),
                y: Utils.randomBetween(-0.2, 0.2)
            };
            this.schoolId = null;
            this.schooling = {
                separation: { x: 0, y: 0 },
                cohesion: { x: 0, y: 0 },
                alignment: { x: 0, y: 0 }
            };
        }
    }

    /**
     * Initialize baitfish properties
     * (from BaitfishSprite.js)
     */
    private initBaitProperties(scene: Phaser.Scene): void {
        // Unique identifier
        this.id = `baitfish_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Size (baitfish are small, use species sizeRange)
        this.size = 1;
        this.length = this.speciesData.sizeRange ?
            (this.speciesData.sizeRange.min + this.speciesData.sizeRange.max) / 2 : 6;

        // Speed from species data
        this.baseSpeed = this.speciesData.speed.base;
        this.speed = this.baseSpeed;
        this.panicSpeed = this.speciesData.speed.panic;

        // Feeding cooldown - prevent individual fish from hogging food
        this.lastFeedTime = 0;
        this.feedCooldown = 1000; // 1 second between feedings

        // Schooling behavior (Boids) - all baitfish school
        this.schoolId = null;
        this.schooling = {
            separation: { x: 0, y: 0 },
            cohesion: { x: 0, y: 0 },
            alignment: { x: 0, y: 0 },
            isPanicking: false,
            panicSpeed: this.panicSpeed,
            scaredLevel: 0
        };

        // Velocity for Boids
        this.velocity = {
            x: Utils.randomBetween(-0.5, 0.5),
            y: Utils.randomBetween(-0.2, 0.2)
        };
    }

    /**
     * Calculate fish length from weight (predators only)
     */
    private calculateLength(): number {
        const params = this.speciesData.lengthWeightParams;
        if (!params) return Math.floor((this.weight || 0) * 2); // Fallback estimate

        const a = params.a || 0.00559;
        const b = params.b || 3.08;
        return Math.pow((this.weight || 0) / a, 1 / b);
    }

    /**
     * Calculate biological age (predators only)
     */
    private calculateBiologicalAge(): number {
        const baseAge = this.speciesData.maturityAge || 4;
        const weightRatio = (this.weight || 10) / ((this.size as FishSize).max || 10);
        return Math.floor(baseAge + (weightRatio * 10));
    }

    /**
     * Calculate sonar strength (predators only)
     */
    private calculateSonarStrength(): number {
        return 0.5 + ((this.weight || 0) / 50) * 0.5;
    }

    /**
     * Get depth zone based on current depth (needed by FishAI)
     * @returns Depth zone with name, speedMultiplier, aggressivenessBonus, interestThreshold
     */
    public getDepthZone(): DepthZone {
        const depth = this.getDepth();
        const zones = GameConfig.DEPTH_ZONES;

        // Check depth against each zone
        if (depth >= zones.BOTTOM.min && depth <= zones.BOTTOM.max) {
            return zones.BOTTOM;
        } else if (depth >= zones.MID_COLUMN.min && depth < zones.MID_COLUMN.max) {
            return zones.MID_COLUMN;
        } else {
            return zones.SURFACE;
        }
    }

    /**
     * Draw arrow showing swimming direction (debug, predators only)
     */
    private drawDirectionArrow(): void {
        if (!DEBUG_SHOW_DIRECTION_ARROWS || !this.directionArrow || this.type !== 'predator') {
            return;
        }

        this.directionArrow.clear();

        if (!this.visible || !this.ai || !this.ai.getMovementVector) {
            return;
        }

        const movement = this.ai.getMovementVector();
        const speed = Math.sqrt(movement.x * movement.x + movement.y * movement.y);

        if (speed > 0.1) {
            const arrowLength = 30;
            const startX = this.x;
            const startY = this.y;

            // Convert sprite angle to radians and account for flip
            const angleRad = Phaser.Math.DegToRad(this.angle);
            const flipMultiplier = this.flipX ? -1 : 1;

            // Calculate arrow direction matching sprite's visual orientation
            const endX = startX + flipMultiplier * Math.cos(angleRad) * arrowLength;
            const endY = startY + Math.sin(angleRad) * arrowLength;

            // Draw arrow line
            this.directionArrow.lineStyle(2, 0xff0000, 0.8);
            this.directionArrow.beginPath();
            this.directionArrow.moveTo(startX, startY);
            this.directionArrow.lineTo(endX, endY);
            this.directionArrow.strokePath();

            // Draw arrowhead
            const arrowAngle = Math.atan2(endY - startY, endX - startX);
            const arrowHeadSize = 8;
            this.directionArrow.fillStyle(0xff0000, 0.8);
            this.directionArrow.beginPath();
            this.directionArrow.moveTo(endX, endY);
            this.directionArrow.lineTo(
                endX - arrowHeadSize * Math.cos(arrowAngle - Math.PI / 6),
                endY - arrowHeadSize * Math.sin(arrowAngle - Math.PI / 6)
            );
            this.directionArrow.lineTo(
                endX - arrowHeadSize * Math.cos(arrowAngle + Math.PI / 6),
                endY - arrowHeadSize * Math.sin(arrowAngle + Math.PI / 6)
            );
            this.directionArrow.closePath();
            this.directionArrow.fillPath();
        }
    }

    /**
     * Phaser preUpdate - called automatically every frame
     * Delegates to type-specific update methods
     */
    preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        if (this.type === 'predator') {
            this.updatePredator(time, delta);
        } else {
            this.updateBait(time, delta);
        }
    }

    /**
     * Update predator fish
     * (from FishSprite.js updateFish method)
     */
    private updatePredator(time: number, delta: number): void {
        // Update depth in feet (for AI/game logic, NOT rendering depth!)
        this.depthInFeet = this.y / GameConfig.DEPTH_SCALE;
        this.depthZone = this.getDepthZone();
        this.speed = this.baseSpeed * this.depthZone.speedMultiplier;

        // Update AI
        if (this.ai) {
            const allFish = (this.scene as any).fishes || [];
            const baitfishClouds = (this.scene as any).getAdaptedSchoolsForAI ? (this.scene as any).getAdaptedSchoolsForAI() : [];
            const crayfish = (this.scene as any).crayfish || [];
            this.ai.update((this.scene as any).lure, this.scene.time.now, allFish, baitfishClouds, crayfish);
        }

        // Apply AI movement
        if (this.ai && this.ai.getMovementVector) {
            const movement = this.ai.getMovementVector();
            this.worldX += movement.x;
            this.y += movement.y;

            // Update rotation based on movement
            if (Math.abs(movement.x) > 0.1 || Math.abs(movement.y) > 0.1) {
                const isMovingRight = movement.x > 0;
                // Calculate angle using actual velocity direction
                const targetAngle = Math.atan2(movement.y, movement.x);
                this.setFlipX(!isMovingRight); // Flip when moving left
                // Convert to degrees, adjust angle when flipped
                this.angle = isMovingRight ?
                    Phaser.Math.RadToDeg(targetAngle) :
                    Phaser.Math.RadToDeg(Math.PI - targetAngle);
            }
        }

        // Enforce boundaries
        this.enforceBoundaries();

        // Update hunger (if biological system enabled)
        if (this.hunger !== undefined && this.metabolism !== undefined) {
            this.hunger += 0.01 * this.metabolism;
            this.hunger = Math.min(100, this.hunger);
        }

        // Decay interest flash
        if (this.interestFlash !== undefined && this.interestFlash > 0 && this.interestFlashDecay !== undefined) {
            this.interestFlash -= this.interestFlashDecay;
        }

        // Update screen position and draw debug arrow
        this.updateScreenPosition();
        this.drawDirectionArrow();
    }

    /**
     * Update baitfish
     * (from BaitfishSprite.js preUpdate method)
     * Note: Boids movement is applied externally via applyBoidsMovement()
     */
    private updateBait(time: number, delta: number): void {
        // Update rotation based on velocity
        if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) {
            const isMovingRight = this.velocity.x > 0;
            // Calculate angle using actual velocity direction
            const targetAngle = Math.atan2(this.velocity.y, this.velocity.x);
            this.setFlipX(!isMovingRight); // Flip when moving left
            // Convert to degrees, adjust angle when flipped
            this.angle = isMovingRight ?
                Phaser.Math.RadToDeg(targetAngle) :
                Phaser.Math.RadToDeg(Math.PI - targetAngle);
        }

        // Update screen position
        this.updateScreenPosition();

        // Enforce boundaries (parent method handles off-screen detection)
        this.enforceBoundaries();
    }

    /**
     * Apply Boids movement (called by school update for baitfish)
     */
    public applyBoidsMovement(separation: Velocity, cohesion: Velocity, alignment: Velocity, foodAttraction: Velocity = { x: 0, y: 0 }): void {
        this.schooling.separation = separation;
        this.schooling.cohesion = cohesion;
        this.schooling.alignment = alignment;

        // Update velocity based on Boids forces (including food attraction)
        this.velocity.x += separation.x + cohesion.x + alignment.x + foodAttraction.x;
        this.velocity.y += separation.y + cohesion.y + alignment.y + foodAttraction.y;

        // Limit speed
        const currentSpeed = this.schooling.isPanicking ? (this.panicSpeed || this.baseSpeed) : this.baseSpeed;
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        if (speed > currentSpeed) {
            this.velocity.x = (this.velocity.x / speed) * currentSpeed;
            this.velocity.y = (this.velocity.y / speed) * currentSpeed;
        }

        // Apply velocity to position
        this.worldX += this.velocity.x;
        this.y += this.velocity.y;

        // Enforce boundaries
        this.enforceBoundaries();

        // If at boundary, clamp velocity to prevent bouncing
        const canvasHeight = this.scene.scale.height;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);

        if (this.y <= GameConfig.WATER_SURFACE_Y) {
            this.velocity.y = Math.max(0, this.velocity.y); // Force downward only
        } else if (this.y >= waterFloorY) {
            this.velocity.y = Math.min(0, this.velocity.y); // Force upward only
        }

        // Update depth
        this.depth = this.y / GameConfig.DEPTH_SCALE;
    }


    /**
     * Feed on prey (predators only)
     * @param preySpecies - Species of prey consumed
     */
    public feedOnPrey(preySpecies: string): void {
        // Only predatory fish with biology system can feed
        if (this.type !== 'predator' || !this.hunger) {
            return;
        }

        // Record stomach contents
        if (this.stomachContents) {
            this.stomachContents.push({
                species: preySpecies,
                timestamp: this.frameAge
            });
        }

        // Get nutrition value from prey
        const preyData = getOrganismData(preySpecies);
        const nutritionValue = preyData?.nutritionValue || 12;

        const previousHunger = this.hunger;
        this.hunger = Math.max(0, this.hunger - nutritionValue);
        this.lastFed = this.frameAge;

        // Health restoration: excess nutrition restores health
        if (this.hunger === 0 && previousHunger > 0 && this.health !== undefined) {
            const excessNutrition = nutritionValue - previousHunger;

            if (excessNutrition > 0) {
                const healthGain = excessNutrition * 0.5; // 50% conversion rate
                const previousHealth = this.health;
                this.health = Math.min(100, this.health + healthGain);
                const actualHealthGain = this.health - previousHealth;

                if (actualHealthGain > 0) {
                    console.log(`${this.name} full! Restored ${actualHealthGain.toFixed(1)} health (now ${Math.floor(this.health)}%)`);
                }
            }
        }
    }

    /**
     * Feed on baitfish (alias for feedOnPrey, needed by FishAI)
     * @param preySpecies - Species of baitfish consumed
     */
    public feedOnBaitfish(preySpecies: string): void {
        return this.feedOnPrey(preySpecies);
    }

    /**
     * Feed on crayfish (needed by FishAI)
     */
    public feedOnCrayfish(): void {
        return this.feedOnPrey('crayfish');
    }

    /**
     * Trigger visual interest flash (predators only, called by AI)
     */
    public triggerInterestFlash(intensity: number = 0.5): void {
        if (this.type === 'predator' && this.interestFlash !== undefined) {
            this.interestFlash = Math.max(this.interestFlash, intensity);
        }
    }

    /**
     * Get fish information for UI display
     */
    public getInfo(): FishInfo {
        const baseInfo = super.getInfo();

        if (this.type === 'predator') {
            return {
                ...baseInfo,
                name: this.name,
                species: this.speciesData.name,
                gender: this.gender,
                biologicalAge: (this.biologicalAge || 0) + ' years',
                weight: (this.weight || 0).toFixed(1) + ' lbs',
                length: Math.floor(this.length) + ' in',
                state: this.ai ? this.ai.state : 'unknown',
                points: this.points,
                hunger: this.hunger ? Math.floor(this.hunger) + '%' : 'N/A',
                health: this.health ? Math.floor(this.health) + '%' : 'N/A',
                inFrenzy: this.inFrenzy || false,
                frenzyIntensity: this.frenzyIntensity ? this.frenzyIntensity.toFixed(2) : '0.00'
            };
        } else {
            // Baitfish info
            return {
                ...baseInfo,
                species: this.speciesData.name,
                length: Math.floor(this.length) + ' in',
                schoolId: this.schoolId || 'none',
                isPanicking: this.schooling?.isPanicking || false
            };
        }
    }

    /**
     * Reset fish for object pooling
     */
    public reset(worldX: number, y: number, species?: string, size: FishSizeCategory = 'MEDIUM'): void {
        // Call parent reset
        super.reset(worldX, y);

        // Update species and type if provided
        if (species) {
            this.species = species;
            this.speciesData = getOrganismData(species) as FishData;
            this.type = this.speciesData.category === 'prey' ? 'bait' : 'predator';
        }

        // Re-initialize properties
        if (this.type === 'predator') {
            this.initPredatorProperties(this.scene, size);

            // Recreate direction arrow if needed
            if (DEBUG_SHOW_DIRECTION_ARROWS && !this.directionArrow) {
                this.directionArrow = this.scene.add.graphics();
                this.directionArrow.setDepth(this.depth + 10);
            }
        } else {
            this.initBaitProperties(this.scene);
        }

        this.updateScreenPosition();
    }

    /**
     * Clean up fish
     */
    public destroy(fromScene?: boolean): void {
        if (this.ai) {
            this.ai = undefined;
        }
        if (this.directionArrow) {
            this.directionArrow.destroy();
            this.directionArrow = undefined;
        }
        super.destroy(fromScene);
    }
}

export default FishSprite;
