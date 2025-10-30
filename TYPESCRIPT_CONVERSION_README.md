# TypeScript Conversion - Test Coverage Analysis

This directory contains comprehensive analysis of test coverage gaps in the Wolfpack codebase that must be addressed before TypeScript conversion.

## Documents Included

### 1. **TYPESCRIPT_CONVERSION_TEST_GAPS.md** (PRIMARY REFERENCE)
   - Detailed analysis of all 8 critical untested files
   - Type safety risks breakdown
   - Integration points analysis
   - Estimated effort for each file (80-100 hours total)
   - Specific functions needing type validation

### 2. **TEST_CASES_FOR_CRITICAL_FILES.md** (PRACTICAL IMPLEMENTATION)
   - Concrete Jest test case examples
   - Ready-to-implement test suites for:
     - FishAI.js (state transitions, frenzy detection, aggressiveness)
     - FishFight.js (fight physics, line break detection, hook spit logic)
     - SonarDisplay.js (depth scaling, resize handling, coordinate transforms)
   - Integration test examples
   - How to run tests

---

## Quick Start

### For Developers
1. Read: `TYPESCRIPT_CONVERSION_TEST_GAPS.md` - Understand the landscape
2. Review: `TEST_CASES_FOR_CRITICAL_FILES.md` - See concrete examples
3. Start testing Phase 1 files (FishAI, FishFight, SonarDisplay)

### For Project Managers
1. Read: Quick Summary section below
2. Review: Effort estimates in `TYPESCRIPT_CONVERSION_TEST_GAPS.md`
3. Plan: 80-100 hours of test development across 3 phases

---

## CRITICAL FINDINGS SUMMARY

### Test Coverage Status
- **Total Files**: 39 JavaScript files
- **Currently Tested**: ~10 files (12 test suites)
- **Critical Gaps**: 8 files with >200 lines or high complexity
- **Coverage**: ~70% - needs 30% more for safe TypeScript conversion

### Top 3 MUST-TEST Files

#### 1. FishAI.js (909 lines) - CRITICAL
**Why**: Controls all fish behavior, imported by Fish model (used constantly)
- Complex state machine (7 states)
- Species-specific logic (Pike ambush, Bass circling)
- Frenzy detection with multi-fish interactions
- **Type Risks**: undefined fish.depthZone, lure properties, state strings
- **Effort**: 16-20 hours

#### 2. FishFight.js (1125 lines) - CRITICAL
**Why**: Core gameplay mechanic, physics simulations, win/loss conditions
- Fight state machine (4 states)
- Line break detection with physics
- Hook spit logic
- **Type Risks**: undefined reel/line models, division by zero, property access
- **Effort**: 14-18 hours

#### 3. SonarDisplay.js (567 lines) - CRITICAL
**Why**: Depth scaling used by ALL entities, coordinate system foundation
- Dynamic depth scale calculation called by many systems
- Canvas resize handling
- **Type Risks**: division by zero, null iceHoleManager, undefined scene.scale
- **Effort**: 8-10 hours

### All 8 Critical Files
1. FishAI.js - 909 lines - CRITICAL
2. FishFight.js - 1125 lines - CRITICAL
3. SonarDisplay.js - 567 lines - CRITICAL
4. BaitfishCloud.js - 462 lines - HIGH
5. Lure.js - 363 lines - HIGH
6. Crayfish.js - 391 lines - HIGH
7. GamepadManager.js - 266 lines - HIGH
8. models/zooplankton.js - 154 lines - MEDIUM

---

## TYPE SAFETY RISKS BY CATEGORY

### 1. Undefined Property Access (Most Common)
```
fish.depthZone, fish.health, fish.hunger, fish.weight
scene.iceHoleManager, scene.maxDepth, scene.scale
lure.x, lure.y, lure.depth
```

