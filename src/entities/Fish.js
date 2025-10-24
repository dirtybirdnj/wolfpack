import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import FishAI from './FishAI.js';

export class Fish {
    constructor(scene, x, y, size = 'MEDIUM') {
        this.scene = scene;

        // World coordinates (actual position in the lake)
        this.worldX = x;

        // Screen coordinates (for rendering - calculated based on player position)
        this.x = x;
        this.y = y;
        this.depth = y / GameConfig.DEPTH_SCALE;
        
        // Fish properties
        this.size = Constants.FISH_SIZE[size];
        this.weight = Utils.randomBetween(this.size.min, this.size.max);
        this.baseSpeed = Utils.randomBetween(GameConfig.FISH_SPEED_MIN, GameConfig.FISH_SPEED_MAX);
        this.points = this.size.points;

        // Depth zone behavior
        this.depthZone = this.getDepthZone();
        this.speed = this.baseSpeed * this.depthZone.speedMultiplier;

        // AI controller
        this.ai = new FishAI(this);
        
        // Visual properties for sonar display
        this.sonarTrail = [];
        this.maxTrailLength = 30;
        this.sonarStrength = this.calculateSonarStrength();
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(10); // Render above sonar background but below UI

        // State
        this.caught = false;
        this.visible = true;
        this.age = 0;

        // Biological properties
        this.hunger = Utils.randomBetween(20, 80); // 0-100, higher = more hungry
        this.health = Utils.randomBetween(60, 100); // 0-100, higher = healthier
        this.lastFed = 0; // Game time when last fed

        // Frenzy behavior - lake trout get excited when they see others chasing
        this.inFrenzy = false;
        this.frenzyTimer = 0; // Time remaining in frenzy state
        this.frenzyIntensity = 0; // 0-1, increases with more frenzied fish nearby
    }
    
    calculateSonarStrength() {
        // Larger fish produce stronger sonar returns
        if (this.weight > 25) return 'strong';
        if (this.weight > 10) return 'medium';
        return 'weak';
    }

    updateBiology() {
        // Hunger increases slowly over time (every ~5 seconds at 60fps)
        if (this.age % 300 === 0) {
            this.hunger = Math.min(100, this.hunger + 1);
        }

        // Health is affected by hunger levels
        if (this.hunger > 85) {
            // Very hungry - health decreases
            if (this.age % 600 === 0) {
                this.health = Math.max(0, this.health - 0.5);
            }
        } else if (this.hunger < 30) {
            // Well fed - health increases slowly
            if (this.age % 600 === 0) {
                this.health = Math.min(100, this.health + 0.5);
            }
        }

        // Frenzy timer decay
        if (this.frenzyTimer > 0) {
            this.frenzyTimer--;
            if (this.frenzyTimer <= 0) {
                this.inFrenzy = false;
                this.frenzyIntensity = 0;
            }
        }

        // Clamp values
        this.hunger = Math.max(0, Math.min(100, this.hunger));
        this.health = Math.max(0, Math.min(100, this.health));
    }

    getDepthZone() {
        // Determine which depth zone the fish is in
        const zones = GameConfig.DEPTH_ZONES;
        if (this.depth >= zones.BOTTOM.min && this.depth <= zones.BOTTOM.max) {
            return zones.BOTTOM;
        } else if (this.depth >= zones.MID_COLUMN.min && this.depth < zones.MID_COLUMN.max) {
            return zones.MID_COLUMN;
        } else {
            return zones.SURFACE;
        }
    }
    
