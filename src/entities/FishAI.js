import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import { calculateDietPreference } from '../config/SpeciesData.js';

export class FishAI {
    constructor(fish) {
        this.fish = fish;
        this.state = Constants.FISH_STATE.IDLE;
        this.targetX = null;
        this.targetY = null;
        this.alertness = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
        this.baseAggressiveness = Math.random() * 0.5 + 0.5; // 0.5 to 1.0 (increased from 0.3-1.0)
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

        // Baitfish detection timer - if no baitfish seen for 10 seconds, leave area
        this.lastBaitfishSightingTime = null; // Will be set when fish spawns
        this.baitfishTimeout = 10000; // 10 seconds in milliseconds
        this.leavingArea = false; // Flag to indicate fish is swimming off-screen

        // Thermocline behavior (summer modes only)
        this.returningToThermocline = false;

        // Northern Pike ambush behavior
        if (this.fish.species === 'northern_pike') {
            this.isAmbushPredator = true;
            this.ambushPosition = {
                x: this.fish.worldX,
                y: this.fish.y
            };
            this.ambushRadius = 50; // How far pike will patrol from ambush position
            this.strikeRange = 60; // Longer strike range than trout (was 25)
            this.burstSpeed = 2.5; // Explosive burst speed multiplier
        } else {
            this.isAmbushPredator = false;
        }

        // Smallmouth Bass circling behavior
        if (this.fish.species === 'smallmouth_bass') {
            this.circlesBeforeStrike = true;
            this.isCircling = false;
            this.circleAngle = Math.random() * Math.PI * 2; // Starting angle for circle
            this.circleRadius = 35; // Circle radius around lure
            this.circleSpeed = 0.08; // How fast to circle (radians per frame)
            this.circleDirection = Math.random() < 0.5 ? 1 : -1; // Clockwise or counter-clockwise
            this.circleTime = 0; // How long bass has been circling
            this.maxCircleTime = 120; // Max frames to circle before deciding (2 seconds at 60fps)
        } else {
            this.circlesBeforeStrike = false;
        }

        // Fish bump detection - tracks if bump has occurred during this chase
        this.hasBumpedLure = false;
    }

    get aggressiveness() {
        // Apply depth zone bonus to base aggressiveness
        const zoneBonus = this.fish.depthZone.aggressivenessBonus;
        return Math.max(0.1, Math.min(1.0, this.baseAggressiveness + zoneBonus));
    }

    getStrikeDistance() {
        // Northern pike have longer strike range due to their elongated body and explosive bursts
        return this.isAmbushPredator ? this.strikeRange : GameConfig.STRIKE_DISTANCE;
    }
    
    calculateDepthPreference() {
        // Ice fishing: Lake trout prefer deeper, cooler water
        const minDepth = GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MIN;
        const maxDepth = GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MAX;
        return Utils.randomBetween(minDepth, maxDepth);
    }

    detectFrenzy(lure, allFish, baitfishClouds = []) {
        // Lake trout get excited when they see others chasing OR feeding on baitfish
        // Count other fish that are actively engaged (lure or baitfish)
        const excitedFish = allFish.filter(otherFish => {
            if (otherFish === this.fish) {return false;} // Don't count self

            // Include HUNTING_BAITFISH and FEEDING states - makes frenzy much more likely!
            const isExcited = otherFish.ai.state === Constants.FISH_STATE.INTERESTED ||
                            otherFish.ai.state === Constants.FISH_STATE.CHASING ||
                            otherFish.ai.state === Constants.FISH_STATE.STRIKING ||
                            otherFish.ai.state === Constants.FISH_STATE.HUNTING_BAITFISH ||
                            otherFish.ai.state === Constants.FISH_STATE.FEEDING;

            // INCREASED visual range - fish can see feeding activity from farther away
            const dist = Utils.calculateDistance(this.fish.x, this.fish.y, otherFish.x, otherFish.y);
            return isExcited && dist < GameConfig.DETECTION_RANGE * 3; // Increased from 2x to 3x
        });

        // If other fish are excited, HIGHER chance to join frenzy (75% instead of 50%)
        if (excitedFish.length > 0 && this.state === Constants.FISH_STATE.IDLE) {
            if (Math.random() < 0.75) { // Increased from 0.5
                // Enter frenzy state!
                this.fish.inFrenzy = true;

                // Duration scales with number of frenzied fish (base 180 frames = 3 sec)
                // REDUCED: Frenzy should be short bursts, not long sustained states
                const baseDuration = 180; // Reduced from 300 (5 sec -> 3 sec)
                const scaledDuration = baseDuration * (1 + excitedFish.length * 0.15); // Reduced from 0.4
                // 1 fish: 207 frames = 3.5 sec
                // 2 fish: 234 frames = 3.9 sec
                // 3 fish: 261 frames = 4.4 sec (much shorter!)
                this.fish.frenzyTimer = Math.floor(scaledDuration);

                // Intensity based on number of excited fish (stronger now)
                this.fish.frenzyIntensity = Math.min(1.0, excitedFish.length * 0.3); // Increased from 0.25

                // FIND WHICH BAIT CLOUD THE EXCITED FISH ARE HUNTING
                // This makes frenzy focused on a specific cloud
                let targetCloud = null;
                for (const excitedOne of excitedFish) {
                    if (excitedOne.ai && excitedOne.ai.targetBaitfishCloud) {
                        targetCloud = excitedOne.ai.targetBaitfishCloud;
                        break; // Found one hunting a cloud
                    }
                }
                this.fish.frenzyTargetCloud = targetCloud;

                // Frenzying fish get multiple strike attempts (2-3 swipes)
                this.maxStrikeAttempts = Math.floor(Math.random() * 2) + 2; // 2 or 3 attempts
                this.strikeAttempts = 0;

                // If there's a target cloud, rush to hunt it! Otherwise, become interested in lure
                if (targetCloud) {
                    this.state = Constants.FISH_STATE.HUNTING_BAITFISH;
                    this.targetBaitfishCloud = targetCloud; // Set as active target
                    this.decisionCooldown = 100; // Quick response during frenzy
                    console.log(`🔥 Fish entered FRENZY, rushing to ${targetCloud.speciesType} cloud!`);
                } else {
                    // No cloud to hunt, become interested in the lure instead
                    this.state = Constants.FISH_STATE.INTERESTED;
                    this.decisionCooldown = 100; // Quick response during frenzy
                }

                // Trigger visual feedback - fish entered frenzy!
                this.fish.triggerInterestFlash(0.8); // High intensity for frenzy
            }
        }

        // Mid-column and bottom fish: 30% chance to streak upward when lure is above
        if ((this.fish.depthZone.name === 'Mid-Column' || this.fish.depthZone.name === 'Bottom') &&
            this.state === Constants.FISH_STATE.IDLE) {

            const verticalDist = lure.y - this.fish.y; // Negative = lure is above
            const horizontalDist = Math.abs(this.fish.x - lure.x);

            // If lure is above and within horizontal range
            if (verticalDist < -20 && // At least 5 feet above (20px = 5ft)
                horizontalDist < GameConfig.DETECTION_RANGE &&
                Math.abs(verticalDist) < GameConfig.VERTICAL_DETECTION_RANGE) {

                if (Math.random() < 0.3) {
                    // Streak upward!
                    this.state = Constants.FISH_STATE.CHASING;
                    this.targetX = lure.x;
                    this.targetY = lure.y;
                    this.decisionCooldown = 200;

                    // Enter frenzy due to vertical strike instinct
                    this.fish.inFrenzy = true;
                    this.fish.frenzyTimer = 180; // REDUCED: Short burst (was 400 = 6.7 sec, now 3 sec)
                    this.fish.frenzyIntensity = 0.8; // High intensity

                    // Vertical strikers also get multiple attempts
                    this.maxStrikeAttempts = 2;
                    this.strikeAttempts = 0;

                    // Trigger visual feedback - vertical strike incoming!
                    this.fish.triggerInterestFlash(0.9); // Very high intensity for vertical strikes
                }
            }
        }
    }

