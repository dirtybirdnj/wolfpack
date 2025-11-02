import GameConfig from '../config/GameConfig.js';
import { Constants } from '../utils/Constants.js';

export class Lure {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.startX = x; // Remember starting position
        this.startY = y;
        this.depth = y / GameConfig.DEPTH_SCALE; // Calculate initial depth
        this.velocity = 0;
        this.state = y === 0 ? Constants.LURE_STATE.SURFACE : Constants.LURE_STATE.IDLE;
        this.retrieveSpeed = GameConfig.LURE_MIN_RETRIEVE_SPEED;

        // Baitcasting reel mechanics
        this.weight = 0.5; // Lure weight in ounces (affects drop speed)
        this.spoolReleased = false; // Is the spool currently free-spinning?
        this.triggerControlActive = false; // Is R2 trigger controlling speed?
        this.currentTriggerSpeed = 0; // Current speed from trigger (0-1)

        // Jigging mechanics (right stick control)
        this.jigOffset = 0; // Current jig displacement from base position
        this.baseY = y; // Base Y position before jigging
        this.jigSensitivity = 8; // How much 1 unit of stick movement affects lure (in pixels)
        this.maxJigRange = 20; // Maximum pixels the lure can jig up/down (about 5 feet)
        this.isJigging = false;

        // Visual representation
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(15); // Render on top of fish
        this.trail = [];
        this.maxTrailLength = 20;

        // Vibration effect (for fish bumps)
        this.vibrating = false;
        this.vibrationTime = 0;
        this.vibrationDuration = 0;
        this.vibrationIntensity = 0;
        this.vibrationOffsetX = 0;
        this.vibrationOffsetY = 0;

        // Stats
        this.maxDepthReached = this.depth;
        this.timeInWater = 0;

