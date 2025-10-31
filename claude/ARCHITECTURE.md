# Wolfpack - Architecture Guide

**Last Updated**: 2025-10-29
**Codebase Size**: 36 files, 16,114 lines

---

## 📐 Project Structure

```
wolfpack/
├── index.html              # Main page with dev UI panel
├── gamepad-test.html       # Controller testing utility
├── package.json
├── src/                    # Source code (16,114 lines)
│   ├── index.js            # Phaser initialization (487 lines)
│   ├── config/
│   │   ├── GameConfig.js   # Game constants (166 lines)
│   │   └── SpeciesData.js  # All species definitions (924 lines)
│   ├── scenes/
│   │   ├── BootScene.js             # Loading screen (198 lines)
│   │   ├── MenuScene.js             # Mode selection (394 lines)
│   │   ├── NavigationScene.js       # Lake map (2,147 lines)
│   │   ├── GameScene.js             # Main game (1,417 lines)
│   │   ├── GameOverScene.js         # Results (369 lines)
│   │   ├── UIScene.js               # HUD overlay (68 lines)
│   │   ├── NatureSimulationScene.js # AI observation mode (608 lines)
│   │   └── systems/                 # Game systems
│   │       ├── SpawningSystem.js    # Fish/baitfish spawning (631 lines)
│   │       ├── InputSystem.js       # Keyboard/gamepad (447 lines)
│   │       ├── CollisionSystem.js   # Cloud split/merge (146 lines)
│   │       ├── DebugSystem.js       # Debug visualization (200 lines)
│   │       └── NotificationSystem.js # Messages/pause menu (847 lines)
│   ├── entities/
│   │   ├── Fish.js          # Fish rendering wrapper/factory (252 lines)
│   │   ├── FishAI.js        # 7-state AI machine (951 lines)
│   │   ├── FishFight.js     # Catch minigame (744 lines)
│   │   ├── Lure.js          # Player lure physics (372 lines)
│   │   ├── Baitfish.js      # Flocking behavior (654 lines)
│   │   ├── BaitfishCloud.js # Cloud management (469 lines)
│   │   ├── Zooplankton.js   # Bottom organisms (194 lines)
│   │   └── FishingLine.js   # Line rendering (114 lines)
│   ├── models/
│   │   ├── fish.js          # Base fish biology (373 lines)
│   │   ├── FishingLineModel.js # Line physics (155 lines)
│   │   └── species/         # Modular species classes
│   │       ├── LakeTrout.js       # Lake Trout (112 lines)
│   │       ├── NorthernPike.js    # Northern Pike (138 lines)
│   │       ├── SmallmouthBass.js  # Smallmouth Bass (154 lines)
│   │       └── YellowPerch.js     # Yellow Perch (147 lines)
│   ├── managers/
│   │   ├── IceHoleManager.js  # Ice hole drilling (391 lines)
│   │   └── BoatManager.js     # Kayak/motorboat (394 lines)
│   └── utils/
│       ├── SonarDisplay.js      # Sonar visualization (521 lines)
│       ├── BathymetricData.js   # Lake depth data (410 lines)
│       ├── GamepadManager.js    # Controller support (236 lines)
│       └── Constants.js         # Enums/utilities (75 lines)
├── assets/                  # Game assets
├── samples/                 # Sample images/screenshots
│   ├── assets/              # Reference images
│   ├── bugs/                # Bug screenshots
│   ├── gameplay/            # Gameplay screenshots
│   └── screenshots/         # General screenshots
└── claude/                  # AI agent documentation
    ├── QUICK_START.md       # Quick reference guide
    ├── ARCHITECTURE.md      # This file
    ├── FISH_MECHANICS.md    # Fish AI and species
    └── TROUBLESHOOTING.md   # Common bugs and fixes
```

---

## 🎮 Game Architecture

### Scene Flow

