# AI Agent Quick Reference

**Purpose**: This document provides a concise reference for AI agents working on the Wolfpack codebase. It's designed to minimize token usage while providing essential information.

**Last Updated**: 2024 (Post-refactor to systems architecture)

---

## 🗺️ Quick File Map

### Need to modify...
- **Species data (NEW!)** → `src/config/SpeciesData.js`
- **Fish spawning** → `src/scenes/systems/SpawningSystem.js`
- **Fish AI behavior** → `src/entities/FishAI.js`
- **Fish appearance** → `src/entities/Fish.js`
- **Controls (keyboard/gamepad)** → `src/scenes/systems/InputSystem.js`
- **Lure physics** → `src/entities/Lure.js`
- **Fish fight mechanics** → `src/entities/FishFight.js`
- **Game balance** → `src/config/GameConfig.js`
- **Debug visualization** → `src/scenes/systems/DebugSystem.js`
- **Scoring/achievements** → `src/scenes/systems/ScoreSystem.js`
- **Notifications/messages** → `src/scenes/systems/NotificationSystem.js`
- **Collision detection** → `src/scenes/systems/CollisionSystem.js`
- **Sonar display** → `src/utils/SonarDisplay.js`
- **Ice hole drilling** → `src/managers/IceHoleManager.js`
- **Boat movement** → `src/managers/BoatManager.js`

### Scene Flow
```
BootScene → MenuScene → GameScene + UIScene → GameOverScene
```

---

## 📊 Architecture Overview

### Systems-Based Design (Post-Refactor)

GameScene is now **~400 lines** (down from 1519) thanks to system extraction:

```
GameScene (orchestrator)
├── SpawningSystem     - Fish/baitfish/zooplankton spawning
├── InputSystem        - Keyboard + gamepad input
├── CollisionSystem    - Cloud splitting/merging
├── DebugSystem        - Debug visualization
├── ScoreSystem        - Score tracking + achievements
└── NotificationSystem - In-game messages
```

**Key Principle**: Each system is ~100-200 lines and handles ONE responsibility.

---

## 🎯 Common Tasks (How-To)

### Add a New Fish Species
1. Open `src/config/SpeciesData.js`
2. Add species data to PREDATOR_SPECIES object with all properties (depth ranges, behaviors, diet, etc.)
3. Open `src/entities/FishAI.js` constructor
4. Add species-specific AI behavior initialization (if needed)
5. Open `src/entities/Fish.js`
6. Add species rendering method: `render[SpeciesName](bodySize, isMovingRight)`
7. Update main `render()` method to call new species renderer
8. Open `src/scenes/systems/SpawningSystem.js`
9. Update `trySpawnFish()` spawn probabilities to include new species

**Estimated lines to read**: ~500

**Current Species**:
- Lake Trout (pursuit hunter, deep cold water)
- Northern Pike (ambush predator, shallow structure)
- Smallmouth Bass (active predator, rocky areas, circles before striking)

### Adjust Game Balance
1. Open `src/config/GameConfig.js`
2. Modify constants (all game balance is here)
3. No code changes needed - config-driven design

**Estimated lines to read**: 165

### Change Controls
1. Open `src/scenes/systems/InputSystem.js`
2. Modify `handleKeyboardInput()` or `handleGamepadInput()`
3. All input logic is centralized here

**Estimated lines to read**: ~250

### Add New Achievement
1. Open `src/scenes/systems/ScoreSystem.js`
2. Add condition in `checkAchievements()` method
3. Achievement display is automatic

**Estimated lines to read**: ~150

### Modify Fish AI
1. Open `src/entities/FishAI.js`
2. Edit state machine in `decideBehavior()`
3. States: IDLE → INTERESTED → CHASING → STRIKING
4. Adjust interest calculation in `calculateInterestScore()`

**Estimated lines to read**: 560

---

## 🔧 Key Patterns

### World Coordinate System
```javascript
// Fish/entities have dual coordinates:
fish.worldX  // Position in infinite lake (0-10000)
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

---

## 📁 Directory Structure

```
src/
├── scenes/
│   ├── systems/           # NEW - Game logic systems
│   │   ├── SpawningSystem.js
│   │   ├── InputSystem.js
│   │   ├── CollisionSystem.js
│   │   ├── DebugSystem.js
│   │   ├── ScoreSystem.js
│   │   └── NotificationSystem.js
│   ├── GameScene.js       # Main orchestrator (400 lines)
│   ├── BootScene.js
│   ├── MenuScene.js
│   ├── GameOverScene.js
│   └── UIScene.js
├── entities/              # Game objects
│   ├── Fish.js
│   ├── FishAI.js
│   ├── Lure.js
│   ├── FishFight.js
│   ├── Baitfish.js
│   ├── BaitfishCloud.js
│   ├── Zooplankton.js
│   └── FishingLine.js
├── managers/              # Location managers
│   ├── IceHoleManager.js
│   └── BoatManager.js
├── models/
│   └── FishingLineModel.js
├── utils/
│   ├── GamepadManager.js
│   ├── SonarDisplay.js
│   └── Constants.js
└── config/
    └── GameConfig.js      # All game constants
