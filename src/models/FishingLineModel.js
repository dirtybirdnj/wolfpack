/**
 * FishingLineModel - Tracks fishing line type and properties
 *
 * Line Types:
 * - Braid: Zero stretch, better sensitivity, most visible
 * - Monofilament: Stretch for shock absorption, medium visibility
 * - Fluorocarbon: Less stretch, least visible, good for clear water
 */

export const LINE_TYPES = {
    BRAID: 'braid',
    MONOFILAMENT: 'monofilament',
    FLUOROCARBON: 'fluorocarbon'
};

export const BRAID_COLORS = {
    NEON_GREEN: 'neon-green',
    YELLOW: 'yellow',
    MOSS_GREEN: 'moss-green',
    WHITE: 'white'
};

export class FishingLineModel {
    constructor() {
        // Default line configuration
        this.lineType = LINE_TYPES.BRAID;
        this.braidColor = BRAID_COLORS.NEON_GREEN;

        // Line type properties
        this.properties = {
            [LINE_TYPES.BRAID]: {
                stretch: 0,          // No stretch (0-10 scale)
                sensitivity: 10,     // Maximum sensitivity (0-10 scale)
                visibility: 10,      // Most visible to fish (0-10 scale, higher = more visible)
                shockAbsorption: 0   // No shock absorption (0-10 scale)
            },
            [LINE_TYPES.MONOFILAMENT]: {
                stretch: 8,          // High stretch
                sensitivity: 5,      // Medium sensitivity
                visibility: 6,       // Medium visibility to fish
                shockAbsorption: 8   // High shock absorption
            },
            [LINE_TYPES.FLUOROCARBON]: {
                stretch: 3,          // Low stretch
                sensitivity: 6,      // Medium-high sensitivity
                visibility: 2,       // Low visibility to fish (stealthy)
                shockAbsorption: 3   // Low shock absorption
            }
        };
    }

    /**
     * Set the fishing line type
     * @param {string} lineType - One of LINE_TYPES
     */
    setLineType(lineType) {
        if (this.properties[lineType]) {
            this.lineType = lineType;
        }
    }

    /**
     * Set the braid color (only applies to braid line)
     * @param {string} color - One of BRAID_COLORS
     */
    setBraidColor(color) {
        if (Object.values(BRAID_COLORS).includes(color)) {
            this.braidColor = color;
        }
    }

    /**
     * Get current line properties
     * @returns {object} Current line properties
     */
    getCurrentProperties() {
        return this.properties[this.lineType];
    }

    /**
     * Get sensitivity multiplier (affects bite detection)
     * @returns {number} Sensitivity multiplier (0.5 to 1.0)
     */
    getSensitivityMultiplier() {
        const props = this.getCurrentProperties();
        return 0.5 + (props.sensitivity / 20); // 0.5 to 1.0
    }

    /**
     * Get visibility to fish (affects strike chance)
     * @returns {number} Visibility factor (0.2 to 1.0, higher = more visible = worse)
     */
    getVisibilityFactor() {
        const props = this.getCurrentProperties();
        return 0.2 + (props.visibility * 0.08); // 0.2 to 1.0
    }

    /**
     * Get shock absorption (affects line break chance during fight)
     * @returns {number} Shock absorption multiplier (0.5 to 1.0, higher = better)
     */
    getShockAbsorptionMultiplier() {
        const props = this.getCurrentProperties();
        return 0.5 + (props.shockAbsorption / 20); // 0.5 to 1.0
    }

    /**
     * Get line stretch factor (affects hookset quality)
     * @returns {number} Stretch factor (0.5 to 1.0, higher = more stretch = worse hookset)
     */
    getStretchFactor() {
        const props = this.getCurrentProperties();
        return 0.5 + (props.stretch / 20); // 0.5 to 1.0
    }

    /**
     * Get display name for current line type
     * @returns {string} Display name
     */
    getDisplayName() {
        const names = {
            [LINE_TYPES.BRAID]: 'Braided',
            [LINE_TYPES.MONOFILAMENT]: 'Monofilament',
            [LINE_TYPES.FLUOROCARBON]: 'Fluorocarbon'
        };
        return names[this.lineType];
    }

    /**
     * Get display name for braid color
     * @returns {string} Display name
     */
    getBraidColorDisplayName() {
        const names = {
            [BRAID_COLORS.NEON_GREEN]: 'Neon Green',
            [BRAID_COLORS.YELLOW]: 'Yellow',
            [BRAID_COLORS.MOSS_GREEN]: 'Moss Green',
            [BRAID_COLORS.WHITE]: 'White'
        };
        return names[this.braidColor];
    }

    /**
     * Get haptic sensitivity for fish bump detection
     * @returns {number} Haptic sensitivity (0.4 to 1.0)
     */
    getHapticSensitivity() {
        const sensitivities = {
            [LINE_TYPES.BRAID]: 1.0,          // 100% sensitivity
            [LINE_TYPES.FLUOROCARBON]: 0.6,   // 60% sensitivity
            [LINE_TYPES.MONOFILAMENT]: 0.4    // 40% sensitivity
        };
        return sensitivities[this.lineType];
    }
}
