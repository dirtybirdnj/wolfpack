/**
 * Native HTML Gamepad API Manager
 * Uses the browser's Gamepad API directly for better compatibility with Bluetooth controllers
 */

class GamepadManager {
    constructor() {
        console.log('🎮 GamepadManager: Initializing...');
        console.log('🎮 GamepadManager: navigator.getGamepads available?', !!navigator.getGamepads);

        this.gamepads = [];
        this.connectedGamepad = null;
        this.listeners = {
            connected: [],
            disconnected: []
        };

        // Check if Gamepad API is supported
        if (!navigator.getGamepads) {
            console.error('❌ Gamepad API not supported in this browser!');
            return;
        }

        this.setupNativeListeners();
        this.pollGamepads(); // Start polling

        // Check for already connected gamepads
        this.checkExistingGamepads();
    }

    checkExistingGamepads() {
        console.log('🎮 GamepadManager: Checking for existing gamepads...');
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        console.log('🎮 GamepadManager: navigator.getGamepads() returned:', gamepads);

        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad) {
                console.log('🎮 GamepadManager: Found existing gamepad!', gamepad.id, 'at index', i);
                this.connectedGamepad = gamepad;
                this.updateControllerStatus(true, gamepad.id);
                this.notifyListeners('connected', gamepad);
            }
        }
    }

    setupNativeListeners() {
        console.log('🎮 GamepadManager: Setting up native event listeners...');

        // Listen for gamepad connection using native browser API
        window.addEventListener('gamepadconnected', (e) => {
            console.log('✅ Gamepad connected (native event):', e.gamepad.id);
            console.log('✅ Gamepad object:', e.gamepad);
            this.connectedGamepad = e.gamepad;
            this.updateGamepads();
            this.notifyListeners('connected', e.gamepad);
            this.updateControllerStatus(true, e.gamepad.id);
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('❌ Gamepad disconnected (native event):', e.gamepad.id);
            if (this.connectedGamepad && this.connectedGamepad.index === e.gamepad.index) {
                this.connectedGamepad = null;
            }
            this.updateGamepads();
            this.notifyListeners('disconnected', e.gamepad);
            this.updateControllerStatus(false, 'No controller detected');
        });

        console.log('🎮 GamepadManager: Event listeners attached');
    }

    /**
     * Poll gamepads - required by the Gamepad API specification
     * The gamepad state only updates when you call navigator.getGamepads()
     */
    pollGamepads() {
        this.updateGamepads();
        requestAnimationFrame(() => this.pollGamepads());
    }

    updateGamepads() {
        // Get current gamepad states (this is required to update button states)
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        this.gamepads = Array.from(gamepads).filter(pad => pad !== null);

        // Update connected gamepad reference with fresh data
        // IMPORTANT: Must always update to get latest button/axis states from Gamepad API
        if (this.gamepads.length > 0) {
            // If we have a connected gamepad, update to its latest reference
            if (this.connectedGamepad) {
                // Find the same gamepad by index and update the reference
                const updatedGamepad = this.gamepads.find(pad => pad.index === this.connectedGamepad.index);
                if (updatedGamepad) {
                    this.connectedGamepad = updatedGamepad;
                } else {
                    // Gamepad at that index no longer exists, use first available
                    this.connectedGamepad = this.gamepads[0];
                    this.updateControllerStatus(true, this.connectedGamepad.id);
                }
            } else {
                // No gamepad connected yet, connect to first available
                this.connectedGamepad = this.gamepads[0];
                this.updateControllerStatus(true, this.connectedGamepad.id);
            }
        } else if (this.connectedGamepad) {
            // No gamepads available but we still have a reference - clear it
            // (This handles cases where gamepaddisconnected event might be missed)
            this.connectedGamepad = null;
            this.updateControllerStatus(false, 'No controller detected');
        }
    }

    /**
     * Get the primary connected gamepad
     */
    getGamepad() {
        this.updateGamepads(); // Ensure we have latest state
        return this.connectedGamepad;
    }

    /**
     * Check if any gamepad is connected
     */
    isConnected() {
        this.updateGamepads();
        return this.connectedGamepad !== null && this.connectedGamepad.connected;
    }

    /**
     * Register a listener for gamepad events
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Notify all listeners of an event
     */
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Update the HTML controller status display and switch controls display
     */
    updateControllerStatus(connected, name) {
        const statusEl = document.getElementById('controller-status');
        const nameEl = document.getElementById('controller-name');
        const helpEl = document.getElementById('controller-help');
        const testBtn = document.getElementById('test-controller-btn');
        const keyboardControls = document.getElementById('keyboard-controls');
        const gamepadControls = document.getElementById('gamepad-controls');

        console.log('🎮 GamepadManager: Updating UI - connected:', connected, 'name:', name);

        if (statusEl) {
            statusEl.textContent = connected ? 'Connected' : 'Not Connected';
            statusEl.className = connected ? 'status-value status-connected' : 'status-value status-disconnected';
        }
        if (nameEl) {
            nameEl.textContent = name;
            nameEl.style.color = connected ? 'var(--text-primary)' : 'var(--text-muted)';
        }
        if (helpEl) {
            // Hide help text when connected using CSS class for better control
            if (connected) {
                helpEl.classList.add('hidden');
            } else {
                helpEl.classList.remove('hidden');
            }
        }
        if (testBtn) {
            testBtn.disabled = !connected;
            testBtn.style.cursor = connected ? 'pointer' : 'not-allowed';
            testBtn.style.opacity = connected ? '1' : '0.5';
        }

        // Switch between keyboard and gamepad controls display
        if (keyboardControls && gamepadControls) {
            if (connected) {
                // Show gamepad controls, hide keyboard controls
                keyboardControls.style.display = 'none';
                gamepadControls.style.display = 'block';
                console.log('🎮 GamepadManager: Switched to gamepad controls display');
            } else {
                // Show keyboard controls, hide gamepad controls
                keyboardControls.style.display = 'block';
                gamepadControls.style.display = 'none';
                console.log('🎮 GamepadManager: Switched to keyboard controls display');
            }
        }
    }

    /**
     * Get button state by name (PS4/Xbox compatible)
     */
    getButton(buttonName) {
        const gamepad = this.getGamepad();
        if (!gamepad) return { pressed: false, value: 0 };

        // Button mapping for standard gamepads
        const buttonMap = {
            'X': 0,        // A button (Xbox) / X button (PS4) - bottom face button
            'Circle': 1,   // B button (Xbox) / Circle button (PS4) - right face button
            'Square': 2,   // X button (Xbox) / Square button (PS4) - left face button
            'Triangle': 3, // Y button (Xbox) / Triangle button (PS4) - top face button
            'L1': 4,       // Left shoulder button
            'R1': 5,       // Right shoulder button
            'L2': 6,       // Left trigger
            'R2': 7,       // Right trigger
            'Select': 8,   // Select/Share button
            'Start': 9,    // Start/Options button
            'L3': 10,      // Left stick press
            'R3': 11,      // Right stick press
            'DpadUp': 12,
            'DpadDown': 13,
            'DpadLeft': 14,
            'DpadRight': 15
        };

        const buttonIndex = buttonMap[buttonName];
        if (buttonIndex !== undefined && gamepad.buttons[buttonIndex]) {
            const button = gamepad.buttons[buttonIndex];
            return {
                pressed: button.pressed,
                value: button.value
            };
        }

        return { pressed: false, value: 0 };
    }

    /**
     * Get axis value (for analog sticks)
     */
    getAxis(axisIndex) {
        const gamepad = this.getGamepad();
        if (!gamepad || !gamepad.axes[axisIndex]) return 0;
        return gamepad.axes[axisIndex];
    }
}

// Create and export a singleton instance
const gamepadManager = new GamepadManager();
export default gamepadManager;
