// Lake Champlain Ice Fishing Sonar Game
// Main entry point

import GameConfig from './config/GameConfig.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import UIScene from './scenes/UIScene.js';
import NatureSimulationScene from './scenes/NatureSimulationScene.js';
import gamepadManager from './utils/GamepadManager.js';

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: GameConfig.CANVAS_WIDTH,
    height: GameConfig.CANVAS_HEIGHT,
    parent: 'game-container',
    backgroundColor: 0x000000, // Black background to match boot screen
    banner: false, // Disable Phaser boot banner
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene, UIScene, NatureSimulationScene],
    render: {
        pixelArt: false,
        antialias: true,
        transparent: false
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER,
        width: GameConfig.CANVAS_WIDTH,
        height: GameConfig.CANVAS_HEIGHT,
        parent: 'game-container'
    },
    input: {
        keyboard: true,
        mouse: true,
        touch: true,
        gamepad: true  // Enable gamepad support for PS4/Xbox/8BitDo controllers
    },
    audio: {
        disableWebAudio: false
    },
    fps: {
        target: 60,
        forceSetTimeOut: false
    }
};

// Initialize the game
window.addEventListener('load', () => {
    // Initialize gamepad manager globally
    window.gamepadManager = gamepadManager;
    console.log('🎮 Gamepad Manager initialized');

    // Create the game instance
    const game = new Phaser.Game(config);

    // Game initialized
    console.log('Lake Champlain Fishing Game - Ready');

    // Prevent right-click context menu on game canvas
    game.canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // Add game to window for debugging (optional)
    if (typeof window !== 'undefined') {
        window.game = game;
    }

    // Setup responsive resize handling
    setupResizeHandler(game);

    // Dev Tools Integration
    setupDevTools(game);
});

function setupResizeHandler(game) {
    // Calculate and update game size based on available container space
    function resizeGame() {
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) return;

        // Get the container dimensions
        const containerWidth = gameContainer.clientWidth - 4; // Account for border
        const containerHeight = gameContainer.clientHeight - 4;

        // Fill the container completely - no aspect ratio preservation
        const newWidth = containerWidth;
        const newHeight = containerHeight;

        // Update the game scale
        if (game.scale) {
            game.scale.resize(newWidth, newHeight);
        }

        console.log(`🎮 Game resized to fill container: ${Math.round(newWidth)}x${Math.round(newHeight)}`);
    }

    // Initial resize - do it immediately AND after delay to catch both early and late cases
    resizeGame();
    setTimeout(resizeGame, 100);

    // Force MenuScene to recreate itself after resize to fix layout issues
    setTimeout(() => {
        resizeGame();
        const menuScene = game.scene.getScene('MenuScene');
        if (menuScene && menuScene.scene.isActive()) {
            menuScene.scene.restart();
        }
    }, 200);

    // Debounced resize handler to avoid excessive calls
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeGame, 150);
    });

    // Also resize when sidebar or topbar are toggled
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const topbarToggle = document.getElementById('topbar-toggle');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            setTimeout(resizeGame, 350); // Wait for CSS transition
        });
    }

    if (topbarToggle) {
        topbarToggle.addEventListener('click', () => {
            setTimeout(resizeGame, 350); // Wait for CSS transition
        });
    }
}

