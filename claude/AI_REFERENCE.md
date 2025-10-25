# AI Agent Quick Reference

**Purpose**: This document provides a concise reference for AI agents working on the Wolfpack codebase. It's designed to minimize token usage while providing essential information.

**Last Updated**: 2025-10-25 (Current codebase state: 11,700 lines across 30 files)

---

## 🗺️ Quick File Map

### Need to modify...
- **Species data** → `src/config/SpeciesData.js` (924 lines - 5 predators, 5 baitfish species)
- **Game constants** → `src/config/GameConfig.js` (165 lines)
- **Fish spawning** → `src/scenes/systems/SpawningSystem.js` (~200 lines)
- **Fish AI behavior** → `src/entities/FishAI.js` (896 lines - 7 state machine)
- **Fish rendering** → `src/entities/Fish.js` (1,145 lines - species-specific rendering)
- **Baitfish flocking** → `src/entities/Baitfish.js` (638 lines - 3-rule flocking)
- **Baitfish clouds** → `src/entities/BaitfishCloud.js` (464 lines - cloud management)
- **Controls (keyboard/gamepad)** → `src/scenes/systems/InputSystem.js` (~250 lines)
- **Lure physics** → `src/entities/Lure.js` (310 lines)
- **Fish fight mechanics** → `src/entities/FishFight.js` (717 lines)
- **Debug visualization** → `src/scenes/systems/DebugSystem.js` (~100 lines)
- **Scoring/achievements** → `src/scenes/systems/ScoreSystem.js` (~150 lines)
- **Notifications/messages** → `src/scenes/systems/NotificationSystem.js` (~200 lines)
- **Collision detection** → `src/scenes/systems/CollisionSystem.js` (~130 lines - cloud splitting/merging)
- **Sonar display** → `src/utils/SonarDisplay.js` (521 lines)
- **Lake Champlain depth data** → `src/utils/BathymetricData.js` (410 lines)
- **Ice hole drilling** → `src/managers/IceHoleManager.js` (391 lines)
- **Boat/kayak movement** → `src/managers/BoatManager.js` (394 lines)
- **Lake navigation** → `src/scenes/NavigationScene.js` (2,146 lines - top-down map)

### Scene Flow
```
BootScene → MenuScene → NavigationScene → GameScene + UIScene → GameOverScene
```

---

## 📊 Architecture Overview

### Systems-Based Design

GameScene is now **~748 lines** (down from 1519) thanks to system extraction:

```
GameScene (orchestrator)
├── SpawningSystem       - Fish/baitfish/zooplankton spawning (~200 lines)
├── InputSystem          - Keyboard + gamepad input (~250 lines)
├── CollisionSystem      - Cloud splitting/merging (~130 lines)
├── DebugSystem          - Debug visualization (~100 lines)
├── ScoreSystem          - Score tracking + achievements (~150 lines)
└── NotificationSystem   - In-game messages (~200 lines)
```

**Key Principle**: Each system is ~100-250 lines and handles ONE responsibility.

### Game Modes

**Fishing Modes (3 types)**:
- Ice Fishing (winter - static holes, drilling)
- Kayak (summer - paddle around, tiredness meter)
- Motor Boat (summer - fast movement, gas management)

**Game Modes (2 types)**:
- Arcade (2-minute timer, emergency spawning)
- Unlimited (no timer, relaxed fishing)

**Total Combinations**: 6 (3 fishing modes × 2 game modes)

---

## 🐟 Species System

### Predator Fish (5 Species)

**Lake Trout** (50% spawn weight)
- Pursuit hunter, cold-water specialist
- Depth: 40-100ft (winter), deeper in summer
- Size: 2-40 lbs (Small/Medium/Large/Trophy)
- Diet: Alewife (55%), smelt (25%), sculpin (8%), perch (8%), cisco (4%)

**Northern Pike** (25% spawn weight)
- AMBUSH predator with explosive strikes
- Depth: 5-30ft (shallow structure)
- Extended strike range (60px vs 25px)
- Burst speed: 2.5x multiplier

