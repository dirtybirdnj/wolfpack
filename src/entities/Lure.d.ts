import { LureState } from '../utils/Constants.js';
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
export declare class Lure {
    scene: Phaser.Scene;
    x: number;
    y: number;
    startX: number;
    startY: number;
    depth: number;
    velocity: number;
    state: LureState;
    retrieveSpeed: number;
    weight: number;
    spoolReleased: boolean;
    triggerControlActive: boolean;
    currentTriggerSpeed: number;
    jigOffset: number;
    baseY: number;
    jigSensitivity: number;
    maxJigRange: number;
    isJigging: boolean;
    graphics: Phaser.GameObjects.Graphics;
    trail: TrailPosition[];
    maxTrailLength: number;
    vibrating: boolean;
    vibrationTime: number;
    vibrationDuration: number;
    vibrationIntensity: number;
    vibrationOffsetX: number;
    vibrationOffsetY: number;
    maxDepthReached: number;
    timeInWater: number;
    lastResetTime: number;
    dropCooldownMs: number;
    inWater: boolean;
    readonly LURE_RADIUS: number;
    readonly GLOW_RADIUS: number;
    readonly PULSE_RADIUS: number;
    constructor(scene: Phaser.Scene, x: number, y: number);
    /**
     * Update lure physics and state
     */
    update(): void;
    /**
     * Update lure trail effect
     */
    updateTrail(): void;
    /**
     * Render lure graphics
     */
    render(): void;
    /**
     * Drop lure (release spool)
     */
    drop(): void;
    /**
     * Retrieve lure (engage clutch)
     */
    retrieve(): void;
    /**
     * Retrieve with variable speed based on controller trigger
     */
    retrieveWithTrigger(triggerValue: number): void;
    /**
     * Stop retrieve (clutch stays engaged)
     */
    stopRetrieve(): void;
    /**
     * Adjust retrieve speed (for keyboard controls)
     */
    adjustSpeed(delta: number): void;
    /**
     * Apply jigging movement from right analog stick
     */
    applyJig(stickY: number, deadZone?: number): void;
    /**
     * Trigger a vibration effect on the lure (for fish bumps)
     */
    vibrate(intensity?: number, duration?: number): void;
    /**
     * Reset lure to surface
     */
    reset(): void;
    /**
     * Get lure information for UI
     */
    getInfo(): {
        depth: number;
        state: LureState;
        speed: string;
        retrieveSpeed: string;
    };
    /**
     * Clean up graphics
     */
    destroy(): void;
}
export default Lure;
//# sourceMappingURL=Lure.d.ts.map