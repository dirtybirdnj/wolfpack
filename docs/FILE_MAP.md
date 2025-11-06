# Wolfpack File Map

Quick reference for navigating the codebase after the organism refactor.

## Configuration (`src/config/`)

| File | Purpose |
|------|---------|
| `GameConfig.js` | Game constants, physics, AI parameters |
| `OrganismData.js` | **PRIMARY** - All organism definitions (predators, baitfish, etc) |
| `SpeciesData.js` | Legacy species config (being deprecated) |

## Sprites (`src/sprites/`)

| File | Purpose |
|------|---------|
| `OrganismSprite.js` | Base class for all aquatic organisms |
| `FishSprite.js` | Unified fish class (handles both bait + predators) |
| `CrayfishSprite.js` | Crayfish organisms |
| `ZooplanktonSprite.js` | Zooplankton organisms |

## Entities (`src/entities/`)

| File | Purpose |
|------|---------|
| `FishAI.js` | Predator hunting AI and behavior |
| `FishFight.js` | Fight mechanics, tension, drag system |
| `FishingLine.js` | Visual line rendering from rod to lure |
| `Lure.js` | Player-controlled lure with physics |

## Models (`src/models/`)

| File | Purpose |
|------|---------|
| `FishingLineModel.js` | Line type properties (braid/mono/fluoro) |
| `ReelModel.js` | Reel mechanics and drag system |

## Systems (`src/systems/`)

| File | Purpose |
|------|---------|
| `SchoolManager.js` | Emergent schooling behavior for baitfish |
| `FoodChainSystem.js` | Predator-prey interactions |

## Scene Systems (`src/scenes/systems/`)

| File | Purpose |
|------|---------|
| `SpawningSystem.js` | Fish and organism spawning logic |
| `InputSystem.js` | Player input handling |
| `CollisionSystem.js` | Collision detection |
| `DebugSystem.js` | Debug utilities |
| `NotificationSystem.js` | In-game notifications |

## Scenes (`src/scenes/`)

| File | Purpose |
|------|---------|
| `BootScene.js` | Boot screen with logo and texture generation |
| `MenuScene.js` | Main menu |
| `GameScene.js` | Main gameplay scene |
| `GameHUD.js` | In-game HUD overlay |
| `GameOverScene.js` | Game over screen |
| `NatureSimulationScene.js` | Nature observation mode |

## Utilities (`src/utils/`)

| File | Purpose |
|------|---------|
| `SpriteGenerator.js` | Procedural sprite texture generation |
| `Constants.js` | Game constants and enums |
| `DepthConverter.js` | Depth coordinate conversion |
| `GamepadManager.js` | Controller input |
| `SonarDisplay.js` | Sonar visualization |

## Deleted in Refactor ❌

These files were removed and replaced by the unified architecture:

- `src/entities/Baitfish.js` → FishSprite (type='bait')
- `src/entities/Fish.js` → FishSprite (type='predator')
- `src/entities/Crayfish.js` → CrayfishSprite
- `src/entities/Zooplankton.js` → ZooplanktonSprite
- `src/entities/BaitfishCloud.js` → SchoolManager system
- `src/components/SchoolingBehavior.js` → Built into FishSprite
- `src/models/AquaticOrganism.js` → OrganismSprite base class
- `src/models/fish.js`, `baitfish.js`, etc → OrganismData.js
- `src/models/species/*.js` → OrganismData.js
