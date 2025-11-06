import { OrganismSprite, OrganismInfo } from './OrganismSprite.js';
import { getOrganismData, ZooplanktonData } from '../config/OrganismData.js';
import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';

/**
 * Extended zooplankton info interface
 */
interface ZooplanktonInfo extends OrganismInfo {
    size: string;
    driftDirection: string;
    driftSpeed: string;
}

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
    public id: string;
    public speciesData: ZooplanktonData;
    public size: number;
    public length: number;
    public speed: number;
    public driftDirection: number;
    public driftSpeed: number;
    public hue: number;
    public maxAge: number;
    public depthInFeet?: number;

    /**
     * @param scene - Game scene
     * @param worldX - World X position
     * @param y - Y position (typically near bottom)
     */
    constructor(scene: Phaser.Scene, worldX: number, y: number) {
        // Get zooplankton configuration
        const speciesData = getOrganismData('zooplankton') as ZooplanktonData;

        // Use zooplankton texture
        const textureKey = 'zooplankton';

        // Call parent constructor
        super(scene, worldX, y, textureKey);

        // Store species data
        this.speciesData = speciesData;

        // Set depth for rendering (behind everything except background)
        this.setDepth(30);

        // Initialize placeholder values (will be set in init method)
        this.id = '';
        this.size = 0;
        this.length = 0;
        this.speed = 0;
        this.driftDirection = 0;
        this.driftSpeed = 0;
        this.hue = 0;
        this.maxAge = 0;

        // Initialize zooplankton properties
        this.initZooplanktonProperties(scene);

        // Update screen position
        this.updateScreenPosition();
    }

    /**
     * Initialize zooplankton-specific properties
     */
    private initZooplanktonProperties(scene: Phaser.Scene): void {
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
    preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        if (this.consumed || !this.active) {
            return;
        }

        // Despawn if too old (natural lifecycle)
        if (this.frameAge > this.maxAge) {
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
        const depthScale = (this.scene as any).depthConverter ?
            (this.scene as any).depthConverter.depthScale :
            GameConfig.DEPTH_SCALE;

        // Vertical migration with bottom concentration
        const canvasHeight = this.scene.scale.height;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
        const bottomY = bottomDepth * depthScale;

        // Keep near bottom with upward migration allowed (bottom to 60 feet up from bottom)
        // minY = higher up in water column (60ft above bottom)
        // maxY = bottom layer (at bottom)
        const minY = bottomY - (60 * depthScale); // Can migrate up to 60 feet from bottom
        const maxY = bottomY; // Bottom limit (stays on/near bottom)

        // Add vertical drift - occasional upward migration (3% chance per frame)
        if (Math.random() < 0.03) {
            this.y -= 0.15; // Drift up slowly (upward migration)
        }

        // Gentle push back towards bottom zone
        if (this.y < minY) {
            this.y += 0.2; // Push down if too high
        } else if (this.y > maxY) {
            this.y -= 0.3; // Stronger push if below bottom
        }

        // Gravity-like settling towards bottom (zooplankton naturally sink)
        if (this.y < maxY) {
            this.y += 0.05; // Constant slow settling
        }

        // Update depth in feet (NOT rendering depth!)
        this.depthInFeet = this.y / depthScale;

        // Update screen position
        this.updateScreenPosition();

        // Check if off-screen (despawn)
        // Small margin to prevent pop-in at screen edges
        const canvasWidth = this.scene.scale.width;
        const margin = 50; // Matching other organisms
        const isOffScreen = this.x < -margin || this.x > canvasWidth + margin;

        if (isOffScreen) {
            this.setActive(false);
            this.setVisible(false);
        }
    }

    /**
     * Get bottom depth at current position
     */
    private getBottomDepthAtPosition(): number {
        // Use scene's depth converter if available
        if ((this.scene as any).depthConverter) {
            const canvasHeight = this.scene.scale.height;
            const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
            return (this.scene as any).depthConverter.yToDepth(waterFloorY);
        }

        // Fallback: use default max depth
        return GameConfig.MAX_DEPTH || 100;
    }

    /**
     * Get debug info
     */
    getInfo(): ZooplanktonInfo {
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
    reset(worldX: number, y: number): void {
        super.reset(worldX, y);
        this.initZooplanktonProperties(this.scene);
        this.updateScreenPosition();
    }

    /**
     * Clean up
     */
    destroy(fromScene?: boolean): void {
        super.destroy(fromScene);
    }
}

export default ZooplanktonSprite;
