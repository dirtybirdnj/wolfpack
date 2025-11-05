import GameConfig from '../config/GameConfig.js';
import { PREDATOR_SPECIES, BAITFISH_SPECIES } from '../config/SpeciesData.js';

/**
 * SpriteGenerator - Procedurally generates sprite textures for entities
 *
 * Creates textures once at startup instead of drawing each frame
 * Reduces draw calls and enables sprite-based rendering
 */
export class SpriteGenerator {
    /**
     * Generate all entity textures
     * @param {Phaser.Scene} scene - The scene to add textures to
     */
    static generateAllTextures(scene) {
        console.log('🎨 Generating sprite textures...');

        // Generate predator fish textures
        this.generatePredatorTextures(scene);

        // Generate baitfish textures
        this.generateBaitfishTextures(scene);

        // Generate other entity textures
        this.generateZooplanktonTexture(scene);
        this.generateCrayfishTexture(scene);

        console.log('✅ All sprite textures generated');
    }

    /**
     * Generate textures for all predator species
     */
    static generatePredatorTextures(scene) {
        const species = ['lake_trout', 'northern_pike', 'smallmouth_bass', 'yellow_perch'];

        species.forEach(speciesName => {
            const speciesData = PREDATOR_SPECIES[speciesName];
            if (!speciesData) return;

            // Generate textures for different sizes
            ['TINY', 'SMALL', 'MEDIUM', 'LARGE', 'TROPHY'].forEach(size => {
                const textureKey = `fish_${speciesName}_${size}`;

                // Skip if already exists
                if (scene.textures.exists(textureKey)) return;

                // Determine dimensions based on size
                const dimensions = this.getFishDimensions(size);

                // Create texture
                const texture = scene.textures.createCanvas(
                    textureKey,
                    dimensions.width,
                    dimensions.height
                );

                const ctx = texture.getContext();

                // Draw fish shape
                this.drawFishShape(ctx, dimensions, speciesData, size);

                texture.refresh();
            });
        });
    }

    /**
     * Generate textures for all baitfish species
     */
    static generateBaitfishTextures(scene) {
        const species = ['alewife', 'rainbow_smelt', 'yellow_perch', 'sculpin', 'cisco'];

        species.forEach(speciesName => {
            const speciesData = BAITFISH_SPECIES[speciesName];
            if (!speciesData) return;

            const textureKey = `baitfish_${speciesName}`;

            // Skip if already exists
            if (scene.textures.exists(textureKey)) return;

            // Baitfish are small
            const width = 8;
            const height = 4;

            const texture = scene.textures.createCanvas(textureKey, width, height);
            const ctx = texture.getContext();

            // Draw simple baitfish shape
            this.drawBaitfishShape(ctx, width, height, speciesData);

            texture.refresh();
        });
    }

    /**
     * Generate zooplankton texture
     */
    static generateZooplanktonTexture(scene) {
        const textureKey = 'zooplankton';
        if (scene.textures.exists(textureKey)) return;

        const texture = scene.textures.createCanvas(textureKey, 3, 3);
        const ctx = texture.getContext();

        // Simple dot
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(1, 1, 1, 1);

        texture.refresh();
    }

    /**
     * Generate crayfish texture
     */
    static generateCrayfishTexture(scene) {
        const textureKey = 'crayfish';
        if (scene.textures.exists(textureKey)) return;

        const texture = scene.textures.createCanvas(textureKey, 10, 6);
        const ctx = texture.getContext();

        // Crayfish shape - simple brown oval with claws
        ctx.fillStyle = '#8B4513';

        // Body
        ctx.fillRect(2, 1, 6, 4);

        // Claws
        ctx.fillRect(0, 1, 2, 2);
        ctx.fillRect(0, 3, 2, 2);

        texture.refresh();
    }

    /**
     * Get fish dimensions based on size category
     */
    static getFishDimensions(size) {
        const sizes = {
            'TINY': { width: 10, height: 6, bodyLength: 8 },
            'SMALL': { width: 16, height: 8, bodyLength: 12 },
            'MEDIUM': { width: 24, height: 12, bodyLength: 18 },
            'LARGE': { width: 32, height: 16, bodyLength: 24 },
            'TROPHY': { width: 40, height: 20, bodyLength: 30 }
        };
        return sizes[size] || sizes['MEDIUM'];
    }

    /**
     * Draw a realistic fish shape on canvas context
     */
    static drawFishShape(ctx, dimensions, speciesData, size) {
        const { width, height, bodyLength } = dimensions;
        const centerY = height / 2;

        // Lake trout colors from config (realistic)
        const bodyColor = this.rgbToHex(GameConfig.COLOR_FISH_BODY);
        const bellyColor = this.rgbToHex(GameConfig.COLOR_FISH_BELLY);
        const finColor = this.rgbToHex(GameConfig.COLOR_FISH_FINS);
        const spotColor = this.rgbToHex(GameConfig.COLOR_FISH_SPOTS);

        // Draw body (fish facing LEFT - head on left, tail on right)
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        // Body centered, tail will extend to the right
        ctx.ellipse(bodyLength / 2, centerY, bodyLength / 2, height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw belly (lighter)
        ctx.fillStyle = bellyColor;
        ctx.beginPath();
        ctx.ellipse(bodyLength / 2, centerY + height / 6, bodyLength / 3, height / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw tail on RIGHT side (extends from body end to width)
        ctx.fillStyle = finColor;
        ctx.beginPath();
        ctx.moveTo(bodyLength, centerY);
        ctx.lineTo(width, centerY - height / 4);
        ctx.lineTo(width, centerY + height / 4);
        ctx.closePath();
        ctx.fill();

        // Draw dorsal fin
        ctx.fillStyle = finColor;
        ctx.beginPath();
        ctx.moveTo(bodyLength / 3, centerY - height / 3);
        ctx.lineTo(bodyLength / 2, centerY - height / 2);
        ctx.lineTo(bodyLength * 2 / 3, centerY - height / 3);
        ctx.closePath();
        ctx.fill();

        // Draw spots (lake trout characteristic)
        if (size !== 'TINY') {
            ctx.fillStyle = spotColor;
            const spotCount = size === 'TROPHY' ? 6 : size === 'LARGE' ? 4 : 3;
            for (let i = 0; i < spotCount; i++) {
                const x = bodyLength / 4 + (i * bodyLength / spotCount);
                const y = centerY - height / 6 + (Math.random() * height / 3);
                ctx.fillRect(x, y, 1, 1);
            }
        }

        // Draw eye on LEFT (head) side
        ctx.fillStyle = '#000000';
        ctx.fillRect(2, centerY - 1, 2, 2);
    }

    /**
     * Draw a simple baitfish shape (facing LEFT - head left, tail right)
     */
    static drawBaitfishShape(ctx, width, height, speciesData) {
        const color = this.rgbToHex(speciesData.color);
        const centerY = height / 2;

        // Simple oval body
        ctx.fillStyle = color;
        ctx.fillRect(2, centerY - height / 4, width - 2, height / 2);

        // Tail on RIGHT side
        ctx.fillRect(0, centerY - height / 6, 2, height / 3);

        // Eye on LEFT (head) side
        ctx.fillStyle = '#000000';
        ctx.fillRect(width - 2, centerY, 1, 1);
    }

    /**
     * Convert hex color to CSS rgb string
     */
    static rgbToHex(hex) {
        const r = (hex >> 16) & 0xFF;
        const g = (hex >> 8) & 0xFF;
        const b = hex & 0xFF;
        return `rgb(${r}, ${g}, ${b})`;
    }
}

export default SpriteGenerator;
