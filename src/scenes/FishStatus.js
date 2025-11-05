/**
 * FishStatus - Right sidebar overlay showing fish fight status
 *
 * Displays:
 * - Line tension indicator
 * - Fish on line status
 * - Estimated fish size
 * - Fight duration
 * - Tips/instructions
 */
export default class FishStatus extends Phaser.Scene {
    constructor() {
        super({ key: 'FishStatus' });
    }

    create() {
        console.log('🎣 FishStatus scene created');

        // Cache dimensions
        this.canvasWidth = this.scale.width;
        this.canvasHeight = this.scale.height;

        // Sidebar dimensions
        this.sidebarWidth = 200;
        this.sidebarX = this.canvasWidth - this.sidebarWidth;

        // Semi-transparent background panel on right side
        this.backgroundPanel = this.add.rectangle(
            this.sidebarX,
            0,
            this.sidebarWidth,
            this.canvasHeight,
            0x000000,
            0.7
        );
        this.backgroundPanel.setOrigin(0, 0);
        this.backgroundPanel.setDepth(0);

        // Text style
        const textStyle = {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#00ff00'
        };

        const headerStyle = {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        };

        // Header
        this.headerText = this.add.text(
            this.sidebarX + 10,
            10,
            'FISH STATUS',
            headerStyle
        );
        this.headerText.setDepth(1);

        // Status display
        this.statusText = this.add.text(
            this.sidebarX + 10,
            40,
            'No fish on line',
            textStyle
        );
        this.statusText.setDepth(1);

        // Line tension display
        this.tensionText = this.add.text(
            this.sidebarX + 10,
            70,
            'Tension: 0%',
            textStyle
        );
        this.tensionText.setDepth(1);

        // Tension bar (visual indicator)
        this.tensionBarBg = this.add.rectangle(
            this.sidebarX + 10,
            90,
            180,
            10,
            0x333333,
            1.0
        );
        this.tensionBarBg.setOrigin(0, 0);
        this.tensionBarBg.setDepth(1);

        this.tensionBar = this.add.rectangle(
            this.sidebarX + 10,
            90,
            0,
            10,
            0x00ff00,
            1.0
        );
        this.tensionBar.setOrigin(0, 0);
        this.tensionBar.setDepth(2);

        // Fish size estimate
        this.sizeText = this.add.text(
            this.sidebarX + 10,
            110,
            'Size: --',
            textStyle
        );
        this.sizeText.setDepth(1);

        // Fight duration
        this.fightTimeText = this.add.text(
            this.sidebarX + 10,
            130,
            'Fight: 0s',
            textStyle
        );
        this.fightTimeText.setDepth(1);

        // Tips section
        this.tipsText = this.add.text(
            this.sidebarX + 10,
            this.canvasHeight - 100,
            'TIPS:\n• Reel steadily\n• Watch tension\n• Keep line tight',
            {
                fontSize: '9px',
                fontFamily: 'Courier New',
                color: '#888888',
                lineSpacing: 4
            }
        );
        this.tipsText.setDepth(1);

        // Listen for data updates from GameScene
        this.registry.events.on('changedata', this.handleDataChange, this);

        // Listen for resize
        this.scale.on('resize', this.handleResize, this);

        // Initially hide sidebar (show when fish is on line)
        this.scene.setVisible(false);
    }

    /**
     * Handle data changes from game registry
     */
    handleDataChange(parent, key, value) {
        switch (key) {
            case 'fishOnLine':
                this.updateFishStatus(value);
                break;
            case 'lineTension':
                this.updateTension(value);
                break;
            case 'fishSize':
                this.updateSize(value);
                break;
            case 'fightDuration':
                this.updateFightTime(value);
                break;
        }
    }

    /**
     * Update fish on line status
     */
    updateFishStatus(isOnLine) {
        if (isOnLine) {
            this.statusText.setText('Fish on line!');
            this.statusText.setColor('#ffff00'); // Yellow when active
            this.scene.setVisible(true);
        } else {
            this.statusText.setText('No fish on line');
            this.statusText.setColor('#00ff00'); // Green when idle
            this.scene.setVisible(false);
        }
    }

    /**
     * Update line tension display
     */
    updateTension(tension) {
        const percent = Math.floor(tension * 100);
        this.tensionText.setText(`Tension: ${percent}%`);

        // Update tension bar
        const barWidth = 180 * tension;
        this.tensionBar.setSize(barWidth, 10);

        // Color based on tension level
        if (tension < 0.5) {
            this.tensionBar.setFillStyle(0x00ff00); // Green - safe
        } else if (tension < 0.8) {
            this.tensionBar.setFillStyle(0xffff00); // Yellow - caution
        } else {
            this.tensionBar.setFillStyle(0xff0000); // Red - danger
        }
    }

    /**
     * Update fish size estimate
     */
    updateSize(size) {
        this.sizeText.setText(`Size: ${size}`);
    }

    /**
     * Update fight duration
     */
    updateFightTime(seconds) {
        this.fightTimeText.setText(`Fight: ${Math.floor(seconds)}s`);
    }

    /**
     * Handle resize
     */
    handleResize(gameSize) {
        this.canvasWidth = gameSize.width;
        this.canvasHeight = gameSize.height;

        // Update sidebar position
        this.sidebarX = this.canvasWidth - this.sidebarWidth;

        // Reposition all elements
        this.backgroundPanel.setPosition(this.sidebarX, 0);
        this.backgroundPanel.setSize(this.sidebarWidth, this.canvasHeight);

        this.headerText.setPosition(this.sidebarX + 10, 10);
        this.statusText.setPosition(this.sidebarX + 10, 40);
        this.tensionText.setPosition(this.sidebarX + 10, 70);
        this.tensionBarBg.setPosition(this.sidebarX + 10, 90);
        this.tensionBar.setPosition(this.sidebarX + 10, 90);
        this.sizeText.setPosition(this.sidebarX + 10, 110);
        this.fightTimeText.setPosition(this.sidebarX + 10, 130);
        this.tipsText.setPosition(this.sidebarX + 10, this.canvasHeight - 100);
    }

    /**
     * Clean up
     */
    shutdown() {
        this.registry.events.off('changedata', this.handleDataChange, this);
        this.scale.off('resize', this.handleResize, this);
    }
}
