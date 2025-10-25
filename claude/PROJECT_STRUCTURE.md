# Wolfpack - Project Structure

## Overview

**Wolfpack** is a realistic Lake Champlain fishing sonar simulator built with Phaser 3. The game simulates fishing for multiple species with sophisticated fish AI, realistic flocking baitfish, full Lake Champlain bathymetry, and complete gamepad support with haptic feedback.

- **Language:** JavaScript (ES6+ modules)
- **Framework:** Phaser 3.80.1
- **Total Lines of Code:** ~11,700 across 30 source files
- **License:** MIT
- **Node Version Required:** 20+

## Directory Structure

```
wolfpack/
├── index.html                      # Main game page with dev UI
├── gamepad-test.html              # Controller testing utility
├── package.json                   # Project dependencies
├── package-lock.json
├── README.md                      # Basic game documentation
├── assets/                        # Game assets and textures
├── docs/                          # Documentation
├── samples/                       # Sample files and screenshots
└── src/                           # Source code directory (11,700 lines)
    ├── index.js                   # Game initialization
    ├── config/
    │   ├── GameConfig.js          # Game constants & settings (165 lines)
    │   └── SpeciesData.js         # All species definitions (924 lines)
    ├── scenes/
    │   ├── BootScene.js           # Title screen (198 lines)
    │   ├── MenuScene.js           # Mode selection (446 lines)
    │   ├── NavigationScene.js     # Lake map navigation (2,146 lines)
    │   ├── GameScene.js           # Main game orchestrator (748 lines)
    │   ├── GameOverScene.js       # Results screen (369 lines)
    │   ├── UIScene.js             # HUD overlay (68 lines)
    │   └── systems/               # Game logic systems
    │       ├── SpawningSystem.js  # Fish/baitfish/zooplankton spawning
    │       ├── InputSystem.js     # Keyboard + gamepad input
    │       ├── CollisionSystem.js # Cloud splitting/merging
    │       ├── DebugSystem.js     # Debug visualization
    │       ├── ScoreSystem.js     # Score tracking + achievements
    │       └── NotificationSystem.js # In-game messages
    ├── entities/
    │   ├── Fish.js                # Fish entity & species rendering (1,145 lines)
    │   ├── FishAI.js              # Fish behavior AI (896 lines)
    │   ├── FishFight.js           # Catch minigame (717 lines)
    │   ├── Lure.js                # Player lure mechanics (310 lines)
    │   ├── Baitfish.js            # Prey fish with flocking (638 lines)
    │   ├── BaitfishCloud.js       # School management (464 lines)
    │   ├── Zooplankton.js         # Bottom organisms (180 lines)
    │   ├── FishingLine.js         # Line rendering (114 lines)
    │   └── FishingLineModel.js    # Line physics (142 lines)
    ├── managers/
    │   ├── IceHoleManager.js      # Ice hole drilling (391 lines)
    │   └── BoatManager.js         # Kayak/motorboat controls (394 lines)
    └── utils/
        ├── GamepadManager.js      # Controller support (239 lines)
        ├── SonarDisplay.js        # Sonar rendering (521 lines)
        ├── BathymetricData.js     # Lake Champlain depth data (410 lines)
        └── Constants.js           # Game constants (75 lines)
```

## Core Systems

### 1. Scene Management (`/src/scenes/`)

The game uses Phaser's scene system with six main scenes:

#### BootScene.js (198 lines)
- **Purpose:** Title screen and asset loading
- **Features:**
  - Displays Lake Champlain facts
  - Gamepad connection detection
  - Asset preloading (procedurally generated)
  - Start game with SPACE or gamepad X button

#### MenuScene.js (446 lines)
- **Purpose:** Game mode selection
- **Features:**
  - 3×2 grid of fishing mode combinations
  - Ice Fishing / Kayak / Motor Boat
  - Arcade (2-min timer) / Unlimited (no timer)
  - Visual mode cards with descriptions
  - Gamepad navigation support

#### NavigationScene.js (2,146 lines) - *Largest file*
- **Purpose:** Top-down lake map navigation
- **Features:**
  - Full Lake Champlain bathymetric display (20,000 × 60,000 units)
  - Real-time depth visualization at cursor/player position
  - Kayak/motorboat physics and movement
  - Fuel and tiredness management
  - Good fishing spot detection (40-80ft optimal)
  - Press X to start fishing at current location
  - Minimap with player position indicator

