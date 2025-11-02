import GameConfig from '../config/GameConfig.js';
import LakeTrout from '../models/species/LakeTrout.js';
import NorthernPike from '../models/species/NorthernPike.js';
import SmallmouthBass from '../models/species/SmallmouthBass.js';
import YellowPerch from '../models/species/YellowPerch.js';
import { BAITFISH_SPECIES } from '../config/SpeciesData.js';

/**
 * Fish - Unified fish entity for ALL fish (predators and baitfish)
 * Supports both AI-driven behavior (predators) and schooling behavior (baitfish)
 * Composes with Fish model classes and handles visual display
 */
export class Fish {
    constructor(scene, x, y, size = 'MEDIUM', species = 'lake_trout') {
        this.scene = scene;
        // Store species name internally (not as property, since we have a getter)
        this._speciesName = species;

        // Detect if this is a baitfish species
        this.isBaitfish = BAITFISH_SPECIES.hasOwnProperty(species);

        // Create the appropriate model based on species
        this.model = this.createModel(scene, x, y, size, species);

        // Phaser-specific visual elements
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(10);

        // External artwork sprite (if available)
        this.sprite = null;
        this.tryLoadArtwork();

        // Sonar trail (visual only)
        this.sonarTrail = [];
        this.maxTrailLength = 30;

        // Schooling behavior (for baitfish and schooling predators)
        if (this.isBaitfish) {
            this.initializeSchoolingBehavior();
        }
    }

    /**
     * Initialize schooling behavior for baitfish
     */
    initializeSchoolingBehavior() {
        const speciesData = BAITFISH_SPECIES[this._speciesName];

        // Boids parameters based on species schooling density
        const densityMap = {
            'very_high': { separation: 15, alignment: 40, cohesion: 40 },
            'high': { separation: 20, alignment: 50, cohesion: 50 },
            'moderate': { separation: 30, alignment: 60, cohesion: 60 },
            'low': { separation: 40, alignment: 80, cohesion: 80 },
            'none': { separation: 60, alignment: 100, cohesion: 100 }
        };

        const params = densityMap[speciesData.schoolingDensity] || densityMap['moderate'];

        this.schooling = {
            enabled: true,
            // Base Boids radii (will be modified by scaredLevel)
            baseSeparationRadius: params.separation,
            baseAlignmentRadius: params.alignment,
            baseCohesionRadius: params.cohesion,
            separationRadius: params.separation,
            alignmentRadius: params.alignment,
            cohesionRadius: params.cohesion,
            perceptionRadius: Math.max(params.alignment, params.cohesion),

            // Force weights
            separationWeight: 1.5,
            alignmentWeight: 1.0,
            cohesionWeight: 1.0,
            fleeWeight: 3.0,

            // Velocity for schooling movement
            velocity: { x: 0, y: 0 },
            maxSpeed: speciesData.speed.base,
            panicSpeed: speciesData.speed.panic,

            // State (like old BaitfishCloud)
            isPanicking: false,
            panicTimer: 0,
            scaredLevel: 0, // 0-1, increases when predators nearby
            spreadMultiplier: 1.0 // 1.0 = normal, 0.5 = tight cluster, 2.0 = very loose
        };

        // Update frequency optimization
        this.schoolingUpdateFrequency = 2; // Update every N frames
        this.schoolingFrameCount = 0;
    }

    /**
     * Factory method to create the appropriate species model
     */
    createModel(scene, x, y, size, species) {
        // Baitfish get a simple model (no AI)
        if (this.isBaitfish) {
            return this.createBaitfishModel(scene, x, y, species);
        }

        // Predator fish get species-specific models with AI
        switch(species) {
            case 'lake_trout':
                return new LakeTrout(scene, x, y, size);
            case 'northern_pike':
                return new NorthernPike(scene, x, y, size);
            case 'smallmouth_bass':
                return new SmallmouthBass(scene, x, y, size);
            case 'yellow_perch_large':
                return new YellowPerch(scene, x, y, size);
            default:
                return new LakeTrout(scene, x, y, size);
        }
    }

