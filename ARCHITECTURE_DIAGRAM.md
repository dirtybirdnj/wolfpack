# Architecture Optimization - Visual Overview

## Current Architecture (Tightly Coupled)

```
┌─────────────────────────────────────────────────────────┐
│                    Phaser.Game                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │            GameScene (1,608 LOC)                 │  │
│  │                                                   │  │
│  │  ┌──────────────────────────────────────────┐   │  │
│  │  │  SpawningSystem ─── Needs scene          │   │  │
│  │  │  CollisionSystem ─── Needs scene          │   │  │
│  │  │  InputSystem ─────── Hardcoded Phaser     │   │  │
│  │  │  ScoreSystem ─────── Uses scene.time      │   │  │
│  │  │  NotificationSystem ─ Uses scene.add      │   │  │
│  │  │  DebugSystem ─────── Heavy rendering      │   │  │
│  │  │  SonarDisplay ─────── 567 LOC rendering   │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  │                                                   │  │
│  │  ┌──────────────────────────────────────────┐   │  │
│  │  │  Entity Layer (Rendering)                │   │  │
│  │  │                                          │   │  │
│  │  │  ┌────────────────────────────────────┐ │   │  │
│  │  │  │ Fish (entity)                      │ │   │  │
│  │  │  │ ├─ .graphics (scene.add.graphics) │ │   │  │
│  │  │  │ ├─ .sprite (scene.add.sprite)     │ │   │  │
│  │  │  │ └─ .model (fish.js)               │ │   │  │
│  │  │  │    └─ .ai (FishAI)                │ │   │  │
│  │  │  │       └─ this.fish → scene refs   │ │   │  │
│  │  │  └────────────────────────────────────┘ │   │  │
│  │  │                                          │   │  │
│  │  │  FishingLine, Lure, Baitfish...        │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  │                                                   │  │
│  │  HTML/DOM Integration                           │  │
│  │  └─ updateDevTools() (Every 100ms!)            │  │
│  │     └─ document.getElementById() calls         │  │
│  │     └─ DOM serialization                       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

Problem: AI Testing Impossible!
  X Cannot import GameScene without Phaser
  X Cannot test FishAI without mocking scene
  X Cannot run game logic in Node.js
  X Cannot query game state without DOM
```

---

## Target Architecture (Decoupled)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────────────────────────────────────┐                    │
│  │      Core Logic (Game-Agnostic)        │                    │
│  │      Can run in Node.js, Deno, etc     │                    │
│  │                                         │                    │
│  │  ┌──────────────────────────────────┐  │                    │
│  │  │  GameEngine (NEW)                │  │  ✓ Pure logic      │
│  │  │  ├─ update(delta)                │  │  ✓ No Phaser       │
│  │  │  ├─ spawnFish()                  │  │  ✓ Testable        │
│  │  │  ├─ checkCollisions()            │  │  ✓ Serializable    │
│  │  │  └─ toJSON()                     │  │                    │
│  │  └──────────────────────────────────┘  │                    │
│  │           ↓                              │                    │
│  │  ┌──────────────────────────────────┐  │                    │
│  │  │  Systems (Refactored)            │  │                    │
│  │  │  ├─ SpawningSystem               │  │  ✓ Scene-optional  │
│  │  │  ├─ CollisionSystem              │  │  ✓ Configurable    │
│  │  │  ├─ ScoreSystem                  │  │  ✓ Testable        │
│  │  │  └─ (UI systems lazy-loaded)     │  │                    │
│  │  └──────────────────────────────────┘  │                    │
│  │           ↓                              │                    │
│  │  ┌──────────────────────────────────┐  │                    │
│  │  │  Logic Layer (NEW)               │  │                    │
│  │  │  ├─ FishAILogic                  │  │  ✓ Pure decisions  │
│  │  │  ├─ FightMechanics               │  │  ✓ No graphics     │
│  │  │  ├─ SpawningLogic                │  │  ✓ Cached/fast     │
│  │  │  └─ CollisionLogic               │  │                    │
│  │  └──────────────────────────────────┘  │                    │
│  │           ↓                              │                    │
│  │  ┌──────────────────────────────────┐  │                    │
│  │  │  Config & Models (Already Pure)  │  │                    │
│  │  │  ├─ GameConfig                   │  │  ✓ Existing        │
│  │  │  ├─ SpeciesData                  │  │  ✓ Great!          │
│  │  │  ├─ ReelModel                    │  │                    │
│  │  │  └─ FishingLineModel             │  │                    │
│  │  └──────────────────────────────────┘  │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
│  ┌──────────────────────────────────────────┐                   │
│  │  API Layer (NEW)                        │                   │
│  │  ├─ GameLogicAPI (stateless)            │  ✓ No state       │
│  │  ├─ ConfigAPI (REST endpoints)          │  ✓ Queryable      │
│  │  ├─ ValidationAPI                       │  ✓ Safe           │
│  │  └─ Exposed via Express/HTTP            │  ✓ Remote access  │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
│  ┌──────────────────────────────────────────┐                   │
│  │  UI Layer (Phaser-Specific)             │                   │
│  │  Only for rendering!                    │                   │
│  │                                          │                   │
│  │  ┌──────────────────────────────────┐   │                   │
│  │  │  GameScene (Refactored)          │   │                   │
│  │  │  ├─ this.engine = GameEngine()   │   │  ✓ Light!         │
│  │  │  ├─ render(engine.state)         │   │  ✓ 200 LOC        │
│  │  │  └─ systems.ui ← lazy-load       │   │                   │
│  │  └──────────────────────────────────┘   │                   │
│  │           ↓                               │                   │
│  │  ┌──────────────────────────────────┐   │                   │
│  │  │  Entity Renderers (Refactored)   │   │                   │
│  │  │  ├─ FishRenderer                 │   │  ✓ Graphics only  │
│  │  │  ├─ LureRenderer                 │   │  ✓ From state     │
│  │  │  ├─ SonarRenderer (lazy-load)    │   │  ✓ Optional       │
│  │  │  └─ UIRenderer (lazy-load)       │   │                   │
│  │  └──────────────────────────────────┘   │                   │
│  │           ↓                               │                   │
│  │  ┌──────────────────────────────────┐   │                   │
│  │  │  HTML/DOM (Lightweight)          │   │                   │
│  │  │  └─ Dirty-flag UI updates        │   │  ✓ Optimized!     │
│  │  └──────────────────────────────────┘   │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Result: AI Development Unlocked!
  ✓ Import GameEngine in Node.js
  ✓ Test FishAI decisions instantly
  ✓ Run 10,000 game simulations
  ✓ Query API endpoints
  ✓ Train AI agents deterministically
