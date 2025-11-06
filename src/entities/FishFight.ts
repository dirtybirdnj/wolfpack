import GameConfig from '../config/GameConfig.js';
import { PREDATOR_SPECIES } from '../config/SpeciesData.js';
import { FishSprite, EngagementState } from '../sprites/FishSprite.js';
import { Lure } from './Lure.js';

// ========== TYPE DEFINITIONS ==========

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
export class FishFight {
    // Core properties
    public scene: Phaser.Scene;
    public fish: FishSprite;
    public lure: Lure;
    public fishingLine: FishingLineModel;
    public reelModel: ReelModel;

    // Fight state
    public active: boolean;
    public hasLanded: boolean;
    public lineTension: number;
    public fishDistance: number;
    public initialDepth: number;

    // Fight state machine
    public fightState: FightState;
    public stateTimer: number;
    public nextThrashTime: number;
    public thrashDuration: number;
    public thrashIntensity: number;

    // Reel tracking
    public lastReelTime: number;
    public reelCount: number;

    // Fight properties
    public fishStrength: number;
    public fishEnergy: number;
    public fightTime: number;

    // Downward swimming behavior
    public swimDownForce: number;
    public swimDownTarget: number;

    // Thrashing animation
    public thrashAmount: number;
    public thrashSpeed: number;

    // Ice hole center position
    public centerX: number;

    // Hookset quality
    public hookset: HooksetQuality;

    // Reeling tracking (for continuous reeling)
    public isReeling: boolean;

    constructor(scene: Phaser.Scene, fish: FishSprite, lure: Lure, fishingLineModel: FishingLineModel, reelModel: ReelModel) {
        this.scene = scene;
        this.fish = fish;
        this.lure = lure;
        this.fishingLine = fishingLineModel;
        this.reelModel = reelModel;

        // Fight state
        this.active = true;
        this.hasLanded = false;
        this.lineTension = 20;
        this.fishDistance = Math.abs(this.fish.y - 0);
        this.initialDepth = this.fish.y;

        // Fight state machine
        this.fightState = 'hookset';
        this.stateTimer = 0;
        this.nextThrashTime = 300;
        this.thrashDuration = 0;
        this.thrashIntensity = 0;

        // Reel tracking
        this.lastReelTime = 0;
        this.reelCount = 0;

        // Fight properties
        const healthFactor = (this.fish.health || 100) / 100;
        const hungerFactor = 1 - ((this.fish.hunger || 0) / 100);
        const biologicalCondition = (healthFactor + hungerFactor) / 2;

        this.fishStrength = ((this.fish.weight || 10) / 5) * biologicalCondition;
        this.fishEnergy = 100 - ((1 - biologicalCondition) * 30);
        this.fightTime = 0;

        // Downward swimming behavior
        this.swimDownForce = 0;
        this.swimDownTarget = this.fish.y;

        // Thrashing animation
        this.thrashAmount = 0;
        this.thrashSpeed = 0.15 + (biologicalCondition * 0.1);

        // Ice hole center position
        this.centerX = this.lure.x;

        // Initialize line out
        if (this.reelModel) {
            const initialLineOut = this.fishDistance / GameConfig.DEPTH_SCALE;
            this.reelModel.lineOut = initialLineOut;
        }

        // Determine hookset quality
        this.hookset = this.determineHooksetQuality();

        // Reeling tracking
        this.isReeling = false;

        console.log(`Fish condition - Health: ${this.fish.health?.toFixed(0)}%, Hunger: ${this.fish.hunger?.toFixed(0)}%, Strength: ${this.fishStrength.toFixed(1)}, Initial Energy: ${this.fishEnergy.toFixed(1)}`);
        if (this.reelModel && this.fishingLine) {
            const currentDragForce = this.reelModel.getCurrentDragForce();
            const optimalMin = (this.fish.weight || 0) * 0.5;
            const optimalMax = (this.fish.weight || 0) * 1.2;

            console.log(`Reel: ${this.reelModel.getDisplayName()}, Drag: ${this.reelModel.dragSetting}% (${currentDragForce.toFixed(1)} lbs), Line: ${this.reelModel.lineTestStrength} lb test ${this.fishingLine.getDisplayName()}`);
            console.log(`🎣 DRAG GUIDE: Fish weighs ${this.fish.weight?.toFixed(1)} lbs. Optimal drag: ${optimalMin.toFixed(1)}-${optimalMax.toFixed(1)} lbs (${Math.round((optimalMin/this.reelModel.maxDragLimit)*100)}-${Math.round((optimalMax/this.reelModel.maxDragLimit)*100)}%)`);
            console.log(`🪝 HOOKSET: ${this.hookset.toUpperCase()} - ${this.getHooksetDescription()}`);
        }

        // Attach fish to lure visually
        this.attachFishToLure();

        console.log(`Fish fight started! Fish: ${this.fish.weight?.toFixed(1)} lbs, Distance: ${this.fishDistance.toFixed(0)}px, State: ${this.fightState}`);
    }

