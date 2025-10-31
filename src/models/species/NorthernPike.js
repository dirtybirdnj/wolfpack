import { Fish } from '../fish.js';
import { Utils } from '../../utils/Constants.js';

/**
 * Northern Pike - Fast growth, ambush predator
 * Esox lucius
 */
export class NorthernPike extends Fish {
    constructor(scene, x, y, size = 'MEDIUM') {
        super(scene, x, y, size, 'northern_pike');
    }

    calculateLength() {
        // Northern pike: length in inches ≈ 13.5 * weight^0.28 (longer, more slender)
        return Math.round(13.5 * Math.pow(this.weight, 0.28));
    }

    calculateBiologicalAge() {
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
    }

    /**
     * Render northern pike with rotation and position
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

        this.renderBody(graphics, bodySize, colors, 0, 0);

        graphics.restore();
    }

    /**
     * Render northern pike body (shared by render and renderAtPosition)
     */
    renderBody(graphics, bodySize, colors, centerX = 0, centerY = 0) {
        // Pike body - long and cylindrical (torpedo-shaped)
        const pikeLength = bodySize * 3.2;
        const pikeHeight = bodySize * 0.6;

        // Main body - olive green
        graphics.fillStyle(colors.base, 1.0);
        graphics.fillEllipse(centerX, centerY, pikeLength, pikeHeight);

        // Belly - light cream
        graphics.fillStyle(colors.belly, 0.9);
        graphics.fillEllipse(centerX, centerY + pikeHeight * 0.15, pikeLength * 0.9, pikeHeight * 0.4);

        // Characteristic cream/white oval spots in horizontal rows
        graphics.fillStyle(colors.spots, 0.8);
        const spotsPerRow = 5;
        const spotSpacing = pikeLength / (spotsPerRow + 1);

        // Upper row of spots
        for (let i = 0; i < spotsPerRow; i++) {
            const spotX = centerX - pikeLength * 0.4 + (i * spotSpacing);
            const spotY = centerY - pikeHeight * 0.15;
            graphics.fillEllipse(spotX, spotY, bodySize * 0.25, bodySize * 0.15);
        }

        // Middle row of spots
        for (let i = 0; i < spotsPerRow; i++) {
            const spotX = centerX - pikeLength * 0.35 + (i * spotSpacing);
            const spotY = centerY;
            graphics.fillEllipse(spotX, spotY, bodySize * 0.25, bodySize * 0.15);
        }

        // Tail - pike have a distinctive forked tail
        const tailSize = bodySize * 0.8;
        const tailX = centerX - pikeLength * 0.45;

        graphics.fillStyle(colors.fins, 0.9);
        graphics.beginPath();
        graphics.moveTo(tailX, centerY);
        graphics.lineTo(tailX - tailSize * 0.8, centerY - tailSize * 0.7);
        graphics.lineTo(tailX - tailSize * 0.8, centerY + tailSize * 0.7);
        graphics.closePath();
        graphics.fillPath();

        // Dorsal fin - far back on pike (near tail)
        graphics.fillStyle(colors.fins, 0.75);
        const dorsalX = centerX - pikeLength * 0.25;
        graphics.fillTriangle(
            dorsalX, centerY - pikeHeight * 0.4,
            dorsalX - bodySize * 0.5, centerY - pikeHeight * 1.3,
            dorsalX + bodySize * 0.3, centerY - pikeHeight * 1.0
        );

        // Pectoral fins
        const finX = centerX - bodySize * 0.2;
        graphics.fillTriangle(
            finX, centerY,
            finX - bodySize * 0.3, centerY - pikeHeight * 0.25,
            finX - bodySize * 0.3, centerY + pikeHeight * 0.25
        );
    }

    /**
     * Render at a custom position (for catch popup)
     * @param {boolean} facingLeft - If true, fish faces left (tournament photo style)
     */
    renderAtPosition(graphics, x, y, bodySize, facingLeft = false) {
        const colors = this.speciesData.appearance.colorScheme;

        // Use canvas transformation to position the fish
        graphics.save();
        graphics.translateCanvas(x, y);

        // Flip fish to face left if requested
        if (facingLeft) {
            graphics.scaleCanvas(-1, 1);
        }

        // Render body at origin (0,0) relative to translated position
        this.renderBody(graphics, bodySize, colors, 0, 0);

        graphics.restore();
    }
}

export default NorthernPike;
