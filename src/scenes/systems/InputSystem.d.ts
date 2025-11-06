/**
 * Gamepad button state
 */
export interface GamepadButtonState {
    lastR2Press: number;
    r2MinInterval: number;
    lastSpeedAdjust: number;
    speedAdjustDelay: number;
    lastDpadUp: boolean;
    lastDpadDown: boolean;
    lastDpadLeft: boolean;
    lastDpadRight: boolean;
    lastL1: boolean;
    lastR1: boolean;
    lastA: boolean;
    lastB: boolean;
    lastX: boolean;
    lastY: boolean;
    lastStart: boolean;
}
/**
 * InputSystem - Handles all input (keyboard, gamepad, mouse)
 *
 * @module scenes/systems/InputSystem
 *
 * Responsibilities:
 * - Keyboard input handling
 * - Gamepad input handling with native Gamepad API
 * - Mouse/touch input
 * - Input state tracking
 * - Mode-specific controls (ice fishing vs boat)
 *
 * COMMON TASKS:
 * - Add new keyboard controls → handleKeyboardInput() method
 * - Add new gamepad controls → handleGamepadInput() method
 * - Change control mappings → setupInput() method
 *
 * @example
 * const inputSystem = new InputSystem(scene);
 * inputSystem.update(time, delta);
 */
export declare class InputSystem {
    private scene;
    private cursors;
    private spaceKey;
    private rKey;
    private escKey;
    private pKey;
    private qKey;
    private eKey;
    private vKey;
    private mouseReeling;
    private mouseReelIntensity;
    private gamepadState;
    /**
     * @param scene - The game scene
     */
    constructor(scene: Phaser.Scene);
    /**
     * Set up all input handlers (keyboard, mouse, gamepad)
     */
    setupInput(): void;
    /**
     * Set up gamepad input handling
     */
    setupGamepad(): void;
    /**
     * Show a notification when gamepad connects
     * @param gamepadId - The gamepad identifier
     */
    showGamepadConnectedNotification(gamepadId: string): void;
    /**
     * Handle keyboard input
     */
    handleKeyboardInput(): void;
    /**
     * Handle gamepad input
     */
    handleGamepadInput(): void;
    /**
     * Handle fish fight input (R2 analog trigger for continuous reeling, plus drag adjustment)
     * @returns Analog reel input 0-1 from R2 trigger pressure or mouse
     */
    handleFishFightInput(): number;
    /**
     * Check for pause input
     * @returns True if pause button was pressed
     */
    checkPauseInput(): boolean;
    /**
     * Show movement warning when trying to move with lure down
     */
    showMovementWarning(): void;
    /**
     * Update speed display in UI
     */
    updateSpeedDisplay(): void;
    /**
     * Update input system each frame
     * @param time - Current game time
     * @param delta - Time since last frame
     */
    update(time: number, delta: number): void;
    /**
     * Clean up input system
     */
    destroy(): void;
}
export default InputSystem;
//# sourceMappingURL=InputSystem.d.ts.map