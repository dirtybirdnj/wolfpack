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
        this.crayfish = [];

        // Simulation state
        this.waterTemp = 40;
        this.debugMode = true; // Always show debug info in nature mode
        this.selectedDepth = 80; // Default depth (80ft is typical for Lake Champlain)
        this.depthSelectionActive = true; // Show depth selection UI
        this.gameTime = 0;
        this.selectedButtonIndex = 7; // Start with 80ft button selected (index 7)
    }

    create() {
        console.log('Nature Simulation Mode - Observing AI behavior');

        // Set initial depth (can be changed via UI)
        this.maxDepth = this.selectedDepth;

        // Set up the sonar display (no fishing type, just observation)
        // SonarDisplay will calculate dynamic depth scale based on maxDepth
        this.sonarDisplay = new SonarDisplay(this, 'observation');

        // Set water temperature based on season (use winter temps by default)
        this.waterTemp = Phaser.Math.Between(
            GameConfig.WATER_TEMP_MIN,
            GameConfig.WATER_TEMP_MAX
        );

        // Initialize spawning system (no lure needed in nature mode)
        this.spawningSystem = new SpawningSystem(this);

        // Initialize debug system (always enabled in nature mode for observation)
        this.debugSystem = new DebugSystem(this);
        this.debugSystem.setEnabled(true);

        // Create depth selection UI (hidden initially)
        this.createDepthSelectionUI();
        this.hideDepthSelectionUI();

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

    createDepthSelectionUI() {
        const { width, height } = this.cameras.main;

        // Semi-transparent background panel (expanded height for temperature slider)
        this.depthPanel = this.add.graphics();
        this.depthPanel.fillStyle(0x1a2a3a, 0.95);
        this.depthPanel.fillRoundedRect(width / 2 - 280, 20, 560, 230, 10);
        this.depthPanel.lineStyle(2, 0x00ff00, 1);
        this.depthPanel.strokeRoundedRect(width / 2 - 280, 20, 560, 230, 10);

        // Title
        this.depthTitle = this.add.text(width / 2, 45, 'NATURE SIMULATION - SELECT WATER DEPTH & TEMPERATURE', {
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
        const randomButton = this.createDepthButton(width / 2, 140, 'RANDOM', true);
        this.depthButtons.push(randomButton);

        // Temperature slider
        this.createTemperatureSlider(width, 170);

        // Instructions
        this.depthInstructions = this.add.text(width / 2, 220, 'Arrow Keys/D-Pad: Navigate | Enter/A: Select | Drag slider for temp | ESC: Close', {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#88ff88',
            align: 'center'
        }).setOrigin(0.5);

        // Highlight first button by default
        this.updateDepthButtonSelection();
    }

    createTemperatureSlider(width, y) {
        // Lake Champlain temperature range: 32°F (winter) to 75°F (summer)
        const minTemp = 32;
        const maxTemp = 75;
        const sliderWidth = 400;
        const sliderX = width / 2 - sliderWidth / 2;

        // Label
        this.tempLabel = this.add.text(width / 2, y, `Water Temp: ${Math.floor(this.waterTemp)}°F`, {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Slider track
        const trackY = y + 20;
        const trackGraphics = this.add.graphics();
        trackGraphics.fillStyle(0x2a4a3a, 1);
        trackGraphics.fillRoundedRect(sliderX, trackY - 3, sliderWidth, 6, 3);
        trackGraphics.lineStyle(1, 0x00ff00, 1);
        trackGraphics.strokeRoundedRect(sliderX, trackY - 3, sliderWidth, 6, 3);

        // Slider handle
        const handleX = sliderX + ((this.waterTemp - minTemp) / (maxTemp - minTemp)) * sliderWidth;
        const handle = this.add.circle(handleX, trackY, 8, 0x00ffff);
        handle.setStrokeStyle(2, 0x00ff00);
        handle.setInteractive({ draggable: true });

        // Store in container for easy show/hide
        this.tempSliderContainer = this.add.container(0, 0, [trackGraphics, handle]);

        // Drag handler
        this.input.on('drag', (pointer, gameObject, dragX) => {
            if (gameObject !== handle) return;

            // Constrain to slider bounds
            const newX = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderWidth);
            handle.x = newX;

            // Calculate temperature
            const ratio = (newX - sliderX) / sliderWidth;
            this.waterTemp = minTemp + (ratio * (maxTemp - minTemp));

            // Update label
            this.tempLabel.setText(`Water Temp: ${Math.floor(this.waterTemp)}°F`);
        });

        // Temperature markers
        const markers = [32, 40, 50, 60, 70, 75];
        markers.forEach(temp => {
            const markerX = sliderX + ((temp - minTemp) / (maxTemp - minTemp)) * sliderWidth;
            const markerGraphics = this.add.graphics();
            markerGraphics.lineStyle(1, 0x888888, 1);
            markerGraphics.lineBetween(markerX, trackY - 10, markerX, trackY - 15);

            const markerText = this.add.text(markerX, trackY + 12, `${temp}°`, {
                fontSize: '8px',
                fontFamily: 'Courier New',
                color: '#888888'
            }).setOrigin(0.5);

            this.tempSliderContainer.add([markerGraphics, markerText]);
        });
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

    updateDepthButtonSelection() {
        if (!this.depthButtons || this.depthButtons.length === 0) return;

        // Clear all button highlights
        this.depthButtons.forEach((btn, index) => {
            const isSelected = index === this.selectedButtonIndex;
            btn.btnBg.clear();
            btn.btnBg.fillStyle(isSelected ? 0x3a5a4a : 0x2a4a3a, 1);
            btn.btnBg.lineStyle(isSelected ? 3 : 2, isSelected ? 0x00ffff : 0x00ff00, 1);
            btn.btnBg.fillRoundedRect(-btn.btnWidth / 2, -btn.btnHeight / 2, btn.btnWidth, btn.btnHeight, 5);
            btn.btnBg.strokeRoundedRect(-btn.btnWidth / 2, -btn.btnHeight / 2, btn.btnWidth, btn.btnHeight, 5);
            btn.btnText.setColor(isSelected ? '#00ffff' : '#00ff00');
        });
    }

    selectDepth(depth) {
        this.selectedDepth = depth;
        this.maxDepth = depth;

        // Hide depth selection UI
        this.hideDepthSelectionUI();

        // Update sonar display with new depth
        // SonarDisplay will automatically calculate correct dynamic depth scale
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

    hideDepthSelectionUI() {
        if (!this.depthSelectionActive) return;

        this.depthSelectionActive = false;
        if (this.depthPanel) this.depthPanel.setVisible(false);
        if (this.depthTitle) this.depthTitle.setVisible(false);
        if (this.depthInstructions) this.depthInstructions.setVisible(false);
        if (this.tempSliderContainer) this.tempSliderContainer.setVisible(false);
        if (this.tempLabel) this.tempLabel.setVisible(false);
        if (this.depthButtons) {
            this.depthButtons.forEach(btn => btn.setVisible(false));
        }
    }

    showDepthSelectionUI() {
        this.depthSelectionActive = true;
        if (this.depthPanel) this.depthPanel.setVisible(true);
        if (this.depthTitle) this.depthTitle.setVisible(true);
        if (this.depthInstructions) this.depthInstructions.setVisible(true);
        if (this.tempSliderContainer) this.tempSliderContainer.setVisible(true);
        if (this.tempLabel) this.tempLabel.setVisible(true);
        if (this.depthButtons) {
            this.depthButtons.forEach(btn => btn.setVisible(true));
        }
    }

    toggleDepthSelectionUI() {
        if (this.depthSelectionActive) {
            this.hideDepthSelectionUI();
        } else {
            this.showDepthSelectionUI();
        }
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

        // Show different controls based on whether gamepad is connected
        let controlsText = 'ESC: Menu | D: Toggle Debug | SPACE: Spawn Fish | B: Spawn Baitfish';
        if (this.gamepadDetected && window.gamepadManager && window.gamepadManager.isConnected()) {
            controlsText = 'Start: Menu | D: Debug | X: Spawn Fish | Y: Spawn Baitfish';
        }

        this.infoText.setText([
            `NATURE SIMULATION | Depth: ${this.maxDepth}ft | Temp: ${this.waterTemp}°F | Time: ${timeStr}`,
            `Fish: ${fishCount} | Baitfish Schools: ${baitfishCount} | Zooplankton: ${zooplanktonCount}`,
            controlsText
        ].join('\n'));
    }

    setupControls() {
        // Set up keyboard cursors
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // ESC to return to menu
        this.input.keyboard.on('keydown-ESC', () => {
            console.log('Returning to menu...');
            this.scene.start('MenuScene');
        });

        // D to toggle debug mode (only when not in depth selection)
        this.input.keyboard.on('keydown-D', () => {
            if (!this.depthSelectionActive && this.debugSystem) {
                this.debugMode = !this.debugMode;
                this.debugSystem.setEnabled(this.debugMode);
                console.log('Debug mode:', this.debugMode ? 'ON' : 'OFF');
            }
        });

        // B to spawn baitfish (only when not in depth selection)
        this.input.keyboard.on('keydown-B', () => {
            if (!this.depthSelectionActive) {
                this.trySpawnBaitfishCloud();
                console.log('Manually spawned baitfish cloud');
            }
        });

        // Check for gamepad
        this.gamepadDetected = false;
        if (window.gamepadManager && window.gamepadManager.isConnected()) {
            this.gamepadDetected = true;

            // Setup gamepad state tracking
            this.gamepadState = {
                lastDpadLeft: false,
                lastDpadRight: false,
                lastDpadUp: false,
                lastDpadDown: false,
                lastA: false,
                lastX: false,
                lastY: false,
                lastStart: false,
                lastAnalogLeft: false,
                lastAnalogRight: false,
                lastAnalogUp: false,
                lastAnalogDown: false
            };
        }
    }

    trySpawnFish() {
        // Spawn a fish using the spawning system with random species
        if (this.spawningSystem) {
            try {
                const fish = this.spawningSystem.trySpawnFish();
                if (fish) {
                    // Defensive check: only log full details if it's actually a fish with weight/species
                    if (fish.weight !== undefined && fish.species) {
                        console.log(`✓ Spawned ${fish.species} (${fish.weight.toFixed(1)}lbs) at ${fish.depth.toFixed(1)}ft`);
                    } else {
                        console.log(`✓ Spawned organism at ${fish.depth?.toFixed(1) || 'unknown'}ft`);
                    }
                } else {
                    console.log('⚠️ Could not spawn fish (water may be too shallow for selected species, trying again...)');
                    // Try again with potentially different species
                    const retryFish = this.spawningSystem.trySpawnFish();
                    if (retryFish) {
                        if (retryFish.weight !== undefined && retryFish.species) {
                            console.log(`✓ Spawned ${retryFish.species} (${retryFish.weight.toFixed(1)}lbs) at ${retryFish.depth.toFixed(1)}ft`);
                        } else {
                            console.log(`✓ Spawned organism at ${retryFish.depth?.toFixed(1) || 'unknown'}ft`);
                        }
                    }
                }
            } catch (error) {
                console.error('Error spawning fish:', error);
            }
        }
    }

    trySpawnBaitfishCloud() {
        // Spawn a baitfish cloud using the spawning system with random species
        if (this.spawningSystem) {
            try {
                const cloud = this.spawningSystem.trySpawnBaitfishCloud();
                if (cloud) {
                    console.log(`✓ Spawned ${cloud.speciesType} school (${cloud.initialCount} fish) at ${cloud.depth.toFixed(1)}ft`);
                } else {
                    console.log('⚠️ Could not spawn baitfish (max clouds reached)');
                }
            } catch (error) {
                console.error('Error spawning baitfish:', error);
            }
        }
    }

    handleDepthSelectionInput() {
        // Handle keyboard navigation
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            if (this.selectedButtonIndex > 0) {
                this.selectedButtonIndex--;
                this.updateDepthButtonSelection();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            if (this.selectedButtonIndex < this.depthButtons.length - 1) {
                this.selectedButtonIndex++;
                this.updateDepthButtonSelection();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            // Move up a row (10 buttons in top row, 1 in bottom)
            if (this.selectedButtonIndex === 10) {
                // From RANDOM button to middle of top row
                this.selectedButtonIndex = 5;
                this.updateDepthButtonSelection();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            // Move down a row
            if (this.selectedButtonIndex < 10) {
                // From top row to RANDOM button
                this.selectedButtonIndex = 10;
                this.updateDepthButtonSelection();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.enterKey) ||
            Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            const selectedButton = this.depthButtons[this.selectedButtonIndex];
            if (selectedButton) {
                const depth = selectedButton.isRandom ?
                    Phaser.Math.Between(10, 100) :
                    selectedButton.depth;
                this.selectDepth(depth);
            }
        }

        // Handle gamepad navigation
        if (this.gamepadDetected && window.gamepadManager && window.gamepadManager.isConnected()) {
            // D-Pad navigation
            const dpadLeft = window.gamepadManager.getButton('DpadLeft');
            const dpadRight = window.gamepadManager.getButton('DpadRight');
            const dpadUp = window.gamepadManager.getButton('DpadUp');
            const dpadDown = window.gamepadManager.getButton('DpadDown');

            if (dpadLeft.pressed && !this.gamepadState.lastDpadLeft) {
                if (this.selectedButtonIndex > 0) {
                    this.selectedButtonIndex--;
                    this.updateDepthButtonSelection();
                }
            }

            if (dpadRight.pressed && !this.gamepadState.lastDpadRight) {
                if (this.selectedButtonIndex < this.depthButtons.length - 1) {
                    this.selectedButtonIndex++;
                    this.updateDepthButtonSelection();
                }
            }

            if (dpadUp.pressed && !this.gamepadState.lastDpadUp) {
                if (this.selectedButtonIndex === 10) {
                    this.selectedButtonIndex = 5;
                    this.updateDepthButtonSelection();
                }
            }

            if (dpadDown.pressed && !this.gamepadState.lastDpadDown) {
                if (this.selectedButtonIndex < 10) {
                    this.selectedButtonIndex = 10;
                    this.updateDepthButtonSelection();
                }
            }

            this.gamepadState.lastDpadLeft = dpadLeft.pressed;
            this.gamepadState.lastDpadRight = dpadRight.pressed;
            this.gamepadState.lastDpadUp = dpadUp.pressed;
            this.gamepadState.lastDpadDown = dpadDown.pressed;

            // Analog stick navigation
            const leftStickX = window.gamepadManager.getAxis('LeftStickX');
            const leftStickY = window.gamepadManager.getAxis('LeftStickY');
            const analogThreshold = 0.5;

            const analogLeft = leftStickX < -analogThreshold;
            const analogRight = leftStickX > analogThreshold;
            const analogUp = leftStickY < -analogThreshold;
            const analogDown = leftStickY > analogThreshold;

            if (analogLeft && !this.gamepadState.lastAnalogLeft) {
                if (this.selectedButtonIndex > 0) {
                    this.selectedButtonIndex--;
                    this.updateDepthButtonSelection();
                }
            }

            if (analogRight && !this.gamepadState.lastAnalogRight) {
                if (this.selectedButtonIndex < this.depthButtons.length - 1) {
                    this.selectedButtonIndex++;
                    this.updateDepthButtonSelection();
                }
            }

            if (analogUp && !this.gamepadState.lastAnalogUp) {
                if (this.selectedButtonIndex === 10) {
                    this.selectedButtonIndex = 5;
                    this.updateDepthButtonSelection();
                }
            }

            if (analogDown && !this.gamepadState.lastAnalogDown) {
                if (this.selectedButtonIndex < 10) {
                    this.selectedButtonIndex = 10;
                    this.updateDepthButtonSelection();
                }
            }

            this.gamepadState.lastAnalogLeft = analogLeft;
            this.gamepadState.lastAnalogRight = analogRight;
            this.gamepadState.lastAnalogUp = analogUp;
            this.gamepadState.lastAnalogDown = analogDown;

            // Confirm with A or X button
            const aButton = window.gamepadManager.getButton('A');
            const xButton = window.gamepadManager.getButton('X');

            if ((aButton.pressed && !this.gamepadState.lastA) ||
                (xButton.pressed && !this.gamepadState.lastX)) {
                const selectedButton = this.depthButtons[this.selectedButtonIndex];
                if (selectedButton) {
                    const depth = selectedButton.isRandom ?
                        Phaser.Math.Between(10, 100) :
                        selectedButton.depth;
                    this.selectDepth(depth);
                }
            }

            this.gamepadState.lastA = aButton.pressed;
            this.gamepadState.lastX = xButton.pressed;
        }
    }

    update(time, delta) {
        if (this.depthSelectionActive) {
            // Handle keyboard navigation during depth selection
            this.handleDepthSelectionInput();
            return;
        }

        // Handle SPACE to spawn fish manually (only when not in depth selection)
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.trySpawnFish();
        }

        // Handle gamepad controls for spawning
        if (this.gamepadDetected && window.gamepadManager && window.gamepadManager.isConnected()) {
            const xButton = window.gamepadManager.getButton('X');
            const yButton = window.gamepadManager.getButton('Y');
            const startButton = window.gamepadManager.getButton('Start');

            // X button to spawn fish (like SPACE)
            if (xButton.pressed && !this.gamepadState.lastX) {
                this.trySpawnFish();
            }

            // Y button to spawn baitfish (like B key)
            if (yButton.pressed && !this.gamepadState.lastY) {
                this.trySpawnBaitfishCloud();
            }

            // Start button to return to menu (like ESC)
            if (startButton.pressed && !this.gamepadState.lastStart) {
                console.log('Returning to menu...');
                this.scene.start('MenuScene');
            }

            this.gamepadState.lastX = xButton.pressed;
            this.gamepadState.lastY = yButton.pressed;
            this.gamepadState.lastStart = startButton.pressed;
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
        // Pass null for lure (no fishing in nature mode), but pass other fish and baitfish for AI
        this.fishes.forEach(fish => {
            fish.update(null, this.fishes, this.baitfishClouds);
        });

        // Update all baitfish clouds
        // Pass fish (as "lakers") and zooplankton for baitfish AI
        this.baitfishClouds.forEach(cloud => {
            cloud.update(this.fishes, this.zooplankton);
        });

        // Update all zooplankton
        this.zooplankton.forEach(plankton => {
            plankton.update();
        });

        // Update crayfish
        this.crayfish = this.crayfish.filter(cf => {
            if (cf.visible && !cf.consumed) {
                // Find nearby zooplankton for hunting
                const nearbyZooplankton = this.zooplankton.filter(zp => {
                    const dx = cf.x - zp.x;
                    const dy = cf.y - zp.y;
                    return Math.sqrt(dx * dx + dy * dy) < 150;
                });

                // Check if smallmouth bass nearby (predators)
                const predatorsNearby = this.fishes.some(f => {
                    if (f.species !== 'smallmouth_bass') return false;
                    const dx = cf.x - f.x;
                    const dy = cf.y - f.y;
                    return Math.sqrt(dx * dx + dy * dy) < 200;
                });

                cf.update(nearbyZooplankton, predatorsNearby);
                return true;
            } else {
                cf.destroy();
                return false;
            }
        });

        // Update debug system
        if (this.debugSystem) {
            this.debugSystem.update();
        }

        // Clean up destroyed entities (remove invisible entities)
        this.fishes = this.fishes.filter(f => f.visible);
        this.baitfishClouds = this.baitfishClouds.filter(c => c.visible);
        this.zooplankton = this.zooplankton.filter(p => p.visible);
        this.crayfish = this.crayfish.filter(cf => cf.visible);
    }

    /**
     * Clean up scene resources to prevent memory leaks
     */
    shutdown() {
        // Remove keyboard event listeners
        if (this.input && this.input.keyboard) {
            this.input.keyboard.off('keydown-ESC');
            this.input.keyboard.off('keydown-D');
            this.input.keyboard.off('keydown-B');
        }

        // Remove input event listeners
        if (this.input) {
            this.input.off('drag');
        }

        // Clean up entities
        this.fishes.forEach(fish => fish.destroy());
        this.baitfishClouds.forEach(cloud => cloud.destroy());
        this.zooplankton.forEach(zp => zp.destroy());
        this.crayfish.forEach(cf => cf.destroy());

        // Clean up systems
        if (this.spawningSystem) {
            this.spawningSystem.destroy();
        }
        if (this.debugSystem) {
            this.debugSystem.destroy();
        }

        // Clean up graphics
        if (this.sonarDisplay) {
            this.sonarDisplay.destroy();
        }

        console.log('🧹 NatureSimulationScene cleanup complete');
    }
}

export default NatureSimulationScene;
