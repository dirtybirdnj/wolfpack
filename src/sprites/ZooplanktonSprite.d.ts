import { OrganismSprite, OrganismInfo } from './OrganismSprite.js';
import { ZooplanktonData } from '../config/OrganismData.js';
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
export declare class ZooplanktonSprite extends OrganismSprite {
    id: string;
    speciesData: ZooplanktonData;
    size: number;
    length: number;
    speed: number;
    driftDirection: number;
    driftSpeed: number;
    hue: number;
    maxAge: number;
    depthInFeet?: number;
    /**
     * @param scene - Game scene
     * @param worldX - World X position
     * @param y - Y position (typically near bottom)
     */
    constructor(scene: Phaser.Scene, worldX: number, y: number);
    /**
     * Initialize zooplankton-specific properties
     */
    private initZooplanktonProperties;
    /**
     * Phaser preUpdate - called automatically every frame
     */
    preUpdate(time: number, delta: number): void;
    /**
     * Get bottom depth at current position
     */
    private getBottomDepthAtPosition;
    /**
     * Get debug info
     */
    getInfo(): ZooplanktonInfo;
    /**
     * Reset zooplankton for object pooling
     */
    reset(worldX: number, y: number): void;
    /**
     * Clean up
     */
    destroy(fromScene?: boolean): void;
}
export default ZooplanktonSprite;
//# sourceMappingURL=ZooplanktonSprite.d.ts.map