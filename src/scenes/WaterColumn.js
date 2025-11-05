import GameConfig from '../config/GameConfig.js';
import DepthConverter from '../utils/DepthConverter.js';

/**
 * WaterColumn - Represents the vertical slice of water from surface to lake floor
 *
 * This scene renders the water environment including:
 * - Water gradient (light at surface, dark at depth)
 * - Ice surface at top
 * - Lake floor at bottom
 * - Temperature layers (thermoclines)
 * - Depth markers
 *
 * Fish, baitfish, and other aquatic life render within this water column.
 */
export default class WaterColumn extends Phaser.Scene {
    constructor() {
        super({ key: 'WaterColumn' });
    }

    init(data) {
        // Receive shared depth converter from GameScene
        this.depthConverter = data.depthConverter;
        this.maxDepth = data.maxDepth || GameConfig.MAX_DEPTH;
    }

    create() {
        console.log('🌊 WaterColumn scene created');

        // Cache dimensions
        this.canvasWidth = this.scale.width;
        this.canvasHeight = this.scale.height;

        // RenderTexture for static background elements (rendered once, reused every frame)
        this.backgroundRT = this.add.renderTexture(0, 0, this.canvasWidth, this.canvasHeight);
        this.backgroundRT.setOrigin(0, 0);
        this.backgroundRT.setDepth(0);

        // Graphics for dynamic elements (thermoclines, animations)
        this.graphics = this.add.graphics();
        this.graphics.setDepth(1);

        // Generate lake bottom profile
        this.bottomProfile = this.generateBottomProfile();

        // Temperature layers (thermoclines)
        this.thermoclines = [
            { depth: 25, strength: 0.3 },
            { depth: 45, strength: 0.5 },
            { depth: 85, strength: 0.2 }
        ];

        // Create depth marker texts
        this.depthTexts = [];
        this.createDepthMarkers();

        // Render static background once
        this.renderStaticBackground();

        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);
    }

    update(time, delta) {
        // Clear dynamic graphics layer
        this.graphics.clear();

        // Draw dynamic elements
        this.drawThermoclines();
        this.drawSurfaceLine();
    }

    /**
     * Generate a realistic lakebed profile
     */
    generateBottomProfile() {
        const profile = [];
        const baseBottomY = this.depthConverter.waterFloorY;
        let yOffset = 0;

        for (let x = 0; x < this.canvasWidth + 200; x += 20) {
            // Add variation to simulate rocks, drop-offs
            yOffset += (Math.random() - 0.5) * 2;
            yOffset = Math.max(-10, Math.min(10, yOffset));

            const bottomY = baseBottomY + yOffset;

            // Occasional structure (rocks, logs)
            if (Math.random() < 0.1) {
                profile.push({ x: x, y: bottomY, type: 'structure' });
            } else {
                profile.push({ x: x, y: bottomY, type: 'normal' });
            }
        }

        return profile;
    }

    /**
     * Render static background elements to RenderTexture
     */
    renderStaticBackground() {
        const tempGraphics = this.add.graphics();

        this.drawBackgroundGradient(tempGraphics);
        this.drawBottomProfile(tempGraphics);

        // Render to texture
        this.backgroundRT.clear();
        this.backgroundRT.draw(tempGraphics);

        tempGraphics.destroy();

        console.log('🎨 WaterColumn: Static background rendered');
    }

    /**
     * Draw water gradient (light at surface → dark at depth)
     */
    drawBackgroundGradient(graphics) {
        // Realistic olive/army green water gradient
        // Surface: lighter green
        // Deep: darker olive-green

        for (let y = 0; y < this.canvasHeight; y += 10) {
            const depthRatio = y / this.canvasHeight;

            // Surface: #5a6f4a (90, 111, 74)
            // Deep: #3a4f3a (58, 79, 58)
            const r = Math.floor(90 - (90 - 58) * depthRatio);
            const g = Math.floor(111 - (111 - 79) * depthRatio);
            const b = Math.floor(74 - (74 - 58) * depthRatio);

            const color = (r << 16) | (g << 8) | b;
            graphics.fillStyle(color, 1.0);
            graphics.fillRect(0, y, this.canvasWidth, 50);
        }
    }

    /**
     * Draw lake floor profile
     */
    drawBottomProfile(graphics) {
        // Draw lakebed contour line
        graphics.lineStyle(2, 0x444444, 0.8);
        graphics.beginPath();

        if (this.bottomProfile.length > 0) {
            graphics.moveTo(this.bottomProfile[0].x, this.bottomProfile[0].y);

            for (let i = 1; i < this.bottomProfile.length; i++) {
                const point = this.bottomProfile[i];
                graphics.lineTo(point.x, point.y);

                // Draw structure markers
                if (point.type === 'structure') {
                    graphics.fillStyle(0x666666, 0.5);
                    graphics.fillRect(point.x - 5, point.y - 10, 10, 10);
                }
            }
        }

        graphics.strokePath();

        // Fill below bottom with solid ground
        graphics.fillStyle(0x8b7355, 1.0); // Brown earth
        if (this.bottomProfile.length > 0) {
            graphics.beginPath();
            graphics.moveTo(this.bottomProfile[0].x, this.bottomProfile[0].y);

            for (let i = 1; i < this.bottomProfile.length; i++) {
                graphics.lineTo(this.bottomProfile[i].x, this.bottomProfile[i].y);
            }

            graphics.lineTo(this.canvasWidth, this.canvasHeight);
            graphics.lineTo(0, this.canvasHeight);
            graphics.closePath();
            graphics.fillPath();
        }
    }

    /**
     * Draw thermoclines (temperature layers) - animated
     */
    drawThermoclines() {
        this.thermoclines.forEach(layer => {
            const y = this.depthConverter.depthToY(layer.depth);
            this.graphics.lineStyle(1, 0x0099ff, layer.strength * 0.3);

            // Wavy line
            this.graphics.beginPath();
            this.graphics.moveTo(0, y);
            for (let x = 0; x < this.canvasWidth; x += 10) {
                const wave = Math.sin((x + this.time.now * 0.001) * 0.02) * 3;
                this.graphics.lineTo(x, y + wave);
            }
            this.graphics.strokePath();
        });
    }

    /**
     * Draw ice surface - animated
     */
    drawSurfaceLine() {
        const surfaceY = this.depthConverter.surfaceY;

        // Water line
        this.graphics.lineStyle(2, 0x000000, 1.0);
        this.graphics.lineBetween(0, surfaceY, this.canvasWidth, surfaceY);

        // Thick white ice line
        this.graphics.lineStyle(6, 0xffffff, 0.8);
        this.graphics.lineBetween(0, surfaceY, this.canvasWidth, surfaceY);

        // Ice texture with animated waves
        this.graphics.lineStyle(2, GameConfig.COLOR_SURFACE, 0.5);
        this.graphics.beginPath();
        this.graphics.moveTo(0, surfaceY + 2);

        for (let x = 0; x < this.canvasWidth; x += 5) {
            const wave = Math.sin((x + this.time.now * 0.002) * 0.01) * 2;
            this.graphics.lineTo(x, surfaceY + wave + 2);
        }

        this.graphics.strokePath();
    }

    /**
     * Create depth marker texts
     */
    createDepthMarkers() {
        const textStyle = {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#00ff00'
        };

        // Create markers at 25ft intervals
        for (let depth = 0; depth <= this.maxDepth; depth += 25) {
            const y = this.depthConverter.depthToY(depth);
            if (y <= this.depthConverter.waterFloorY - 10) {
                const text = this.add.text(5, y - 6, depth + 'ft', textStyle);
                text.setAlpha(0.7);
                text.setDepth(100);
                this.depthTexts.push(text);
            }
        }
    }

    /**
     * Handle canvas resize
     */
    handleResize(gameSize) {
        console.log('🌊 WaterColumn resize:', gameSize.width, 'x', gameSize.height);

        this.canvasWidth = gameSize.width;
        this.canvasHeight = gameSize.height;

        // Update depth converter
        this.depthConverter.resize(this.canvasHeight, this.maxDepth);

        // Resize RenderTexture
        this.backgroundRT.setSize(this.canvasWidth, this.canvasHeight);

        // Regenerate bottom profile
        this.bottomProfile = this.generateBottomProfile();

        // Recreate depth markers
        this.depthTexts.forEach(text => text.destroy());
        this.depthTexts = [];
        this.createDepthMarkers();

        // Re-render static background
        this.renderStaticBackground();
    }

    /**
     * Clean up
     */
    shutdown() {
        this.scale.off('resize', this.handleResize, this);

        this.graphics.destroy();
        this.backgroundRT.destroy();

        this.depthTexts.forEach(text => text.destroy());
        this.depthTexts = [];
    }
}
