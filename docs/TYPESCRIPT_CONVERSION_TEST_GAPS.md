# Critical Test Coverage Gaps for TypeScript Conversion
## Wolfpack Fishing Game - Test Coverage Analysis

### Executive Summary

Analysis of 39 source files shows **8 critical files without tests** that handle high-complexity logic essential to game mechanics. These files must be tested before TypeScript conversion to prevent type-related runtime errors.

**Current Coverage:**
- Total files: 39 JavaScript files
- Files with tests: 12 test files covering ~10 core files
- **Critical gaps: 8 untested files with >200 lines or high complexity**

---

## TOP 10 PRIORITY FILES FOR TESTING

### 1. **FishAI.js** (909 lines)
**Priority: CRITICAL - Must be tested first**

**Why It's Critical:**
- Most complex behavioral system in game (909 lines)
- Imported by Fish model which is instantiated continuously during gameplay
- Implements state machine with 7 states (IDLE, INTERESTED, CHASING, STRIKING, FLEEING, HUNTING_BAITFISH, FEEDING)
- Contains species-specific logic (Northern Pike ambush, Smallmouth Bass circling, Lake Trout thermocline)
- Complex frenzy detection with distance calculations and multi-fish interaction
- Handles predator targeting, prey hunting, baitfish pursuit

**Current Test Status:** ❌ NO TESTS

**Type Safety Risks:**
- Undefined fish.depthZone when accessing aggressiveness bonus (line 70)
- Methods depend on lure object having x/y/depth properties
- State string comparisons (IDLE, INTERESTED, etc.) need validation
- Calculations with potentially undefined values (fish.x, fish.y, lure.y)
- Array operations on baitfishClouds parameter could fail with null/undefined

**Functions That Need Type Validation:**
- `detectFrenzy(lure, allFish)` - Complex multi-fish detection, calculations
- `update(lure, currentTime, allFish, baitfishClouds)` - Main update loop, state machine
- `aggressiveness` getter - Math operations on depthZone properties
- `calculateDepthPreference()` - GameConfig value ranges
- `getStrikeDistance()` - Returns numeric value, conditional logic

**Estimated Complexity: HIGH**
- 5+ method implementations
- Complex branching (>30 conditionals)
- Interdependency on multiple systems

---

### 2. **FishFight.js** (1125 lines)
**Priority: CRITICAL - Core game mechanic**

**Why It's Critical:**
- Largest single file in codebase (1125 lines)
- Implements fight physics with tension calculations
- Responsible for line break detection, hook spit, fish landing logic
- Complex state machine (hookset → fighting → thrashing → giving_up)
- Integrates with ReelModel and FishingLineModel
- Contains biological calculations (health factor, hunger factor, strength)
- Multiple numerical thresholds that affect gameplay difficulty

**Current Test Status:** ❌ NO TESTS

**Type Safety Risks:**
- Math operations on potentially undefined reelModel/fishingLine objects
- Complex conditional for line break calculation (line 96-114)
- Calculations assuming fish object has health/hunger/weight properties
- Array access assumptions (sizeCategory property might not exist)
- Division operations without guards (approximateForce, energyPercent)
- State string comparisons need validation

**Functions That Need Type Validation:**
- `update(currentTime, spacePressed)` - Main fight loop, line break detection
- `updateFightState()` - State machine transitions with energy thresholds
- `applyFishBehavior()` - Fish pulling mechanics
- `calculateHookSpitChance()` - Size category dependent logic
- `updateFishPosition()` - Movement calculations

**Estimated Complexity: VERY HIGH**
- 10+ method implementations
- Multiple state transitions
- Physics calculations with edge cases
- Integration with multiple model objects

---

### 3. **SonarDisplay.js** (567 lines)
**Priority: CRITICAL - Visual/data coordination**

**Why It's Critical:**
- Implements dynamic depth scaling used throughout the game
- `getDepthScale()` method (line 58-68) is called by multiple systems
- Handles canvas resize events and coordinate transformations
- Responsible for sonar visualization and grid rendering
- If depth scale calculation is wrong, ALL depth-based positioning breaks

**Current Test Status:** ❌ NO TESTS

**Type Safety Risks:**
- Assumption that scene.iceHoleManager exists (could be null in nature sim mode)
- getCurrentHole() could return null, accessing .depth without guard
- Division operation: waterColumnHeight / maxDepth could have edge cases
- scene.scale.width/height might be undefined
- Graphics object operations assume valid graphics context

**Functions That Need Type Validation:**
- `getDepthScale()` - Called by MANY files, critical coordinate conversion
- `getActualMaxDepth()` - Dependency on iceHoleManager, returns fallback to GameConfig
- `handleResize()` - Updates canvas dimensions
- `render()` - Graphics operations with coordinate calculations

