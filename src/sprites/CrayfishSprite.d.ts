import { OrganismSprite, OrganismInfo } from './OrganismSprite.js';
import { CrayfishData } from '../config/OrganismData.js';
/**
 * Burst state type
 */
type BurstState = 'idle' | 'bursting' | 'cooldown';
/**
 * Extended crayfish info interface
 */
interface CrayfishInfo extends OrganismInfo {
    size: string;
    burstState: BurstState;
    burstsFired: number;
    fatigueFactor: string;
    threatened: boolean;
    hunting: boolean;
}
/**
 * CrayfishSprite - Bottom-dwelling invertebrate using Phaser Sprite
 *
 * Extends OrganismSprite for consistent architecture with other water organisms
 *
 * Crayfish behavior:
 * - Stay on lake bottom
 * - Hunt zooplankton
 * - Escape threats with backward "zoom" bursts
 * - Get fatigued after multiple bursts
 * - Preferred prey for smallmouth bass
 */
export declare class CrayfishSprite extends OrganismSprite {
    id: string;
    speciesData: CrayfishData;
    size: number;
    length: number;
    speed: number;
    roamDirection: number;
    roamSpeed: number;
    currentTarget: any | null;
    targetLockTime: number;
    minLockDuration: number;
    huntingSpeed: number;
    burstState: BurstState;
    burstDirection: number;
    burstSpeed: number;
    burstDuration: number;
    burstTimer: number;
    burstsFired: number;
    baseBurstCooldown: number;
    fatigueFactor: number;
    fatigueRecoveryTimer: number;
    fatigueRecoveryDuration: number;
    threatened: boolean;
    hue: number;
    maxAge: number;
    angle: number;
    depth?: number;
    /**
     * @param scene - Game scene
     * @param worldX - World X position
     * @param y - Y position (will be adjusted to bottom)
     */
    constructor(scene: Phaser.Scene, worldX: number, y: number);
    /**
     * Initialize crayfish-specific properties
     */
    private initCrayfishProperties;
    /**
     * Phaser preUpdate - called automatically every frame
     */
    preUpdate(time: number, delta: number): void;
    /**
     * Find nearby zooplankton for hunting
     */
    private findNearbyZooplankton;
    /**
     * Initiate escape burst
     */
    private initiateBurst;
    /**
     * Update burst mechanics (bursting and cooldown)
     */
    private updateBurstMechanics;
    /**
     * Roam along the bottom looking for food
     */
    private handleRoamingBehavior;
    /**
     * Hunt zooplankton
     */
    private handleHuntingBehavior;
    /**
     * Keep crayfish on the lake bottom
     */
    private stayOnBottom;
    /**
     * Get bottom depth at current position
     */
    private getBottomDepthAtPosition;
    /**
     * Check if too far from player (for despawning)
     */
    private isTooFarFromPlayer;
    /**
     * Set threat status (called by FoodChainSystem when predators nearby)
     */
    setThreatened(threatened: boolean): void;
    /**
     * Get debug info
     */
    getInfo(): CrayfishInfo;
    /**
     * Reset crayfish for object pooling
     */
    reset(worldX: number, y: number): void;
    /**
     * Clean up
     */
    destroy(fromScene?: boolean): void;
}
export default CrayfishSprite;
//# sourceMappingURL=CrayfishSprite.d.ts.map