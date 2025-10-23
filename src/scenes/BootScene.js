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
        
        loadingBox.fillRect(150, 250, 500, 50);
        
        // Loading text
        const loadingText = this.add.text(400, 220, 'Calibrating Sonar...', {
            fontSize: '20px',
            fontFamily: 'Courier New',
            color: '#00ff00'
        });
        loadingText.setOrigin(0.5, 0.5);
        
        // Lake Champlain fact display
        const randomFact = LAKE_CHAMPLAIN_FACTS[Math.floor(Math.random() * LAKE_CHAMPLAIN_FACTS.length)];
        const factText = this.add.text(400, 350, randomFact, {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#88ff88',
            align: 'center',
            wordWrap: { width: 600 }
        });
        factText.setOrigin(0.5, 0.5);
        
        // Progress handling
        this.load.on('progress', (value) => {
            loadingBar.clear();
            loadingBar.fillStyle(GameConfig.COLOR_TEXT, 1);
            loadingBar.fillRect(155, 255, 490 * value, 40);
        });
        
        this.load.on('complete', () => {
            loadingBar.destroy();
            loadingBox.destroy();
            loadingText.destroy();
            factText.destroy();
        });
        
        // Since we're not loading external assets, we can create some programmatic assets
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
        // Display title screen
        this.add.text(400, 150, 'LAKE CHAMPLAIN\nSONAR FISHING', {
            fontSize: '36px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5, 0.5);
        
        this.add.text(400, 250, 'Lake Trout Simulator', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#88ff88'
        }).setOrigin(0.5, 0.5);
        
        // Location text
        this.add.text(400, 320, '45°00\'N 73°15\'W\nBurlington, Vermont', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#66aa66',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        
        // Instructions
        const instructions = [
            'PRESS SPACE TO BEGIN',
            '',
            'Target: Salvelinus namaycush (Lake Trout)',
            'Season: Ice Fishing',
            'Depth Range: 40-100 feet',
            'Water Temp: 38-42°F'
        ].join('\n');
        
        const instructText = this.add.text(400, 450, instructions, {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5, 0.5);
        
        // Start game on spacebar
        this.input.keyboard.once('keydown-SPACE', () => {
            this.startGame();
        });
        
        // Also allow click/tap to start
        this.input.once('pointerdown', () => {
            this.startGame();
        });
    }
    
    startGame() {
        // Fade out and start game
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
            this.scene.start('UIScene');
        });
    }
}

export default BootScene;
