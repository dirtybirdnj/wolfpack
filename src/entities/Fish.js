import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import FishAI from './FishAI.js';
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

export class Fish {
    constructor(scene, x, y, size = 'MEDIUM', fishingType = null, species = 'lake_trout') {
        this.scene = scene;
        this.fishingType = fishingType || scene.fishingType; // Use provided fishingType or get from scene

        // Species data
        this.species = species;
        this.speciesData = getPredatorSpecies(species);

        // World coordinates (actual position in the lake)
        this.worldX = x;

        // Screen coordinates (for rendering - calculated based on player position)
        this.x = x;
        this.y = y;
        this.depth = y / GameConfig.DEPTH_SCALE;

        // Fish properties
        this.size = Constants.FISH_SIZE[size];
        this.weight = Utils.randomBetween(this.size.min, this.size.max);

        // Calculate length based on weight - species-specific formulas
        if (species === 'northern_pike') {
            // Northern pike: length in inches ≈ 13.5 * weight^0.28 (longer, more slender)
            this.length = Math.round(13.5 * Math.pow(this.weight, 0.28));
        } else {
            // Lake trout: length in inches ≈ 10.5 * weight^0.31
            this.length = Math.round(10.5 * Math.pow(this.weight, 0.31));
        }

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

        // AI controller - pass fishing type for thermocline behavior
        this.ai = new FishAI(this, this.fishingType);

        // Visual properties for sonar display
        this.sonarTrail = [];
        this.maxTrailLength = 30;
        this.sonarStrength = this.calculateSonarStrength();
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(10); // Render above sonar background but below UI

        // State
        this.caught = false;
        this.visible = true;
        this.frameAge = 0; // Frames on screen (for animation timing)

        // Biological properties - fish are hungrier and have faster metabolism
        this.hunger = Utils.randomBetween(50, 90); // 0-100, higher = more hungry (increased from 20-80)
        this.health = Utils.randomBetween(60, 100); // 0-100, higher = healthier
        this.lastFed = 0; // Game time when last fed
        this.metabolism = Utils.randomBetween(0.8, 1.2); // Individual metabolism rate

        // Frenzy behavior - lake trout get excited when they see others chasing
        this.inFrenzy = false;
        this.frenzyTimer = 0; // Time remaining in frenzy state
        this.frenzyIntensity = 0; // 0-1, increases with more frenzied fish nearby

        // Visual feedback for player actions triggering fish interest
        this.interestFlash = 0; // 0-1, fades over time to show interest level
        this.interestFlashDecay = 0.02; // How fast the flash fades per frame

        // Movement angle for realistic rotation
        this.angle = 0; // Rotation angle in radians based on movement direction
        this.targetAngle = 0; // Target angle to smoothly interpolate to

        // Chase mechanics
        this.speedPreference = Utils.randomBetween(1.0, 4.0); // Preferred lure speed
        this.swipeChances = 0; // Number of strike attempts remaining (set when engaged)
        this.maxSwipeChances = 0; // Maximum swipes for this engagement
        this.isEngaged = false; // Currently engaged in chase
        this.engagementState = 'waiting'; // attacking, waiting, loitering
        this.lastStateChange = 0; // Time of last state change
        this.isFastFleeing = false; // Fleeing at high speed after running out of swipes
        this.hasCalmedDown = false; // Whether fish has calmed down during fast flee
    }
    
