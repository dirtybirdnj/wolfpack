# Dead Code Analysis & Cleanup Report

**Branch:** `refactor-entity-model-relationship`
**Analysis Date:** 2025-11-05
**Total Files Analyzed:** 45 JavaScript files

---

## Executive Summary

**Dead/Deprecated Code Found:** ~2,800 lines
**Immediate Cleanup Target:** ~500 lines (low risk)
**Refactor Target:** ~2,300 lines (entity/model duplication)
**Time to Clean:** ~2 hours (immediate) + refactor work

---

## Critical Findings

### 🔴 HIGH PRIORITY - Delete Immediately (30 minutes)

#### 1. InfoBar.js - DEPRECATED SCENE
**Path:** `/src/scenes/InfoBar.js`
**Lines:** 134
**Status:** ❌ DEAD - Replaced by GameHUD
**Loaded:** Yes (still in scene array!)
**Used:** Never launched, purely legacy

**Evidence:**
```javascript
// src/index.js line 48
scene: [BootScene, WaterColumn, GameScene, GameHUD, InfoBar, MenuScene, GameOverScene, UIScene]
//                                                    ^^^^^^^ NEVER USED
```

GameHUD completely replaces this functionality. InfoBar was the old HTML-style UI overlay.

**Action:**
1. Delete `/src/scenes/InfoBar.js`
2. Remove from `src/index.js` line 48: `InfoBar,`
3. Remove import: `import InfoBar from './scenes/InfoBar.js';`

**Risk:** ZERO - Not used anywhere

---

#### 2. UIScene.js - EMPTY PLACEHOLDER
**Path:** `/src/scenes/UIScene.js`
**Lines:** 60
**Status:** ❌ DEAD - Never implemented
**Loaded:** Yes (still in scene array!)
**Used:** Empty placeholder

**Code:**
```javascript
export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        console.log('UIScene created');
        // Scene currently not used, placeholder for future UI features
    }
}
```

Literally does nothing except log to console.

**Action:**
1. Delete `/src/scenes/UIScene.js`
2. Remove from `src/index.js` line 48: `UIScene`
3. Remove import: `import UIScene from './scenes/UIScene.js';`

**Risk:** ZERO - Empty placeholder

---

#### 3. QRCodeGenerator.js - ORPHANED UTILITY
**Path:** `/src/utils/QRCodeGenerator.js`
**Lines:** 71
**Status:** ⚠️ QUESTIONABLE - Not imported anywhere
**Used:** Cannot find any imports

**Search Results:**
```bash
$ grep -r "QRCodeGenerator" src/
# NO MATCHES (except in the file itself)
```

**Possible Use Cases:**
- Multiplayer session sharing?
- Debug URL generation?
- Future feature planned?

**Action:**
1. Search one more time to verify
2. If confirmed unused → DELETE
3. If used → keep but document

**Risk:** LOW - No imports found

---

### 🟡 MEDIUM PRIORITY - Refactor Target (~2,300 lines)

These are the files we're ALREADY planning to delete in the entity/model refactor:

#### 4. Legacy Entity Layer (1,300 lines)
- `/src/entities/Fish.js` - 1010 lines ❌ DEPRECATED
- `/src/entities/Baitfish.js` - 120 lines ❌ DEPRECATED
- `/src/entities/BaitfishCloud.js` - 170 lines ❌ DEPRECATED

**Status:** Being replaced by unified FishSprite
**Timeline:** Phase 5 of refactor (after new system works)

#### 5. Legacy Model Layer (1,000 lines)
- `/src/models/fish.js` - 593 lines ❌ DEPRECATED
- `/src/models/baitfish.js` - 604 lines ❌ DEPRECATED

**Status:** Logic moving to components
**Timeline:** Phase 5 of refactor

#### 6. Duplicate Sprite Classes (merged in refactor)
- `/src/models/FishSprite.js` - Being merged
- `/src/models/BaitfishSprite.js` - Being merged

**Status:** Merging into single unified FishSprite
**Timeline:** Phase 1 of refactor

