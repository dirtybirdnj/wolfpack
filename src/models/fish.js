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
    constructor(scene, x, y, size = 'MEDIUM', fishingType = null, species = 'lake_trout') {
        // Get species data for super constructor
        const speciesData = getPredatorSpecies(species);

        // Call parent constructor with base properties
        super(scene, x, y, species, speciesData);

        this.fishingType = fishingType || scene.fishingType;

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
        this.ai = new FishAI(this, this.fishingType);

        // Sonar properties (visual rendering handled by entity layer)
        this.sonarStrength = this.calculateSonarStrength();

        // State
        this.caught = false;
        this.frameAge = 0;

        // Biological properties (heavy - not used by baitfish)
        this.hunger = Utils.randomBetween(50, 90);
        this.health = Utils.randomBetween(60, 100);
        this.lastFed = 0;
        this.metabolism = Utils.randomBetween(0.8, 1.2);

        // Frenzy behavior
        this.inFrenzy = false;
        this.frenzyTimer = 0;
        this.frenzyIntensity = 0;

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
        if (this.weight > 25) return 'strong';
        if (this.weight > 10) return 'medium';
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

        this.depth = this.y / GameConfig.DEPTH_SCALE;
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
            this.depth = this.y / GameConfig.DEPTH_SCALE;

            // Get player's world position (or use nature simulation mode)
            let playerWorldX;
            let isNatureSimulation = false;

            if (this.scene.iceHoleManager) {
                const currentHole = this.scene.iceHoleManager.getCurrentHole();
                playerWorldX = currentHole ? currentHole.x : this.worldX;
            } else if (this.scene.boatManager) {
                playerWorldX = this.scene.boatManager.getPlayerWorldX();
            } else {
                // Nature simulation mode - no player to track
                isNatureSimulation = true;
                playerWorldX = GameConfig.CANVAS_WIDTH / 2;
            }

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

                if (distanceFromPlayer > maxDistanceFromPlayer) {
                    this.visible = false;
                    return { removed: true };
                }
            }

            // Get lake bottom depth at fish's current position
            let bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
            if (this.scene.boatManager) {
                const offsetFromPlayer = this.x - (GameConfig.CANVAS_WIDTH / 2);
                const gameX = this.scene.boatManager.playerX + offsetFromPlayer;
                bottomDepth = this.scene.boatManager.getDepthAtPosition(gameX);
            } else if (this.scene.iceHoleManager) {
                // Use ice hole manager's depth calculation
                bottomDepth = this.scene.iceHoleManager.getDepthAtPosition(this.x);
            }

            // Keep fish above lake bottom (with 5 feet buffer)
            const maxY = (bottomDepth - 5) * GameConfig.DEPTH_SCALE;
            this.y = Math.max(10, Math.min(maxY, this.y));

            // Convert world position to screen position based on player position
            if (isNatureSimulation) {
                this.x = this.worldX;
            } else {
                const offsetFromPlayer = this.worldX - playerWorldX;
                this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;
            }
        }

        return { updated: true };
    }

    feedOnBaitfish(preySpecies = 'alewife') {
        // Defensive check: Only predatory fish have hunger and health properties
        if (this.hunger === undefined || this.health === undefined) {
            return; // Not a predatory fish, skip feeding logic
        }

        // Fish has consumed a baitfish, reduce hunger based on prey nutrition value
        const speciesData = getBaitfishSpecies(preySpecies);
        const nutritionValue = speciesData.nutritionValue || 20; // Default to 20 if not specified

        // Different species provide different nutrition:
        // Cisco: 30 (large, nutritious)
        // Smelt: 25 (high-fat content)
        // Alewife: 20 (abundant, standard)
        // Perch: 18 (moderate)
        // Sculpin: 15 (small, less nutritious)

        const previousHunger = this.hunger;
        this.hunger = Math.max(0, this.hunger - nutritionValue);
        this.lastFed = this.frameAge;

        // HEALTH RESTORATION: Once hunger reaches 0%, excess food restores health
        if (previousHunger <= 0 && nutritionValue > 0) {
            // Fish is already satiated - nutrition goes to healing
            const healthGain = nutritionValue * 0.5; // 50% of nutrition converts to health
            const previousHealth = this.health;
            this.health = Math.min(100, this.health + healthGain);
            const actualHealthGain = this.health - previousHealth;
            if (actualHealthGain > 0) {
                console.log(`${this.name} restored ${actualHealthGain.toFixed(1)} health from eating ${preySpecies} (now ${Math.floor(this.health)}%)`);
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
