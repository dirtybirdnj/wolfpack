import GameConfig, { LAKE_CHAMPLAIN_FACTS } from '../config/GameConfig.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    preload() {
        // Create loading bar
        const loadingBar = this.add.graphics({
            fillStyle: {
                color: GameConfig.COLOR_TEXT
            }
        });

        const loadingBox = this.add.graphics({
            fillStyle: {
                color: 0x222222
            }
        });

        loadingBox.fillRect(120, 200, 400, 40);

        // Loading text
        const loadingText = this.add.text(GameConfig.CANVAS_WIDTH / 2, 175, 'Loading...', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#00ff00'
        });
        loadingText.setOrigin(0.5, 0.5);

        // Lake Champlain fact display
        const randomFact = LAKE_CHAMPLAIN_FACTS[Math.floor(Math.random() * LAKE_CHAMPLAIN_FACTS.length)];
        const factText = this.add.text(GameConfig.CANVAS_WIDTH / 2, 280, randomFact, {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#88ff88',
            align: 'center',
            wordWrap: { width: 480 }
        });
        factText.setOrigin(0.5, 0.5);

        // Progress handling
        this.load.on('progress', (value) => {
            loadingBar.clear();
            loadingBar.fillStyle(GameConfig.COLOR_TEXT, 1);
            loadingBar.fillRect(124, 204, 392 * value, 32);
        });

        this.load.on('complete', () => {
            loadingBar.destroy();
            loadingBox.destroy();
            loadingText.destroy();
            factText.destroy();
        });

        // Load sample images for theming
        this.load.image('logo-wolfpack', 'samples/screenshots/pr7-snes-wolfpack-artwork.jpg');
        this.load.image('bg-ice', 'samples/assets/pr7-adirondacks-chunky-ice.jpg');
        this.load.image('bg-sunset', 'samples/assets/pr7-tip-up-sunrise.jpg');
        this.load.image('bg-rod', 'samples/assets/pr7-rod-box-drill-hole-bridge.jpg');
        this.load.image('fish-trophy', 'samples/assets/pr2-lake-trout-photo-1.jpg');

        // Create programmatic assets
        this.createAssets();
    }
    
    createAssets() {
        // Create simple textures programmatically
        
        // Lure texture
        const lureGraphics = this.add.graphics();
        lureGraphics.fillStyle(GameConfig.COLOR_LURE, 1);
        lureGraphics.fillCircle(16, 16, 8);
        lureGraphics.generateTexture('lure', 32, 32);
        lureGraphics.destroy();
        
        // Fish texture (different sizes)
        const fishSizes = ['small', 'medium', 'large'];
        fishSizes.forEach((size, index) => {
            const fishGraphics = this.add.graphics();
            const sizeMultiplier = (index + 1) * 5;
            fishGraphics.fillStyle(GameConfig.COLOR_FISH_MEDIUM, 1);
            fishGraphics.fillEllipse(20, 16, sizeMultiplier * 2, sizeMultiplier);
            fishGraphics.generateTexture(`fish_${size}`, 40, 32);
            fishGraphics.destroy();
        });
        
        // Particle texture for effects
        const particleGraphics = this.add.graphics();
        particleGraphics.fillStyle(0xffffff, 1);
        particleGraphics.fillCircle(4, 4, 4);
        particleGraphics.generateTexture('particle', 8, 8);
        particleGraphics.destroy();
    }
    
    create() {
        // Auto-proceed to menu after a brief moment
        // No "press space" wait screen - just go straight to mode select
        this.time.delayedCall(100, () => {
            this.startGame();
        });
    }

    update() {
        // No update needed - auto-proceeds in create()
    }
    
    startGame() {
        // Fade out and start menu
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }
}

export default BootScene;
