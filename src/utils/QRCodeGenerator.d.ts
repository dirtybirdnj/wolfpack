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
    static generatePNG(data: string, scale?: number): string;
    /**
     * Generate a QR code with debug information for screenshots
     * @param {Object} debugInfo - Debug information to encode
     * @returns {string} PNG data URL
     */
    static generateDebugQR(debugInfo: Object): string;
}
//# sourceMappingURL=QRCodeGenerator.d.ts.map