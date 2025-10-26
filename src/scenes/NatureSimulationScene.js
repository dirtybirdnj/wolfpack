import GameConfig from '../config/GameConfig.js';
import SonarDisplay from '../utils/SonarDisplay.js';
import Fish from '../entities/Fish.js';
import BaitfishCloud from '../entities/BaitfishCloud.js';
import SpawningSystem from './systems/SpawningSystem.js';
import DebugSystem from './systems/DebugSystem.js';

/**
 * NatureSimulationScene - Observe fish AI behavior without player interaction
 *
 * This mode allows players to:
 * - Select water depth (10-100 feet)
 * - Observe natural fish, baitfish, and zooplankton behavior
 * - Debug and understand AI systems
 * - No lure, no player - pure observation
 */
export class NatureSimulationScene extends Phaser.Scene {
    constructor() {
        super({ key: 'NatureSimulationScene' });

        // Entity arrays
        this.fishes = [];
        this.baitfishClouds = [];
        this.zooplankton = [];

        // Simulation state
        this.waterTemp = 40;
        this.debugMode = true; // Always show debug info in nature mode
        this.selectedDepth = 50; // Default depth
        this.depthSelectionActive = true; // Show depth selection UI
        this.gameTime = 0;
    }

    create() {
        console.log('Nature Simulation Mode - Observing AI behavior');

        // Set initial depth (can be changed via UI)
        this.maxDepth = this.selectedDepth;

        // Calculate depth scale
        this.updateDepthScale();

        // Set up the sonar display (no fishing type, just observation)
        this.sonarDisplay = new SonarDisplay(this, 'observation');

        // Set water temperature based on season (use winter temps by default)
        this.waterTemp = Phaser.Math.Between(
            GameConfig.WATER_TEMP_MIN,
            GameConfig.WATER_TEMP_MAX
        );

        // Initialize spawning system (no lure, so pass null)
        this.spawningSystem = new SpawningSystem(this, null);

        // Initialize debug system
        this.debugSystem = new DebugSystem(this);

        // Create depth selection UI
        this.createDepthSelectionUI();

        // Create info text
        this.createInfoText();

        // Set up keyboard controls
        this.setupControls();

        // Start spawning after a short delay
        this.time.delayedCall(1000, () => {
            console.log('Starting nature simulation...');
        });

        // Update timer
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.gameTime++;
            },
            loop: true
        });
    }

    updateDepthScale() {
        // Calculate dynamic depth scale to keep bottom at consistent screen position
        const TARGET_BOTTOM_RATIO = 0.85;
        const MIN_DISPLAY_RANGE = 175;

        const idealDisplayRange = this.maxDepth / TARGET_BOTTOM_RATIO;
        const displayRange = Math.max(idealDisplayRange, MIN_DISPLAY_RANGE);

        GameConfig.DEPTH_SCALE = GameConfig.CANVAS_HEIGHT / displayRange;
        this.displayRange = displayRange;

        console.log(`Depth set to ${this.maxDepth}ft (${GameConfig.DEPTH_SCALE.toFixed(2)} px/ft)`);
    }

    createDepthSelectionUI() {
        const { width, height } = this.cameras.main;

        // Semi-transparent background panel
        this.depthPanel = this.add.graphics();
        this.depthPanel.fillStyle(0x1a2a3a, 0.95);
        this.depthPanel.fillRoundedRect(width / 2 - 280, 20, 560, 180, 10);
        this.depthPanel.lineStyle(2, 0x00ff00, 1);
        this.depthPanel.strokeRoundedRect(width / 2 - 280, 20, 560, 180, 10);

        // Title
        this.add.text(width / 2, 45, 'NATURE SIMULATION - SELECT WATER DEPTH', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Depth buttons container
        const buttonY = 90;
        const buttonSpacing = 52;
        const startX = width / 2 - 260;

        this.depthButtons = [];
        const depthOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

        depthOptions.forEach((depth, index) => {
            const x = startX + (index * buttonSpacing);
            const button = this.createDepthButton(x, buttonY, depth);
            this.depthButtons.push(button);
        });

        // Random depth button
        const randomButton = this.createDepthButton(width / 2, 145, 'RANDOM', true);
        this.depthButtons.push(randomButton);

        // Instructions
        this.add.text(width / 2, 175, 'Click a depth to begin observation | ESC to return to menu', {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#88ff88',
            align: 'center'
        }).setOrigin(0.5);
    }

    createDepthButton(x, y, depth, isRandom = false) {
        const container = this.add.container(x, y);
        const btnWidth = isRandom ? 100 : 45;
        const btnHeight = 35;

        // Button background
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x2a4a3a, 1);
        btnBg.lineStyle(2, 0x00ff00, 1);
        btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 5);
        btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 5);

        // Button text
        const btnText = this.add.text(0, 0, isRandom ? depth : `${depth}ft`, {
            fontSize: isRandom ? '14px' : '13px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([btnBg, btnText]);
        container.btnBg = btnBg;
        container.btnText = btnText;
        container.btnWidth = btnWidth;
        container.btnHeight = btnHeight;
        container.depth = depth;
        container.isRandom = isRandom;

        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
        container.setSize(btnWidth, btnHeight);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        // Hover effects
        container.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0x3a5a4a, 1);
            btnBg.lineStyle(3, 0x00ffff, 1);
            btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 5);
            btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 5);
            btnText.setColor('#00ffff');
        });

        container.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0x2a4a3a, 1);
            btnBg.lineStyle(2, 0x00ff00, 1);
            btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 5);
            btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 5);
            btnText.setColor('#00ff00');
        });

        container.on('pointerdown', () => {
            this.selectDepth(isRandom ? Phaser.Math.Between(10, 100) : depth);
        });

        return container;
    }

    selectDepth(depth) {
        this.selectedDepth = depth;
        this.maxDepth = depth;
        this.updateDepthScale();

        // Hide depth selection UI
        this.depthSelectionActive = false;
        this.depthPanel.destroy();
        this.depthButtons.forEach(btn => btn.destroy());

        // Update sonar display with new depth
        if (this.sonarDisplay) {
            this.sonarDisplay.destroy();
            this.sonarDisplay = new SonarDisplay(this, 'observation');
        }

        // Update info text
        if (this.infoText) {
            this.infoText.destroy();
            this.createInfoText();
        }

        console.log(`Nature simulation started at ${depth}ft depth`);
    }

    createInfoText() {
        const { width } = this.cameras.main;

        // Info panel at top
        this.infoText = this.add.text(width / 2, 30, '', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            backgroundColor: '#1a2a3a',
            padding: { x: 15, y: 8 },
            align: 'center'
        }).setOrigin(0.5);

        this.updateInfoText();
    }

    updateInfoText() {
        if (!this.infoText || this.depthSelectionActive) return;

        const minutes = Math.floor(this.gameTime / 60);
        const secs = this.gameTime % 60;
        const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;

        const fishCount = this.fishes.length;
        const baitfishCount = this.baitfishClouds.length;
        const zooplanktonCount = this.zooplankton.length;

        this.infoText.setText([
            `NATURE SIMULATION | Depth: ${this.maxDepth}ft | Temp: ${this.waterTemp}°F | Time: ${timeStr}`,
            `Fish: ${fishCount} | Baitfish Schools: ${baitfishCount} | Zooplankton: ${zooplanktonCount}`,
            'ESC: Menu | D: Toggle Debug | SPACE: Spawn Fish'
        ].join('\n'));
    }

    setupControls() {
        // ESC to return to menu
        this.input.keyboard.on('keydown-ESC', () => {
            console.log('Returning to menu...');
            this.scene.start('MenuScene');
        });

        // D to toggle debug mode
        this.input.keyboard.on('keydown-D', () => {
            this.debugMode = !this.debugMode;
            console.log('Debug mode:', this.debugMode ? 'ON' : 'OFF');
        });

        // SPACE to manually spawn a fish (for testing)
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.depthSelectionActive) {
                this.trySpawnFish();
                console.log('Manually spawned fish');
            }
        });

        // B to spawn baitfish
        this.input.keyboard.on('keydown-B', () => {
            if (!this.depthSelectionActive) {
                this.trySpawnBaitfishCloud();
                console.log('Manually spawned baitfish cloud');
            }
        });
    }

    trySpawnFish() {
        // Spawn a fish using the spawning system
        if (this.spawningSystem) {
            this.spawningSystem.trySpawnFish();
        }
    }

    trySpawnBaitfishCloud() {
        // Spawn a baitfish cloud using the spawning system
        if (this.spawningSystem) {
            this.spawningSystem.trySpawnBaitfishCloud();
        }
    }

    update(time, delta) {
        if (this.depthSelectionActive) {
            // Don't update simulation while selecting depth
            return;
        }

        // Update info text
        if (this.frameCount % 10 === 0) {
            this.updateInfoText();
        }
        this.frameCount = (this.frameCount || 0) + 1;

        // Update sonar display
        if (this.sonarDisplay) {
            this.sonarDisplay.update();
        }

        // Update spawning system (fish, baitfish, zooplankton)
        if (this.spawningSystem) {
            this.spawningSystem.update();
        }

        // Update all fish
        this.fishes.forEach(fish => {
            if (fish.active) {
                // Fish update their own AI and movement
                fish.update();
            }
        });

        // Update all baitfish clouds
        this.baitfishClouds.forEach(cloud => {
            if (cloud.active) {
                cloud.update();
            }
        });

        // Update all zooplankton
        this.zooplankton.forEach(plankton => {
            if (plankton.active) {
                plankton.update();
            }
        });

        // Update debug system
        if (this.debugSystem) {
            this.debugSystem.update();
        }

        // Clean up destroyed entities
        this.fishes = this.fishes.filter(f => f.active);
        this.baitfishClouds = this.baitfishClouds.filter(c => c.active);
        this.zooplankton = this.zooplankton.filter(p => p.active);
    }
}

export default NatureSimulationScene;
