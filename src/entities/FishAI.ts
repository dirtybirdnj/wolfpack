import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import { calculateDietPreference } from '../config/SpeciesData.js';
import { FishSprite } from '../sprites/FishSprite.js';
import { Lure } from './Lure.js';

// ========== TYPE DEFINITIONS ==========

/**
 * Fish AI state machine states
 */
export type AIState =
    | 'idle'
    | 'interested'
    | 'chasing'
    | 'striking'
    | 'fleeing'
    | 'hunting_baitfish'
    | 'feeding';

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
    cloud: any; // BaitfishCloud or School instance
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
    getClosestBaitfish: (x: number, y: number) => { baitfish: any | null; distance: number };
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
export class FishAI {
    // Core properties
    public fish: FishSprite;
    public state: AIState;
    public targetX: number | null;
    public targetY: number | null;
    public alertness: number; // 0.5 to 1.0
    public baseAggressiveness: number; // 0.5 to 1.0
    public lastDecisionTime: number;
    public decisionCooldown: number;

    // Idle behavior
    public idleDirection: number; // 1 = right, -1 = left

    // Strike mechanics
    public strikeAttempts: number;
    public maxStrikeAttempts: number;

    // Behavior modifiers
    public depthPreference: number;
    public speedPreference: number;

    // Baitfish hunting
    public targetBaitfishCloud: BaitfishCloud | null;
    public targetBaitfish: any | null;
    public isFrenzying: boolean;

    // Thermocline behavior
    public returningToThermocline: boolean;

    // Northern Pike ambush behavior (species-specific)
    public isAmbushPredator: boolean;
    public ambushPosition: AmbushPosition;
    public ambushRadius: number;
    public strikeRange: number;
    public burstSpeed: number;

    // Smallmouth Bass circling behavior (species-specific)
    public circlesBeforeStrike: boolean;
    public isCircling: boolean;
    public circleAngle: number;
    public circleRadius: number;
    public circleSpeed: number;
    public circleDirection: number;
    public circleTime: number;
    public maxCircleTime: number;

    // Fish bump detection
    public hasBumpedLure: boolean;

    // Feeding tracking
    public consecutiveCatches?: number;

    constructor(fish: FishSprite) {
        this.fish = fish;
        this.state = Constants.FISH_STATE.IDLE;
        this.targetX = null;
        this.targetY = null;
        this.alertness = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
        this.baseAggressiveness = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
        this.lastDecisionTime = 0;
        this.decisionCooldown = 500; // milliseconds

        // Idle swimming direction
        this.idleDirection = Math.random() < 0.5 ? 1 : -1; // 1 = right, -1 = left

        // Strike attempts - frenzying fish get multiple swipes
        this.strikeAttempts = 0;
        this.maxStrikeAttempts = 1; // Default is 1 attempt

        // Behavior modifiers based on conditions
        this.depthPreference = this.calculateDepthPreference();
        this.speedPreference = Utils.randomBetween(1.5, 3.5);

        // Baitfish hunting - lake trout hunt natural prey
        this.targetBaitfishCloud = null;
        this.targetBaitfish = null;
        this.isFrenzying = false;

        // Thermocline behavior (summer modes only)
        this.returningToThermocline = false;

        // Northern Pike ambush behavior
        if (this.fish.species === 'northern_pike') {
            this.isAmbushPredator = true;
            this.ambushPosition = {
                x: this.fish.worldX,
                y: this.fish.y
            };
            this.ambushRadius = 50;
            this.strikeRange = 60;
            this.burstSpeed = 2.5;
        } else {
            this.isAmbushPredator = false;
            this.ambushPosition = { x: 0, y: 0 };
            this.ambushRadius = 0;
            this.strikeRange = 0;
            this.burstSpeed = 0;
        }

        // Smallmouth Bass circling behavior
        if (this.fish.species === 'smallmouth_bass') {
            this.circlesBeforeStrike = true;
            this.isCircling = false;
            this.circleAngle = Math.random() * Math.PI * 2;
            this.circleRadius = 35;
            this.circleSpeed = 0.08;
            this.circleDirection = Math.random() < 0.5 ? 1 : -1;
            this.circleTime = 0;
            this.maxCircleTime = 120;
        } else {
            this.circlesBeforeStrike = false;
            this.isCircling = false;
            this.circleAngle = 0;
            this.circleRadius = 0;
            this.circleSpeed = 0;
            this.circleDirection = 0;
            this.circleTime = 0;
            this.maxCircleTime = 0;
        }

        // Fish bump detection
        this.hasBumpedLure = false;
    }

    /**
     * Aggressiveness getter with depth zone bonus
     */
    get aggressiveness(): number {
        const zoneBonus = this.fish.depthZone?.aggressivenessBonus || 0;
        return Math.max(0.1, Math.min(1.0, this.baseAggressiveness + zoneBonus));
    }

    /**
     * Get strike distance (species-specific)
     */
    getStrikeDistance(): number {
        return this.isAmbushPredator ? this.strikeRange : GameConfig.STRIKE_DISTANCE;
    }

    /**
     * Calculate depth preference from species data
     */
    calculateDepthPreference(): number {
        const depthRange = this.fish.speciesData.depthRange;

        if (!depthRange) {
            console.warn(`⚠️ No depthRange for species ${this.fish.species}, using fallback 40-130ft`);
            return Utils.randomBetween(40, 130);
        }

        return Utils.randomBetween(depthRange.min, depthRange.max);
    }