function setupDevTools(game) {
    // Update UI stats every 100ms
    // Store interval ID so it can be cleared on game destroy
    const statsUpdateInterval = setInterval(() => {
        const gameScene = game.scene.getScene('GameScene');
        const natureScene = game.scene.getScene('NatureSimulationScene');

        // Handle Nature Simulation Scene
        if (natureScene && natureScene.scene.isActive()) {
            // Show nature depth selector button
            const natureDepthSelector = document.getElementById('nature-depth-selector');
            if (natureDepthSelector) natureDepthSelector.style.display = 'inline';

            // Update depth display with max depth
            const uiDepth = document.getElementById('ui-depth');
            if (uiDepth) uiDepth.textContent = natureScene.maxDepth || 80;

            // Update temperature
            const uiTemp = document.getElementById('ui-temp');
            if (uiTemp) uiTemp.textContent = Math.floor(natureScene.waterTemp || 40);

            // Update time
            const minutes = Math.floor(natureScene.gameTime / 60);
            const secs = natureScene.gameTime % 60;
            const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;
            const uiTime = document.getElementById('ui-time');
            if (uiTime) uiTime.textContent = timeStr;

            // Update fish status panel
            updateFishStatus(natureScene);

            // Handle gamepad input for spawn mode
            handleSpawnModeGamepad(natureScene);
        }
        // Handle Game Scene
        else if (gameScene && gameScene.scene.isActive()) {
            // Hide nature depth selector button in game mode
            const natureDepthSelector = document.getElementById('nature-depth-selector');
            if (natureDepthSelector) natureDepthSelector.style.display = 'none';
            // Game info panel - Score & fish
            const uiScore = document.getElementById('ui-score');
            const uiCaught = document.getElementById('ui-caught');
            const uiLost = document.getElementById('ui-lost');

            if (uiScore) uiScore.textContent = gameScene.score || 0;
            if (uiCaught) uiCaught.textContent = gameScene.fishCaught || 0;
            if (uiLost) uiLost.textContent = gameScene.fishLost || 0;

            if (gameScene.lure) {
                const lureInfo = gameScene.lure.getInfo();

                // Game info panel
                const uiDepth = document.getElementById('ui-depth');
                const uiState = document.getElementById('ui-lure-state');

                if (uiDepth) uiDepth.textContent = lureInfo.depth;
                if (uiState) uiState.textContent = lureInfo.state;

                // Update zone color
                const depth = parseFloat(lureInfo.depth);
                const zoneText = document.getElementById('ui-zone-text');
                const uiZone = document.getElementById('ui-zone');
                let zone = 'Surface';
                let zoneColor = '#ffff00';

                if (depth >= 100) {
                    zone = 'Bottom';
                    zoneColor = '#888888';
                } else if (depth >= 40) {
                    zone = 'Mid-Column';
                    zoneColor = '#00ff00';
                }

                if (uiZone) uiZone.textContent = zone;
                if (zoneText) {
                    zoneText.style.color = zoneColor;
                }

                // Update reeling speed meter
                const reelSpeedFill = document.getElementById('reel-speed-fill');
                const reelSpeedPercent = document.getElementById('reel-speed-percent');

                if (reelSpeedFill && reelSpeedPercent) {
                    // Get current trigger speed (0-1 normalized)
                    const speedValue = gameScene.lure.currentTriggerSpeed || 0;
                    const speedPercent = Math.round(speedValue * 100);

                    // Update bar width
                    reelSpeedFill.style.width = `${speedPercent}%`;

                    // Update percentage text
                    reelSpeedPercent.textContent = speedPercent;
                }

                // Update drop speed meter
                const dropSpeedFill = document.getElementById('drop-speed-fill');
                const dropSpeedPercent = document.getElementById('drop-speed-percent');

                if (dropSpeedFill && dropSpeedPercent) {
                    // Calculate drop rate based on lure velocity (positive = dropping)
                    const velocity = gameScene.lure.velocity || 0;
                    const dropRate = Math.max(0, velocity); // Only show positive (dropping) velocity

                    // Calculate max fall speed based on lure weight (same logic as in Lure.js)
                    const weightMultiplier = gameScene.lure.weight * 1.5;
                    const maxFallSpeed = GameConfig.LURE_MAX_FALL_SPEED * weightMultiplier;

                    // Normalize to 0-1 range
                    const dropValue = Math.min(1, dropRate / maxFallSpeed);
                    const dropPercent = Math.round(dropValue * 100);

                    // Update bar width
                    dropSpeedFill.style.width = `${dropPercent}%`;

                    // Update percentage text
                    dropSpeedPercent.textContent = dropPercent;
                }

                // Update drag setting meter
                const dragSettingFill = document.getElementById('drag-setting-fill');
                const dragSettingPercent = document.getElementById('drag-setting-percent');

                if (dragSettingFill && dragSettingPercent && gameScene.reelModel) {
                    // Get current drag setting (0-100%)
                    const dragPercent = Math.round(gameScene.reelModel.dragSetting || 50);

                    // Update bar width
                    dragSettingFill.style.width = `${dragPercent}%`;

                    // Update percentage text
                    dragSettingPercent.textContent = dragPercent;
                }
            }

            // Listen for tension updates from FishFight
            if (gameScene && !gameScene._tensionListenerAdded) {
                gameScene._tensionListenerAdded = true;
                gameScene.events.on('updateLineTension', (tensionValue) => {
                    const tensionFill = document.getElementById('tension-fill');
                    const tensionPercent = document.getElementById('tension-percent');

                    if (tensionFill && tensionPercent) {
                        // Calculate percentage (tension is 0-100 scale, where 100 = MAX_LINE_TENSION)
                        const tensionPercentValue = Math.round(tensionValue);

                        // Update bar width
                        tensionFill.style.width = `${tensionPercentValue}%`;

                        // Update percentage text
                        tensionPercent.textContent = tensionPercentValue;
                    }
                });
            }

            // Listen for line strain updates from FishFight
            if (gameScene && !gameScene._lineStrainListenerAdded) {
                gameScene._lineStrainListenerAdded = true;
                gameScene.events.on('updateLineStrain', (data) => {
                    const lineTestDisplay = document.getElementById('ui-line-test');
                    const lineStrainFill = document.getElementById('line-strain-fill');
                    const lineStrainPercent = document.getElementById('line-strain-percent');

                    if (lineTestDisplay && lineStrainFill && lineStrainPercent) {
                        // Update line test strength display
                        lineTestDisplay.textContent = `${data.testStrength}lb`;

                        // Update strain bar width
                        lineStrainFill.style.width = `${data.strainPercent}%`;

                        // Update percentage text
                        lineStrainPercent.textContent = data.strainPercent;
                    }
                });
            }

            // Time - show countdown for arcade, count up for unlimited
            let timeStr;
            if (gameScene.gameMode === GameConfig.GAME_MODE_ARCADE) {
                const minutes = Math.floor(gameScene.timeRemaining / 60);
                const secs = gameScene.timeRemaining % 60;
                timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;
            } else {
                const minutes = Math.floor(gameScene.gameTime / 60);
                const secs = gameScene.gameTime % 60;
                timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;
            }
            const uiTime = document.getElementById('ui-time');
            if (uiTime) uiTime.textContent = timeStr;

            // Water temp
            const uiTemp = document.getElementById('ui-temp');
            if (uiTemp) uiTemp.textContent = Math.floor(gameScene.waterTemp || 40);

            // Update fish status panel
            updateFishStatus(gameScene);
        }
    }, 100);

    // Spawn Fish Button (dev controls - may not exist in production)
    const spawnFishBtn = document.getElementById('spawn-fish-btn');
    if (spawnFishBtn) {
        spawnFishBtn.addEventListener('click', () => {
            const gameScene = game.scene.getScene('GameScene');
            if (gameScene && gameScene.scene.isActive()) {
                gameScene.trySpawnFish();
                console.log('Spawned 1 fish');
            }
        });
    }

    // Spawn 5 Fish Button (dev controls - may not exist in production)
    const spawn5FishBtn = document.getElementById('spawn-5-fish-btn');
    if (spawn5FishBtn) {
        spawn5FishBtn.addEventListener('click', () => {
            const gameScene = game.scene.getScene('GameScene');
            if (gameScene && gameScene.scene.isActive()) {
                for (let i = 0; i < 5; i++) {
                    gameScene.trySpawnFish();
                }
                console.log('Spawned 5 fish');
            }
        });
    }

    // Reset Game Button (dev controls - may not exist in production)
    const resetGameBtn = document.getElementById('reset-game-btn');
    if (resetGameBtn) {
        resetGameBtn.addEventListener('click', () => {
            const gameScene = game.scene.getScene('GameScene');
            if (gameScene && gameScene.scene.isActive()) {
                gameScene.scene.restart();
                console.log('Game reset');
            }
        });
    }

    // Toggle Debug Info Button (dev controls - may not exist in production)
    let debugMode = false;
    const toggleDebugBtn = document.getElementById('toggle-debug-btn');
    if (toggleDebugBtn) {
        toggleDebugBtn.addEventListener('click', () => {
            const gameScene = game.scene.getScene('GameScene');
            if (gameScene && gameScene.scene.isActive()) {
                debugMode = !debugMode;
                gameScene.debugMode = debugMode;
                console.log('Debug mode:', debugMode ? 'ON' : 'OFF');

                // Visual feedback
                const btn = document.getElementById('toggle-debug-btn');
                if (btn) {
                    btn.textContent = debugMode ? 'Debug: ON' : 'Toggle Debug Info';
                    btn.style.background = debugMode ? '#ffaa00' : '#00ff00';
                }
            }
        });
    }

    // Nature Mode Depth Selector Button
    const natureDepthSelector = document.getElementById('nature-depth-selector');
    if (natureDepthSelector) {
        natureDepthSelector.addEventListener('click', () => {
            const natureScene = game.scene.getScene('NatureSimulationScene');
            if (natureScene && natureScene.scene.isActive()) {
                natureScene.toggleDepthSelectionUI();
            }
        });
    }

    // Lure Weight Buttons
    const lureWeights = [0.25, 0.5, 1, 2, 3, 4];
    lureWeights.forEach(weight => {
        const btn = document.getElementById(`lure-weight-${weight}`);
        if (btn) {
            btn.addEventListener('click', () => {
                const gameScene = game.scene.getScene('GameScene');
                if (gameScene && gameScene.scene.isActive() && gameScene.lure) {
                    gameScene.lure.weight = weight;
                    const currentWeightEl = document.getElementById('current-lure-weight');
                    if (currentWeightEl) {
                        currentWeightEl.textContent = `${weight}oz`;
                    }
                    console.log(`Lure weight changed to ${weight}oz`);

                    // Visual feedback - highlight selected button
                    lureWeights.forEach(w => {
                        const b = document.getElementById(`lure-weight-${w}`);
                        if (b) {
                            b.style.background = w === weight ? '#ffaa00' : '';
                        }
                    });
                }
            });
        }
    });

    // Set initial lure weight display
    setTimeout(() => {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive() && gameScene.lure) {
            const currentWeightEl = document.getElementById('current-lure-weight');
            if (currentWeightEl) {
                currentWeightEl.textContent = `${gameScene.lure.weight}oz`;
            }
            // Highlight default weight button
            const defaultBtn = document.getElementById(`lure-weight-${gameScene.lure.weight}`);
            if (defaultBtn) {
                defaultBtn.style.background = '#ffaa00';
            }
        }
    }, 500);

    // Fishing Line Type Buttons
    const lineTypes = ['braid', 'monofilament', 'fluorocarbon'];
    const lineTypeLabels = {
        'braid': 'Braided',
        'monofilament': 'Monofilament',
        'fluorocarbon': 'Fluorocarbon'
    };

    lineTypes.forEach(lineType => {
        const btn = document.getElementById(`line-type-${lineType}`);
        if (btn) {
            btn.addEventListener('click', () => {
                const gameScene = game.scene.getScene('GameScene');
                if (gameScene && gameScene.scene.isActive() && gameScene.fishingLineModel) {
                    gameScene.fishingLineModel.setLineType(lineType);
                    const currentLineTypeEl = document.getElementById('current-line-type');
                    if (currentLineTypeEl) {
                        currentLineTypeEl.textContent = lineTypeLabels[lineType];
                    }
                    console.log(`Fishing line changed to ${lineTypeLabels[lineType]}`);

                    // Visual feedback - highlight selected button
                    lineTypes.forEach(lt => {
                        const b = document.getElementById(`line-type-${lt}`);
                        if (b) {
                            b.style.background = lt === lineType ? '#ffaa00' : '';
                        }
                    });

                    // Show/hide braid color section
                    const braidColorSection = document.getElementById('braid-color-section');
                    if (braidColorSection) {
                        braidColorSection.style.display = lineType === 'braid' ? 'block' : 'none';
                    }
                }
            });
        }
    });

    // Braid Color Buttons
    const braidColors = ['neon-green', 'yellow', 'moss-green', 'white'];
    const braidColorLabels = {
        'neon-green': 'Neon Green',
        'yellow': 'Yellow',
        'moss-green': 'Moss Green',
        'white': 'White'
    };

    braidColors.forEach(color => {
        const btn = document.getElementById(`braid-color-${color}`);
        if (btn) {
            btn.addEventListener('click', () => {
                const gameScene = game.scene.getScene('GameScene');
                if (gameScene && gameScene.scene.isActive() && gameScene.fishingLineModel) {
                    gameScene.fishingLineModel.setBraidColor(color);
                    const currentBraidColorEl = document.getElementById('current-braid-color');
                    if (currentBraidColorEl) {
                        currentBraidColorEl.textContent = braidColorLabels[color];
                    }
                    console.log(`Braid color changed to ${braidColorLabels[color]}`);

                    // Visual feedback - highlight selected button
                    braidColors.forEach(c => {
                        const b = document.getElementById(`braid-color-${c}`);
                        if (b) {
                            b.style.background = c === color ? '#ffaa00' : '';
                        }
                    });
                }
            });
        }
    });

    // Set initial fishing line display
    setTimeout(() => {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive() && gameScene.fishingLineModel) {
            const lineType = gameScene.fishingLineModel.lineType;
            const braidColor = gameScene.fishingLineModel.braidColor;

            const currentLineTypeEl = document.getElementById('current-line-type');
            if (currentLineTypeEl) {
                currentLineTypeEl.textContent = gameScene.fishingLineModel.getDisplayName();
            }

            const currentBraidColorEl = document.getElementById('current-braid-color');
            if (currentBraidColorEl) {
                currentBraidColorEl.textContent = gameScene.fishingLineModel.getBraidColorDisplayName();
            }

            // Highlight default line type button
            const defaultLineBtn = document.getElementById(`line-type-${lineType}`);
            if (defaultLineBtn) {
                defaultLineBtn.style.background = '#ffaa00';
            }

            // Highlight default braid color button
            const defaultColorBtn = document.getElementById(`braid-color-${braidColor}`);
            if (defaultColorBtn) {
                defaultColorBtn.style.background = '#ffaa00';
            }
        }
    }, 500);

    // Cleanup interval when game is destroyed
    game.events.once('destroy', () => {
        if (statsUpdateInterval) {
            clearInterval(statsUpdateInterval);
            console.log('🧹 Cleaned up stats update interval');
        }
    });

    // Note: Test Controller Button is handled in index.html
    // to avoid duplicate event listeners that could interfere with game state
}

