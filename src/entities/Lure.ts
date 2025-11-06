import GameConfig from '../config/GameConfig.js';
import { Constants, LureState } from '../utils/Constants.js';

/**
 * Trail position for visual effect
 */
export interface TrailPosition {
    x: number;
    y: number;
}

/**
 * Lure class - Player-controlled fishing lure
 */
export class Lure {
    // Core properties
    public scene: Phaser.Scene;
    public x: number;
    public y: number;
    public startX: number;
    public startY: number;
    public depth: number;
    public velocity: number;
    public state: LureState;
    public retrieveSpeed: number;

    // Baitcasting reel mechanics
    public weight: number; // Lure weight in ounces
    public spoolReleased: boolean;
    public triggerControlActive: boolean;
    public currentTriggerSpeed: number; // 0-1

    // Jigging mechanics (right stick control)
    public jigOffset: number;
    public baseY: number;
    public jigSensitivity: number;
    public maxJigRange: number;
    public isJigging: boolean;

    // Visual representation
    public graphics: Phaser.GameObjects.Graphics;
    public trail: TrailPosition[];
    public maxTrailLength: number;

    // Vibration effect (for fish bumps)
    public vibrating: boolean;
    public vibrationTime: number;
    public vibrationDuration: number;
    public vibrationIntensity: number;
    public vibrationOffsetX: number;
    public vibrationOffsetY: number;

    // Stats
    public maxDepthReached: number;
    public timeInWater: number;

    // Drop cooldown - prevents auto-drop after catching fish
    public lastResetTime: number;
    public dropCooldownMs: number;

    // Water state tracking
    public inWater: boolean;

    // Lure dimensions (for calculating visibility above surface)
    public readonly LURE_RADIUS: number = 4;
    public readonly GLOW_RADIUS: number = 6;
    public readonly PULSE_RADIUS: number = 8;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.depth = y / GameConfig.DEPTH_SCALE;
        this.velocity = 0;
        this.state = y === 0 ? Constants.LURE_STATE.SURFACE : Constants.LURE_STATE.IDLE;
        this.retrieveSpeed = GameConfig.LURE_MIN_RETRIEVE_SPEED;

        // Baitcasting reel mechanics
        this.weight = 0.5;
        this.spoolReleased = false;
        this.triggerControlActive = false;
        this.currentTriggerSpeed = 0;

        // Jigging mechanics
        this.jigOffset = 0;
        this.baseY = y;
        this.jigSensitivity = 8;
        this.maxJigRange = 20;
        this.isJigging = false;

        // Visual representation
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(15);
        this.trail = [];
        this.maxTrailLength = 20;

        // Vibration effect
        this.vibrating = false;
        this.vibrationTime = 0;
        this.vibrationDuration = 0;
        this.vibrationIntensity = 0;
        this.vibrationOffsetX = 0;
        this.vibrationOffsetY = 0;

        // Stats
        this.maxDepthReached = this.depth;
        this.timeInWater = 0;

        // Drop cooldown
        this.lastResetTime = 0;
        this.dropCooldownMs = 500;

