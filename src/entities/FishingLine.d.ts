/**
 * Fishing line that connects ice hole to lure/hooked fish
 */
export class FishingLine {
    constructor(scene: any);
    scene: any;
    graphics: any;
    lineColor: number;
    lineWidth: number;
    lineAlpha: number;
    lineType: string;
    surfaceY: number;
    setLineType(type: any, braidColor?: string): void;
    update(lure: any, hookedFish?: null): void;
    destroy(): void;
}
export default FishingLine;
//# sourceMappingURL=FishingLine.d.ts.map