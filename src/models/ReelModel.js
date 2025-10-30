/**
 * ReelModel - Tracks reel type, drag settings, and line capacity
 *
 * Reel Types:
 * - Baitcaster: High gear ratio, precise drag, risk of backlash
 * - Spincaster: Lower gear ratio, forgiving drag, beginner-friendly
 *
 * Drag System:
 * - Drag setting (0-100%) controls how much resistance before line slips
 * - Drag limit (pounds) is the maximum force the drag can hold
 * - When fish pull exceeds drag limit, line slips instead of breaking
 */

export const REEL_TYPES = {
    BAITCASTER: 'baitcaster',
    SPINCASTER: 'spincaster'
};

export class ReelModel {
    constructor() {
        // Default reel configuration
        this.reelType = REEL_TYPES.BAITCASTER;

        // Line properties
        this.lineTestStrength = 15; // pounds (10, 15, 20, 30 lb test options)
        this.lineCapacity = 300;    // feet of line on spool
        this.lineOut = 0;           // feet of line currently deployed

        // Drag system
        this.dragSetting = 50;      // 0-100% (percentage of drag limit)
        this.maxDragLimit = 20;     // pounds (maximum drag force this reel can apply)

        // Reel type properties
        this.properties = {
            [REEL_TYPES.BAITCASTER]: {
                gearRatio: 6.2,           // High speed retrieve
                dragPrecision: 0.95,      // Very precise drag control
                backlashRisk: 0.15,       // 15% chance of backlash if misused
                maxDragLimit: 25,         // Can handle bigger fish
                lineCapacity: 300,        // feet (100 yards)
                description: 'High performance - precise drag, fast retrieve, backlash risk'
            },
            [REEL_TYPES.SPINCASTER]: {
                gearRatio: 5.2,           // Slower, steadier retrieve
                dragPrecision: 0.85,      // Less precise but more forgiving
                backlashRisk: 0.0,        // No backlash
                maxDragLimit: 18,         // Lower max drag
                lineCapacity: 250,        // feet (83 yards)
                description: 'Beginner-friendly - forgiving drag, no backlash'
            }
        };

        // Initialize reel-specific values
        this.updateReelProperties();
    }

    /**
     * Set the reel type
     * @param {string} reelType - One of REEL_TYPES
     */
    setReelType(reelType) {
        if (this.properties[reelType]) {
            this.reelType = reelType;
            this.updateReelProperties();
        }
    }

    /**
     * Update reel properties based on current reel type
     */
    updateReelProperties() {
        const props = this.properties[this.reelType];
        this.maxDragLimit = props.maxDragLimit;
        this.lineCapacity = props.lineCapacity;
        // Reset line out when changing reels
        this.lineOut = 0;
    }

    /**
     * Set line test strength (affects break threshold)
     * @param {number} testStrength - Line test in pounds (10, 15, 20, 30)
     */
    setLineTestStrength(testStrength) {
        this.lineTestStrength = testStrength;
    }

    /**
     * Adjust drag setting by increment
     * @param {number} increment - Percentage to add/subtract (-10, +10)
     */
    adjustDrag(increment) {
        this.dragSetting += increment;
        this.dragSetting = Math.max(0, Math.min(100, this.dragSetting));
    }

    /**
     * Set drag to specific percentage
     * @param {number} percentage - Drag setting 0-100
     */
    setDrag(percentage) {
        this.dragSetting = Math.max(0, Math.min(100, percentage));
    }

    /**
     * Get current drag force in pounds
     * @returns {number} Drag force in pounds
     */
    getCurrentDragForce() {
        return (this.dragSetting / 100) * this.maxDragLimit;
    }

    /**
     * Get current reel properties
     * @returns {object} Current reel properties
     */
    getCurrentProperties() {
        return this.properties[this.reelType];
    }

    /**
     * Get gear ratio (affects retrieve speed)
     * @returns {number} Gear ratio
     */
    getGearRatio() {
        return this.getCurrentProperties().gearRatio;
    }

    /**
     * Get drag precision (affects drag consistency)
     * @returns {number} Drag precision multiplier (0.85 to 0.95)
     */
    getDragPrecision() {
        return this.getCurrentProperties().dragPrecision;
    }

    /**
     * Get backlash risk (for baitcasters)
     * @returns {number} Backlash risk probability (0.0 to 0.15)
     */
    getBacklashRisk() {
        return this.getCurrentProperties().backlashRisk;
    }

    /**
     * Check if line capacity exceeded
     * @returns {boolean} True if spool is empty
     */
    isSpoolEmpty() {
        return this.lineOut >= this.lineCapacity;
    }

    /**
     * Add line going out (fish pulling)
     * @param {number} feet - Feet of line going out
     * @returns {boolean} True if spool emptied
     */
    addLineOut(feet) {
        this.lineOut += feet;
        if (this.lineOut > this.lineCapacity) {
            this.lineOut = this.lineCapacity;
            return true; // Spool empty!
        }
        return false;
    }

    /**
     * Remove line coming in (reeling)
     * @param {number} feet - Feet of line being retrieved
     */
    retrieveLine(feet) {
        this.lineOut -= feet;
        this.lineOut = Math.max(0, this.lineOut);
    }

    /**
     * Reset line out to zero (new cast)
     */
    resetLineOut() {
        this.lineOut = 0;
    }

    /**
     * Get line remaining as percentage
     * @returns {number} Percentage of line remaining (0-100)
     */
    getLineRemainingPercent() {
        return ((this.lineCapacity - this.lineOut) / this.lineCapacity) * 100;
    }

    /**
     * Get display name for current reel type
     * @returns {string} Display name
     */
    getDisplayName() {
        const names = {
            [REEL_TYPES.BAITCASTER]: 'Baitcaster',
            [REEL_TYPES.SPINCASTER]: 'Spincaster'
        };
        return names[this.reelType];
    }

    /**
     * Get info object for display
     * @returns {object} Reel information
     */
    getInfo() {
        return {
            type: this.getDisplayName(),
            dragSetting: this.dragSetting,
            dragForce: this.getCurrentDragForce().toFixed(1),
            lineTest: this.lineTestStrength,
            lineOut: Math.floor(this.lineOut),
            lineCapacity: this.lineCapacity,
            lineRemaining: Math.floor(this.lineCapacity - this.lineOut),
            gearRatio: this.getGearRatio()
        };
    }
}