**Estimated Complexity: MEDIUM-HIGH**
- 8+ methods
- Dependency on graphics context
- Coordinate system transformations
- Event handling and resizing

---

### 4. **GamepadManager.js** (266 lines)
**Priority: HIGH - Hardware integration**

**Why It's Critical:**
- Browser API integration point for gamepad input
- Singleton instance used globally
- Complex event listener management and memory leak risk
- State management with connectedGamepad reference updates
- RAF polling loop that must be properly cleaned up

**Current Test Status:** ❌ NO TESTS

**Type Safety Risks:**
- navigator.getGamepads() can return array with null slots
- gamepad.connected property might not exist on all browsers
- Event objects might not have expected properties
- Memory leak if RAF ID not properly tracked/cancelled
- Button/axis indexing assumes standard gamepad layout

**Functions That Need Type Validation:**
- `getButton(buttonName)` - String to index mapping, undefined check
- `getAxis(axisIndex)` - Array access with bounds checking
- `isConnected()` - Property access on potentially null gamepad
- `destroy()` - RAF cleanup verification

**Estimated Complexity: MEDIUM**
- Browser API dependency
- Event listener management
- State synchronization

---

### 5. **BaitfishCloud.js** (462 lines)
**Priority: HIGH - Complex behavior system**

**Why It's Critical:**
- Implements schooling/flocking behavior for baitfish clouds
- Complex update logic with multiple behavior modes (hunting, fleeing, schooling)
- Spawns Baitfish instances (composition pattern)
- Used by FishAI for baitfish hunting behavior
- Affects performance with multiple simultaneous clouds

**Current Test Status:** ❌ NO TESTS

**Type Safety Risks:**
- Array operations on baitfish list that could include consumed items
- lakers parameter is array that might contain fish without expected properties
- Method calls on baitfish assuming they have .visible, .consumed properties
- Distance calculations with undefined coordinates
- Velocity calculations that could produce NaN

**Functions That Need Type Validation:**
- `spawnBaitfish(count)` - Instance creation with species type
- `update(lakers, zooplankton)` - Complex parameter dependencies
- `checkForLakersNearby(lakers)` - Array iteration with type assumptions
- `findNearbyZooplankton(zooplankton)` - Filter and sort operations

**Estimated Complexity: HIGH**
- Complex behavioral tree
- Composition (owns Baitfish instances)
- Multiple simultaneous states

---

### 6. **Lure.js** (363 lines)
**Priority: HIGH - Core player interaction**

**Why It's Critical:**
- Central player interaction object
- Physics simulation for dropping/retrieving/jigging
- Used continuously during gameplay
- Speed and position calculations affect fish detection
- State management (SURFACE, DROPPING, RETRIEVING, IDLE)

**Current Test Status:** ❌ NO TESTS (but imported by GameScene)

**Type Safety Risks:**
- Velocity accumulation calculations could produce infinity/NaN
- Speed values must be bounded (LURE_MIN_RETRIEVE_SPEED, LURE_MAX_RETRIEVE_SPEED)
- Depth boundary calculations without proper guards
- State string comparisons

**Functions That Need Type Validation:**
- `update()` - Physics calculations, state transitions
- `setRetrieveSpeed(speed)` - Input validation
- `getState()` - Return type validation
- `calculateSonarStrength()` - Size-based calculation

**Estimated Complexity: MEDIUM-HIGH**
- Physics calculations
- State machine
- Boundary conditions

---

### 7. **Crayfish.js** (391 lines)
**Priority: MEDIUM - Ecosystem component**

**Why It's Critical:**
- Complex escape burst mechanics with fatigue system
- Hunts zooplankton with target persistence
- Affected by predator proximity (boolean state)
- Movement calculations that keep it on bottom
- Affects smallmouth bass feeding behavior

**Current Test Status:** ❌ NO TESTS

**Type Safety Risks:**
- Burst direction calculations assuming angle property exists
- Array operations on nearbyZooplankton with property access
- Math operations that could produce invalid angles
- Fatigue factor multiplications that affect cooldown timing
- Property access on consumed/visible states

**Functions That Need Type Validation:**
- `update(nearbyZooplankton, predatorsNearby)` - Main loop, property access
- `updateBurstMechanics()` - Trigonometric calculations, state machine
- `handleHuntingBehavior(nearbyZooplankton)` - Target selection, distance calcs
- `stayOnBottom()` - Boundary calculations

**Estimated Complexity: MEDIUM**
- Behavioral states
- Physics calculations
- Array filtering

---

### 8. **models/zooplankton.js** (154 lines)
**Priority: MEDIUM - Model abstraction**

