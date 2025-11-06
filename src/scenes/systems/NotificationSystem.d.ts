import { FishSprite } from '../../sprites/FishSprite.js';
/**
 * Pause menu button
 */
export interface PauseMenuButton {
    container: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
    callback: () => void;
}
/**
 * Pause overlay components
 */
export interface PauseOverlay {
    overlay: Phaser.GameObjects.Graphics;
    pausedText: Phaser.GameObjects.Text;
    hintText: Phaser.GameObjects.Text;
    buttons: PauseMenuButton[];
}
/**
 * Controls dialog components
 */
export interface ControlsDialog {
    background: Phaser.GameObjects.Graphics;
    elements: Phaser.GameObjects.GameObject[];
}
/**
 * Disconnect warning components
 */
export interface DisconnectWarning {
    overlay: Phaser.GameObjects.Graphics;
    title: Phaser.GameObjects.Text;
    message: Phaser.GameObjects.Text;
    hint: Phaser.GameObjects.Text;
}
/**
 * Button state tracking
 */
export interface ButtonStates {
    up: boolean;
    down: boolean;
    x: boolean;
    circle: boolean;
    select: boolean;
}
/**
 * NotificationSystem - Handles all in-game notifications and messages
 *
 * @module scenes/systems/NotificationSystem
 *
 * Responsibilities:
 * - Show catch notifications
 * - Display game mode messages
 * - Show pause overlay
 * - Display temporary messages (warnings, tips, etc.)
 * - Handle all tween-based text animations
 *
 * COMMON TASKS:
 * - Add new notification type → add new show*() method
 * - Change notification styling → modify text style parameters
 * - Adjust animation timing → modify tween duration/delay
 *
 * @example
 * const notificationSystem = new NotificationSystem(scene);
 * notificationSystem.showCatchNotification(fish);
 */
export declare class NotificationSystem {
    private scene;
    private pauseOverlay;
    private isPaused;
    private selectedButtonIndex;
    private buttons;
    private buttonStates;
    private controlsDialogOpen;
    private controlsDialog;
    switchToTackleBox: boolean;
    private disconnectWarning;
    private controllerReconnected;
    private xButtonWasPressed;
    /**
     * @param scene - The game scene
     */
    constructor(scene: Phaser.Scene);
    /**
     * Show game mode notification at start
     */
    showGameModeNotification(): void;
    /**
     * Show fish caught notification
     * @param fish - The fish that was caught
     */
    showCatchNotification(fish: FishSprite): void;
    /**
     * Show fish hooked notification (start of fight)
     */
    showFishHookedNotification(): void;
    /**
     * Show gamepad connected notification
     * @param gamepadId - The gamepad identifier
     */
    showGamepadConnected(gamepadId: string): void;
    /**
     * Show gamepad disconnected warning
     * Important notification when controller dies during gameplay
     */
    showGamepadDisconnected(): DisconnectWarning;
    /**
     * Dismiss gamepad disconnected warning
     */
    dismissDisconnectWarning(): void;
    /**
     * Check if disconnect warning is active
     */
    hasDisconnectWarning(): boolean;
    /**
     * Show generic message
     * @param title - Message title
     * @param description - Message description
     * @param y - Y position (default: 100)
     */
    showMessage(title: string, description: string, y?: number): void;
    /**
     * Toggle pause state
     */
    togglePause(): boolean;
    /**
     * Create pause overlay
     */
    private createPauseOverlay;
    /**
     * Create a pause menu button
     */
    private createPauseMenuButton;
    /**
     * Update visual highlight for selected button in pause menu
     */
    private updatePauseMenuHighlight;
    /**
     * Close controls dialog
     */
    private closeControlsDialog;
    /**
     * Handle input for pause menu navigation
     */
    handlePauseMenuInput(): void;
    /**
     * Show controls dialog
     */
    private showControlsDialog;
    /**
     * Open tackle box from pause menu
     */
    private openTackleBox;
    /**
     * Go to main menu
     */
    private goToMainMenu;
    /**
     * Destroy pause overlay
     */
    private destroyPauseOverlay;
    /**
     * Check if game is paused
     * @returns True if paused
     */
    isPausedState(): boolean;
    /**
     * Update notification system each frame
     * @param time - Current game time
     * @param delta - Time since last frame
     */
    update(time: number, delta: number): void;
    /**
     * Clean up notification system
     */
    destroy(): void;
}
export default NotificationSystem;
//# sourceMappingURL=NotificationSystem.d.ts.map