    /**
     * Create a simple model for baitfish (no AI needed)
     */
    createBaitfishModel(scene, x, y, species) {
        const speciesData = BAITFISH_SPECIES[species];

        return {
            scene,
            x,
            y,
            worldX: x,
            depth: 30, // Default depth in feet
            species,
            speciesData,
            visible: true,
            consumed: false,
            size: (speciesData.sizeRange.min + speciesData.sizeRange.max) / 2,
            length: speciesData.sizeRange.max,
            weight: speciesData.weightRange.max,
            sonarStrength: 0.3, // Weak sonar return for small fish

            // Properties that Fish entity getters expect (for compatibility)
            depthZone: 'mid', // Baitfish are typically mid-water
            points: 0, // No points for baitfish
            name: `${species} baitfish`,
            gender: 'unknown',
            age: 0,
            caught: false,
            ai: null, // Baitfish don't have AI
            hunger: 0,
            health: 100,
            inFrenzy: false,
            frenzyIntensity: 0,
            interestFlash: 0,
            frameAge: 0,
            angle: 0,

            // Render baitfish with species-specific appearance (matches old BaitfishModel)
            render(graphics, bodySize, isMovingRight) {
                if (!this.visible || this.consumed) return;

                // Color
                const color = speciesData.color || 0x88ccff;

                // Body proportions from species appearance
                const appearance = speciesData.appearance || {
                    bodyShape: 'streamlined',
                    length: 1.0,
                    height: 1.0
                };
                const bodyLength = bodySize * 1.5 * appearance.length;
                const bodyHeight = bodySize * 0.7 * appearance.height;

                // Draw body based on species shape (solid opacity)
                graphics.fillStyle(color, 0.6);

                if (appearance.bodyShape === 'slender') {
                    // Slender, elongated (smelt, cisco)
                    graphics.fillEllipse(this.x, this.y, bodyLength * 1.2, bodyHeight * 0.6);
                } else if (appearance.bodyShape === 'deep') {
                    // Deep-bodied (alewife, perch)
                    graphics.fillEllipse(this.x, this.y, bodyLength, bodyHeight * 1.1);
                } else if (appearance.bodyShape === 'bottom') {
                    // Bottom-dwelling (sculpin) - flattened
                    graphics.fillEllipse(this.x, this.y, bodyLength * 0.9, bodyHeight * 0.5);
                } else {
                    // Default streamlined shape
                    graphics.fillEllipse(this.x, this.y, bodyLength, bodyHeight);
                }

                // Brighter center dot (solid, no flicker)
                graphics.fillStyle(color, 0.9);
                graphics.fillCircle(this.x, this.y, bodySize * 0.4);
            },

            // Methods that Fish entity might call
            destroy() {
                // Simple cleanup for baitfish model
                // No AI to clean up, just mark as consumed
                this.visible = false;
                this.consumed = true;
            },

            // Stub methods for compatibility (baitfish don't use these)
            feedOnBaitfish(preySpecies) {
                return false; // Baitfish don't eat other fish
            },

            triggerInterestFlash(intensity) {
                // Baitfish don't show interest flashes
                return;
            },

            getInfo() {
                return {
                    species: this.species,
                    length: this.length,
                    weight: this.weight,
                    name: this.name
                };
            },

            renderAtPosition(graphics, x, y, bodySize) {
                // Render at custom position (for catch popup - not used for baitfish)
                // Just render at the specified position
                const tempX = this.x;
                const tempY = this.y;
                this.x = x;
                this.y = y;
                this.render(graphics, bodySize, true);
                this.x = tempX;
                this.y = tempY;
            }
        };
    }

