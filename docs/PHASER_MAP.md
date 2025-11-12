# Phaser 3 API Quick Reference Map

**Version:** Phaser 3.87.0
**Purpose:** Token-efficient quick reference for wolfpack development
**Focus:** 2D sprite-based fishing game features

---

## Core Classes We Use

### GameObjects (Visual Elements)

```javascript
// SPRITES - Animated game entities
Phaser.GameObjects.Sprite
├── constructor(scene, x, y, texture, frame)
├── setTexture(key, frame)
├── setScale(x, y)
├── setDepth(value)
├── setFlipX(value) / setFlipY(value)
├── setVisible(value)
├── setActive(value)
├── setAlpha(value)
├── setTint(color)
├── preUpdate(time, delta) // Override for custom update logic
└── destroy(fromScene)

// GRAPHICS - Manual drawing (what we currently use)
Phaser.GameObjects.Graphics
├── clear()
├── fillStyle(color, alpha)
├── fillRect(x, y, width, height)
├── fillCircle(x, y, radius)
├── fillEllipse(x, y, width, height)
├── lineStyle(width, color, alpha)
├── strokeRect(x, y, width, height)
├── beginPath() / closePath()
└── save() / restore()

// CONTAINER - Group multiple objects
Phaser.GameObjects.Container
├── constructor(scene, x, y, children)
├── add(child) / remove(child)
├── setPosition(x, y) // Moves all children
├── setVisible(value) // Affects all children
└── list[] // Access children array

// TEXT - Dynamic text rendering
Phaser.GameObjects.Text
├── constructor(scene, x, y, text, style)
├── setText(text)
├── setStyle(style)
└── setOrigin(x, y)
```

---

## Groups & Pooling (SHOULD USE MORE)

```javascript
// GROUP - Object pooling and management
this.add.group({
    classType: FishSprite,        // Class to instantiate
    maxSize: 200,                 // Pool size
    runChildUpdate: true,         // Call preUpdate on children
    createCallback: (fish) => {}, // Init new objects
    removeCallback: (fish) => {}  // Cleanup objects
});

// Methods
group.get(x, y, key, frame)       // Get from pool (creates if needed)
group.getFirst(state, value)      // Find first matching
group.getMatching(property, value) // Find all matching
group.clear(removeFromScene, destroyChild)
group.getLength()                 // Active count
group.isFull()                    // Check if pool exhausted
```

**Why use Groups:**
- ✅ Automatic object pooling (reuse instead of new)
- ✅ Batch operations (setVisible, setDepth on all)
- ✅ Automatic preUpdate calls
- ✅ Better memory management

---

## Scene Lifecycle

```javascript
class MyScene extends Phaser.Scene {
    preload() {
        // Load assets (textures, audio, JSON)
        this.load.image('key', 'path.png');
        this.load.spritesheet('fish', 'fish.png', { frameWidth: 32 });
    }

    create() {
        // Initialize scene (called once)
        this.cameras.main.setBounds(0, 0, width, height);
        this.physics.world.setBounds(0, 0, width, height);
    }

    update(time, delta) {
        // Game loop (called every frame)
        // time = total elapsed ms
        // delta = ms since last frame
    }
}

// Scene management
this.scene.start('SceneKey')      // Start & make active
this.scene.launch('SceneKey')     // Start parallel scene
this.scene.pause('SceneKey')      // Pause updates
this.scene.resume('SceneKey')     // Resume updates
this.scene.stop('SceneKey')       // Stop & destroy
this.scene.get('SceneKey')        // Get scene reference
```

---

## Physics (NOT CURRENTLY USED - CONSIDER)

```javascript
// ARCADE PHYSICS - Simple 2D physics
this.physics.add.sprite(x, y, texture)

// Body properties
sprite.body.setVelocity(x, y)
sprite.body.setAcceleration(x, y)
sprite.body.setDrag(x, y)
sprite.body.setMaxVelocity(x, y)
sprite.body.setBounce(x, y)
sprite.body.setCollideWorldBounds(true)

// Collision detection
this.physics.add.collider(obj1, obj2, callback)
this.physics.add.overlap(obj1, obj2, callback)
this.physics.world.overlap(obj1, obj2) // Boolean check

// Why consider physics:
// - Automatic velocity/acceleration handling
// - Built-in collision detection
// - Less manual math
```

---

## Input Systems

