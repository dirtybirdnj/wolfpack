# Sprite-Based Realistic Fish Rendering

## Overview

This document outlines how to upgrade from the current graphics-based fish rendering to a sprite-based system with realistic fish artwork and animations.

## Current System

**Location:** `src/entities/Fish.js:388-732`

Currently, fish are rendered using Phaser's Graphics API with programmatic drawing:
- Lake trout: Ellipse body with fins (`renderLakeTrout()`)
- Northern pike: Torpedo shape with spots (`renderNorthernPike()`)
- Smallmouth bass: Deep body with vertical bars (`renderSmallmouthBass()`)
- Yellow perch: Golden body with bars (`renderYellowPerch()`)

**Pros of current approach:**
- ✅ No asset files needed
- ✅ Fully dynamic (can modify colors/shapes programmatically)
- ✅ Lightweight

**Cons of current approach:**
- ❌ Limited visual detail
- ❌ No texture/shading
- ❌ Static appearance (no swimming animation)
- ❌ Less realistic

## Proposed Sprite System

### Architecture Overview

Replace Graphics API rendering with Phaser sprite-based rendering:

```
Current:   Graphics.fillEllipse() → Custom draw functions
Proposed:  Sprite animations → Frame-based rendering
```

### Sprite Sheet Structure

Each species needs a sprite sheet with animation frames:

```
lake_trout.png (512x128 pixels)
┌─────────┬─────────┬─────────┬─────────┐
│ Frame 0 │ Frame 1 │ Frame 2 │ Frame 3 │
│  Idle   │  Swim1  │  Swim2  │  Swim3  │
└─────────┴─────────┴─────────┴─────────┘
   128x128   128x128   128x128   128x128

Optional additional frames:
┌─────────┬─────────┬─────────┐
│ Frame 4 │ Frame 5 │ Frame 6 │
│ Strike1 │ Strike2 │ Strike3 │
└─────────┴─────────┴─────────┘
```

**Recommended sprite dimensions:**
- Lake trout: 128x64 (streamlined, medium depth)
- Northern pike: 160x48 (long, slender)
- Smallmouth bass: 100x72 (short, deep-bodied)
- Yellow perch: 80x60 (small, compact)

### Asset Creation Options

#### Option A: AI-Generated Sprites
Use AI image generators with prompts:

```
"Lake trout fish sprite, side view, transparent background,
pixel art style, sonar display aesthetic, 128x64 pixels,
gray-olive coloring, swimming animation frame"
```

**Tools:**
- DALL-E 3
- Midjourney
- Stable Diffusion
- Leonardo.ai

#### Option B: Photo-Based Sprites
1. Find fish photos from public domain sources:
   - Wikipedia Commons
   - NOAA Fisheries
   - US Fish & Wildlife Service
2. Remove background using:
   - remove.bg
   - Photoshop
   - GIMP
3. Resize and create animation frames

#### Option C: Hand-Drawn Sprites
**Tools:**
- Aseprite (pixel art, $20)
- Piskel (free, web-based)
- GIMP (free, raster graphics)
- Krita (free, illustration)

### Animation System

#### Frame-Based Animations

