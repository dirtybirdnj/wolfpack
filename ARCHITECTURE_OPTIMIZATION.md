# Wolfpack Game - AI Agent Architecture Optimization Analysis

## Executive Summary

The Wolfpack fishing simulator has **good foundations** for AI-agent friendly architecture but would benefit from **strategic decoupling** to enable:
- Testing complex game logic without Phaser initialization
- Running pure AI/logic computations independent of rendering
- Exposing game state via APIs without UI initialization
- Lazy-loading heavy Phaser dependencies

**Total Codebase**: ~11,238 LOC across 48 modules
**Key Bottleneck**: GameScene (1,608 LOC) orchestrates everything
**Dependencies**: Heavy reliance on Phaser scene.add.*, scene.time.*, scene.physics.* across entities

---

## 1. DECOUPLING OPPORTUNITIES: Game Logic from Rendering

### 1.1 **CRITICAL: GameScene Orchestration** 
**File**: `/home/user/wolfpack/src/scenes/GameScene.js` (1,608 LOC)

**Current Issue**: GameScene mixes:
- Pure game logic (fish spawning, collision, scoring)
- Phaser scene integration (graphics, physics, timing)
- Systems management

**Opportunity**: Extract a `GameEngine` class

```javascript
// BEFORE: GameScene directly manages everything
export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }
  create() {
    this.spawningSystem = new SpawningSystem(this); // Tightly coupled
    this.inputSystem = new InputSystem(this);
  }
}

// AFTER: Decouple engine from Phaser
export class GameEngine {
  constructor(config = {}) {
    this.spawningSystem = new SpawningSystem(config);
    this.collisionSystem = new CollisionSystem(config);
    // No Phaser dependency!
  }
  update(delta) { /* pure logic */ }
}

export class GameScene extends Phaser.Scene {
  create() {
    this.engine = new GameEngine(GameConfig);
    // Only handles rendering after logic
  }
}
```

**Benefits for AI**:
- Test fish AI decisions without Phaser: `const engine = new GameEngine(); engine.spawnFish()`
- Run server-side predictions: Run game state forward N frames
- Deterministic simulation: Seed RNG, replay events

---

### 1.2 **HIGH PRIORITY: Entity Models Already Partially Decoupled**
**Files**: 
- `/home/user/wolfpack/src/models/fish.js` (349 LOC) - **Pure logic, good!**
- `/home/user/wolfpack/src/entities/Fish.js` (rendering layer)
- `/home/user/wolfpack/src/entities/FishAI.js` (909 LOC) - **Mostly logic, minimal Phaser deps**

**Current State**: Fish class composition is good:
```javascript
// models/fish.js - Pure logic, can be tested in Node.js
export class Fish extends AquaticOrganism {
  constructor(scene, x, y, size, fishingType, species) {
    this.weight = Utils.randomBetween(...);
    this.ai = new FishAI(this, fishingType); // Delegation!
  }
  update() { /* state updates */ }
}

// entities/Fish.js - Only rendering
export class Fish {
  constructor(scene, x, y, ...) {
    this.model = this.createModel(...); // Get pure logic model
    this.graphics = scene.add.graphics(); // Only Phaser stuff here
  }
}
```

**Opportunity**: Make model layer 100% Phaser-free

**Action Items**:
1. Remove `this.scene` dependency from `fish.js` model - pass necessary functions
2. Create `FishAILogic` class that doesn't touch scene
3. Make `FishFight` logic testable without graphics

**Current Dependencies to Remove**:
- `this.scene.iceHoleManager` → inject into constructor
- `this.scene.maxDepth` → pass as parameter
- Graphics rendering → move entirely to entity layer

---

### 1.3 **MEDIUM: Heavy Rendering Files Should Be Optional**
**Large Files**:
- `NotificationSystem` (1,013 LOC) - Handles UI overlays
- `SonarDisplay` (567 LOC) - Sonar rendering
- `IceHoleManager` (391 LOC) - Ice graphics + logic mixed

**Opportunity**: Extract rendering from logic

```javascript
// BEFORE: IceHoleManager mixes logic and rendering
generateLakeBedProfile() { /* logic */ }
draw() { /* graphics */ }

// AFTER: Separate concerns
export class LakeBedProfile {
  generateProfile() { /* pure math */ }
  getDepthAt(x) { /* lookup */ }
}

export class IceHoleRenderer {
  constructor(scene) { this.scene = scene; }
  drawHoles(profile) { /* only rendering */ }
}
```