    /**
     * Determine hookset quality based on fish engagement and chance
     */
    determineHooksetQuality(): HooksetQuality {
        let hooksetScore = 0;

        // Engagement state bonus (0-40 points)
        const engagementState = this.fish.engagementState || 'waiting';
        if (engagementState === 'striking') {
            hooksetScore += 40;
        } else if (engagementState === 'waiting' || engagementState === 'loitering') {
            hooksetScore += 30;
        } else if (engagementState === 'following') {
            hooksetScore += 20;
        } else {
            hooksetScore += 10;
        }

        // Hunger bonus (0-30 points)
        const hungerFactor = (this.fish.hunger || 0) / 100;
        hooksetScore += hungerFactor * 30;

        // Random variance (0-30 points)
        hooksetScore += Math.random() * 30;

        // Convert score to quality
        if (hooksetScore < 25) {
            return 'barely';
        } else if (hooksetScore < 50) {
            return 'bad';
        } else if (hooksetScore < 75) {
            return 'good';
        } else {
            return 'great';
        }
    }

    /**
     * Get description of hookset quality
     */
    getHooksetDescription(): string {
        switch (this.hookset) {
            case 'barely':
                return 'Hook barely caught, high risk of losing fish';
            case 'bad':
                return 'Poor hookset, fish may shake loose';
            case 'good':
                return 'Solid hookset, normal fight';
            case 'great':
                return 'Perfect hookset! Hook is deep and secure';
            default:
                return 'Unknown';
        }
    }

    /**
     * Get hookset multiplier for hook spit/pop-off chance
     */
    getHooksetSecurityMultiplier(): number {
        switch (this.hookset) {
            case 'barely':
                return 2.5;
            case 'bad':
                return 1.5;
            case 'good':
                return 1.0;
            case 'great':
                return 0.3;
            default:
                return 1.0;
        }
    }

    /**
     * Main fight update loop
     */
    update(currentTime: number, reelInput: number): void {
        if (!this.active) return;

        this.fightTime++;
        this.stateTimer++;

        // Update fight state
        this.updateFightState();

        // Track if player is actively reeling
        this.isReeling = false;

        // Handle gamepad reeling (analog trigger)
        if (reelInput > 0.1) {
            const reelSpeed = reelInput;
            this.reelContinuous(currentTime, reelSpeed);
            this.isReeling = true;
        }

        // Fish pulls on line and tries to swim down
        this.applyFishBehavior();

        // Tension naturally decays
        this.lineTension -= GameConfig.TENSION_DECAY_RATE;
        this.lineTension = Math.max(0, this.lineTension);

        // Check for line break
        if (this.reelModel && this.fishingLine) {
            const testStrength = this.reelModel.lineTestStrength;
            const shockAbsorptionMult = this.fishingLine.getShockAbsorptionMultiplier();

            const approximateForce = (this.lineTension / 100) * 20;
            const effectiveBreakStrength = testStrength * shockAbsorptionMult * 3.0;

            if (approximateForce >= effectiveBreakStrength) {
                console.log(`Line break! Force: ${approximateForce.toFixed(1)} lbs exceeded ${effectiveBreakStrength.toFixed(1)} lbs effective strength`);
                this.breakLine();
                return;
            }
        } else {
            if (this.lineTension >= GameConfig.TENSION_BREAK_THRESHOLD) {
                this.breakLine();
                return;
            }
        }

        // Check if fish reached surface
        if (this.fishDistance <= 10) {
            this.landFish();
            return;
        }

        // Update fish position
        this.updateFishPosition();

        // Emit tension update
        this.scene.events.emit('updateLineTension', this.lineTension);

        // Emit line strain data
        if (this.reelModel && this.fishingLine) {
            const testStrength = this.reelModel.lineTestStrength;
            const shockAbsorptionMult = this.fishingLine.getShockAbsorptionMultiplier();
            const approximateForce = (this.lineTension / 100) * 20;
            const effectiveBreakStrength = testStrength * shockAbsorptionMult * 3.0;
            const lineStrainPercent = Math.min(100, (approximateForce / effectiveBreakStrength) * 100);

            this.scene.events.emit('updateLineStrain', {
                testStrength: testStrength,
                strainPercent: Math.round(lineStrainPercent)
            });
        }
    }