    calculateBiologicalAge() {
        // Species-specific age-weight relationships
        if (this.species === 'northern_pike') {
            // Northern pike grow faster than lake trout, shorter lifespan
            if (this.weight <= 6) {
                // Small pike: 2-4 years
                return Math.round(Utils.randomBetween(2, 4));
            } else if (this.weight <= 15) {
                // Medium pike: 4-8 years
                return Math.round(Utils.randomBetween(4, 8));
            } else if (this.weight <= 25) {
                // Large pike: 8-14 years
                return Math.round(Utils.randomBetween(8, 14));
            } else {
                // Trophy pike: 14-22 years
                return Math.round(Utils.randomBetween(14, 22));
            }
        } else {
            // Lake trout age-weight relationship (slower growth, longer lived)
            if (this.weight <= 5) {
                // Small fish: 3-6 years
                return Math.round(Utils.randomBetween(3, 6));
            } else if (this.weight <= 12) {
                // Medium fish: 6-12 years
                return Math.round(Utils.randomBetween(6, 12));
            } else if (this.weight <= 25) {
                // Large fish: 12-20 years
                return Math.round(Utils.randomBetween(12, 20));
            } else {
                // Trophy fish: 20-30+ years
                return Math.round(Utils.randomBetween(20, 30));
            }
        }
    }

    calculateSonarStrength() {
        // Larger fish produce stronger sonar returns
        if (this.weight > 25) return 'strong';
        if (this.weight > 10) return 'medium';
        return 'weak';
    }

    updateBiology() {
        // Hunger increases based on metabolism (every ~2 seconds at 60fps, faster than before)
        // Fish now get hungry much faster and need to keep feeding
        if (this.frameAge % 120 === 0) { // Changed from 300 to 120 (5 sec -> 2 sec)
            const hungerIncrease = 1.5 * this.metabolism; // Base 1.5 per tick, modified by metabolism
            this.hunger = Math.min(100, this.hunger + hungerIncrease);
        }

        // Health is affected by hunger levels
        if (this.hunger > 85) {
            // Very hungry - health decreases faster
            if (this.frameAge % 300 === 0) { // Changed from 600 to 300 (twice as fast)
                this.health = Math.max(0, this.health - 0.8);
            }
        } else if (this.hunger < 30) {
            // Well fed - health increases
            if (this.frameAge % 600 === 0) {
                this.health = Math.min(100, this.health + 0.5);
            }
        }

        // Frenzy timer decay
        if (this.frenzyTimer > 0) {
            this.frenzyTimer--;
            if (this.frenzyTimer <= 0) {
                this.inFrenzy = false;
                this.frenzyIntensity = 0;
            }
        }

        // Decay interest flash over time
        if (this.interestFlash > 0) {
            this.interestFlash = Math.max(0, this.interestFlash - this.interestFlashDecay);
        }

        // Clamp values
        this.hunger = Math.max(0, Math.min(100, this.hunger));
        this.health = Math.max(0, Math.min(100, this.health));
    }

    /**
     * Trigger visual feedback when fish becomes interested
     * Higher intensity = closer to striking
     */
    triggerInterestFlash(intensity = 0.5) {
        // Set flash intensity (0-1 scale)
        // 0.5 = just noticed lure
        // 1.0 = about to strike
        this.interestFlash = Math.max(this.interestFlash, intensity);
    }