    /**
     * Detect frenzy feeding behavior
     */
    detectFrenzy(lure: Lure, allFish: FishSprite[], baitfishClouds: BaitfishCloud[] = []): void {
        // Lake trout get excited when they see others chasing OR feeding on baitfish
        const excitedFish = allFish.filter(otherFish => {
            if (otherFish === this.fish) return false;

            const isExcited = otherFish.ai?.state === Constants.FISH_STATE.INTERESTED ||
                            otherFish.ai?.state === Constants.FISH_STATE.CHASING ||
                            otherFish.ai?.state === Constants.FISH_STATE.STRIKING ||
                            otherFish.ai?.state === Constants.FISH_STATE.HUNTING_BAITFISH ||
                            otherFish.ai?.state === Constants.FISH_STATE.FEEDING;

            const dist = Utils.calculateDistance(this.fish.x, this.fish.y, otherFish.x, otherFish.y);
            return isExcited && dist < GameConfig.DETECTION_RANGE * 3;
        });

        // If other fish are excited, HIGHER chance to join frenzy (75%)
        if (excitedFish.length > 0 && this.state === Constants.FISH_STATE.IDLE) {
            if (Math.random() < 0.75) {
                // Enter frenzy state!
                this.fish.inFrenzy = true;

                const baseDuration = 180;
                const scaledDuration = baseDuration * (1 + excitedFish.length * 0.15);
                this.fish.frenzyTimer = Math.floor(scaledDuration);

                this.fish.frenzyIntensity = Math.min(1.0, excitedFish.length * 0.3);

                // Find which cloud the excited fish are hunting
                let targetCloud: BaitfishCloud | null = null;
                for (const excitedOne of excitedFish) {
                    if (excitedOne.ai && excitedOne.ai.targetBaitfishCloud) {
                        targetCloud = excitedOne.ai.targetBaitfishCloud;
                        break;
                    }
                }
                this.fish.frenzyTargetCloud = targetCloud;

                // Frenzying fish get multiple strike attempts
                this.maxStrikeAttempts = Math.floor(Math.random() * 2) + 2; // 2 or 3
                this.strikeAttempts = 0;

                if (targetCloud) {
                    this.state = Constants.FISH_STATE.HUNTING_BAITFISH;
                    this.targetBaitfishCloud = targetCloud;
                    this.decisionCooldown = 100;
                    console.log(`🔥 Fish entered FRENZY, rushing to ${targetCloud.speciesType} cloud!`);
                } else {
                    this.state = Constants.FISH_STATE.INTERESTED;
                    this.decisionCooldown = 100;
                }

                this.fish.triggerInterestFlash?.(0.8);
            }
        }

        // Mid-column and bottom fish: 30% chance to streak upward when lure is above
        if (this.fish.depthZone &&
            (this.fish.depthZone.name === 'Mid-Column' || this.fish.depthZone.name === 'Bottom') &&
            this.state === Constants.FISH_STATE.IDLE) {

            const verticalDist = lure.y - this.fish.y;
            const horizontalDist = Math.abs(this.fish.x - lure.x);

            if (verticalDist < -20 &&
                horizontalDist < GameConfig.DETECTION_RANGE &&
                Math.abs(verticalDist) < GameConfig.VERTICAL_DETECTION_RANGE) {

                if (Math.random() < 0.3) {
                    // Streak upward!
                    this.state = Constants.FISH_STATE.CHASING;
                    this.targetX = lure.x;
                    this.targetY = lure.y;
                    this.decisionCooldown = 200;

                    this.fish.inFrenzy = true;
                    this.fish.frenzyTimer = 180;
                    this.fish.frenzyIntensity = 0.8;

                    this.maxStrikeAttempts = 2;
                    this.strikeAttempts = 0;

                    this.fish.triggerInterestFlash?.(0.9);
                }
            }
        }
    }

