export class BootScene {
    init(): void;
    preload(): void;
    create(): void;
    canSkip: boolean | undefined;
    hasSkipped: boolean | undefined;
    blackBox: any;
    vtjLogo: any;
    websiteText: any;
    taglineText: any;
    showPhaserClaudeLogos(): void;
    phaserLogo: any;
    claudeLogo: any;
    creditsText: any;
    urlsText: any;
    typewriterText(textObject: any, fullText: any, speed: any, onComplete: any): void;
    update(): void;
    skipToMenu(): void;
    showTextureAtlasAroundLogo(): void;
    atlasSprites: any[] | undefined;
    showTextureAtlas_OLD(): void;
}
export default BootScene;
//# sourceMappingURL=BootScene.d.ts.map