    getDepthZone() {
        // Determine which depth zone the fish is in
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
        // During active fight, fish position is controlled by FishFight
        // but we still want to render the fish normally
        const inActiveFight = this.scene.currentFight && this.scene.currentFight.active && this.scene.currentFight.fish === this;

        if (this.caught && !inActiveFight) {
            // Fish was caught but fight is over - show caught animation
            this.handleCaught();
            return;
        }

        this.frameAge++;

        // Update biological state
        this.updateBiology();

        // Update depth zone (fish may change zones as they move)
        this.depth = this.y / GameConfig.DEPTH_SCALE;
        this.depthZone = this.getDepthZone();
        this.speed = this.baseSpeed * this.depthZone.speedMultiplier;

        // During active fight, skip AI and movement updates (FishFight controls position)
        if (!inActiveFight) {
            // Update AI with info about other fish for frenzy detection AND baitfish for hunting
            this.ai.update(lure, this.scene.time.now, allFish, baitfishClouds);

            // Get movement from AI
            const movement = this.ai.getMovementVector();

            // Calculate angle based on target direction (what fish is chasing)
            // Fish should face toward their target, not based on velocity
            if (this.ai.targetX !== null && this.ai.targetY !== null) {
                // Calculate direction to target
                const dx = this.ai.targetX - this.x;
                const dy = this.ai.targetY - this.y;

                // Only update angle if target is meaningful distance away
                const distToTarget = Math.sqrt(dx * dx + dy * dy);
                if (distToTarget > 5) {
                    // Calculate target angle toward what the fish is chasing
                    // Canvas Y+ is down, so positive dy = target below, negative dy = target above
                    // Positive rotation = clockwise (fish points down)
                    // Negative rotation = counter-clockwise (fish points up)

                    // Normalize angle to work with left/right flipping
                    // When moving left, we need to mirror the angle
                    if (dx < 0) {
                        // Moving left - flip the angle
                        this.targetAngle = -Math.atan2(dy, Math.abs(dx));
                    } else {
                        // Moving right - use angle as-is
                        this.targetAngle = Math.atan2(dy, Math.abs(dx));
                    }

                    // Smoothly interpolate current angle to target angle for fluid motion
                    const angleDiff = this.targetAngle - this.angle;
                    this.angle += angleDiff * 0.15; // Smooth interpolation factor

                    // Clamp angle to reasonable limits (-45 to +45 degrees = -π/4 to +π/4)
                    const maxAngle = Math.PI / 4;
                    this.angle = Math.max(-maxAngle, Math.min(maxAngle, this.angle));
                }
            } else {
                // When idle (no target), gradually return to horizontal
                this.angle *= 0.9;
            }

            // Apply movement in world coordinates
            this.worldX += movement.x;
            this.y += movement.y;
            this.depth = this.y / GameConfig.DEPTH_SCALE;

            // Get lake bottom depth at fish's current position
            let bottomDepth = GameConfig.MAX_DEPTH;
            if (this.scene.boatManager) {
                bottomDepth = this.scene.boatManager.getDepthAtPosition(this.worldX);
            } else if (this.scene.iceHoleManager) {
                // For ice fishing, get bottom from current hole's profile
                const currentHole = this.scene.iceHoleManager.getCurrentHole();
                if (currentHole && currentHole.bottomProfile) {
                    const closest = currentHole.bottomProfile.reduce((prev, curr) =>
                        Math.abs(curr.x - this.x) < Math.abs(prev.x - this.x) ? curr : prev
                    );
                    bottomDepth = closest.y / GameConfig.DEPTH_SCALE;
                }
            }

            // Keep fish above lake bottom (with 5 feet buffer)
            const maxY = (bottomDepth - 5) * GameConfig.DEPTH_SCALE;

            // Keep fish in depth bounds
            this.y = Math.max(10, Math.min(maxY, this.y));

            // Convert world position to screen position based on player position
            let playerWorldX;
            if (this.scene.iceHoleManager) {
                const currentHole = this.scene.iceHoleManager.getCurrentHole();
                playerWorldX = currentHole ? currentHole.x : this.worldX;
            } else if (this.scene.boatManager) {
                playerWorldX = this.scene.boatManager.playerX;
            } else {
                playerWorldX = this.worldX; // Fallback
            }

            const offsetFromPlayer = this.worldX - playerWorldX;
            this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;

            // Update sonar trail
            this.updateSonarTrail();

            // Remove fish if too far from player in world coordinates (beyond ~500 units)
            const distanceFromPlayer = Math.abs(this.worldX - playerWorldX);
            if (distanceFromPlayer > 500) {
                this.visible = false;
            }
        }

        // Always render (whether in fight or not)
        this.render();
    }
    
    updateSonarTrail() {
        // Add current position to trail
        this.sonarTrail.push({
            x: this.x,
            y: this.y,
            strength: this.sonarStrength,
            age: 0
        });
        
        // Age trail points and remove old ones
        this.sonarTrail = this.sonarTrail.filter(point => {
            point.age++;
            return point.age < this.maxTrailLength;
        });
    }
    
