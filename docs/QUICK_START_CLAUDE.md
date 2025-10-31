# Wolfpack - Quick Start Guide

**Last Updated**: 2025-10-29
**Current Branch**: `claude/fix-scaling-bugs-011CUcEqhv4DwqPffmdgdk6q`
**Total Code**: 36 files, ~16,100 lines

---

## 🚀 First Session Steps

When starting a new session:

1. **Check recent work**:
   ```bash
   git log --oneline -10
   git status
   ```

2. **Read this file** for quick context

3. **Check TROUBLESHOOTING.md** if fixing bugs

4. **Check ARCHITECTURE.md** for deep dives

5. **Check FISH_MECHANICS.md** for species/AI work

---

## 🎮 What Is This Project?

A Lake Champlain fishing simulator built with Phaser 3.80.1 featuring:

- **Realistic fish AI** (7-state machine with species-specific behaviors)
- **Baitfish flocking** (3-rule boids algorithm)
- **Full Lake Champlain bathymetry** (20,000 × 60,000 units from NOAA data)
- **Complete gamepad support** (PS4/PS5/Xbox with haptic feedback)
- **Multiple fishing modes** (Ice, Kayak, Motor Boat, Nature Simulation)
- **10 species** (5 predators, 5 baitfish)

---

## 📁 Quick File Reference

### Need to modify...

**Species & Balance**:
- `src/config/SpeciesData.js` (924 lines) - All species definitions
- `src/config/GameConfig.js` (166 lines) - Game constants
- `src/scenes/systems/SpawningSystem.js` (631 lines) - Spawn logic

**Fish Behavior**:
- `src/entities/FishAI.js` (951 lines) - 7-state AI machine
- `src/models/fish.js` (373 lines) - Base fish biology
- `src/models/species/*.js` - Species-specific code
  - `LakeTrout.js` (112 lines)
  - `NorthernPike.js` (138 lines)
  - `SmallmouthBass.js` (154 lines)
  - `YellowPerch.js` (147 lines)

**Baitfish**:
- `src/entities/Baitfish.js` (654 lines) - Flocking behavior
- `src/entities/BaitfishCloud.js` (469 lines) - Cloud management

**Game Systems**:
- `src/scenes/systems/InputSystem.js` (447 lines) - Controls
- `src/scenes/systems/NotificationSystem.js` (847 lines) - UI messages
- `src/scenes/systems/CollisionSystem.js` (146 lines) - Cloud split/merge
- `src/scenes/systems/DebugSystem.js` (200 lines) - Debug visualization

**Core Entities**:
- `src/entities/Lure.js` (372 lines) - Player lure physics
- `src/entities/FishFight.js` (744 lines) - Catch minigame
- `src/entities/Fish.js` (252 lines) - Fish rendering wrapper

**Rendering**:
- `src/utils/SonarDisplay.js` (521 lines) - Sonar visualization

**Scenes**:
- `src/scenes/GameScene.js` (1,417 lines) - Main game orchestrator
- `src/scenes/NavigationScene.js` (2,147 lines) - Lake map
- `src/scenes/NatureSimulationScene.js` (608 lines) - AI observation mode
- `src/scenes/MenuScene.js` (394 lines) - Mode selection
- `src/scenes/BootScene.js` (198 lines) - Loading screen
- `src/scenes/GameOverScene.js` (369 lines) - Results screen
- `src/scenes/UIScene.js` (68 lines) - HUD overlay

---

## 🎯 Common Tasks

### Add a New Predator Species

1. Add to `PREDATOR_SPECIES` in `src/config/SpeciesData.js`:
   ```javascript
   walleye: {
       name: "Walleye",
       sizeRange: { min: 12, max: 30 },
       depthRange: { min: 10, max: 40 },
       // ... full species definition
   }
   ```