function updateFishStatus(gameScene) {
    const container = document.getElementById('fish-status-container');
    const entityCounts = document.getElementById('entity-counts');

    // Update entity counts
    if (gameScene && entityCounts) {
        const fishCount = gameScene.fishes ? gameScene.fishes.length : 0;

        // Check both schools (NatureSimulationScene) and baitfishClouds (GameScene) for cloud count
        let cloudCount = 0;
        if (gameScene.schools && Array.isArray(gameScene.schools)) {
            cloudCount = gameScene.schools.length;
        } else if (gameScene.baitfishClouds && Array.isArray(gameScene.baitfishClouds)) {
            cloudCount = gameScene.baitfishClouds.filter(c => c && c.visible).length;
        }

        const crayfishCount = gameScene.crayfish ? gameScene.crayfish.filter(c => c && c.visible).length : 0;
        const zooplanktonCount = gameScene.zooplankton ? gameScene.zooplankton.filter(z => z && z.visible).length : 0;

        entityCounts.innerHTML = `🐟 ${fishCount} ☁️ ${cloudCount} 🦞 ${crayfishCount} 🪳 ${zooplanktonCount}`;
    }

    if (!gameScene || !gameScene.fishes || gameScene.fishes.length === 0) {
        container.innerHTML = '<div style="color: #888; font-style: italic;">No fish spawned</div>';
        return;
    }

    // Collect all valid fish
    const allFish = [];
    gameScene.fishes.forEach((fish, index) => {
        // Defensive check: Only Fish objects have AI, hunger, health, etc.
        if (!fish || !fish.ai || typeof fish.hunger !== 'number' || !fish.depthZone) {
            return; // Not a fish, skip
        }

        // Defensive check for depthZone
        if (!fish.depthZone.name) {
            console.warn('Fish with invalid depthZone encountered:', fish);
            return;
        }

        allFish.push({ fish, index });
    });

    // Sort fish by depth (shallowest to deepest)
    allFish.sort((a, b) => a.fish.depth - b.fish.depth);

    // Auto-select first fish if none selected
    if (!gameScene.selectedFish && allFish.length > 0) {
        gameScene.selectedFish = allFish[0].fish;
    }

    // Helper function to render fish row (single line)
    const renderFish = ({ fish, index }) => {
        const info = fish.getInfo();

        // Border color based on depth zone (yellow=surface, green=mid, grey=deep)
        const zoneColor = fish.depthZone.name === 'Surface' ? '#ffff00' :
                         fish.depthZone.name === 'Mid-Column' ? '#00ff00' : '#888888';

        const hungerColor = fish.hunger > 70 ? '#ff6666' :
                           fish.hunger > 40 ? '#ffaa00' : '#00ff00';
        const healthColor = fish.health < 30 ? '#ff6666' :
                           fish.health < 60 ? '#ffaa00' : '#00ff00';
        const genderIcon = info.gender === 'male' ? '♂' : '♀';
        const genderColor = info.gender === 'male' ? '#66ccff' : '#ff99cc';

        // Frenzy indicator - red circle if in frenzy
        const frenzyIndicator = fish.inFrenzy ? '🔴' : '';

        // Count baitfish consumed (from stomach contents)
        const baitfishConsumed = fish.stomachContents ? fish.stomachContents.length : 0;

        // Check if this fish is selected
        const isSelected = gameScene.selectedFish === fish;
        const selectedClass = isSelected ? 'fish-selected' : '';
        const selectedStyle = isSelected ? 'background: #ffffff20;' : `background: ${zoneColor}08;`;

        return `
            <div class="fish-status-row ${selectedClass}" data-fish-id="${fish.model.id}" style="border-left: 3px solid ${zoneColor}; ${selectedStyle} padding: 3px 5px; margin: 2px 0; cursor: pointer; font-size: 9px; display: flex; justify-content: space-between; align-items: center; white-space: nowrap; overflow: hidden;">
                <span style="color: ${zoneColor}; min-width: 45px; max-width: 45px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${info.name}"><span style="color: ${genderColor};">${genderIcon}</span> ${info.name}</span>
                <span style="min-width: 15px; max-width: 15px; text-align: center;">${frenzyIndicator}</span>
                <span style="color: #fff; min-width: 28px; max-width: 28px; text-align: right;">${fish.weight.toFixed(1)}</span>
                <span style="color: #00ffff; min-width: 42px; max-width: 42px; text-align: center;">${fish.ai.state.substring(0, 5)}</span>
                <span style="min-width: 38px; max-width: 38px; text-align: center;"><span style="color: ${hungerColor};">${fish.hunger.toFixed(0)}</span>/<span style="color: ${healthColor};">${fish.health.toFixed(0)}</span></span>
                <span style="color: ${zoneColor}; min-width: 28px; max-width: 28px; text-align: right;">${Math.floor(fish.depth)}ft</span>
                <span style="color: #ff9900; min-width: 15px; max-width: 15px; text-align: right;">${baitfishConsumed}</span>
            </div>
        `;
    };

    // Build HTML with header key
    let html = `
        <div style="background: #1a1a1a; border-bottom: 2px solid #00ff00; padding: 3px 5px; margin-bottom: 4px; font-size: 8px; color: #888; display: flex; justify-content: space-between; font-weight: bold; white-space: nowrap; overflow: hidden;">
            <span style="min-width: 45px; max-width: 45px;">NAME</span>
            <span style="min-width: 15px; max-width: 15px; text-align: center;">F</span>
            <span style="min-width: 28px; max-width: 28px; text-align: right;">WT</span>
            <span style="min-width: 42px; max-width: 42px; text-align: center;">STATE</span>
            <span style="min-width: 38px; max-width: 38px; text-align: center;">H/H</span>
            <span style="min-width: 28px; max-width: 28px; text-align: right;">DEPTH</span>
            <span style="min-width: 15px; max-width: 15px; text-align: right;">ATE</span>
        </div>
    `;

    html += allFish.map(renderFish).join('');
    container.innerHTML = html;

    // Add click handlers to fish rows
    container.querySelectorAll('.fish-status-row').forEach(row => {
        row.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            const fishId = this.getAttribute('data-fish-id');
            const selectedFish = gameScene.fishes.find(f => f.model.id === fishId);

            // Toggle selection - if clicking already selected fish, deselect
            if (gameScene.selectedFish === selectedFish) {
                gameScene.selectFish(null);
            } else {
                gameScene.selectFish(selectedFish);
            }
        });
    });

    // Update detailed info panel
    updateFishDetailPanel(gameScene);

    // Setup keyboard navigation (only once)
    if (!window.fishListKeyboardSetup) {
        window.fishListKeyboardSetup = true;
        window.addEventListener('keydown', (e) => {
            const gameScene = game.scene.getScene('GameScene');
            const natureScene = game.scene.getScene('NatureSimulationScene');
            const scene = natureScene && natureScene.scene.isActive() ? natureScene : gameScene;

            if (!scene) return;

            // Toggle spawn mode with X key
            if (e.key === 'x' || e.key === 'X') {
                e.preventDefault();
                scene.spawnMode = !scene.spawnMode;
                console.log('Toggled spawn mode:', scene.spawnMode ? 'ON' : 'OFF');
                return;
            }

            // Handle spawn mode navigation
            if (scene.spawnMode) {
                if (e.key === 'ArrowLeft' || e.key === 'Left') {
                    e.preventDefault();
                    scene.selectedSpawnButton = Math.max(0, scene.selectedSpawnButton - 1);
                } else if (e.key === 'ArrowRight' || e.key === 'Right') {
                    e.preventDefault();
                    scene.selectedSpawnButton = Math.min(3, scene.selectedSpawnButton + 1);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const types = ['fish', 'cloud', 'crayfish', 'zooplankton'];
                    spawnEntity(scene, types[scene.selectedSpawnButton]);
                }
                return;
            }

            // Handle fish list navigation (info mode)
            if (!scene.fishes || scene.fishes.length === 0) return;

            // Get sorted fish list
            const sortedFish = scene.fishes
                .filter(f => f && f.ai && typeof f.hunger === 'number' && f.depthZone)
                .sort((a, b) => a.depth - b.depth);

            if (sortedFish.length === 0) return;

            const currentIndex = sortedFish.indexOf(scene.selectedFish);

            if (e.key === 'ArrowUp' || e.key === 'Up') {
                e.preventDefault();
                const newIndex = Math.max(0, currentIndex - 1);
                scene.selectFish(sortedFish[newIndex]);
                console.log('Selected fish (up):', sortedFish[newIndex].getInfo().name);
            } else if (e.key === 'ArrowDown' || e.key === 'Down') {
                e.preventDefault();
                const newIndex = Math.min(sortedFish.length - 1, currentIndex + 1);
                scene.selectFish(sortedFish[newIndex]);
                console.log('Selected fish (down):', sortedFish[newIndex].getInfo().name);
            }
        });

        // Setup gamepad state tracker for spawn mode controls
        window.spawnModeGamepadState = {
            lastB: false,
            lastX: false,
            lastDpadLeft: false,
            lastDpadRight: false,
            lastA: false,
            lastDpadUp: false,
            lastDpadDown: false
        };
    }
}

