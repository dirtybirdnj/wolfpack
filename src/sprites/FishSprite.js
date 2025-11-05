import { OrganismSprite } from './OrganismSprite.js';
import { getOrganismData } from '../config/OrganismData.js';
import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';
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
const MALE_NAMES = [
    'Dave', 'Bob', 'Steve', 'Mike', 'Tom', 'Jim', 'Frank', 'Bill', 'Joe', 'Dan',
    'Rick', 'Gary', 'Larry', 'Barry', 'Jerry', 'Terry', 'Carl', 'Paul', 'Ron', 'Don',
    'Mark', 'John', 'Jeff', 'Pete', 'Chad', 'Brad', 'Kyle', 'Jake', 'Sam', 'Max'
];

const FEMALE_NAMES = [
    'Susan', 'Linda', 'Karen', 'Nancy', 'Betty', 'Lisa', 'Sarah', 'Emily', 'Mary', 'Anna',
    'Ruth', 'Carol', 'Diane', 'Janet', 'Julie', 'Kelly', 'Laura', 'Marie', 'Alice', 'Rose',
    'Grace', 'Helen', 'Donna', 'Joyce', 'Paula', 'Martha', 'Cindy', 'Sandy', 'Wendy', 'Pam'
];

/**
 * Unified FishSprite class
 */
export class FishSprite extends OrganismSprite {
    /**
     * @param {Phaser.Scene} scene - Game scene
     * @param {number} worldX - World X position
     * @param {number} y - Y position
     * @param {string} species - Species key from OrganismData (e.g., 'alewife', 'smallmouth_bass')
     * @param {string} size - Size category for predators ('SMALL', 'MEDIUM', 'LARGE')
     */
    constructor(scene, worldX, y, species, size = 'MEDIUM') {
        // Get species configuration
        const speciesData = getOrganismData(species);
        if (!speciesData) {
            console.error(`Unknown fish species: ${species}`);
            throw new Error(`Unknown fish species: ${species}`);
        }

        // Determine texture key based on fish type
        const textureKey = speciesData.category === 'prey' ?
            `baitfish_${species}` :
            `fish_${species}_${size}`;

        // Call parent constructor
        super(scene, worldX, y, textureKey);

        // Store species and type
        this.species = species;
        this.speciesData = speciesData;
        this.type = speciesData.category === 'prey' ? 'bait' : 'predator';

        // Set depth for rendering order (behind lure)
        this.setDepth(this.type === 'bait' ? 40 : 50);

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

        // Update screen position
        this.updateScreenPosition();
    }

