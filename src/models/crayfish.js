import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';
import AquaticOrganism from './AquaticOrganism.js';

/**
 * Crayfish Model - Extends AquaticOrganism
 * Bottom-dwelling invertebrate that hunts zooplankton
 *
 * Crayfish are small invertebrates that:
 * - Stay on the lake bottom
 * - Hunt zooplankton
 * - Escape threats with backward "zoom" bursts
 * - Get fatigued after multiple bursts
 * - Are preferred prey for smallmouth bass
 */
export class Crayfish extends AquaticOrganism {
    constructor(scene, worldX, y) {
        // Call parent constructor (no species data for simple organisms)
        super(scene, worldX, y);

        // Biological properties (small invertebrates, larger than zooplankton)
        this.size = Utils.randomBetween(0.5, 1.5); // Inches (slightly larger than zooplankton)
        this.length = this.size;
        this.speed = Utils.randomBetween(0.3, 0.6); // Slow crawling speed

        // Movement behavior - crawling along bottom
        this.roamDirection = Math.random() < 0.5 ? -1 : 1; // Left or right
        this.roamSpeed = Utils.randomBetween(0.2, 0.4);

        // Hunting behavior (similar to baitfish)
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
        this.consumed = false;
        this.threatened = false; // Is there a predator nearby?

        // Visual properties
        this.hue = Utils.randomBetween(20, 40); // Brownish-orange color

        // Lifecycle
        this.maxAge = Utils.randomBetween(9000, 18000); // 2.5-5 minutes at 60fps
    }

    /**
     * Update crayfish position and behavior
     */
    update(nearbyZooplankton = [], predatorsNearby = false) {
        if (this.consumed || !this.visible) {
            return;
        }

        this.age++;

        // Despawn if too old
        if (this.age > this.maxAge) {
            this.visible = false;
            return;
        }

        // Update threat status
        this.threatened = predatorsNearby;

        // Handle burst mechanics if threatened
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

            // Choose behavior: hunting or roaming
            if (nearbyZooplankton && nearbyZooplankton.length > 0) {
                this.handleHuntingBehavior(nearbyZooplankton);
            } else {
                this.handleRoamingBehavior();
            }
        }

        // Keep on bottom of lake
        this.stayOnBottom();

        // Update depth and screen position
        this.depth = this.y / GameConfig.DEPTH_SCALE;
        this.updateScreenPosition();

        // Check if too far from player
        if (this.isTooFarFromPlayer(600)) {
            this.visible = false;
        }
    }

    /**
     * Initiate escape burst
     */
    initiateBurst() {
        // Determine burst direction (backwards from current facing)
        // If we have an angle, burst opposite; otherwise pick random backward direction
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
    updateBurstMechanics() {
        if (this.burstState === 'bursting') {
            this.burstTimer--;

            // Execute burst movement (fast horizontal backwards)
            const burstX = Math.cos(this.burstDirection) * this.burstSpeed;
            const burstY = 0; // Horizontal only, stay on bottom
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
    handleRoamingBehavior() {
        // Change direction occasionally
        if (Math.random() < 0.02) {
            this.roamDirection *= -1;
        }

        // Move along bottom
        this.worldX += this.roamDirection * this.roamSpeed;
        this.angle = this.roamDirection > 0 ? 0 : Math.PI;
    }

    /**
     * Hunt zooplankton (similar to baitfish hunting)
     */
    handleHuntingBehavior(nearbyZooplankton) {
        // Check if current target is still valid
        if (this.currentTarget && this.currentTarget.visible && !this.currentTarget.consumed) {
            this.targetLockTime++;

            const currentDist = Math.sqrt(
                Math.pow(this.x - this.currentTarget.x, 2) +
                Math.pow(this.y - this.currentTarget.y, 2)
            );

            // Keep current target if within range
            if (currentDist < 150) {
                // Only consider switching if locked long enough
                if (this.targetLockTime > this.minLockDuration) {
                    let bestZooplankton = this.currentTarget;
                    let bestScore = currentDist;

                    nearbyZooplankton.forEach(zp => {
                        if (!zp.visible || zp.consumed || zp === this.currentTarget) return;

                        const distance = Math.sqrt(
                            Math.pow(this.x - zp.x, 2) + Math.pow(this.y - zp.y, 2)
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
            let bestZooplankton = null;
            let bestDistance = Infinity;

            nearbyZooplankton.forEach(zp => {
                if (!zp.visible || zp.consumed) return;

                const distance = Math.sqrt(
                    Math.pow(this.x - zp.x, 2) + Math.pow(this.y - zp.y, 2)
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
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If close enough, consume the zooplankton
            if (distance < 8) {
                this.currentTarget.consume();
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
    stayOnBottom() {
        const bottomDepth = this.getBottomDepthAtPosition();
        const bottomY = bottomDepth * GameConfig.DEPTH_SCALE;
        const minY = bottomY - (1 * GameConfig.DEPTH_SCALE); // 1 foot from bottom
        const maxY = bottomY - (0.2 * GameConfig.DEPTH_SCALE); // Very close to bottom

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
     * Mark as consumed by a predator (likely a smallmouth bass!)
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
     * Render the crayfish (procedural rendering)
     * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to render to
     */
    render(graphics) {
        if (!this.visible || this.consumed) {
            return;
        }

        const alpha = 0.7;
        const screenX = this.x;
        const screenY = this.y;
        const bodySize = this.size + 1;

        // Different visual based on state
        let color = 0xaa6633; // Brownish-orange
        if (this.burstState === 'bursting') {
            color = 0xff8844; // Brighter when bursting
        } else if (this.threatened) {
            color = 0xdd7744; // Slightly brighter when threatened
        }

        // Outer glow
        graphics.fillStyle(color, alpha * 0.3);
        graphics.fillCircle(screenX, screenY, bodySize * 1.5);

        // Body (slightly elongated for crayfish shape)
        graphics.fillStyle(color, alpha * 0.8);
        graphics.fillEllipse(screenX, screenY, bodySize * 1.5, bodySize * 0.8);

        // Brighter center
        graphics.fillStyle(color, alpha);
        graphics.fillCircle(screenX, screenY, bodySize * 0.5);

        // Claws (two small dots on sides)
        if (this.burstState !== 'bursting') {
            const clawSize = bodySize * 0.3;
            graphics.fillStyle(color, alpha * 0.6);
            graphics.fillCircle(screenX - bodySize * 0.7, screenY - bodySize * 0.3, clawSize);
            graphics.fillCircle(screenX - bodySize * 0.7, screenY + bodySize * 0.3, clawSize);
        }

        // Burst effect (motion lines)
        if (this.burstState === 'bursting') {
            graphics.lineStyle(1, color, alpha * 0.5);
            for (let i = 0; i < 3; i++) {
                const offset = (i + 1) * bodySize * 1.5;
                const lineX = screenX + Math.cos(this.burstDirection) * offset;
                graphics.lineBetween(screenX, screenY, lineX, screenY);
            }
        }
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
            age: this.age,
            burstState: this.burstState,
            burstsFired: this.burstsFired,
            fatigueFactor: this.fatigueFactor.toFixed(2),
            threatened: this.threatened,
            hunting: this.currentTarget !== null
        };
    }
}

export default Crayfish;
