import GameConfig from '../config/GameConfig.js';

/**
 * Fishing line that connects ice hole to lure/hooked fish
 */
export class FishingLine {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(10); // Below lure but above most things

        // Line properties
        this.lineColor = 0x888888; // Gray fishing line
        this.lineWidth = 1;
        this.lineAlpha = 0.6;

        // Ice hole position (where line starts)
        this.iceHoleY = 54; // Ice surface height
    }

    update(lure, hookedFish = null, iceHoleManager = null) {
        this.graphics.clear();

        // Get ice hole X position (always center of screen when fishing)
        const iceHoleX = GameConfig.CANVAS_WIDTH / 2;

        // Determine where the line ends
        let endX, endY;

        if (hookedFish && hookedFish.caught) {
            // Line attaches to front/face of hooked fish
            // Determine fish facing direction based on its movement
            const movement = hookedFish.ai.getMovementVector();
            const isMovingRight = movement.x >= 0;

            // Calculate body size (same as render method)
            const bodySize = Math.max(8, hookedFish.weight / 2);

            // Attach to front of fish (face side)
            const faceOffsetX = isMovingRight ? bodySize * 1.3 : -bodySize * 1.3;
            endX = hookedFish.x + faceOffsetX;
            endY = hookedFish.y;
        } else {
            // Line goes to lure
            endX = lure.x;
            endY = lure.y;
        }

        // Only draw line if lure is below ice surface
        if (endY > this.iceHoleY) {
            // Draw the fishing line
            this.graphics.lineStyle(this.lineWidth, this.lineColor, this.lineAlpha);
            this.graphics.lineBetween(iceHoleX, this.iceHoleY, endX, endY);

            // Add slight curve/sag to the line for realism
            // Calculate midpoint with sag
            const midX = (iceHoleX + endX) / 2;
            const midY = (this.iceHoleY + endY) / 2;
            const lineLength = Math.sqrt(
                Math.pow(endX - iceHoleX, 2) +
                Math.pow(endY - this.iceHoleY, 2)
            );

            // Sag amount based on line length (more length = more sag)
            const sagAmount = Math.min(lineLength * 0.05, 15);

            // Draw curved line using quadratic curve
            this.graphics.beginPath();
            this.graphics.moveTo(iceHoleX, this.iceHoleY);
            this.graphics.quadraticCurveTo(midX, midY + sagAmount, endX, endY);
            this.graphics.strokePath();
        }
    }

    destroy() {
        this.graphics.destroy();
    }
}

export default FishingLine;
