import { Fish } from './fish.js';
import { Utils } from '../utils/Constants.js';

/**
 * Yellow Perch - Fast growth, shorter lifespan
 * Perca flavescens
 */
export class YellowPerch extends Fish {
    constructor(scene, x, y, size = 'MEDIUM', fishingType = null) {
        super(scene, x, y, size, fishingType, 'yellow_perch_large');
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
}

export default YellowPerch;
