// Game configuration and constants
export const GameConfig = {
    // Canvas settings - optimized for 13" screens with improved visibility
    CANVAS_WIDTH: 900,
    CANVAS_HEIGHT: 630,

    // Sonar display settings
    SONAR_SCROLL_SPEED: 1.35, // pixels per frame (scaled for larger canvas)
    GRID_SIZE: 22, // pixels between grid lines (scaled for larger canvas)
    MAX_DEPTH: 150, // feet
    DEPTH_SCALE: 3.6, // pixels per foot (scaled for larger canvas)

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

    // Fish AI - Improved detection ranges for 900px canvas
    DETECTION_RANGE: 150, // pixels (horizontal) - increased from 80 for better gameplay
    VERTICAL_DETECTION_RANGE: 280, // pixels (40-70 feet = 160-280 pixels at 3.6px/ft)
    OPTIMAL_LURE_SPEED: 2.0,
    SPEED_TOLERANCE: 2.0, // increased from 1.5 for more forgiving speed matching
    CHASE_SPEED_MULTIPLIER: 1.8,
    STRIKE_DISTANCE: 25, // increased from 15 pixels for easier hookups

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

    // Baitfish settings - Reduced spawn rate to give lures more attention
    BAITFISH_CLOUD_SPAWN_CHANCE: 0.0015, // Reduced from 0.003 for less competition
    BAITFISH_CLOUD_MIN_COUNT: 3, // Reduced from 5
    BAITFISH_CLOUD_MAX_COUNT: 12, // Reduced from 20
    BAITFISH_CLOUD_RADIUS: 40, // pixels - how close to be "in the cloud"
    COLOR_BAITFISH: 0x88ccff, // Light blue/silver for alewives
    COLOR_BAITFISH_PANIC: 0xccddff, // Brighter when panicking

    // Baitfish pursuit mechanics (works with 0-100 hunger scale) - More aggressive pursuit
    BAITFISH_DETECTION_RANGE: 140, // Reduced from 150 to balance with lure detection
    BAITFISH_PURSUIT_SPEED: 2.8, // Increased from 2.2 for more aggressive hunting
    BAITFISH_VERTICAL_PURSUIT_RANGE: 250, // Increased from 200 for better vertical pursuit
    HUNGER_VERTICAL_SCALING: 0.015, // Increased from 0.01 for more aggressive vertical pursuit
    BAITFISH_CONSUMPTION_HUNGER_REDUCTION: 15, // Hunger reduced when eating baitfish

    // Depth-based behavior zones - Improved thresholds for better gameplay
    DEPTH_ZONES: {
        SURFACE: {
            min: 0,
            max: 40,
            name: 'Surface',
            speedMultiplier: 1.3,      // Fast, active feeding
            aggressivenessBonus: 0.35, // Increased from 0.3 - more aggressive
            interestThreshold: 22,      // Lowered from 30 - easier to attract
            description: 'Active feeding zone - fast and aggressive'
        },
        MID_COLUMN: {
            min: 40,
            max: 100,
            name: 'Mid-Column',
            speedMultiplier: 1.0,      // Normal activity
            aggressivenessBonus: 0.1,  // Increased from 0.0 - slightly more aggressive
            interestThreshold: 28,      // Lowered from 40 - more responsive
            description: 'Prime lake trout zone - balanced behavior'
        },
        BOTTOM: {
            min: 100,
            max: 150,
            name: 'Bottom',
            speedMultiplier: 0.6,      // Slow cruising
            aggressivenessBonus: -0.1, // Less negative from -0.2 - more responsive
            interestThreshold: 35,      // Lowered from 50 - significantly easier
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
