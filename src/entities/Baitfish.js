import BaitfishModel from '../models/baitfish.js';

/**
 * Baitfish Entity - Phaser wrapper for Baitfish model
 * Handles graphics rendering and sonar trails while delegating game logic to the model
 *
 * Performance optimized for many baitfish on screen:
 * - Uses lightweight model (no FishAI)
 * - Flocking behavior instead of complex AI
 * - Minimal overhead for each instance
 */
export class Baitfish {
    constructor(scene, worldX, y, cloudId, speciesType = 'alewife') {
        // Create the model (contains all game logic and biological properties)
        this.model = new BaitfishModel(scene, worldX, y, cloudId, speciesType);

        // Phaser-specific properties
        this.graphics = scene.add.graphics();
        this.sonarTrail = [];
        this.maxTrailLength = 15;
    }

    // Delegate all properties to the model
    get worldX() { return this.model.worldX; }
    get x() { return this.model.x; }
    get y() { return this.model.y; }
    get depth() { return this.model.depth; }
    get size() { return this.model.size; }
    get length() { return this.model.length; }
    get speed() { return this.model.speed; }
    get species() { return this.model.species; }
    get speciesData() { return this.model.speciesData; }
    get consumed() { return this.model.consumed; }
    get visible() { return this.model.visible; }
    get age() { return this.model.age; }
    get panicMode() { return this.model.panicMode; }
    get cloudId() { return this.model.cloudId; }
    set cloudId(value) { this.model.cloudId = value; }
    get velocityX() { return this.model.velocityX; }
    get velocityY() { return this.model.velocityY; }
    get currentTarget() { return this.model.currentTarget; }

    /**
     * Update baitfish position and behavior
     */
    update(cloudCenter, lakersNearby = false, spreadMultiplier = 1.0, scaredLevel = 0, nearbyZooplankton = [], otherBaitfish = []) {
        if (this.consumed || !this.visible) {
            return;
        }

        // Delegate to model for all game logic
        // Map entity baitfish to model baitfish for flocking calculations
        const modelBaitfish = otherBaitfish.map(bf => bf.model);
        this.model.update(cloudCenter, lakersNearby, spreadMultiplier, scaredLevel, nearbyZooplankton, modelBaitfish);

        // Update sonar trail (Phaser-specific)
        this.updateSonarTrail();

        // Render
        this.render();
    }

    /**
     * Update sonar trail (Phaser-specific effect)
     */
    updateSonarTrail() {
        // Add current position to trail
        this.sonarTrail.push({
            x: this.model.x,
            y: this.model.y,
            age: 0
        });

        // Age trail points and remove old ones
        this.sonarTrail = this.sonarTrail.filter(point => {
            point.age++;
            return point.age < this.maxTrailLength;
        });
    }

    /**
     * Render the baitfish using Phaser graphics
     */
    render() {
        this.graphics.clear();

        if (!this.model.visible || this.model.consumed) {
            return;
        }

        // Delegate rendering to model
        this.model.render(this.graphics, this.sonarTrail);
    }

    /**
     * Mark as consumed by a predator
     */
    consume() {
        this.model.consume();
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

export default Baitfish;