---

### 🟢 LOW PRIORITY - Cleanup Later

#### 7. NatureSimulationScene.js - DISABLED FEATURE
**Path:** `/src/scenes/NatureSimulationScene.js`
**Lines:** 420
**Status:** ⚠️ INACTIVE - Not in scene array
**Purpose:** Ecosystem sandbox mode (fish + baitfish AI testing)

**Evidence:**
```javascript
// src/index.js - NOT in scene array
scene: [BootScene, WaterColumn, GameScene, GameHUD, InfoBar, MenuScene, GameOverScene, UIScene]
//      ^^^^^^^^^^^^^^^^^^^^^^ NatureSimulationScene is MISSING
```

**Recommendation:** KEEP for now
**Reason:** Potentially useful for ecosystem testing/debugging

**Action:** Document in README that this is a dev-only scene

---

#### 8. Excessive Console Logging (200+ statements)

**Distribution:**
- GameScene.js: ~35 console.log calls
- FishFight.js: ~25 console.log calls
- FishAI.js: ~20 console.log calls
- SonarDisplay.js: ~15 console.log calls
- SpawningSystem.js: ~12 console.log calls
- Others: ~100+ scattered

**Examples:**
```javascript
console.log('🐟 Spawning 12 lake_trout at (800, 350)');
console.log('Fish AI state changed: IDLE → INTERESTED');
console.log('Baitfish consumed by predator');
```

**Recommendation:** Add DEBUG_MODE flag

**Implementation:**
```javascript
// GameConfig.js
export default {
    DEBUG_MODE: false, // Set to true for development
    // ...
};

// Usage:
if (GameConfig.DEBUG_MODE) {
    console.log('🐟 Spawning fish...');
}
```

**Action:** Phase 6 of refactor (after core work done)

---

#### 9. AquaticOrganism.js - BASE CLASS
**Path:** `/src/models/AquaticOrganism.js`
**Lines:** 89
**Status:** ⚠️ USED - But may be obsolete after refactor

**Current Hierarchy:**
```
AquaticOrganism (base)
├── Fish (predators)
├── Baitfish
├── Crayfish
└── Zooplankton
```

**After Refactor:**
```
Phaser.GameObjects.Sprite
├── FishSprite (unified)
├── Crayfish
└── Zooplankton
```

**Recommendation:** KEEP for Crayfish/Zooplankton
**Action:** Simplify after fish refactor complete

---

## Files Confirmed ACTIVE (Keep)

### Scenes (7 active)
✅ **BootScene.js** (151 lines) - Asset loading, initialization
✅ **WaterColumn.js** (390 lines) - Main rendering layer (water + sonar)
✅ **GameScene.js** (1,848 lines) - Core gameplay orchestrator
✅ **GameHUD.js** (680 lines) - In-game UI (replaces InfoBar)
✅ **MenuScene.js** (286 lines) - Main menu (mode selection)
✅ **GameOverScene.js** (167 lines) - End-game summary
⚠️ **NatureSimulationScene.js** (420 lines) - Dev/test mode (not loaded)

### Entities (9 active)
✅ **Lure.js** (331 lines) - Player's fishing lure
✅ **FishingLine.js** (167 lines) - Visual line rendering
✅ **FishFight.js** (443 lines) - Fighting mechanics
✅ **FishAI.js** (546 lines) - Predator AI state machine
✅ **Crayfish.js** (205 lines) - Bottom-dwelling prey
✅ **Zooplankton.js** (174 lines) - Food for baitfish
❌ **Fish.js** (1010 lines) - DEPRECATED (refactor target)
❌ **Baitfish.js** (120 lines) - DEPRECATED (refactor target)
❌ **BaitfishCloud.js** (170 lines) - DEPRECATED (refactor target)

