import GameConfig from '../config/GameConfig.js';
import { getBathymetricData } from '../utils/BathymetricData.js';

/**
 * Manages ice fishing holes and player position on the ice
 */
export class IceHoleManager {
    constructor(scene) {
        this.scene = scene;

        // Get bathymetric data for realistic terrain
        this.bathyData = getBathymetricData();

        // Get world position from navigation (if coming from NavigationScene)
        this.worldX = this.scene.registry.get('fishingWorldX') || null;
        this.worldY = this.scene.registry.get('fishingWorldY') || 5000;

        // Hole tracking
        this.holes = [];
        this.currentHoleIndex = 0;

        // Player position on ice (horizontal, in game units)
        this.playerX = 500; // Start at center

        // Drill battery
        this.maxDrillCharges = 4; // Can drill 4 new holes (5 total)
        this.drillChargesRemaining = 4;

        // Movement mode
        this.movementMode = false; // false = fishing, true = moving on ice

        // Graphics
        this.iceGraphics = scene.add.graphics();
        this.iceGraphics.setDepth(1000); // On top of most things

        // Ice surface height (in pixels from top)
        this.iceHeight = 54;

        // Lake bed depth variation (for different hole locations)
        this.lakeBedProfile = this.generateLakeBedProfile();

        // Create initial hole at starting position
        this.drillHole(this.playerX);

        // Initialize UI
        this.updateBatteryUI();
        this.updateHoleUI();

        console.log('🧊 Ice Hole Manager initialized - Starting at hole #1');
    }

    generateLakeBedProfile() {
        /**
         * Generate lake bottom depth profile using real bathymetric data
         * If we have a world position from navigation, use that area
         * Otherwise, use a default location
         */
        const profile = [];

        // Determine the center world X position for this fishing session
        let centerWorldX;
        if (this.worldX !== null) {
            // Use position from NavigationScene
            centerWorldX = this.worldX;
            console.log(`🗺️ Using bathymetric data from navigation position: ${centerWorldX}`);
        } else {
            // Default to mid-depth ice fishing area
            centerWorldX = 5000;
        }

        // Generate profile centered on world position
        for (let x = 0; x < 10000; x += 50) {
            // Convert local game X to world X
            const offsetFromCenter = x - 5000;
            const worldX = centerWorldX + offsetFromCenter;

            // Get depth from bathymetric data
            const depth = this.bathyData.getDepthAtPosition(worldX, this.worldY);

            profile.push({
                x,
                depth,
                worldX // Store world coordinate for reference
            });
        }

        return profile;
    }

    getDepthAtPosition(x) {
        // Get lake bottom depth at specific X position
        const closest = this.lakeBedProfile.reduce((prev, curr) =>
            Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
        );
        return closest.depth;
    }

    drillHole(x) {
        const depth = this.getDepthAtPosition(x);
        const hole = {
            x: x,
            depth: depth,
            drilled: true,
            timestamp: this.scene.time.now
        };

        this.holes.push(hole);
        console.log(`⛏️ Drilled hole #${this.holes.length} at X=${x}, depth=${depth.toFixed(1)}ft`);

        // Play drill sound effect (if you add audio later)
        // this.scene.sound.play('drill');

        return hole;
    }

    canDrillHole() {
        // Check if there's enough battery and not already at a hole
        if (this.drillChargesRemaining <= 0) {
            return { can: false, reason: 'No drill charges remaining!' };
        }

        // Check if too close to existing hole (minimum 100 units apart)
        const tooClose = this.holes.some(hole => Math.abs(hole.x - this.playerX) < 100);
        if (tooClose) {
            return { can: false, reason: 'Too close to existing hole!' };
        }

        return { can: true };
    }

    drillNewHole() {
        const canDrill = this.canDrillHole();
        if (!canDrill.can) {
            console.warn('Cannot drill:', canDrill.reason);
            if (this.scene.notificationSystem) {
                this.scene.notificationSystem.showMessage('Cannot Drill', canDrill.reason);
            }
            return false;
        }

        this.drillChargesRemaining--;
        const hole = this.drillHole(this.playerX);
        this.currentHoleIndex = this.holes.length - 1;

        // Update UI
        this.updateBatteryUI();
        this.updateHoleUI();
        if (this.scene.notificationSystem) {
            this.scene.notificationSystem.showMessage('New Hole Drilled!', `Battery: ${this.drillChargesRemaining} left`);
        }

        return true;
    }

