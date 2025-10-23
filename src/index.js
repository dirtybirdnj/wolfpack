// Lake Champlain Ice Fishing Sonar Game
// Main entry point

import GameConfig from './config/GameConfig.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
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
    scene: [BootScene, GameScene, UIScene],
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
        gamepad: false
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
    // Update dev stats every 100ms
    setInterval(() => {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive()) {
            document.getElementById('fish-count').textContent = gameScene.fishes ? gameScene.fishes.length : 0;
            document.getElementById('dev-score').textContent = gameScene.score || 0;

            if (gameScene.lure) {
                const lureInfo = gameScene.lure.getInfo();
                document.getElementById('dev-depth').textContent = lureInfo.depth;
                document.getElementById('dev-lure-state').textContent = lureInfo.state;
            }

            const minutes = Math.floor(gameScene.gameTime / 60);
            const secs = gameScene.gameTime % 60;
            document.getElementById('dev-time').textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

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
}

function updateFishStatus(gameScene) {
    const container = document.getElementById('fish-status-container');

    if (!gameScene || !gameScene.fishes || gameScene.fishes.length === 0) {
        container.innerHTML = '<div style="color: #888; font-style: italic;">No fish spawned</div>';
        return;
    }

    let html = '';
    gameScene.fishes.forEach((fish, index) => {
        const info = fish.getInfo();
        const zoneColor = fish.depthZone.name === 'Surface' ? '#ffff00' :
                         fish.depthZone.name === 'Mid-Column' ? '#00ff00' : '#888888';

        // Color code hunger (high hunger = red, low = green)
        const hungerColor = fish.hunger > 70 ? '#ff6666' :
                           fish.hunger > 40 ? '#ffaa00' : '#00ff00';

        // Color code health (low health = red, high = green)
        const healthColor = fish.health < 30 ? '#ff6666' :
                           fish.health < 60 ? '#ffaa00' : '#00ff00';

        html += `
            <div style="border-bottom: 1px solid #333; padding: 5px 0; margin-bottom: 5px;">
                <div style="font-weight: bold; color: ${zoneColor};">Fish #${index + 1} (${info.weight})</div>
                <div>Depth: <span style="color: #00ff00;">${Math.floor(fish.depth)} ft</span></div>
                <div>Zone: <span style="color: ${zoneColor};">${fish.depthZone.name}</span></div>
                <div>Speed: <span style="color: #ffaa00;">${fish.speed.toFixed(2)}</span></div>
                <div>Aggro: <span style="color: #ff6666;">${fish.ai.aggressiveness.toFixed(2)}</span></div>
                <div>State: <span style="color: #00ffff;">${fish.ai.state}</span></div>
                <div>Hunger: <span style="color: ${hungerColor};">${info.hunger}</span></div>
                <div>Health: <span style="color: ${healthColor};">${info.health}</span></div>
                <div>Position: (${Math.floor(fish.x)}, ${Math.floor(fish.y)})</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Export for module usage
export default config;
