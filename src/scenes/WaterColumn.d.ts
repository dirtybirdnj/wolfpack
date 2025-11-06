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
export default class WaterColumn {
    init(data: any): void;
    depthConverter: any;
    maxDepth: any;
    create(): void;
    canvasWidth: any;
    canvasHeight: any;
    backgroundRT: any;
    graphics: any;
    bottomProfile: {
        x: number;
        y: any;
        type: string;
    }[] | undefined;
    thermoclines: {
        depth: number;
        strength: number;
    }[] | undefined;
    depthTexts: any[] | undefined;
    update(time: any, delta: any): void;
    /**
     * Generate a realistic lakebed profile
     */
    generateBottomProfile(): {
        x: number;
        y: any;
        type: string;
    }[];
    /**
     * Render static background elements to RenderTexture
     */
    renderStaticBackground(): void;
    /**
     * Draw water gradient (light at surface → dark at depth)
     */
    drawBackgroundGradient(graphics: any): void;
    /**
     * Draw lake floor profile
     */
    drawBottomProfile(graphics: any): void;
    /**
     * Draw thermoclines (temperature layers) - animated
     */
    drawThermoclines(): void;
    /**
     * Draw ice surface - animated
     */
    drawSurfaceLine(): void;
    /**
     * Create depth marker texts
     */
    createDepthMarkers(): void;
    /**
     * Handle canvas resize
     */
    handleResize(gameSize: any): void;
    /**
     * Clean up
     */
    shutdown(): void;
}
//# sourceMappingURL=WaterColumn.d.ts.map