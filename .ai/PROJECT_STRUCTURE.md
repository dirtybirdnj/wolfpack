# Wolfpack - Lake Champlain Fishing Game - Project Structure

## Quick Reference

**Game Engine**: Phaser 3
**Language**: JavaScript (ES6+ modules)
**Architecture**: Scene-based with entity-component systems
**Canvas Size**: 1200x720 (GameConfig.CANVAS_WIDTH x CANVAS_HEIGHT)

## Project Layout

```
wolfpack/
├── src/
│   ├── config/           # Game configuration and constants
│   ├── scenes/           # Phaser scenes (game states)
│   │   ├── systems/      # Game systems (spawning, input, debug, etc.)
│   │   └── *.js          # Individual scenes
│   ├── entities/         # Game entities (fish, baitfish, lure, etc.)
│   ├── managers/         # Game mode managers (ice, boat, kayak)
│   ├── utils/            # Utility functions and constants
│   └── index.js          # Entry point
├── assets/               # Game assets (images, sounds, fonts)
└── .ai/                  # AI reference documentation
```

## Core Configuration Files

### `/src/config/GameConfig.js`
**Purpose**: Central configuration for all game constants

**Key Constants**:
```javascript
CANVAS_WIDTH: 1200,
CANVAS_HEIGHT: 720,
MAX_DEPTH: 400,  // feet (Lake Champlain max depth)
DEPTH_SCALE: 1.625,  // pixels per foot (dynamic, recalculated)

// Fishing Types
FISHING_TYPE_ICE: 'ice',
FISHING_TYPE_KAYAK: 'kayak',
FISHING_TYPE_MOTORBOAT: 'motorboat',
FISHING_TYPE_NATURE_SIMULATION: 'nature_simulation',

// Entity Radii
BAITFISH_CLOUD_RADIUS: 150,
FISH_DETECTION_RANGE: 350,
// ... many more
```

**When to modify**: Adding new game constants, changing canvas size, adding fishing types

### `/src/config/SpeciesData.js`
**Purpose**: Biological data for all fish and baitfish species

**Structure**:
```javascript
export const FISH_SPECIES = {
    lake_trout: {
        name: "Lake Trout",
        sizeRange: { min: 18, max: 36 },
        depthRange: { min: 60, max: 200 },
        speed: { base: 0.8, panic: 2.5, hunt: 2.2 },
        // ... behavior, appearance, etc.
    }
};

export const BAITFISH_SPECIES = {
    alewife: {
        name: "Alewife",
        sizeRange: { min: 2, max: 5 },
        depthRange: { min: 10, max: 80 },
        // ... behavior, appearance, etc.
    }
};
```

**When to modify**: Adding new species, adjusting fish behavior, changing spawn weights

### `/src/utils/Constants.js`
**Purpose**: Enums and utility functions

**Key Exports**:
```javascript
export const Constants = {
    FISH_STATE: {
        IDLE: 'idle',
        TRACKING: 'tracking',
        STRIKING: 'striking',
        HOOKED: 'hooked',
        HUNTING_BAITFISH: 'hunting_baitfish',
        FEEDING: 'feeding',
        FLEEING: 'fleeing'
    }
    // ... more state enums
};

export class Utils {
    static randomBetween(min, max) { /* ... */ }
    static calculateDistance(x1, y1, x2, y2) { /* ... */ }
    // ... more utilities
}
```

## Scene Files

### `/src/scenes/BootScene.js`
**Purpose**: Asset loading and initialization
**Transitions to**: MenuScene

### `/src/scenes/MenuScene.js`
**Purpose**: Main menu and game mode selection
**Key Features**:
- 7 game mode buttons (horizontal layout)
- Registry management for mode transitions
- Clears navigation data when starting ice fishing
**Transitions to**: NavigationScene, GameScene, NatureSimulationScene

