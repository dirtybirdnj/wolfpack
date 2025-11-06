import GameConfig from '../../config/GameConfig.js';
/**
 * DebugSystem - Handles debug visualization and developer tools
 *
 * @module scenes/systems/DebugSystem
 *
 * Responsibilities:
 * - Draw detection ranges around lure
 * - Visualize fish states and behavior
 * - Show connection lines between fish and lure
 * - Display fish AI state colors
 * - Render debug graphics overlay
 *
 * COMMON TASKS:
 * - Add new debug visualizations → render() method
 * - Change debug colors → stateColors constant
 * - Toggle debug elements → this.enabled boolean
 *
 * @example
 * const debugSystem = new DebugSystem(scene);
 * debugSystem.setEnabled(true);
 * debugSystem.update(time, delta);
 */
export class DebugSystem {
    /**
     * @param scene - The game scene
     */
    constructor(scene) {
        this.scene = scene;
        this.debugGraphics = null;
        this.enabled = false;
    }
    /**
     * Enable or disable debug visualization
     * @param enabled - True to enable debug mode
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled && this.debugGraphics) {
            this.debugGraphics.clear();
        }
    }
    /**
     * Toggle debug mode on/off
     * @returns New debug mode state
     */
    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }
    /**
     * Create debug graphics object if needed
     */
    ensureGraphics() {
        if (!this.debugGraphics) {
            this.debugGraphics = this.scene.add.graphics();
            this.debugGraphics.setDepth(1000);
        }
    }
    /**
     * Render all debug information
     */
    render() {
        if (!this.enabled) {
            if (this.debugGraphics) {
                this.debugGraphics.clear();
            }
            return;
        }
        this.ensureGraphics();
        this.debugGraphics.clear();
        // Draw lure detection ranges (only if lure exists - not in nature simulation mode)
        if (this.scene.lure) {
            // Draw detection range around lure
            this.debugGraphics.lineStyle(2, 0xffff00, 0.3);
            this.debugGraphics.strokeCircle(this.scene.lure.x, this.scene.lure.y, GameConfig.DETECTION_RANGE);
            // Draw strike distance around lure
            this.debugGraphics.lineStyle(2, 0xff0000, 0.5);
            this.debugGraphics.strokeCircle(this.scene.lure.x, this.scene.lure.y, GameConfig.STRIKE_DISTANCE);
        }
        // Draw fish debug info
        this.renderFishDebug();
    }
    /**
     * Render debug information for all fish
     */
    renderFishDebug() {
        // Fish state color mapping
        const stateColors = {
            'IDLE': 0x888888,
            'INTERESTED': 0xffff00,
            'CHASING': 0xff8800,
            'STRIKING': 0xff0000,
            'FLEEING': 0x8888ff,
            'HUNTING_BAITFISH': 0x00ff88,
            'FEEDING': 0x88ff00
        };
        const fishes = this.scene.fishes;
        fishes.forEach(fish => {
            // Defensive check: Only Fish objects have AI - skip if not a fish
            if (!fish.ai || typeof fish.hunger === 'undefined') {
                return; // Skip non-fish entities
            }
            // Draw line from fish to lure if lure exists and within detection range
            if (this.scene.lure) {
                const dist = Math.sqrt(Math.pow(fish.x - this.scene.lure.x, 2) +
                    Math.pow(fish.y - this.scene.lure.y, 2));
                if (dist < GameConfig.DETECTION_RANGE * 2) {
                    this.debugGraphics.lineStyle(1, 0x00ffff, 0.3);
                    this.debugGraphics.lineBetween(fish.x, fish.y, this.scene.lure.x, this.scene.lure.y);
                }
            }
            // Draw fish state indicator
            const color = stateColors[fish.ai.state] || 0xffffff;
            this.debugGraphics.fillStyle(color, 0.3);
            this.debugGraphics.fillCircle(fish.x, fish.y, 15);
            // Draw fish detection circle
            this.debugGraphics.lineStyle(1, color, 0.2);
            this.debugGraphics.strokeCircle(fish.x, fish.y, GameConfig.DETECTION_RANGE);
            // Draw fish info text
            this.drawFishInfo(fish, color);
        });
    }
    /**
     * Draw debug text for a fish
     * @param fish - The fish to draw info for
     * @param color - Color for the text
     */
    drawFishInfo(fish, color) {
        // Defensive check: Only Fish objects have AI and hunger - skip if not a fish
        if (!fish.ai || typeof fish.hunger === 'undefined') {
            return; // Not a fish, skip debug info
        }
        // In nature simulation mode (no lure), show info for all visible fish
        // In normal modes, only show info for fish within reasonable distance of lure
        let showInfo = true;
        if (this.scene.lure) {
            const dist = Math.sqrt(Math.pow(fish.x - this.scene.lure.x, 2) +
                Math.pow(fish.y - this.scene.lure.y, 2));
            if (dist > GameConfig.DETECTION_RANGE * 3) {
                showInfo = false; // Too far away from lure
            }
        }
        if (!showInfo)
            return;
        // Create temporary text object for this frame
        const info = fish.getInfo();
        const debugText = this.scene.add.text(fish.x + 20, fish.y - 20, `${fish.ai.state}\n${info.weight}\nH:${Math.floor(fish.hunger)}`, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#' + color.toString(16).padStart(6, '0'),
            backgroundColor: '#000000',
            padding: { x: 2, y: 2 }
        });
        debugText.setDepth(1001);
        // Auto-destroy after one frame
        this.scene.time.delayedCall(16, () => debugText.destroy());
    }
    /**
     * Update debug system each frame
     * @param time - Current game time
     * @param delta - Time since last frame
     */
    update(time, delta) {
        if (this.enabled) {
            this.render();
        }
    }
    /**
     * Clean up debug system
     */
    destroy() {
        if (this.debugGraphics) {
            this.debugGraphics.destroy();
            this.debugGraphics = null;
        }
    }
}
export default DebugSystem;
//# sourceMappingURL=DebugSystem.js.map