# Wolfpack Game - Codebase Architecture & Test Coverage Map

## Project Structure Overview

```
wolfpack/
├── src/
│   ├── config/                      [TESTABLE: Pure Data]
│   │   ├── GameConfig.js            (145 lines)  ⭐⭐ [Test: 1h]
│   │   └── SpeciesData.js           (300+ lines) ⭐⭐⭐ [Test: 2-3h]
│   │
│   ├── utils/                       [TESTABLE: Pure Functions]
│   │   ├── Constants.js             (75 lines)   ⭐ [Already tested]
│   │   ├── GamepadManager.js        (180+ lines) ⭐⭐ [Requires browser]
│   │   └── SonarDisplay.js          (150+ lines) ⭐⭐ [UI-dependent]
│   │
│   ├── models/                      [HIGHLY TESTABLE: Core Logic]
│   │   ├── FishingLineModel.js      (156 lines)  ⭐⭐⭐ [Test: 1-2h] ✓
│   │   ├── ReelModel.js             (219 lines)  ⭐⭐⭐ [Test: 2-3h] ✓
│   │   ├── AquaticOrganism.js       (125 lines)  ⭐⭐⭐ [Test: 2-3h] ✓
│   │   ├── fish.js                  (150+ lines) ⭐⭐ [Test: 3-4h]
│   │   ├── baitfish.js              (100+ lines) ⭐⭐ [Test: 2-3h]
│   │   ├── crayfish.js              (80+ lines)  ⭐⭐ 
│   │   ├── zooplankton.js           (60+ lines)  ⭐⭐
│   │   └── species/
│   │       ├── LakeTrout.js
│   │       ├── NorthernPike.js
│   │       ├── SmallmouthBass.js
│   │       └── YellowPerch.js
│   │
│   ├── managers/                    [PARTIALLY TESTABLE]
│   │   └── IceHoleManager.js        (392 lines)  ⭐⭐⭐ [Test: 3-4h] ✓
│   │
│   ├── entities/                    [PHASER-DEPENDENT: Harder to test]
│   │   ├── Fish.js                  (150+ lines)
│   │   ├── Baitfish.js              
│   │   ├── Lure.js
│   │   ├── FishingLine.js
│   │   ├── FishAI.js                (Heavy AI logic)
│   │   ├── FishFight.js             (Combat mechanics)
│   │   ├── Crayfish.js
│   │   ├── Zooplankton.js
│   │   └── BaitfishCloud.js
│   │
│   ├── scenes/                      [PHASER-DEPENDENT: Game Loop]
│   │   ├── BootScene.js
│   │   ├── MenuScene.js
│   │   ├── GameScene.js             (Main game loop)
│   │   ├── NatureSimulationScene.js
│   │   ├── UIScene.js
│   │   ├── GameOverScene.js
│   │   └── systems/
│   │       ├── SpawningSystem.js    ⭐⭐ [Spawning tested indirectly]
│   │       ├── CollisionSystem.js   ⭐⭐ [Test: 2-3h]
│   │       ├── InputSystem.js       ⭐⭐ [UI-dependent]
│   │       ├── NotificationSystem.js ⭐⭐ [Test: 1-2h]
│   │       ├── ScoreSystem.js       ⭐⭐ [Test: 3-4h] ✓
│   │       └── DebugSystem.js       ⭐ [Debug only]
│   │
│   └── index.js                     (Game initialization)
│
├── __tests__/
│   ├── config-validation.test.js    (100 tests) ✓
│   ├── spawning-logic.test.js       (148 tests) ✓
│   ├── file-integrity.test.js       (95 tests) ✓
│   └── [EXPANSION OPPORTUNITY]
│       ├── models/
│       ├── managers/
│       └── config/
│
├── __mocks__/
│   └── phaser.js                    ✓ [Mock setup complete]
│
└── jest.config.js                   ✓ [Config ready]
```

## Dependency Analysis & Testability

### Level 1: No Phaser Dependencies (EASIEST TO TEST)

```
GameConfig.js
Constants.js ─────────┐
                      │
SpeciesData.js ───────┼───────► FishingLineModel.js ──┐
                      │            │                  │
                      │            │                  └─► TEST NOW!
                      └───────────►ReelModel.js      │
                                   │                 │
                                   └─────────────────┘
```

