import GameConfig from '../config/GameConfig.js';
import LakeTrout from '../models/species/LakeTrout.js';
import NorthernPike from '../models/species/NorthernPike.js';
import SmallmouthBass from '../models/species/SmallmouthBass.js';
import YellowPerch from '../models/species/YellowPerch.js';

/**
 * Fish - Phaser rendering layer for fish
 * Composes with Fish model classes and handles only visual display
 * All game logic is delegated to the model
 */
export class Fish {
    constructor(scene, x, y, size = 'MEDIUM', fishingType = null, species = 'lake_trout') {
        this.scene = scene;

        // Create the appropriate model based on species
        this.model = this.createModel(scene, x, y, size, fishingType, species);

        // Phaser-specific visual elements
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(10);

        // External artwork sprite (if available)
        this.sprite = null;
        this.tryLoadArtwork();

        // Sonar trail (visual only)
        this.sonarTrail = [];
        this.maxTrailLength = 30;
    }

    /**
     * Factory method to create the appropriate species model
     */
    createModel(scene, x, y, size, fishingType, species) {
        switch(species) {
            case 'lake_trout':
                return new LakeTrout(scene, x, y, size, fishingType);
            case 'northern_pike':
                return new NorthernPike(scene, x, y, size, fishingType);
            case 'smallmouth_bass':
                return new SmallmouthBass(scene, x, y, size, fishingType);
            case 'yellow_perch_large':
                return new YellowPerch(scene, x, y, size, fishingType);
            default:
                return new LakeTrout(scene, x, y, size, fishingType);
        }
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
        // Delegate logic update to model
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
        const movement = this.model.ai.getMovementVector();
        const isMovingRight = movement.x >= 0;

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
        if (this.model.interestFlash > 0) {
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
}

export default Fish;
