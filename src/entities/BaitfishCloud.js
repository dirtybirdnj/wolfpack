import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';
import Baitfish from './Baitfish.js';
import { getBaitfishSpecies } from '../config/SpeciesData.js';

export class BaitfishCloud {
    constructor(scene, worldX, y, count, speciesType = 'alewife') {
        this.scene = scene;
        this.id = `cloud_${Date.now()}_${Math.random()}`;
        this.worldX = worldX; // World X coordinate (like fish)
        this.centerX = worldX; // Screen X coordinate (calculated in update)
        this.centerY = y;
        this.depth = y / GameConfig.DEPTH_SCALE;

        // Species information
        this.speciesType = speciesType;
        this.speciesData = getBaitfishSpecies(speciesType);

        // Cloud properties
        this.baitfish = [];
        this.initialCount = count;
        this.visible = true;
        this.age = 0;

        // Movement
        this.velocity = {
            x: Utils.randomBetween(-0.5, 0.5),
            y: Utils.randomBetween(-0.2, 0.2)
        };

        // Cloud state
        this.lakersChasing = [];
        this.beingFrenzyFed = false;
        this.consumedCount = 0;

        // Dynamic schooling properties
        this.scaredLevel = 0; // 0-1, how scared the cloud is
        this.spreadMultiplier = 1.0; // 1.0 = normal, 0.5 = condensed, 2.0 = very spread out

        // Spawn the baitfish
        this.spawnBaitfish(count);
    }

    spawnBaitfish(count) {
        // Adjust spawn pattern based on species behavior
        const schoolingDensity = this.speciesData.schoolingDensity;
        let spreadX = 60;
        let spreadY = 40;

        if (schoolingDensity === 'very_high') {
            // Tighter schools (smelt)
            spreadX = 40;
            spreadY = 25;
        } else if (schoolingDensity === 'none') {
            // Very spread out (sculpin)
            spreadX = 100;
            spreadY = 60;
        }

        for (let i = 0; i < count; i++) {
            // Spawn in a cluster based on species schooling behavior
            const offsetX = Utils.randomBetween(-spreadX, spreadX);
            const offsetY = Utils.randomBetween(-spreadY, spreadY);

            const baitfish = new Baitfish(
                this.scene,
                this.worldX + offsetX,  // Use world coordinates
                this.centerY + offsetY,
                this.id,
                this.speciesType // Pass species type to baitfish
            );

            this.baitfish.push(baitfish);
        }
    }

    update(lakers = [], zooplankton = []) {
        if (!this.visible) return;

        this.age++;

        // Check for nearby lakers first to determine behavior
        const lakersNearby = this.checkForLakersNearby(lakers);

        // Check for nearby zooplankton (food source)
        const nearbyZooplankton = this.findNearbyZooplankton(zooplankton);

        // Update scared level based on laker proximity
        if (lakersNearby) {
            // Get scared quickly when lakers approach
            this.scaredLevel = Math.min(1.0, this.scaredLevel + 0.15);

            // Determine flee direction (away from nearest laker)
            if (this.lakersChasing.length > 0) {
                const nearestLaker = this.lakersChasing[0];
                const dx = this.worldX - nearestLaker.worldX;
                const dy = this.centerY - nearestLaker.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    // Flee directly away from laker with controlled speed
                    const fleeSpeed = 1.2; // Moderate flee speed (was 2.5, too fast!)
                    this.velocity.x = (dx / dist) * fleeSpeed;
                    this.velocity.y = (dy / dist) * fleeSpeed * 0.7; // Slower vertical
                }
            } else {
                // No specific laker, add erratic movement but keep it moderate
                this.velocity.x += Utils.randomBetween(-0.4, 0.4);
                this.velocity.y += Utils.randomBetween(-0.2, 0.2);
            }

            // Keep velocity reasonable - slower than before to prevent line formation
            this.velocity.x = Math.max(-1.5, Math.min(1.5, this.velocity.x));
            this.velocity.y = Math.max(-1.0, Math.min(1.0, this.velocity.y));

            // Condense the school when scared BUT not too tight (0.4 to 0.7 instead of 0.3-0.6)
            // This prevents fish from bunching into a single-file line
            this.spreadMultiplier = Math.max(0.4, 1.0 - (this.scaredLevel * 0.6));
        } else {
            // Calm down slowly when no lakers nearby
            this.scaredLevel = Math.max(0, this.scaredLevel - 0.02);

            // Spread out when safe (1.5 to 2.0 multiplier)
            this.spreadMultiplier = Math.min(2.0, 1.5 + (1 - this.scaredLevel) * 0.5);

            // Normal gentle drift
            if (Math.random() < 0.01) {
                this.velocity.x += Utils.randomBetween(-0.2, 0.2);
                this.velocity.y += Utils.randomBetween(-0.1, 0.1);
            }

            // Decay velocity when calm
            this.velocity.x *= 0.95;
            this.velocity.y *= 0.95;

            // Keep velocity reasonable
            this.velocity.x = Math.max(-1.0, Math.min(1.0, this.velocity.x));
            this.velocity.y = Math.max(-0.5, Math.min(0.5, this.velocity.y));
        }