    update(lure, allFish = []) {
        if (this.caught) {
            this.handleCaught();
            return;
        }

        this.age++;

        // Update biological state
        this.updateBiology();

        // Update depth zone (fish may change zones as they move)
        this.depth = this.y / GameConfig.DEPTH_SCALE;
        this.depthZone = this.getDepthZone();
        this.speed = this.baseSpeed * this.depthZone.speedMultiplier;

        // Update AI with info about other fish for frenzy detection
        this.ai.update(lure, this.scene.time.now, allFish);

        // Get movement from AI
        const movement = this.ai.getMovementVector();

        // Apply movement in world coordinates
        this.worldX += movement.x;
        this.y += movement.y;
        this.depth = this.y / GameConfig.DEPTH_SCALE;

        // Keep fish in depth bounds
        this.y = Math.max(10, Math.min(GameConfig.MAX_DEPTH * GameConfig.DEPTH_SCALE - 10, this.y));

        // Convert world position to screen position based on player's current hole
        const currentHole = this.scene.iceHoleManager.getCurrentHole();
        if (currentHole) {
            const playerWorldX = currentHole.x;
            const offsetFromPlayer = this.worldX - playerWorldX;
            this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;
        } else {
            // Fallback if no hole exists
            this.x = this.worldX;
        }

        // Update sonar trail
        this.updateSonarTrail();

        // Remove fish if too far from player in world coordinates (beyond ~500 units)
        if (currentHole) {
            const distanceFromPlayer = Math.abs(this.worldX - currentHole.x);
            if (distanceFromPlayer > 500) {
                this.visible = false;
            }
        }
        
        // Render
        this.render();
    }
    
    updateSonarTrail() {
        // Add current position to trail
        this.sonarTrail.push({
            x: this.x,
            y: this.y,
            strength: this.sonarStrength,
            age: 0
        });
        
        // Age trail points and remove old ones
        this.sonarTrail = this.sonarTrail.filter(point => {
            point.age++;
            return point.age < this.maxTrailLength;
        });
    }
    
