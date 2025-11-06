// Lake Champlain Ice Fishing Sonar Game
// Main entry point

import GameConfig from './config/GameConfig.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import UIScene from './scenes/UIScene.js';
import WaterColumn from './scenes/WaterColumn.js';
import InfoBar from './scenes/InfoBar.js';
// REMOVED: FishStatus scene - replaced by GameHUD
import GameHUD from './scenes/GameHUD.js';
import gamepadManager from './utils/GamepadManager.js';

const actualWidth = document.getElementById('game-container').clientWidth;
const actualHeight = document.getElementById('game-container').clientHeight;

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: actualWidth,
    height: actualHeight,
    parent: 'game-container',
    backgroundColor: 0x000000, // Black background to match boot screen
    banner: false, // Disable Phaser boot banner
    // min: {
    //     width: 480,
    //     height: 720,
    // },
    // max: {
    //     width: 1024,
    //     height: 1280,
    // },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    // Scene rendering order (bottom to top):
    // 1. WaterColumn - base layer (water, fish, baitfish)
    // 2. GameScene - orchestrator (launches other scenes)
    // 3. GameHUD - in-game UI (replaces HTML elements)
    // 4. InfoBar - overlay (deprecated, can remove)
    // 5. MenuScene, GameOverScene, UIScene - modals
    scene: [BootScene, WaterColumn, GameScene, GameHUD, InfoBar, MenuScene, GameOverScene, UIScene],
    render: {
        pixelArt: false,
        antialias: true,
        transparent: false
    },
    scale: {
        mode: Phaser.Scale.EXPAND,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: actualWidth,
        height: actualHeight,
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
    // TypeScript Conversion Progress Banner
    console.log('%c🔥 PHASE 4 COMPLETE: AI & Components converted to TypeScript', 'background: #4CAF50; color: white; font-size: 16px; padding: 10px; font-weight: bold;');
    console.log('%c✅ FishAI.ts (1,280 lines) - Complex AI state machine', 'color: #4CAF50; font-size: 14px;');
    console.log('%c✅ FishFight.ts (1,387 lines) - Physics simulation', 'color: #4CAF50; font-size: 14px;');
    console.log('%c✅ Lure.ts (391 lines) - Lure mechanics', 'color: #4CAF50; font-size: 14px;');
    console.log('%c📊 Progress: 19/36 files (53%)', 'background: #2196F3; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
    console.log('%c⏭️  Next: Phase 5 - Phaser Scenes (9 files including GameScene.js - 2,443 lines)', 'background: #FF9800; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
    console.log('');

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
    //setupResizeHandler(game);

    // Dev Tools Integration
    setupDevTools(game);
});

// function setupResizeHandler(game) {
//     // Calculate and update game size based on available container space
//     function resizeGame() {
//         const gameContainer = document.getElementById('game-container');
//         if (!gameContainer) return;

//         // Get the container dimensions
//         const containerWidth = gameContainer.clientWidth - 4; // Account for border
//         const containerHeight = gameContainer.clientHeight - 4;

//         // Fill the container completely - no aspect ratio preservation
//         const newWidth = containerWidth;
//         const newHeight = containerHeight;

//         // Update the game scale
//         if (game.scale) {
//             game.scale.resize(newWidth, newHeight);
//         }

//         console.log(`🎮 Game resized to fill container: ${Math.round(newWidth)}x${Math.round(newHeight)}`);
//     }

//     // Initial resize - do it immediately AND after delay to catch both early and late cases
//     resizeGame();
//     setTimeout(resizeGame, 100);

//     // Force MenuScene to recreate itself after resize to fix layout issues
//     setTimeout(() => {
//         resizeGame();
//         const menuScene = game.scene.getScene('MenuScene');
//         if (menuScene && menuScene.scene.isActive()) {
//             menuScene.scene.restart();
//         }
//     }, 200);

//     // Debounced resize handler to avoid excessive calls
//     let resizeTimeout;
//     window.addEventListener('resize', () => {
//         clearTimeout(resizeTimeout);
//         resizeTimeout = setTimeout(resizeGame, 150);
//     });

//     // Also resize when sidebar or topbar are toggled
//     const sidebarToggle = document.getElementById('sidebar-toggle');
//     const topbarToggle = document.getElementById('topbar-toggle');

//     if (sidebarToggle) {
//         sidebarToggle.addEventListener('click', () => {
//             setTimeout(resizeGame, 350); // Wait for CSS transition
//         });
//     }

//     if (topbarToggle) {
//         topbarToggle.addEventListener('click', () => {
//             setTimeout(resizeGame, 350); // Wait for CSS transition
//         });
//     }
// }

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

            // Update time - Format as HH:MM:SS
            const hours = Math.floor(natureScene.gameTime / 3600);
            const minutes = Math.floor((natureScene.gameTime % 3600) / 60);
            const secs = natureScene.gameTime % 60;
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            const uiTime = document.getElementById('ui-time');
            if (uiTime) uiTime.textContent = timeStr;

            // Update fish status panel (now handled by GameHUD scene)
            // updateFishStatus(natureScene);

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
                const uiMode = document.getElementById('ui-mode');

                if (uiDepth) uiDepth.textContent = lureInfo.depth;
                if (uiState) uiState.textContent = lureInfo.state;

                // Update mode indicator based on lure water state
                if (uiMode) {
                    const inWater = gameScene.lure.inWater;
                    uiMode.textContent = inWater ? 'FISHING' : 'OBSERVING';
                    uiMode.style.color = inWater ? '#00ff00' : '#ffaa00'; // Green when fishing, amber when observing
                }

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

            // Time - always count up from zero (HH:MM:SS format for diagnostics)
            const hours = Math.floor(gameScene.gameTime / 3600);
            const minutes = Math.floor((gameScene.gameTime % 3600) / 60);
            const secs = gameScene.gameTime % 60;
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            const uiTime = document.getElementById('ui-time');
            if (uiTime) uiTime.textContent = timeStr;


            // Update fish status panel (now handled by GameHUD scene)
            // updateFishStatus(gameScene);
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

    // Spawn mode removed - spawn buttons are always visible in debug panel (no keyboard/gamepad toggle)
    state.lastB = bBtn.pressed;
    state.lastX = xBtn.pressed;

    // Handle fish list navigation only (spawn mode removed)
    {
        // Only allow fish selection when in OBSERVING mode (lure not in water) and no UI overlays open
        const isObserving = !gameScene.lure || !gameScene.lure.inWater;
        const isUIOpen = gameScene.tackleBoxOpen || (gameScene.notificationSystem && gameScene.notificationSystem.isPausedState());

        if (!isObserving || isUIOpen) return; // Skip fish navigation when fishing or UI is open
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