---

## 2. LAZY-LOADING OPPORTUNITIES

### 2.1 **Move Heavy Systems to Lazy Loading**
**Files**:
- `/home/user/wolfpack/src/scenes/systems/NotificationSystem.js` (1,013 LOC)
- `/home/user/wolfpack/src/utils/SonarDisplay.js` (567 LOC)

**Current Issue**: All systems initialized in GameScene.create() even if not needed

**Opportunity**: 
```javascript
// GameScene.create()
this.systems = {
  notification: null, // Lazy-load
  sonar: null,
  spawning: new SpawningSystem(this), // Always needed
};

// Later, when UI needed:
getNotificationSystem() {
  if (!this.systems.notification) {
    this.systems.notification = new NotificationSystem(this);
  }
  return this.systems.notification;
}
```

**Benefit**: Pure AI testing doesn't load NotificationSystem (1000+ LOC saved)

---

### 2.2 **Configuration as Pure Data**
**Files** (These are good!):
- `/home/user/wolfpack/src/config/GameConfig.js` ✓
- `/home/user/wolfpack/src/config/SpeciesData.js` ✓
- `/home/user/wolfpack/src/models/ReelModel.js` ✓
- `/home/user/wolfpack/src/models/FishingLineModel.js` ✓

**Status**: These are **already pure logic** - great for AI!

**Opportunity**: Expose as REST API
```javascript
// New: src/api/ConfigEndpoints.js
export function getGameConfig(req, res) {
  res.json(GameConfig); // Serve config directly
}

export function getSpeciesData(req, res) {
  const { species } = req.query;
  res.json(getSpecies(species));
}
```

---

## 3. MISSING API ENDPOINTS FOR AI INTERACTION

### 3.1 **Create a Stateless Game Logic API**
**File to Create**: `/home/user/wolfpack/src/api/GameLogicAPI.js`

```javascript
// Allows AI to query/test game logic without initializing Phaser
export class GameLogicAPI {
  // Fish AI Testing
  static async predictFishDecision(fishState, lureState) {
    const ai = new FishAI(fishState);
    return ai.getNextAction(lureState);
  }

  // Line tension calculations
  static calculateFightOutcome(fishWeight, dragSetting, lineTest) {
    // Pure math - no Phaser!
    return { breakChance, fightDuration };
  }

  // Spawning probabilities
  static getSpawnChances(depth, waterTemp) {
    return selectRandomSpecies(depth, waterTemp); // Already pure!
  }

  // Validate configurations
  static validateGameState(state) {
    // Check consistency without running full game
  }
}
```

**Benefits**:
- AI agents can query game logic without DOM/Canvas
- Unit test individual decisions
- Server-side game state verification

---

### 3.2 **Mock-Friendly Input System**
**File**: `/home/user/wolfpack/src/scenes/systems/InputSystem.js` (394 LOC)

**Current Issue**: Tightly coupled to Phaser input events

**Opportunity**: Inject input provider
```javascript
// BEFORE
export class InputSystem {
  constructor(scene) {
    this.scene = scene;
    this.scene.input.keyboard.on('keydown', ...); // Phaser-specific
  }
}

// AFTER
export class InputSystem {
  constructor(inputProvider) {
    this.input = inputProvider; // Can be mock
    this.input.on('keydown', ...);
  }
}

// Mock for testing
const mockInput = {
  on: jest.fn(),
  getKey: jest.fn(() => ({ pressed: false }))
};
```

---

## 4. EXISTING MOCK PATTERNS TO EXPAND

### 4.1 **Phaser Mock Already Exists**
**File**: `/home/user/wolfpack/__mocks__/phaser.js`

**Status**: Basic mock exists
**Opportunity**: Expand it

```javascript
// Current: Very minimal
export default {
  Scene: class { /* ... */ },
  Math: { Between, Distance }
};

// Should add:
export default {
  // ... current content
  Game: class {
    scene = { getScene: jest.fn(), add: jest.fn() };
  },
  Graphics: class {
    fillStyle = jest.fn(() => this);
    fillRect = jest.fn(() => this);
    strokeStyle = jest.fn(() => this);
    lineTo = jest.fn(() => this);
  },
  // ... more complete mock
};
```

