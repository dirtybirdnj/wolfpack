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
        if (!this.visible) {return null;}

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
                    const fleeSpeed = 1.2;

                    // SMART FLEE: Detect if trapped at surface
                    const surfaceLimit = 50; // Within 50px (~14 feet) of surface
                    const trappedAtSurface = this.centerY <= surfaceLimit;

                    if (trappedAtSurface && nearestLaker.y > this.centerY) {
                        // Lakers are below us and we're at surface - DIVE THROUGH or flee horizontally
                        const shouldDive = Math.random() < 0.3; // 30% chance to dive through

                        if (shouldDive) {
                            // Bold escape: dive down and sideways to break through
                            this.velocity.x = (dx / dist) * fleeSpeed * 1.5; // Fast horizontal
                            this.velocity.y = 1.5; // Force downward dive
                            console.log('Baitfish cloud diving through lakers to escape surface trap!');
                        } else {
                            // Flee horizontally only (no upward component)
                            this.velocity.x = (dx / dist) * fleeSpeed * 1.5;
                            this.velocity.y = Math.max(0, this.velocity.y * 0.5); // Allow down, prevent up
                        }
                    } else {
                        // Normal flee behavior
                        this.velocity.x = (dx / dist) * fleeSpeed;
                        this.velocity.y = (dy / dist) * fleeSpeed * 0.7; // Slower vertical
                    }
                }
            } else {
                // No specific laker, add erratic movement but keep it moderate
                this.velocity.x += Utils.randomBetween(-0.4, 0.4);
                this.velocity.y += Utils.randomBetween(-0.2, 0.2);
            }

            // Keep velocity reasonable - slower than before to prevent line formation
            this.velocity.x = Math.max(-1.5, Math.min(1.5, this.velocity.x));
            this.velocity.y = Math.max(-1.0, Math.min(1.0, this.velocity.y));

            // Condense the school when scared BUT maintain larger minimum size
            // Changed from 0.4-0.7 to 0.8-1.0 to keep clouds looser when frenzying
            // This prevents fish from bunching into a tight ball
            this.spreadMultiplier = Math.max(0.8, 1.0 - (this.scaredLevel * 0.2));
        } else {
            // Calm down slowly when no lakers nearby
            this.scaredLevel = Math.max(0, this.scaredLevel - 0.02);

            // Spread out when safe (1.5 to 2.0 multiplier)
            this.spreadMultiplier = Math.min(2.0, 1.5 + (1 - this.scaredLevel) * 0.5);

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

            // Keep velocity reasonable - increased max speeds for more wandering
            this.velocity.x = Math.max(-1.5, Math.min(1.5, this.velocity.x));
            this.velocity.y = Math.max(-0.8, Math.min(0.8, this.velocity.y));
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
        // Check if cloud is too far from player in world coordinates
        const playerWorldX = GameConfig.CANVAS_WIDTH / 2;
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