    /**
     * Main AI update loop
     */
    update(lure: Lure | null, currentTime: number, allFish: FishSprite[] = [], baitfishClouds: BaitfishCloud[] = [], crayfish: Crayfish[] = []): void {
        // Make decisions at intervals
        if (currentTime - this.lastDecisionTime < this.decisionCooldown) {
            return;
        }

        this.lastDecisionTime = currentTime;

        // Check for baitfish clouds
        const nearbyBaitfishCloud = this.findNearestBaitfishCloud(baitfishClouds);

        // Debug logging
        if (nearbyBaitfishCloud) {
            const shouldHunt = this.shouldHuntBaitfish(nearbyBaitfishCloud);
            if (Math.random() < 0.05) {
                console.log(`🐟 ${this.fish.species} at (${this.fish.x.toFixed(0)}, ${this.fish.y.toFixed(0)}) detected cloud at distance ${nearbyBaitfishCloud.distance.toFixed(0)}px, cloudY: ${nearbyBaitfishCloud.cloud.centerY.toFixed(0)}, hunger: ${this.fish.hunger?.toFixed(0)}, shouldHunt: ${shouldHunt}, state: ${this.state}`);
            }
        }

        if (this.state === Constants.FISH_STATE.HUNTING_BAITFISH && Math.random() < 0.05) {
            console.log(`🎯 ${this.fish.species} HUNTING at (${this.fish.x.toFixed(0)}, ${this.fish.y.toFixed(0)}) targeting (${this.targetX?.toFixed(0)}, ${this.targetY?.toFixed(0)})`);
        }

        // Check for crayfish
        const nearbyCrayfish = this.findNearestCrayfish(crayfish);

        // In observation mode (no lure OR lure out of water), fish only hunt baitfish or idle
        if (!lure || !lure.inWater) {
            if (nearbyBaitfishCloud && this.shouldHuntBaitfish(nearbyBaitfishCloud)) {
                this.startHuntingBaitfish(nearbyBaitfishCloud);
            } else if (nearbyCrayfish && this.shouldHuntCrayfish(nearbyCrayfish)) {
                // Temp bugfix - disabled
                // this.huntCrayfish(nearbyCrayfish);
            } else if (this.state === Constants.FISH_STATE.HUNTING_BAITFISH) {
                this.huntingBaitfishBehavior(baitfishClouds, null);
            } else if (this.state === Constants.FISH_STATE.FEEDING) {
                this.feedingBehavior(baitfishClouds, null);
            } else {
                this.state = Constants.FISH_STATE.IDLE;
            }
            return;
        }

        // Normal fishing mode - lure exists
        const distance = Utils.calculateDistance(
            this.fish.x, this.fish.y,
            lure.x, lure.y
        );

        const depthDifference = Math.abs(this.fish.depthInFeet || 0 - lure.depth);
        const lureSpeed = Math.abs(lure.velocity);

        // Detect frenzy feeding
        this.detectFrenzy(lure, allFish, baitfishClouds);

        // State machine for fish behavior
        switch (this.state) {
            case Constants.FISH_STATE.IDLE:
                if (nearbyBaitfishCloud && this.shouldHuntBaitfish(nearbyBaitfishCloud)) {
                    this.startHuntingBaitfish(nearbyBaitfishCloud);
                } else {
                    this.idleBehavior(distance, lure, lureSpeed, depthDifference);
                }
                break;

            case Constants.FISH_STATE.INTERESTED:
                if (nearbyBaitfishCloud && this.shouldHuntBaitfish(nearbyBaitfishCloud)) {
                    this.startHuntingBaitfish(nearbyBaitfishCloud);
                } else {
                    this.interestedBehavior(distance, lure, lureSpeed, baitfishClouds);
                }
                break;

            case Constants.FISH_STATE.CHASING:
                this.chasingBehavior(distance, lure, lureSpeed, baitfishClouds);
                break;

            case Constants.FISH_STATE.STRIKING:
                this.strikingBehavior(distance, lure);
                break;

            case Constants.FISH_STATE.FLEEING:
                this.fleeingBehavior(distance);
                break;

            case Constants.FISH_STATE.HUNTING_BAITFISH:
                this.huntingBaitfishBehavior(baitfishClouds, lure);
                break;

            case Constants.FISH_STATE.FEEDING:
                this.feedingBehavior(baitfishClouds, lure);
                break;
        }
    }

    /**
     * Idle behavior - fish cruises naturally
     */
    idleBehavior(distance: number, lure: Lure, lureSpeed: number, depthDifference: number): void {
        // Reset bump flag when returning to idle
        this.hasBumpedLure = false;

        const horizontalDist = Math.abs(this.fish.x - lure.x);
        const verticalDist = Math.abs(this.fish.y - lure.y);

        // Check if lure is in detection range
        if (horizontalDist > GameConfig.DETECTION_RANGE) {
            return;
        }
        if (verticalDist > GameConfig.VERTICAL_DETECTION_RANGE) {
            return;
        }

        // Speed preference matching - auto-engage if lure matches preferred speed
        const speedDiff = Math.abs(lureSpeed - (this.fish.speedPreference || 0));
        const speedTolerance = 0.5;

        if (speedDiff < speedTolerance && distance < GameConfig.DETECTION_RANGE * 0.8) {
            this.engageFish();
            return;
        }

        // Factors that influence interest
        let interestScore = 0;

        // Distance factor
        interestScore += (1 - verticalDist / GameConfig.VERTICAL_DETECTION_RANGE) * 30;

        // Speed factor
        if (speedDiff < GameConfig.SPEED_TOLERANCE) {
            interestScore += 25;
        } else {
            interestScore -= speedDiff * 5;
        }

        // Depth preference
        if (depthDifference < 20) {
            interestScore += 20;
        }

        // Lure action
        if (lure.state === Constants.LURE_STATE.RETRIEVING ||
            lure.state === Constants.LURE_STATE.DROPPING) {
            interestScore += 15;
        }

        // Apply personality modifiers
        interestScore *= this.aggressiveness;

        // Frenzy bonus
        if (this.fish.inFrenzy) {
            interestScore += 30 * (this.fish.frenzyIntensity || 0);
        }

        // Decision threshold
        const threshold = this.fish.depthZone?.interestThreshold || 50;
        if (interestScore > threshold) {
            if (distance < GameConfig.DETECTION_RANGE * 0.4) {
                this.state = Constants.FISH_STATE.CHASING;
                this.decisionCooldown = 100;
                this.fish.triggerInterestFlash?.(0.75);
            } else {
                this.state = Constants.FISH_STATE.INTERESTED;
                this.decisionCooldown = 100;
                this.fish.triggerInterestFlash?.(0.5);
            }
        }
    }

