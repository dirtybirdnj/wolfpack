/**
 * InfoBar - Top overlay scene showing game status information
 *
 * Displays:
 * - Current depth
 * - Water temperature
 * - Time elapsed
 * - Species counts
 * - Current game mode
 */
export default class InfoBar extends Phaser.Scene {
    constructor() {
        super({ key: 'InfoBar' });
    }

    create() {
        console.log('📊 InfoBar scene created');

        // Cache dimensions
        this.canvasWidth = this.scale.width;
        this.canvasHeight = this.scale.height;

        // Semi-transparent background bar at top
        this.backgroundBar = this.add.rectangle(
            0,
            0,
            this.canvasWidth,
            40,
            0x000000,
            0.7
        );
        this.backgroundBar.setOrigin(0, 0);
        this.backgroundBar.setDepth(0);

        // Text style for info display
        const textStyle = {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#00ff00'
        };

        // Create info text elements
        this.depthText = this.add.text(10, 10, 'Depth: --ft', textStyle);
        this.depthText.setDepth(1);

        this.tempText = this.add.text(120, 10, 'Temp: --°F', textStyle);
        this.tempText.setDepth(1);

        this.timeText = this.add.text(230, 10, 'Time: 0:00', textStyle);
        this.timeText.setDepth(1);

        this.modeText = this.add.text(this.canvasWidth - 150, 10, 'Mode: Ice Fishing', textStyle);
        this.modeText.setOrigin(0, 0);
        this.modeText.setDepth(1);

        // Listen for data updates from GameScene
        this.registry.events.on('changedata', this.handleDataChange, this);

        // Listen for resize
        this.scale.on('resize', this.handleResize, this);
    }

    /**
     * Handle data changes from game registry
     */
    handleDataChange(parent, key, value) {
        switch (key) {
            case 'currentDepth':
                this.updateDepth(value);
                break;
            case 'waterTemp':
                this.updateTemp(value);
                break;
            case 'elapsedTime':
                this.updateTime(value);
                break;
            case 'gameMode':
                this.updateMode(value);
                break;
        }
    }

    /**
     * Update depth display
     */
    updateDepth(depth) {
        this.depthText.setText(`Depth: ${Math.floor(depth)}ft`);
    }

    /**
     * Update temperature display
     */
    updateTemp(temp) {
        this.tempText.setText(`Temp: ${Math.floor(temp)}°F`);
    }

    /**
     * Update time display
     */
    updateTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        this.timeText.setText(`Time: ${minutes}:${secs.toString().padStart(2, '0')}`);
    }

    /**
     * Update game mode display
     */
    updateMode(mode) {
        this.modeText.setText(`Mode: ${mode}`);
    }

    /**
     * Handle resize
     */
    handleResize(gameSize) {
        this.canvasWidth = gameSize.width;
        this.canvasHeight = gameSize.height;

        // Resize background bar
        this.backgroundBar.setSize(this.canvasWidth, 40);

        // Reposition mode text (right-aligned)
        this.modeText.setPosition(this.canvasWidth - 150, 10);
    }

    /**
     * Clean up
     */
    shutdown() {
        this.registry.events.off('changedata', this.handleDataChange, this);
        this.scale.off('resize', this.handleResize, this);
    }
}
