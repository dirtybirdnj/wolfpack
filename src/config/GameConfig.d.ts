/**
 * Depth zone configuration interface
 */
export interface DepthZoneConfig {
    min: number;
    max: number;
    name: string;
    speedMultiplier: number;
    aggressivenessBonus: number;
    interestThreshold: number;
    description: string;
}
/**
 * Depth zones configuration type
 */
export interface DepthZones {
    SURFACE: DepthZoneConfig;
    MID_COLUMN: DepthZoneConfig;
    BOTTOM: DepthZoneConfig;
}
/**
 * Game configuration interface
 */
export interface GameConfigType {
    FISHING_TYPE_ICE: string;
    FISHING_TYPE_NATURE_SIMULATION: string;
    CANVAS_WIDTH: number;
    CANVAS_HEIGHT: number;
    WATER_SURFACE_Y: number;
    LAKE_BOTTOM_RESERVE_RATIO: number;
    BUFFER_ZONE_SIZE: number;
    SONAR_SCROLL_SPEED: number;
    GRID_SIZE: number;
    MAX_DEPTH: number;
    DEPTH_SCALE: number;
    LURE_GRAVITY: number;
    LURE_MAX_FALL_SPEED: number;
    LURE_MIN_RETRIEVE_SPEED: number;
    LURE_MAX_RETRIEVE_SPEED: number;
    LURE_SPEED_INCREMENT: number;
    FISH_SPAWN_CHANCE: number;
    MIN_FISH_DEPTH: number;
    MAX_FISH_DEPTH: number;
    FISH_SPEED_MIN: number;
    FISH_SPEED_MAX: number;
    DETECTION_RANGE: number;
    VERTICAL_DETECTION_RANGE: number;
    OPTIMAL_LURE_SPEED: number;
    SPEED_TOLERANCE: number;
    CHASE_SPEED_MULTIPLIER: number;
    STRIKE_DISTANCE: number;
    MAX_LINE_TENSION: number;
    TENSION_BREAK_THRESHOLD: number;
    TENSION_DECAY_RATE: number;
    TENSION_PER_REEL: number;
    MIN_REEL_INTERVAL: number;
    FISH_PULL_BASE: number;
    FISH_TIRE_RATE: number;
    REEL_DISTANCE_PER_TAP: number;
    COLOR_BACKGROUND: number;
    COLOR_BACKGROUND_SURFACE: number;
    COLOR_GRID: number;
    COLOR_TEXT: number;
    COLOR_LURE: number;
    COLOR_FISH_BODY: number;
    COLOR_FISH_BELLY: number;
    COLOR_FISH_FINS: number;
    COLOR_FISH_SPOTS: number;
    COLOR_FISH_WEAK: number;
    COLOR_FISH_MEDIUM: number;
    COLOR_FISH_STRONG: number;
    COLOR_SURFACE: number;
    WATER_TEMP_MIN: number;
    WATER_TEMP_MAX: number;
    LAKE_TROUT_PREFERRED_DEPTH_MIN: number;
    LAKE_TROUT_PREFERRED_DEPTH_MAX: number;
    UI_FONT_SIZE: number;
    UI_PADDING: number;
    BAITFISH_CLOUD_SPAWN_CHANCE: number;
    BAITFISH_CLOUD_MIN_COUNT: number;
    BAITFISH_CLOUD_MAX_COUNT: number;
    BAITFISH_CLOUD_RADIUS: number;
    COLOR_BAITFISH: number;
    COLOR_BAITFISH_PANIC: number;
    BAITFISH_DETECTION_RANGE: number;
    BAITFISH_PURSUIT_SPEED: number;
    BAITFISH_VERTICAL_PURSUIT_RANGE: number;
    HUNGER_VERTICAL_SCALING: number;
    BAITFISH_CONSUMPTION_HUNGER_REDUCTION: number;
    DEPTH_ZONES: DepthZones;
    getWaterFloorY(canvasHeight: number): number;
    getLakeBottomReservePx(canvasHeight: number): number;
    getDepthScale(canvasHeight: number): number;
}
export declare const GameConfig: GameConfigType;
export declare const LAKE_CHAMPLAIN_FACTS: string[];
export default GameConfig;
//# sourceMappingURL=GameConfig.d.ts.map