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

import GameConfig from './GameConfig.js';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

export type OrganismType = 'fish' | 'crayfish' | 'zooplankton';
export type OrganismCategory = 'prey' | 'predator' | 'predator_prey';

export interface SizeRange {
    min: number;
    max: number;
}

export interface WeightRange {
    min: number;
    max: number;
}

export interface SpeedConfig {
    base: number;
    drift?: number;
    panic?: number;
    chase?: number;
    burst?: number;
}

export interface SchoolingConfig {
    enabled: boolean;
    searchRadius?: number;
    separationRadius?: number;
    alignmentRadius?: number;
    cohesionRadius?: number;
    maxSchoolSize?: number;
    fleeSpeed?: number;
    weights?: {
        separation: number;
        alignment: number;
        cohesion: number;
    };
}

export interface BurstEscapeConfig {
    enabled: boolean;
    duration: number;
    cooldown: number;
    triggerRadius: number;
    direction: string;
}

export interface HuntingConfig {
    enabled: boolean;
    visionRange: number;
    strikeSpeed: number;
    targetTypes: string[];
    preySize: SizeRange;
    ambushBehavior?: boolean;
    aggressive?: boolean;
    deepWaterHunter?: boolean;
    preferredPrey?: string[];
}

export interface BiologyConfig {
    hunger: boolean;
    hungerRate: number;
    health: boolean;
    metabolismRate: number;
    maxHunger: number;
    maxHealth: number;
}

export interface DepthRange {
    min: number;
    max: number;
}

// Base organism interface
export interface BaseOrganism {
    type: OrganismType;
    category: OrganismCategory;
    size?: number;
    sizeRange: SizeRange;
    weightRange?: WeightRange;
    length?: number;
    speed: SpeedConfig;
    canBeEaten: boolean;
    eatenBy?: string[];
    canEat?: string[];
    depthRange: DepthRange;
    color: number;
    panicColor?: number;
    nutritionValue?: number;
}

// Zooplankton specific
export interface ZooplanktonData extends BaseOrganism {
    type: 'zooplankton';
    verticalDrift: boolean;
    lifespan: number;
    spawnInGroups: boolean;
    groupSize: SizeRange;
    hue: number | null;
    alpha: number;
}

// Crayfish specific
export interface CrayfishData extends BaseOrganism {
    type: 'crayfish';
    huntingRange: number;
    consumptionRange: number;
    burstEscape: BurstEscapeConfig;
    bottomDwelling: boolean;
    preferredBy: string[];
}

// Fish specific (baitfish and predators)
export interface FishData extends BaseOrganism {
    type: 'fish';
    species: string;
    name: string;
    schooling: SchoolingConfig;
    spawnDepthPreference?: number[];
    bottomDwelling?: boolean;
    texture: string;
    preferredBy?: string[];
    rarity?: string;
    spawnRateMultiplier?: number;
    hunting?: HuntingConfig;
    biology?: BiologyConfig;
    preferredDepth?: number[];
    structureOriented?: boolean;
    vegetationOriented?: boolean;
    coldWaterSpecies?: boolean;
    points?: number;
    difficulty?: string;
}

export type OrganismData = ZooplanktonData | CrayfishData | FishData;

// ===================================================================
// TEST SPECIES - Color-coded ecosystem testing (DEV ONLY)
// ===================================================================
// These are visual placeholders to test the 4-tier ecosystem:
// - GREEN: Prey (baitfish) - Schools, gets eaten
// - BLUE: Mid-tier predator/prey - Hunts green, eaten by red
// - RED: Apex predator - Hunts blue/green, chases player lure
//
// Real species (Alewife, Lake Trout, etc.) plug into same slots