#### GameScene.js (748 lines)
- **Purpose:** Main fishing sonar view and game logic orchestrator
- **Responsibilities:**
  - Initialize and manage 6 game systems
  - Fish and baitfish entity management
  - Lure physics coordination
  - Fish fight mode transitions
  - Registry data management (depth, mode, fishing type)
- **Architecture:** Systems-based (see below)

#### GameOverScene.js (369 lines)
- **Purpose:** Results and session summary
- **Features:**
  - Fish caught/lost statistics
  - Final score display
  - Largest catch highlight
  - Replay or return to menu options

#### UIScene.js (68 lines)
- **Purpose:** HUD overlay
- **Displays:**
  - Score and statistics
  - Fish caught/lost count
  - Lure depth and speed
  - Current depth zone
  - Game timer (countdown in arcade, count-up in unlimited)
  - Water temperature
  - Fuel/tiredness meters (mode-dependent)

### 2. Game Systems Architecture (`/src/scenes/systems/`)

GameScene delegates to 6 focused systems (down from monolithic 1,519 lines):

#### SpawningSystem (~200 lines)
- Fish spawning with species selection and depth validation
- Baitfish cloud spawning with species diversity
- Zooplankton spawning near lake bottom
- Emergency fish spawning (arcade mode, <30 seconds)
- Species spawn weight calculation
- Depth compatibility checks

#### InputSystem (~250 lines)
- Keyboard input handling (arrows, space, shift, etc.)
- Gamepad API integration (L2/R2, sticks, d-pad, buttons)
- Mode-specific control mapping
- Dead zone handling (20%)
- Jigging control (right stick)

#### CollisionSystem (~130 lines)
- Cloud splitting when lure passes through (50% chance)
- Cloud merging when within 80px
- Prevents cloud explosion and fragmentation
- Manages cloud lifecycle

#### DebugSystem (~100 lines)
- Detection range visualization (yellow circles)
- Strike distance visualization (red circles)
- Fish state color coding
- Connection lines to lure
- Baitfish flock visualization
- Toggle with Square/X button

#### ScoreSystem (~150 lines)
- Score accumulation and display
- Fish caught/lost tracking
- Achievement checking
- Arcade timer (2-minute countdown)
- Game over condition detection

#### NotificationSystem (~200 lines)
- Catch notifications with tween animations
- Pause menu UI
- Game mode messages
- Achievement unlocked displays
- Fade in/out effects

### 3. Entity System (`/src/entities/`)

Object-oriented entity classes for all game objects:

#### Fish.js (1,145 lines)
- Fish entity with species-specific rendering
- 5 predator species: Lake Trout, Northern Pike, Smallmouth Bass, Yellow Perch (Large/Juvenile)
- Size categories: SMALL, MEDIUM, LARGE, TROPHY (2-40 lbs)
- Biological stats: hunger, health, age, temperature preferences
- Individual personality traits (alertness, aggressiveness)
- Depth preferences (species and seasonal)
- Anatomically correct colors and features per species

#### FishAI.js (896 lines)
- Complex 7-state machine:
  - IDLE - Cruising, monitoring environment
  - INTERESTED - Investigating lure
  - CHASING - Active pursuit
  - STRIKING - Attack lunge
  - FLEEING - Escape behavior
  - HUNTING_BAITFISH - Pursuing prey
  - FEEDING - Post-consumption pause
- Interest scoring system (distance, speed, depth, hunger, frenzy)
- Frenzy mechanics (competitive feeding)
- Species-specific behaviors:
  - Pike ambush (patrol, patience, burst)
  - Bass circling (35px radius investigation)
  - Trout pursuit (classic chase)
- Depth zone modifiers
- Temperature effects on behavior

#### FishFight.js (717 lines)
- Catch minigame mechanics
- Line tension system (0-100, break at 95)
- Rapid tapping gameplay (R2/spacebar)
- Fish tiredness simulation
- Weight-based pull force
- Gamepad haptic feedback (tension-based rumble)
- Line break conditions and recovery
- Success/failure outcomes