/**
 * Update the spawn buttons container
 */
function updateSpawnButtons(gameScene) {
    const spawnContainer = document.getElementById('spawn-buttons-container');
    if (!spawnContainer) return;

    // Show/hide spawn buttons based on spawn mode
    if (gameScene.spawnMode) {
        spawnContainer.style.display = 'block';

        const fishCount = gameScene.fishes ? gameScene.fishes.length : 0;

        // Check both schools (NatureSimulationScene) and baitfishClouds (GameScene) for cloud count
        let cloudCount = 0;
        if (gameScene.schools && Array.isArray(gameScene.schools)) {
            cloudCount = gameScene.schools.length;
        } else if (gameScene.baitfishClouds && Array.isArray(gameScene.baitfishClouds)) {
            cloudCount = gameScene.baitfishClouds.filter(c => c && c.visible).length;
        }

        const crayfishCount = gameScene.crayfish ? gameScene.crayfish.filter(c => c && c.visible).length : 0;
        const zooplanktonCount = gameScene.zooplankton ? gameScene.zooplankton.filter(z => z && z.visible).length : 0;

        const selected = gameScene.selectedSpawnButton;

        spawnContainer.innerHTML = `
            <div style="padding: 8px;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                    <button class="spawn-btn" data-spawn="fish" style="background: ${selected === 0 ? '#00ff0040' : '#1a1a1a'}; border: 2px solid ${selected === 0 ? '#00ff00' : '#00ff0080'}; color: #00ff00; padding: 12px 5px; cursor: pointer; font-size: 18px; display: flex; flex-direction: column; align-items: center; gap: 3px;">
                        <span>🐟</span>
                        <span style="font-size: 9px;">${fishCount}</span>
                    </button>
                    <button class="spawn-btn" data-spawn="cloud" style="background: ${selected === 1 ? '#00ff0040' : '#1a1a1a'}; border: 2px solid ${selected === 1 ? '#00ff00' : '#00ff0080'}; color: #00ff00; padding: 12px 5px; cursor: pointer; font-size: 18px; display: flex; flex-direction: column; align-items: center; gap: 3px;">
                        <span>☁️</span>
                        <span style="font-size: 9px;">${cloudCount}</span>
                    </button>
                    <button class="spawn-btn" data-spawn="crayfish" style="background: ${selected === 2 ? '#00ff0040' : '#1a1a1a'}; border: 2px solid ${selected === 2 ? '#00ff00' : '#00ff0080'}; color: #00ff00; padding: 12px 5px; cursor: pointer; font-size: 18px; display: flex; flex-direction: column; align-items: center; gap: 3px;">
                        <span>🦞</span>
                        <span style="font-size: 9px;">${crayfishCount}</span>
                    </button>
                    <button class="spawn-btn" data-spawn="zooplankton" style="background: ${selected === 3 ? '#00ff0040' : '#1a1a1a'}; border: 2px solid ${selected === 3 ? '#00ff00' : '#00ff0080'}; color: #00ff00; padding: 12px 5px; cursor: pointer; font-size: 18px; display: flex; flex-direction: column; align-items: center; gap: 3px;">
                        <span>🪳</span>
                        <span style="font-size: 9px;">${zooplanktonCount}</span>
                    </button>
                </div>
            </div>
        `;

        // Add click handlers for spawn buttons
        spawnContainer.querySelectorAll('.spawn-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                gameScene.selectedSpawnButton = index;
                const spawnType = btn.getAttribute('data-spawn');
                spawnEntity(gameScene, spawnType);
            });
        });
    } else {
        spawnContainer.style.display = 'none';
    }
}