**Smallmouth Bass** (15% spawn weight)
- ACTIVE predator, circles lure before striking
- Depth: 10-50ft (rocky structure)
- Circling behavior (35px radius, up to 2 seconds)
- Highly acrobatic (40% jump chance)

**Yellow Perch - Large** (10% spawn weight)
- BEGINNER-FRIENDLY (easiest to catch)
- Depth: 15-35ft
- Schools by size
- Active all day

**Yellow Perch - Juvenile** (Baitfish)
- 4-8 inches, eaten by predators
- Structure-oriented

### Baitfish Species (5 Types)

**Alewife** - Most abundant, dense schools (20-50)
**Rainbow Smelt** - Fastest, extremely tight schools (10-30)
**Slimy Sculpin** - Bottom-dwelling, solitary (1-3)
**Cisco/Lake Herring** - RARE, large prey (8-16 inches)
**Yellow Perch - Juvenile** - Structure-oriented (8-20)

All defined in: `src/config/SpeciesData.js:924`

---

## 🎯 Common Tasks (How-To)

### Add a New Predator Species
1. Open `src/config/SpeciesData.js`
2. Add species to PREDATOR_SPECIES object with all properties:
   - spawnWeight, sizeCategories, depthPreference, tempPreference
   - diet, behavior, habitat, fight mechanics
3. Open `src/entities/Fish.js`
4. Add species rendering method: `render[SpeciesName](bodySize, isMovingRight)`
5. Update main `render()` method to call new renderer
6. Open `src/entities/FishAI.js`
7. Add species-specific AI behavior (if needed):
   - Ambush behavior (like pike)
   - Circling behavior (like bass)
8. Test spawning in SpawningSystem.js

**Estimated lines to read**: ~1,500

### Adjust Game Balance
1. Open `src/config/GameConfig.js` (165 lines)
2. Modify constants (all game balance is here)
3. No code changes needed - config-driven design

**Estimated lines to read**: 165

### Change Controls
1. Open `src/scenes/systems/InputSystem.js` (~250 lines)
2. Modify `handleKeyboardInput()` or `handleGamepadInput()`
3. All input logic is centralized here

**Estimated lines to read**: ~250

### Modify Baitfish Behavior
1. Open `src/entities/Baitfish.js` (638 lines)
2. Edit flocking rules (separation, cohesion, alignment)
3. Adjust panic response, hunting behavior, or speeds
4. Open `src/entities/BaitfishCloud.js` (464 lines)
5. Modify cloud spawning, splitting, or merging logic

**Estimated lines to read**: ~1,100

### Add Cloud Interaction
1. Open `src/scenes/systems/CollisionSystem.js` (~130 lines)
2. Add detection logic for new interaction
3. Cloud splitting and merging already implemented

**Estimated lines to read**: ~130

---

## 🔧 Key Patterns

### World Coordinate System
```javascript
// Fish/entities have dual coordinates:
fish.worldX  // Position in infinite lake (0-20000)
fish.x       // Screen position relative to player

// Conversion happens automatically in entity update()
```

### State Management
```javascript
// Fish AI uses state machine
Constants.FISH_STATE = {
    IDLE, INTERESTED, CHASING, STRIKING,
    FLEEING, HUNTING_BAITFISH, FEEDING
}

// Lure uses simpler state
Constants.LURE_STATE = {
    SURFACE, DROPPING, RETRIEVING, IDLE
}
```

### Configuration-Driven
```javascript
// DON'T hard-code values
const speed = 2.5; // ❌ Bad

// DO use config
const speed = GameConfig.FISH_SPEED_MAX; // ✅ Good
```

### Flocking Behavior (3 Rules)
```javascript
// Baitfish use 3 boids rules:
1. Separation - Avoid crowding (12px radius)
2. Cohesion - Stay with group (50px radius)
3. Alignment - Match velocity with neighbors

// See: src/entities/Baitfish.js:applySeparation(), applyCohesion(), applyAlignment()
```

---

## 📁 Directory Structure

