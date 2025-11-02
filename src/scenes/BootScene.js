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

        // Load Phaser and Claude logos
        this.load.image('phaser-logo', 'samples/assets/phaser-logo.png');
        this.load.svg('claude-logo', 'samples/assets/Claude_AI_symbol.svg');
    }

    create() {
        const { width, height } = this.cameras.main;

        // Allow skipping boot animation with any gamepad button
        this.canSkip = true;
        this.hasSkipped = false;

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
        this.websiteText.setPadding(0, 4, 0, 4); // Add padding to prevent clipping
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
        this.taglineText.setPadding(0, 4, 0, 4); // Add padding to prevent clipping
        this.taglineText.setDepth(1001);
        this.taglineText.setAlpha(0); // Start invisible

        // Fade in logo and text
        this.tweens.add({
            targets: [this.vtjLogo, this.websiteText, this.taglineText],
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Wait 2.5 seconds at full opacity
                this.time.delayedCall(2500, () => {
                    // Fade out logo and text, then show Phaser/Claude logos
                    this.tweens.add({
                        targets: [this.vtjLogo, this.websiteText, this.taglineText],
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => {
                            this.showPhaserClaudeLogos();
                        }
                    });
                });
            }
        });
    }

    showPhaserClaudeLogos() {
        const { width, height } = this.cameras.main;

        // Calculate Phaser logo size (2/3 of screen width)
        const phaserWidth = (width * 2) / 3;
        const centerY = height / 2 - 40; // Slightly above center to make room for text

        // Add Phaser logo centered, taking 2/3 of screen width
        this.phaserLogo = this.add.image(width / 2, centerY, 'phaser-logo');
        this.phaserLogo.setOrigin(0.5);

        // Scale to 2/3 width while maintaining aspect ratio
        const phaserScale = phaserWidth / this.phaserLogo.width;
        this.phaserLogo.setScale(phaserScale);

        this.phaserLogo.setDepth(1001);
        this.phaserLogo.setAlpha(0);

        // Calculate Claude logo position (top-right corner of Phaser logo)
        const phaserRight = width / 2 + (this.phaserLogo.displayWidth / 2);
        const phaserTop = centerY - (this.phaserLogo.displayHeight / 2);
        const claudeSize = 60; // Size of Claude logo (smaller than before)

        // Add Claude logo at top-right corner of Phaser logo, shifted up 0.75 inch (72 pixels) and right 0.75 inch (72 pixels)
        this.claudeLogo = this.add.image(phaserRight - claudeSize / 2 + 72, phaserTop + claudeSize / 2 - 72, 'claude-logo');
        this.claudeLogo.setOrigin(0.5);
        this.claudeLogo.setDisplaySize(claudeSize, claudeSize);
        this.claudeLogo.setDepth(1002); // Above Phaser logo
        this.claudeLogo.setAlpha(0);

        // Position for text (below the logos)
        const textY = centerY + (this.phaserLogo.displayHeight / 2) + 40;

        // Create text objects (Claude style font)
        this.creditsText = this.add.text(width / 2, textY, 'Made with Phaser.js and Claude', {
            fontSize: '18px',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif', // Claude uses a sans-serif font
            color: '#ffffff',
            align: 'center'
        });
        this.creditsText.setOrigin(0.5, 0);
        this.creditsText.setDepth(1001);
        this.creditsText.setAlpha(0);

        this.urlsText = this.add.text(width / 2, textY + 30, '', {
            fontSize: '18px',
            fontFamily: 'ui-monospace, monospace', // URLs in monospace
            color: '#aaaaaa',
            align: 'center'
        });
        this.urlsText.setOrigin(0.5, 0);
        this.urlsText.setDepth(1001);

        // Fade in logos and credits text
        this.tweens.add({
            targets: [this.phaserLogo, this.claudeLogo, this.creditsText],
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Start typing after a brief delay
                this.time.delayedCall(500, () => {
                    this.typewriterText(
                        this.urlsText,
                        'phaser.io | claude.ai',
                        60, // Slower typing speed
                        () => {
                            // Wait 1 second after typing finishes (reduced from 2 seconds)
                            this.time.delayedCall(1000, () => {
                                // Fade out all elements
                                this.tweens.add({
                                    targets: [this.phaserLogo, this.claudeLogo, this.creditsText, this.urlsText],
                                    alpha: 0,
                                    duration: 500,
                                    ease: 'Power2',
                                    onComplete: () => {
                                        // Start menu scene
                                        this.scene.start('MenuScene');
                                    }
                                });
                            });
                        }
                    );
                });
            }
        });
    }

    typewriterText(textObject, fullText, speed, onComplete) {
        let currentIndex = 0;

        const typeNextChar = () => {
            if (currentIndex < fullText.length) {
                textObject.setText(fullText.substring(0, currentIndex + 1));
                currentIndex++;
                this.time.delayedCall(speed, typeNextChar);
            } else if (onComplete) {
                onComplete();
            }
        };

        typeNextChar();
    }

    update() {
        // Allow skipping boot animation with any gamepad button
        if (this.canSkip && !this.hasSkipped) {
            const gamepads = navigator.getGamepads();

            for (const gamepad of gamepads) {
                if (!gamepad) continue;

                // Check if any button is pressed
                const anyButtonPressed = gamepad.buttons.some(button => button.pressed);

                if (anyButtonPressed) {
                    this.skipToMenu();
                    break;
                }
            }
        }
    }

    skipToMenu() {
        this.hasSkipped = true;
        this.canSkip = false;

        // Stop all tweens and timers
        this.tweens.killAll();
        this.time.removeAllEvents();

        // Go straight to menu
        this.scene.start('MenuScene');
    }
}

export default BootScene;
