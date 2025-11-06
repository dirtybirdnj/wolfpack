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

interface Meter {
    label: Phaser.GameObjects.Text;
    bg: Phaser.GameObjects.Graphics;
    fill: Phaser.GameObjects.Image;
    percent: Phaser.GameObjects.Text;
    maxWidth: number;
    x: number;
    y: number;
    reversed?: boolean;
}

interface FishListItem {
    id: string;
    name: string;
    gender: string;
    weight: number;
    state: string;
    hunger: number;
    health: number;
    depth: number;
    baitfishEaten: number;
    isSelected: boolean;
}

interface FishDetailData {
    name: string;
    weight: string;
    length: string;
    gender: string;
    age: string;
    depth: string;
    zone: string;
    hunger: number;
    health: number;
    state: string;
    frenzy: string;
    baitfishEaten: number;
    speed: string;
}

export default class GameHUD extends Phaser.Scene {
    private canvasWidth: number = 0;
    private canvasHeight: number = 0;
    private topBarContainer!: Phaser.GameObjects.Container;
    private fishStatusContainer!: Phaser.GameObjects.Container;
    private topBarBg!: Phaser.GameObjects.Graphics;
    private lineStrainMeter!: Meter;
    private tensionMeter!: Meter;
    private dropMeter!: Meter;
    private reelMeter!: Meter;
    private dragMeter!: Meter;
    private valueDisplays: Record<string, Phaser.GameObjects.Text> = {};
    private gamepadIcon!: Phaser.GameObjects.Text;
    private bookIcon!: Phaser.GameObjects.Text;
    private sidebarBg!: Phaser.GameObjects.Graphics;
    private sidebarHeader!: Phaser.GameObjects.Text;
    private entityCountText!: Phaser.GameObjects.Text;
    private fishListContainer!: Phaser.GameObjects.Container;
    private fishRows: Phaser.GameObjects.GameObject[] = [];
    private detailPanelBg!: Phaser.GameObjects.Graphics;
    private fishDetailContainer!: Phaser.GameObjects.Container;
    private fishDetailElements: Phaser.GameObjects.GameObject[] = [];
    private topBarVisible: boolean = true;
    private sidebarVisible: boolean = true;

    constructor() {
        super({ key: 'GameHUD' });
    }

    create(): void {
        console.log('🎮 GameHUD scene created');

        // Cache dimensions
        this.canvasWidth = this.scale.width;
        this.canvasHeight = this.scale.height;

        // Create main containers for each HUD section
        this.topBarContainer = this.add.container(0, 0);
        this.topBarContainer.setDepth(1000);

        this.fishStatusContainer = this.add.container(0, 0);
        this.fishStatusContainer.setDepth(1000);

        // Create all UI elements
        this.createTopBar();
        this.createIcons();
        this.createRightSidebar();

        // Listen for data updates from GameScene
        this.registry.events.on('changedata', this.handleDataChange, this);

        // Listen for resize
        this.scale.on('resize', this.handleResize, this);

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    /**
     * Setup keyboard shortcuts for toggling UI elements
     */
    private setupKeyboardShortcuts(): void {
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
    private createTopBar(): void {
        const barHeight = 50;
        const horizontalPadding = 15;
        const verticalPadding = 8;
        const meterWidth = 100;
        const meterHeight = 12;
        const gap = 15;
        const dropReelGap = 10;

        // Semi-transparent background panel
        this.topBarBg = this.add.graphics();
        this.topBarBg.fillStyle(0x000000, 0.75);
        this.topBarBg.fillRect(0, 0, this.canvasWidth, barHeight);
        this.topBarContainer.add(this.topBarBg);

        // Text style for labels and values
        const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontSize: '9px',
            fontFamily: 'Courier New',
            color: '#666666'
        };

        const valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        };

        let xPos = horizontalPadding;

        // LINE STRAIN METER
        this.lineStrainMeter = this.createMeter(xPos, verticalPadding, meterWidth, meterHeight, 'LINE 15lb', labelStyle, valueStyle);
        xPos += meterWidth + gap;

        // DEPTH
        xPos = this.createValueDisplay(xPos, verticalPadding, 'DEPTH', '--ft', labelStyle, valueStyle, 'depth');
        xPos += gap;

        // MODE
        xPos = this.createValueDisplay(xPos, verticalPadding, 'MODE', 'OBSERVING', labelStyle, valueStyle, 'mode');
        xPos += gap;

        // TENSION METER
        this.tensionMeter = this.createMeter(xPos, verticalPadding, meterWidth, meterHeight, 'TENSION', labelStyle, valueStyle);
        xPos += meterWidth + gap;

        // DROP METER
        this.dropMeter = this.createMeter(xPos, verticalPadding, meterWidth, meterHeight, 'DROP', labelStyle, valueStyle, true);
        xPos += meterWidth + dropReelGap;

        // REEL METER
        this.reelMeter = this.createMeter(xPos, verticalPadding, meterWidth, meterHeight, 'REEL', labelStyle, valueStyle);
        xPos += meterWidth + gap;

        // DRAG METER
        this.dragMeter = this.createMeter(xPos, verticalPadding, meterWidth, meterHeight, 'DRAG', labelStyle, valueStyle);
        xPos += meterWidth + gap;

        // TIME (right side)
        const timeX = this.canvasWidth - 180;
        this.createValueDisplay(timeX, verticalPadding, 'TIME', '0:00', labelStyle, valueStyle, 'time');

        // Icons (far right)
        this.createIcons();
    }

