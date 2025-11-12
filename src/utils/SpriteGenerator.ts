import GameConfig from '../config/GameConfig.js';
import { PREDATOR_SPECIES, BAITFISH_SPECIES } from '../config/SpeciesData.js';
import { ORGANISMS } from '../config/OrganismData.js';

/**
 * Fish size category type
 */
export type FishSizeCategory = 'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'TROPHY';

/**
 * Fish dimensions interface
 */
export interface FishDimensions {
    width: number;
    height: number;
    bodyLength: number;
}

/**
 * Species data interface (from SpeciesData.js)
 */
export interface SpeciesColorData {
    color: number;
    [key: string]: any;
}

/**
 * SpriteGenerator - Procedurally generates sprite textures for entities
 *
 * Creates textures once at startup instead of drawing each frame
 * Reduces draw calls and enables sprite-based rendering
 */
export class SpriteGenerator {
    /**
     * Generate all entity textures
     * @param scene - The scene to add textures to
     */
    static generateAllTextures(scene: Phaser.Scene): void {
        // Generate predator fish textures
        this.generatePredatorTextures(scene);

        // Generate baitfish textures
        this.generateBaitfishTextures(scene);

        // Generate other entity textures
        this.generateZooplanktonTexture(scene);
        this.generateCrayfishTexture(scene);
    }

    /**
     * Generate textures for all predator species
     * Only generates textures for species that are actually spawned as predators
     */
    static generatePredatorTextures(scene: Phaser.Scene): void {
        // List of species that spawn as predators (from SpawningSystem.js line 119-129 + GameScene initial spawn)
        const predatorSpecies = ['lake_trout', 'northern_pike', 'smallmouth_bass', 'yellow_perch'];

        predatorSpecies.forEach(speciesName => {
            const speciesData = ORGANISMS[speciesName];
            if (!speciesData) {
                console.error(`❌ Missing species data for ${speciesName} in ORGANISMS`);
                return;
            }

            // Generate textures for different sizes
            (['TINY', 'SMALL', 'MEDIUM', 'LARGE', 'TROPHY'] as FishSizeCategory[]).forEach(size => {
                const textureKey = `fish_${speciesName}_${size}`;

                // Skip if already exists
                if (scene.textures.exists(textureKey)) {
                    return;
                }

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
    static generateBaitfishTextures(scene: Phaser.Scene): void {
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
    static generateZooplanktonTexture(scene: Phaser.Scene): void {
        const textureKey = 'zooplankton';
        if (scene.textures.exists(textureKey)) return;

        const texture = scene.textures.createCanvas(textureKey, 8, 8);
        const ctx = texture.getContext();

        // Larger, more visible zooplankton
        // Greenish-white dot with slight glow effect
        ctx.fillStyle = '#88ff88';
        ctx.fillRect(2, 2, 4, 4); // Main body

        // Brighter center
        ctx.fillStyle = '#ccffcc';
        ctx.fillRect(3, 3, 2, 2);

        texture.refresh();
    }

    /**
     * Generate crayfish texture
     */
    static generateCrayfishTexture(scene: Phaser.Scene): void {
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
    static getFishDimensions(size: FishSizeCategory): FishDimensions {
        const sizes: Record<FishSizeCategory, FishDimensions> = {
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
    static drawFishShape(
        ctx: CanvasRenderingContext2D,
        dimensions: FishDimensions,
        speciesData: any,
        size: FishSizeCategory
    ): void {
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
        // Body centered
        ctx.ellipse(bodyLength / 2, centerY, bodyLength / 2, height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw belly (lighter)
        ctx.fillStyle = bellyColor;
        ctx.beginPath();
        ctx.ellipse(bodyLength / 2, centerY + height / 6, bodyLength / 3, height / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw tail on RIGHT side
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
     * Draw a simple baitfish shape (facing LEFT - head on left, tail on right)
     */
    static drawBaitfishShape(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        speciesData: SpeciesColorData
    ): void {
        const color = this.rgbToHex(speciesData.color);
        const centerY = height / 2;

        // Simple oval body
        ctx.fillStyle = color;
        ctx.fillRect(0, centerY - height / 4, width - 2, height / 2);

        // Tail on RIGHT side
        ctx.fillRect(width - 2, centerY - height / 6, 2, height / 3);

        // Eye on LEFT (head) side
        ctx.fillStyle = '#000000';
        ctx.fillRect(1, centerY, 1, 1);
    }

    /**
     * Convert hex color to CSS rgb string
     */
    static rgbToHex(hex: number): string {
        const r = (hex >> 16) & 0xFF;
        const g = (hex >> 8) & 0xFF;
        const b = hex & 0xFF;
        return `rgb(${r}, ${g}, ${b})`;
    }
}

export default SpriteGenerator;
