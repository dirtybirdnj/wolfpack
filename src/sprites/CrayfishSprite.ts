import { OrganismSprite, OrganismInfo } from './OrganismSprite.js';
import { getOrganismData, CrayfishData } from '../config/OrganismData.js';
import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';

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
export class CrayfishSprite extends OrganismSprite {
    public id: string;
    public speciesData: CrayfishData;
    public size: number;
    public length: number;
    public speed: number;
    public roamDirection: number;
    public roamSpeed: number;
    public currentTarget: any | null;
    public targetLockTime: number;
    public minLockDuration: number;
    public huntingSpeed: number;
    public burstState: BurstState;
    public burstDirection: number;
    public burstSpeed: number;
    public burstDuration: number;
    public burstTimer: number;
    public burstsFired: number;
    public baseBurstCooldown: number;
    public fatigueFactor: number;
    public fatigueRecoveryTimer: number;
    public fatigueRecoveryDuration: number;
    public threatened: boolean;
    public hue: number;
    public maxAge: number;
    public angle: number;
    public depth?: number;

    /**
     * @param scene - Game scene
     * @param worldX - World X position
     * @param y - Y position (will be adjusted to bottom)
     */
    constructor(scene: Phaser.Scene, worldX: number, y: number) {
        // Get crayfish configuration
        const speciesData = getOrganismData('crayfish') as CrayfishData;

        // Use crayfish texture
        const textureKey = 'crayfish';

        // Call parent constructor
        super(scene, worldX, y, textureKey);

        // Store species data
        this.speciesData = speciesData;

        // Set depth for rendering (above zooplankton, below fish)
        this.setDepth(35);

        // Initialize placeholder values (will be set in init method)
        this.id = '';
        this.size = 0;
        this.length = 0;
        this.speed = 0;
        this.roamDirection = 0;
        this.roamSpeed = 0;
        this.currentTarget = null;
        this.targetLockTime = 0;
        this.minLockDuration = 0;
        this.huntingSpeed = 0;
        this.burstState = 'idle';
        this.burstDirection = 0;
        this.burstSpeed = 0;
        this.burstDuration = 0;
        this.burstTimer = 0;
        this.burstsFired = 0;
        this.baseBurstCooldown = 0;
        this.fatigueFactor = 0;
        this.fatigueRecoveryTimer = 0;
        this.fatigueRecoveryDuration = 0;
        this.threatened = false;
        this.hue = 0;
        this.maxAge = 0;
        this.angle = 0;

        // Initialize crayfish properties
        this.initCrayfishProperties(scene);

        // Update screen position
        this.updateScreenPosition();
    }

