# AI Agent Optimization - Quick Reference Guide

## 3 Critical Wins for AI Development

### 1. EXTRACT GameEngine (CRITICAL)
**File**: Create `/src/core/GameEngine.js`
- **Why**: GameScene (1,608 LOC) mixes logic with Phaser
- **Impact**: Can test AI without browser/Phaser
- **Effort**: 2-3 days
- **Value**: UNLOCKS all AI testing

**Quick Start**:
```javascript
// GameEngine needs ZERO Phaser dependencies
export class GameEngine {
  update(deltaTime) { /* pure game logic */ }
  spawnFish() { /* no graphics */ }
  checkCollisions() { /* pure math */ }
}

// Use in GameScene:
export class GameScene extends Phaser.Scene {
  create() {
    this.engine = new GameEngine(GameConfig);
  }
  update() {
    this.engine.update(16); // 60fps = 16ms
    // Now render engine state
  }
}
```

---

### 2. DECOUPLE FishAI Logic (CRITICAL)
**File**: Create `/src/logic/FishAILogic.js`
- **Why**: FishAI (909 LOC) has scene dependencies
- **Impact**: AI decisions testable in isolation
- **Effort**: 1-2 days
- **Value**: ENABLES AI agent algorithms

**Quick Start**:
```javascript
// Pure decision logic - NO scene
export class FishAILogic {
  static makeDecision(fishState, lureState) {
    const { depth, hunger, speed } = fishState;
    // Math-only logic
    if (hunger > 70 && depth < 100) return 'CHASE';
    return 'IDLE';
  }
}

// Test without mocking:
test('hungry fish chase', () => {
  const decision = FishAILogic.makeDecision(
    { hunger: 80, depth: 50, speed: 2 },
    { proximity: 50 }
  );
  expect(decision).toBe('CHASE');
});
```

---

### 3. CREATE GameLogicAPI (HIGH)
**File**: Create `/src/api/GameLogicAPI.js`
- **Why**: No way to query game logic without UI
- **Impact**: AI agents can call REST endpoints
- **Effort**: 1 day
- **Value**: Web-based AI tools, server verification

**Quick Start**:
```javascript
export const GameLogicAPI = {
  validateFishState(state) {
    return state.weight > 0 && state.depth >= 0;
  },
  
  predictInterest(species, lureSpeed, depth) {
    // Pure lookup + math
    return this.calculateInterestScore(species, lureSpeed);
  }
};

// Expose via Express:
app.post('/api/validate-state', (req, res) => {
  res.json(GameLogicAPI.validateFishState(req.body));
});
```

---

## Files Already AI-Ready (Use These!)

No modifications needed - import and use:

```javascript
// Pure config - zero Phaser deps
import GameConfig from './src/config/GameConfig.js';
import { PREDATOR_SPECIES } from './src/config/SpeciesData.js';
import { ReelModel } from './src/models/ReelModel.js';
import { FishingLineModel } from './src/models/FishingLineModel.js';

// AI can use directly in Node.js
const reel = new ReelModel();
reel.setLineTestStrength(15);
console.log(reel.getCurrentDragForce()); // ✓ Works!
```

---

## High-Value Refactorings (Pick 3)

| Priority | File | Issue | Fix | Time |
|----------|------|-------|-----|------|
| **CRITICAL** | GameScene.js | 1,608 LOC monolith | Extract GameEngine | 2-3 days |
| **CRITICAL** | FishAI.js | Scene dependencies | Create FishAILogic | 1-2 days |
| **CRITICAL** | (new) | No API | Create GameLogicAPI | 1 day |
| HIGH | InputSystem.js | Hardcoded Phaser | Inject input provider | 1 day |
| HIGH | NotificationSystem.js | Always loads | Lazy-load in GameScene | 1 day |
| MEDIUM | SonarDisplay.js | 567 LOC rendering | Lazy-load | 1 day |

---

## Bottlenecks to Token Usage

### High-Cost Operations:
```javascript
// FishAI.js line 86+ - EXPENSIVE
detectFrenzy(lure, allFish) {
  const excitedFish = allFish.filter(...); // O(n) every frame!
  const distances = allFish.map(f => 
    Utils.calculateDistance(...)  // n² complexity
  );
}

// FIX: Cache with TTL
detectFrenzy(lure, allFish) {
  if (this.frenzyCache.valid) return this.frenzyCache.value;
  // ... calculate
  this.frenzyCache = { value: result, valid: true };
}
```

### Heavy Rendering:
```javascript
// index.js line 179+ - EXPENSIVE DOM
const statsUpdateInterval = setInterval(() => {
  gameScene.fishes.forEach(fish => { /* serialize */ });
  document.getElementById(...).innerHTML = html; // DOM flush!
}, 100);

// FIX: Only update when dirty
const ui = {
  dirty: false,
  update(fishes) {
    if (!this.dirty) return;
    // ... update DOM
  }
};
```

---

## Implementation Checklist