```javascript
// KEYBOARD
this.input.keyboard.createCursorKeys()  // Arrow keys
this.input.keyboard.addKey('W')         // Single key
this.input.keyboard.on('keydown-SPACE', callback)

// Key states
key.isDown / key.isUp
Phaser.Input.Keyboard.JustDown(key)     // Pressed this frame
Phaser.Input.Keyboard.JustUp(key)       // Released this frame

// MOUSE/POINTER
this.input.on('pointerdown', callback)
this.input.on('pointerup', callback)
this.input.on('pointermove', callback)
this.input.on('wheel', callback)
this.input.mouse.disableContextMenu()   // Disable right-click menu

pointer.x / pointer.y
pointer.isDown
pointer.leftButtonDown()
pointer.rightButtonDown()

// GAMEPAD (we use native API, but Phaser has built-in)
this.input.gamepad.on('connected', gamepad => {})
gamepad.buttons[i].value                // 0-1 for triggers
gamepad.axes[i]                         // -1 to 1 for sticks
```

---

## Animation & Tweening

```javascript
// ANIMATIONS (spritesheet frames)
this.anims.create({
    key: 'swim',
    frames: this.anims.generateFrameNumbers('fish', { start: 0, end: 5 }),
    frameRate: 10,
    repeat: -1
});
sprite.play('swim');

// TWEENS (property interpolation)
this.tweens.add({
    targets: sprite,
    x: 400,                      // Move to x=400
    y: 300,
    alpha: 0.5,
    duration: 1000,              // 1 second
    ease: 'Power2',              // Easing function
    yoyo: true,                  // Reverse back
    repeat: -1,                  // Infinite
    onComplete: () => {}
});

// Common easing: Linear, Power2, Bounce, Elastic, Sine, Back
```

---

## Cameras

```javascript
// Main camera
this.cameras.main.setBounds(x, y, width, height)
this.cameras.main.setZoom(1.5)
this.cameras.main.setScroll(x, y)
this.cameras.main.startFollow(sprite, lerp)

// Effects
this.cameras.main.shake(duration, intensity)
this.cameras.main.flash(duration, r, g, b)
this.cameras.main.fade(duration, r, g, b)
this.cameras.main.setBackgroundColor(color)
```

---

## Data Storage

```javascript
// REGISTRY (global data across scenes)
this.registry.set('score', 100)
this.registry.get('score')
this.registry.events.on('changedata-score', callback)

// DATA MANAGER (per-scene data)
this.data.set('health', 50)
this.data.get('health')
this.data.events.on('changedata', callback)

// Why use this:
// - Event-driven updates (UI listens for changes)
// - Decoupled data flow
// - No manual state syncing
```

---

## Math Utilities

```javascript
// DISTANCE
Phaser.Math.Distance.Between(x1, y1, x2, y2)
Phaser.Math.Distance.BetweenPoints(p1, p2)

// ANGLE
Phaser.Math.Angle.Between(x1, y1, x2, y2)
Phaser.Math.Angle.BetweenPoints(p1, p2)
Phaser.Math.RadToDeg(radians)
Phaser.Math.DegToRad(degrees)

// RANDOM
Phaser.Math.Between(min, max)           // Integer
Phaser.Math.FloatBetween(min, max)      // Float
Phaser.Math.RND.pick(array)             // Random element

// INTERPOLATION
Phaser.Math.Linear(p0, p1, t)           // Linear interpolation
Phaser.Math.Clamp(value, min, max)      // Constrain value
```

---

## Time & Events

```javascript
// DELAYED CALLS
this.time.delayedCall(1000, callback, args, scope)

// TIMERS
this.time.addEvent({
    delay: 1000,                  // ms
    callback: () => {},
    loop: true,                   // Repeat forever
    repeat: 5                     // Or specific count
});

// FRAME-BASED
this.time.now                     // Total elapsed ms
delta                             // Frame delta (in update)
```

---

## Particle Effects (NOT USED - CONSIDER)

```javascript
// PARTICLE EMITTER - for splashes, bubbles, etc.
const particles = this.add.particles('texture');
const emitter = particles.createEmitter({
    x: 400,
    y: 300,
    speed: { min: 100, max: 200 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    lifespan: 1000,
    frequency: 50,
    quantity: 2
});

// Use cases:
// - Splash when fish strikes
// - Bubbles from lure
// - Dust when fish hits bottom
```

---

## Best Practices for Wolfpack

### ✅ DO Use
- **Sprites** instead of Graphics for fish (GPU accelerated)
- **Groups** for pooling fish/baitfish (memory efficient)
- **Container** for schools (move entire group)
- **Registry** for game state (score, time, fish caught)
- **Tweens** for smooth animations (lure bobbing, fish strikes)
- **preUpdate()** for entity logic (called automatically)

