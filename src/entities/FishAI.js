import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';

export class FishAI {
    constructor(fish, fishingType) {
        this.fish = fish;
        this.fishingType = fishingType; // Store fishing type for thermocline behavior
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

        // Thermocline behavior (summer modes only)
        this.returningToThermocline = false;
    }

    get aggressiveness() {
        // Apply depth zone bonus to base aggressiveness
        const zoneBonus = this.fish.depthZone.aggressivenessBonus;
        return Math.max(0.1, Math.min(1.0, this.baseAggressiveness + zoneBonus));
    }
    
    calculateDepthPreference() {
        const isSummerMode = this.fishingType === GameConfig.FISHING_TYPE_KAYAK ||
                             this.fishingType === GameConfig.FISHING_TYPE_MOTORBOAT;

        if (isSummerMode) {
            // Summer: Lake trout prefer to stay below thermocline
            const minDepth = GameConfig.THERMOCLINE_DEPTH + 5; // 5 feet below thermocline
            const maxDepth = GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MAX;
            return Utils.randomBetween(minDepth, maxDepth);
        } else {
            // Winter: Lake trout prefer deeper, cooler water
            const minDepth = GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MIN;
            const maxDepth = GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MAX;
            return Utils.randomBetween(minDepth, maxDepth);
        }
    }