    /**
     * Create a meter with gradient fill bar
     */
    private createMeter(x: number, y: number, width: number, height: number, label: string,
                       labelStyle: Phaser.Types.GameObjects.Text.TextStyle,
                       valueStyle: Phaser.Types.GameObjects.Text.TextStyle,
                       reversed: boolean = false): Meter {
        // Label text
        const labelText = this.add.text(x, y, label, labelStyle);
        this.topBarContainer.add(labelText);

        // Meter background
        const meterBg = this.add.graphics();
        meterBg.fillStyle(0x000000, 0.6);
        meterBg.lineStyle(1, 0x666666, 0.8);
        meterBg.fillRect(x, y + 12, width, height);
        meterBg.strokeRect(x, y + 12, width, height);
        this.topBarContainer.add(meterBg);

        // Create gradient texture for fill
        const gradientTexture = this.createGradientTexture(width, height, reversed);

        // Meter fill
        const meterFill = this.add.image(reversed ? x + width : x, y + 12, gradientTexture);
        meterFill.setOrigin(reversed ? 1 : 0, 0);
        meterFill.setDisplaySize(0, height);
        this.topBarContainer.add(meterFill);

        // Percentage text
        const percentText = this.add.text(x + width / 2, y + 26, '0%', {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        percentText.setOrigin(0.5, 0);
        this.topBarContainer.add(percentText);

        return {
            label: labelText,
            bg: meterBg,
            fill: meterFill,
            percent: percentText,
            maxWidth: width,
            x: x,
            y: y + 12,
            reversed: reversed
        };
    }

    /**
     * Create gradient texture for meters
     */
    private createGradientTexture(width: number, height: number, reversed: boolean = false): string {
        const key = `gradient_${width}_${height}_${reversed}`;

        if (this.textures.exists(key)) {
            return key;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        const gradient = ctx.createLinearGradient(0, 0, width, 0);

        if (reversed) {
            gradient.addColorStop(0, '#ff6600');
            gradient.addColorStop(0.5, '#ffff00');
            gradient.addColorStop(1, '#00ff00');
        } else {
            gradient.addColorStop(0, '#00ff00');
            gradient.addColorStop(0.5, '#ffff00');
            gradient.addColorStop(0.75, '#ff9900');
            gradient.addColorStop(1, '#ff0000');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        this.textures.addCanvas(key, canvas);

        return key;
    }

    /**
     * Create simple value display (no meter bar)
     */
    private createValueDisplay(x: number, y: number, label: string, defaultValue: string,
                               labelStyle: Phaser.Types.GameObjects.Text.TextStyle,
                               valueStyle: Phaser.Types.GameObjects.Text.TextStyle, key: string): number {
        const labelText = this.add.text(x, y, label, labelStyle);
        this.topBarContainer.add(labelText);

        const valueText = this.add.text(x, y + 12, defaultValue, valueStyle);
        this.topBarContainer.add(valueText);

        this.valueDisplays[key] = valueText;

        return x + Math.max(labelText.width, valueText.width) + 8;
    }

    /**
     * Create gamepad and book icons
     */
    private createIcons(): void {
        const iconStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontSize: '24px',
            fontFamily: 'Arial'
        };

        // Gamepad icon (right side)
        const gamepadX = this.canvasWidth - 80;
        this.gamepadIcon = this.add.text(gamepadX, 10, '🎮', iconStyle);
        this.gamepadIcon.setInteractive({ useHandCursor: true });
        this.gamepadIcon.on('pointerdown', () => {
            console.log('🎮 Gamepad icon clicked - Controller test would open here');
        });
        this.topBarContainer.add(this.gamepadIcon);

        // Book icon (species guide)
        const bookX = this.canvasWidth - 50;
        this.bookIcon = this.add.text(bookX, 10, '📖', iconStyle);
        this.bookIcon.setInteractive({ useHandCursor: true });
        this.bookIcon.on('pointerdown', () => {
            console.log('📖 Book icon clicked - Species guide would open here');
        });
        this.topBarContainer.add(this.bookIcon);
    }

    /**
     * Create right sidebar for fish status
     */
    private createRightSidebar(): void {
        const gap = 10;
        const sidebarWidth = 300;
        const sidebarX = this.canvasWidth - sidebarWidth - gap;
        const sidebarY = 50 + gap;
        const sidebarHeight = this.canvasHeight - sidebarY - gap;

        // Semi-transparent background
        this.sidebarBg = this.add.graphics();
        this.sidebarBg.fillStyle(0x000000, 0.65);
        this.sidebarBg.fillRect(sidebarX, sidebarY, sidebarWidth, sidebarHeight);
        this.sidebarBg.lineStyle(2, 0xffaa00, 1.0);
        this.sidebarBg.strokeRect(sidebarX, sidebarY, sidebarWidth, sidebarHeight);
        this.fishStatusContainer.add(this.sidebarBg);

        // Header
        const headerStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontSize: '13px',
            fontFamily: 'Courier New',
            color: '#ffaa00',
            fontStyle: 'bold'
        };

        this.sidebarHeader = this.add.text(sidebarX + 10, sidebarY + 8, 'FISH STATUS:', headerStyle);
        this.fishStatusContainer.add(this.sidebarHeader);

        // Entity counts
        const countStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontSize: '13px',
            fontFamily: 'Courier New',
            color: '#88ff88'
        };

        this.entityCountText = this.add.text(sidebarX + 140, sidebarY + 8, '', countStyle);
        this.fishStatusContainer.add(this.entityCountText);

        // Fish list container
        this.fishListContainer = this.add.container(sidebarX, sidebarY + 35);
        this.fishStatusContainer.add(this.fishListContainer);

        // Fish detail panel
        const detailPanelY = this.canvasHeight - 200 - gap;

        this.detailPanelBg = this.add.graphics();
        this.detailPanelBg.fillStyle(0x0a0a0a, 0.65);
        this.detailPanelBg.lineStyle(2, 0x00ff00, 1.0);
        this.detailPanelBg.fillRect(sidebarX, detailPanelY, sidebarWidth, 200);
        this.detailPanelBg.strokeRect(sidebarX, detailPanelY, sidebarWidth, 200);
        this.fishStatusContainer.add(this.detailPanelBg);

        // Fish detail container
        this.fishDetailContainer = this.add.container(sidebarX + 10, detailPanelY + 10);
        this.fishStatusContainer.add(this.fishDetailContainer);

        // Initially visible
        this.sidebarVisible = true;
    }

    /**
     * Update meter fill based on percentage
     */
    private updateMeter(meter: Meter, percent: number): void {
        if (!meter) return;

        const clampedPercent = Math.max(0, Math.min(1, percent));
        const fillWidth = meter.maxWidth * clampedPercent;

        meter.fill.setDisplaySize(fillWidth, meter.fill.displayHeight);
        meter.percent.setText(Math.floor(clampedPercent * 100) + '%');

        // Color percent text based on value
        const effectivePercent = meter.reversed ? (1 - clampedPercent) : clampedPercent;

        if (effectivePercent < 0.5) {
            meter.percent.setColor('#00ff00');
        } else if (effectivePercent < 0.8) {
            meter.percent.setColor('#ffff00');
        } else {
            meter.percent.setColor('#ff0000');
        }
    }

    /**
     * Handle data changes from game registry
     */
    private handleDataChange(parent: Phaser.Data.DataManager, key: string, value: any): void {
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
                this.updateFishList(value);
                break;
            case 'fishDetail':
                this.updateFishDetail(value);
                break;
        }
    }

