import GameConfig from '../../config/GameConfig.js';
import { Constants } from '../../utils/Constants.js';

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
export class CollisionSystem {
    private scene: Phaser.Scene;

    /**
     * @param scene - The game scene
     */
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Check if lure is passing through baitfish clouds and split them
     * DISABLED: Old BaitfishCloud system removed - schools use Boids behavior
     */
    checkCloudSplitting(): void {
        return; // Disabled - using school-based Boids system now

        // Only check when lure is dropping
        if ((this.scene as any).lure.state !== Constants.LURE_STATE.DROPPING) {
            return;
        }

        // TODO: Implement school scatter behavior when lure passes through

        const newClouds: any[] = []; // Store new clouds created from splits

        for (const cloud of (this.scene as any).baitfishClouds) {
            // Check if lure is within the cloud
            const distance = Math.sqrt(
                Math.pow((this.scene as any).lure.x - cloud.centerX, 2) +
                Math.pow((this.scene as any).lure.y - cloud.centerY, 2)
            );

            // If lure passes through cloud, 50% chance to split
            if (distance < GameConfig.BAITFISH_CLOUD_RADIUS) {
                // Only split if we haven't already split this cloud this frame
                // and if random chance succeeds
                if (!cloud.splitThisFrame && Math.random() < 0.5) {
                    const newCloud = cloud.split();
                    if (newCloud) {
                        newClouds.push(newCloud);
                        cloud.splitThisFrame = true; // Mark to prevent re-splitting
                        console.log('Lure split baitfish cloud!');
                    }
                }
            }
        }

        // Add new split clouds to the array
        if (newClouds.length > 0) {
            (this.scene as any).baitfishClouds.push(...newClouds);
        }
    }

    /**
     * Check if baitfish clouds are close enough to merge
     * DISABLED: Old BaitfishCloud system removed - schools use Boids behavior
     */
    checkCloudMerging(): void {
        return; // Disabled - using school-based Boids system now

        if ((this.scene as any).baitfishClouds.length <= 1) {
            return; // Need at least 2 clouds to merge
        }

        const mergeDistance = 80; // pixels - clouds within this distance will merge
        const cloudsToRemove = new Set<number>();

        for (let i = 0; i < (this.scene as any).baitfishClouds.length; i++) {
            if (cloudsToRemove.has(i)) continue;

            const cloudA = (this.scene as any).baitfishClouds[i];

            for (let j = i + 1; j < (this.scene as any).baitfishClouds.length; j++) {
                if (cloudsToRemove.has(j)) continue;

                const cloudB = (this.scene as any).baitfishClouds[j];

                // Calculate distance between cloud centers
                const distance = Math.sqrt(
                    Math.pow(cloudA.centerX - cloudB.centerX, 2) +
                    Math.pow(cloudA.centerY - cloudB.centerY, 2)
                );

                // If clouds are close enough, merge them
                if (distance < mergeDistance) {
                    console.log(`Merging baitfish clouds! ${cloudA.baitfish.length} + ${cloudB.baitfish.length} = ${cloudA.baitfish.length + cloudB.baitfish.length} baitfish`);
                    cloudA.mergeWith(cloudB);
                    cloudsToRemove.add(j);
                }
            }
        }

        // Remove merged clouds
        if (cloudsToRemove.size > 0) {
            (this.scene as any).baitfishClouds = (this.scene as any).baitfishClouds.filter((_cloud: any, index: number) => !cloudsToRemove.has(index));
        }
    }

    /**
     * Reset split flags for next frame
     * DISABLED: Old BaitfishCloud system removed - schools use Boids behavior
     */
    resetSplitFlags(): void {
        return; // Disabled - using school-based Boids system now

        (this.scene as any).baitfishClouds.forEach((cloud: any) => {
            cloud.splitThisFrame = false;
        });
    }

    /**
     * Update collision system each frame
     * @param time - Current game time
     * @param delta - Time since last frame
     */
    update(time: number, delta: number): void {
        // Check for cloud splitting
        this.checkCloudSplitting();

        // Check for cloud merging
        this.checkCloudMerging();

        // Reset split flags for next frame
        this.resetSplitFlags();
    }

    /**
     * Clean up collision system
     */
    destroy(): void {
        // No cleanup needed
    }
}

export default CollisionSystem;
