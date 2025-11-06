export class SonarDisplay {
    constructor(scene: any);
    scene: any;
    canvasWidth: any;
    canvasHeight: any;
    backgroundRT: any;
    graphics: any;
    gridOffset: number;
    scanLineX: number;
    cachedMaxDepth: number;
    cachedDepthScale: number;
    noiseParticles: any[];
    bottomProfile: {
        x: number;
        y: number;
        type: string;
    }[];
    thermoclines: {
        depth: number;
        strength: number;
    }[];
    depthTexts: any[];
    debugBoundaryOffsets: {
        baitfishMin: number;
        baitfishCloudMin: number;
        fishMin: number;
        fishMax: number;
    };
    dragState: {
        active: boolean;
        boundaryKey: null;
        startY: number;
        startOffset: number;
    };
    getActualMaxDepth(): any;
    getDepthScale(): number;
    initNoiseParticles(): void;
    generateBottomProfile(): {
        x: number;
        y: number;
        type: string;
    }[];
    /**
     * Render static background elements to RenderTexture (called once, and on resize)
     * This includes: gradient, depth grid, bottom profile
     */
    renderStaticBackground(): void;
    update(): void;
    updateNoiseParticles(): void;
    render(): void;
    drawBackgroundGradient(graphics: any): void;
    drawDepthGrid(graphics: any): void;
    drawThermoclines(graphics: any): void;
    drawBottomProfile(graphics: any): void;
    drawScanLine(): void;
    drawNoise(): void;
    createDepthMarkers(): void;
    drawDepthMarkers(): void;
    drawSurfaceLine(graphics: any): void;
    drawSpeciesLegend(graphics: any): void;
    /**
     * Handle pointer down on a debug boundary line
     */
    handleBoundaryPointerDown(boundaryKey: any, pointer: any): void;
    /**
     * Handle pointer move for dragging debug boundaries
     */
    handleBoundaryPointerMove(pointer: any): void;
    /**
     * Handle pointer up to stop dragging
     */
    handleBoundaryPointerUp(): void;
    /**
     * Create an interactive zone for a debug boundary line
     */
    createInteractiveZone(boundaryKey: any, y: any, color: any): any;
    interactiveZones: any[] | undefined;
    drawDebugBoundaries(graphics: any): void;
    pointerMoveHandler: ((pointer: any) => void) | null | undefined;
    pointerUpHandler: (() => void) | null | undefined;
    handleResize(gameSize: any): void;
    destroy(): void;
}
export default SonarDisplay;
//# sourceMappingURL=SonarDisplay.d.ts.map