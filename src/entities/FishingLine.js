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

    update(lure, hookedFish = null, manager = null) {
        this.graphics.clear();

        // Get line start position (always center of screen when fishing)
        const lineStartX = GameConfig.CANVAS_WIDTH / 2;
        // Get surface height from manager (ice or water)
        const surfaceY = manager ? (manager.iceHeight || manager.waterHeight || 0) : this.iceHoleY;

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

        // Only draw line if lure is below surface
        if (endY > surfaceY) {
            // Draw the fishing line with slight curve for realism
            const midX = (lineStartX + endX) / 2;
            const midY = (surfaceY + endY) / 2;
            const lineLength = Math.sqrt(
                Math.pow(endX - lineStartX, 2) +
                Math.pow(endY - surfaceY, 2)
            );

            // Sag amount based on line length (more length = more sag)
            const sagAmount = Math.min(lineLength * 0.05, 15);

            // Draw curved line using Phaser's path system
            const curve = new Phaser.Curves.QuadraticBezier(
                new Phaser.Math.Vector2(lineStartX, surfaceY),
                new Phaser.Math.Vector2(midX, midY + sagAmount),
                new Phaser.Math.Vector2(endX, endY)
            );

            this.graphics.lineStyle(this.lineWidth, this.lineColor, this.lineAlpha);
            curve.draw(this.graphics, 32); // 32 points for smooth curve
        }
    }

    destroy() {
        this.graphics.destroy();
    }
}

export default FishingLine;
