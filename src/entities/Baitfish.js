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

        // Flicker effect for baitfish (they shimmer on sonar)
        this.flickerPhase = Math.random() * Math.PI * 2;
    }

    update(cloudCenter, lakersNearby = false) {
        if (this.consumed || !this.visible) {
            return;
        }

        this.age++;

        // Check if lakers are nearby - if so, panic!
        if (lakersNearby) {
            this.panicMode = true;
        }

        // Schooling behavior - stay near cloud center with offset
        this.targetX = cloudCenter.x + this.schoolingOffset.x;
        this.targetY = cloudCenter.y + this.schoolingOffset.y;

        // Add some random wandering
        if (Math.random() < 0.02) {
            this.schoolingOffset.x += Utils.randomBetween(-5, 5);
            this.schoolingOffset.y += Utils.randomBetween(-3, 3);

            // Keep offset within reasonable bounds
            this.schoolingOffset.x = Math.max(-25, Math.min(25, this.schoolingOffset.x));
            this.schoolingOffset.y = Math.max(-15, Math.min(15, this.schoolingOffset.y));
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

        this.depth = this.y / GameConfig.DEPTH_SCALE;

        // Keep in bounds
        this.y = Math.max(10, Math.min(GameConfig.MAX_DEPTH * GameConfig.DEPTH_SCALE - 10, this.y));

        // Update sonar trail
        this.updateSonarTrail();

        // Remove if off screen
        if (this.x < -100 || this.x > GameConfig.CANVAS_WIDTH + 100) {
            this.visible = false;
        }

        // Reset panic after a while
        if (this.panicMode && Math.random() < 0.01) {
            this.panicMode = false;
        }

        // Render
        this.render();
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
