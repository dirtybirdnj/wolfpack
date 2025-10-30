import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';
import { getBaitfishSpecies } from '../config/SpeciesData.js';
import AquaticOrganism from './AquaticOrganism.js';

/**
 * Baitfish Model - Extends AquaticOrganism with flocking and hunting behaviors
 *
 * Lightweight model for baitfish that:
 * - Uses flocking (boids) instead of heavy FishAI
 * - Hunts zooplankton with target persistence
 * - Maintains school cohesion
 * - Has species-specific rendering
 *
 * Performance optimized for many fish on screen simultaneously.
 */
export class Baitfish extends AquaticOrganism {
    constructor(scene, worldX, y, cloudId, speciesType = 'alewife') {
        // Get species data for super constructor
        const speciesData = getBaitfishSpecies(speciesType);

        // Call parent constructor with base properties
        super(scene, worldX, y, speciesType, speciesData);

        this.cloudId = cloudId;

        // Baitfish-specific size (from species data, not weight-based like predator fish)
        this.length = Utils.randomBetween(
            this.speciesData.sizeRange.min,
            this.speciesData.sizeRange.max
        ); // inches (realistic scale)
        this.size = this.length / 4; // visual size multiplier for rendering

        // Speed based on species data
        this.speed = Utils.randomBetween(
            this.speciesData.speed.base * 0.8,
            this.speciesData.speed.base * 1.2
        );

        // Flocking behavior properties (lightweight - no AI overhead)
        this.schoolingOffset = {
            x: Utils.randomBetween(-8, 8),
            y: Utils.randomBetween(-5, 5)
        };
        this.velocityX = 0;
        this.velocityY = 0;

        // Movement targets (use world coordinates)
        this.targetWorldX = worldX;
        this.targetY = y;

        // State
        this.consumed = false;
        this.panicMode = false;

        // Zooplankton hunting behavior
        this.currentTarget = null; // Currently targeted zooplankton
        this.targetLockTime = 0; // How long we've been locked onto this target
        this.minLockDuration = 120; // Minimum frames before switching targets (2 seconds at 60fps)

        // Visual properties
        this.flickerPhase = Math.random() * Math.PI * 2; // Shimmer on sonar
    }

    /**
     * Update baitfish position and behavior
     */
    update(cloudCenter, lakersNearby = false, spreadMultiplier = 1.0, scaredLevel = 0, nearbyZooplankton = [], otherBaitfish = []) {
        if (this.consumed || !this.visible) {
            return;
        }

        this.age++;

        // Choose behavior: hunting or normal schooling
        if (nearbyZooplankton && nearbyZooplankton.length > 0 && !lakersNearby) {
            this.handleHuntingBehavior(nearbyZooplankton, otherBaitfish);
        } else {
            this.handleNormalBehavior(cloudCenter, lakersNearby, spreadMultiplier, otherBaitfish);
        }

        this.depth = this.y / GameConfig.DEPTH_SCALE;

        // Keep in vertical bounds based on water depth
        const bottomDepth = this.getBottomDepthAtPosition();
        // Allow baitfish to swim all the way to surface (no minimum constraint)
        const minY = 0; // No minimum - can reach surface
        const maxY = (bottomDepth - 3) * GameConfig.DEPTH_SCALE; // 3 feet from bottom
        this.y = Math.max(minY, Math.min(maxY, this.y));

        // Update screen position and check if too far from player
        this.updateScreenPosition();
        if (this.isTooFarFromPlayer(600)) {
            this.visible = false;
        }
    }

