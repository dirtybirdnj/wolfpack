# Token Efficiency Audit - Pre-TypeScript Conversion

**Date:** November 6, 2025
**Purpose:** Optimize codebase for efficient TypeScript conversion
**Current Token Usage:** ~113k / 200k

---

## 📊 Codebase Statistics

### JavaScript Files
- **Total:** 36 files, 18,551 lines
- **Largest Files:**
  1. `GameScene.js` - 2,443 lines ⚠️ HIGH
  2. `FishFight.js` - 1,387 lines ⚠️ HIGH
  3. `FishAI.js` - 1,280 lines ⚠️ HIGH
  4. `NatureSimulationScene.js` - 1,055 lines ⚠️ MEDIUM
  5. `NotificationSystem.js` - 938 lines ⚠️ MEDIUM

### Documentation Files
- **Total:** 27 markdown files, 9,549 lines
- **Recent (Nov 6):** 5 files - Keep
- **Refactor Session (Nov 5):** 10+ files - Archive candidates

---

## 🎯 Cleanup Recommendations

### Critical: Archive Old Session Docs

These are historical and no longer needed for active development:

**Archive to `docs/archive_sessions/`:**
```bash
# Old session summaries (Nov 5 and earlier)
SESSION_3_SUMMARY.md (897 lines)
SESSION_2_COMPLETE.md (435 lines)
SESSION-NOTES.md (154 lines)
REFACTOR_PROGRESS.md (308 lines)
REFACTOR_COMPLETE.md (514 lines)
VERIFICATION_CHECKLIST.md (353 lines)

# Completed refactor docs
ENTITY_REFACTOR.md (442 lines)
ECOSYSTEM_INTEGRATION.md (610 lines)
DEAD_CODE.md (490 lines)
PHASER_MAP.md (510 lines)
PHASER_GROUPS_MIGRATION.md (151 lines)

# Old optimization docs
nov-2-optimisations.md (584 lines)
HARDCODED_DIMENSIONS_TODO.md (105 lines)
CLEANUP_CHECKLIST.md (163 lines)

# Legacy architecture docs (superseded by current)
ARCHITECTURE.md (436 lines)
CODEBASE_ANALYSIS.md (897 lines)
FISHAI_GUIDE.md (609 lines)
CURRENT_STATUS.md (406 lines)
```

**Total to Archive:** ~7,000 lines of old documentation

### Keep at Root Level

These are actively referenced:

```
✅ README.md (125 lines) - Project overview
✅ TYPESCRIPT_CONVERSION_AUDIT.md (452 lines) - Active conversion guide
✅ SESSION_SUMMARY_NOV6.md (293 lines) - Latest session
✅ GITHUB_ISSUES_SUMMARY.md (154 lines) - Issue tracking
✅ nov-6-bugs.md (103 lines) - Current bug list
✅ LAUNCH_CHECKLIST.md (396 lines) - Pre-launch tasks
✅ QUICK_START.md (58 lines) - Quick reference
✅ TEST_COVERAGE_ANALYSIS.md (196 lines) - Testing guide
✅ QR-CODE-ERROR-STAMP.md (160 lines) - Error handling reference
```

---

## 📁 Proposed Directory Structure

```
/wolfpack
├── README.md                          # Keep
├── TYPESCRIPT_CONVERSION_AUDIT.md     # Keep - Active
├── LAUNCH_CHECKLIST.md                # Keep - Pre-launch
├── QUICK_START.md                     # Keep - Quick ref
├── nov-6-bugs.md                      # Keep - Current bugs
│
├── docs/
│   ├── ARCHITECTURE_DIAGRAM.md        # Current architecture
│   ├── FILE_MAP.md                    # Current file structure
│   ├── PROJECT_STATUS.md              # Current status
│   │
│   ├── sessions/                      # Session summaries
│   │   ├── SESSION_SUMMARY_NOV6.md    # Latest
│   │   └── GITHUB_ISSUES_SUMMARY.md   # Issue tracking
│   │
│   ├── archive_old/                   # Already archived (24 files)
│   │   └── [old docs from yesterday]
│   │
│   └── archive_sessions/              # NEW - Archive old session docs
│       ├── SESSION_3_SUMMARY.md
│       ├── SESSION_2_COMPLETE.md
│       ├── REFACTOR_COMPLETE.md
│       ├── ENTITY_REFACTOR.md
│       ├── ECOSYSTEM_INTEGRATION.md
│       ├── DEAD_CODE.md
│       ├── PHASER_MAP.md
│       ├── nov-2-optimisations.md
│       └── [etc...]
│
└── src/                               # Source code
```

