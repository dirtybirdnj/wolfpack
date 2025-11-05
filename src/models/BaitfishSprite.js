import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import { getBaitfishSpecies } from '../config/SpeciesData.js';

/**
 * BaitfishSprite - Baitfish using Phaser Sprite with Boids flocking
 * Extends Phaser.GameObjects.Sprite for automatic rendering and pooling
 * Lightweight version - no heavy AI, uses Boids algorithm for schooling
 */
export class BaitfishSprite extends Phaser.GameObjects.Sprite {
    constructor(scene, worldX, y, species = 'alewife') {
        // Get texture key for this baitfish
        const textureKey = `baitfish_${species}`;

        // Call Sprite constructor
        super(scene, 0, y, textureKey);

        // Add to scene
        scene.add.existing(this);

        // Set depth for rendering (baitfish behind predators)
        this.setDepth(40);

        // Store world position
        this.worldX = worldX;

        // Initialize baitfish properties
        this.initBaitfishProperties(scene, species);

        // Update screen position FIRST
        this.updateScreenPosition();

        // THEN make visible and active (must be after updateScreenPosition)
        this.setVisible(true);
        this.setActive(true);
    }

    /**
     * Initialize baitfish properties
     */
    initBaitfishProperties(scene, species) {
        // Unique identifier
        this.id = `baitfish_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Species data
        this.species = species;
        this.speciesData = getBaitfishSpecies(species);

        // Size (baitfish are small)
        this.size = 1;
        this.length = this.speciesData.sizeRange ?
            (this.speciesData.sizeRange.min + this.speciesData.sizeRange.max) / 2 : 6;

        // Speed from species data
        this.baseSpeed = this.speciesData.speed.base;
        this.speed = this.baseSpeed;
        this.panicSpeed = this.speciesData.speed.panic;

        // State
        this.depth = this.y / GameConfig.DEPTH_SCALE;
        this.frameAge = 0;
        this.consumed = false;

        // Feeding cooldown - prevent individual fish from hogging food
        this.lastFeedTime = 0; // Timestamp of last zooplankton consumption
        this.feedCooldown = 1000; // 1 second between feedings

        // Schooling behavior (Boids)
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
     * Update screen position based on player position
     */
    updateScreenPosition() {
        // Use CURRENT canvas width from scene (handles window resize)
        const canvasWidth = this.scene.scale.width;
        const playerWorldX = canvasWidth / 2;
        const offsetFromPlayer = this.worldX - playerWorldX;
        this.x = (canvasWidth / 2) + offsetFromPlayer;

        // Flip sprite based on movement direction
        // Baitfish texture faces LEFT by default, flip when moving RIGHT
        this.setFlipX(this.velocity.x > 0);
    }

    /**
     * Phaser update - called automatically by Group
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Boids behavior is handled by school update in GameScene
        // This just handles individual state
        this.frameAge++;

        // Update screen position
        this.updateScreenPosition();

        // Update rotation based on velocity
        if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) {
            const isMovingRight = this.velocity.x > 0;
            const targetAngle = Math.atan2(this.velocity.y, Math.abs(this.velocity.x));
            // When flipped (moving left), negate angle to mirror the tilt correctly
            this.angle = isMovingRight ? Phaser.Math.RadToDeg(targetAngle) : Phaser.Math.RadToDeg(-targetAngle);
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
        }
    }

    /**
     * Apply Boids movement (called by school update)
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

        // ENFORCE HARD WATER BOUNDARIES - fish physically cannot go through surface or floor
        const canvasHeight = this.scene.scale.height;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);

        if (this.y < GameConfig.WATER_SURFACE_Y) {
            this.y = GameConfig.WATER_SURFACE_Y; // Hard stop at surface
            this.velocity.y = Math.max(0, this.velocity.y); // Force downward velocity only
        } else if (this.y > waterFloorY) {
            this.y = waterFloorY; // Hard stop at floor
            this.velocity.y = Math.min(0, this.velocity.y); // Force upward velocity only
        }

        // Update depth
        this.depth = this.y / GameConfig.DEPTH_SCALE;
    }

    /**
     * Reset baitfish for object pooling
     */
    reset(worldX, y, species) {
        this.worldX = worldX;
        this.y = y;
        this.setActive(true);
        this.setVisible(true); // Make visible when resetting for reuse
        this.consumed = false;
        this.initBaitfishProperties(this.scene, species);
        this.updateScreenPosition();
    }

    /**
     * Mark as consumed by predator
     */
    markConsumed() {
        this.consumed = true;
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Clean up
     */
    destroy(fromScene) {
        super.destroy(fromScene);
    }
}

export default BaitfishSprite;
