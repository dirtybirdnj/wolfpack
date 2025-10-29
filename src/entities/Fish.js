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
            if (this.sprite) this.sprite.setVisible(false);
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
            // Use procedural rendering (current system)
            // Render species-specific fish
            if (this.model.species === 'northern_pike') {
                this.renderNorthernPike(bodySize, isMovingRight);
            } else if (this.model.species === 'smallmouth_bass') {
                this.renderSmallmouthBass(bodySize, isMovingRight);
            } else if (this.model.species === 'yellow_perch_large') {
                this.renderYellowPerch(bodySize, isMovingRight);
            } else {
                this.renderLakeTrout(bodySize, isMovingRight);
            }
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

    // === RENDERING METHODS - All species-specific rendering code below ===

    renderLakeTrout(bodySize, isMovingRight) {
        // Save graphics state and apply rotation
        this.graphics.save();
        this.graphics.translateCanvas(this.model.x, this.model.y);

        if (isMovingRight) {
            this.graphics.rotateCanvas(this.model.angle);
        } else {
            this.graphics.scaleCanvas(-1, 1);
            this.graphics.rotateCanvas(-this.model.angle);
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
        const colors = this.model.speciesData.appearance.colorScheme;

        this.graphics.save();
        this.graphics.translateCanvas(this.model.x, this.model.y);

        if (isMovingRight) {
            this.graphics.rotateCanvas(this.model.angle);
        } else {
            this.graphics.scaleCanvas(-1, 1);
            this.graphics.rotateCanvas(-this.model.angle);
        }

        // Pike body - long and cylindrical (torpedo-shaped)
        const pikeLength = bodySize * 3.2;
        const pikeHeight = bodySize * 0.6;

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

    renderSmallmouthBass(bodySize, isMovingRight) {
        // Smallmouth bass - compact, deep-bodied with bronze coloring and vertical bars
        const colors = this.model.speciesData.appearance.colorScheme;

        this.graphics.save();
        this.graphics.translateCanvas(this.model.x, this.model.y);

        if (isMovingRight) {
            this.graphics.rotateCanvas(this.model.angle);
        } else {
            this.graphics.scaleCanvas(-1, 1);
            this.graphics.rotateCanvas(-this.model.angle);
        }

        // Bass body - compact and muscular
        const bassLength = bodySize * 2.2;
        const bassHeight = bodySize * 0.9;

        // Main body - bronze/brown
        this.graphics.fillStyle(colors.base, 1.0);
        this.graphics.fillEllipse(0, 0, bassLength, bassHeight);

        // Belly - cream/tan
        this.graphics.fillStyle(colors.belly, 0.9);
        this.graphics.fillEllipse(0, bassHeight * 0.2, bassLength * 0.85, bassHeight * 0.5);

        // Vertical bars - distinctive feature of smallmouth
        this.graphics.fillStyle(colors.bars, 0.7);
        const barCount = 9;
        const barWidth = bassLength * 0.08;
        const barSpacing = bassLength / (barCount + 1);

        for (let i = 0; i < barCount; i++) {
            const barX = -bassLength * 0.4 + (i * barSpacing);
            const heightMultiplier = 1.0 - Math.abs(i - barCount / 2) * 0.15;
            const barHeight = bassHeight * 0.8 * heightMultiplier;

            this.graphics.fillRect(
                barX - barWidth / 2,
                -barHeight / 2,
                barWidth,
                barHeight
            );
        }

        // Red eye - distinctive feature
        const eyeX = bassLength * 0.35;
        const eyeY = -bassHeight * 0.25;
        this.graphics.fillStyle(colors.eyes, 1.0);
        this.graphics.fillCircle(eyeX, eyeY, bodySize * 0.15);

        // Tail - slightly forked
        const tailSize = bodySize * 0.75;
        const tailX = -bassLength * 0.45;

        this.graphics.fillStyle(colors.fins, 0.9);
        this.graphics.beginPath();
        this.graphics.moveTo(tailX, 0);
        this.graphics.lineTo(tailX - tailSize * 0.7, -tailSize * 0.6);
        this.graphics.lineTo(tailX - tailSize * 0.7, tailSize * 0.6);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Dorsal fin - spiny front section, soft rear section
        this.graphics.fillStyle(colors.fins, 0.8);

        // Spiny dorsal (front)
        const spinyDorsalX = -bassLength * 0.15;
        this.graphics.fillTriangle(
            spinyDorsalX, -bassHeight * 0.5,
            spinyDorsalX - bodySize * 0.4, -bassHeight * 1.3,
            spinyDorsalX + bodySize * 0.2, -bassHeight * 1.2
        );

        // Soft dorsal (rear)
        const softDorsalX = bassLength * 0.05;
        this.graphics.fillTriangle(
            softDorsalX, -bassHeight * 0.5,
            softDorsalX - bodySize * 0.2, -bassHeight * 1.1,
            softDorsalX + bodySize * 0.3, -bassHeight * 1.0
        );

        // Pectoral fins
        const finX = -bodySize * 0.2;
        this.graphics.fillTriangle(
            finX, 0,
            finX - bodySize * 0.35, -bassHeight * 0.3,
            finX - bodySize * 0.35, bassHeight * 0.3
        );

        this.graphics.restore();
    }

    renderYellowPerch(bodySize, isMovingRight) {
        // Yellow perch - golden with vertical bars and orange fins
        const colors = this.model.speciesData.appearance.colorScheme;

        this.graphics.save();
        this.graphics.translateCanvas(this.model.x, this.model.y);

        if (isMovingRight) {
            this.graphics.rotateCanvas(this.model.angle);
        } else {
            this.graphics.scaleCanvas(-1, 1);
            this.graphics.rotateCanvas(-this.model.angle);
        }

        // Perch body - deep and laterally compressed
        const perchLength = bodySize * 2.0;
        const perchHeight = bodySize * 0.85;

        // Main body - golden yellow
        this.graphics.fillStyle(colors.base, 1.0);
        this.graphics.fillEllipse(0, 0, perchLength, perchHeight);

        // Belly - pale yellow/cream
        this.graphics.fillStyle(colors.belly, 0.9);
        this.graphics.fillEllipse(0, perchHeight * 0.25, perchLength * 0.8, perchHeight * 0.45);

        // Vertical bars - 6-8 dark bars
        this.graphics.fillStyle(colors.bars, 0.75);
        const barCount = 7;
        const barWidth = perchLength * 0.09;
        const barSpacing = perchLength / (barCount + 1);

        for (let i = 0; i < barCount; i++) {
            const barX = -perchLength * 0.4 + (i * barSpacing);
            const heightMultiplier = 1.0 - Math.abs(i - barCount / 2) * 0.12;
            const barHeight = perchHeight * 0.75 * heightMultiplier;

            this.graphics.fillRect(
                barX - barWidth / 2,
                -barHeight / 2,
                barWidth,
                barHeight
            );
        }

        // Tail
        const tailSize = bodySize * 0.7;
        const tailX = -perchLength * 0.45;

        this.graphics.fillStyle(colors.fins, 0.9);
        this.graphics.beginPath();
        this.graphics.moveTo(tailX, 0);
        this.graphics.lineTo(tailX - tailSize * 0.65, -tailSize * 0.55);
        this.graphics.lineTo(tailX - tailSize * 0.65, tailSize * 0.55);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Spiny dorsal fin (front)
        this.graphics.fillStyle(colors.fins, 0.85);
        const spinyDorsalX = -perchLength * 0.15;
        this.graphics.fillTriangle(
            spinyDorsalX, -perchHeight * 0.5,
            spinyDorsalX - bodySize * 0.35, -perchHeight * 1.2,
            spinyDorsalX + bodySize * 0.15, -perchHeight * 1.1
        );

        // Soft dorsal fin (rear) - orange/red tinted
        this.graphics.fillStyle(colors.fins, 0.9);
        const softDorsalX = perchLength * 0.05;
        this.graphics.fillTriangle(
            softDorsalX, -perchHeight * 0.5,
            softDorsalX - bodySize * 0.15, -perchHeight * 1.0,
            softDorsalX + bodySize * 0.25, -perchHeight * 0.9
        );

        // Pectoral fins
        const finX = -bodySize * 0.15;
        this.graphics.fillTriangle(
            finX, 0,
            finX - bodySize * 0.3, -perchHeight * 0.25,
            finX - bodySize * 0.3, perchHeight * 0.25
        );

        this.graphics.restore();
    }

    /**
     * Render fish at a custom position and scale (for catch popup)
     */
    renderAtPosition(graphics, x, y, scale = 3) {
        const bodySize = Math.max(8, this.model.weight / 2) * scale;

        graphics.save();
        graphics.translateCanvas(x, y);
        graphics.scaleCanvas(1, 1); // Always face right for popup
        graphics.rotateCanvas(0); // Horizontal orientation

        if (this.model.species === 'northern_pike') {
            this.renderNorthernPikeAtPosition(graphics, bodySize);
        } else if (this.model.species === 'smallmouth_bass') {
            this.renderSmallmouthBassAtPosition(graphics, bodySize);
        } else if (this.model.species === 'yellow_perch_large') {
            this.renderYellowPerchAtPosition(graphics, bodySize);
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
        const colors = this.model.speciesData.appearance.colorScheme;

        const pikeLength = bodySize * 3.2;
        const pikeHeight = bodySize * 0.6;

        graphics.fillStyle(colors.base, 1.0);
        graphics.fillEllipse(0, 0, pikeLength, pikeHeight);

        graphics.fillStyle(colors.belly, 0.9);
        graphics.fillEllipse(0, pikeHeight * 0.15, pikeLength * 0.9, pikeHeight * 0.4);

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

        const tailSize = bodySize * 0.8;
        const tailX = -pikeLength * 0.45;

        graphics.fillStyle(colors.fins, 0.9);
        graphics.beginPath();
        graphics.moveTo(tailX, 0);
        graphics.lineTo(tailX - tailSize * 0.8, -tailSize * 0.7);
        graphics.lineTo(tailX - tailSize * 0.8, tailSize * 0.7);
        graphics.closePath();
        graphics.fillPath();

        graphics.fillStyle(colors.fins, 0.75);
        const dorsalX = -pikeLength * 0.25;
        graphics.fillTriangle(
            dorsalX, -pikeHeight * 0.4,
            dorsalX - bodySize * 0.5, -pikeHeight * 1.3,
            dorsalX + bodySize * 0.3, -pikeHeight * 1.0
        );

        const finX = -bodySize * 0.2;
        graphics.fillTriangle(
            finX, 0,
            finX - bodySize * 0.3, -pikeHeight * 0.25,
            finX - bodySize * 0.3, pikeHeight * 0.25
        );
    }

    renderSmallmouthBassAtPosition(graphics, bodySize) {
        const colors = this.model.speciesData.appearance.colorScheme;

        const bassLength = bodySize * 2.2;
        const bassHeight = bodySize * 0.9;

        graphics.fillStyle(colors.base, 1.0);
        graphics.fillEllipse(0, 0, bassLength, bassHeight);

        graphics.fillStyle(colors.belly, 0.9);
        graphics.fillEllipse(0, bassHeight * 0.2, bassLength * 0.85, bassHeight * 0.5);

        graphics.fillStyle(colors.bars, 0.7);
        const barCount = 9;
        const barWidth = bassLength * 0.08;
        const barSpacing = bassLength / (barCount + 1);

        for (let i = 0; i < barCount; i++) {
            const barX = -bassLength * 0.4 + (i * barSpacing);
            const heightMultiplier = 1.0 - Math.abs(i - barCount / 2) * 0.15;
            const barHeight = bassHeight * 0.8 * heightMultiplier;

            graphics.fillRect(
                barX - barWidth / 2,
                -barHeight / 2,
                barWidth,
                barHeight
            );
        }

        const eyeX = bassLength * 0.35;
        const eyeY = -bassHeight * 0.25;
        graphics.fillStyle(colors.eyes, 1.0);
        graphics.fillCircle(eyeX, eyeY, bodySize * 0.15);

        const tailSize = bodySize * 0.75;
        const tailX = -bassLength * 0.45;

        graphics.fillStyle(colors.fins, 0.9);
        graphics.beginPath();
        graphics.moveTo(tailX, 0);
        graphics.lineTo(tailX - tailSize * 0.7, -tailSize * 0.6);
        graphics.lineTo(tailX - tailSize * 0.7, tailSize * 0.6);
        graphics.closePath();
        graphics.fillPath();

        graphics.fillStyle(colors.fins, 0.8);

        const spinyDorsalX = -bassLength * 0.15;
        graphics.fillTriangle(
            spinyDorsalX, -bassHeight * 0.5,
            spinyDorsalX - bodySize * 0.4, -bassHeight * 1.3,
            spinyDorsalX + bodySize * 0.2, -bassHeight * 1.2
        );

        const softDorsalX = bassLength * 0.05;
        graphics.fillTriangle(
            softDorsalX, -bassHeight * 0.5,
            softDorsalX - bodySize * 0.2, -bassHeight * 1.1,
            softDorsalX + bodySize * 0.3, -bassHeight * 1.0
        );

        const finX = -bodySize * 0.2;
        graphics.fillTriangle(
            finX, 0,
            finX - bodySize * 0.35, -bassHeight * 0.3,
            finX - bodySize * 0.35, bassHeight * 0.3
        );
    }

    renderYellowPerchAtPosition(graphics, bodySize) {
        const colors = this.model.speciesData.appearance.colorScheme;

        const perchLength = bodySize * 2.0;
        const perchHeight = bodySize * 0.85;

        graphics.fillStyle(colors.base, 1.0);
        graphics.fillEllipse(0, 0, perchLength, perchHeight);

        graphics.fillStyle(colors.belly, 0.9);
        graphics.fillEllipse(0, perchHeight * 0.25, perchLength * 0.8, perchHeight * 0.45);

        graphics.fillStyle(colors.bars, 0.75);
        const barCount = 7;
        const barWidth = perchLength * 0.09;
        const barSpacing = perchLength / (barCount + 1);

        for (let i = 0; i < barCount; i++) {
            const barX = -perchLength * 0.4 + (i * barSpacing);
            const heightMultiplier = 1.0 - Math.abs(i - barCount / 2) * 0.12;
            const barHeight = perchHeight * 0.75 * heightMultiplier;

            graphics.fillRect(
                barX - barWidth / 2,
                -barHeight / 2,
                barWidth,
                barHeight
            );
        }

        const tailSize = bodySize * 0.7;
        const tailX = -perchLength * 0.45;

        graphics.fillStyle(colors.fins, 0.9);
        graphics.beginPath();
        graphics.moveTo(tailX, 0);
        graphics.lineTo(tailX - tailSize * 0.65, -tailSize * 0.55);
        graphics.lineTo(tailX - tailSize * 0.65, tailSize * 0.55);
        graphics.closePath();
        graphics.fillPath();

        graphics.fillStyle(colors.fins, 0.85);
        const spinyDorsalX = -perchLength * 0.15;
        graphics.fillTriangle(
            spinyDorsalX, -perchHeight * 0.5,
            spinyDorsalX - bodySize * 0.35, -perchHeight * 1.2,
            spinyDorsalX + bodySize * 0.15, -perchHeight * 1.1
        );

        graphics.fillStyle(colors.fins, 0.9);
        const softDorsalX = perchLength * 0.05;
        graphics.fillTriangle(
            softDorsalX, -perchHeight * 0.5,
            softDorsalX - bodySize * 0.15, -perchHeight * 1.0,
            softDorsalX + bodySize * 0.25, -perchHeight * 0.9
        );

        const finX = -bodySize * 0.15;
        graphics.fillTriangle(
            finX, 0,
            finX - bodySize * 0.3, -perchHeight * 0.25,
            finX - bodySize * 0.3, perchHeight * 0.25
        );
    }
}

export default Fish;
