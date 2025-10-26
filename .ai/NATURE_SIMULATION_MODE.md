# Nature Simulation Mode - Technical Reference

## Overview

Nature Simulation is a 4th game mode for the Lake Champlain fishing game. Unlike ice, kayak, and boat fishing modes, there is no player character, no lure, and no user-controlled elements. It's a pure observation mode for watching AI behavior and serves as both a fun toy and a debugging tool.

## Key Characteristics

- **No Player**: No ice hole, boat, or kayak
- **No Lure**: Fish only hunt baitfish, never interact with lure
- **Depth Selection**: User selects depth from 10-100ft or random
- **Manual Spawning**: User can manually spawn fish and baitfish clouds
- **Absolute Coordinates**: worldX = screenX (no player-relative positioning)

## Critical Concept: Coordinate Systems

The most important thing to understand about nature simulation mode is the **coordinate system difference**:

### Normal Modes (Ice/Kayak/Boat)
```javascript
// Player is always at center of screen (x=600)
// Entities use world coordinates (worldX) and convert to screen coordinates (x)
const offsetFromPlayer = entity.worldX - playerWorldX;
entity.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;
```

### Nature Simulation Mode
```javascript
// No player - worldX IS screenX
entity.x = entity.worldX;  // Direct assignment, no conversion
```

### Detection Pattern
```javascript
if (this.scene.iceHoleManager) {
    // Ice mode
} else if (this.scene.boatManager) {
    // Boat/kayak mode
} else {
    // NATURE SIMULATION MODE
}
```

## Files Modified

### Core Scene Files

#### `/src/scenes/NatureSimulationScene.js` (NEW FILE)
- Main scene for nature simulation mode
- **Depth Selection UI**: Buttons for 10/25/50/75/100ft + Random
- **Manual Spawning**: Spawn fish (X button) and baitfish (Y button) with random species
- **Info Display**: Shows fish count, baitfish cloud count, current depth
- **Gamepad Support**: Full controller navigation
- **Key Methods**:
  - `updateDepthScale()`: Recalculates DEPTH_SCALE based on selected depth
  - `spawnRandomFish()`: Spawns fish with species-weighted random selection
  - `spawnRandomBaitfishCloud()`: Spawns baitfish cloud with random species

#### `/src/scenes/MenuScene.js`
- Redesigned from 3x2 grid to single horizontal row (7 buttons)
- Added Nature Simulation button
- **IMPORTANT FIX**: Clears `fishingWorldX` registry when starting ice fishing to prevent pollution from previous sessions

### Entity Files (Coordinate System Fixes)

#### `/src/entities/Fish.js`
**Lines 30-54** (constructor) and **Lines 148-181** (update):
```javascript
// In constructor and update, check for nature simulation mode:
if (this.scene.iceHoleManager) {
    // Ice mode: convert worldX to screen X based on ice hole position
} else if (this.scene.boatManager) {
    // Boat mode: convert worldX to screen X based on boat position
} else {
    // Nature mode: use worldX directly
    this.x = this.worldX;
}
```

#### `/src/entities/BaitfishCloud.js`
**Lines 212-224** (update method):
```javascript
// Same pattern - check for managers to determine mode
// In nature mode: this.centerX = this.worldX;
```

**Lines 190-203**: Get bottom depth from `scene.maxDepth` in nature mode

**Lines 359-372** (isOffScreen method):
```javascript
isOffScreen() {
    // ... manager checks ...
    } else {
        return false; // Never despawn clouds in nature mode based on player distance
    }
}
```

#### `/src/entities/Baitfish.js`
**Lines 99-130** (update method):
```javascript
// CRITICAL FIX: This was causing the vertical line bug!
// Old code set playerWorldX = this.worldX, which caused offsetFromPlayer = 0
// All baitfish ended up at x = 600 (center)

// New code:
if (this.scene.iceHoleManager) {
    // Ice mode coordinate conversion
    const playerWorldX = currentHole ? currentHole.x : this.worldX;
    const offsetFromPlayer = this.worldX - playerWorldX;
    this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;
} else if (this.scene.boatManager) {
    // Boat mode coordinate conversion
} else {
    // Nature mode: use worldX directly
    this.x = this.worldX;

    // Despawn if actually off screen (not player-relative)
    if (this.worldX < -400 || this.worldX > GameConfig.CANVAS_WIDTH + 400) {
        this.visible = false;
    }
}
```

**Lines 79-96**: Bottom depth from `scene.maxDepth` in nature mode

#### `/src/entities/Zooplankton.js`
Similar coordinate system fix - uses `this.x = this.worldX` in nature mode

