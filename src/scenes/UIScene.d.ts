export class UIScene {
    fishCaught: number;
    fishLost: number;
    gameTime: number;
    waterTemp: number;
    create(): void;
    uiEnabled: boolean | undefined;
    updateLureInfo(info: any): void;
    updateRetrieveIndicator(speed: any): void;
    updateTime(seconds: any): void;
    updateWaterTemp(temp: any): void;
    updateFishLost(count: any): void;
    updateDynamicInfo(): void;
}
export default UIScene;
//# sourceMappingURL=UIScene.d.ts.map