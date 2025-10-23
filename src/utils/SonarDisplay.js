import GameConfig from '../config/GameConfig.js';

export class SonarDisplay {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(0); // Render as background
        this.gridOffset = 0;
        this.scanLineX = 0;

        // Noise and interference patterns
        this.noiseParticles = [];
        this.initNoiseParticles();

        // Bottom structure (Lake Champlain lakebed)
        this.bottomProfile = this.generateBottomProfile();

        // Temperature gradient display
        this.thermoclines = [
            { depth: 25, strength: 0.3 },
            { depth: 45, strength: 0.5 },
            { depth: 85, strength: 0.2 }
        ];

        // Create depth marker texts once
        this.depthTexts = [];
        this.createDepthMarkers();
    }
    
    initNoiseParticles() {
        // Create random noise particles for sonar effect
        for (let i = 0; i < 50; i++) {
            this.noiseParticles.push({
                x: Math.random() * GameConfig.CANVAS_WIDTH,
                y: Math.random() * GameConfig.CANVAS_HEIGHT,
                life: Math.random() * 100,
                maxLife: 100 + Math.random() * 100
            });
        }
    }
    
    generateBottomProfile() {
        // Generate a realistic lakebed profile
        const profile = [];
        let depth = GameConfig.MAX_DEPTH - 10;
        
        for (let x = 0; x < GameConfig.CANVAS_WIDTH + 200; x += 20) {
            // Add some variation to simulate rocks, drop-offs, etc.
            depth += (Math.random() - 0.5) * 3;
            depth = Math.max(GameConfig.MAX_DEPTH - 20, Math.min(GameConfig.MAX_DEPTH - 5, depth));
            
            // Occasional structure (rocks, logs)
            if (Math.random() < 0.1) {
                profile.push({ x: x, y: depth * GameConfig.DEPTH_SCALE, type: 'structure' });
            } else {
                profile.push({ x: x, y: depth * GameConfig.DEPTH_SCALE, type: 'normal' });
            }
        }
        
        return profile;
    }
    
    update() {
        // Scroll the grid
        this.gridOffset -= GameConfig.SONAR_SCROLL_SPEED;
        if (this.gridOffset <= -GameConfig.GRID_SIZE) {
            this.gridOffset += GameConfig.GRID_SIZE;
        }
        
        // Update scan line
        this.scanLineX += 2;
        if (this.scanLineX > GameConfig.CANVAS_WIDTH) {
            this.scanLineX = 0;
        }
        
        // Update noise particles
        this.updateNoiseParticles();
        
        // Scroll bottom profile
        this.bottomProfile.forEach(point => {
            point.x -= GameConfig.SONAR_SCROLL_SPEED;
        });
        
        // Add new bottom points as needed
        if (this.bottomProfile[this.bottomProfile.length - 1].x < GameConfig.CANVAS_WIDTH + 100) {
            const lastPoint = this.bottomProfile[this.bottomProfile.length - 1];
            let depth = lastPoint.y / GameConfig.DEPTH_SCALE;
            depth += (Math.random() - 0.5) * 3;
            depth = Math.max(GameConfig.MAX_DEPTH - 20, Math.min(GameConfig.MAX_DEPTH - 5, depth));
            
            this.bottomProfile.push({
                x: lastPoint.x + 20,
                y: depth * GameConfig.DEPTH_SCALE,
                type: Math.random() < 0.1 ? 'structure' : 'normal'
            });
        }
        
        // Remove off-screen bottom points
        this.bottomProfile = this.bottomProfile.filter(point => point.x > -50);
        
        this.render();
    }
    
    updateNoiseParticles() {
        this.noiseParticles.forEach(particle => {
            particle.life++;
            if (particle.life >= particle.maxLife) {
                particle.x = Math.random() * GameConfig.CANVAS_WIDTH;
                particle.y = Math.random() * GameConfig.CANVAS_HEIGHT;
                particle.life = 0;
                particle.maxLife = 100 + Math.random() * 100;
            }
        });
    }
    
    render() {
        this.graphics.clear();

        // Draw background gradient
        this.drawBackgroundGradient();

        // Draw depth zones (visual indicators)
        this.drawDepthZones();

        // Draw depth grid
        this.drawDepthGrid();

        // Draw thermoclines
        this.drawThermoclines();

        // Draw bottom profile
        this.drawBottomProfile();

        // Draw scan line effect
        this.drawScanLine();

        // Draw noise/interference
        this.drawNoise();

        // Draw depth markers
        this.drawDepthMarkers();

        // Draw surface line
        this.drawSurfaceLine();
    }
    
    drawBackgroundGradient() {
        // Subtle gradient to show depth
        for (let y = 0; y < GameConfig.CANVAS_HEIGHT; y += 20) {
            const alpha = y / GameConfig.CANVAS_HEIGHT * 0.3;
            this.graphics.fillStyle(0x001100, alpha);
            this.graphics.fillRect(0, y, GameConfig.CANVAS_WIDTH, 20);
        }
    }

    drawDepthZones() {
        // Draw subtle visual indicators for depth behavior zones
        const zones = GameConfig.DEPTH_ZONES;

        // Surface zone - slight yellow tint
        const surfaceY = zones.SURFACE.max * GameConfig.DEPTH_SCALE;
        this.graphics.fillStyle(0xffff00, 0.02);
        this.graphics.fillRect(0, 0, GameConfig.CANVAS_WIDTH, surfaceY);

        // Mid-column zone - slight green tint
        const midY = zones.MID_COLUMN.min * GameConfig.DEPTH_SCALE;
        const midHeight = (zones.MID_COLUMN.max - zones.MID_COLUMN.min) * GameConfig.DEPTH_SCALE;
        this.graphics.fillStyle(0x00ff00, 0.02);
        this.graphics.fillRect(0, midY, GameConfig.CANVAS_WIDTH, midHeight);

        // Bottom zone - slight gray tint
        const bottomY = zones.BOTTOM.min * GameConfig.DEPTH_SCALE;
        const bottomHeight = GameConfig.CANVAS_HEIGHT - bottomY;
        this.graphics.fillStyle(0x888888, 0.02);
        this.graphics.fillRect(0, bottomY, GameConfig.CANVAS_WIDTH, bottomHeight);

        // Draw zone boundary lines
        this.graphics.lineStyle(1, 0xffff00, 0.15);
        this.graphics.lineBetween(0, surfaceY, GameConfig.CANVAS_WIDTH, surfaceY);

        this.graphics.lineStyle(1, 0x888888, 0.15);
        this.graphics.lineBetween(0, bottomY, GameConfig.CANVAS_WIDTH, bottomY);
    }
    
    drawDepthGrid() {
        // Vertical lines (scrolling)
        this.graphics.lineStyle(1, GameConfig.COLOR_GRID, 0.2);
        for (let x = this.gridOffset; x < GameConfig.CANVAS_WIDTH; x += GameConfig.GRID_SIZE) {
            this.graphics.lineBetween(x, 0, x, GameConfig.CANVAS_HEIGHT);
        }
        
        // Horizontal lines (static - depth markers)
        for (let y = 0; y < GameConfig.CANVAS_HEIGHT; y += GameConfig.GRID_SIZE * 2) {
            const depth = y / GameConfig.DEPTH_SCALE;
            if (depth <= GameConfig.MAX_DEPTH) {
                this.graphics.lineStyle(1, GameConfig.COLOR_GRID, 0.15);
                this.graphics.lineBetween(0, y, GameConfig.CANVAS_WIDTH, y);
            }
        }
    }
    
    drawThermoclines() {
        // Draw temperature layers
        this.thermoclines.forEach(layer => {
            const y = layer.depth * GameConfig.DEPTH_SCALE;
            this.graphics.lineStyle(1, 0x0099ff, layer.strength * 0.3);
            
            // Wavy line to show thermocline
            this.graphics.beginPath();
            this.graphics.moveTo(0, y);
            for (let x = 0; x < GameConfig.CANVAS_WIDTH; x += 10) {
                const wave = Math.sin((x + this.scene.time.now * 0.001) * 0.02) * 3;
                this.graphics.lineTo(x, y + wave);
            }
            this.graphics.strokePath();
        });
    }
    
    drawBottomProfile() {
        // Draw the lakebed
        this.graphics.lineStyle(2, 0x444444, 0.8);
        this.graphics.beginPath();
        
        if (this.bottomProfile.length > 0) {
            this.graphics.moveTo(this.bottomProfile[0].x, this.bottomProfile[0].y);
            
            for (let i = 1; i < this.bottomProfile.length; i++) {
                const point = this.bottomProfile[i];
                this.graphics.lineTo(point.x, point.y);
                
                // Draw structure markers
                if (point.type === 'structure') {
                    this.graphics.fillStyle(0x666666, 0.5);
                    this.graphics.fillRect(point.x - 5, point.y - 10, 10, 10);
                }
            }
        }
        
        this.graphics.strokePath();
        
        // Fill below bottom
        this.graphics.fillStyle(0x222222, 0.3);
        if (this.bottomProfile.length > 0) {
            this.graphics.beginPath();
            this.graphics.moveTo(this.bottomProfile[0].x, this.bottomProfile[0].y);
            
            for (let i = 1; i < this.bottomProfile.length; i++) {
                this.graphics.lineTo(this.bottomProfile[i].x, this.bottomProfile[i].y);
            }
            
            this.graphics.lineTo(GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
            this.graphics.lineTo(0, GameConfig.CANVAS_HEIGHT);
            this.graphics.closePath();
            this.graphics.fillPath();
        }
    }
    
    drawScanLine() {
        // Vertical scanning effect - use main graphics object
        this.graphics.lineStyle(3, GameConfig.COLOR_TEXT, 0.1);
        this.graphics.lineBetween(this.scanLineX, 0, this.scanLineX, GameConfig.CANVAS_HEIGHT);
        this.graphics.lineStyle(2, GameConfig.COLOR_TEXT, 0.2);
        this.graphics.lineBetween(this.scanLineX - 10, 0, this.scanLineX - 10, GameConfig.CANVAS_HEIGHT);
        this.graphics.lineStyle(1, GameConfig.COLOR_TEXT, 0.1);
        this.graphics.lineBetween(this.scanLineX - 20, 0, this.scanLineX - 20, GameConfig.CANVAS_HEIGHT);
    }
    
    drawNoise() {
        // Random noise for sonar effect
        this.noiseParticles.forEach(particle => {
            const alpha = (1 - particle.life / particle.maxLife) * 0.3;
            this.graphics.fillStyle(GameConfig.COLOR_TEXT, alpha);
            this.graphics.fillCircle(particle.x, particle.y, 1);
        });
    }
    
    createDepthMarkers() {
        // Create depth text objects once during initialization
        const textStyle = {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#00ff00'
        };

        for (let depth = 0; depth <= GameConfig.MAX_DEPTH; depth += 25) {
            const y = depth * GameConfig.DEPTH_SCALE;
            if (y <= GameConfig.CANVAS_HEIGHT - 20) {
                const text = this.scene.add.text(5, y - 6, depth + 'ft', textStyle);
                text.setAlpha(0.7);
                text.setDepth(100); // Ensure depth markers are visible
                this.depthTexts.push(text);
            }
        }
    }

    drawDepthMarkers() {
        // Depth markers are already created and visible - nothing to do here
        // They persist across frames
    }
    
    drawSurfaceLine() {
        // Draw water surface
        this.graphics.lineStyle(2, GameConfig.COLOR_SURFACE, 0.5);
        this.graphics.beginPath();
        this.graphics.moveTo(0, 0);
        
        // Animated waves
        for (let x = 0; x < GameConfig.CANVAS_WIDTH; x += 5) {
            const wave = Math.sin((x + this.scene.time.now * 0.002) * 0.01) * 2;
            this.graphics.lineTo(x, wave + 2);
        }
        
        this.graphics.strokePath();
    }
    
    destroy() {
        this.graphics.destroy();
        // Clean up depth marker texts
        this.depthTexts.forEach(text => text.destroy());
        this.depthTexts = [];
    }
}

export default SonarDisplay;
