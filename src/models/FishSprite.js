import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import FishAI from '../entities/FishAI.js';
import { getPredatorSpecies, getBaitfishSpecies } from '../config/SpeciesData.js';

/**
 * Debug Settings
 *
 * DEBUG_SHOW_DIRECTION_ARROWS: Toggle fish direction arrows
 * - true: Show red arrows indicating fish movement direction
 * - false: Hide arrows for cleaner visuals
 *
 * To disable arrows, change to: const DEBUG_SHOW_DIRECTION_ARROWS = false;
 */
const DEBUG_SHOW_DIRECTION_ARROWS = true;

// Fish name pools
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
 * FishSprite - Predator fish using Phaser Sprite
 * Extends Phaser.GameObjects.Sprite for automatic rendering and pooling
 *
 * NOTE: This is a refactored version of Fish.js that uses Phaser's rendering system
 * Phaser is available globally (loaded via script tag in index.html)
 */
export class FishSprite extends Phaser.GameObjects.Sprite {
    constructor(scene, worldX, y, size = 'MEDIUM', species = 'lake_trout') {
        // Get texture key for this fish
        const textureKey = `fish_${species}_${size}`;

        // Call Sprite constructor with screen position (will be updated in init)
        super(scene, 0, y, textureKey);

        // Add to scene
        scene.add.existing(this);

        // Set depth for rendering order (fish behind lure)
        this.setDepth(50);

        // Store world position
        this.worldX = worldX;

        // Initialize all fish properties
        this.initFishProperties(scene, size, species);

        // Create direction arrow as a child graphics object (for debug)
        if (DEBUG_SHOW_DIRECTION_ARROWS) {
            this.directionArrow = scene.add.graphics();
            this.directionArrow.setDepth(this.depth + 10); // Render above fish
            // Note: Arrow is NOT a child of sprite to avoid transform inheritance
            // We manually position it in drawDirectionArrow()
        }

        // Update screen position
        this.updateScreenPosition();
    }