    /**
     * Update fight state based on energy and time
     */
    updateFightState(): void {
        const energyPercent = this.fishEnergy;

        switch (this.fightState) {
            case 'hookset':
                if (this.stateTimer > 180) {
                    this.fightState = 'fighting';
                    this.stateTimer = 0;
                    console.log('Fish transitioned to FIGHTING state');
                }
                break;

            case 'fighting':
                if (this.stateTimer >= this.nextThrashTime) {
                    this.enterThrashingState();
                }

                if (energyPercent < 25) {
                    this.fightState = 'giving_up';
                    this.stateTimer = 0;
                    console.log('Fish is GIVING UP - energy below 25%');
                }
                break;

            case 'thrashing':
                if (this.thrashDuration <= 0) {
                    this.fightState = 'fighting';
                    this.stateTimer = 0;
                    this.nextThrashTime = 300 + Math.random() * 120;
                    console.log('Fish returned to FIGHTING state');
                }
                break;

            case 'giving_up':
                // Once giving up, stays in this state
                break;
        }
    }

    /**
     * Enter thrashing state
     */
    enterThrashingState(): void {
        this.fightState = 'thrashing';
        this.stateTimer = 0;
        this.thrashDuration = 120 + Math.random() * 60;
        this.thrashIntensity = 1.0;

        console.log('Fish entered THRASHING state!');

        const hookSpitChance = this.calculateHookSpitChance();
        if (Math.random() < hookSpitChance) {
            console.log(`Fish spit the hook! (${(hookSpitChance * 100).toFixed(1)}% chance)`);
            this.spitHook();
        }
    }

    /**
     * Calculate hook spit chance based on fish size and hookset
     */
    calculateHookSpitChance(): number {
        const sizeCategory = this.fish.sizeCategory || 'MEDIUM';

        let baseChance = 0;
        switch (sizeCategory) {
            case 'SMALL':
                baseChance = 0.02;
                break;
            case 'MEDIUM':
                baseChance = 0.05;
                break;
            case 'LARGE':
                baseChance = 0.10;
                break;
            case 'TROPHY':
                baseChance = 0.15;
                break;
            default:
                baseChance = 0.03;
        }

        const energyFactor = this.fishEnergy / 100;
        let finalChance = baseChance * (0.5 + energyFactor);

        const hooksetMultiplier = this.getHooksetSecurityMultiplier();
        finalChance *= hooksetMultiplier;

        if (Math.random() < 0.1) {
            console.log(`Hook spit chance: ${(finalChance * 100).toFixed(1)}% (base: ${(baseChance * 100).toFixed(1)}%, hookset: ${this.hookset}, mult: ${hooksetMultiplier.toFixed(1)}x)`);
        }

        return finalChance;
    }

