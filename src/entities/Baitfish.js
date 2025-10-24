import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';

export class Baitfish {
    constructor(scene, x, y, cloudId) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.cloudId = cloudId;
        this.depth = y / GameConfig.DEPTH_SCALE;

        // Baitfish properties (much smaller than lake trout)
        this.size = Utils.randomBetween(0.5, 1.5); // inches
        this.speed = Utils.randomBetween(0.8, 1.5);

        // Movement behavior
        this.targetX = x;
        this.targetY = y;
        this.schoolingOffset = {
            x: Utils.randomBetween(-15, 15),
            y: Utils.randomBetween(-10, 10)
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

        // Confusion mechanics
        this.confusionLevel = 0; // 0 = normal, 1 = confused, 2 = VERY confused
        this.hasLeftCloud = false;
        this.loiteringNearLure = false;
        this.lureTarget = null;

        // Flicker effect for baitfish (they shimmer on sonar)
        this.flickerPhase = Math.random() * Math.PI * 2;
    }

    update(cloudCenter, lakersNearby = false, spreadMultiplier = 1.0, scaredLevel = 0) {
        if (this.consumed || !this.visible) {
            return;
        }

        this.age++;

        // Occasionally get confused (1% chance per frame, more likely when scared)
        const confusionChance = 0.001 + (scaredLevel * 0.002);
        if (this.confusionLevel === 0 && Math.random() < confusionChance) {
            // Get confused!
            this.confusionLevel = Math.random() < 0.3 ? 2 : 1; // 30% chance of VERY confused
            console.log(`Baitfish got ${this.confusionLevel === 2 ? 'VERY' : ''} confused!`);
        }

        // Handle confusion behavior
        if (this.confusionLevel > 0) {
            this.handleConfusedBehavior(cloudCenter);
        } else {
            // Normal schooling behavior
            this.handleNormalBehavior(cloudCenter, lakersNearby, spreadMultiplier);
        }

        this.depth = this.y / GameConfig.DEPTH_SCALE;

        // Keep in bounds
        this.y = Math.max(10, Math.min(GameConfig.MAX_DEPTH * GameConfig.DEPTH_SCALE - 10, this.y));

        // Update sonar trail
        this.updateSonarTrail();

        // Remove if off screen
        if (this.x < -100 || this.x > GameConfig.CANVAS_WIDTH + 100) {
            this.visible = false;
        }

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
        const maxOffsetX = 50 * spreadMultiplier;
        const maxOffsetY = 30 * spreadMultiplier;

        // Schooling behavior - stay near cloud center with dynamic offset
        this.targetX = cloudCenter.x + this.schoolingOffset.x * spreadMultiplier;
        this.targetY = cloudCenter.y + this.schoolingOffset.y * spreadMultiplier;

        // Add some random wandering (less when scared/condensed)
        if (Math.random() < 0.02) {
            const wanderAmount = spreadMultiplier > 1.0 ? 5 : 2;
            this.schoolingOffset.x += Utils.randomBetween(-wanderAmount, wanderAmount);
            this.schoolingOffset.y += Utils.randomBetween(-wanderAmount * 0.6, wanderAmount * 0.6);

            // Keep offset within reasonable bounds
            this.schoolingOffset.x = Math.max(-maxOffsetX, Math.min(maxOffsetX, this.schoolingOffset.x));
            this.schoolingOffset.y = Math.max(-maxOffsetY, Math.min(maxOffsetY, this.schoolingOffset.y));
        }

        // Move towards target with schooling behavior
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            const speedMultiplier = this.panicMode ? 2.5 : 1.0;
            const moveSpeed = this.speed * speedMultiplier;

            this.x += (dx / distance) * moveSpeed;
            this.y += (dy / distance) * moveSpeed * 0.7; // Slower vertical movement
        }

