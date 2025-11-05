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

        // Movement behavior - mostly drift with slight random movement (reduced to stay near spawn)
        this.driftDirection = Math.random() * Math.PI * 2; // Random initial direction
        this.driftSpeed = Utils.randomBetween(0.01, 0.05); // Very minimal drift (was 0.05-0.15)

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

        // Vertical migration with bottom concentration
        // Allow zooplankton to migrate up to 60 feet from bottom, but most stay near bottom
        const canvasHeight = this.scene.scale.height;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
        const bottomY = bottomDepth * depthScale;

        // Wide vertical range (5-60 feet from bottom) but with gentle push toward bottom
        const minY = bottomY - (60 * depthScale); // 60 feet from bottom (migration range)
        const maxY = Math.min(bottomY - (5 * depthScale), waterFloorY); // 5 feet from bottom or floor

        // Add vertical drift - occasional upward migration (5% chance per frame)
        if (Math.random() < 0.05) {
            this.y -= 0.2; // Drift up slowly
        }

        // Very gentle push back towards bottom zone (weaker than before)
        if (this.y < minY) {
            this.y += 0.15; // Gentle push down
        } else if (this.y > maxY) {
            this.y -= 0.05; // Very weak push - allows them to stay high longer
        }

        this.depth = this.y / depthScale;

        // Convert world position to screen position (using parent class helper)
        this.updateScreenPosition();

        // Check if off-screen (not based on world distance, based on screen position)
        const canvasWidth = this.scene.scale.width;
        const margin = 100;
        const isOffScreen = this.x < -margin || this.x > canvasWidth + margin;

        if (isOffScreen) {
            this.visible = false; // Will be cleaned up by GameScene filter
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
        // Use Phaser's optimized distance calculation
        const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);
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

        const screenX = this.x;
        const screenY = this.y;

        // Tiny green speck - subtle but visible
        // Main body - slightly larger and more opaque
        graphics.fillStyle(0x77bb55, 0.75); // Brighter olive-green, more opaque
        graphics.fillCircle(screenX, screenY, 2); // Slightly larger

        // Subtle highlight for definition (always visible)
        graphics.fillStyle(0x99dd77, 0.5); // Brighter center
        graphics.fillCircle(screenX, screenY, 1.2);
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
