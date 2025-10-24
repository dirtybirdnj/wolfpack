# Wolfpack - Project Structure

## Overview

**Wolfpack** is a realistic Lake Champlain ice fishing sonar simulator built with Phaser 3. The game simulates ice fishing for lake trout with sophisticated fish AI, realistic physics, and full gamepad support with haptic feedback.

- **Language:** JavaScript (ES6+ modules)
- **Framework:** Phaser 3.80.1
- **Total Lines of Code:** ~4,139 across 15 source files
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
└── src/                           # Source code directory
    ├── index.js                   # Game initialization (282 lines)
    ├── config/
    │   └── GameConfig.js          # Game constants & settings (132 lines)
    ├── scenes/
    │   ├── BootScene.js           # Title screen (192 lines)
    │   ├── GameScene.js           # Main game loop (895 lines)
    │   └── UIScene.js             # HUD overlay (68 lines)
    ├── entities/
    │   ├── Fish.js                # Fish entity & rendering (391 lines)
    │   ├── FishAI.js              # Fish behavior AI (560 lines)
    │   ├── FishFight.js           # Catch minigame (308 lines)
    │   ├── Lure.js                # Player lure mechanics (235 lines)
    │   ├── Baitfish.js            # Prey fish entities (176 lines)
    │   └── BaitfishCloud.js       # Baitfish spawning (175 lines)
    ├── managers/
    │   └── IceHoleManager.js      # Ice hole drilling (350 lines)
    └── utils/
        ├── GamepadManager.js      # Controller support (287 lines)
        ├── SonarDisplay.js        # Sonar rendering (295 lines)
        └── Constants.js           # Game constants (75 lines)
```

## Core Systems

### 1. Scene Management (`/src/scenes/`)

The game uses Phaser's scene system with three main scenes:

#### BootScene.js (192 lines)
- **Purpose:** Title screen and asset loading
- **Features:**
  - Displays Lake Champlain facts
  - Gamepad connection detection
  - Asset preloading (procedurally generated)
  - Start game with SPACE or gamepad X button

#### GameScene.js (895 lines) - *Largest file*
- **Purpose:** Main game logic and update loop
- **Responsibilities:**
  - Fish spawning and management
  - Player input handling (keyboard + gamepad)
  - Lure physics simulation
  - Collision detection
  - Fish fight mode coordination
  - Score tracking
  - Debug visualization
- **Update Loop Priority:**
  1. Ice hole manager
  2. Sonar display rendering
  3. Input processing
  4. Physics updates
  5. Entity updates
  6. Spawning logic
  7. Debug rendering (optional)

#### UIScene.js (68 lines)
- **Purpose:** HUD overlay
- **Displays:**
  - Score and statistics
  - Fish caught/lost count
  - Lure depth and speed
  - Current depth zone
  - Game timer
  - Water temperature

### 2. Entity System (`/src/entities/`)

Object-oriented entity classes for all game objects:

#### Fish.js (391 lines)
- Fish entity with rendering
- Size categories: SMALL, MEDIUM, LARGE, TROPHY (2-40 lbs)
- Biological stats: hunger, health, age
- Individual personality traits
- Depth preferences
- Visual representation with anatomically correct colors

#### FishAI.js (560 lines)
- Complex state machine with 7 behavioral states
- Interest scoring system
- Frenzy mechanics
- Hunting behavior for baitfish
- Depth zone modifiers
- See FISH_BEHAVIOR_GUIDE.md for details

#### Lure.js (235 lines)
- Player-controlled fishing lure
- States: SURFACE, DROPPING, RETRIEVING, IDLE
- Physics: gravity-based drop, adjustable retrieve
- Jigging control via right stick
- Visual feedback: orange color with trail effect
- Depth tracking (0-150 feet)

#### FishFight.js (308 lines)
- Catch minigame mechanics
- Line tension system (0-100)
- Rapid tapping gameplay
- Fish tiredness simulation
- Gamepad haptic feedback
- Line break conditions

#### Baitfish.js (176 lines)
- Natural prey entities (alewives)
- Schooling behavior
- Scatter when threatened
- Fish food source

#### BaitfishCloud.js (175 lines)
- Spawns groups of 5-20 baitfish
- Cloud drift mechanics
- Spawn rate: ~every 2 seconds
- Attracts fish when hungry

### 3. Managers (`/src/managers/`)

#### IceHoleManager.js (350 lines)
- Multi-hole drilling system
- 4 drill charges (5 total holes)
- Movement mode: walk between holes
- Lake bed profile generation
- Depth variation: 120-150 feet
- Player world position tracking

### 4. Utilities (`/src/utils/`)

#### GamepadManager.js (287 lines)
- Native HTML5 Gamepad API implementation
- Supports PS4/PS5, Xbox, 8BitDo controllers
- 60fps polling via requestAnimationFrame
- Haptic feedback/rumble support
- Dead zone handling (20%)
- Connection detection
- See controls section below for button mapping

#### SonarDisplay.js (295 lines)
- Retro sonar/fish finder visualization
- Rendering features:
  - Green phosphor grid
  - Lake bottom profile
  - Thermocline layers (25, 45, 85 ft)
  - Noise particles (static)
  - Depth markers
  - Real-time entity rendering

#### Constants.js (75 lines)
- Global game constants
- Fish states enumeration
- Lure states enumeration
- Shared configuration values

### 5. Configuration (`/src/config/`)

#### GameConfig.js (132 lines)
- Centralized game settings
- Key configurations:
  - Canvas size: 1000x700
  - Max depth: 150 feet
  - Fish spawn rate: 0.008/frame
  - Lure physics constants
  - Fish fight mechanics
  - Color scheme
  - Depth zones
  - Water temperature range: 38-45°F

## Game Flow

```
Start Application
    ↓
