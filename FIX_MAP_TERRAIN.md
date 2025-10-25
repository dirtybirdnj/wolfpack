# Map Terrain & Depth System Fixes - Work In Progress

**Date**: 2025-10-25
**Branch**: `claude/expand-game-map-fixes-011CUTSYCdp7WykMo7f9UBeH`
**Status**: ⚠️ IN PROGRESS - Issues still present after fixes

## Problem Summary

The game has critical depth calculation and fish spawning issues on the expanded map:

1. **Fish stuck at top of water column** - Cannot explore depth
2. **Shallow water spawning** - Players spawn in water too shallow for fish
3. **Lure depth mismatch** - Lure falls to hardcoded 150ft regardless of actual depth
4. **Broken terrain generation** - Players see broken lake bottom on game load

## Root Causes Identified

### 1. Hardcoded MAX_DEPTH (150ft)
- Game used `GameConfig.MAX_DEPTH = 150` everywhere
- Ignored actual bathymetric data from navigation map
- **Location**: `src/config/GameConfig.js:42`

### 2. Missing Registry Data
- `NavigationScene.startFishing()` didn't store `fishingType`, `gameMode`, or `currentDepth`
- GameScene fell back to defaults, losing player's selection
- **Location**: `src/scenes/NavigationScene.js:2098-2127`

### 3. Shallow Water Starting Positions
- Unlimited mode started at worldX=1000 (near Burlington shore, ~10-20ft deep)
- No depth validation before spawning player
- **Location**: `src/scenes/NavigationScene.js:105-109`

### 4. No Fish Spawn Depth Validation
- Fish tried to spawn at hardcoded depths (e.g., 30-120ft for lake trout)
- No check if water was actually that deep
- **Location**: `src/scenes/systems/SpawningSystem.js:96-122`

### 5. Terrain Generation Timing
- BoatManager generates lakeBedProfile but may not have enough range
- Player position not centered in generated terrain
- **Location**: `src/managers/BoatManager.js:74-116`

## Fixes Applied (Commit b7e724f)

### ✅ Store Actual Depth in Registry
```javascript
// src/scenes/NavigationScene.js:2110-2116
this.registry.set('fishingType', this.fishingType);
this.registry.set('gameMode', this.gameMode);
const depth = this.bathyData.getDepthAtPosition(this.playerWorldX, this.playerWorldY);
this.registry.set('currentDepth', depth);
```

### ✅ Use Actual Depth in GameScene
```javascript
// src/scenes/GameScene.js:84-87
this.maxDepth = this.registry.get('currentDepth') || GameConfig.MAX_DEPTH;
console.log(`Water depth at location: ${this.maxDepth.toFixed(1)}ft`);
```

### ✅ Fix Shallow Water Starting Position
```javascript
// src/scenes/NavigationScene.js:105-119
// Unlimited mode: Use findGoodFishingSpots(40-80ft) instead of worldX=1000
const goodSpots = this.bathyData.findGoodFishingSpots(40, 80, 10);
// Fallback to worldX=3500 (further from shore) instead of 1000
```

### ✅ Add Fish Spawn Depth Validation
```javascript
// src/scenes/systems/SpawningSystem.js:124-137
const actualDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
const minRequiredDepth = species === 'northern_pike' ? 15 :
                         species === 'smallmouth_bass' ? 20 : 30;

if (actualDepth < minRequiredDepth) {
    console.log(`⚠️ Water too shallow for ${species}`);
    return null;
}

const maxFishDepth = Math.max(10, actualDepth - 5);
depth = Math.min(depth, maxFishDepth);
```

### ✅ Update Lure to Use Actual Depth
```javascript
// src/entities/Lure.js:92-99
const maxDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
if (this.y >= maxDepth * GameConfig.DEPTH_SCALE) {
    this.y = maxDepth * GameConfig.DEPTH_SCALE;
    this.depth = maxDepth;
}
```

### ✅ Update SonarDisplay to Use Actual Depth
```javascript
// src/utils/SonarDisplay.js:80-98, 205-213, 402-417
const maxDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
// Used in: generateBottomProfile(), drawDepthGrid(), createDepthMarkers()
```

### ✅ Fix Score System Architecture
```javascript
// src/entities/FishFight.js:558-563
// Use scoreSystem.addScore() instead of direct modification
this.scene.scoreSystem.addScore(this.fish.points);
this.scene.scoreSystem.addFishCaught();
// Same for addFishLost() at lines 212-216, 505-509
```

### ✅ Re-enable Fuel System
```javascript
// src/managers/BoatManager.js:217-253
// Removed hardcoded gasLevel = 100
// Re-enabled fuel decrease, regeneration, and game over triggers
```

