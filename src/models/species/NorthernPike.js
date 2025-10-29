import { Fish } from './fish.js';
import { Utils } from '../utils/Constants.js';

/**
 * Northern Pike - Fast growth, ambush predator
 * Esox lucius
 */
export class NorthernPike extends Fish {
    constructor(scene, x, y, size = 'MEDIUM', fishingType = null) {
        super(scene, x, y, size, fishingType, 'northern_pike');
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
}

export default NorthernPike;