#### Lure.js (310 lines)
- Player-controlled fishing lure
- States: SURFACE, DROPPING, RETRIEVING, IDLE
- Physics: gravity-based drop (0.15 acceleration), max speed 3.5
- Adjustable retrieve speed (0.5-5.0)
- Jigging control via right stick (±20 pixel range)
- Visual feedback: orange color with trail effect
- Depth tracking with real-time display
- Collision detection with lake bottom

#### Baitfish.js (638 lines)
- Natural prey entities with 5 species:
  - Alewife (dense schools 20-50, silvery)
  - Rainbow Smelt (tight schools 10-30, fastest)
  - Slimy Sculpin (solitary 1-3, bottom-dwelling)
  - Cisco/Lake Herring (15-40, RARE, large prey)
  - Yellow Perch Juvenile (medium schools 8-20)
- **3-rule flocking behavior** (boids algorithm):
  1. Separation - Avoid crowding (12px radius)
  2. Cohesion - Stay near neighbors (50px radius)
  3. Alignment - Match velocity with neighbors
- Panic response when predators approach
- Scatter when threatened
- Hunting mode (target zooplankton)
- Boundary detection (surface penalty)
- Species-specific speeds and schooling densities

#### BaitfishCloud.js (464 lines)
- Spawns groups of 5-50 baitfish (species-dependent)
- Cloud center tracking and movement
- Scared level management (affects spread)
- Cloud splitting logic (lure interaction)
- Cloud merging (proximity-based)
- Cloud despawning (compressed or empty)
- Species selection with spawn rate multipliers
- Drift mechanics

#### Zooplankton.js (180 lines)
- Bottom-dwelling organisms
- Food source for baitfish
- Slow drift behavior (0.1-0.3 speed)
- Consumption tracking
- Age-based despawning
- Spawns near lake bottom (100-150ft)

#### FishingLine.js (114 lines)
- Fishing line visual rendering
- Connects lure to surface/player position
- Curved line segments
- Tension visualization

#### FishingLineModel.js (142 lines)
- Fishing line physics model
- Spring-based line behavior
- Catenary curve calculations

### 4. Managers (`/src/managers/`)

#### IceHoleManager.js (391 lines)
- Multi-hole drilling system
- 4 drill charges (5 total holes)
- Movement mode: walk between holes (Triangle/Y)
- Lake bed profile generation
- Depth variation: 120-150 feet (location-dependent)
- Player world position tracking
- Ice hole visualization on sonar
- Drill sound effects (when implemented)

#### BoatManager.js (394 lines)
- Kayak movement physics:
  - Paddle speed control
  - Tiredness meter (drains while moving, recovers at rest)
  - Cannot move when tiredness >80%
  - Realistic water resistance
- Motor boat movement physics:
  - Fast navigation
  - Gas tank management (consume when moving, regenerate when idle)
  - Higher speed capability
- Lake bed profile generation (x=0-10000 range)
- Bathymetric data integration
- Player world position management
- Starting position selection

### 5. Utilities (`/src/utils/`)

#### GamepadManager.js (239 lines)
- Native HTML5 Gamepad API implementation
- Supports PS4/PS5, Xbox, 8BitDo controllers
- 60fps polling via requestAnimationFrame
- Haptic feedback/rumble support
- Dead zone handling (20%)
- Connection/disconnection detection
- Button state tracking
- Analog stick position reading

#### SonarDisplay.js (521 lines)
- Retro sonar/fish finder visualization
- Rendering features:
  - Green phosphor grid (realistic CRT appearance)
  - Lake bottom profile rendering
  - Thermocline layers (25ft, 45ft, 85ft in summer)
  - Noise particles (static effect)
  - Depth markers every 10 feet
  - Dynamic scaling based on actual water depth
- Real-time entity rendering:
  - Fish (size and state-based colors)
  - Baitfish clouds (density visualization)
  - Zooplankton (small dots)
  - Lure (with trail)
  - Fishing line
- Performance optimizations (limited entity count)

#### BathymetricData.js (410 lines)
- Full Lake Champlain coverage (20,000 × 60,000 units)
- Based on NOAA charts 14781-14784
- 500-unit grid resolution
- Dynamic depth calculations for any position
- Bilinear interpolation for smooth depth transitions
- Good fishing spot finder (depth range filtering)
- Realistic bathymetric contours
- Major lake features (Burlington Bay, Valcour Island, etc.)

