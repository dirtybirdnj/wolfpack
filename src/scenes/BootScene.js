import GameConfig from '../config/GameConfig.js';
import { SpriteGenerator } from '../utils/SpriteGenerator.js';

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

        // Generate all game sprite textures during boot
        this.load.on('complete', () => {
            SpriteGenerator.generateAllTextures(this);
            // Mark textures as generated so GameScene doesn't regenerate them
            this.registry.set('texturesGenerated', true);
        });
    }

    create() {
        const { width, height } = this.cameras.main;

        // No skipping - auto-advance only
        this.canSkip = false;
        this.hasSkipped = false;

        // Create black background box
        this.blackBox = this.add.graphics();
        this.blackBox.fillStyle(0x000000, 1);
        this.blackBox.fillRect(0, 0, width, height);
        this.blackBox.setDepth(0); // Keep at background

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

        // Show texture atlas fish sprites around the VTJ logo
        this.showTextureAtlasAroundLogo();

        // Fade in logo, text, and fish sprites
        const elementsToFade = [this.vtjLogo, this.websiteText, this.taglineText];
        this.tweens.add({
            targets: elementsToFade,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Wait 3 seconds at full opacity to admire the fish
                this.time.delayedCall(3000, () => {
                    // Fade out everything and go to menu
                    this.tweens.add({
                        targets: [...elementsToFade, ...this.atlasSprites],
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => {
                            this.scene.start('MenuScene');
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
                                        // Show texture atlas slide
                                        this.showTextureAtlas();
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
        // No skip functionality - auto-advance only
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

    showTextureAtlasAroundLogo() {
        const { width, height } = this.cameras.main;

        // Array to store fish sprites for fading
        this.atlasSprites = [];

        // Collect all fish textures
        const predatorTextures = [];
        const baitfishTextures = [];
        const otherTextures = [];

        const textureManager = this.textures;
        const allTextures = textureManager.list;

        Object.keys(allTextures).forEach(key => {
            if (key.startsWith('fish_')) {
                predatorTextures.push(key);
            } else if (key.startsWith('baitfish_')) {
                baitfishTextures.push(key);
            } else if (key === 'zooplankton' || key === 'crayfish') {
                otherTextures.push(key);
            }
        });

        // Combine all textures
        const allFishTextures = [...predatorTextures, ...baitfishTextures, ...otherTextures];

        // Shuffle array for random distribution
        const shuffled = allFishTextures.sort(() => Math.random() - 0.5);

        // Calculate positions in a circular pattern around the logo
        const centerX = width / 2;
        const centerY = height / 2;
        const minRadius = 250; // Minimum distance from center (keep clear of logo)
        const maxRadius = Math.min(width, height) / 2 - 50; // Stay within screen bounds

        shuffled.forEach((texKey, index) => {
            const texture = textureManager.get(texKey);
            const isMissing = texKey.includes('__MISSING') || !texture || texture.key === '__MISSING';

            if (!isMissing) {
                // Calculate position using Fibonacci spiral for uniform distribution
                const angle = index * 137.5 * (Math.PI / 180); // Golden angle
                const radius = minRadius + (maxRadius - minRadius) * Math.sqrt(index / shuffled.length);

                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                // Create sprite
                const sprite = this.add.image(x, y, texKey);
                sprite.setOrigin(0.5);
                sprite.setDepth(1002); // Above logo (1001) and black box (1000)
                sprite.setAlpha(0); // Start invisible

                // Scale based on texture type
                if (texKey.startsWith('baitfish_') || texKey === 'zooplankton') {
                    sprite.setScale(3); // Make small fish more visible
                } else if (texKey === 'crayfish') {
                    sprite.setScale(4);
                } else {
                    sprite.setScale(1.5); // Predators slightly enlarged
                }

                // Random rotation for variety
                sprite.setAngle(Math.random() * 360);

                this.atlasSprites.push(sprite);

                // Fade in with slight delay for cascading effect
                this.tweens.add({
                    targets: sprite,
                    alpha: 0.8,
                    duration: 800,
                    delay: index * 30, // Stagger appearance
                    ease: 'Power2'
                });
            }
        });
    }

    // Old atlas display method - kept for reference but not used
    showTextureAtlas_OLD() {
        const { width, height } = this.cameras.main;

        // Clear any existing display elements
        this.children.removeAll();

        // Title
        const title = this.add.text(width / 2, 40, 'TEXTURE ATLAS', {
            fontSize: '32px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        });
        title.setOrigin(0.5);
        title.setDepth(1001);
        title.setAlpha(0);

        const subtitle = this.add.text(width / 2, 80, 'Generated Game Sprites', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#aaaaaa',
            align: 'center'
        });
        subtitle.setOrigin(0.5);
        subtitle.setDepth(1001);
        subtitle.setAlpha(0);

        // Collect all textures
        const predatorTextures = [];
        const baitfishTextures = [];
        const otherTextures = [];

        const textureManager = this.textures;
        const allTextures = textureManager.list;

        Object.keys(allTextures).forEach(key => {
            if (key.startsWith('fish_')) {
                predatorTextures.push(key);
            } else if (key.startsWith('baitfish_')) {
                baitfishTextures.push(key);
            } else if (key === 'zooplankton' || key === 'crayfish') {
                otherTextures.push(key);
            }
        });

        // Sort textures
        predatorTextures.sort();
        baitfishTextures.sort();
        otherTextures.sort();

        // Container for all texture display elements
        const displayElements = [];

        // Display textures in grid
        let startY = 120;
        const columnWidth = width / 3;
        const rowHeight = 50;

        // Predators column
        const predHeader = this.add.text(columnWidth / 2, startY, 'PREDATORS', {
            fontSize: '20px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#ff6b6b',
            align: 'center'
        });
        predHeader.setOrigin(0.5);
        predHeader.setDepth(1001);
        predHeader.setAlpha(0);
        displayElements.push(predHeader);

        startY += 40;
        predatorTextures.forEach((texKey, index) => {
            const y = startY + (index * rowHeight);

            const texture = textureManager.get(texKey);
            const isMissing = texKey.includes('__MISSING') || !texture || texture.key === '__MISSING';

            if (!isMissing) {
                const sprite = this.add.image(50, y, texKey);
                sprite.setOrigin(0, 0.5);
                sprite.setDepth(1001);
                sprite.setAlpha(0);
                displayElements.push(sprite);
            } else {
                const graphics = this.add.graphics();
                graphics.lineStyle(3, 0xff0000);
                graphics.beginPath();
                graphics.moveTo(40, y - 15);
                graphics.lineTo(60, y + 15);
                graphics.moveTo(60, y - 15);
                graphics.lineTo(40, y + 15);
                graphics.strokePath();
                graphics.setDepth(1001);
                graphics.setAlpha(0);
                displayElements.push(graphics);
            }

            const label = this.add.text(120, y, texKey, {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: isMissing ? '#ff0000' : '#ffffff',
                align: 'left'
            });
            label.setOrigin(0, 0.5);
            label.setDepth(1001);
            label.setAlpha(0);
            displayElements.push(label);
        });

        // Baitfish column
        startY = 160;
        const baitHeader = this.add.text(columnWidth + columnWidth / 2, startY, 'BAITFISH', {
            fontSize: '20px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#4a9eff',
            align: 'center'
        });
        baitHeader.setOrigin(0.5);
        baitHeader.setDepth(1001);
        baitHeader.setAlpha(0);
        displayElements.push(baitHeader);

        startY += 40;
        baitfishTextures.forEach((texKey, index) => {
            const y = startY + (index * rowHeight);

            const texture = textureManager.get(texKey);
            const isMissing = texKey.includes('__MISSING') || !texture || texture.key === '__MISSING';

            if (!isMissing) {
                const sprite = this.add.image(columnWidth + 50, y, texKey);
                sprite.setOrigin(0, 0.5);
                sprite.setDepth(1001);
                sprite.setScale(2);
                sprite.setAlpha(0);
                displayElements.push(sprite);
            } else {
                const graphics = this.add.graphics();
                graphics.lineStyle(3, 0xff0000);
                graphics.beginPath();
                graphics.moveTo(columnWidth + 40, y - 15);
                graphics.lineTo(columnWidth + 60, y + 15);
                graphics.moveTo(columnWidth + 60, y - 15);
                graphics.lineTo(columnWidth + 40, y + 15);
                graphics.strokePath();
                graphics.setDepth(1001);
                graphics.setAlpha(0);
                displayElements.push(graphics);
            }

            const label = this.add.text(columnWidth + 120, y, texKey, {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: isMissing ? '#ff0000' : '#ffffff',
                align: 'left'
            });
            label.setOrigin(0, 0.5);
            label.setDepth(1001);
            label.setAlpha(0);
            displayElements.push(label);
        });

        // Other organisms column
        startY = 160;
        const otherHeader = this.add.text(columnWidth * 2 + columnWidth / 2, startY, 'OTHER', {
            fontSize: '20px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#66bb6a',
            align: 'center'
        });
        otherHeader.setOrigin(0.5);
        otherHeader.setDepth(1001);
        otherHeader.setAlpha(0);
        displayElements.push(otherHeader);

        startY += 40;
        otherTextures.forEach((texKey, index) => {
            const y = startY + (index * rowHeight);

            const texture = textureManager.get(texKey);
            const isMissing = texKey.includes('__MISSING') || !texture || texture.key === '__MISSING';

            if (!isMissing) {
                const sprite = this.add.image(columnWidth * 2 + 50, y, texKey);
                sprite.setOrigin(0, 0.5);
                sprite.setDepth(1001);
                sprite.setScale(3);
                sprite.setAlpha(0);
                displayElements.push(sprite);
            } else {
                const graphics = this.add.graphics();
                graphics.lineStyle(3, 0xff0000);
                graphics.beginPath();
                graphics.moveTo(columnWidth * 2 + 40, y - 15);
                graphics.lineTo(columnWidth * 2 + 60, y + 15);
                graphics.moveTo(columnWidth * 2 + 60, y - 15);
                graphics.lineTo(columnWidth * 2 + 40, y + 15);
                graphics.strokePath();
                graphics.setDepth(1001);
                graphics.setAlpha(0);
                displayElements.push(graphics);
            }

            const label = this.add.text(columnWidth * 2 + 120, y, texKey, {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: isMissing ? '#ff0000' : '#ffffff',
                align: 'left'
            });
            label.setOrigin(0, 0.5);
            label.setDepth(1001);
            label.setAlpha(0);
            displayElements.push(label);
        });

        // Summary stats
        const totalTextures = predatorTextures.length + baitfishTextures.length + otherTextures.length;
        const summary = this.add.text(width / 2, height - 80,
            `Total: ${totalTextures} textures (${predatorTextures.length} predators, ${baitfishTextures.length} baitfish, ${otherTextures.length} other)`,
            {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#ffffff',
                align: 'center'
            }
        );
        summary.setOrigin(0.5);
        summary.setDepth(1001);
        summary.setAlpha(0);

        const instructions = this.add.text(width / 2, height - 50,
            'Click to continue',
            {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#888888',
                align: 'center'
            }
        );
        instructions.setOrigin(0.5);
        instructions.setDepth(1001);
        instructions.setAlpha(0);

        // Fade in all elements
        this.tweens.add({
            targets: [title, subtitle, predHeader, baitHeader, otherHeader, ...displayElements, summary, instructions],
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Add click/button listener to continue
                const continueToMenu = () => {
                    this.input.off('pointerdown', continueToMenu);

                    // Fade out
                    this.tweens.add({
                        targets: [title, subtitle, predHeader, baitHeader, otherHeader, ...displayElements, summary, instructions],
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => {
                            this.scene.start('MenuScene');
                        }
                    });
                };

                this.input.once('pointerdown', continueToMenu);
            }
        });
    }
}

export default BootScene;
