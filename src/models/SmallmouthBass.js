import { Fish } from './fish.js';
import { Utils } from '../utils/Constants.js';

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
}

export default SmallmouthBass;
