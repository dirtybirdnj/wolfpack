import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';

export class Baitfish {
    constructor(scene, worldX, y, cloudId) {
        this.scene = scene;
        this.worldX = worldX; // World X coordinate (like fish)
        this.x = worldX; // Screen X coordinate (calculated in update)
        this.y = y;
        this.cloudId = cloudId;
        this.depth = y / GameConfig.DEPTH_SCALE;

        // Baitfish properties (much smaller than lake trout)
        this.size = Utils.randomBetween(0.5, 1.5); // inches
        this.speed = Utils.randomBetween(0.8, 1.5);

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

    update(cloudCenter, lakersNearby = false, spreadMultiplier = 1.0, scaredLevel = 0, nearbyZooplankton = []) {
        if (this.consumed || !this.visible) {
            return;
        }

        this.age++;

        // Check for nearby zooplankton to hunt (new feature)
        if (nearbyZooplankton && nearbyZooplankton.length > 0 && !lakersNearby) {
            this.handleHuntingBehavior(nearbyZooplankton);
        } else {
            // Normal schooling behavior (confused behavior removed in main)
            this.handleNormalBehavior(cloudCenter, lakersNearby, spreadMultiplier);
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

    handleNormalBehavior(cloudCenter, lakersNearby, spreadMultiplier) {
        // Check if lakers are nearby - if so, panic!
        if (lakersNearby) {
            this.panicMode = true;
        }

        // Apply spread multiplier to schooling offset range
        // When safe: larger spread (spreadMultiplier ~2.0)
        // When scared: condensed (spreadMultiplier ~0.3-0.6)
        const maxOffsetX = 30 * spreadMultiplier;  // Reduced from 50 for tighter schooling
        const maxOffsetY = 20 * spreadMultiplier;  // Reduced from 30 for tighter schooling

        // Schooling behavior - stay near cloud center with dynamic offset (use world coordinates)
        this.targetWorldX = cloudCenter.worldX + this.schoolingOffset.x * spreadMultiplier;
        this.targetY = cloudCenter.y + this.schoolingOffset.y * spreadMultiplier;

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
            const speedMultiplier = this.panicMode ? 2.5 : 1.2;  // Increased from 1.0 for tighter schooling
            const moveSpeed = this.speed * speedMultiplier;

            this.worldX += (dx / distance) * moveSpeed;
            this.y += (dy / distance) * moveSpeed * 0.7; // Slower vertical movement
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

        // Color - baitfish show up as lighter/silvery marks
        const color = this.panicMode ? GameConfig.COLOR_BAITFISH_PANIC : GameConfig.COLOR_BAITFISH;

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

        // Small elongated mark (baitfish are thin)
        this.graphics.fillStyle(color, 0.6 * flickerIntensity);
        this.graphics.fillEllipse(this.x, this.y, bodySize * 1.5, bodySize * 0.7);

        // Brighter center dot
        this.graphics.fillStyle(color, 0.9 * flickerIntensity);
        this.graphics.fillCircle(this.x, this.y, bodySize * 0.4);

        // Occasional flash (like light reflecting off scales on sonar)
        if (Math.random() < 0.05) {
            this.graphics.lineStyle(1, color, 0.8);
            this.graphics.strokeCircle(this.x, this.y, bodySize * 2);
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