    /**
     * Update fish list with styled rows
     */
    private updateFishList(fishListData: FishListItem[] | null): void {
        // Clear existing rows
        this.fishListContainer.removeAll(true);
        this.fishRows = [];

        if (!fishListData || !Array.isArray(fishListData) || fishListData.length === 0) {
            const emptyText = this.add.text(10, 0, 'No fish spawned', {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#666666',
                fontStyle: 'italic'
            });
            this.fishListContainer.add(emptyText);
            this.fishRows.push(emptyText);
            return;
        }

        let yOffset = 0;

        // Render header
        const headerText = this.add.text(10, yOffset, 'NAME     F    WT   STATE      H/H     DEPTH  ATE', {
            fontSize: '9px',
            fontFamily: 'Courier New',
            color: '#888888'
        });
        this.fishListContainer.add(headerText);
        this.fishRows.push(headerText);
        yOffset += 15;

        // Render each fish row
        fishListData.forEach((fish) => {
            // Create background for selected fish
            if (fish.isSelected) {
                const bg = this.add.rectangle(10, yOffset + 6, 280, 12, 0x00ff00, 0.3);
                bg.setOrigin(0, 0.5);
                this.fishListContainer.add(bg);
            }

            // Format row data
            const name = fish.name.substring(0, 8).padEnd(8, ' ');
            const gender = fish.gender === 'male' ? '♂' : '♀';
            const weight = fish.weight ? fish.weight.toFixed(1).padStart(4, ' ') : '  ?';
            const state = fish.state.substring(0, 10).padEnd(10, ' ');
            const hunger = Math.floor(fish.hunger).toString().padStart(2, ' ');
            const health = Math.floor(fish.health).toString().padStart(2, ' ');
            const depth = Math.floor(fish.depth).toString().padStart(4, ' ') + 'ft';
            const ate = fish.baitfishEaten.toString().padStart(3, ' ');

            // Determine colors
            const nameColor = fish.isSelected ? '#ffffff' : '#aaaaaa';
            const stateColor = '#00ffff';
            const hungerColor = fish.hunger > 70 ? '#ff4444' : fish.hunger > 40 ? '#ffaa00' : '#00ff00';
            const healthColor = fish.health < 40 ? '#ff4444' : fish.health < 70 ? '#ffaa00' : '#00ff00';
            const depthColor = '#00ff00';
            const ateColor = '#ffaa00';

            let xPos = 10;

            // Name
            const nameText = this.add.text(xPos, yOffset, name, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: nameColor
            });
            this.fishListContainer.add(nameText);
            xPos += 55;

            // Gender
            const genderText = this.add.text(xPos, yOffset, gender, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: nameColor
            });
            this.fishListContainer.add(genderText);
            xPos += 15;

            // Weight
            const weightText = this.add.text(xPos, yOffset, weight, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#ffffff'
            });
            this.fishListContainer.add(weightText);
            xPos += 35;

