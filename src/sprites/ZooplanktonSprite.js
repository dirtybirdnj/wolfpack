import { OrganismSprite } from './OrganismSprite.js';
import { getOrganismData } from '../config/OrganismData.js';
import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';

/**
 * ZooplanktonSprite - Bottom of food chain using Phaser Sprite
 *
 * Extends OrganismSprite for consistent architecture with other water organisms
 *
 * Zooplankton behavior:
 * - Drift slowly near lake bottom
 * - Are consumed by baitfish and crayfish
 * - Have short lifespans (50-100 seconds)
 * - Stay within 2-60 feet of lake bottom
 * - Occasional vertical migration
 */
export class ZooplanktonSprite extends OrganismSprite {
    /**
     * @param {Phaser.Scene} scene - Game scene
     * @param {number} worldX - World X position
     * @param {number} y - Y position (typically near bottom)
     */
    constructor(scene, worldX, y) {
        // Get zooplankton configuration
        const speciesData = getOrganismData('zooplankton');

        // Use zooplankton texture
        const textureKey = 'zooplankton';

        // Call parent constructor
        super(scene, worldX, y, textureKey);

        // Store species data
        this.speciesData = speciesData;

        // Set depth for rendering (behind everything except background)
        this.setDepth(30);

        // Initialize zooplankton properties
        this.initZooplanktonProperties(scene);

        // Update screen position
        this.updateScreenPosition();
    }

    /**
     * Initialize zooplankton-specific properties
     */
    initZooplanktonProperties(scene) {
        // Unique identifier
        this.id = `zooplankton_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Biological properties (very tiny organisms)
        this.size = Utils.randomBetween(0.1, 0.3); // Very small (inches)
        this.length = this.size;
        this.speed = Utils.randomBetween(0.1, 0.3); // Very slow drift

        // Movement behavior - mostly drift with slight random movement
        this.driftDirection = Math.random() * Math.PI * 2; // Random initial direction
        this.driftSpeed = Utils.randomBetween(0.01, 0.05); // Very minimal drift

        // Visual properties
        this.hue = Utils.randomBetween(150, 200); // Greenish-blue color variation

        // Lifecycle (despawn after some time)
        this.maxAge = Utils.randomBetween(3000, 6000); // 50-100 seconds at 60fps
    }

    /**
     * Phaser preUpdate - called automatically every frame
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.consumed || !this.active) {
            return;
        }

        // Despawn if too old (natural lifecycle)
        if (this.age > this.maxAge) {
            this.setActive(false);
            this.setVisible(false);
            return;
        }

        // Slow drift movement
        // Change direction occasionally (1% chance per frame)
        if (Math.random() < 0.01) {
            this.driftDirection += Utils.randomBetween(-0.5, 0.5);
        }

        // Drift in current direction (use world coordinates)
        this.worldX += Math.cos(this.driftDirection) * this.driftSpeed;
        this.y += Math.sin(this.driftDirection) * this.driftSpeed * 0.3; // Less vertical movement

        // Get actual lake bottom depth
        const bottomDepth = this.getBottomDepthAtPosition();

        // Use dynamic depth scale
        const depthScale = this.scene.depthConverter ?
            this.scene.depthConverter.depthScale :
            GameConfig.DEPTH_SCALE;

        // Vertical migration with bottom concentration
        const canvasHeight = this.scene.scale.height;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
        const bottomY = bottomDepth * depthScale;

        // Wide vertical range (5-60 feet from bottom)
        const minY = bottomY - (60 * depthScale); // 60 feet from bottom (migration range)
        const maxY = Math.min(bottomY - (5 * depthScale), waterFloorY); // 5 feet from bottom or floor

        // Add vertical drift - occasional upward migration (5% chance per frame)
        if (Math.random() < 0.05) {
            this.y -= 0.2; // Drift up slowly
        }

        // Very gentle push back towards bottom zone
        if (this.y < minY) {
            this.y += 0.15; // Gentle push down
        } else if (this.y > maxY) {
            this.y -= 0.05; // Very weak push
        }

        // Update depth
        this.depth = this.y / depthScale;

        // Update screen position
        this.updateScreenPosition();

        // Check if off-screen (despawn)
        const canvasWidth = this.scene.scale.width;
        const margin = 100;
        const isOffScreen = this.x < -margin || this.x > canvasWidth + margin;

        if (isOffScreen) {
            this.setActive(false);
            this.setVisible(false);
        }
    }

    /**
     * Get bottom depth at current position
     */
    getBottomDepthAtPosition() {
        // Use scene's depth converter if available
        if (this.scene.depthConverter) {
            const canvasHeight = this.scene.scale.height;
            const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
            return this.scene.depthConverter.pixelsToDepth(waterFloorY);
        }

        // Fallback: use default max depth
        return GameConfig.MAX_DEPTH || 100;
    }

    /**
     * Get debug info
     */
    getInfo() {
        return {
            ...super.getInfo(),
            size: this.size.toFixed(2),
            driftDirection: (this.driftDirection * 180 / Math.PI).toFixed(1) + '°',
            driftSpeed: this.driftSpeed.toFixed(3)
        };
    }

    /**
     * Reset zooplankton for object pooling
     */
    reset(worldX, y) {
        super.reset(worldX, y);
        this.initZooplanktonProperties(this.scene);
        this.updateScreenPosition();
    }

    /**
     * Clean up
     */
    destroy(fromScene) {
        super.destroy(fromScene);
    }
}

export default ZooplanktonSprite;