#### Constants.js (75 lines)
- Global game constants
- Fish state enumeration
- Lure state enumeration
- Shared configuration values

### 6. Configuration (`/src/config/`)

#### GameConfig.js (165 lines)
- Centralized game settings
- Key configurations:
  - Canvas size: 900×630
  - Max depth: 150 feet (default, overridden by bathymetry)
  - Depth scale: 3.6 pixels/foot
  - Fish spawn rate: 0.008/frame (0.8% per frame)
  - Baitfish cloud spawn: 0.004/frame
  - Lure physics constants
  - Fish fight mechanics
  - Color scheme (green phosphor sonar theme)
  - Depth zones with behavior modifiers
  - Water temperature range: 38-45°F (winter)

#### SpeciesData.js (924 lines) - *Comprehensive species database*
- **Predator species (5):** Lake Trout, Northern Pike, Smallmouth Bass, Yellow Perch Large/Juvenile
- **Baitfish species (5):** Alewife, Rainbow Smelt, Slimy Sculpin, Cisco, Yellow Perch Juvenile
- Each species includes:
  - Spawn weights (probability distribution)
  - Size categories with weight ranges
  - Depth preferences (seasonal variation)
  - Temperature preferences (optimal and ranges)
  - Diet composition (predators only)
  - Behavioral characteristics
  - Activity patterns by time of day
  - Habitat preferences
  - Fight mechanics (predators)
  - Schooling behavior (baitfish)
  - Visual appearance data
- Configuration-driven design for easy species tuning

## Game Flow

```
Start Application
    ↓
BootScene (Title Screen)
    ↓ (Press SPACE or X button)
MenuScene (Select Mode)
    ├─ Ice Fishing + Arcade
    ├─ Ice Fishing + Unlimited
    ├─ Kayak + Arcade
    ├─ Kayak + Unlimited
    ├─ Motor Boat + Arcade
    └─ Motor Boat + Unlimited
    ↓ (Select and confirm)
NavigationScene (Top-Down Lake Map)
    ├─ Navigate to fishing spot
    ├─ View depth at position
    ├─ Manage fuel/tiredness
    └─ Press X to start fishing
    ↓ (Start fishing)
GameScene + UIScene Launch (Parallel)
    ↓
Main Game Loop (60 FPS)
    ├─ Continuous fish/baitfish/zooplankton spawning
    ├─ Player controls lure
    ├─ Fish AI evaluation and pursuit
    ├─ Baitfish flocking and hunting
    ├─ Detection & strikes
    ├─ FishFight mode
    │   └─ Reel in fish → Return to fishing
    ├─ Score tracking
    └─ Game mode conditions (timer, unlimited)
    ↓ (Game ends: timer expires or player quits)
GameOverScene (Results)
    ↓
Return to MenuScene or NavigationScene
```

## Game Features

### Fishing Modes (3 Types)

#### Ice Fishing (Winter)
- Static ice holes on frozen lake surface
- Drill new holes (4 charges, 5 total holes max)
- Walk between holes (Triangle/Y button to toggle movement)
- Battery-limited drilling
- Realistic ice fishing experience
- Depth ranges: 120-150 feet (location-dependent)

#### Kayak Fishing (Summer)
- Paddle freely around lake
- Tiredness meter system:
  - Drains while paddling
  - Recovers when stationary
  - Cannot move when >80% tired
- Slower, exploration-focused
- Starting depth: 70-120 feet
- Warmer water (affects fish behavior)

#### Motor Boat Fishing (Summer)
- Fast navigation across lake
- Gas tank management:
  - Consumes gas while moving
  - Regenerates slowly when idle
  - Game over if gas depleted
- Quick repositioning
- Starting position: docks (shallow water)
- Move toward deep water for better fishing

### Game Modes (2 Types)

#### Arcade Mode
- 2-minute time limit
- Emergency fish spawn when <30 seconds remain
- Score-focused gameplay
- Countdown timer in UI
- Fast-paced action
- Leaderboard comparison

