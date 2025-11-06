/**
 * CollisionSystem - Handles collision detection and interactions
 *
 * @module scenes/systems/CollisionSystem
 *
 * Responsibilities:
 * - Baitfish cloud splitting when lure passes through
 * - Baitfish cloud merging when close together
 * - Future: Fish-lure collision detection
 * - Future: Fish-baitfish collision detection
 *
 * COMMON TASKS:
 * - Adjust cloud split chance → update() method, split chance value
 * - Change merge distance → mergeDistance constant
 * - Add new collision types → add new methods
 *
 * @example
 * const collisionSystem = new CollisionSystem(scene);
 * collisionSystem.update(time, delta);
 */
export declare class CollisionSystem {
    private scene;
    /**
     * @param scene - The game scene
     */
    constructor(scene: Phaser.Scene);
    /**
     * Check if lure is passing through baitfish clouds and split them
     * DISABLED: Old BaitfishCloud system removed - schools use Boids behavior
     */
    checkCloudSplitting(): void;
    /**
     * Check if baitfish clouds are close enough to merge
     * DISABLED: Old BaitfishCloud system removed - schools use Boids behavior
     */
    checkCloudMerging(): void;
    /**
     * Reset split flags for next frame
     * DISABLED: Old BaitfishCloud system removed - schools use Boids behavior
     */
    resetSplitFlags(): void;
    /**
     * Update collision system each frame
     * @param time - Current game time
     * @param delta - Time since last frame
     */
    update(time: number, delta: number): void;
    /**
     * Clean up collision system
     */
    destroy(): void;
}
export default CollisionSystem;
//# sourceMappingURL=CollisionSystem.d.ts.map