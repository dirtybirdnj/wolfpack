import GameConfig from '../config/GameConfig.js';
import { BAITFISH_SPECIES } from '../config/SpeciesData.js';

export class SonarDisplay {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(0); // Render as background
        this.gridOffset = 0;
        this.scanLineX = 0;

        // Cache current dimensions for responsive rendering
        this.canvasWidth = this.scene.scale.width;
        this.canvasHeight = this.scene.scale.height;

        // Cached max depth (updated dynamically)
        this.cachedMaxDepth = GameConfig.MAX_DEPTH;
        this.cachedDepthScale = GameConfig.DEPTH_SCALE;

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

        // Draggable debug boundaries state
        this.debugBoundaryOffsets = {
            baitfishMin: 0,
            baitfishCloudMin: 0,
            fishMin: 0,
            baitfishMax: 0,
            fishMax: 0
        };
        this.dragState = {
            active: false,
            boundaryKey: null,
            startY: 0,
            startOffset: 0
        };

        // Listen for resize events to update dimensions
        this.scene.scale.on('resize', this.handleResize, this);
    }

    getActualMaxDepth() {
        /**
         * Get the actual maximum depth based on current location
         * @returns {number} Maximum depth in feet
         */
        return this.scene.maxDepth || GameConfig.MAX_DEPTH;
    }

    getDepthScale() {
        /**
         * Calculate pixels per foot based on actual max depth and current canvas height
         * This ensures the sonar display scales proportionally
         * Water column height = canvasHeight - LAKE_BOTTOM_RESERVE_PX (96px for brown bottom)
         * @returns {number} Pixels per foot of depth
         */
        const maxDepth = this.getActualMaxDepth();
        const waterColumnHeight = this.canvasHeight - GameConfig.LAKE_BOTTOM_RESERVE_PX;
        return waterColumnHeight / maxDepth;
    }
    
    initNoiseParticles() {
        // Create random noise particles for sonar effect
        for (let i = 0; i < 50; i++) {
            this.noiseParticles.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * this.canvasHeight,
                life: Math.random() * 100,
                maxLife: 100 + Math.random() * 100
            });
        }
    }
    
    generateBottomProfile() {
        // Generate a realistic lakebed profile at fixed Y position
        // Bottom is rendered at canvasHeight - LAKE_BOTTOM_RESERVE_PX (96px from bottom)
        // This ensures the water column fills the screen and bottom area is exactly 96 pixels
        const profile = [];
        const baseBottomY = this.canvasHeight - GameConfig.LAKE_BOTTOM_RESERVE_PX;
        let yOffset = 0; // Variation in bottom contour

        for (let x = 0; x < this.canvasWidth + 200; x += 20) {
            // Add some variation to simulate rocks, drop-offs, etc.
            yOffset += (Math.random() - 0.5) * 2;
            yOffset = Math.max(-10, Math.min(10, yOffset)); // Keep variation within ±10 pixels

            const bottomY = baseBottomY + yOffset;

            // Occasional structure (rocks, logs)
            if (Math.random() < 0.1) {
                profile.push({ x: x, y: bottomY, type: 'structure' });
            } else {
                profile.push({ x: x, y: bottomY, type: 'normal' });
            }
        }

        return profile;
    }
    
    update() {
        // No more scrolling - we're stationary at an ice hole!
        // Just update noise particles for visual effect
        this.updateNoiseParticles();

        this.render();
    }
    
    updateNoiseParticles() {
        this.noiseParticles.forEach(particle => {
            particle.life++;
            if (particle.life >= particle.maxLife) {
                particle.x = Math.random() * this.canvasWidth;
                particle.y = Math.random() * this.canvasHeight;
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

        // Draw species legend
        this.drawSpeciesLegend();

        // Draw depth markers
        this.drawDepthMarkers();

        // Draw surface line
        this.drawSurfaceLine();

        // Draw debug boundaries (fish constraints)
        this.drawDebugBoundaries();
    }
    
    drawBackgroundGradient() {
        // Realistic olive/army green water gradient - lighter at surface, darker at depth
        // Based on Lake Champlain ice hole reference photos
        // Fill entire canvas height to prevent any gaps
        for (let y = 0; y < this.canvasHeight; y += 10) {
            const depthRatio = y / this.canvasHeight;

            // Interpolate between surface (army green) and deep (olive green)
            // Surface: #5a6f4a (90, 111, 74)
            // Deep: #3a4f3a (58, 79, 58)
            const r = Math.floor(90 - (90 - 58) * depthRatio);
            const g = Math.floor(111 - (111 - 79) * depthRatio);
            const b = Math.floor(74 - (74 - 58) * depthRatio);

            const color = (r << 16) | (g << 8) | b;
            this.graphics.fillStyle(color, 1.0);
            this.graphics.fillRect(0, y, this.canvasWidth, 10);
        }
    }

    drawDepthZones() {
        // Draw subtle visual indicators for depth behavior zones
        const zones = GameConfig.DEPTH_ZONES;
        const depthScale = this.getDepthScale();

        // Surface zone - slight yellow tint
        const surfaceY = zones.SURFACE.max * depthScale;
        this.graphics.fillStyle(0xffff00, 0.02);
        this.graphics.fillRect(0, 0, this.canvasWidth, surfaceY);

        // Mid-column zone - slight green tint
        const midY = zones.MID_COLUMN.min * depthScale;
        const midHeight = (zones.MID_COLUMN.max - zones.MID_COLUMN.min) * depthScale;
        this.graphics.fillStyle(0x00ff00, 0.02);
        this.graphics.fillRect(0, midY, this.canvasWidth, midHeight);

        // Bottom zone - slight gray tint
        const bottomY = zones.BOTTOM.min * depthScale;
        const waterColumnBottom = this.canvasHeight - GameConfig.LAKE_BOTTOM_RESERVE_PX;
        const bottomHeight = waterColumnBottom - bottomY;
        this.graphics.fillStyle(0x888888, 0.02);
        this.graphics.fillRect(0, bottomY, this.canvasWidth, bottomHeight);

        // Draw zone boundary lines
        this.graphics.lineStyle(1, 0xffff00, 0.15);
        this.graphics.lineBetween(0, surfaceY, this.canvasWidth, surfaceY);

        this.graphics.lineStyle(1, 0x888888, 0.15);
        this.graphics.lineBetween(0, bottomY, this.canvasWidth, bottomY);
    }
    
    drawDepthGrid() {
        // Vertical lines (static - no scrolling)
        this.graphics.lineStyle(1, GameConfig.COLOR_GRID, 0.2);
        for (let x = 0; x < this.canvasWidth; x += GameConfig.GRID_SIZE) {
            this.graphics.lineBetween(x, 0, x, this.canvasHeight);
        }

        // Horizontal lines (static - depth markers) using actual water depth
        const maxDepth = this.getActualMaxDepth();
        const depthScale = this.getDepthScale();
        const waterColumnBottom = this.canvasHeight - GameConfig.LAKE_BOTTOM_RESERVE_PX;

        for (let y = 0; y < waterColumnBottom; y += GameConfig.GRID_SIZE * 2) {
            const depth = y / depthScale;
            if (depth <= maxDepth) {
                this.graphics.lineStyle(1, GameConfig.COLOR_GRID, 0.15);
                this.graphics.lineBetween(0, y, this.canvasWidth, y);
            }
        }
    }
    
    drawThermoclines() {
        // Ice fishing only: Draw subtle temperature layers
        const depthScale = this.getDepthScale();

        this.thermoclines.forEach(layer => {
            const y = layer.depth * depthScale;
            this.graphics.lineStyle(1, 0x0099ff, layer.strength * 0.3);

            // Wavy line to show thermocline
            this.graphics.beginPath();
            this.graphics.moveTo(0, y);
            for (let x = 0; x < this.canvasWidth; x += 10) {
                const wave = Math.sin((x + this.scene.time.now * 0.001) * 0.02) * 3;
                this.graphics.lineTo(x, y + wave);
            }
            this.graphics.strokePath();
        });
    }
    
    drawBottomProfile() {
        // Ice fishing mode only: use static bottom profile
        this.drawStaticBottomProfile();
    }

    drawStaticBottomProfile() {
        // Draw the lakebed (static, for ice fishing)
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

        // Fill below bottom with solid ground
        this.graphics.fillStyle(0x8b7355, 1.0); // Solid brown earth color
        if (this.bottomProfile.length > 0) {
            this.graphics.beginPath();
            this.graphics.moveTo(this.bottomProfile[0].x, this.bottomProfile[0].y);

            for (let i = 1; i < this.bottomProfile.length; i++) {
                this.graphics.lineTo(this.bottomProfile[i].x, this.bottomProfile[i].y);
            }

            this.graphics.lineTo(this.canvasWidth, this.canvasHeight);
            this.graphics.lineTo(0, this.canvasHeight);
            this.graphics.closePath();
            this.graphics.fillPath();
        }
    }

    drawScanLine() {
        // Vertical scanning effect - use main graphics object
        this.graphics.lineStyle(3, GameConfig.COLOR_TEXT, 0.1);
        this.graphics.lineBetween(this.scanLineX, 0, this.scanLineX, this.canvasHeight);
        this.graphics.lineStyle(2, GameConfig.COLOR_TEXT, 0.2);
        this.graphics.lineBetween(this.scanLineX - 10, 0, this.scanLineX - 10, this.canvasHeight);
        this.graphics.lineStyle(1, GameConfig.COLOR_TEXT, 0.1);
        this.graphics.lineBetween(this.scanLineX - 20, 0, this.scanLineX - 20, this.canvasHeight);
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
        // Create depth text objects once during initialization using display range
        // Display range is calculated in GameScene to show appropriate depth window
        const maxDepth = this.getActualMaxDepth();
        const depthScale = this.getDepthScale();
        const waterColumnBottom = this.canvasHeight - GameConfig.LAKE_BOTTOM_RESERVE_PX;
        const textStyle = {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#00ff00'
        };

        // Create markers at 25ft intervals throughout the water column
        for (let depth = 0; depth <= maxDepth; depth += 25) {
            const y = depth * depthScale;
            if (y <= waterColumnBottom - 10) {
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
        // Ice fishing only: Draw ice surface
        // First draw the water line
        this.graphics.lineStyle(2, 0x000000, 1.0);
        this.graphics.lineBetween(0, 0, this.canvasWidth, 0);

        // Then draw thicker white ice line on top
        this.graphics.lineStyle(6, 0xffffff, 0.8);
        this.graphics.lineBetween(0, 0, this.canvasWidth, 0);

        // Add some texture to ice
        this.graphics.lineStyle(2, GameConfig.COLOR_SURFACE, 0.5);
        this.graphics.beginPath();
        this.graphics.moveTo(0, 2);

        // Animated waves under ice
        for (let x = 0; x < this.canvasWidth; x += 5) {
            const wave = Math.sin((x + this.scene.time.now * 0.002) * 0.01) * 2;
            this.graphics.lineTo(x, wave + 2);
        }

        this.graphics.strokePath();
    }
    
    drawSpeciesLegend() {
        // Draw a legend showing baitfish species colors
        const legendX = this.canvasWidth - 140;
        const legendY = 10;
        const lineHeight = 14;

        // Semi-transparent background
        this.graphics.fillStyle(0x000000, 0.7);
        this.graphics.fillRect(legendX - 5, legendY - 5, 135, 90);
        this.graphics.lineStyle(1, 0x00ff00, 0.5);
        this.graphics.strokeRect(legendX - 5, legendY - 5, 135, 90);

        // Title
        const titleStyle = {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            fontStyle: 'bold'
        };
        const title = this.scene.add.text(legendX, legendY, 'Baitfish:', titleStyle);
        title.setDepth(100);
        this.scene.time.delayedCall(50, () => title.destroy());

        // Species entries
        const species = [
            { name: 'Alewife', color: BAITFISH_SPECIES.alewife.color, rarity: '' },
            { name: 'Smelt', color: BAITFISH_SPECIES.rainbow_smelt.color, rarity: '' },
            { name: 'Perch', color: BAITFISH_SPECIES.yellow_perch.color, rarity: '' },
            { name: 'Sculpin', color: BAITFISH_SPECIES.sculpin.color, rarity: '' },
            { name: 'Cisco', color: BAITFISH_SPECIES.cisco.color, rarity: ' (rare)' }
        ];

        species.forEach((sp, index) => {
            const y = legendY + lineHeight + (index * lineHeight);

            // Color indicator (circle)
            this.graphics.fillStyle(sp.color, 0.8);
            this.graphics.fillCircle(legendX + 4, y + 4, 4);
            this.graphics.lineStyle(1, sp.color, 0.9);
            this.graphics.strokeCircle(legendX + 4, y + 4, 4);

            // Species name
            const textStyle = {
                fontSize: '9px',
                fontFamily: 'Courier New',
                color: '#00ff00'
            };
            const text = this.scene.add.text(legendX + 12, y, sp.name + sp.rarity, textStyle);
            text.setDepth(100);
            this.scene.time.delayedCall(50, () => text.destroy());
        });
    }

    /**
     * Handle pointer down on a debug boundary line
     */
    handleBoundaryPointerDown(boundaryKey, pointer) {
        this.dragState.active = true;
        this.dragState.boundaryKey = boundaryKey;
        this.dragState.startY = pointer.y;
        this.dragState.startOffset = this.debugBoundaryOffsets[boundaryKey];
    }

    /**
     * Handle pointer move for dragging debug boundaries
     */
    handleBoundaryPointerMove(pointer) {
        if (!this.dragState.active || !this.dragState.boundaryKey) return;

        const deltaY = pointer.y - this.dragState.startY;
        this.debugBoundaryOffsets[this.dragState.boundaryKey] = this.dragState.startOffset + deltaY;

        // Log the new position in feet
        const depthScale = this.getDepthScale();
        const offsetInFeet = this.debugBoundaryOffsets[this.dragState.boundaryKey] / depthScale;
        console.log(`${this.dragState.boundaryKey}: ${offsetInFeet.toFixed(2)}ft offset`);
    }

    /**
     * Handle pointer up to stop dragging
     */
    handleBoundaryPointerUp() {
        if (this.dragState.active && this.dragState.boundaryKey) {
            const depthScale = this.getDepthScale();
            const offsetInFeet = this.debugBoundaryOffsets[this.dragState.boundaryKey] / depthScale;
            console.log(`✓ ${this.dragState.boundaryKey} set to ${offsetInFeet.toFixed(2)}ft offset`);
        }
        this.dragState.active = false;
        this.dragState.boundaryKey = null;
    }

    /**
     * Create an interactive zone for a debug boundary line
     */
    createInteractiveZone(boundaryKey, y, color) {
        const zone = this.scene.add.rectangle(this.canvasWidth / 2, y, this.canvasWidth, 16, color, 0);
        zone.setInteractive({ useHandCursor: true, draggable: true });
        zone.setDepth(999);

        // Pointer events
        zone.on('pointerdown', (pointer) => {
            this.handleBoundaryPointerDown(boundaryKey, pointer);
        });

        // Store reference for cleanup
        if (!this.interactiveZones) this.interactiveZones = [];
        this.interactiveZones.push(zone);

        return zone;
    }

    drawDebugBoundaries() {
        // Clean up old interactive zones
        if (this.interactiveZones) {
            this.interactiveZones.forEach(zone => zone.destroy());
            this.interactiveZones = [];
        }

        // Set up global pointer handlers for dragging
        if (!this.pointerMoveHandler) {
            this.pointerMoveHandler = (pointer) => this.handleBoundaryPointerMove(pointer);
            this.pointerUpHandler = () => this.handleBoundaryPointerUp();

            this.scene.input.on('pointermove', this.pointerMoveHandler);
            this.scene.input.on('pointerup', this.pointerUpHandler);
        }

        // Draw visual debug boundaries to show fish movement constraints
        const maxDepth = this.getActualMaxDepth();
        const depthScale = this.getDepthScale();

        // BAITFISH CONSTRAINTS
        // Minimum Y for baitfish (0.25 feet from surface)
        const baitfishMinY = 0.25 * depthScale + this.debugBoundaryOffsets.baitfishMin;
        this.graphics.lineStyle(3, 0xff0000, 0.8); // RED line - baitfish minimum
        this.graphics.lineBetween(0, baitfishMinY, this.canvasWidth, baitfishMinY);
        this.createInteractiveZone('baitfishMin', baitfishMinY, 0xff0000);

        // Add label for baitfish minimum
        const baitfishMinLabel = this.scene.add.text(10, baitfishMinY + 5, 'BAITFISH MIN (0.25ft)', {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#ff0000',
            backgroundColor: '#000000'
        });
        baitfishMinLabel.setDepth(1000);
        this.scene.time.delayedCall(50, () => baitfishMinLabel.destroy());

        // BAITFISH CLOUD CONSTRAINTS
        // Minimum Y for baitfish clouds (0.5 feet from surface)
        const baitfishCloudMinY = 0.5 * depthScale + this.debugBoundaryOffsets.baitfishCloudMin;
        this.graphics.lineStyle(3, 0xff8800, 0.8); // ORANGE line - baitfish cloud minimum
        this.graphics.lineBetween(0, baitfishCloudMinY, this.canvasWidth, baitfishCloudMinY);
        this.createInteractiveZone('baitfishCloudMin', baitfishCloudMinY, 0xff8800);

        // Add label for baitfish cloud minimum
        const cloudMinLabel = this.scene.add.text(10, baitfishCloudMinY + 5, 'BAITFISH CLOUD MIN (0.5ft)', {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#ff8800',
            backgroundColor: '#000000'
        });
        cloudMinLabel.setDepth(1000);
        this.scene.time.delayedCall(50, () => cloudMinLabel.destroy());

        // FISH CONSTRAINTS (Regular fish like lakers)
        // Minimum Y for fish (0 feet - can reach surface)
        const fishMinY = 0 + this.debugBoundaryOffsets.fishMin;
        this.graphics.lineStyle(2, 0x00ff00, 0.6); // GREEN line - fish minimum (at surface)
        this.graphics.lineBetween(0, fishMinY, this.canvasWidth, fishMinY);
        this.createInteractiveZone('fishMin', fishMinY, 0x00ff00);

        // Add label for fish minimum
        const fishMinLabel = this.scene.add.text(10, fishMinY + 2, 'FISH MIN (0ft - SURFACE)', {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            backgroundColor: '#000000'
        });
        fishMinLabel.setDepth(1000);
        this.scene.time.delayedCall(50, () => fishMinLabel.destroy());

        // MAXIMUM CONSTRAINTS
        // Maximum Y for baitfish (3 feet from bottom)
        const baitfishMaxY = (maxDepth - 3) * depthScale + this.debugBoundaryOffsets.baitfishMax;
        this.graphics.lineStyle(2, 0x00ffff, 0.6); // CYAN line - baitfish maximum
        this.graphics.lineBetween(0, baitfishMaxY, this.canvasWidth, baitfishMaxY);
        this.createInteractiveZone('baitfishMax', baitfishMaxY, 0x00ffff);

        // Add label for baitfish maximum
        const baitfishMaxLabel = this.scene.add.text(10, baitfishMaxY - 15, `BAITFISH MAX (${maxDepth-3}ft)`, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#00ffff',
            backgroundColor: '#000000'
        });
        baitfishMaxLabel.setDepth(1000);
        this.scene.time.delayedCall(50, () => baitfishMaxLabel.destroy());

        // Maximum Y for fish (5 feet from bottom)
        const fishMaxY = (maxDepth - 5) * depthScale + this.debugBoundaryOffsets.fishMax;
        this.graphics.lineStyle(2, 0x0088ff, 0.6); // BLUE line - fish maximum
        this.graphics.lineBetween(0, fishMaxY, this.canvasWidth, fishMaxY);
        this.createInteractiveZone('fishMax', fishMaxY, 0x0088ff);

        // Add label for fish maximum
        const fishMaxLabel = this.scene.add.text(10, fishMaxY - 15, `FISH MAX (${maxDepth-5}ft)`, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#0088ff',
            backgroundColor: '#000000'
        });
        fishMaxLabel.setDepth(1000);
        this.scene.time.delayedCall(50, () => fishMaxLabel.destroy());

        // Draw legend box for debug boundaries
        const legendX = this.canvasWidth - 250;
        const legendY = this.canvasHeight - 120;

        this.graphics.fillStyle(0x000000, 0.8);
        this.graphics.fillRect(legendX - 5, legendY - 5, 240, 110);
        this.graphics.lineStyle(2, 0xffff00, 0.8);
        this.graphics.strokeRect(legendX - 5, legendY - 5, 240, 110);

        const legendTitle = this.scene.add.text(legendX, legendY, '🐟 DEBUG: FISH BOUNDARIES', {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#ffff00',
            fontStyle: 'bold'
        });
        legendTitle.setDepth(1000);
        this.scene.time.delayedCall(50, () => legendTitle.destroy());

        const legendItems = [
            { color: '#ff0000', text: 'Baitfish Min (0.25ft)' },
            { color: '#ff8800', text: 'Cloud Min (0.5ft)' },
            { color: '#00ff00', text: 'Fish Min (Surface)' },
            { color: '#00ffff', text: 'Baitfish Max (3ft from bottom)' },
            { color: '#0088ff', text: 'Fish Max (5ft from bottom)' }
        ];

        legendItems.forEach((item, index) => {
            const y = legendY + 18 + (index * 16);
            const legendItem = this.scene.add.text(legendX, y, `█ ${item.text}`, {
                fontSize: '9px',
                fontFamily: 'Courier New',
                color: item.color
            });
            legendItem.setDepth(1000);
            this.scene.time.delayedCall(50, () => legendItem.destroy());
        });
    }

    handleResize(gameSize) {
        // Update cached dimensions when window resizes
        this.canvasWidth = gameSize.width;
        this.canvasHeight = gameSize.height;

        // Regenerate bottom profile with new dimensions
        this.bottomProfile = this.generateBottomProfile();

        // Reinitialize noise particles for new dimensions
        this.noiseParticles = [];
        this.initNoiseParticles();

        console.log(`📐 SonarDisplay resized to: ${gameSize.width}x${gameSize.height}`);
    }

    destroy() {
        // Remove resize listener
        this.scene.scale.off('resize', this.handleResize, this);

        // Remove drag event listeners
        if (this.pointerMoveHandler) {
            this.scene.input.off('pointermove', this.pointerMoveHandler);
            this.pointerMoveHandler = null;
        }
        if (this.pointerUpHandler) {
            this.scene.input.off('pointerup', this.pointerUpHandler);
            this.pointerUpHandler = null;
        }

        // Clean up interactive zones
        if (this.interactiveZones) {
            this.interactiveZones.forEach(zone => zone.destroy());
            this.interactiveZones = [];
        }

        this.graphics.destroy();
        // Clean up depth marker texts
        this.depthTexts.forEach(text => text.destroy());
        this.depthTexts = [];
    }
}

export default SonarDisplay;
