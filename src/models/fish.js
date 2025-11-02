import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import FishAI from '../entities/FishAI.js';
import { getPredatorSpecies, getBaitfishSpecies } from '../config/SpeciesData.js';
import AquaticOrganism from './AquaticOrganism.js';

// Fish name pools
const MALE_NAMES = [
    'Dave', 'Bob', 'Steve', 'Mike', 'Tom', 'Jim', 'Frank', 'Bill', 'Joe', 'Dan',
    'Rick', 'Gary', 'Larry', 'Barry', 'Jerry', 'Terry', 'Carl', 'Paul', 'Ron', 'Don',
    'Mark', 'John', 'Jeff', 'Pete', 'Chad', 'Brad', 'Kyle', 'Jake', 'Sam', 'Max'
];

const FEMALE_NAMES = [
    'Susan', 'Linda', 'Karen', 'Nancy', 'Betty', 'Lisa', 'Sarah', 'Emily', 'Mary', 'Anna',
    'Ruth', 'Carol', 'Diane', 'Janet', 'Julie', 'Kelly', 'Laura', 'Marie', 'Alice', 'Rose',
    'Grace', 'Helen', 'Donna', 'Joyce', 'Paula', 'Martha', 'Cindy', 'Sandy', 'Wendy', 'Pam'
];

/**
 * Fish class - Predator fish model extending AquaticOrganism
 * Adds AI, catching mechanics, and predator-specific behaviors
 */