    render() {
        this.graphics.clear();

        if (!this.visible) return;

        const bodySize = Math.max(8, this.weight / 2);

        // Get movement direction to orient the fish
        const movement = this.ai.getMovementVector();
        const isMovingRight = movement.x >= 0;

        // Render species-specific fish
        if (this.species === 'northern_pike') {
            this.renderNorthernPike(bodySize, isMovingRight);
        } else {
            this.renderLakeTrout(bodySize, isMovingRight);
        }

        // Interest flash - green circle that fades to show player triggered interest
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

    renderLakeTrout(bodySize, isMovingRight) {
        // Save graphics state and apply rotation
        this.graphics.save();
        this.graphics.translateCanvas(this.x, this.y);

        if (isMovingRight) {
            this.graphics.rotateCanvas(this.angle);
        } else {
            this.graphics.scaleCanvas(-1, 1);
            this.graphics.rotateCanvas(-this.angle);
        }

        // Main body - grayish-olive color
        this.graphics.fillStyle(GameConfig.COLOR_FISH_BODY, 1.0);
        this.graphics.fillEllipse(0, 0, bodySize * 2.5, bodySize * 0.8);

        // Belly - cream/pinkish lighter color
        this.graphics.fillStyle(GameConfig.COLOR_FISH_BELLY, 0.8);
        this.graphics.fillEllipse(0, bodySize * 0.2, bodySize * 2.2, bodySize * 0.5);

        // Tail fin
        const tailSize = bodySize * 0.7;
        const tailX = -bodySize * 1.25;
        const tailY = 0;

        this.graphics.fillStyle(GameConfig.COLOR_FISH_FINS, 0.9);
        this.graphics.beginPath();
        this.graphics.moveTo(tailX, tailY);
        this.graphics.lineTo(tailX - tailSize, tailY - tailSize * 0.6);
        this.graphics.lineTo(tailX - tailSize, tailY + tailSize * 0.6);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Dorsal and pectoral fins
        this.graphics.fillStyle(GameConfig.COLOR_FISH_FINS, 0.7);
        this.graphics.fillTriangle(
            0, -bodySize * 0.5,
            -bodySize * 0.3, -bodySize * 1.2,
            bodySize * 0.3, -bodySize * 1.2
        );
        const finX = -bodySize * 0.3;
        this.graphics.fillTriangle(
            finX, 0,
            finX - bodySize * 0.4, -bodySize * 0.3,
            finX - bodySize * 0.4, bodySize * 0.3
        );

        this.graphics.restore();
    }

    renderNorthernPike(bodySize, isMovingRight) {
        // Northern pike - torpedo-shaped, olive green with cream oval spots
        const colors = this.speciesData.appearance.colorScheme;

        this.graphics.save();
        this.graphics.translateCanvas(this.x, this.y);

        if (isMovingRight) {
            this.graphics.rotateCanvas(this.angle);
        } else {
            this.graphics.scaleCanvas(-1, 1);
            this.graphics.rotateCanvas(-this.angle);
        }

        // Pike body - long and cylindrical (torpedo-shaped)
        // Pike are longer and more slender than trout
        const pikeLength = bodySize * 3.2; // Longer than trout (2.5)
        const pikeHeight = bodySize * 0.6; // More slender than trout (0.8)

        // Main body - olive green
        this.graphics.fillStyle(colors.base, 1.0);
        this.graphics.fillEllipse(0, 0, pikeLength, pikeHeight);

        // Belly - light cream
        this.graphics.fillStyle(colors.belly, 0.9);
        this.graphics.fillEllipse(0, pikeHeight * 0.15, pikeLength * 0.9, pikeHeight * 0.4);

        // Characteristic cream/white oval spots in horizontal rows
        this.graphics.fillStyle(colors.spots, 0.8);
        const spotsPerRow = 5;
        const spotSpacing = pikeLength / (spotsPerRow + 1);

        // Upper row of spots
        for (let i = 0; i < spotsPerRow; i++) {
            const spotX = -pikeLength * 0.4 + (i * spotSpacing);
            const spotY = -pikeHeight * 0.15;
            this.graphics.fillEllipse(spotX, spotY, bodySize * 0.25, bodySize * 0.15);
        }

        // Middle row of spots
        for (let i = 0; i < spotsPerRow; i++) {
            const spotX = -pikeLength * 0.35 + (i * spotSpacing);
            const spotY = 0;
            this.graphics.fillEllipse(spotX, spotY, bodySize * 0.25, bodySize * 0.15);
        }

        // Tail - pike have a distinctive forked tail
        const tailSize = bodySize * 0.8;
        const tailX = -pikeLength * 0.45;

        this.graphics.fillStyle(colors.fins, 0.9);
        this.graphics.beginPath();
        this.graphics.moveTo(tailX, 0);
        this.graphics.lineTo(tailX - tailSize * 0.8, -tailSize * 0.7);
        this.graphics.lineTo(tailX - tailSize * 0.8, tailSize * 0.7);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Dorsal fin - far back on pike (near tail)
        this.graphics.fillStyle(colors.fins, 0.75);
        const dorsalX = -pikeLength * 0.25;
        this.graphics.fillTriangle(
            dorsalX, -pikeHeight * 0.4,
            dorsalX - bodySize * 0.5, -pikeHeight * 1.3,
            dorsalX + bodySize * 0.3, -pikeHeight * 1.0
        );

        // Pectoral fins
        const finX = -bodySize * 0.2;
        this.graphics.fillTriangle(
            finX, 0,
            finX - bodySize * 0.3, -pikeHeight * 0.25,
            finX - bodySize * 0.3, pikeHeight * 0.25
        );

        this.graphics.restore();
    }
    
    handleCaught() {
        // Animation when fish is caught
        this.graphics.clear();
        this.graphics.lineStyle(3, GameConfig.COLOR_FISH_STRONG, 1);
        this.graphics.strokeCircle(this.x, this.y, 15);
        this.graphics.lineStyle(2, GameConfig.COLOR_LURE, 0.8);
        this.graphics.strokeCircle(this.x, this.y, 20);

        // Remove after animation
        setTimeout(() => {
            this.visible = false;
        }, 500);
    }

    feedOnBaitfish(preySpecies = 'alewife') {
        // Fish has consumed a baitfish, reduce hunger based on prey nutrition value
        const speciesData = getBaitfishSpecies(preySpecies);
        const nutritionValue = speciesData.nutritionValue || 20; // Default to 20 if not specified

        // Different species provide different nutrition:
        // Cisco: 30 (large, nutritious)
        // Smelt: 25 (high-fat content)
        // Alewife: 20 (abundant, standard)
        // Perch: 18 (moderate)
        // Sculpin: 15 (small, less nutritious)

        this.hunger = Math.max(0, this.hunger - nutritionValue);
        this.lastFed = this.frameAge;

        // Log feeding for debugging (commented out for production)
        // console.log(`${this.name} fed on ${preySpecies}, hunger reduced by ${nutritionValue} (now ${Math.floor(this.hunger)}%)`);
    }

    getInfo() {
        return {
            name: `${this.name} the ${this.speciesData.name}`,
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
     * Render fish at a custom position and scale (for catch popup)
     */
    renderAtPosition(graphics, x, y, scale = 3) {
        const bodySize = Math.max(8, this.weight / 2) * scale;

        graphics.save();
        graphics.translateCanvas(x, y);
        graphics.scaleCanvas(1, 1); // Always face right for popup
        graphics.rotateCanvas(0); // Horizontal orientation

        if (this.species === 'northern_pike') {
            this.renderNorthernPikeAtPosition(graphics, bodySize);
        } else {
            this.renderLakeTroutAtPosition(graphics, bodySize);
        }

        graphics.restore();
    }

    renderLakeTroutAtPosition(graphics, bodySize) {
        // Main body - grayish-olive color
        graphics.fillStyle(GameConfig.COLOR_FISH_BODY, 1.0);
        graphics.fillEllipse(0, 0, bodySize * 2.5, bodySize * 0.8);

        // Belly - cream/pinkish lighter color
        graphics.fillStyle(GameConfig.COLOR_FISH_BELLY, 0.8);
        graphics.fillEllipse(0, bodySize * 0.2, bodySize * 2.2, bodySize * 0.5);

        // Tail fin
        const tailSize = bodySize * 0.7;
        const tailX = -bodySize * 1.25;

        graphics.fillStyle(GameConfig.COLOR_FISH_FINS, 0.9);
        graphics.beginPath();
        graphics.moveTo(tailX, 0);
        graphics.lineTo(tailX - tailSize, -tailSize * 0.6);
        graphics.lineTo(tailX - tailSize, tailSize * 0.6);
        graphics.closePath();
        graphics.fillPath();

        // Dorsal and pectoral fins
        graphics.fillStyle(GameConfig.COLOR_FISH_FINS, 0.7);
        graphics.fillTriangle(
            0, -bodySize * 0.5,
            -bodySize * 0.3, -bodySize * 1.2,
            bodySize * 0.3, -bodySize * 1.2
        );
        const finX = -bodySize * 0.3;
        graphics.fillTriangle(
            finX, 0,
            finX - bodySize * 0.4, -bodySize * 0.3,
            finX - bodySize * 0.4, bodySize * 0.3
        );
    }

    renderNorthernPikeAtPosition(graphics, bodySize) {
        const colors = this.speciesData.appearance.colorScheme;

        // Pike body - longer and more slender
        const pikeLength = bodySize * 3.2;
        const pikeHeight = bodySize * 0.6;

        // Main body - olive green
        graphics.fillStyle(colors.base, 1.0);
        graphics.fillEllipse(0, 0, pikeLength, pikeHeight);

        // Belly - light cream
        graphics.fillStyle(colors.belly, 0.9);
        graphics.fillEllipse(0, pikeHeight * 0.15, pikeLength * 0.9, pikeHeight * 0.4);

        // Cream/white oval spots in horizontal rows
        graphics.fillStyle(colors.spots, 0.8);
        const spotsPerRow = 5;
        const spotSpacing = pikeLength / (spotsPerRow + 1);

        for (let i = 0; i < spotsPerRow; i++) {
            const spotX = -pikeLength * 0.4 + (i * spotSpacing);
            const spotY = -pikeHeight * 0.15;
            graphics.fillEllipse(spotX, spotY, bodySize * 0.25, bodySize * 0.15);
        }

        for (let i = 0; i < spotsPerRow; i++) {
            const spotX = -pikeLength * 0.35 + (i * spotSpacing);
            const spotY = 0;
            graphics.fillEllipse(spotX, spotY, bodySize * 0.25, bodySize * 0.15);
        }

        // Tail - forked
        const tailSize = bodySize * 0.8;
        const tailX = -pikeLength * 0.45;

        graphics.fillStyle(colors.fins, 0.9);
        graphics.beginPath();
        graphics.moveTo(tailX, 0);
        graphics.lineTo(tailX - tailSize * 0.8, -tailSize * 0.7);
        graphics.lineTo(tailX - tailSize * 0.8, tailSize * 0.7);
        graphics.closePath();
        graphics.fillPath();

        // Dorsal fin - far back
        graphics.fillStyle(colors.fins, 0.75);
        const dorsalX = -pikeLength * 0.25;
        graphics.fillTriangle(
            dorsalX, -pikeHeight * 0.4,
            dorsalX - bodySize * 0.5, -pikeHeight * 1.3,
            dorsalX + bodySize * 0.3, -pikeHeight * 1.0
        );

        // Pectoral fins
        const finX = -bodySize * 0.2;
        graphics.fillTriangle(
            finX, 0,
            finX - bodySize * 0.3, -pikeHeight * 0.25,
            finX - bodySize * 0.3, pikeHeight * 0.25
        );
    }

    destroy() {
        this.graphics.destroy();
        if (this.speedPrefText) {
            this.speedPrefText.destroy();
        }
    }
}

export default Fish;