export const TEST_SPECIES: Record<string, FishData> = {
    test_green: {
        type: 'fish',
        category: 'prey',
        species: 'test_green',
        name: 'Test Prey (Green)',

        // Physical
        sizeRange: { min: 4, max: 8 },
        weightRange: { min: 0.1, max: 0.3 },

        // Movement - fast, schooling
        speed: { base: 1.0, panic: 1.5 }, // SLOWED for visibility, gentle panic

        // Behavior - prey
        canBeEaten: true,
        eatenBy: ['test_blue', 'test_red'],
        canEat: ['zooplankton'],

        // Schooling - tight schools like alewife
        schooling: {
            enabled: true,
            searchRadius: 80,
            separationRadius: 15,
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

        // Visual - BRIGHT GREEN
        color: 0x00ff00,
        panicColor: 0x88ff88,
        texture: 'alewife', // Use alewife texture, tint green

        // Game mechanics
        nutritionValue: 12,
        rarity: 'common'
    },

    test_blue: {
        type: 'fish',
        category: 'predator', // Changed from predator_prey to render at proper size
        species: 'test_blue',
        name: 'Test Mid-Tier (Blue)',

        // Physical - medium size (perch-sized in shallow water)
        sizeRange: { min: 6, max: 12 },
        weightRange: { min: 0.5, max: 2 },

        // Movement
        speed: { base: 1.2, chase: 2.5, panic: 3.5 },

        // Behavior - hunts green, eaten by red
        canBeEaten: true,
        eatenBy: ['test_red'],
        canEat: ['zooplankton', 'test_green'],

        // Schooling - DISABLED (predator category uses AI movement)
        schooling: {
            enabled: false
        },

        // Hunting
        hunting: {
            enabled: true,
            visionRange: 120,
            strikeSpeed: 3.5,
            targetTypes: ['test_green'],
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

        // Visual - BRIGHT BLUE
        color: 0x0000ff,
        texture: 'yellow_perch', // Use yellow perch texture, tint blue

        // Game mechanics
        points: 5,
        difficulty: 'easy'
    },

    test_red: {
        type: 'fish',
        category: 'predator',
        species: 'test_red',
        name: 'Test Apex (Red)',

        // Physical - large
        sizeRange: { min: 18, max: 36 },
        weightRange: { min: 3, max: 20 },

        // Movement - smooth and fast
        speed: { base: 1.5, chase: 3.5 },

        // Behavior - apex predator
        canBeEaten: false,
        canEat: ['zooplankton', 'crayfish', 'test_green', 'test_blue'],

        // No schooling - solitary hunter
        schooling: {
            enabled: false
        },

        // Hunting - aggressive
        hunting: {
            enabled: true,
            visionRange: 180,
            strikeSpeed: 4.5,
            targetTypes: ['crayfish', 'test_green', 'test_blue'],
            preySize: { min: 3, max: 15 },
            deepWaterHunter: true,
            preferredPrey: ['test_green', 'test_blue']
        },

        // Biology
        biology: {
            hunger: true,
            hungerRate: 0.08,
            health: true,
            metabolismRate: 0.03,
            maxHunger: 100,
            maxHealth: 100
        },

        // Depth
        depthRange: { min: 40, max: 150 },
        preferredDepth: [60, 100],
        coldWaterSpecies: true,

        // Visual - BRIGHT RED
        color: 0xff0000,
        texture: 'lake_trout', // Use lake trout texture, tint red

        // Game mechanics
        points: 30,
        difficulty: 'hard'
    }
};

// ===================================================================
// ZOOPLANKTON - Base of food chain
// ===================================================================

export const ZOOPLANKTON_DATA: ZooplanktonData = {
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

export const CRAYFISH_DATA: CrayfishData = {
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

export const BAITFISH_SPECIES: Record<string, FishData> = {
    alewife: {
        type: 'fish',
        category: 'prey',
        species: 'alewife',
        name: 'Alewife',

        // Physical
        sizeRange: { min: 4, max: 8 },
        weightRange: { min: 0.1, max: 0.3 },

        // Movement
        speed: { base: 1.0, panic: 3.0 }, // Reduced for more natural movement

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
        speed: { base: 1.2, panic: 3.5 }, // Reduced for more natural movement

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

export const PREDATOR_SPECIES: Record<string, FishData> = {
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

        // Wolf pack schooling - pike hunt in loose packs, aggressive peeling
        schooling: {
            enabled: true,
            searchRadius: 180,        // Wide search for packmates
            separationRadius: 70,     // VERY loose - comfortable spacing
            alignmentRadius: 100,     // Loose alignment
            cohesionRadius: 130,      // Weak pull together - easy to peel off
            maxSchoolSize: 6,         // Small aggressive packs (2-6 pike)
            weights: {
                separation: 0.5,      // Very low - don't mind being close
                alignment: 0.3,       // Very low - independent heading
                cohesion: 0.15        // EXTREMELY low - individuals peel off aggressively
            }
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

        // Wolf pack schooling - loose formation, prone to peeling for strikes
        schooling: {
            enabled: true,
            searchRadius: 200,        // Wide search for packmates
            separationRadius: 80,     // VERY loose - comfortable spacing
            alignmentRadius: 120,     // Loose alignment
            cohesionRadius: 150,      // Weak pull together - easy to peel off
            maxSchoolSize: 8,         // Small wolf packs (2-8 fish)
            weights: {
                separation: 0.6,      // Low - don't mind being close
                alignment: 0.4,       // Low - independent heading
                cohesion: 0.2         // VERY low - individuals peel off easily
            }
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

export const ORGANISMS: Record<string, OrganismData> = {
    // Bottom of food chain
    zooplankton: ZOOPLANKTON_DATA,

    // Middle
    crayfish: CRAYFISH_DATA,

    // TEST SPECIES (DEV ONLY) - Color-coded for ecosystem testing
    ...TEST_SPECIES,

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
export function getOrganismData(typeOrSpecies: string): OrganismData | undefined {
    return ORGANISMS[typeOrSpecies];
}

/**
 * Get all baitfish species
 */
export function getBaitfishSpecies(): string[] {
    return Object.keys(BAITFISH_SPECIES);
}

/**
 * Get all predator species
 */
export function getPredatorSpecies(): string[] {
    return Object.keys(PREDATOR_SPECIES);
}

/**
 * Check if predator can eat prey
 */
export function canEat(predatorType: string, preyType: string): boolean {
    const predator = getOrganismData(predatorType);
    const prey = getOrganismData(preyType);

    if (!predator || !prey) return false;

    // Check if predator's canEat includes prey's category
    if (predator.canEat && predator.canEat.includes(prey.category)) return true;

    // Check if predator's canEat includes specific prey species
    if (predator.canEat && predator.canEat.includes(preyType)) return true;

    // Check if prey's eatenBy includes predator species
    if (prey.eatenBy && prey.eatenBy.includes(predatorType)) return true;

    return false;
}

/**
 * Get food chain level (0 = bottom, higher = top predator)
 */
export function getFoodChainLevel(typeOrSpecies: string): number {
    const organism = getOrganismData(typeOrSpecies);
    if (!organism) return 0;

    if (organism.type === 'zooplankton') return 0;
    if (organism.type === 'crayfish') return 1;
    if (organism.category === 'prey') return 1;
    if (organism.category === 'predator_prey') return 2;
    if (organism.category === 'predator') return 3;

    return 0;
}

export default ORGANISMS;
