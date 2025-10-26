# AI Quick Start Guide - Wolfpack Project

## First Things First

When starting a new session on this project:

1. **Read the recent git commits** to understand what was last worked on:
   ```bash
   git log -10 --oneline
   ```

2. **Check current branch**:
   ```bash
   git status
   ```
   You should be on: `claude/new-game-concept-011CUV24FTAHJE9cys3sfWkz`

3. **Read these AI artifacts**:
   - `/home/user/wolfpack/.ai/NATURE_SIMULATION_MODE.md` - Detailed nature simulation guide
   - `/home/user/wolfpack/.ai/PROJECT_STRUCTURE.md` - File structure and patterns
   - This file - Quick start essentials

## Critical Context

### What is this project?
A Lake Champlain fishing game built with Phaser 3. It has 4 game modes:
1. **Ice Fishing** - Deep water, stationary
2. **Kayak Fishing** - Shallow water, paddle-able
3. **Boat Fishing** - All depths, motor-driven
4. **Nature Simulation** - No player, pure AI observation (RECENTLY ADDED)

### Most Important Concept: Coordinate Systems

This is the #1 source of bugs. **Pay close attention**:

**Normal Modes (Ice/Kayak/Boat)**:
- Player is always at screen center (x=600)
- Entities use `worldX` (world coordinate) and `x` (screen coordinate)
- Conversion: `x = (CANVAS_WIDTH/2) + (worldX - playerWorldX)`

**Nature Simulation Mode**:
- No player - screen IS world
- `x = worldX` (direct assignment, no conversion)

**Detection Pattern** (use everywhere):
```javascript
if (this.scene.iceHoleManager) {
    // Ice mode
} else if (this.scene.boatManager) {
    // Boat/kayak mode
} else {
    // NATURE SIMULATION MODE
}
```

## Common User Requests

### "Add a new fish species"
1. Edit `/src/config/SpeciesData.js` - add to `FISH_SPECIES`
2. Edit `/src/scenes/systems/SpawningSystem.js` - add to spawn weights
3. Test spawning in all 4 game modes

### "Add a new baitfish species"
1. Edit `/src/config/SpeciesData.js` - add to `BAITFISH_SPECIES`
2. Edit `/src/scenes/systems/SpawningSystem.js` - add to spawn weights
3. Optionally add rendering in `/src/entities/Baitfish.js` (`renderSpeciesFeatures()`)

### "Fish are not visible" or "Baitfish stuck in line"
This is ALWAYS a coordinate system bug. Check:
1. Does the entity check for nature simulation mode?
2. Is it using `this.x = this.worldX` in nature mode?
3. Is it converting coordinates in normal modes?

### "Game crashes on null lure"
FishAI or Lure code is being called in nature mode. Add null check:
```javascript
if (!lure) {
    // Nature mode behavior
    return;
}
```

### "Entities going through lake bottom"
Check depth constraint code:
```javascript
// BAD - fixed pixels
const maxY = 10;

// GOOD - depth-based
let bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
const maxY = (bottomDepth - 5) * GameConfig.DEPTH_SCALE;
```

### "Ice fishing starts at wrong depth"
Registry pollution. Check `/src/scenes/MenuScene.js` clears registry when starting ice mode:
```javascript
this.registry.set('fishingWorldX', null);
this.registry.set('fishingWorldY', 5000);
```

## Files You'll Modify Most Often

### Entity Behavior
- `/src/entities/FishAI.js` - Fish decision-making
- `/src/entities/BaitfishCloud.js` - Baitfish school behavior
- `/src/entities/Baitfish.js` - Individual baitfish behavior

### Spawning & Balance
- `/src/scenes/systems/SpawningSystem.js` - Entity spawning logic
- `/src/config/SpeciesData.js` - Species stats and behavior

### Game Modes
- `/src/scenes/GameScene.js` - Normal fishing modes
- `/src/scenes/NatureSimulationScene.js` - Nature simulation mode
- `/src/scenes/MenuScene.js` - Menu and mode selection

### Configuration
- `/src/config/GameConfig.js` - Game constants
- `/src/utils/Constants.js` - Enums and utilities

## Files You'll Rarely Modify

- `/src/index.js` - Only when adding new scenes
- `/src/scenes/BootScene.js` - Only when adding new assets
- `/src/scenes/UIScene.js` - Only for HUD changes
- `/src/managers/*.js` - Only for new game modes

## Critical Gotchas

### 1. DEPTH_SCALE is Dynamic
```javascript
// DON'T assume DEPTH_SCALE is constant!
const maxY = 400 * 1.625; // WRONG - hardcoded

// DO calculate based on current depth setting:
const maxY = (bottomDepth - 5) * GameConfig.DEPTH_SCALE; // CORRECT
```

### 2. Always Check for Managers
```javascript
// DON'T assume a manager exists:
const x = this.scene.boatManager.getPlayerWorldX(); // CRASH in nature mode!

// DO check first:
if (this.scene.boatManager) {
    const x = this.scene.boatManager.getPlayerWorldX();
} else {
    // Handle nature mode
}
```

### 3. Registry Values Persist
```javascript
// Registry values persist across scene transitions!
// Always clear or reset when starting a new mode:
this.registry.set('fishingWorldX', null);
```

