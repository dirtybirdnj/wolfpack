# Entity/Model Refactor - Architecture Redesign

**Branch:** `refactor-entity-model-relationship`
**Date Started:** 2025-11-05
**Status:** Planning Complete - Ready for Implementation

---

## Problem Statement

The codebase has **three parallel fish systems** with confused entity/model separation:

1. **Legacy Entity System** - `entities/Fish.js` + `entities/Baitfish.js` (manual graphics)
2. **Legacy Model System** - `models/fish.js` + `models/baitfish.js` (game logic with render methods)
3. **New Sprite System** - `models/FishSprite.js` + `models/BaitfishSprite.js` (Phaser Sprites)

**Current Issues:**
- ~2,300 lines of duplicate code across parallel systems
- "Models" folder contains Sprites (backwards naming)
- Baitfish stored in TWO places: `baitfishSchools[]` AND `schools[].members[]`
- Entity/Model circular dependencies
- Not using Phaser Groups, pooling, or physics
- Scattered update logic (baitfish update spans 300+ lines)
- Type confusion between Fish, FishSprite, BaitfishSprite

---

## Goals

1. **Remove Entity/Model Duplication** - Single source of truth
2. **Unify ALL fish as one entity type** - Baitfish and predators use same class with different attributes
3. **Allow ALL fish to school** - Different schooling behaviors per species (tight bait balls vs loose predator packs)
4. **Use Phaser best practices** - Groups, Sprites, automatic rendering
5. **Clear terminology** - `fish.type` = `'bait'` or `'predator'`

---

## Proposed Architecture

```
src/
├── sprites/                    (RENAMED from models/)
│   └── FishSprite.js          (UNIFIED - all fish types)
│
├── components/                 (Behavior composition)
│   ├── SchoolingBehavior.js   (Boids - for ANY fish)
│   ├── HuntingBehavior.js     (AI states - predators only)
│   └── BiologySystem.js       (Hunger/health - predators only)
│
├── systems/
│   ├── SchoolManager.js       (Manages emergent schools)
│   ├── SpawningSystem.js      (Spawns FishSprite)
│   └── EcosystemManager.js    (Food web)
│
└── config/
    └── SpeciesData.js         (ALL fish specs)
```

---

## Key Design Decisions

### 1. Single Fish Class with Composition

**One class for everything:**
```javascript
export class FishSprite extends Phaser.GameObjects.Sprite {
    constructor(scene, worldX, y, species) {
        const speciesData = getSpeciesData(species);

        this.type = speciesData.type; // 'bait' or 'predator'

        // Behavior composition based on species config
        if (speciesData.schooling?.enabled) {
            this.schooling = new SchoolingBehavior(this, speciesData.schooling);
        }

        if (speciesData.hunting?.enabled) {
            this.hunting = new HuntingBehavior(this, speciesData.hunting);
            this.biology = new BiologySystem(this, speciesData.biology);
        }
    }
}
```

### 2. Species Data Drives Behavior

**All fish attributes in config:**
```javascript
// config/SpeciesData.js
export const SPECIES = {
    alewife: {
        type: 'bait',
        size: { min: 3, max: 6 },
        speed: { base: 1.5, panic: 3.0 },
        schooling: {
            enabled: true,
            separationRadius: 15,    // TIGHT bait ball
            alignmentRadius: 40,
            cohesionRadius: 60,
            maxSchoolSize: 100,
            weights: { separation: 1.5, alignment: 1.0, cohesion: 1.0 }
        }
    },

    yellow_perch: {
        type: 'predator',
        size: { min: 6, max: 12 },
        speed: { base: 1.2, chase: 2.5 },
        schooling: {
            enabled: true,
            separationRadius: 40,    // LOOSE cruising pack
            alignmentRadius: 80,
            cohesionRadius: 100,
            maxSchoolSize: 30,
            weights: { separation: 1.0, alignment: 0.8, cohesion: 0.6 }
        },
        hunting: { enabled: true, visionRange: 120, targetTypes: ['bait'] },
        biology: { hunger: true, hungerRate: 0.05, health: true }
    },

    smallmouth_bass: {
        type: 'predator',
        schooling: {
            enabled: true,
            separationRadius: 60,    // VERY loose (small groups)
            maxSchoolSize: 5
        },
        hunting: { enabled: true, targetTypes: ['bait', 'predator'] }
    },

    lake_trout: {
        type: 'predator',
        schooling: { enabled: false },  // SOLITARY
        hunting: { enabled: true, deepWaterHunter: true }
    }
};
```

### 3. Emergent School Formation