---

## 🔍 Code Efficiency Analysis

### Large Files to Monitor During TS Conversion

**GameScene.js (2,443 lines)**
- ⚠️ Largest file in codebase
- Contains: Scene setup, update loop, fish management, UI, input handling
- **TS Risk:** High - complex lifecycle, many dynamic properties
- **Recommendation:** Convert in Phase 5, break into smaller modules if possible

**FishFight.js (1,387 lines)**
- Contains: Fish hooking mechanics, line tension, reel physics
- **TS Risk:** Medium - state machine with clear interfaces
- **Recommendation:** Convert in Phase 4, good candidate for interfaces

**FishAI.js (1,280 lines)**
- Contains: All predator AI logic, state machines, decision trees
- **TS Risk:** High - complex behavior trees, many conditionals
- **Recommendation:** Convert in Phase 4, use enum for states

**NotificationSystem.js (938 lines)**
- Contains: UI notifications and message queue
- **TS Risk:** Low - mostly UI logic
- **Recommendation:** Convert in Phase 3

**SpeciesData.js (924 lines)**
- ⚠️ Legacy species data (still in use alongside OrganismData.js)
- **TS Risk:** Low - just data
- **Action Required:** Verify if can be deleted or if still needed for backwards compatibility
- **Recommendation:** Check if getBaitfishSpecies() and getPredatorSpecies() are still used

---

## 🗑️ Potential Dead Code

### Check Before TS Conversion

**SpeciesData.js vs OrganismData.js**
```bash
# Check if SpeciesData is still imported
grep -r "SpeciesData" src/ --include="*.js"
```

If only used in SpawningSystem as fallback, consider removing after TS conversion.

**Old Component Patterns**
Already cleaned up in refactor:
- ✅ Deleted: SchoolingBehavior.js
- ✅ Deleted: Old entity classes (Baitfish, Fish, Crayfish, etc.)
- ✅ Deleted: Old model classes

---

## 📋 Pre-TS Conversion Checklist

### Documentation Cleanup
- [ ] Create `docs/archive_sessions/` directory
- [ ] Move 17 old session/refactor docs to archive
- [ ] Keep only 9 essential docs at root level
- [ ] Update README to reference new doc structure

### Code Cleanup
- [ ] Verify SpeciesData.js is still needed
- [ ] Check for any remaining console.logs (debug only)
- [ ] Ensure all files use consistent imports (ES6 modules)
- [ ] Verify no circular dependencies

### Token Optimization Impact
- **Before:** ~9,500 lines of docs at root
- **After:** ~2,500 lines at root (73% reduction)
- **Benefit:** Cleaner context for TS conversion agents

---

## 🚀 Ready for TypeScript Conversion?

### ✅ Green Lights
- All critical bugs fixed (#62, #63, #64, #65)
- Clean unified organism architecture
- Documentation organized
- Clear 6-phase conversion plan
- 36 files to convert (manageable scope)

### ⚠️ Yellow Lights
- GameScene.js very large (2,443 lines) - plan to split during conversion
- FishAI.js complex (1,280 lines) - will need careful type definitions
- SpeciesData.js legacy status unclear - verify before converting

### 🔴 Red Lights
- None! Ready to proceed.

---

## 📝 Recommended Actions

### Immediate (Before Starting #66)
1. Archive old session docs to `docs/archive_sessions/`
2. Verify SpeciesData.js usage
3. Clean up any remaining debug console.logs
4. Commit cleanup changes

### During TS Conversion
1. Start with Phase 1 (utils + config)
2. Monitor token usage per phase
3. Keep session summaries concise
4. Archive phase docs as completed

---

## 🎯 Token Budget for TS Conversion

**Current Available:** ~87k tokens

**Estimated Per Phase:**
- Phase 1 (Utils): ~10k tokens
- Phase 2 (Sprites): ~15k tokens
- Phase 3 (Systems): ~20k tokens
- Phase 4 (AI): ~20k tokens
- Phase 5 (Scenes): ~25k tokens
- Phase 6 (Entry): ~5k tokens

**Total Estimated:** ~95k tokens
**Strategy:** Do 2-3 phases per session to stay under budget

---

**Status:** Ready to begin TypeScript conversion
**Next Step:** Archive old docs, then start Phase 1
