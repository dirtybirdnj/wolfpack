# Hardcoded Dimension Cleanup TODO

## Problem

The game uses `Phaser.Scale.RESIZE` mode which dynamically resizes to fit the container. However, many files use fallback values like `scene.scale.width || GameConfig.CANVAS_WIDTH` which prevents proper dynamic sizing.

## Fixed Files ✅

- `src/config/GameConfig.js` - Added warning comments
- `src/utils/SonarDisplay.js` - Uses `scene.game.canvas.width/height` (actual canvas)
- `src/scenes/GameScene.js` - Removed 4 fallback usages
- `src/models/AquaticOrganism.js` - Uses dynamic `scene.scale.width`
- `src/scenes/systems/SpawningSystem.js` - All spawn positions use `scene.scale.width`
- `src/models/FishSprite.js` - Uses `scene.scale.width`
- `src/models/BaitfishSprite.js` - Uses `scene.scale.width`
- `src/models/Zooplankton.js` - Uses `scene.scale.width`

## Files Still Needing Fixes 🔧

### High Priority
1. **src/scenes/systems/NotificationSystem.js**
   - Multiple text positioning uses `GameConfig.CANVAS_WIDTH / 2`
   - Should use `this.scene.scale.width / 2`

2. **src/scenes/systems/InputSystem.js**
   - Gamepad notification text positioning
   - Should use `this.scene.scale.width / 2`

3. **src/entities/FishFight.js**
   - Line escape text positioning
   - Escape direction calculations
   - Should use `this.scene.scale.width`

### Medium Priority
4. **src/models/baitfish.js** (OLD - may be deprecated)
   - Has fallback: `this.scene.scale.width || GameConfig.CANVAS_WIDTH`

5. **src/models/fish.js** (OLD - may be deprecated)
   - Has fallback references
   - Off-screen detection uses hardcoded values

6. **src/entities/BaitfishCloud.js** (OLD - may be deprecated)
   - May have fallback references

### Low Priority (Deprecated Files)
7. **src/scenes/NatureSimulationScene.js**
   - Has fallback but scene may be deprecated

8. **src/entities/Fish.js** (OLD)
   - Deprecated file, replaced by FishSprite.js

9. **src/entities/FishingLine.js**
   - May have fallback references

10. **src/entities/Lure.js**
    - May have fallback references

11. **src/entities/FishAI.js**
    - May have fallback references

## Search & Replace Pattern

For all remaining files, replace:
```javascript
// OLD (wrong)
this.scene.scale.width || GameConfig.CANVAS_WIDTH
this.scene.scale.height || GameConfig.CANVAS_HEIGHT
GameConfig.CANVAS_WIDTH / 2  // for centering

// NEW (correct)
this.scene.scale.width
this.scene.scale.height
this.scene.scale.width / 2   // for centering
```

## Important Notes

1. **GameConfig.CANVAS_WIDTH/HEIGHT** should ONLY be used in:
   - `src/index.js` - Initial Phaser config (acceptable)
   - Nowhere else at runtime!

2. **For actual canvas dimensions**, use:
   - `scene.scale.width` - Preferred for most cases
   - `scene.game.canvas.width` - When you need the ACTUAL pixel dimensions

3. **For centering**, always use:
   - `scene.scale.width / 2` (NOT `GameConfig.CANVAS_WIDTH / 2`)

4. **The game container can be any size** - the game must adapt dynamically

## Testing

After fixes, verify:
1. Game fills entire container (no black bars)
2. Background renders across full width
3. Text is centered correctly at all resolutions
4. Fish spawn at correct positions
5. Window resize works properly

## Completion Criteria

When all files are fixed:
- No more `|| GameConfig.CANVAS_WIDTH` fallbacks
- No more direct `GameConfig.CANVAS_WIDTH / 2` for positioning
- All dimensions calculated dynamically at runtime