```
src/ (11,700 lines across 30 files)
├── config/
│   ├── GameConfig.js          # Game constants (165 lines)
│   └── SpeciesData.js         # All species definitions (924 lines)
├── scenes/
│   ├── BootScene.js           # Title screen (198 lines)
│   ├── MenuScene.js           # Mode selection (446 lines)
│   ├── NavigationScene.js     # Lake map navigation (2,146 lines)
│   ├── GameScene.js           # Main orchestrator (748 lines)
│   ├── GameOverScene.js       # Results screen (369 lines)
│   ├── UIScene.js             # HUD overlay (68 lines)
│   └── systems/               # Game logic systems
│       ├── SpawningSystem.js
│       ├── InputSystem.js
│       ├── CollisionSystem.js
│       ├── DebugSystem.js
│       ├── ScoreSystem.js
│       └── NotificationSystem.js
├── entities/                  # Game objects
│   ├── Fish.js                # Fish entity (1,145 lines)
│   ├── FishAI.js              # AI state machine (896 lines)
│   ├── FishFight.js           # Catch minigame (717 lines)
│   ├── Lure.js                # Player lure (310 lines)
│   ├── Baitfish.js            # Prey fish with flocking (638 lines)
│   ├── BaitfishCloud.js       # School management (464 lines)
│   ├── Zooplankton.js         # Bottom organisms (180 lines)
│   ├── FishingLine.js         # Line rendering (114 lines)
│   └── FishingLineModel.js    # Line physics (142 lines)
├── managers/                  # Mode managers
│   ├── IceHoleManager.js      # Ice fishing (391 lines)
│   └── BoatManager.js         # Kayak/motorboat (394 lines)
├── utils/
│   ├── GamepadManager.js      # Gamepad API (239 lines)
│   ├── SonarDisplay.js        # Sonar rendering (521 lines)
│   ├── BathymetricData.js     # Lake depth data (410 lines)
│   └── Constants.js           # Enumerations (75 lines)
└── index.js                   # Phaser initialization
```

---

## 🚨 Critical Files (Read These First)

When starting a task, read these in order:

1. **This file** (AI_REFERENCE.md) - You're here!
2. **GameConfig.js** (165 lines) - All constants
3. **SpeciesData.js** (924 lines) - All species behaviors
4. **GameScene.js** (748 lines) - Main game loop
5. **Relevant system/entity file** (~200-900 lines) - Task-specific

**Total**: ~2,000-3,000 lines (depending on task)

---

## 💡 Best Practices for AI Agents

### Before Making Changes
1. ✅ Read this file first
2. ✅ Check GameConfig.js and SpeciesData.js for relevant constants
3. ✅ Read only the specific system/entity file needed
4. ❌ Don't read the entire codebase

### When Searching for Code
- **Fish behavior?** → FishAI.js + SpeciesData.js
- **Baitfish behavior?** → Baitfish.js + BaitfishCloud.js + SpeciesData.js
- **Spawning logic?** → SpawningSystem.js + SpeciesData.js
- **Input handling?** → InputSystem.js
- **Game balance?** → GameConfig.js
- **Species stats?** → SpeciesData.js
- **Lake navigation?** → NavigationScene.js + BathymetricData.js
- **Cloud interactions?** → CollisionSystem.js

### Token Optimization
- Use Grep to find specific functions/classes
- Use Glob to find files by pattern
- Read individual system files, not all of GameScene
- Refer to this document instead of PROJECT_STRUCTURE.md
- SpeciesData.js is comprehensive - read it for all species info

---

## 🔬 Testing Approach

### Manual Testing (Current)
- Dev panel buttons (spawn fish, reset, debug)
- Controller test page (gamepad-test.html)
- Debug mode (toggle in-game)
- Console logging for depth, species, spawning

### Debug Mode Features
- Press Square/X button on gamepad to toggle
- Yellow circles: Detection ranges
- Red circles: Strike distance
- Colored fish circles: Current AI state
  - Gray: IDLE
  - Yellow: INTERESTED
  - Orange: CHASING
  - Red: STRIKING
  - Blue: FLEEING
- Cyan lines: Fish detecting lure
- Baitfish flock visualization

---

## 🐛 Debugging Quick Reference