    /**
     * Fish spits the hook
     */
    spitHook(): void {
        console.log('HOOK SPIT! Fish escaped.');

        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 240,
            'HOOK SPIT!\nFish Escaped!',
            {
                fontSize: '26px',
                fontFamily: 'Courier New',
                color: '#ffaa00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });

        // Update stats
        (this.scene as any).fishLost++;
        this.scene.events.emit('updateFishLost', (this.scene as any).fishLost);

        // Release fish
        this.fish.caught = false;
        if (this.fish.ai) {
            this.fish.ai.state = 'fleeing';
        }

        const escapeDirection = this.fish.x < GameConfig.CANVAS_WIDTH / 2 ? -1 : 1;
        if (this.fish.ai) {
            this.fish.ai.targetX = escapeDirection < 0 ? -200 : GameConfig.CANVAS_WIDTH + 200;
            this.fish.ai.targetY = this.fish.y + 150;
            this.fish.ai.decisionCooldown = 5000;
        }

        this.lure.reset();
        this.endFight();
    }

    /**
     * Continuous reeling based on analog trigger input
     */
    reelContinuous(currentTime: number, reelSpeed: number): void {
        const stretchFactor = this.fishingLine ? this.fishingLine.getStretchFactor() : 0.7;
        const tensionIncrease = (GameConfig.TENSION_PER_REEL * 0.3) * reelSpeed * (2.0 - stretchFactor);

        this.lineTension += tensionIncrease;
        this.lineTension = Math.min(GameConfig.MAX_LINE_TENSION, this.lineTension);

        if (this.lineTension < GameConfig.TENSION_BREAK_THRESHOLD - 10) {
            const gearRatio = this.reelModel ? this.reelModel.getGearRatio() : 6.0;
            const baseReelSpeed = (GameConfig.REEL_DISTANCE_PER_TAP * 0.5);
            const reelDistance = baseReelSpeed * reelSpeed * (gearRatio / 6.0);

            this.fishDistance -= reelDistance;
            this.fishDistance = Math.max(0, this.fishDistance);

            if (this.reelModel) {
                this.reelModel.retrieveLine(reelDistance / GameConfig.DEPTH_SCALE);
            }

            this.lineTension *= 0.99;
        }

        const dragMultiplier = this.reelModel ? (this.reelModel.dragSetting / 100) : 0.5;
        const energyDrain = (GameConfig.FISH_TIRE_RATE * 0.02) * reelSpeed * (0.5 + dragMultiplier);
        this.fishEnergy -= energyDrain;
        this.fishEnergy = Math.max(0, this.fishEnergy);
    }

    /**
     * Apply fish behavior (pulling and swimming)
     */
    applyFishBehavior(): void {
        const energyMultiplier = this.fishEnergy / 100;
        const basePullForce = this.fish.weight || 10;

        let stateMultiplier = 1.0;
        let swimDownStrength = 0;

        switch (this.fightState) {
            case 'hookset':
                stateMultiplier = 1.5;
                swimDownStrength = this.fishStrength * 2.0;
                break;

            case 'fighting':
                stateMultiplier = 1.0;
                swimDownStrength = this.fishStrength * 1.2 * energyMultiplier;

                if (energyMultiplier > 0.5 && Math.random() < 0.03) {
                    stateMultiplier = 1.5;
                    swimDownStrength *= 1.5;
                }
                break;

            case 'thrashing':
                this.thrashDuration--;
                stateMultiplier = 2.0 * this.thrashIntensity;
                swimDownStrength = this.fishStrength * 2.5 * this.thrashIntensity;

                this.fishEnergy -= 0.2;
                this.fishEnergy = Math.max(0, this.fishEnergy);
                break;

            case 'giving_up':
                stateMultiplier = 0.3;
                swimDownStrength = this.fishStrength * 0.4;
                break;
        }

        const fishPullForce = basePullForce * stateMultiplier * energyMultiplier;

        // Realistic drag system
        if (this.reelModel) {
            let currentDragForce = this.reelModel.getCurrentDragForce();

            if (this.isReeling) {
                currentDragForce *= 5.0;
            }

            const shockAbsorption = this.fishingLine ? this.fishingLine.getShockAbsorptionMultiplier() : 0.7;
            const stretchFactor = this.fishingLine ? this.fishingLine.getStretchFactor() : 0.7;

            if (fishPullForce > currentDragForce) {
                const excessForce = fishPullForce - currentDragForce;
                const forceRatio = excessForce / fishPullForce;
                const lineSlip = forceRatio * 0.5;

                const spoolEmpty = this.reelModel.addLineOut(lineSlip);

                if (spoolEmpty) {
                    console.log(`SPOOL EMPTY! Line capacity exhausted. Fish pull: ${fishPullForce.toFixed(1)} lbs > Drag: ${currentDragForce.toFixed(1)} lbs`);
                    this.breakLine();
                    return;
                }

                this.lineTension *= 0.80;

                if (Math.random() < 0.1) {
                    console.log(`✓ DRAG WORKING! Fish: ${fishPullForce.toFixed(1)} lbs > Drag: ${currentDragForce.toFixed(1)} lbs (${lineSlip.toFixed(2)} ft out, tension relieved)`);
                }
            } else {
                const dragRatio = currentDragForce / fishPullForce;

                if (dragRatio > 2.0) {
                    const dampeningFactor = shockAbsorption * (2.0 - stretchFactor);
                    const tensionIncrease = (fishPullForce * 0.08) * (2.0 - dampeningFactor);
                    this.lineTension += tensionIncrease;
                    this.lineTension = Math.min(GameConfig.MAX_LINE_TENSION, this.lineTension);
                } else if (dragRatio > 1.5) {
                    const dampeningFactor = shockAbsorption * (2.0 - stretchFactor);
                    const tensionIncrease = (fishPullForce * 0.04) * (2.0 - dampeningFactor);
                    this.lineTension += tensionIncrease;
                    this.lineTension = Math.min(GameConfig.MAX_LINE_TENSION, this.lineTension);
                } else {
                    this.lineTension *= 0.97;
                }
            }
        }

        this.swimDownForce = swimDownStrength;

        if (this.fightState === 'thrashing' || this.fightState === 'hookset') {
            this.swimDownTarget = this.fish.y + 80;
        } else if (this.fightState === 'giving_up') {
            this.swimDownTarget = this.fish.y;
        } else {
            this.swimDownTarget = this.fish.y + 40;
        }
    }

    /**
     * Attach fish to lure visually
     */
    attachFishToLure(): void {
        this.fish.x = this.lure.x;
        this.fish.y = this.lure.y;
        this.fish.depthInFeet = this.fish.y / GameConfig.DEPTH_SCALE;
    }

    /**
     * Update fish position during fight
     */
    updateFishPosition(): void {
        const reelProgress = 1 - (this.fishDistance / this.initialDepth);
        let targetY = this.initialDepth - (this.initialDepth * reelProgress);

        const swimDownEffect = this.swimDownForce * 0.2;
        targetY += swimDownEffect;

        const maxDepth = Math.min(this.initialDepth + 60, GameConfig.MAX_DEPTH * GameConfig.DEPTH_SCALE);
        targetY = Math.max(0, Math.min(maxDepth, targetY));

        let thrashMultiplier = 1.0;
        if (this.fightState === 'thrashing') {
            thrashMultiplier = 1.8;
        } else if (this.fightState === 'giving_up') {
            thrashMultiplier = 0.3;
        } else if (this.fightState === 'hookset') {
            thrashMultiplier = 1.3;
        }

        this.thrashAmount = Math.sin(this.fightTime * this.thrashSpeed) * 8 * thrashMultiplier;

        const energyMultiplier = this.fishEnergy / 100;
        const actualThrash = this.thrashAmount * energyMultiplier;

        const verticalThrash = Math.cos(this.fightTime * this.thrashSpeed * 1.3) * 6 * thrashMultiplier * energyMultiplier;

        this.fish.x = this.centerX + actualThrash;
        this.fish.y = targetY + verticalThrash;
        this.fish.depthInFeet = this.fish.y / GameConfig.DEPTH_SCALE;

        const mouthOffset = actualThrash > 0 ? 8 : -8;
        this.lure.x = this.fish.x + mouthOffset;
        this.lure.y = this.fish.y;
        this.lure.depth = this.lure.y / GameConfig.DEPTH_SCALE;
    }

    /**
     * Line breaks - fish escapes
     */
    breakLine(): void {
        console.log('LINE BROKE! Fish escaped.');

        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 240,
            'LINE BROKE!\nFish Escaped!',
            {
                fontSize: '26px',
                fontFamily: 'Courier New',
                color: '#ff0000',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });

        (this.scene as any).fishLost++;
        this.scene.events.emit('updateFishLost', (this.scene as any).fishLost);

        this.fish.caught = false;
        if (this.fish.ai) {
            this.fish.ai.state = 'fleeing';
        }

        const escapeDirection = this.fish.x < GameConfig.CANVAS_WIDTH / 2 ? -1 : 1;
        if (this.fish.ai) {
            this.fish.ai.targetX = escapeDirection < 0 ? -200 : GameConfig.CANVAS_WIDTH + 200;
            this.fish.ai.targetY = this.fish.y + 50;
            this.fish.ai.decisionCooldown = 5000;
        }

        this.lure.reset();
        this.endFight();
    }