        // Update center position (cloud drifts or flees) - use world coordinates
        this.worldX += this.velocity.x;
        this.centerY += this.velocity.y;
        this.depth = this.centerY / GameConfig.DEPTH_SCALE;

        // Get lake bottom depth at cloud's current world position
        let bottomDepth = GameConfig.MAX_DEPTH;
        if (this.scene.boatManager) {
            bottomDepth = this.scene.boatManager.getDepthAtPosition(this.worldX);
        } else if (this.scene.iceHoleManager) {
            // For ice fishing, get bottom from current hole's profile
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            if (currentHole && currentHole.bottomProfile) {
                const closest = currentHole.bottomProfile.reduce((prev, curr) =>
                    Math.abs(curr.x - this.centerX) < Math.abs(prev.x - this.centerX) ? curr : prev
                );
                bottomDepth = closest.y / GameConfig.DEPTH_SCALE;
            }
        }

        // Keep cloud above lake bottom (with 10 feet buffer)
        const maxY = (bottomDepth - 10) * GameConfig.DEPTH_SCALE;

        // Keep cloud in bounds
        this.centerY = Math.max(30, Math.min(maxY, this.centerY));

        // Convert world position to screen position based on player position
        let playerWorldX;
        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            playerWorldX = currentHole ? currentHole.x : this.worldX;
        } else if (this.scene.boatManager) {
            playerWorldX = this.scene.boatManager.getPlayerWorldX();
        } else {
            playerWorldX = this.worldX; // Fallback
        }

        const offsetFromPlayer = this.worldX - playerWorldX;
        this.centerX = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;

        // Update all baitfish in the cloud
        this.baitfish = this.baitfish.filter(baitfish => {
            if (!baitfish.consumed && baitfish.visible) {
                // Pass other baitfish in cloud for separation logic
                baitfish.update(
                    { worldX: this.worldX, x: this.centerX, y: this.centerY },
                    lakersNearby,
                    this.spreadMultiplier,
                    this.scaredLevel,
                    nearbyZooplankton,
                    this.baitfish // Pass all baitfish for separation
                );
                return true;
            } else if (baitfish.consumed) {
                baitfish.destroy();
                this.consumedCount++;
                return false;
            } else if (!baitfish.visible) {
                baitfish.destroy();
                return false;
            }
            return true;
        });

        // If cloud is mostly consumed or too old, mark for removal
        if (this.baitfish.length === 0 || this.age > 30000 || this.isOffScreen()) {
            this.visible = false;
        }
    }

    checkForLakersNearby(lakers) {
        // Check if any lakers are within detection range of the cloud
        const detectionRange = GameConfig.BAITFISH_CLOUD_RADIUS + 50;

        this.lakersChasing = lakers.filter(laker => {
            const distance = Utils.calculateDistance(
                laker.x, laker.y,
                this.centerX, this.centerY
            );
            return distance < detectionRange;
        });

        return this.lakersChasing.length > 0;
    }

    findNearbyZooplankton(zooplankton) {
        // Find zooplankton within detection range of the cloud
        const detectionRange = 200; // Baitfish can detect zooplankton from up to 200 pixels away

        return zooplankton.filter(zp => {
            if (!zp.visible || zp.consumed) return false;

            const distance = Utils.calculateDistance(
                zp.x, zp.y,
                this.centerX, this.centerY
            );
            return distance < detectionRange;
        });
    }

    consumeBaitfish() {
        // Find a random unconsumed baitfish and consume it
        const available = this.baitfish.filter(b => !b.consumed);
        if (available.length > 0) {
            const target = available[Math.floor(Math.random() * available.length)];
            target.consume();
            return target;
        }
        return null;
    }

    isPlayerLureInCloud(lure) {
        // Check if the player's lure is within the baitfish cloud
        const distance = Utils.calculateDistance(
            lure.x, lure.y,
            this.centerX, this.centerY
        );
        return distance < GameConfig.BAITFISH_CLOUD_RADIUS;
    }

    getClosestBaitfish(x, y) {
        // Find the closest baitfish to a given position
        let closest = null;
        let minDistance = Infinity;

        for (const baitfish of this.baitfish) {
            if (baitfish.consumed) continue;

            const distance = Utils.calculateDistance(x, y, baitfish.x, baitfish.y);
            if (distance < minDistance) {
                minDistance = distance;
                closest = baitfish;
            }
        }

        return { baitfish: closest, distance: minDistance };
    }

    isOffScreen() {
        // Check if cloud is too far from player in world coordinates
        let playerWorldX;
        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            playerWorldX = currentHole ? currentHole.x : 0;
        } else if (this.scene.boatManager) {
            playerWorldX = this.scene.boatManager.getPlayerWorldX();
        } else {
            return false;
        }

        const distanceFromPlayer = Math.abs(this.worldX - playerWorldX);
        return distanceFromPlayer > 600;
    }

    getInfo() {
        return {
            count: this.baitfish.length,
            consumed: this.consumedCount,
            depth: Math.floor(this.depth),
            lakersChasing: this.lakersChasing.length,
            position: { x: this.centerX, y: this.centerY }
        };
    }

    split() {
        // Split this cloud in half, return the new cloud
        if (this.baitfish.length < 4) {
            // Too small to split
            return null;
        }

        // Split baitfish array in half
        const halfIndex = Math.floor(this.baitfish.length / 2);
        const newCloudBaitfish = this.baitfish.splice(halfIndex);

        // Create new cloud slightly offset
        const offsetDirection = Math.random() < 0.5 ? 1 : -1;
        const newCloud = new BaitfishCloud(
            this.scene,
            this.centerX + (offsetDirection * 40),
            this.centerY,
            0 // Don't spawn new fish, we'll add the split ones
        );

        // Clear the auto-spawned baitfish and add our split ones
        newCloud.baitfish.forEach(b => b.destroy());
        newCloud.baitfish = newCloudBaitfish;

        // Update cloudId for the split baitfish
        newCloudBaitfish.forEach(baitfish => {
            baitfish.cloudId = newCloud.id;
        });

        // Give clouds opposite velocities to separate
        this.velocity.x = -offsetDirection * 1.5;
        newCloud.velocity.x = offsetDirection * 1.5;

        console.log(`Cloud split! ${this.baitfish.length} + ${newCloud.baitfish.length} baitfish`);

        return newCloud;
    }

    mergeWith(otherCloud) {
        // Merge another cloud into this one
        if (!otherCloud || !otherCloud.visible) return;

        // Calculate new center position BEFORE merging (weighted average based on baitfish count)
        const thisFishCount = this.baitfish.length;
        const otherFishCount = otherCloud.baitfish.length;
        const totalFish = thisFishCount + otherFishCount;

        if (totalFish > 0) {
            this.centerX = (this.centerX * thisFishCount + otherCloud.centerX * otherFishCount) / totalFish;
            this.centerY = (this.centerY * thisFishCount + otherCloud.centerY * otherFishCount) / totalFish;
            this.depth = this.centerY / GameConfig.DEPTH_SCALE;
        }

        // Transfer all baitfish from other cloud to this cloud
        otherCloud.baitfish.forEach(baitfish => {
            // Update the baitfish's cloud ID to point to this cloud
            baitfish.cloudId = this.id;
            this.baitfish.push(baitfish);
        });

        // Update consumed count
        this.consumedCount += otherCloud.consumedCount;

        // Average the velocities
        this.velocity.x = (this.velocity.x + otherCloud.velocity.x) / 2;
        this.velocity.y = (this.velocity.y + otherCloud.velocity.y) / 2;

        // Clear the other cloud's baitfish array so destroy doesn't kill them
        otherCloud.baitfish = [];
        otherCloud.visible = false;
    }

    destroy() {
        // Clean up all baitfish
        this.baitfish.forEach(baitfish => baitfish.destroy());
        this.baitfish = [];
        this.visible = false;
    }
}

export default BaitfishCloud;
