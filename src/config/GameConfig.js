// Game configuration and constants
export const GameConfig = {
    // Canvas settings
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    
    // Sonar display settings
    SONAR_SCROLL_SPEED: 1.5, // pixels per frame
    GRID_SIZE: 25, // pixels between grid lines
    MAX_DEPTH: 150, // feet
    DEPTH_SCALE: 4, // pixels per foot
    
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
    DETECTION_RANGE: 40, // pixels
    OPTIMAL_LURE_SPEED: 2.0,
    SPEED_TOLERANCE: 1.5,
    CHASE_SPEED_MULTIPLIER: 1.8,
    STRIKE_DISTANCE: 15,
    
    // Colors (sonar style)
    COLOR_BACKGROUND: 0x0a0a0a,
    COLOR_GRID: 0x003300,
    COLOR_TEXT: 0x00ff00,
    COLOR_LURE: 0xffff00,
    COLOR_FISH_WEAK: 0x336633,
    COLOR_FISH_MEDIUM: 0x66aa66,
    COLOR_FISH_STRONG: 0xffaa00,
    COLOR_SURFACE: 0x0066cc,
    
    // Game settings
    WATER_TEMP_MIN: 38,
    WATER_TEMP_MAX: 45,
    LAKE_TROUT_PREFERRED_DEPTH_MIN: 40,
    LAKE_TROUT_PREFERRED_DEPTH_MAX: 100,
    
    // UI settings
    UI_FONT_SIZE: 14,
    UI_PADDING: 10,
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