    enterMovementMode() {
        if (this.movementMode) return;

        this.movementMode = true;
        console.log('🚶 Entering movement mode - walking on ice');

        // Retract lure
        this.scene.lure.reset();

        if (this.scene.notificationSystem) {
            this.scene.notificationSystem.showMessage('Movement Mode', 'Walk on ice - L/R to move, drill with Triangle');
        }
    }

    exitMovementMode() {
        if (!this.movementMode) return;

        // Check if at an existing hole
        const nearestHole = this.findNearestHole();
        if (nearestHole && Math.abs(nearestHole.x - this.playerX) < 20) {
            // At a hole - enter fishing mode
            this.movementMode = false;
            this.currentHoleIndex = this.holes.indexOf(nearestHole);

            // Position lure at center of screen (at the hole)
            if (this.scene.lure) {
                this.scene.lure.x = GameConfig.CANVAS_WIDTH / 2;
                this.scene.lure.y = this.iceHeight; // Just below ice surface
                this.scene.lure.depth = 0;
                this.scene.lure.state = 'SURFACE';
            }

            console.log(`🎣 Entering fishing mode at hole #${this.currentHoleIndex + 1}`);
            this.updateHoleUI();
            if (this.scene.notificationSystem) {
                this.scene.notificationSystem.showMessage('Fishing Mode', `At hole #${this.currentHoleIndex + 1}`);
            }
        } else {
            console.warn('Not at a hole! Move to a hole or drill one.');
            if (this.scene.notificationSystem) {
                this.scene.notificationSystem.showMessage('No Hole Here', 'Move to existing hole or drill new one');
            }
        }
    }

    findNearestHole() {
        if (this.holes.length === 0) return null;

        return this.holes.reduce((nearest, hole) => {
            const distToCurrent = Math.abs(hole.x - this.playerX);
            const distToNearest = Math.abs(nearest.x - this.playerX);
            return distToCurrent < distToNearest ? hole : nearest;
        });
    }

    movePlayer(deltaX) {
        if (!this.movementMode) return;

        this.playerX += deltaX;
        this.playerX = Math.max(100, Math.min(9900, this.playerX)); // Keep in bounds
    }

    getCurrentHole() {
        return this.holes[this.currentHoleIndex];
    }

    update() {
        this.render();
    }

    render() {
        this.iceGraphics.clear();

        // Draw ice surface
        this.drawIceSurface();

        // Draw all holes
        this.holes.forEach((hole, index) => {
            this.drawHole(hole, index);
        });

        // Draw player position
        if (this.movementMode) {
            this.drawPlayerOnIce();
        }
    }

    drawIceSurface() {
        // Ice surface background
        const iceColor = 0xe8f4f8; // Light blue-white ice
        const shadowColor = 0xb8d4e8; // Slightly darker for depth

        // Main ice layer
        this.iceGraphics.fillStyle(iceColor, 1.0);
        this.iceGraphics.fillRect(0, 0, GameConfig.CANVAS_WIDTH, this.iceHeight);

        // Ice texture - horizontal lines for cracks
        this.iceGraphics.lineStyle(1, shadowColor, 0.5);
        for (let y = 10; y < this.iceHeight; y += 15) {
            const offset = Math.sin(y * 0.1) * 20;
            this.iceGraphics.lineBetween(offset, y, GameConfig.CANVAS_WIDTH + offset, y);
        }

        // Bottom edge shadow
        this.iceGraphics.fillStyle(shadowColor, 0.6);
        this.iceGraphics.fillRect(0, this.iceHeight - 5, GameConfig.CANVAS_WIDTH, 5);

        // Water line just below ice
        this.iceGraphics.lineStyle(2, 0x4a6f5a, 0.8);
        this.iceGraphics.lineBetween(0, this.iceHeight, GameConfig.CANVAS_WIDTH, this.iceHeight);
    }