    /**
     * Try to load external artwork for this fish species
     * Checks for artwork files in assets/fish/{species}/ directory
     * Falls back to procedural rendering if no artwork found
     */
    tryLoadArtwork() {
        // Defensive check: Ensure model has weight property (only Fish models have this)
        if (this.model.weight === undefined) {
            return; // Not a fish model, skip artwork loading
        }

        // Get size category for the artwork filename
        const sizeCategory = this.model.weight > 30 ? 'trophy' :
                           this.model.weight > 15 ? 'large' :
                           this.model.weight > 5 ? 'medium' : 'small';

        // Build potential texture keys to check
        const textureKeys = [
            `fish_${this.model.species}_${sizeCategory}`, // Size-specific
            `fish_${this.model.species}`                  // Species default
        ];

        // Try to find a loaded texture
        for (const key of textureKeys) {
            if (this.scene.textures.exists(key)) {
                // Create sprite from texture
                this.sprite = this.scene.add.sprite(this.model.x, this.model.y, key);
                this.sprite.setDepth(10);
                this.sprite.setOrigin(0.5, 0.5);

                // Scale sprite based on fish weight
                const baseScale = Math.max(0.3, this.model.weight / 20);
                this.sprite.setScale(baseScale);

                console.log(`✓ Loaded artwork for ${this.model.species} (${sizeCategory}): ${key}`);
                return;
            }
        }

        // No artwork found - will use procedural rendering
    }

    /**
     * Update fish - delegates logic to model, handles rendering
     */
    update(lure, allFish = [], baitfishClouds = []) {
        // Baitfish use schooling behavior instead of AI
        if (this.isBaitfish) {
            // Store allFish array for schooling neighbor queries
            this.allFishInScene = allFish;
            this.updateSchooling();
            this.updateSonarTrail();
            this.render();
            return;
        }

        // Predator fish use AI and model logic
        const result = this.model.update(lure, allFish, baitfishClouds);

        // Handle result from model
        if (result && result.caught) {
            this.handleCaught();
            return;
        }

        if (result && result.removed) {
            return;
        }

        // Update sonar trail
        this.updateSonarTrail();

        // Always render (whether in fight or not)
        this.render();
    }