### 4. Baitfish Velocity Direction
```javascript
// In normal modes, baitfish drift toward player
cloud.velocity.x = fromLeft ? Utils.randomBetween(0.3, 0.8) : Utils.randomBetween(-0.8, -0.3);

// In nature mode, RANDOM direction to prevent vertical line:
cloud.velocity.x = Utils.randomBetween(-0.8, 0.8);
```

### 5. Fish Don't Have .active Property
```javascript
// DON'T:
if (fish.active) { /* ... */ } // Fish don't have .active!

// DO:
if (fish.visible) { /* ... */ }
```

## Debugging Workflow

1. **Enable Debug Mode**: Press backtick (`) in game
   - Shows fish states, positions, velocities
   - Shows baitfish cloud info
   - Shows FPS and performance

2. **Check Console**: Look for errors
   - "Cannot read properties of null" = Forgot null check
   - "Cannot read properties of undefined" = Typo or missing property
   - No error but wrong behavior = Logic or coordinate bug

3. **Add Console Logs**:
   ```javascript
   console.log('Fish worldX:', this.worldX, 'screenX:', this.x);
   console.log('Nature mode:', !this.scene.iceHoleManager && !this.scene.boatManager);
   ```

4. **Test All Modes**:
   - Change affects all modes? Test ice, kayak, boat, AND nature
   - Change only affects nature mode? Still verify others work

## Code Style

### Use ES6+ Features
```javascript
// GOOD
const { x, y } = fish.getPosition();
const activeFish = this.fishes.filter(f => f.visible);

// OK but verbose
const position = fish.getPosition();
const x = position.x;
const y = position.y;
```

### Comment Complex Logic
```javascript
// GOOD - explains WHY
// Nature mode: use worldX directly (no player to offset from)
this.x = this.worldX;

// BAD - explains WHAT (obvious from code)
// Set x to worldX
this.x = this.worldX;
```

### Use Meaningful Variable Names
```javascript
// GOOD
const bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
const isNatureSimulation = !this.scene.iceHoleManager && !this.scene.boatManager;

// BAD
const bd = this.scene.maxDepth || GameConfig.MAX_DEPTH;
const ns = !this.scene.iceHoleManager && !this.scene.boatManager;
```

## Git Commit Messages

Follow this format:
```
Brief summary (50 chars or less)

Detailed explanation of what changed and why.
Include bug fixes, new features, breaking changes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Example:
```
Fix baitfish vertical line trap in nature simulation

Changed velocity assignment in SpawningSystem to use random
directions instead of toward center. This prevents baitfish
from converging to a vertical line at x=600.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Testing Before Committing

1. **Syntax Check**: Run the game, check console for errors
2. **Visual Check**: Test the specific feature you changed
3. **Regression Check**: Test other modes to ensure no breakage
4. **Mode Switch Check**: Switch between modes - verify no pollution

### Quick Test Procedure for Nature Mode Changes:
1. Start nature simulation from menu
2. Try all depth settings (10, 25, 50, 75, 100, Random)
3. Spawn fish (X key) - verify visible and moving
4. Spawn baitfish (Y key) - verify visible and schooling
5. Check they don't go through bottom
6. Check they're distributed horizontally (not vertical line)
7. Return to menu, start ice mode - verify ice mode still works

## When in Doubt

1. **Check git history**: `git log --oneline -20`
2. **Search codebase**: `grep -r "pattern" src/`
3. **Read the AI artifacts**: `.ai/NATURE_SIMULATION_MODE.md` has detailed bug fixes
4. **Test in game**: Don't assume - verify!
5. **Ask user**: If unclear, ask before implementing

## Common Grep Patterns

```bash
# Find all coordinate conversion code
grep -r "CANVAS_WIDTH / 2" src/

# Find all nature mode detection
grep -r "iceHoleManager" src/entities/

# Find all depth scaling
grep -r "DEPTH_SCALE" src/

# Find all lure accesses (check for null safety)
grep -r "lure\." src/entities/FishAI.js

# Find all registry usage
grep -r "registry.set" src/scenes/
```

## Quick File Finder

```bash
# All entity files
ls src/entities/

# All scene files
ls src/scenes/

# All system files
ls src/scenes/systems/

# All config files
ls src/config/
```

## Performance Tips

- Limit console.log in production code (use debug mode instead)
- Use object pooling for frequently created/destroyed entities
- Cull entities far from player (>600px world distance)
- Use `Math.sqrt` sparingly (cache distance calculations)
- Phaser's update runs at 60 FPS - keep it fast!

## User Communication

- Be concise - user is reading in a CLI
- Explain what you're doing before doing it
- Use file paths with line numbers (e.g., `FishAI.js:45`)
- No emojis unless user requests
- Focus on facts, not validation

## Session Management

- Use TodoWrite tool for multi-step tasks
- Mark todos as in_progress BEFORE starting work
- Mark todos as completed IMMEDIATELY after finishing
- Commit frequently with clear messages
- Push when task is complete

## Final Checklist Before Ending Session

- [ ] All changes committed
- [ ] All commits pushed to branch
- [ ] No console errors
- [ ] Basic smoke test passed (game runs)
- [ ] User informed of what was done
- [ ] Any outstanding issues documented

---

**Remember**: The nature simulation mode is complete and working. Most future work will be balance tweaks, new species, or new features. The coordinate system is the foundation - understand it well!

**Branch**: `claude/new-game-concept-011CUV24FTAHJE9cys3sfWkz`
**Last Updated**: 2025-10-26
