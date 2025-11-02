import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';
import AquaticOrganism from './AquaticOrganism.js';

/**
 * Zooplankton Model - Extends AquaticOrganism
 * Bottom of the food chain organisms
 *
 * Zooplankton are tiny organisms that:
 * - Drift slowly near the lake bottom
 * - Are consumed by baitfish and crayfish
 * - Have short lifespans (50-100 seconds)
 * - Stay within 2-10 feet of the lake bottom
 */
export class Zooplankton extends AquaticOrganism {
    constructor(scene, worldX, y) {
        // Call parent constructor (no species data for simple organisms)
        super(scene, worldX, y);

        // Biological properties (very tiny organisms)
        this.size = Utils.randomBetween(0.1, 0.3); // Very small (inches)
        this.length = this.size; // Length same as size for zooplankton
        this.speed = Utils.randomBetween(0.1, 0.3); // Very slow drift

        // Movement behavior - mostly drift with slight random movement
        this.driftDirection = Math.random() * Math.PI * 2; // Random initial direction
        this.driftSpeed = Utils.randomBetween(0.05, 0.15);

        // State
        this.consumed = false;

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

        // Get actual lake bottom depth (using parent class helper)
        const bottomDepth = this.getBottomDepthAtPosition();

        // Use dynamic depth scale from sonar display (not static GameConfig.DEPTH_SCALE)
        const depthScale = this.scene.sonarDisplay ?
            this.scene.sonarDisplay.getDepthScale() :
            GameConfig.DEPTH_SCALE;

        // Stay near the bottom (within 2-10 feet of actual bottom)
        const bottomY = bottomDepth * depthScale;
        const minY = bottomY - (10 * depthScale); // 10 feet from bottom
        const maxY = bottomY - (2 * depthScale); // 2 feet from bottom (don't go below!)

        // Gently push back towards bottom zone
        if (this.y < minY) {
            this.y += 0.2;
        } else if (this.y > maxY) {
            this.y -= 0.2;
        }

        this.depth = this.y / depthScale;

        // Convert world position to screen position (using parent class helper)
        this.updateScreenPosition();

        // Check if too far from player and cull if needed
        if (this.isTooFarFromPlayer(600)) {
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

        const alpha = 0.8; // Increased visibility
        const screenX = this.x;
        const screenY = this.y;

        // Outer glow (more visible)
        graphics.fillStyle(0x00ff88, alpha * 0.3);
        graphics.fillCircle(screenX, screenY, 4);

        // Inner dot (larger and brighter)
        graphics.fillStyle(0x88ffcc, alpha);
        graphics.fillCircle(screenX, screenY, 2.5);
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