### `/src/scenes/NavigationScene.js`
**Purpose**: Ice fishing - selecting ice hole location on lake map
**Key Features**:
- Shows Lake Champlain bathymetric map
- User selects location with depth 30-400ft
- Stores selection in registry
**Transitions to**: GameScene (ice mode)

### `/src/scenes/GameScene.js`
**Purpose**: Main gameplay scene (ice, kayak, boat fishing)
**Key Features**:
- Manages all three player fishing modes
- Spawning, input, debug, camera systems
- Fish AI, baitfish, lure physics
**Game Modes**:
- Ice fishing (stationary, deep water)
- Kayak fishing (paddle-able, shallow-mid water)
- Boat fishing (motor-driven, all water)
**Transitions to**: GameOverScene, MenuScene

### `/src/scenes/NatureSimulationScene.js`
**Purpose**: Nature simulation mode (no player, pure observation)
**Key Features**:
- Depth selection UI (10-100ft)
- Manual spawning (fish and baitfish)
- Info display
- Gamepad/keyboard controls
**Transitions to**: MenuScene

### `/src/scenes/GameOverScene.js`
**Purpose**: End game screen (when fish escapes or is caught)
**Transitions to**: MenuScene, GameScene (retry)

### `/src/scenes/UIScene.js`
**Purpose**: HUD overlay during gameplay
**Key Features**:
- Depth indicator
- Fish finder
- Line tension
- Catch statistics

## System Files (Scene Subsystems)

### `/src/scenes/systems/SpawningSystem.js`
**Purpose**: Spawns fish, baitfish clouds, and zooplankton
**Key Methods**:
- `spawnFish(speciesType, worldX, y)`: Spawn individual fish
- `spawnBaitfishCloud(speciesType)`: Spawn baitfish cloud with species
- `spawnZooplankton()`: Spawn bottom-dwelling zooplankton
**Nature Mode Detection**: Checks for `iceHoleManager` / `boatManager` absence

### `/src/scenes/systems/InputSystem.js`
**Purpose**: Handles keyboard and gamepad input
**Key Methods**:
- `update()`: Processes input every frame
- `handleReelInput()`: Reel in/out
- `handleJigInput()`: Jigging motion
**Gamepad Support**: Full Xbox/PlayStation controller mapping

### `/src/scenes/systems/DebugSystem.js`
**Purpose**: Debug overlays and diagnostics
**Key Features**:
- Toggle with backtick key
- Shows fish states, positions, velocities
- Baitfish cloud info
- Performance metrics

### `/src/scenes/systems/CameraSystem.js`
**Purpose**: Camera movement for boat/kayak modes
**Key Methods**:
- `update()`: Smooth camera follow
- `shake()`: Screen shake effects

## Entity Files

### Fish Entities

#### `/src/entities/Fish.js`
**Purpose**: Fish entity (visual representation and state)
**Key Properties**:
- `worldX`, `y`: Position (worldX = horizontal world coordinate, y = screen Y)
- `species`: Species type from SpeciesData
- `depth`: Depth in feet (calculated from y)
**Coordinate System**: Converts worldX to screen X based on player position (or direct in nature mode)

#### `/src/entities/FishAI.js`
**Purpose**: Fish behavior and decision-making
**Key Methods**:
- `update(lure, otherFish, baitfishClouds)`: Main AI loop
- `huntingBaitfishBehavior()`: Chase and eat baitfish
- `trackingLureBehavior()`: Follow player's lure
- `strikingBehavior()`: Strike at lure
**State Machine**: Uses Constants.FISH_STATE enum
**Nature Mode**: Handles null lure gracefully

### Baitfish Entities

#### `/src/entities/BaitfishCloud.js`
**Purpose**: Baitfish school (collection of individual baitfish)
**Key Properties**:
- `worldX`, `centerX`, `centerY`: Cloud center position
- `baitfish[]`: Array of Baitfish instances
- `velocity`: Cloud drift velocity
- `scaredLevel`: 0-1, affects behavior
- `spreadMultiplier`: Controls school tightness
**Key Methods**:
- `update(lakers, zooplankton)`: Update cloud position and behavior
- `checkForLakersNearby()`: Detect predators
- `consumeBaitfish()`: Remove eaten baitfish
**Nature Mode**: Uses `scene.maxDepth` for bottom depth

