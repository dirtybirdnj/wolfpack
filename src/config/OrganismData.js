/**
 * OrganismData - Unified configuration for ALL water organisms
 *
 * Replaces SpeciesData.js with a unified structure that includes:
 * - Fish (baitfish and predators)
 * - Crayfish (predator/prey)
 * - Zooplankton (prey only)
 *
 * Each organism has a 'type' and 'category' to determine behavior:
 * - type: 'fish' | 'crayfish' | 'zooplankton'
 * - category: 'prey' | 'predator' | 'predator_prey'
 */
// ===================================================================
// ZOOPLANKTON - Base of food chain
// ===================================================================
export const ZOOPLANKTON_DATA = {
    type: 'zooplankton',
    category: 'prey',
    // Physical
    size: 1,
    sizeRange: { min: 1, max: 2 }, // pixels
    // Movement
    speed: { base: 0.2, drift: 0.1 },
    verticalDrift: true,
    // Behavior
    canBeEaten: true,
    eatenBy: ['bait', 'crayfish'], // categories that can eat zooplankton
    lifespan: 30000, // 30 seconds before despawn
    // Spawning
    depthRange: { min: 20, max: 100 },
    spawnInGroups: true,
    groupSize: { min: 50, max: 200 },
    // Visual
    color: 0x88ff88,
    hue: null, // Set randomly per instance
    alpha: 0.6,
    // Nutrition
    nutritionValue: 1 // Minimal food value
};
// ===================================================================
// CRAYFISH - Middle predator/prey
// ===================================================================
export const CRAYFISH_DATA = {
    type: 'crayfish',
    category: 'predator_prey',
    // Physical
    size: 2,
    sizeRange: { min: 2, max: 4 }, // inches
    weightRange: { min: 0.05, max: 0.2 }, // lbs
    length: 3, // inches average
    // Movement
    speed: { base: 0.5, burst: 5.0 },
    // Behavior
    canBeEaten: true,
    eatenBy: ['smallmouth_bass', 'lake_trout', 'northern_pike'], // Species that eat crayfish
    canEat: ['zooplankton'],
    // Hunting
    huntingRange: 50, // pixels
    consumptionRange: 10, // Must be this close to eat
    // Escape behavior
    burstEscape: {
        enabled: true,
        duration: 500, // ms of burst
        cooldown: 3000, // ms before can burst again
        triggerRadius: 100, // Distance from predator to trigger
        direction: 'backward' // Crayfish swim backward when escaping
    },
    // Habitat
    depthRange: { min: 80, max: 100 }, // Bottom dwellers
    bottomDwelling: true,
    // Visual
    color: 0x8B4513, // Brown
    panicColor: 0xA0522D, // Lighter brown
    // Nutrition
    nutritionValue: 25, // Good food source for bass
    preferredBy: ['smallmouth_bass'] // Bass LOVE crayfish
};
// ===================================================================
// BAITFISH - Prey fish that school
// ===================================================================
export const BAITFISH_SPECIES = {
    alewife: {
        type: 'fish',
        category: 'prey',
        species: 'alewife',
        name: 'Alewife',
        // Physical
        sizeRange: { min: 4, max: 8 },
        weightRange: { min: 0.1, max: 0.3 },
        // Movement
        speed: { base: 2.2, panic: 4.5 },
        // Behavior
        canBeEaten: true,
        eatenBy: ['yellow_perch', 'smallmouth_bass', 'northern_pike', 'lake_trout'],
        canEat: ['zooplankton'],
        // Schooling - TIGHT bait ball
        schooling: {
            enabled: true,
            searchRadius: 80,
            separationRadius: 15, // TIGHT
            alignmentRadius: 40,
            cohesionRadius: 60,
            maxSchoolSize: 100,
            weights: {
                separation: 1.5,
                alignment: 1.0,
                cohesion: 1.0
            }
        },
        // Depth
        depthRange: { min: 10, max: 100 },
        spawnDepthPreference: [20, 80],
        // Visual
        color: 0x88ccff,
        panicColor: 0xccddff,
        texture: 'baitfish_alewife',
        // Nutrition
        nutritionValue: 12,
        preferredBy: ['lake_trout']
    },
    rainbow_smelt: {
        type: 'fish',
        category: 'prey',
        species: 'rainbow_smelt',
        name: 'Rainbow Smelt',
        sizeRange: { min: 5, max: 10 },
        weightRange: { min: 0.15, max: 0.4 },
        speed: { base: 2.5, panic: 5.0 },
        canBeEaten: true,
        eatenBy: ['yellow_perch', 'smallmouth_bass', 'northern_pike', 'lake_trout'],
        canEat: ['zooplankton'],
        schooling: {
            enabled: true,
            searchRadius: 70,
            separationRadius: 12, // VERY tight
            alignmentRadius: 35,
            cohesionRadius: 50,
            maxSchoolSize: 60,
            weights: {
                separation: 2.0, // Extra tight
                alignment: 1.2,
                cohesion: 1.0
            }
        },
        depthRange: { min: 30, max: 80 },
        spawnDepthPreference: [30, 80],
        color: 0xc0d0e0,
        panicColor: 0xe0e8f0,
        texture: 'baitfish_rainbow_smelt',
        nutritionValue: 16,
        preferredBy: ['lake_trout']
    },
    sculpin: {
        type: 'fish',
        category: 'prey',
        species: 'sculpin',
        name: 'Slimy Sculpin',
        sizeRange: { min: 2, max: 5 },
        weightRange: { min: 0.05, max: 0.15 },
        speed: { base: 1.5, panic: 4.0 },
        canBeEaten: true,
        eatenBy: ['smallmouth_bass', 'northern_pike', 'lake_trout'],
        canEat: ['zooplankton'],
        schooling: {
            enabled: false // Solitary bottom dweller
        },
        depthRange: { min: 60, max: 120 },
        spawnDepthPreference: [80, 120],
        bottomDwelling: true,
        color: 0x4a5a3a,
        panicColor: 0x5a6a4a,
        texture: 'baitfish_sculpin',
        nutritionValue: 8
    },
    cisco: {
        type: 'fish',
        category: 'prey',
        species: 'cisco',
        name: 'Cisco / Lake Herring',
        sizeRange: { min: 8, max: 16 }, // Larger baitfish
        weightRange: { min: 0.3, max: 1.0 },
        speed: { base: 4.0, panic: 8.0 }, // Extremely fast - elite swimmers!
        canBeEaten: true,
        eatenBy: ['yellow_perch', 'smallmouth_bass', 'northern_pike', 'lake_trout'],
        canEat: ['zooplankton'],
        schooling: {
            enabled: true,
            searchRadius: 100,
            separationRadius: 25,
            alignmentRadius: 60,
            cohesionRadius: 80,
            maxSchoolSize: 80,
            fleeSpeed: 8.0
        },
        depthRange: { min: 50, max: 100 }, // Deep, cold water specialist
        spawnDepthPreference: [60, 100],
        color: 0xaaccff, // Bright silver with blue-violet back
        panicColor: 0xccddff,
        texture: 'baitfish_cisco',
        nutritionValue: 18, // Large, nutritious
        rarity: 'rare', // Historically important but now rare
        spawnRateMultiplier: 0.1 // Only 10% of normal spawn rate
    },
    shiner: {
        type: 'fish',
        category: 'prey',
        species: 'shiner',
        name: 'Shiner',
        sizeRange: { min: 2, max: 5 },
        weightRange: { min: 0.05, max: 0.2 },
        speed: { base: 2.8, panic: 5.5 },
        canBeEaten: true,
        eatenBy: ['yellow_perch', 'smallmouth_bass', 'northern_pike', 'lake_trout'],
        canEat: ['zooplankton'],
        schooling: {
            enabled: true,
            searchRadius: 90,
            separationRadius: 20,
            alignmentRadius: 50,
            cohesionRadius: 70,
            maxSchoolSize: 80,
            weights: {
                separation: 1.3,
                alignment: 1.0,
                cohesion: 0.9
            }
        },
        depthRange: { min: 5, max: 40 },
        spawnDepthPreference: [10, 30],
        color: 0xffd700,
        panicColor: 0xffec8b,
        texture: 'baitfish_shiner',
        nutritionValue: 10
    },
    sticklebacks: {
        type: 'fish',
        category: 'prey',
        species: 'sticklebacks',
        name: 'Threespine Stickleback',
        sizeRange: { min: 2, max: 3 },
        weightRange: { min: 0.02, max: 0.05 },
        speed: { base: 2.0, panic: 4.5 },
        canBeEaten: true,
        eatenBy: ['yellow_perch', 'smallmouth_bass', 'northern_pike'],
        canEat: ['zooplankton'],
        schooling: {
            enabled: true,
            searchRadius: 60,
            separationRadius: 18,
            alignmentRadius: 40,
            cohesionRadius: 55,
            maxSchoolSize: 50,
            weights: {
                separation: 1.4,
                alignment: 0.9,
                cohesion: 0.8
            }
        },
        depthRange: { min: 5, max: 30 },
        spawnDepthPreference: [5, 20],
        color: 0x6b8e23,
        panicColor: 0x9acd32,
        texture: 'baitfish_sticklebacks',
        nutritionValue: 6
    }
};
// ===================================================================
// PREDATOR FISH - Game fish with AI and hunting
// ===================================================================
export const PREDATOR_SPECIES = {
    yellow_perch: {
        type: 'fish',
        category: 'predator_prey', // Can be eaten by larger fish
        species: 'yellow_perch',
        name: 'Yellow Perch',
        // Physical
        sizeRange: { min: 6, max: 12 },
        weightRange: { min: 0.5, max: 2 },
        // Movement
        speed: { base: 1.2, chase: 2.5, panic: 3.5 },
        // Behavior
        canBeEaten: true,
        eatenBy: ['smallmouth_bass', 'northern_pike', 'lake_trout'],
        canEat: ['zooplankton', 'bait'],
        // Schooling - LOOSE pack
        schooling: {
            enabled: true,
            searchRadius: 120,
            separationRadius: 40, // LOOSE
            alignmentRadius: 80,
            cohesionRadius: 100,
            maxSchoolSize: 30,
            weights: {
                separation: 1.0,
                alignment: 0.8,
                cohesion: 0.6
            }
        },
        // Hunting
        hunting: {
            enabled: true,
            visionRange: 120,
            strikeSpeed: 3.5,
            targetTypes: ['bait'],
            preySize: { min: 2, max: 6 }
        },
        // Biology
        biology: {
            hunger: true,
            hungerRate: 0.05,
            health: true,
            metabolismRate: 0.02,
            maxHunger: 100,
            maxHealth: 100
        },
        // Depth
        depthRange: { min: 10, max: 60 },
        preferredDepth: [20, 40],
        // Visual
        color: 0xffcc00,
        texture: 'fish_yellow_perch',
        // Game mechanics
        points: 5,
        difficulty: 'easy'
    },
    smallmouth_bass: {
        type: 'fish',
        category: 'predator',
        species: 'smallmouth_bass',
        name: 'Smallmouth Bass',
        sizeRange: { min: 12, max: 20 },
        weightRange: { min: 1, max: 5 },
        speed: { base: 1.0, chase: 3.5 },
        canBeEaten: false,
        canEat: ['zooplankton', 'crayfish', 'bait', 'yellow_perch'],
        // Optional loose schooling (small groups)
        schooling: {
            enabled: true,
            searchRadius: 100,
            separationRadius: 60, // VERY loose
            alignmentRadius: 80,
            cohesionRadius: 100,
            maxSchoolSize: 5, // Small groups
            weights: {
                separation: 0.8,
                alignment: 0.5,
                cohesion: 0.3
            }
        },
        hunting: {
            enabled: true,
            visionRange: 150,
            strikeSpeed: 4.0,
            targetTypes: ['crayfish', 'bait', 'yellow_perch'],
            preySize: { min: 2, max: 10 },
            ambushBehavior: true,
            preferredPrey: ['crayfish'] // Bass LOVE crayfish
        },
        biology: {
            hunger: true,
            hungerRate: 0.07,
            health: true,
            metabolismRate: 0.025,
            maxHunger: 100,
            maxHealth: 100
        },
        depthRange: { min: 10, max: 40 },
        preferredDepth: [15, 30],
        structureOriented: true,
        color: 0x8b6914,
        texture: 'fish_smallmouth_bass',
        points: 15,
        difficulty: 'medium'
    },
    northern_pike: {
        type: 'fish',
        category: 'predator',
        species: 'northern_pike',
        name: 'Northern Pike',
        sizeRange: { min: 20, max: 40 },
        weightRange: { min: 3, max: 15 },
        speed: { base: 0.8, chase: 5.0 },
        canBeEaten: false,
        canEat: ['crayfish', 'bait', 'yellow_perch', 'smallmouth_bass'],
        schooling: {
            enabled: false // Solitary ambush predator
        },
        hunting: {
            enabled: true,
            visionRange: 180,
            strikeSpeed: 5.5,
            targetTypes: ['crayfish', 'bait', 'yellow_perch'],
            preySize: { min: 3, max: 15 },
            ambushBehavior: true,
            aggressive: true
        },
        biology: {
            hunger: true,
            hungerRate: 0.09,
            health: true,
            metabolismRate: 0.03,
            maxHunger: 100,
            maxHealth: 100
        },
        depthRange: { min: 5, max: 30 },
        preferredDepth: [10, 25],
        vegetationOriented: true,
        color: 0x2d5016,
        texture: 'fish_northern_pike',
        points: 25,
        difficulty: 'hard'
    },
    lake_trout: {
        type: 'fish',
        category: 'predator',
        species: 'lake_trout',
        name: 'Lake Trout',
        sizeRange: { min: 18, max: 36 },
        weightRange: { min: 3, max: 20 },
        speed: { base: 0.8, chase: 3.0 },
        canBeEaten: false,
        canEat: ['crayfish', 'bait', 'yellow_perch'],
        schooling: {
            enabled: false // Solitary deep water hunter
        },
        hunting: {
            enabled: true,
            visionRange: 180,
            strikeSpeed: 4.5,
            targetTypes: ['crayfish', 'bait', 'yellow_perch'],
            preySize: { min: 3, max: 15 },
            deepWaterHunter: true,
            preferredPrey: ['rainbow_smelt', 'alewife']
        },
        biology: {
            hunger: true,
            hungerRate: 0.08,
            health: true,
            metabolismRate: 0.03,
            maxHunger: 100,
            maxHealth: 100
        },
        depthRange: { min: 40, max: 150 },
        preferredDepth: [60, 100],
        coldWaterSpecies: true,
        color: 0x4a5d23,
        texture: 'fish_lake_trout',
        points: 30,
        difficulty: 'hard'
    }
};
// ===================================================================
// UNIFIED ORGANISM DATA
// ===================================================================
export const ORGANISMS = {
    // Bottom of food chain
    zooplankton: ZOOPLANKTON_DATA,
    // Middle
    crayfish: CRAYFISH_DATA,
    // Baitfish (prey)
    ...BAITFISH_SPECIES,
    // Predators
    ...PREDATOR_SPECIES
};
// ===================================================================
// HELPER FUNCTIONS
// ===================================================================
/**
 * Get organism data by type/species
 */
