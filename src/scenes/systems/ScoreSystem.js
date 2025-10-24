import GameConfig from '../../config/GameConfig.js';

/**
 * ScoreSystem - Handles scoring, achievements, and game timer
 *
 * @module scenes/systems/ScoreSystem
 *
 * Responsibilities:
 * - Track score, fish caught, fish lost
 * - Check and award achievements
 * - Manage arcade mode countdown timer
 * - Handle game over logic
 * - Update game statistics
 *
 * COMMON TASKS:
 * - Add new achievement → checkAchievements() method
 * - Change arcade timer → updateGameTime() method
 * - Modify end game conditions → endGame() method
 *
 * @example
 * const scoreSystem = new ScoreSystem(scene);
 * scoreSystem.update(time, delta);
 * scoreSystem.addScore(50);
 */
export class ScoreSystem {
    /**
     * @param {Phaser.Scene} scene - The game scene
     */
    constructor(scene) {
        this.scene = scene;
        this.gameOver = false;

        // Set up game timer
        this.setupTimer();
    }

    /**
     * Set up the game timer (runs every second)
     */
    setupTimer() {
        this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                this.updateGameTime();
                this.updateGameStats();
            },
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Update game time (arcade countdown or unlimited count up)
     */
    updateGameTime() {
        if (this.gameOver) return;

        if (this.scene.gameMode === GameConfig.GAME_MODE_ARCADE) {
            // Countdown timer for arcade
            this.scene.timeRemaining--;
            this.scene.gameTime++;

            // Check if time is up
            if (this.scene.timeRemaining <= 0) {
                this.endGame();
            }
        } else {
            // Count up timer for unlimited
            this.scene.gameTime++;
        }
    }

    /**
     * Update game statistics and emit to UI
     */
    updateGameStats() {
        // Send game stats to UI
        this.scene.events.emit('updateTime', this.scene.gameTime);
        this.scene.events.emit('updateWaterTemp', this.scene.waterTemp);
    }

    /**
     * Add score and check for achievements
     * @param {number} points - Points to add
     */
    addScore(points) {
        this.scene.score += points;
        this.checkAchievements();
    }

    /**
     * Increment fish caught counter
     */
    addFishCaught() {
        this.scene.fishCaught++;
        this.checkAchievements();
    }

    /**
     * Increment fish lost counter
     */
    addFishLost() {
        this.scene.fishLost++;
    }

    /**
     * Check for various achievements based on current stats
     */
    checkAchievements() {
        // Check for various achievements
        if (this.scene.fishCaught === 1) {
            this.showAchievement('First Catch!', 'Welcome to Lake Champlain');
        } else if (this.scene.fishCaught === 5) {
            this.showAchievement('Getting the Hang of It', '5 Lake Trout Caught');
        } else if (this.scene.fishCaught === 10) {
            this.showAchievement('Experienced Angler', '10 Lake Trout Caught');
        } else if (this.scene.score >= 500) {
            if (!this.highScorerAchieved) {
                this.showAchievement('High Scorer', '500 Points Earned');
                this.highScorerAchieved = true;
            }
        }
    }

    /**
     * Show an achievement notification
     * @param {string} title - Achievement title
     * @param {string} description - Achievement description
     */
    showAchievement(title, description) {
        const achievementText = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 80,
            `🏆 ${title} 🏆\n${description}`,
            {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#00ff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        achievementText.setOrigin(0.5, 0.5);
        achievementText.setAlpha(0);
        achievementText.setDepth(1000);

        this.scene.tweens.add({
            targets: achievementText,
            alpha: 1,
            duration: 500,
            yoyo: true,
            hold: 2000,
            onComplete: () => {
                achievementText.destroy();
            }
        });
    }

    /**
     * End the game and transition to game over scene
     */
    endGame() {
        if (this.gameOver) return;

        this.gameOver = true;
        console.log('Game over!');

        // Store final game data in registry
        this.scene.registry.set('finalScore', this.scene.score);
        this.scene.registry.set('finalFishCaught', this.scene.fishCaught);
        this.scene.registry.set('finalFishLost', this.scene.fishLost);
        this.scene.registry.set('finalGameTime', this.scene.gameTime);
        this.scene.registry.set('caughtFishData', this.scene.caughtFishData);
        this.scene.registry.set('fishingType', this.scene.fishingType);
        this.scene.registry.set('gameMode', this.scene.gameMode);

        // Fade out and go to game over scene
        this.scene.cameras.main.fadeOut(1000);
        this.scene.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.scene.stop('UIScene');
            this.scene.scene.start('GameOverScene');
        });
    }

    /**
     * Update score system each frame
     * @param {number} time - Current game time
     * @param {number} delta - Time since last frame
     */
    update(time, delta) {
        // Score system updates are primarily event-driven
        // This method is here for future expansion if needed
    }

    /**
     * Reset score system (for new game)
     */
    reset() {
        this.gameOver = false;
        this.highScorerAchieved = false;
    }

    /**
     * Clean up score system
     */
    destroy() {
        // Timers are managed by Phaser scene, no cleanup needed
    }
}

export default ScoreSystem;
