import GameConfig from '../config/GameConfig.js';

/**
 * Fishing line that connects ice hole to lure/hooked fish
 */
export class FishingLine {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(10); // Below lure but above most things

        // Line properties (defaults)
        this.lineColor = 0x00ff00; // Default: neon green braid
        this.lineWidth = 1;
        this.lineAlpha = 0.8; // Braid is more visible
        this.lineType = 'braid';

        // Line starts from top of screen (surface)
        this.surfaceY = 0; // Top of screen
    }

    setLineType(type, braidColor = 'neon-green') {
        /**
         * Set the fishing line type and color
         * @param {string} type - 'braid', 'monofilament', or 'fluorocarbon'
         * @param {string} braidColor - Only used if type is 'braid'
         */
        this.lineType = type;

        if (type === 'braid') {
            // Braided line - high visibility colors
            const braidColors = {
                'neon-green': 0x00ff00,
                'yellow': 0xffff00,
                'moss-green': 0x4a7c59,
                'white': 0xffffff
            };
            this.lineColor = braidColors[braidColor] || 0x00ff00;
            this.lineAlpha = 0.8; // Very visible
            this.lineWidth = 1.5; // Slightly thicker
        } else if (type === 'monofilament') {
            // Monofilament - nearly invisible
            this.lineColor = 0xaaaaaa; // Light gray
            this.lineAlpha = 0.3; // Low visibility
            this.lineWidth = 1;
        } else if (type === 'fluorocarbon') {
            // Fluorocarbon - clear/invisible underwater
            this.lineColor = 0xcccccc; // Very light gray
            this.lineAlpha = 0.2; // Lowest visibility
            this.lineWidth = 1;
        }
    }

    update(lure, hookedFish = null) {
        this.graphics.clear();

        // Get line start position (always center of screen when fishing)
        const lineStartX = GameConfig.CANVAS_WIDTH / 2;
        // Line always starts from top of screen (no ice hole visible)
        const surfaceY = 0;

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

        // Only draw line if lure has dropped below the top of screen
        if (endY > 0) {
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
