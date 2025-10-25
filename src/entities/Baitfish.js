import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import { getBaitfishSpecies } from '../config/SpeciesData.js';

export class Baitfish {
    constructor(scene, worldX, y, cloudId, speciesType = 'alewife') {
        this.scene = scene;
        this.worldX = worldX; // World X coordinate (like fish)
        this.x = worldX; // Screen X coordinate (calculated in update)
        this.y = y;
        this.cloudId = cloudId;
        this.depth = y / GameConfig.DEPTH_SCALE;

        // Load species-specific data
        this.species = speciesType;
        this.speciesData = getBaitfishSpecies(speciesType);

        // Baitfish properties - now based on real species data
        this.length = Utils.randomBetween(
            this.speciesData.sizeRange.min,
            this.speciesData.sizeRange.max
        ); // inches (realistic scale)
        this.size = this.length / 4; // visual size multiplier for rendering
        this.speed = Utils.randomBetween(
            this.speciesData.speed.base * 0.8,
            this.speciesData.speed.base * 1.2
        );

        // Movement behavior (use world coordinates)
        this.targetWorldX = worldX;
        this.targetY = y;
        this.schoolingOffset = {
            x: Utils.randomBetween(-8, 8),  // Reduced from -15,15 for tighter schooling
            y: Utils.randomBetween(-5, 5)   // Reduced from -10,10 for tighter schooling
        };

        // Velocity tracking for alignment rule
        this.velocityX = 0;
        this.velocityY = 0;

        // Visual properties for sonar display
        this.sonarTrail = [];
        this.maxTrailLength = 15;
        this.graphics = scene.add.graphics();

        // State
        this.consumed = false;
        this.visible = true;
        this.age = 0;
        this.panicMode = false;

        // Target persistence for hunting behavior
        this.currentTarget = null; // Currently targeted zooplankton
        this.targetLockTime = 0; // How long we've been locked onto this target
        this.minLockDuration = 120; // Minimum frames before switching targets (2 seconds at 60fps)

        // Flicker effect for baitfish (they shimmer on sonar)
        this.flickerPhase = Math.random() * Math.PI * 2;
    }

    update(cloudCenter, lakersNearby = false, spreadMultiplier = 1.0, scaredLevel = 0, nearbyZooplankton = [], otherBaitfish = []) {
        if (this.consumed || !this.visible) {
            return;
        }

        this.age++;

        // Check for nearby zooplankton to hunt (new feature)
        if (nearbyZooplankton && nearbyZooplankton.length > 0 && !lakersNearby) {
            this.handleHuntingBehavior(nearbyZooplankton, otherBaitfish);
        } else {
            // Normal schooling behavior (confused behavior removed in main)
            this.handleNormalBehavior(cloudCenter, lakersNearby, spreadMultiplier, otherBaitfish);
        }

        this.depth = this.y / GameConfig.DEPTH_SCALE;

        // Get lake bottom depth at baitfish's current world position
        let bottomDepth = GameConfig.MAX_DEPTH;
        if (this.scene.boatManager) {
            bottomDepth = this.scene.boatManager.getDepthAtPosition(this.worldX);
        } else if (this.scene.iceHoleManager) {
            // For ice fishing, get bottom from current hole's profile
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            if (currentHole && currentHole.bottomProfile) {
                const closest = currentHole.bottomProfile.reduce((prev, curr) =>
                    Math.abs(curr.x - this.x) < Math.abs(prev.x - this.x) ? curr : prev
                );
                bottomDepth = closest.y / GameConfig.DEPTH_SCALE;
            }
        }

        // Keep above lake bottom (with 5 feet buffer)
        const maxY = (bottomDepth - 5) * GameConfig.DEPTH_SCALE;

        // Keep in bounds
        this.y = Math.max(10, Math.min(maxY, this.y));

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
        this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;

        // Remove if too far from player in world coordinates
        const distanceFromPlayer = Math.abs(this.worldX - playerWorldX);
        if (distanceFromPlayer > 600) {
            this.visible = false;
        }

        // Update sonar trail
        this.updateSonarTrail();

        // Render
        this.render();
    }

