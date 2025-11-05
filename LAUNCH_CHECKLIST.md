# Launch Checklist - Entity/Model Refactor

**Branch:** `refactor-entity-model-relationship`
**Date:** 2025-11-05
**Status:** 🚀 READY TO LAUNCH

---

## Pre-Flight Documents ✅

All planning documents created and ready:

- ✅ **ENTITY_REFACTOR.md** - Complete refactor plan (6 phases, testing checklist)
- ✅ **DEAD_CODE.md** - Dead code analysis (~2,800 lines identified)
- ✅ **PHASER_MAP.md** - Phaser 3 API quick reference (token-efficient)
- ✅ **TODO list** - 10 tracked tasks in TodoWrite

---

## Quick Reference

### What We're Doing
Unifying the fish entity/model architecture:
- **Remove** 3 parallel fish systems (entity, model, sprite)
- **Create** single FishSprite for all fish types
- **Allow** all fish to school (tight bait balls vs loose predator packs)
- **Use** Phaser best practices (Groups, Sprites, pooling)
- **Delete** ~2,300 lines of duplicate code

### Key Design Decisions
1. `fish.type` → `'bait'` or `'predator'` (clear terminology)
2. Single FishSprite class with component composition
3. Emergent school formation (fish spawn, schools form naturally)
4. Species-exclusive schools (for now)
5. Species data drives all behavior

---

## Phase Overview

### Phase 1: Foundation (2-3 hours)
1. Create folder structure (sprites/, components/)
2. Create SpeciesData.js with unified configs
3. Extract SchoolingBehavior component
4. Create unified FishSprite (merge FishSprite + BaitfishSprite)

**Risk:** LOW - New code, doesn't break existing
**Test:** New files compile, no errors

### Phase 2: School Manager (1-2 hours)
5. Create SchoolManager system
6. Implement emergent clustering algorithm
7. Test school formation logic

**Risk:** LOW - Isolated system
**Test:** Schools form from scattered fish

### Phase 3: Integration (2-3 hours)
8. Update SpawningSystem to use unified FishSprite
9. Integrate SchoolManager with GameScene
10. Test all species spawning

**Risk:** MEDIUM - Touches core gameplay
**Test:** All fish spawn correctly, schools form

### Phase 4: Cleanup (2-3 hours)
11. Consolidate GameScene collections
12. Simplify update loops
13. Remove adapter layer

**Risk:** MEDIUM - Changes game loop
**Test:** Full playthrough, all behaviors work

### Phase 5: Delete Legacy (1 hour)
14. Delete legacy entity files (Fish.js, Baitfish.js, etc.)
15. Delete legacy model files (fish.js, baitfish.js)
16. Update all imports

**Risk:** HIGH if not tested first
**Test:** Game still works, no import errors

### Phase 6: Phaser Best Practices (1-2 hours)
17. Replace arrays with Groups
18. Implement object pooling
19. Performance testing

**Risk:** LOW - Optimizations only
**Test:** 60fps with 200+ fish

**Total Estimate:** 8-12 hours

---

## Before You Start

### 1. Quick Cleanup (OPTIONAL - 30 minutes)
Remove dead code first to clean workspace:

```bash
# Delete unused scenes
rm src/scenes/InfoBar.js
rm src/scenes/UIScene.js

# Verify QRCodeGenerator usage
grep -r "QRCodeGenerator" src/
# If no results:
rm src/utils/QRCodeGenerator.js

# Update src/index.js
# Remove imports and scene array entries for InfoBar, UIScene
```

### 2. Commit Current State
```bash
git add ENTITY_REFACTOR.md DEAD_CODE.md PHASER_MAP.md LAUNCH_CHECKLIST.md
git commit -m "Add refactor planning documents and analysis"
```

### 3. Verify Branch
```bash
git branch
# Should show: * refactor-entity-model-relationship
```

### 4. Check Game Works
```bash
npm start
# Verify game loads and plays normally
# This is your baseline for testing
```

---

## Phase 1 Detailed Steps

### Step 1: Create Folder Structure
```bash
mkdir -p src/sprites
mkdir -p src/components
```

### Step 2: Create SpeciesData.js
Location: `src/config/SpeciesData.js`

Key structure:
```javascript
export const SPECIES = {
    alewife: {
        type: 'bait',
        schooling: { enabled: true, separationRadius: 15, ... },
        // No hunting or biology
    },
    yellow_perch: {
        type: 'predator',
        schooling: { enabled: true, separationRadius: 40, ... },
        hunting: { enabled: true, ... },
        biology: { hunger: true, ... }
    },
    // ...
};

export function getSpeciesData(species) {
    return SPECIES[species];
}
```

### Step 3: Extract SchoolingBehavior
Location: `src/components/SchoolingBehavior.js`

Extract from: `src/entities/Fish.js` lines 620-847 (Boids algorithm)

Key methods:
- `constructor(fish, config)`
- `applyForces(separation, alignment, cohesion)`
- `update(delta)`

### Step 4: Create Unified FishSprite
Location: `src/sprites/FishSprite.js`

Merge:
- `src/models/FishSprite.js` (predator logic)
- `src/models/BaitfishSprite.js` (baitfish logic)

Key features:
- Single class for all fish
- Component composition (schooling, hunting, biology)
- `preUpdate()` for automatic updates
- Uses species data from config

