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
export class SchoolManager {
    private scene: Phaser.Scene;
    private baitfishSchools: Map<string, School>;
    private predatorSchools: Map<string, School>;
    private nextBaitfishSchoolId: number;
    private nextPredatorSchoolId: number;
    private config: SchoolConfig;
    private frameCount: number;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        // Active schools - separate pools for different fish types
        this.baitfishSchools = new Map();
        this.predatorSchools = new Map();
        this.nextBaitfishSchoolId = 1;
        this.nextPredatorSchoolId = 1;

        // Configuration - separate for baitfish and predators
        this.config = {
            baitfish: {
                detectionRadius: 80, // Tight schooling
                minSchoolSize: 3,
                maxSchoolSize: 100,
                fragmentationRadius: 150,
                fragmentationThreshold: 0.3, // Easy to fragment
            },
            predator: {
                detectionRadius: 120, // Looser formation
                minSchoolSize: 2, // Predators can form pairs/small packs
                maxSchoolSize: 8, // Smaller predator schools
                fragmentationRadius: 200,
                fragmentationThreshold: 0.5, // Harder to fragment, more cohesive
            },
            // Update frequency (shared)
            detectionFrequency: 60,
            updateFrequency: 10,
        };

        this.frameCount = 0;
    }

    /**
     * Update school management
     * @param allFish - All fish in scene (should be baitfish or schooling predators)
     */
    update(allFish: FishSprite[]): void {
        if (!allFish || allFish.length === 0) return;

        this.frameCount++;

        // Split fish into baitfish and predators
        const baitfish = allFish.filter(f => f.type === 'bait');
        const predators = allFish.filter(f => f.type === 'predator');

        // Detect new schools periodically
        if (this.frameCount % this.config.detectionFrequency === 0) {
            this.detectNewSchools(baitfish, 'baitfish');
            this.detectNewSchools(predators, 'predator');
        }

        // Update existing schools
        if (this.frameCount % this.config.updateFrequency === 0) {
            this.updateSchools(baitfish, 'baitfish');
            this.updateSchools(predators, 'predator');
            this.cleanupSchools();
        }
    }

    /**
     * Detect clusters of fish and create new schools
     * @param allFish - Fish to process
     * @param fishType - 'baitfish' or 'predator'
     */
    private detectNewSchools(allFish: FishSprite[], fishType: 'baitfish' | 'predator'): void {
        const config = this.config[fishType];

        // Only consider fish that aren't already in schools
        const unschooledFish = allFish.filter(fish => {
            // Must have schooling behavior
            if (!fish.schooling) return false;

            // Must not already be in a school
            if (fish.schooling.schoolId) return false;

            // Must be active and visible
            if (!fish.active || !fish.visible) return false;

            return true;
        });

        if (unschooledFish.length < config.minSchoolSize) {
            return; // Not enough fish to form schools
        }

        // Group by species (schools are species-exclusive)
        const speciesGroups: { [species: string]: FishSprite[] } = {};
        unschooledFish.forEach(fish => {
            if (!speciesGroups[fish.species]) {
                speciesGroups[fish.species] = [];
            }
            speciesGroups[fish.species].push(fish);
        });

        // Find clusters within each species
        Object.keys(speciesGroups).forEach(species => {
            const fishList = speciesGroups[species];
            const clusters = this.findClusters(fishList, config.detectionRadius);

            // Create schools for valid clusters
            clusters.forEach(cluster => {
                if (cluster.length >= config.minSchoolSize) {
                    this.createSchool(species, cluster, fishType);
                }
            });
        });
    }

    /**
     * Find clusters of fish using proximity grouping
     * @param fishList - List of fish to cluster
     * @param radius - Maximum distance to be in same cluster
     * @returns Array of clusters (each cluster is array of fish)
     */
    private findClusters(fishList: FishSprite[], radius: number): FishSprite[][] {
        const clusters: FishSprite[][] = [];
        const visited = new Set<FishSprite>();
        const radiusSq = radius * radius;

        fishList.forEach(fish => {
            if (visited.has(fish)) return;

            // Start new cluster with this fish
            const cluster: FishSprite[] = [fish];
            visited.add(fish);

            // Find all fish within radius (recursive flood fill)
            const queue: FishSprite[] = [fish];
            while (queue.length > 0) {
                const current = queue.shift()!;

                fishList.forEach(other => {
                    if (visited.has(other)) return;

                    // Check distance
                    const dx = other.worldX - current.worldX;
                    const dy = other.y - current.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < radiusSq) {
                        cluster.push(other);
                        visited.add(other);
                        queue.push(other);
                    }
                });
            }

            if (cluster.length >= this.config.baitfish.minSchoolSize) {
                clusters.push(cluster);
            }
        });

        return clusters;
    }

    /**
     * Create a new school
     * @param species - Species of fish in school
     * @param members - Fish in this school
     * @param fishType - Type of fish
     */
    private createSchool(species: string, members: FishSprite[], fishType: 'baitfish' | 'predator'): void {
        // Use appropriate school pool and ID counter
        const schoolMap = fishType === 'baitfish' ? this.baitfishSchools : this.predatorSchools;
        const idCounter = fishType === 'baitfish' ? this.nextBaitfishSchoolId++ : this.nextPredatorSchoolId++;
        const schoolId = `${fishType}_school_${idCounter}`;

        // Calculate initial center
        const center = this.calculateCenter(members);

        // Create school object
        const school: School = {
            id: schoolId,
            species: species,
            fishType: fishType,
            members: new Set(members),
            center: center,
            createdAt: this.frameCount
        };

        schoolMap.set(schoolId, school);

        // Assign fish to school
        members.forEach(fish => {
            // Calculate offset from center for this fish
            const offset: SchoolOffset = {
                x: fish.worldX - center.worldX,
                y: fish.y - center.y
            };

            // Store school ID on fish
            // Note: fish.schooling is a simple object with separation/cohesion/alignment vectors
            // The setSchool method doesn't exist, so we just set the schoolId directly
            fish.schoolId = schoolId;
        });

        console.log(`Created school ${schoolId} with ${members.length} ${species}`);
    }

    /**
     * Update existing schools (recalculate centers, check fragmentation)
     * @param allFish - Fish to process (not currently used, kept for consistency)
     * @param fishType - 'baitfish' or 'predator'
     */
    private updateSchools(allFish: FishSprite[], fishType: 'baitfish' | 'predator'): void {
        const config = this.config[fishType];
        const schoolMap = fishType === 'baitfish' ? this.baitfishSchools : this.predatorSchools;

        schoolMap.forEach(school => {
            // Get active members
            const activeMembers = Array.from(school.members).filter(fish =>
                fish.active && fish.visible && !fish.consumed
            );

            if (activeMembers.length === 0) {
                // School has no active members
                school.members.clear();
                return;
            }

            // Update school center
            school.center = this.calculateCenter(activeMembers);

            // Update each fish's school center reference
            activeMembers.forEach(fish => {
                if (fish.schooling) {
                    fish.schooling.schoolCenter = school.center;
                }
            });

            // Check if school is fragmented
            if (this.isSchoolFragmented(school, activeMembers, config)) {
                this.disbandSchool(school);
            }
        });
    }

    /**
     * Calculate center of mass for a group of fish
     */
    private calculateCenter(fishList: FishSprite[]): SchoolCenter {
        if (fishList.length === 0) {
            return { worldX: 0, y: 0 };
        }

        let sumX = 0;
        let sumY = 0;

        fishList.forEach(fish => {
            sumX += fish.worldX;
            sumY += fish.y;
        });

        return {
            worldX: sumX / fishList.length,
            y: sumY / fishList.length
        };
    }

    /**
     * Check if school is too spread out and should disband
     * @param school - School to check
     * @param activeMembers - Active members of school
     * @param config - Configuration for this fish type
     */
    private isSchoolFragmented(school: School, activeMembers: FishSprite[], config: SchoolTypeConfig): boolean {
        if (activeMembers.length < config.minSchoolSize) {
            return true; // Too small to be a school
        }

        // Check how many fish are too far from center
        const fragmentRadius = config.fragmentationRadius;
        const fragmentRadiusSq = fragmentRadius * fragmentRadius;

        let tooFarCount = 0;

        activeMembers.forEach(fish => {
            const dx = fish.worldX - school.center.worldX;
            const dy = fish.y - school.center.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > fragmentRadiusSq) {
                tooFarCount++;
            }
        });

        const fragmentationRatio = tooFarCount / activeMembers.length;
        return fragmentationRatio > config.fragmentationThreshold;
    }

    /**
     * Disband a school (clear membership, let fish be free agents)
     */
    private disbandSchool(school: School): void {
        console.log(`Disbanding school ${school.id} (${school.species})`);

        // Clear school membership from all fish
        school.members.forEach(fish => {
            // Just clear the schoolId - fish.schooling is a simple vector object
            fish.schoolId = null;
        });

        // Remove school from active schools
        const schoolMap = school.fishType === 'baitfish' ? this.baitfishSchools : this.predatorSchools;
        schoolMap.delete(school.id);
    }

    /**
     * Clean up empty schools
     */
    private cleanupSchools(): void {
        // Clean up both baitfish and predator schools
        [this.baitfishSchools, this.predatorSchools].forEach(schoolMap => {
            const toDelete: string[] = [];

            schoolMap.forEach(school => {
                if (school.members.size === 0) {
                    toDelete.push(school.id);
                }
            });

            toDelete.forEach(id => {
                schoolMap.delete(id);
            });
        });
    }

    /**
     * Get school count
     * @param fishType - Optional: 'baitfish', 'predator', or undefined for total
     */
    getSchoolCount(fishType?: 'baitfish' | 'predator'): number {
        if (fishType === 'baitfish') return this.baitfishSchools.size;
        if (fishType === 'predator') return this.predatorSchools.size;
        return this.baitfishSchools.size + this.predatorSchools.size;
    }

    /**
     * Get schools for a specific species
     */
    getSchoolsBySpecies(species: string): School[] {
        const result: School[] = [];
        this.baitfishSchools.forEach(school => {
            if (school.species === species) {
                result.push(school);
            }
        });
        this.predatorSchools.forEach(school => {
            if (school.species === species) {
                result.push(school);
            }
        });
        return result;
    }

    /**
     * Get debug info
     */
    getDebugInfo(): any {
        const totalSchools = this.baitfishSchools.size + this.predatorSchools.size;
        const schools: any[] = [];

        [this.baitfishSchools, this.predatorSchools].forEach(schoolMap => {
            schoolMap.forEach(school => {
                const activeMembers = Array.from(school.members).filter(f => f.active);
                schools.push({
                    id: school.id,
                    species: school.species,
                    memberCount: activeMembers.length,
                    center: {
                        worldX: school.center.worldX.toFixed(1),
                        y: school.center.y.toFixed(1)
                    }
                });
            });
        });

        return {
            schoolCount: totalSchools,
            schools: schools
        };
    }

    /**
     * Force create a school (for testing or manual school creation)
     */
    forceCreateSchool(species: string, fishList: FishSprite[]): string | null {
        if (fishList.length < this.config.baitfish.minSchoolSize) {
            console.warn(`Cannot create school: need at least ${this.config.baitfish.minSchoolSize} fish`);
            return null;
        }

        const fishType = fishList[0].type === 'bait' ? 'baitfish' : 'predator';
        this.createSchool(species, fishList, fishType);
        return fishList[0].schooling?.schoolId || null;
    }

    /**
     * Remove fish from school (when consumed or removed from scene)
     */
    removeFishFromSchool(fish: FishSprite): void {
        if (!fish.schooling || !fish.schoolId) return;

        const schoolMap = fish.type === 'bait' ? this.baitfishSchools : this.predatorSchools;
        const school = schoolMap.get(fish.schoolId);
        if (school) {
            school.members.delete(fish);
            // Just clear the schoolId - fish.schooling is a simple vector object
            fish.schoolId = null;
        }
    }

    /**
     * Reset school manager (clear all schools)
     */
    reset(): void {
        [this.baitfishSchools, this.predatorSchools].forEach(schoolMap => {
            schoolMap.forEach(school => {
                this.disbandSchool(school);
            });
        });
        this.baitfishSchools.clear();
        this.predatorSchools.clear();
        this.nextBaitfishSchoolId = 1;
        this.nextPredatorSchoolId = 1;
        this.frameCount = 0;
    }
}

export default SchoolManager;