            // State
            const stateText = this.add.text(xPos, yOffset, state, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: stateColor
            });
            this.fishListContainer.add(stateText);
            xPos += 68;

            // Hunger/Health
            const hhText = this.add.text(xPos, yOffset, `${hunger}/${health}`, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: hungerColor
            });
            this.fishListContainer.add(hhText);
            xPos += 40;

            // Depth
            const depthText = this.add.text(xPos, yOffset, depth, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: depthColor
            });
            this.fishListContainer.add(depthText);
            xPos += 45;

            // Ate
            const ateText = this.add.text(xPos, yOffset, ate, {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: ateColor
            });
            this.fishListContainer.add(ateText);

            yOffset += 12;
        });
    }

    /**
     * Update fish detail section
     */
    private updateFishDetail(detailData: FishDetailData | string | null): void {
        // Clear existing detail elements
        this.fishDetailContainer.removeAll(true);
        this.fishDetailElements = [];

        if (!detailData || typeof detailData === 'string') {
            const emptyText = this.add.text(0, 0, detailData || 'No fish to display', {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#666666',
                fontStyle: 'italic'
            });
            this.fishDetailContainer.add(emptyText);
            this.fishDetailElements.push(emptyText);
            return;
        }

        let yOffset = 0;

        // Title
        const titleText = this.add.text(0, yOffset, detailData.name, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        this.fishDetailContainer.add(titleText);
        this.fishDetailElements.push(titleText);
        yOffset += 20;

        // Row 1: Weight and Length
        const row1 = this.add.text(0, yOffset,
            `Weight: ${detailData.weight}       Length: ${detailData.length}`, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#aaaaaa'
        });
        this.fishDetailContainer.add(row1);
        this.fishDetailElements.push(row1);
        yOffset += 14;

        // Row 2: Gender and Age
        const row2 = this.add.text(0, yOffset,
            `Gender: ${detailData.gender}        Age: ${detailData.age}`, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#aaaaaa'
        });
        this.fishDetailContainer.add(row2);
        this.fishDetailElements.push(row2);
        yOffset += 14;

        // Row 3: Depth and Zone
        const row3 = this.add.text(0, yOffset,
            `Depth: ${detailData.depth}           Zone: ${detailData.zone}`, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#aaaaaa'
        });
        this.fishDetailContainer.add(row3);
        this.fishDetailElements.push(row3);
        yOffset += 14;

        // Row 4: Hunger and Health
        const row4 = this.add.text(0, yOffset,
            `Hunger: ${detailData.hunger}            Health: ${detailData.health}`, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#aaaaaa'
        });
        this.fishDetailContainer.add(row4);
        this.fishDetailElements.push(row4);
        yOffset += 14;

        // Row 5: State label and Frenzy
        const row5 = this.add.text(0, yOffset,
            `State:                  Frenzy: ${detailData.frenzy}`, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#aaaaaa'
        });
        this.fishDetailContainer.add(row5);
        this.fishDetailElements.push(row5);
        yOffset += 14;

        // Row 6: State value
        const row6 = this.add.text(0, yOffset, detailData.state, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#00ffff'
        });
        this.fishDetailContainer.add(row6);
        this.fishDetailElements.push(row6);
        yOffset += 14;

        // Row 7: Baitfish Eaten and Speed
        const row7 = this.add.text(0, yOffset,
            `Baitfish Eaten: ${detailData.baitfishEaten}    Speed: ${detailData.speed}`, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#aaaaaa'
        });
        this.fishDetailContainer.add(row7);
        this.fishDetailElements.push(row7);
    }

    /**
     * Toggle top bar visibility
     */
    private toggleTopBar(): void {
        this.topBarVisible = !this.topBarVisible;
        this.topBarContainer.setVisible(this.topBarVisible);
        console.log(this.topBarVisible ? '📊 Top bar visible' : '🎬 Top bar hidden');
    }

    /**
     * Toggle sidebar visibility
     */
    private toggleSidebar(): void {
        this.sidebarVisible = !this.sidebarVisible;
        this.fishStatusContainer.setVisible(this.sidebarVisible);
        console.log(this.sidebarVisible ? '📊 Sidebar visible' : '🎬 Sidebar hidden');
    }

    /**
     * Handle resize
     */
    private handleResize(gameSize: Phaser.Structs.Size): void {
        this.canvasWidth = gameSize.width;
        this.canvasHeight = gameSize.height;

        // Redraw top bar
        this.topBarBg.clear();
        this.topBarBg.fillStyle(0x000000, 0.75);
        this.topBarBg.fillRect(0, 0, this.canvasWidth, 50);

        // Reposition/redraw sidebar
        const gap = 10;
        const sidebarWidth = 300;
        const sidebarX = this.canvasWidth - sidebarWidth - gap;
        const sidebarY = 50 + gap;
        const sidebarHeight = this.canvasHeight - sidebarY - gap;

        this.sidebarBg.clear();
        this.sidebarBg.fillStyle(0x000000, 0.65);
        this.sidebarBg.fillRect(sidebarX, sidebarY, sidebarWidth, sidebarHeight);
        this.sidebarBg.lineStyle(2, 0xffaa00, 1.0);
        this.sidebarBg.strokeRect(sidebarX, sidebarY, sidebarWidth, sidebarHeight);

        this.sidebarHeader.setPosition(sidebarX + 10, sidebarY + 8);
        this.entityCountText.setPosition(sidebarX + 140, sidebarY + 8);
        this.fishListContainer.setPosition(sidebarX, sidebarY + 35);

        const detailPanelY = this.canvasHeight - 200 - gap;
        this.detailPanelBg.clear();
        this.detailPanelBg.fillStyle(0x0a0a0a, 0.65);
        this.detailPanelBg.lineStyle(2, 0x00ff00, 1.0);
        this.detailPanelBg.fillRect(sidebarX, detailPanelY, sidebarWidth, 200);
        this.detailPanelBg.strokeRect(sidebarX, detailPanelY, sidebarWidth, 200);

        this.fishDetailContainer.setPosition(sidebarX + 10, detailPanelY + 10);

        // Reposition time display
        if (this.valueDisplays.time) {
            const timeX = this.canvasWidth - 180;
            this.valueDisplays.time.setX(timeX);
        }

        // Reposition icons
        if (this.gamepadIcon) {
            this.gamepadIcon.setX(this.canvasWidth - 80);
        }
        if (this.bookIcon) {
            this.bookIcon.setX(this.canvasWidth - 50);
        }
    }

    /**
     * Clean up
     */
    shutdown(): void {
        this.registry.events.off('changedata', this.handleDataChange, this);
        this.scale.off('resize', this.handleResize, this);
    }
}
