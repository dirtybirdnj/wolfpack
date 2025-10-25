# WebGL Bubble Particles - Lake Trout Swim Bladder System

## Overview

This document outlines a realistic swim bladder pressure simulation and bubble particle system for lake trout. When lake trout are brought up from deep water (or swim up naturally), their swim bladder expands due to decreased water pressure. At depths of 15-20 feet, lake trout often expel gas through their mouth in visible bubble clouds.

## Biological Background

### Barotrauma in Lake Trout

**Swim Bladder Function:**
- Swim bladders are gas-filled organs that help fish maintain neutral buoyancy
- Lake trout can regulate swim bladder volume at stable depths
- Rapid depth changes cause pressure differential

**Pressure Relationship:**
- Every 33 feet of depth = 1 atmosphere (14.7 psi) of pressure
- At 60 feet deep: ~2.8 atmospheres
- At 20 feet deep: ~1.6 atmospheres
- At surface: 1 atmosphere

**Critical Depths:**
- **60-40 feet:** Normal operation, no issues
- **40-20 feet:** Swim bladder begins expanding
- **20-15 feet:** Critical zone - fish need to burp
- **15-0 feet:** Emergency expulsion required

### Observable Behavior

When lake trout rise from deep water:
1. Swim bladder gas expands exponentially
2. Fish experiences discomfort/pressure
3. At ~15-20 feet, fish opens mouth and releases gas
4. Visible bubble cloud erupts from mouth
5. Fish experiences relief and resumes normal swimming

This is **especially common** when:
- Anglers reel in deep-hooked fish
- Lake trout chase prey upward
- Fish are startled and flee toward surface

## Technical Implementation

### Architecture Overview

```
Fish Movement (depth changes)
    ↓
Swim Bladder Pressure Calculation
    ↓
Pressure Threshold Check (15-20 feet)
    ↓
Trigger Bubble Emission
    ↓
WebGL Particle System (hardware accelerated)
    ↓
Bubble Physics (rise, wobble, fade)
```

### Component 1: Swim Bladder Physics Model

#### Fish Properties (Add to Fish.js)

```javascript
// In Fish.js constructor (line 113)
// Swim bladder physics - Lake trout specific
if (this.species === 'lake_trout') {
    this.swimBladderPressure = 100;  // 0-100 scale, 100 = equilibrium at spawn depth
    this.lastBurpDepth = this.depth;  // Track depth changes
    this.isBurping = false;           // Currently expelling gas
    this.burpCooldown = 0;            // Frames until can burp again

    // Create bubble particle emitter (see Component 2)
    this.createBubbleEmitter(scene);
}
```

#### Pressure Calculation Algorithm

```javascript
// Add to Fish.js (new method)
updateSwimBladder() {
    if (this.species !== 'lake_trout') return;

    // Calculate depth change since last burp
    const depthChange = this.lastBurpDepth - this.depth;

    // Pressure increases as fish rises (negative depth change)
    if (depthChange > 0) {
        // Exponential pressure increase near surface
        // Formula: pressure_increase = depth_change × (100 / current_depth)
        const pressureIncrease = depthChange * (100 / Math.max(this.depth, 1));
        this.swimBladderPressure = Math.min(100, this.swimBladderPressure + pressureIncrease * 0.5);
    }
    // Pressure decreases as fish descends
    else if (depthChange < 0) {
        const pressureDecrease = Math.abs(depthChange) * 0.3;
        this.swimBladderPressure = Math.max(0, this.swimBladderPressure - pressureDecrease);
    }

    // CRITICAL ZONE: 15-20 feet
    const inCriticalZone = this.depth <= 20 && this.depth >= 15;
    const highPressure = this.swimBladderPressure > 70;

    // Trigger burp if conditions met
    if (inCriticalZone && highPressure && !this.isBurping && this.burpCooldown <= 0) {
        this.triggerSwimBladderBurp();
    }
    // Emergency burp near surface
    else if (this.depth <= 10 && this.swimBladderPressure > 90 && this.burpCooldown <= 0) {
        this.triggerSwimBladderBurp();
    }

    // Slow pressure normalization when at stable depth
    if (Math.abs(depthChange) < 0.5 && this.swimBladderPressure > 50) {
        this.swimBladderPressure = Math.max(50, this.swimBladderPressure - 0.2);
    }

    // Update cooldown
    if (this.burpCooldown > 0) {
        this.burpCooldown--;
    }

    this.lastBurpDepth = this.depth;
}
```