BootScene (Title Screen)
    ↓ (Press SPACE or X button)
GameScene + UIScene Launch (Parallel)
    ↓
Main Game Loop (60 FPS)
    ├─ Continuous fish spawning
    ├─ Player controls lure
    ├─ Fish AI evaluation
    ├─ Detection & pursuit
    ├─ Strike → FishFight mode
    │   └─ Reel in fish → Return to fishing
    └─ Optional: Movement mode for new ice holes
```

## Input System

### Keyboard Controls
- **Arrow Keys:** Adjust retrieve speed
- **Spacebar:** Reel in fish (during fight) / Drop lure
- **Shift:** Retrieve lure
- **T:** Toggle ice hole movement mode
- **M:** Move between holes (in movement mode)
- **D:** Drill new hole

### Gamepad Controls (Standard Mapping)

**Normal Fishing:**
- **L2 Trigger:** Drop lure (hold)
- **R2 Trigger:** Retrieve lure (hold)
- **Right Stick Y-Axis:** Jigging control (up/down)
- **D-Pad Left/Right:** Adjust retrieve speed
- **Triangle (PS) / Y (Xbox):** Toggle movement mode
- **Square (PS) / X (Xbox):** Drill hole (in movement mode)

**Fish Fight:**
- **R2 Trigger or Spacebar:** Rapid tap to reel (50ms min interval)
- **Haptic Feedback:**
  - Tension >90%: Strong rumble
  - Tension >70%: Medium rumble
  - Each reel: Light rumble

## Technologies Used

### Core Dependencies
- **Phaser 3.80.1** - Game engine
- **http-server 14.1.1** - Development server (only dev dependency)

### Browser APIs
- **Gamepad API** - Controller support
- **Canvas 2D** - Rendering
- **Web Audio API** - Audio support (ready but unused)
- **LocalStorage** - UI state persistence
- **requestAnimationFrame** - Game loop timing

### Build System
- **None** - ES6 modules run directly in browser
- No transpilation required
- No bundler needed
- Development workflow: `npm start` → http://localhost:8080

## Development Tools

### Integrated Dev Panel (index.html)
Located in the main HTML file:
- **Spawn Fish Button** - Add single fish
- **Spawn 5 Fish Button** - Add multiple fish
- **Reset Game** - Restart game
- **Toggle Debug Viz** - Show fish detection ranges
- **Fish Status Panel** - Real-time fish stats (updates every 100ms)
  - Grouped by depth zone
  - Individual fish details: weight, state, hunger, health, frenzy

### Debug Visualization
When enabled, shows:
- Fish detection ranges (circular)
- Vertical detection ellipses
- Fish state indicators
- Movement vectors
- Lure attraction zones

### Controller Test Page (gamepad-test.html)
- Visual button state display
- Analog stick position readout
- Trigger pressure visualization
- Button mapping verification
- Connection diagnostics

## Code Architecture Patterns

### 1. Entity-Component Pattern
- Each game object (Fish, Lure, Baitfish) is a class
- Components handle specific behaviors (AI, physics, rendering)
- Clear separation of concerns

### 2. State Machine Pattern
- Fish AI uses 7-state machine (see FISH_BEHAVIOR_GUIDE.md)
- Lure has 4 states (SURFACE, DROPPING, RETRIEVING, IDLE)
- Clear state transitions with guards

### 3. Manager Pattern
- Dedicated managers for complex systems
- IceHoleManager handles drilling and movement
- GamepadManager handles input abstraction

### 4. Configuration-Driven Design
- GameConfig.js centralizes all constants
- Easy balance tweaking without code changes
- Clear documentation of game rules

### 5. Scene-Based Architecture
- Phaser scenes separate concerns
- Boot → Game → UI flow
- Parallel scene rendering (Game + UI)

## File Size Distribution

```
Largest Files (by lines of code):
1. GameScene.js      - 895 lines (main game loop)
2. FishAI.js         - 560 lines (behavior AI)
3. Fish.js           - 391 lines (entity)
4. IceHoleManager.js - 350 lines (drilling system)
5. FishFight.js      - 308 lines (minigame)
6. SonarDisplay.js   - 295 lines (rendering)
7. GamepadManager.js - 287 lines (input)
8. index.js          - 282 lines (initialization)
9. Lure.js           - 235 lines (player control)

