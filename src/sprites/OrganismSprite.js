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
     * @param scene - Game scene
     * @param worldX - World X position (independent of camera)
     * @param y - Screen Y position
     * @param texture - Phaser texture key
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
        this.frameAge = 0; // Frame counter for animations and timing
        // Set initial screen position
        this.updateScreenPosition();
        // Ensure sprite is visible and active (must be after updateScreenPosition)
        // This fixes rendering issues where sprites created but not visible
        this.setVisible(true);
        this.setActive(true);
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
     * @returns Depth in feet
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
     * @param worldX - New world X position
     * @param y - New Y position
     */
    reset(worldX, y) {
        this.worldX = worldX;
        this.y = y;
        this.consumed = false;
        this.frameAge = 0;
        this.setActive(true);
        this.setVisible(true);
        this.updateScreenPosition();
    }
    /**
     * Get position for distance calculations
     * @returns Position object {worldX, y}
     */
    getPosition() {
        return {
            worldX: this.worldX,
            y: this.y
        };
    }
    /**
     * Check if this organism is within range of a position
     * @param x - World X position
     * @param y - Y position
     * @param range - Maximum distance
     * @returns True if within range
     */
    isWithinRange(x, y, range) {
        const distance = Phaser.Math.Distance.Between(this.worldX, this.y, x, y);
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
        }
        else if (this.y > waterFloorY) {
            this.y = waterFloorY;
        }
        // Check if off-screen horizontally and mark for despawning
        // Larger margin to allow fish to swim slightly off-screen before despawning
        const canvasWidth = this.scene.scale.width;
        const margin = 200; // Generous margin for natural movement
        const isOffScreenHorizontally = this.x < -margin || this.x > canvasWidth + margin;
        if (isOffScreenHorizontally) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
    /**
     * Update rotation based on velocity
     * Override in subclasses for specific behavior
     *
     * @param vx - X velocity
     * @param vy - Y velocity
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
     * @param time - Total elapsed time
     * @param delta - Time since last frame
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        // Increment frame counter (for animations and timing)
        this.frameAge++;
        // Update screen position (for camera/scrolling)
        this.updateScreenPosition();
        // Subclasses should override and add their behavior here
    }
    /**
     * Get debug info about this organism
     * Override in subclasses to add specific info
     *
     * @returns Debug information
     */
    getInfo() {
        return {
            worldX: this.worldX.toFixed(1),
            screenX: this.x.toFixed(1),
            y: this.y.toFixed(1),
            depth: this.getDepth().toFixed(1),
            frameAge: this.frameAge,
            consumed: this.consumed,
            active: this.active,
            visible: this.visible
        };
    }
    /**
     * Clean up sprite
     * @param fromScene - Removing from scene?
     */
    destroy(fromScene) {
        // Subclasses can override to clean up components
        super.destroy(fromScene);
    }
}
export default OrganismSprite;
//# sourceMappingURL=OrganismSprite.js.map