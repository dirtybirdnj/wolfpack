import Fish from './fish.js';
import { Utils } from '../utils/Constants.js';

/**
 * Northern Pike - Esox lucius
 * Ambush predator with explosive strikes
 */
export class NorthernPike extends Fish {
    constructor(scene, x, y, size = 'MEDIUM', fishingType = null) {
        super(scene, x, y, size, fishingType, 'northern_pike');
    }

    /**
     * Northern pike length-weight formula
     * Pike are longer and more slender
     * length in inches ≈ 13.5 * weight^0.28
     */
    calculateLength() {
        return Math.round(13.5 * Math.pow(this.weight, 0.28));
    }

    /**
     * Northern pike age-weight relationship
     * Faster growth than lake trout, shorter lifespan
     */
    calculateBiologicalAge() {
        if (this.weight <= 6) {
            return Math.round(Utils.randomBetween(2, 4));
        } else if (this.weight <= 15) {
            return Math.round(Utils.randomBetween(4, 8));
        } else if (this.weight <= 25) {
            return Math.round(Utils.randomBetween(8, 14));
        } else {
            return Math.round(Utils.randomBetween(14, 22));
        }
    }

    /**
     * Draw northern pike shape - shared rendering code
     * @param {Object} graphics - Phaser graphics object to draw on
     * @param {number} bodySize - Size multiplier for the fish body
     */
    drawFishShape(graphics, bodySize) {
        const colors = this.speciesData.appearance.colorScheme;

        // Pike body - long and cylindrical (torpedo-shaped)
        const pikeLength = bodySize * 3.2;
        const pikeHeight = bodySize * 0.6;

        // Main body - olive green
        graphics.fillStyle(colors.base, 1.0);
        graphics.fillEllipse(0, 0, pikeLength, pikeHeight);

        // Belly - light cream
        graphics.fillStyle(colors.belly, 0.9);
        graphics.fillEllipse(0, pikeHeight * 0.15, pikeLength * 0.9, pikeHeight * 0.4);

        // Characteristic cream/white oval spots in horizontal rows
        graphics.fillStyle(colors.spots, 0.8);
        const spotsPerRow = 5;
        const spotSpacing = pikeLength / (spotsPerRow + 1);

        // Upper row of spots
        for (let i = 0; i < spotsPerRow; i++) {
            const spotX = -pikeLength * 0.4 + (i * spotSpacing);
            const spotY = -pikeHeight * 0.15;
            graphics.fillEllipse(spotX, spotY, bodySize * 0.25, bodySize * 0.15);
        }

        // Middle row of spots
        for (let i = 0; i < spotsPerRow; i++) {
            const spotX = -pikeLength * 0.35 + (i * spotSpacing);
            const spotY = 0;
            graphics.fillEllipse(spotX, spotY, bodySize * 0.25, bodySize * 0.15);
        }

        // Tail - pike have a distinctive forked tail
        const tailSize = bodySize * 0.8;
        const tailX = -pikeLength * 0.45;

        graphics.fillStyle(colors.fins, 0.9);
        graphics.beginPath();
        graphics.moveTo(tailX, 0);
        graphics.lineTo(tailX - tailSize * 0.8, -tailSize * 0.7);
        graphics.lineTo(tailX - tailSize * 0.8, tailSize * 0.7);
        graphics.closePath();
        graphics.fillPath();

        // Dorsal fin - far back on pike (near tail)
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

    /**
     * Render northern pike body (for gameplay)
     */
    renderBody(bodySize, isMovingRight) {
        this.graphics.save();
        this.graphics.translateCanvas(this.x, this.y);

        if (isMovingRight) {
            this.graphics.rotateCanvas(this.angle);
        } else {
            this.graphics.scaleCanvas(-1, 1);
            this.graphics.rotateCanvas(-this.angle);
        }

        this.drawFishShape(this.graphics, bodySize);

        this.graphics.restore();
    }

    /**
     * Render northern pike at position (for catch popup)
     */
    renderBodyAtPosition(graphics, bodySize) {
        this.drawFishShape(graphics, bodySize);
    }
}

export default NorthernPike;
