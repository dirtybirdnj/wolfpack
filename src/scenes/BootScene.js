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

        // Add website text 1 inch (96 pixels) above logo
        this.websiteText = this.add.text(width / 2, height / 2 - 96, 'www.verticaltubejig.com', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#ffffff',
            align: 'center'
        });
        this.websiteText.setOrigin(0.5);
        this.websiteText.setDepth(1001);
        this.websiteText.setAlpha(0); // Start invisible

        // Add tagline text 1 inch (96 pixels) below logo
        this.taglineText = this.add.text(width / 2, height / 2 + 96, 'make big aggressive fish chase', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            fontStyle: 'italic',
            color: '#ffffff',
            align: 'center'
        });
        this.taglineText.setOrigin(0.5);
        this.taglineText.setDepth(1001);
        this.taglineText.setAlpha(0); // Start invisible

        // Fade in logo and text
        this.tweens.add({
            targets: [this.vtjLogo, this.websiteText, this.taglineText],
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Wait 1.5 seconds at full opacity (half of original 3 seconds)
                this.time.delayedCall(1500, () => {
                    // Fade out logo and text
                    this.tweens.add({
                        targets: [this.vtjLogo, this.websiteText, this.taglineText],
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
