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

        // Create black background box
        this.blackBox = this.add.graphics();
        this.blackBox.fillStyle(0x000000, 1);
        this.blackBox.fillRect(0, 0, width, height);
        this.blackBox.setDepth(1000); // Ensure it's on top

        // Show VTJ logo first (skip barcode test)
        this.showVTJLogo();
    }

    showPhaserClaudeLogos() {
        const { width, height } = this.cameras.main;

        console.log('=== STARTING QR CODE TEST ===');

        // Title
        this.testTitle = this.add.text(width / 2, height / 2 - 150, 'QR Code Test', {
            fontSize: '32px',
            fontFamily: 'Courier New',
            color: '#ffffff',
            align: 'center'
        });
        this.testTitle.setOrigin(0.5);
        this.testTitle.setDepth(1001);

        // Generate just ONE QR code
        this.generateSingleQR();

        // Wait 5 seconds then go to menu
        this.time.delayedCall(5000, () => {
            this.scene.start('MenuScene');
        });
    }

    async generateSingleQR() {
        const { width, height } = this.cameras.main;

        console.log('=== STARTING QR CODE GENERATION ===');

        const testData = {
            ts: Math.floor(Date.now() / 1000),
            state: 'boot',
            scene: 'BootScene',
            test: 'QR-CODE-ELECTRON-IPC'
        };

        console.log('Step 1: Test data created:', testData);

        try {
            // Check if running in Electron
            if (window.electron && window.electron.generateQRCode) {
                console.log('Step 2: Running in Electron, using IPC');

                const result = await window.electron.generateQRCode(testData);

                if (result.success) {
                    console.log('✓ Step 3: QR code generated via Electron backend');
                    console.log('Data URL length:', result.dataUrl.length);

                    console.log('Step 4: Creating Image bitmap from data URL');
                    const img = new Image();

                    img.onload = () => {
                        console.log('✓ Step 5: Image bitmap loaded');
                        console.log('Image dimensions:', img.width, 'x', img.height);

                        console.log('Step 6: Adding image to Phaser textures');
                        try {
                            this.textures.addImage('test-qr', img);
                            console.log('✓ Texture added to Phaser');

                            console.log('Step 7: Creating sprite from texture');
                            const qrSprite = this.add.image(width / 2, height / 2, 'test-qr');
                            qrSprite.setOrigin(0.5);
                            qrSprite.setDepth(1001);
                            console.log('✓ Sprite created successfully!');

                            console.log('=== QR CODE TEST COMPLETE ===');
                        } catch (phaserError) {
                            console.error('ERROR adding texture to Phaser:', phaserError);
                        }
                    };

                    img.onerror = (error) => {
                        console.error('ERROR: Image failed to load:', error);
                    };

                    img.src = result.dataUrl;
                } else {
                    console.error('ERROR: QR generation failed:', result.error);
                }
            } else {
                console.warn('Not running in Electron - QR code generation skipped');
                console.log('Browser mode detected. Run via `npm run electron` to test QR codes.');
            }

        } catch (e) {
            console.error('ERROR in generateSingleQR:', e);
            console.error('Error stack:', e.stack);
        }
    }

    generateBarcodesSimple() {
        console.log('generateBarcodesSimple called');

        if (typeof bwipjs === 'undefined') {
            console.error('bwip-js not available');
            return;
        }

        console.log('bwipjs is available, starting generation');

        const { width } = this.cameras.main;
        this.barcodeImages = [];

        // Test data
        const testData = JSON.stringify({
            ts: Math.floor(Date.now() / 1000),
            state: 'boot',
            scene: 'BootScene'
        });

        console.log('Test data:', testData);

        const spacing = 200;
        const startX = width / 2 - spacing;

        console.log('Barcode positions - startX:', startX, 'barcodeY:', this.barcodeY);

        // Code 128 (synchronous)
        try {
            console.log('Creating Code 128...');
            const canvas1 = document.createElement('canvas');

            bwipjs.toCanvas(canvas1, {
                bcid: 'code128',
                text: 'BOOT-TEST',
                scale: 2,
                height: 10,
                includetext: true
            });

            console.log('Code 128 canvas created');

            // Create image directly from canvas
            const img1 = new Image();
            img1.onload = () => {
                console.log('Code 128 image loaded');
                this.textures.addImage('bc1', img1);

                const sprite1 = this.add.image(startX, this.barcodeY, 'bc1');
                sprite1.setOrigin(0.5);
                sprite1.setScale(0.7);
                sprite1.setDepth(1001);
                sprite1.setAlpha(0);
                this.barcodeImages.push(sprite1);

                const label1 = this.add.text(startX, this.barcodeY - 50, 'Code 128', {
                    fontSize: '14px',
                    fontFamily: 'Courier New',
                    color: '#00ff00'
                });
                label1.setOrigin(0.5);
                label1.setDepth(1001);
                label1.setAlpha(0);
                this.barcodeImages.push(label1);

                this.tweens.add({ targets: [sprite1, label1], alpha: 1, duration: 300, delay: 200 });
                console.log('Code 128 generated successfully');
            };
            img1.src = canvas1.toDataURL();
        } catch (e) {
            console.error('Code 128 failed:', e);
        }

        // QR Code (with callback)
        try {
            console.log('Creating QR Code...');
            const canvas2 = document.createElement('canvas');

            bwipjs.toCanvas(canvas2, {
                bcid: 'qrcode',
                text: testData,
                scale: 3,
                margin: 2
            }, (err, cvs) => {
                if (err) {
                    console.error('QR Code error:', err);
                    return;
                }

                console.log('QR Code canvas created');

                const img2 = new Image();
                img2.onload = () => {
                    console.log('QR Code image loaded');
                    this.textures.addImage('bc2', img2);

                    const sprite2 = this.add.image(width / 2, this.barcodeY, 'bc2');
                    sprite2.setOrigin(0.5);
                    sprite2.setDisplaySize(100, 100);
                    sprite2.setDepth(1001);
                    sprite2.setAlpha(0);
                    this.barcodeImages.push(sprite2);

                    const label2 = this.add.text(width / 2, this.barcodeY - 60, 'QR Code', {
                        fontSize: '14px',
                        fontFamily: 'Courier New',
                        color: '#00ff00'
                    });
                    label2.setOrigin(0.5);
                    label2.setDepth(1001);
                    label2.setAlpha(0);
                    this.barcodeImages.push(label2);

                    this.tweens.add({ targets: [sprite2, label2], alpha: 1, duration: 300, delay: 400 });
                    console.log('QR Code generated successfully');
                };
                img2.src = cvs.toDataURL();
            });
        } catch (e) {
            console.error('QR Code failed:', e);
        }

        // Aztec (with callback)
        try {
            console.log('Creating Aztec...');
            const canvas3 = document.createElement('canvas');

            bwipjs.toCanvas(canvas3, {
                bcid: 'azteccode',
                text: testData,
                scale: 3,
                margin: 2
            }, (err, cvs) => {
                if (err) {
                    console.error('Aztec error:', err);
                    return;
                }

                console.log('Aztec canvas created');

                const img3 = new Image();
                img3.onload = () => {
                    console.log('Aztec image loaded');
                    this.textures.addImage('bc3', img3);

                    const sprite3 = this.add.image(startX + spacing * 2, this.barcodeY, 'bc3');
                    sprite3.setOrigin(0.5);
                    sprite3.setDisplaySize(100, 100);
                    sprite3.setDepth(1001);
                    sprite3.setAlpha(0);
                    this.barcodeImages.push(sprite3);

                    const label3 = this.add.text(startX + spacing * 2, this.barcodeY - 60, 'Aztec', {
                        fontSize: '14px',
                        fontFamily: 'Courier New',
                        color: '#00ff00'
                    });
                    label3.setOrigin(0.5);
                    label3.setDepth(1001);
                    label3.setAlpha(0);
                    this.barcodeImages.push(label3);

                    this.tweens.add({ targets: [sprite3, label3], alpha: 1, duration: 300, delay: 600 });
                    console.log('Aztec generated successfully');
                };
                img3.src = cvs.toDataURL();
            });
        } catch (e) {
            console.error('Aztec failed:', e);
        }

        console.log('Started barcode generation');
    }

    generateBarcodes() {
        // Check if bwipjs is available
        if (typeof bwipjs === 'undefined') {
            console.warn('bwip-js not loaded, skipping barcodes');
            return;
        }

        const { width, height } = this.cameras.main;

        // Test data
        const testData = {
            ts: Math.floor(Date.now() / 1000),
            state: 'boot',
            scene: 'BootScene',
            phaser: '3.80.1'
        };

        const jsonData = JSON.stringify(testData);
        const shortData = `BOOT|${testData.ts}`;

        // Positions for barcodes (bottom of screen, spread out)
        const barcodeY = height - 120;
        const spacing = 250;
        const startX = width / 2 - spacing;

        // Generate Code 128
        const code128Canvas = document.createElement('canvas');
        bwipjs.toCanvas(code128Canvas, {
            bcid: 'code128',
            text: shortData,
            scale: 2,
            height: 8,
            includetext: true
        }, (err) => {
            if (!err) {
                this.textures.addBase64('code128-boot', code128Canvas.toDataURL());
                const img = this.add.image(startX, barcodeY, 'code128-boot');
                img.setOrigin(0.5);
                img.setScale(0.6);
                img.setDepth(1001);
                img.setAlpha(0);

                const label = this.add.text(startX, barcodeY - 60, 'Code 128', {
                    fontSize: '12px',
                    fontFamily: 'Courier New',
                    color: '#888888',
                    align: 'center'
                });
                label.setOrigin(0.5);
                label.setDepth(1001);
                label.setAlpha(0);

                this.tweens.add({ targets: [img, label], alpha: 1, duration: 500, delay: 600 });
                this.barcodeImages = this.barcodeImages || [];
                this.barcodeImages.push(img, label);
            }
        });

        // Generate QR Code
        const qrCanvas = document.createElement('canvas');
        bwipjs.toCanvas(qrCanvas, {
            bcid: 'qrcode',
            text: jsonData,
            scale: 2,
            margin: 2
        }, (err) => {
            if (!err) {
                this.textures.addBase64('qr-boot', qrCanvas.toDataURL());
                const img = this.add.image(width / 2, barcodeY, 'qr-boot');
                img.setOrigin(0.5);
                img.setDisplaySize(100, 100);
                img.setDepth(1001);
                img.setAlpha(0);

                const label = this.add.text(width / 2, barcodeY - 60, 'QR Code', {
                    fontSize: '12px',
                    fontFamily: 'Courier New',
                    color: '#888888',
                    align: 'center'
                });
                label.setOrigin(0.5);
                label.setDepth(1001);
                label.setAlpha(0);

                this.tweens.add({ targets: [img, label], alpha: 1, duration: 500, delay: 600 });
                this.barcodeImages = this.barcodeImages || [];
                this.barcodeImages.push(img, label);
            }
        });

        // Generate Aztec
        const aztecCanvas = document.createElement('canvas');
        bwipjs.toCanvas(aztecCanvas, {
            bcid: 'azteccode',
            text: jsonData,
            scale: 2,
            margin: 2
        }, (err) => {
            if (!err) {
                this.textures.addBase64('aztec-boot', aztecCanvas.toDataURL());
                const img = this.add.image(startX + spacing * 2, barcodeY, 'aztec-boot');
                img.setOrigin(0.5);
                img.setDisplaySize(100, 100);
                img.setDepth(1001);
                img.setAlpha(0);

                const label = this.add.text(startX + spacing * 2, barcodeY - 60, 'Aztec', {
                    fontSize: '12px',
                    fontFamily: 'Courier New',
                    color: '#888888',
                    align: 'center'
                });
                label.setOrigin(0.5);
                label.setDepth(1001);
                label.setAlpha(0);

                this.tweens.add({ targets: [img, label], alpha: 1, duration: 500, delay: 600 });
                this.barcodeImages = this.barcodeImages || [];
                this.barcodeImages.push(img, label);
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

    showBarcodeTest() {
        const { width, height } = this.cameras.main;

        // Check if bwipjs is available
        if (typeof bwipjs === 'undefined') {
            console.error('bwip-js not loaded, skipping barcode test');
            this.showVTJLogo();
            return;
        }

        // Test data
        const testData = {
            ts: Math.floor(Date.now() / 1000),
            state: 'boot',
            scene: 'BootScene',
            test: true
        };

        const jsonData = JSON.stringify(testData);
        const shortData = `BOOT|${testData.ts}`;

        // Title
        const title = this.add.text(width / 2, 50, 'Barcode Format Test', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#ffffff',
            align: 'center'
        });
        title.setOrigin(0.5);
        title.setDepth(1001);
        title.setAlpha(0);

        // Container for barcodes
        const barcodeY = height / 2 - 50;
        const spacing = 220;
        const startX = width / 2 - spacing;

        // Code 128 label
        const code128Label = this.add.text(startX, barcodeY - 80, 'Code 128\n1D Linear', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            align: 'center'
        });
        code128Label.setOrigin(0.5);
        code128Label.setDepth(1001);
        code128Label.setAlpha(0);

        // QR Code label
        const qrLabel = this.add.text(width / 2, barcodeY - 80, 'QR Code\n2D Matrix', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            align: 'center'
        });
        qrLabel.setOrigin(0.5);
        qrLabel.setDepth(1001);
        qrLabel.setAlpha(0);

        // Aztec label
        const aztecLabel = this.add.text(startX + spacing * 2, barcodeY - 80, 'Aztec\n2D Compact', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            align: 'center'
        });
        aztecLabel.setOrigin(0.5);
        aztecLabel.setDepth(1001);
        aztecLabel.setAlpha(0);

        // Generate Code 128
        const code128Canvas = document.createElement('canvas');
        bwipjs.toCanvas(code128Canvas, {
            bcid: 'code128',
            text: shortData,
            scale: 2,
            height: 10,
            includetext: true
        }, (err) => {
            if (!err) {
                this.textures.addBase64('code128-test', code128Canvas.toDataURL());
                this.code128Image = this.add.image(startX, barcodeY, 'code128-test');
                this.code128Image.setOrigin(0.5);
                this.code128Image.setDepth(1001);
                this.code128Image.setAlpha(0);
            }
        });

        // Generate QR Code
        const qrCanvas = document.createElement('canvas');
        bwipjs.toCanvas(qrCanvas, {
            bcid: 'qrcode',
            text: jsonData,
            scale: 3,
            margin: 5
        }, (err) => {
            if (!err) {
                this.textures.addBase64('qr-test', qrCanvas.toDataURL());
                this.qrImage = this.add.image(width / 2, barcodeY, 'qr-test');
                this.qrImage.setOrigin(0.5);
                this.qrImage.setDisplaySize(150, 150);
                this.qrImage.setDepth(1001);
                this.qrImage.setAlpha(0);
            }
        });

        // Generate Aztec
        const aztecCanvas = document.createElement('canvas');
        bwipjs.toCanvas(aztecCanvas, {
            bcid: 'azteccode',
            text: jsonData,
            scale: 3,
            margin: 5
        }, (err) => {
            if (!err) {
                this.textures.addBase64('aztec-test', aztecCanvas.toDataURL());
                this.aztecImage = this.add.image(startX + spacing * 2, barcodeY, 'aztec-test');
                this.aztecImage.setOrigin(0.5);
                this.aztecImage.setDisplaySize(150, 150);
                this.aztecImage.setDepth(1001);
                this.aztecImage.setAlpha(0);
            }
        });

        // Fade in all elements
        const elementsToFade = [title, code128Label, qrLabel, aztecLabel];

        this.time.delayedCall(100, () => {
            if (this.code128Image) elementsToFade.push(this.code128Image);
            if (this.qrImage) elementsToFade.push(this.qrImage);
            if (this.aztecImage) elementsToFade.push(this.aztecImage);

            this.tweens.add({
                targets: elementsToFade,
                alpha: 1,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    // Wait 3 seconds, then fade out and show VTJ logo
                    this.time.delayedCall(3000, () => {
                        this.tweens.add({
                            targets: elementsToFade,
                            alpha: 0,
                            duration: 500,
                            ease: 'Power2',
                            onComplete: () => {
                                // Clean up
                                elementsToFade.forEach(el => el.destroy());
                                this.showVTJLogo();
                            }
                        });
                    });
                }
            });
        });
    }

    showVTJLogo() {
        const { width, height } = this.cameras.main;

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

    update() {
        // No update needed - tweens handle everything
    }
}

export default BootScene;
