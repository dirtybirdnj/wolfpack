// Game configuration and constants
export const GameConfig = {
    // Canvas settings - optimized for 13" screens
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 560,

    // Sonar display settings
    SONAR_SCROLL_SPEED: 1.2, // pixels per frame (scaled for smaller canvas)
    GRID_SIZE: 20, // pixels between grid lines (scaled for smaller canvas)
    MAX_DEPTH: 150, // feet
    DEPTH_SCALE: 3.2, // pixels per foot (scaled for smaller canvas)

    // Lure physics
    LURE_GRAVITY: 0.15, // acceleration when dropping
    LURE_MAX_FALL_SPEED: 3.5,
    LURE_MIN_RETRIEVE_SPEED: 0.5,
    LURE_MAX_RETRIEVE_SPEED: 5.0,
    LURE_SPEED_INCREMENT: 0.5,

    // Fish spawning
    FISH_SPAWN_CHANCE: 0.008, // per frame
    MIN_FISH_DEPTH: 20,
    MAX_FISH_DEPTH: 140,
    FISH_SPEED_MIN: 0.3,
    FISH_SPEED_MAX: 1.2,

    // Fish AI
    DETECTION_RANGE: 80, // pixels (horizontal)
    VERTICAL_DETECTION_RANGE: 280, // pixels (40-70 feet = 160-280 pixels at 4px/ft)
    OPTIMAL_LURE_SPEED: 2.0,
    SPEED_TOLERANCE: 1.5,
    CHASE_SPEED_MULTIPLIER: 1.8,
    STRIKE_DISTANCE: 15,

    // Fish fight mechanics
    MAX_LINE_TENSION: 100,
    TENSION_BREAK_THRESHOLD: 95,
    TENSION_DECAY_RATE: 2.0, // per frame
    TENSION_PER_REEL: 15, // tension added per spacebar press
    MIN_REEL_INTERVAL: 100, // milliseconds between valid reels
    FISH_PULL_BASE: 5, // base tension from fish fighting
    FISH_TIRE_RATE: 0.5, // how fast fish gets tired
    REEL_DISTANCE_PER_TAP: 2, // pixels reeled per tap

    // Colors - realistic lake trout and water colors based on reference photos
    COLOR_BACKGROUND: 0x3a4f3a, // Olive green water (deeper)
    COLOR_BACKGROUND_SURFACE: 0x5a6f4a, // Army/olive green (surface)
    COLOR_GRID: 0x4a5a3a,
    COLOR_TEXT: 0x00ff00,
    COLOR_LURE: 0xff6600, // Orange lure
    // Lake trout colors from reference photos
    COLOR_FISH_BODY: 0x8b9178, // Grayish-olive body
    COLOR_FISH_BELLY: 0xc9b896, // Cream/pinkish belly
    COLOR_FISH_FINS: 0xd9c8a6, // Pale cream fins
    COLOR_FISH_SPOTS: 0xa8b898, // Light spots
    // Legacy color categories for behavior
    COLOR_FISH_WEAK: 0x8b9178,
    COLOR_FISH_MEDIUM: 0x8b9178,
    COLOR_FISH_STRONG: 0x8b9178,
    COLOR_SURFACE: 0x5a6f4a, // Army green surface

    // Game settings
    WATER_TEMP_MIN: 38,
    WATER_TEMP_MAX: 45,
    LAKE_TROUT_PREFERRED_DEPTH_MIN: 40,
    LAKE_TROUT_PREFERRED_DEPTH_MAX: 100,

    // UI settings
    UI_FONT_SIZE: 14,
    UI_PADDING: 10,

    // Baitfish settings
    BAITFISH_CLOUD_SPAWN_CHANCE: 0.003, // per frame
    BAITFISH_CLOUD_MIN_COUNT: 5,
    BAITFISH_CLOUD_MAX_COUNT: 20,
    BAITFISH_CLOUD_RADIUS: 40, // pixels - how close to be "in the cloud"
    COLOR_BAITFISH: 0x88ccff, // Light blue/silver for alewives
    COLOR_BAITFISH_PANIC: 0xccddff, // Brighter when panicking

    // Baitfish pursuit mechanics (works with 0-100 hunger scale)
    BAITFISH_DETECTION_RANGE: 150, // Pixels - fish can see baitfish from farther away
    BAITFISH_PURSUIT_SPEED: 2.2, // Multiplier when chasing baitfish
    BAITFISH_VERTICAL_PURSUIT_RANGE: 200, // Base vertical range in pixels
    HUNGER_VERTICAL_SCALING: 0.01, // How hunger affects vertical range (0-100 scale)
    BAITFISH_CONSUMPTION_HUNGER_REDUCTION: 15, // Hunger reduced when eating baitfish

    // Depth-based behavior zones
    DEPTH_ZONES: {
        SURFACE: {
            min: 0,
            max: 40,
            name: 'Surface',
            speedMultiplier: 1.3,      // Fast, active feeding
            aggressivenessBonus: 0.3,  // More aggressive
            interestThreshold: 30,      // Easier to interest
            description: 'Active feeding zone - fast and aggressive'
        },
        MID_COLUMN: {
            min: 40,
            max: 100,
            name: 'Mid-Column',
            speedMultiplier: 1.0,      // Normal activity
            aggressivenessBonus: 0.0,  // Normal aggression
            interestThreshold: 40,      // Standard interest
            description: 'Prime lake trout zone - balanced behavior'
        },
        BOTTOM: {
            min: 100,
            max: 150,
            name: 'Bottom',
            speedMultiplier: 0.6,      // Slow cruising
            aggressivenessBonus: -0.2, // Less aggressive
            interestThreshold: 50,      // Harder to interest
            description: 'Bottom feeding - slow and cautious'
        }
    }
};

// Lake Champlain flavor text
export const LAKE_CHAMPLAIN_FACTS = [
    "Lake Champlain: 120 miles long, 400 feet deep",
    "Home to landlocked Atlantic salmon and lake trout",
    "Water temp in winter: 38-42°F",
    "Best lake trout depths: 60-100 feet",
    "Record lake trout: 37 lbs, 1987",
    "Indigenous name: Bitawbagok - 'the waters that lie between'",
    "Borders Vermont, New York, and Quebec",
    "Contains 70+ islands",
    "6th largest freshwater lake in the US"
];

export default GameConfig;