### Phase 1: Core Decoupling (Week 1)
- [ ] Create `/src/core/GameEngine.js`
  - [ ] Copy logic from GameScene (non-Phaser)
  - [ ] Initialize spawning/collision/scoring systems
  - [ ] Expose `update(delta)` method
- [ ] Create `/src/logic/FishAILogic.js`
  - [ ] Extract FishAI decision logic
  - [ ] Remove all `this.scene` references
  - [ ] Add unit tests
- [ ] Create `/src/api/GameLogicAPI.js`
  - [ ] Expose pure functions
  - [ ] Create Express wrapper
  - [ ] Test with curl/Postman

### Phase 2: Testing Infrastructure (Week 2)
- [ ] Expand `/__mocks__/phaser.js`
- [ ] Create `/__tests__/stubs/GameSceneStub.js`
- [ ] Create `/__tests__/stubs/InputProviderStub.js`
- [ ] Write FishAI logic tests
- [ ] Write GameEngine integration tests

### Phase 3: Optimization (Week 3)
- [ ] Lazy-load NotificationSystem
- [ ] Lazy-load SonarDisplay
- [ ] Cache expensive FishAI operations
- [ ] Optimize DOM updates
- [ ] Measure performance gains

---

## Testing Without Phaser

```javascript
// After Phase 1, you can do this:
import { GameEngine } from './src/core/GameEngine.js';
import { FishAILogic } from './src/logic/FishAILogic.js';
import GameConfig from './src/config/GameConfig.js';

// NO Phaser required!
describe('AI Behavior', () => {
  test('fish spawn correctly', () => {
    const engine = new GameEngine(GameConfig);
    engine.spawnFish();
    expect(engine.fishes).toHaveLength(1);
  });

  test('AI makes decisions', () => {
    const decision = FishAILogic.makeDecision(
      { hunger: 90, depth: 50 },
      { proximity: 30 }
    );
    expect(decision).toBe('CHASE');
  });
});

// Run: npm test
// No browser needed!
```

---

## After Optimization: What Opens Up

1. **Server-Side Game Simulation**
   - Run game logic on Node.js server
   - No rendering overhead
   - Train AI agents deterministically

2. **AI Agent Framework**
   - Import GameEngine in agent code
   - Simulate thousands of game scenarios
   - Optimize fishing strategies

3. **Web API for Tools**
   - Query game state without UI
   - Validate configurations
   - Predict outcomes

4. **Headless Testing**
   - Full game logic tests
   - Replay systems
   - Debug scenarios

---

## Example: Post-Optimization AI Agent

```javascript
// This becomes possible after Phase 1:
import { GameEngine } from './src/core/GameEngine.js';

class FishingAIAgent {
  constructor() {
    this.engine = new GameEngine(CONFIG);
  }

  async learnOptimalStrategy() {
    // Run 10,000 simulations - pure logic, no rendering
    for (let i = 0; i < 10000; i++) {
      const engine = new GameEngine(CONFIG);
      
      // Seed RNG for reproducibility
      Math.seedrandom(i);
      
      // Run game forward 300 frames
      for (let frame = 0; frame < 300; frame++) {
        this.applyStrategy(engine);
        engine.update(16); // 60fps delta
      }
      
      // Record outcome
      const outcome = {
        fishCaught: engine.score,
        timeElapsed: engine.gameTime,
        success: engine.fishCaught > 5
      };
      
      this.recordOutcome(outcome);
    }
    
    return this.analyzeResults();
  }
}
```

---

## Metrics After Optimization

**Target State**:
- GameEngine init: < 100ms (vs current: 500ms+ with Phaser)
- Pure logic test suite: < 100ms (vs current: 5000ms+ with DOM)
- Logic bundle size: < 200KB (vs current: ~1.5MB uncompressed)
- AI agent latency: < 50ms per decision query

**Success Criteria**:
- Can run full game turn in Node.js without errors
- Can import GameEngine without loading Phaser
- Can test FishAI decisions without mocking scene
- Can call GameLogicAPI endpoints

---

## Questions? Check These Files

**Current State**:
- `/home/user/wolfpack/ARCHITECTURE_OPTIMIZATION.md` - Full analysis
- `/home/user/wolfpack/src/config/GameConfig.js` - Pure config
- `/home/user/wolfpack/__mocks__/phaser.js` - Existing mock

**After Implementation**:
- `/src/core/GameEngine.js` - Pure game logic
- `/src/logic/FishAILogic.js` - AI decisions
- `/src/api/GameLogicAPI.js` - Query interface

---

## Effort Estimate

| Phase | Component | Effort | Value |
|-------|-----------|--------|-------|
| 1 | GameEngine | 2-3d | 100% |
| 1 | FishAILogic | 1-2d | 95% |
| 1 | GameLogicAPI | 1d | 80% |
| 2 | Testing stubs | 2d | 60% |
| 2 | Tests | 2d | 50% |
| 3 | Optimizations | 2d | 30% |
| 3 | Lazy-loading | 1d | 20% |

**Total**: ~11-15 days for full optimization
**MVP** (Phases 1 + Testing): ~5-6 days

