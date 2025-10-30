import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';

/**
 * Zooplankton Model - Base class for zooplankton organisms
 * Contains all biological properties, stats, and game logic
 *
 * Zooplankton are tiny organisms at the bottom of the food chain that:
 * - Drift slowly near the lake bottom
 * - Are consumed by baitfish
 * - Have short lifespans (50-100 seconds)
 * - Stay within 2-10 feet of the lake bottom
 */
export class Zooplankton {
    constructor(scene, worldX, y) {
        this.scene = scene;

        // Position properties
        this.worldX = worldX; // World X coordinate (like fish)
        this.x = worldX; // Screen X coordinate (calculated in update)
        this.y = y;
        this.depth = y / GameConfig.DEPTH_SCALE;

        // Biological properties (very tiny organisms)
        this.size = Utils.randomBetween(0.1, 0.3); // Very small (inches)
        this.speed = Utils.randomBetween(0.1, 0.3); // Very slow drift

        // Movement behavior - mostly drift with slight random movement
        this.driftDirection = Math.random() * Math.PI * 2; // Random initial direction
        this.driftSpeed = Utils.randomBetween(0.05, 0.15);

        // State
        this.consumed = false;
        this.visible = true;
        this.age = 0;

        // Visual properties for sonar display
        this.hue = Utils.randomBetween(150, 200); // Greenish-blue color variation

        // Lifecycle (despawn after some time)
        this.maxAge = Utils.randomBetween(3000, 6000); // 50-100 seconds at 60fps
    }

    /**
     * Update zooplankton position and state
     */
    update() {
        if (this.consumed || !this.visible) {
            return;
        }

        this.age++;

        // Despawn if too old (natural lifecycle)
        if (this.age > this.maxAge) {
            this.visible = false;
            return;
        }

        // Slow drift movement near bottom
        // Change direction occasionally (1% chance per frame)
        if (Math.random() < 0.01) {
            this.driftDirection += Utils.randomBetween(-0.5, 0.5);
        }

        // Drift in current direction (use world coordinates)
        this.worldX += Math.cos(this.driftDirection) * this.driftSpeed;
        this.y += Math.sin(this.driftDirection) * this.driftSpeed * 0.3; // Less vertical movement

        // Get actual lake bottom depth at zooplankton's current world position
        let bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
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
        // If neither manager exists (nature simulation), use scene.maxDepth which was already set above

        // Stay near the bottom (within 2-10 feet of actual bottom)
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

        // Convert world position to screen position based on player position
        this.updateScreenPosition();
    }

    /**
     * Update screen position based on player position
     * (different for ice fishing vs boat fishing vs nature mode)
     */
    updateScreenPosition() {
        // In nature simulation mode, use worldX directly as screen X
        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            const playerWorldX = currentHole ? currentHole.x : this.worldX;
            const offsetFromPlayer = this.worldX - playerWorldX;
            this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;

            // Remove if too far from player in world coordinates
            const distanceFromPlayer = Math.abs(this.worldX - playerWorldX);
            if (distanceFromPlayer > 600) {
                this.visible = false;
            }
        } else if (this.scene.boatManager) {
            const playerWorldX = this.scene.boatManager.getPlayerWorldX();
            const offsetFromPlayer = this.worldX - playerWorldX;
            this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;

            // Remove if too far from player in world coordinates
            const distanceFromPlayer = Math.abs(this.worldX - playerWorldX);
            if (distanceFromPlayer > 600) {
                this.visible = false;
            }
        } else {
            // Nature simulation mode - use worldX directly as screen X (no player to offset from)
            this.x = this.worldX;

            // Remove if off screen in nature mode
            if (this.worldX < -400 || this.worldX > GameConfig.CANVAS_WIDTH + 400) {
                this.visible = false;
            }
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
     * Get current position
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

    /**
     * Render the zooplankton (procedural rendering)
     * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to render to
     */
    render(graphics) {
        if (!this.visible || this.consumed) {
            return;
        }

        const alpha = 0.6;
        const screenX = this.x;
        const screenY = this.y;

        // Outer glow (very subtle)
        graphics.fillStyle(0x00ff88, alpha * 0.2);
        graphics.fillCircle(screenX, screenY, 2);

        // Inner dot
        graphics.fillStyle(0x88ffcc, alpha);
        graphics.fillCircle(screenX, screenY, 1);
    }

    /**
     * Get debug info
     */
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