export class Fish extends AquaticOrganism {
    constructor(scene, x, y, size = 'MEDIUM', species = 'lake_trout') {
        // Get species data for super constructor
        const speciesData = getPredatorSpecies(species);

        // Call parent constructor with base properties
        super(scene, x, y, species, speciesData);

        // Fish-specific size and weight properties
        this.size = Constants.FISH_SIZE[size];
        this.weight = Utils.randomBetween(this.size.min, this.size.max);

        // Calculate length based on weight - can be overridden by species
        this.length = this.calculateLength();

        this.baseSpeed = Utils.randomBetween(GameConfig.FISH_SPEED_MIN, GameConfig.FISH_SPEED_MAX);
        this.points = this.size.points;

        // Biological age - bigger fish are older (in years)
        this.age = this.calculateBiologicalAge();

        // Fish personality - name and gender
        this.gender = Math.random() < 0.5 ? 'male' : 'female';
        this.name = this.gender === 'male'
            ? MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)]
            : FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)];

        // Depth zone behavior
        this.depthZone = this.getDepthZone();
        this.speed = this.baseSpeed * this.depthZone.speedMultiplier;

        // AI controller (heavy - not used by baitfish)
        this.ai = new FishAI(this);

        // Sonar properties (visual rendering handled by entity layer)
        this.sonarStrength = this.calculateSonarStrength();

        // State
        this.caught = false;
        this.frameAge = 0;

        // Biological properties (heavy - not used by baitfish)
        this.hunger = Utils.randomBetween(75, 95); // Start hungry to encourage feeding (>75%)
        this.health = Utils.randomBetween(40, 70); // Start with moderate health, not perfect
        this.lastFed = 0;
        this.metabolism = Utils.randomBetween(0.8, 1.2);

        // Frenzy behavior
        this.inFrenzy = false;
        this.frenzyTimer = 0;
        this.frenzyIntensity = 0;

        // Stomach contents - track what this fish has eaten
        this.stomachContents = []; // Array of { species: string, timestamp: number }

        // Visual feedback
        this.interestFlash = 0;
        this.interestFlashDecay = 0.02;

        // Movement angle for realistic rotation (angle is in parent, targetAngle is fish-specific)
        this.targetAngle = 0;

        // Chase mechanics (heavy - not used by baitfish)
        this.speedPreference = Utils.randomBetween(1.0, 4.0);
        this.swipeChances = 0;
        this.maxSwipeChances = 0;
        this.isEngaged = false;
        this.engagementState = 'waiting';
        this.lastStateChange = 0;
        this.isFastFleeing = false;
        this.hasCalmedDown = false;
    }

    /**
     * Calculate fish length from weight
     * Should be overridden by species subclasses for species-specific formulas
     */
    calculateLength() {
        // Default: Lake trout formula
        return Math.round(10.5 * Math.pow(this.weight, 0.31));
    }

    /**
     * Calculate biological age from weight
     * Should be overridden by species subclasses for species-specific age ranges
     */
    calculateBiologicalAge() {
        // Default: Lake trout age-weight relationship
        if (this.weight <= 5) {
            return Math.round(Utils.randomBetween(3, 6));
        } else if (this.weight <= 12) {
            return Math.round(Utils.randomBetween(6, 12));
        } else if (this.weight <= 25) {
            return Math.round(Utils.randomBetween(12, 20));
        } else {
            return Math.round(Utils.randomBetween(20, 30));
        }
    }

    calculateSonarStrength() {
        if (this.weight > 25) {return 'strong';}
        if (this.weight > 10) {return 'medium';}
        return 'weak';
    }

    updateBiology() {
        if (this.frameAge % 120 === 0) {
            const hungerIncrease = 1.5 * this.metabolism;
            this.hunger = Math.min(100, this.hunger + hungerIncrease);
        }

        if (this.hunger > 85) {
            if (this.frameAge % 300 === 0) {
                this.health = Math.max(0, this.health - 0.8);
            }
        } else if (this.hunger < 30) {
            if (this.frameAge % 600 === 0) {
                this.health = Math.min(100, this.health + 0.5);
            }
        }

        if (this.frenzyTimer > 0) {
            this.frenzyTimer--;
            if (this.frenzyTimer <= 0) {
                this.inFrenzy = false;
                this.frenzyIntensity = 0;
            }
        }

        if (this.interestFlash > 0) {
            this.interestFlash = Math.max(0, this.interestFlash - this.interestFlashDecay);
        }

        this.hunger = Math.max(0, Math.min(100, this.hunger));
        this.health = Math.max(0, Math.min(100, this.health));
    }

    triggerInterestFlash(intensity = 0.5) {
        this.interestFlash = Math.max(this.interestFlash, intensity);
    }

    getDepthZone() {
        const zones = GameConfig.DEPTH_ZONES;
        if (this.depth >= zones.BOTTOM.min && this.depth <= zones.BOTTOM.max) {
            return zones.BOTTOM;
        } else if (this.depth >= zones.MID_COLUMN.min && this.depth < zones.MID_COLUMN.max) {
            return zones.MID_COLUMN;
        } else {
            return zones.SURFACE;
        }
    }

    update(lure, allFish = [], baitfishClouds = []) {
        const inActiveFight = this.scene.currentFight &&
                             this.scene.currentFight.active &&
                             this.scene.currentFight.fish === this;

        if (this.caught && !inActiveFight) {
            // Fish was caught but fight is over - mark as handled
            return { caught: true };
        }

        this.frameAge++;
        this.updateBiology();

        // Get dynamic depth scale from scene
        const depthScale = this.scene.sonarDisplay ? this.scene.sonarDisplay.getDepthScale() : GameConfig.DEPTH_SCALE;
        this.depth = this.y / depthScale;
        this.depthZone = this.getDepthZone();
        this.speed = this.baseSpeed * this.depthZone.speedMultiplier;

        if (!inActiveFight) {
            this.ai.update(lure, this.scene.time.now, allFish, baitfishClouds);

            const movement = this.ai.getMovementVector();

            // Calculate angle based on target direction
            if (this.ai.targetX !== null && this.ai.targetY !== null) {
                const dx = this.ai.targetX - this.x;
                const dy = this.ai.targetY - this.y;

                const distToTarget = Math.sqrt(dx * dx + dy * dy);
                if (distToTarget > 5) {
                    if (dx < 0) {
                        this.targetAngle = -Math.atan2(dy, Math.abs(dx));
                    } else {
                        this.targetAngle = Math.atan2(dy, Math.abs(dx));
                    }

                    const angleDiff = this.targetAngle - this.angle;
                    this.angle += angleDiff * 0.15;

                    const maxAngle = Math.PI / 4;
                    this.angle = Math.max(-maxAngle, Math.min(maxAngle, this.angle));
                }
            } else {
                this.angle *= 0.9;
            }

            // Apply movement in world coordinates
            this.worldX += movement.x;
            this.y += movement.y;
            this.depth = this.y / depthScale;

            // Get player's world position (center of screen)
            // Use actual game width to support all screen sizes (ultrawide, etc.)
            const actualGameWidth = this.scene.scale.width || GameConfig.CANVAS_WIDTH;
            let playerWorldX = actualGameWidth / 2;
            let isNatureSimulation = false;

            // Check if fish has swum too far from player - mark for removal if so
            if (isNatureSimulation) {
                // In nature mode, remove fish that swim too far off screen
                if (this.worldX < -400 || this.worldX > GameConfig.CANVAS_WIDTH + 400) {
                    this.visible = false;
                    return { removed: true };
                }
            } else {
                const maxDistanceFromPlayer = 800;
                const distanceFromPlayer = Math.abs(this.worldX - playerWorldX);

                // Remove fish that are beyond the boundary
                if (distanceFromPlayer > maxDistanceFromPlayer) {
                    this.visible = false;
                    return { removed: true };
                }

                // CRITICAL: Check if fish is stuck near the worldX boundary
                // Fish that are within 50 units of boundary and trying to swim further should turn around
                const nearBoundary = distanceFromPlayer > maxDistanceFromPlayer - 50;
                const isOnLeftSide = this.worldX < playerWorldX;
                const isOnRightSide = this.worldX > playerWorldX;

                if (nearBoundary && this.ai) {
                    // Check if fish is trying to swim further away from player
                    const movingAwayFromPlayer = (isOnLeftSide && this.ai.idleDirection === -1) ||
                                                (isOnRightSide && this.ai.idleDirection === 1);

                    if (movingAwayFromPlayer && this.ai.state === Constants.FISH_STATE.IDLE) {
                        // Fish is near boundary and swimming away from player - turn around!
                        console.log(`${this.species} (${this.name}) near worldX boundary (${distanceFromPlayer.toFixed(0)}px) - turning around`);
                        this.ai.idleDirection *= -1; // Flip direction
                        this.ai.targetX = null;
                        this.ai.targetY = null;
                    }
                }
            }

            // Get lake bottom depth (use maxDepth from scene)
            let bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;

            // Keep fish above lake bottom (with 5 feet buffer)
            // Allow fish to swim all the way to surface (y=0) now that ice rendering is removed
            const maxY = (bottomDepth - 5) * depthScale;
            const minY = 0;

            // Check if fish is trying to go beyond boundaries BEFORE clamping
            const wouldHitBottom = this.y > maxY;
            const wouldHitSurface = this.y < minY;

            // Clamp position to boundaries
            this.y = Math.max(minY, Math.min(maxY, this.y));

            // If fish is at boundary and AI is still trying to move beyond it, reset AI
            if (this.ai) {
                const atBottom = Math.abs(this.y - maxY) < 1; // Within 1px of bottom
                const atSurface = Math.abs(this.y - minY) < 1; // Within 1px of surface

                if ((atBottom && wouldHitBottom) || (atSurface && wouldHitSurface)) {
                    // Fish is stuck at boundary - reset AI target
                    this.ai.targetY = null;
                    this.ai.targetX = null;

                    if (atBottom) {
                        // Hit bottom - prefer shallower depth
                        const newDepthPreference = Math.max(10, bottomDepth / 2);
                        this.ai.depthPreference = newDepthPreference;
                        this.ai.state = Constants.FISH_STATE.IDLE; // Force state change
                        this.ai.decisionCooldown = 0; // Make new decision immediately
                    } else if (atSurface) {
                        // Hit surface - prefer deeper depth
                        const newDepthPreference = Math.min(bottomDepth - 10, bottomDepth / 2);
                        this.ai.depthPreference = newDepthPreference;
                        this.ai.state = Constants.FISH_STATE.IDLE;
                        this.ai.decisionCooldown = 0;
                    }
                }
            }

            // Convert world position to screen position based on player position
            if (isNatureSimulation) {
                this.x = this.worldX;
            } else {
                const offsetFromPlayer = this.worldX - playerWorldX;
                this.x = (actualGameWidth / 2) + offsetFromPlayer;

                // SCREEN BOUNDARY DETECTION: Check if fish is stuck at screen edges
                // Fish shouldn't be within 150px of screen edges (causes visual sticking)
                const screenMargin = 150;
                const atLeftEdge = this.x < screenMargin;
                const atRightEdge = this.x > actualGameWidth - screenMargin;

                if ((atLeftEdge || atRightEdge) && this.ai && this.ai.state === Constants.FISH_STATE.IDLE) {
                    // Fish is too close to screen edge - adjust worldX to pull them back
                    if (atLeftEdge) {
                        // Too far left on screen - move worldX right
                        this.worldX = playerWorldX - (actualGameWidth / 2) + screenMargin + 50;
                        console.log(`${this.species} (${this.name}) too close to left screen edge - pulling back`);
                    } else {
                        // Too far right on screen - move worldX left
                        this.worldX = playerWorldX + (actualGameWidth / 2) - screenMargin - 50;
                        console.log(`${this.species} (${this.name}) too close to right screen edge - pulling back`);
                    }

                    // Flip direction and reset AI
                    this.ai.idleDirection *= -1;
                    this.ai.targetX = null;
                    this.ai.targetY = null;

                    // Recalculate screen position with corrected worldX
                    const newOffsetFromPlayer = this.worldX - playerWorldX;
                    this.x = (actualGameWidth / 2) + newOffsetFromPlayer;
                }
            }

            // FROZEN DETECTION: Check if predator fish is stuck (not moving for extended period)
            // Only apply to fish that SHOULD be moving (not pike ambush or other stationary behaviors)
            if (!this.lastPosition) {
                this.lastPosition = { worldX: this.worldX, y: this.y };
                this.frozenFrames = 0;
                this.vibrationFrames = 0;
            } else {
                const dx = this.worldX - this.lastPosition.worldX;
                const dy = this.y - this.lastPosition.y;
                const distMoved = Math.sqrt(dx * dx + dy * dy);
                const horizontalMoved = Math.abs(dx);

                // VIBRATION DETECTION: Fish moving vertically but not horizontally (stuck at side)
                if (horizontalMoved < 0.5 && Math.abs(dy) > 0.5) {
                    this.vibrationFrames = (this.vibrationFrames || 0) + 1;

                    // If fish has been vibrating for 60 frames (1 second), it's stuck at a boundary
                    if (this.vibrationFrames > 60) {
                        console.log(`${this.species} (${this.name}) vibrating at worldX boundary - unsticking`);
                        this.ai.state = Constants.FISH_STATE.IDLE;
                        this.ai.targetX = null;
                        this.ai.targetY = null;
                        this.ai.idleDirection *= -1; // Turn around
                        this.ai.decisionCooldown = 0;
                        this.vibrationFrames = 0;
                    }
                } else {
                    this.vibrationFrames = 0;
                }

                // Original frozen detection: If fish hasn't moved more than 2 pixels in 120 frames (2 seconds)
                if (distMoved < 2.0) {
                    this.frozenFrames = (this.frozenFrames || 0) + 1;

                    // After 120 frames of being frozen, check if it SHOULD be moving
                    if (this.frozenFrames > 120) {
                        // Pike in AMBUSH state are SUPPOSED to be stationary - skip them
                        const isPikeAmbushing = this.species === 'northern_pike' &&
                                               this.ai.state === Constants.FISH_STATE.IDLE;

                        if (!isPikeAmbushing) {
                            // Fish is stuck and should be moving - reset AI
                            console.log(`Unfreezing stuck ${this.species} (${this.name}) - resetting AI`);
                            this.ai.state = Constants.FISH_STATE.IDLE;
                            this.ai.targetX = null;
                            this.ai.targetY = null;
                            this.ai.decisionCooldown = 0; // Force new decision immediately

                            // CRITICAL: Randomize idle direction to prevent re-sticking
                            // If fish was stuck swimming into a wall, this gives it a chance to turn around
                            this.ai.idleDirection = Math.random() < 0.5 ? 1 : -1;

                            // Also randomize depth preference to help break out of stuck positions
                            const bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
                            this.ai.depthPreference = Utils.randomBetween(bottomDepth * 0.3, bottomDepth * 0.7);

                            this.frozenFrames = 0;
                        } else {
                            // Pike ambushing is normal - reset counter but don't intervene
                            this.frozenFrames = 0;
                        }
                    }
                } else {
                    // Fish is moving, reset frozen counter
                    this.frozenFrames = 0;
                    this.lastPosition = { worldX: this.worldX, y: this.y };
                }
            }
        }

        return { updated: true };
    }

    feedOnBaitfish(preySpecies = 'alewife') {
        // Defensive check: Only predatory fish have hunger and health properties
        if (this.hunger === undefined || this.health === undefined) {
            return; // Not a predatory fish, skip feeding logic
        }

        // Record what this fish ate (for display to player after catch)
        if (this.stomachContents) {
            this.stomachContents.push({
                species: preySpecies,
                timestamp: this.frameAge // When it was eaten
            });
        }

        // Fish has consumed a baitfish, reduce hunger based on prey nutrition value
        const speciesData = getBaitfishSpecies(preySpecies);
        const nutritionValue = speciesData.nutritionValue || 12; // Default to 12 if not specified

        // Different species provide different nutrition (reduced for more aggressive feeding):
        // Cisco: 18 (large, nutritious)
        // Smelt: 16 (high-fat content)
        // Alewife: 12 (abundant, standard)
        // Perch: 12 (moderate)
        // Sculpin: 10 (small, less nutritious)

        const previousHunger = this.hunger;
        this.hunger = Math.max(0, this.hunger - nutritionValue);
        this.lastFed = this.frameAge;

        // HEALTH RESTORATION: Only when hunger reaches 0, excess nutrition restores health
        // If this meal brought hunger to 0, calculate excess nutrition
        if (this.hunger === 0 && previousHunger > 0) {
            // Calculate how much nutrition was "wasted" (brought us below 0)
            const excessNutrition = nutritionValue - previousHunger;

            if (excessNutrition > 0) {
                // Excess nutrition restores health (50% conversion rate)
                const healthGain = excessNutrition * 0.5;
                const previousHealth = this.health;
                this.health = Math.min(100, this.health + healthGain);
                const actualHealthGain = this.health - previousHealth;

                if (actualHealthGain > 0) {
                    console.log(`${this.name} full! Restored ${actualHealthGain.toFixed(1)} health from excess nutrition (now ${Math.floor(this.health)}%)`);
                }
            }
        }

        // Log feeding for debugging (commented out for production)
        // console.log(`${this.name} fed on ${preySpecies}, hunger reduced by ${nutritionValue} (now ${Math.floor(this.hunger)}%)`);
    }

    getInfo() {
        return {
            name: this.name,
            species: this.speciesData.name,
            gender: this.gender,
            age: this.age + ' years',
            weight: this.weight.toFixed(1) + ' lbs',
            length: this.length + ' in',
            depth: Math.floor(this.depth) + ' ft',
            state: this.ai.state,
            points: this.points,
            hunger: Math.floor(this.hunger) + '%',
            health: Math.floor(this.health) + '%',
            inFrenzy: this.inFrenzy,
            frenzyIntensity: this.frenzyIntensity.toFixed(2)
        };
    }

    /**
     * Cleanup model resources
     * Note: Visual cleanup (graphics, sprites) handled by entity layer
     */
    destroy() {
        // Cleanup AI
        if (this.ai) {
            // AI cleanup if needed
        }
        // Model is ready for garbage collection
    }
}

export default Fish;
