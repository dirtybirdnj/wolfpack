// Species data for Lake Champlain fish - based on real-world research
// This file contains behavioral, physical, and ecological data for all species in the game

export const BAITFISH_SPECIES = {
    alewife: {
        name: 'Alewife',
        scientificName: 'Alosa pseudoharengus',
        status: 'Invasive species in Lake Champlain',

        // Physical characteristics
        sizeRange: { min: 4, max: 8 }, // inches (most common 4-6")
        weightRange: { min: 0.1, max: 0.3 }, // lbs

        // Depth and temperature preferences
        depthRange: { min: 10, max: 100 }, // feet - highly variable
        tempPreference: { optimal: 62, min: 50, max: 70 }, // °F

        // Schooling behavior
        schoolSize: { min: 40, max: 100 }, // large, dense aggregations (doubled)
        schoolingDensity: 'high', // tight schools

        // Movement
        speed: { base: 1.2, panic: 2.5 },
        verticalMigration: true, // deeper during day, shallower at night

        // Visual properties
        color: 0x88ccff, // silvery with metallic sheen
        panicColor: 0xccddff, // brighter when panicking
        appearance: {
            bodyShape: 'deep', // laterally compressed (flat-sided)
            length: 1.0, // relative length multiplier
            height: 0.6, // relative height (deep-bodied)
            features: ['dark_gill_spot', 'forked_tail', 'metallic_sheen']
        },

        // Behavior patterns
        behavior: {
            panicResponse: 'scatter', // how they react to predators
            planktonFollower: true, // follows zooplankton blooms
            activityPattern: 'diurnal', // active during day
            preferredHabitat: 'pelagic' // open water
        },

        // Spawning
        spawnDepthPreference: [20, 80], // mid-depth spawning

        // Game mechanics
        nutritionValue: 12, // how much hunger it reduces for predators (reduced for more aggressive feeding)
        catchDifficulty: 'easy', // for predators
        rarity: 'abundant', // most common prey species
        preferredBy: ['lake_trout'], // which predators prefer this species

        // Ecological notes
        notes: 'Most abundant prey species. Dense schools, unpredictable movements, found at various depths.'
    },

    rainbow_smelt: {
        name: 'Rainbow Smelt',
        scientificName: 'Osmerus mordax',
        status: 'Native',

        // Physical characteristics
        sizeRange: { min: 5, max: 10 }, // inches (common 5-8")
        weightRange: { min: 0.15, max: 0.4 }, // lbs

        // Depth and temperature preferences
        depthRange: { min: 30, max: 80 }, // feet - cold water preference
        tempPreference: { optimal: 48, min: 40, max: 55 }, // °F - prefer cold water

        // Schooling behavior
        schoolSize: { min: 20, max: 60 }, // tight schools, especially during spawn (doubled)
        schoolingDensity: 'very_high', // extremely tight schools

        // Movement
        speed: { base: 1.5, panic: 3.0 },
        verticalMigration: false, // stable depth preference

        // Visual properties
        color: 0xc0d0e0, // translucent silver with pink/purple iridescence
        panicColor: 0xe0e8f0, // lighter when panicking
        appearance: {
            bodyShape: 'slender', // elongated, cylindrical
            length: 1.3, // longer than alewife
            height: 0.4, // very slender
            features: ['adipose_fin', 'iridescent_sheen', 'translucent_body']
        },

        // Behavior patterns
        behavior: {
            panicResponse: 'dive', // dive deeper when threatened
            planktonFollower: false,
            activityPattern: 'nocturnal', // more active at night, especially during spawn
            preferredHabitat: 'pelagic',
            attractedToLight: true // attracted to light at night (realistic behavior)
        },

        // Seasonal behavior
        seasonal: {
            spring: {
                depthRange: [0, 10], // very shallow spawning runs
                activity: 'spawning',
                schoolSize: { min: 60, max: 120 } // massive aggregations (doubled)
            },
            summer: {
                depthRange: [30, 80],
                activity: 'normal'
            }
        },

        // Spawning
        spawnDepthPreference: [30, 80], // deep water except spring spawn

        // Game mechanics
        nutritionValue: 16, // high fat content, nutritious but reduced for aggressive feeding
        catchDifficulty: 'medium',
        rarity: 'common',
        preferredBy: ['lake_trout'], // highly preferred due to fat content

        // Ecological notes
        notes: 'High-fat content makes them preferred prey. Spring spawn creates feeding opportunities. Tighter schools than alewife.'
    },

    sculpin: {
        name: 'Slimy Sculpin',
        scientificName: 'Cottus cognatus',
        status: 'Native',

        // Physical characteristics
        sizeRange: { min: 2, max: 5 }, // inches (most common 2-4")
        weightRange: { min: 0.05, max: 0.15 }, // lbs

        // Depth and temperature preferences
        depthRange: { min: 60, max: 120 }, // feet - bottom-dwelling, deep water
        tempPreference: { optimal: 50, min: 40, max: 60 }, // °F - cold water species

        // Schooling behavior
        schoolSize: { min: 2, max: 6 }, // solitary or small groups (doubled)
        schoolingDensity: 'none', // non-schooling

        // Movement
        speed: { base: 0.5, panic: 1.5 }, // slow with short bursts
        verticalMigration: false, // stays on bottom

        // Visual properties
        color: 0x4a5a3a, // mottled brown/grey (camouflage)
        panicColor: 0x5a6a4a, // slightly lighter when moving
        appearance: {
            bodyShape: 'bottom', // large head, tapered body, flattened
            length: 0.8, // short
            height: 0.5, // flattened
            features: ['large_pectoral_fins', 'camouflage_pattern', 'no_scales']
        },

        // Behavior patterns
        behavior: {
            panicResponse: 'hide', // hides under rocks/structure
            planktonFollower: false,
            activityPattern: 'nocturnal', // active at night
            preferredHabitat: 'benthic', // bottom-dwelling
            movementStyle: 'darting', // short, quick movements
            hidesDuringDay: true
        },

        // Spawning
        spawnDepthPreference: [80, 120], // deep bottom

        // Game mechanics
        nutritionValue: 10, // less nutritious than pelagic species (reduced for aggressive feeding)
        catchDifficulty: 'easy', // slow-moving
        rarity: 'uncommon', // less common than pelagic species
        preferredBy: ['lake_trout'], // bottom-feeding lakers target these

        // Ecological notes
        notes: 'Bottom-dwelling, non-schooling. Targeted by lake trout when feeding on bottom. Nocturnal, hides during day.'
    },

    yellow_perch: {
        name: 'Yellow Perch (juvenile)',
        scientificName: 'Perca flavescens',
        status: 'Native - dual role (prey when small, predator when large)',

        // Physical characteristics
        sizeRange: { min: 4, max: 8 }, // inches - prey-sized perch
        weightRange: { min: 0.15, max: 0.5 }, // lbs

        // Depth and temperature preferences
        depthRange: { min: 10, max: 40 }, // feet - shallower, structure-oriented
        tempPreference: { optimal: 68, min: 60, max: 75 }, // °F - warmer water than other prey

        // Schooling behavior
        schoolSize: { min: 16, max: 40 }, // school by size (doubled)
        schoolingDensity: 'medium', // moderate schooling

        // Movement
        speed: { base: 1.0, panic: 2.0 },
        verticalMigration: false,

        // Visual properties
        color: 0xccaa33, // golden yellow to brass
        panicColor: 0xddbb44, // brighter yellow when stressed
        appearance: {
            bodyShape: 'deep', // deep-bodied, laterally compressed
            length: 1.0,
            height: 0.65, // fairly deep body
            features: ['vertical_bars', 'orange_fins', 'spiny_dorsal', 'rough_scales'],
            barCount: 7, // 6-8 dark vertical bars
            finColor: 0xff6600 // orange/red pelvic and anal fins
        },

        // Behavior patterns
        behavior: {
            panicResponse: 'scatter',
            planktonFollower: false,
            activityPattern: 'diurnal', // daytime feeders
            preferredHabitat: 'structure', // weeds, rocks, drop-offs
            structureOriented: true
        },

        // Spawning
        spawnDepthPreference: [10, 40], // shallow to mid-depth

        // Game mechanics
        nutritionValue: 12, // moderate nutrition (reduced for aggressive feeding)
        catchDifficulty: 'medium', // spiny, somewhat evasive
        rarity: 'common',
        preferredBy: ['lake_trout'], // secondary prey, opportunistic

        // Ecological notes
        notes: 'Secondary prey item. More common in shallower, warmer areas. Lake trout mainly eat smaller perch. Structure-oriented.'
    },

    cisco: {
        name: 'Cisco / Lake Herring',
        scientificName: 'Coregonus artedi',
        status: 'Historically present, now rare in Lake Champlain',

        // Physical characteristics
        sizeRange: { min: 8, max: 16 }, // inches - larger baitfish
        weightRange: { min: 0.3, max: 1.0 }, // lbs

        // Depth and temperature preferences
        depthRange: { min: 50, max: 100 }, // feet - deep, cold water specialist
        tempPreference: { optimal: 50, min: 45, max: 55 }, // °F - cold water only

        // Schooling behavior
        schoolSize: { min: 30, max: 80 }, // dense schools in open water (doubled)
        schoolingDensity: 'high',

        // Movement
        speed: { base: 1.8, panic: 3.5 }, // fast swimmers
        verticalMigration: false,

        // Visual properties
        color: 0xaaccff, // bright silver with blue-violet back
        panicColor: 0xccddff, // very bright when fleeing
        appearance: {
            bodyShape: 'streamlined', // compressed, silvery
            length: 1.4, // large baitfish
            height: 0.55,
            features: ['adipose_fin', 'forked_tail', 'bright_iridescence', 'large_scales']
        },

        // Behavior patterns
        behavior: {
            panicResponse: 'dive', // dive to deeper water
            planktonFollower: true, // feeds on plankton
            activityPattern: 'diurnal',
            preferredHabitat: 'pelagic_deep' // deep open water
        },

        // Spawning
        spawnDepthPreference: [60, 100], // deep water spawning

        // Game mechanics
        nutritionValue: 18, // large, nutritious but reduced for aggressive feeding
        catchDifficulty: 'hard', // fast, evasive
        rarity: 'rare', // historically important but now rare
        preferredBy: ['lake_trout'], // highly preferred where present

        // Special mechanics
        special: {
            legendary: true, // rare encounter
            achievementTrigger: 'rare_species_spotted',
            spawnRateMultiplier: 0.1 // only 10% of normal spawn rate
        },

        // Ecological notes
        notes: 'Historically important prey, now rare. Could be included for deeper sections as "legendary" encounters. Preferred prey where present.'
    }
};