**Status**: These have NO dependencies on Phaser or scene objects
**Test Difficulty**: EASY (1-3 hours each)
**Coverage Gain**: ~520 lines

---

### Level 2: Minimal Phaser Dependencies (MODERATE TO TEST)

```
AquaticOrganism.js ───────┬──────► GameConfig.js
    │                     │
    └── Fish.js ──────────┼──────► Constants.js
    │                     │
    └── Baitfish.js ──────┼──────► SpeciesData.js
    │                     │
    └── Crayfish.js ──────┘        FishingLineModel.js
                                   ReelModel.js

└─ Requires: GameConfig, Constants, SpeciesData (all mockable)
└─ Can be tested with minimal scene mock
```

**Status**: Scene-dependent but logic is isolated
**Test Difficulty**: MEDIUM (2-4 hours each)
**Mock Requirements**: Minimal scene object
**Coverage Gain**: ~375 lines

---

### Level 3: Manager Classes (MODERATE TO TEST)

```
IceHoleManager.js ────────────────► GameConfig.js
    │                               Constants.js
    ├─ generateLakeBedProfile()     (Pure math)
    ├─ getDepthAtPosition()
    ├─ canDrillHole()
    ├─ findNearestHole()
    └─ movePlayer()
    
└─ Requires: Scene (mocks: graphics, time, notifications)
└─ Core logic can be tested independently
```

**Status**: Requires scene mock but logic is compartmentalized
**Test Difficulty**: MEDIUM (3-4 hours)
**Core Logic Testable**: 200+ lines
**Rendering Code**: Skip this
**Coverage Gain**: 200+ lines

---

### Level 4: Game Systems (HARDER TO TEST)

```
ScoreSystem.js ───────────► GameConfig.js
    │
    └─ Requires: scene.time, scene.events (both mockable)
    └─ Logic is testable

CollisionSystem.js
NotificationSystem.js
DebugSystem.js

└─ These have good isolation potential
└─ Test Difficulty: MEDIUM (2-4 hours each)
└─ Total Coverage Gain: ~200 lines
```

---

### Level 5: Entity Classes (HARDEST TO TEST)

```
Fish.js ───────────────────────────► FishAI.js
    │                                   │
    ├── Requires:                       ├─ AI Decision logic
    │   - Scene.physics                 ├─ State machines
    │   - Phaser graphics               └─ Behavior trees
    │   - FishingLine entity
    │
    └─ Heavy Phaser dependency
    └─ Would need full scene mock
    └─ Test Difficulty: HARD (4+ hours each)

Lure.js
FishingLine.js
FishFight.js
BaitfishCloud.js

└─ All require full Phaser physics
└─ Best tested through integration tests
```

---

### Level 6: Scenes (REQUIRES FULL PHASER)

```
GameScene.js ──────────┬──────────► SpawningSystem
                       ├──────────► CollisionSystem
                       ├──────────► InputSystem
                       ├──────────► NotificationSystem
                       ├──────────► ScoreSystem
                       ├──────────► DebugSystem
                       └──────────► IceHoleManager

MenuScene.js
BootScene.js
NatureSimulationScene.js
UIScene.js
GameOverScene.js

└─ Require: Full Phaser lifecycle
└─ Test Difficulty: VERY HARD
└─ Recommended: Integration tests only
└─ Better approach: Test systems independently
```

---

## Test Priority Matrix

```
IMPACT
  ^
  │ [HIGH PRIORITY]        [CRITICAL PRIORITY]
  │ CollisionSystem        ✓ FishingLineModel
  │ NotificationSystem     ✓ ReelModel
  │ Fish.js                ✓ IceHoleManager
  │ ScoreSystem            ✓ SpeciesData
  │                        ✓ AquaticOrganism
  │                    
  │ [MEDIUM PRIORITY]      [LOW PRIORITY]
  │ Baitfish               Fish.js (entity)
  │ Crayfish               FishAI.js
  │ Zooplankton            Lure.js
  │                        Scene classes
  │
  └────────────────────────────────────────────> EFFORT
    LOW                                      HIGH
```

---

## Quick Test Implementation Guide

