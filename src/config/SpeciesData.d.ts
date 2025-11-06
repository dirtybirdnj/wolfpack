export function getBaitfishSpecies(speciesName: any): any;
export function getPredatorSpecies(speciesName: any): any;
export function calculateDietPreference(predatorSpecies: any, preySpecies: any): any;
/**
 * Get all spawnable predator species with their weights
 * Returns array of {name, weight} objects normalized to 100%
 * @returns {Array<{name: string, weight: number}>}
 */
export function getSpawnableSpecies(): Array<{
    name: string;
    weight: number;
}>;
/**
 * Select a random species based on spawn weights
 * Config-driven species selection - no hardcoded logic!
 * @returns {string} Species key (e.g., 'lake_trout')
 */
export function selectRandomSpecies(): string;
export namespace BAITFISH_SPECIES {
    namespace alewife {
        let name: string;
        let scientificName: string;
        let status: string;
        namespace sizeRange {
            let min: number;
            let max: number;
        }
        namespace weightRange {
            let min_1: number;
            export { min_1 as min };
            let max_1: number;
            export { max_1 as max };
        }
        namespace depthRange {
            let min_2: number;
            export { min_2 as min };
            let max_2: number;
            export { max_2 as max };
        }
        namespace tempPreference {
            export let optimal: number;
            let min_3: number;
            export { min_3 as min };
            let max_3: number;
            export { max_3 as max };
        }
        namespace schoolSize {
            let min_4: number;
            export { min_4 as min };
            let max_4: number;
            export { max_4 as max };
        }
        let schoolingDensity: string;
        namespace speed {
            let base: number;
            let panic: number;
        }
        let verticalMigration: boolean;
        let color: number;
        let panicColor: number;
        namespace appearance {
            let bodyShape: string;
            let length: number;
            let height: number;
            let features: string[];
        }
        namespace behavior {
            let panicResponse: string;
            let planktonFollower: boolean;
            let activityPattern: string;
            let preferredHabitat: string;
        }
        let spawnDepthPreference: number[];
        let nutritionValue: number;
        let catchDifficulty: string;
        let rarity: string;
        let preferredBy: string[];
        let notes: string;
    }
    namespace rainbow_smelt {
        let name_1: string;
        export { name_1 as name };
        let scientificName_1: string;
        export { scientificName_1 as scientificName };
        let status_1: string;
        export { status_1 as status };
        export namespace sizeRange_1 {
            let min_5: number;
            export { min_5 as min };
            let max_5: number;
            export { max_5 as max };
        }
        export { sizeRange_1 as sizeRange };
        export namespace weightRange_1 {
            let min_6: number;
            export { min_6 as min };
            let max_6: number;
            export { max_6 as max };
        }
        export { weightRange_1 as weightRange };
        export namespace depthRange_1 {
            let min_7: number;
            export { min_7 as min };
            let max_7: number;
            export { max_7 as max };
        }
        export { depthRange_1 as depthRange };
        export namespace tempPreference_1 {
            let optimal_1: number;
            export { optimal_1 as optimal };
            let min_8: number;
            export { min_8 as min };
            let max_8: number;
            export { max_8 as max };
        }
        export { tempPreference_1 as tempPreference };
        export namespace schoolSize_1 {
            let min_9: number;
            export { min_9 as min };
            let max_9: number;
            export { max_9 as max };
        }
        export { schoolSize_1 as schoolSize };
        let schoolingDensity_1: string;
        export { schoolingDensity_1 as schoolingDensity };
        export namespace speed_1 {
            let base_1: number;
            export { base_1 as base };
            let panic_1: number;
            export { panic_1 as panic };
        }
        export { speed_1 as speed };
        let verticalMigration_1: boolean;
        export { verticalMigration_1 as verticalMigration };
        let color_1: number;
        export { color_1 as color };
        let panicColor_1: number;
        export { panicColor_1 as panicColor };
        export namespace appearance_1 {
            let bodyShape_1: string;
            export { bodyShape_1 as bodyShape };
            let length_1: number;
            export { length_1 as length };
            let height_1: number;
            export { height_1 as height };
            let features_1: string[];
            export { features_1 as features };
        }
        export { appearance_1 as appearance };
        export namespace behavior_1 {
            let panicResponse_1: string;
            export { panicResponse_1 as panicResponse };
            let planktonFollower_1: boolean;
            export { planktonFollower_1 as planktonFollower };
            let activityPattern_1: string;
            export { activityPattern_1 as activityPattern };
            let preferredHabitat_1: string;
            export { preferredHabitat_1 as preferredHabitat };
            export let attractedToLight: boolean;
        }
        export { behavior_1 as behavior };
        export namespace seasonal {
            namespace spring {
                let depthRange_2: number[];
                export { depthRange_2 as depthRange };
                export let activity: string;
                export namespace schoolSize_2 {
                    let min_10: number;
                    export { min_10 as min };
                    let max_10: number;
                    export { max_10 as max };
                }
                export { schoolSize_2 as schoolSize };
            }
            namespace summer {
                let depthRange_3: number[];
                export { depthRange_3 as depthRange };
                let activity_1: string;
                export { activity_1 as activity };
            }
        }
        let spawnDepthPreference_1: number[];
        export { spawnDepthPreference_1 as spawnDepthPreference };
        let nutritionValue_1: number;
        export { nutritionValue_1 as nutritionValue };
        let catchDifficulty_1: string;
        export { catchDifficulty_1 as catchDifficulty };
        let rarity_1: string;
        export { rarity_1 as rarity };
        let preferredBy_1: string[];
        export { preferredBy_1 as preferredBy };
        let notes_1: string;
        export { notes_1 as notes };
    }
    namespace sculpin {
        let name_2: string;
        export { name_2 as name };
        let scientificName_2: string;
        export { scientificName_2 as scientificName };
        let status_2: string;
        export { status_2 as status };
        export namespace sizeRange_2 {
            let min_11: number;
            export { min_11 as min };
            let max_11: number;
            export { max_11 as max };
        }
        export { sizeRange_2 as sizeRange };
        export namespace weightRange_2 {
            let min_12: number;
            export { min_12 as min };
            let max_12: number;
            export { max_12 as max };
        }
        export { weightRange_2 as weightRange };
        export namespace depthRange_4 {
            let min_13: number;
            export { min_13 as min };
            let max_13: number;
            export { max_13 as max };
        }
        export { depthRange_4 as depthRange };
        export namespace tempPreference_2 {
            let optimal_2: number;
            export { optimal_2 as optimal };
            let min_14: number;
            export { min_14 as min };
            let max_14: number;
            export { max_14 as max };
        }
        export { tempPreference_2 as tempPreference };
        export namespace schoolSize_3 {
            let min_15: number;
            export { min_15 as min };
            let max_15: number;
            export { max_15 as max };
        }
        export { schoolSize_3 as schoolSize };
        let schoolingDensity_2: string;
        export { schoolingDensity_2 as schoolingDensity };
        export namespace speed_2 {
            let base_2: number;
            export { base_2 as base };
            let panic_2: number;
            export { panic_2 as panic };
        }
        export { speed_2 as speed };
        let verticalMigration_2: boolean;
        export { verticalMigration_2 as verticalMigration };
        let color_2: number;
        export { color_2 as color };
        let panicColor_2: number;
        export { panicColor_2 as panicColor };
        export namespace appearance_2 {
            let bodyShape_2: string;
            export { bodyShape_2 as bodyShape };
            let length_2: number;
            export { length_2 as length };
            let height_2: number;
            export { height_2 as height };
            let features_2: string[];
            export { features_2 as features };
        }
        export { appearance_2 as appearance };
        export namespace behavior_2 {
            let panicResponse_2: string;
            export { panicResponse_2 as panicResponse };
            let planktonFollower_2: boolean;
            export { planktonFollower_2 as planktonFollower };
            let activityPattern_2: string;
            export { activityPattern_2 as activityPattern };
            let preferredHabitat_2: string;
            export { preferredHabitat_2 as preferredHabitat };
            export let movementStyle: string;
            export let hidesDuringDay: boolean;
        }
        export { behavior_2 as behavior };
        let spawnDepthPreference_2: number[];
        export { spawnDepthPreference_2 as spawnDepthPreference };
        let nutritionValue_2: number;
        export { nutritionValue_2 as nutritionValue };
        let catchDifficulty_2: string;
        export { catchDifficulty_2 as catchDifficulty };
        let rarity_2: string;
        export { rarity_2 as rarity };
        let preferredBy_2: string[];
        export { preferredBy_2 as preferredBy };
        let notes_2: string;
        export { notes_2 as notes };
    }
    namespace yellow_perch {
        let name_3: string;
        export { name_3 as name };
        let scientificName_3: string;
        export { scientificName_3 as scientificName };
        let status_3: string;
        export { status_3 as status };
        export namespace sizeRange_3 {
            let min_16: number;
            export { min_16 as min };
            let max_16: number;
            export { max_16 as max };
        }
        export { sizeRange_3 as sizeRange };
        export namespace weightRange_3 {
            let min_17: number;
            export { min_17 as min };
            let max_17: number;
            export { max_17 as max };
        }
        export { weightRange_3 as weightRange };
        export namespace depthRange_5 {
            let min_18: number;
            export { min_18 as min };
            let max_18: number;
            export { max_18 as max };
        }
        export { depthRange_5 as depthRange };
        export namespace tempPreference_3 {
            let optimal_3: number;
            export { optimal_3 as optimal };
            let min_19: number;
            export { min_19 as min };
            let max_19: number;
            export { max_19 as max };
        }
        export { tempPreference_3 as tempPreference };
        export namespace schoolSize_4 {
            let min_20: number;
            export { min_20 as min };
            let max_20: number;
            export { max_20 as max };
        }
        export { schoolSize_4 as schoolSize };
        let schoolingDensity_3: string;
        export { schoolingDensity_3 as schoolingDensity };
        export namespace speed_3 {
            let base_3: number;
            export { base_3 as base };
            let panic_3: number;
            export { panic_3 as panic };
        }
        export { speed_3 as speed };
        let verticalMigration_3: boolean;
        export { verticalMigration_3 as verticalMigration };
        let color_3: number;
        export { color_3 as color };
        let panicColor_3: number;
        export { panicColor_3 as panicColor };
        export namespace appearance_3 {
            let bodyShape_3: string;
            export { bodyShape_3 as bodyShape };
            let length_3: number;
            export { length_3 as length };
            let height_3: number;
            export { height_3 as height };
            let features_3: string[];
            export { features_3 as features };
            export let barCount: number;
            export let finColor: number;
        }
        export { appearance_3 as appearance };
        export namespace behavior_3 {
            let panicResponse_3: string;
            export { panicResponse_3 as panicResponse };
            let planktonFollower_3: boolean;
            export { planktonFollower_3 as planktonFollower };
            let activityPattern_3: string;
            export { activityPattern_3 as activityPattern };
            let preferredHabitat_3: string;
            export { preferredHabitat_3 as preferredHabitat };
            export let structureOriented: boolean;
        }
        export { behavior_3 as behavior };
        let spawnDepthPreference_3: number[];
        export { spawnDepthPreference_3 as spawnDepthPreference };
        let nutritionValue_3: number;
        export { nutritionValue_3 as nutritionValue };
        let catchDifficulty_3: string;
        export { catchDifficulty_3 as catchDifficulty };
        let rarity_3: string;
        export { rarity_3 as rarity };
        let preferredBy_3: string[];
        export { preferredBy_3 as preferredBy };
        let notes_3: string;
        export { notes_3 as notes };
    }
    namespace cisco {
        let name_4: string;
        export { name_4 as name };
        let scientificName_4: string;
        export { scientificName_4 as scientificName };
        let status_4: string;
        export { status_4 as status };
        export namespace sizeRange_4 {
            let min_21: number;
            export { min_21 as min };
            let max_21: number;
            export { max_21 as max };
        }
        export { sizeRange_4 as sizeRange };
        export namespace weightRange_4 {
            let min_22: number;
            export { min_22 as min };
            let max_22: number;
            export { max_22 as max };
        }
        export { weightRange_4 as weightRange };
        export namespace depthRange_6 {
            let min_23: number;
            export { min_23 as min };
            let max_23: number;
            export { max_23 as max };
        }
        export { depthRange_6 as depthRange };
        export namespace tempPreference_4 {
            let optimal_4: number;
            export { optimal_4 as optimal };
            let min_24: number;
            export { min_24 as min };
            let max_24: number;
            export { max_24 as max };
        }
        export { tempPreference_4 as tempPreference };
        export namespace schoolSize_5 {
            let min_25: number;
            export { min_25 as min };
            let max_25: number;
            export { max_25 as max };
        }
        export { schoolSize_5 as schoolSize };
        let schoolingDensity_4: string;
        export { schoolingDensity_4 as schoolingDensity };
        export namespace speed_4 {
            let base_4: number;
            export { base_4 as base };
            let panic_4: number;
            export { panic_4 as panic };
        }
        export { speed_4 as speed };
        let verticalMigration_4: boolean;
        export { verticalMigration_4 as verticalMigration };
        let color_4: number;
        export { color_4 as color };
        let panicColor_4: number;
        export { panicColor_4 as panicColor };
        export namespace appearance_4 {
            let bodyShape_4: string;
            export { bodyShape_4 as bodyShape };
            let length_4: number;
            export { length_4 as length };
            let height_4: number;
            export { height_4 as height };
            let features_4: string[];
            export { features_4 as features };
        }
        export { appearance_4 as appearance };
        export namespace behavior_4 {
            let panicResponse_4: string;
            export { panicResponse_4 as panicResponse };
            let planktonFollower_4: boolean;
            export { planktonFollower_4 as planktonFollower };
            let activityPattern_4: string;
            export { activityPattern_4 as activityPattern };
            let preferredHabitat_4: string;
            export { preferredHabitat_4 as preferredHabitat };
        }
        export { behavior_4 as behavior };
        let spawnDepthPreference_4: number[];
        export { spawnDepthPreference_4 as spawnDepthPreference };
        let nutritionValue_4: number;
        export { nutritionValue_4 as nutritionValue };
        let catchDifficulty_4: string;
        export { catchDifficulty_4 as catchDifficulty };
        let rarity_4: string;
        export { rarity_4 as rarity };
        let preferredBy_4: string[];
        export { preferredBy_4 as preferredBy };
        export namespace special {
            let legendary: boolean;
            let achievementTrigger: string;
            let spawnRateMultiplier: number;
        }
        let notes_4: string;
        export { notes_4 as notes };
    }
}
export namespace PREDATOR_SPECIES {
    namespace lake_trout {
        let name_5: string;
        export { name_5 as name };
        let scientificName_5: string;
        export { scientificName_5 as scientificName };
        export let commonNames: string[];
        let status_5: string;
        export { status_5 as status };
        export let spawnWeight: number;
        export namespace sizeCategories {
            namespace small {
                let weightRange_5: number[];
                export { weightRange_5 as weightRange };
                export let lengthRange: number[];
                export let depthPreference: number[];
                export let speedMultiplier: number;
                export let aggressivenessMultiplier: number;
                export let cautiousness: number;
            }
            namespace medium {
                let weightRange_6: number[];
                export { weightRange_6 as weightRange };
                let lengthRange_1: number[];
                export { lengthRange_1 as lengthRange };
                let depthPreference_1: number[];
                export { depthPreference_1 as depthPreference };
                let speedMultiplier_1: number;
                export { speedMultiplier_1 as speedMultiplier };
                let aggressivenessMultiplier_1: number;
                export { aggressivenessMultiplier_1 as aggressivenessMultiplier };
                let cautiousness_1: number;
                export { cautiousness_1 as cautiousness };
            }
            namespace large {
                let weightRange_7: number[];
                export { weightRange_7 as weightRange };
                let lengthRange_2: number[];
                export { lengthRange_2 as lengthRange };
                let depthPreference_2: number[];
                export { depthPreference_2 as depthPreference };
                let speedMultiplier_2: number;
                export { speedMultiplier_2 as speedMultiplier };
                let aggressivenessMultiplier_2: number;
                export { aggressivenessMultiplier_2 as aggressivenessMultiplier };
                let cautiousness_2: number;
                export { cautiousness_2 as cautiousness };
            }
            namespace trophy {
                let weightRange_8: number[];
                export { weightRange_8 as weightRange };
                let lengthRange_3: number[];
                export { lengthRange_3 as lengthRange };
                let depthPreference_3: number[];
                export { depthPreference_3 as depthPreference };
                let speedMultiplier_3: number;
                export { speedMultiplier_3 as speedMultiplier };
                let aggressivenessMultiplier_3: number;
                export { aggressivenessMultiplier_3 as aggressivenessMultiplier };
                let cautiousness_3: number;
                export { cautiousness_3 as cautiousness };
            }
        }
        export namespace tempPreference_5 {
            let optimal_5: number;
            export { optimal_5 as optimal };
            let min_26: number;
            export { min_26 as min };
            let max_26: number;
            export { max_26 as max };
            export let lethal: number;
            export let behaviorAffect: boolean;
        }
        export { tempPreference_5 as tempPreference };
        export namespace depthPreference_4 {
            let spring_1: number[];
            export { spring_1 as spring };
            let summer_1: number[];
            export { summer_1 as summer };
            export let fall: number[];
            export let winter: number[];
        }
        export { depthPreference_4 as depthPreference };
        export namespace dietPreferences {
            let alewife_1: number;
            export { alewife_1 as alewife };
            let rainbow_smelt_1: number;
            export { rainbow_smelt_1 as rainbow_smelt };
            let sculpin_1: number;
            export { sculpin_1 as sculpin };
            let yellow_perch_1: number;
            export { yellow_perch_1 as yellow_perch };
            let cisco_1: number;
            export { cisco_1 as cisco };
        }
        export namespace behavior_5 {
            let feedingPeriods: string[];
            namespace aggressionByDepth {
                let surface: number;
                let midColumn: number;
                let bottom: number;
            }
            let cannibalismChance: number;
            let opportunisticFeeding: boolean;
            let ambushAndPursuit: boolean;
            namespace spawnPeriod {
                let months: number[];
                let behaviorChange: string;
                let feedingReduction: number;
            }
        }
        export { behavior_5 as behavior };
        export namespace activityByTime {
            let dawn: number;
            let morning: number;
            let midday: number;
            let afternoon: number;
            let dusk: number;
            let night: number;
        }
        export namespace fightCharacteristics {
            let initialRun: string;
            let tactics: string[];
            let stamina: string;
            let difficulty: string;
            let deepWaterAdvantage: boolean;
        }
        export namespace habitatPreferences {
            let primary: string[];
            let secondary: string[];
            let avoids: string[];
        }
        let notes_5: string;
        export { notes_5 as notes };
    }
    namespace northern_pike {
        let name_6: string;
        export { name_6 as name };
        let scientificName_6: string;
        export { scientificName_6 as scientificName };
        let commonNames_1: string[];
        export { commonNames_1 as commonNames };
        let status_6: string;
        export { status_6 as status };
        let spawnWeight_1: number;
        export { spawnWeight_1 as spawnWeight };
        export namespace sizeCategories_1 {
            export namespace small_1 {
                let weightRange_9: number[];
                export { weightRange_9 as weightRange };
                let lengthRange_4: number[];
                export { lengthRange_4 as lengthRange };
                let depthPreference_5: number[];
                export { depthPreference_5 as depthPreference };
                let speedMultiplier_4: number;
                export { speedMultiplier_4 as speedMultiplier };
                let aggressivenessMultiplier_4: number;
                export { aggressivenessMultiplier_4 as aggressivenessMultiplier };
                let cautiousness_4: number;
                export { cautiousness_4 as cautiousness };
                export let ambushIntensity: number;
            }
            export { small_1 as small };
            export namespace medium_1 {
                let weightRange_10: number[];
                export { weightRange_10 as weightRange };
                let lengthRange_5: number[];
                export { lengthRange_5 as lengthRange };
                let depthPreference_6: number[];
                export { depthPreference_6 as depthPreference };
                let speedMultiplier_5: number;
                export { speedMultiplier_5 as speedMultiplier };
                let aggressivenessMultiplier_5: number;
                export { aggressivenessMultiplier_5 as aggressivenessMultiplier };
                let cautiousness_5: number;
                export { cautiousness_5 as cautiousness };
                let ambushIntensity_1: number;
                export { ambushIntensity_1 as ambushIntensity };
            }
            export { medium_1 as medium };
            export namespace large_1 {
                let weightRange_11: number[];
                export { weightRange_11 as weightRange };
                let lengthRange_6: number[];
                export { lengthRange_6 as lengthRange };
                let depthPreference_7: number[];
                export { depthPreference_7 as depthPreference };
                let speedMultiplier_6: number;
                export { speedMultiplier_6 as speedMultiplier };
                let aggressivenessMultiplier_6: number;
                export { aggressivenessMultiplier_6 as aggressivenessMultiplier };
                let cautiousness_6: number;
                export { cautiousness_6 as cautiousness };
                let ambushIntensity_2: number;
                export { ambushIntensity_2 as ambushIntensity };
            }
            export { large_1 as large };
            export namespace trophy_1 {
                let weightRange_12: number[];
                export { weightRange_12 as weightRange };
                let lengthRange_7: number[];
                export { lengthRange_7 as lengthRange };
                let depthPreference_8: number[];
                export { depthPreference_8 as depthPreference };
                let speedMultiplier_7: number;
                export { speedMultiplier_7 as speedMultiplier };
                let aggressivenessMultiplier_7: number;
                export { aggressivenessMultiplier_7 as aggressivenessMultiplier };
                let cautiousness_7: number;
                export { cautiousness_7 as cautiousness };
                let ambushIntensity_3: number;
                export { ambushIntensity_3 as ambushIntensity };
            }
            export { trophy_1 as trophy };
        }
        export { sizeCategories_1 as sizeCategories };
        export namespace tempPreference_6 {
            let optimal_6: number;
            export { optimal_6 as optimal };
            let min_27: number;
            export { min_27 as min };
            let max_27: number;
            export { max_27 as max };
            let lethal_1: number;
            export { lethal_1 as lethal };
            let behaviorAffect_1: boolean;
            export { behaviorAffect_1 as behaviorAffect };
        }
        export { tempPreference_6 as tempPreference };
        export namespace depthPreference_9 {
            let spring_2: number[];
            export { spring_2 as spring };
            let summer_2: number[];
            export { summer_2 as summer };
            let fall_1: number[];
            export { fall_1 as fall };
            let winter_1: number[];
            export { winter_1 as winter };
        }
        export { depthPreference_9 as depthPreference };
        export namespace dietPreferences_1 {
            let yellow_perch_2: number;
            export { yellow_perch_2 as yellow_perch };
            let alewife_2: number;
            export { alewife_2 as alewife };
            let rainbow_smelt_2: number;
            export { rainbow_smelt_2 as rainbow_smelt };
            let sculpin_2: number;
            export { sculpin_2 as sculpin };
            let cisco_2: number;
            export { cisco_2 as cisco };
            export let cannibalism: number;
        }
        export { dietPreferences_1 as dietPreferences };
        export namespace behavior_6 {
            export let huntingStyle: string;
            let feedingPeriods_1: string[];
            export { feedingPeriods_1 as feedingPeriods };
            export namespace aggressionByDepth_1 {
                let surface_1: number;
                export { surface_1 as surface };
                let midColumn_1: number;
                export { midColumn_1 as midColumn };
                let bottom_1: number;
                export { bottom_1 as bottom };
            }
            export { aggressionByDepth_1 as aggressionByDepth };
            let cannibalismChance_1: number;
            export { cannibalismChance_1 as cannibalismChance };
            let opportunisticFeeding_1: boolean;
            export { opportunisticFeeding_1 as opportunisticFeeding };
            let structureOriented_1: boolean;
            export { structureOriented_1 as structureOriented };
            export namespace ambushBehavior {
                let hideInCover: boolean;
                let burstSpeed: number;
                let strikeRange: number;
                let patienceLevel: string;
                let preferredAmbushDepths: number[];
            }
            export namespace spawnPeriod_1 {
                let months_1: number[];
                export { months_1 as months };
                let behaviorChange_1: string;
                export { behaviorChange_1 as behaviorChange };
                let feedingReduction_1: number;
                export { feedingReduction_1 as feedingReduction };
            }
            export { spawnPeriod_1 as spawnPeriod };
            export namespace postSpawnFrenzy {
                let months_2: number[];
                export { months_2 as months };
                export let aggressivenessBonus: number;
                export let feedingIntensity: string;
            }
        }
        export { behavior_6 as behavior };
        export namespace activityByTime_1 {
            let dawn_1: number;
            export { dawn_1 as dawn };
            let morning_1: number;
            export { morning_1 as morning };
            let midday_1: number;
            export { midday_1 as midday };
            let afternoon_1: number;
            export { afternoon_1 as afternoon };
            let dusk_1: number;
            export { dusk_1 as dusk };
            let night_1: number;
            export { night_1 as night };
        }
        export { activityByTime_1 as activityByTime };
        export namespace fightCharacteristics_1 {
            let initialRun_1: string;
            export { initialRun_1 as initialRun };
            let tactics_1: string[];
            export { tactics_1 as tactics };
            let stamina_1: string;
            export { stamina_1 as stamina };
            let difficulty_1: string;
            export { difficulty_1 as difficulty };
            export let acrobatic: boolean;
            export let weedAdvantage: boolean;
            export let teethDanger: boolean;
        }
        export { fightCharacteristics_1 as fightCharacteristics };
        export namespace habitatPreferences_1 {
            let primary_1: string[];
            export { primary_1 as primary };
            let secondary_1: string[];
            export { secondary_1 as secondary };
            let avoids_1: string[];
            export { avoids_1 as avoids };
        }
        export { habitatPreferences_1 as habitatPreferences };
        export namespace appearance_5 {
            let bodyShape_5: string;
            export { bodyShape_5 as bodyShape };
            export namespace colorScheme {
                let base_5: number;
                export { base_5 as base };
                export let spots: number;
                export let belly: number;
                export let fins: number;
                export let distinctive: string[];
            }
            export let markingPattern: string;
        }
        export { appearance_5 as appearance };
        let notes_6: string;
        export { notes_6 as notes };
    }
    namespace smallmouth_bass {
        let name_7: string;
        export { name_7 as name };
        let scientificName_7: string;
        export { scientificName_7 as scientificName };
        let commonNames_2: string[];
        export { commonNames_2 as commonNames };
        let status_7: string;
        export { status_7 as status };
        let spawnWeight_2: number;
        export { spawnWeight_2 as spawnWeight };
        export namespace sizeCategories_2 {
            export namespace small_2 {
                let weightRange_13: number[];
                export { weightRange_13 as weightRange };
                let lengthRange_8: number[];
                export { lengthRange_8 as lengthRange };
                let depthPreference_10: number[];
                export { depthPreference_10 as depthPreference };
                let speedMultiplier_8: number;
                export { speedMultiplier_8 as speedMultiplier };
                let aggressivenessMultiplier_8: number;
                export { aggressivenessMultiplier_8 as aggressivenessMultiplier };
                let cautiousness_8: number;
                export { cautiousness_8 as cautiousness };
                export let territorialIntensity: number;
            }
            export { small_2 as small };
            export namespace medium_2 {
                let weightRange_14: number[];
                export { weightRange_14 as weightRange };
                let lengthRange_9: number[];
                export { lengthRange_9 as lengthRange };
                let depthPreference_11: number[];
                export { depthPreference_11 as depthPreference };
                let speedMultiplier_9: number;
                export { speedMultiplier_9 as speedMultiplier };
                let aggressivenessMultiplier_9: number;
                export { aggressivenessMultiplier_9 as aggressivenessMultiplier };
                let cautiousness_9: number;
                export { cautiousness_9 as cautiousness };
                let territorialIntensity_1: number;
                export { territorialIntensity_1 as territorialIntensity };
            }
            export { medium_2 as medium };
            export namespace large_2 {
                let weightRange_15: number[];
                export { weightRange_15 as weightRange };
                let lengthRange_10: number[];
                export { lengthRange_10 as lengthRange };
                let depthPreference_12: number[];
                export { depthPreference_12 as depthPreference };
                let speedMultiplier_10: number;
                export { speedMultiplier_10 as speedMultiplier };
                let aggressivenessMultiplier_10: number;
                export { aggressivenessMultiplier_10 as aggressivenessMultiplier };
                let cautiousness_10: number;
                export { cautiousness_10 as cautiousness };
                let territorialIntensity_2: number;
                export { territorialIntensity_2 as territorialIntensity };
            }
            export { large_2 as large };
            export namespace trophy_2 {
                let weightRange_16: number[];
                export { weightRange_16 as weightRange };
                let lengthRange_11: number[];
                export { lengthRange_11 as lengthRange };
                let depthPreference_13: number[];
                export { depthPreference_13 as depthPreference };
                let speedMultiplier_11: number;
                export { speedMultiplier_11 as speedMultiplier };
                let aggressivenessMultiplier_11: number;
                export { aggressivenessMultiplier_11 as aggressivenessMultiplier };
                let cautiousness_11: number;
                export { cautiousness_11 as cautiousness };
                let territorialIntensity_3: number;
                export { territorialIntensity_3 as territorialIntensity };
            }
            export { trophy_2 as trophy };
        }
        export { sizeCategories_2 as sizeCategories };
        export namespace tempPreference_7 {
            let optimal_7: number;
            export { optimal_7 as optimal };
            let min_28: number;
            export { min_28 as min };
            let max_28: number;
            export { max_28 as max };
            let lethal_2: number;
            export { lethal_2 as lethal };
            let behaviorAffect_2: boolean;
            export { behaviorAffect_2 as behaviorAffect };
        }
        export { tempPreference_7 as tempPreference };
        export namespace depthPreference_14 {
            let spring_3: number[];
            export { spring_3 as spring };
            let summer_3: number[];
            export { summer_3 as summer };
            let fall_2: number[];
            export { fall_2 as fall };
            let winter_2: number[];
            export { winter_2 as winter };
        }
        export { depthPreference_14 as depthPreference };
        export namespace dietPreferences_2 {
            let yellow_perch_3: number;
            export { yellow_perch_3 as yellow_perch };
            let alewife_3: number;
            export { alewife_3 as alewife };
            let rainbow_smelt_3: number;
            export { rainbow_smelt_3 as rainbow_smelt };
            let sculpin_3: number;
            export { sculpin_3 as sculpin };
            let cisco_3: number;
            export { cisco_3 as cisco };
            export let crayfish: number;
        }
        export { dietPreferences_2 as dietPreferences };
        export namespace behavior_7 {
            let huntingStyle_1: string;
            export { huntingStyle_1 as huntingStyle };
            let feedingPeriods_2: string[];
            export { feedingPeriods_2 as feedingPeriods };
            export namespace aggressionByDepth_2 {
                let surface_2: number;
                export { surface_2 as surface };
                let midColumn_2: number;
                export { midColumn_2 as midColumn };
                let bottom_2: number;
                export { bottom_2 as bottom };
            }
            export { aggressionByDepth_2 as aggressionByDepth };
            let cannibalismChance_2: number;
            export { cannibalismChance_2 as cannibalismChance };
            let opportunisticFeeding_2: boolean;
            export { opportunisticFeeding_2 as opportunisticFeeding };
            let structureOriented_2: boolean;
            export { structureOriented_2 as structureOriented };
            export namespace territorialBehavior {
                let defendsTerritory: boolean;
                let circlingBehavior: boolean;
                let cautionLevel: string;
                let preferredStructure: string[];
            }
            export namespace spawnPeriod_2 {
                let months_3: number[];
                export { months_3 as months };
                let behaviorChange_2: string;
                export { behaviorChange_2 as behaviorChange };
                let feedingReduction_2: number;
                export { feedingReduction_2 as feedingReduction };
            }
            export { spawnPeriod_2 as spawnPeriod };
            export namespace postSpawnFrenzy_1 {
                let months_4: number[];
                export { months_4 as months };
                let aggressivenessBonus_1: number;
                export { aggressivenessBonus_1 as aggressivenessBonus };
                let feedingIntensity_1: string;
                export { feedingIntensity_1 as feedingIntensity };
            }
            export { postSpawnFrenzy_1 as postSpawnFrenzy };
        }
        export { behavior_7 as behavior };
        export namespace activityByTime_2 {
            let dawn_2: number;
            export { dawn_2 as dawn };
            let morning_2: number;
            export { morning_2 as morning };
            let midday_2: number;
            export { midday_2 as midday };
            let afternoon_2: number;
            export { afternoon_2 as afternoon };
            let dusk_2: number;
            export { dusk_2 as dusk };
            let night_2: number;
            export { night_2 as night };
        }
        export { activityByTime_2 as activityByTime };
        export namespace fightCharacteristics_2 {
            let initialRun_2: string;
            export { initialRun_2 as initialRun };
            let tactics_2: string[];
            export { tactics_2 as tactics };
            let stamina_2: string;
            export { stamina_2 as stamina };
            let difficulty_2: string;
            export { difficulty_2 as difficulty };
            let acrobatic_1: boolean;
            export { acrobatic_1 as acrobatic };
            export let jumpProbability: number;
            export let structureAdvantage: boolean;
            export let lineShy: boolean;
        }
        export { fightCharacteristics_2 as fightCharacteristics };
        export namespace habitatPreferences_2 {
            let primary_2: string[];
            export { primary_2 as primary };
            let secondary_2: string[];
            export { secondary_2 as secondary };
            let avoids_2: string[];
            export { avoids_2 as avoids };
        }
        export { habitatPreferences_2 as habitatPreferences };
        export namespace appearance_6 {
            let bodyShape_6: string;
            export { bodyShape_6 as bodyShape };
            export namespace colorScheme_1 {
                let base_6: number;
                export { base_6 as base };
                export let bars: number;
                let belly_1: number;
                export { belly_1 as belly };
                export let eyes: number;
                let fins_1: number;
                export { fins_1 as fins };
                let distinctive_1: string[];
                export { distinctive_1 as distinctive };
            }
            export { colorScheme_1 as colorScheme };
            let markingPattern_1: string;
            export { markingPattern_1 as markingPattern };
        }
        export { appearance_6 as appearance };
        let notes_7: string;
        export { notes_7 as notes };
    }
    namespace yellow_perch_large {
        let name_8: string;
        export { name_8 as name };
        let scientificName_8: string;
        export { scientificName_8 as scientificName };
        let commonNames_3: string[];
        export { commonNames_3 as commonNames };
        let status_8: string;
        export { status_8 as status };
        let spawnWeight_3: number;
        export { spawnWeight_3 as spawnWeight };
        export namespace sizeCategories_3 {
            export namespace small_3 {
                let weightRange_17: number[];
                export { weightRange_17 as weightRange };
                let lengthRange_12: number[];
                export { lengthRange_12 as lengthRange };
                let depthPreference_15: number[];
                export { depthPreference_15 as depthPreference };
                let speedMultiplier_12: number;
                export { speedMultiplier_12 as speedMultiplier };
                let aggressivenessMultiplier_12: number;
                export { aggressivenessMultiplier_12 as aggressivenessMultiplier };
                let cautiousness_12: number;
                export { cautiousness_12 as cautiousness };
                export let schoolingTendency: number;
            }
            export { small_3 as small };
            export namespace medium_3 {
                let weightRange_18: number[];
                export { weightRange_18 as weightRange };
                let lengthRange_13: number[];
                export { lengthRange_13 as lengthRange };
                let depthPreference_16: number[];
                export { depthPreference_16 as depthPreference };
                let speedMultiplier_13: number;
                export { speedMultiplier_13 as speedMultiplier };
                let aggressivenessMultiplier_13: number;
                export { aggressivenessMultiplier_13 as aggressivenessMultiplier };
                let cautiousness_13: number;
                export { cautiousness_13 as cautiousness };
                let schoolingTendency_1: number;
                export { schoolingTendency_1 as schoolingTendency };
            }
            export { medium_3 as medium };
            export namespace large_3 {
                let weightRange_19: number[];
                export { weightRange_19 as weightRange };
                let lengthRange_14: number[];
                export { lengthRange_14 as lengthRange };
                let depthPreference_17: number[];
                export { depthPreference_17 as depthPreference };
                let speedMultiplier_14: number;
                export { speedMultiplier_14 as speedMultiplier };
                let aggressivenessMultiplier_14: number;
                export { aggressivenessMultiplier_14 as aggressivenessMultiplier };
                let cautiousness_14: number;
                export { cautiousness_14 as cautiousness };
                let schoolingTendency_2: number;
                export { schoolingTendency_2 as schoolingTendency };
            }
            export { large_3 as large };
            export namespace trophy_3 {
                let weightRange_20: number[];
                export { weightRange_20 as weightRange };
                let lengthRange_15: number[];
                export { lengthRange_15 as lengthRange };
                let depthPreference_18: number[];
                export { depthPreference_18 as depthPreference };
                let speedMultiplier_15: number;
                export { speedMultiplier_15 as speedMultiplier };
                let aggressivenessMultiplier_15: number;
                export { aggressivenessMultiplier_15 as aggressivenessMultiplier };
                let cautiousness_15: number;
                export { cautiousness_15 as cautiousness };
                let schoolingTendency_3: number;
                export { schoolingTendency_3 as schoolingTendency };
            }
            export { trophy_3 as trophy };
        }
        export { sizeCategories_3 as sizeCategories };
        export namespace tempPreference_8 {
            let optimal_8: number;
            export { optimal_8 as optimal };
            let min_29: number;
            export { min_29 as min };
            let max_29: number;
            export { max_29 as max };
            let lethal_3: number;
            export { lethal_3 as lethal };
            let behaviorAffect_3: boolean;
            export { behaviorAffect_3 as behaviorAffect };
        }
        export { tempPreference_8 as tempPreference };
        export namespace depthPreference_19 {
            let spring_4: number[];
            export { spring_4 as spring };
            let summer_4: number[];
            export { summer_4 as summer };
            let fall_3: number[];
            export { fall_3 as fall };
            let winter_3: number[];
            export { winter_3 as winter };
        }
        export { depthPreference_19 as depthPreference };
        export namespace dietPreferences_3 {
            let alewife_4: number;
            export { alewife_4 as alewife };
            let rainbow_smelt_4: number;
            export { rainbow_smelt_4 as rainbow_smelt };
            let sculpin_4: number;
            export { sculpin_4 as sculpin };
            export let insects: number;
            export let small_perch: number;
        }
        export { dietPreferences_3 as dietPreferences };
        export namespace behavior_8 {
            let huntingStyle_2: string;
            export { huntingStyle_2 as huntingStyle };
            let feedingPeriods_3: string[];
            export { feedingPeriods_3 as feedingPeriods };
            export namespace aggressionByDepth_3 {
                let surface_3: number;
                export { surface_3 as surface };
                let midColumn_3: number;
                export { midColumn_3 as midColumn };
                let bottom_3: number;
                export { bottom_3 as bottom };
            }
            export { aggressionByDepth_3 as aggressionByDepth };
            let cannibalismChance_3: number;
            export { cannibalismChance_3 as cannibalismChance };
            let opportunisticFeeding_3: boolean;
            export { opportunisticFeeding_3 as opportunisticFeeding };
            let structureOriented_3: boolean;
            export { structureOriented_3 as structureOriented };
            export namespace schoolingBehavior {
                export let schoolBySize: boolean;
                let schoolSize_6: number[];
                export { schoolSize_6 as schoolSize };
                export let lessSchoolingWhenLarge: boolean;
            }
            export namespace spawnPeriod_3 {
                let months_5: number[];
                export { months_5 as months };
                let behaviorChange_3: string;
                export { behaviorChange_3 as behaviorChange };
                let feedingReduction_3: number;
                export { feedingReduction_3 as feedingReduction };
            }
            export { spawnPeriod_3 as spawnPeriod };
        }
        export { behavior_8 as behavior };
        export namespace activityByTime_3 {
            let dawn_3: number;
            export { dawn_3 as dawn };
            let morning_3: number;
            export { morning_3 as morning };
            let midday_3: number;
            export { midday_3 as midday };
            let afternoon_3: number;
            export { afternoon_3 as afternoon };
            let dusk_3: number;
            export { dusk_3 as dusk };
            let night_3: number;
            export { night_3 as night };
        }
        export { activityByTime_3 as activityByTime };
        export namespace fightCharacteristics_3 {
            let initialRun_3: string;
            export { initialRun_3 as initialRun };
            let tactics_3: string[];
            export { tactics_3 as tactics };
            let stamina_3: string;
            export { stamina_3 as stamina };
            let difficulty_3: string;
            export { difficulty_3 as difficulty };
            let acrobatic_2: boolean;
            export { acrobatic_2 as acrobatic };
            export let fightDuration: string;
        }
        export { fightCharacteristics_3 as fightCharacteristics };
        export namespace habitatPreferences_3 {
            let primary_3: string[];
            export { primary_3 as primary };
            let secondary_3: string[];
            export { secondary_3 as secondary };
            let avoids_3: string[];
            export { avoids_3 as avoids };
        }
        export { habitatPreferences_3 as habitatPreferences };
        export namespace appearance_7 {
            let bodyShape_7: string;
            export { bodyShape_7 as bodyShape };
            export namespace colorScheme_2 {
                let base_7: number;
                export { base_7 as base };
                let bars_1: number;
                export { bars_1 as bars };
                let belly_2: number;
                export { belly_2 as belly };
                let fins_2: number;
                export { fins_2 as fins };
                let eyes_1: number;
                export { eyes_1 as eyes };
                let distinctive_2: string[];
                export { distinctive_2 as distinctive };
            }
            export { colorScheme_2 as colorScheme };
            let markingPattern_2: string;
            export { markingPattern_2 as markingPattern };
        }
        export { appearance_7 as appearance };
        let notes_8: string;
        export { notes_8 as notes };
    }
}
declare namespace _default {
    export { BAITFISH_SPECIES };
    export { PREDATOR_SPECIES };
    export { getBaitfishSpecies };
    export { getPredatorSpecies };
    export { calculateDietPreference };
    export { getSpawnableSpecies };
    export { selectRandomSpecies };
}
export default _default;
//# sourceMappingURL=SpeciesData.d.ts.map