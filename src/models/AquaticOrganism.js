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
     * Player is always at center of screen
     */
    updateScreenPosition() {
        // Player position is center of screen
        const playerWorldX = GameConfig.CANVAS_WIDTH / 2;
        const offsetFromPlayer = this.worldX - playerWorldX;
        this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;
    }

    /**
     * Get lake bottom depth at organism's current world position
     */
    getBottomDepthAtPosition() {
        // Use maxDepth from scene
        const bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
        return bottomDepth;
    }

    /**
     * Check if organism is too far from player (for culling)
     */
    isTooFarFromPlayer(maxDistance = 600) {
        // Player is at center of screen
        const playerWorldX = GameConfig.CANVAS_WIDTH / 2;
        const distanceFromPlayer = Math.abs(this.worldX - playerWorldX);
        return distanceFromPlayer > maxDistance;
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