**Fish spawn individually, schools form naturally:**

1. Fish spawn scattered in area
2. SchoolManager periodically scans for nearby same-species fish
3. Groups of 3+ fish within `searchRadius` form a school
4. Boids forces applied to school members
5. Schools disband if too fragmented

**Benefits:**
- More realistic/dynamic
- No manual school creation/tracking
- Fish can leave/join schools naturally
- Works for both tight bait balls and loose predator packs

### 4. School Behavior Differences

| Species | Type | School Size | Separation | Cohesion | Behavior |
|---------|------|-------------|------------|----------|----------|
| Alewife | bait | 50-100 | 15px (tight) | Strong | Tight bait ball, panic together |
| Perch | predator | 20-30 | 40px (loose) | Medium | Coordinated cruising |
| Bass | predator | 3-5 | 60px (very loose) | Weak | Small groups, ambush |
| Lake Trout | predator | 1 | N/A | N/A | Solitary hunter |

---

## Current State Analysis

### What GameScene Currently Has

**Collections:**
- `this.fishes[]` - Array of **FishSprite** (predators only)
- `this.fishGroup` - Phaser.Group (not actively used yet)
- `this.baitfishSchools[]` - Array of **BaitfishSprite**
- `this.schools[]` - Array of plain objects with `{id, species, members[], center, velocity}`

**Problems:**
- Baitfish stored in TWO places (schools[] and baitfishSchools[])
- Update logic scattered across 300+ lines
- Manual array filtering every frame
- No object pooling
- Type confusion (comments say "Fish" but contains "BaitfishSprite")

### Files to DELETE After Refactor

**Legacy Entity Layer (~1,300 lines):**
- `/src/entities/Fish.js` (1010 lines)
- `/src/entities/Baitfish.js` (120 lines)
- `/src/entities/BaitfishCloud.js` (170 lines)

**Legacy Model Layer (~1,000 lines):**
- `/src/models/fish.js` (593 lines)
- `/src/models/baitfish.js` (604 lines)
- `/src/models/AquaticOrganism.js` (base class - may keep simplified version)

**Species render methods:**
- `/src/models/species/LakeTrout.js` - remove renderBody()
- `/src/models/species/NorthernPike.js` - remove renderBody()
- `/src/models/species/SmallmouthBass.js` - remove renderBody()
- `/src/models/species/YellowPerch.js` - remove renderBody()

**Total deletion:** ~2,300 lines

### Files to MERGE

- `/src/models/FishSprite.js` + `/src/models/BaitfishSprite.js` → `/src/sprites/FishSprite.js`

---

## Implementation Plan

### Phase 1: Foundation (DO THIS FIRST)

**Goal:** Set up new structure without breaking existing game

1. **Create folder structure:**
   ```
   mkdir src/sprites
   mkdir src/components
   ```

2. **Create SpeciesData.js:**
   - Move all species configs from existing files
   - Add `type: 'bait'|'predator'` to each
   - Add schooling parameters (separation, cohesion, etc.)
   - Keep existing values for now

3. **Create SchoolingBehavior component:**
   - Extract Boids algorithm from entities/Fish.js
   - Make it generic (work for any fish)
   - Take species config in constructor
   - Provide `applyForces()` method

4. **Create unified FishSprite:**
   - Copy from models/FishSprite.js as base
   - Add schooling component composition
   - Add `type` property
   - Keep both predator and bait logic (merged)
   - Move to sprites/ folder

### Phase 2: School Manager

**Goal:** Implement emergent school formation

1. **Create SchoolManager system:**
   - `detectNewSchools()` - find clusters of nearby same-species fish
   - `updateSchools()` - apply Boids to members
   - `cleanupSchools()` - remove empty schools, check fragmentation

2. **Integrate with GameScene:**
   - Create `this.schoolManager = new SchoolManager(this)`
   - Call `schoolManager.update(allFish)` in update loop
   - Remove old school array management code

### Phase 3: Spawning System Updates

**Goal:** Spawn unified FishSprite for all types

1. **Update SpawningSystem:**
   - Remove separate `spawnFish()` and `spawnBaitfish()` methods
   - Create single `spawn(species, x, y)` method
   - Use SpeciesData to determine behavior
   - Let SchoolManager handle school formation

2. **Test spawning:**
   - Spawn alewife - should form tight schools
   - Spawn perch - should form loose schools
   - Spawn lake trout - should stay solitary
   - Verify schools form/disband naturally

### Phase 4: GameScene Cleanup

**Goal:** Simplify entity management