#### Unlimited Mode
- No time limit
- Relaxed, exploration-focused
- Count-up timer shows session duration
- Casual fishing experience
- Focus on catching variety

### Species System (10 Total Species)

**See SpeciesData.js for complete details**

#### Predator Fish (5 species)

1. **Lake Trout** (50% spawn weight)
   - Pursuit hunter, cold-water specialist
   - Depth: 40-100ft (winter), deeper in summer
   - Temperature: Optimal 50°F, range 38-52°F
   - Size: 2-40 lbs (Small/Medium/Large/Trophy)
   - Diet: Alewife (55%), smelt (25%), sculpin (8%), perch (8%), cisco (4%)
   - Behavior: Thermocline aware, deep dives during fight

2. **Northern Pike** (25% spawn weight)
   - AMBUSH predator with explosive strikes
   - Depth: 5-30ft (shallow structure lover)
   - Temperature: Optimal 65°F, range 50-75°F
   - Behavior: Patrols ambush points, burst speed 2.5x
   - Strike range: 60 pixels (extended)
   - Fight: Powerful initial run, head shaking

3. **Smallmouth Bass** (15% spawn weight)
   - ACTIVE predator, circles before striking
   - Depth: 10-50ft (rocky structure)
   - Temperature: Optimal 68°F, range 55-78°F
   - Behavior: Investigates with 35px radius circles (up to 2 seconds)
   - Fight: HIGHLY ACROBATIC (40% jump chance)
   - Line-shy but opportunistic

4. **Yellow Perch - Large** (10% spawn weight)
   - BEGINNER-FRIENDLY (easiest to catch)
   - Depth: 15-35ft
   - Schools by size
   - Active all day (unlike other species)
   - Fight: Easy, weak resistance

5. **Yellow Perch - Juvenile** (Baitfish)
   - 4-8 inches, becomes prey for larger fish
   - Structure-oriented, loose schools

#### Baitfish Species (5 types)