#### Burp Trigger Logic

```javascript
// Add to Fish.js
triggerSwimBladderBurp() {
    if (this.isBurping) return;

    console.log(`${this.name} the Lake Trout burping at ${Math.floor(this.depth)}ft (pressure: ${Math.floor(this.swimBladderPressure)}%)`);

    this.isBurping = true;
    this.burpCooldown = 180; // 3 seconds at 60fps

    // Emit bubble cloud
    this.emitBubbleCloud();

    // Release pressure
    const pressureRelief = Math.min(60, this.swimBladderPressure);
    this.swimBladderPressure = Math.max(0, this.swimBladderPressure - pressureRelief);

    // Fish pauses briefly during burp
    const originalState = this.ai.state;
    this.ai.state = Constants.FISH_STATE.IDLE;

    // Resume normal behavior after 1 second
    this.scene.time.delayedCall(1000, () => {
        this.isBurping = false;
        if (this.ai.state === Constants.FISH_STATE.IDLE) {
            this.ai.state = originalState;
        }
    });

    // Visual feedback
    this.triggerInterestFlash(0.3);
}
```

### Component 2: WebGL Particle System

#### Bubble Texture Creation

```javascript
// In BootScene.js createAssets() method (line 94)
createBubbleTexture() {
    const bubbleGraphics = this.add.graphics();

    // Create realistic bubble with highlight
    // Outer circle (bubble edge)
    bubbleGraphics.fillStyle(0xccffff, 0.6);
    bubbleGraphics.fillCircle(8, 8, 8);

    // Inner highlight (makes it look 3D)
    bubbleGraphics.fillStyle(0xffffff, 0.9);
    bubbleGraphics.fillCircle(6, 6, 3);

    // Rim outline
    bubbleGraphics.lineStyle(1, 0xffffff, 0.8);
    bubbleGraphics.strokeCircle(8, 8, 8);

    bubbleGraphics.generateTexture('bubble', 16, 16);
    bubbleGraphics.destroy();
}
```

#### Particle Emitter Configuration

```javascript
// Add to Fish.js
createBubbleEmitter(scene) {
    this.bubbleEmitter = scene.add.particles(0, 0, 'bubble', {
        // Movement properties
        speed: { min: 20, max: 60 },           // Pixels per second
        angle: { min: -100, max: -80 },        // Upward direction (270° ± 10°)
        gravityY: -100,                        // Negative = bubbles float up

        // Visual properties
        scale: { start: 0.3, end: 0.8 },       // Bubbles expand as they rise
        alpha: { start: 0.8, end: 0 },         // Fade out gradually
        tint: [ 0xccffff, 0xffffff, 0xaaddff ], // Slight color variation

        // Lifecycle
        lifespan: { min: 1500, max: 2500 },    // 1.5-2.5 seconds

        // WebGL features
        blendMode: Phaser.BlendModes.ADD,      // Glow effect

        // Emission
        frequency: -1,                         // Manual emission only
        quantity: 0,
        emitting: false
    });

    this.bubbleEmitter.setDepth(12); // Above fish (10), below UI (20)
}
```

#### Bubble Emission

```javascript
// Add to Fish.js
emitBubbleCloud() {
    if (!this.bubbleEmitter) return;

    // Position emitter at fish's mouth
    const movement = this.ai.getMovementVector();
    const isMovingRight = movement.x >= 0;
    const mouthOffsetX = isMovingRight ? 15 : -15;
    const mouthOffsetY = -5; // Slightly above center (mouth position)

    this.bubbleEmitter.setPosition(
        this.x + mouthOffsetX,
        this.y + mouthOffsetY
    );

    // Calculate bubble count based on pressure
    // More pressure = bigger burp = more bubbles
    const baseBubbles = 10;
    const pressureBubbles = Math.floor((this.swimBladderPressure / 100) * 30);
    const totalBubbles = baseBubbles + pressureBubbles; // 10-40 bubbles

    // Emit burst
    this.bubbleEmitter.explode(totalBubbles);

    // Optional: Play bubble sound effect
    if (this.scene.sound) {
        this.scene.sound.play('bubble_burp', { volume: 0.3 });
    }
}
```