1. **Consolidate collections:**
   - Keep `this.fishes[]` - ALL fish (rename to `this.allFish[]`?)
   - Remove `this.baitfishSchools[]` (duplicate)
   - Schools tracked by SchoolManager

2. **Simplify update loop:**
   - Single loop over all fish
   - FishSprite.preUpdate() handles individual behavior
   - SchoolManager.update() handles schooling
   - Remove 300+ lines of scattered logic

3. **Remove adapter layer:**
   - Delete `getAdaptedSchoolsForAI()`
   - Update FishAI to work with SchoolManager directly

### Phase 5: Delete Legacy Code

**Goal:** Remove all duplicate/unused files

1. **Delete entity files:**
   - entities/Fish.js
   - entities/Baitfish.js
   - entities/BaitfishCloud.js

2. **Delete model files:**
   - models/fish.js
   - models/baitfish.js
   - models/FishSprite.js (merged into sprites/)
   - models/BaitfishSprite.js (merged into sprites/)

3. **Clean up species files:**
   - Remove render methods
   - Keep only data/config
   - Consider moving to SpeciesData.js

4. **Update imports:**
   - Find all references to deleted files
   - Update to use new FishSprite
   - Test thoroughly

### Phase 6: Phaser Best Practices

**Goal:** Use Phaser Groups and pooling

1. **Replace arrays with Groups:**
   ```javascript
   this.fishGroup = this.add.group({
       classType: FishSprite,
       maxSize: 200,
       runChildUpdate: true
   });
   ```

2. **Implement pooling:**
   ```javascript
   const fish = this.fishGroup.get(worldX, y, species);
   if (!fish) return null; // Pool exhausted
   fish.reset(worldX, y, species);
   ```

3. **Use Containers for schools:**
   - Optional optimization
   - Move entire school by moving container

---

## Testing Checklist

After each phase, verify:

- [ ] Alewife spawn and form tight bait balls
- [ ] Yellow perch spawn and cruise in loose packs
- [ ] Smallmouth bass form small groups (2-5)
- [ ] Lake trout remain solitary
- [ ] Schools form naturally from scattered fish
- [ ] Schools disband when fragmented
- [ ] Predators can hunt and consume bait fish
- [ ] Fish can be caught and fought
- [ ] Performance is good (60fps with 100+ fish)
- [ ] No console errors
- [ ] Fish render correctly

---

## Performance Considerations

**Current Issues:**
- Manual graphics rendering every frame
- Array filtering every frame (4 separate loops for baitfish)
- School adapter creates objects every frame
- No object pooling

**Expected Improvements:**
- Sprite rendering (GPU accelerated)
- Single update loop per fish type
- Phaser Groups (automatic pooling)
- Reduced CPU usage from consolidation

**Benchmarks to Track:**
- Frame rate with 50 fish
- Frame rate with 200 fish
- Update loop time (ms)
- Render time (ms)

---

## Open Questions

1. **Should yellow perch eat smaller perch?** (cannibalism)
   - Current thinking: No, only different species

2. **Should school size affect spawning rate?**
   - Large bait schools attract more predators?

3. **Should schools split when too large?**
   - Natural behavior but adds complexity

4. **Mixed-species schools in future?**
   - Alewife + smelt together?
   - Not for initial implementation

---

## References

**Key Files:**
- Current GameScene: `/src/scenes/GameScene.js`
- Current FishSprite: `/src/models/FishSprite.js`
- Current BaitfishSprite: `/src/models/BaitfishSprite.js`
- Current Boids (in Fish.js): lines 620-847
- Current SpawningSystem: `/src/scenes/systems/SpawningSystem.js`
- Current FishAI: `/src/entities/FishAI.js`

**Analysis Documents:**
- Initial exploration report (in conversation)
- GameScene deep dive (in conversation)
- Architecture comparison diagrams (in conversation)

---

## Token Optimization Strategy

**This file serves as:**
- State preservation across sessions
- Quick reference for implementation
- Checklist for completion
- Documentation for future developers

**To resume work:**
1. Read this file
2. Check current phase in Implementation Plan
3. Review Testing Checklist
4. Continue from last completed step

---

## Next Session TODO

1. Create `src/components/SchoolingBehavior.js`
2. Create `src/sprites/FishSprite.js` (unified)
3. Update SpeciesData.js with schooling params
4. Create SchoolManager.js skeleton
5. Test with alewife spawning

**Estimated Time:** 2-3 hours for Phase 1
**Estimated Total:** 8-12 hours for complete refactor

---

*Last Updated: 2025-11-05*
*Status: Ready to begin Phase 1*
