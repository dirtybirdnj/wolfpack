import { FishSprite } from '../sprites/FishSprite.js';
/**
 * School center position
 */
export interface SchoolCenter {
    worldX: number;
    y: number;
}
/**
 * School offset for fish within school
 */
export interface SchoolOffset {
    x: number;
    y: number;
}
/**
 * School data structure
 */
export interface School {
    id: string;
    species: string;
    fishType: 'baitfish' | 'predator';
    members: Set<FishSprite>;
    center: SchoolCenter;
    createdAt: number;
}
/**
 * School configuration per fish type
 */
export interface SchoolTypeConfig {
    detectionRadius: number;
    minSchoolSize: number;
    maxSchoolSize: number;
    fragmentationRadius: number;
    fragmentationThreshold: number;
}
/**
 * School manager configuration
 */
export interface SchoolConfig {
    baitfish: SchoolTypeConfig;
    predator: SchoolTypeConfig;
    detectionFrequency: number;
    updateFrequency: number;
}
/**
 * SchoolManager System - Emergent School Formation
 *
 * Manages fish schools dynamically by:
 * - Detecting clusters of nearby fish (emergent behavior)
 * - Creating schools when fish group together
 * - Disbanding schools when fish spread apart
 * - Providing school center/offset for SchoolingBehavior component
 *
 * Fish spawn independently and schools form naturally based on proximity.
 * Schools are species-exclusive (for now).
 */
export declare class SchoolManager {
    private scene;
    private baitfishSchools;
    private predatorSchools;
    private nextBaitfishSchoolId;
    private nextPredatorSchoolId;
    private config;
    private frameCount;
    constructor(scene: Phaser.Scene);
    /**
     * Update school management
     * @param allFish - All fish in scene (should be baitfish or schooling predators)
     */
    update(allFish: FishSprite[]): void;
    /**
     * Detect clusters of fish and create new schools
     * @param allFish - Fish to process
     * @param fishType - 'baitfish' or 'predator'
     */
    private detectNewSchools;
    /**
     * Find clusters of fish using proximity grouping
     * @param fishList - List of fish to cluster
     * @param radius - Maximum distance to be in same cluster
     * @returns Array of clusters (each cluster is array of fish)
     */
    private findClusters;
    /**
     * Create a new school
     * @param species - Species of fish in school
     * @param members - Fish in this school
     * @param fishType - Type of fish
     */
    private createSchool;
    /**
     * Update existing schools (recalculate centers, check fragmentation)
     * @param allFish - Fish to process (not currently used, kept for consistency)
     * @param fishType - 'baitfish' or 'predator'
     */
    private updateSchools;
    /**
     * Calculate center of mass for a group of fish
     */
    private calculateCenter;
    /**
     * Check if school is too spread out and should disband
     * @param school - School to check
     * @param activeMembers - Active members of school
     * @param config - Configuration for this fish type
     */
    private isSchoolFragmented;
    /**
     * Disband a school (clear membership, let fish be free agents)
     */
    private disbandSchool;
    /**
     * Clean up empty schools
     */
    private cleanupSchools;
    /**
     * Get school count
     * @param fishType - Optional: 'baitfish', 'predator', or undefined for total
     */
    getSchoolCount(fishType?: 'baitfish' | 'predator'): number;
    /**
     * Get schools for a specific species
     */
    getSchoolsBySpecies(species: string): School[];
    /**
     * Get debug info
     */
    getDebugInfo(): any;
    /**
     * Force create a school (for testing or manual school creation)
     */
    forceCreateSchool(species: string, fishList: FishSprite[]): string | null;
    /**
     * Remove fish from school (when consumed or removed from scene)
     */
    removeFishFromSchool(fish: FishSprite): void;
    /**
     * Reset school manager (clear all schools)
     */
    reset(): void;
}
export default SchoolManager;
//# sourceMappingURL=SchoolManager.d.ts.map