#### Continuous Emitter Update

```javascript
// Add to Fish.js update() method (line 265)
update(lure, allFish = [], baitfishClouds = []) {
    // ... existing code ...

    // Update swim bladder
    this.updateSwimBladder();

    // Keep bubble emitter positioned at fish mouth
    if (this.bubbleEmitter) {
        const movement = this.ai.getMovementVector();
        const isMovingRight = movement.x >= 0;
        const mouthOffsetX = isMovingRight ? 15 : -15;
        const mouthOffsetY = -5;

        this.bubbleEmitter.setPosition(
            this.x + mouthOffsetX,
            this.y + mouthOffsetY
        );
    }

    // ... rest of update ...
}
```

### Component 3: Advanced WebGL Effects

#### Enhanced Bubble Physics

```javascript
// Advanced bubble emitter with realistic physics
createAdvancedBubbleEmitter(scene) {
    this.bubbleEmitter = scene.add.particles(0, 0, 'bubble', {
        // Basic movement
        speed: { min: 20, max: 60 },
        angle: { min: -100, max: -80 },
        gravityY: -100,

        // Wobble effect (bubbles don't rise straight)
        moveToX: { min: -10, max: 10 },        // Horizontal drift
        accelerationY: -20,                    // Accelerate upward

        // Size variation
        scale: {
            start: { min: 0.2, max: 0.4 },
            end: { min: 0.6, max: 1.0 }
        },

        // Rotation (bubbles spin as they rise)
        rotate: { min: 0, max: 360 },
        rotateSpeed: { min: -50, max: 50 },

        // Transparency
        alpha: {
            start: { min: 0.6, max: 0.9 },
            end: 0
        },

        // Color shimmer
        tint: [ 0xccffff, 0xffffff, 0xaaddff, 0x99ddff ],

        // Lifecycle
        lifespan: { min: 1500, max: 2500 },

        // WebGL blend modes
        blendMode: Phaser.BlendModes.ADD,      // Try also: SCREEN, LIGHTEN

        frequency: -1,
        quantity: 0,
        emitting: false
    });

    this.bubbleEmitter.setDepth(12);
}
```

#### Bubble Pop Effect

```javascript
// Add particle death callback for bubble pop
createBubbleEmitter(scene) {
    const emitter = scene.add.particles(0, 0, 'bubble', {
        // ... existing config ...

        // When bubble reaches surface, pop!
        deathZone: {
            type: 'onEnter',
            source: new Phaser.Geom.Rectangle(0, 0, 900, 50) // Top 50px of screen
        }
    });

    // Create mini-splash when bubble pops at surface
    emitter.onParticleDeath((particle) => {
        if (particle.y < 50) {
            // Create tiny splash particles
            this.createSplashEffect(particle.x, particle.y);
        }
    });

    this.bubbleEmitter = emitter;
}

createSplashEffect(x, y) {
    // Tiny water droplets when bubble pops
    const splash = this.scene.add.particles(x, y, 'bubble', {
        speed: { min: 10, max: 30 },
        angle: { min: -180, max: 0 },
        scale: { start: 0.1, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 300,
        quantity: 3,
        blendMode: 'ADD'
    });

    // Destroy after emission
    this.scene.time.delayedCall(500, () => splash.destroy());
}
```

### Component 4: Gameplay Integration

#### Trigger During Fish Fights

