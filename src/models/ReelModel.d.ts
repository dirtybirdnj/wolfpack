export namespace REEL_TYPES {
    let BAITCASTER: string;
    let SPINCASTER: string;
}
export class ReelModel {
    reelType: string;
    lineTestStrength: number;
    lineCapacity: number;
    lineOut: number;
    dragSetting: number;
    maxDragLimit: number;
    properties: {
        [REEL_TYPES.BAITCASTER]: {
            gearRatio: number;
            dragPrecision: number;
            backlashRisk: number;
            maxDragLimit: number;
            lineCapacity: number;
            description: string;
        };
        [REEL_TYPES.SPINCASTER]: {
            gearRatio: number;
            dragPrecision: number;
            backlashRisk: number;
            maxDragLimit: number;
            lineCapacity: number;
            description: string;
        };
    };
    /**
     * Set the reel type
     * @param {string} reelType - One of REEL_TYPES
     */
    setReelType(reelType: string): void;
    /**
     * Update reel properties based on current reel type
     */
    updateReelProperties(): void;
    /**
     * Set line test strength (affects break threshold)
     * @param {number} testStrength - Line test in pounds (10, 15, 20, 30)
     */
    setLineTestStrength(testStrength: number): void;
    /**
     * Adjust drag setting by increment
     * @param {number} increment - Percentage to add/subtract (-10, +10)
     */
    adjustDrag(increment: number): void;
    /**
     * Set drag to specific percentage
     * @param {number} percentage - Drag setting 0-100
     */
    setDrag(percentage: number): void;
    /**
     * Get current drag force in pounds
     * @returns {number} Drag force in pounds
     */
    getCurrentDragForce(): number;
    /**
     * Get current reel properties
     * @returns {object} Current reel properties
     */
    getCurrentProperties(): object;
    /**
     * Get gear ratio (affects retrieve speed)
     * @returns {number} Gear ratio
     */
    getGearRatio(): number;
    /**
     * Get drag precision (affects drag consistency)
     * @returns {number} Drag precision multiplier (0.85 to 0.95)
     */
    getDragPrecision(): number;
    /**
     * Get backlash risk (for baitcasters)
     * @returns {number} Backlash risk probability (0.0 to 0.15)
     */
    getBacklashRisk(): number;
    /**
     * Check if line capacity exceeded
     * @returns {boolean} True if spool is empty
     */
    isSpoolEmpty(): boolean;
    /**
     * Add line going out (fish pulling)
     * @param {number} feet - Feet of line going out
     * @returns {boolean} True if spool emptied
     */
    addLineOut(feet: number): boolean;
    /**
     * Remove line coming in (reeling)
     * @param {number} feet - Feet of line being retrieved
     */
    retrieveLine(feet: number): void;
    /**
     * Reset line out to zero (new cast)
     */
    resetLineOut(): void;
    /**
     * Get line remaining as percentage
     * @returns {number} Percentage of line remaining (0-100)
     */
    getLineRemainingPercent(): number;
    /**
     * Get display name for current reel type
     * @returns {string} Display name
     */
    getDisplayName(): string;
    /**
     * Get info object for display
     * @returns {object} Reel information
     */
    getInfo(): object;
}
//# sourceMappingURL=ReelModel.d.ts.map