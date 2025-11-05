import { generate } from '../../node_modules/lean-qr/index.mjs';

/**
 * QR Code Generator utility using lean-qr
 * Generates QR codes as PNG data URLs for use in Phaser sprites
 */
export class QRCodeGenerator {
    /**
     * Generate a QR code as a PNG data URL
     * @param {string} data - The data to encode in the QR code
     * @param {number} scale - Scale factor for QR code size (default: 4)
     * @returns {string} PNG data URL
     */
    static generatePNG(data, scale = 4) {
        try {
            // Generate QR code matrix using lean-qr
            const qrMatrix = generate(data);

            console.log('QR matrix generated, size:', qrMatrix.length);

            // Calculate dimensions
            const size = qrMatrix.length;
            const canvasSize = size * scale;

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = canvasSize;
            canvas.height = canvasSize;
            const ctx = canvas.getContext('2d');

            console.log('Canvas created:', canvasSize, 'x', canvasSize);

            // Fill white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvasSize, canvasSize);

            // Draw black modules
            ctx.fillStyle = '#000000';
            let moduleCount = 0;
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    if (qrMatrix[y][x]) {
                        ctx.fillRect(x * scale, y * scale, scale, scale);
                        moduleCount++;
                    }
                }
            }

            console.log('Drew', moduleCount, 'black modules out of', size * size, 'total');

            // Convert to PNG data URL
            const dataURL = canvas.toDataURL('image/png');
            console.log('Data URL length:', dataURL.length);

            return dataURL;
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw error;
        }
    }

    /**
     * Generate a QR code with debug information for screenshots
     * @param {Object} debugInfo - Debug information to encode
     * @returns {string} PNG data URL
     */
    static generateDebugQR(debugInfo) {
        const debugString = JSON.stringify(debugInfo);
        return this.generatePNG(debugString, 4);
    }
}
