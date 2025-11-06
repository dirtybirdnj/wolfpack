/**
 * Water column info interface
 */
export interface WaterColumnInfo {
    canvasHeight: number;
    maxDepth: number;
    waterColumnHeight: number;
    depthScale: string;
    surfaceY: number;
    waterFloorY: number;
    reservePx: number;
}
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
export declare class DepthConverter {
    canvasHeight: number;
    maxDepth: number;
    waterColumnHeight: number;
    waterFloorY: number;
    depthScale: number;
    surfaceY: number;
    reservePx: number;
    /**
     * @param canvasHeight - Height of the game canvas in pixels
     * @param maxDepth - Maximum water depth in feet
     */
    constructor(canvasHeight: number, maxDepth: number);
    /**
     * Recalculate scale factors based on current dimensions
     */
    recalculate(): void;
    /**
     * Convert depth in feet to screen Y coordinate
     * @param depthInFeet - Depth below surface in feet (0 = surface)
     * @returns Screen Y coordinate in pixels
     */
    depthToY(depthInFeet: number): number;
    /**
     * Convert screen Y coordinate to depth in feet
     * @param pixelY - Screen Y coordinate
     * @returns Depth below surface in feet
     */
    yToDepth(pixelY: number): number;
    /**
     * Check if a Y coordinate is within the water column
     * @param y - Screen Y coordinate
     * @returns True if Y is between surface and floor
     */
    isInWater(y: number): boolean;
    /**
     * Clamp Y coordinate to stay within water boundaries
     * @param y - Screen Y coordinate
     * @returns Clamped Y coordinate
     */
    clampToWater(y: number): number;
    /**
     * Update dimensions (call when canvas resizes)
     * @param canvasHeight - New canvas height
     * @param maxDepth - New max depth (optional)
     */
    resize(canvasHeight: number, maxDepth?: number | null): void;
    /**
     * Get info about the water column for debugging
     * @returns Water column dimensions and scale
     */
    getInfo(): WaterColumnInfo;
}
export default DepthConverter;
//# sourceMappingURL=DepthConverter.d.ts.map