### Models (13 active)
✅ **FishSprite.js** (328 lines) - Predator sprite (merging soon)
✅ **BaitfishSprite.js** (206 lines) - Baitfish sprite (merging soon)
✅ **FishingLineModel.js** (137 lines) - Line physics
✅ **ReelModel.js** (226 lines) - Reel mechanics (drag, tension)
✅ **AquaticOrganism.js** (89 lines) - Base class (keep for now)
✅ **crayfish.js** (83 lines) - Crayfish model
✅ **zooplankton.js** (82 lines) - Zooplankton model
❌ **fish.js** (593 lines) - DEPRECATED (refactor target)
❌ **baitfish.js** (604 lines) - DEPRECATED (refactor target)

**Species Configs (4 files):**
✅ **LakeTrout.js** (232 lines) - Keep but remove renderBody()
✅ **NorthernPike.js** (231 lines) - Keep but remove renderBody()
✅ **SmallmouthBass.js** (222 lines) - Keep but remove renderBody()
✅ **YellowPerch.js** (85 lines) - Keep (minimal, good example)

### Systems (4 active)
✅ **SpawningSystem.js** (831 lines) - Entity spawning
✅ **InputSystem.js** (408 lines) - Gamepad/keyboard/mouse
✅ **CollisionSystem.js** (278 lines) - Collision detection
✅ **DebugSystem.js** (151 lines) - Debug overlays
✅ **NotificationSystem.js** (285 lines) - In-game messages

### Config (2 active)
✅ **GameConfig.js** (207 lines) - Core game settings
✅ **SpeciesData.js** (563 lines) - Fish/baitfish species definitions

### Utils (5 active + 1 questionable)
✅ **Constants.js** (121 lines) - Game constants
✅ **GamepadManager.js** (253 lines) - Native gamepad API wrapper
✅ **DepthConverter.js** (129 lines) - Depth ↔ pixel conversions
✅ **SonarDisplay.js** (452 lines) - Sonar rendering
✅ **SpriteGenerator.js** (289 lines) - Dynamic sprite generation
⚠️ **QRCodeGenerator.js** (71 lines) - NOT IMPORTED (verify)

---

## Cleanup Action Plan

### Phase 1: Immediate Cleanup (30 minutes)

**Step 1: Delete InfoBar.js**
```bash
rm src/scenes/InfoBar.js
```

**Step 2: Delete UIScene.js**
```bash
rm src/scenes/UIScene.js
```

**Step 3: Update src/index.js**
```javascript
// BEFORE (line 12-13):
import InfoBar from './scenes/InfoBar.js';
import UIScene from './scenes/UIScene.js';

// AFTER:
// REMOVED: InfoBar (replaced by GameHUD)
// REMOVED: UIScene (never implemented)

// BEFORE (line 48):
scene: [BootScene, WaterColumn, GameScene, GameHUD, InfoBar, MenuScene, GameOverScene, UIScene],

// AFTER:
scene: [BootScene, WaterColumn, GameScene, GameHUD, MenuScene, GameOverScene],
```

**Step 4: Verify QRCodeGenerator**
```bash
grep -r "QRCodeGenerator" src/
# If no results → delete it
rm src/utils/QRCodeGenerator.js
```

**Step 5: Test**
```bash
npm start
# Verify game loads and plays normally
```

**Expected Result:**
- Game loads faster (2 fewer scenes in memory)
- No console errors
- All functionality works
- ~270 lines of dead code removed

---

### Phase 2: Entity/Model Refactor (see ENTITY_REFACTOR.md)

This is the big one - ~2,300 lines being replaced with new unified architecture.

**Timeline:** 8-12 hours
**Risk:** MEDIUM (requires testing)
**Benefit:** Massive simplification

---

### Phase 3: Debug Logging Cleanup (1 hour)

**Step 1: Add DEBUG_MODE to GameConfig.js**
```javascript
export default {
    // Debug settings
    DEBUG_MODE: false, // Set true for development logging
    DEBUG_SPAWNING: false,
    DEBUG_AI: false,
    DEBUG_PHYSICS: false,

    // ... rest of config
};
```