    render() {
        this.graphics.clear();
        
        if (!this.visible) return;
        
        // Choose color based on sonar strength and state
        let color;
        if (this.ai.state === Constants.FISH_STATE.STRIKING) {
            color = GameConfig.COLOR_FISH_STRONG;
        } else {
            switch (this.sonarStrength) {
                case 'strong':
                    color = GameConfig.COLOR_FISH_STRONG;
                    break;
                case 'medium':
                    color = GameConfig.COLOR_FISH_MEDIUM;
                    break;
                default:
                    color = GameConfig.COLOR_FISH_WEAK;
            }
        }
        
        // Draw sonar trail (arc-like pattern)
        for (let i = 0; i < this.sonarTrail.length; i++) {
            const point = this.sonarTrail[i];
            const alpha = 1 - (point.age / this.maxTrailLength);

            // Create arc-like sonar return
            const arcSize = this.weight / 5 + 3;

            // Draw a simple line to simulate sonar trail
            if (i > 0) {
                const prevPoint = this.sonarTrail[i - 1];
                this.graphics.lineStyle(2, color, alpha * 0.3);
                this.graphics.lineBetween(prevPoint.x, prevPoint.y, point.x, point.y);
            }
        }

        // Draw detection range circle - shows fish awareness zone
        // Horizontal detection range
        this.graphics.lineStyle(1, color, 0.15);
        this.graphics.strokeCircle(this.x, this.y, GameConfig.DETECTION_RANGE);

        // Vertical detection range - ellipse showing tall vertical awareness
        this.graphics.lineStyle(1, color, 0.1);
        this.graphics.strokeEllipse(this.x, this.y, GameConfig.DETECTION_RANGE, GameConfig.VERTICAL_DETECTION_RANGE);

        // Draw realistic lake trout based on reference photos
        const bodySize = Math.max(8, this.weight / 2); // Larger, more visible

        // Get movement direction to orient the fish
        const movement = this.ai.getMovementVector();
        const isMovingRight = movement.x >= 0;

        // Main body - grayish-olive color (top/back)
        this.graphics.fillStyle(GameConfig.COLOR_FISH_BODY, 1.0);
        this.graphics.fillEllipse(this.x, this.y, bodySize * 2.5, bodySize * 0.8);

        // Belly - cream/pinkish lighter color (bottom half)
        this.graphics.fillStyle(GameConfig.COLOR_FISH_BELLY, 0.8);
        this.graphics.fillEllipse(this.x, this.y + bodySize * 0.2, bodySize * 2.2, bodySize * 0.5);

        // Tail fin - pale cream color
        const tailSize = bodySize * 0.7;
        const tailX = isMovingRight ? this.x - bodySize * 1.25 : this.x + bodySize * 1.25;
        const tailY = this.y;

        this.graphics.fillStyle(GameConfig.COLOR_FISH_FINS, 0.9);
        this.graphics.beginPath();

        if (isMovingRight) {
            // Tail points left when moving right
            this.graphics.moveTo(tailX, tailY);
            this.graphics.lineTo(tailX - tailSize, tailY - tailSize * 0.6);
            this.graphics.lineTo(tailX - tailSize, tailY + tailSize * 0.6);
        } else {
            // Tail points right when moving left
            this.graphics.moveTo(tailX, tailY);
            this.graphics.lineTo(tailX + tailSize, tailY - tailSize * 0.6);
            this.graphics.lineTo(tailX + tailSize, tailY + tailSize * 0.6);
        }

        this.graphics.closePath();
        this.graphics.fillPath();

        // Dorsal and pectoral fins - pale cream
        this.graphics.fillStyle(GameConfig.COLOR_FISH_FINS, 0.7);
        // Dorsal fin (top)
        this.graphics.fillTriangle(
            this.x, this.y - bodySize * 0.5,
            this.x - bodySize * 0.3, this.y - bodySize * 1.2,
            this.x + bodySize * 0.3, this.y - bodySize * 1.2
        );
        // Pectoral fins (sides)
        const finX = isMovingRight ? this.x - bodySize * 0.3 : this.x + bodySize * 0.3;
        this.graphics.fillTriangle(
            finX, this.y,
            finX + (isMovingRight ? -1 : 1) * bodySize * 0.4, this.y - bodySize * 0.3,
            finX + (isMovingRight ? -1 : 1) * bodySize * 0.4, this.y + bodySize * 0.3
        );

        // Light spots pattern - characteristic of lake trout
        const numSpots = Math.floor(this.weight / 5) + 3;
        for (let i = 0; i < numSpots; i++) {
            const offsetX = (Math.random() - 0.5) * bodySize * 1.8;
            const offsetY = (Math.random() - 0.5) * bodySize * 0.5;
            this.graphics.fillStyle(GameConfig.COLOR_FISH_SPOTS, 0.6);
            this.graphics.fillCircle(this.x + offsetX, this.y + offsetY, 1.5);
        }
        
        // Frenzy indicator - bright orange glow when in feeding frenzy
        if (this.inFrenzy) {
            const glowSize = bodySize * 2.5 + (Math.sin(this.age * 0.2) * 3);
            this.graphics.lineStyle(2, 0xff6600, 0.6 + (this.frenzyIntensity * 0.4));
            this.graphics.strokeCircle(this.x, this.y, glowSize);
        }

        // State indicator (for debugging/gameplay feedback)
        if (this.ai.state === Constants.FISH_STATE.INTERESTED) {
            // Show a "?" when interested
            this.graphics.lineStyle(1, GameConfig.COLOR_TEXT, 0.5);
            this.graphics.strokeCircle(this.x, this.y - 10, 5);
        } else if (this.ai.state === Constants.FISH_STATE.CHASING) {
            // Show pursuit indicator
            this.graphics.lineStyle(2, GameConfig.COLOR_FISH_STRONG, 0.7);
            this.graphics.lineBetween(this.x - 10, this.y, this.x - 5, this.y);
        }
    }
    
    handleCaught() {
        // Animation when fish is caught
        this.graphics.clear();
        this.graphics.lineStyle(3, GameConfig.COLOR_FISH_STRONG, 1);
        this.graphics.strokeCircle(this.x, this.y, 15);
        this.graphics.lineStyle(2, GameConfig.COLOR_LURE, 0.8);
        this.graphics.strokeCircle(this.x, this.y, 20);
        
        // Remove after animation
        setTimeout(() => {
            this.visible = false;
        }, 500);
    }
    
    getInfo() {
        return {
            weight: this.weight.toFixed(1) + ' lbs',
            depth: Math.floor(this.depth) + ' ft',
            state: this.ai.state,
            points: this.points,
            hunger: Math.floor(this.hunger) + '%',
            health: Math.floor(this.health) + '%',
            inFrenzy: this.inFrenzy,
            frenzyIntensity: this.frenzyIntensity.toFixed(2)
        };
    }
    
    destroy() {
        this.graphics.destroy();
    }
}

export default Fish;
