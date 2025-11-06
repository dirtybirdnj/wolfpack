import { FishSprite } from '../sprites/FishSprite.js';
import { Lure } from './Lure.js';
/**
 * Fish AI state machine states
 */
export type AIState = 'idle' | 'interested' | 'chasing' | 'striking' | 'fleeing' | 'hunting_baitfish' | 'feeding';
/**
 * Ambush position for Northern Pike behavior
 */
export interface AmbushPosition {
    x: number;
    y: number;
}
/**
 * Baitfish cloud detection result
 */
export interface BaitfishCloudInfo {
    cloud: any;
    distance: number;
}
/**
 * Baitfish cloud with tracking data (for adapted schools)
 */
export interface BaitfishCloud {
    centerX?: number;
    centerY: number;
    centerWorldX?: number;
    baitfish?: any[];
    members?: any[];
    visible?: boolean;
    lakersChasing: any[];
    speciesType: string;
    getClosestBaitfish: (x: number, y: number) => {
        baitfish: any | null;
        distance: number;
    };
    isPlayerLureInCloud: (lure: Lure) => boolean;
    consumeBaitfish: () => void;
}
/**
 * Crayfish entity
 */
export interface Crayfish {
    x: number;
    y: number;
    worldX: number;
    depth: number;
    visible: boolean;
    consumed: boolean;
    markConsumed: () => void;
}
/**
 * FishAI class - Controls fish behavior and decision making
 */
export declare class FishAI {
    fish: FishSprite;
    state: AIState;
    targetX: number | null;
    targetY: number | null;
    alertness: number;
    baseAggressiveness: number;
    lastDecisionTime: number;
    decisionCooldown: number;
    idleDirection: number;
    strikeAttempts: number;
    maxStrikeAttempts: number;
    depthPreference: number;
    speedPreference: number;
    targetBaitfishCloud: BaitfishCloud | null;
    targetBaitfish: any | null;
    isFrenzying: boolean;
    lastBaitfishSightingTime: number | null;
    baitfishTimeout: number;
    leavingArea: boolean;
    huntingStartTime: number | null;
    minHuntingCommitment: number;
    lastAbandonedCloud: BaitfishCloud | null;
    abandonCooldown: number;
    abandonedCloudTime?: number;
    returningToThermocline: boolean;
    isAmbushPredator: boolean;
    ambushPosition: AmbushPosition;
    ambushRadius: number;
    strikeRange: number;
    burstSpeed: number;
    circlesBeforeStrike: boolean;
    isCircling: boolean;
    circleAngle: number;
    circleRadius: number;
    circleSpeed: number;
    circleDirection: number;
    circleTime: number;
    maxCircleTime: number;
    hasBumpedLure: boolean;
    consecutiveCatches?: number;
    constructor(fish: FishSprite);
    /**
     * Aggressiveness getter with depth zone bonus
     */
    get aggressiveness(): number;
    /**
     * Get strike distance (species-specific)
     */
    getStrikeDistance(): number;
    /**
     * Calculate depth preference from species data
     */
    calculateDepthPreference(): number;
    /**
     * Detect frenzy feeding behavior
     */
    detectFrenzy(lure: Lure, allFish: FishSprite[], baitfishClouds?: BaitfishCloud[]): void;
    /**
     * Main AI update loop
     */
    update(lure: Lure | null, currentTime: number, allFish?: FishSprite[], baitfishClouds?: BaitfishCloud[], crayfish?: Crayfish[]): void;
    /**
     * Idle behavior - fish cruises naturally
     */
    idleBehavior(distance: number, lure: Lure, lureSpeed: number, depthDifference: number): void;
    /**
     * Engage fish - lock onto lure with swipe chances
     */
    engageFish(): void;
    /**
     * Interested behavior - fish watches lure
     */
    interestedBehavior(distance: number, lure: Lure, lureSpeed: number, baitfishClouds: BaitfishCloud[]): void;
    /**
     * Chasing behavior - fish actively pursues lure
     */
    chasingBehavior(distance: number, lure: Lure, lureSpeed: number, baitfishClouds: BaitfishCloud[]): void;
    /**
     * Disengage fish - lose interest and swim away
     */
    disengageFish(): void;
    /**
     * Start fast fleeing - ran out of swipes
     */
    startFastFlee(): void;
    /**
     * Striking behavior - fish commits to strike
     */
    strikingBehavior(distance: number, lure: Lure): void;
    /**
     * Fleeing behavior - fish swims away
     */
    fleeingBehavior(distance: number): void;
    /**
     * Get movement vector based on current state
     */
    getMovementVector(): {
        x: number;
        y: number;
    };
    /**
     * Find nearest baitfish cloud
     */
    findNearestBaitfishCloud(baitfishClouds: BaitfishCloud[]): BaitfishCloudInfo | null;
    /**
     * Determine if fish should hunt baitfish
     */
    shouldHuntBaitfish(cloudInfo: BaitfishCloudInfo): boolean;
    /**
     * Start hunting baitfish cloud
     */
    startHuntingBaitfish(cloudInfo: BaitfishCloudInfo): void;
    /**
     * Hunting baitfish behavior
     */
    huntingBaitfishBehavior(baitfishClouds: BaitfishCloud[], lure: Lure | null): void;
    /**
     * Feeding behavior - after eating
     */
    feedingBehavior(baitfishClouds: BaitfishCloud[], lure: Lure | null): void;
    /**
     * Check if lure is in baitfish cloud
     */
    isLureInBaitfishCloud(lure: Lure, baitfishClouds: BaitfishCloud[]): boolean;
    /**
     * Find nearest crayfish
     */
    findNearestCrayfish(crayfish: Crayfish[]): Crayfish | null;
    /**
     * Should this fish hunt crayfish?
     */
    shouldHuntCrayfish(crayfish: Crayfish): boolean;
    /**
     * Hunt crayfish
     */
    huntCrayfish(crayfish: Crayfish): void;
    /**
     * Make fish swim off screen to despawn
     */
    swimOffScreen(): void;
}
export default FishAI;
//# sourceMappingURL=FishAI.d.ts.map