import { FishSprite } from '../sprites/FishSprite.js';
import { Lure } from './Lure.js';
/**
 * Fish fight state machine states
 */
export type FightState = 'hookset' | 'fighting' | 'thrashing' | 'giving_up';
/**
 * Hookset quality levels
 */
export type HooksetQuality = 'barely' | 'bad' | 'good' | 'great';
/**
 * Reel model interface (from ReelModel.js)
 */
export interface ReelModel {
    reelType: string;
    lineTestStrength: number;
    lineCapacity: number;
    lineOut: number;
    dragSetting: number;
    maxDragLimit: number;
    properties: Record<string, any>;
    adjustDrag: (increment: number) => void;
    setDrag: (percentage: number) => void;
    getCurrentDragForce: () => number;
    getGearRatio: () => number;
    retrieveLine: (distance: number) => void;
    addLineOut: (distance: number) => boolean;
    getLineRemainingPercent: () => number;
    getDisplayName: () => string;
}
/**
 * Fishing line model interface (from FishingLineModel.js)
 */
export interface FishingLineModel {
    lineType: string;
    braidColor: string;
    properties: Record<string, any>;
    getCurrentProperties: () => any;
    getSensitivityMultiplier: () => number;
    getVisibilityFactor: () => number;
    getShockAbsorptionMultiplier: () => number;
    getStretchFactor: () => number;
    getDisplayName: () => string;
}
/**
 * Caught fish data for end screen
 */
export interface CaughtFishData {
    name: string;
    weight: string;
    weightValue: number;
    points: number;
    size: string;
    gender: string;
    health: number;
    hunger: number;
    depth: number;
    depthZone: string;
    reelCount: number;
    fightTime: number;
    isEmergencyFish: boolean;
}
/**
 * FishFight class - Manages fish fighting mechanics
 */
export declare class FishFight {
    scene: Phaser.Scene;
    fish: FishSprite;
    lure: Lure;
    fishingLine: FishingLineModel;
    reelModel: ReelModel;
    active: boolean;
    hasLanded: boolean;
    lineTension: number;
    fishDistance: number;
    initialDepth: number;
    fightState: FightState;
    stateTimer: number;
    nextThrashTime: number;
    thrashDuration: number;
    thrashIntensity: number;
    lastReelTime: number;
    reelCount: number;
    fishStrength: number;
    fishEnergy: number;
    fightTime: number;
    swimDownForce: number;
    swimDownTarget: number;
    thrashAmount: number;
    thrashSpeed: number;
    centerX: number;
    hookset: HooksetQuality;
    isReeling: boolean;
    constructor(scene: Phaser.Scene, fish: FishSprite, lure: Lure, fishingLineModel: FishingLineModel, reelModel: ReelModel);
    /**
     * Determine hookset quality based on fish engagement and chance
     */
    determineHooksetQuality(): HooksetQuality;
    /**
     * Get description of hookset quality
     */
    getHooksetDescription(): string;
    /**
     * Get hookset multiplier for hook spit/pop-off chance
     */
    getHooksetSecurityMultiplier(): number;
    /**
     * Main fight update loop
     */
    update(currentTime: number, reelInput: number): void;
    /**
     * Update fight state based on energy and time
     */
    updateFightState(): void;
    /**
     * Enter thrashing state
     */
    enterThrashingState(): void;
    /**
     * Calculate hook spit chance based on fish size and hookset
     */
    calculateHookSpitChance(): number;
    /**
     * Fish spits the hook
     */
    spitHook(): void;
    /**
     * Continuous reeling based on analog trigger input
     */
    reelContinuous(currentTime: number, reelSpeed: number): void;
    /**
     * Apply fish behavior (pulling and swimming)
     */
    applyFishBehavior(): void;
    /**
     * Attach fish to lure visually
     */
    attachFishToLure(): void;
    /**
     * Update fish position during fight
     */
    updateFishPosition(): void;
    /**
     * Line breaks - fish escapes
     */
    breakLine(): void;
    /**
     * Land fish successfully
     */
    landFish(): void;
    /**
     * Draw measurement ruler below fish
     */
    drawMeasurementRuler(startX: number, centerY: number, fishLengthInches: number, pixelsPerInch: number): Phaser.GameObjects.GameObject[];
    /**
     * Draw size classification ruler
     */
    drawClassificationRuler(startX: number, centerY: number, speciesName: string, fishLength: number, pixelsPerInch: number, popupWidth: number): Phaser.GameObjects.GameObject[];
    /**
     * Show catch popup with fish details
     */
    showCatchPopup(info: any): void;
    /**
     * End fight and clean up
     */
    endFight(): void;
}
export default FishFight;
//# sourceMappingURL=FishFight.d.ts.map