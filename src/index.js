// Lake Champlain Ice Fishing Sonar Game
// Main entry point

import GameConfig from './config/GameConfig.js';
import MenuScene from './scenes/MenuScene.js';
import NavigationScene from './scenes/NavigationScene.js';
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
    backgroundColor: GameConfig.COLOR_BACKGROUND,
    banner: false, // Disable Phaser boot banner
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, NavigationScene, GameScene, GameOverScene, UIScene, NatureSimulationScene],
    render: {
        pixelArt: false,
        antialias: true,
        transparent: false
    },
    scale: {
        mode: Phaser.Scale.NONE,
        width: GameConfig.CANVAS_WIDTH,
        height: GameConfig.CANVAS_HEIGHT
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

    // Dev Tools Integration
    setupDevTools(game);
});

function setupDevTools(game) {
    // Update UI stats every 100ms
    setInterval(() => {
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
                const uiSpeed = document.getElementById('ui-speed');

                if (uiDepth) uiDepth.textContent = lureInfo.depth;
                if (uiState) uiState.textContent = lureInfo.state;
                if (uiSpeed) uiSpeed.textContent = lureInfo.retrieveSpeed || '2.0';

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

    // Note: Test Controller Button is handled in index.html
    // to avoid duplicate event listeners that could interfere with game state
}

function updateFishStatus(gameScene) {
    const container = document.getElementById('fish-status-container');

    if (!gameScene || !gameScene.fishes || gameScene.fishes.length === 0) {
        container.innerHTML = '<div style="color: #888; font-style: italic;">No fish spawned</div>';
        return;
    }

    // Group fish by depth zone
    const surfaceFish = [];
    const midColumnFish = [];
    const bottomFish = [];

    gameScene.fishes.forEach((fish, index) => {
        // Defensive check for fish and depthZone
        if (!fish || !fish.depthZone || !fish.depthZone.name) {
            console.warn('Fish with invalid depthZone encountered:', fish);
            return;
        }

        const fishData = { fish, index };
        if (fish.depthZone.name === 'Surface') {
            surfaceFish.push(fishData);
        } else if (fish.depthZone.name === 'Mid-Column') {
            midColumnFish.push(fishData);
        } else {
            bottomFish.push(fishData);
        }
    });

    // Helper function to render fish card
    const renderFish = ({ fish, index }) => {
        // Defensive check: Only Fish objects have AI, hunger, health, etc.
        // Skip non-fish entities (zooplankton, crayfish)
        if (!fish.ai || typeof fish.hunger !== 'number' || !fish.depthZone) {
            return ''; // Not a fish, skip rendering
        }

        const info = fish.getInfo();
        const zoneColor = fish.depthZone.name === 'Surface' ? '#ffff00' :
                         fish.depthZone.name === 'Mid-Column' ? '#00ff00' : '#888888';
        const hungerColor = fish.hunger > 70 ? '#ff6666' :
                           fish.hunger > 40 ? '#ffaa00' : '#00ff00';
        const healthColor = fish.health < 30 ? '#ff6666' :
                           fish.health < 60 ? '#ffaa00' : '#00ff00';
        const frenzyColor = fish.inFrenzy ? '#ff6600' : '#666666';
        const frenzyText = fish.inFrenzy ? `🔥${info.frenzyIntensity}` : '---';
        const genderIcon = info.gender === 'male' ? '♂' : '♀';
        const genderColor = info.gender === 'male' ? '#66ccff' : '#ff99cc';

        return `
            <div style="border: 1px solid ${zoneColor}30; background: ${zoneColor}10; padding: 4px; margin: 3px 0; border-radius: 3px; font-size: 10px;">
                <div style="font-weight: bold; color: ${zoneColor}; display: flex; justify-content: space-between; align-items: center;">
                    <span>🐟 ${info.name}</span>
                    <span style="color: ${genderColor}; font-size: 12px;">${genderIcon}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 9px;">
                    <span style="color: #aaa;">${info.weight}</span>
                    <span style="color: #00ff00;">${Math.floor(fish.depth)}ft</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #aaa;">State:</span>
                    <span style="color: #00ffff; font-size: 9px;">${fish.ai.state.substring(0, 8)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #aaa;">Frenzy:</span>
                    <span style="color: ${frenzyColor};">${frenzyText}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #aaa;">H/H:</span>
                    <span style="color: ${hungerColor};">${fish.hunger.toFixed(0)}</span>/<span style="color: ${healthColor};">${fish.health.toFixed(0)}</span>
                </div>
            </div>
        `;
    };

    // Render zones top to bottom (Surface -> Mid -> Bottom)
    // Each zone has a fixed height to prevent UI jumping
    let html = '';

    // Surface Zone (0-40ft) - Fixed height
    html += `
        <div style="margin-bottom: 8px;">
            <div style="background: #ffff0020; border: 2px solid #ffff00; padding: 4px; font-weight: bold; font-size: 11px; color: #ffff00;">
                ☀️ SURFACE (0-40ft) [${surfaceFish.length}]
            </div>
            <div style="height: 150px; overflow-y: auto; overflow-x: hidden;">
                ${surfaceFish.length > 0 ? surfaceFish.map(renderFish).join('') : ''}
            </div>
        </div>
    `;

    // Mid-Column Zone (40-100ft) - Prime lake trout zone - Fixed height (larger)
    html += `
        <div style="margin-bottom: 8px;">
            <div style="background: #00ff0020; border: 2px solid #00ff00; padding: 4px; font-weight: bold; font-size: 11px; color: #00ff00;">
                🎯 MID-COLUMN (40-100ft) [${midColumnFish.length}]
            </div>
            <div style="height: 240px; overflow-y: auto; overflow-x: hidden;">
                ${midColumnFish.length > 0 ? midColumnFish.map(renderFish).join('') : ''}
            </div>
        </div>
    `;

    // Bottom Zone (100-150ft) - Fixed height
    html += `
        <div style="margin-bottom: 8px;">
            <div style="background: #88888820; border: 2px solid #888888; padding: 4px; font-weight: bold; font-size: 11px; color: #888888;">
                ⚓ BOTTOM (100-150ft) [${bottomFish.length}]
            </div>
            <div style="height: 150px; overflow-y: auto; overflow-x: hidden;">
                ${bottomFish.length > 0 ? bottomFish.map(renderFish).join('') : ''}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Export for module usage
export default config;
