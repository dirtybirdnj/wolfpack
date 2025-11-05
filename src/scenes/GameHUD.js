/**
 * GameHUD - In-game HUD with all meters and status info rendered as graphics
 *
 * Replaces HTML UI elements with GPU-rendered Phaser graphics.
 * Uses RenderTextures and cached gradients for optimal performance.
 *
 * Top Bar Meters:
 * - Line Strain (gradient: green → yellow → orange → red)
 * - Depth
 * - Mode
 * - Tension (gradient: green → yellow → orange → red)
 * - Drop Speed (gradient: orange → yellow → green)
 * - Reel Speed (gradient: green → yellow → orange)
 * - Drag Setting (gradient: green → yellow → orange)
 * - Time
 *
 * Right Sidebar:
 * - Fish status panel
 * - Entity counts
 * - Selected fish details
 */
export default class GameHUD extends Phaser.Scene {
    constructor() {
        super({ key: 'GameHUD' });
    }

    create() {
        console.log('🎮 GameHUD scene created');

        // Cache dimensions
        this.canvasWidth = this.scale.width;
        this.canvasHeight = this.scale.height;

        // Create all UI elements
        this.createTopBar();
        this.createRightSidebar();

        // Listen for data updates from GameScene
        this.registry.events.on('changedata', this.handleDataChange, this);

        // Listen for resize
        this.scale.on('resize', this.handleResize, this);

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Track visibility state
        this.topBarVisible = true;
        this.sidebarVisible = true;
    }

    /**
     * Setup keyboard shortcuts for toggling UI elements
     */
    setupKeyboardShortcuts() {
        // M key - toggle top bar
        this.input.keyboard.on('keydown-M', () => {
            this.toggleTopBar();
        });

        // S key - toggle sidebar
        this.input.keyboard.on('keydown-S', () => {
            this.toggleSidebar();
        });

        // F key - toggle both (cinema mode)
        this.input.keyboard.on('keydown-F', () => {
            if (this.topBarVisible || this.sidebarVisible) {
                // Hide both
                if (this.topBarVisible) this.toggleTopBar();
                if (this.sidebarVisible) this.toggleSidebar();
                console.log('🎬 Cinema mode - HUD hidden');
            } else {
                // Show both
                if (!this.topBarVisible) this.toggleTopBar();
                if (!this.sidebarVisible) this.toggleSidebar();
                console.log('📊 Normal mode - HUD visible');
            }
        });
    }

    /**
     * Create top bar with all meters
     */
    createTopBar() {
        const barHeight = 44;
        const padding = 10;
        const meterWidth = 100;
        const meterHeight = 12;
        const gap = 12;

        // Semi-transparent background panel
        this.topBarBg = this.add.graphics();
        this.topBarBg.fillStyle(0x000000, 0.75);
        this.topBarBg.fillRect(0, 0, this.canvasWidth, barHeight);
        this.topBarBg.setDepth(1000);

        // Text style for labels and values
        const labelStyle = {
            fontSize: '9px',
            fontFamily: 'Courier New',
            color: '#666666'
        };

        const valueStyle = {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        };

        let xPos = padding;

        // LINE STRAIN METER
        this.lineStrainMeter = this.createMeter(xPos, 8, meterWidth, meterHeight, 'LINE 15lb', labelStyle, valueStyle);
        xPos += meterWidth + gap;

        // DEPTH
        xPos = this.createValueDisplay(xPos, 8, 'DEPTH', '--ft', labelStyle, valueStyle, 'depth');
        xPos += gap;

        // MODE
        xPos = this.createValueDisplay(xPos, 8, 'MODE', 'OBSERVING', labelStyle, valueStyle, 'mode');
        xPos += gap;

        // TENSION METER
        this.tensionMeter = this.createMeter(xPos, 8, meterWidth, meterHeight, 'TENSION', labelStyle, valueStyle);
        xPos += meterWidth + gap;

        // DROP METER
        this.dropMeter = this.createMeter(xPos, 8, meterWidth, meterHeight, 'DROP', labelStyle, valueStyle, true); // reversed gradient
        xPos += meterWidth + gap;

        // REEL METER
        this.reelMeter = this.createMeter(xPos, 8, meterWidth, meterHeight, 'REEL', labelStyle, valueStyle);
        xPos += meterWidth + gap;

        // DRAG METER
        this.dragMeter = this.createMeter(xPos, 8, meterWidth, meterHeight, 'DRAG', labelStyle, valueStyle);
        xPos += meterWidth + gap;

        // TIME (right side)
        const timeX = this.canvasWidth - 80;
        this.createValueDisplay(timeX, 8, 'TIME', '0:00', labelStyle, valueStyle, 'time');
    }