    updateSonarTrail() {
        // Add current position to trail
        this.sonarTrail.push({
            x: this.model.x,
            y: this.model.y,
            strength: this.model.sonarStrength,
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

        if (!this.model.visible) {
            if (this.sprite) {this.sprite.setVisible(false);}
            return;
        }

        const bodySize = Math.max(8, this.model.weight / 2);

        // Get movement direction to orient the fish
        let isMovingRight = true; // Default

        if (this.isBaitfish && this.schooling) {
            // Baitfish use schooling velocity
            isMovingRight = this.schooling.velocity.x >= 0;
        } else if (this.model.ai) {
            // Predators use AI movement vector
            const movement = this.model.ai.getMovementVector();
            isMovingRight = movement.x >= 0;
        }

        // If we have external artwork sprite, use it instead of procedural rendering
        if (this.sprite) {
            this.sprite.setVisible(true);
            this.sprite.setPosition(this.model.x, this.model.y);
            this.sprite.setFlipX(!isMovingRight); // Flip sprite to face movement direction
        } else {
            // Delegate rendering to the model
            this.model.render(this.graphics, bodySize, isMovingRight);
        }

        // Interest flash - green circle that fades to show player triggered interest
        // (Only for predators with AI)
        if (this.model.interestFlash && this.model.interestFlash > 0) {
            const flashSize = bodySize * (2 + (1 - this.model.interestFlash) * 1.5);
            const flashAlpha = this.model.interestFlash * 0.8;

            this.graphics.lineStyle(3, 0x00ff00, flashAlpha);
            this.graphics.strokeCircle(this.model.x, this.model.y, flashSize);

            if (this.model.interestFlash > 0.7) {
                const pulseSize = flashSize + Math.sin(this.model.frameAge * 0.3) * 4;
                this.graphics.lineStyle(2, 0x00ff00, flashAlpha * 0.5);
                this.graphics.strokeCircle(this.model.x, this.model.y, pulseSize);
            }
        }

        // Frenzy indicator - red dot below fish when frenzying
        if (this.model.inFrenzy) {
            const dotY = this.model.y + bodySize + 5; // Position below fish
            this.graphics.fillStyle(0xff0000, 0.9);
            this.graphics.fillCircle(this.model.x, dotY, 3);
        }

        // Selection circle - white circle around selected fish from status panel
        if (this.scene.selectedFishId && this.model.id === this.scene.selectedFishId) {
            const selectionSize = bodySize * 2.5;
            const pulseOffset = Math.sin(Date.now() * 0.005) * 3;

            this.graphics.lineStyle(2, 0xffffff, 0.9);
            this.graphics.strokeCircle(this.model.x, this.model.y, selectionSize + pulseOffset);
            this.graphics.lineStyle(1, 0xffffff, 0.5);
            this.graphics.strokeCircle(this.model.x, this.model.y, selectionSize + pulseOffset + 4);
        }
    }

    handleCaught() {
        // Animation when fish is caught
        this.graphics.clear();
        this.graphics.lineStyle(3, GameConfig.COLOR_FISH_STRONG, 1);
        this.graphics.strokeCircle(this.model.x, this.model.y, 15);
        this.graphics.lineStyle(2, GameConfig.COLOR_LURE, 0.8);
        this.graphics.strokeCircle(this.model.x, this.model.y, 20);

        // Remove after animation
        setTimeout(() => {
            this.model.visible = false;
        }, 500);
    }

    // Delegate property access to model
    get x() { return this.model.x; }
    set x(value) { this.model.x = value; }

    get y() { return this.model.y; }
    set y(value) { this.model.y = value; }

    get worldX() { return this.model.worldX; }
    set worldX(value) { this.model.worldX = value; }

    get depth() { return this.model.depth; }
    get depthZone() { return this.model.depthZone; }
    get weight() { return this.model.weight; }
    get length() { return this.model.length; }
    get size() { return this.model.size; }
    get points() { return this.model.points; }
    get species() { return this.model.species; }
    get speciesData() { return this.model.speciesData; }
    get name() { return this.model.name; }
    get gender() { return this.model.gender; }
    get age() { return this.model.age; }
    get visible() { return this.model.visible; }
    set visible(value) { this.model.visible = value; }
    get caught() { return this.model.caught; }
    set caught(value) { this.model.caught = value; }
    get ai() { return this.model.ai; }
    get hunger() { return this.model.hunger; }
    get health() { return this.model.health; }
    get inFrenzy() { return this.model.inFrenzy; }
    get frenzyIntensity() { return this.model.frenzyIntensity; }
    get interestFlash() { return this.model.interestFlash; }
    get frameAge() { return this.model.frameAge; }
    get angle() { return this.model.angle; }
    get sonarStrength() { return this.model.sonarStrength; }
    get stomachContents() { return this.model.stomachContents; }

    // Delegate methods to model
    feedOnBaitfish(preySpecies) {
        return this.model.feedOnBaitfish(preySpecies);
    }

    triggerInterestFlash(intensity) {
        return this.model.triggerInterestFlash(intensity);
    }

    getInfo() {
        return this.model.getInfo();
    }

    destroy() {
        // Destroy Phaser visual elements
        this.graphics.destroy();
        if (this.sprite) {
            this.sprite.destroy();
        }

        // Cleanup model
        this.model.destroy();
    }

    /**
     * Render fish at a custom position and scale (for catch popup)
     */
    renderAtPosition(graphics, x, y, scale = 3) {
        const bodySize = Math.max(8, this.model.weight / 2) * scale;

        // Delegate rendering to the model with explicit coordinates
        // Model will render at the specified position without transformations
        this.model.renderAtPosition(graphics, x, y, bodySize);
    }

    // ==================== SCHOOLING BEHAVIOR (BOIDS ALGORITHM) ====================

    /**
     * Update schooling behavior using Boids algorithm
     * Called from update() for baitfish
     */
    updateSchooling() {
        if (!this.schooling || !this.schooling.enabled) return;

        // Optimize: only update every N frames
        if (this.schoolingFrameCount++ % this.schoolingUpdateFrequency !== 0) {
            return;
        }

        // Find nearby fish from my group
        const neighbors = this.findNearbySchoolmates();

        // Calculate Boids forces
        const separation = this.calculateSeparation(neighbors);
        const alignment = this.calculateAlignment(neighbors);
        const cohesion = this.calculateCohesion(neighbors);

        // Check for predators and flee if needed
        const flee = this.calculateFlee();

        // UPDATE SCARED LEVEL based on predator proximity (like old BaitfishCloud)
        const predators = this.scene.fishes || [];
        let closestPredatorDist = Infinity;
        predators.forEach(predator => {
            const dx = this.model.worldX - predator.worldX;
            const dy = this.model.y - predator.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            closestPredatorDist = Math.min(closestPredatorDist, dist);
        });

        const threatRadius = 150; // Same as flee radius
        if (closestPredatorDist < threatRadius) {
            // Get scared quickly when predators approach
            this.schooling.scaredLevel = Math.min(1.0, this.schooling.scaredLevel + 0.15);
        } else {
            // Calm down slowly when no predators nearby
            this.schooling.scaredLevel = Math.max(0, this.schooling.scaredLevel - 0.02);
        }

        // DYNAMIC SPREAD MULTIPLIER - Cluster tighter when scared
        if (this.schooling.scaredLevel > 0.2) {
            // Scared: compress to 0.5-0.8 (tighter clustering)
            this.schooling.spreadMultiplier = Math.max(0.5, 0.8 - (this.schooling.scaredLevel * 0.3));
        } else {
            // Safe: spread out to 1.2-1.5 (looser, more natural)
            this.schooling.spreadMultiplier = Math.min(1.5, 1.2 + (1 - this.schooling.scaredLevel) * 0.3);
        }

        // Apply spread multiplier to Boids radii (smaller radii = tighter clustering)
        this.schooling.separationRadius = this.schooling.baseSeparationRadius * this.schooling.spreadMultiplier;
        this.schooling.alignmentRadius = this.schooling.baseAlignmentRadius * this.schooling.spreadMultiplier;
        this.schooling.cohesionRadius = this.schooling.baseCohesionRadius * this.schooling.spreadMultiplier;

        // SCHOOL CENTER ATTRACTION - Stay near your school's center (like BaitfishModel)
        // This provides group cohesion beyond just neighbor attraction
        let centerAttraction = { x: 0, y: 0 };
        if (this.schoolCenter && this.schoolingOffset) {
            const targetWorldX = this.schoolCenter.worldX + this.schoolingOffset.x;
            const targetY = this.schoolCenter.y + this.schoolingOffset.y;

            const dx = targetWorldX - this.model.worldX;
            const dy = targetY - this.model.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                // Pull toward school center - stronger when scared for tighter clustering
                const strength = Math.min(dist / 100, 1.0); // Stronger when further away
                const scaredPull = 0.5 + (this.schooling.scaredLevel * 0.8); // 0.5-1.3 based on fear
                centerAttraction.x = (dx / dist) * strength * scaredPull;
                centerAttraction.y = (dy / dist) * strength * scaredPull;
            }
        }

        // Combine forces with weights (increase center weight when scared)
        const centerWeight = 2.0 + (this.schooling.scaredLevel * 3.0); // 2.0-5.0 based on fear
        const forceX =
            separation.x * this.schooling.separationWeight +
            alignment.x * this.schooling.alignmentWeight +
            cohesion.x * this.schooling.cohesionWeight +
            centerAttraction.x * centerWeight + // Stronger pull when scared
            flee.x * this.schooling.fleeWeight;

        const forceY =
            separation.y * this.schooling.separationWeight +
            alignment.y * this.schooling.alignmentWeight +
            cohesion.y * this.schooling.cohesionWeight +
            centerAttraction.y * centerWeight + // Stronger pull when scared
            flee.y * this.schooling.fleeWeight;

        // Apply forces to velocity
        this.schooling.velocity.x += forceX;
        this.schooling.velocity.y += forceY;

        // Limit speed
        const currentSpeed = this.schooling.isPanicking ?
            this.schooling.panicSpeed :
            this.schooling.maxSpeed;

        const speed = Math.sqrt(
            this.schooling.velocity.x ** 2 +
            this.schooling.velocity.y ** 2
        );

        if (speed > currentSpeed) {
            this.schooling.velocity.x = (this.schooling.velocity.x / speed) * currentSpeed;
            this.schooling.velocity.y = (this.schooling.velocity.y / speed) * currentSpeed;
        }

        // Apply velocity to position
        this.model.worldX += this.schooling.velocity.x;
        this.model.y += this.schooling.velocity.y;

        // Update screen X position from world X (like predator fish do)
        // Player is always at center of screen (adapt to actual canvas width)
        const actualCanvasWidth = this.scene.scale.width || GameConfig.CANVAS_WIDTH;
        const playerWorldX = actualCanvasWidth / 2;
        const offsetFromPlayer = this.model.worldX - playerWorldX;
        this.model.x = (actualCanvasWidth / 2) + offsetFromPlayer;

        // BOUNDARY ENFORCEMENT - Keep fish within valid depth range
        const depthScale = this.scene.sonarDisplay ?
            this.scene.sonarDisplay.getDepthScale() :
            GameConfig.DEPTH_SCALE;

        const bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
        const minY = 0.5 * depthScale; // 0.5 feet from surface (prevents going above water)
        const maxY = (bottomDepth - 3) * depthScale; // 3 feet from bottom

        // Clamp position
        this.model.y = Math.max(minY, Math.min(maxY, this.model.y));

        // If at boundary and moving toward it, reverse velocity component
        if (this.model.y <= minY && this.schooling.velocity.y < 0) {
            this.schooling.velocity.y = Math.abs(this.schooling.velocity.y) * 0.5; // Bounce down
        } else if (this.model.y >= maxY && this.schooling.velocity.y > 0) {
            this.schooling.velocity.y = -Math.abs(this.schooling.velocity.y) * 0.5; // Bounce up
        }

        // Apply damping
        this.schooling.velocity.x *= 0.95;
        this.schooling.velocity.y *= 0.95;

        // Update panic state
        if (this.schooling.isPanicking) {
            this.schooling.panicTimer--;
            if (this.schooling.panicTimer <= 0) {
                this.schooling.isPanicking = false;
            }
        }

        // FROZEN DETECTION: Check if fish is stuck (not moving for extended period)
        // This prevents baitfish from getting frozen in place
        if (!this.schooling.lastPosition) {
            this.schooling.lastPosition = { worldX: this.model.worldX, y: this.model.y };
            this.schooling.frozenFrames = 0;
        } else {
            const dx = this.model.worldX - this.schooling.lastPosition.worldX;
            const dy = this.model.y - this.schooling.lastPosition.y;
            const distMoved = Math.sqrt(dx * dx + dy * dy);

            // If fish hasn't moved more than 1 pixel in 60 frames (1 second)
            if (distMoved < 1.0) {
                this.schooling.frozenFrames++;

                // After 60 frames of being frozen, give it a random nudge
                if (this.schooling.frozenFrames > 60) {
                    this.schooling.velocity.x += (Math.random() - 0.5) * 2.0;
                    this.schooling.velocity.y += (Math.random() - 0.5) * 1.0;
                    this.schooling.frozenFrames = 0; // Reset counter
                    console.log(`Unfreezing stuck ${this._speciesName} baitfish`);
                }
            } else {
                // Fish is moving, reset frozen counter
                this.schooling.frozenFrames = 0;
                this.schooling.lastPosition = { worldX: this.model.worldX, y: this.model.y };
            }
        }
    }

    /**
     * Find nearby fish in the same group for schooling
     */
    findNearbySchoolmates() {
        // Get all fish from scene (stored in update())
        const allFish = this.allFishInScene;
        if (!allFish || !Array.isArray(allFish)) return [];

        const neighbors = [];
        const radius = this.schooling.perceptionRadius;

        // Iterate through array of fish
        allFish.forEach(other => {
            // Skip self
            if (other === this) return;

            // Only school with same species
            if (other._speciesName !== this._speciesName) return;

            // Check distance
            const dx = other.model.worldX - this.model.worldX;
            const dy = other.model.y - this.model.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < radius * radius) {
                neighbors.push({
                    fish: other,
                    distance: Math.sqrt(distSq),
                    dx,
                    dy
                });
            }
        });

        return neighbors;
    }

