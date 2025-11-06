import { FishSprite } from '../../sprites/FishSprite.js';
import { CrayfishSprite } from '../../sprites/CrayfishSprite.js';
/**
 * SpawningSystem - Handles all entity spawning logic
 *
 * @module scenes/systems/SpawningSystem
 *
 * Responsibilities:
 * - Spawn fish at appropriate depths and locations
 * - Spawn baitfish clouds with varied sizes
 * - Spawn zooplankton near lake bottom
 * - Spawn and maintain crayfish population on bottom
 * - Handle emergency fish spawning in arcade mode
 * - Manage spawn rates and entity limits
 *
 * @example
 * const spawningSystem = new SpawningSystem(scene);
 * spawningSystem.update(time, delta);
 */
export declare class SpawningSystem {
    private scene;
    private emergencyFishSpawned;
    private MAX_BAITFISH;
    private MAX_PREDATORS;
    private MIN_BAIT_FOR_PREDATORS;
    /**
     * @param scene - The game scene
     */
    constructor(scene: Phaser.Scene);
    setupSpawnTimers(): void;
    /**
     * Try to spawn a fish based on current conditions
     * @returns The spawned fish or null if spawn failed
     */
    trySpawnFish(): FishSprite | null;
    /**
     * Try to spawn a baitfish school
     * @returns True if school was spawned
     */
    trySpawnBaitfishSchool(): boolean;
    /**
     * Try to spawn zooplankton near the bottom
     * @returns Number of zooplankton spawned
     */
    trySpawnZooplankton(): number;
    /**
     * Spawn initial crayfish population (3 on game load)
     */
    spawnInitialCrayfish(): void;
    /**
     * Spawn initial zooplankton population (80-120 on game load - abundant food source)
     */
    spawnInitialZooplankton(): void;
    /**
     * Spawn initial ecosystem when game starts
     * Spawns 4-6 baitfish schools and 4-6 predators IMMEDIATELY
     */
    spawnInitialEcosystem(): void;
    /**
     * Spawn a baitfish school from the left or right edge of screen
     */
    spawnSchoolFromSide(): void;
    /**
     * Spawn a predator from the left or right edge of screen
     * Spawns appropriate predator based on game mode depth
     */
    spawnPredatorFromSide(): void;
    /**
     * Maintain crayfish population (called every 30 seconds)
     * Spawns crayfish to reach maximum of 5 total
     */
    maintainCrayfishPopulation(): void;
    /**
     * Spawn a single crayfish on the lake bottom
     * @returns The spawned crayfish or null if spawn failed
     */
    spawnSingleCrayfish(): CrayfishSprite | null;
    /**
     * Spawn an emergency fish in arcade mode when time is running out
     * @returns The emergency fish or null if spawn failed
     */
    spawnEmergencyFish(): FishSprite | null;
    /**
     * Update emergency fish behavior
     * @param fish - The emergency fish to update
     */
    updateEmergencyFish(fish: FishSprite): void;
    /**
     * Trigger a feeding frenzy caused by emergency fish
     * @param emergencyFish - The emergency fish triggering the frenzy
     */
    triggerEmergencyFrenzy(emergencyFish: FishSprite): void;
    /**
     * Update spawning system each frame
     * @param time - Current game time
     * @param delta - Time since last frame
     */
    update(time: number, delta: number): void;
    /**
     * Check if we need to spawn emergency fish (removed - no arcade mode)
     * @returns Always false now
     */
    checkEmergencySpawn(): boolean;
    /**
     * Count total baitfish in all schools
     * @returns Total baitfish count
     */
    countBaitfish(): number;
    /**
     * Reset the spawning system (for new game)
     */
    reset(): void;
    /**
     * Clean up spawning system
     */
    destroy(): void;
}
export default SpawningSystem;
//# sourceMappingURL=SpawningSystem.d.ts.map