---

### 4.2 **Create Stub Systems for Testing**
**File to Create**: `/home/user/wolfpack/__tests__/stubs/`

```javascript
// GameSceneStub.js - Minimal scene for logic testing
export class GameSceneStub {
  constructor() {
    this.fishes = [];
    this.baitfishClouds = [];
    this.lure = null;
    this.iceHoleManager = null;
    this.score = 0;
    this.time = {
      addEvent: jest.fn(),
      delayedCall: jest.fn()
    };
  }
}

// Usage in tests:
test('spawning respects fish limit', () => {
  const scene = new GameSceneStub();
  const system = new SpawningSystem(scene);
  scene.fishes = new Array(20).fill({});
  expect(system.canSpawnFish()).toBe(false);
});
```

---

## 5. TOKEN-HEAVY OPERATIONS TO OPTIMIZE

### 5.1 **Identify High-Complexity AI Logic**
**File**: `/home/user/wolfpack/src/entities/FishAI.js` (909 LOC)

**High-Token Operations**:
1. `detectFrenzy()` - Loops through all fish (line 86+)
2. `updateBehavior()` - Complex state machine (heavy logic)
3. Baitfish hunting with school tracking

**Optimization**: Cache expensive calculations

```javascript
// BEFORE: Recalculate every frame
detectFrenzy(lure, allFish) {
  const excitedFish = allFish.filter(f => f.ai.isExcited());
  // Calculates distance for EVERY fish every frame
}

// AFTER: Cache with TTL
class FishAIOptimized extends FishAI {
  constructor(fish) {
    super(fish);
    this.frenzyCache = { value: null, time: 0, TTL: 10 }; // 10 frames
  }

  detectFrenzy(lure, allFish) {
    if (Date.now() - this.frenzyCache.time < this.frenzyCache.TTL) {
      return this.frenzyCache.value;
    }
    const result = super.detectFrenzy(lure, allFish);
    this.frenzyCache = { value: result, time: Date.now() };
    return result;
  }
}
```

### 5.2 **Expensive Computations in GameScene**
**File**: `/home/user/wolfpack/src/scenes/GameScene.js` (Line 179+)

**Issue**: Every frame, updateDevTools() queries DOM and updates fish status panel

```javascript
// BEFORE: Every 100ms
const statsUpdateInterval = setInterval(() => {
  gameScene.fishes.forEach(fish => { /* full serialization */ });
  document.getElementById(...).innerHTML = html; // DOM heavy!
}, 100);

// AFTER: Only when necessary
const statsController = {
  dirty: false,
  update(fishes) {
    if (!this.dirty) return;
    // ...update DOM
    this.dirty = false;
  },
  invalidate() { this.dirty = true; }
};
```

---

## 6. CONFIGURATION & VALIDATION ALREADY TESTABLE

### 6.1 **Pure Config Files (Use These!)**

These files have **ZERO** Phaser dependencies and can be tested in Node.js:

```javascript
// ✓ Already perfect for AI
/home/user/wolfpack/src/config/GameConfig.js
/home/user/wolfpack/src/config/SpeciesData.js
/home/user/wolfpack/src/models/ReelModel.js
/home/user/wolfpack/src/models/FishingLineModel.js
/home/user/wolfpack/src/utils/Constants.js
```

**Usage for AI Agents**:
```javascript
// Import in Node.js - no browser needed!
import { ReelModel } from './src/models/ReelModel.js';
import GameConfig from './src/config/GameConfig.js';

const reel = new ReelModel();
reel.setLineTestStrength(15);
console.log(reel.getCurrentDragForce()); // Pure logic!
```

### 6.2 **Existing Test Infrastructure**
**Files**:
- `/__tests__/config-validation.test.js` ✓
- `/__tests__/spawning-logic.test.js` ✓

**Good Tests**: Config and spawning logic are well-tested

**Gaps to Fill**:
- No FishAI behavior tests (complex!)
- No FishFight mechanics tests
- No collision resolution tests

---

## 7. COMPREHENSIVE OPTIMIZATION ROADMAP

### Phase 1: Immediate (1-2 weeks) - Decouple Core Logic
**Priority**: HIGH
**Impact**: Enable AI testing framework

1. **Create GameEngine class** (`/src/core/GameEngine.js`)
   - Move non-Phaser logic from GameScene
   - Pure state management for game simulation
   - Can run in Node.js or headless browser