**Test Point:** Files compile, no syntax errors

---

## Phase 2 Detailed Steps

### Step 5: Create SchoolManager
Location: `src/systems/SchoolManager.js`

Key methods:
- `detectNewSchools(allFish)` - Find clusters
- `findClusters(fishList, radius)` - Proximity grouping
- `createSchool(species, members)` - Initialize school
- `updateSchools()` - Apply Boids to members
- `isSchoolFragmented(school)` - Check dispersion
- `cleanupSchools()` - Remove empty schools

### Step 6: Test Clustering Algorithm
Create simple test scene or use console:
```javascript
// Spawn 10 fish near each other
// SchoolManager should detect and create school
// Verify: school.members.length === 10
```

**Test Point:** Schools form from nearby fish

---

## Testing Checklist

After each phase, verify:

### Basic Functionality
- [ ] Game loads without errors
- [ ] Can start game (Menu → Gameplay)
- [ ] Lure drops and reels correctly
- [ ] Mouse/gamepad controls work

### Fish Spawning
- [ ] Alewife spawn
- [ ] Yellow perch spawn
- [ ] Smallmouth bass spawn
- [ ] Lake trout spawn
- [ ] Crayfish spawn
- [ ] Zooplankton spawn

### School Behavior
- [ ] Alewife form tight schools (bait balls)
- [ ] Yellow perch form loose packs
- [ ] Bass form small groups (2-5)
- [ ] Lake trout stay solitary
- [ ] Schools form naturally from scattered fish
- [ ] Schools disband when fragmented

### Predator Behavior
- [ ] Fish hunt baitfish
- [ ] Fish chase lure when interested
- [ ] Fish strike lure
- [ ] Can hook and fight fish
- [ ] Fish have hunger/health (predators only)

### UI & HUD
- [ ] Fish count updates
- [ ] Baitfish count updates
- [ ] Fish status sidebar shows correctly
- [ ] Top bar meters work
- [ ] M/S/F keys toggle UI

### Performance
- [ ] 60fps with 20 fish
- [ ] 60fps with 50 fish
- [ ] 60fps with 100+ fish
- [ ] No memory leaks (play for 5 minutes)

---

## Rollback Plan

If something breaks:

### Option 1: Git Revert
```bash
git log  # Find last working commit
git revert <commit-hash>
```

### Option 2: Stash Changes
```bash
git stash save "WIP - refactor not working"
git checkout HEAD~1  # Go back one commit
```

### Option 3: Branch Restart
```bash
git branch refactor-entity-model-relationship-backup
git reset --hard origin/main
git checkout -b refactor-entity-model-relationship-v2
```

---

## Success Criteria

**Minimum Viable Refactor:**
- ✅ Single FishSprite class works for all fish types
- ✅ Alewife school tightly
- ✅ Lake trout stay solitary
- ✅ Predators hunt and fight
- ✅ No performance regression
- ✅ Game is playable end-to-end

**Nice to Have:**
- Yellow perch schooling
- Bass small groups
- Emergent school formation
- Phaser Groups with pooling

**Don't Need Yet:**
- Mixed-species schools
- Advanced AI behaviors
- Perfect performance optimization

---

## When to Stop & Evaluate

Stop and ask for guidance if:
1. **More than 2 hours stuck** on single issue
2. **Performance drops** below 30fps with normal fish count
3. **Core gameplay breaks** (can't catch fish, game crashes)
4. **Scope creep** - adding features not in plan
5. **Uncertain about approach** - better to ask than redo

---

## Post-Launch Tasks

After refactor is complete and tested:

### Immediate (same session)
1. Delete legacy files
2. Update imports
3. Test one more time
4. Commit to branch

### Before Merge
5. Full playthrough (10+ minutes)
6. Test all species
7. Test all game modes
8. Check console for errors

### After Merge
9. Create PR with summary
10. Document breaking changes
11. Update README if needed

---

## Quick Wins to Celebrate

- ✅ Phase 1 complete → New architecture works!
- ✅ First school forms → Emergent behavior working!
- ✅ Legacy code deleted → -2,300 lines!
- ✅ Tests pass → Production ready!
- ✅ PR merged → Ship it! 🚀

---

## Emergency Contacts

**Get help if:**
- Phaser API confusion → Check `PHASER_MAP.md`
- Forgot the plan → Check `ENTITY_REFACTOR.md`
- Need to find dead code → Check `DEAD_CODE.md`
- Lost in weeds → Read this checklist again

**Take breaks:**
- After each phase (5-10 min)
- If frustrated (15-30 min)
- When tired (come back tomorrow)

---

## Final Pre-Launch Check

- [ ] All planning docs created
- [ ] Branch created (`refactor-entity-model-relationship`)
- [ ] Current code compiles and runs
- [ ] TODO list loaded (10 items)
- [ ] Coffee/tea ready ☕
- [ ] Ready to code? 👨‍💻

---

**Status: 🚀 READY TO LAUNCH**

**Estimated Time:** 8-12 hours
**Risk Level:** MEDIUM (well-planned, reversible)
**Expected Outcome:** Cleaner, faster, more maintainable codebase

**Next Step:** Create `src/sprites/` folder and start Phase 1!

---

*Last Updated: 2025-11-05*
*Good luck! 🎣*