Total: ~4,139 lines across 15 files
```

## Entry Points

### For Players
1. Run `npm install` (one-time setup)
2. Run `npm start`
3. Open http://localhost:8080
4. Press SPACE or connect gamepad and press X

### For Developers
- **Modify game balance:** Edit `/src/config/GameConfig.js`
- **Change fish behavior:** Edit `/src/entities/FishAI.js`
- **Add new fish states:** Update `Constants.FISH_STATE` and AI logic
- **Adjust visual style:** Edit CSS variables in `index.html`
- **Debug fish AI:** Enable debug visualization in dev panel

## Code Quality

### Strengths
- ✅ Well-organized module structure
- ✅ Comprehensive code comments
- ✅ Separation of concerns
- ✅ Configuration-driven design
- ✅ No unnecessary dependencies
- ✅ Realistic physics simulation
- ✅ Complex but readable AI system
- ✅ Built-in development tools

### Areas for Expansion
- No persistent save system
- No sound effects (structure ready)
- No multiplayer support
- Limited achievement system
- Could benefit from TypeScript conversion

## Testing

### Manual Testing Tools
- Dev panel spawn buttons
- Debug visualization mode
- Controller test page
- Real-time fish status monitoring

### No Automated Tests
- No unit tests currently
- No integration tests
- Manual playtesting required
- Consider adding Jest for future testing

## Performance Considerations

- **Target FPS:** 60
- **Entity Limits:** No hard cap on fish count (spawn rate controlled)
- **Rendering:** Canvas 2D (performant for 2D)
- **Physics:** Simple gravity and velocity calculations
- **AI:** State machine with distance checks (efficient)
- **Gamepad Polling:** 60fps polling (required by Gamepad API spec)

## Lake Champlain Theme

The game authentically represents ice fishing on Lake Champlain:
- 150-foot depth matches lake characteristics
- Lake trout prefer 40-100 feet (scientifically accurate)
- Water temp: 38-45°F (winter conditions)
- Baitfish are alewives (actual lake trout prey)
- Facts about the real lake included in BootScene

## Summary

This is a well-architected fishing simulation with:
- **Professional code organization** across 15 files
- **Sophisticated AI system** with realistic fish behavior
- **Full gamepad integration** with haptic feedback
- **Multiple interconnected systems** (fishing, ice holes, baitfish)
- **Excellent development tools** built into the game
- **No bloat** - only essential dependencies
- **Ready for expansion** with clear extension points

The codebase demonstrates good software engineering practices with clear separation of concerns, configuration-driven design, and comprehensive commenting.