    /**
     * Initialize crayfish-specific properties
     */
    private initCrayfishProperties(scene: Phaser.Scene): void {
        // Unique identifier
        this.id = `crayfish_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Biological properties (small invertebrates)
        this.size = Utils.randomBetween(2.0, 4.0); // Inches (realistic crayfish size)
        this.length = this.size;
        this.speed = Utils.randomBetween(0.3, 0.6); // Slow crawling speed

        // Movement behavior - crawling along bottom
        this.roamDirection = Math.random() < 0.5 ? -1 : 1; // Left or right
        this.roamSpeed = Utils.randomBetween(0.2, 0.4);

        // Hunting behavior
        this.currentTarget = null; // Currently targeted zooplankton
        this.targetLockTime = 0;
        this.minLockDuration = 90; // 1.5 seconds at 60fps
        this.huntingSpeed = Utils.randomBetween(0.5, 0.8);

        // Escape burst mechanics
        this.burstState = 'idle'; // idle, bursting, cooldown
        this.burstDirection = 0; // Direction of burst (opposite of threat)
        this.burstSpeed = 8.0; // Very fast backward movement
        this.burstDuration = 8; // Frames per burst
        this.burstTimer = 0; // Current burst/cooldown timer
        this.burstsFired = 0; // Number of bursts in current sequence
        this.baseBurstCooldown = 20; // Base cooldown between bursts (0.33 seconds)
        this.fatigueFactor = 1.0; // Multiplier that increases with each burst
        this.fatigueRecoveryTimer = 0; // Time since last threat
        this.fatigueRecoveryDuration = 180; // 3 seconds to fully recover

        // State
        this.threatened = false; // Is there a predator nearby?

        // Visual properties
        this.hue = Utils.randomBetween(20, 40); // Brownish-orange color

        // Lifecycle
        this.maxAge = Utils.randomBetween(9000, 18000); // 2.5-5 minutes at 60fps

        // Angle for rendering
        this.angle = this.roamDirection > 0 ? 0 : Math.PI;
    }

    /**
     * Phaser preUpdate - called automatically every frame
     */
    preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        if (this.consumed || !this.active) {
            return;
        }

        // Despawn if too old
        if (this.frameAge > this.maxAge) {
            this.setActive(false);
            this.setVisible(false);
            return;
        }

        // Update burst mechanics if threatened
        if (this.threatened && this.burstState === 'idle') {
            this.initiateBurst();
        }

        // Update burst state
        this.updateBurstMechanics();

        // Normal behavior when not bursting
        if (this.burstState === 'idle') {
            // Recover from fatigue when not threatened
            if (!this.threatened) {
                this.fatigueRecoveryTimer++;
                if (this.fatigueRecoveryTimer >= this.fatigueRecoveryDuration) {
                    this.fatigueFactor = Math.max(1.0, this.fatigueFactor - 0.1);
                    this.burstsFired = Math.max(0, this.burstsFired - 1);
                    this.fatigueRecoveryTimer = 0;
                }
            }

            // Get nearby zooplankton from scene
            const nearbyZooplankton = this.findNearbyZooplankton();

            // Choose behavior: hunting or roaming
            if (nearbyZooplankton && nearbyZooplankton.length > 0) {
                this.handleHuntingBehavior(nearbyZooplankton);
            } else {
                this.handleRoamingBehavior();
            }
        }

        // Keep on bottom of lake
        this.stayOnBottom();

        // Update depth
        const depthScale = (this.scene as any).sonarDisplay ?
            (this.scene as any).sonarDisplay.getDepthScale() :
            GameConfig.DEPTH_SCALE;
        this.depth = this.y / depthScale;

        // Update screen position
        this.updateScreenPosition();

        // Check if too far from player (despawn)
        if (this.isTooFarFromPlayer(600)) {
            this.setActive(false);
            this.setVisible(false);
        }

        // Update sprite rotation based on angle
        this.rotation = this.angle;

        // Flip sprite based on direction
        const isMovingRight = Math.cos(this.angle) > 0;
        this.setFlipX(isMovingRight);
    }

    /**
     * Find nearby zooplankton for hunting
     */
    private findNearbyZooplankton(): any[] {
        if (!(this.scene as any).zooplankton) return [];

        return (this.scene as any).zooplankton.filter((zp: any) => {
            if (!zp.visible || zp.consumed) return false;

            const distance = Phaser.Math.Distance.Between(
                this.worldX, this.y,
                zp.worldX, zp.y
            );

            return distance < 150; // Detection range
        });
    }

    /**
     * Initiate escape burst
     */
    private initiateBurst(): void {
        // Determine burst direction (backwards from current facing)
        this.burstDirection = this.angle !== 0
            ? this.angle + Math.PI
            : (Math.random() < 0.5 ? Math.PI : 0);

        this.burstState = 'bursting';
        this.burstTimer = this.burstDuration;
        this.burstsFired++;
        this.fatigueFactor += 0.3; // Each burst adds fatigue
        this.fatigueRecoveryTimer = 0; // Reset recovery
    }

    /**
     * Update burst mechanics (bursting and cooldown)
     */
    private updateBurstMechanics(): void {
        if (this.burstState === 'bursting') {
            this.burstTimer--;

            // Execute burst movement (fast horizontal backwards)
            const burstX = Math.cos(this.burstDirection) * this.burstSpeed;
            this.worldX += burstX;

            // Update angle for rendering
            this.angle = this.burstDirection;

            // Transition to cooldown
            if (this.burstTimer <= 0) {
                this.burstState = 'cooldown';
                // Cooldown increases with fatigue
                this.burstTimer = Math.floor(this.baseBurstCooldown * this.fatigueFactor);
            }
        } else if (this.burstState === 'cooldown') {
            this.burstTimer--;

            // Return to idle after cooldown
            if (this.burstTimer <= 0) {
                this.burstState = 'idle';
            }
        }
    }

    /**
     * Roam along the bottom looking for food
     */
    private handleRoamingBehavior(): void {
        // Change direction occasionally
        if (Math.random() < 0.02) {
            this.roamDirection *= -1;
        }

        // Move along bottom
        this.worldX += this.roamDirection * this.roamSpeed;
        this.angle = this.roamDirection > 0 ? 0 : Math.PI;
    }

    /**
     * Hunt zooplankton
     */
    private handleHuntingBehavior(nearbyZooplankton: any[]): void {
        // Check if current target is still valid
        if (this.currentTarget && this.currentTarget.visible && !this.currentTarget.consumed) {
            this.targetLockTime++;

            const currentDist = Phaser.Math.Distance.Between(
                this.worldX, this.y,
                this.currentTarget.worldX, this.currentTarget.y
            );

            // Keep current target if within range
            if (currentDist < 150) {
                // Only consider switching if locked long enough
                if (this.targetLockTime > this.minLockDuration) {
                    let bestZooplankton = this.currentTarget;
                    let bestScore = currentDist;

                    nearbyZooplankton.forEach(zp => {
                        if (!zp.visible || zp.consumed || zp === this.currentTarget) return;

                        const distance = Phaser.Math.Distance.Between(
                            this.worldX, this.y,
                            zp.worldX, zp.y
                        );

                        // Only switch if significantly better (40% improvement)
                        if (distance < bestScore * 0.6) {
                            bestScore = distance;
                            bestZooplankton = zp;
                        }
                    });

                    // If we switched targets, reset lock time
                    if (bestZooplankton !== this.currentTarget) {
                        this.currentTarget = bestZooplankton;
                        this.targetLockTime = 0;
                    }
                }
            } else {
                // Target moved too far
                this.currentTarget = null;
                this.targetLockTime = 0;
            }
        }

        // If no valid current target, find a new one
        if (!this.currentTarget) {
            let bestZooplankton: any = null;
            let bestDistance = Infinity;

            nearbyZooplankton.forEach(zp => {
                if (!zp.visible || zp.consumed) return;

                const distance = Phaser.Math.Distance.Between(
                    this.worldX, this.y,
                    zp.worldX, zp.y
                );

                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestZooplankton = zp;
                }
            });

            this.currentTarget = bestZooplankton;
            this.targetLockTime = 0;
        }

        // Move towards target
        if (this.currentTarget) {
            const dx = this.currentTarget.worldX - this.worldX;
            const dy = this.currentTarget.y - this.y;
            const distance = Phaser.Math.Distance.Between(
                this.worldX, this.y,
                this.currentTarget.worldX, this.currentTarget.y
            );

            // If close enough, consume the zooplankton
            if (distance < 8) {
                this.currentTarget.markConsumed();
                this.currentTarget = null;
                this.targetLockTime = 0;
            } else {
                // Move towards target
                const moveX = (dx / distance) * this.huntingSpeed;
                this.worldX += moveX;

                // Update angle for rendering
                this.angle = Math.atan2(dy, dx);
            }
        }
    }

    /**
     * Keep crayfish on the lake bottom
     */
    private stayOnBottom(): void {
        const bottomDepth = this.getBottomDepthAtPosition();

        // Use dynamic depth scale from sonar display
        const depthScale = (this.scene as any).sonarDisplay ?
            (this.scene as any).sonarDisplay.getDepthScale() :
            GameConfig.DEPTH_SCALE;

        // Calculate bottom Y position with small offset to appear grounded
        const BOTTOM_OFFSET_PX = 12;
        const bottomY = (bottomDepth * depthScale) + BOTTOM_OFFSET_PX;

        // Allow small movement range on bottom (0.2-1 foot from actual bottom)
        const minY = bottomY - (1 * depthScale); // 1 foot above bottom
        const maxY = bottomY; // Right on bottom (with offset)

        // Snap to bottom zone
        if (this.y < minY) {
            this.y += 0.5;
        } else if (this.y > maxY) {
            this.y -= 0.5;
        }

        // Clamp to ensure we stay in zone
        this.y = Math.max(minY, Math.min(maxY, this.y));
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
     * Check if too far from player (for despawning)
     */
    private isTooFarFromPlayer(maxDistance: number): boolean {
        const canvasWidth = this.scene.scale.width;
        const playerWorldX = canvasWidth / 2;
        const distance = Math.abs(this.worldX - playerWorldX);
        return distance > maxDistance;
    }

    /**
     * Set threat status (called by FoodChainSystem when predators nearby)
     */
    setThreatened(threatened: boolean): void {
        this.threatened = threatened;
    }

    /**
     * Get debug info
     */
    getInfo(): CrayfishInfo {
        return {
            ...super.getInfo(),
            size: this.size.toFixed(2),
            burstState: this.burstState,
            burstsFired: this.burstsFired,
            fatigueFactor: this.fatigueFactor.toFixed(2),
            threatened: this.threatened,
            hunting: this.currentTarget !== null
        };
    }

    /**
     * Reset crayfish for object pooling
     */
    reset(worldX: number, y: number): void {
        super.reset(worldX, y);
        this.initCrayfishProperties(this.scene);
        this.updateScreenPosition();
    }

    /**
     * Clean up
     */
    destroy(fromScene?: boolean): void {
        this.currentTarget = null;
        super.destroy(fromScene);
    }
}

export default CrayfishSprite;