```javascript
// In FishFight.js or wherever you handle reeling in fish
update(delta) {
    // ... existing fight logic ...

    // Check if lake trout is being brought up too quickly
    if (this.fish.species === 'lake_trout') {
        const depthChange = this.lastDepth - this.fish.depth;

        // Reeling up faster than 5 feet per second
        if (depthChange > 5 / 60) {  // 60fps
            this.fish.swimBladderPressure += 2;

            // Force burp if pressure too high
            if (this.fish.swimBladderPressure > 85 && this.fish.depth < 20) {
                this.fish.triggerSwimBladderBurp();

                // Show message to player
                this.scene.events.emit('fishMessage', {
                    text: `${this.fish.name} expelled swim bladder gas!`,
                    color: '#00ffff'
                });
            }
        }

        this.lastDepth = this.fish.depth;
    }
}
```

#### UI Feedback

```javascript
// In UIScene.js or GameScene.js
// Show swim bladder pressure gauge for caught fish

this.events.on('fishCaught', (fish) => {
    if (fish.species === 'lake_trout') {
        // Create pressure gauge
        const pressureBar = this.add.graphics();
        pressureBar.setDepth(100);

        // Update pressure display during fight
        const updatePressure = () => {
            pressureBar.clear();

            // Background
            pressureBar.fillStyle(0x333333, 0.8);
            pressureBar.fillRect(650, 500, 200, 20);

            // Pressure level
            const pressureColor = fish.swimBladderPressure > 70 ? 0xff0000 : 0x00ff00;
            pressureBar.fillStyle(pressureColor, 1.0);
            pressureBar.fillRect(650, 500, 200 * (fish.swimBladderPressure / 100), 20);

            // Label
            pressureBar.fillStyle(0xffffff);
            this.add.text(650, 485, 'Swim Bladder Pressure', {
                fontSize: '10px',
                fontFamily: 'Courier New'
            });
        };

        // Update every frame during fight
        this.fightPressureUpdate = this.time.addEvent({
            delay: 100,
            callback: updatePressure,
            loop: true
        });
    }
});
```

#### Random Environmental Burping

```javascript
// In Fish.js AI - fish randomly burp when hunting near surface
// In FishAI.js huntingBaitfishBehavior() (line 798)

huntingBaitfishBehavior(baitfishClouds, lure) {
    // ... existing hunting logic ...

    // Lake trout chasing baitfish upward may need to burp
    if (this.fish.species === 'lake_trout') {
        const chasingUpward = this.targetY < this.fish.y;
        const nearSurface = this.fish.depth < 25;

        if (chasingUpward && nearSurface && Math.random() < 0.02) {
            // 2% chance per frame to burp while hunting near surface
            this.fish.swimBladderPressure = 80;
        }
    }
}
```

## Performance Considerations

### WebGL Hardware Acceleration

**Why WebGL is ideal for bubbles:**
- GPU handles particle physics calculations
- Can render 100+ bubbles at 60fps without CPU strain
- Automatic batching of particles using same texture
- Hardware-accelerated blend modes (ADD, SCREEN)

**Performance metrics:**
- Single fish burp: 10-40 particles
- Multiple fish burping: Up to 200 particles
- WebGL can handle 1000+ particles easily
- Canvas fallback: Limit to 50 particles max

### Memory Usage

```
Bubble texture: ~2KB (16x16 RGBA PNG)
Particle emitter: ~100 bytes per particle
40 bubbles × 100 bytes = 4KB active memory
Minimal overhead
```

### Optimization Tips

```javascript
// Limit total bubbles across all fish
const MAX_TOTAL_BUBBLES = 200;

emitBubbleCloud() {
    // Count active particles across all fish
    const totalParticles = this.scene.allFish
        .reduce((sum, fish) => sum + (fish.bubbleEmitter?.getAliveParticleCount() || 0), 0);

    if (totalParticles > MAX_TOTAL_BUBBLES) {
        console.log('Bubble limit reached, skipping emission');
        return;
    }

    // Proceed with emission
    this.bubbleEmitter.explode(totalBubbles);
}
```

## Visual Design Considerations

### Sonar Aesthetic

Since the game has a sonar display aesthetic:

**Option 1: Realistic Bubbles**
- Translucent spheres with highlights
- White/cyan coloring
- ADD blend mode for glow

**Option 2: Sonar-Style Bubbles**
- Bright circles (like sonar returns)
- Green phosphor-style rendering
- Simple disc shapes

