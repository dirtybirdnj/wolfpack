import ZooplanktonModel from '../models/zooplankton.js';

/**
 * Zooplankton Entity - Phaser wrapper for Zooplankton model
 * Handles graphics rendering while delegating game logic to the model
 */
export class Zooplankton {
    constructor(scene, worldX, y) {
        // Create the model (contains all game logic and biological properties)
        this.model = new ZooplanktonModel(scene, worldX, y);

        // Phaser-specific properties
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(5); // Render above background, below fish (depth 10)
    }

    // Delegate all properties to the model
    get worldX() { return this.model.worldX; }
    get x() { return this.model.x; }
    get y() { return this.model.y; }
    get depth() { return this.model.depth; }
    get size() { return this.model.size; }
    get speed() { return this.model.speed; }
    get consumed() { return this.model.consumed; }
    get visible() { return this.model.visible; }
    get age() { return this.model.age; }
    get hue() { return this.model.hue; }

    update() {
        // Delegate to model for all game logic
        this.model.update();
    }

    /**
     * Mark as consumed by a baitfish
     */
    consume() {
        this.model.consume();
    }

    /**
     * Get position
     */
    getPosition() {
        return this.model.getPosition();
    }

    /**
     * Check if within range of a position
     */
    isWithinRange(x, y, range) {
        return this.model.isWithinRange(x, y, range);
    }

    /**
     * Render the zooplankton using Phaser graphics
     */
    render() {
        this.graphics.clear();

        if (!this.model.visible || this.model.consumed) {
            return;
        }

        // Delegate rendering to model
        this.model.render(this.graphics);
    }

    /**
     * Destroy Phaser graphics object
     */
    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
        }
    }

    /**
     * Get debug info
     */
    getInfo() {
        return this.model.getInfo();
    }
}

export default Zooplankton;