    /**
     * Initialize predator fish properties
     * (from FishSprite.js)
     */
    initPredatorProperties(scene, size) {
        // Unique identifier
        this.id = `fish_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Size and weight (predators have variable sizes)
        this.sizeCategory = size;
        const sizeData = this.speciesData.size[size.toLowerCase()];
        if (!sizeData) {
            console.warn(`Invalid size ${size} for ${this.species}, using medium`);
            this.sizeData = this.speciesData.size.medium;
        } else {
            this.sizeData = sizeData;
        }

        this.weight = Utils.randomBetween(this.sizeData.weight.min, this.sizeData.weight.max);
        this.length = this.calculateLength();
        this.points = this.sizeData.points;

        // Speed and movement
        this.baseSpeed = this.speciesData.speed.base;
        this.speed = this.baseSpeed;

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
    initBaitProperties(scene) {
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
    calculateLength() {
        const params = this.speciesData.lengthWeightParams;
        if (!params) return Math.floor(this.weight * 2); // Fallback estimate

        const a = params.a || 0.00559;
        const b = params.b || 3.08;
        return Math.pow(this.weight / a, 1 / b);
    }

    /**
     * Calculate biological age (predators only)
     */
    calculateBiologicalAge() {
        const baseAge = this.speciesData.maturityAge || 4;
        const weightRatio = this.weight / (this.sizeData.weight.max || 10);
        return Math.floor(baseAge + (weightRatio * 10));
    }

    /**
     * Calculate sonar strength (predators only)
     */
    calculateSonarStrength() {
        return 0.5 + (this.weight / 50) * 0.5;
    }

    /**
     * Draw arrow showing swimming direction (debug, predators only)
     */
    drawDirectionArrow() {
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
            const endX = startX + (movement.x / speed) * arrowLength;
            const endY = startY + (movement.y / speed) * arrowLength;

            // Draw arrow line
            this.directionArrow.lineStyle(2, 0xff0000, 0.8);
            this.directionArrow.beginPath();
            this.directionArrow.moveTo(startX, startY);
            this.directionArrow.lineTo(endX, endY);
            this.directionArrow.strokePath();

            // Draw arrowhead
            const angle = Math.atan2(movement.y, movement.x);
            const arrowHeadSize = 8;
            this.directionArrow.fillStyle(0xff0000, 0.8);
            this.directionArrow.beginPath();
            this.directionArrow.moveTo(endX, endY);
            this.directionArrow.lineTo(
                endX - arrowHeadSize * Math.cos(angle - Math.PI / 6),
                endY - arrowHeadSize * Math.sin(angle - Math.PI / 6)
            );
            this.directionArrow.lineTo(
                endX - arrowHeadSize * Math.cos(angle + Math.PI / 6),
                endY - arrowHeadSize * Math.sin(angle + Math.PI / 6)
            );
            this.directionArrow.closePath();
            this.directionArrow.fillPath();
        }
    }

    /**
     * Phaser preUpdate - called automatically every frame
     * Delegates to type-specific update methods
     */
    preUpdate(time, delta) {
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
    updatePredator(time, delta) {
        // Update depth zone
        this.depth = this.y / GameConfig.DEPTH_SCALE;

        // Update AI
        if (this.ai) {
            const allFish = this.scene.fishes || [];
            const baitfishClouds = this.scene.getAdaptedSchoolsForAI ? this.scene.getAdaptedSchoolsForAI() : [];
            const crayfish = this.scene.crayfish || [];
            this.ai.update(this.scene.lure, this.scene.time.now, allFish, baitfishClouds, crayfish);
        }

        // Apply AI movement
        if (this.ai && this.ai.getMovementVector) {
            const movement = this.ai.getMovementVector();
            this.worldX += movement.x;
            this.y += movement.y;

            // Update rotation based on movement
            if (Math.abs(movement.x) > 0.1 || Math.abs(movement.y) > 0.1) {
                const isMovingRight = movement.x > 0;
                const targetAngle = Math.atan2(movement.y, Math.abs(movement.x));
                this.setFlipX(isMovingRight);
                this.angle = isMovingRight ? Phaser.Math.RadToDeg(targetAngle) : Phaser.Math.RadToDeg(-targetAngle);
            }
        }

        // Enforce boundaries
        this.enforceBoundaries();

        // Update hunger (if biological system enabled)
        if (this.hunger !== undefined) {
            this.hunger += 0.01 * this.metabolism;
            this.hunger = Math.min(100, this.hunger);
        }

        // Decay interest flash
        if (this.interestFlash > 0) {
            this.interestFlash -= this.interestFlashDecay;
        }

        // Update screen position and draw debug arrow
        this.updateScreenPosition();
        this.drawDirectionArrow();

        // Check if off-screen
        this.checkOffScreen();
    }

    /**
     * Update baitfish
     * (from BaitfishSprite.js preUpdate method)
     * Note: Boids movement is applied externally via applyBoidsMovement()
     */
    updateBait(time, delta) {
        // Update rotation based on velocity
        if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) {
            const isMovingRight = this.velocity.x > 0;
            const targetAngle = Math.atan2(this.velocity.y, Math.abs(this.velocity.x));
            this.setFlipX(isMovingRight);
            this.angle = isMovingRight ? Phaser.Math.RadToDeg(targetAngle) : Phaser.Math.RadToDeg(-targetAngle);
        }

        // Update screen position
        this.updateScreenPosition();

        // Check if off-screen
        this.checkOffScreen();
    }

    /**
     * Apply Boids movement (called by school update for baitfish)
     */
    applyBoidsMovement(separation, cohesion, alignment, foodAttraction = { x: 0, y: 0 }) {
        this.schooling.separation = separation;
        this.schooling.cohesion = cohesion;
        this.schooling.alignment = alignment;

        // Update velocity based on Boids forces (including food attraction)
        this.velocity.x += separation.x + cohesion.x + alignment.x + foodAttraction.x;
        this.velocity.y += separation.y + cohesion.y + alignment.y + foodAttraction.y;

        // Limit speed
        const currentSpeed = this.schooling.isPanicking ? this.panicSpeed : this.baseSpeed;
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
     * Check if fish is off-screen and deactivate
     */
    checkOffScreen() {
        const canvasWidth = this.scene.scale.width;
        const margin = 200;
        const isOffScreenHorizontally = this.x < -margin || this.x > canvasWidth + margin;

        if (isOffScreenHorizontally) {
            this.setActive(false);
            this.setVisible(false);
            if (this.directionArrow) {
                this.directionArrow.clear();
            }
        }
    }

    /**
     * Feed on prey (predators only)
     * @param {string} preySpecies - Species of prey consumed
     */
    feedOnPrey(preySpecies) {
        // Only predatory fish with biology system can feed
        if (this.type !== 'predator' || !this.hunger) {
            return;
        }

        // Record stomach contents
        if (this.stomachContents) {
            this.stomachContents.push({
                species: preySpecies,
                timestamp: this.age
            });
        }

        // Get nutrition value from prey
        const preyData = getOrganismData(preySpecies);
        const nutritionValue = preyData?.nutritionValue || 12;

        const previousHunger = this.hunger;
        this.hunger = Math.max(0, this.hunger - nutritionValue);
        this.lastFed = this.age;

        // Health restoration: excess nutrition restores health
        if (this.hunger === 0 && previousHunger > 0) {
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
     * Trigger visual interest flash (predators only, called by AI)
     */
    triggerInterestFlash(intensity = 0.5) {
        if (this.type === 'predator') {
            this.interestFlash = Math.max(this.interestFlash, intensity);
        }
    }

    /**
     * Get fish information for UI display
     */
    getInfo() {
        const baseInfo = super.getInfo();

        if (this.type === 'predator') {
            return {
                ...baseInfo,
                name: this.name,
                species: this.speciesData.name,
                gender: this.gender,
                biologicalAge: this.biologicalAge + ' years',
                weight: this.weight.toFixed(1) + ' lbs',
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
    reset(worldX, y, species, size = 'MEDIUM') {
        // Call parent reset
        super.reset(worldX, y);

        // Update species and type
        this.species = species;
        this.speciesData = getOrganismData(species);
        this.type = this.speciesData.category === 'prey' ? 'bait' : 'predator';

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
    destroy(fromScene) {
        if (this.ai) {
            this.ai = null;
        }
        if (this.directionArrow) {
            this.directionArrow.destroy();
            this.directionArrow = null;
        }
        super.destroy(fromScene);
    }
}

export default FishSprite;
