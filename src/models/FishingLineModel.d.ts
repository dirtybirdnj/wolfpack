export namespace LINE_TYPES {
    let BRAID: string;
    let MONOFILAMENT: string;
    let FLUOROCARBON: string;
}
export namespace BRAID_COLORS {
    let NEON_GREEN: string;
    let YELLOW: string;
    let MOSS_GREEN: string;
    let WHITE: string;
}
export class FishingLineModel {
    lineType: string;
    braidColor: string;
    properties: {
        [LINE_TYPES.BRAID]: {
            stretch: number;
            sensitivity: number;
            visibility: number;
            shockAbsorption: number;
        };
        [LINE_TYPES.MONOFILAMENT]: {
            stretch: number;
            sensitivity: number;
            visibility: number;
            shockAbsorption: number;
        };
        [LINE_TYPES.FLUOROCARBON]: {
            stretch: number;
            sensitivity: number;
            visibility: number;
            shockAbsorption: number;
        };
    };
    /**
     * Set the fishing line type
     * @param {string} lineType - One of LINE_TYPES
     */
    setLineType(lineType: string): void;
    /**
     * Set the braid color (only applies to braid line)
     * @param {string} color - One of BRAID_COLORS
     */
    setBraidColor(color: string): void;
    /**
     * Get current line properties
     * @returns {object} Current line properties
     */
    getCurrentProperties(): object;
    /**
     * Get sensitivity multiplier (affects bite detection)
     * @returns {number} Sensitivity multiplier (0.5 to 1.0)
     */
    getSensitivityMultiplier(): number;
    /**
     * Get visibility to fish (affects strike chance)
     * @returns {number} Visibility factor (0.2 to 1.0, higher = more visible = worse)
     */
    getVisibilityFactor(): number;
    /**
     * Get shock absorption (affects line break chance during fight)
     * @returns {number} Shock absorption multiplier (0.5 to 1.0, higher = better)
     */
    getShockAbsorptionMultiplier(): number;
    /**
     * Get line stretch factor (affects hookset quality)
     * @returns {number} Stretch factor (0.5 to 1.0, higher = more stretch = worse hookset)
     */
    getStretchFactor(): number;
    /**
     * Get display name for current line type
     * @returns {string} Display name
     */
    getDisplayName(): string;
    /**
     * Get display name for braid color
     * @returns {string} Display name
     */
    getBraidColorDisplayName(): string;
    /**
     * Get haptic sensitivity for fish bump detection
     * @returns {number} Haptic sensitivity (0.4 to 1.0)
     */
    getHapticSensitivity(): number;
}
//# sourceMappingURL=FishingLineModel.d.ts.map