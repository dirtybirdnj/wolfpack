/**
 * QROverlay - Displays game state as a QR code for AI agent debugging
 *
 * This class generates a QR code containing game state data that can be
 * easily read by AI vision models like Claude from screenshots.
 */

export class QROverlay {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this.qrImage = null;
        this.lastUpdate = 0;
        this.updateInterval = 1000; // Update every 1 second
        this.size = 150; // QR code size in pixels

        // Position in top-right corner
        this.x = this.scene.cameras.main.width - this.size - 20;
        this.y = 20;

        // Check if bwipjs is available
        if (typeof bwipjs === 'undefined') {
            console.warn('QROverlay: bwip-js library not loaded. QR codes will not be generated.');
        }
    }

    /**
     * Toggle QR code visibility
     */
    toggle() {
        this.visible = !this.visible;

        if (this.qrImage) {
            this.qrImage.setVisible(this.visible);
        }

        console.log(`QR Overlay: ${this.visible ? 'visible' : 'hidden'}`);

        // Generate immediately if becoming visible
        if (this.visible) {
            this.forceUpdate();
        }

        return this.visible;
    }

    /**
     * Update QR code with current game state
     * @param {Object} gameState - Game state data to encode
     */
    update(gameState) {
        if (!this.visible) return;

        const now = Date.now();
        if (now - this.lastUpdate < this.updateInterval) return;

        this.lastUpdate = now;
        this.generateQR(gameState);
    }

    /**
     * Force immediate update regardless of interval
     */
    forceUpdate(gameState = {}) {
        this.lastUpdate = Date.now();
        this.generateQR(gameState);
    }

    /**
     * Generate QR code from game state
     * @param {Object} gameState - Game state object
     */
    async generateQR(gameState) {
        // Check if bwipjs is available
        if (typeof bwipjs === 'undefined') {
            console.error('QROverlay: bwip-js library not available');
            return;
        }

        try {
            // Convert game state to JSON string
            const dataString = JSON.stringify(gameState);

            // Create canvas for QR code
            const canvas = document.createElement('canvas');

            // Generate QR code
            bwipjs.toCanvas(canvas, {
                bcid: 'qrcode',
                text: dataString,
                scale: 2,
                margin: 2,
                eclevel: 'M' // Medium error correction
            }, (err, cvs) => {
                if (err) {
                    console.error('QROverlay: Error generating QR code:', err);
                    return;
                }

                // Convert canvas to data URL
                const dataUrl = cvs.toDataURL();

                // Update or create Phaser image
                this.updatePhaserImage(dataUrl);
            });

        } catch (error) {
            console.error('QROverlay: Failed to generate QR code:', error);
        }
    }

    /**
     * Update Phaser image with new QR code
     * @param {string} dataUrl - Data URL of QR code canvas
     */
    updatePhaserImage(dataUrl) {
        // Remove existing texture if present
        if (this.scene.textures.exists('qr-code')) {
            this.scene.textures.remove('qr-code');
        }

        // Load new texture from data URL
        this.scene.textures.once('addtexture', () => {
            // Remove old image
            if (this.qrImage) {
                this.qrImage.destroy();
            }

            // Create new image
            this.qrImage = this.scene.add.image(this.x, this.y, 'qr-code');
            this.qrImage.setOrigin(0, 0);
            this.qrImage.setDisplaySize(this.size, this.size);
            this.qrImage.setDepth(10000); // Very high depth to stay on top
            this.qrImage.setAlpha(0.9);
            this.qrImage.setVisible(this.visible);

            // Add semi-transparent background
            if (this.background) {
                this.background.destroy();
            }
            this.background = this.scene.add.graphics();
            this.background.fillStyle(0x000000, 0.7);
            this.background.fillRect(this.x - 5, this.y - 5, this.size + 10, this.size + 10);
            this.background.setDepth(9999);
            this.background.setVisible(this.visible);
        });

        // Add texture from data URL
        this.scene.textures.addBase64('qr-code', dataUrl);
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.qrImage) {
            this.qrImage.destroy();
        }
        if (this.background) {
            this.background.destroy();
        }
        if (this.scene.textures.exists('qr-code')) {
            this.scene.textures.remove('qr-code');
        }
    }
}

export default QROverlay;
