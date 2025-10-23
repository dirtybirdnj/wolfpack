import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';

export class FishAI {
    constructor(fish) {
        this.fish = fish;
        this.state = Constants.FISH_STATE.IDLE;
        this.targetX = null;
        this.targetY = null;
        this.alertness = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
        this.baseAggressiveness = Math.random() * 0.7 + 0.3; // 0.3 to 1.0
        this.lastDecisionTime = 0;
        this.decisionCooldown = 500; // milliseconds

        // Idle swimming direction
        this.idleDirection = Math.random() < 0.5 ? 1 : -1; // 1 = right, -1 = left

        // Behavior modifiers based on conditions
        this.depthPreference = this.calculateDepthPreference();
        this.speedPreference = Utils.randomBetween(1.5, 3.5);
    }

    get aggressiveness() {
        // Apply depth zone bonus to base aggressiveness
        const zoneBonus = this.fish.depthZone.aggressivenessBonus;
        return Math.max(0.1, Math.min(1.0, this.baseAggressiveness + zoneBonus));
    }
    
    calculateDepthPreference() {
        // Lake trout prefer deeper, cooler water
        const minDepth = GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MIN;
        const maxDepth = GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MAX;
        return Utils.randomBetween(minDepth, maxDepth);
    }
    
    update(lure, currentTime) {
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
        
        // State machine for fish behavior
        switch (this.state) {
            case Constants.FISH_STATE.IDLE:
                this.idleBehavior(distance, lure, lureSpeed, depthDifference);
                break;
                
            case Constants.FISH_STATE.INTERESTED:
                this.interestedBehavior(distance, lure, lureSpeed);
                break;
                
            case Constants.FISH_STATE.CHASING:
                this.chasingBehavior(distance, lure, lureSpeed);
                break;
                
            case Constants.FISH_STATE.STRIKING:
                this.strikingBehavior(distance, lure);
                break;
                
            case Constants.FISH_STATE.FLEEING:
                this.fleeingBehavior(distance);
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

        // Decision threshold (varies by depth zone)
        const threshold = this.fish.depthZone.interestThreshold;
        if (interestScore > threshold) {
            this.state = Constants.FISH_STATE.INTERESTED;
            this.decisionCooldown = 300;
        }
    }
    
    interestedBehavior(distance, lure, lureSpeed) {
        // Fish is watching the lure, may approach slowly
        this.targetX = lure.x - 20; // Stay slightly behind
        this.targetY = lure.y;
        
        // Decide whether to chase or lose interest
        const continueChase = Math.random() < this.aggressiveness;
        
        if (distance < GameConfig.DETECTION_RANGE * 0.5 && continueChase) {
            // Close enough and aggressive enough to chase
            this.state = Constants.FISH_STATE.CHASING;
            this.decisionCooldown = 200;
        } else if (distance > GameConfig.DETECTION_RANGE || !continueChase) {
            // Lost interest
            this.state = Constants.FISH_STATE.IDLE;
            this.targetX = null;
            this.targetY = null;
            this.decisionCooldown = 1000;
        }
    }
    
    chasingBehavior(distance, lure, lureSpeed) {
        // Actively pursuing the lure
        this.targetX = lure.x;
        this.targetY = lure.y;
        
        // Check if close enough to strike
        if (distance < GameConfig.STRIKE_DISTANCE) {
            const strikeChance = this.aggressiveness * 0.7;
            if (Math.random() < strikeChance) {
                this.state = Constants.FISH_STATE.STRIKING;
                this.decisionCooldown = 100;
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
            // Fish has caught the lure!
            this.fish.caught = true;
            this.state = Constants.FISH_STATE.FLEEING;
            
            // Trigger catch event in the fish
            if (this.fish.scene) {
                this.fish.scene.events.emit('fishCaught', this.fish);
            }
        } else if (distance > GameConfig.STRIKE_DISTANCE * 2) {
            // Missed the strike, flee
            this.state = Constants.FISH_STATE.FLEEING;
            this.decisionCooldown = 3000;
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
        // IDLE fish cruise horizontally without a specific target
        if (this.state === Constants.FISH_STATE.IDLE || !this.targetX || !this.targetY) {
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
                speedMultiplier = 0.5;
                break;
        }

        return {
            x: (dx / distance) * this.fish.speed * speedMultiplier,
            y: (dy / distance) * this.fish.speed * speedMultiplier * 0.5 // Fish move slower vertically
        };
    }
}

export default FishAI;
