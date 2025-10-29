import { Fish } from '../fish.js';
import { Utils } from '../../utils/Constants.js';
import GameConfig from '../../config/GameConfig.js';

/**
 * Lake Trout - Slow growth, long-lived cold water predator
 * Salvelinus namaycush
 */
export class LakeTrout extends Fish {
    constructor(scene, x, y, size = 'MEDIUM', fishingType = null) {
        super(scene, x, y, size, fishingType, 'lake_trout');

        // Lake trout are MUCH hungrier - voracious predators
        this.hunger = Utils.randomBetween(80, 100);
    }

    calculateLength() {
        // Lake trout: length in inches ≈ 10.5 * weight^0.31
        return Math.round(10.5 * Math.pow(this.weight, 0.31));
    }

    calculateBiologicalAge() {
        // Lake trout age-weight relationship (slow growth, long-lived)
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

    /**
     * Render lake trout with rotation and position
     */
    render(graphics, bodySize, isMovingRight) {
        graphics.save();
        graphics.translateCanvas(this.x, this.y);

        if (isMovingRight) {
            graphics.rotateCanvas(this.angle);
        } else {
            graphics.scaleCanvas(-1, 1);
            graphics.rotateCanvas(-this.angle);
        }

        this.renderBody(graphics, bodySize);

        graphics.restore();
    }

    /**
     * Render lake trout body (shared by render and renderAtPosition)
     */
    renderBody(graphics, bodySize, centerX = 0, centerY = 0) {
        // Main body - grayish-olive color
        graphics.fillStyle(GameConfig.COLOR_FISH_BODY, 1.0);
        graphics.fillEllipse(centerX, centerY, bodySize * 2.5, bodySize * 0.8);

        // Belly - cream/pinkish lighter color
        graphics.fillStyle(GameConfig.COLOR_FISH_BELLY, 0.8);
        graphics.fillEllipse(centerX, centerY + bodySize * 0.2, bodySize * 2.2, bodySize * 0.5);

        // Tail fin
        const tailSize = bodySize * 0.7;
        const tailX = centerX - bodySize * 1.25;

        graphics.fillStyle(GameConfig.COLOR_FISH_FINS, 0.9);
        graphics.beginPath();
        graphics.moveTo(tailX, centerY);
        graphics.lineTo(tailX - tailSize, centerY - tailSize * 0.6);
        graphics.lineTo(tailX - tailSize, centerY + tailSize * 0.6);
        graphics.closePath();
        graphics.fillPath();

        // Dorsal and pectoral fins
        graphics.fillStyle(GameConfig.COLOR_FISH_FINS, 0.7);
        graphics.fillTriangle(
            centerX, centerY - bodySize * 0.5,
            centerX - bodySize * 0.3, centerY - bodySize * 1.2,
            centerX + bodySize * 0.3, centerY - bodySize * 1.2
        );
        const finX = centerX - bodySize * 0.3;
        graphics.fillTriangle(
            finX, centerY,
            finX - bodySize * 0.4, centerY - bodySize * 0.3,
            finX - bodySize * 0.4, centerY + bodySize * 0.3
        );
    }

    /**
     * Render at a custom position (for catch popup)
     */
    renderAtPosition(graphics, x, y, bodySize) {
        console.log('LakeTrout renderAtPosition called:', { x, y, bodySize });

        // Use canvas transformation to position the fish
        graphics.save();
        console.log('Saved graphics state');

        graphics.translateCanvas(x, y);
        console.log('Translated canvas to', x, y);

        // Render body at origin (0,0) relative to translated position
        this.renderBody(graphics, bodySize, 0, 0);
        console.log('renderBody completed');

        graphics.restore();
        console.log('Restored graphics state');
    }
}

export default LakeTrout;