        // Drop cooldown - prevents auto-drop after catching fish
        this.lastResetTime = 0;
        this.dropCooldownMs = 500; // 500ms cooldown after reset
    }
    
    update() {
        // Keep lure centered horizontally (player is always at center of screen)
        // Use actual game width to handle any screen size/resolution
        const actualGameWidth = this.scene.scale.width || GameConfig.CANVAS_WIDTH;
        this.x = actualGameWidth / 2;
        this.startX = this.x; // Keep startX in sync

        // Update time in water
        if (this.state !== Constants.LURE_STATE.SURFACE) {
            this.timeInWater++;
        }

        // Update vibration effect
        if (this.vibrating) {
            this.vibrationTime++;

            // Calculate decay (vibration gets weaker over time)
            const progress = this.vibrationTime / this.vibrationDuration;
            const decay = 1 - progress;

            if (this.vibrationTime >= this.vibrationDuration) {
                // Vibration finished
                this.vibrating = false;
                this.vibrationOffsetX = 0;
                this.vibrationOffsetY = 0;
            } else {
                // Apply random shake with decay
                const currentIntensity = this.vibrationIntensity * decay;
                this.vibrationOffsetX = (Math.random() - 0.5) * currentIntensity * 2;
                this.vibrationOffsetY = (Math.random() - 0.5) * currentIntensity * 2;
            }
        }

        // Apply physics based on state
        switch (this.state) {
            case Constants.LURE_STATE.DROPPING:
                // Baitcasting mechanics: heavier lure drops faster
                const weightMultiplier = this.weight * 1.5; // Convert oz to speed factor
                this.velocity += GameConfig.LURE_GRAVITY * weightMultiplier;
                const maxFallSpeed = GameConfig.LURE_MAX_FALL_SPEED * weightMultiplier;
                if (this.velocity > maxFallSpeed) {
                    this.velocity = maxFallSpeed;
                }
                this.baseY = this.y; // Update base position while dropping
                break;

            case Constants.LURE_STATE.RETRIEVING:
                // Only set velocity from retrieveSpeed if not using trigger control
                if (!this.triggerControlActive) {
                    this.velocity = -this.retrieveSpeed;
                }
                this.baseY = this.y; // Update base position while retrieving
                break;

            case Constants.LURE_STATE.IDLE:
                // Clutch engaged - no drift, lure stays in place
                this.velocity = 0;
                // Keep baseY stable during IDLE so jigging works properly
                break;
        }

        // Update position (base movement)
        this.y += this.velocity;

        // Apply jig offset on top of base movement
        if (this.isJigging) {
            this.y = this.baseY + this.jigOffset;
        }

        // Get dynamic depth scale from sonar display (adapts to window size)
        const depthScale = this.scene.sonarDisplay ? this.scene.sonarDisplay.getDepthScale() : GameConfig.DEPTH_SCALE;
        this.depth = this.y / depthScale;
        
        // Boundary checks
        if (this.y <= 0) {
            this.y = 0;
            this.depth = 0;
            this.velocity = 0;
            this.state = Constants.LURE_STATE.SURFACE;
        }

        // Get actual bottom depth (use maxDepth from scene)
        const bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;

        // Stop lure at actual lake bottom (reuse depthScale from above)
        // Add small offset so lure appears to rest on the ground visually
        const BOTTOM_OFFSET_PX = 12; // Allow lure to sink 12px into lake bottom visual area
        const bottomY = bottomDepth * depthScale + BOTTOM_OFFSET_PX;
        if (this.y >= bottomY) {
            this.y = bottomY;
            this.depth = bottomDepth; // Keep logical depth at actual bottom
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

        // Apply vibration offset to render position
        const renderX = this.x + this.vibrationOffsetX;
        const renderY = this.y + this.vibrationOffsetY;

        // Draw trail (fading effect) - trail doesn't vibrate, only the lure itself
        for (let i = 0; i < this.trail.length - 1; i++) {
            const alpha = (i / this.trail.length) * 0.5;
            this.graphics.lineStyle(1, GameConfig.COLOR_LURE, alpha);
            this.graphics.lineBetween(
                this.trail[i].x, this.trail[i].y,
                this.trail[i + 1].x, this.trail[i + 1].y
            );
        }

        // Draw lure body (bright spot on sonar) - with vibration
        this.graphics.fillStyle(GameConfig.COLOR_LURE, 1.0);
        this.graphics.fillCircle(renderX, renderY, 4);

        // Glow effect - with vibration
        this.graphics.lineStyle(2, GameConfig.COLOR_LURE, 0.5);
        this.graphics.strokeCircle(renderX, renderY, 6);

        // Pulsing ring (for visibility) - with vibration
        const pulse = Math.sin(this.scene.time.now * 0.005) * 0.3 + 0.4;
        this.graphics.lineStyle(1, GameConfig.COLOR_LURE, pulse);
        this.graphics.strokeCircle(renderX, renderY, 8);
    }
    
    drop() {
        // Check cooldown - prevents auto-drop after catching fish
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastResetTime < this.dropCooldownMs) {
            return; // Still in cooldown period, ignore drop command
        }

        // Release spool - lure starts dropping
        if (this.state === Constants.LURE_STATE.SURFACE) {
            this.timeInWater = 0;
        }
        this.spoolReleased = true;
        this.state = Constants.LURE_STATE.DROPPING;
    }

    retrieve() {
        // Re-engage clutch - immediately stops falling
        if (this.state !== Constants.LURE_STATE.SURFACE) {
            this.velocity = 0; // Immediate stop, no recoil
            this.spoolReleased = false;
            this.state = Constants.LURE_STATE.RETRIEVING;
        }
    }

    /**
     * Retrieve with variable speed based on controller trigger value
     * @param {number} triggerValue - Trigger pressure (0.0 to 1.0)
     */
    retrieveWithTrigger(triggerValue) {
        // Re-engage clutch if dropping (like clicking the reel on a baitcaster)
        if (this.state === Constants.LURE_STATE.DROPPING) {
            this.velocity = 0; // Immediate stop - clutch engaged
            this.spoolReleased = false;
            this.state = Constants.LURE_STATE.RETRIEVING;
            console.log('Clutch engaged - stopped drop');
        } else if (this.state === Constants.LURE_STATE.IDLE) {
            // Start retrieving from idle
            this.state = Constants.LURE_STATE.RETRIEVING;
        } else if (this.state === Constants.LURE_STATE.SURFACE) {
            // Can't retrieve from surface
            this.triggerControlActive = false;
            this.currentTriggerSpeed = 0;
            return;
        }

        // Enable trigger control mode
        this.triggerControlActive = true;

        // Map trigger value (0.0 to 1.0) to retrieve speed
        // Min speed at light pressure, max speed at full pressure
        const minSpeed = GameConfig.LURE_MIN_RETRIEVE_SPEED;
        const maxSpeed = GameConfig.LURE_MAX_RETRIEVE_SPEED; // Use fixed max speed

        // Apply easing curve for better feel (square the input for more control at low end)
        const easedTrigger = triggerValue * triggerValue;
        const speedRange = maxSpeed - minSpeed;
        const targetSpeed = minSpeed + (speedRange * easedTrigger);

        // Store current speed for UI display (0-1 normalized)
        this.currentTriggerSpeed = easedTrigger;

        // Set velocity directly for immediate response
        this.velocity = -targetSpeed;
    }

    stopRetrieve() {
        // Stop reeling - clutch stays engaged, lure holds position
        if (this.state === Constants.LURE_STATE.RETRIEVING) {
            this.velocity = 0; // Hold position, no drift
            this.state = Constants.LURE_STATE.IDLE;
            this.triggerControlActive = false;
            this.currentTriggerSpeed = 0;
        }
    }
    
    adjustSpeed(delta) {
        this.retrieveSpeed += delta * GameConfig.LURE_SPEED_INCREMENT;
        this.retrieveSpeed = Math.max(GameConfig.LURE_MIN_RETRIEVE_SPEED,
                                     Math.min(GameConfig.LURE_MAX_RETRIEVE_SPEED, this.retrieveSpeed));
    }

    /**
     * Apply jigging movement from right analog stick
     * @param {number} stickY - Right stick Y axis value (-1 to 1, where negative is up)
     * @param {number} deadZone - Dead zone threshold (default 0.1)
     */
    applyJig(stickY, deadZone = 0.1) {
        // Only allow jigging when lure is IDLE (not dropping or retrieving)
        if (this.state !== Constants.LURE_STATE.IDLE) {
            this.isJigging = false;
            this.jigOffset = 0;
            return;
        }

        // Check if stick is outside dead zone
        if (Math.abs(stickY) < deadZone) {
            // No jig input - return to base position smoothly
            if (this.isJigging) {
                // Smooth return to base with damping
                this.jigOffset *= 0.8;
                if (Math.abs(this.jigOffset) < 0.5) {
                    this.jigOffset = 0;
                    this.isJigging = false;
                }
            }
            return;
        }

        // Apply jig input
        this.isJigging = true;

        // Convert stick input to jig offset (negative stickY = up = negative offset)
        const targetOffset = stickY * this.jigSensitivity;

        // Clamp to max jig range
        const clampedOffset = Math.max(-this.maxJigRange, Math.min(this.maxJigRange, targetOffset));

        // Smooth the jig movement for realistic feel
        this.jigOffset = this.jigOffset * 0.7 + clampedOffset * 0.3;
    }

    /**
     * Trigger a vibration effect on the lure (for fish bumps)
     * @param {number} intensity - Vibration intensity in pixels (default 3)
     * @param {number} duration - Duration in frames at 60fps (default 20 = ~333ms)
     */
    vibrate(intensity = 3, duration = 20) {
        this.vibrating = true;
        this.vibrationTime = 0;
        this.vibrationDuration = duration;
        this.vibrationIntensity = intensity;
    }

    reset() {
        // Reset to surface (y=0) and center X position
        // The hole/boat is always rendered at the center of the screen,
        // so the lure should drop from the center regardless of mode
        this.x = GameConfig.CANVAS_WIDTH / 2;
        this.y = 0;
        this.depth = 0;
        this.velocity = 0;
        this.state = Constants.LURE_STATE.SURFACE;
        this.trail = [];
        this.timeInWater = 0;

        // Set cooldown timestamp to prevent immediate auto-drop
        this.lastResetTime = this.scene.time.now;
        this.baseY = 0;
        this.jigOffset = 0;
        this.isJigging = false;
        this.triggerControlActive = false;
        this.currentTriggerSpeed = 0;
        this.vibrating = false;
        this.vibrationTime = 0;
        this.vibrationOffsetX = 0;
        this.vibrationOffsetY = 0;
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