```

---

## 🚨 Critical Files (Read These First)

When starting a task, read these in order:

1. **This file** (AI_REFERENCE.md) - You're here!
2. **GameConfig.js** (165 lines) - All constants
3. **GameScene.js** (400 lines) - Main game loop
4. **Relevant system file** (150-250 lines) - Task-specific

**Total**: ~900 lines (vs ~3000+ in old architecture)

---

## 💡 Best Practices for AI Agents

### Before Making Changes
1. ✅ Read this file first
2. ✅ Check GameConfig.js for relevant constants
3. ✅ Read only the specific system file needed
4. ❌ Don't read the entire codebase

### When Searching for Code
- **Fish behavior?** → FishAI.js only
- **Spawning logic?** → SpawningSystem.js only
- **Input handling?** → InputSystem.js only
- **Game balance?** → GameConfig.js only

### Token Optimization
- Use Grep to find specific functions/classes
- Use Glob to find files by pattern
- Read individual system files, not GameScene
- Refer to this document instead of PROJECT_STRUCTURE.md

---

## 🔬 Testing Approach

### Manual Testing (Current)
- Dev panel buttons (spawn fish, reset, debug)
- Controller test page (gamepad-test.html)
- Debug mode (toggle in-game)

### Future: Automated Tests
- [ ] Add Jest for unit tests
- [ ] Test utility functions first (Utils.js)
- [ ] Test AI state transitions (FishAI.js)
- [ ] Test spawning logic (SpawningSystem.js)

---

## 🐛 Debugging Quick Reference

### Enable Debug Mode
1. Press Square/X button on gamepad, OR
2. Modify `this.debugMode = true` in GameScene constructor

### Debug Features
- Yellow circle: Detection range around lure
- Red circle: Strike distance
- Colored fish circles: Current AI state
  - Gray: IDLE
  - Yellow: INTERESTED
  - Orange: CHASING
  - Red: STRIKING
  - Blue: FLEEING
- Cyan lines: Fish detecting lure

### Common Issues
- **Fish not spawning**: Check `GameConfig.FISH_SPAWN_CHANCE`
- **Fish not biting**: Check depth zones in GameConfig.DEPTH_ZONES
- **Controls not working**: Check InputSystem.handleGamepadInput()
- **Lure stuck**: Check Lure.js state machine

---

## 📦 Dependencies

- **Phaser 3.80.1** - Loaded from CDN (no npm install needed)
- **http-server** - Dev server only (npm install for local dev)
- **No build step** - ES6 modules run directly in browser

---

## 🎮 Game Modes

### Ice Fishing
- Static ice holes
- Drill new holes (limited battery)
- Walk between holes (Triangle/Y button)

### Kayak
- Paddle left/right
- Tiredness meter
- Start in 70-120 ft deep water

### Motor Boat
- Fast movement
- Gas management
- Shallow to deep water progression

### Arcade vs Unlimited
- **Arcade**: 2 minute timer, emergency fish spawn
- **Unlimited**: No timer, relaxed fishing

---

## 📝 Quick Constants Reference

```javascript
// Canvas
CANVAS_WIDTH: 900
CANVAS_HEIGHT: 630

// Spawning
FISH_SPAWN_CHANCE: 0.008 (0.8% per frame)
MAX_FISH_DEPTH: 150 ft
DEPTH_SCALE: 3.6 pixels/foot

// AI
DETECTION_RANGE: 150 px (horizontal)
VERTICAL_DETECTION_RANGE: 280 px (40-70 ft)
STRIKE_DISTANCE: 25 px

// Depth Zones (affect fish behavior)
SURFACE: 0-40 ft (aggressive, fast)
MID_COLUMN: 40-100 ft (balanced, optimal)
BOTTOM: 100-150 ft (slow, cautious)
```

---

## 🚀 Recent Major Changes

### 2024 - Systems Refactor
- ✅ Split GameScene into 6 systems
- ✅ Reduced GameScene from 1519 → ~400 lines
- ✅ Each system is 100-250 lines (highly focused)
- ✅ Added error handling to scene initialization
- ✅ Created this AI reference document

### Benefits for AI Agents
- **83% fewer tokens** when working on specific features
- **Faster file location** - clear system boundaries
- **Easier testing** - isolated systems
- **Better maintainability** - single responsibility

---

## 📖 Further Reading

**For detailed explanations**:
- `PROJECT_STRUCTURE.md` - Full architecture details
- `FISH_BEHAVIOR_GUIDE.md` - Complete fish AI mechanics
- `RECOMMENDATIONS.md` - Future improvements

**⚠️ Note**: Only read these if you need deep understanding. For most tasks, this AI_REFERENCE.md + relevant system file is sufficient.

---

## ✨ Summary

**Golden Rule**: Read this file + GameConfig.js + relevant system file = ~500-900 tokens

**Old Approach**: Read GameScene + docs = ~3000+ tokens

**Savings**: ~70-80% token reduction for typical tasks

---

**Questions? Check the system file's JSDoc comments - they include COMMON TASKS sections.**