    /**
     * BOID RULE 1: Separation - avoid crowding neighbors
     */
    calculateSeparation(neighbors) {
        let steerX = 0;
        let steerY = 0;

        neighbors.forEach(({ fish, distance, dx, dy }) => {
            if (distance < this.schooling.separationRadius && distance > 0) {
                // Repel with force inversely proportional to distance
                const force = 1.0 / distance;
                steerX -= dx * force;
                steerY -= dy * force;
            }
        });

        return { x: steerX, y: steerY };
    }

    /**
     * BOID RULE 2: Alignment - steer towards average heading of neighbors
     */
    calculateAlignment(neighbors) {
        if (neighbors.length === 0) return { x: 0, y: 0 };

        let avgVelX = 0;
        let avgVelY = 0;
        let count = 0;

        neighbors.forEach(({ fish, distance }) => {
            if (distance < this.schooling.alignmentRadius && fish.schooling) {
                avgVelX += fish.schooling.velocity.x;
                avgVelY += fish.schooling.velocity.y;
                count++;
            }
        });

        if (count === 0) return { x: 0, y: 0 };

        avgVelX /= count;
        avgVelY /= count;

        // Steer towards average velocity
        return {
            x: (avgVelX - this.schooling.velocity.x) * 0.1,
            y: (avgVelY - this.schooling.velocity.y) * 0.1
        };
    }