    /**
     * Land fish successfully
     */
    landFish(): void {
        if (this.hasLanded) {
            return;
        }
        this.hasLanded = true;

        console.log('Fish landed!');

        const info = this.fish.getInfo();

        const fishData: CaughtFishData = {
            name: info.name || 'Unknown',
            weight: info.weight || '0.0 lbs',
            weightValue: this.fish.weight || 0,
            points: this.fish.points || 0,
            size: info.length || '0 in',
            gender: (info.gender as string) || 'unknown',
            health: this.fish.health || 100,
            hunger: this.fish.hunger || 0,
            depth: this.fish.depthInFeet || 0,
            depthZone: this.fish.depthZone?.name || 'Unknown',
            reelCount: this.reelCount,
            fightTime: this.fightTime,
            isEmergencyFish: (this.fish as any).isEmergencyFish || false
        };
        ((this.scene as any).caughtFishData as CaughtFishData[]).push(fishData);

        (this.scene as any).fishCaught++;

        this.showCatchPopup(info);
    }

    /**
     * Draw measurement ruler below fish
     */
    drawMeasurementRuler(startX: number, centerY: number, fishLengthInches: number, pixelsPerInch: number): Phaser.GameObjects.GameObject[] {
        const elements: Phaser.GameObjects.GameObject[] = [];

        const rulerGraphics = this.scene.add.graphics();
        rulerGraphics.setDepth(2002);
        elements.push(rulerGraphics);

        const rulerLengthPx = fishLengthInches * pixelsPerInch;
        const rulerHeight = 30;
        const rulerStartX = startX;
        const rulerEndX = startX + rulerLengthPx;

        // Draw ruler background
        rulerGraphics.fillStyle(0xffffff, 1.0);
        rulerGraphics.fillRect(rulerStartX, centerY - rulerHeight / 2, rulerLengthPx, rulerHeight);

        // Draw ruler border
        rulerGraphics.lineStyle(3, 0x000000, 1.0);
        rulerGraphics.strokeRect(rulerStartX, centerY - rulerHeight / 2, rulerLengthPx, rulerHeight);

        // Draw tick marks
        rulerGraphics.lineStyle(2, 0x000000, 1.0);
        for (let i = 0; i <= fishLengthInches; i++) {
            const tickX = rulerStartX + (i * pixelsPerInch);

            rulerGraphics.lineBetween(
                tickX, centerY - rulerHeight / 2,
                tickX, centerY + rulerHeight / 2
            );

            if (i > 0) {
                const label = this.scene.add.text(tickX, centerY,
                    `${i}`,
                    {
                        fontSize: '14px',
                        fontFamily: 'Courier New',
                        color: '#000000',
                        align: 'center',
                        fontStyle: 'bold'
                    }
                );
                label.setOrigin(0.5, 0.5);
                label.setDepth(2003);
                elements.push(label);
            }
        }

        // Add labels
        const lengthLabel = this.scene.add.text(rulerStartX - 5, centerY,
            'LENGTH',
            {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'right',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        lengthLabel.setOrigin(1, 0.5);
        lengthLabel.setDepth(2003);
        elements.push(lengthLabel);

        const lengthValue = this.scene.add.text(rulerEndX + 5, centerY,
            `${fishLengthInches}"`,
            {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#00ff00',
                align: 'left',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        lengthValue.setOrigin(0, 0.5);
        lengthValue.setDepth(2003);
        elements.push(lengthValue);

        return elements;
    }

    /**
     * Draw size classification ruler
     */
    drawClassificationRuler(startX: number, centerY: number, speciesName: string, fishLength: number, pixelsPerInch: number, popupWidth: number): Phaser.GameObjects.GameObject[] {
        const elements: Phaser.GameObjects.GameObject[] = [];

        const speciesData = (PREDATOR_SPECIES as any)[speciesName];

        if (!speciesData || !speciesData.sizeCategories) {
            return elements;
        }

        const rulerGraphics = this.scene.add.graphics();
        rulerGraphics.setDepth(2002);
        elements.push(rulerGraphics);

        const rulerHeight = 35;
        const categories = speciesData.sizeCategories;

        const colors: Record<string, number> = {
            small: 0x4a7c59,
            medium: 0xf4a460,
            large: 0xff6b35,
            trophy: 0xffd700
        };

        const textColors: Record<string, string> = {
            small: '#88ff88',
            medium: '#ffdd88',
            large: '#ffaa66',
            trophy: '#ffff00'
        };

        const popupCenterX = GameConfig.CANVAS_WIDTH / 2;
        const maxRulerEndX = popupCenterX + (popupWidth / 2) - 10;

        ['small', 'medium', 'large', 'trophy'].forEach(sizeName => {
            const category = categories[sizeName];
            if (!category || !category.lengthRange) return;

            const minLength = category.lengthRange[0];
            const maxLength = category.lengthRange[1];

            const zoneStartX = startX + (minLength * pixelsPerInch);
            let zoneWidth = (maxLength - minLength) * pixelsPerInch;
            const zoneEndX = zoneStartX + zoneWidth;

            if (zoneStartX >= maxRulerEndX) return;

            if (zoneEndX > maxRulerEndX) {
                zoneWidth = maxRulerEndX - zoneStartX;
            }

            const fishReachedClass = fishLength >= minLength;
            const opacity = fishReachedClass ? 0.7 : 0.2;
            const borderOpacity = fishReachedClass ? 1.0 : 0.3;

            rulerGraphics.fillStyle(colors[sizeName], opacity);
            rulerGraphics.fillRect(zoneStartX, centerY - rulerHeight / 2, zoneWidth, rulerHeight);

            rulerGraphics.lineStyle(3, colors[sizeName], borderOpacity);
            rulerGraphics.strokeRect(zoneStartX, centerY - rulerHeight / 2, zoneWidth, rulerHeight);

            const labelX = zoneStartX + zoneWidth / 2;
            if (labelX < maxRulerEndX) {
                const labelColor = fishReachedClass ? textColors[sizeName] : '#666666';
                const labelText = this.scene.add.text(labelX, centerY,
                    sizeName.toUpperCase(),
                    {
                        fontSize: '12px',
                        fontFamily: 'Courier New',
                        color: labelColor,
                        align: 'center',
                        stroke: '#000000',
                        strokeThickness: 3,
                        fontStyle: 'bold'
                    }
                );
                labelText.setOrigin(0.5, 0.5);
                labelText.setDepth(2003);
                elements.push(labelText);
            }

            if (sizeName !== 'small' && zoneStartX < maxRulerEndX) {
                const markerColor = fishReachedClass ? '#ffffff' : '#666666';
                const markerText = this.scene.add.text(zoneStartX, centerY + rulerHeight / 2 + 5,
                    `${minLength}"`,
                    {
                        fontSize: '11px',
                        fontFamily: 'Courier New',
                        color: markerColor,
                        align: 'center',
                        fontStyle: 'bold'
                    }
                );
                markerText.setOrigin(0.5, 0);
                markerText.setDepth(2003);
                elements.push(markerText);
            }
        });

        const classLabel = this.scene.add.text(startX - 5, centerY,
            'SIZE',
            {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'right',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        classLabel.setOrigin(1, 0.5);
        classLabel.setDepth(2003);
        elements.push(classLabel);

        return elements;
    }

    /**
     * Show catch popup with fish details
     */
    showCatchPopup(info: any): void {
        this.scene.physics.pause();
        (this.scene as any).catchPopupActive = true;

        const overlay = this.scene.add.rectangle(
            0, 0,
            GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT,
            0x000000, 0.8
        );
        overlay.setOrigin(0, 0);
        overlay.setDepth(2000);
        overlay.setInteractive();

        const popupWidth = 900;
        const popupHeight = 600;
        const popupX = GameConfig.CANVAS_WIDTH / 2;
        const popupY = GameConfig.CANVAS_HEIGHT / 2;

        const popupBg = this.scene.add.rectangle(
            popupX, popupY,
            popupWidth, popupHeight,
            0x1a1a1a, 1
        );
        popupBg.setStrokeStyle(4, 0x00ff00);
        popupBg.setDepth(2001);

        const title = this.scene.add.text(popupX, popupY - 260,
            'FISH CAUGHT!',
            {
                fontSize: '48px',
                fontFamily: 'Courier New',
                color: '#00ff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        title.setOrigin(0.5, 0.5);
        title.setDepth(2002);

        const fishGraphics = this.scene.add.graphics();
        fishGraphics.setDepth(2002);

        const desiredPixelsPerInch = 24;
        const fishLengthInches = this.fish.length;
        const extraInches = 4;
        const rulerLengthInches = fishLengthInches + extraInches;
        const rulerLengthPx = rulerLengthInches * desiredPixelsPerInch;

        const rulerCenterY = popupY + (1 * desiredPixelsPerInch);
        const rulerStartX = popupX - (rulerLengthPx / 2);

        const desiredFishLengthPx = fishLengthInches * desiredPixelsPerInch;
        const bodySize = desiredFishLengthPx / 2.8;

        const fishCenterX = rulerStartX + (desiredFishLengthPx / 2);
        const fishRenderY = rulerCenterY - 80;

        if (this.fish && typeof (this.fish as any).renderAtPosition === 'function') {
            (this.fish as any).renderAtPosition(fishGraphics, fishCenterX, fishRenderY, bodySize, true);
        } else {
            console.warn('Fish renderAtPosition method not available');
        }

        const rulerElements = this.drawMeasurementRuler(
            rulerStartX, rulerCenterY, rulerLengthInches, desiredPixelsPerInch
        );

        const classificationY = rulerCenterY + 40;
        const classificationElements = this.drawClassificationRuler(
            rulerStartX, classificationY, this.fish.species, this.fish.length,
            desiredPixelsPerInch, popupWidth
        );

        let ageDisplay: string;
        const fishAge = this.fish.biologicalAge || 0;
        if (fishAge < 2) {
            const ageInMonths = Math.round(fishAge * 12);
            ageDisplay = `${ageInMonths} months`;
        } else {
            ageDisplay = `${fishAge} years`;
        }

        const statsText = this.scene.add.text(popupX - 420, popupY - 250,
            `${info.name} (${info.gender})\n` +
            `Weight: ${info.weight}\n` +
            `Length: ${info.length}\n` +
            `Age: ${ageDisplay}\n` +
            `Points: +${this.fish.points}`,
            {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#ffffff',
                align: 'left',
                stroke: '#000000',
                strokeThickness: 2,
                lineSpacing: 4
            }
        );
        statsText.setOrigin(0, 0);
        statsText.setDepth(2002);

        const continueText = this.scene.add.text(popupX, popupY + 240,
            'Press X button to continue',
            {
                fontSize: '20px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'center'
            }
        );
        continueText.setOrigin(0.5, 0.5);
        continueText.setDepth(2002);

        this.scene.tweens.add({
            targets: continueText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        let lastXButtonState = false;
        let gamepadPollInterval: Phaser.Time.TimerEvent | null = null;

        const dismissPopup = () => {
            overlay.destroy();
            popupBg.destroy();
            title.destroy();
            fishGraphics.destroy();
            statsText.destroy();
            continueText.destroy();

            rulerElements.forEach(element => element.destroy());
            classificationElements.forEach(element => element.destroy());

            this.scene.input.keyboard?.off('keydown', keyboardHandler);

            if (gamepadPollInterval) {
                gamepadPollInterval.remove();
            }

            (this.scene as any).catchPopupActive = false;

            this.scene.physics.resume();
            this.lure.reset();
            this.endFight();
            this.fish.visible = false;
            this.fish.destroy();
        };

        const keyboardHandler = (event: KeyboardEvent) => {
            if (event.keyCode === 88 || event.keyCode === 32 || event.keyCode === 13) {
                dismissPopup();
            }
        };

        this.scene.input.keyboard?.on('keydown', keyboardHandler);

        if ((window as any).gamepadManager && (window as any).gamepadManager.isConnected()) {
            gamepadPollInterval = this.scene.time.addEvent({
                delay: 50,
                callback: () => {
                    const xButton = (window as any).gamepadManager.getButton('X');

                    if (xButton.pressed && !lastXButtonState) {
                        dismissPopup();
                    }

                    lastXButtonState = xButton.pressed;
                },
                loop: true
            });
        }
    }

    /**
     * End fight and clean up
     */
    endFight(): void {
        this.active = false;

        this.scene.events.emit('updateLineTension', 0);

        if (this.reelModel) {
            this.scene.events.emit('updateLineStrain', {
                testStrength: this.reelModel.lineTestStrength,
                strainPercent: 0
            });
        }

        if ((this.scene as any).currentFight === this) {
            (this.scene as any).currentFight = null;
        }
    }
}

export default FishFight;