export const PREDATOR_SPECIES = {
    lake_trout: {
        name: 'Lake Trout',
        scientificName: 'Salvelinus namaycush',
        commonNames: ['Laker', 'Togue', 'Mackinaw', 'Grey Trout'],
        status: 'Native, prized gamefish',

        // Spawn configuration
        spawnWeight: 30, // 30% spawn rate

        // Size categories with behavioral differences
        sizeCategories: {
            small: {
                weightRange: [2, 5],
                lengthRange: [15, 24],
                depthPreference: [30, 70],
                speedMultiplier: 1.2, // faster
                aggressivenessMultiplier: 1.3, // more reckless
                cautiousness: 0.7
            },
            medium: {
                weightRange: [5, 12],
                lengthRange: [24, 32],
                depthPreference: [40, 90],
                speedMultiplier: 1.0,
                aggressivenessMultiplier: 1.0,
                cautiousness: 1.0
            },
            large: {
                weightRange: [12, 25],
                lengthRange: [32, 40],
                depthPreference: [50, 110],
                speedMultiplier: 0.9,
                aggressivenessMultiplier: 0.85,
                cautiousness: 1.2
            },
            trophy: {
                weightRange: [25, 40],
                lengthRange: [40, 50],
                depthPreference: [60, 120],
                speedMultiplier: 0.8, // slower, more deliberate
                aggressivenessMultiplier: 0.7, // more cautious
                cautiousness: 1.5 // very wary
            }
        },

        // Temperature preferences
        tempPreference: {
            optimal: 50, // 48-52°F range
            min: 38,
            max: 52,
            lethal: 65, // cannot tolerate warm water
            behaviorAffect: true // temperature affects behavior
        },

        // Seasonal depth preferences (feet)
        depthPreference: {
            spring: [20, 60], // following smelt spawn, shallower
            summer: [50, 100], // deep, thermocline
            fall: [30, 70], // staging for spawn, more aggressive
            winter: [40, 80] // post-spawn, moderate depth
        },

        // Diet composition - real Lake Champlain data
        dietPreferences: {
            alewife: 0.55, // 50-60% of diet
            rainbow_smelt: 0.25, // 20-30% of diet
            sculpin: 0.08, // 5-10% of diet
            yellow_perch: 0.08, // 5-10% of diet
            cisco: 0.04 // rare but preferred when available
        },

        // Behavioral characteristics
        behavior: {
            feedingPeriods: ['dawn', 'dusk', 'all_day_deep'], // when most active
            aggressionByDepth: {
                surface: 1.35, // more aggressive in shallow
                midColumn: 1.0, // normal
                bottom: 0.6 // cautious on bottom
            },
            cannibalismChance: 0.05, // 5% chance to target smaller lake trout
            opportunisticFeeding: true,
            ambushAndPursuit: true, // uses both strategies
            spawnPeriod: {
                months: [10, 11], // October-November
                behaviorChange: 'aggressive', // more aggressive before spawn
                feedingReduction: 0.7 // feeds less during actual spawn
            }
        },

        // Activity patterns by time of day
        activityByTime: {
            dawn: 1.3, // 5-7 AM - peak feeding
            morning: 1.0, // 7-11 AM - active
            midday: 0.8, // 11 AM-3 PM - less active in shallows
            afternoon: 1.0, // 3-6 PM - active
            dusk: 1.3, // 6-8 PM - peak feeding
            night: 0.9, // 8 PM-5 AM - moderate activity in deep water
        },

        // Fight characteristics
        fightCharacteristics: {
            initialRun: 'strong', // powerful first run
            tactics: ['head_shake', 'deep_dive', 'sustained_pull'],
            stamina: 'high', // long, drawn-out fights
            difficulty: 'hard',
            deepWaterAdvantage: true // harder to land in deep water
        },

        // Habitat preferences
        habitatPreferences: {
            primary: ['deep_cold_water', 'thermocline', 'rocky_structure'],
            secondary: ['suspended_over_basins', 'drop_offs', 'underwater_points'],
            avoids: ['warm_shallow_water', 'low_oxygen_zones']
        },

        // Ecological notes
        notes: 'Apex predator in Lake Champlain. Primarily piscivorous, opportunistic hunters. Size affects behavior significantly. Temperature-sensitive.'
    },

    northern_pike: {
        name: 'Northern Pike',
        scientificName: 'Esox lucius',
        commonNames: ['Pike', 'Northerns', 'Gator', 'Snake'],
        status: 'Native, aggressive predator',

        // Spawn configuration
        spawnWeight: 15, // 15% spawn rate

        // Size categories with behavioral differences
        sizeCategories: {
            small: {
                weightRange: [2, 6],
                lengthRange: [18, 26],
                depthPreference: [5, 15],
                speedMultiplier: 1.3, // very fast
                aggressivenessMultiplier: 1.5, // extremely aggressive
                cautiousness: 0.5, // reckless
                ambushIntensity: 0.7 // moderately patient ambush
            },
            medium: {
                weightRange: [6, 15],
                lengthRange: [26, 36],
                depthPreference: [8, 20],
                speedMultiplier: 1.2,
                aggressivenessMultiplier: 1.4,
                cautiousness: 0.6,
                ambushIntensity: 1.0 // standard ambush behavior
            },
            large: {
                weightRange: [15, 25],
                lengthRange: [36, 44],
                depthPreference: [10, 25],
                speedMultiplier: 1.1,
                aggressivenessMultiplier: 1.3,
                cautiousness: 0.7,
                ambushIntensity: 1.3 // very patient, effective ambushes
            },
            trophy: {
                weightRange: [25, 45],
                lengthRange: [44, 54],
                depthPreference: [12, 30],
                speedMultiplier: 1.0,
                aggressivenessMultiplier: 1.2,
                cautiousness: 0.8,
                ambushIntensity: 1.5 // extremely patient apex predator
            }
        },

        // Temperature preferences - warmer than lake trout
        tempPreference: {
            optimal: 65, // 60-70°F range
            min: 50,
            max: 75,
            lethal: 80, // more tolerant of warm water than trout
            behaviorAffect: true
        },

        // Seasonal depth preferences (feet) - shallower than lake trout
        depthPreference: {
            spring: [3, 15], // very shallow for spawning and post-spawn feeding
            summer: [8, 25], // weed edges, structure
            fall: [5, 20], // aggressive fall feeding
            winter: [10, 30] // deeper but still structure-oriented
        },

        // Diet composition - Lake Champlain northern pike
        dietPreferences: {
            yellow_perch: 0.45, // primary prey - abundant in pike habitat
            alewife: 0.20, // opportunistic on baitfish
            rainbow_smelt: 0.15, // during smelt runs
            sculpin: 0.05, // occasional bottom prey
            cisco: 0.02, // rare
            // Pike also eat frogs, ducklings, etc. (not modeled)
            cannibalism: 0.13 // pike regularly eat smaller pike
        },

        // Behavioral characteristics - AMBUSH predator (not pursuit)
        behavior: {
            huntingStyle: 'ambush', // KEY DIFFERENCE from lake trout
            feedingPeriods: ['dawn', 'dusk', 'all_day_shallow'], // active all day in shallow water
            aggressionByDepth: {
                surface: 1.5, // extremely aggressive in shallow
                midColumn: 1.3, // still very aggressive
                bottom: 0.9 // less effective on bottom
            },
            cannibalismChance: 0.13, // high cannibalism rate
            opportunisticFeeding: true,
            structureOriented: true, // LOVES weeds, logs, docks
            ambushBehavior: {
                hideInCover: true, // hides near structure
                burstSpeed: 2.5, // explosive strikes (2.5x normal speed)
                strikeRange: 30, // longer strike distance than trout
                patienceLevel: 'high', // waits for perfect opportunity
                preferredAmbushDepths: [5, 25] // shallow to mid-depth structure
            },
            spawnPeriod: {
                months: [3, 4], // March-April (early spring)
                behaviorChange: 'lethargic', // less active during spawn
                feedingReduction: 0.4 // feeds much less during spawn
            },
            postSpawnFrenzy: {
                months: [5, 6], // May-June
                aggressivenessBonus: 1.8, // extremely aggressive post-spawn
                feedingIntensity: 'very_high'
            }
        },

        // Activity patterns by time of day
        activityByTime: {
            dawn: 1.5, // 5-7 AM - peak feeding
            morning: 1.3, // 7-11 AM - very active
            midday: 1.0, // 11 AM-3 PM - still active (unlike trout)
            afternoon: 1.2, // 3-6 PM - active
            dusk: 1.5, // 6-8 PM - peak feeding
            night: 0.6, // 8 PM-5 AM - less active at night
        },

        // Fight characteristics - different from trout
        fightCharacteristics: {
            initialRun: 'explosive', // violent, thrashing strike
            tactics: ['head_shake', 'jump', 'thrash', 'dive_to_weeds'],
            stamina: 'medium', // shorter fights than trout, but violent
            difficulty: 'medium',
            acrobatic: true, // can jump and thrash on surface
            weedAdvantage: true, // tries to wrap line in weeds
            teethDanger: true // sharp teeth can cut line
        },

        // Habitat preferences - VERY different from lake trout
        habitatPreferences: {
            primary: ['weed_beds', 'shallow_structure', 'docks_and_pilings'],
            secondary: ['drop_offs', 'creek_mouths', 'rocky_shorelines'],
            avoids: ['deep_open_water', 'strong_current']
        },

        // Visual characteristics
        appearance: {
            bodyShape: 'torpedo', // long, cylindrical
            colorScheme: {
                base: 0x4a6e3a, // olive green
                spots: 0xe8e8d0, // cream/white oval spots
                belly: 0xd8d8c0, // light cream belly
                fins: 0x6a7e5a, // olive fins with dark markings
                distinctive: ['elongated_snout', 'duck_bill_mouth', 'sharp_teeth']
            },
            markingPattern: 'horizontal_ovals' // cream oval spots in horizontal rows
        },

        // Ecological notes
        notes: 'Ambush predator - waits in cover for prey. Explosive strikes. Structure-oriented. More active in warm, shallow water than lake trout. Cannibalistic.'
    },

    smallmouth_bass: {
        name: 'Smallmouth Bass',
        scientificName: 'Micropterus dolomieu',
        commonNames: ['Smallie', 'Bronzeback', 'Brown Bass', 'Smalljaw'],
        status: 'Native, highly prized sport fish',

        // Spawn configuration
        spawnWeight: 15, // 15% spawn rate

        // Size categories with behavioral differences
        sizeCategories: {
            small: {
                weightRange: [0.5, 2],
                lengthRange: [10, 14],
                depthPreference: [5, 20],
                speedMultiplier: 1.4, // very fast
                aggressivenessMultiplier: 1.6, // extremely aggressive
                cautiousness: 0.4, // bold
                territorialIntensity: 1.2
            },
            medium: {
                weightRange: [2, 4],
                lengthRange: [14, 18],
                depthPreference: [10, 30],
                speedMultiplier: 1.3,
                aggressivenessMultiplier: 1.5,
                cautiousness: 0.5,
                territorialIntensity: 1.4
            },
            large: {
                weightRange: [4, 6],
                lengthRange: [18, 21],
                depthPreference: [15, 40],
                speedMultiplier: 1.2,
                aggressivenessMultiplier: 1.4,
                cautiousness: 0.6,
                territorialIntensity: 1.6
            },
            trophy: {
                weightRange: [6, 8],
                lengthRange: [21, 24],
                depthPreference: [20, 50],
                speedMultiplier: 1.1,
                aggressivenessMultiplier: 1.3,
                cautiousness: 0.7, // larger fish more cautious
                territorialIntensity: 1.8 // very territorial
            }
        },

        // Temperature preferences - warm water species
        tempPreference: {
            optimal: 68, // 65-72°F range
            min: 55,
            max: 78,
            lethal: 85,
            behaviorAffect: true
        },

        // Seasonal depth preferences (feet)
        depthPreference: {
            spring: [5, 15], // shallow for spawning (May-June)
            summer: [15, 40], // deeper structure during heat
            fall: [10, 30], // aggressive fall feeding
            winter: [30, 60] // deep, lethargic (ice fishing mode)
        },

        // Diet composition - Lake Champlain smallmouth bass
        dietPreferences: {
            yellow_perch: 0.30, // primary prey in Lake Champlain
            alewife: 0.25, // opportunistic on baitfish
            rainbow_smelt: 0.15,
            sculpin: 0.12, // bottom-oriented feeding
            cisco: 0.03, // rare
            crayfish: 0.15 // major food source (not modeled as prey yet)
        },

        // Behavioral characteristics - ACTIVE PREDATOR
        behavior: {
            huntingStyle: 'active_pursuit', // circles and investigates before striking
            feedingPeriods: ['dawn', 'dusk', 'overcast_days'], // low-light feeders
            aggressionByDepth: {
                surface: 1.4, // aggressive in shallow
                midColumn: 1.5, // most aggressive in mid-column near structure
                bottom: 1.2 // less aggressive on bottom
            },
            cannibalismChance: 0.02, // rare
            opportunisticFeeding: true,
            structureOriented: true, // LOVES rocky structure, drop-offs
            territorialBehavior: {
                defendsTerritory: true, // especially during spawn
                circlingBehavior: true, // circles lure before committing
                cautionLevel: 'medium', // can be line-shy but also aggressive
                preferredStructure: ['rocky_points', 'boulder_fields', 'drop_offs', 'ledges']
            },
            spawnPeriod: {
                months: [5, 6], // May-June
                behaviorChange: 'extremely_aggressive', // very aggressive guarding nest
                feedingReduction: 0.3 // still feeds during spawn
            },
            postSpawnFrenzy: {
                months: [7, 8], // July-August
                aggressivenessBonus: 1.6, // aggressive summer feeding
                feedingIntensity: 'very_high'
            }
        },

        // Activity patterns by time of day
        activityByTime: {
            dawn: 1.6, // 5-7 AM - peak feeding
            morning: 1.2, // 7-11 AM - active
            midday: 0.7, // 11 AM-3 PM - less active (bright sun)
            afternoon: 1.1, // 3-6 PM - picks up
            dusk: 1.6, // 6-8 PM - peak feeding
            night: 0.8, // 8 PM-5 AM - moderate activity
        },

        // Fight characteristics - EXTREMELY ACROBATIC
        fightCharacteristics: {
            initialRun: 'explosive', // powerful first run
            tactics: ['jump', 'head_shake', 'aerial_acrobatics', 'dive_to_rocks', 'surface_thrash'],
            stamina: 'high', // pound-for-pound strongest fighter
            difficulty: 'hard',
            acrobatic: true, // VERY acrobatic - multiple jumps
            jumpProbability: 0.4, // 40% chance to jump during fight
            structureAdvantage: true, // tries to reach rocks/structure
            lineShy: true // can be spooked by heavy line/clumsy presentation
        },

        // Habitat preferences - ROCKY STRUCTURE
        habitatPreferences: {
            primary: ['rocky_points', 'boulder_fields', 'drop_offs'],
            secondary: ['ledges', 'submerged_rocks', 'gravel_bars'],
            avoids: ['muddy_bottom', 'heavy_vegetation', 'stagnant_water']
        },

        // Visual characteristics
        appearance: {
            bodyShape: 'compact_muscular', // deep-bodied, powerful
            colorScheme: {
                base: 0x6b5d3f, // bronze/brown
                bars: 0x3a2f1f, // dark brown/black vertical bars
                belly: 0xc9b896, // cream/tan belly
                eyes: 0xcc3333, // distinctive red eyes
                fins: 0x5a4d30, // bronze/olive fins
                distinctive: ['red_eyes', 'vertical_bars', 'large_mouth']
            },
            markingPattern: 'vertical_bars' // 8-10 dark vertical bars
        },

        // Ecological notes
        notes: 'Aggressive active predator. Structure-oriented. Extremely acrobatic fighter - jumps frequently. Territorial, especially during spawn. Line-shy but opportunistic.'
    },

    yellow_perch_large: {
        name: 'Yellow Perch',
        scientificName: 'Perca flavescens',
        commonNames: ['Perch', 'Ringed Perch', 'Striped Perch'],
        status: 'Native, abundant, excellent beginner species',

        // Spawn configuration
        spawnWeight: 40, // 40% spawn rate (most abundant, beginner-friendly)

        // Size categories - SMALLER than other predators (beginner-friendly)
        sizeCategories: {
            small: {
                weightRange: [0.3, 0.7],
                lengthRange: [8, 10],
                depthPreference: [5, 15],
                speedMultiplier: 1.2,
                aggressivenessMultiplier: 1.4, // aggressive for their size
                cautiousness: 0.3, // not very cautious
                schoolingTendency: 0.6 // sometimes school
            },
            medium: {
                weightRange: [0.7, 1.2],
                lengthRange: [10, 12],
                depthPreference: [8, 20],
                speedMultiplier: 1.1,
                aggressivenessMultiplier: 1.3,
                cautiousness: 0.4,
                schoolingTendency: 0.4
            },
            large: {
                weightRange: [1.2, 2.0],
                lengthRange: [12, 14],
                depthPreference: [10, 25],
                speedMultiplier: 1.0,
                aggressivenessMultiplier: 1.2,
                cautiousness: 0.5,
                schoolingTendency: 0.2
            },
            trophy: {
                weightRange: [2.0, 3.0],
                lengthRange: [14, 16],
                depthPreference: [12, 30],
                speedMultiplier: 0.9,
                aggressivenessMultiplier: 1.1,
                cautiousness: 0.6,
                schoolingTendency: 0.1 // larger perch more solitary
            }
        },

        // Temperature preferences - tolerates wide range
        tempPreference: {
            optimal: 68, // 65-72°F range
            min: 50,
            max: 78,
            lethal: 85,
            behaviorAffect: true
        },

        // Seasonal depth preferences (feet)
        depthPreference: {
            spring: [5, 15], // shallow spawning
            summer: [10, 25], // moderate depth
            fall: [8, 20], // active feeding
            winter: [15, 35] // deeper in ice fishing
        },

        // Diet composition - perch eat smaller fish and invertebrates
        dietPreferences: {
            alewife: 0.30, // small baitfish
            rainbow_smelt: 0.20,
            sculpin: 0.15,
            insects: 0.25, // major food source (not modeled)
            small_perch: 0.10 // some cannibalism
        },

        // Behavioral characteristics - EASY TO CATCH
        behavior: {
            huntingStyle: 'opportunistic', // not picky, strikes readily
            feedingPeriods: ['all_day'], // feeds throughout the day
            aggressionByDepth: {
                surface: 1.3,
                midColumn: 1.4, // most aggressive in mid-water
                bottom: 1.2
            },
            cannibalismChance: 0.10, // moderate cannibalism
            opportunisticFeeding: true,
            structureOriented: true,
            schoolingBehavior: {
                schoolBySize: true, // perch school with similar-sized fish
                schoolSize: [3, 8], // small schools
                lessSchoolingWhenLarge: true
            },
            spawnPeriod: {
                months: [4, 5], // April-May
                behaviorChange: 'normal', // still feeds during spawn
                feedingReduction: 0.8 // feeds less but still active
            }
        },

        // Activity patterns - ACTIVE ALL DAY (easy to catch anytime)
        activityByTime: {
            dawn: 1.3,
            morning: 1.2,
            midday: 1.1, // still active at midday (unlike bass)
            afternoon: 1.2,
            dusk: 1.3,
            night: 0.7,
        },

        // Fight characteristics - EASY FIGHT
        fightCharacteristics: {
            initialRun: 'weak', // not much initial run
            tactics: ['head_shake', 'spin'], // simple fight tactics
            stamina: 'low', // tires quickly
            difficulty: 'easy', // BEGINNER-FRIENDLY
            acrobatic: false, // doesn't jump
            fightDuration: 'short' // quick fights
        },

        // Habitat preferences
        habitatPreferences: {
            primary: ['weed_edges', 'moderate_structure', 'sand_gravel_bottom'],
            secondary: ['drop_offs', 'shallow_flats', 'near_docks'],
            avoids: ['very_deep_water', 'strong_current']
        },

        // Visual characteristics (same as baitfish but larger)
        appearance: {
            bodyShape: 'deep', // deep-bodied
            colorScheme: {
                base: 0xccaa33, // golden yellow
                bars: 0x4a3a1a, // dark brown/black vertical bars
                belly: 0xf0e0b0, // pale yellow/cream
                fins: 0xff6600, // orange/red fins (distinctive!)
                eyes: 0x332211, // dark eyes
                distinctive: ['vertical_bars', 'orange_fins', 'golden_color']
            },
            markingPattern: 'vertical_bars' // 6-8 dark vertical bars
        },

        // Ecological notes
        notes: 'BEGINNER SPECIES - Easy to catch, abundant, fights weakly. Perfect for learning game mechanics. Schools by size. Active all day. Not picky about lures.'
    }
};

