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
export interface ZooplanktonData extends BaseOrganism {
    type: 'zooplankton';
    verticalDrift: boolean;
    lifespan: number;
    spawnInGroups: boolean;
    groupSize: SizeRange;
    hue: number | null;
    alpha: number;
}
export interface CrayfishData extends BaseOrganism {
    type: 'crayfish';
    huntingRange: number;
    consumptionRange: number;
    burstEscape: BurstEscapeConfig;
    bottomDwelling: boolean;
    preferredBy: string[];
}
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
export declare const ZOOPLANKTON_DATA: ZooplanktonData;
export declare const CRAYFISH_DATA: CrayfishData;
export declare const BAITFISH_SPECIES: Record<string, FishData>;
export declare const PREDATOR_SPECIES: Record<string, FishData>;
export declare const ORGANISMS: Record<string, OrganismData>;
/**
 * Get organism data by type/species
 */
export declare function getOrganismData(typeOrSpecies: string): OrganismData | undefined;
/**
 * Get all baitfish species
 */
export declare function getBaitfishSpecies(): string[];
/**
 * Get all predator species
 */
export declare function getPredatorSpecies(): string[];
/**
 * Check if predator can eat prey
 */
export declare function canEat(predatorType: string, preyType: string): boolean;
/**
 * Get food chain level (0 = bottom, higher = top predator)
 */
export declare function getFoodChainLevel(typeOrSpecies: string): number;
export default ORGANISMS;
//# sourceMappingURL=OrganismData.d.ts.map