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
export declare class SpriteGenerator {
    /**
     * Generate all entity textures
     * @param scene - The scene to add textures to
     */
    static generateAllTextures(scene: Phaser.Scene): void;
    /**
     * Generate textures for all predator species
     * Only generates textures for species that are actually spawned as predators
     */
    static generatePredatorTextures(scene: Phaser.Scene): void;
    /**
     * Generate textures for all baitfish species
     */
    static generateBaitfishTextures(scene: Phaser.Scene): void;
    /**
     * Generate zooplankton texture
     */
    static generateZooplanktonTexture(scene: Phaser.Scene): void;
    /**
     * Generate crayfish texture
     */
    static generateCrayfishTexture(scene: Phaser.Scene): void;
    /**
     * Get fish dimensions based on size category
     */
    static getFishDimensions(size: FishSizeCategory): FishDimensions;
    /**
     * Draw a realistic fish shape on canvas context
     */
    static drawFishShape(ctx: CanvasRenderingContext2D, dimensions: FishDimensions, speciesData: any, size: FishSizeCategory): void;
    /**
     * Draw a simple baitfish shape (facing LEFT - head left, tail right)
     */
    static drawBaitfishShape(ctx: CanvasRenderingContext2D, width: number, height: number, speciesData: SpeciesColorData): void;
    /**
     * Convert hex color to CSS rgb string
     */
    static rgbToHex(hex: number): string;
}
export default SpriteGenerator;
//# sourceMappingURL=SpriteGenerator.d.ts.map