```

---

## Dependency Injection Flow

### Current (Tightly Coupled)
```javascript
GameScene
  ├─ SpawningSystem(scene)
  │  └─ needs scene.iceHoleManager
  │  └─ needs scene.fishes
  │  └─ calls scene.time.addEvent()
  │
  ├─ FishAI(fish)
  │  └─ accesses fish.scene
  │  └─ calls fish.scene.iceHoleManager.getCurrentHole()
  │
  └─ Lure(scene)
     └─ calls scene.add.graphics()
     └─ depends on scene.physics
```

### Target (Decoupled)
```javascript
GameEngine
  ├─ SpawningSystem({maxFish, spawnChance})
  │  └─ Pure logic, no scene needed
  │  └─ Can be tested: new SpawningSystem(config)
  │
  ├─ FishAI(fishState)
  │  └─ Pure functions, no scene refs
  │  └─ Can be tested: FishAILogic.makeDecision(state)
  │
  └─ Lure(x, y, config)
     └─ Pure state management
     └─ Rendering separate (LureRenderer)

GameScene ← composes GameEngine
  ├─ Instantiates: this.engine = new GameEngine(config)
  ├─ Updates: this.engine.update(delta)
  └─ Renders: renderEngine(this.engine.state)
```

---

## File Organization (After Refactoring)

```
wolfpack/
├── src/
│   ├── config/
│   │   ├── GameConfig.js ✓ (Already pure)
│   │   ├── SpeciesData.js ✓ (Already pure)
│   │   └── constants.js
│   │
│   ├── core/ ← NEW
│   │   ├── GameEngine.js ← Extract from GameScene
│   │   ├── SystemsManager.js
│   │   └── GameState.js
│   │
│   ├── logic/ ← NEW
│   │   ├── FishAILogic.js ← Extract from FishAI
│   │   ├── CollisionLogic.js
│   │   ├── SpawningLogic.js
│   │   └── FightLogic.js
│   │
│   ├── api/ ← NEW
│   │   ├── GameLogicAPI.js
│   │   ├── ConfigAPI.js
│   │   └── ValidationAPI.js
│   │
│   ├── models/
│   │   ├── fish.js ✓ (Already mostly pure)
│   │   ├── baitfish.js ✓
│   │   ├── ReelModel.js ✓
│   │   └── FishingLineModel.js ✓
│   │
│   ├── entities/ (Rendering layer)
│   │   ├── Fish.js (uses FishRenderer)
│   │   ├── FishRenderer.js ← Extract rendering
│   │   ├── Lure.js (uses LureRenderer)
│   │   ├── LureRenderer.js ← Extract rendering
│   │   └── ...
│   │
│   ├── scenes/
│   │   ├── GameScene.js ← Simplified (200 LOC)
│   │   │   └─ composition of GameEngine + renderers
│   │   ├── systems/ ← Refactored
│   │   │   ├── SpawningSystem.js (scene-optional)
│   │   │   ├── InputSystem.js (injectable)
│   │   │   ├── NotificationSystem.js (lazy-loaded)
│   │   │   └── SonarDisplay.js (lazy-loaded)
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── Constants.js ✓ (Already pure)
│   │   ├── GamepadManager.js
│   │   └── ...
│   │
│   ├── managers/
│   │   └── IceHoleManager.js ← Separate logic/render
│   │       ├── IceHoleLogic.js
│   │       └── IceHoleRenderer.js
│   │
│   └── index.js (Phaser init)
│
├── __tests__/
│   ├── stubs/ ← NEW
│   │   ├── GameSceneStub.js
│   │   ├── InputProviderStub.js
│   │   └── SceneStub.js
│   │
│   ├── unit/ ← NEW
│   │   ├── FishAILogic.test.js
│   │   ├── GameEngine.test.js
│   │   ├── CollisionLogic.test.js
│   │   └── ...
│   │
│   └── existing...
│
├── __mocks__/
│   └── phaser.js ← Enhanced
│
└── ARCHITECTURE_OPTIMIZATION.md ← This analysis
```

---

## Dependency Weight Analysis

### Current Heavy Dependencies
```
GameScene.js (1,608 LOC)
  └─ SpawningSystem (727 LOC)
  └─ InputSystem (394 LOC)
  └─ CollisionSystem (?)
  └─ ScoreSystem (?)
  └─ NotificationSystem (1,013 LOC) ← Heavy!
  └─ DebugSystem (?)
  └─ SonarDisplay (567 LOC) ← Heavy!
  └─ updateDevTools() function (650+ LOC)