```javascript
// In BootScene.js create() method
createFishAnimations() {
    // Lake Trout - cruising animation
    this.anims.create({
        key: 'lake_trout_swim',
        frames: this.anims.generateFrameNumbers('lake_trout_sprite', {
            start: 0,
            end: 3
        }),
        frameRate: 8,  // 8 fps = smooth swimming
        repeat: -1     // Loop forever
    });

    // Lake Trout - striking animation
    this.anims.create({
        key: 'lake_trout_strike',
        frames: this.anims.generateFrameNumbers('lake_trout_sprite', {
            start: 4,
            end: 6
        }),
        frameRate: 15,  // Faster for strike
        repeat: 0       // Play once
    });

    // Northern Pike - slow ambush hover
    this.anims.create({
        key: 'pike_swim',
        frames: this.anims.generateFrameNumbers('northern_pike_sprite', {
            start: 0,
            end: 3
        }),
        frameRate: 6,   // Slower - pike are ambush predators
        repeat: -1
    });

    // Northern Pike - explosive burst
    this.anims.create({
        key: 'pike_burst',
        frames: this.anims.generateFrameNumbers('northern_pike_sprite', {
            start: 4,
            end: 7
        }),
        frameRate: 20,  // Very fast burst speed
        repeat: 0
    });

    // Smallmouth Bass - active swimming
    this.anims.create({
        key: 'bass_swim',
        frames: this.anims.generateFrameNumbers('smallmouth_bass_sprite', {
            start: 0,
            end: 3
        }),
        frameRate: 10,
        repeat: -1
    });

    // Yellow Perch - rapid tail beats
    this.anims.create({
        key: 'perch_swim',
        frames: this.anims.generateFrameNumbers('yellow_perch_sprite', {
            start: 0,
            end: 3
        }),
        frameRate: 12,  // Faster - perch are active
        repeat: -1
    });
}
```

#### Animation Frame Rates by Fish Behavior

Different species have different swimming patterns:

| Species | Idle FPS | Chase FPS | Strike FPS | Notes |
|---------|----------|-----------|------------|-------|
| Lake Trout | 8 | 12 | 15 | Steady cruisers, pursuit hunters |
| Northern Pike | 6 | 8 | 20 | Hover/ambush, explosive strikes |
| Smallmouth Bass | 10 | 14 | 16 | Active swimmers, circling behavior |
| Yellow Perch | 12 | 14 | 14 | Constant movement, schooling fish |

### Code Integration

#### 1. Load Sprites in BootScene.js

```javascript
// In BootScene.js preload() method
preload() {
    // ... existing code ...

    // Load fish sprite sheets
    this.load.spritesheet('lake_trout_sprite', 'assets/fish/lake_trout.png', {
        frameWidth: 128,
        frameHeight: 64
    });

    this.load.spritesheet('northern_pike_sprite', 'assets/fish/northern_pike.png', {
        frameWidth: 160,
        frameHeight: 48
    });

    this.load.spritesheet('smallmouth_bass_sprite', 'assets/fish/smallmouth_bass.png', {
        frameWidth: 100,
        frameHeight: 72
    });

    this.load.spritesheet('yellow_perch_sprite', 'assets/fish/yellow_perch.png', {
        frameWidth: 80,
        frameHeight: 60
    });
}
```

#### 2. Modify Fish Constructor

```javascript
// In Fish.js constructor (line 78)
constructor(scene, x, y, size = 'MEDIUM', fishingType = null, species = 'lake_trout') {
    // ... existing properties ...

    // Determine rendering method
    const spriteKey = this.getSpriteKey();
    if (this.scene.textures.exists(spriteKey)) {
        // Use sprite-based rendering
        this.sprite = scene.add.sprite(x, y, spriteKey);
        this.sprite.setDepth(10);
        this.sprite.play(this.getAnimationKey('swim'));
        this.useSprites = true;

        // Scale sprite based on fish weight
        const scale = Math.max(0.5, this.weight / 10);
        this.sprite.setScale(scale);
    } else {
        // Fallback to graphics rendering
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(10);
        this.useSprites = false;
    }
}

getSpriteKey() {
    const spriteMap = {
        'lake_trout': 'lake_trout_sprite',
        'northern_pike': 'northern_pike_sprite',
        'smallmouth_bass': 'smallmouth_bass_sprite',
        'yellow_perch_large': 'yellow_perch_sprite'
    };
    return spriteMap[this.species] || 'lake_trout_sprite';
}

getAnimationKey(type) {
    const animMap = {
        'lake_trout': {
            swim: 'lake_trout_swim',
            strike: 'lake_trout_strike'
        },
        'northern_pike': {
            swim: 'pike_swim',
            strike: 'pike_burst'
        },
        'smallmouth_bass': {
            swim: 'bass_swim',
            strike: 'bass_swim'
        },
        'yellow_perch_large': {
            swim: 'perch_swim',
            strike: 'perch_swim'
        }
    };
    return animMap[this.species]?.[type] || 'lake_trout_swim';
}
```