#### `/src/entities/Baitfish.js`
**Purpose**: Individual baitfish in a cloud
**Key Properties**:
- `worldX`, `x`, `y`: Position
- `cloudId`: Parent cloud ID
- `species`: Baitfish species
- `targetWorldX`, `targetY`: Schooling target
- `velocityX`, `velocityY`: Movement velocity
**Behavior**: 3 flocking rules (separation, cohesion, alignment)
**Nature Mode**: Critical coordinate conversion at lines 99-130

#### `/src/entities/Zooplankton.js`
**Purpose**: Bottom-dwelling food for baitfish
**Key Properties**:
- `worldX`, `x`, `y`: Position
- `consumed`: Whether eaten
**Behavior**: Drifts slowly along bottom

### Other Entities

#### `/src/entities/Lure.js`
**Purpose**: Player's fishing lure
**Key Features**:
- Physics simulation (weight, drag)
- Jigging motion
- Collision detection
**Only exists in**: Ice, kayak, boat modes (not nature simulation)

#### `/src/entities/FishingLine.js`
**Purpose**: Visual fishing line from lure to surface/rod
**Key Features**:
- Renders curved line
- Tension calculation
**Only exists in**: Ice, kayak, boat modes

## Manager Files

### `/src/managers/IceHoleManager.js`
**Purpose**: Manages ice fishing holes and navigation
**Key Methods**:
- `getCurrentHole()`: Get active ice hole
- `moveLeft()`, `moveRight()`: Navigate between holes
**Key Properties**:
- Each hole has `x` (world position) and `bottomProfile` (depth contour)

### `/src/managers/BoatManager.js`
**Purpose**: Manages boat/kayak movement and position
**Key Methods**:
- `getPlayerWorldX()`: Get boat's world position
- `getDepthAtPosition(worldX)`: Get bathymetric depth at position
- `move(direction, speed)`: Move boat
**Key Properties**:
- `playerWorldX`: Boat's world X position
- `bathymetricData`: Lake Champlain depth map

## Entry Point

### `/src/index.js`
**Purpose**: Phaser game initialization
**Key Code**:
```javascript
const config = {
    type: Phaser.AUTO,
    width: GameConfig.CANVAS_WIDTH,
    height: GameConfig.CANVAS_HEIGHT,
    backgroundColor: '#000000',
    scene: [
        BootScene,
        MenuScene,
        NavigationScene,
        GameScene,
        GameOverScene,
        UIScene,
        NatureSimulationScene  // Added for nature simulation
    ]
};

const game = new Phaser.Game(config);
```

## Common Patterns

### Scene Transitions
```javascript
this.scene.start('SceneName', { data: value });
```

### Registry (Persistent Data)
```javascript
// Set
this.registry.set('key', value);

// Get
const value = this.registry.get('key');
```

### Mode Detection
```javascript
const fishingType = this.registry.get('fishingType');
if (fishingType === GameConfig.FISHING_TYPE_ICE) {
    // Ice mode
} else if (fishingType === GameConfig.FISHING_TYPE_NATURE_SIMULATION) {
    // Nature mode
}

// OR check for managers:
if (this.scene.iceHoleManager) {
    // Ice mode
} else if (this.scene.boatManager) {
    // Boat/kayak mode
} else {
    // Nature simulation mode
}
```

### Spawning Entities
```javascript
// In scene
const fish = new Fish(this, worldX, y, speciesType);
this.fishes.push(fish);

// OR use SpawningSystem
this.spawningSystem.spawnFish(speciesType, worldX, y);
```

### Coordinate Conversion (Player-Relative Modes)
```javascript
// World to screen
const offsetFromPlayer = entityWorldX - playerWorldX;
const screenX = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;

// Screen to world
const offsetFromCenter = screenX - (GameConfig.CANVAS_WIDTH / 2);
const worldX = playerWorldX + offsetFromCenter;
```