    detectFrenzy(lure, allFish) {
        // Lake trout get excited when they see others chasing
        // Count other fish that are interested/chasing/striking
        const excitedFish = allFish.filter(otherFish => {
            if (otherFish === this.fish) return false; // Don't count self

            const isExcited = otherFish.ai.state === Constants.FISH_STATE.INTERESTED ||
                            otherFish.ai.state === Constants.FISH_STATE.CHASING ||
                            otherFish.ai.state === Constants.FISH_STATE.STRIKING;

            // Only count fish within visual range
            const dist = Utils.calculateDistance(this.fish.x, this.fish.y, otherFish.x, otherFish.y);
            return isExcited && dist < GameConfig.DETECTION_RANGE * 2;
        });

        // If other fish are excited, 50% chance to join frenzy
        if (excitedFish.length > 0 && this.state === Constants.FISH_STATE.IDLE) {
            if (Math.random() < 0.5) {
                // Enter frenzy state!
                this.fish.inFrenzy = true;

                // Duration scales with number of frenzied fish (base 300 frames = 5 sec)
                const baseDuration = 300;
                const scaledDuration = baseDuration * (1 + excitedFish.length * 0.3);
                this.fish.frenzyTimer = Math.floor(scaledDuration);

                // Intensity based on number of excited fish
                this.fish.frenzyIntensity = Math.min(1.0, excitedFish.length * 0.25);

                // Frenzying fish get multiple strike attempts (2-3 swipes)
                this.maxStrikeAttempts = Math.floor(Math.random() * 2) + 2; // 2 or 3 attempts
                this.strikeAttempts = 0;

                // Immediately become interested in the lure
                this.state = Constants.FISH_STATE.INTERESTED;
                this.decisionCooldown = 100; // Quick response during frenzy

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
                    this.fish.frenzyTimer = 400; // Longer duration for vertical strikes
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

    update(lure, currentTime, allFish = [], baitfishClouds = []) {
        // Make decisions at intervals, not every frame
        if (currentTime - this.lastDecisionTime < this.decisionCooldown) {
            return;
        }

        this.lastDecisionTime = currentTime;

        // Calculate distance and relationship to lure
        const distance = Utils.calculateDistance(
            this.fish.x, this.fish.y,
            lure.x, lure.y
        );

        const depthDifference = Math.abs(this.fish.depth - lure.depth);
        const lureSpeed = Math.abs(lure.velocity);

        // Detect frenzy feeding - other fish chasing excites this one
        this.detectFrenzy(lure, allFish);

        // PRIORITY: Check for baitfish clouds (natural food source)
        // Fish prioritize real food over lures, especially when hungry
        const nearbyBaitfishCloud = this.findNearestBaitfishCloud(baitfishClouds);

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

        // Factors that influence interest
        let interestScore = 0;

        // Distance factor (closer is more interesting) - use vertical distance
        interestScore += (1 - verticalDist / GameConfig.VERTICAL_DETECTION_RANGE) * 30;
        
        // Speed factor (optimal speed is most attractive)
        const speedDiff = Math.abs(lureSpeed - this.speedPreference);
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

        // Actively pursuing the lure
        this.targetX = lure.x;
        this.targetY = lure.y;

        // Check if close enough to strike
        if (distance < GameConfig.STRIKE_DISTANCE) {
            // Reduce cooldown when close for immediate strike decision
            this.decisionCooldown = 50; // Very short cooldown when in strike range

            // Check if there's already a fight in progress - don't allow strike
            if (this.fish.scene && this.fish.scene.currentFight && this.fish.scene.currentFight.active) {
                // Another fish is already hooked - can't strike
                this.state = Constants.FISH_STATE.FLEEING;
                this.decisionCooldown = 3000;
                return;
            }

            // Higher strike chance if lure is in baitfish cloud (fish think it's real food)
            const baseStrikeChance = this.aggressiveness * 0.85; // Increased from 0.7
            const strikeChance = lureInBaitfishCloud ? baseStrikeChance * 1.5 : baseStrikeChance;

            if (Math.random() < strikeChance) {
                this.state = Constants.FISH_STATE.STRIKING;
                this.decisionCooldown = 50; // Quick reaction when striking

                // Trigger visual feedback - fish is striking!
                this.fish.triggerInterestFlash(1.0); // Maximum intensity for strike
            }
        } else if (distance < GameConfig.STRIKE_DISTANCE * 1.5) {
            // Getting close - reduce cooldown for quicker strike
            this.decisionCooldown = 100;
        }

        // If lure leaves baitfish cloud, less hungry fish may lose interest
        if (!lureInBaitfishCloud && this.fish.hunger < 70) {
            // Fish decide whether to keep chasing based on hunger (0-100 scale)
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
    
    strikingBehavior(distance, lure) {
        // Fish has committed to striking
        this.targetX = lure.x;
        this.targetY = lure.y;

        if (distance < 5) {
            // Check if there's already a fight in progress
            if (this.fish.scene && this.fish.scene.currentFight && this.fish.scene.currentFight.active) {
                // Another fish is already hooked - this fish missed
                console.log('Fish tried to hook but another fight is in progress');
                this.state = Constants.FISH_STATE.FLEEING;
                this.decisionCooldown = 3000;
                return;
            }

            // Fish has caught the lure!
            this.fish.caught = true;
            this.state = Constants.FISH_STATE.FLEEING;

            // Trigger catch event in the fish
            if (this.fish.scene) {
                this.fish.scene.events.emit('fishCaught', this.fish);
            }
        } else if (distance > GameConfig.STRIKE_DISTANCE * 2) {
            // Missed the strike!
            this.strikeAttempts++;

            // If in frenzy and has attempts remaining, try again
            if (this.fish.inFrenzy && this.strikeAttempts < this.maxStrikeAttempts) {
                console.log(`Fish missed! Attempt ${this.strikeAttempts}/${this.maxStrikeAttempts} - trying again!`);

                // Turn around and chase again
                this.state = Constants.FISH_STATE.CHASING;
                this.targetX = lure.x;
                this.targetY = lure.y;
                this.decisionCooldown = 300; // Brief pause before next swipe
            } else {
                // No more attempts or not in frenzy - flee
                console.log(`Fish giving up after ${this.strikeAttempts} attempts`);
                this.state = Constants.FISH_STATE.FLEEING;
                this.decisionCooldown = 3000;
                this.strikeAttempts = 0; // Reset for next time
            }
        }
    }
    
    fleeingBehavior(distance) {
        // Fish is spooked and swimming away
        this.targetX = this.fish.x < 400 ? -100 : 900;
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
        const isSummerMode = this.fishingType === GameConfig.FISHING_TYPE_KAYAK ||
                             this.fishingType === GameConfig.FISHING_TYPE_MOTORBOAT;

        // IDLE fish cruise horizontally without a specific target
        if (this.state === Constants.FISH_STATE.IDLE || !this.targetX || !this.targetY) {
            // Check thermocline in summer modes
            if (isSummerMode) {
                const thermoclineDepth = GameConfig.THERMOCLINE_DEPTH;
                const currentDepth = this.fish.depth;

                // If fish is above thermocline, slowly return below it
                if (currentDepth < thermoclineDepth) {
                    this.returningToThermocline = true;
                    return {
                        x: this.fish.speed * this.idleDirection * 0.5, // Slower horizontal movement
                        y: this.fish.speed * 0.3 // Drift downward
                    };
                } else if (currentDepth < thermoclineDepth + 5) {
                    // Just below thermocline, continue drifting down slowly
                    this.returningToThermocline = true;
                    return {
                        x: this.fish.speed * this.idleDirection * 0.7,
                        y: this.fish.speed * 0.2
                    };
                } else {
                    // Below thermocline, normal cruising
                    this.returningToThermocline = false;
                    return {
                        x: this.fish.speed * this.idleDirection,
                        y: 0 // Stay at current depth while idle
                    };
                }
            }

            // Winter mode: normal idle behavior
            return {
                x: this.fish.speed * this.idleDirection,
                y: 0 // Stay at current depth while idle
            };
        }

        const dx = this.targetX - this.fish.x;
        const dy = this.targetY - this.fish.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 1) {
            return { x: 0, y: 0 };
        }

        // Speed multiplier based on state
        let speedMultiplier = 1;
        let verticalSpeedMultiplier = 0.5; // Default slower vertical movement

        switch (this.state) {
            case Constants.FISH_STATE.CHASING:
                speedMultiplier = GameConfig.CHASE_SPEED_MULTIPLIER;
                break;
            case Constants.FISH_STATE.STRIKING:
                speedMultiplier = 2.5;
                break;
            case Constants.FISH_STATE.FLEEING:
                speedMultiplier = 2.0;
                break;
            case Constants.FISH_STATE.INTERESTED:
                speedMultiplier = 0.7; // Increased from 0.5 for less hesitation
                break;
            case Constants.FISH_STATE.HUNTING_BAITFISH:
                // Aggressive pursuit of baitfish
                speedMultiplier = GameConfig.BAITFISH_PURSUIT_SPEED;
                // Hungrier fish move faster vertically to reach baitfish (0-100 scale)
                verticalSpeedMultiplier = 0.5 + (this.fish.hunger * GameConfig.HUNGER_VERTICAL_SCALING);
                break;
            case Constants.FISH_STATE.FEEDING:
                speedMultiplier = 0.3;
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

        let nearest = null;
        let minDistance = Infinity;

        for (const cloud of baitfishClouds) {
            if (!cloud.visible || cloud.baitfish.length === 0) continue;

            const distance = Utils.calculateDistance(
                this.fish.x, this.fish.y,
                cloud.centerX, cloud.centerY
            );

            // Hunger affects how far vertically fish will pursue baitfish (0-100 scale)
            const verticalDistance = Math.abs(this.fish.y - cloud.centerY);
            const maxVerticalRange = GameConfig.BAITFISH_VERTICAL_PURSUIT_RANGE * (this.fish.hunger * GameConfig.HUNGER_VERTICAL_SCALING);

            if (distance < minDistance &&
                distance < GameConfig.BAITFISH_DETECTION_RANGE &&
                verticalDistance < maxVerticalRange) {
                minDistance = distance;
                nearest = cloud;
            }
        }

        return nearest ? { cloud: nearest, distance: minDistance } : null;
    }

    shouldHuntBaitfish(cloudInfo) {
        if (!cloudInfo) return false;

        // Hunger is the primary driver (0-100 scale, higher = hungrier)
        const hungerFactor = this.fish.hunger / 100;

        // Distance factor - closer is more likely
        const distanceFactor = 1 - (cloudInfo.distance / GameConfig.BAITFISH_DETECTION_RANGE);

        // Check if other fish are hunting this cloud (frenzying)
        const otherFishHunting = cloudInfo.cloud.lakersChasing.length;
        const frenzyBonus = Math.min(otherFishHunting * 0.3, 0.8); // Increased from 0.2/0.6 to 0.3/0.8

        const huntScore = (hungerFactor * 0.6) + (distanceFactor * 0.3) + frenzyBonus;

        return huntScore > 0.35; // Lowered from 0.5 for more aggressive pursuit
    }

    startHuntingBaitfish(cloudInfo) {
        this.state = Constants.FISH_STATE.HUNTING_BAITFISH;
        this.targetBaitfishCloud = cloudInfo.cloud;
        this.isFrenzying = cloudInfo.cloud.lakersChasing.length > 0;
        this.decisionCooldown = 150; // Reduced from 300 for faster pursuit reactions
    }

    huntingBaitfishBehavior(baitfishClouds, lure) {
        // Verify target cloud still exists and has baitfish
        if (!this.targetBaitfishCloud ||
            !this.targetBaitfishCloud.visible ||
            this.targetBaitfishCloud.baitfish.length === 0) {
            // Cloud depleted or gone, return to idle
            this.state = Constants.FISH_STATE.IDLE;
            this.targetBaitfishCloud = null;
            this.targetBaitfish = null;
            this.decisionCooldown = 1000;
            return;
        }

        // Find closest baitfish in the cloud
        const result = this.targetBaitfishCloud.getClosestBaitfish(this.fish.x, this.fish.y);

        if (result.baitfish) {
            this.targetBaitfish = result.baitfish;
            this.targetX = result.baitfish.x;
            this.targetY = result.baitfish.y;

            // Check if we're close enough to eat the baitfish
            if (result.distance < 10) { // Increased from 8 for easier catches
                // Consume the baitfish!
                this.targetBaitfishCloud.consumeBaitfish();
                this.fish.feedOnBaitfish();
                this.state = Constants.FISH_STATE.FEEDING;
                this.decisionCooldown = 100; // Reduced from 200 for faster feeding cycle
                return;
            }
        } else {
            // No baitfish available, head to cloud center
            this.targetX = this.targetBaitfishCloud.centerX;
            this.targetY = this.targetBaitfishCloud.centerY;
        }

        // IMPORTANT: Check if lure is in the baitfish cloud
        // Fish cannot tell the difference between lure and baitfish!
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

    feedingBehavior(baitfishClouds, lure) {
        // Brief feeding state, then return to hunting or idle
        if (this.targetBaitfishCloud &&
            this.targetBaitfishCloud.visible &&
            this.targetBaitfishCloud.baitfish.length > 0 &&
            this.fish.hunger > 30) { // Lowered from 40 to keep hunting longer
            // Still hungry and food available, keep hunting
            this.state = Constants.FISH_STATE.HUNTING_BAITFISH;
            this.decisionCooldown = 80; // Reduced from 150 for rapid consecutive strikes
        } else {
            // Satisfied or cloud depleted
            this.state = Constants.FISH_STATE.IDLE;
            this.targetBaitfishCloud = null;
            this.targetBaitfish = null;
            this.decisionCooldown = 2000;
        }
    }

    isLureInBaitfishCloud(lure, baitfishClouds) {
        if (!baitfishClouds || baitfishClouds.length === 0) {
            return false;
        }

        for (const cloud of baitfishClouds) {
            if (cloud.visible && cloud.isPlayerLureInCloud(lure)) {
                return true;
            }
        }

        return false;
    }
}

export default FishAI;
