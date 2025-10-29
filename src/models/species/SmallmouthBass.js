import { Fish } from '../fish.js';
import { Utils } from '../../utils/Constants.js';

/**
 * Smallmouth Bass - Moderate growth, aggressive fighter
 * Micropterus dolomieu
 */
export class SmallmouthBass extends Fish {
    constructor(scene, x, y, size = 'MEDIUM', fishingType = null) {
        super(scene, x, y, size, fishingType, 'smallmouth_bass');
    }

    calculateLength() {
        // Smallmouth bass: length in inches ≈ 11.2 * weight^0.33 (compact, deep-bodied)
        return Math.round(11.2 * Math.pow(this.weight, 0.33));
    }

    calculateBiologicalAge() {
        // Smallmouth bass moderate growth, medium lifespan
        if (this.weight <= 2) {
            // Small bass: 2-4 years
            return Math.round(Utils.randomBetween(2, 4));
        } else if (this.weight <= 4) {
            // Medium bass: 4-7 years
            return Math.round(Utils.randomBetween(4, 7));
        } else if (this.weight <= 6) {
            // Large bass: 7-12 years
            return Math.round(Utils.randomBetween(7, 12));
        } else {
            // Trophy bass: 12-18 years
            return Math.round(Utils.randomBetween(12, 18));
        }
    }

    /**
     * Render smallmouth bass with rotation and position
     */
    render(graphics, bodySize, isMovingRight) {
        const colors = this.speciesData.appearance.colorScheme;

        graphics.save();
        graphics.translateCanvas(this.x, this.y);

        if (isMovingRight) {
            graphics.rotateCanvas(this.angle);
        } else {
            graphics.scaleCanvas(-1, 1);
            graphics.rotateCanvas(-this.angle);
        }

        this.renderBody(graphics, bodySize, colors);

        graphics.restore();
    }

    /**
     * Render smallmouth bass body (shared by render and renderAtPosition)
     */
    renderBody(graphics, bodySize, colors, centerX = 0, centerY = 0) {
        // Bass body - compact and muscular
        const bassLength = bodySize * 2.2;
        const bassHeight = bodySize * 0.9;

        // Main body - bronze/brown
        graphics.fillStyle(colors.base, 1.0);
        graphics.fillEllipse(centerX, centerY, bassLength, bassHeight);

        // Belly - cream/tan
        graphics.fillStyle(colors.belly, 0.9);
        graphics.fillEllipse(centerX, centerY + bassHeight * 0.2, bassLength * 0.85, bassHeight * 0.5);

        // Vertical bars - distinctive feature of smallmouth
        graphics.fillStyle(colors.bars, 0.7);
        const barCount = 9;
        const barWidth = bassLength * 0.08;
        const barSpacing = bassLength / (barCount + 1);

        for (let i = 0; i < barCount; i++) {
            const barX = centerX - bassLength * 0.4 + (i * barSpacing);
            const heightMultiplier = 1.0 - Math.abs(i - barCount / 2) * 0.15;
            const barHeight = bassHeight * 0.8 * heightMultiplier;

            graphics.fillRect(
                barX - barWidth / 2,
                centerY - barHeight / 2,
                barWidth,
                barHeight
            );
        }

        // Red eye - distinctive feature
        const eyeX = centerX + bassLength * 0.35;
        const eyeY = centerY - bassHeight * 0.25;
        graphics.fillStyle(colors.eyes, 1.0);
        graphics.fillCircle(eyeX, eyeY, bodySize * 0.15);

        // Tail - slightly forked
        const tailSize = bodySize * 0.75;
        const tailX = centerX - bassLength * 0.45;

        graphics.fillStyle(colors.fins, 0.9);
        graphics.beginPath();
        graphics.moveTo(tailX, centerY);
        graphics.lineTo(tailX - tailSize * 0.7, centerY - tailSize * 0.6);
        graphics.lineTo(tailX - tailSize * 0.7, centerY + tailSize * 0.6);
        graphics.closePath();
        graphics.fillPath();

        // Dorsal fin - spiny front section, soft rear section
        graphics.fillStyle(colors.fins, 0.8);

        // Spiny dorsal (front)
        const spinyDorsalX = centerX - bassLength * 0.15;
        graphics.fillTriangle(
            spinyDorsalX, centerY - bassHeight * 0.5,
            spinyDorsalX - bodySize * 0.4, centerY - bassHeight * 1.3,
            spinyDorsalX + bodySize * 0.2, centerY - bassHeight * 1.2
        );

        // Soft dorsal (rear)
        const softDorsalX = centerX + bassLength * 0.05;
        graphics.fillTriangle(
            softDorsalX, centerY - bassHeight * 0.5,
            softDorsalX - bodySize * 0.2, centerY - bassHeight * 1.1,
            softDorsalX + bodySize * 0.3, centerY - bassHeight * 1.0
        );

        // Pectoral fins
        const finX = centerX - bodySize * 0.2;
        graphics.fillTriangle(
            finX, centerY,
            finX - bodySize * 0.35, centerY - bassHeight * 0.3,
            finX - bodySize * 0.35, centerY + bassHeight * 0.3
        );
    }

    /**
     * Render at a custom position (for catch popup)
     */
    renderAtPosition(graphics, x, y, bodySize) {
        const colors = this.speciesData.appearance.colorScheme;

        // Set the graphics position to the desired location
        graphics.x = x;
        graphics.y = y;

        // Render body at origin (0,0) relative to graphics position
        this.renderBody(graphics, bodySize, colors, 0, 0);
    }
}

export default SmallmouthBass;