```
Start → BootScene → MenuScene → NavigationScene → GameScene + UIScene
                                      ↓                    ↓
                                NatureSimulation     GameOverScene
                                      ↓                    ↓
                                   MenuScene ←───────────────┘
```

### Scene Responsibilities

**BootScene** (198 lines)
- Asset loading and preloading
- Lake Champlain facts display
- Gamepad detection
- Transition to MenuScene

**MenuScene** (394 lines)
- Game mode selection (3×2 grid)
- Fishing types: Ice, Kayak, Motor Boat
- Game modes: Arcade (2-min timer), Unlimited
- Nature Simulation mode option
- Registry initialization

**NavigationScene** (2,147 lines) - *Largest scene*
- Top-down lake map (20,000 × 60,000 units)
- Full bathymetric display
- Kayak/motorboat movement physics
- Tiredness meter (kayak)
- Fuel management (motor boat)
- Depth display at cursor/player position
- Good fishing spot detection (40-80ft)
- Minimap with player position
- Press X to start fishing

**GameScene** (1,417 lines) - *Main game orchestrator*
- Manages 6 game systems
- Entity lifecycle (fish, baitfish, lure, zooplankton)
- Fish fight mode transitions
- Collision detection
- Input handling delegation
- Timer management (arcade mode)
- Registry data management

**NatureSimulationScene** (608 lines)
- AI-only observation mode
- Manual spawning controls
- Depth selection UI (10-100ft)
- No lure or player
- Pure ecosystem simulation
- Info display overlay

**UIScene** (68 lines)
- HUD overlay (runs parallel to GameScene)
- Fish caught/lost count
- Lure depth and speed
- Depth zone indicator
- Game timer
- Water temperature

**GameOverScene** (369 lines)
- Results summary
- Fish caught/lost statistics
- Largest catch highlight
- Replay or return to menu

---

## 🏗️ Systems Architecture

GameScene delegates to 6 focused systems (single responsibility principle):

### SpawningSystem (631 lines)

**Responsibilities**:
- Fish spawning with species selection
- Baitfish cloud spawning with species diversity
- Zooplankton spawning near lake bottom
- Emergency fish spawning (arcade mode, <30 seconds)
- Depth compatibility checks
- Spawn rate management

**Key Methods**:
```javascript
spawnFish(speciesType, worldX, y)        // Spawn individual fish
spawnBaitfishCloud(speciesType)          // Spawn baitfish cloud
spawnZooplankton()                        // Spawn bottom organisms
selectSpeciesForDepth(targetDepth)       // Depth-appropriate species
```

### InputSystem (447 lines)

**Responsibilities**:
- Keyboard input handling
- Gamepad input with dead zone (20%)
- Mode-specific control mapping
- Jigging control (right stick)
- Lure drop/retrieve
- Ice hole drilling/movement

**Key Methods**:
```javascript
handleKeyboardInput()                     // Process keyboard
handleGamepadInput()                      // Process controller
handleReelInput()                         // Lure control
handleFishFightInput()                    // Catch minigame
checkPauseInput()                         // Pause detection
```

### CollisionSystem (146 lines)

**Responsibilities**:
- Baitfish cloud splitting (50% chance when lure passes through)
- Cloud merging (within 80px proximity)
- Cloud despawning (compressed or empty)
- Entity count management

**Key Methods**:
```javascript
checkCloudSplitting(lure, clouds)         // Split on lure contact
mergeNearbyClouds(clouds)                 // Combine close clouds
```

### DebugSystem (200 lines)

**Responsibilities**:
- Detection range visualization (yellow circles)
- Strike distance visualization (red circles)
- Fish state color coding
- Connection lines to lure
- Baitfish flock visualization
- FPS and entity count display