/**
 * Update the detailed fish info panel at the bottom of the fish status
 */
function updateFishDetailPanel(gameScene) {
    const detailPanel = document.getElementById('fish-detail-panel');
    if (!detailPanel) return;

    // Update spawn buttons (separate container)
    updateSpawnButtons(gameScene);

    // Always show fish info in detail panel (if a fish is selected)
    if (!gameScene.selectedFish) {
        detailPanel.innerHTML = '<div style="color: #888; font-style: italic; padding: 10px; text-align: center;">Press X for spawn mode</div>';
        return;
    }

    const fish = gameScene.selectedFish;

    // Defensive checks for fish properties
    if (!fish || !fish.getInfo) {
        detailPanel.innerHTML = '<div style="color: #ff6666; font-style: italic; padding: 10px; text-align: center;">Error: Invalid fish data</div>';
        return;
    }

    const info = fish.getInfo();
    const weight = (fish.weight !== undefined) ? fish.weight.toFixed(1) : 'N/A';
    const length = (fish.length !== undefined) ? fish.length.toFixed(1) : 'N/A';
    const depth = (fish.depth !== undefined) ? Math.floor(fish.depth) : 'N/A';
    const zone = fish.depthZone?.name || 'N/A';
    const hunger = (fish.hunger !== undefined) ? fish.hunger.toFixed(0) : 'N/A';
    const health = (fish.health !== undefined) ? fish.health.toFixed(0) : 'N/A';
    const state = fish.ai?.state || 'N/A';
    const speed = fish.speed ? fish.speed.toFixed(1) : (fish.model?.speed?.toFixed(1) || 'N/A');
    const baitfishEaten = fish.stomachContents ? fish.stomachContents.length : 0;

    detailPanel.innerHTML = `
        <div style="padding: 10px; font-size: 11px;">
            <div style="color: #00ff00; font-weight: bold; font-size: 13px; margin-bottom: 8px;">${info.name || 'Unknown'} (${info.species || 'Unknown'})</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <div><span style="color: #888;">Weight:</span> <span style="color: #fff;">${weight} lbs</span></div>
                <div><span style="color: #888;">Length:</span> <span style="color: #fff;">${length} in</span></div>
                <div><span style="color: #888;">Gender:</span> <span style="color: ${info.gender === 'male' ? '#66ccff' : '#ff99cc'};">${info.gender === 'male' ? '♂ Male' : '♀ Female'}</span></div>
                <div><span style="color: #888;">Age:</span> <span style="color: #fff;">${info.age || 'N/A'}</span></div>
                <div><span style="color: #888;">Depth:</span> <span style="color: #00ffff;">${depth}ft</span></div>
                <div><span style="color: #888;">Zone:</span> <span style="color: #ffff00;">${zone}</span></div>
                <div><span style="color: #888;">Hunger:</span> <span style="color: ${fish.hunger > 70 ? '#ff6666' : fish.hunger > 40 ? '#ffaa00' : '#00ff00'};">${hunger}</span></div>
                <div><span style="color: #888;">Health:</span> <span style="color: ${fish.health < 30 ? '#ff6666' : fish.health < 60 ? '#ffaa00' : '#00ff00'};">${health}</span></div>
                <div><span style="color: #888;">State:</span> <span style="color: #00ffff;">${state}</span></div>
                <div><span style="color: #888;">Frenzy:</span> <span style="color: ${fish.inFrenzy ? '#ff0000' : '#00ff00'};">${fish.inFrenzy ? 'YES' : 'NO'}</span></div>
                <div><span style="color: #888;">Baitfish Eaten:</span> <span style="color: #ff9900;">${baitfishEaten}</span></div>
                <div><span style="color: #888;">Speed:</span> <span style="color: #fff;">${speed}</span></div>
            </div>
        </div>
    `;
}

