import Fish from './fish.js';
import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';

/**
 * Lake Trout - Salvelinus namaycush
 * Cold-water predator, pursuit hunting style
 */
export class LakeTrout extends Fish {
    constructor(scene, x, y, size = 'MEDIUM', fishingType = null) {
        super(scene, x, y, size, fishingType, 'lake_trout');
    }

    /**
     * Lake trout length-weight formula
     * length in inches ≈ 10.5 * weight^0.31
     */
    calculateLength() {
        return Math.round(10.5 * Math.pow(this.weight, 0.31));
    }

    /**
     * Lake trout age-weight relationship
     * Slower growth, longer lived species
     */
    calculateBiologicalAge() {
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

    /**
     * Draw lake trout shape - shared rendering code
     * @param {Object} graphics - Phaser graphics object to draw on
     * @param {number} bodySize - Size multiplier for the fish body
     */
    drawFishShape(graphics, bodySize) {
        // Main body - grayish-olive color
        graphics.fillStyle(GameConfig.COLOR_FISH_BODY, 1.0);
        graphics.fillEllipse(0, 0, bodySize * 2.5, bodySize * 0.8);

        // Belly - cream/pinkish lighter color
        graphics.fillStyle(GameConfig.COLOR_FISH_BELLY, 0.8);
        graphics.fillEllipse(0, bodySize * 0.2, bodySize * 2.2, bodySize * 0.5);

        // Tail fin
        const tailSize = bodySize * 0.7;
        const tailX = -bodySize * 1.25;
        const tailY = 0;

        graphics.fillStyle(GameConfig.COLOR_FISH_FINS, 0.9);
        graphics.beginPath();
        graphics.moveTo(tailX, tailY);
        graphics.lineTo(tailX - tailSize, tailY - tailSize * 0.6);
        graphics.lineTo(tailX - tailSize, tailY + tailSize * 0.6);
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

    /**
     * Render lake trout body (for gameplay)
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
     * Render lake trout at position (for catch popup)
     */
    renderBodyAtPosition(graphics, bodySize) {
        this.drawFishShape(graphics, bodySize);
    }
}

export default LakeTrout;