    drawHole(hole, index) {
        // ALWAYS calculate screen position relative to player position
        // This makes holes move around the stationary player
        const screenX = this.calculateScreenX(hole.x);

        if (screenX < -50 || screenX > GameConfig.CANVAS_WIDTH + 50) return; // Off screen

        const isCurrent = index === this.currentHoleIndex && !this.movementMode;

        // Hole opening (dark circle)
        this.iceGraphics.fillStyle(0x1a3a4a, 1.0);
        this.iceGraphics.fillCircle(screenX, this.iceHeight / 2, 16);

        // Hole rim (lighter)
        this.iceGraphics.lineStyle(2, 0xffffff, 0.8);
        this.iceGraphics.strokeCircle(screenX, this.iceHeight / 2, 16);

        // Current hole indicator
        if (isCurrent) {
            this.iceGraphics.lineStyle(3, 0x00ff00, 1.0);
            this.iceGraphics.strokeCircle(screenX, this.iceHeight / 2, 20);
        }

        // Hole number
        const textColor = isCurrent ? '#00ff00' : '#ffffff';
        const text = this.scene.add.text(screenX, this.iceHeight / 2, `${index + 1}`, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: textColor,
            fontStyle: 'bold'
        });
        text.setOrigin(0.5, 0.5);
        text.setDepth(1001);

        // Clean up text after next frame (since graphics clear each frame)
        this.scene.time.delayedCall(50, () => text.destroy());
    }

    drawPlayerOnIce() {
        const screenX = GameConfig.CANVAS_WIDTH / 2; // Player always centered when moving

        // Player figure (simple person icon)
        // Head
        this.iceGraphics.fillStyle(0xff6600, 1.0);
        this.iceGraphics.fillCircle(screenX, this.iceHeight / 2 - 10, 5);

        // Body
        this.iceGraphics.lineStyle(3, 0xff6600, 1.0);
        this.iceGraphics.lineBetween(screenX, this.iceHeight / 2 - 5, screenX, this.iceHeight / 2 + 5);

        // Legs
        this.iceGraphics.lineBetween(screenX, this.iceHeight / 2 + 5, screenX - 4, this.iceHeight / 2 + 12);
        this.iceGraphics.lineBetween(screenX, this.iceHeight / 2 + 5, screenX + 4, this.iceHeight / 2 + 12);

        // Arms (holding drill)
        this.iceGraphics.lineBetween(screenX, this.iceHeight / 2, screenX - 6, this.iceHeight / 2 + 3);
        this.iceGraphics.lineBetween(screenX, this.iceHeight / 2, screenX + 6, this.iceHeight / 2 - 2);

        // Position indicator below
        const depthHere = this.getDepthAtPosition(this.playerX);
        const text = this.scene.add.text(screenX, this.iceHeight + 15, `Depth: ${depthHere.toFixed(0)}ft`, {
            fontSize: '8px',
            fontFamily: 'Courier New',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        });
        text.setOrigin(0.5, 0);
        text.setDepth(1001);

        this.scene.time.delayedCall(50, () => text.destroy());
    }

    calculateScreenX(worldX) {
        // Convert world X position to screen X when in movement mode
        // Player is centered, so offset everything by player position
        const offset = worldX - this.playerX;
        return (GameConfig.CANVAS_WIDTH / 2) + offset;
    }

    updateBatteryUI() {
        // Update battery charge display
        const chargesEl = document.getElementById('drill-charges');
        if (chargesEl) {
            chargesEl.textContent = `${this.drillChargesRemaining}/${this.maxDrillCharges}`;
        }

        // Update battery bars
        for (let i = 1; i <= this.maxDrillCharges; i++) {
            const barEl = document.getElementById(`battery-bar-${i}`);
            if (barEl) {
                if (i <= this.drillChargesRemaining) {
                    barEl.style.background = 'var(--border-primary)';
                    barEl.style.opacity = '1';
                } else {
                    barEl.style.background = 'var(--text-muted)';
                    barEl.style.opacity = '0.3';
                }
            }
        }
    }

    updateHoleUI() {
        // Update current hole display
        const holeEl = document.getElementById('current-hole');
        if (holeEl) {
            holeEl.textContent = `#${this.currentHoleIndex + 1}`;
        }

        // Update hole depth
        const depthEl = document.getElementById('hole-depth');
        if (depthEl) {
            const currentHole = this.getCurrentHole();
            if (currentHole) {
                depthEl.textContent = `${currentHole.depth.toFixed(0)}ft`;
            }
        }
    }

    destroy() {
        this.iceGraphics.destroy();
    }
}

export default IceHoleManager;