/**
 * Spawn an entity at a random location
 */
function spawnEntity(gameScene, type) {
    if (!gameScene || !gameScene.spawningSystem) return;

    console.log(`Spawning ${type}...`);

    switch(type) {
        case 'fish':
            if (gameScene.spawningSystem.spawnFish) {
                gameScene.spawningSystem.spawnFish();
            } else if (gameScene.spawningSystem.trySpawnFish) {
                gameScene.spawningSystem.trySpawnFish();
            }
            break;
        case 'cloud':
            // Try both methods for compatibility (NatureSimulationScene uses trySpawnBaitfishCloud which calls trySpawnBaitfishSchool)
            if (gameScene.spawningSystem.trySpawnBaitfishCloud) {
                gameScene.spawningSystem.trySpawnBaitfishCloud();
            } else if (gameScene.spawningSystem.trySpawnBaitfishSchool) {
                gameScene.spawningSystem.trySpawnBaitfishSchool();
            }
            break;
        case 'crayfish':
            gameScene.spawningSystem.trySpawnCrayfish();
            break;
        case 'zooplankton':
            gameScene.spawningSystem.trySpawnZooplankton();
            break;
    }
}

/**
 * Handle gamepad input for spawn mode controls
 * Called from the stats update interval
 */
function handleSpawnModeGamepad(gameScene) {
    // Exit if no gamepad connected
    if (!window.gamepadManager || !window.gamepadManager.isConnected()) {
        return;
    }

    // Exit if gamepad state not initialized
    if (!window.spawnModeGamepadState) {
        return;
    }

    const state = window.spawnModeGamepadState;

    // Get button states
    const bBtn = window.gamepadManager.getButton('Circle'); // B on 8BitDo, Circle on PS4
    const xBtn = window.gamepadManager.getButton('Square'); // X on 8BitDo, Square on PS4
    const aBtn = window.gamepadManager.getButton('X'); // A on Xbox, X on PS4
    const dpadLeft = window.gamepadManager.getButton('DpadLeft');
    const dpadRight = window.gamepadManager.getButton('DpadRight');
    const dpadUp = window.gamepadManager.getButton('DpadUp');
    const dpadDown = window.gamepadManager.getButton('DpadDown');

    // Toggle spawn mode with B or X button (just pressed)
    if ((bBtn.pressed && !state.lastB) || (xBtn.pressed && !state.lastX)) {
        gameScene.spawnMode = !gameScene.spawnMode;
        console.log(`Spawn mode: ${gameScene.spawnMode ? 'ON' : 'OFF'}`);
    }
    state.lastB = bBtn.pressed;
    state.lastX = xBtn.pressed;

    // Handle spawn mode controls
    if (gameScene.spawnMode) {
        // D-pad left - navigate spawn buttons left
        if (dpadLeft.pressed && !state.lastDpadLeft) {
            gameScene.selectedSpawnButton = Math.max(0, gameScene.selectedSpawnButton - 1);
        }
        state.lastDpadLeft = dpadLeft.pressed;

        // D-pad right - navigate spawn buttons right
        if (dpadRight.pressed && !state.lastDpadRight) {
            gameScene.selectedSpawnButton = Math.min(3, gameScene.selectedSpawnButton + 1);
        }
        state.lastDpadRight = dpadRight.pressed;

        // A button - spawn selected entity
        if (aBtn.pressed && !state.lastA) {
            const types = ['fish', 'cloud', 'crayfish', 'zooplankton'];
            spawnEntity(gameScene, types[gameScene.selectedSpawnButton]);
        }
        state.lastA = aBtn.pressed;
    }
    // Handle info mode controls (fish list navigation)
    else {
        if (!gameScene.fishes || gameScene.fishes.length === 0) return;

        // Get sorted fish list
        const sortedFish = gameScene.fishes
            .filter(f => f && f.ai && typeof f.hunger === 'number' && f.depthZone)
            .sort((a, b) => a.depth - b.depth);

        if (sortedFish.length === 0) return;

        const currentIndex = sortedFish.indexOf(gameScene.selectedFish);

        // D-pad up - navigate fish list up
        if (dpadUp.pressed && !state.lastDpadUp) {
            const newIndex = Math.max(0, currentIndex - 1);
            gameScene.selectFish(sortedFish[newIndex]);
            console.log('🎮 Selected fish (up):', sortedFish[newIndex].getInfo().name);
        }
        state.lastDpadUp = dpadUp.pressed;

        // D-pad down - navigate fish list down
        if (dpadDown.pressed && !state.lastDpadDown) {
            const newIndex = Math.min(sortedFish.length - 1, currentIndex + 1);
            gameScene.selectFish(sortedFish[newIndex]);
            console.log('🎮 Selected fish (down):', sortedFish[newIndex].getInfo().name);
        }
        state.lastDpadDown = dpadDown.pressed;
    }
}

// Export for module usage
export default config;
