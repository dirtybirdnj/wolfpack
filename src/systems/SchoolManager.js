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
    constructor(scene) {
        this.scene = scene;

        // Active schools
        this.schools = new Map(); // schoolId -> School object
        this.nextSchoolId = 1;

        // Configuration
        this.config = {
            // Detection parameters
            detectionRadius: 80, // Distance to consider fish "nearby"
            minSchoolSize: 3, // Minimum fish to form a school
            maxSchoolSize: 100, // Maximum fish in one school

            // Fragmentation parameters
            fragmentationRadius: 150, // Max distance from center before considering fragmented
            fragmentationThreshold: 0.3, // If >30% of fish are too far, disband school

            // Update frequency
            detectionFrequency: 60, // Check for new schools every 60 frames (1 second)
            updateFrequency: 10, // Update existing schools every 10 frames
        };

        this.frameCount = 0;
    }

    /**
     * Update school management
     * @param {Array} allFish - All fish in scene (should be baitfish or schooling predators)
     */
    update(allFish) {
        if (!allFish || allFish.length === 0) return;

        this.frameCount++;

        // Detect new schools periodically
        if (this.frameCount % this.config.detectionFrequency === 0) {
            this.detectNewSchools(allFish);
        }

        // Update existing schools
        if (this.frameCount % this.config.updateFrequency === 0) {
            this.updateSchools(allFish);
            this.cleanupSchools();
        }
    }

    /**
     * Detect clusters of fish and create new schools
     */
    detectNewSchools(allFish) {
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

        if (unschooledFish.length < this.config.minSchoolSize) {
            return; // Not enough fish to form schools
        }

        // Group by species (schools are species-exclusive)
        const speciesGroups = {};
        unschooledFish.forEach(fish => {
            if (!speciesGroups[fish.species]) {
                speciesGroups[fish.species] = [];
            }
            speciesGroups[fish.species].push(fish);
        });

        // Find clusters within each species
        Object.keys(speciesGroups).forEach(species => {
            const fishList = speciesGroups[species];
            const clusters = this.findClusters(fishList, this.config.detectionRadius);

            // Create schools for valid clusters
            clusters.forEach(cluster => {
                if (cluster.length >= this.config.minSchoolSize) {
                    this.createSchool(species, cluster);
                }
            });
        });
    }

    /**
     * Find clusters of fish using proximity grouping
     * @param {Array} fishList - List of fish to cluster
     * @param {number} radius - Maximum distance to be in same cluster
     * @returns {Array} Array of clusters (each cluster is array of fish)
     */
    findClusters(fishList, radius) {
        const clusters = [];
        const visited = new Set();
        const radiusSq = radius * radius;

        fishList.forEach(fish => {
            if (visited.has(fish)) return;

            // Start new cluster with this fish
            const cluster = [fish];
            visited.add(fish);

            // Find all fish within radius (recursive flood fill)
            const queue = [fish];
            while (queue.length > 0) {
                const current = queue.shift();

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

            if (cluster.length >= this.config.minSchoolSize) {
                clusters.push(cluster);
            }
        });

        return clusters;
    }

    /**
     * Create a new school
     * @param {string} species - Species of fish in school
     * @param {Array} members - Fish in this school
     */
    createSchool(species, members) {
        const schoolId = `school_${this.nextSchoolId++}`;

        // Calculate initial center
        const center = this.calculateCenter(members);

        // Create school object
        const school = {
            id: schoolId,
            species: species,
            members: new Set(members),
            center: center,
            createdAt: this.frameCount
        };

        this.schools.set(schoolId, school);

        // Assign fish to school
        members.forEach(fish => {
            // Calculate offset from center for this fish
            const offset = {
                x: fish.worldX - center.worldX,
                y: fish.y - center.y
            };

            // Tell fish's schooling behavior about the school
            if (fish.schooling) {
                fish.schooling.setSchool(schoolId, center, offset);
            }
        });

        console.log(`Created school ${schoolId} with ${members.length} ${species}`);
    }

    /**
     * Update existing schools (recalculate centers, check fragmentation)
     */
    updateSchools(allFish) {
        this.schools.forEach(school => {
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
            if (this.isSchoolFragmented(school, activeMembers)) {
                this.disbandSchool(school);
            }
        });
    }

    /**
     * Calculate center of mass for a group of fish
     */
    calculateCenter(fishList) {
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
     */
    isSchoolFragmented(school, activeMembers) {
        if (activeMembers.length < this.config.minSchoolSize) {
            return true; // Too small to be a school
        }

        // Check how many fish are too far from center
        const fragmentRadius = this.config.fragmentationRadius;
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
        return fragmentationRatio > this.config.fragmentationThreshold;
    }

    /**
     * Disband a school (clear membership, let fish be free agents)
     */
    disbandSchool(school) {
        console.log(`Disbanding school ${school.id} (${school.species})`);

        // Clear school membership from all fish
        school.members.forEach(fish => {
            if (fish.schooling) {
                fish.schooling.clearSchool();
            }
        });

        // Remove school from active schools
        this.schools.delete(school.id);
    }

    /**
     * Clean up empty schools
     */
    cleanupSchools() {
        const toDelete = [];

        this.schools.forEach(school => {
            if (school.members.size === 0) {
                toDelete.push(school.id);
            }
        });

        toDelete.forEach(id => {
            this.schools.delete(id);
        });
    }

    /**
     * Get school count
     */
    getSchoolCount() {
        return this.schools.size;
    }

    /**
     * Get schools for a specific species
     */
    getSchoolsBySpecies(species) {
        const result = [];
        this.schools.forEach(school => {
            if (school.species === species) {
                result.push(school);
            }
        });
        return result;
    }

    /**
     * Get debug info
     */
    getDebugInfo() {
        const info = {
            schoolCount: this.schools.size,
            schools: []
        };

        this.schools.forEach(school => {
            const activeMembers = Array.from(school.members).filter(f => f.active);
            info.schools.push({
                id: school.id,
                species: school.species,
                memberCount: activeMembers.length,
                center: {
                    worldX: school.center.worldX.toFixed(1),
                    y: school.center.y.toFixed(1)
                }
            });
        });

        return info;
    }

    /**
     * Force create a school (for testing or manual school creation)
     */
    forceCreateSchool(species, fishList) {
        if (fishList.length < this.config.minSchoolSize) {
            console.warn(`Cannot create school: need at least ${this.config.minSchoolSize} fish`);
            return null;
        }

        this.createSchool(species, fishList);
        return fishList[0].schooling?.schoolId || null;
    }

    /**
     * Remove fish from school (when consumed or removed from scene)
     */
    removeFishFromSchool(fish) {
        if (!fish.schooling || !fish.schooling.schoolId) return;

        const school = this.schools.get(fish.schooling.schoolId);
        if (school) {
            school.members.delete(fish);
            fish.schooling.clearSchool();
        }
    }

    /**
     * Reset school manager (clear all schools)
     */
    reset() {
        this.schools.forEach(school => {
            this.disbandSchool(school);
        });
        this.schools.clear();
        this.nextSchoolId = 1;
        this.frameCount = 0;
    }
}

export default SchoolManager;