    /**
     * Initialize fish properties (copied from original Fish class)
     */
    initFishProperties(scene, size, species) {
        // Unique identifier
        this.id = `fish_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Species data
        this.species = species;
        this.speciesData = getPredatorSpecies(species);

        // Size and weight
        this.sizeCategory = size;
        this.size = Constants.FISH_SIZE[size];
        this.weight = Utils.randomBetween(this.size.min, this.size.max);
        this.length = this.calculateLength();

        // Speed and movement
        this.baseSpeed = Utils.randomBetween(GameConfig.FISH_SPEED_MIN, GameConfig.FISH_SPEED_MAX);
        this.speed = this.baseSpeed;
        this.points = this.size.points;

        // Biological age
        this.age = this.calculateBiologicalAge();
        this.frameAge = 0;

        // Personality
        this.gender = Math.random() < 0.5 ? 'male' : 'female';
        this.name = this.gender === 'male'
            ? MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)]
            : FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)];

        // Depth zone behavior
        this.depth = this.y / GameConfig.DEPTH_SCALE;
        this.depthZone = this.getDepthZone();
        this.speed = this.baseSpeed * this.depthZone.speedMultiplier;

        // AI controller
        this.ai = new FishAI(this);

        // Sonar strength
        this.sonarStrength = this.calculateSonarStrength();

        // State
        this.caught = false;

        // Biological properties
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

        // Visual feedback
        this.interestFlash = 0;
        this.interestFlashDecay = 0.02;

        // Movement angle
        this.targetAngle = 0;

        // Chase mechanics
        this.speedPreference = Utils.randomBetween(1.0, 4.0);
        this.swipeChances = 0;
        this.maxSwipeChances = 0;
        this.isEngaged = false;
        this.engagementState = 'waiting';
        this.lastStateChange = 0;
        this.isFastFleeing = false;
        this.hasCalmedDown = false;
    }

    /**
     * Calculate fish length from weight
     */
    calculateLength() {
        const a = this.speciesData.lengthWeightParams?.a || 0.00559;
        const b = this.speciesData.lengthWeightParams?.b || 3.08;
        return Math.pow(this.weight / a, 1 / b);
    }

    /**
     * Calculate biological age
     */
    calculateBiologicalAge() {
        const baseAge = this.speciesData.maturityAge || 4;
        const weightRatio = this.weight / (this.size.max || 10);
        return Math.floor(baseAge + (weightRatio * 10));
    }

    /**
     * Calculate sonar strength
     */
    calculateSonarStrength() {
        return 0.5 + (this.weight / 50) * 0.5;
    }

    /**
     * Get depth zone for this fish
     */
    getDepthZone() {
        const depth = this.y / GameConfig.DEPTH_SCALE;
        const zones = GameConfig.DEPTH_ZONES;

        if (depth <= zones.SURFACE.max) return zones.SURFACE;
        if (depth <= zones.MID_COLUMN.max) return zones.MID_COLUMN;
        return zones.BOTTOM;
    }

    /**
     * Update screen position based on player position
     */
    updateScreenPosition() {
        // Use CURRENT canvas width from scene (handles window resize)
        const canvasWidth = this.scene.scale.width;
        const playerWorldX = canvasWidth / 2;
        const offsetFromPlayer = this.worldX - playerWorldX;
        this.x = (canvasWidth / 2) + offsetFromPlayer;

        // Update sprite flip based on movement direction
        // Fish texture faces LEFT by default, flip to face RIGHT when moving right
        if (this.ai && this.ai.getMovementVector) {
            const movement = this.ai.getMovementVector();
            this.setFlipX(movement.x > 0); // Flip when moving right
        }

        // Debug: Draw direction arrow
        this.drawDirectionArrow();
    }

    /**
     * Draw arrow showing swimming direction (debug)
     */
    drawDirectionArrow() {
        // Only draw if debug flag is enabled
        if (!DEBUG_SHOW_DIRECTION_ARROWS || !this.directionArrow) {
            return;
        }

        this.directionArrow.clear();

        // Only draw arrow if fish is visible and has AI
        if (!this.visible || !this.ai || !this.ai.getMovementVector) {
            return;
        }

        const movement = this.ai.getMovementVector();
        const speed = Math.sqrt(movement.x * movement.x + movement.y * movement.y);

        if (speed > 0.1) {
            // Arrow starts at fish center, points in movement direction
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
     * Phaser update - called automatically by Group if runChildUpdate: true
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Update fish logic (delegate to original update method)
        const allFish = this.scene.fishes || [];
        const baitfishClouds = this.scene.getAdaptedSchoolsForAI ? this.scene.getAdaptedSchoolsForAI() : [];
        this.updateFish(this.scene.lure, allFish, baitfishClouds);
    }

    /**
     * Legacy update method for compatibility
     * (External code may still call fish.update())
     */
    update(lure, allFish = [], baitfishClouds = []) {
        this.updateFish(lure, allFish, baitfishClouds);
    }

    /**
     * Main update method (from original Fish class)
     */
    updateFish(lure, allFish = [], baitfishClouds = []) {
        this.frameAge++;

        // Update depth zone
        this.depth = this.y / GameConfig.DEPTH_SCALE;
        this.depthZone = this.getDepthZone();

        // Update AI
        if (this.ai) {
            const crayfish = this.scene.crayfish || [];
            this.ai.update(lure, this.scene.time.now, allFish, baitfishClouds, crayfish);
        }

        // Apply AI movement
        if (this.ai && this.ai.getMovementVector) {
            const movement = this.ai.getMovementVector();
            this.worldX += movement.x;
            this.y += movement.y;

            // Enforce water boundaries - fish cannot swim above surface or below floor
            const canvasHeight = this.scene.scale.height;
            const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);

            if (this.y < GameConfig.WATER_SURFACE_Y) {
                this.y = GameConfig.WATER_SURFACE_Y;
            } else if (this.y > waterFloorY) {
                this.y = waterFloorY;
            }

            // Update rotation based on movement
            if (Math.abs(movement.x) > 0.1 || Math.abs(movement.y) > 0.1) {
                const isMovingRight = movement.x > 0;
                const targetAngle = Math.atan2(movement.y, Math.abs(movement.x));
                // When flipped (moving left), negate angle to mirror the tilt correctly
                this.angle = isMovingRight ? Phaser.Math.RadToDeg(targetAngle) : Phaser.Math.RadToDeg(-targetAngle);
            }
        }

        // Update screen position
        this.updateScreenPosition();

        // Update hunger
        this.hunger += 0.01 * this.metabolism;
        this.hunger = Math.min(100, this.hunger);

        // Decay interest flash
        if (this.interestFlash > 0) {
            this.interestFlash -= this.interestFlashDecay;
        }

        // Check if off-screen horizontally (main despawn condition)
        // Don't check vertical - fish naturally move up/down within valid depth range
        // Use CURRENT canvas width from scene (handles window resize)
        const canvasWidth = this.scene.scale.width;
        const margin = 200; // Margin beyond screen edge
        const isOffScreenHorizontally = this.x < -margin || this.x > canvasWidth + margin;

        if (isOffScreenHorizontally) {
            this.setActive(false);
            this.setVisible(false);
            // Clean up direction arrow when fish becomes inactive
            if (this.directionArrow) {
                this.directionArrow.clear();
            }
        }
    }

    /**
     * Get fish information for UI display
     */
    getInfo() {
        return {
            name: this.name,
            species: this.speciesData.name,
            gender: this.gender,
            age: this.age + ' years',
            weight: this.weight.toFixed(1) + ' lbs',
            length: this.length + ' in',
            depth: Math.floor(this.depth) + ' ft',
            state: this.ai ? this.ai.state : 'unknown',
            points: this.points,
            hunger: Math.floor(this.hunger) + '%',
            health: Math.floor(this.health) + '%',
            inFrenzy: this.inFrenzy,
            frenzyIntensity: this.frenzyIntensity ? this.frenzyIntensity.toFixed(2) : '0.00'
        };
    }

    /**
     * Trigger visual interest flash (called by AI for visual feedback)
     */
    triggerInterestFlash(intensity = 0.5) {
        this.interestFlash = Math.max(this.interestFlash, intensity);
    }

    /**
     * Feed on baitfish (called by AI when catching prey)
     */
    feedOnBaitfish(preySpecies = 'alewife') {
        // Defensive check: Only predatory fish have hunger and health properties
        if (this.hunger === undefined || this.health === undefined) {
            return; // Not a predatory fish, skip feeding logic
        }

        // Record what this fish ate (for display to player after catch)
        if (this.stomachContents) {
            this.stomachContents.push({
                species: preySpecies,
                timestamp: this.frameAge // When it was eaten
            });
        }

        // Fish has consumed a baitfish, reduce hunger based on prey nutrition value
        const speciesData = getBaitfishSpecies(preySpecies);
        const nutritionValue = speciesData.nutritionValue || 12; // Default to 12 if not specified

        const previousHunger = this.hunger;
        this.hunger = Math.max(0, this.hunger - nutritionValue);
        this.lastFed = this.frameAge;

        // HEALTH RESTORATION: Only when hunger reaches 0, excess nutrition restores health
        if (this.hunger === 0 && previousHunger > 0) {
            const excessNutrition = nutritionValue - previousHunger;

            if (excessNutrition > 0) {
                // Excess nutrition restores health (50% conversion rate)
                const healthGain = excessNutrition * 0.5;
                const previousHealth = this.health;
                this.health = Math.min(100, this.health + healthGain);
                const actualHealthGain = this.health - previousHealth;

                if (actualHealthGain > 0) {
                    console.log(`${this.name} full! Restored ${actualHealthGain.toFixed(1)} health from excess nutrition (now ${Math.floor(this.health)}%)`);
                }
            }
        }
    }

    /**
     * Reset fish for object pooling
     */
    reset(worldX, y, size, species) {
        this.worldX = worldX;
        this.y = y;
        this.setActive(true);
        this.setVisible(true);
        this.initFishProperties(this.scene, size, species);

        // Recreate direction arrow if debug is enabled and it doesn't exist
        if (DEBUG_SHOW_DIRECTION_ARROWS && !this.directionArrow) {
            this.directionArrow = this.scene.add.graphics();
            this.directionArrow.setDepth(this.depth + 10);
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