### Depth Conversion
```javascript
// Y position to depth (feet)
const depth = y / GameConfig.DEPTH_SCALE;

// Depth (feet) to Y position
const y = depth * GameConfig.DEPTH_SCALE;
```

## File Modification Checklist

### Adding a New Fish Species
1. Add to `FISH_SPECIES` in `/src/config/SpeciesData.js`
2. Add to spawn weights in `/src/scenes/systems/SpawningSystem.js`
3. (Optional) Add species-specific rendering in `/src/entities/Fish.js`

### Adding a New Baitfish Species
1. Add to `BAITFISH_SPECIES` in `/src/config/SpeciesData.js`
2. Add to spawn weights in `/src/scenes/systems/SpawningSystem.js`
3. (Optional) Add species-specific rendering in `/src/entities/Baitfish.js` (`renderSpeciesFeatures()`)

### Adding a New Fishing Mode
1. Add constant to `/src/config/GameConfig.js` (`FISHING_TYPE_*`)
2. Create manager in `/src/managers/*Manager.js` (if needed)
3. Add button in `/src/scenes/MenuScene.js`
4. Update `GameScene.js` or create new scene
5. Update coordinate conversion logic in all entities
6. Update mode detection in systems

### Modifying UI
1. UI overlays: `/src/scenes/UIScene.js`
2. Menu: `/src/scenes/MenuScene.js`
3. In-game UI: Scene's `create()` method

### Debugging Issues
1. Enable debug mode: Press backtick (`) in game
2. Check console for errors
3. Verify coordinate conversions (worldX vs screenX)
4. Check for null pointer errors (especially `lure` in nature mode)
5. Verify depth calculations (feet vs pixels)

## Performance Considerations

### Entity Limits
- Fish: ~20-30 active (performance-dependent)
- Baitfish clouds: ~10-15 active
- Baitfish per cloud: 10-30 individuals
- Zooplankton: ~50-100 active

### Update Order
1. Input systems
2. AI systems (fish, baitfish)
3. Physics systems (lure, line)
4. Camera systems
5. Render

### Culling
- Entities >600px from player (world distance) are removed
- In nature mode: entities >400px off screen edges are removed

## Asset Structure

```
assets/
├── images/
│   ├── ui/          # UI elements, buttons
│   ├── fish/        # Fish sprites
│   ├── environment/ # Water, ice, etc.
│   └── maps/        # Bathymetric maps
├── sounds/
│   └── (future)     # Sound effects, music
└── fonts/
    └── (future)     # Custom fonts
```

## Git Workflow

**Main Branch**: `main` (protected)
**Feature Branches**: `claude/*` prefix for Claude Code sessions
**Current Branch**: `claude/new-game-concept-011CUV24FTAHJE9cys3sfWkz`

## Testing

### Manual Testing Checklist
- [ ] Ice fishing mode works
- [ ] Kayak fishing mode works
- [ ] Boat fishing mode works
- [ ] Nature simulation mode works
- [ ] Fish spawn and behave correctly
- [ ] Baitfish spawn and school correctly
- [ ] Lure physics feel responsive
- [ ] Depth scaling works at all depths
- [ ] Gamepad controls work
- [ ] Keyboard controls work
- [ ] Menu navigation works
- [ ] Scene transitions work
- [ ] No console errors

### Common Test Scenarios
1. **Coordinate Test**: Spawn fish at x=0, x=600, x=1200 - verify visible
2. **Depth Test**: Change depth setting - verify DEPTH_SCALE updates
3. **Mode Switch Test**: Play ice mode, return to menu, play boat mode - verify no pollution
4. **Edge Case Test**: Spawn entities at min/max depth - verify bounds
5. **Null Safety Test**: Run nature mode - verify no lure-related crashes

---

**Last Updated**: 2025-10-26
**Project Status**: Active development - Nature simulation mode complete
