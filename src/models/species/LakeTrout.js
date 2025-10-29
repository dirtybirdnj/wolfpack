import { Fish } from './fish.js';
import { Utils } from '../utils/Constants.js';

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
}

export default LakeTrout;