    /**
     * Engage fish - lock onto lure with swipe chances
     */
    engageFish(): void {
        this.fish.isEngaged = true;
        this.fish.swipeChances = Math.floor(Math.random() * 4) + 1; // 1-4 swipes
        this.fish.maxSwipeChances = this.fish.swipeChances;
        this.fish.engagementState = 'attacking';
        this.fish.lastStateChange = this.fish.frameAge;

        this.state = Constants.FISH_STATE.CHASING;
        this.decisionCooldown = 100;
        this.fish.triggerInterestFlash?.(1.0);

        console.log(`Fish ${this.fish.name} engaged with ${this.fish.swipeChances} swipes!`);
    }

    /**
     * Interested behavior - fish watches lure
     */
    interestedBehavior(distance: number, lure: Lure, lureSpeed: number, baitfishClouds: BaitfishCloud[]): void {
        this.targetX = lure.x - 20;
        this.targetY = lure.y;

        const chanceToChase = this.aggressiveness * 1.2;
        const continueChase = Math.random() < chanceToChase;

        if (distance < GameConfig.DETECTION_RANGE * 0.6 && continueChase) {
            this.state = Constants.FISH_STATE.CHASING;
            this.decisionCooldown = 100;
            this.fish.triggerInterestFlash?.(0.75);
        } else if (distance > GameConfig.DETECTION_RANGE * 1.2 || !continueChase) {
            this.state = Constants.FISH_STATE.IDLE;
            this.targetX = null;
            this.targetY = null;
            this.decisionCooldown = 1000;
        }
    }

    /**
     * Chasing behavior - fish actively pursues lure
     */
    chasingBehavior(distance: number, lure: Lure, lureSpeed: number, baitfishClouds: BaitfishCloud[]): void {
        const lureInBaitfishCloud = this.isLureInBaitfishCloud(lure, baitfishClouds);

        // Fish bump detection
        const strikeDistance = this.getStrikeDistance();
        const bumpZoneMin = strikeDistance * 1.5;
        const bumpZoneMax = strikeDistance * 2.0;

        if (!this.hasBumpedLure && distance >= bumpZoneMin && distance <= bumpZoneMax) {
            this.hasBumpedLure = true;
            if (this.fish.scene) {
                this.fish.scene.events.emit('fishBump', this.fish);
            }
        }

        // ENGAGED FISH BEHAVIOR
        if (this.fish.isEngaged) {
            const timeSinceStateChange = this.fish.frameAge - (this.fish.lastStateChange || 0);
            if (timeSinceStateChange > 180) {
                const states: ('attacking' | 'waiting' | 'loitering')[] = ['attacking', 'waiting', 'loitering'];
                this.fish.engagementState = states[Math.floor(Math.random() * states.length)];
                this.fish.lastStateChange = this.fish.frameAge;
                console.log(`Fish ${this.fish.name} now ${this.fish.engagementState} (${this.fish.swipeChances} swipes left)`);
            }

            if (this.fish.engagementState === 'attacking') {
                this.targetX = lure.x;
                this.targetY = lure.y;

                if (distance < this.getStrikeDistance()) {
                    if ((this.fish.scene as any).currentFight?.active) {
                        this.disengageFish();
                        return;
                    }

                    const strikeChance = this.aggressiveness * 0.85;
                    if (Math.random() < strikeChance) {
                        this.state = Constants.FISH_STATE.STRIKING;
                        this.decisionCooldown = 50;
                        this.fish.triggerInterestFlash?.(1.0);
                    }
                }
            } else if (this.fish.engagementState === 'waiting') {
                const oscillation = Math.sin(this.fish.frameAge * 0.05) * 40;
                this.targetX = lure.x + oscillation;
                this.targetY = lure.y;
            } else if (this.fish.engagementState === 'loitering') {
                this.targetX = this.fish.worldX;
                this.targetY = this.fish.y;

                if (this.fish.species === 'smallmouth_bass' && distance < strikeDistance * 1.8) {
                    if (Math.random() < 0.4 && !this.hasBumpedLure) {
                        this.hasBumpedLure = true;
                        if (this.fish.scene) {
                            this.fish.scene.events.emit('fishBump', this.fish);
                            console.log('Smallmouth bass investigating - bump!');
                        }
                    }
                }
            }

            return;
        }

        // NORMAL CHASE BEHAVIOR
        this.targetX = lure.x;
        this.targetY = lure.y;

        if (distance < this.getStrikeDistance()) {
            this.decisionCooldown = 50;

            if ((this.fish.scene as any).currentFight?.active) {
                this.state = Constants.FISH_STATE.FLEEING;
                this.decisionCooldown = 3000;
                return;
            }

            const baseStrikeChance = this.aggressiveness * 0.85;
            const strikeChance = lureInBaitfishCloud ? baseStrikeChance * 1.5 : baseStrikeChance;

            if (Math.random() < strikeChance) {
                this.state = Constants.FISH_STATE.STRIKING;
                this.decisionCooldown = 50;
                this.fish.triggerInterestFlash?.(1.0);
            }
        } else if (distance < this.getStrikeDistance() * 1.5) {
            this.decisionCooldown = 100;
        }

        // Lose interest if lure leaves baitfish cloud
        if (!lureInBaitfishCloud && (this.fish.hunger || 0) < 70) {
            const keepChasingChance = (this.fish.hunger || 0) / 100;
            if (Math.random() > keepChasingChance) {
                this.state = Constants.FISH_STATE.IDLE;
                this.targetX = null;
                this.targetY = null;
                this.decisionCooldown = 1500;
                return;
            }
        }

        // May lose interest if lure behavior becomes wrong
        if (lureSpeed > (this.speedPreference || 0) * 2 || lureSpeed < 0.1) {
            this.state = Constants.FISH_STATE.FLEEING;
            this.decisionCooldown = 2000;
        }
    }

