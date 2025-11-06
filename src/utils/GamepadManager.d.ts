export default gamepadManager;
declare const gamepadManager: GamepadManager;
/**
 * Native HTML Gamepad API Manager
 * Uses the browser's Gamepad API directly for better compatibility with Bluetooth controllers
 */
declare class GamepadManager {
    gamepads: any[];
    connectedGamepad: any;
    listeners: {
        connected: never[];
        disconnected: never[];
    };
    rafId: number | null;
    checkExistingGamepads(): void;
    setupNativeListeners(): void;
    /**
     * Poll gamepads - required by the Gamepad API specification
     * The gamepad state only updates when you call navigator.getGamepads()
     */
    pollGamepads(): void;
    updateGamepads(): void;
    /**
     * Get the primary connected gamepad
     */
    getGamepad(): any;
    /**
     * Check if any gamepad is connected
     */
    isConnected(): any;
    /**
     * Register a listener for gamepad events
     */
    on(event: any, callback: any): void;
    /**
     * Remove a listener for gamepad events
     */
    off(event: any, callback: any): void;
    /**
     * Notify all listeners of an event
     */
    notifyListeners(event: any, data: any): void;
    /**
     * Update the HTML controller status display and switch controls display
     */
    updateControllerStatus(connected: any, name: any): void;
    /**
     * Get button state by name (PS4/Xbox compatible)
     */
    getButton(buttonName: any): {
        pressed: any;
        value: any;
    };
    /**
     * Get axis value (for analog sticks)
     */
    getAxis(axisIndex: any): any;
    /**
     * Cleanup method - stops polling and clears listeners
     */
    destroy(): void;
}
//# sourceMappingURL=GamepadManager.d.ts.map