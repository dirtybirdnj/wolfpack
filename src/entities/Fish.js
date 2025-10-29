/**
 * Fish.js - Factory for creating species-specific fish instances
 *
 * This file provides a factory function that creates the appropriate
 * species-specific fish class based on the species parameter.
 *
 * The biological models for each species are now in separate files:
 * - src/models/fish.js - Base Fish class with common properties
 * - src/models/lake-trout.js - Lake Trout specific implementation
 * - src/models/northern-pike.js - Northern Pike specific implementation
 * - src/models/smallmouth-bass.js - Smallmouth Bass specific implementation
 * - src/models/yellow-perch.js - Yellow Perch specific implementation
 */

import LakeTrout from '../models/lake-trout.js';
import NorthernPike from '../models/northern-pike.js';
import SmallmouthBass from '../models/smallmouth-bass.js';
import YellowPerch from '../models/yellow-perch.js';

/**
 * Factory function to create the appropriate fish species
 * @param {Object} scene - Phaser scene
 * @param {number} x - World X position
 * @param {number} y - Screen Y position
 * @param {string} size - Size category (SMALL, MEDIUM, LARGE, TROPHY)
 * @param {string} fishingType - Type of fishing (ice, kayak, motorboat)
 * @param {string} species - Species identifier
 * @returns {Fish} Species-specific fish instance
 */
export function createFish(scene, x, y, size = 'MEDIUM', fishingType = null, species = 'lake_trout') {
    switch (species) {
        case 'lake_trout':
            return new LakeTrout(scene, x, y, size, fishingType);
        case 'northern_pike':
            return new NorthernPike(scene, x, y, size, fishingType);
        case 'smallmouth_bass':
            return new SmallmouthBass(scene, x, y, size, fishingType);
        case 'yellow_perch_large':
            return new YellowPerch(scene, x, y, size, fishingType);
        default:
            console.warn(`Unknown species: ${species}, defaulting to Lake Trout`);
            return new LakeTrout(scene, x, y, size, fishingType);
    }
}

/**
 * Fish class - for backward compatibility
 * This allows existing code to use `new Fish(...)` syntax
 */
export class Fish {
    constructor(scene, x, y, size = 'MEDIUM', fishingType = null, species = 'lake_trout') {
        return createFish(scene, x, y, size, fishingType, species);
    }
}

// Export both the class and factory function
export default Fish;