### Common Issues
- **Fish not spawning**: Check `GameConfig.FISH_SPAWN_CHANCE` and `SpeciesData.spawnWeight`
- **Fish not biting**: Check depth zones in GameConfig.DEPTH_ZONES
- **Wrong species appearing**: Check `SpeciesData.PREDATOR_SPECIES` spawn weights
- **Baitfish in lines**: Check flocking rules in Baitfish.js
- **Clouds not splitting**: Check CollisionSystem.js
- **Controls not working**: Check InputSystem.handleGamepadInput()
- **Lure stuck**: Check Lure.js state machine
- **Depth issues**: Check NavigationScene registry data and GameScene.maxDepth

---

## 📦 Dependencies

- **Phaser 3.80.1** - Loaded from CDN (no npm install needed)
- **http-server** - Dev server only (npm install for local dev)
- **No build step** - ES6 modules run directly in browser

---

## 📝 Quick Constants Reference

```javascript
// Canvas
CANVAS_WIDTH: 900
CANVAS_HEIGHT: 630

// Spawning
FISH_SPAWN_CHANCE: 0.008 (0.8% per frame)
BAITFISH_CLOUD_SPAWN_CHANCE: 0.004
MAX_FISH_DEPTH: 150 ft (dynamic based on location)
DEPTH_SCALE: 3.6 pixels/foot

// AI
DETECTION_RANGE: 150 px (horizontal)
VERTICAL_DETECTION_RANGE: 280 px (40-70 ft)
STRIKE_DISTANCE: 25 px (default, pike: 60px)

// Depth Zones (affect fish behavior)
SURFACE: 0-40 ft (aggressive, fast)
MID_COLUMN: 40-100 ft (balanced, optimal)
BOTTOM: 100-150 ft (slow, cautious)

// Flocking
SEPARATION_RADIUS: 12 px
COHESION_RADIUS: 50 px
BAITFISH_SPEED: 1.2 (base), 2.5-3.5 (panic)

// Lake Champlain
LAKE_WIDTH: 20,000 units
LAKE_HEIGHT: 60,000 units
BATHYMETRIC_GRID: 500 unit resolution
```

---

## 🚀 Recent Major Changes

### Current State (2025-10-25)
- ✅ 5 predator species with unique behaviors
- ✅ 5 baitfish species with flocking
- ✅ 3-rule flocking system (separation, cohesion, alignment)
- ✅ Cloud splitting/merging collision system
- ✅ Full Lake Champlain bathymetric data
- ✅ Navigation scene with top-down map
- ✅ 3 fishing modes × 2 game modes = 6 combinations
- ✅ Species-specific AI (pike ambush, bass circling)
- ✅ Zooplankton ecosystem (baitfish food source)
- ✅ Systems architecture (6 focused systems)

### Recent Bug Fixes
- ✅ Baitfish horizontal line bug (automatic cloud splitting)
- ✅ Surface trap bug (baitfish can escape when cornered)
- ✅ Cloud compression (despawn instead of infinite splitting)
- ✅ Flocking boundary detection (surface penalty)

---

## 📖 Further Reading

**For detailed explanations**:
- `PROJECT_STRUCTURE.md` - Full architecture details
- `FISH_BEHAVIOR_GUIDE.md` - Complete fish AI mechanics
- `RECOMMENDATIONS.md` - Future improvements

**⚠️ Note**: Only read these if you need deep understanding. For most tasks, this AI_REFERENCE.md + relevant file is sufficient.

---

## ✨ Summary

**Golden Rule**: Read this file + GameConfig.js + SpeciesData.js + relevant system/entity file = ~1,500-3,000 tokens

**Old Approach**: Read entire codebase = 11,700+ lines

**Savings**: ~70-85% token reduction for typical tasks

---

**Current Codebase**: 11,700 lines across 30 files
**Total Species**: 5 predators, 5 baitfish (10 total)
**Total Game Modes**: 6 combinations
**Architecture**: Systems-based, modular, configuration-driven
**Status**: Active development, stable core mechanics

---

**Questions? Check the system file's JSDoc comments - they include COMMON TASKS sections.**