#### `/src/entities/FishAI.js`
**Lines 20-47** (update method):
```javascript
// CRITICAL: Handle null lure in nature simulation
if (!lure) {
    // Nature simulation mode - no lure to track
    // Fish only hunt baitfish or idle
    if (nearbyBaitfishCloud && this.shouldHuntBaitfish(nearbyBaitfishCloud)) {
        this.startHuntingBaitfish(nearbyBaitfishCloud);
    } else if (this.state === Constants.FISH_STATE.HUNTING_BAITFISH) {
        this.huntingBaitfishBehavior(baitfishClouds, null);
    } else if (this.state === Constants.FISH_STATE.FEEDING) {
        this.feedingBehavior(baitfishClouds, null);
    } else {
        this.state = Constants.FISH_STATE.IDLE;
    }
    return;
}
```

**Lines 155-158**: Only check lure position if lure exists

### System Files

#### `/src/scenes/systems/SpawningSystem.js`
**Lines 88-105**: Detect nature simulation mode
```javascript
let isNatureSimulation = false;
if (this.scene.iceHoleManager) {
    // Ice mode
} else if (this.scene.boatManager) {
    // Boat mode
} else {
    isNatureSimulation = true;
    playerWorldX = GameConfig.CANVAS_WIDTH / 2; // Use screen center as reference
}
```

**Lines 136-156**: Random spawn positions in nature mode
```javascript
if (isNatureSimulation) {
    const screenLeft = -200;
    const screenRight = GameConfig.CANVAS_WIDTH + 200;
    worldX = Utils.randomBetween(screenLeft, screenRight);
    fromLeft = Math.random() < 0.5;
}
```

**Lines 313-321**: Random velocity for baitfish clouds in nature mode
```javascript
// CRITICAL FIX: Prevents vertical line convergence
if (isNatureSimulation) {
    // Random horizontal drift in either direction (not toward center!)
    cloud.velocity.x = Utils.randomBetween(-0.8, 0.8);
    cloud.velocity.y = Utils.randomBetween(-0.3, 0.3);
} else {
    // Normal mode: drift toward and past player
    cloud.velocity.x = fromLeft ? Utils.randomBetween(0.3, 0.8) : Utils.randomBetween(-0.8, -0.3);
}
```

### Config Files

#### `/src/config/GameConfig.js`
Added constant:
```javascript
FISHING_TYPE_NATURE_SIMULATION: 'nature_simulation',
```

#### `/src/index.js`
Added `NatureSimulationScene` to scene array

## Common Bugs and Fixes

### Bug: Fish/Baitfish Not Visible
**Symptom**: Entities spawn but don't show on screen
**Cause**: Coordinate conversion code expecting player position
**Fix**: Check for nature simulation mode and use `entity.x = entity.worldX` directly

### Bug: All Baitfish in Vertical Line
**Symptom**: Baitfish converge to center of screen (x=600)
**Cause 1**: Coordinate conversion setting `playerWorldX = this.worldX`, causing `offsetFromPlayer = 0`
**Cause 2**: Baitfish cloud velocity pointing toward center instead of random directions
**Fix 1**: Use direct assignment `this.x = this.worldX` in nature mode
**Fix 2**: Set random velocity in SpawningSystem for nature mode

### Bug: Fish Not Updating (Count Goes to Zero)
**Symptom**: TypeError: Cannot read properties of null
**Cause**: Checking `if (fish.active)` but fish don't have `.active` property
**Fix**: Remove `.active` checks, pass proper parameters to `fish.update(null, this.fishes, this.baitfishClouds)`

### Bug: FishAI Crash on Lure Access
**Symptom**: TypeError: Cannot read properties of null (reading 'x')
**Cause**: Accessing `lure.x` without null check in nature mode
**Fix**: Add early return when `lure` is null, only process baitfish hunting

### Bug: Baitfish Going Through Lake Bottom
**Symptom**: Baitfish appear below bottom line
**Cause**: Using fixed pixel constraints (10px) instead of depth-based
**Fix**: Use `bottomDepth = this.scene.maxDepth` and depth-based constraints `(bottomDepth - 3) * GameConfig.DEPTH_SCALE`

### Bug: Ice Fishing Starts at Wrong Depth
**Symptom**: Ice mode starts at 25ft instead of 100ft
**Cause**: Registry pollution from previous kayak/boat sessions
**Fix**: In MenuScene, explicitly clear registry when starting ice fishing:
```javascript
this.registry.set('fishingWorldX', null);
this.registry.set('fishingWorldY', 5000);
this.registry.set('currentDepth', GameConfig.MAX_DEPTH);
```

## Depth System

### Dynamic Depth Scaling
```javascript
updateDepthScale() {
    const BOTTOM_MARGIN = 20; // pixels from bottom of screen
    const availableHeight = GameConfig.CANVAS_HEIGHT - BOTTOM_MARGIN;
    GameConfig.DEPTH_SCALE = availableHeight / this.maxDepth;
    this.displayRange = this.maxDepth;
}
```

### Vertical Bounds
- **Surface**: 3-5 feet from top (varies by entity type)
- **Bottom**: 3-5 feet from bottom (varies by entity type)
- **Calculation**: `minY = depth_in_feet * GameConfig.DEPTH_SCALE`