    /**
     * BOID RULE 3: Cohesion - steer towards center of mass of neighbors
     */
    calculateCohesion(neighbors) {
        if (neighbors.length === 0) return { x: 0, y: 0 };

        let centerX = 0;
        let centerY = 0;
        let count = 0;

        neighbors.forEach(({ fish, distance }) => {
            if (distance < this.schooling.cohesionRadius) {
                centerX += fish.model.worldX;
                centerY += fish.model.y;
                count++;
            }
        });

        if (count === 0) return { x: 0, y: 0 };

        centerX /= count;
        centerY /= count;

        // Steer towards center
        return {
            x: (centerX - this.model.worldX) * 0.01,
            y: (centerY - this.model.y) * 0.01
        };
    }

    /**
     * FLEE BEHAVIOR: Escape from nearby predators
     */
    calculateFlee() {
        // Get predator fish from scene
        const predators = this.scene.fishes || [];
        if (predators.length === 0) return { x: 0, y: 0 };

        let fleeX = 0;
        let fleeY = 0;
        let threatDetected = false;
        const fleeRadius = 150; // Distance at which baitfish react to predators

        predators.forEach(predator => {
            // Skip if this IS a predator (shouldn't happen for baitfish)
            if (predator === this) return;

            const dx = this.model.worldX - predator.worldX;
            const dy = this.model.y - predator.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < fleeRadius && dist > 0) {
                // Flee directly away from threat
                const force = (fleeRadius - dist) / fleeRadius; // Stronger when closer
                fleeX += (dx / dist) * force;
                fleeY += (dy / dist) * force;
                threatDetected = true;
            }
        });

        // Trigger panic mode
        if (threatDetected && !this.schooling.isPanicking) {
            this.schooling.isPanicking = true;
            this.schooling.panicTimer = 60; // Panic for ~60 frames (1 second at 60fps)
        }

        return { x: fleeX, y: fleeY };
    }
}

export default Fish;
