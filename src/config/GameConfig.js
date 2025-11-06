// Game configuration and constants
export const GameConfig = {
    // Fishing types (ice fishing and nature simulation only)
    FISHING_TYPE_ICE: 'ice',
    FISHING_TYPE_NATURE_SIMULATION: 'nature_simulation',

    // Canvas settings - INITIAL/MINIMUM values only
    // NOTE: These are only used for Phaser initialization
    // The game uses Phaser.Scale.RESIZE mode and dynamically fills the container
    // ALWAYS use scene.scale.width or scene.game.canvas.width at runtime, NEVER these constants!
    CANVAS_WIDTH: 1562,  // Initial width (game will resize to container)
    CANVAS_HEIGHT: 874,  // Initial height (game will resize to container)

    // Water boundaries (fish cannot swim outside these)
    WATER_SURFACE_Y: 0,  // Top of water (always 0)
    // NOTE: WATER_FLOOR_Y is now calculated dynamically - use GameConfig.getWaterFloorY(canvasHeight)

    // Lake bottom reserve - ratio of canvas height reserved for brown bottom rendering
    // On 650px canvas: 96px / 650px = 0.148 (~15%)
    LAKE_BOTTOM_RESERVE_RATIO: 0.148,

    // Game area buffer zones (off-screen areas where fish can exist)
    // Visible area: 0 to CANVAS_WIDTH
    // Left buffer: -500 to 0
    // Right buffer: CANVAS_WIDTH to CANVAS_WIDTH+500
    BUFFER_ZONE_SIZE: 500, // Large enough for big bait clouds and smooth transitions

    // Sonar display settings
    SONAR_SCROLL_SPEED: 1.35, // pixels per frame (scaled for larger canvas)
    GRID_SIZE: 22, // pixels between grid lines (scaled for larger canvas)
    MAX_DEPTH: 150, // feet
    DEPTH_SCALE: 4, // Default depth scale (pixels per foot) - prefer scene.depthConverter.depthScale when available

    // Lure physics
    LURE_GRAVITY: 0.15, // acceleration when dropping
    LURE_MAX_FALL_SPEED: 3.5,
    LURE_MIN_RETRIEVE_SPEED: 0.5,
    LURE_MAX_RETRIEVE_SPEED: 5.0,
    LURE_SPEED_INCREMENT: 0.5,

    // Fish spawning
    FISH_SPAWN_CHANCE: 0.008, // per frame
    MIN_FISH_DEPTH: 20,
    MAX_FISH_DEPTH: 148, // Increased from 140 to allow bottom feeding (lake is 150ft)
    FISH_SPEED_MIN: 1.2,  // Increased from 0.4 - lake trout need to catch baitfish (2.2-4.0)
    FISH_SPEED_MAX: 2.0,  // Increased from 1.4 - allows faster fish to catch prey

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
    FISH_TIRE_RATE: 0.8, // how fast fish gets tired (increased from 0.5 for quicker fights)
    REEL_DISTANCE_PER_TAP: 5, // pixels reeled per tap (increased from 2 for better progress)

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
    LAKE_TROUT_PREFERRED_DEPTH_MAX: 130, // Increased from 100 to allow bottom feeding on sculpin/crayfish

    // UI settings
    UI_FONT_SIZE: 14,
    UI_PADDING: 10,

    // Baitfish settings - Increased to sustain aggressive lake trout feeding
    BAITFISH_CLOUD_SPAWN_CHANCE: 0.004, // Increased to keep up with hungry lakers
    BAITFISH_CLOUD_MIN_COUNT: 5, // Minimum cloud size
    BAITFISH_CLOUD_MAX_COUNT: 50, // Allows for massive schools
    BAITFISH_CLOUD_RADIUS: 60, // pixels - reduced to keep schools tighter (was 100)
    COLOR_BAITFISH: 0x88ccff, // Light blue/silver for alewives
    COLOR_BAITFISH_PANIC: 0xccddff, // Brighter when panicking

    // Baitfish pursuit mechanics (works with 0-100 hunger scale) - More aggressive pursuit
    BAITFISH_DETECTION_RANGE: 200, // Increased from 140 - fish should notice nearby bait clouds
    BAITFISH_PURSUIT_SPEED: 2.8, // Increased from 2.2 for more aggressive hunting
    BAITFISH_VERTICAL_PURSUIT_RANGE: 350, // Increased from 250 for better vertical awareness (~97ft at 3.6px/ft)
    HUNGER_VERTICAL_SCALING: 0.02, // Increased from 0.015 - even low-hunger fish should hunt nearby bait
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

// Helper functions for dynamic calculations
// These calculate runtime values based on actual canvas dimensions

/**
 * Calculate the water floor Y position based on canvas height
 * @param {number} canvasHeight - Actual canvas height in pixels
 * @returns {number} Y position of water floor (bottom boundary for fish)
 */
GameConfig.getWaterFloorY = function(canvasHeight) {
    const reservePx = Math.floor(canvasHeight * GameConfig.LAKE_BOTTOM_RESERVE_RATIO);
    return canvasHeight - reservePx;
};

/**
 * Calculate the lake bottom reserve pixels based on canvas height
 * @param {number} canvasHeight - Actual canvas height in pixels
 * @returns {number} Pixels reserved for lake bottom rendering
 */
GameConfig.getLakeBottomReservePx = function(canvasHeight) {
    return Math.floor(canvasHeight * GameConfig.LAKE_BOTTOM_RESERVE_RATIO);
};

/**
 * Calculate depth scale (pixels per foot) based on canvas height
 * @param {number} canvasHeight - Actual canvas height in pixels
 * @returns {number} Pixels per foot of depth
 */
GameConfig.getDepthScale = function(canvasHeight) {
    const waterColumnHeight = canvasHeight - GameConfig.getLakeBottomReservePx(canvasHeight);
    return waterColumnHeight / GameConfig.MAX_DEPTH;
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
