import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';
import Baitfish from './Baitfish.js';

export class BaitfishCloud {
    constructor(scene, x, y, count) {
        this.scene = scene;
        this.id = `cloud_${Date.now()}_${Math.random()}`;
        this.centerX = x;
        this.centerY = y;
        this.depth = y / GameConfig.DEPTH_SCALE;

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

        // Spawn the baitfish
        this.spawnBaitfish(count);
    }

    spawnBaitfish(count) {
        for (let i = 0; i < count; i++) {
            // Spawn in a loose cluster
            const offsetX = Utils.randomBetween(-30, 30);
            const offsetY = Utils.randomBetween(-20, 20);

            const baitfish = new Baitfish(
                this.scene,
                this.centerX + offsetX,
                this.centerY + offsetY,
                this.id
            );

            this.baitfish.push(baitfish);
        }
    }

    update(lakers = []) {
        if (!this.visible) return;

        this.age++;

        // Update center position (cloud drifts slowly)
        this.centerX += this.velocity.x;
        this.centerY += this.velocity.y;
        this.depth = this.centerY / GameConfig.DEPTH_SCALE;

        // Occasionally change direction slightly
        if (Math.random() < 0.01) {
            this.velocity.x += Utils.randomBetween(-0.2, 0.2);
            this.velocity.y += Utils.randomBetween(-0.1, 0.1);

            // Keep velocity reasonable
            this.velocity.x = Math.max(-1.0, Math.min(1.0, this.velocity.x));
            this.velocity.y = Math.max(-0.5, Math.min(0.5, this.velocity.y));
        }

        // Keep cloud in bounds
        this.centerY = Math.max(30, Math.min(GameConfig.MAX_DEPTH * GameConfig.DEPTH_SCALE - 30, this.centerY));

        // Check for nearby lakers
        const lakersNearby = this.checkForLakersNearby(lakers);

        // Update all baitfish in the cloud
        this.baitfish = this.baitfish.filter(baitfish => {
            if (!baitfish.consumed && baitfish.visible) {
                baitfish.update({ x: this.centerX, y: this.centerY }, lakersNearby);
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
        // Check if cloud center is off screen
        return this.centerX < -100 || this.centerX > GameConfig.CANVAS_WIDTH + 100;
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

    destroy() {
        // Clean up all baitfish
        this.baitfish.forEach(baitfish => baitfish.destroy());
        this.baitfish = [];
        this.visible = false;
    }
}

export default BaitfishCloud;
