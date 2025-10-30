import GameConfig from '../config/GameConfig.js';
import { BAITFISH_SPECIES } from '../config/SpeciesData.js';

export class SonarDisplay {
    constructor(scene, fishingType) {
        this.scene = scene;
        this.fishingType = fishingType; // Track fishing type for rendering
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(0); // Render as background
        this.gridOffset = 0;
        this.scanLineX = 0;

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
    }

    getActualMaxDepth() {
        /**
         * Get the actual maximum depth based on fishing type and location
         * @returns {number} Maximum depth in feet
         */
        if (this.scene.boatManager) {
            // Boat/kayak mode: get depth at player's current position
            return this.scene.boatManager.getDepthAtPosition(this.scene.boatManager.playerX);
        } else if (this.scene.iceHoleManager) {
            // Ice fishing mode: get depth from current hole
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            if (currentHole) {
                return currentHole.depth;
            }
        }
        return GameConfig.MAX_DEPTH; // Fallback
    }

    getDepthScale() {
        /**
         * Calculate pixels per foot based on actual max depth
         * This ensures the sonar display scales proportionally
         * @returns {number} Pixels per foot of depth
         */
        const maxDepth = this.getActualMaxDepth();
        return GameConfig.CANVAS_HEIGHT / maxDepth;
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
        // Generate a realistic lakebed profile using actual water depth
        // Keep bottom very close to max depth (within 1-3 feet) to maximize gameplay area
        const maxDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
        const profile = [];
        let depth = maxDepth - 2;

        for (let x = 0; x < GameConfig.CANVAS_WIDTH + 200; x += 20) {
            // Add some variation to simulate rocks, drop-offs, etc.
            depth += (Math.random() - 0.5) * 1;
            depth = Math.max(maxDepth - 3, Math.min(maxDepth - 1, depth));

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
        // No more scrolling - we're stationary at an ice hole!
        // Just update noise particles for visual effect
        this.updateNoiseParticles();

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

        // Draw species legend
        this.drawSpeciesLegend();

        // Draw depth markers
        this.drawDepthMarkers();

        // Draw surface line
        this.drawSurfaceLine();
    }
    
    drawBackgroundGradient() {
        // Realistic olive/army green water gradient - lighter at surface, darker at depth
        // Based on Lake Champlain ice hole reference photos
        for (let y = 0; y < GameConfig.CANVAS_HEIGHT; y += 10) {
            const depthRatio = y / GameConfig.CANVAS_HEIGHT;

            // Interpolate between surface (army green) and deep (olive green)
            // Surface: #5a6f4a (90, 111, 74)
            // Deep: #3a4f3a (58, 79, 58)
            const r = Math.floor(90 - (90 - 58) * depthRatio);
            const g = Math.floor(111 - (111 - 79) * depthRatio);
            const b = Math.floor(74 - (74 - 58) * depthRatio);

            const color = (r << 16) | (g << 8) | b;
            this.graphics.fillStyle(color, 1.0);
            this.graphics.fillRect(0, y, GameConfig.CANVAS_WIDTH, 10);
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
        // Vertical lines (static - no scrolling)
        this.graphics.lineStyle(1, GameConfig.COLOR_GRID, 0.2);
        for (let x = 0; x < GameConfig.CANVAS_WIDTH; x += GameConfig.GRID_SIZE) {
            this.graphics.lineBetween(x, 0, x, GameConfig.CANVAS_HEIGHT);
        }

        // Horizontal lines (static - depth markers) using actual water depth
        const maxDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
        for (let y = 0; y < GameConfig.CANVAS_HEIGHT; y += GameConfig.GRID_SIZE * 2) {
            const depth = y / GameConfig.DEPTH_SCALE;
            if (depth <= maxDepth) {
                this.graphics.lineStyle(1, GameConfig.COLOR_GRID, 0.15);
                this.graphics.lineBetween(0, y, GameConfig.CANVAS_WIDTH, y);
            }
        }
    }
    
    drawThermoclines() {
        const isSummerMode = this.fishingType === GameConfig.FISHING_TYPE_KAYAK ||
                             this.fishingType === GameConfig.FISHING_TYPE_MOTORBOAT;

        if (isSummerMode) {
            // Summer: Draw prominent thermocline at specified depth
            const thermoclineY = GameConfig.THERMOCLINE_DEPTH * GameConfig.DEPTH_SCALE;
            this.graphics.lineStyle(3, 0xff6600, 0.6); // Orange, more visible

            // Wavy line to show thermocline with stronger effect
            this.graphics.beginPath();
            this.graphics.moveTo(0, thermoclineY);
            for (let x = 0; x < GameConfig.CANVAS_WIDTH; x += 10) {
                const wave = Math.sin((x + this.scene.time.now * 0.001) * 0.02) * 5;
                this.graphics.lineTo(x, thermoclineY + wave);
            }
            this.graphics.strokePath();

            // Add label for thermocline
            const thermoclineText = this.scene.add.text(
                GameConfig.CANVAS_WIDTH - 100,
                thermoclineY - 10,
                'THERMOCLINE',
                {
                    fontSize: '10px',
                    fontFamily: 'Courier New',
                    color: '#ff6600',
                    backgroundColor: '#000000',
                    padding: { x: 4, y: 2 }
                }
            );
            thermoclineText.setDepth(100);
            // Clean up text after render
            this.scene.time.delayedCall(50, () => thermoclineText.destroy());
        } else {
            // Winter: Draw subtle temperature layers
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
    }
    
    drawBottomProfile() {
        // For boat/kayak modes, get bottom profile from BoatManager and render relative to player
        // For ice fishing mode, use the static bottom profile
        const isSummerMode = this.fishingType === GameConfig.FISHING_TYPE_KAYAK ||
                             this.fishingType === GameConfig.FISHING_TYPE_MOTORBOAT;

        if (isSummerMode && this.scene.boatManager) {
            // Use BoatManager's lake bed profile and render relative to player position
            this.drawScrollingBottomProfile();
        } else {
            // Ice fishing mode: use static bottom profile
            this.drawStaticBottomProfile();
        }
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

            this.graphics.lineTo(GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
            this.graphics.lineTo(0, GameConfig.CANVAS_HEIGHT);
            this.graphics.closePath();
            this.graphics.fillPath();
        }
    }

    drawScrollingBottomProfile() {
        // Draw lake bed that scrolls with player position (for boat/kayak modes)
        const playerWorldX = this.scene.boatManager.playerX;
        const lakeBedProfile = this.scene.boatManager.lakeBedProfile;

        // Collect all visible points
        const visiblePoints = [];
        for (let i = 0; i < lakeBedProfile.length; i++) {
            const point = lakeBedProfile[i];
            const offsetFromPlayer = point.x - playerWorldX;
            const screenX = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;
            const screenY = point.depth * GameConfig.DEPTH_SCALE;

            if (screenX >= -50 && screenX <= GameConfig.CANVAS_WIDTH + 50) {
                visiblePoints.push({ x: screenX, y: screenY });
            }
        }

        if (visiblePoints.length === 0) return; // No points to draw

        // Draw the lakebed line
        this.graphics.lineStyle(2, 0x444444, 0.8);
        this.graphics.beginPath();
        this.graphics.moveTo(visiblePoints[0].x, visiblePoints[0].y);
        for (let i = 1; i < visiblePoints.length; i++) {
            this.graphics.lineTo(visiblePoints[i].x, visiblePoints[i].y);
        }
        this.graphics.strokePath();

        // Fill below bottom with solid ground - ensure proper polygon closure
        // Use brown/tan earth tone to show solid lake bottom
        this.graphics.fillStyle(0x8b7355, 1.0); // Solid brown earth color
        this.graphics.beginPath();

        // Start from bottom-left corner
        this.graphics.moveTo(0, GameConfig.CANVAS_HEIGHT);

        // If first visible point is not at left edge, draw to it
        if (visiblePoints[0].x > 0) {
            this.graphics.lineTo(visiblePoints[0].x, GameConfig.CANVAS_HEIGHT);
        }

        // Draw along the terrain profile
        for (let i = 0; i < visiblePoints.length; i++) {
            this.graphics.lineTo(visiblePoints[i].x, visiblePoints[i].y);
        }

        // If last visible point is not at right edge, draw to bottom-right
        if (visiblePoints[visiblePoints.length - 1].x < GameConfig.CANVAS_WIDTH) {
            this.graphics.lineTo(visiblePoints[visiblePoints.length - 1].x, GameConfig.CANVAS_HEIGHT);
        }

        // Close at bottom-right corner
        this.graphics.lineTo(GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

        // Close the path back to start
        this.graphics.closePath();
        this.graphics.fillPath();
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
        // Create depth text objects once during initialization using display range
        // Display range is calculated in GameScene to show appropriate depth window
        const displayRange = this.scene.displayRange || GameConfig.MAX_DEPTH;
        const textStyle = {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#00ff00'
        };

        // Create markers at 25ft intervals throughout the display range
        for (let depth = 0; depth <= displayRange; depth += 25) {
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
        const isSummerMode = this.fishingType === GameConfig.FISHING_TYPE_KAYAK ||
                             this.fishingType === GameConfig.FISHING_TYPE_MOTORBOAT;

        if (isSummerMode) {
            // Summer: Draw simple black line at water surface (0 depth)
            this.graphics.lineStyle(2, 0x000000, 1.0);
            this.graphics.lineBetween(0, 0, GameConfig.CANVAS_WIDTH, 0);
        } else {
            // Winter: Draw ice surface (thicker white line on top of black line)
            // First draw the water line
            this.graphics.lineStyle(2, 0x000000, 1.0);
            this.graphics.lineBetween(0, 0, GameConfig.CANVAS_WIDTH, 0);

            // Then draw thicker white ice line on top
            this.graphics.lineStyle(6, 0xffffff, 0.8);
            this.graphics.lineBetween(0, 0, GameConfig.CANVAS_WIDTH, 0);

            // Add some texture to ice
            this.graphics.lineStyle(2, GameConfig.COLOR_SURFACE, 0.5);
            this.graphics.beginPath();
            this.graphics.moveTo(0, 2);

            // Animated waves under ice
            for (let x = 0; x < GameConfig.CANVAS_WIDTH; x += 5) {
                const wave = Math.sin((x + this.scene.time.now * 0.002) * 0.01) * 2;
                this.graphics.lineTo(x, wave + 2);
            }

            this.graphics.strokePath();
        }
    }
    
    drawSpeciesLegend() {
        // Draw a legend showing baitfish species colors
        const legendX = GameConfig.CANVAS_WIDTH - 140;
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

    destroy() {
        this.graphics.destroy();
        // Clean up depth marker texts
        this.depthTexts.forEach(text => text.destroy());
        this.depthTexts = [];
    }
}

export default SonarDisplay;
