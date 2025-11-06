/**
 * Position interface for world coordinates
 */
export interface WorldPosition {
    worldX: number;
    y: number;
}
/**
 * Organism debug info interface
 */
export interface OrganismInfo {
    worldX: string;
    screenX: string;
    y: string;
    depth: string;
    frameAge: number;
    consumed: boolean;
    active: boolean;
    visible: boolean;
}
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
export declare class OrganismSprite extends Phaser.GameObjects.Sprite {
    worldX: number;
    consumed: boolean;
    frameAge: number;
    /**
     * @param scene - Game scene
     * @param worldX - World X position (independent of camera)
     * @param y - Screen Y position
     * @param texture - Phaser texture key
     */
    constructor(scene: Phaser.Scene, worldX: number, y: number, texture: string);
    /**
     * Update screen X position based on world position and camera
     * Called every frame to handle horizontal scrolling
     */
    updateScreenPosition(): void;
    /**
     * Calculate depth in feet based on Y position
     * @returns Depth in feet
     */
    getDepth(): number;
    /**
     * Mark this organism as consumed/eaten
     * Removes from gameplay but doesn't destroy sprite (for pooling)
     */
    markConsumed(): void;
    /**
     * Reset organism for object pooling
     * Override in subclasses to reset specific properties
     *
     * @param worldX - New world X position
     * @param y - New Y position
     */
    reset(worldX: number, y: number): void;
    /**
     * Get position for distance calculations
     * @returns Position object {worldX, y}
     */
    getPosition(): WorldPosition;
    /**
     * Check if this organism is within range of a position
     * @param x - World X position
     * @param y - Y position
     * @param range - Maximum distance
     * @returns True if within range
     */
    isWithinRange(x: number, y: number, range: number): boolean;
    /**
     * Enforce water boundaries
     * Keeps organism within playable water area
     */
    enforceBoundaries(): void;
    /**
     * Update rotation based on velocity
     * Override in subclasses for specific behavior
     *
     * @param vx - X velocity
     * @param vy - Y velocity
     */
    updateRotation(vx: number, vy: number): void;
    /**
     * Phaser preUpdate - called automatically every frame
     * Override in subclasses for organism-specific behavior
     *
     * @param time - Total elapsed time
     * @param delta - Time since last frame
     */
    preUpdate(time: number, delta: number): void;
    /**
     * Get debug info about this organism
     * Override in subclasses to add specific info
     *
     * @returns Debug information
     */
    getInfo(): OrganismInfo;
    /**
     * Clean up sprite
     * @param fromScene - Removing from scene?
     */
    destroy(fromScene?: boolean): void;
}
export default OrganismSprite;
//# sourceMappingURL=OrganismSprite.d.ts.map