    /**
     * Normal schooling behavior using flocking rules (boids)
     */
    handleNormalBehavior(cloudCenter, lakersNearby, spreadMultiplier, otherBaitfish = []) {
        // Check if lakers are nearby - if so, panic!
        if (lakersNearby) {
            this.panicMode = true;
        }

        // Apply spread multiplier to schooling offset range
        const minOffsetX = 40;
        const minOffsetY = 25;
        const maxOffsetX = Math.max(minOffsetX, 50 * spreadMultiplier);
        const maxOffsetY = Math.max(minOffsetY, 30 * spreadMultiplier);

        // Schooling behavior - stay near cloud center with dynamic offset (use world coordinates)
        this.targetWorldX = cloudCenter.worldX + this.schoolingOffset.x * spreadMultiplier;
        this.targetY = cloudCenter.y + this.schoolingOffset.y * spreadMultiplier;

        // FLOCKING RULES - Three classic boids behaviors
        let separationX = 0, separationY = 0;
        let cohesionX = 0, cohesionY = 0;
        let alignmentX = 0, alignmentY = 0;
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
                cohesionX += other.worldX;
                cohesionY += other.y;
                alignmentX += other.velocityX;
                alignmentY += other.velocityY;
                neighborCount++;
            }
        });

        // Apply all three flocking forces to target position
        if (neighborCount > 0) {
            // Apply separation force
            this.targetWorldX += separationX;
            this.targetY += separationY;

            // BOUNDARY DETECTION: Reduce cohesion/alignment near surface
            const surfaceLimit = 50;
            const nearSurface = this.y <= surfaceLimit;
            const boundaryPenalty = nearSurface ? 0.3 : 1.0;

            // Rule 2: COHESION - steer towards average position of neighbors
            const avgNeighborX = cohesionX / neighborCount;
            const avgNeighborY = cohesionY / neighborCount;
            this.targetWorldX += (avgNeighborX - this.worldX) * 0.05 * boundaryPenalty;
            this.targetY += (avgNeighborY - this.y) * 0.05 * boundaryPenalty;

            // Rule 3: ALIGNMENT - match average velocity of neighbors
            const avgVelocityX = alignmentX / neighborCount;
            const avgVelocityY = alignmentY / neighborCount;
            this.targetWorldX += (avgVelocityX - this.velocityX) * 0.1 * boundaryPenalty;
            this.targetY += (avgVelocityY - this.velocityY) * 0.1 * boundaryPenalty;
        }

        // Add some random wandering
        if (Math.random() < 0.015) {
            const wanderAmount = spreadMultiplier > 1.0 ? 3 : 1.5;
            this.schoolingOffset.x += Utils.randomBetween(-wanderAmount, wanderAmount);
            this.schoolingOffset.y += Utils.randomBetween(-wanderAmount * 0.6, wanderAmount * 0.6);

            // Keep offset within bounds
            this.schoolingOffset.x = Math.max(-maxOffsetX, Math.min(maxOffsetX, this.schoolingOffset.x));
            this.schoolingOffset.y = Math.max(-maxOffsetY, Math.min(maxOffsetY, this.schoolingOffset.y));
        }

        // Move towards target
        const dx = this.targetWorldX - this.worldX;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            let speedMultiplier = 1.2; // Base multiplier for normal schooling

            if (this.panicMode) {
                const rawPanicMultiplier = this.speciesData.speed.panic / this.speciesData.speed.base;
                speedMultiplier = Math.min(1.8, rawPanicMultiplier); // Cap to prevent line formation
            }

            const moveSpeed = this.speed * speedMultiplier;
            const verticalMultiplier = this.panicMode ? 0.9 : 0.7;

            const moveDx = (dx / distance) * moveSpeed;
            const moveDy = (dy / distance) * moveSpeed * verticalMultiplier;

            this.worldX += moveDx;
            this.y += moveDy;

            // Update velocity for alignment rule
            this.velocityX = moveDx;
            this.velocityY = moveDy;

            // Update angle for rendering
            this.angle = Math.atan2(moveDy, moveDx);
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

    /**
     * Hunting behavior - target zooplankton with persistence
     */
    handleHuntingBehavior(nearbyZooplankton, otherBaitfish = []) {
        // Check if current target is still valid
        if (this.currentTarget && this.currentTarget.visible && !this.currentTarget.consumed) {
            this.targetLockTime++;

            const currentDist = Math.sqrt(
                Math.pow(this.x - this.currentTarget.x, 2) +
                Math.pow(this.y - this.currentTarget.y, 2)
            );

            // Keep current target if within range
            if (currentDist < 200) {
                let bestZooplankton = this.currentTarget;

                // Only consider switching if locked long enough AND much better option exists
                if (this.targetLockTime > this.minLockDuration) {
                    let bestScore = currentDist;

                    nearbyZooplankton.forEach(zp => {
                        if (!zp.visible || zp.consumed || zp === this.currentTarget) return;

                        const distance = Math.sqrt(
                            Math.pow(this.x - zp.x, 2) + Math.pow(this.y - zp.y, 2)
                        );

                        // Count competitors
                        let competitorCount = 0;
                        otherBaitfish.forEach(other => {
                            if (other === this || !other.visible || other.consumed) return;
                            const otherDist = Math.sqrt(
                                Math.pow(other.x - zp.x, 2) + Math.pow(other.y - zp.y, 2)
                            );
                            if (otherDist < 20) competitorCount++;
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
            } else {
                // Target moved too far
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
                    Math.pow(this.x - zp.x, 2) + Math.pow(this.y - zp.y, 2)
                );

                // Count competitors
                let competitorCount = 0;
                otherBaitfish.forEach(other => {
                    if (other === this || !other.visible || other.consumed) return;
                    const otherDist = Math.sqrt(
                        Math.pow(other.x - zp.x, 2) + Math.pow(other.y - zp.y, 2)
                    );
                    if (otherDist < 20) competitorCount++;
                });

                const score = distance + (competitorCount * 15);

                if (score < bestScore) {
                    bestScore = score;
                    bestZooplankton = zp;
                }
            });

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
                this.currentTarget = null;
                this.targetLockTime = 0;
            }

            // Calculate base target position
            this.targetWorldX = bestZooplankton.worldX;
            this.targetY = bestZooplankton.y;

            // FLOCKING RULES during hunting - maintain school cohesion
            let separationX = 0, separationY = 0;
            let cohesionX = 0, cohesionY = 0;
            let alignmentX = 0, alignmentY = 0;
            let neighborCount = 0;

            const separationRadius = 15;
            const neighborRadius = 50;

            otherBaitfish.forEach(other => {
                if (other === this || !other.visible || other.consumed) return;

                const dx = this.worldX - other.worldX;
                const dy = this.y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Rule 1: SEPARATION
                if (dist < separationRadius && dist > 0) {
                    const force = (separationRadius - dist) / separationRadius;
                    separationX += (dx / dist) * force * 8;
                    separationY += (dy / dist) * force * 8;
                }

                // Rule 2 & 3: COHESION and ALIGNMENT
                if (dist < neighborRadius && dist > 0) {
                    cohesionX += other.worldX;
                    cohesionY += other.y;
                    alignmentX += other.velocityX;
                    alignmentY += other.velocityY;
                    neighborCount++;
                }
            });

            // Apply flocking forces
            if (neighborCount > 0) {
                this.targetWorldX += separationX;
                this.targetY += separationY;

                const avgNeighborX = cohesionX / neighborCount;
                const avgNeighborY = cohesionY / neighborCount;
                this.targetWorldX += (avgNeighborX - this.worldX) * 0.03;
                this.targetY += (avgNeighborY - this.y) * 0.03;

                const avgVelocityX = alignmentX / neighborCount;
                const avgVelocityY = alignmentY / neighborCount;
                this.targetWorldX += (avgVelocityX - this.velocityX) * 0.05;
                this.targetY += (avgVelocityY - this.velocityY) * 0.05;
            }

            // Move towards target
            const dx = this.targetWorldX - this.worldX;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 1) {
                const moveSpeed = this.speed * 1.0;

                const moveDx = (dx / distance) * moveSpeed;
                const moveDy = (dy / distance) * moveSpeed;

                this.worldX += moveDx;
                this.y += moveDy;

                // Update velocity and angle
                this.velocityX = moveDx;
                this.velocityY = moveDy;
                this.angle = Math.atan2(moveDy, moveDx);
            } else {
                this.velocityX *= 0.9;
                this.velocityY *= 0.9;
            }
        }
    }

    /**
     * Render the baitfish with species-specific appearance
     * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to render to
     * @param {Array} sonarTrail - Trail points for motion blur effect
     */
    render(graphics, sonarTrail) {
        if (!this.visible || this.consumed) return;

        // Flicker effect (baitfish shimmer on sonar)
        this.flickerPhase += 0.1;
        const flickerIntensity = Math.sin(this.flickerPhase) * 0.3 + 0.7;

        // Color - use species-specific colors
        const color = this.panicMode
            ? this.speciesData.panicColor
            : this.speciesData.color;

        // Draw very faint trail
        for (let i = 0; i < sonarTrail.length - 1; i++) {
            const point = sonarTrail[i];
            const alpha = (1 - point.age / 15) * 0.2 * flickerIntensity;

            if (i > 0) {
                const prevPoint = sonarTrail[i - 1];
                graphics.lineStyle(1, color, alpha);
                graphics.lineBetween(prevPoint.x, prevPoint.y, point.x, point.y);
            }
        }

        // Draw main baitfish body
        const bodySize = this.size + 1;
        const appearance = this.speciesData.appearance;
        const bodyLength = bodySize * 1.5 * appearance.length;
        const bodyHeight = bodySize * 0.7 * appearance.height;

        // Draw body based on species shape
        graphics.fillStyle(color, 0.6 * flickerIntensity);

        if (appearance.bodyShape === 'slender') {
            // Slender, elongated (smelt, cisco)
            graphics.fillEllipse(this.x, this.y, bodyLength * 1.2, bodyHeight * 0.6);
        } else if (appearance.bodyShape === 'deep') {
            // Deep-bodied (alewife, perch)
            graphics.fillEllipse(this.x, this.y, bodyLength, bodyHeight * 1.1);
        } else if (appearance.bodyShape === 'bottom') {
            // Bottom-dwelling (sculpin) - flattened
            graphics.fillEllipse(this.x, this.y, bodyLength * 0.9, bodyHeight * 0.5);
        } else {
            // Default streamlined shape
            graphics.fillEllipse(this.x, this.y, bodyLength, bodyHeight);
        }

        // Brighter center dot
        graphics.fillStyle(color, 0.9 * flickerIntensity);
        graphics.fillCircle(this.x, this.y, bodySize * 0.4);

        // Species-specific features
        this.renderSpeciesFeatures(graphics, bodySize, color, flickerIntensity, appearance);

        // Occasional flash (like light reflecting off scales on sonar)
        if (Math.random() < 0.05) {
            graphics.lineStyle(1, color, 0.8);
            graphics.strokeCircle(this.x, this.y, bodySize * 2);
        }
    }

    /**
     * Render species-specific visual features
     */
    renderSpeciesFeatures(graphics, bodySize, color, flickerIntensity, appearance) {
        // Yellow Perch - vertical bars
        if (this.species === 'yellow_perch' && appearance.features.includes('vertical_bars')) {
            const barCount = appearance.barCount || 7;
            const barColor = 0x2a3a1a;
            graphics.fillStyle(barColor, 0.5 * flickerIntensity);

            for (let i = 0; i < barCount; i++) {
                const barX = this.x - bodySize + (i * bodySize * 0.4);
                graphics.fillRect(
                    barX,
                    this.y - bodySize * 0.6,
                    bodySize * 0.12,
                    bodySize * 1.2
                );
            }

            // Orange fins
            if (appearance.finColor) {
                graphics.fillStyle(appearance.finColor, 0.6 * flickerIntensity);
                graphics.fillCircle(this.x, this.y + bodySize * 0.5, bodySize * 0.3);
            }
        }

        // Alewife - dark gill spot
        if (this.species === 'alewife' && appearance.features.includes('dark_gill_spot')) {
            graphics.fillStyle(0x2a3a4a, 0.7 * flickerIntensity);
            graphics.fillCircle(this.x - bodySize * 0.5, this.y - bodySize * 0.2, bodySize * 0.2);
        }

        // Smelt, Cisco - iridescent sheen
        if (appearance.features.includes('iridescent_sheen')) {
            const iridColor = this.species === 'rainbow_smelt' ? 0xffccff : 0xccddff;
            graphics.fillStyle(iridColor, 0.3 * flickerIntensity);
            graphics.fillCircle(this.x, this.y, bodySize * 0.6);
        }

        // Sculpin - camouflage pattern
        if (this.species === 'sculpin' && appearance.features.includes('camouflage_pattern')) {
            for (let i = 0; i < 3; i++) {
                const spotX = this.x + Utils.randomBetween(-bodySize * 0.5, bodySize * 0.5);
                const spotY = this.y + Utils.randomBetween(-bodySize * 0.3, bodySize * 0.3);
                graphics.fillStyle(0x3a4a2a, 0.4 * flickerIntensity);
                graphics.fillCircle(spotX, spotY, bodySize * 0.15);
            }
        }
    }

    /**
     * Mark as consumed by a predator
     */
    consume() {
        this.consumed = true;
        this.visible = false;
    }

    /**
     * Get debug info
     */
    getInfo() {
        return {
            species: this.species,
            x: this.x,
            y: this.y,
            depth: Math.floor(this.depth),
            length: this.length.toFixed(1),
            visible: this.visible,
            consumed: this.consumed,
            panicMode: this.panicMode,
            hunting: this.currentTarget !== null
        };
    }
}

export default Baitfish;