export function getOrganismData(typeOrSpecies) {
    return ORGANISMS[typeOrSpecies];
}
/**
 * Get all baitfish species
 */
export function getBaitfishSpecies() {
    return Object.keys(BAITFISH_SPECIES);
}
/**
 * Get all predator species
 */
export function getPredatorSpecies() {
    return Object.keys(PREDATOR_SPECIES);
}
/**
 * Check if predator can eat prey
 */
export function canEat(predatorType, preyType) {
    const predator = getOrganismData(predatorType);
    const prey = getOrganismData(preyType);
    if (!predator || !prey)
        return false;
    // Check if predator's canEat includes prey's category
    if (predator.canEat && predator.canEat.includes(prey.category))
        return true;
    // Check if predator's canEat includes specific prey species
    if (predator.canEat && predator.canEat.includes(preyType))
        return true;
    // Check if prey's eatenBy includes predator species
    if (prey.eatenBy && prey.eatenBy.includes(predatorType))
        return true;
    return false;
}
/**
 * Get food chain level (0 = bottom, higher = top predator)
 */
export function getFoodChainLevel(typeOrSpecies) {
    const organism = getOrganismData(typeOrSpecies);
    if (!organism)
        return 0;
    if (organism.type === 'zooplankton')
        return 0;
    if (organism.type === 'crayfish')
        return 1;
    if (organism.category === 'prey')
        return 1;
    if (organism.category === 'predator_prey')
        return 2;
    if (organism.category === 'predator')
        return 3;
    return 0;
}
export default ORGANISMS;
//# sourceMappingURL=OrganismData.js.map