        // Water state tracking
        this.inWater = y > 0;
    }

    /**
     * Update lure physics and state
     */
    update(): void {
        // Keep lure centered horizontally
        const actualGameWidth = this.scene.scale.width || GameConfig.CANVAS_WIDTH;
        this.x = actualGameWidth / 2;
        this.startX = this.x;

        // Update time in water
        if (this.state !== Constants.LURE_STATE.SURFACE) {
            this.timeInWater++;
        }

        // Update vibration effect
        if (this.vibrating) {
            this.vibrationTime++;

            const progress = this.vibrationTime / this.vibrationDuration;
            const decay = 1 - progress;

            if (this.vibrationTime >= this.vibrationDuration) {
                this.vibrating = false;
                this.vibrationOffsetX = 0;
                this.vibrationOffsetY = 0;
            } else {
                const currentIntensity = this.vibrationIntensity * decay;
                this.vibrationOffsetX = (Math.random() - 0.5) * currentIntensity * 2;
                this.vibrationOffsetY = (Math.random() - 0.5) * currentIntensity * 2;
            }
        }

        // Apply physics based on state
        switch (this.state) {
            case Constants.LURE_STATE.DROPPING:
                const weightMultiplier = this.weight * 1.5;
                this.velocity += GameConfig.LURE_GRAVITY * weightMultiplier;
                const maxFallSpeed = GameConfig.LURE_MAX_FALL_SPEED * weightMultiplier;
                if (this.velocity > maxFallSpeed) {
                    this.velocity = maxFallSpeed;
                }
                this.baseY = this.y;
                break;

            case Constants.LURE_STATE.RETRIEVING:
                if (!this.triggerControlActive) {
                    this.velocity = -this.retrieveSpeed;
                }
                this.baseY = this.y;
                break;

            case Constants.LURE_STATE.IDLE:
                this.velocity = 0;
                break;
        }

        // Update position (base movement)
        this.y += this.velocity;

        // Apply jig offset on top of base movement
        if (this.isJigging) {
            this.y = this.baseY + this.jigOffset;
        }

        // Get dynamic depth scale
        const depthScale = (this.scene as any).depthConverter?.depthScale || GameConfig.DEPTH_SCALE;
        this.depth = this.y / depthScale;

        // Surface boundary - allow reeling above water
        const minReelY = -(this.PULSE_RADIUS * 2);
        if (this.y <= minReelY) {
            this.y = minReelY;
            this.velocity = 0;
        }

        // Update water state
        this.inWater = this.y > 0;

        // Update lure state based on position
        if (this.y <= 0 && this.state === Constants.LURE_STATE.RETRIEVING) {
            this.state = Constants.LURE_STATE.SURFACE;
            this.depth = 0;
        } else if (this.y > 0 && this.state === Constants.LURE_STATE.SURFACE) {
            this.state = Constants.LURE_STATE.DROPPING;
        }

        // Get actual bottom depth
        const bottomDepth = (this.scene as any).maxDepth || GameConfig.MAX_DEPTH;

        // Stop lure at lake bottom
        const BOTTOM_OFFSET_PX = 12;
        const bottomY = bottomDepth * depthScale + BOTTOM_OFFSET_PX;
        if (this.y >= bottomY) {
            this.y = bottomY;
            this.depth = bottomDepth;
            this.velocity = 0;
            this.state = Constants.LURE_STATE.IDLE;
        }

        // Track max depth
        if (this.depth > this.maxDepthReached) {
            this.maxDepthReached = this.depth;
        }

        // Update trail
        this.updateTrail();

        // Render
        this.render();
    }

    /**
     * Update lure trail effect
     */
    updateTrail(): void {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    /**
     * Render lure graphics
     */
    render(): void {
        this.graphics.clear();

        // Apply vibration offset
        const renderX = this.x + this.vibrationOffsetX;
        const renderY = this.y + this.vibrationOffsetY;

        // Draw trail (fading effect)
        for (let i = 0; i < this.trail.length - 1; i++) {
            const alpha = (i / this.trail.length) * 0.5;
            this.graphics.lineStyle(1, GameConfig.COLOR_LURE, alpha);
            this.graphics.lineBetween(
                this.trail[i].x, this.trail[i].y,
                this.trail[i + 1].x, this.trail[i + 1].y
            );
        }

        // Draw lure body
        this.graphics.fillStyle(GameConfig.COLOR_LURE, 1.0);
        this.graphics.fillCircle(renderX, renderY, 4);

        // Glow effect
        this.graphics.lineStyle(2, GameConfig.COLOR_LURE, 0.5);
        this.graphics.strokeCircle(renderX, renderY, 6);

        // Pulsing ring
        const pulse = Math.sin(this.scene.time.now * 0.005) * 0.3 + 0.4;
        this.graphics.lineStyle(1, GameConfig.COLOR_LURE, pulse);
        this.graphics.strokeCircle(renderX, renderY, 8);
    }

    /**
     * Drop lure (release spool)
     */
    drop(): void {
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastResetTime < this.dropCooldownMs) {
            return;
        }

        if (this.state === Constants.LURE_STATE.SURFACE) {
            this.timeInWater = 0;
        }
        this.spoolReleased = true;
        this.state = Constants.LURE_STATE.DROPPING;
    }

    /**
     * Retrieve lure (engage clutch)
     */
    retrieve(): void {
        if (this.state !== Constants.LURE_STATE.SURFACE) {
            this.velocity = 0;
            this.spoolReleased = false;
            this.state = Constants.LURE_STATE.RETRIEVING;
        }
    }

    /**
     * Retrieve with variable speed based on controller trigger
     */
    retrieveWithTrigger(triggerValue: number): void {
        if (this.state === Constants.LURE_STATE.DROPPING) {
            this.velocity = 0;
            this.spoolReleased = false;
            this.state = Constants.LURE_STATE.RETRIEVING;
            console.log('Clutch engaged - stopped drop');
        } else if (this.state === Constants.LURE_STATE.IDLE) {
            this.state = Constants.LURE_STATE.RETRIEVING;
        } else if (this.state === Constants.LURE_STATE.SURFACE) {
            this.triggerControlActive = false;
            this.currentTriggerSpeed = 0;
            return;
        }

        this.triggerControlActive = true;

        const minSpeed = GameConfig.LURE_MIN_RETRIEVE_SPEED;
        const maxSpeed = GameConfig.LURE_MAX_RETRIEVE_SPEED;

        const easedTrigger = triggerValue * triggerValue;
        const speedRange = maxSpeed - minSpeed;
        const targetSpeed = minSpeed + (speedRange * easedTrigger);

        this.currentTriggerSpeed = easedTrigger;
        this.velocity = -targetSpeed;
    }

    /**
     * Stop retrieve (clutch stays engaged)
     */
    stopRetrieve(): void {
        if (this.state === Constants.LURE_STATE.RETRIEVING) {
            this.velocity = 0;
            this.state = Constants.LURE_STATE.IDLE;
            this.triggerControlActive = false;
            this.currentTriggerSpeed = 0;
        }
    }

    /**
     * Adjust retrieve speed (for keyboard controls)
     */
    adjustSpeed(delta: number): void {
        this.retrieveSpeed += delta * GameConfig.LURE_SPEED_INCREMENT;
        this.retrieveSpeed = Math.max(GameConfig.LURE_MIN_RETRIEVE_SPEED,
                                     Math.min(GameConfig.LURE_MAX_RETRIEVE_SPEED, this.retrieveSpeed));
    }

    /**
     * Apply jigging movement from right analog stick
     */
    applyJig(stickY: number, deadZone: number = 0.1): void {
        if (this.state !== Constants.LURE_STATE.IDLE) {
            this.isJigging = false;
            this.jigOffset = 0;
            return;
        }

        if (Math.abs(stickY) < deadZone) {
            if (this.isJigging) {
                this.jigOffset *= 0.8;
                if (Math.abs(this.jigOffset) < 0.5) {
                    this.jigOffset = 0;
                    this.isJigging = false;
                }
            }
            return;
        }

        this.isJigging = true;

        const targetOffset = stickY * this.jigSensitivity;
        const clampedOffset = Math.max(-this.maxJigRange, Math.min(this.maxJigRange, targetOffset));

        this.jigOffset = this.jigOffset * 0.7 + clampedOffset * 0.3;
    }

    /**
     * Trigger a vibration effect on the lure (for fish bumps)
     */
    vibrate(intensity: number = 3, duration: number = 20): void {
        this.vibrating = true;
        this.vibrationTime = 0;
        this.vibrationDuration = duration;
        this.vibrationIntensity = intensity;
    }

    /**
     * Reset lure to surface
     */
    reset(): void {
        this.x = GameConfig.CANVAS_WIDTH / 2;
        this.y = 0;
        this.depth = 0;
        this.velocity = 0;
        this.state = Constants.LURE_STATE.SURFACE;
        this.trail = [];
        this.timeInWater = 0;

        this.lastResetTime = this.scene.time.now;
        this.baseY = 0;
        this.jigOffset = 0;
        this.isJigging = false;
        this.triggerControlActive = false;
        this.currentTriggerSpeed = 0;
        this.vibrating = false;
        this.vibrationTime = 0;
        this.vibrationOffsetX = 0;
        this.vibrationOffsetY = 0;
    }

    /**
     * Get lure information for UI
     */
    getInfo(): {
        depth: number;
        state: LureState;
        speed: string;
        retrieveSpeed: string;
    } {
        return {
            depth: Math.floor(this.depth),
            state: this.state,
            speed: Math.abs(this.velocity).toFixed(1),
            retrieveSpeed: this.retrieveSpeed.toFixed(1)
        };
    }

    /**
     * Clean up graphics
     */
    destroy(): void {
        this.graphics.destroy();
    }
}

export default Lure;
