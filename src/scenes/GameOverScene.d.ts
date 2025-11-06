export class GameOverScene {
    create(): void;
    selectedButtonIndex: number | undefined;
    buttons: any[] | undefined;
    buttonStates: {
        left: boolean;
        right: boolean;
        x: boolean;
    } | undefined;
    gamepad: any;
    update(): void;
    handleMenuInput(): void;
    updateButtonHighlight(): void;
    createFishCard(x: any, y: any, fish: any, number: any): any;
    createButton(x: any, y: any, text: any, callback: any): {
        container: any;
        bg: any;
        text: any;
        callback: any;
    };
    restartGame(): void;
    goToMenu(): void;
}
export default GameOverScene;
//# sourceMappingURL=GameOverScene.d.ts.map