        // Reset panic after a while
        if (this.panicMode && Math.random() < 0.01) {
            this.panicMode = false;
        }
    }

    handleConfusedBehavior(cloudCenter) {
        if (!this.hasLeftCloud) {
            // Swim away from the cloud
            const awayX = this.x > cloudCenter.x ? 1 : -1;
            const awayY = this.y > cloudCenter.y ? 1 : -1;

            this.targetX = this.x + awayX * 100;
            this.targetY = this.y + awayY * 60;

            // Mark as having left
            const distFromCloud = Math.sqrt(
                Math.pow(this.x - cloudCenter.x, 2) +
                Math.pow(this.y - cloudCenter.y, 2)
            );

            if (distFromCloud > 80) {
                this.hasLeftCloud = true;
                console.log('Confused baitfish has left its cloud');
            }
        }

        // VERY confused baitfish seek the lure
        if (this.confusionLevel === 2 && this.hasLeftCloud) {
            // Get the lure from the scene
            const lure = this.scene.lure;

            if (lure && !this.loiteringNearLure) {
                // Swim towards the lure
                const distToLure = Math.sqrt(
                    Math.pow(this.x - lure.x, 2) +
                    Math.pow(this.y - lure.y, 2)
                );

                if (distToLure < 30) {
                    // Close enough - start loitering
                    this.loiteringNearLure = true;
                    this.lureTarget = { x: lure.x, y: lure.y };
                    console.log('VERY confused baitfish now loitering near lure');
                } else {
                    // Move towards lure
                    this.targetX = lure.x;
                    this.targetY = lure.y;
                }
            } else if (this.loiteringNearLure && lure) {
                // Loiter near the lure with small random movements
                const loiterRange = 25;
                this.targetX = lure.x + Utils.randomBetween(-loiterRange, loiterRange);
                this.targetY = lure.y + Utils.randomBetween(-loiterRange * 0.6, loiterRange * 0.6);
            }
        }

        // Move towards target (away from cloud or towards/near lure)
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            // Confused baitfish swim slower and more erratically
            const confusedSpeed = this.speed * 0.6;

            this.x += (dx / distance) * confusedSpeed;
            this.y += (dy / distance) * confusedSpeed * 0.7;

            // Add some wobble to confused movement
            this.x += Utils.randomBetween(-0.5, 0.5);
            this.y += Utils.randomBetween(-0.3, 0.3);
        }
    }

    canJoinCloud(cloudId) {
        // Can join any cloud EXCEPT the one it left
        return this.confusionLevel > 0 && this.hasLeftCloud && cloudId !== this.cloudId;
    }

    joinCloud(newCloudId) {
        if (this.canJoinCloud(newCloudId)) {
            this.cloudId = newCloudId;
            this.confusionLevel = 0;
            this.hasLeftCloud = false;
            this.loiteringNearLure = false;
            console.log('Confused baitfish joined a new cloud');
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

        // Confused baitfish show up differently
        const confusedColor = this.confusionLevel === 2 ? 0xffff00 : // VERY confused = yellow
                            this.confusionLevel === 1 ? 0xffaa00 : // confused = orange
                            color; // normal

        const finalColor = this.confusionLevel > 0 ? confusedColor : color;

        // Small elongated mark (baitfish are thin)
        this.graphics.fillStyle(finalColor, 0.6 * flickerIntensity);
        this.graphics.fillEllipse(this.x, this.y, bodySize * 1.5, bodySize * 0.7);

        // Brighter center dot
        this.graphics.fillStyle(finalColor, 0.9 * flickerIntensity);
        this.graphics.fillCircle(this.x, this.y, bodySize * 0.4);

        // Confused indicator - wobbling circle
        if (this.confusionLevel > 0) {
            const wobble = Math.sin(this.age * 0.2) * 2;
            this.graphics.lineStyle(1, finalColor, 0.5);
            this.graphics.strokeCircle(this.x + wobble, this.y, bodySize * 3);
        }

        // Loitering near lure indicator - double circle
        if (this.loiteringNearLure) {
            this.graphics.lineStyle(2, 0xffff00, 0.7);
            this.graphics.strokeCircle(this.x, this.y, bodySize * 4);
            this.graphics.strokeCircle(this.x, this.y, bodySize * 5);
        }

        // Occasional flash (like light reflecting off scales on sonar)
        if (Math.random() < 0.05) {
            this.graphics.lineStyle(1, finalColor, 0.8);
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
