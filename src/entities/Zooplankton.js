import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';

/**
 * Zooplankton - Tiny organisms at the bottom of the lake
 * that baitfish feed on
 */
export class Zooplankton {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.depth = y / GameConfig.DEPTH_SCALE;

        // Zooplankton properties (very tiny)
        this.size = Utils.randomBetween(0.1, 0.3); // Very small (inches)
        this.speed = Utils.randomBetween(0.1, 0.3); // Very slow drift

        // Movement behavior - mostly drift, slight random movement
        this.targetX = x;
        this.targetY = y;
        this.driftDirection = Math.random() * Math.PI * 2; // Random initial direction
        this.driftSpeed = Utils.randomBetween(0.05, 0.15);

        // Visual properties for sonar display
        this.graphics = scene.add.graphics();

        // State
        this.consumed = false;
        this.visible = true;
        this.age = 0;

        // Color variation (appears as tiny dots on sonar)
        this.hue = Utils.randomBetween(150, 200); // Greenish-blue

        // Lifetime (despawn after some time)
        this.maxAge = Utils.randomBetween(3000, 6000); // 50-100 seconds at 60fps
    }

    update() {
        if (this.consumed || !this.visible) {
            return;
        }

        this.age++;

        // Despawn if too old
        if (this.age > this.maxAge) {
            this.visible = false;
            return;
        }

        // Slow drift movement near bottom
        // Change direction occasionally
        if (Math.random() < 0.01) {
            this.driftDirection += Utils.randomBetween(-0.5, 0.5);
        }

        // Drift in current direction
        this.x += Math.cos(this.driftDirection) * this.driftSpeed;
        this.y += Math.sin(this.driftDirection) * this.driftSpeed * 0.3; // Less vertical movement

        // Get actual lake bottom depth at zooplankton's current position
        let bottomDepth = GameConfig.MAX_DEPTH;
        if (this.scene.boatManager) {
            // For boat/kayak modes, estimate world X from screen X
            const playerWorldX = this.scene.boatManager.playerX;
            const offsetFromCenter = this.x - (GameConfig.CANVAS_WIDTH / 2);
            const estimatedWorldX = playerWorldX + offsetFromCenter;
            bottomDepth = this.scene.boatManager.getDepthAtPosition(estimatedWorldX);
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

        // Stay near the bottom (within 5-10 feet of actual bottom)
        const bottomY = bottomDepth * GameConfig.DEPTH_SCALE;
        const minY = bottomY - (10 * GameConfig.DEPTH_SCALE); // 10 feet from bottom
        const maxY = bottomY - (2 * GameConfig.DEPTH_SCALE); // 2 feet from bottom (don't go below!)

        // Gently push back towards bottom zone
        if (this.y < minY) {
            this.y += 0.2;
        } else if (this.y > maxY) {
            this.y -= 0.2;
        }

        this.depth = this.y / GameConfig.DEPTH_SCALE;

        // Remove if off screen
        if (this.x < -50 || this.x > GameConfig.CANVAS_WIDTH + 50) {
            this.visible = false;
        }
    }

    /**
     * Mark as consumed by a baitfish
     */
    consume() {
        this.consumed = true;
        this.visible = false;
    }

    /**
     * Get position
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * Check if within range of a position
     */
    isWithinRange(x, y, range) {
        const dx = this.x - x;
        const dy = this.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < range;
    }

    render() {
        if (!this.visible || this.consumed) {
            this.graphics.clear();
            return;
        }

        this.graphics.clear();

        // Draw as a tiny dot with slight glow
        const alpha = 0.6;
        const screenX = this.x;
        const screenY = this.y;

        // Outer glow (very subtle)
        this.graphics.fillStyle(0x00ff88, alpha * 0.2);
        this.graphics.fillCircle(screenX, screenY, 2);

        // Inner dot
        this.graphics.fillStyle(0x88ffcc, alpha);
        this.graphics.fillCircle(screenX, screenY, 1);
    }

    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
        }
    }

    getInfo() {
        return {
            x: this.x,
            y: this.y,
            depth: Math.floor(this.depth),
            size: this.size.toFixed(2),
            visible: this.visible,
            consumed: this.consumed,
            age: this.age
        };
    }
}

export default Zooplankton;