2. **Extract FishAILogic** (`/src/logic/FishAILogic.js`)
   - Remove scene dependencies from FishAI
   - Make decisions testable without graphics
   - Export as pure decision function

3. **Create GameLogicAPI** (`/src/api/GameLogicAPI.js`)
   - Query-based interface for game logic
   - Stateless functions for AI agents
   - No Phaser required

**Files to Modify**:
- `/src/scenes/GameScene.js` - Extract engine
- `/src/entities/FishAI.js` - Create parallel FishAILogic
- Create new `/src/core/GameEngine.js`
- Create new `/src/api/GameLogicAPI.js`

---

### Phase 2: Mid-term (2-4 weeks) - Lazy Loading & APIs
**Priority**: MEDIUM
**Impact**: Reduce bundle size, enable web APIs

1. **Lazy-load UI systems** in GameScene
   - NotificationSystem (1013 LOC)
   - SonarDisplay (567 LOC)
   - Debug visualizations

2. **Create REST API layer** (`/src/api/`)
   - Config endpoints
   - Game state queries
   - AI decision endpoints
   - Validation endpoints

3. **Expand Phaser mocks** for testing
   - `/src/__mocks__/phaser.js`
   - `/src/__tests__/stubs/GameSceneStub.js`

**Files to Create**:
- `/src/api/ConfigAPI.js`
- `/src/api/GameStateAPI.js`
- `/src/api/ValidationAPI.js`
- `/src/__tests__/stubs/GameSceneStub.js`
- `/src/__tests__/stubs/InputProviderStub.js`

---

### Phase 3: Long-term (4+ weeks) - Full Headless Capability
**Priority**: LOW
**Impact**: Server-side game simulation

1. **Headless game runner**
   - Run game logic server-side
   - Record replays
   - AI agent training environment

2. **Dependency injection throughout**
   - All scene references become injectable
   - Graphics fully optional
   - Can swap implementations

3. **Event-based architecture**
   - Replace scene.events with event bus
   - Decouple all systems
   - Enable remote play

**Files to Create**:
- `/src/core/GameRunner.js`
- `/src/events/EventBus.js`
- `/src/headless/HeadlessAdapter.js`

---

## 8. SPECIFIC FILE RECOMMENDATIONS

### High-Value Refactorings (ROI: Effort vs. Benefit)

| File | Issue | Solution | Effort | Benefit | For AI |
|------|-------|----------|--------|---------|--------|
| `/src/scenes/GameScene.js` | 1608 LOC, mixed concerns | Extract GameEngine | HIGH | HIGH | CRITICAL - enables testing |
| `/src/entities/FishAI.js` | Scene dependencies | Extract FishAILogic | MEDIUM | HIGH | CRITICAL - AI testing |
| `/src/entities/FishFight.js` | Graphics in logic | Separate render layer | MEDIUM | MEDIUM | Important - fight mechanics |
| `/src/config/GameConfig.js` | None - already pure | Keep as-is ✓ | NONE | N/A | Ready to use! |
| `/src/utils/SonarDisplay.js` | 567 LOC rendering | Lazy-load | LOW | MEDIUM | Reduces init overhead |
| `/src/scenes/systems/InputSystem.js` | Hardcoded input | Inject provider | MEDIUM | MEDIUM | Enables input mocking |

---

## 9. CODE EXAMPLES FOR IMMEDIATE IMPLEMENTATION

### Example 1: GameEngine Extraction
```javascript
// /src/core/GameEngine.js
import SpawningSystem from '../scenes/systems/SpawningSystem.js';
import CollisionSystem from '../scenes/systems/CollisionSystem.js';
import ScoreSystem from '../scenes/systems/ScoreSystem.js';

export class GameEngine {
  constructor(config = {}) {
    this.config = { ...GameConfig, ...config };
    
    // Initialize systems WITHOUT scene
    // Pass minimal dependencies
    this.spawningSystem = new SpawningSystem({ 
      maxFish: this.config.MAX_FISH,
      spawnChance: this.config.FISH_SPAWN_CHANCE
    });
    
    this.collisionSystem = new CollisionSystem();
    this.scoreSystem = new ScoreSystem();
    
    // Pure state
    this.fishes = [];
    this.gameTime = 0;
    this.score = 0;
  }
  
  update(deltaTime) {
    // Run pure game logic
    this.gameTime += deltaTime;
    
    // Update all systems
    this.spawningSystem.update(this);
    this.collisionSystem.update(this);
    this.scoreSystem.update(this);
    
    // Update entities
    this.fishes.forEach(f => f.update(deltaTime));
  }
  
  toJSON() {
    // For serialization
    return {
      fishes: this.fishes.map(f => f.toJSON()),
      gameTime: this.gameTime,
      score: this.score
    };
  }
}
```

