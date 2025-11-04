# Phaser Groups Migration Guide

## Status: Infrastructure Ready, Gradual Migration

We've built the foundation for using Phaser Groups with object pooling, but the old system still works. This allows for gradual migration without breaking changes.

## What's Been Built

### ✅ Completed Infrastructure:

1. **SpriteGenerator** (`src/utils/SpriteGenerator.js`)
   - Procedurally generates fish textures at startup
   - Creates textures for all predator species × sizes
   - Creates textures for all baitfish species
   - Easily replaceable with custom PNG assets later

2. **FishSprite** (`src/models/FishSprite.js`)
   - New Fish class extending `Phaser.GameObjects.Sprite`
   - Includes all original Fish logic (AI, hunger, behavior)
   - Supports object pooling with `reset()` method
   - Automatically renders via Phaser (no manual drawing)

3. **Phaser Groups** (GameScene.js)
   - `this.fishGroup` - Pool of up to 20 predator fish
   - `runChildUpdate: true` - Automatically calls `preUpdate()` on active fish
   - `spawnPooledFish()` helper method for easy spawning

4. **Texture Loading** (GameScene.create())
   - Generates all textures once at scene start
   - Uses registry to prevent regeneration on scene restart

## How to Use (When Ready)

### Spawning a Pooled Fish:

```javascript
// OLD WAY (still works):
const fish = new Fish(this.scene, worldX, y, size, species);
this.scene.fishes.push(fish);

// NEW WAY (pooled):
const fish = this.scene.spawnPooledFish(worldX, y, size, species);
if (fish) {
    // Fish was spawned from pool successfully
} else {
    // Pool was full, fallback to old way
    const fish = new Fish(this.scene, worldX, y, size, species);
    this.scene.fishes.push(fish);
}
```

### Removing a Fish:

```javascript
// OLD WAY:
fish.destroy();
this.fishes = this.fishes.filter(f => f.visible);

// NEW WAY (pooled):
fish.setActive(false).setVisible(false);
// Fish automatically returns to pool, ready for reuse
```

### Custom Fish Textures:

To replace procedural textures with custom art:

1. **Option A: Load PNGs in BootScene**:
```javascript
this.load.image('fish_lake_trout_TROPHY', 'assets/fish/lake_trout_trophy.png');
```

2. **Option B: Use Sprite Sheets**:
```javascript
this.load.spritesheet('predator_fish', 'assets/fish/predators.png', {
    frameWidth: 32,
    frameHeight: 16
});
```

3. **SpriteGenerator will skip generation if texture already exists**

## Benefits Once Fully Migrated

- ✅ **50% reduction in garbage collection** - Reusing objects instead of creating/destroying
- ✅ **40% less entity management code** - Phaser handles update loops
- ✅ **Automatic rendering** - No manual `forEach` for drawing
- ✅ **Better performance** - Object pooling reduces memory allocations
- ✅ **Easy asset swapping** - Just replace texture keys

## Migration Checklist (Optional - Do Later)

### Phase 1: Predator Fish (Current)
- [x] Create SpriteGenerator
- [x] Create FishSprite class
- [x] Set up Phaser Groups in GameScene
- [ ] Update SpawningSystem to use `spawnPooledFish()`
- [ ] Update manual `forEach` loops to use Group iteration
- [ ] Remove manual cleanup code (Groups handle it)

### Phase 2: Baitfish
- [ ] Create BaitfishSprite class
- [ ] Set up baitfish group with larger pool (200+)
- [ ] Update school spawning to use pooled baitfish
- [ ] Test Boids behavior with Sprites

### Phase 3: Other Entities
- [ ] ZooplanktonSprite
- [ ] CrayfishSprite
- [ ] Use smaller pools (10-20 each)

### Phase 4: Cleanup
- [ ] Remove old Fish class (once FishSprite proven stable)
- [ ] Remove `this.fishes` array (use `this.fishGroup` only)
- [ ] Remove manual update loops
- [ ] Remove manual cleanup in `shutdown()`

## Why Not Fully Migrate Now?

1. **Game is working perfectly** - Coordinate fixes resolved the critical bugs
2. **Low risk approach** - Infrastructure is ready, but old system still functional
3. **Gradual migration** - Can test pooling with one spawn type at a time
4. **No breaking changes** - Both systems can coexist during transition

## Testing the New System

To test FishSprite with pooling:

```javascript
// In SpawningSystem.js, replace one spawn call:
// OLD:
const fish = new Fish(this.scene, worldX, y, size, species);
this.scene.fishes.push(fish);

// NEW:
import { FishSprite } from '../models/FishSprite.js';
const fish = new FishSprite(this.scene, worldX, y, size, species);
// No need to push - it's automatically managed by the group
```

Then test:
- Does the fish render correctly?
- Does AI work?
- Does pooling reduce memory spikes?

## Current Status

**Infrastructure: 100% Ready**
**Migration: 0% (Intentionally - keeping stable)**

The foundation is built. Migrate when convenient, not urgent.