### Getting Bottom Depth
```javascript
let bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
if (this.scene.boatManager) {
    bottomDepth = this.scene.boatManager.getDepthAtPosition(this.worldX);
} else if (this.scene.iceHoleManager) {
    // Get from ice hole bottom profile
}
// else use scene.maxDepth (nature simulation)
```

## Controls

### Keyboard
- **Depth Selection**: 1-5 keys or arrow keys + Enter
- **Spawn Fish**: X key
- **Spawn Baitfish**: C key
- **Return to Menu**: Escape

### Gamepad
- **Navigate Depth**: D-pad or left stick
- **Select Depth**: A button
- **Spawn Fish**: X button
- **Spawn Baitfish**: Y button
- **Return to Menu**: Start button

## Species Selection

Both fish and baitfish use species-weighted random selection from SpeciesData.js:

```javascript
// Example from NatureSimulationScene.spawnRandomFish()
const speciesWeights = [
    { species: 'lake_trout', weight: 25 },
    { species: 'landlocked_salmon', weight: 25 },
    { species: 'brown_trout', weight: 20 },
    { species: 'rainbow_trout', weight: 15 },
    { species: 'smallmouth_bass', weight: 10 },
    { species: 'northern_pike', weight: 5 }
];
```

## Rendering Notes

### Screen Boundaries
- Entities spawn from -200 to CANVAS_WIDTH + 200
- Entities despawn when outside -400 to CANVAS_WIDTH + 400
- This provides smooth enter/exit animations

### Z-Index / Render Order
Same as normal modes:
1. Background (lake bottom, water surface)
2. Zooplankton
3. Baitfish clouds
4. Fish
5. UI elements

## Testing Checklist

When modifying nature simulation mode, verify:

- [ ] Fish spawn and are visible on screen
- [ ] Baitfish clouds spawn and are visible
- [ ] Baitfish are distributed horizontally (not vertical line)
- [ ] Fish hunt baitfish (no lure-related crashes)
- [ ] Entities respect lake bottom (don't go through)
- [ ] Depth selection updates DEPTH_SCALE correctly
- [ ] All 6 depth presets work (10/25/50/75/100/Random)
- [ ] Manual spawn buttons work (X=fish, Y=baitfish)
- [ ] Gamepad navigation works
- [ ] Info display updates correctly
- [ ] Returning to menu works
- [ ] Ice fishing mode still works (not affected by registry pollution)

## Future Enhancement Ideas

- Toggle for automatic spawning (like normal modes)
- Ability to pause/resume simulation
- Speed controls (0.5x, 1x, 2x)
- Track individual fish with camera follow
- Statistics tracking (hunts, feeds, etc.)
- Export observation data
- Multiple simultaneous depth views (split screen)
- Time-lapse mode
- Temperature/season simulation

## Architecture Patterns

### Entity Detection Pattern
Always use this pattern to detect nature simulation mode:
```javascript
if (this.scene.iceHoleManager) {
    // Ice fishing mode
} else if (this.scene.boatManager) {
    // Boat/kayak fishing mode
} else {
    // Nature simulation mode
}
```

### Coordinate Conversion Pattern
```javascript
// In entity update methods:
if (isNatureSimulation) {
    this.x = this.worldX;
} else {
    const offsetFromPlayer = this.worldX - playerWorldX;
    this.x = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;
}
```

### Bottom Depth Pattern
```javascript
let bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
if (this.scene.boatManager) {
    bottomDepth = this.scene.boatManager.getDepthAtPosition(this.worldX);
} else if (this.scene.iceHoleManager) {
    // Get from ice hole bottom profile
}
// else: use scene.maxDepth (already set)
```

## Key Learnings

1. **Always handle null lure**: Any code that accesses `lure` must check `if (!lure)` first
2. **Coordinate systems are critical**: Mixing player-relative and absolute coordinates causes visual bugs
3. **Depth scaling is dynamic**: GameConfig.DEPTH_SCALE changes based on selected depth
4. **Registry pollution is real**: Clear registry values when switching modes to prevent data leakage
5. **Initial velocity matters**: Baitfish spawn velocity affects long-term distribution patterns
6. **Bottom depth varies**: Always get bottom depth from appropriate manager or scene.maxDepth

## Git History

All nature simulation work is on branch: `claude/new-game-concept-011CUV24FTAHJE9cys3sfWkz`

Key commits:
- Initial implementation: NatureSimulationScene creation, depth selection UI
- Menu redesign: Single horizontal row layout
- Coordinate fixes: Fish, BaitfishCloud, Zooplankton, Baitfish
- FishAI fixes: Null lure handling
- Baitfish vertical line fix: Random velocity + coordinate conversion
- Baitfish bottom collision fix: Depth-based constraints

---

**Last Updated**: 2025-10-26
**Mode Status**: Fully functional, ready for testing
