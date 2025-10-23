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
});

// Export for module usage
export default config;
