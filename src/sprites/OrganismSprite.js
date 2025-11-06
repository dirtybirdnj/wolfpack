import GameConfig from '../config/GameConfig.js';

/**
 * OrganismSprite - Base class for ALL water organisms
 *
 * Extends Phaser.GameObjects.Sprite to provide common functionality
 * for fish, crayfish, and zooplankton.
 *
 * Common features:
 * - World position tracking (worldX for scrolling)
 * - Screen position updates
 * - Consumed state
 * - Age tracking
 * - Depth management
 */
export class OrganismSprite extends Phaser.GameObjects.Sprite {
    /**
     * @param {Phaser.Scene} scene - Game scene
     * @param {number} worldX - World X position (independent of camera)
     * @param {number} y - Screen Y position
     * @param {string} texture - Phaser texture key
     */
    constructor(scene, worldX, y, texture) {
        // Initialize sprite at screen position 0, y
        // We'll update screen position based on worldX
        super(scene, 0, y, texture);

        // Add to scene display list and update list
        scene.add.existing(this);

        // World position (doesn't change with camera)
        this.worldX = worldX;

        // State
        this.consumed = false; // Has this organism been eaten?
        this.age = 0; // Age in frames

        // Set initial screen position
        this.updateScreenPosition();
    }

    /**
     * Update screen X position based on world position and camera
     * Called every frame to handle horizontal scrolling
     */
    updateScreenPosition() {
        // Get current canvas width (handles window resize)
        const canvasWidth = this.scene.scale.width;

        // Player is always at center of screen
        const playerWorldX = canvasWidth / 2;

        // Calculate offset from player
        const offsetFromPlayer = this.worldX - playerWorldX;

        // Set screen position
        this.x = (canvasWidth / 2) + offsetFromPlayer;
    }

    /**
     * Calculate depth in feet based on Y position
     * @returns {number} Depth in feet
     */
    getDepth() {
        // Use scene's depth converter if available
        if (this.scene.depthConverter) {
            return this.scene.depthConverter.yToDepth(this.y);
        }

        // Fallback: simple calculation
        const depthScale = this.scene.sonarDisplay?.getDepthScale() || 10;
        return this.y / depthScale;
    }

    /**
     * Mark this organism as consumed/eaten
     * Removes from gameplay but doesn't destroy sprite (for pooling)
     */
    markConsumed() {
        this.consumed = true;
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Reset organism for object pooling
     * Override in subclasses to reset specific properties
     *
     * @param {number} worldX - New world X position
     * @param {number} y - New Y position
     */
    reset(worldX, y) {
        this.worldX = worldX;
        this.y = y;
        this.consumed = false;
        this.age = 0;

        this.setActive(true);
        this.setVisible(true);

        this.updateScreenPosition();
    }

    /**
     * Get position for distance calculations
     * @returns {object} Position object {worldX, y}
     */
    getPosition() {
        return {
            worldX: this.worldX,
            y: this.y
        };
    }

    /**
     * Check if this organism is within range of a position
     * @param {number} x - World X position
     * @param {number} y - Y position
     * @param {number} range - Maximum distance
     * @returns {boolean} True if within range
     */
    isWithinRange(x, y, range) {
        const distance = Phaser.Math.Distance.Between(
            this.worldX, this.y,
            x, y
        );
        return distance <= range;
    }

    /**
     * Enforce water boundaries
     * Keeps organism within playable water area
     */
    enforceBoundaries() {
        const canvasHeight = this.scene.scale.height;
        const waterSurfaceY = GameConfig.WATER_SURFACE_Y;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);

        // Keep within vertical bounds
        if (this.y < waterSurfaceY) {
            this.y = waterSurfaceY;
        } else if (this.y > waterFloorY) {
            this.y = waterFloorY;
        }

        // Keep within horizontal bounds (with buffer for off-screen spawning)
        const canvasWidth = this.scene.scale.width;
        const buffer = 500;
        const minX = -buffer;
        const maxX = canvasWidth + buffer;

        // Note: We check screen position, not worldX, for despawning
        if (this.x < minX || this.x > maxX) {
            // Off-screen - let scene handle despawning
        }
    }

    /**
     * Update rotation based on velocity
     * Override in subclasses for specific behavior
     *
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     */
    updateRotation(vx, vy) {
        if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
            const isMovingRight = vx > 0;
            const targetAngle = Math.atan2(vy, Math.abs(vx));

            // When moving left, flip sprite and negate angle
            this.setFlipX(isMovingRight);
            this.angle = isMovingRight ?
                Phaser.Math.RadToDeg(targetAngle) :
                Phaser.Math.RadToDeg(-targetAngle);
        }
    }

    /**
     * Phaser preUpdate - called automatically every frame
     * Override in subclasses for organism-specific behavior
     *
     * @param {number} time - Total elapsed time
     * @param {number} delta - Time since last frame
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Increment age
        this.age++;

        // Update screen position (for camera/scrolling)
        this.updateScreenPosition();

        // Subclasses should override and add their behavior here
    }

    /**
     * Get debug info about this organism
     * Override in subclasses to add specific info
     *
     * @returns {object} Debug information
     */
    getInfo() {
        return {
            worldX: this.worldX.toFixed(1),
            screenX: this.x.toFixed(1),
            y: this.y.toFixed(1),
            depth: this.getDepth().toFixed(1),
            age: this.age,
            consumed: this.consumed,
            active: this.active,
            visible: this.visible
        };
    }

    /**
     * Clean up sprite
     * @param {boolean} fromScene - Removing from scene?
     */
    destroy(fromScene) {
        // Subclasses can override to clean up components
        super.destroy(fromScene);
    }
}

export default OrganismSprite;
