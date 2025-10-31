import { Fish } from '../fish.js';
import { Utils } from '../../utils/Constants.js';

/**
 * Yellow Perch - Fast growth, shorter lifespan
 * Perca flavescens
 */
export class YellowPerch extends Fish {
    constructor(scene, x, y, size = 'MEDIUM') {
        super(scene, x, y, size, 'yellow_perch_large');
    }

    calculateLength() {
        // Yellow perch: length in inches ≈ 9.5 * weight^0.35 (smaller, deep-bodied)
        return Math.round(9.5 * Math.pow(this.weight, 0.35));
    }

    calculateBiologicalAge() {
        // Yellow perch fast growth, shorter lifespan
        if (this.weight <= 0.7) {
            // Small perch: 1-3 years
            return Math.round(Utils.randomBetween(1, 3));
        } else if (this.weight <= 1.2) {
            // Medium perch: 3-5 years
            return Math.round(Utils.randomBetween(3, 5));
        } else if (this.weight <= 2.0) {
            // Large perch: 5-8 years
            return Math.round(Utils.randomBetween(5, 8));
        } else {
            // Trophy perch: 8-12 years
            return Math.round(Utils.randomBetween(8, 12));
        }
    }

    /**
     * Render yellow perch with rotation and position
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
     * Render yellow perch body (shared by render and renderAtPosition)
     */
    renderBody(graphics, bodySize, colors, centerX = 0, centerY = 0) {
        // Perch body - deep and laterally compressed
        const perchLength = bodySize * 2.0;
        const perchHeight = bodySize * 0.85;

        // Main body - golden yellow
        graphics.fillStyle(colors.base, 1.0);
        graphics.fillEllipse(centerX, centerY, perchLength, perchHeight);

        // Belly - pale yellow/cream
        graphics.fillStyle(colors.belly, 0.9);
        graphics.fillEllipse(centerX, centerY + perchHeight * 0.25, perchLength * 0.8, perchHeight * 0.45);

        // Vertical bars - 6-8 dark bars
        graphics.fillStyle(colors.bars, 0.75);
        const barCount = 7;
        const barWidth = perchLength * 0.09;
        const barSpacing = perchLength / (barCount + 1);

        for (let i = 0; i < barCount; i++) {
            const barX = centerX - perchLength * 0.4 + (i * barSpacing);
            const heightMultiplier = 1.0 - Math.abs(i - barCount / 2) * 0.12;
            const barHeight = perchHeight * 0.75 * heightMultiplier;

            graphics.fillRect(
                barX - barWidth / 2,
                centerY - barHeight / 2,
                barWidth,
                barHeight
            );
        }

        // Tail
        const tailSize = bodySize * 0.7;
        const tailX = centerX - perchLength * 0.45;

        graphics.fillStyle(colors.fins, 0.9);
        graphics.beginPath();
        graphics.moveTo(tailX, centerY);
        graphics.lineTo(tailX - tailSize * 0.65, centerY - tailSize * 0.55);
        graphics.lineTo(tailX - tailSize * 0.65, centerY + tailSize * 0.55);
        graphics.closePath();
        graphics.fillPath();

        // Spiny dorsal fin (front)
        graphics.fillStyle(colors.fins, 0.85);
        const spinyDorsalX = centerX - perchLength * 0.15;
        graphics.fillTriangle(
            spinyDorsalX, centerY - perchHeight * 0.5,
            spinyDorsalX - bodySize * 0.35, centerY - perchHeight * 1.2,
            spinyDorsalX + bodySize * 0.15, centerY - perchHeight * 1.1
        );

        // Soft dorsal fin (rear) - orange/red tinted
        graphics.fillStyle(colors.fins, 0.9);
        const softDorsalX = centerX + perchLength * 0.05;
        graphics.fillTriangle(
            softDorsalX, centerY - perchHeight * 0.5,
            softDorsalX - bodySize * 0.15, centerY - perchHeight * 1.0,
            softDorsalX + bodySize * 0.25, centerY - perchHeight * 0.9
        );

        // Pectoral fins
        const finX = centerX - bodySize * 0.15;
        graphics.fillTriangle(
            finX, centerY,
            finX - bodySize * 0.3, centerY - perchHeight * 0.25,
            finX - bodySize * 0.3, centerY + perchHeight * 0.25
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

export default YellowPerch;