### TIER 1 (Start Here - 12-16 hours for ~1,020 lines)

#### 1. FishingLineModel.test.js
```javascript
// NO IMPORTS NEEDED EXCEPT:
import { FishingLineModel, LINE_TYPES, BRAID_COLORS } from '../src/models/FishingLineModel.js';

// Tests: ~50 lines
// Time: 1-2 hours
// Coverage: 156 lines
```
**Why First**: Pure class, no Phaser, high gameplay impact

#### 2. ReelModel.test.js
```javascript
import { ReelModel, REEL_TYPES } from '../src/models/ReelModel.js';

// Tests: ~60 lines
// Time: 2-3 hours
// Coverage: 219 lines
```
**Why Second**: Complex state, no Phaser, critical mechanics

#### 3. GameConfig.test.js
```javascript
import GameConfig from '../src/config/GameConfig.js';

// Tests: ~30 lines
// Time: 1 hour
// Coverage: 145 lines
```
**Why Third**: Validates all config values, pure checks

#### 4. SpeciesData.test.js
```javascript
import { getPredatorSpecies, getBaitfishSpecies } from '../src/config/SpeciesData.js';

// Tests: ~40 lines
// Time: 2-3 hours
// Coverage: 300+ lines
```
**Why Fourth**: Large but straightforward data validation

#### 5. IceHoleManager.test.js
```javascript
import { IceHoleManager } from '../src/managers/IceHoleManager.js';

// Requires mock scene (provided in test)
// Tests: ~80 lines
// Time: 3-4 hours
// Coverage: 200+ lines
```
**Why Fifth**: Requires mocking but logic is core gameplay

---

### TIER 2 (Next - 12-16 hours for ~625 lines)

#### 6. AquaticOrganism.test.js (2-3 hours, 125 lines)
#### 7. ScoreSystem.test.js (3-4 hours, 80+ lines)
#### 8. Fish.test.js (3-4 hours, 150+ lines)
#### 9. Baitfish.test.js (2-3 hours, 100+ lines)

---

### TIER 3 (Later - 8-10 hours for ~200+ lines)

#### 10. CollisionSystem.test.js
#### 11. NotificationSystem.test.js
#### 12. Crayfish.test.js
#### 13. Zooplankton.test.js

---

## Test Metrics Summary

| Category | Files | Lines | Effort | Status |
|----------|-------|-------|--------|--------|
| **Current Tests** | 3 | 367 | - | ✓ Complete |
| **Tier 1 Opportunity** | 5 | 1,020 | 12-16h | Next |
| **Tier 2 Opportunity** | 4 | 625 | 12-16h | Later |
| **Tier 3 Opportunity** | 4+ | 200+ | 8-10h | Optional |
| **Total Opportunity** | 17+ | 2,312+ | 32-42h | 15%+ coverage |

---

## Implementation Checklist

### Before You Start
- [ ] Read this file completely
- [ ] Review existing tests in `__tests__/config-validation.test.js`
- [ ] Check Jest is configured properly
- [ ] Understand the mock pattern from `spawning-logic.test.js`

### Create Tier 1 Tests
- [ ] Create `__tests__/models/FishingLineModel.test.js`
- [ ] Create `__tests__/models/ReelModel.test.js`
- [ ] Create `__tests__/config/GameConfig.test.js`
- [ ] Create `__tests__/config/SpeciesData.test.js`
- [ ] Create `__tests__/managers/IceHoleManager.test.js`

### Verify & Expand
- [ ] Run: `npm test` (all tests pass)
- [ ] Run: `npm run test:coverage`
- [ ] Verify coverage increased from 2.4% to ~6%
- [ ] Plan Tier 2 if time permits

---

## Key Takeaways

1. **Start with models** - They're self-contained and high-impact
2. **Use existing patterns** - Your codebase already has good patterns
3. **Mock minimally** - Only mock what's absolutely necessary
4. **Test independently** - Focus on logic, not Phaser integration
5. **Iterate quickly** - 1 test file per day is achievable

**Timeline**: 10% coverage in 2-3 weeks with ~1-2 hours/day
**Difficulty**: LOW (mostly copy-paste patterns from existing tests)
**Payoff**: HIGH (catches bugs, enables refactoring, documents code)
