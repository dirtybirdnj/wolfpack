import GameConfig from '../config/GameConfig.js';
import { Constants, Utils } from '../utils/Constants.js';
import FishAI from './FishAI.js';

export class Fish {
    constructor(scene, x, y, size = 'MEDIUM') {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.depth = y / GameConfig.DEPTH_SCALE;
        
        // Fish properties
        this.size = Constants.FISH_SIZE[size];
        this.weight = Utils.randomBetween(this.size.min, this.size.max);
        this.speed = Utils.randomBetween(GameConfig.FISH_SPEED_MIN, GameConfig.FISH_SPEED_MAX);
        this.points = this.size.points;
        
        // AI controller
        this.ai = new FishAI(this);
        
        // Visual properties for sonar display
        this.sonarTrail = [];
        this.maxTrailLength = 30;
        this.sonarStrength = this.calculateSonarStrength();
        this.graphics = scene.add.graphics();
        
        // State
        this.caught = false;
        this.visible = true;
        this.age = 0;
    }
    
    calculateSonarStrength() {
        // Larger fish produce stronger sonar returns
        if (this.weight > 25) return 'strong';
        if (this.weight > 10) return 'medium';
        return 'weak';
    }
    
    update(lure) {
        if (this.caught) {
            this.handleCaught();
            return;
        }
        
        this.age++;
        
        // Update AI
        this.ai.update(lure, this.scene.time.now);
        
        // Get movement from AI
        const movement = this.ai.getMovementVector();
        
        // Apply movement
        this.x += movement.x;
        this.y += movement.y;
        this.depth = this.y / GameConfig.DEPTH_SCALE;
        
        // Keep fish in bounds
        this.y = Math.max(10, Math.min(GameConfig.MAX_DEPTH * GameConfig.DEPTH_SCALE - 10, this.y));
        
        // Update sonar trail
        this.updateSonarTrail();
        
        // Remove fish if it goes off screen
        if (this.x < -50 || this.x > GameConfig.CANVAS_WIDTH + 50) {
            this.visible = false;
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
            this.graphics.lineStyle(2, color, alpha * 0.3);
            const arcSize = this.weight / 5 + 3;
            
            // Draw a curved line to simulate sonar arc
            if (i > 0) {
                const prevPoint = this.sonarTrail[i - 1];
                this.graphics.beginPath();
                this.graphics.moveTo(prevPoint.x, prevPoint.y - arcSize/2);
                this.graphics.quadraticCurveTo(
                    point.x - 5, point.y,
                    point.x, point.y + arcSize/2
                );
                this.graphics.strokePath();
            }
        }
        
        // Draw main fish body (sonar return)
        const bodySize = Math.max(3, this.weight / 3);
        
        // Sonar "blob" effect
        this.graphics.fillStyle(color, 0.8);
        this.graphics.fillEllipse(this.x, this.y, bodySize * 1.5, bodySize);
        
        // Add some texture/noise to make it look more like sonar
        const numDots = Math.floor(this.weight / 8) + 2;
        for (let i = 0; i < numDots; i++) {
            const offsetX = (Math.random() - 0.5) * bodySize;
            const offsetY = (Math.random() - 0.5) * bodySize * 0.5;
            this.graphics.fillStyle(color, Math.random() * 0.5 + 0.3);
            this.graphics.fillCircle(this.x + offsetX, this.y + offsetY, 1);
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
            points: this.points
        };
    }
    
    destroy() {
        this.graphics.destroy();
    }
}

export default Fish;