### ⚠️ CONSIDER Using
- **Arcade Physics** for collision detection (vs manual checks)
- **Particles** for water effects (splashes, bubbles)
- **Timers** instead of frame counters (more reliable)

### ❌ AVOID
- **Manual graphics.clear() every frame** (CPU expensive)
- **Array.filter() on large arrays every frame** (use Groups)
- **Creating new objects in update loop** (use pooling)

---

## Wolfpack-Specific Patterns

### Pattern 1: Fish with Auto-Update
```javascript
export class FishSprite extends Phaser.GameObjects.Sprite {
    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Custom logic here - called automatically by Group
        this.updateAI(time, delta);
        this.updatePhysics(delta);
    }
}

// In scene:
this.fishGroup = this.add.group({
    classType: FishSprite,
    runChildUpdate: true  // Calls preUpdate automatically!
});
```

### Pattern 2: Pooled Spawning
```javascript
spawnFish(species, x, y) {
    const fish = this.fishGroup.get(x, y);
    if (!fish) {
        console.warn('Fish pool exhausted!');
        return null;
    }
    fish.reset(species);  // Custom reset method
    return fish;
}
```

### Pattern 3: Event-Driven UI
```javascript
// GameScene
this.registry.set('fishCaught', 5);

// GameHUD
this.registry.events.on('changedata-fishCaught', (parent, value) => {
    this.fishCountText.setText(`Fish: ${value}`);
});
```

### Pattern 4: Component Composition
```javascript
export class FishSprite extends Sprite {
    constructor(scene, x, y, species) {
        super(scene, x, y, species.texture);

        // Compose behaviors
        if (species.schooling) {
            this.schooling = new SchoolingBehavior(this);
        }
        if (species.hunting) {
            this.hunting = new HuntingBehavior(this);
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        this.schooling?.update(delta);
        this.hunting?.update(delta);
    }
}
```

---

## Common Gotchas

### 1. Constructor Order
```javascript
// ❌ WRONG - texture not loaded yet
constructor() {
    super(scene, x, y, 'fish');  // ERROR if not preloaded
}

// ✅ RIGHT - check in preload()
preload() {
    this.load.image('fish', 'fish.png');
}
```

### 2. Update vs PreUpdate
```javascript
// preUpdate() - for GameObjects (Sprites)
// Called BY Phaser automatically
preUpdate(time, delta) {
    super.preUpdate(time, delta);  // MUST call super!
    // Your logic
}

// update() - for Scenes
// You call this manually or Phaser calls once per frame
update(time, delta) {
    // No super needed
}
```

### 3. Add to Scene
```javascript
// Sprites MUST be added to scene
const sprite = new Phaser.GameObjects.Sprite(scene, x, y, texture);
scene.add.existing(sprite);  // Without this, won't render!

// OR use factory
const sprite = scene.add.sprite(x, y, texture);  // Auto-added
```

### 4. Group vs Array
```javascript
// ❌ Manual array - no pooling, manual updates
this.fishes = [];
this.fishes.push(new FishSprite(...));
this.fishes.forEach(f => f.update());  // Manual!

// ✅ Group - auto pooling, auto updates
this.fishGroup = this.add.group({ classType: FishSprite, runChildUpdate: true });
this.fishGroup.get(x, y);  // Reuses if available
// Updates called automatically!
```

---

## Performance Tips

1. **Use Sprite pools** - Groups with maxSize
2. **Batch draws** - Use spritesheets, not individual images
3. **Limit graphics.clear()** - Use Sprites when possible
4. **Use preUpdate()** - Automatic, no manual iteration
5. **Avoid Array.filter()** - Use Group.getFirst() or maintain state
6. **Cache calculations** - Store distances, don't recalculate every frame
7. **Use depth sorting** - setDepth() once, not every frame

---

## Quick Reference by Use Case

**Spawning fish:**
→ Use `Group.get()` for pooling

**Moving fish:**
→ Use Sprites with `preUpdate()` + velocity

**Detecting collisions:**
→ Use `Phaser.Math.Distance.Between()` or Arcade Physics

**Animating lure:**
→ Use `Tweens` for smooth motion

**Showing UI:**
→ Use `Container` for groups, `Registry` for data

**Playing sounds:**
→ Use `this.sound.add()` and `.play()`

**Drawing water:**
→ Use `Graphics` (current approach is fine)

**School of fish:**
→ Use `Container` or `Group` with Boids logic

---

*Version: Phaser 3.87.0*
*Last Updated: 2025-11-05*
*Wolfpack-specific optimizations included*
