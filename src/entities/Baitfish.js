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

        // Visual properties for sonar display
        this.sonarTrail = [];
        this.maxTrailLength = 15;
        this.graphics = scene.add.graphics();

        // State
        this.consumed = false;
        this.visible = true;
        this.age = 0;
        this.panicMode = false;

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
            this.handleHuntingBehavior(nearbyZooplankton);
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
            playerWorldX = this.scene.boatManager.playerX;
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
        // When scared: condensed but maintain minimum separation
        const minOffsetX = 25; // Minimum horizontal spread to prevent concentration
        const minOffsetY = 15; // Minimum vertical spread
        const maxOffsetX = Math.max(minOffsetX, 30 * spreadMultiplier);
        const maxOffsetY = Math.max(minOffsetY, 20 * spreadMultiplier);

        // Schooling behavior - stay near cloud center with dynamic offset (use world coordinates)
        this.targetWorldX = cloudCenter.worldX + this.schoolingOffset.x * spreadMultiplier;
        this.targetY = cloudCenter.y + this.schoolingOffset.y * spreadMultiplier;

        // SEPARATION LOGIC - prevent baitfish from overlapping (maintain cloud shape)
        // Check for nearby baitfish and add repulsion force
        let separationX = 0;
        let separationY = 0;
        let nearbyCount = 0;
        const separationRadius = 8; // pixels - minimum distance between fish

        otherBaitfish.forEach(other => {
            if (other === this || !other.visible || other.consumed) return;

            const dx = this.worldX - other.worldX;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If too close, add separation force
            if (distance < separationRadius && distance > 0) {
                // Stronger separation when very close
                const strength = (separationRadius - distance) / separationRadius;
                separationX += (dx / distance) * strength * 5;
                separationY += (dy / distance) * strength * 5;
                nearbyCount++;
            }
        });

        // Apply separation forces to target position
        if (nearbyCount > 0) {
            this.targetWorldX += separationX;
            this.targetY += separationY;
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

            this.worldX += (dx / distance) * moveSpeed;
            this.y += (dy / distance) * moveSpeed * verticalMultiplier;
        }

        // Reset panic after a while
        if (this.panicMode && Math.random() < 0.01) {
            this.panicMode = false;
        }
    }

    handleHuntingBehavior(nearbyZooplankton) {
        // Find the closest zooplankton
        let closestZooplankton = null;
        let closestDistance = Infinity;

        nearbyZooplankton.forEach(zp => {
            if (!zp.visible || zp.consumed) return;

            const distance = Math.sqrt(
                Math.pow(this.x - zp.x, 2) +
                Math.pow(this.y - zp.y, 2)
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestZooplankton = zp;
            }
        });

        if (closestZooplankton) {
            // If close enough, consume the zooplankton
            if (closestDistance < 5) {
                closestZooplankton.consume();
                return;
            }

            // Move towards the zooplankton (use world coordinates)
            this.targetWorldX = closestZooplankton.worldX;
            this.targetY = closestZooplankton.y;

            const dx = this.targetWorldX - this.worldX;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 1) {
                // Hunt at normal speed
                const moveSpeed = this.speed * 1.2;

                this.worldX += (dx / distance) * moveSpeed;
                this.y += (dy / distance) * moveSpeed;
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