    handleNormalBehavior(cloudCenter, lakersNearby, spreadMultiplier, otherBaitfish = []) {
        // Check if lakers are nearby - if so, panic!
        if (lakersNearby) {
            this.panicMode = true;
        }

        // Apply spread multiplier to schooling offset range
        // When safe: larger spread (spreadMultiplier ~2.0)
        // When scared: maintain larger minimum size to prevent compression
        const minOffsetX = 40; // Increased from 25 - minimum horizontal spread
        const minOffsetY = 25; // Increased from 15 - minimum vertical spread
        const maxOffsetX = Math.max(minOffsetX, 50 * spreadMultiplier); // Increased from 30
        const maxOffsetY = Math.max(minOffsetY, 30 * spreadMultiplier); // Increased from 20

        // Schooling behavior - stay near cloud center with dynamic offset (use world coordinates)
        this.targetWorldX = cloudCenter.worldX + this.schoolingOffset.x * spreadMultiplier;
        this.targetY = cloudCenter.y + this.schoolingOffset.y * spreadMultiplier;

        // FLOCKING RULES - Three classic boids behaviors
        // Rule 1: Separation - prevent baitfish from overlapping
        // Rule 2: Cohesion - stay close to neighbors
        // Rule 3: Alignment - match swimming direction with neighbors

        let separationX = 0;
        let separationY = 0;
        let cohesionX = 0;
        let cohesionY = 0;
        let alignmentX = 0;
        let alignmentY = 0;
        let neighborCount = 0;

        const separationRadius = 12; // Minimum distance between fish
        const neighborRadius = 50; // Detection range for cohesion and alignment

        otherBaitfish.forEach(other => {
            if (other === this || !other.visible || other.consumed) return;

            const dx = this.worldX - other.worldX;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Rule 1: SEPARATION - If too close, add repulsion force
            if (distance < separationRadius && distance > 0) {
                const strength = (separationRadius - distance) / separationRadius;
                separationX += (dx / distance) * strength * 5;
                separationY += (dy / distance) * strength * 5;
            }

            // Rule 2 & 3: COHESION and ALIGNMENT - Track neighbors within detection radius
            if (distance < neighborRadius && distance > 0) {
                // Cohesion: accumulate neighbor positions
                cohesionX += other.worldX;
                cohesionY += other.y;

                // Alignment: accumulate neighbor velocities
                alignmentX += other.velocityX;
                alignmentY += other.velocityY;

                neighborCount++;
            }
        });

        // Apply all three flocking forces to target position
        if (neighborCount > 0) {
            // Apply separation force (push away from too-close neighbors)
            this.targetWorldX += separationX;
            this.targetY += separationY;

            // BOUNDARY DETECTION: Reduce cohesion/alignment near surface to prevent adhesion
            const surfaceLimit = 50; // Within 50px (~14 feet) of surface
            const nearSurface = this.y <= surfaceLimit;
            const boundaryPenalty = nearSurface ? 0.3 : 1.0; // 70% reduction near surface

            // Rule 2: COHESION - steer towards average position of neighbors
            const avgNeighborX = cohesionX / neighborCount;
            const avgNeighborY = cohesionY / neighborCount;
            const cohesionForceX = (avgNeighborX - this.worldX) * 0.05 * boundaryPenalty;
            const cohesionForceY = (avgNeighborY - this.y) * 0.05 * boundaryPenalty;
            this.targetWorldX += cohesionForceX;
            this.targetY += cohesionForceY;

            // Rule 3: ALIGNMENT - match average velocity of neighbors
            const avgVelocityX = alignmentX / neighborCount;
            const avgVelocityY = alignmentY / neighborCount;
            const alignmentForceX = (avgVelocityX - this.velocityX) * 0.1 * boundaryPenalty;
            const alignmentForceY = (avgVelocityY - this.velocityY) * 0.1 * boundaryPenalty;
            this.targetWorldX += alignmentForceX;
            this.targetY += alignmentForceY;
        }

        // Add some random wandering (reduced for tighter schooling)
        if (Math.random() < 0.015) {  // Reduced from 0.02
            const wanderAmount = spreadMultiplier > 1.0 ? 3 : 1.5;  // Reduced from 5 and 2
            this.schoolingOffset.x += Utils.randomBetween(-wanderAmount, wanderAmount);
            this.schoolingOffset.y += Utils.randomBetween(-wanderAmount * 0.6, wanderAmount * 0.6);

            // Keep offset within reasonable bounds
            this.schoolingOffset.x = Math.max(-maxOffsetX, Math.min(maxOffsetX, this.schoolingOffset.x));
            this.schoolingOffset.y = Math.max(-maxOffsetY, Math.min(maxOffsetY, this.schoolingOffset.y));
        }

        // Move towards target with schooling behavior (use world coordinates)
        const dx = this.targetWorldX - this.worldX;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            // Use species-specific panic speed - but cap it to prevent line formation
            let speedMultiplier = 1.2; // Base multiplier for normal schooling

            if (this.panicMode) {
                // Reduce panic multiplier to prevent fish from catching up too fast
                // This was causing line formation when cloud fled
                const rawPanicMultiplier = this.speciesData.speed.panic / this.speciesData.speed.base;
                speedMultiplier = Math.min(1.8, rawPanicMultiplier); // Cap at 1.8x (was 2.5x+)
            }

            const moveSpeed = this.speed * speedMultiplier;

            // When panicking, match vertical and horizontal speed better to maintain cloud shape
            const verticalMultiplier = this.panicMode ? 0.9 : 0.7; // Faster vertical when panicking

            // Calculate movement delta and update velocity
            const moveDx = (dx / distance) * moveSpeed;
            const moveDy = (dy / distance) * moveSpeed * verticalMultiplier;

            this.worldX += moveDx;
            this.y += moveDy;

            // Update velocity for alignment rule
            this.velocityX = moveDx;
            this.velocityY = moveDy;
        } else {
            // Not moving, decay velocity
            this.velocityX *= 0.9;
            this.velocityY *= 0.9;
        }

