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
        // Get dynamic depth scale from scene
        const depthScale = this.scene.sonarDisplay ? this.scene.sonarDisplay.getDepthScale() : GameConfig.DEPTH_SCALE;
        this.depth = y / depthScale;

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

        // Surface trap detection
        this.framesAtSurface = 0; // Track how long stuck at surface

        // Spawn the baitfish
        this.spawnBaitfish(count);
    }

    spawnBaitfish(count) {
        // Adjust spawn pattern based on species behavior
        const schoolingDensity = this.speciesData.schoolingDensity;
        let spreadX = 40; // Reduced from 60
        let spreadY = 25; // Reduced from 40

        if (schoolingDensity === 'very_high') {
            // Tighter schools (smelt)
            spreadX = 30; // Reduced from 40
            spreadY = 20; // Reduced from 25
        } else if (schoolingDensity === 'none') {
            // Very spread out (sculpin) - still reduced
            spreadX = 60; // Reduced from 100
            spreadY = 40; // Reduced from 60
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
        if (!this.visible) {return null;}

        this.age++;

        // Check if cloud is empty or too small BEFORE doing any updates/rendering
        // Single baitfish should disperse, not form a "cloud"
        if (this.baitfish.length <= 1) {
            // Destroy any remaining single baitfish
            this.baitfish.forEach(bf => bf.destroy());
            this.visible = false;
            return null;
        }

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
                // Use Phaser's optimized distance calculation
                const dist = Phaser.Math.Distance.Between(this.worldX, this.centerY, nearestLaker.worldX, nearestLaker.y);

                if (dist > 0) {
                    const fleeSpeed = 0.9; // Reduced from 1.2 - baitfish tire easily

                    // SMART FLEE: Detect if trapped at surface
                    const surfaceLimit = 50; // Within 50px (~14 feet) of surface
                    const trappedAtSurface = this.centerY <= surfaceLimit;

                    if (trappedAtSurface && nearestLaker.y > this.centerY) {
                        // Track how long we've been trapped at surface
                        this.framesAtSurface++;

                        // Increase dive chance based on entrapment duration
                        // Start at 30%, increase to 90% over 5 seconds (300 frames at 60fps)
                        const diveChance = Math.min(0.3 + (this.framesAtSurface / 300), 0.9);
                        const shouldDive = Math.random() < diveChance;

                        if (shouldDive) {
                            // Bold escape: dive down and sideways to break through
                            this.velocity.x = (dx / dist) * fleeSpeed * 1.5; // Fast horizontal
                            this.velocity.y = 1.5; // Force downward dive
                            console.log(`Baitfish cloud diving (${Math.round(diveChance * 100)}% chance, trapped for ${this.framesAtSurface} frames)`);
                        } else {
                            // Flee horizontally only (no upward component)
                            this.velocity.x = (dx / dist) * fleeSpeed * 1.5;
                            this.velocity.y = Math.max(0, this.velocity.y * 0.5); // Allow down, prevent up
                        }
                    } else {
                        // Normal flee behavior - not trapped at surface
                        this.framesAtSurface = 0; // Reset trap counter
                        this.velocity.x = (dx / dist) * fleeSpeed;
                        this.velocity.y = (dy / dist) * fleeSpeed * 0.7; // Slower vertical
                    }
                }
            } else {
                // No specific laker, add erratic movement but keep it moderate
                this.framesAtSurface = 0; // Reset trap counter when not fleeing
                this.velocity.x += Utils.randomBetween(-0.4, 0.4);
                this.velocity.y += Utils.randomBetween(-0.2, 0.2);
            }

            // Keep velocity reasonable - reduced max speeds so predators can catch them
            this.velocity.x = Math.max(-1.2, Math.min(1.2, this.velocity.x)); // Reduced from ±1.5
            this.velocity.y = Math.max(-0.8, Math.min(0.8, this.velocity.y)); // Reduced from ±1.0

            // Condense the school when scared - tighter formation
            // Reduced spread to keep schools more compact
            this.spreadMultiplier = Math.max(0.6, 0.9 - (this.scaredLevel * 0.3));
        } else {
            // Calm down slowly when no lakers nearby
            this.scaredLevel = Math.max(0, this.scaredLevel - 0.02);

            // Spread out when safe - but keep it tighter (1.0 to 1.3 multiplier)
            this.spreadMultiplier = Math.min(1.3, 1.0 + (1 - this.scaredLevel) * 0.3);

            // Normal active wandering - much more mobile now
            // Increased from 1% to 5% chance per frame for more frequent direction changes
            if (Math.random() < 0.05) {
                this.velocity.x += Utils.randomBetween(-0.4, 0.4);
                this.velocity.y += Utils.randomBetween(-0.2, 0.2);
            }

            // Reduced velocity decay when calm - keeps clouds moving longer
            // Changed from 0.95 to 0.98 (5% decay -> 2% decay)
            this.velocity.x *= 0.98;
            this.velocity.y *= 0.98;

            // Keep velocity reasonable - reduced for predator catchability
            this.velocity.x = Math.max(-1.0, Math.min(1.0, this.velocity.x)); // Reduced from ±1.5
            this.velocity.y = Math.max(-0.6, Math.min(0.6, this.velocity.y)); // Reduced from ±0.8
        }

        // Update center position (cloud drifts or flees) - use world coordinates
        this.worldX += this.velocity.x;
        this.centerY += this.velocity.y;
        // Get dynamic depth scale from scene
        const depthScale = this.scene.sonarDisplay ? this.scene.sonarDisplay.getDepthScale() : GameConfig.DEPTH_SCALE;
        this.depth = this.centerY / depthScale;

        // SURFACE TRAP DETECTION: Track if stuck at surface
        const surfaceLimit = 50;
        if (this.centerY <= surfaceLimit) {
            this.framesAtSurface++;

            // If stuck for too long (3 seconds = 180 frames), force a dive
            if (this.framesAtSurface > 180 && lakersNearby) {
                console.log('Cloud stuck at surface for too long - forcing escape dive!');
                this.velocity.y = 2.0; // Strong downward push
                this.framesAtSurface = 0; // Reset counter
            }
        } else {
            // Not at surface, reset counter
            this.framesAtSurface = Math.max(0, this.framesAtSurface - 5); // Decay faster
        }

        // Get lake bottom depth at cloud's current world position
        const bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;

        // Keep cloud in vertical bounds based on water depth
        // Allow baitfish clouds near surface but not at absolute top (prevents sticking at Y=0)
        const minY = 0.5 * depthScale; // 0.5 feet from surface
        const maxY = (bottomDepth - 5) * depthScale; // 5 feet from bottom
        this.centerY = Math.max(minY, Math.min(maxY, this.centerY));

        // Convert world position to screen position based on player position
        const playerWorldX = GameConfig.CANVAS_WIDTH / 2;
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

                // Check if baitfish has strayed too far from cloud center
                // Allow 2x the normal cloud radius for stragglers
                const maxStrayDistance = GameConfig.BAITFISH_CLOUD_RADIUS * 2;
                // Use Phaser's optimized distance calculation
                const distance = Phaser.Math.Distance.Between(baitfish.x, baitfish.y, this.centerX, this.centerY);

                if (distance > maxStrayDistance) {
                    // Baitfish strayed too far - remove from THIS cloud (but don't destroy)
                    // It can join another cloud or swim independently
                    baitfish.cloudId = null;
                    return false;
                }

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

        // HORIZONTAL LINE DETECTION - Despawn cloud if compressed into unrealistic formation
        // This simulates natural cloud dispersal behavior
        const surfaceDepthLimit = 15; // Feet from surface
        const surfaceYLimit = surfaceDepthLimit * depthScale;

        if (this.centerY <= surfaceYLimit && this.baitfish.length >= 8) {
            // Cloud is near surface - check if compressed into horizontal line
            let minY = Infinity;
            let maxY = -Infinity;
            let minX = Infinity;
            let maxX = -Infinity;

            this.baitfish.forEach(fish => {
                if (fish.y < minY) {minY = fish.y;}
                if (fish.y > maxY) {maxY = fish.y;}
                if (fish.worldX < minX) {minX = fish.worldX;}
                if (fish.worldX > maxX) {maxX = fish.worldX;}
            });

            const verticalSpread = maxY - minY;
            const horizontalSpread = maxX - minX;

            // If horizontal spread is much larger than vertical spread, we have a line
            const compressionRatio = horizontalSpread / (verticalSpread + 1);

            if (compressionRatio > 3.5) {
                // Cloud compressed into horizontal line - despawn it!
                console.log(`Cloud compressed (ratio: ${compressionRatio.toFixed(2)}) - dispersing naturally`);
                this.visible = false; // Cloud disperses
                return null;
            }
        }

        return null; // No split occurred
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
            if (!zp.visible || zp.consumed) {return false;}

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
            if (baitfish.consumed) {continue;}

            const distance = Utils.calculateDistance(x, y, baitfish.x, baitfish.y);
            if (distance < minDistance) {
                minDistance = distance;
                closest = baitfish;
            }
        }

        return { baitfish: closest, distance: minDistance };
    }

    isOffScreen() {
        // Check if cloud is actually off the visible screen
        // Convert worldX to screen position to check visibility
        const playerWorldX = GameConfig.CANVAS_WIDTH / 2;
        const offsetFromPlayer = this.worldX - playerWorldX;
        const actualGameWidth = this.scene.scale.width || GameConfig.CANVAS_WIDTH;
        const screenX = (actualGameWidth / 2) + offsetFromPlayer;

        // Cloud is off-screen if completely outside visible area (with buffer)
        const buffer = 150; // Allow 150px off-screen before despawning
        const isOffLeft = screenX < -buffer;
        const isOffRight = screenX > actualGameWidth + buffer;

        return isOffLeft || isOffRight;
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
        // Sculpin are solitary and should never split or be in clouds
        if (this.speciesType === 'sculpin') {
            console.warn('⚠️ Attempted to split sculpin cloud - sculpin are solitary!');
            return null;
        }

        // Split this cloud in half, return the new cloud
        if (this.baitfish.length < 4) {
            // Too small to split
            return null;
        }

        // Split baitfish array in half
        const halfIndex = Math.floor(this.baitfish.length / 2);
        const newCloudBaitfish = this.baitfish.splice(halfIndex);

        // Create new cloud slightly offset (use world coordinates!)
        const offsetDirection = Math.random() < 0.5 ? 1 : -1;
        const newCloud = new BaitfishCloud(
            this.scene,
            this.worldX + (offsetDirection * 40), // Use worldX, not centerX
            this.centerY,
            0, // Don't spawn new fish, we'll add the split ones
            this.speciesType // Preserve species type
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
        if (!otherCloud || !otherCloud.visible) {return;}

        // Calculate new center position BEFORE merging (weighted average based on baitfish count)
        const thisFishCount = this.baitfish.length;
        const otherFishCount = otherCloud.baitfish.length;
        const totalFish = thisFishCount + otherFishCount;

        // Prevent merging if combined cloud would exceed max size of 100
        if (totalFish > 100) {
            console.log(`⚠️ Merge blocked: would create cloud of ${totalFish} (max 100)`);
            return;
        }

        if (totalFish > 0) {
            this.centerX = (this.centerX * thisFishCount + otherCloud.centerX * otherFishCount) / totalFish;
            this.centerY = (this.centerY * thisFishCount + otherCloud.centerY * otherFishCount) / totalFish;
            // Get dynamic depth scale from scene
            const depthScale = this.scene.sonarDisplay ? this.scene.sonarDisplay.getDepthScale() : GameConfig.DEPTH_SCALE;
            this.depth = this.centerY / depthScale;
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
