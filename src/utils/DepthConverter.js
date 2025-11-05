import GameConfig from '../config/GameConfig.js';

/**
 * DepthConverter - Utility for converting between depth (feet) and screen Y coordinates
 *
 * Handles the water column coordinate system:
 * - Surface is at Y = 0 (top of canvas)
 * - Depth increases downward (positive Y)
 * - Lake floor is at bottom with reserved space
 *
 * This is the single source of truth for depth-to-pixel conversions.
 */
export class DepthConverter {
    /**
     * @param {number} canvasHeight - Height of the game canvas in pixels
     * @param {number} maxDepth - Maximum water depth in feet
     */
    constructor(canvasHeight, maxDepth) {
        this.canvasHeight = canvasHeight;
        this.maxDepth = maxDepth;
        this.recalculate();
    }

    /**
     * Recalculate scale factors based on current dimensions
     */
    recalculate() {
        // Reserve space at bottom for lake floor visualization
        this.reservePx = GameConfig.getLakeBottomReservePx(this.canvasHeight);

        // Water column height is canvas height minus the reserved bottom space
        this.waterColumnHeight = this.canvasHeight - this.reservePx;

        // Water floor Y (where water meets lake bed)
        this.waterFloorY = this.canvasHeight - this.reservePx;

        // Depth scale: pixels per foot of water depth
        this.depthScale = this.waterColumnHeight / this.maxDepth;

        // Surface Y is always at top
        this.surfaceY = GameConfig.WATER_SURFACE_Y;
    }

    /**
     * Convert depth in feet to screen Y coordinate
     * @param {number} depthInFeet - Depth below surface in feet (0 = surface)
     * @returns {number} Screen Y coordinate in pixels
     */
    depthToY(depthInFeet) {
        return this.surfaceY + (depthInFeet * this.depthScale);
    }

    /**
     * Convert screen Y coordinate to depth in feet
     * @param {number} pixelY - Screen Y coordinate
     * @returns {number} Depth below surface in feet
     */
    yToDepth(pixelY) {
        return (pixelY - this.surfaceY) / this.depthScale;
    }

    /**
     * Check if a Y coordinate is within the water column
     * @param {number} y - Screen Y coordinate
     * @returns {boolean} True if Y is between surface and floor
     */
    isInWater(y) {
        return y >= this.surfaceY && y <= this.waterFloorY;
    }

    /**
     * Clamp Y coordinate to stay within water boundaries
     * @param {number} y - Screen Y coordinate
     * @returns {number} Clamped Y coordinate
     */
    clampToWater(y) {
        return Math.max(this.surfaceY, Math.min(this.waterFloorY, y));
    }

    /**
     * Update dimensions (call when canvas resizes)
     * @param {number} canvasHeight - New canvas height
     * @param {number} maxDepth - New max depth (optional)
     */
    resize(canvasHeight, maxDepth = null) {
        this.canvasHeight = canvasHeight;
        if (maxDepth !== null) {
            this.maxDepth = maxDepth;
        }
        this.recalculate();
    }

    /**
     * Get info about the water column for debugging
     * @returns {object} Water column dimensions and scale
     */
    getInfo() {
        return {
            canvasHeight: this.canvasHeight,
            maxDepth: this.maxDepth,
            waterColumnHeight: this.waterColumnHeight,
            depthScale: this.depthScale.toFixed(2),
            surfaceY: this.surfaceY,
            waterFloorY: this.waterFloorY,
            reservePx: this.reservePx
        };
    }
}

export default DepthConverter;
