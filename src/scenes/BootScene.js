import GameConfig from '../config/GameConfig.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    init() {
        // Set camera background to black immediately
        this.cameras.main.setBackgroundColor(0x000000);
    }

    preload() {
        // Load VTJ logo
        this.load.image('vtj-logo', 'samples/assets/vtj-circle-thickborder.png');
    }

    create() {
        const { width, height } = this.cameras.main;

        // Create black background box
        this.blackBox = this.add.graphics();
        this.blackBox.fillStyle(0x000000, 1);
        this.blackBox.fillRect(0, 0, width, height);
        this.blackBox.setDepth(1000); // Ensure it's on top

        // Add VTJ logo in the center
        this.vtjLogo = this.add.image(width / 2, height / 2, 'vtj-logo');
        this.vtjLogo.setOrigin(0.5);
        this.vtjLogo.setScale(0.15); // Adjust size as needed
        this.vtjLogo.setDepth(1001); // Above black box
        this.vtjLogo.setAlpha(0); // Start invisible

        // Fade in logo
        this.tweens.add({
            targets: this.vtjLogo,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Wait 3 seconds at full opacity
                this.time.delayedCall(3000, () => {
                    // Fade out logo
                    this.tweens.add({
                        targets: this.vtjLogo,
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => {
                            // Fade out black box to reveal menu
                            this.tweens.add({
                                targets: this.blackBox,
                                alpha: 0,
                                duration: 500,
                                ease: 'Power2',
                                onComplete: () => {
                                    // Start menu scene
                                    this.scene.start('MenuScene');
                                }
                            });
                        }
                    });
                });
            }
        });
    }

    update() {
        // No update needed - tweens handle everything
    }
}

export default BootScene;