### 2. Array Operations
```
Arrays with null entries (Gamepad API)
Array items with missing properties (Fish, Baitfish)
Filter/map operations without type guards
```

### 3. Mathematical Operations
```
Division by zero (depth scale = height / maxDepth)
NaN propagation (Math.sqrt of negative values)
Unbounded accumulation (velocity, tension)
```

### 4. State Management
```
String comparisons for states (should be enums)
State machine without exhaustiveness checks
Property access varying by state
```

### 5. Browser API Integration
```
Gamepad API nullability
Event object properties
RAF cleanup tracking
```

---

## RECOMMENDED TESTING PLAN

### Phase 1: CRITICAL (80-100 hours)
1. **FishAI.js** - Complex AI state machine
   - 80-100 tests
   - 16-20 hours
   
2. **FishFight.js** - Fight physics mechanics
   - 60-80 tests
   - 14-18 hours
   
3. **SonarDisplay.js** - Coordinate system foundation
   - 40-50 tests
   - 8-10 hours

### Phase 2: HIGH (24-32 hours)
4. **GamepadManager.js** - Hardware integration
5. **BaitfishCloud.js** - Ecosystem behavior
6. **Lure.js** - Player interaction

### Phase 3: MEDIUM (19-24 hours)
7. **Crayfish.js** - Ecosystem component
8. **models/zooplankton.js** - Data model
9. **Baitfish.js** - Flocking behavior
10. **models/crayfish.js** - Model layer

---

## Critical Integration Points

These data flows must be tested end-to-end:

1. **Fish Detection → AI Update → Behavior Decision**
   - Fish.js → FishAI.js → GameScene
   - Risk: coordinate calculations, distance operations

2. **Fight Physics → Line Tension → Line Break**
   - FishFight.js → ReelModel → FishingLineModel
   - Risk: force calculations, strength comparisons

3. **Sonar Display → Depth Scaling → Entity Positioning**
   - SonarDisplay.js → All entities
   - Risk: coordinate transformations

4. **Gamepad Input → Input System → Scene Updates**
   - GamepadManager.js → InputSystem → GameScene
   - Risk: button indexing, state sync

5. **Ecosystem Spawning → Flocking → Predator Targeting**
   - BaitfishCloud.js → Baitfish.js → FishAI.js
   - Risk: array operations, distance calculations

---

## Getting Started

### Setup Test Environment
```bash
cd /home/user/wolfpack

# Check current test status
npm test -- --coverage

# Run specific test file
npm test -- FishAI.test.js

# Watch mode for development
npm test -- --watch
```

### Create First Test File
1. Copy `TEST_CASES_FOR_CRITICAL_FILES.md` section for FishAI
2. Create `__tests__/entities/FishAI.test.js`
3. Run `npm test` to see initial failures
4. Implement fixes in `src/entities/FishAI.js`
5. Verify all tests pass

### Estimate Your Timeline
- **Full Coverage (80-100 hours)**: ~3-4 weeks (if 1 dev, 20 hrs/week)
- **Core Coverage (40 hours)**: ~1 week (if 2 devs or 1 dev FT)
- **Phase 1 Only (40 hours)**: Critical for TypeScript, partial coverage

---

## Files Modified for This Analysis

All analysis documents created in `/home/user/wolfpack/`:
- `TYPESCRIPT_CONVERSION_TEST_GAPS.md` - Main detailed analysis (502 lines)
- `TEST_CASES_FOR_CRITICAL_FILES.md` - Practical examples with code
- `TYPESCRIPT_CONVERSION_README.md` - This file

Run conversion: `npm run build` after tests pass

---

## Questions?

Refer to:
- Specific file details: See `TYPESCRIPT_CONVERSION_TEST_GAPS.md`
- How to implement tests: See `TEST_CASES_FOR_CRITICAL_FILES.md`
- Effort estimation: See effort table in main analysis
- Type risks: See "TYPE SAFETY RISKS BY CATEGORY" in this file