**Why It's Critical:**
- Base food source for the entire ecosystem
- Consumed by Baitfish and Crayfish
- Simple model but consumed by multiple predators
- Part of data model layer

**Current Test Status:** ❌ NO TESTS

**Type Safety Risks:**
- consumed property might be accessed before initialization
- Visibility state must be boolean
- Size calculations with undefined base values
- Parent class method calls (AquaticOrganism)

**Functions That Need Type Validation:**
- `constructor()` - Property initialization
- `update()` - Lifecycle and consumption logic
- `consume()` - State marking
- Any inherited methods from AquaticOrganism

**Estimated Complexity: LOW-MEDIUM**
- Simple state management
- Basic lifecycle

---

### 9. **Baitfish.js** (entities/Baitfish.js - 119 lines, model/baitfish.js - 557 lines)
**Priority: MEDIUM - Consumed but has dual implementation**

**Why It's Critical:**
- Entity version (119 lines) vs Model version (557 lines) - potential confusion
- Complex flocking algorithm with boids implementation (3 rules: separation, cohesion, alignment)
- Hunting behavior with target persistence and competition
- Multiple velocity calculations that could produce NaN

**Current Test Status:** ⚠️ PARTIAL (fish.test.js exists but unclear if comprehensive)

**Type Safety Risks:**
- Math.sqrt operations on potentially negative values (dx/dy)
- Array iteration with property assumptions
- Distance calculations with undefined coordinates
- Velocity updates that affect angle calculations

**Estimated Complexity: MEDIUM-HIGH**
- Flocking algorithm
- Complex behavior selection
- Composition and inheritance

---

### 10. **models/crayfish.js** (391 lines)
**Priority: MEDIUM - Model consistency**

**Why It's Critical:**
- Part of ecosystem models
- Smallmouth bass primary food source
- Burst mechanics affect survival rates

**Current Test Status:** ❌ NO TESTS

---

## INTEGRATION POINTS REQUIRING TESTING

### Critical Data Flow:
1. **Fish Detection → FishAI Update → Behavior Decision**
   - Files involved: Fish.js → FishAI.js → GameScene
   - Type risks: lure coordinates, fish position, distance calculations

2. **Fight Physics → Line Tension → Line Break**
   - Files involved: FishFight.js → ReelModel → FishingLineModel
   - Type risks: force calculations, strength comparisons

3. **Sonar Display → Depth Scaling → Entity Positioning**
   - Files involved: SonarDisplay.js → All entities (Fish, Baitfish, Crayfish, Lure)
   - Type risks: coordinate transformations, boundary checks

4. **Gamepad Input → Input System → Scene Updates**
   - Files involved: GamepadManager.js → InputSystem → GameScene
   - Type risks: button indexing, state synchronization

5. **Baitfish Cloud Spawning → Boids Flocking → Predator Targeting**
   - Files involved: BaitfishCloud.js → Baitfish.js → FishAI.js
   - Type risks: array operations, distance calculations

---

## FUNCTIONS WITH HIGH TYPE COMPLEXITY

### Critical Multi-Parameter Functions:

| File | Function | Parameters | Complexity |
|------|----------|-----------|-----------|
| FishAI.js | `update()` | lure, currentTime, allFish[], baitfishClouds[] | VERY HIGH |
| FishAI.js | `detectFrenzy()` | lure, allFish[] | HIGH |
| FishFight.js | `update()` | currentTime, spacePressed | HIGH |
| BaitfishCloud.js | `update()` | lakers[], zooplankton[] | HIGH |
| Baitfish.js | `update()` | cloudCenter{}, lakersNearby, spreadMultiplier, scaredLevel, nearbyZooplankton[], otherBaitfish[] | VERY HIGH |
| SonarDisplay.js | `getDepthScale()` | none (depends on scene state) | HIGH |
| Crayfish.js | `update()` | nearbyZooplankton[], predatorsNearby | MEDIUM |

---

## RECOMMENDED TEST COVERAGE ORDER

**Phase 1 (CRITICAL - Must do first):**
1. FishAI.js - Complex AI, affects all fish behavior
2. FishFight.js - Core gameplay mechanic
3. SonarDisplay.js - Coordinate system foundation

**Phase 2 (HIGH - Do before conversion):**
4. GamepadManager.js - Hardware integration
5. BaitfishCloud.js - Ecosystem behavior
6. Lure.js - Player interaction

**Phase 3 (MEDIUM - Should do):**
7. Crayfish.js - Ecosystem component
8. models/zooplankton.js - Data model
9. Baitfish.js - Behavior verification
10. models/crayfish.js - Model layer

---

## TYPE SAFETY RISKS BY CATEGORY

