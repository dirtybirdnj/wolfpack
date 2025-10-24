// Lake Champlain Ice Fishing Sonar Game
// Main entry point

import GameConfig from './config/GameConfig.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import UIScene from './scenes/UIScene.js';

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: GameConfig.CANVAS_WIDTH,
    height: GameConfig.CANVAS_HEIGHT,
    parent: 'game-container',
    backgroundColor: GameConfig.COLOR_BACKGROUND,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene, UIScene],
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
    // Create the game instance
    const game = new Phaser.Game(config);
    
    // Add some debug info to console
    console.log('%c🎣 Lake Champlain Ice Fishing Sonar Game 🎣', 'color: #00ff00; font-size: 20px; font-weight: bold;');
    console.log('%cBuilt with Phaser 3', 'color: #88ff88; font-size: 14px;');
    console.log('%cTarget Species: Salvelinus namaycush (Lake Trout)', 'color: #88ff88; font-size: 12px;');
    console.log('%cLocation: 45°00\'N 73°15\'W - Burlington, Vermont', 'color: #88ff88; font-size: 12px;');

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
        if (gameScene && gameScene.scene.isActive()) {
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

    // Spawn Fish Button
    document.getElementById('spawn-fish-btn').addEventListener('click', () => {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive()) {
            gameScene.trySpawnFish();
            console.log('Spawned 1 fish');
        }
    });

    // Spawn 5 Fish Button
    document.getElementById('spawn-5-fish-btn').addEventListener('click', () => {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive()) {
            for (let i = 0; i < 5; i++) {
                gameScene.trySpawnFish();
            }
            console.log('Spawned 5 fish');
        }
    });

    // Reset Game Button
    document.getElementById('reset-game-btn').addEventListener('click', () => {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive()) {
            gameScene.scene.restart();
            console.log('Game reset');
        }
    });

    // Toggle Debug Info Button
    let debugMode = false;
    document.getElementById('toggle-debug-btn').addEventListener('click', () => {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive()) {
            debugMode = !debugMode;
            gameScene.debugMode = debugMode;
            console.log('Debug mode:', debugMode ? 'ON' : 'OFF');

            // Visual feedback
            const btn = document.getElementById('toggle-debug-btn');
            btn.textContent = debugMode ? 'Debug: ON' : 'Toggle Debug Info';
            btn.style.background = debugMode ? '#ffaa00' : '#00ff00';
        }
    });

    // Lure Weight Buttons
    const lureWeights = [0.25, 0.5, 1, 2, 3, 4];
    lureWeights.forEach(weight => {
        const btn = document.getElementById(`lure-weight-${weight}`);
        if (btn) {
            btn.addEventListener('click', () => {
                const gameScene = game.scene.getScene('GameScene');
                if (gameScene && gameScene.scene.isActive() && gameScene.lure) {
                    gameScene.lure.weight = weight;
                    document.getElementById('current-lure-weight').textContent = `${weight}oz`;
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
            document.getElementById('current-lure-weight').textContent = `${gameScene.lure.weight}oz`;
            // Highlight default weight button
            const defaultBtn = document.getElementById(`lure-weight-${gameScene.lure.weight}`);
            if (defaultBtn) {
                defaultBtn.style.background = '#ffaa00';
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