2. Create species class in `src/models/species/Walleye.js`:
   ```javascript
   import { Fish } from '../fish.js';

   export class Walleye extends Fish {
       constructor(scene, x, y, size, fishingType) {
           super(scene, x, y, size, fishingType, 'walleye');
       }

       calculateLength() {
           return Math.round(11.0 * Math.pow(this.weight, 0.30));
       }

       calculateBiologicalAge() {
           // Age calculation based on weight
       }

       render(graphics, bodySize, isMovingRight) {
           // Species-specific rendering
       }

       renderAtPosition(graphics, x, y, bodySize) {
           // Catch popup rendering
       }
   }
   ```

3. Update `src/entities/Fish.js` factory:
   ```javascript
   import Walleye from '../models/species/Walleye.js';

   createModel(scene, x, y, size, fishingType, species) {
       switch(species) {
           case 'walleye':
               return new Walleye(scene, x, y, size, fishingType);
           // ... other cases
       }
   }
   ```

4. Add spawn weight in `src/scenes/systems/SpawningSystem.js`

### Add a New Baitfish Species

1. Add to `BAITFISH_SPECIES` in `src/config/SpeciesData.js`
2. Add to spawn weights in `src/scenes/systems/SpawningSystem.js`
3. (Optional) Add species-specific rendering in `src/entities/Baitfish.js`

### Fix Fish Rendering Issues

**Common Issue**: Fish not appearing in catch popup

**Solution**: Use `translateCanvas()` for positioning:
```javascript
renderAtPosition(graphics, x, y, bodySize) {
    graphics.save();
    graphics.translateCanvas(x, y);  // Shift coordinate system
    this.renderBody(graphics, bodySize, colors, 0, 0);  // Draw at origin
    graphics.restore();
}
```

**Don't** set `graphics.x` and `graphics.y` - they don't control drawing position!

### Adjust Game Balance

**Fish spawn rate**: `src/config/GameConfig.js`
```javascript
FISH_SPAWN_CHANCE: 0.008  // 0.8% per frame (60 FPS)
```

**Species spawn weights**: `src/scenes/systems/SpawningSystem.js`
```javascript
const species = Utils.weightedRandom({
    'lake_trout': 50,
    'northern_pike': 25,
    'smallmouth_bass': 15,
    'yellow_perch_large': 10
});
```

**Fish AI aggression**: `src/entities/FishAI.js`
```javascript
const interestThreshold = 40;  // Lower = more aggressive
```

---

## ⚠️ Critical Gotchas

### 1. Graphics Rendering (Phaser-Specific)

```javascript
// ❌ WRONG - doesn't work with Phaser Graphics
graphics.x = 100;
graphics.y = 100;
graphics.fillCircle(0, 0, 10);  // Still draws at (0,0) on screen!

// ✅ CORRECT - use canvas transformation
graphics.save();
graphics.translateCanvas(100, 100);
graphics.fillCircle(0, 0, 10);  // Now draws at (100,100)
graphics.restore();
```

### 2. Coordinate Systems

**Ice/Kayak/Boat Modes**:
- Player always at screen center (x = CANVAS_WIDTH/2)
- Entities use `worldX` (world position) and `x` (screen position)
- Conversion: `x = (CANVAS_WIDTH/2) + (worldX - playerWorldX)`

**Nature Simulation Mode**:
- No player - screen IS world
- `x = worldX` (no conversion needed)

**Detection Pattern**:
```javascript
if (this.scene.iceHoleManager) {
    // Ice mode - use ice hole position
} else if (this.scene.boatManager) {
    // Boat/kayak mode - use boat position
} else {
    // Nature simulation mode - no player
}
```

### 3. Depth Scaling is Dynamic

```javascript
// ❌ BAD - hardcoded depth scale
const maxY = 150 * 1.625;

// ✅ GOOD - use current depth scale
const maxY = (this.scene.maxDepth - 5) * GameConfig.DEPTH_SCALE;
```

`DEPTH_SCALE` changes based on water depth to keep bottom at 85% of screen height.

### 4. Null Safety for Lure