FishAI.js (909 LOC)
  └─ scene references (complex!)
  └─ All-fish-loop operations (expensive!)

Phaser (3.8MB minified)
  └─ Required just to initialize game

Total: ~4-5MB minimum to test game logic
```

### After Optimization
```
GameEngine.js (200-300 LOC)
  ├─ Pure logic
  └─ No Phaser needed

FishAILogic.js (300-400 LOC)
  ├─ Pure functions
  └─ No scene refs

GameLogicAPI.js (200 LOC)
  ├─ Stateless
  └─ Queryable

Total: ~50KB pure logic
  vs   ~4,500KB before
  = 90x lighter for AI testing!
```

---

## Data Flow Comparison

### Current Flow (Everything Through Scene)
```
Input → InputSystem → GameScene → Fish → FishAI → Scene.fishes
                                              ↓
                                          Scene.graphics
                                              ↓
                                          Canvas render
```

### Target Flow (Pure Logic Pipeline)
```
Input ─────────────────────┐
                            ↓
Config ─┐            GameEngine ─→ Logic (no Phaser)
        ├→ GameLogicAPI         ─→ API (queryable)
        │                       ─→ Renderable State
        └────┬──────────────────┘
             ↓
       GameScene (Phaser)
             ↓
       Render GameEngine.state
             ↓
       Canvas
```

---

## Testing Capability Matrix

| Scenario | Current | After Opt |
|----------|---------|-----------|
| Test spawning logic | Need mock scene | Direct call |
| Test FishAI decision | Need mock scene | Call function |
| Test collision | Need scene + graphics | Call function |
| Run 100 game frames | 500ms+ | < 10ms |
| Run 10,000 frames | Impossible | 1-2 seconds |
| Test in Node.js | Impossible | Yes! |
| Mock input | Complex | Trivial |
| Headless run | Impossible | Yes! |
| Serialize game state | Complex | Built-in |
| Query via HTTP | Impossible | REST API |

---

## Performance Gains

### Bundle Size
```
Current:
  phaser.min.js:     3.8 MB
  game code:         ~300 KB
  Total:             ~4.1 MB

After optimization:
  phaser.min.js:     3.8 MB (only for UI)
  core logic:        ~50 KB (can be used standalone!)
  AI bundle:         ~200 KB (no Phaser!)
  
Headless AI gains:   3.8 MB lighter!
```

### Initialization Time
```
Current GameScene:
  Load Phaser:              500ms
  Initialize scene:         200ms
  Load all systems:         150ms
  Initialize graphics:      200ms
  Total:                   ~1,050ms

GameEngine only:
  Initialize engine:         10ms
  Create systems:            20ms
  Setup state:               5ms
  Total:                    ~35ms

Speedup: 30x faster for logic testing!
```

### Test Execution
```
Current (per-game test):
  Phaser init:      1,000ms
  Test logic:         100ms
  Cleanup:            100ms
  Total per test:   1,200ms

After optimization:
  Engine init:         10ms
  Test logic:          50ms
  Cleanup:             5ms
  Total per test:     65ms

Speedup: 18x faster per test!
```

---

## Implementation Timeline

```
Week 1: Core Decoupling (CRITICAL)
├─ Day 1-2: Extract GameEngine
├─ Day 2-3: Decouple FishAI
├─ Day 3-4: Create GameLogicAPI
└─ Day 4-5: Integration tests

Week 2: Testing Infrastructure
├─ Day 1: Expand Phaser mocks
├─ Day 2: Create test stubs
├─ Day 3-4: Write logic tests
└─ Day 5: Documentation

Week 3: Optimization & Polish
├─ Day 1-2: Lazy-load systems
├─ Day 2-3: Performance tuning
├─ Day 4: Cache expensive ops
└─ Day 5: Final testing

Result: Fully optimized, AI-ready codebase!
```

