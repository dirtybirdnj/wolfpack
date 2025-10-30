import GameConfig from '../config/GameConfig.js';

/**
 * AquaticOrganism - Lightweight base class for all aquatic life
 * Contains only the essential shared properties to keep all organisms performant
 *
 * This class provides:
 * - Position management (world and screen coordinates)
 * - Species data (optional - simple organisms like zooplankton may not have species)
 * - Basic biological properties (size, age)
 * - Movement tracking (angle, speed)
 */
export class AquaticOrganism {
    constructor(scene, worldX, y, species = null, speciesData = null) {
        this.scene = scene;

        // Species identification (optional for simple organisms)
        this.species = species;
        this.speciesData = speciesData;

        // World coordinates (actual position in the lake)
        this.worldX = worldX;

        // Screen coordinates (for rendering - calculated based on player position)
        this.x = worldX; // Will be updated in updateScreenPosition()
        this.y = y;
        this.depth = y / GameConfig.DEPTH_SCALE;

        // Basic biological properties (subclasses define specific values)
        this.size = 0; // Visual size for rendering
        this.length = 0; // Length in inches
        this.age = 0; // Age in frames

        // Movement properties
        this.speed = 0;
        this.angle = 0; // Current facing angle (for rendering)

        // State
        this.visible = true;

        // Initialize screen position
        this.updateScreenPosition();
    }

    /**
     * Update screen position based on player position
     * (different for ice fishing vs boat fishing vs nature mode)
     */
    updateScreenPosition() {
        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            const playerWorldX = currentHole ? currentHole.x : this.worldX;
            const offsetFromPlayer = this.worldX - playerWorldX;
            this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;
            const offsetFromPlayer = this.worldX - playerWorldX;
            this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;
        } else {
            // Nature simulation mode - use worldX directly as screen X (no player to offset from)
            this.x = this.worldX;
        }
    }

    /**
     * Get lake bottom depth at organism's current world position
     */
    getBottomDepthAtPosition() {
        let bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;

        } else if (this.scene.iceHoleManager) {
            // For ice fishing, use the hole manager's depth calculation
            bottomDepth = this.scene.iceHoleManager.getDepthAtPosition(this.x);
        } else {
            // Nature simulation mode - bottom profile is drawn at maxDepth - 5 feet
            bottomDepth = (this.scene.maxDepth || GameConfig.MAX_DEPTH) - 5;
        }

        return bottomDepth;
    }

    /**
     * Check if organism is too far from player (for culling)
     */
    isTooFarFromPlayer(maxDistance = 600) {
        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            const playerWorldX = currentHole ? currentHole.x : this.worldX;
            const distanceFromPlayer = Math.abs(this.worldX - playerWorldX);
            return distanceFromPlayer > maxDistance;
            const distanceFromPlayer = Math.abs(this.worldX - playerWorldX);
            return distanceFromPlayer > maxDistance;
        } else {
            // Nature simulation mode - check if off screen
            return this.worldX < -400 || this.worldX > GameConfig.CANVAS_WIDTH + 400;
        }
    }

    /**
     * Calculate length from weight (can be overridden by species)
     * Default implementation - species should override this
     */
    calculateLength() {
        return 0;
    }

    /**
     * Calculate biological age (can be overridden by species)
     * Default implementation - species should override this
     */
    calculateBiologicalAge() {
        return 0;
    }

    /**
     * Update position and state (must be implemented by subclasses)
     */
    update() {
        throw new Error('update() must be implemented by subclass');
    }

    /**
     * Render the organism (must be implemented by subclasses)
     */
    render(graphics) {
        throw new Error('render() must be implemented by subclass');
    }
}

export default AquaticOrganism;