        // Reset panic after a while
        if (this.panicMode && Math.random() < 0.01) {
            this.panicMode = false;
        }
    }

    handleHuntingBehavior(nearbyZooplankton, otherBaitfish = []) {
        // Check if current target is still valid
        if (this.currentTarget && this.currentTarget.visible && !this.currentTarget.consumed) {
            // Increment lock time
            this.targetLockTime++;

            // Verify target is still in range (not too far away)
            const currentDist = Math.sqrt(
                Math.pow(this.x - this.currentTarget.x, 2) +
                Math.pow(this.y - this.currentTarget.y, 2)
            );

            // Keep current target if within reasonable range
            if (currentDist < 200) {
                // Current target is valid, use it
                let bestZooplankton = this.currentTarget;

                // Only consider switching if we've been locked long enough AND a much better option exists
                if (this.targetLockTime > this.minLockDuration) {
                    let bestScore = currentDist; // Current target's score

                    nearbyZooplankton.forEach(zp => {
                        if (!zp.visible || zp.consumed || zp === this.currentTarget) return;

                        const distance = Math.sqrt(
                            Math.pow(this.x - zp.x, 2) +
                            Math.pow(this.y - zp.y, 2)
                        );

                        // Count competitors for this alternative target
                        let competitorCount = 0;
                        otherBaitfish.forEach(other => {
                            if (other === this || !other.visible || other.consumed) return;
                            const otherDist = Math.sqrt(
                                Math.pow(other.x - zp.x, 2) +
                                Math.pow(other.y - zp.y, 2)
                            );
                            if (otherDist < 20) {
                                competitorCount++;
                            }
                        });

                        const score = distance + (competitorCount * 15);

                        // Only switch if significantly better (50% improvement)
                        if (score < bestScore * 0.5) {
                            bestScore = score;
                            bestZooplankton = zp;
                        }
                    });

                    // If we switched targets, reset lock time
                    if (bestZooplankton !== this.currentTarget) {
                        this.currentTarget = bestZooplankton;
                        this.targetLockTime = 0;
                    }
                }
                // Continue with current or newly selected target
            } else {
                // Target moved too far, release it
                this.currentTarget = null;
                this.targetLockTime = 0;
            }
        }

        // If no valid current target, find a new one
        if (!this.currentTarget) {
            let bestZooplankton = null;
            let bestScore = Infinity;

            nearbyZooplankton.forEach(zp => {
                if (!zp.visible || zp.consumed) return;

                const distance = Math.sqrt(
                    Math.pow(this.x - zp.x, 2) +
                    Math.pow(this.y - zp.y, 2)
                );

                // Count how many other baitfish are targeting this zooplankton
                let competitorCount = 0;
                otherBaitfish.forEach(other => {
                    if (other === this || !other.visible || other.consumed) return;
                    const otherDist = Math.sqrt(
                        Math.pow(other.x - zp.x, 2) +
                        Math.pow(other.y - zp.y, 2)
                    );
                    if (otherDist < 20) { // Within 20px = competing for same food
                        competitorCount++;
                    }
                });

                // Score = distance + penalty for crowding (prefer uncrowded targets)
                const score = distance + (competitorCount * 15);

                if (score < bestScore) {
                    bestScore = score;
                    bestZooplankton = zp;
                }
            });

            // Set new target and reset lock time
            this.currentTarget = bestZooplankton;
            this.targetLockTime = 0;
        }

        let bestZooplankton = this.currentTarget;

        if (bestZooplankton) {
            const targetDistance = Math.sqrt(
                Math.pow(this.x - bestZooplankton.x, 2) +
                Math.pow(this.y - bestZooplankton.y, 2)
            );

            // If close enough, consume the zooplankton
            if (targetDistance < 5) {
                bestZooplankton.consume();
                // Clear current target so we look for a new one
                this.currentTarget = null;
                this.targetLockTime = 0;
                // Don't return - continue hunting more zooplankton
            }

            // Calculate base target position
            this.targetWorldX = bestZooplankton.worldX;
            this.targetY = bestZooplankton.y;

            // FLOCKING RULES during hunting - maintain school cohesion even while feeding
            let separationX = 0;
            let separationY = 0;
            let cohesionX = 0;
            let cohesionY = 0;
            let alignmentX = 0;
            let alignmentY = 0;
            let neighborCount = 0;

            const separationRadius = 15; // Minimum distance during feeding
            const neighborRadius = 50; // Detection range for cohesion and alignment

            otherBaitfish.forEach(other => {
                if (other === this || !other.visible || other.consumed) return;

                const dx = this.worldX - other.worldX;
                const dy = this.y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Rule 1: SEPARATION - Push away from nearby baitfish
                if (dist < separationRadius && dist > 0) {
                    const force = (separationRadius - dist) / separationRadius;
                    separationX += (dx / dist) * force * 8;
                    separationY += (dy / dist) * force * 8;
                }

                // Rule 2 & 3: COHESION and ALIGNMENT - Track neighbors
                if (dist < neighborRadius && dist > 0) {
                    cohesionX += other.worldX;
                    cohesionY += other.y;
                    alignmentX += other.velocityX;
                    alignmentY += other.velocityY;
                    neighborCount++;
                }
            });

            // Apply all three flocking forces
            if (neighborCount > 0) {
                // Apply separation
                this.targetWorldX += separationX;
                this.targetY += separationY;

                // BOUNDARY DETECTION: Reduce cohesion/alignment near surface
                const surfaceLimit = 50;
                const nearSurface = this.y <= surfaceLimit;
                const boundaryPenalty = nearSurface ? 0.3 : 1.0;

                // Rule 2: COHESION - steer towards neighbors (weaker during hunting)
                const avgNeighborX = cohesionX / neighborCount;
                const avgNeighborY = cohesionY / neighborCount;
                const cohesionForceX = (avgNeighborX - this.worldX) * 0.03 * boundaryPenalty;
                const cohesionForceY = (avgNeighborY - this.y) * 0.03 * boundaryPenalty;
                this.targetWorldX += cohesionForceX;
                this.targetY += cohesionForceY;

                // Rule 3: ALIGNMENT - match velocity
                const avgVelocityX = alignmentX / neighborCount;
                const avgVelocityY = alignmentY / neighborCount;
                const alignmentForceX = (avgVelocityX - this.velocityX) * 0.08 * boundaryPenalty;
                const alignmentForceY = (avgVelocityY - this.velocityY) * 0.08 * boundaryPenalty;
                this.targetWorldX += alignmentForceX;
                this.targetY += alignmentForceY;
            }

            // Move towards adjusted target position
            const dx = this.targetWorldX - this.worldX;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 1) {
                // Hunt at moderate speed (reduced from 1.2 to prevent bunching)
                const moveSpeed = this.speed * 1.0;

                // Calculate movement delta and update velocity
                const moveDx = (dx / distance) * moveSpeed;
                const moveDy = (dy / distance) * moveSpeed;

                this.worldX += moveDx;
                this.y += moveDy;

                // Update velocity for alignment rule
                this.velocityX = moveDx;
                this.velocityY = moveDy;
            } else {
                // Not moving, decay velocity
                this.velocityX *= 0.9;
                this.velocityY *= 0.9;
            }
        }
    }


    updateSonarTrail() {
        // Add current position to trail
        this.sonarTrail.push({
            x: this.x,
            y: this.y,
            age: 0
        });

        // Age trail points and remove old ones
        this.sonarTrail = this.sonarTrail.filter(point => {
            point.age++;
            return point.age < this.maxTrailLength;
        });
    }

    render() {
        this.graphics.clear();

        if (!this.visible || this.consumed) return;

        // Baitfish are much smaller and show up differently on sonar
        // Alewives create a distinct "cloud" pattern on sonar

        // Flicker effect (baitfish shimmer on sonar)
        this.flickerPhase += 0.1;
        const flickerIntensity = Math.sin(this.flickerPhase) * 0.3 + 0.7;

        // Color - use species-specific colors
        const color = this.panicMode
            ? this.speciesData.panicColor
            : this.speciesData.color;

        // Draw very faint trail
        for (let i = 0; i < this.sonarTrail.length - 1; i++) {
            const point = this.sonarTrail[i];
            const alpha = (1 - point.age / this.maxTrailLength) * 0.2 * flickerIntensity;

            if (i > 0) {
                const prevPoint = this.sonarTrail[i - 1];
                this.graphics.lineStyle(1, color, alpha);
                this.graphics.lineBetween(prevPoint.x, prevPoint.y, point.x, point.y);
            }
        }

        // Draw main baitfish (small mark)
        const bodySize = this.size + 1;

        // Body shape varies by species
        const appearance = this.speciesData.appearance;
        const bodyLength = bodySize * 1.5 * appearance.length;
        const bodyHeight = bodySize * 0.7 * appearance.height;

        // Draw body based on species shape
        this.graphics.fillStyle(color, 0.6 * flickerIntensity);

        if (appearance.bodyShape === 'slender') {
            // Slender, elongated (smelt, cisco)
            this.graphics.fillEllipse(this.x, this.y, bodyLength * 1.2, bodyHeight * 0.6);
        } else if (appearance.bodyShape === 'deep') {
            // Deep-bodied (alewife, perch)
            this.graphics.fillEllipse(this.x, this.y, bodyLength, bodyHeight * 1.1);
        } else if (appearance.bodyShape === 'bottom') {
            // Bottom-dwelling (sculpin) - flattened
            this.graphics.fillEllipse(this.x, this.y, bodyLength * 0.9, bodyHeight * 0.5);
        } else {
            // Default streamlined shape
            this.graphics.fillEllipse(this.x, this.y, bodyLength, bodyHeight);
        }

        // Brighter center dot
        this.graphics.fillStyle(color, 0.9 * flickerIntensity);
        this.graphics.fillCircle(this.x, this.y, bodySize * 0.4);

        // Species-specific features
        this.renderSpeciesFeatures(bodySize, color, flickerIntensity, appearance);

        // Occasional flash (like light reflecting off scales on sonar)
        if (Math.random() < 0.05) {
            this.graphics.lineStyle(1, color, 0.8);
            this.graphics.strokeCircle(this.x, this.y, bodySize * 2);
        }
    }

    renderSpeciesFeatures(bodySize, color, flickerIntensity, appearance) {
        // Render species-specific visual features

        // Yellow Perch - vertical bars
        if (this.species === 'yellow_perch' && appearance.features.includes('vertical_bars')) {
            const barCount = appearance.barCount || 7;
            const barColor = 0x2a3a1a; // dark bars
            this.graphics.fillStyle(barColor, 0.5 * flickerIntensity);

            for (let i = 0; i < barCount; i++) {
                const barX = this.x - bodySize + (i * bodySize * 0.4);
                this.graphics.fillRect(
                    barX,
                    this.y - bodySize * 0.6,
                    bodySize * 0.12,
                    bodySize * 1.2
                );
            }

            // Orange fins
            if (appearance.finColor) {
                this.graphics.fillStyle(appearance.finColor, 0.6 * flickerIntensity);
                this.graphics.fillCircle(this.x, this.y + bodySize * 0.5, bodySize * 0.3);
            }
        }

        // Alewife - dark gill spot
        if (this.species === 'alewife' && appearance.features.includes('dark_gill_spot')) {
            this.graphics.fillStyle(0x2a3a4a, 0.7 * flickerIntensity);
            this.graphics.fillCircle(this.x - bodySize * 0.5, this.y - bodySize * 0.2, bodySize * 0.2);
        }

        // Smelt, Cisco - iridescent sheen
        if (appearance.features.includes('iridescent_sheen')) {
            const iridColor = this.species === 'rainbow_smelt' ? 0xffccff : 0xccddff;
            this.graphics.fillStyle(iridColor, 0.3 * flickerIntensity);
            this.graphics.fillCircle(this.x, this.y, bodySize * 0.6);
        }

        // Sculpin - camouflage pattern
        if (this.species === 'sculpin' && appearance.features.includes('camouflage_pattern')) {
            // Random mottled spots
            for (let i = 0; i < 3; i++) {
                const spotX = this.x + Utils.randomBetween(-bodySize * 0.5, bodySize * 0.5);
                const spotY = this.y + Utils.randomBetween(-bodySize * 0.3, bodySize * 0.3);
                this.graphics.fillStyle(0x3a4a2a, 0.5 * flickerIntensity);
                this.graphics.fillCircle(spotX, spotY, bodySize * 0.15);
            }
        }
    }

    consume() {
        this.consumed = true;
        this.visible = false;
    }

    getPosition() {
        return { x: this.x, y: this.y, depth: this.depth };
    }

    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
        }
    }
}

export default Baitfish;