// Helper function to get species data
export function getBaitfishSpecies(speciesName) {
    return BAITFISH_SPECIES[speciesName] || BAITFISH_SPECIES.alewife;
}

export function getPredatorSpecies(speciesName) {
    return PREDATOR_SPECIES[speciesName] || PREDATOR_SPECIES.lake_trout;
}

// Calculate diet preference score for predator hunting decisions
export function calculateDietPreference(predatorSpecies, preySpecies) {
    const predatorData = getPredatorSpecies(predatorSpecies);
    return predatorData.dietPreferences[preySpecies] || 0.1; // default low preference
}

/**
 * Get all spawnable predator species with their weights
 * Returns array of {name, weight} objects normalized to 100%
 * @returns {Array<{name: string, weight: number}>}
 */
export function getSpawnableSpecies() {
    const species = [];
    for (const [key, data] of Object.entries(PREDATOR_SPECIES)) {
        if (data.spawnWeight && data.spawnWeight > 0) {
            species.push({
                name: key,
                weight: data.spawnWeight,
                data: data
            });
        }
    }
    return species;
}

/**
 * Select a random species based on spawn weights
 * Config-driven species selection - no hardcoded logic!
 * @returns {string} Species key (e.g., 'lake_trout')
 */
export function selectRandomSpecies() {
    const species = getSpawnableSpecies();
    const totalWeight = species.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    for (const s of species) {
        random -= s.weight;
        if (random <= 0) {
            return s.name;
        }
    }
    // Fallback to first species
    return species[0]?.name || 'lake_trout';
}

export default {
    BAITFISH_SPECIES,
    PREDATOR_SPECIES,
    getBaitfishSpecies,
    getPredatorSpecies,
    calculateDietPreference,
    getSpawnableSpecies,
    selectRandomSpecies
};