    /**
     * Disengage fish - lose interest and swim away
     */
    disengageFish(): void {
        console.log(`Fish ${this.fish.name} disengaged - no more swipes`);
        this.fish.isEngaged = false;
        this.fish.swipeChances = 0;
        this.fish.engagementState = 'waiting';
        this.state = Constants.FISH_STATE.FLEEING;
        this.targetX = null;
        this.targetY = null;
        this.decisionCooldown = 3000;
    }

    /**
     * Start fast fleeing - ran out of swipes
     */
    startFastFlee(): void {
        console.log(`Fish ${this.fish.name} ran out of swipes! Fast fleeing...`);
        this.fish.isEngaged = false;
        this.fish.swipeChances = 0;
        this.fish.isFastFleeing = true;
        this.fish.hasCalmedDown = Math.random() < 0.5;

        if (this.fish.hasCalmedDown) {
            console.log(`Fish ${this.fish.name} will calm down before exiting`);
        }

        this.state = Constants.FISH_STATE.FLEEING;
        this.decisionCooldown = 50;
    }

    /**
     * Striking behavior - fish commits to strike
     */
    strikingBehavior(distance: number, lure: Lure): void {
        this.targetX = lure.x;
        this.targetY = lure.y;

        if (distance < 5) {
            if ((this.fish.scene as any).currentFight?.active) {
                console.log('Fish tried to hook but another fight is in progress');

                if (this.fish.isEngaged) {
                    this.disengageFish();
                } else {
                    this.state = Constants.FISH_STATE.FLEEING;
                    this.decisionCooldown = 3000;
                }
                return;
            }

            // Trigger bite attempt
            if (this.fish.scene) {
                this.fish.scene.events.emit('fishStrike', this.fish);
            }

            this.state = Constants.FISH_STATE.FLEEING;
            this.decisionCooldown = 1000;
        } else if (distance > this.getStrikeDistance() * 2) {
            // Missed the strike!

            if (this.fish.isEngaged) {
                this.fish.swipeChances = (this.fish.swipeChances || 0) - 2;
                console.log(`Engaged fish ${this.fish.name} popped off! Lost 2 swipes, ${this.fish.swipeChances} left`);

                if ((this.fish.swipeChances || 0) > 0) {
                    this.state = Constants.FISH_STATE.CHASING;
                    this.targetX = lure.x;
                    this.targetY = lure.y;
                    this.decisionCooldown = 300;
                } else {
                    this.startFastFlee();
                }
            } else {
                this.strikeAttempts++;

                if (this.fish.inFrenzy && this.strikeAttempts < this.maxStrikeAttempts) {
                    console.log(`Fish missed! Attempt ${this.strikeAttempts}/${this.maxStrikeAttempts} - trying again!`);
                    this.state = Constants.FISH_STATE.CHASING;
                    this.targetX = lure.x;
                    this.targetY = lure.y;
                    this.decisionCooldown = 300;
                } else {
                    console.log(`Fish giving up after ${this.strikeAttempts} attempts`);
                    this.state = Constants.FISH_STATE.FLEEING;
                    this.decisionCooldown = 3000;
                    this.strikeAttempts = 0;
                }
            }
        }
    }

    /**
     * Fleeing behavior - fish swims away
     */
    fleeingBehavior(distance: number): void {
        this.hasBumpedLure = false;

        // FAST FLEEING
        if (this.fish.isFastFleeing) {
            const actualGameWidth = this.fish.scene.scale.width || GameConfig.CANVAS_WIDTH;
            const playerWorldX = actualGameWidth / 2;
            const targetOffscreenX = this.fish.worldX < playerWorldX ? playerWorldX - 500 : playerWorldX + 500;
            this.targetX = targetOffscreenX;
            this.targetY = this.fish.y;

            const distanceFromPlayer = Math.abs(this.fish.worldX - playerWorldX);

            if (this.fish.hasCalmedDown && distanceFromPlayer > 300 && distanceFromPlayer < 400) {
                console.log(`Fish ${this.fish.name} calmed down and stopped fleeing`);
                this.fish.isFastFleeing = false;
                this.fish.hasCalmedDown = false;
                this.state = Constants.FISH_STATE.IDLE;
                this.targetX = null;
                this.targetY = null;
                this.decisionCooldown = 2000;
                return;
            }

            return;
        }

        // NORMAL FLEEING
        const actualGameWidth = this.fish.scene.scale.width || GameConfig.CANVAS_WIDTH;
        const playerWorldX = actualGameWidth / 2;
        this.targetX = this.fish.worldX < playerWorldX ? playerWorldX - 400 : playerWorldX + 400;
        this.targetY = this.depthPreference * GameConfig.DEPTH_SCALE;

        if (distance > GameConfig.DETECTION_RANGE * 2) {
            this.state = Constants.FISH_STATE.IDLE;
            this.targetX = null;
            this.targetY = null;
            this.decisionCooldown = 2000;
        }
    }