    update(lure, currentTime, allFish = [], baitfishClouds = [], crayfish = []) {
        // Make decisions at intervals, not every frame
        if (currentTime - this.lastDecisionTime < this.decisionCooldown) {
            return;
        }

        this.lastDecisionTime = currentTime;

        // PRIORITY: Check for baitfish clouds (natural food source)
        // Fish prioritize real food over lures, especially when hungry
        const nearbyBaitfishCloud = this.findNearestBaitfishCloud(baitfishClouds);

        // Note: Removed timeout logic - fish stay in bounds and continue hunting

        // Check for crayfish (opportunistic bottom feeding for lake trout)
        const nearbyCrayfish = this.findNearestCrayfish(crayfish);

        // In observation mode (no lure OR lure out of water), fish only hunt baitfish or idle
        // This allows player to "pause" fishing and observe natural behavior by reeling lure above surface
        if (!lure || !lure.inWater) {
            // Nature simulation mode - no lure to track
            if (nearbyBaitfishCloud && this.shouldHuntBaitfish(nearbyBaitfishCloud)) {
                this.startHuntingBaitfish(nearbyBaitfishCloud);
            } else if (nearbyCrayfish && this.shouldHuntCrayfish(nearbyCrayfish)) {
                this.huntCrayfish(nearbyCrayfish);
            } else if (this.state === Constants.FISH_STATE.HUNTING_BAITFISH) {
                this.huntingBaitfishBehavior(baitfishClouds, null);
            } else if (this.state === Constants.FISH_STATE.FEEDING) {
                this.feedingBehavior(baitfishClouds, null);
            } else {
                // Just idle swim naturally
                this.state = Constants.FISH_STATE.IDLE;
            }
            return;
        }

        // Normal fishing mode - lure exists
        // Calculate distance and relationship to lure
        const distance = Utils.calculateDistance(
            this.fish.x, this.fish.y,
            lure.x, lure.y
        );

        const depthDifference = Math.abs(this.fish.depth - lure.depth);
        const lureSpeed = Math.abs(lure.velocity);

        // Detect frenzy feeding - other fish chasing excites this one
        this.detectFrenzy(lure, allFish, baitfishClouds);

        // State machine for fish behavior
        switch (this.state) {
            case Constants.FISH_STATE.IDLE:
                // Check for baitfish first, then lure
                if (nearbyBaitfishCloud && this.shouldHuntBaitfish(nearbyBaitfishCloud)) {
                    this.startHuntingBaitfish(nearbyBaitfishCloud);
                } else {
                    this.idleBehavior(distance, lure, lureSpeed, depthDifference);
                }
                break;

            case Constants.FISH_STATE.INTERESTED:
                // Check if baitfish cloud is more attractive than lure
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
    
    idleBehavior(distance, lure, lureSpeed, depthDifference) {
        // Reset bump flag when returning to idle
        this.hasBumpedLure = false;

        // Lake trout can see 40-70 feet above and below
        const horizontalDist = Math.abs(this.fish.x - lure.x);
        const verticalDist = Math.abs(this.fish.y - lure.y);

        // Check if lure is in detection range (wide vertical range)
        if (horizontalDist > GameConfig.DETECTION_RANGE) {
            return;
        }
        if (verticalDist > GameConfig.VERTICAL_DETECTION_RANGE) {
            return;
        }

        // SPEED PREFERENCE MATCHING - Auto-engage if lure matches preferred speed
        const speedDiff = Math.abs(lureSpeed - this.fish.speedPreference);
        const speedTolerance = 0.5; // How close the speed needs to match

        if (speedDiff < speedTolerance && distance < GameConfig.DETECTION_RANGE * 0.8) {
            // Lure is moving at preferred speed! Engage automatically
            this.engageFish();
            return;
        }

        // Factors that influence interest
        let interestScore = 0;

        // Distance factor (closer is more interesting) - use vertical distance
        interestScore += (1 - verticalDist / GameConfig.VERTICAL_DETECTION_RANGE) * 30;

        // Speed factor (optimal speed is most attractive)
        if (speedDiff < GameConfig.SPEED_TOLERANCE) {
            interestScore += 25;
        } else {
            interestScore -= speedDiff * 5;
        }

        // Depth preference (fish prefer certain depths)
        if (depthDifference < 20) {
            interestScore += 20;
        }

        // Lure action (moving lures are more attractive than static)
        if (lure.state === Constants.LURE_STATE.RETRIEVING ||
            lure.state === Constants.LURE_STATE.DROPPING) {
            interestScore += 15;
        }

        // Apply personality modifiers
        interestScore *= this.aggressiveness;

        // Frenzy bonus - fish in frenzy are much more aggressive
        if (this.fish.inFrenzy) {
            interestScore += 30 * this.fish.frenzyIntensity;
        }

        // Decision threshold (varies by depth zone)
        const threshold = this.fish.depthZone.interestThreshold;
        if (interestScore > threshold) {
            // If already very close, skip INTERESTED and go straight to CHASING
            if (distance < GameConfig.DETECTION_RANGE * 0.4) {
                this.state = Constants.FISH_STATE.CHASING;
                this.decisionCooldown = 100;
                this.fish.triggerInterestFlash(0.75); // High intensity - immediate chase!
            } else {
                this.state = Constants.FISH_STATE.INTERESTED;
                this.decisionCooldown = 100; // Reduced from 300 for faster reaction
                this.fish.triggerInterestFlash(0.5); // Medium intensity for initial interest
            }
        }
    }

    engageFish() {
        // Fish is now engaged - lock onto lure with swipe chances
        this.fish.isEngaged = true;
        this.fish.swipeChances = Math.floor(Math.random() * 4) + 1; // 1-4 swipes
        this.fish.maxSwipeChances = this.fish.swipeChances;
        this.fish.engagementState = 'attacking';
        this.fish.lastStateChange = this.fish.age;

        this.state = Constants.FISH_STATE.CHASING;
        this.decisionCooldown = 100;
        this.fish.triggerInterestFlash(1.0); // Maximum intensity for engagement

        console.log(`Fish ${this.fish.name} engaged with ${this.fish.swipeChances} swipes!`);
    }
    
    interestedBehavior(distance, lure, lureSpeed, baitfishClouds) {
        // Fish is watching the lure, may approach slowly
        this.targetX = lure.x - 20; // Stay slightly behind
        this.targetY = lure.y;

        // Decide whether to chase or lose interest - more likely to commit now
        const chanceToChase = this.aggressiveness * 1.2; // Boosted from 1.0
        const continueChase = Math.random() < chanceToChase;

        if (distance < GameConfig.DETECTION_RANGE * 0.6 && continueChase) {
            // Close enough and aggressive enough to chase (increased from 0.5 to 0.6)
            this.state = Constants.FISH_STATE.CHASING;
            this.decisionCooldown = 100; // Reduced from 200 for faster commitment

            // Trigger visual feedback - fish is committing to the chase!
            this.fish.triggerInterestFlash(0.75); // High intensity for chasing
        } else if (distance > GameConfig.DETECTION_RANGE * 1.2 || !continueChase) {
            // Lost interest (increased threshold from 1.0 to 1.2 for more persistence)
            this.state = Constants.FISH_STATE.IDLE;
            this.targetX = null;
            this.targetY = null;
            this.decisionCooldown = 1000;
        }
    }
    
    chasingBehavior(distance, lure, lureSpeed, baitfishClouds) {
        // Check if lure is in a baitfish cloud - fish can't tell the difference!
        const lureInBaitfishCloud = this.isLureInBaitfishCloud(lure, baitfishClouds);

        // FISH BUMP DETECTION - Fish bumps the lure when getting close
        // Bump zone is 1.5x to 2x the strike distance
        const strikeDistance = this.getStrikeDistance();
        const bumpZoneMin = strikeDistance * 1.5;
        const bumpZoneMax = strikeDistance * 2.0;

        if (!this.hasBumpedLure && distance >= bumpZoneMin && distance <= bumpZoneMax) {
            // Fish has entered the bump zone - emit bump event
            this.hasBumpedLure = true;
            if (this.fish.scene) {
                this.fish.scene.events.emit('fishBump', this.fish);
            }
        }

        // ENGAGED FISH BEHAVIOR - Special mechanics for fish locked onto lure
        if (this.fish.isEngaged) {
            // Change state every 3 seconds (180 frames at 60fps)
            const timeSinceStateChange = this.fish.age - this.fish.lastStateChange;
            if (timeSinceStateChange > 180) {
                // Randomly pick next state
                const states = ['attacking', 'waiting', 'loitering'];
                this.fish.engagementState = states[Math.floor(Math.random() * states.length)];
                this.fish.lastStateChange = this.fish.age;
                console.log(`Fish ${this.fish.name} now ${this.fish.engagementState} (${this.fish.swipeChances} swipes left)`);
            }

            // Behavior based on engagement state
            if (this.fish.engagementState === 'attacking') {
                // Aggressively chase lure
                this.targetX = lure.x;
                this.targetY = lure.y;

                // Try to strike if close enough
                if (distance < this.getStrikeDistance()) {
                    if (this.fish.scene && this.fish.scene.currentFight && this.fish.scene.currentFight.active) {
                        this.disengageFish();
                        return;
                    }

                    const strikeChance = this.aggressiveness * 0.85;
                    if (Math.random() < strikeChance) {
                        this.state = Constants.FISH_STATE.STRIKING;
                        this.decisionCooldown = 50;
                        this.fish.triggerInterestFlash(1.0);
                    }
                }
            } else if (this.fish.engagementState === 'waiting') {
                // Move back and forth past the lure slowly
                const oscillation = Math.sin(this.fish.age * 0.05) * 40;
                this.targetX = lure.x + oscillation;
                this.targetY = lure.y;
            } else if (this.fish.engagementState === 'loitering') {
                // Stop and just look at the lure
                this.targetX = this.fish.worldX; // Stay in place
                this.targetY = this.fish.y;

                // Smallmouth bass: Higher chance to bump while loitering/investigating
                if (this.fish.species === 'smallmouth_bass' && distance < strikeDistance * 1.8) {
                    // 40% chance per loiter cycle to bump the lure
                    if (Math.random() < 0.4 && !this.hasBumpedLure) {
                        this.hasBumpedLure = true;
                        if (this.fish.scene) {
                            this.fish.scene.events.emit('fishBump', this.fish);
                            console.log('Smallmouth bass investigating - bump!');
                        }
                    }
                }
            }

            return; // Engaged fish don't run normal chase logic
        }

        // NORMAL CHASE BEHAVIOR (non-engaged fish)
        this.targetX = lure.x;
        this.targetY = lure.y;

        // Check if close enough to strike
        if (distance < this.getStrikeDistance()) {
            this.decisionCooldown = 50;

            if (this.fish.scene && this.fish.scene.currentFight && this.fish.scene.currentFight.active) {
                this.state = Constants.FISH_STATE.FLEEING;
                this.decisionCooldown = 3000;
                return;
            }

            const baseStrikeChance = this.aggressiveness * 0.85;
            const strikeChance = lureInBaitfishCloud ? baseStrikeChance * 1.5 : baseStrikeChance;

            if (Math.random() < strikeChance) {
                this.state = Constants.FISH_STATE.STRIKING;
                this.decisionCooldown = 50;
                this.fish.triggerInterestFlash(1.0);
            }
        } else if (distance < this.getStrikeDistance() * 1.5) {
            this.decisionCooldown = 100;
        }

        // If lure leaves baitfish cloud, less hungry fish may lose interest
        if (!lureInBaitfishCloud && this.fish.hunger < 70) {
            const keepChasingChance = this.fish.hunger / 100;
            if (Math.random() > keepChasingChance) {
                this.state = Constants.FISH_STATE.IDLE;
                this.targetX = null;
                this.targetY = null;
                this.decisionCooldown = 1500;
                return;
            }
        }

        // May lose interest if lure behavior becomes wrong
        if (lureSpeed > this.speedPreference * 2 || lureSpeed < 0.1) {
            this.state = Constants.FISH_STATE.FLEEING;
            this.decisionCooldown = 2000;
        }
    }

    disengageFish() {
        // Fish loses interest and swims away
        console.log(`Fish ${this.fish.name} disengaged - no more swipes`);
        this.fish.isEngaged = false;
        this.fish.swipeChances = 0;
        this.fish.engagementState = 'waiting';
        this.state = Constants.FISH_STATE.FLEEING;
        this.targetX = null;
        this.targetY = null;
        this.decisionCooldown = 3000;
    }

    startFastFlee() {
        // Fish ran out of swipes - flee at high speed
        console.log(`Fish ${this.fish.name} ran out of swipes! Fast fleeing...`);
        this.fish.isEngaged = false;
        this.fish.swipeChances = 0;
        this.fish.isFastFleeing = true;

        // 50% chance to calm down before exiting
        this.fish.hasCalmedDown = Math.random() < 0.5;

        if (this.fish.hasCalmedDown) {
            console.log(`Fish ${this.fish.name} will calm down before exiting`);
        }

        this.state = Constants.FISH_STATE.FLEEING;
        this.decisionCooldown = 50; // Very short cooldown for fast response
    }
    
    strikingBehavior(distance, lure) {
        // Fish has committed to striking
        this.targetX = lure.x;
        this.targetY = lure.y;

        if (distance < 5) {
            // Check if there's already a fight in progress
            if (this.fish.scene && this.fish.scene.currentFight && this.fish.scene.currentFight.active) {
                // Another fish is already hooked - this fish missed
                console.log('Fish tried to hook but another fight is in progress');

                if (this.fish.isEngaged) {
                    this.disengageFish();
                } else {
                    this.state = Constants.FISH_STATE.FLEEING;
                    this.decisionCooldown = 3000;
                }
                return;
            }

            // Fish strikes at lure - trigger bite attempt (player must hookset to catch)
            if (this.fish.scene) {
                this.fish.scene.events.emit('fishStrike', this.fish);
            }

            // Fish will flee after striking (waiting for hookset)
            this.state = Constants.FISH_STATE.FLEEING;
            this.decisionCooldown = 1000; // Longer cooldown while waiting for hookset
        } else if (distance > this.getStrikeDistance() * 2) {
            // Missed the strike!

            // Handle engaged fish differently
            if (this.fish.isEngaged) {
                this.fish.swipeChances -= 2; // Lose 2 swipes on miss
                console.log(`Engaged fish ${this.fish.name} popped off! Lost 2 swipes, ${this.fish.swipeChances} left`);

                if (this.fish.swipeChances > 0) {
                    // Still has swipes - return to chasing
                    this.state = Constants.FISH_STATE.CHASING;
                    this.targetX = lure.x;
                    this.targetY = lure.y;
                    this.decisionCooldown = 300;
                } else {
                    // Out of swipes - fast flee!
                    this.startFastFlee();
                }
            } else {
                // Non-engaged fish - use old frenzy system
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
    
    fleeingBehavior(distance) {
        // Reset bump flag when fleeing
        this.hasBumpedLure = false;

        // FAST FLEEING - Fish ran out of swipes
        if (this.fish.isFastFleeing) {
            // Pick direction based on current world position - swim away from player
            const actualGameWidth = this.fish.scene.scale.width || GameConfig.CANVAS_WIDTH;
            const playerWorldX = actualGameWidth / 2;
            const targetOffscreenX = this.fish.worldX < playerWorldX ? playerWorldX - 500 : playerWorldX + 500;
            this.targetX = targetOffscreenX;
            this.targetY = this.fish.y; // Maintain current depth

            // Check if fish has reached far enough and should calm down
            const distanceFromPlayer = Math.abs(this.fish.worldX - playerWorldX);

            if (this.fish.hasCalmedDown && distanceFromPlayer > 300 && distanceFromPlayer < 400) {
                // Fish calms down before exiting
                console.log(`Fish ${this.fish.name} calmed down and stopped fleeing`);
                this.fish.isFastFleeing = false;
                this.fish.hasCalmedDown = false;
                this.state = Constants.FISH_STATE.IDLE;
                this.targetX = null;
                this.targetY = null;
                this.decisionCooldown = 2000;
                return;
            }

            // Fish will be removed by the fish model when it swims too far (800+ units from player)
            // No need to check edges here - let the fish model handle removal
            return;
        }

        // NORMAL FLEEING - Fish is spooked and swimming away
        // Use world position instead of screen position to determine flee direction
        const actualGameWidth = this.fish.scene.scale.width || GameConfig.CANVAS_WIDTH;
        const playerWorldX = actualGameWidth / 2;
        this.targetX = this.fish.worldX < playerWorldX ? playerWorldX - 400 : playerWorldX + 400;
        this.targetY = this.depthPreference * GameConfig.DEPTH_SCALE;

        // After fleeing for a while, return to idle
        if (distance > GameConfig.DETECTION_RANGE * 2) {
            this.state = Constants.FISH_STATE.IDLE;
            this.targetX = null;
            this.targetY = null;
            this.decisionCooldown = 2000;
        }
    }
    
    getMovementVector() {
        // IDLE fish cruise horizontally without a specific target
        if (this.state === Constants.FISH_STATE.IDLE || !this.targetX || !this.targetY) {
            // Northern Pike: ambush behavior - stay near ambush position
            if (this.isAmbushPredator) {
                // Calculate direction to ambush position
                const dx = this.ambushPosition.x - this.fish.worldX;
                const dy = this.ambushPosition.y - this.fish.y;

                // Use Phaser's optimized distance calculation
                const distanceFromAmbush = Phaser.Math.Distance.Between(
                    this.fish.worldX, this.fish.y,
                    this.ambushPosition.x, this.ambushPosition.y
                );

                // Dead zone: if very close to ambush position, stop completely
                if (distanceFromAmbush < 10) {
                    return {
                        x: 0, // Completely still horizontally
                        y: Math.sin(this.fish.frameAge * 0.02) * 0.08 // Very subtle hovering
                    };
                }
                // If outside ambush radius, slowly drift back
                else if (distanceFromAmbush > this.ambushRadius) {
                    const returnSpeed = this.fish.speed * 0.3; // Very slow return
                    return {
                        x: (dx / distanceFromAmbush) * returnSpeed,
                        y: (dy / distanceFromAmbush) * returnSpeed * 0.6
                    };
                }
                // Within ambush radius but not in dead zone - very slow drift toward center
                else {
                    const returnSpeed = this.fish.speed * 0.1; // Minimal drift
                    return {
                        x: (dx / distanceFromAmbush) * returnSpeed,
                        y: (dy / distanceFromAmbush) * returnSpeed * 0.5 + Math.sin(this.fish.frameAge * 0.02) * 0.08
                    };
                }
            }

            // Ice fishing mode: normal idle behavior (lake trout)
            return {
                x: this.fish.speed * this.idleDirection,
                y: 0 // Stay at current depth while idle
            };
        }

        // Use worldX for horizontal movement calculations (not screen x)
        const dx = this.targetX - this.fish.worldX;
        const dy = this.targetY - this.fish.y;
        // Use Phaser's optimized distance calculation
        const distance = Phaser.Math.Distance.Between(this.fish.worldX, this.fish.y, this.targetX, this.targetY);

        // Don't force fish to stop - let momentum carry them
        // Just slow down near target instead of stopping
        if (distance < 5) {
            const slowFactor = distance / 5; // Gradual slowdown
            return {
                x: (dx / distance) * this.fish.speed * slowFactor,
                y: (dy / distance) * this.fish.speed * slowFactor
            };
        }

        // Speed multiplier based on state
        let speedMultiplier = 1;
        let verticalSpeedMultiplier = 0.85; // More fluid vertical movement (increased from 0.5)

        switch (this.state) {
            case Constants.FISH_STATE.CHASING:
                // Pike don't chase as much - they ambush. Lake trout are pursuit hunters.
                if (this.isAmbushPredator) {
                    speedMultiplier = 1.2; // Slow chase
                } else {
                    speedMultiplier = GameConfig.CHASE_SPEED_MULTIPLIER;
                }
                verticalSpeedMultiplier = 0.95; // Near-equal vertical speed when chasing
                break;
            case Constants.FISH_STATE.STRIKING:
                // Northern pike have EXPLOSIVE strikes (burst speed)
                if (this.isAmbushPredator) {
                    speedMultiplier = this.burstSpeed * 2.0; // 5x speed burst!
                } else {
                    speedMultiplier = 2.5; // Lake trout normal strike
                }
                verticalSpeedMultiplier = 1.0; // Full vertical speed when striking
                break;
            case Constants.FISH_STATE.FLEEING:
                // Fast fleeing fish swim at 3x normal speed
                speedMultiplier = this.fish.isFastFleeing ? 4.0 : 2.0;
                verticalSpeedMultiplier = 0.9;
                break;
            case Constants.FISH_STATE.INTERESTED:
                speedMultiplier = 0.7; // Increased from 0.5 for less hesitation
                verticalSpeedMultiplier = 0.8;
                break;
            case Constants.FISH_STATE.HUNTING_BAITFISH:
                // Pike ambush baitfish, trout pursue them
                if (this.isAmbushPredator) {
                    speedMultiplier = 1.5; // Pike wait for baitfish to come close
                } else {
                    speedMultiplier = GameConfig.BAITFISH_PURSUIT_SPEED;
                }
                // Hungrier fish move faster vertically to reach baitfish (0-100 scale)
                verticalSpeedMultiplier = 0.85 + (this.fish.hunger * GameConfig.HUNGER_VERTICAL_SCALING);
                break;
            case Constants.FISH_STATE.FEEDING:
                // Don't slow down when feeding - maintain momentum!
                speedMultiplier = 1.5; // Keep swimming through
                verticalSpeedMultiplier = 1.0;
                break;
        }

        return {
            x: (dx / distance) * this.fish.speed * speedMultiplier,
            y: (dy / distance) * this.fish.speed * speedMultiplier * verticalSpeedMultiplier
        };
    }

    // ========== BAITFISH HUNTING BEHAVIORS ==========

    findNearestBaitfishCloud(baitfishClouds) {
        if (!baitfishClouds || baitfishClouds.length === 0) {
            return null;
        }

        let bestCloud = null;
        let bestScore = -Infinity;

        for (const cloud of baitfishClouds) {
            // Check if cloud is valid and has baitfish (works for both systems)
            const baitfishArray = cloud.baitfish || cloud.members || [];
            const cloudVisible = cloud.visible !== false || cloud.members; // Schools don't have visible property
            if (!cloudVisible || baitfishArray.length === 0) {continue;}

            // IMPORTANT: Use worldX for horizontal distance (schools use world coordinates)
            const distance = Utils.calculateDistance(
                this.fish.worldX, this.fish.y,
                cloud.centerX || cloud.centerWorldX,
                cloud.centerY
            );

            // Hunger affects how far vertically fish will pursue baitfish (0-100 scale)
            const verticalDistance = Math.abs(this.fish.y - cloud.centerY);
            const maxVerticalRange = GameConfig.BAITFISH_VERTICAL_PURSUIT_RANGE * (this.fish.hunger * GameConfig.HUNGER_VERTICAL_SCALING);

            // Check if cloud is within range
            if (distance < GameConfig.BAITFISH_DETECTION_RANGE && verticalDistance < maxVerticalRange) {
                // SCORE-BASED SELECTION to spread predators across clouds
                // Prefer clouds with fewer hunters and more baitfish
                const hunterCount = cloud.lakersChasing?.length || 0;
                const baitfishCount = baitfishArray.length;

                // Score formula:
                // - Closer clouds score higher (inverted distance)
                // - Clouds with fewer hunters score higher
                // - Clouds with more baitfish score higher
                const distanceScore = (GameConfig.BAITFISH_DETECTION_RANGE - distance) / GameConfig.BAITFISH_DETECTION_RANGE;
                const hunterPenalty = hunterCount * 0.3; // Each hunter reduces score by 0.3
                const baitfishBonus = baitfishCount * 0.01; // Each baitfish adds small bonus

                const score = distanceScore - hunterPenalty + baitfishBonus;

                if (score > bestScore) {
                    bestScore = score;
                    bestCloud = cloud;
                }
            }
        }

        return bestCloud ? { cloud: bestCloud, distance: bestScore } : null;
    }

    shouldHuntBaitfish(cloudInfo) {
        if (!cloudInfo) {return false;}

        // Hunger is the primary driver (0-100 scale, higher = hungrier)
        const hungerFactor = this.fish.hunger / 100;

        // Distance factor - closer is more likely
        const distanceFactor = 1 - (cloudInfo.distance / GameConfig.BAITFISH_DETECTION_RANGE);

        // Check if other fish are hunting this cloud (frenzying)
        // INCREASED bonus for feeding activity - makes frenzy more likely!
        const otherFishHunting = cloudInfo.cloud.lakersChasing.length;
        const frenzyBonus = Math.min(otherFishHunting * 0.5, 1.2); // Increased from 0.3/0.8 to 0.5/1.2

        // FRENZY TARGET CLOUD BONUS - If this fish is frenzying and this is the target cloud, HUGE bonus!
        let frenzyTargetBonus = 0;
        if (this.fish.inFrenzy && this.fish.frenzyTargetCloud === cloudInfo.cloud) {
            frenzyTargetBonus = 1.5; // MASSIVE bonus - fish will rush to this cloud!
            console.log(`🎯 Fish locked onto frenzy target cloud!`);
        }

        // DIET PREFERENCE - Lake trout prefer certain prey species (based on real-world data)
        const preySpecies = cloudInfo.cloud.speciesType;
        const dietPreference = calculateDietPreference('lake_trout', preySpecies);
        // Diet preferences: alewife 0.55, smelt 0.25, perch 0.08, sculpin 0.08, cisco 0.04

        // Very hungry fish (>70%) are less picky about species
        const pickyFactor = this.fish.hunger > 70 ? 0.3 : 1.0;
        const dietBonus = dietPreference * pickyFactor * 0.4; // Can add up to 0.22 for preferred prey

        // SIZE/TROPHY BONUS - Larger fish are more aggressive hunters
        // Trophy fish (>30 lbs) and large fish (>15 lbs) need more food and hunt more aggressively
        const sizeBonus = this.fish.weight > 30 ? 0.35 :  // Trophy: +35% hunt score
                         this.fish.weight > 15 ? 0.20 :  // Large: +20% hunt score
                         this.fish.weight > 5 ? 0.10 : 0; // Medium: +10% hunt score

        // Base hunt score (hunger + distance + frenzy)
        let huntScore = (hungerFactor * 0.6) + (distanceFactor * 0.3) + frenzyBonus + frenzyTargetBonus;

        // Apply diet preference bonus
        huntScore += dietBonus;

        // Apply size bonus - trophy fish hunt much more aggressively
        huntScore += sizeBonus;

        // Rare species (cisco) get extra appeal bonus
        if (preySpecies === 'cisco') {
            huntScore += 0.15; // Rare delicacy!
        }

        return huntScore > 0.35; // Lowered from 0.5 for more aggressive pursuit
    }

    startHuntingBaitfish(cloudInfo) {
        this.state = Constants.FISH_STATE.HUNTING_BAITFISH;
        this.targetBaitfishCloud = cloudInfo.cloud;
        this.isFrenzying = cloudInfo.cloud.lakersChasing.length > 0;
        this.consecutiveCatches = 0; // Reset for new hunting run
        this.decisionCooldown = 150; // Reduced from 300 for faster pursuit reactions
    }

    huntingBaitfishBehavior(baitfishClouds, lure) {
        // Verify target cloud still exists and has baitfish (works for both systems)
        const baitfishArray = this.targetBaitfishCloud?.baitfish || this.targetBaitfishCloud?.members || [];
        const cloudVisible = this.targetBaitfishCloud && (
            this.targetBaitfishCloud.visible !== false || this.targetBaitfishCloud.members
        );

        if (!this.targetBaitfishCloud || !cloudVisible || baitfishArray.length === 0) {
            // Cloud depleted or gone, return to idle
            this.state = Constants.FISH_STATE.IDLE;
            this.targetBaitfishCloud = null;
            this.targetBaitfish = null;
            this.decisionCooldown = 1000;
            return;
        }

        // Calculate mouth position (front of fish body)
        // Account for fish angle when calculating mouth position
        const bodySize = Math.max(8, this.fish.weight / 2);
        const mouthOffset = bodySize * 1.25; // Front of fish

        // Get movement direction to know which way fish is facing
        const movement = this.getMovementVector();
        const isMovingRight = movement.x >= 0;

        // Calculate mouth position accounting for fish angle
        // Fish facing right = mouth on the RIGHT (positive X)
        // Fish facing left = mouth on the LEFT (negative X)
        // IMPORTANT: Use worldX for horizontal position (baitfish use world coordinates)
        const angleOffset = this.fish.angle || 0;
        const mouthX = isMovingRight ?
            this.fish.worldX + Math.cos(angleOffset) * mouthOffset :  // Mouth on RIGHT side when facing right
            this.fish.worldX - Math.cos(angleOffset) * mouthOffset;   // Mouth on LEFT side when facing left
        const mouthY = this.fish.y + Math.sin(angleOffset) * mouthOffset;

        // Find closest baitfish to the MOUTH position (not fish center)
        const result = this.targetBaitfishCloud.getClosestBaitfish(mouthX, mouthY);

        if (result.baitfish) {
            this.targetBaitfish = result.baitfish;
            // Use worldX for target position (baitfish use world coordinates)
            this.targetX = result.baitfish.model ? result.baitfish.model.worldX : result.baitfish.worldX;
            this.targetY = result.baitfish.model ? result.baitfish.model.y : result.baitfish.y;

            // Check if mouth is touching the baitfish
            if (result.distance < 8) { // Mouth must touch baitfish
                // Consume the baitfish!
                const preySpecies = this.targetBaitfishCloud.speciesType;
                this.targetBaitfishCloud.consumeBaitfish();
                this.fish.feedOnBaitfish(preySpecies); // Pass species for nutrition calculation

                // Keep swimming through cloud - no turning back!
                // Just keep hunting next baitfish in smooth swim-through pattern
                this.decisionCooldown = 10; // Very short cooldown for rapid feeding
                return;
            }
        } else {
            // No baitfish available - cloud is depleted or all consumed
            // Return to idle instead of getting stuck at cloud center
            this.state = Constants.FISH_STATE.IDLE;
            this.targetBaitfishCloud = null;
            this.targetBaitfish = null;
            this.decisionCooldown = 1000;
            return;
        }

        // IMPORTANT: Check if lure is in the baitfish cloud
        // Fish cannot tell the difference between lure and baitfish!
        // Only check this if lure exists (not in nature simulation mode)
        if (lure) {
            const lureInCloud = this.targetBaitfishCloud.isPlayerLureInCloud(lure);
            if (lureInCloud) {
                const lureDistance = Utils.calculateDistance(
                    this.fish.x, this.fish.y,
                    lure.x, lure.y
                );

                // Sometimes target the lure instead of baitfish (can't tell difference)
                if (Math.random() < 0.5 || lureDistance < result.distance) { // Increased from 0.4 to 0.5
                    this.state = Constants.FISH_STATE.CHASING;
                    this.targetX = lure.x;
                    this.targetY = lure.y;
                    this.decisionCooldown = 100; // Reduced from 200 for faster strike
                }
            }
        }
    }

    feedingBehavior(baitfishClouds, lure) {
        // After eating, check if we should continue hunting or return to idle
        // REMOVED: All cloud-center targeting logic - predators only chase individual fish

        // Check if cloud still has baitfish to hunt
        if (this.targetBaitfishCloud && this.fish.hunger > 30) {
            const baitfishArray = this.targetBaitfishCloud.baitfish || this.targetBaitfishCloud.members || [];
            const cloudVisible = this.targetBaitfishCloud.visible !== false || this.targetBaitfishCloud.members;

            if (cloudVisible && baitfishArray.length > 0) {
                // Still baitfish available and still hungry - keep hunting
                this.state = Constants.FISH_STATE.HUNTING_BAITFISH;
                this.decisionCooldown = 20; // Very short for rapid feeding
            } else {
                // Cloud depleted, return to idle
                this.state = Constants.FISH_STATE.IDLE;
                this.targetBaitfishCloud = null;
                this.targetBaitfish = null;
                this.consecutiveCatches = 0;
            }
        } else {
            // Satisfied or no target cloud - return to idle
            this.state = Constants.FISH_STATE.IDLE;
            this.targetBaitfishCloud = null;
            this.targetBaitfish = null;
            this.consecutiveCatches = 0;
            this.decisionCooldown = 2000;
        }
    }

    isLureInBaitfishCloud(lure, baitfishClouds) {
        if (!baitfishClouds || baitfishClouds.length === 0) {
            return false;
        }

        for (const cloud of baitfishClouds) {
            // Check if cloud is visible (works for both systems - schools don't have visible)
            const cloudVisible = cloud.visible !== false || cloud.members;
            if (cloudVisible && cloud.isPlayerLureInCloud && cloud.isPlayerLureInCloud(lure)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Find nearest crayfish (opportunistic bottom feeding)
     */
    findNearestCrayfish(crayfish) {
        if (!crayfish || crayfish.length === 0) {
            return null;
        }

        let nearest = null;
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
     * Should this fish hunt crayfish? (Lake trout and smallmouth bass love crayfish!)
     */
    shouldHuntCrayfish(crayfish) {
        // Lake trout and smallmouth bass hunt crayfish (bass LOVE crayfish!)
        if (this.fish.species !== 'lake_trout' && this.fish.species !== 'smallmouth_bass') {
            return false;
        }

        // Must be hungry
        if (this.fish.hunger < 40) {
            return false;
        }

        // Must be near bottom (within 20 feet of crayfish)
        const depthDifference = Math.abs(this.fish.depth - crayfish.depth);
        if (depthDifference > 20) {
            return false;
        }

        // Must be within reasonable hunting range
        const distance = Utils.calculateDistance(
            this.fish.x, this.fish.y,
            crayfish.x, crayfish.y
        );

        return distance < 150; // Hunt if within 150 pixels
    }

    /**
     * Hunt crayfish (lake trout and smallmouth bass bottom feeding)
     */
    huntCrayfish(crayfish) {
        // Move toward crayfish
        // Use worldX for target position (crayfish use world coordinates)
        this.targetX = crayfish.worldX;
        this.targetY = crayfish.y;
        this.state = Constants.FISH_STATE.HUNTING_BAITFISH; // Reuse hunting state

        // Calculate mouth position (front of fish body)
        // Account for fish angle when calculating mouth position
        const bodySize = Math.max(8, this.fish.weight / 2);
        const mouthOffset = bodySize * 1.25; // Front of fish

        // Get movement direction to know which way fish is facing
        const movement = this.getMovementVector();
        const isMovingRight = movement.x >= 0;

        // Calculate mouth position accounting for fish angle
        // Fish facing right = mouth on the RIGHT (positive X)
        // Fish facing left = mouth on the LEFT (negative X)
        // IMPORTANT: Use worldX for horizontal position
        const angleOffset = this.fish.angle || 0;
        const mouthX = isMovingRight ?
            this.fish.worldX + Math.cos(angleOffset) * mouthOffset :  // Mouth on RIGHT side when facing right
            this.fish.worldX - Math.cos(angleOffset) * mouthOffset;   // Mouth on LEFT side when facing left
        const mouthY = this.fish.y + Math.sin(angleOffset) * mouthOffset;

        // Check if mouth is touching crayfish (use worldX)
        const distance = Utils.calculateDistance(
            mouthX, mouthY,
            crayfish.worldX, crayfish.y
        );

        if (distance < 8) { // Mouth must touch crayfish
            // Consume the crayfish!
            crayfish.consume();
            this.fish.feedOnCrayfish();
            this.state = Constants.FISH_STATE.FEEDING;
            this.decisionCooldown = 100; // Brief pause after eating
        }
    }

    /**
     * Make fish swim toward nearest screen edge to despawn
     * Fish swims at normal speed toward the closest edge
     */
    swimOffScreen() {
        // Determine which edge is closer (left or right)
        const screenCenter = GameConfig.CANVAS_WIDTH / 2;
        const distToLeft = this.fish.worldX;
        const distToRight = GameConfig.CANVAS_WIDTH - this.fish.worldX;

        // Swim toward nearest edge
        if (distToLeft < distToRight) {
            // Swim left (off left edge)
            this.targetX = -400; // Target well off-screen
        } else {
            // Swim right (off right edge)
            this.targetX = GameConfig.CANVAS_WIDTH + 400;
        }

        // Keep current depth while swimming off
        this.targetY = this.fish.y;

        // Mark state as leaving
        this.state = Constants.FISH_STATE.IDLE;
    }
}

export default FishAI;