```javascript
// ❌ CRASH in nature mode
const distance = Utils.calculateDistance(this.x, this.y, lure.x, lure.y);

// ✅ SAFE
if (!lure) {
    // Nature mode - no lure exists
    return;
}
const distance = Utils.calculateDistance(this.x, this.y, lure.x, lure.y);
```

### 5. Species Model Architecture

Fish are **not** in `src/entities/Fish.js` anymore!

**Old** (pre-refactor):
```javascript
// Fish.js contained all species rendering (1,000+ lines)
```

**New** (current):
```javascript
// Fish.js is a factory (252 lines)
// src/models/fish.js has base biology (373 lines)
// src/models/species/*.js have species-specific code
```

---

## 🐛 Debugging Workflow

### 1. Enable Debug Mode

Press **backtick (`)** in game or click "Toggle Debug Info" button

Shows:
- Fish states (color-coded)
- Detection ranges (yellow circles)
- Strike distances (red circles)
- Connection lines to lure
- FPS and entity counts

### 2. Check Console

**Common errors**:
- `Cannot read properties of null` → Missing null check (usually lure)
- `Cannot read properties of undefined` → Typo or missing property
- `graphics.translateCanvas is not a function` → Wrong Phaser version?

### 3. Use Dev Panel

Located in `index.html`, provides:
- Spawn fish buttons
- Fish status panel (real-time state, hunger, health, frenzy)
- Lure weight selection
- Fishing line type selection
- Reset game button

### 4. Test All Modes

If you change shared code, test:
- ✅ Ice fishing
- ✅ Kayak fishing
- ✅ Motor boat fishing
- ✅ Nature simulation

---

## 📝 Code Style

### ES6+ Features

```javascript
// ✅ GOOD - modern, concise
const { x, y, depth } = fish.getPosition();
const activeFish = this.fishes.filter(f => f.visible && !f.caught);
```

### Meaningful Names

```javascript
// ✅ GOOD
const bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
const isNatureMode = !this.scene.iceHoleManager && !this.scene.boatManager;

// ❌ BAD
const bd = this.scene.maxDepth || GameConfig.MAX_DEPTH;
const nm = !this.scene.iceHoleManager && !this.scene.boatManager;
```

### Comment WHY, Not WHAT

```javascript
// ✅ GOOD - explains reasoning
// Use translateCanvas because Graphics.x doesn't control drawing position
graphics.translateCanvas(x, y);

// ❌ BAD - obvious from code
// Translate canvas
graphics.translateCanvas(x, y);
```

---

## 🔧 Running the Game

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm start

# Open browser
# http://localhost:8080
```

**Gamepad Support**: Press any button on controller to connect

---

## 📊 Project Stats

- **Lines of Code**: 16,114
- **Files**: 36 JavaScript files
- **Scenes**: 7 (Boot, Menu, Navigation, Game, GameOver, UI, NatureSimulation)
- **Systems**: 5 (Spawning, Input, Collision, Debug, Notification)
- **Species**: 10 (5 predators, 5 baitfish)
- **Game Modes**: 7 combinations (3 fishing types × 2 game modes + nature sim)

---

## 🎯 Next Steps

- **Adding species**: See "Add a New Predator Species" above
- **Fixing bugs**: Check TROUBLESHOOTING.md
- **Understanding architecture**: Read ARCHITECTURE.md
- **Tweaking AI**: Read FISH_MECHANICS.md

---

## 🔍 Useful Commands

```bash
# Find all coordinate conversion code
grep -r "CANVAS_WIDTH / 2" src/

# Find all nature mode checks
grep -r "iceHoleManager" src/entities/

# Find all depth scaling
grep -r "DEPTH_SCALE" src/

# Find all lure references (check for null safety)
grep -r "lure\." src/entities/FishAI.js

# List all entity files
ls src/entities/

# List all scene files
ls src/scenes/

# Get line count of a file
wc -l src/entities/FishAI.js
```

---

**Remember**: The graphics rendering system is Phaser-specific and doesn't work like standard canvas. Always use `translateCanvas()` for positioning, never set `graphics.x/y`!
