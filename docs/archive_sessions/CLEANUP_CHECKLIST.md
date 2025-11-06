# WOLFPACK CLEANUP CHECKLIST

**Created**: Nov 5, 2025
**Status**: Ready for Implementation
**Priority**: HIGH (Quick wins available)

---

## CRITICAL ISSUES TO FIX (IMMEDIATE)

### 1. DELETE DEPRECATED SCENES (5 minutes)
Remove these two files - they're dead code:

```bash
rm src/scenes/UIScene.js          # 60 lines, NO functionality
rm src/scenes/InfoBar.js           # 134 lines, REPLACED by GameHUD
```

Then update:
- **src/index.js** (line 9-10): Remove imports
- **src/index.js** (line 48): Remove from scene array

**Before**:
```javascript
import UIScene from './scenes/UIScene.js';
import WaterColumn from './scenes/WaterColumn.js';
import InfoBar from './scenes/InfoBar.js';
// ...
scene: [BootScene, WaterColumn, GameScene, GameHUD, InfoBar, MenuScene, GameOverScene, UIScene],
```

**After**:
```javascript
import WaterColumn from './scenes/WaterColumn.js';
// ...
scene: [BootScene, WaterColumn, GameScene, GameHUD, MenuScene, GameOverScene],
```

**Impact**: 194 lines removed, cleaner scene initialization

---

### 2. INVESTIGATE QRCodeGenerator (15 minutes)
Check if `src/utils/QRCodeGenerator.js` is actually used:

```bash
grep -r "QRCode" /Users/mgilbert/Code/wolfpack/src --include="*.js"
```

**If unused**: Delete it (71 lines)
**If used**: Add documentation explaining what it's for

---

### 3. REMOVE COMMENTED CODE (10 minutes)
Clean up commented-out deprecated launches:

**File: src/scenes/GameScene.js**
- Line 191: `//this.scene.launch('InfoBar');  // Deprecated - replaced by GameHUD`
- Line 192: `//this.scene.launch('FishStatus'); // Deprecated - replaced by GameHUD`

Delete these two lines.

---

## MEDIUM PRIORITY (1-2 hours)

### 4. IMPLEMENT GLOBAL DEBUG FLAG

**File: src/config/GameConfig.js**

Add near top of file:
```javascript
export const GameConfig = {
    // DEBUG MODE - Set to true for development, false for production
    DEBUG_MODE: false,
    
    // ... rest of config
```

Then wrap all console.log statements with:
```javascript
if (GameConfig.DEBUG_MODE) console.log('...');
```

**Priority Files**:
1. FishAI.js (20+ calls)
2. FishFight.js (25+ calls)
3. GameScene.js (35+ calls)
4. SonarDisplay.js (15+ calls)

---

## NICE TO HAVE (Polish)

### 5. DOCUMENT CONFUSING NAMES
Add comments:
- **WaterColumn.js** - Not UI, it's the rendering layer (water + sonar + sprites)
- Create systems/ README explaining each system

### 6. ADD ARCHITECTURE DIAGRAM
Create visual of scene flow:
```
BootScene (splash) 
  ↓
MenuScene (select mode)
  ├→ GameScene (ice fishing)
  │   ├→ WaterColumn (render layer)
  │   └→ GameHUD (HUD overlay)
  │
  └→ NatureSimulationScene (observe mode)
      ├→ WaterColumn (render layer)
      └→ [GameHUD probably also runs]
```

---

## VERIFICATION STEPS

After cleanup, verify nothing breaks:

```bash
# 1. Build test
npm run build

# 2. Run tests
npm test

# 3. Manual testing
# - Start from boot screen ✓
# - Go to menu ✓
# - Launch game scene ✓
# - Check HUD renders ✓
# - Check nature mode works ✓
```

---

## SUMMARY

| Task | Time | Impact | Risk |
|------|------|--------|------|
| Delete UIScene + InfoBar | 5 min | Remove 194 lines | LOW |
| Investigate QRCodeGenerator | 15 min | Possibly remove 71 lines | LOW |
| Clean commented code | 10 min | Remove clutter | LOW |
| Add debug flag | 1-2 hr | Cleaner logs | LOW |
| **TOTAL** | **~2 hours** | **265+ lines removed** | **LOW** |

---

## EXPECTED OUTCOME

After cleanup:
- ✅ No dead scenes in initialization
- ✅ No deprecated code in active codebase
- ✅ Console noise reduced significantly
- ✅ Code ready for review
- ✅ ~265 lines of unnecessary code removed

**File Count**: 45 source files → 43 source files
**Dead Code Removed**: 194 lines minimum
**Technical Debt Reduced**: HIGH