    /**
     * Get movement vector based on current state
     */
    getMovementVector(): { x: number; y: number } {
        // IDLE fish cruise horizontally
        if (this.state === Constants.FISH_STATE.IDLE || !this.targetX || !this.targetY) {
            // Northern Pike: ambush behavior
            if (this.isAmbushPredator) {
                const dx = this.ambushPosition.x - this.fish.worldX;
                const dy = this.ambushPosition.y - this.fish.y;

                const distanceFromAmbush = Phaser.Math.Distance.Between(
                    this.fish.worldX, this.fish.y,
                    this.ambushPosition.x, this.ambushPosition.y
                );

                if (distanceFromAmbush < 10) {
                    return {
                        x: 0,
                        y: Math.sin(this.fish.frameAge * 0.02) * 0.08
                    };
                } else if (distanceFromAmbush > this.ambushRadius) {
                    const returnSpeed = this.fish.speed * 0.3;
                    return {
                        x: (dx / distanceFromAmbush) * returnSpeed,
                        y: (dy / distanceFromAmbush) * returnSpeed * 0.6
                    };
                } else {
                    const returnSpeed = this.fish.speed * 0.1;
                    return {
                        x: (dx / distanceFromAmbush) * returnSpeed,
                        y: (dy / distanceFromAmbush) * returnSpeed * 0.5 + Math.sin(this.fish.frameAge * 0.02) * 0.08
                    };
                }
            }

            // Normal idle behavior
            const depthCycleSpeed = 0.005;
            const depthAmplitude = 0.15;
            const verticalDrift = Math.sin(this.fish.frameAge * depthCycleSpeed) * depthAmplitude;

            return {
                x: this.fish.speed * this.idleDirection,
                y: verticalDrift
            };
        }

        // Moving toward target
        const dx = this.targetX - this.fish.worldX;
        const dy = this.targetY - this.fish.y;
        const distance = Phaser.Math.Distance.Between(this.fish.worldX, this.fish.y, this.targetX, this.targetY);

        // Slow down near target
        if (distance < 5) {
            const slowFactor = distance / 5;
            return {
                x: (dx / distance) * this.fish.speed * slowFactor,
                y: (dy / distance) * this.fish.speed * slowFactor
            };
        }

        // Speed multiplier based on state
        let speedMultiplier = 1;
        let verticalSpeedMultiplier = 0.85;

        switch (this.state) {
            case Constants.FISH_STATE.CHASING:
                if (this.isAmbushPredator) {
                    speedMultiplier = 1.2;
                } else {
                    speedMultiplier = GameConfig.CHASE_SPEED_MULTIPLIER;
                }
                verticalSpeedMultiplier = 0.95;
                break;
            case Constants.FISH_STATE.STRIKING:
                if (this.isAmbushPredator) {
                    speedMultiplier = this.burstSpeed * 2.0;
                } else {
                    speedMultiplier = 2.5;
                }
                verticalSpeedMultiplier = 1.0;
                break;
            case Constants.FISH_STATE.FLEEING:
                speedMultiplier = this.fish.isFastFleeing ? 4.0 : 2.0;
                verticalSpeedMultiplier = 0.9;
                break;
            case Constants.FISH_STATE.INTERESTED:
                speedMultiplier = 0.7;
                verticalSpeedMultiplier = 0.8;
                break;
            case Constants.FISH_STATE.HUNTING_BAITFISH:
                if (this.isAmbushPredator) {
                    speedMultiplier = 1.5;
                } else {
                    speedMultiplier = GameConfig.BAITFISH_PURSUIT_SPEED;
                }
                verticalSpeedMultiplier = 1.0;
                break;
            case Constants.FISH_STATE.FEEDING:
                speedMultiplier = 1.5;
                verticalSpeedMultiplier = 1.0;
                break;
        }

        return {
            x: (dx / distance) * this.fish.speed * speedMultiplier,
            y: (dy / distance) * this.fish.speed * speedMultiplier * verticalSpeedMultiplier
        };
    }

    // ========== BAITFISH HUNTING BEHAVIORS ==========

