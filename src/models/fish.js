import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import FishAI from '../entities/FishAI.js';
import { getBaitfishSpecies, getPredatorSpecies } from '../config/SpeciesData.js';

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
 * Base Fish class - biological model for all fish species
 * This class contains the common properties and behaviors shared by all fish
 */
export class Fish {
    constructor(scene, x, y, size = 'MEDIUM', fishingType = null, species = 'lake_trout') {
        this.scene = scene;
        this.fishingType = fishingType || scene.fishingType;

        // Species data
        this.species = species;
        this.speciesData = getPredatorSpecies(species);

        // World coordinates (actual position in the lake)
        this.worldX = x;

        // Screen coordinates (for rendering - calculated based on player position)
        let playerWorldX;
        if (scene.iceHoleManager) {
            const currentHole = scene.iceHoleManager.getCurrentHole();
            playerWorldX = currentHole ? currentHole.x : x;
        } else if (scene.boatManager) {
            playerWorldX = scene.boatManager.getPlayerWorldX();
        } else {
            playerWorldX = x;
        }

        const offsetFromPlayer = this.worldX - playerWorldX;
        this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;
        this.y = y;
        this.depth = y / GameConfig.DEPTH_SCALE;

        // Fish properties
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

        // AI controller
        this.ai = new FishAI(this, this.fishingType);

        // Visual properties for sonar display
        this.sonarTrail = [];
        this.maxTrailLength = 30;
        this.sonarStrength = this.calculateSonarStrength();
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(10);

        // External artwork sprite (if available)
        this.sprite = null;
        this.tryLoadArtwork();

        // State
        this.caught = false;
        this.visible = true;
        this.frameAge = 0;

        // Biological properties
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

        // Movement angle for realistic rotation
        this.angle = 0;
        this.targetAngle = 0;

        // Chase mechanics
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
     * Can be overridden by species for species-specific formulas
     */
    calculateLength() {
        // Default: Lake trout formula
        return Math.round(10.5 * Math.pow(this.weight, 0.31));
    }

    /**
     * Calculate biological age from weight
     * Can be overridden by species for species-specific age ranges
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

    tryLoadArtwork() {
        const sizeCategory = this.weight > 30 ? 'trophy' :
                           this.weight > 15 ? 'large' :
                           this.weight > 5 ? 'medium' : 'small';

        const textureKeys = [
            `fish_${this.species}_${sizeCategory}`,
            `fish_${this.species}`
        ];

        for (const key of textureKeys) {
            if (this.scene.textures.exists(key)) {
                this.sprite = this.scene.add.sprite(this.x, this.y, key);
                this.sprite.setDepth(10);
                this.sprite.setOrigin(0.5, 0.5);

                const baseScale = Math.max(0.3, this.weight / 20);
                this.sprite.setScale(baseScale);

                console.log(`✓ Loaded artwork for ${this.species} (${sizeCategory}): ${key}`);
                return;
            }
        }
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
            this.handleCaught();
            return;
        }

        this.frameAge++;
        this.updateBiology();

        this.depth = this.y / GameConfig.DEPTH_SCALE;
        this.depthZone = this.getDepthZone();
        this.speed = this.baseSpeed * this.depthZone.speedMultiplier;

        if (!inActiveFight) {
            this.ai.update(lure, this.scene.time.now, allFish, baitfishClouds);

            const movement = this.ai.getMovementVector();

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

            this.worldX += movement.x;
            this.y += movement.y;
            this.depth = this.y / GameConfig.DEPTH_SCALE;

            let playerWorldX;
            if (this.scene.iceHoleManager) {
                const currentHole = this.scene.iceHoleManager.getCurrentHole();
                playerWorldX = currentHole ? currentHole.x : this.worldX;
            } else if (this.scene.boatManager) {
                playerWorldX = this.scene.boatManager.getPlayerWorldX();
            } else {
                playerWorldX = this.worldX;
            }

            const maxDistanceFromPlayer = 800;
            const distanceFromPlayer = Math.abs(this.worldX - playerWorldX);

            if (distanceFromPlayer > maxDistanceFromPlayer) {
                this.visible = false;
                return;
            }

            let bottomDepth = GameConfig.MAX_DEPTH;
            if (this.scene.boatManager) {
                const offsetFromPlayer = this.x - (GameConfig.CANVAS_WIDTH / 2);
                const gameX = this.scene.boatManager.playerX + offsetFromPlayer;
                bottomDepth = this.scene.boatManager.getDepthAtPosition(gameX);
            } else if (this.scene.iceHoleManager) {
                const currentHole = this.scene.iceHoleManager.getCurrentHole();
                if (currentHole && currentHole.bottomProfile) {
                    const closest = currentHole.bottomProfile.reduce((prev, curr) =>
                        Math.abs(curr.x - this.x) < Math.abs(prev.x - this.x) ? curr : prev
                    );
                    bottomDepth = closest.y / GameConfig.DEPTH_SCALE;
                }
            }

            const maxY = (bottomDepth - 5) * GameConfig.DEPTH_SCALE;
            this.y = Math.max(10, Math.min(maxY, this.y));

            const offsetFromPlayer = this.worldX - playerWorldX;
            this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;

            this.updateSonarTrail();
        }

        this.render();
    }

    updateSonarTrail() {
        this.sonarTrail.push({
            x: this.x,
            y: this.y,
            strength: this.sonarStrength,
            age: 0
        });

        this.sonarTrail = this.sonarTrail.filter(point => {
            point.age++;
            return point.age < this.maxTrailLength;
        });
    }

    /**
     * Render the fish - delegates to species-specific rendering
     * Should be overridden by species classes
     */
    render() {
        this.graphics.clear();

        if (!this.visible) {
            if (this.sprite) this.sprite.setVisible(false);
            return;
        }

        const bodySize = Math.max(8, this.weight / 2);
        const movement = this.ai.getMovementVector();
        const isMovingRight = movement.x >= 0;

        if (this.sprite) {
            this.sprite.setVisible(true);
            this.sprite.setPosition(this.x, this.y);
            this.sprite.setFlipX(!isMovingRight);
        } else {
            this.renderBody(bodySize, isMovingRight);
        }

        // Interest flash
        if (this.interestFlash > 0) {
            const flashSize = bodySize * (2 + (1 - this.interestFlash) * 1.5);
            const flashAlpha = this.interestFlash * 0.8;

            this.graphics.lineStyle(3, 0x00ff00, flashAlpha);
            this.graphics.strokeCircle(this.x, this.y, flashSize);

            if (this.interestFlash > 0.7) {
                const pulseSize = flashSize + Math.sin(this.frameAge * 0.3) * 4;
                this.graphics.lineStyle(2, 0x00ff00, flashAlpha * 0.5);
                this.graphics.strokeCircle(this.x, this.y, pulseSize);
            }
        }
    }

    /**
     * Render fish body - should be overridden by species classes
     */
    renderBody(bodySize, isMovingRight) {
        // Default rendering - should be overridden by species
        this.graphics.save();
        this.graphics.translateCanvas(this.x, this.y);

        if (isMovingRight) {
            this.graphics.rotateCanvas(this.angle);
        } else {
            this.graphics.scaleCanvas(-1, 1);
            this.graphics.rotateCanvas(-this.angle);
        }

        this.graphics.fillStyle(GameConfig.COLOR_FISH_BODY, 1.0);
        this.graphics.fillEllipse(0, 0, bodySize * 2.5, bodySize * 0.8);

        this.graphics.restore();
    }

    /**
     * Render fish at a custom position and scale (for catch popup)
     * Should be overridden by species classes
     */
    renderAtPosition(graphics, x, y, scale = 3) {
        const bodySize = Math.max(8, this.weight / 2) * scale;

        graphics.save();
        graphics.translateCanvas(x, y);
        graphics.scaleCanvas(1, 1);
        graphics.rotateCanvas(0);

        this.renderBodyAtPosition(graphics, bodySize);

        graphics.restore();
    }

    /**
     * Render fish body at position - should be overridden by species classes
     */
    renderBodyAtPosition(graphics, bodySize) {
        // Default rendering
        graphics.fillStyle(GameConfig.COLOR_FISH_BODY, 1.0);
        graphics.fillEllipse(0, 0, bodySize * 2.5, bodySize * 0.8);
    }

    handleCaught() {
        this.graphics.clear();
        this.graphics.lineStyle(3, GameConfig.COLOR_FISH_STRONG, 1);
        this.graphics.strokeCircle(this.x, this.y, 15);
        this.graphics.lineStyle(2, GameConfig.COLOR_LURE, 0.8);
        this.graphics.strokeCircle(this.x, this.y, 20);

        setTimeout(() => {
            this.visible = false;
        }, 500);
    }

    feedOnBaitfish(preySpecies = 'alewife') {
        const speciesData = getBaitfishSpecies(preySpecies);
        const nutritionValue = speciesData.nutritionValue || 20;

        this.hunger = Math.max(0, this.hunger - nutritionValue);
        this.lastFed = this.frameAge;
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

    destroy() {
        this.graphics.destroy();
        if (this.speedPrefText) {
            this.speedPrefText.destroy();
        }
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

export default Fish;