#### 3. Update Render Method

```javascript
// In Fish.js render() method (line 388)
render() {
    if (!this.visible) {
        if (this.sprite) this.sprite.setVisible(false);
        return;
    }

    if (this.useSprites && this.sprite) {
        // Sprite-based rendering
        this.sprite.setVisible(true);
        this.sprite.setPosition(this.x, this.y);

        // Flip sprite based on movement direction
        const movement = this.ai.getMovementVector();
        const isMovingRight = movement.x >= 0;
        this.sprite.setFlipX(!isMovingRight);

        // Rotate sprite based on angle (diving/rising)
        this.sprite.setRotation(this.angle);

        // Change animation based on AI state
        if (this.ai.state === Constants.FISH_STATE.STRIKING) {
            const strikeAnim = this.getAnimationKey('strike');
            if (this.sprite.anims.currentAnim?.key !== strikeAnim) {
                this.sprite.play(strikeAnim);

                // Return to swim animation after strike
                this.sprite.once('animationcomplete', () => {
                    this.sprite.play(this.getAnimationKey('swim'));
                });
            }
        } else if (this.ai.state === Constants.FISH_STATE.CHASING) {
            // Speed up animation during chase
            if (this.sprite.anims.currentAnim) {
                this.sprite.anims.currentAnim.frameRate = 14;
            }
        } else {
            // Normal swim speed
            if (this.sprite.anims.currentAnim) {
                this.sprite.anims.currentAnim.frameRate = 8;
            }
        }

        // Interest flash effect (still use graphics overlay)
        if (this.interestFlash > 0) {
            if (!this.graphics) this.graphics = this.scene.add.graphics();
            this.graphics.clear();
            const bodySize = Math.max(8, this.weight / 2);
            const flashSize = bodySize * (2 + (1 - this.interestFlash) * 1.5);
            const flashAlpha = this.interestFlash * 0.8;

            this.graphics.lineStyle(3, 0x00ff00, flashAlpha);
            this.graphics.strokeCircle(this.x, this.y, flashSize);

            if (this.interestFlash > 0.7) {
                const pulseSize = flashSize + Math.sin(this.frameAge * 0.3) * 4;
                this.graphics.lineStyle(2, 0x00ff00, flashAlpha * 0.5);
                this.graphics.strokeCircle(this.x, this.y, pulseSize);
            }
        }
    } else {
        // Fallback to current graphics-based rendering
        this.graphics.clear();
        if (!this.visible) return;

        const bodySize = Math.max(8, this.weight / 2);
        const movement = this.ai.getMovementVector();
        const isMovingRight = movement.x >= 0;

        // Call existing render methods
        if (this.species === 'northern_pike') {
            this.renderNorthernPike(bodySize, isMovingRight);
        } else if (this.species === 'smallmouth_bass') {
            this.renderSmallmouthBass(bodySize, isMovingRight);
        } else if (this.species === 'yellow_perch_large') {
            this.renderYellowPerch(bodySize, isMovingRight);
        } else {
            this.renderLakeTrout(bodySize, isMovingRight);
        }

        // Interest flash
        if (this.interestFlash > 0) {
            const flashSize = bodySize * (2 + (1 - this.interestFlash) * 1.5);
            const flashAlpha = this.interestFlash * 0.8;
            this.graphics.lineStyle(3, 0x00ff00, flashAlpha);
            this.graphics.strokeCircle(this.x, this.y, flashSize);
        }
    }
}
```

#### 4. Update Destroy Method

```javascript
// In Fish.js destroy() method
destroy() {
    if (this.graphics) this.graphics.destroy();
    if (this.sprite) this.sprite.destroy();
    if (this.speedPrefText) this.speedPrefText.destroy();
}
```