1. **Alewife** - Most abundant, dense schools (20-50), silvery
2. **Rainbow Smelt** - Fastest (3.0 panic speed), tight schools (10-30), cold-water
3. **Slimy Sculpin** - Bottom-dwelling, solitary (1-3), slowest, nocturnal
4. **Cisco/Lake Herring** - RARE (0.1× spawn), large prey (8-16"), dense schools
5. **Yellow Perch - Juvenile** - Medium schools (8-20), structure-oriented

### Fish AI System (7-State Machine)

**See FISH_BEHAVIOR_GUIDE.md for complete mechanics**

```
State Machine Flow:
IDLE → INTERESTED → CHASING → STRIKING → (Caught or Fleeing)
  ↓        ↑
HUNTING_BAITFISH → FEEDING → IDLE
```

#### State Descriptions

- **IDLE:** Cruising, monitoring for lures and prey
- **INTERESTED:** Noticed lure, cautious approach, observing
- **CHASING:** Committed pursuit, fast swimming
- **STRIKING:** Attack lunge, close-range strike attempt
- **FLEEING:** Spooked, swimming away from danger
- **HUNTING_BAITFISH:** Pursuing baitfish/zooplankton for food
- **FEEDING:** Stationary, consuming prey

#### Species-Specific AI

- **Pike:** Ambush behavior (patrol 50px, patience timer, burst)
- **Bass:** Circling behavior (35px radius, clockwise/counter-clockwise)
- **Trout:** Classic pursuit with depth preference
- **Perch:** Aggressive for size, easy to trigger

### Baitfish Flocking (3-Rule Boids)

#### Flocking Rules

1. **Separation** (12px radius)
   - Avoid crowding neighbors
   - Prevents overlapping
   - Maintains personal space

2. **Cohesion** (50px radius)
   - Stay near group center
   - Forms tight schools
   - Boundary penalty at surface (70% reduction)

3. **Alignment**
   - Match velocity with neighbors
   - Creates synchronized movement
   - Smooth group behavior

#### Panic Response

- Triggered by predator approach
- Speed multiplier: 2.5-3.5× (species-dependent)
- Scatter behavior
- Increased separation weight
- Darker coloring (visual feedback)

#### Hunting Behavior

- Target zooplankton at lake bottom
- Persistent target locking (120+ frames)
- Multi-competitor awareness
- Consumption-based feeding

### Cloud Interaction System

#### Cloud Splitting

- Triggered when lure passes through cloud
- 50% chance to split
- Creates two separate clouds
- Prevents unrealistic static formations
- Managed by CollisionSystem

#### Cloud Merging

- Automatically merges clouds within 80 pixels
- Combines baitfish into single cloud
- Prevents cloud explosion
- Keeps entity count manageable

#### Cloud Despawning

- Compressed clouds despawn instead of splitting infinitely
- Empty clouds (all baitfish consumed) are removed
- Age-based despawning for very old clouds

## Input System

### Keyboard Controls

**Normal Fishing:**
- Arrow Keys: Adjust retrieve speed
- Spacebar: Drop lure / Reel in fish (during fight)
- Shift: Retrieve lure
- T: Toggle ice hole movement mode (ice fishing)
- M: Move to next hole (ice fishing, movement mode)
- D: Drill new hole (ice fishing)
- R: Reset game (dev)
- Esc: Pause
- P: Pause menu

**Navigation (NavigationScene):**
- Arrow Keys / WASD: Move kayak/motorboat
- X: Start fishing at current position

### Gamepad Controls (Standard Mapping)

**Normal Fishing:**
- L2 Trigger: Hold to drop lure
- R2 Trigger: Hold to retrieve lure (variable speed)
- Right Stick Y-Axis: Jigging control (up/down, ±20 pixels)
- D-Pad Left/Right: Adjust retrieve speed
- Triangle (PS) / Y (Xbox): Toggle ice hole movement mode
- Square (PS) / X (Xbox): Drill hole (ice) / Toggle debug (dev)
- Options/Menu: Pause

**Fish Fight:**
- R2 Trigger or Spacebar: Rapid tap to reel (50ms min interval)
- Haptic Feedback:
  - Tension >90%: Strong rumble (intensity 1.0)
  - Tension >70%: Medium rumble (intensity 0.5)
  - Each reel: Light pulse (intensity 0.3, 100ms)

**Navigation:**
- Left Stick: Move kayak/motorboat
- R2: Increase speed (uses fuel/tiredness)
- X: Start fishing

## Technologies Used

### Core Dependencies

- **Phaser 3.80.1** - Game engine (loaded from CDN)
- **http-server 14.1.1** - Development server (dev dependency only)

### Browser APIs

- **Gamepad API** - Controller support with haptic feedback
- **Canvas 2D** - Rendering (no WebGL required)
- **Web Audio API** - Audio support (structure ready, sounds not implemented)
- **LocalStorage** - UI state persistence
- **requestAnimationFrame** - Game loop timing (60 FPS target)

### Build System

- **None** - ES6 modules run directly in browser
- No transpilation required
- No bundler needed
- Development workflow: `npm start` → http://localhost:8080

## Development Tools

### Integrated Dev Panel (index.html)

Located in the main HTML file:
- **Spawn Fish Button** - Add single fish at random depth
- **Spawn 5 Fish Button** - Add multiple fish quickly
- **Reset Game** - Restart current session
- **Toggle Debug Viz** - Show/hide debug overlays
- **Fish Status Panel** - Real-time fish stats (updates every 100ms)
  - Grouped by depth zone (Surface/Mid-Column/Bottom)
  - Individual fish details: species, weight, state, hunger, health, frenzy
  - Baitfish cloud count and sizes

### Debug Visualization (DebugSystem)

When enabled (Square/X button), shows:
- Fish detection ranges (yellow circles, 150px)
- Vertical detection ellipses (280px)
- Strike distance (red circles, 25px)
- Fish state indicators (color-coded):
  - Gray: IDLE
  - Yellow: INTERESTED
  - Orange: CHASING
  - Red: STRIKING
  - Blue: FLEEING
- Movement vectors
- Lure attraction zones
- Connection lines (fish to lure)
- Baitfish flock visualization

### Controller Test Page (gamepad-test.html)

- Visual button state display (all 16+ buttons)
- Analog stick position readout (both sticks)
- Trigger pressure visualization (L2/R2)
- Button mapping verification
- Connection diagnostics
- Haptic feedback testing

### Console Logging

Extensive logging for debugging:
- Game mode and fishing type selection
- Fish spawn depth and species
- Species selection logs with spawn weights
- System initialization confirmation
- Collision detection events (cloud split/merge)
- Depth validation warnings
- Registry data flow (NavigationScene → GameScene)

## Code Architecture Patterns

### 1. Systems-Based Architecture

- GameScene acts as lightweight orchestrator (~748 lines)
- 6 focused systems handle specific responsibilities:
  - SpawningSystem (~200 lines)
  - InputSystem (~250 lines)
  - CollisionSystem (~130 lines)
  - DebugSystem (~100 lines)
  - ScoreSystem (~150 lines)
  - NotificationSystem (~200 lines)
- Each system: ~100-250 lines, single responsibility
- Clear interfaces between systems
- Easy to test and maintain

### 2. Entity-Component Pattern

- Each game object (Fish, Lure, Baitfish) is a class
- Components handle specific behaviors:
  - FishAI (state machine, decision-making)
  - Baitfish (flocking, panic, hunting)
  - Lure (physics, states)
- Clear separation of concerns
- Reusable components

### 3. State Machine Pattern

- **Fish AI:** 7-state machine with transition guards
- **Lure:** 4 states (SURFACE, DROPPING, RETRIEVING, IDLE)
- Clear state transitions
- State-specific behavior methods
- Debug visualization of current states

### 4. Configuration-Driven Design

- GameConfig.js centralizes all game constants
- SpeciesData.js defines all species behaviors
- Easy balance tweaking without code changes
- Clear documentation of game rules
- Enables data-driven content expansion

### 5. Scene-Based Architecture

- Phaser scenes separate major game modes:
  - Boot (loading)
  - Menu (mode selection)
  - Navigation (lake map)
  - Game (fishing)
  - GameOver (results)
  - UI (overlay)
- Clear responsibility boundaries
- Parallel scene rendering (Game + UI)
- Scene transitions managed by Phaser

### 6. Data Flow Architecture

```
NavigationScene
    ↓ (Registry)
    └─ fishingType (ice/kayak/motorboat)
    └─ gameMode (arcade/unlimited)
    └─ currentDepth (actual depth at position)
    └─ playerWorldX/Y (lake position)
    ↓
GameScene
    ├─ Reads registry data
    ├─ Sets maxDepth from currentDepth
    ├─ Initializes systems with config
    └─ Manages entity lifecycle
```

## File Size Distribution

```
Largest Files (by lines of code):

1. NavigationScene.js   - 2,146 lines (top-down map, bathymetry integration)
2. Fish.js              - 1,145 lines (5 species rendering, biological stats)
3. SpeciesData.js       - 924 lines (10 species definitions, comprehensive)
4. FishAI.js            - 896 lines (7-state machine, species behaviors)
5. GameScene.js         - 748 lines (orchestrator, systems management)
6. FishFight.js         - 717 lines (catch minigame, haptics)
7. Baitfish.js          - 638 lines (flocking, hunting, panic)
8. SonarDisplay.js      - 521 lines (retro sonar rendering)
9. BaitfishCloud.js     - 464 lines (cloud management, splitting/merging)
10. MenuScene.js        - 446 lines (mode selection UI)

Total: ~11,700 lines across 30 files
```

## Performance Considerations

- **Target FPS:** 60
- **Entity Management:**
  - Fish: Soft limit ~4-6 active (spawn rate controlled)
  - Baitfish: 5-50 per cloud, multiple clouds
  - Zooplankton: Unlimited (age-based despawning)
  - Cloud merging prevents entity explosion
- **Rendering Optimizations:**
  - Canvas 2D (performant for 2D)
  - Depth-based layering (graphics.setDepth())
  - Limited trail rendering
  - Sonar phosphor effect (optimized)
- **AI Performance:**
  - State machine (efficient, O(1) transitions)
  - Distance checks (minimal computation)
  - Frenzy detection (simple neighbor counting)
- **Flocking Performance:**
  - Radius-based neighbor detection
  - Limited neighbor count checks
  - Efficient vector math
  - Boundary detection optimizations

## Lake Champlain Theme

The game authentically represents fishing on Lake Champlain:

- **Bathymetric Data:** Full lake coverage from NOAA charts
- **Depth Accuracy:** 0-400 feet (realistic lake depth)
- **Fish Species:** All species native to Lake Champlain
  - Lake trout (thermocline behavior, 40-100ft preference)
  - Northern pike (shallow structure, 5-30ft)
  - Smallmouth bass (rocky areas, 10-50ft)
  - Yellow perch (versatile, 15-35ft)
- **Baitfish:** Actual lake trout prey species
  - Alewife (primary forage, invasive)
  - Rainbow smelt (native, cold-water)
  - Slimy sculpin (bottom-dwelling, native)
  - Cisco (native, rare)
  - Yellow perch (native, abundant)
- **Water Temperature:** 38-45°F (realistic winter/spring)
- **Lake Facts:** Displayed in BootScene (education)
- **Locations:** Named areas (Burlington Bay, Valcour Island, etc.)

## Code Quality

### Strengths

- ✅ Well-organized modular structure (30 files, clear hierarchy)
- ✅ Comprehensive code comments and JSDoc
- ✅ Systems-based architecture (single responsibility)
- ✅ Configuration-driven design (easy tuning)
- ✅ No unnecessary dependencies (minimal footprint)
- ✅ Realistic physics simulation (gravity, line tension, flocking)
- ✅ Complex but readable AI system (state machine pattern)
- ✅ Species-specific behaviors (polymorphism)
- ✅ Built-in development tools (debug viz, dev panel)
- ✅ Extensive inline documentation

### Areas for Future Enhancement

- No automated testing (manual playtesting only)
- No persistent save system (localStorage ready)
- No sound effects (Web Audio API enabled but unused)
- No multiplayer support
- Could benefit from TypeScript conversion (type safety)
- No achievement persistence
- No analytics/telemetry

## Testing Approach

### Manual Testing Tools

- Dev panel spawn buttons (test fish immediately)
- Debug visualization mode (AI states, detection ranges)
- Controller test page (gamepad diagnostics)
- Real-time fish status monitoring (dev panel)
- Console logging (depth, species, spawning, collisions)

### Testing Workflow

1. Use dev panel to spawn fish
2. Enable debug visualization
3. Observe fish AI states and decisions
4. Test lure interactions
5. Verify species-specific behaviors
6. Check flocking with multiple baitfish clouds
7. Test all 6 game mode combinations

### No Automated Tests

- No unit tests currently (manual testing only)
- No integration tests
- No end-to-end tests
- Manual playtesting required for all changes
- Consider adding Jest for future development

## Future Testing Recommendations

1. **Unit Tests** (Jest)
   - FishAI state transitions
   - Interest score calculations
   - Flocking rule algorithms
   - Species spawn weight selection
   - Depth validation logic

2. **Integration Tests**
   - System interactions (spawning → AI → collision)
   - Scene transitions (Menu → Navigation → Game)
   - Registry data flow
   - Entity lifecycle management

3. **Visual Regression Tests**
   - Sonar display rendering
   - Fish species appearances
   - Baitfish flocking formations

## Summary

Wolfpack is a well-architected fishing simulation with:

- **Professional code organization:** 11,700 lines across 30 focused files
- **Systems-based architecture:** 6 modular systems, single responsibility
- **Sophisticated AI:** 7-state machine with species-specific behaviors
- **Realistic ecosystem:** 10 species, flocking baitfish, zooplankton food web
- **Full gamepad integration:** Haptic feedback, analog controls
- **Multiple game modes:** 6 combinations (3 fishing × 2 game modes)
- **Authentic Lake Champlain:** Real bathymetric data, native species
- **Excellent development tools:** Debug visualization, dev panel, controller test
- **No bloat:** Only essential dependencies (Phaser 3)
- **Ready for expansion:** Clear extension points, modular design

The codebase demonstrates good software engineering practices with clean separation of concerns, configuration-driven design, and comprehensive commenting. The systems-based refactor has created a maintainable, testable architecture ready for continued development.

**Current Focus:** Baitfish behaviors, flocking mechanics, species diversity, cloud interactions
**Recent Achievements:** 5 predator species, 5 baitfish species, 3-rule flocking, full Lake Champlain bathymetry
**Status:** Active development, stable core mechanics, successful demo deployment
