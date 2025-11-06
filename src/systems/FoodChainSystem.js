import { getOrganismData, canEat, getFoodChainLevel } from '../config/OrganismData.js';
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
export class FoodChainSystem {
    constructor(scene) {
        this.scene = scene;
        // Configuration
        this.config = {
            // Detection ranges
            zooplanktonDetectionRange: 50, // Baitfish/crayfish can see zooplankton this far
            crayfishDetectionRange: 100, // Predators can detect crayfish
            baitfishDetectionRange: 120, // Predators can detect baitfish (from FishAI)
            // Consumption ranges (must be this close to eat)
            zooplanktonConsumeRange: 8, // Baitfish/crayfish must be this close
            crayfishConsumeRange: 15, // Predators must be this close
            baitfishConsumeRange: 12, // Predators must be this close
            // Threat detection (for crayfish burst escape)
            crayfishThreatRadius: 100, // Distance to detect predators
            // Update frequency
            updateFrequency: 3, // Update every 3 frames for performance
        };
        this.frameCount = 0;
        // Stats for debugging
        this.stats = {
            zooplanktonConsumed: 0,
            crayfishConsumed: 0,
            baitfishConsumed: 0,
            perchConsumed: 0
        };
    }
    /**
     * Update food chain interactions
     */
    update() {
        this.frameCount++;
        // Only update every N frames for performance
        if (this.frameCount % this.config.updateFrequency !== 0) {
            return;
        }
        // Get all organisms from scene
        const zooplankton = this.scene.zooplankton || [];
        const crayfish = this.scene.crayfish || [];
        const baitfish = this.getBaitfish();
        const predators = this.getPredators();
        // Bottom of food chain: zooplankton are consumed
        this.updateZooplanktonFeeding(baitfish, crayfish, zooplankton);
        // Crayfish threat detection and escape
        this.updateCrayfishThreats(crayfish, predators);
        // Middle of chain: baitfish and crayfish are consumed
        this.updatePredatorFeeding(predators, baitfish, crayfish);
    }
    /**
     * Get all baitfish from scene
     */
    getBaitfish() {
        const allFish = this.scene.fishes || [];
        return allFish.filter(fish => fish.type === 'bait');
    }
    /**
     * Get all predator fish from scene
     */
    getPredators() {
        const allFish = this.scene.fishes || [];
        return allFish.filter(fish => fish.type === 'predator');
    }
    /**
     * Update zooplankton feeding (baitfish and crayfish eat zooplankton)
     */
    updateZooplanktonFeeding(baitfish, crayfish, zooplankton) {
        // Filter active zooplankton
        const activeZooplankton = zooplankton.filter(zp => zp.active && !zp.consumed && zp.visible);
        if (activeZooplankton.length === 0)
            return;
        // Baitfish eating zooplankton
        baitfish.forEach(fish => {
            if (!fish.active || fish.consumed)
                return;
            // Check feeding cooldown
            const now = this.scene.time.now;
            if (fish.lastFeedTime && now - fish.lastFeedTime < fish.feedCooldown) {
                return; // Still cooling down
            }
            // Find nearest zooplankton
            const nearest = this.findNearestPrey(fish, activeZooplankton, this.config.zooplanktonDetectionRange);
            if (nearest) {
                const distance = nearest.distance;
                // Close enough to consume?
                if (distance < this.config.zooplanktonConsumeRange) {
                    nearest.prey.markConsumed();
                    fish.lastFeedTime = now;
                    this.stats.zooplanktonConsumed++;
                }
            }
        });
        // Crayfish eating zooplankton (already handled in CrayfishSprite.handleHuntingBehavior)
        // But we track the consumption here for stats
        crayfish.forEach(cf => {
            if (!cf.active || cf.consumed)
                return;
            const nearest = this.findNearestPrey(cf, activeZooplankton, this.config.zooplanktonDetectionRange);
            if (nearest && nearest.distance < this.config.zooplanktonConsumeRange) {
                // Crayfish handles its own consumption in its update method
                // We just track stats here
            }
        });
    }
    /**
     * Update crayfish threat detection (triggers burst escape)
     */
    updateCrayfishThreats(crayfish, predators) {
        crayfish.forEach(cf => {
            if (!cf.active || cf.consumed)
                return;
            // Check for nearby predators that can eat crayfish
            let threatened = false;
            predators.forEach(predator => {
                if (!predator.active)
                    return;
                // Can this predator eat crayfish?
                if (!canEat(predator.species, 'crayfish'))
                    return;
                // Check distance
                const dx = predator.worldX - cf.worldX;
                const dy = predator.y - cf.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < this.config.crayfishThreatRadius) {
                    threatened = true;
                }
            });
            // Update crayfish threat status
            cf.setThreatened(threatened);
        });
    }
    /**
     * Update predator feeding (predators eat baitfish, crayfish, and smaller fish)
     */
    updatePredatorFeeding(predators, baitfish, crayfish) {
        predators.forEach(predator => {
            if (!predator.active || predator.caught)
                return;
            // Skip if predator has AI (FishAI handles its own feeding)
            // This system is for predators without AI or as a backup
            if (predator.ai)
                return;
            const predatorData = getOrganismData(predator.species);
            if (!predatorData)
                return;
            // Check what this predator can eat
            if (predatorData.canEat.includes('zooplankton')) {
                // This predator can eat zooplankton (unlikely for predators)
            }
            if (predatorData.canEat.includes('bait')) {
                // Check for nearby baitfish
                const activeBaitfish = baitfish.filter(bf => bf.active && !bf.consumed && bf.visible);
                const nearestBait = this.findNearestPrey(predator, activeBaitfish, this.config.baitfishDetectionRange);
                if (nearestBait && nearestBait.distance < this.config.baitfishConsumeRange) {
                    this.consumePrey(predator, nearestBait.prey);
                    this.stats.baitfishConsumed++;
                }
            }
            if (predatorData.canEat.includes('crayfish')) {
                // Check for nearby crayfish
                const activeCrayfish = crayfish.filter(cf => cf.active && !cf.consumed && cf.visible);
                const nearestCrayfish = this.findNearestPrey(predator, activeCrayfish, this.config.crayfishDetectionRange);
                if (nearestCrayfish && nearestCrayfish.distance < this.config.crayfishConsumeRange) {
                    this.consumePrey(predator, nearestCrayfish.prey);
                    this.stats.crayfishConsumed++;
                }
            }
            // Check if can eat other fish (yellow perch eaten by larger predators)
            const otherFish = predatorData.canEat.filter(prey => prey !== 'zooplankton' && prey !== 'bait' && prey !== 'crayfish');
            if (otherFish.length > 0) {
                // Find smaller predators this fish can eat
                const possiblePrey = predators.filter(other => {
                    if (other === predator || !other.active || other.caught)
                        return false;
                    return otherFish.includes(other.species);
                });
                const nearestFish = this.findNearestPrey(predator, possiblePrey, this.config.baitfishDetectionRange);
                if (nearestFish && nearestFish.distance < this.config.baitfishConsumeRange) {
                    this.consumePrey(predator, nearestFish.prey);
                    this.stats.perchConsumed++;
                }
            }
        });
    }
    /**
     * Find nearest prey within range
     * @returns { prey, distance } or null if none found
     */
    findNearestPrey(predator, preyList, maxRange) {
        let nearest = null;
        let nearestDist = maxRange;
        preyList.forEach(prey => {
            const dx = prey.worldX - predator.worldX;
            const dy = prey.y - predator.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < nearestDist) {
                nearestDist = distance;
                nearest = { prey, distance };
            }
        });
        return nearest;
    }
    /**
     * Consume prey (mark as consumed, update predator biology)
     */
    consumePrey(predator, prey) {
        // Mark prey as consumed
        prey.markConsumed();
        // Update predator biology (if it has biology system)
        if (predator.feedOnPrey) {
            predator.feedOnPrey(prey.species);
        }
    }
    /**
     * Get system stats
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Reset stats
     */
    resetStats() {
        this.stats = {
            zooplanktonConsumed: 0,
            crayfishConsumed: 0,
            baitfishConsumed: 0,
            perchConsumed: 0
        };
    }
    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            frameCount: this.frameCount,
            stats: this.getStats(),
            zooplanktonCount: (this.scene.zooplankton || []).filter((z) => z.active).length,
            crayfishCount: (this.scene.crayfish || []).filter((c) => c.active).length,
            baitfishCount: this.getBaitfish().filter(f => f.active).length,
            predatorCount: this.getPredators().filter(f => f.active).length
        };
    }
    /**
     * Check if organism can eat another organism
     * @param predatorSpecies - Species of predator
     * @param preySpecies - Species of prey
     * @returns True if predator can eat prey
     */
    static canEat(predatorSpecies, preySpecies) {
        return canEat(predatorSpecies, preySpecies);
    }
    /**
     * Get food chain level for organism
     * @param species - Species name
     * @returns Food chain level (0 = bottom, higher = top)
     */
    static getFoodChainLevel(species) {
        return getFoodChainLevel(species);
    }
}
export default FoodChainSystem;
//# sourceMappingURL=FoodChainSystem.js.map