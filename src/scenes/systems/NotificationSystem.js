import GameConfig from '../../config/GameConfig.js';

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
export class NotificationSystem {
    /**
     * @param {Phaser.Scene} scene - The game scene
     */
    constructor(scene) {
        this.scene = scene;
        this.pauseOverlay = null;
        this.isPaused = false;
    }

    /**
     * Show game mode notification at start
     */
    showGameModeNotification() {
        const modeText = this.scene.gameMode === GameConfig.GAME_MODE_ARCADE ?
            'ARCADE MODE\n2 Minutes - Catch as many as you can!' :
            'UNLIMITED MODE\nRelax and fish at your own pace';

        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 120, modeText, {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3
        });
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 3000,
            delay: 1000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * Show fish caught notification
     * @param {Fish} fish - The fish that was caught
     */
    showCatchNotification(fish) {
        const info = fish.getInfo();
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 240,
            `FISH ON!\n${info.weight}\n+${fish.points} points`,
            {
                fontSize: '19px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        // Animate and remove
        this.scene.tweens.add({
            targets: text,
            y: 200,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
            }
        });
    }

    /**
     * Show fish hooked notification (start of fight)
     */
    showFishHookedNotification() {
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 160,
            'FISH ON!\nTAP SPACEBAR OR R2 TO REEL!',
            {
                fontSize: '22px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * Show gamepad connected notification
     * @param {string} gamepadId - The gamepad identifier
     */
    showGamepadConnected(gamepadId) {
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 40, 'Gamepad Connected!', {
            fontSize: '13px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            delay: 1000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * Show generic message
     * @param {string} title - Message title
     * @param {string} description - Message description
     * @param {number} y - Y position (default: 100)
     */
    showMessage(title, description, y = 100) {
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, y,
            `${title}\n${description}`,
            {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.createPauseOverlay();
            console.log('Game paused');
        } else {
            this.destroyPauseOverlay();
            console.log('Game resumed');
        }

        return this.isPaused;
    }

    /**
     * Create pause overlay
     */
    createPauseOverlay() {
        if (this.pauseOverlay) return; // Already exists

        // Semi-transparent black overlay
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        overlay.setDepth(2000);

        // PAUSED text
        const pausedText = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 - 40, 'PAUSED', {
            fontSize: '48px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        pausedText.setOrigin(0.5, 0.5);
        pausedText.setDepth(2001);

        // Instructions
        const instructText = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 + 20,
            'Press START, ESC, or P to resume', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
        });
        instructText.setOrigin(0.5, 0.5);
        instructText.setDepth(2001);

        // Pulsing effect on pause text
        this.scene.tweens.add({
            targets: pausedText,
            alpha: 0.6,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        this.pauseOverlay = {
            overlay,
            pausedText,
            instructText
        };
    }

    /**
     * Destroy pause overlay
     */
    destroyPauseOverlay() {
        if (!this.pauseOverlay) return;

        this.pauseOverlay.overlay.destroy();
        this.pauseOverlay.pausedText.destroy();
        this.pauseOverlay.instructText.destroy();
        this.pauseOverlay = null;
    }

    /**
     * Check if game is paused
     * @returns {boolean} True if paused
     */
    isPausedState() {
        return this.isPaused;
    }

    /**
     * Update notification system each frame
     * @param {number} time - Current game time
     * @param {number} delta - Time since last frame
     */
    update(time, delta) {
        // Notifications are primarily event-driven
        // This method is here for future expansion if needed
    }

    /**
     * Clean up notification system
     */
    destroy() {
        if (this.pauseOverlay) {
            this.destroyPauseOverlay();
        }
    }
}

export default NotificationSystem;