    /**
     * Find nearest baitfish cloud
     */
    findNearestBaitfishCloud(baitfishClouds: BaitfishCloud[]): BaitfishCloudInfo | null {
        if (!baitfishClouds || baitfishClouds.length === 0) {
            return null;
        }

        let bestCloud: BaitfishCloud | null = null;
        let bestScore = -Infinity;

        for (const cloud of baitfishClouds) {
            const baitfishArray = cloud.baitfish || cloud.members || [];
            const cloudVisible = cloud.visible !== false || cloud.members;
            if (!cloudVisible || baitfishArray.length === 0) continue;

            // Calculate screen X position
            let cloudScreenX = cloud.centerX;
            if (!cloudScreenX && cloud.centerWorldX !== undefined) {
                const scene = this.fish.scene;
                const actualCanvasWidth = scene?.scale?.width || GameConfig.CANVAS_WIDTH;
                const playerWorldX = actualCanvasWidth / 2;
                const offsetFromPlayer = cloud.centerWorldX - playerWorldX;
                cloudScreenX = (actualCanvasWidth / 2) + offsetFromPlayer;
            }

            const distance = Utils.calculateDistance(
                this.fish.x, this.fish.y,
                cloudScreenX, cloud.centerY
            );

            if (Math.random() < 0.01 && distance < GameConfig.BAITFISH_DETECTION_RANGE * 1.5) {
                console.log(`✅ ${this.fish.species} found cloud at screenX=${cloudScreenX?.toFixed(0)}, worldX=${cloud.centerWorldX?.toFixed(0)}, distance=${distance.toFixed(0)}px`);
            }

            const verticalDistance = Math.abs(this.fish.y - cloud.centerY);
            const maxVerticalRange = GameConfig.BAITFISH_VERTICAL_PURSUIT_RANGE * ((this.fish.hunger || 0) * GameConfig.HUNGER_VERTICAL_SCALING);

            if (distance < GameConfig.BAITFISH_DETECTION_RANGE && verticalDistance < maxVerticalRange) {
                const hunterCount = cloud.lakersChasing?.length || 0;
                const baitfishCount = baitfishArray.length;

                const distanceScore = (GameConfig.BAITFISH_DETECTION_RANGE - distance) / GameConfig.BAITFISH_DETECTION_RANGE;
                const hunterPenalty = hunterCount * 0.3;
                const baitfishBonus = baitfishCount * 0.01;

                const score = distanceScore - hunterPenalty + baitfishBonus;

                if (score > bestScore) {
                    bestScore = score;
                    bestCloud = cloud;
                }
            }
        }

        return bestCloud ? { cloud: bestCloud, distance: bestScore } : null;
    }

    /**
     * Determine if fish should hunt baitfish
     */
    shouldHuntBaitfish(cloudInfo: BaitfishCloudInfo): boolean {
        if (!cloudInfo) return false;

        const hungerFactor = (this.fish.hunger || 0) / 100;
        const distanceFactor = 1 - (cloudInfo.distance / GameConfig.BAITFISH_DETECTION_RANGE);

        const otherFishHunting = cloudInfo.cloud.lakersChasing.length;
        const frenzyBonus = Math.min(otherFishHunting * 0.5, 1.2);

        let frenzyTargetBonus = 0;
        if (this.fish.inFrenzy && this.fish.frenzyTargetCloud === cloudInfo.cloud) {
            frenzyTargetBonus = 1.5;
            console.log(`🎯 Fish locked onto frenzy target cloud!`);
        }

        const preySpecies = cloudInfo.cloud.speciesType;
        const dietPreference = calculateDietPreference(this.fish.species, preySpecies);

        const pickyFactor = (this.fish.hunger || 0) > 70 ? 0.3 : 1.0;
        const dietBonus = dietPreference * pickyFactor * 0.4;

        const sizeBonus = (this.fish.weight || 0) > 30 ? 0.35 :
                         (this.fish.weight || 0) > 15 ? 0.20 :
                         (this.fish.weight || 0) > 5 ? 0.10 :
                         0.15;

        let huntScore = (hungerFactor * 0.8) + (distanceFactor * 0.5) + frenzyBonus + frenzyTargetBonus;
        huntScore += dietBonus;
        huntScore += sizeBonus;

        if (preySpecies === 'cisco') {
            huntScore += 0.15;
        }

        return huntScore > 0.2;
    }

    /**
     * Start hunting baitfish cloud
     */
    startHuntingBaitfish(cloudInfo: BaitfishCloudInfo): void {
        this.state = Constants.FISH_STATE.HUNTING_BAITFISH;
        this.targetBaitfishCloud = cloudInfo.cloud;
        this.isFrenzying = cloudInfo.cloud.lakersChasing.length > 0;
        this.consecutiveCatches = 0;
        this.decisionCooldown = 150;
    }

    /**
     * Hunting baitfish behavior
     */
    huntingBaitfishBehavior(baitfishClouds: BaitfishCloud[], lure: Lure | null): void {
        const baitfishArray = this.targetBaitfishCloud?.baitfish || this.targetBaitfishCloud?.members || [];
        const cloudVisible = this.targetBaitfishCloud && (
            this.targetBaitfishCloud.visible !== false || this.targetBaitfishCloud.members
        );

        const shouldAbandon = !this.targetBaitfishCloud || !cloudVisible || baitfishArray.length === 0;

        if (shouldAbandon) {
            this.state = Constants.FISH_STATE.IDLE;
            this.targetBaitfishCloud = null;
            this.targetBaitfish = null;
            this.decisionCooldown = 1000;
            return;
        }

        // Calculate mouth position
        const bodySize = Math.max(8, (this.fish.weight || 0) / 2);
        const mouthOffset = bodySize * 1.25;

        const movement = this.getMovementVector();
        const isMovingRight = movement.x >= 0;

        const angleOffset = this.fish.angle || 0;
        const mouthX = isMovingRight ?
            this.fish.worldX + Math.cos(angleOffset) * mouthOffset :
            this.fish.worldX - Math.cos(angleOffset) * mouthOffset;
        const mouthY = this.fish.y + Math.sin(angleOffset) * mouthOffset;

        const result = this.targetBaitfishCloud!.getClosestBaitfish(mouthX, mouthY);

        if (result.baitfish) {
            this.targetBaitfish = result.baitfish;
            this.targetX = result.baitfish.worldX;
            this.targetY = result.baitfish.y;

            if (result.distance < 8) {
                const preySpecies = this.targetBaitfishCloud!.speciesType;
                this.targetBaitfishCloud!.consumeBaitfish();
                this.fish.feedOnBaitfish(preySpecies);

                this.decisionCooldown = 10;
                return;
            }
        } else {
            this.state = Constants.FISH_STATE.IDLE;
            this.targetBaitfishCloud = null;
            this.targetBaitfish = null;
            this.decisionCooldown = 1000;
            return;
        }

        // Check if lure is in the baitfish cloud
        if (lure) {
            const lureInCloud = this.targetBaitfishCloud!.isPlayerLureInCloud(lure);
            if (lureInCloud) {
                const lureDistance = Utils.calculateDistance(
                    this.fish.x, this.fish.y,
                    lure.x, lure.y
                );

                if (Math.random() < 0.5 || lureDistance < result.distance) {
                    this.state = Constants.FISH_STATE.CHASING;
                    this.targetX = lure.x;
                    this.targetY = lure.y;
                    this.decisionCooldown = 100;
                }
            }
        }
    }