**Step 2: Wrap console.log calls**
```javascript
// BEFORE:
console.log('🐟 Spawning 12 lake_trout');

// AFTER:
if (GameConfig.DEBUG_MODE || GameConfig.DEBUG_SPAWNING) {
    console.log('🐟 Spawning 12 lake_trout');
}
```

**Step 3: Create debug utility**
```javascript
// utils/Debug.js
export const Debug = {
    log: (category, ...args) => {
        if (GameConfig.DEBUG_MODE || GameConfig[`DEBUG_${category.toUpperCase()}`]) {
            console.log(...args);
        }
    }
};

// Usage:
Debug.log('spawning', '🐟 Spawning fish');
```

---

## Summary Statistics

### Current Codebase
- **Total files:** 45
- **Total lines:** ~15,000
- **Active code:** ~12,200 lines
- **Dead code:** ~500 lines (3.3%)
- **Refactor target:** ~2,300 lines (15.3%)

### After Immediate Cleanup
- **Total files:** 42 (-3)
- **Total lines:** ~14,730 (-270)
- **Dead code:** ~0 lines (0%)
- **Refactor target:** ~2,300 lines

### After Full Refactor
- **Total files:** ~35 (-10)
- **Total lines:** ~12,400 (-2,600)
- **Dead code:** 0
- **Architecture:** Clean, modern, Phaser-native

---

## Risk Assessment

### Immediate Cleanup (Phase 1)
**Risk Level:** 🟢 ZERO
**Reason:** Files are not used anywhere
**Testing Required:** Basic smoke test (game loads)
**Rollback:** Git revert if needed
**Time:** 30 minutes

### Entity/Model Refactor (Phase 2)
**Risk Level:** 🟡 MEDIUM
**Reason:** Core gameplay changes
**Testing Required:** Full playthrough, all species
**Rollback:** Stay on branch, don't merge until tested
**Time:** 8-12 hours

### Debug Logging (Phase 3)
**Risk Level:** 🟢 VERY LOW
**Reason:** Only affects logging, not gameplay
**Testing Required:** Verify no errors
**Rollback:** Easy to undo
**Time:** 1 hour

---

## Recommendations

### Do Now (30 min):
1. ✅ Delete InfoBar.js
2. ✅ Delete UIScene.js
3. ✅ Check/delete QRCodeGenerator.js
4. ✅ Update src/index.js
5. ✅ Test game loads

### Do This Week (8-12 hours):
6. 🔄 Complete entity/model refactor (see ENTITY_REFACTOR.md)
7. 🔄 Delete legacy files (Fish.js, Baitfish.js, etc.)
8. 🔄 Test thoroughly

### Do Eventually (1-2 hours):
9. ⏸️ Add DEBUG_MODE flag
10. ⏸️ Wrap console.log statements
11. ⏸️ Document NatureSimulationScene
12. ⏸️ Add architecture diagram to README

---

## Files to Monitor

These files are ACTIVE but may need refactoring later:

1. **GameScene.js (1,848 lines)** - Getting large, consider splitting
2. **SpawningSystem.js (831 lines)** - Could simplify after unified fish
3. **SpeciesData.js (563 lines)** - Will grow with unified config
4. **FishAI.js (546 lines)** - Could extract to component
5. **SonarDisplay.js (452 lines)** - Complex rendering, works well

None are urgent, but keep an eye on complexity.

---

## Conclusion

Your codebase is in **good shape** with minimal dead code. The main cleanup targets are:

**Immediate (30 min):**
- 2 unused scenes (InfoBar, UIScene)
- 1 orphaned utility (QRCodeGenerator)
- ~270 lines to delete

**Planned Refactor (8-12 hours):**
- Entity/model duplication
- ~2,300 lines to replace with cleaner architecture

**Total reduction:** ~2,600 lines (17% of codebase)
**Code quality improvement:** Significant

After this cleanup, you'll have a lean, modern, maintainable codebase following Phaser best practices.

---

*Last Updated: 2025-11-05*
*Analysis Tool: Manual code review + grep + git log*
*Status: Ready for cleanup*