**Option 3: Hybrid**
- Bubbles render as bright sonar returns
- Trail effect shows upward movement
- Pixelated/retro style

### Example Sonar-Style Bubble

```javascript
createSonarBubbleTexture() {
    const graphics = this.add.graphics();

    // Outer ring (sonar return)
    graphics.lineStyle(2, 0x00ff00, 1.0);
    graphics.strokeCircle(8, 8, 6);

    // Inner dot
    graphics.fillStyle(0x00ff00, 0.8);
    graphics.fillCircle(8, 8, 3);

    // Glow
    graphics.lineStyle(1, 0x00ff00, 0.3);
    graphics.strokeCircle(8, 8, 8);

    graphics.generateTexture('bubble_sonar', 16, 16);
    graphics.destroy();
}
```

## Sound Effects

### Bubble Sounds

**Option 1: Web Audio API**
Generate bubble sounds procedurally:

```javascript
createBubbleSound() {
    const audioContext = new AudioContext();

    // High-pitched pop sound
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}
```

**Option 2: Audio Files**
Use free sound libraries:
- https://freesound.org/ (search "bubble")
- Load in BootScene: `this.load.audio('bubble_burp', 'assets/sounds/bubble.mp3')`

## Testing Scenarios

### Test Cases

1. **Deep to shallow rise:**
   - Spawn fish at 80 feet
   - Move fish to 15 feet rapidly
   - Should trigger burp

2. **Gradual ascent:**
   - Fish slowly swims from 60 to 10 feet
   - Multiple burps at 20ft, 15ft, 10ft

3. **Fight scenario:**
   - Hook fish at 70 feet
   - Reel in quickly
   - Pressure builds, burp at 18 feet

4. **Hunting behavior:**
   - Lake trout chases baitfish from 40ft to 12ft
   - Natural burp during pursuit

### Debug Visualization

```javascript
// Add to Fish.js render() method for testing
render() {
    // ... existing render code ...

    // Debug: Show swim bladder pressure
    if (this.species === 'lake_trout' && GameConfig.DEBUG_SWIM_BLADDER) {
        if (!this.debugText) {
            this.debugText = this.scene.add.text(this.x, this.y - 30, '', {
                fontSize: '10px',
                color: '#ff00ff'
            });
            this.debugText.setDepth(100);
        }

        this.debugText.setPosition(this.x, this.y - 30);
        this.debugText.setText(`P:${Math.floor(this.swimBladderPressure)}%`);

        // Pressure bar
        if (!this.debugBar) {
            this.debugBar = this.scene.add.graphics();
            this.debugBar.setDepth(99);
        }

        this.debugBar.clear();
        this.debugBar.lineStyle(1, 0xff00ff);
        this.debugBar.strokeRect(this.x - 20, this.y - 20, 40, 5);
        this.debugBar.fillStyle(0xff00ff, 0.5);
        this.debugBar.fillRect(this.x - 20, this.y - 20, 40 * (this.swimBladderPressure / 100), 5);
    }
}
```

## Future Enhancements

### Advanced Features

1. **Depth-dependent bubble size:**
   - Bubbles expand as they rise (Boyle's Law)
   - Start small at depth, grow larger near surface

2. **Multiple burst types:**
   - Small burps (relief)
   - Large burps (emergency)
   - Continuous stream (severe barotrauma)

3. **Fish health impact:**
   - Not burping causes damage
   - Forced rapid ascent = health loss
   - Adds challenge to catch-and-release

4. **Other species:**
   - Northern pike (physostomous - different bladder type)
   - Smallmouth bass (smaller bladder)
   - Yellow perch (rapid burpers)

## Related Documents

- `sprite-based-fish-rendering.md` - Sprite system for realistic fish
- `src/entities/Fish.js` - Fish entity implementation
- `src/config/GameConfig.js` - Game configuration constants

## References

- Lake Trout Biology: https://www.fishbase.org/summary/2643
- Barotrauma in Fish: NOAA Fisheries research papers
- Phaser 3 Particle System: https://photonstorm.github.io/phaser3-docs/Phaser.GameObjects.Particles.ParticleEmitter.html
- WebGL Blend Modes: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