    /**
     * Feeding behavior - after eating
     */
    feedingBehavior(baitfishClouds: BaitfishCloud[], lure: Lure | null): void {
        if (this.targetBaitfishCloud && (this.fish.hunger || 0) > 30) {
            const baitfishArray = this.targetBaitfishCloud.baitfish || this.targetBaitfishCloud.members || [];
            const cloudVisible = this.targetBaitfishCloud.visible !== false || this.targetBaitfishCloud.members;

            if (cloudVisible && baitfishArray.length > 0) {
                this.state = Constants.FISH_STATE.HUNTING_BAITFISH;
                this.decisionCooldown = 20;
            } else {
                this.state = Constants.FISH_STATE.IDLE;
                this.targetBaitfishCloud = null;
                this.targetBaitfish = null;
                this.consecutiveCatches = 0;
            }
        } else {
            this.state = Constants.FISH_STATE.IDLE;
            this.targetBaitfishCloud = null;
            this.targetBaitfish = null;
            this.consecutiveCatches = 0;
            this.decisionCooldown = 2000;
        }
    }

    /**
     * Check if lure is in baitfish cloud
     */
    isLureInBaitfishCloud(lure: Lure, baitfishClouds: BaitfishCloud[]): boolean {
        if (!baitfishClouds || baitfishClouds.length === 0) {
            return false;
        }

        for (const cloud of baitfishClouds) {
            const cloudVisible = cloud.visible !== false || cloud.members;
            if (cloudVisible && cloud.isPlayerLureInCloud && cloud.isPlayerLureInCloud(lure)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Find nearest crayfish
     */
    findNearestCrayfish(crayfish: Crayfish[]): Crayfish | null {
        if (!crayfish || crayfish.length === 0) {
            return null;
        }

        let nearest: Crayfish | null = null;
        let nearestDistance = Infinity;

        for (const cf of crayfish) {
            if (!cf.visible || cf.consumed) {
                continue;
            }

            const distance = Utils.calculateDistance(
                this.fish.x, this.fish.y,
                cf.x, cf.y
            );

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = cf;
            }
        }

        return nearest;
    }

    /**
     * Should this fish hunt crayfish?
     */
    shouldHuntCrayfish(crayfish: Crayfish): boolean {
        if (this.fish.species !== 'lake_trout' && this.fish.species !== 'smallmouth_bass') {
            return false;
        }

        if ((this.fish.hunger || 0) < 40) {
            return false;
        }

        const depthDifference = Math.abs((this.fish.depthInFeet || 0) - crayfish.depth);
        if (depthDifference > 20) {
            return false;
        }

        const distance = Utils.calculateDistance(
            this.fish.x, this.fish.y,
            crayfish.x, crayfish.y
        );

        return distance < 150;
    }

    /**
     * Hunt crayfish
     */
    huntCrayfish(crayfish: Crayfish): void {
        this.targetX = crayfish.worldX;
        this.targetY = crayfish.y;
        this.state = Constants.FISH_STATE.HUNTING_BAITFISH;

        const bodySize = Math.max(8, (this.fish.weight || 0) / 2);
        const mouthOffset = bodySize * 1.25;

        const movement = this.getMovementVector();
        const isMovingRight = movement.x >= 0;

        const angleOffset = this.fish.angle || 0;
        const mouthX = isMovingRight ?
            this.fish.worldX + Math.cos(angleOffset) * mouthOffset :
            this.fish.worldX - Math.cos(angleOffset) * mouthOffset;
        const mouthY = this.fish.y + Math.sin(angleOffset) * mouthOffset;

        const distance = Utils.calculateDistance(
            mouthX, mouthY,
            crayfish.worldX, crayfish.y
        );

        if (distance < 8) {
            crayfish.markConsumed();
            this.fish.feedOnCrayfish();
            this.state = Constants.FISH_STATE.FEEDING;
            this.decisionCooldown = 100;
        }
    }

    /**
     * Make fish swim off screen to despawn
     */
    swimOffScreen(): void {
        const screenCenter = GameConfig.CANVAS_WIDTH / 2;
        const distToLeft = this.fish.worldX;
        const distToRight = GameConfig.CANVAS_WIDTH - this.fish.worldX;

        if (distToLeft < distToRight) {
            this.targetX = -400;
        } else {
            this.targetX = GameConfig.CANVAS_WIDTH + 400;
        }

        this.targetY = this.fish.y;
        this.state = Constants.FISH_STATE.IDLE;
    }
}

export default FishAI;
