import GameConfig from '../config/GameConfig.js';
import { Constants } from '../utils/Constants.js';

export class Lure {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.depth = 0;
        this.velocity = 0;
        this.state = Constants.LURE_STATE.SURFACE;
        this.retrieveSpeed = GameConfig.LURE_MIN_RETRIEVE_SPEED;
        
        // Visual representation
        this.graphics = scene.add.graphics();
        this.trail = [];
        this.maxTrailLength = 20;
        
        // Stats
        this.maxDepthReached = 0;
        this.timeInWater = 0;
    }
    
    update() {
        // Update time in water
        if (this.state !== Constants.LURE_STATE.SURFACE) {
            this.timeInWater++;
        }
        
        // Apply physics based on state
        switch (this.state) {
            case Constants.LURE_STATE.DROPPING:
                this.velocity += GameConfig.LURE_GRAVITY;
                if (this.velocity > GameConfig.LURE_MAX_FALL_SPEED) {
                    this.velocity = GameConfig.LURE_MAX_FALL_SPEED;
                }
                break;
                
            case Constants.LURE_STATE.RETRIEVING:
                this.velocity = -this.retrieveSpeed;
                break;
                
            case Constants.LURE_STATE.IDLE:
                this.velocity *= 0.95; // Slight drift
                break;
        }
        
        // Update position
        this.y += this.velocity;
        this.depth = this.y / GameConfig.DEPTH_SCALE;
        
        // Boundary checks
        if (this.y <= 0) {
            this.y = 0;
            this.depth = 0;
            this.velocity = 0;
            this.state = Constants.LURE_STATE.SURFACE;
        }
        
        if (this.y >= GameConfig.MAX_DEPTH * GameConfig.DEPTH_SCALE) {
            this.y = GameConfig.MAX_DEPTH * GameConfig.DEPTH_SCALE;
            this.depth = GameConfig.MAX_DEPTH;
            this.velocity = 0;
            this.state = Constants.LURE_STATE.IDLE;
        }
        
        // Track max depth
        if (this.depth > this.maxDepthReached) {
            this.maxDepthReached = this.depth;
        }
        
        // Update trail
        this.updateTrail();
        
        // Render
        this.render();
    }
    
    updateTrail() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }
    
    render() {
        this.graphics.clear();
        
        // Draw trail (fading effect)
        for (let i = 0; i < this.trail.length - 1; i++) {
            const alpha = (i / this.trail.length) * 0.5;
            this.graphics.lineStyle(1, GameConfig.COLOR_LURE, alpha);
            this.graphics.lineBetween(
                this.trail[i].x, this.trail[i].y,
                this.trail[i + 1].x, this.trail[i + 1].y
            );
        }
        
        // Draw lure body (bright spot on sonar)
        this.graphics.fillStyle(GameConfig.COLOR_LURE, 1.0);
        this.graphics.fillCircle(this.x, this.y, 4);
        
        // Glow effect
        this.graphics.lineStyle(2, GameConfig.COLOR_LURE, 0.5);
        this.graphics.strokeCircle(this.x, this.y, 6);
        
        // Pulsing ring (for visibility)
        const pulse = Math.sin(this.scene.time.now * 0.005) * 0.3 + 0.4;
        this.graphics.lineStyle(1, GameConfig.COLOR_LURE, pulse);
        this.graphics.strokeCircle(this.x, this.y, 8);
    }
    
    drop() {
        if (this.state === Constants.LURE_STATE.SURFACE) {
            this.timeInWater = 0;
        }
        this.state = Constants.LURE_STATE.DROPPING;
    }
    
    retrieve() {
        if (this.state !== Constants.LURE_STATE.SURFACE) {
            this.state = Constants.LURE_STATE.RETRIEVING;
        }
    }
    
    stopRetrieve() {
        if (this.state === Constants.LURE_STATE.RETRIEVING) {
            this.state = Constants.LURE_STATE.IDLE;
        }
    }
    
    adjustSpeed(delta) {
        this.retrieveSpeed += delta * GameConfig.LURE_SPEED_INCREMENT;
        this.retrieveSpeed = Math.max(GameConfig.LURE_MIN_RETRIEVE_SPEED, 
                                     Math.min(GameConfig.LURE_MAX_RETRIEVE_SPEED, this.retrieveSpeed));
    }
    
    reset() {
        this.y = 0;
        this.depth = 0;
        this.velocity = 0;
        this.state = Constants.LURE_STATE.SURFACE;
        this.trail = [];
        this.timeInWater = 0;
    }
    
    getInfo() {
        return {
            depth: Math.floor(this.depth),
            state: this.state,
            speed: Math.abs(this.velocity).toFixed(1),
            retrieveSpeed: this.retrieveSpeed.toFixed(1)
        };
    }
    
    destroy() {
        this.graphics.destroy();
    }
}

export default Lure;