**Toggle**: Backtick (`) key or Square/X button

### NotificationSystem (847 lines) - *Largest system*

**Responsibilities**:
- Catch notifications with animations
- Pause menu UI
- Game mode messages
- Achievement unlock displays
- Fade in/out effects
- Menu navigation

**Key Methods**:
```javascript
showCatchNotification(fishData)           // Show catch popup
togglePause()                             // Pause menu
showGameModeMessage()                     // Mode display
update(time, delta)                       // Animation updates
```

---

## 🐟 Entity Architecture

### Modular Fish System

**Old Architecture** (pre-refactor):
```
Fish.js (1,000+ lines)
  └─ All species rendering in one file
  └─ Difficult to maintain
  └─ Hard to add new species
```

**New Architecture** (current):
```
Fish.js (252 lines) - Factory pattern
  └─ Creates species instances
  └─ Delegates to models

models/fish.js (373 lines) - Base biology
  ├─ Common properties (hunger, health, metabolism)
  ├─ AI integration
  ├─ Movement and state management
  ├─ Sonar trail rendering
  └─ Biological update cycles

models/species/ - Species-specific implementations
  ├─ LakeTrout.js (112 lines)
  │   ├─ calculateLength()
  │   ├─ calculateBiologicalAge()
  │   ├─ render(graphics, bodySize, isMovingRight)
  │   ├─ renderBody(graphics, bodySize, ...)
  │   └─ renderAtPosition(graphics, x, y, bodySize)
  ├─ NorthernPike.js (138 lines)
  ├─ SmallmouthBass.js (154 lines)
  └─ YellowPerch.js (147 lines)
```

**Benefits**:
- Each species is self-contained
- Shared behaviors inherited from base Fish class
- Species-specific formulas isolated
- Easy to add new species
- Clear separation of concerns

### Fish Rendering Pipeline

```
GameScene.update()
  ↓
Fish.update()
  ↓
Fish.render(graphics)
  ↓
Species.render(graphics, bodySize, isMovingRight)
  ├─ graphics.save()
  ├─ graphics.translateCanvas(this.x, this.y)
  ├─ graphics.rotateCanvas(this.angle) / graphics.scaleCanvas(-1, 1)
  ├─ Species.renderBody(graphics, bodySize, colors, 0, 0)
  └─ graphics.restore()
```

**For catch popup**:
```
FishFight.showCatchPopup()
  ↓
fish.renderAtPosition(graphics, x, y, scale)
  ↓
Species.renderAtPosition(graphics, x, y, bodySize)
  ├─ graphics.save()
  ├─ graphics.translateCanvas(x, y)  ← Position in popup
  ├─ Species.renderBody(graphics, bodySize, colors, 0, 0)
  └─ graphics.restore()
```

**Critical**: Must use `translateCanvas()` - setting `graphics.x/y` doesn't work!

### FishAI State Machine (951 lines)

7-state machine with species-specific behaviors:

```
States:
  IDLE          - Cruising, monitoring environment
  INTERESTED    - Noticed lure, cautious approach
  CHASING       - Committed pursuit
  STRIKING      - Attack lunge
  FLEEING       - Spooked, swimming away
  HUNTING_BAITFISH - Pursuing prey
  FEEDING       - Consuming prey

Transitions:
  IDLE → INTERESTED → CHASING → STRIKING → (Caught or FLEEING)
    ↓        ↑
  HUNTING_BAITFISH → FEEDING → IDLE
```

**Species Behaviors**:
- **Pike**: Ambush patrol (50px radius), patience timer, burst speed
- **Bass**: Circling investigation (35px radius, 2 seconds)
- **Trout**: Classic pursuit with depth preference
- **Perch**: Aggressive for size, beginner-friendly

### Baitfish Flocking (654 lines)

3-rule boids algorithm:

1. **Separation** (12px radius)
   - Avoid crowding neighbors
   - Prevents overlapping

2. **Cohesion** (50px radius)
   - Stay near group center
   - Forms tight schools

3. **Alignment**
   - Match velocity with neighbors
   - Synchronized movement

**Panic Response**:
- Triggered by predator approach
- Speed multiplier: 2.5-3.5×
- Scatter behavior
- Increased separation

### BaitfishCloud Management (469 lines)

**Responsibilities**:
- Spawn groups of 5-50 baitfish (species-dependent)
- Cloud center tracking
- Scared level management (affects spread)
- Cloud splitting logic (lure interaction)
- Cloud merging (proximity-based)
- Drift mechanics

**Species Schooling Densities**:
- Alewife: 20-50 (dense schools)
- Rainbow Smelt: 10-30 (tight schools)
- Slimy Sculpin: 1-3 (solitary)
- Cisco: 15-40 (dense schools, rare)
- Yellow Perch Juvenile: 8-20 (medium schools)

---

## 🎨 Rendering Architecture

### Graphics System Hierarchy

```
Phaser Canvas Renderer
  ├─ Graphics Objects (Phaser.GameObjects.Graphics)
  │   ├─ Fish rendering (species models)
  │   ├─ Baitfish rendering
  │   ├─ Lure rendering
  │   ├─ Fishing line
  │   └─ Sonar overlays
  ├─ Sprites (future assets)
  └─ Text Objects (UI elements)
```

### Depth Layering (Z-index)

```
Layer (setDepth value):
  2002 - Catch popup elements (fish, text, overlay)
  2001 - Catch popup background
  2000 - Pause menu overlay
  500  - Tension bar
  100  - UI elements
  50   - Fishing line
  20   - Lure
  10   - Fish
  5    - Baitfish
  2    - Zooplankton
  0    - Background
```

### Sonar Display (521 lines)

**Features**:
- Retro green phosphor grid
- Lake bottom profile rendering
- Thermocline layers (25ft, 45ft, 85ft)
- Noise particles (static effect)
- Depth markers every 10 feet
- Dynamic scaling based on water depth

**Entity Rendering**:
- Fish (size and state-based colors)
- Baitfish clouds (density visualization)
- Zooplankton (small dots)
- Lure (with trail effect)
- Fishing line

---

## 🗺️ Coordinate Systems

### World vs Screen Coordinates

**Ice/Kayak/Boat Modes**:
```
worldX = Absolute horizontal position in lake (0-10000)
playerWorldX = Player's world position (from manager)
screenX = Relative position on screen

Conversion:
screenX = (CANVAS_WIDTH / 2) + (entityWorldX - playerWorldX)

Player is ALWAYS at screen center: x = 600 (CANVAS_WIDTH/2)
```

**Nature Simulation Mode**:
```
No player - screen IS world
screenX = worldX (no conversion)
```

**Detection Pattern** (use everywhere):
```javascript
if (this.scene.iceHoleManager) {
    // Ice mode - player at ice hole
    playerWorldX = this.scene.iceHoleManager.getCurrentHole().x;
} else if (this.scene.boatManager) {
    // Boat/kayak mode - player at boat position
    playerWorldX = this.scene.boatManager.getPlayerWorldX();
} else {
    // Nature simulation - no player
    screenX = worldX;  // Direct assignment
}
```

### Depth Coordinate System

```
y (pixels) = depth (feet) × DEPTH_SCALE
depth (feet) = y (pixels) / DEPTH_SCALE

DEPTH_SCALE is DYNAMIC:
- Calculated based on actual water depth
- Keeps lake bottom at 85% of screen height
- Formula: DEPTH_SCALE = CANVAS_HEIGHT / (maxDepth / 0.85)

Example:
- 150ft depth → DEPTH_SCALE ≈ 3.68 px/ft
- 100ft depth → DEPTH_SCALE ≈ 5.52 px/ft
```

**Never hardcode depth scale!**

```javascript
// ❌ BAD
const maxY = 150 * 1.625;  // Wrong if depth changes!

// ✅ GOOD
const maxY = (this.scene.maxDepth - 5) * GameConfig.DEPTH_SCALE;
```

---

## 📊 Data Flow

### Registry System (Persistent Data Across Scenes)

```
MenuScene sets:
  ├─ fishingType (ice/kayak/motorboat/nature_simulation)
  ├─ gameMode (arcade/unlimited)
  └─ Clears navigation data for ice mode

NavigationScene sets:
  ├─ currentDepth (actual depth at selected position)
  ├─ fishingWorldX (horizontal position on lake)
  ├─ fishingWorldY (vertical position on lake)
  └─ playerStartingPosition

GameScene reads:
  ├─ fishingType → Determines which manager to create
  ├─ gameMode → Arcade timer vs unlimited
  ├─ currentDepth → Sets maxDepth
  └─ playerStartingPosition → Initial spawn location
```

### Entity Update Cycle (60 FPS)

```
GameScene.update(time, delta)
  ├─ inputSystem.update()              // Process controls
  ├─ spawningSystem.update()            // Spawn entities
  ├─ fish.forEach(f => f.update())      // Fish AI and movement
  │   ├─ FishAI.update()                // State machine
  │   ├─ Hunger/health updates          // Biology
  │   └─ render()                       // Visual display
  ├─ baitfishClouds.forEach(c => c.update())  // Flocking behavior
  ├─ zooplankton.forEach(z => z.update())      // Drift behavior
  ├─ lure.update()                      // Physics simulation
  ├─ fishingLine.update()               // Line rendering
  ├─ collisionSystem.update()           // Cloud management
  ├─ notificationSystem.update()        // UI animations
  └─ debugSystem.update()               // Debug visualization
```

---

## 🔧 Configuration System

### GameConfig.js (166 lines)

**Canvas & Rendering**:
```javascript
CANVAS_WIDTH: 1200
CANVAS_HEIGHT: 650
COLOR_BACKGROUND: 0x000000
COLOR_LURE: 0xff8800
COLOR_FISH_*: Various sonar colors
```

**Depth & Physics**:
```javascript
MAX_DEPTH: 150  // feet (default, overridden by bathymetry)
DEPTH_SCALE: 3.68  // pixels per foot (dynamic!)
MIN_DISPLAY_RANGE: 100  // feet
```

**Spawn Rates**:
```javascript
FISH_SPAWN_CHANCE: 0.008  // 0.8% per frame
BAITFISH_SPAWN_CHANCE: 0.004  // 0.4% per frame
ZOOPLANKTON_SPAWN_RATE: 0.01  // 1% per frame
```

**Fish Mechanics**:
```javascript
FISH_DETECTION_RANGE: 350  // pixels
FISH_STRIKE_DISTANCE: 25  // pixels (standard)
PIKE_STRIKE_DISTANCE: 60  // pixels (extended for ambush)
FISH_SPEED_MIN: 0.5
FISH_SPEED_MAX: 1.5
```

**Lure Physics**:
```javascript
LURE_WEIGHT: 2  // ounces (default)
LURE_GRAVITY: 0.15
LURE_MAX_SPEED: 3.5
LURE_DRAG: 0.98
```

### SpeciesData.js (924 lines)

**Structure**:
```javascript
PREDATOR_SPECIES = {
    species_key: {
        name: "Display Name",
        scientificName: "Latin name",
        sizeRange: { min, max },
        depthRange: { min, max },
        temperatureRange: { optimal, min, max },
        diet: { prey_species: percentage },
        behavior: { ... },
        appearance: { colorScheme, size },
        fight: { strength, stamina, techniques }
    }
}

BAITFISH_SPECIES = {
    species_key: {
        name: "Display Name",
        sizeRange: { min, max },
        schoolSize: { min, max },
        speed: { base, panic },
        schoolingTightness: 0-1,
        appearance: { colorScheme }
    }
}
```

**Spawn Weight System**:
```javascript
// In SpawningSystem.js
const species = Utils.weightedRandom({
    'lake_trout': 50,        // 50% chance
    'northern_pike': 25,     // 25% chance
    'smallmouth_bass': 15,   // 15% chance
    'yellow_perch_large': 10 // 10% chance
});
```

---

## 🎮 Input System

### Keyboard Mapping

**Normal Fishing**:
- Arrow Keys: Adjust retrieve speed
- Spacebar: Drop lure / Reel in (during fight)
- Shift: Retrieve lure
- T: Toggle ice hole movement mode
- M: Move to next hole (ice fishing)
- D: Drill new hole (ice fishing)
- Backtick (`): Toggle debug mode
- Esc/P: Pause