### 1. **Undefined Property Access** (Most Common)
- Fish models accessed without null checks (fish.depthZone, fish.health)
- Scene objects (scene.iceHoleManager, scene.maxDepth)
- Lure object properties (lure.x, lure.y, lure.depth)

### 2. **Array Operations**
- Filter/map operations on arrays that might include null entries
- Distance calculations assuming array items have x/y properties
- Consumed item filtering without type guards

### 3. **Mathematical Operations**
- Division by zero (depth scale = waterColumnHeight / maxDepth)
- NaN propagation (Math.sqrt of potentially negative values)
- Unbounded accumulation (velocity, tension)

### 4. **State Management**
- String comparisons for states (should be enums in TS)
- State machine transitions without exhaustiveness checks
- Property access varying by state

### 5. **Browser API Integration**
- Gamepad API nullability (getGamepads() returns array with nulls)
- Event object property assumptions
- RAF cleanup without proper tracking

---

## ESTIMATED EFFORT

| File | Lines | Estimated Test Coverage | Effort |
|------|-------|------------------------|--------|
| FishAI.js | 909 | 80-100 tests | 16-20 hours |
| FishFight.js | 1125 | 60-80 tests | 14-18 hours |
| SonarDisplay.js | 567 | 40-50 tests | 8-10 hours |
| GamepadManager.js | 266 | 30-40 tests | 6-8 hours |
| BaitfishCloud.js | 462 | 40-50 tests | 8-10 hours |
| Lure.js | 363 | 35-45 tests | 7-9 hours |
| Crayfish.js | 391 | 30-40 tests | 6-8 hours |
| models/zooplankton.js | 154 | 15-20 tests | 3-4 hours |
| Baitfish.js | 557 | 40-50 tests | 8-10 hours |
| models/crayfish.js | 391 | 25-30 tests | 5-6 hours |

**Total Estimated Effort: 80-100 hours**

---

## WHAT TO TEST IN EACH FILE

### FishAI.js
- [ ] State transitions with different conditions
- [ ] Distance calculations and detection ranges
- [ ] Frenzy detection with multiple fish
- [ ] Species-specific behaviors (Pike ambush, Bass circling)
- [ ] Depth preference and aggressiveness calculations
- [ ] Baitfish hunting vs lure targeting priority
- [ ] Speed preference calculations
- [ ] Depth zone determination

### FishFight.js
- [ ] Line tension calculations and decay
- [ ] State machine transitions (hookset→fighting→thrashing→giving_up)
- [ ] Line break calculations with different line types
- [ ] Hook spit probability based on fish size/energy
- [ ] Fish position updates during fight
- [ ] Reel tracking and cooldown
- [ ] Thrashing state triggers and duration
- [ ] Line capacity checks

### SonarDisplay.js
- [ ] Depth scale calculation accuracy
- [ ] Responsive behavior on canvas resize
- [ ] Correct max depth from iceHoleManager
- [ ] Fallback when iceHoleManager not available
- [ ] Noise particle initialization
- [ ] Bottom profile generation

### GamepadManager.js
- [ ] Gamepad connection/disconnection events
- [ ] Button state tracking
- [ ] Axis value reading
- [ ] Listener management (on/off)
- [ ] RAF polling cleanup
- [ ] Multiple gamepad scenarios

### BaitfishCloud.js
- [ ] Baitfish spawning with species variation
- [ ] School cohesion calculations
- [ ] Panic mode triggering
- [ ] Zooplankton hunting behavior
- [ ] Laker detection and flee response
- [ ] Spread multiplier effects
- [ ] Consumption tracking

### Lure.js
- [ ] Drop speed accumulation (not exceeding max)
- [ ] Retrieve speed clamping
- [ ] State transitions
- [ ] Jig activation and patterns
- [ ] Depth boundary enforcement

### Crayfish.js
- [ ] Burst initiation and direction
- [ ] Fatigue factor accumulation and recovery
- [ ] Burst cooldown increasing with fatigue
- [ ] Bottom-staying behavior
- [ ] Zooplankton hunting target selection
- [ ] Roaming behavior with direction changes

### models/zooplankton.js
- [ ] Creation and initialization
- [ ] Consumption state management
- [ ] Lifecycle/despawn
- [ ] Size calculations

### Baitfish.js (Models)
- [ ] Flocking rules (separation, cohesion, alignment)
- [ ] Target switching with lock duration
- [ ] Panic multiplier effects
- [ ] Hunting vs schooling behavior
- [ ] Zooplankton consumption

### models/crayfish.js
- [ ] Burst state machine
- [ ] Fatigue system
- [ ] Target persistence
- [ ] Bottom constraint