    /**
     * Create a meter with gradient fill bar
     */
    createMeter(x, y, width, height, label, labelStyle, valueStyle, reversed = false) {
        // Label text
        const labelText = this.add.text(x, y, label, labelStyle);
        labelText.setDepth(1001);

        // Meter background
        const meterBg = this.add.graphics();
        meterBg.fillStyle(0x000000, 0.6);
        meterBg.lineStyle(1, 0x666666, 0.8);
        meterBg.fillRect(x, y + 12, width - 30, height);
        meterBg.strokeRect(x, y + 12, width - 30, height);
        meterBg.setDepth(1001);

        // Create gradient texture for fill
        const gradientTexture = this.createGradientTexture(width - 30, height, reversed);

        // Meter fill (starts at 0 width)
        const meterFill = this.add.image(x, y + 12, gradientTexture);
        meterFill.setOrigin(0, 0);
        meterFill.setDisplaySize(0, height);
        meterFill.setDepth(1002);

        // Percentage text
        const percentText = this.add.text(x + width - 28, y + 13, '0%', {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        percentText.setDepth(1003);

        return {
            label: labelText,
            bg: meterBg,
            fill: meterFill,
            percent: percentText,
            maxWidth: width - 30,
            x: x,
            y: y + 12
        };
    }

    /**
     * Create gradient texture for meters
     * Green → Yellow → Orange → Red (or reversed)
     */
    createGradientTexture(width, height, reversed = false) {
        const key = `gradient_${width}_${height}_${reversed}`;

        // Check if already created
        if (this.textures.exists(key)) {
            return key;
        }

        // Create canvas for gradient
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0);

        if (reversed) {
            // Orange → Yellow → Green (for DROP meter)
            gradient.addColorStop(0, '#ff6600');
            gradient.addColorStop(0.5, '#ffff00');
            gradient.addColorStop(1, '#00ff00');
        } else {
            // Green → Yellow → Orange → Red (standard)
            gradient.addColorStop(0, '#00ff00');
            gradient.addColorStop(0.5, '#ffff00');
            gradient.addColorStop(0.75, '#ff9900');
            gradient.addColorStop(1, '#ff0000');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add to texture manager
        this.textures.addCanvas(key, canvas);

        return key;
    }

    /**
     * Create simple value display (no meter bar)
     */
    createValueDisplay(x, y, label, defaultValue, labelStyle, valueStyle, key) {
        // Label
        const labelText = this.add.text(x, y, label, labelStyle);
        labelText.setDepth(1001);

        // Value
        const valueText = this.add.text(x, y + 12, defaultValue, valueStyle);
        valueText.setDepth(1001);

        // Store reference
        if (!this.valueDisplays) this.valueDisplays = {};
        this.valueDisplays[key] = valueText;

        return x + Math.max(labelText.width, valueText.width) + 8;
    }

    /**
     * Create right sidebar for fish status
     */
    createRightSidebar() {
        const sidebarWidth = 300;
        const sidebarX = this.canvasWidth - sidebarWidth;

        // Semi-transparent background
        this.sidebarBg = this.add.graphics();
        this.sidebarBg.fillStyle(0x000000, 0.75);
        this.sidebarBg.fillRect(sidebarX, 50, sidebarWidth, this.canvasHeight - 50);
        this.sidebarBg.lineStyle(2, 0xffaa00, 1.0);
        this.sidebarBg.strokeRect(sidebarX, 50, sidebarWidth, this.canvasHeight - 50);
        this.sidebarBg.setDepth(1000);

        // Header
        const headerStyle = {
            fontSize: '13px',
            fontFamily: 'Courier New',
            color: '#ffaa00',
            fontStyle: 'bold'
        };

        this.sidebarHeader = this.add.text(sidebarX + 10, 58, '🐟 FISH STATUS', headerStyle);
        this.sidebarHeader.setDepth(1001);

        // Entity counts
        const countStyle = {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#88ff88'
        };

        this.entityCountText = this.add.text(sidebarX + 200, 60, '', countStyle);
        this.entityCountText.setDepth(1001);

        // Fish list container
        const listStyle = {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            lineSpacing: 2
        };

        this.fishListText = this.add.text(sidebarX + 10, 85, 'No fish spawned', {
            ...listStyle,
            color: '#666666',
            fontStyle: 'italic'
        });
        this.fishListText.setDepth(1001);
        this.fishListText.setWordWrapWidth(sidebarWidth - 20);

        // Fish detail panel (bottom section)
        const detailPanelY = this.canvasHeight - 200;

        this.detailPanelBg = this.add.graphics();
        this.detailPanelBg.fillStyle(0x0a0a0a, 1.0);
        this.detailPanelBg.lineStyle(2, 0x00ff00, 1.0);
        this.detailPanelBg.fillRect(sidebarX, detailPanelY, sidebarWidth, 200);
        this.detailPanelBg.strokeRect(sidebarX, detailPanelY, 2);
        this.detailPanelBg.setDepth(1000);

        this.fishDetailText = this.add.text(sidebarX + 10, detailPanelY + 10, 'Select a fish to view details', {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#666666',
            fontStyle: 'italic',
            lineSpacing: 3
        });
        this.fishDetailText.setDepth(1001);
        this.fishDetailText.setWordWrapWidth(sidebarWidth - 20);

        // Initially hide sidebar (can be toggled)
        this.sidebarVisible = true;
    }

    /**
     * Update meter fill based on percentage (0-1)
     */
    updateMeter(meter, percent) {
        if (!meter) return;

        const clampedPercent = Math.max(0, Math.min(1, percent));
        const fillWidth = meter.maxWidth * clampedPercent;

        meter.fill.setDisplaySize(fillWidth, meter.fill.displayHeight);
        meter.percent.setText(Math.floor(clampedPercent * 100) + '%');

        // Color percent text based on value
        if (clampedPercent < 0.5) {
            meter.percent.setColor('#00ff00');
        } else if (clampedPercent < 0.8) {
            meter.percent.setColor('#ffff00');
        } else {
            meter.percent.setColor('#ff0000');
        }
    }

    /**
     * Handle data changes from game registry
     */
    handleDataChange(parent, key, value) {
        switch (key) {
            case 'lineStrain':
                this.updateMeter(this.lineStrainMeter, value);
                break;
            case 'lineTension':
                this.updateMeter(this.tensionMeter, value);
                break;
            case 'dropSpeed':
                this.updateMeter(this.dropMeter, value);
                break;
            case 'reelSpeed':
                this.updateMeter(this.reelMeter, value);
                break;
            case 'dragSetting':
                this.updateMeter(this.dragMeter, value);
                break;
            case 'depth':
                if (this.valueDisplays.depth) {
                    this.valueDisplays.depth.setText(Math.floor(value) + 'ft');
                }
                break;
            case 'mode':
                if (this.valueDisplays.mode) {
                    this.valueDisplays.mode.setText(value);
                }
                break;
            case 'elapsedTime':
                if (this.valueDisplays.time) {
                    const minutes = Math.floor(value / 60);
                    const seconds = Math.floor(value % 60);
                    this.valueDisplays.time.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                }
                break;
            case 'entityCounts':
                if (this.entityCountText) {
                    this.entityCountText.setText(value);
                }
                break;
            case 'fishList':
                if (this.fishListText) {
                    this.fishListText.setText(value || 'No fish spawned');
                }
                break;
            case 'fishDetail':
                if (this.fishDetailText) {
                    this.fishDetailText.setText(value || 'Select a fish to view details');
                }
                break;
        }
    }

    /**
     * Toggle top bar visibility
     */
    toggleTopBar() {
        this.topBarVisible = !this.topBarVisible;
        const alpha = this.topBarVisible ? 1 : 0;

        // Hide/show all top bar elements
        this.topBarBg.setAlpha(alpha);

        // Toggle all meter elements
        if (this.lineStrainMeter) {
            this.lineStrainMeter.label.setAlpha(alpha);
            this.lineStrainMeter.bg.setAlpha(alpha);
            this.lineStrainMeter.fill.setAlpha(alpha);
            this.lineStrainMeter.percent.setAlpha(alpha);
        }
        if (this.tensionMeter) {
            this.tensionMeter.label.setAlpha(alpha);
            this.tensionMeter.bg.setAlpha(alpha);
            this.tensionMeter.fill.setAlpha(alpha);
            this.tensionMeter.percent.setAlpha(alpha);
        }
        if (this.dropMeter) {
            this.dropMeter.label.setAlpha(alpha);
            this.dropMeter.bg.setAlpha(alpha);
            this.dropMeter.fill.setAlpha(alpha);
            this.dropMeter.percent.setAlpha(alpha);
        }
        if (this.reelMeter) {
            this.reelMeter.label.setAlpha(alpha);
            this.reelMeter.bg.setAlpha(alpha);
            this.reelMeter.fill.setAlpha(alpha);
            this.reelMeter.percent.setAlpha(alpha);
        }
        if (this.dragMeter) {
            this.dragMeter.label.setAlpha(alpha);
            this.dragMeter.bg.setAlpha(alpha);
            this.dragMeter.fill.setAlpha(alpha);
            this.dragMeter.percent.setAlpha(alpha);
        }

        // Toggle value displays
        if (this.valueDisplays) {
            Object.values(this.valueDisplays).forEach(text => {
                if (text && text.setAlpha) text.setAlpha(alpha);
            });
        }

        console.log(this.topBarVisible ? '📊 Top bar visible' : '🎬 Top bar hidden');
    }

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        this.sidebarVisible = !this.sidebarVisible;
        const alpha = this.sidebarVisible ? 1 : 0;

        this.sidebarBg.setAlpha(alpha);
        this.sidebarHeader.setAlpha(alpha);
        this.entityCountText.setAlpha(alpha);
        this.fishListText.setAlpha(alpha);
        this.detailPanelBg.setAlpha(alpha);
        this.fishDetailText.setAlpha(alpha);

        console.log(this.sidebarVisible ? '📊 Sidebar visible' : '🎬 Sidebar hidden');
    }

    /**
     * Handle resize
     */
    handleResize(gameSize) {
        this.canvasWidth = gameSize.width;
        this.canvasHeight = gameSize.height;

        // Redraw top bar
        this.topBarBg.clear();
        this.topBarBg.fillStyle(0x000000, 0.75);
        this.topBarBg.fillRect(0, 0, this.canvasWidth, 44);

        // Reposition/redraw sidebar
        const sidebarWidth = 300;
        const sidebarX = this.canvasWidth - sidebarWidth;

        this.sidebarBg.clear();
        this.sidebarBg.fillStyle(0x000000, 0.75);
        this.sidebarBg.fillRect(sidebarX, 50, sidebarWidth, this.canvasHeight - 50);
        this.sidebarBg.lineStyle(2, 0xffaa00, 1.0);
        this.sidebarBg.strokeRect(sidebarX, 50, sidebarWidth, this.canvasHeight - 50);

        this.sidebarHeader.setPosition(sidebarX + 10, 58);
        this.entityCountText.setPosition(sidebarX + 200, 60);
        this.fishListText.setPosition(sidebarX + 10, 85);

        const detailPanelY = this.canvasHeight - 200;
        this.detailPanelBg.clear();
        this.detailPanelBg.fillStyle(0x0a0a0a, 1.0);
        this.detailPanelBg.lineStyle(2, 0x00ff00, 1.0);
        this.detailPanelBg.fillRect(sidebarX, detailPanelY, sidebarWidth, 200);
        this.detailPanelBg.strokeRect(sidebarX, detailPanelY, sidebarWidth, 2);

        this.fishDetailText.setPosition(sidebarX + 10, detailPanelY + 10);

        // Reposition time display (right-aligned)
        if (this.valueDisplays.time) {
            const timeX = this.canvasWidth - 80;
            this.valueDisplays.time.setX(timeX);
        }
    }

    /**
     * Clean up
     */
    shutdown() {
        this.registry.events.off('changedata', this.handleDataChange, this);
        this.scale.off('resize', this.handleResize, this);
    }
}