## Current Issues (Still Present)

### 🔴 CRITICAL: "Fish still stuck at top"
**Symptoms**:
- Fish appear only at surface regardless of depth
- Baitfish don't explore water column
- Player reports "problem is still there"

**Possible Causes**:
1. ✅ ~~Registry depth not being set~~ - FIXED
2. ✅ ~~GameScene not reading depth~~ - FIXED
3. ✅ ~~Fish spawning without depth checks~~ - FIXED
4. ❓ **NEW**: Coordinate system mismatch between BoatManager lakeBedProfile and GameScene
5. ❓ **NEW**: Fish AI depth behavior overriding spawn depth
6. ❓ **NEW**: DEPTH_SCALE calculation issue (3.6 pixels/ft)

### 🔴 CRITICAL: "Broken lake bottom terrain on load"
**Symptoms**:
- Players see gaps or errors in lake bottom rendering
- Terrain not generated correctly around player position

**Possible Causes**:
1. ❓ BoatManager generates terrain x=0-10000 but player at wrong position
2. ❓ Player not centered at x=5000 when terrain generated
3. ❓ Race condition: terrain generation happens after rendering starts
4. ❓ Coordinate conversion issue between world coords and game coords

## Investigation Needed

### Priority 1: Verify Depth Flow
```bash
# Check console logs when game starts:
1. "Water depth at location: XXft" in GameScene
2. "Starting at good fishing water (XXft)" in NavigationScene
3. Verify these numbers match

# Check fish spawning:
1. Look for "⚠️ Water too shallow" warnings
2. Verify fish spawn depth values in console
```

### Priority 2: Check Coordinate Systems
```bash
# BoatManager lakeBedProfile generation:
- Generates x=0 to x=10000
- Centers on worldX from NavigationScene
- Player starts at x=5000 (getStartingPosition)

# Verify:
1. Is worldX being passed correctly?
2. Is playerX initialized to 5000 when from NavigationScene?
3. Does lakeBedProfile have data at all x positions?
```

### Priority 3: Test Fish AI Depth Behavior
```bash
# Check FishAI.js:
- Does AI override spawn depth?
- Does thermocline behavior force fish to surface?
- Check depthZone calculations
```

## Files Modified (Commit b7e724f)

1. `src/scenes/NavigationScene.js` - Store depth in registry, fix starting position
2. `src/scenes/GameScene.js` - Read and use actual depth
3. `src/scenes/systems/SpawningSystem.js` - Add depth validation for fish/baitfish
4. `src/entities/FishFight.js` - Use ScoreSystem methods
5. `src/managers/BoatManager.js` - Re-enable fuel system
6. `src/utils/SonarDisplay.js` - Use actual depth for rendering

## Rollback Information

### Last Known Stable Commit
**Commit**: `3643c17` - "Expand navigation map to cover full Lake Champlain"
**Date**: Via PR #14
**Status**: Merged, presumably working

### How to Rollback
```bash
git checkout 3643c17
# Test the game
# If stable, deploy this version for demo
```

## Next Steps for Future Claude Session

1. **Verify depth is actually being used**:
   - Add more console.log statements
   - Check this.maxDepth in GameScene update loop
   - Verify fish spawn with correct depth values

2. **Check coordinate system alignment**:
   - BoatManager world coords vs game coords
   - Ensure lakeBedProfile covers player position
   - Verify x=5000 is actually the center

3. **Test with different starting positions**:
   - Shallow water (20-30ft)
   - Medium water (50-70ft)
   - Deep water (100-120ft)
   - Does fish behavior change?

4. **Examine Fish AI depth logic**:
   - Look at FishAI.js update method
   - Check if AI forces fish to certain depths
   - Verify depthZone behavior

5. **Consider simplification**:
   - Remove complex bathymetric system temporarily
   - Use fixed depth per area as test
   - Isolate whether issue is depth calculation or fish behavior

## Demo Deployment Strategy

**URGENT**: Demo this afternoon

**Option 1**: Rollback to stable commit `3643c17`
- Known working state
- May not have all features
- Safe for demo

**Option 2**: Quick debug current fixes
- Add extensive logging
- Test one scenario thoroughly
- Fix specific bug if found quickly

**Option 3**: Use earlier working branch
- Check `claude/game-mode-updates-011CUSQpJ4Tp2uRNN8qEJADL`
- May have working fish spawning

## Contact Info for Resume

**Current Branch**: `claude/expand-game-map-fixes-011CUTSYCdp7WykMo7f9UBeH`
**Latest Commit**: `b7e724f`
**Session ID**: `011CUTSYCdp7WykMo7f9UBeH`
**Issue**: Fish still stuck at surface, broken terrain on load
