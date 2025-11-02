import CrayfishModel from '../models/crayfish.js';

/**
 * Crayfish Entity - Phaser wrapper for Crayfish model
 * Handles graphics rendering while delegating game logic to the model
 *
 * Crayfish are bottom-dwelling invertebrates that:
 * - Hunt zooplankton
 * - Escape predators with backward zoom bursts
 * - Are preferred prey for smallmouth bass
 */
export class Crayfish {
    constructor(scene, worldX, y) {
        // Create the model (contains all game logic and biological properties)
        this.model = new CrayfishModel(scene, worldX, y);

        // Phaser-specific properties
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(6); // Render above zooplankton (5), below fish (10)
    }

    // Delegate all properties to the model
    get worldX() { return this.model.worldX; }
    get x() { return this.model.x; }
    get y() { return this.model.y; }
    get depth() { return this.model.depth; }
    get size() { return this.model.size; }
    get length() { return this.model.length; }
    get speed() { return this.model.speed; }
    get consumed() { return this.model.consumed; }
    get visible() { return this.model.visible; }
    get age() { return this.model.age; }
    get hue() { return this.model.hue; }
    get currentTarget() { return this.model.currentTarget; }
    get burstState() { return this.model.burstState; }
    get threatened() { return this.model.threatened; }

    /**
     * Update crayfish position and behavior
     */
    update(nearbyZooplankton = [], predatorsNearby = false) {
        // Delegate to model for all game logic
        this.model.update(nearbyZooplankton, predatorsNearby);

        // Render
        this.render();
    }

    /**
     * Render the crayfish using Phaser graphics
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
     * Mark as consumed by a predator
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

export default Crayfish;