**Navigation**:
- Arrow Keys / WASD: Move kayak/motorboat
- X: Start fishing

### Gamepad Mapping (Standard)

**Normal Fishing**:
- L2 Trigger: Drop lure (hold)
- R2 Trigger: Retrieve lure (variable speed)
- Right Stick Y: Jigging control (±20px range)
- D-Pad Left/Right: Adjust retrieve speed
- Triangle/Y: Toggle ice hole movement
- Square/X: Drill hole / Toggle debug
- Options/Menu: Pause

**Fish Fight**:
- R2 Trigger: Rapid tap to reel (50ms interval)
- Haptic feedback:
  - Tension >90%: Strong rumble (1.0)
  - Tension >70%: Medium rumble (0.5)
  - Each reel: Light pulse (0.3, 100ms)

**Navigation**:
- Left Stick: Move kayak/motorboat
- R2: Increase speed
- X: Start fishing

---

## 🔍 Performance Considerations

### Entity Limits

- Fish: ~4-6 active (spawn rate controlled)
- Baitfish: 5-50 per cloud, multiple clouds
- Zooplankton: Unlimited (age-based despawning)
- Cloud merging prevents entity explosion

### Update Order (60 FPS Target)

1. Input systems
2. AI systems (fish, baitfish)
3. Physics systems (lure, line)
4. Collision systems
5. Render