### Example 2: FishAI Decoupling
```javascript
// /src/logic/FishAILogic.js - Pure decision making
export class FishAILogic {
  static makeDecision(fishState, environmen) {
    // No scene references!
    const { lure, proximity, hunger, energy } = fishState;
    
    // Pure logic
    if (proximity < 100 && hunger > 50) {
      return { action: 'CHASE', intensity: hunger / 100 };
    }
    
    return { action: 'IDLE' };
  }
  
  static predictInterest(fishSpecies, lureSpeed, depth) {
    // Lookup tables + pure math
    const speciesPreference = SPECIES_PREFERENCES[fishSpecies];
    const speedMatch = Math.abs(speciesPreference.speed - lureSpeed);
    return Math.max(0, 100 - speedMatch * 10);
  }
}
```

### Example 3: API Endpoint
```javascript
// /src/api/GameLogicAPI.js
export const GameLogicAPI = {
  async validateFishState(state) {
    try {
      return {
        valid: this.isFishStateValid(state),
        errors: this.getFishStateErrors(state)
      };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  },
  
  isFishStateValid(state) {
    return (
      state.weight > 0 && state.weight < 50 &&
      state.depth >= 0 && state.depth <= 150 &&
      state.hunger >= 0 && state.hunger <= 100
    );
  },
  
  async predictOutcome(scenario) {
    // Simulate fight
    return { breakChance: 0.05, expectedDuration: 45 };
  }
};

// Use in Express.js
import express from 'express';
import { GameLogicAPI } from './GameLogicAPI.js';

const router = express.Router();

router.post('/validate', async (req, res) => {
  const result = await GameLogicAPI.validateFishState(req.body);
  res.json(result);
});

export default router;
```

---

## 10. SUMMARY TABLE: Critical Optimization Paths

| Category | Current State | Target State | Files | Priority |
|----------|---------------|--------------|-------|----------|
| **Game Logic Isolation** | Embedded in GameScene | Separate GameEngine | GameScene.js | CRITICAL |
| **Fish AI Testing** | Needs scene mock | Pure decision logic | FishAI.js, new FishAILogic.js | CRITICAL |
| **Configuration Access** | Good ✓ | Expose via API | GameConfig, SpeciesData | HIGH |
| **Input Handling** | Hardcoded to Phaser | Injectable provider | InputSystem.js | HIGH |
| **UI Systems** | Always loaded | Lazy-loaded | NotificationSystem, SonarDisplay | MEDIUM |
| **Testing Stubs** | Basic mock | Comprehensive stubs | __mocks__, __tests__ | MEDIUM |
| **Performance** | O(n) per-frame ops | Cached lookups | FishAI, GameScene | LOW |

---

## 11. METRICS TO TRACK

After optimization, measure:

1. **Bundle Size**: Pure logic module size (target: <200KB)
2. **Init Time**: GameEngine creation without Phaser (target: <100ms)
3. **Test Speed**: AI logic tests without browser (target: <100ms suite)
4. **Headless Capability**: Can run full game turn in Node.js (target: YES)
5. **API Latency**: GameLogicAPI endpoints (target: <50ms)

---

## Conclusion

The codebase has **solid architecture foundations** with good use of:
- ✓ Systems architecture in GameScene
- ✓ Model composition in Fish entities
- ✓ Pure configuration files
- ✓ Existing test infrastructure

**Key wins** come from:
1. Extracting GameEngine (enables all logic testing)
2. Decoupling FishAI from scene (enables AI agent development)
3. Creating GameLogicAPI (enables web-based AI tools)
4. Lazy-loading heavy systems (reduces overhead)

**For AI agent development**, prioritize Phase 1 (GameEngine + FishAILogic + GameLogicAPI) to unlock:
- Deterministic state simulation
- Pure AI decision testing
- Server-side game verification
- Headless game runner capability

