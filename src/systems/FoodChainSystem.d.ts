/**
 * Food chain system configuration
 */
export interface FoodChainConfig {
    zooplanktonDetectionRange: number;
    crayfishDetectionRange: number;
    baitfishDetectionRange: number;
    zooplanktonConsumeRange: number;
    crayfishConsumeRange: number;
    baitfishConsumeRange: number;
    crayfishThreatRadius: number;
    updateFrequency: number;
}
/**
 * Food chain statistics
 */
export interface FoodChainStats {
    zooplanktonConsumed: number;
    crayfishConsumed: number;
    baitfishConsumed: number;
    perchConsumed: number;
}
/**
 * Nearest prey result
 */
export interface NearestPrey<T> {
    prey: T;
    distance: number;
}
/**
 * FoodChainSystem - Manages predator-prey interactions
 *
 * Food chain hierarchy:
 * - Zooplankton (level 0) - prey only
 * - Crayfish (level 1) - eats zooplankton, eaten by predators
 * - Baitfish (level 1) - eats zooplankton, eaten by predators
 * - Yellow Perch (level 2) - eats baitfish, eaten by larger predators
 * - Bass/Pike/Trout (level 3) - top predators, eat everything
 *
 * Handles:
 * - Baitfish eating zooplankton
 * - Crayfish eating zooplankton
 * - Predators eating baitfish
 * - Predators eating crayfish
 * - Large predators eating smaller predators (perch)
 * - Crayfish burst escape when threatened
 */
export declare class FoodChainSystem {
    private scene;
    private config;
    private frameCount;
    private stats;
    constructor(scene: Phaser.Scene);
    /**
     * Update food chain interactions
     */
    update(): void;
    /**
     * Get all baitfish from scene
     */
    private getBaitfish;
    /**
     * Get all predator fish from scene
     */
    private getPredators;
    /**
     * Update zooplankton feeding (baitfish and crayfish eat zooplankton)
     */
    private updateZooplanktonFeeding;
    /**
     * Update crayfish threat detection (triggers burst escape)
     */
    private updateCrayfishThreats;
    /**
     * Update predator feeding (predators eat baitfish, crayfish, and smaller fish)
     */
    private updatePredatorFeeding;
    /**
     * Find nearest prey within range
     * @returns { prey, distance } or null if none found
     */
    private findNearestPrey;
    /**
     * Consume prey (mark as consumed, update predator biology)
     */
    private consumePrey;
    /**
     * Get system stats
     */
    getStats(): FoodChainStats;
    /**
     * Reset stats
     */
    resetStats(): void;
    /**
     * Get debug info
     */
    getDebugInfo(): any;
    /**
     * Check if organism can eat another organism
     * @param predatorSpecies - Species of predator
     * @param preySpecies - Species of prey
     * @returns True if predator can eat prey
     */
    static canEat(predatorSpecies: string, preySpecies: string): boolean;
    /**
     * Get food chain level for organism
     * @param species - Species name
     * @returns Food chain level (0 = bottom, higher = top)
     */
    static getFoodChainLevel(species: string): number;
}
export default FoodChainSystem;
//# sourceMappingURL=FoodChainSystem.d.ts.map