## Benefits of Sprite System

### Visual Quality
- Realistic fish appearance with proper textures and shading
- Species-specific anatomical details (fin placement, body shape, coloration)
- Professional polish for the game

### Performance
- Sprites are hardware-accelerated by WebGL
- Single draw call per fish vs multiple draw calls for Graphics API
- Better performance with 30+ fish on screen

### Maintainability
- Artists can update fish appearance without touching code
- Easy to add new species (just add sprite sheet + animation config)
- Can create seasonal variants (spawning colors, winter patterns)

### Animation Flexibility
- Tail movement, fin fluttering
- Strike/attack animations
- Species-specific behaviors (pike burst, bass circling)
- Death/caught animations

## Implementation Phases

### Phase 1: Basic Sprite Integration
1. Create simple 4-frame swimming animation for lake trout
2. Implement sprite loading and fallback system
3. Test with graphics fallback for other species

### Phase 2: Full Species Coverage
1. Create sprites for all 4 species
2. Implement species-specific animations
3. Add state-based animation switching (idle/chase/strike)

### Phase 3: Advanced Animations
1. Add strike/attack animations
2. Implement caught/death animations
3. Create frenzy visual effects

### Phase 4: Polish
1. Add seasonal color variations
2. Implement size-based sprite scaling
3. Add particle effects (scales, water disturbance)

## Asset Requirements

### Directory Structure

```
assets/
├── fish/
│   ├── lake_trout.png          (512x128, 4 frames)
│   ├── lake_trout_strike.png   (384x128, 3 frames, optional)
│   ├── northern_pike.png       (640x96, 4 frames)
│   ├── northern_pike_burst.png (512x96, 4 frames, optional)
│   ├── smallmouth_bass.png     (400x144, 4 frames)
│   └── yellow_perch.png        (320x120, 4 frames)
```

### Sprite Sheet Templates

Each species needs:
- **Minimum:** 4-frame swimming loop
- **Recommended:** 4-frame swim + 3-frame strike
- **Advanced:** 4-frame swim + 3-frame strike + 2-frame caught

## Compatibility Notes

- System maintains full backward compatibility with graphics-based rendering
- If sprite assets are missing, falls back to current Graphics API rendering
- No breaking changes to existing Fish.js API
- Can be implemented incrementally (one species at a time)

## Performance Considerations

### Sprite Batching
Phaser automatically batches sprites using the same texture:
- All lake trout rendered in 1 draw call
- All northern pike in 1 draw call
- Much faster than individual Graphics.draw() calls

### Memory Usage
Sprite sheets are loaded once and shared:
- 4 sprite sheets × ~100KB each = ~400KB total
- Current system: 0 KB (programmatic)
- Trade-off: Memory for visual quality and performance

### WebGL vs Canvas
- WebGL mode: Hardware-accelerated sprite rendering (recommended)
- Canvas mode: Software rendering (fallback for older browsers)

## Alternative Approaches

### Hybrid System
Keep Graphics API for certain effects:
- Use sprites for fish bodies
- Use Graphics for interest flash effects
- Use Graphics for sonar trails
- Best of both worlds

### Procedural Generation
Generate sprites programmatically at startup:
- Create detailed fish using advanced Graphics API techniques
- Generate texture once, use as sprite
- No external assets needed
- Less realistic than hand-drawn sprites

## References

- Phaser 3 Sprite Documentation: https://photonstorm.github.io/phaser3-docs/Phaser.GameObjects.Sprite.html
- Phaser 3 Animation System: https://photonstorm.github.io/phaser3-docs/Phaser.Animations.AnimationManager.html
- Fish Photography Reference: https://www.fishbase.org/

## Related Documents

- `webgl-bubble-particles.md` - WebGL particle system for swim bladder effects
- `src/entities/Fish.js` - Current fish rendering implementation
- `src/scenes/BootScene.js` - Asset loading and animation creation