### Culling

- Entities >600px from player (world distance) are removed
- In nature mode: entities >400px off screen edges removed

---

## 📦 Dependencies

**Runtime**:
- Phaser 3.80.1 (loaded from CDN in index.html)
- No other runtime dependencies

**Development**:
- http-server 14.1.1 (dev server only)

**Browser APIs**:
- Gamepad API (controller support)
- Canvas 2D (rendering)
- Web Audio API (structure ready, sounds not implemented)
- LocalStorage (UI state persistence)
- requestAnimationFrame (60 FPS game loop)

---

## 🧪 Testing Approach

### Manual Testing

**Dev Panel** (index.html):
- Spawn fish buttons (1 or 5 fish)
- Fish status panel (real-time state, hunger, health, frenzy)
- Lure weight selection (0.25-4oz)
- Fishing line type selection
- Reset game button
- Toggle debug button

**Debug Mode** (backtick key):
- Fish detection ranges (yellow circles, 350px)
- Strike distance (red circles, 25px/60px)
- Fish state colors (gray/yellow/orange/red/blue)
- Movement vectors
- Connection lines
- Baitfish flock visualization

**Controller Test Page** (gamepad-test.html):
- Visual button state display
- Analog stick position readout
- Trigger pressure visualization
- Haptic feedback testing

### No Automated Tests

- Manual playtesting required
- No unit tests currently
- Consider adding Jest for future

---

## 🚀 Build & Deploy

**No Build Step Required**:
- ES6 modules run directly in browser
- No transpilation
- No bundler
- Development: `npm start` → http://localhost:8080

**Production**:
- Upload all files to web server
- Ensure proper MIME types for .js files
- Enable gzip compression for performance

---

**See Also**:
- QUICK_START.md - Getting started guide
- FISH_MECHANICS.md - Fish AI and species details
- TROUBLESHOOTING.md - Common bugs and fixes
