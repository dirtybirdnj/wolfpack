# Architecture Diagram

## Class Hierarchy (After Nov 2025 Refactor)

```
Phaser.GameObjects.Sprite
        │
        ├── OrganismSprite (base)
        │       │
        │       ├── FishSprite
        │       │   ├── type: 'bait'     → schooling behavior
        │       │   └── type: 'predator' → hunting AI (FishAI)
        │       │
        │       ├── CrayfishSprite
        │       └── ZooplanktonSprite
        │
        └── Lure (player controlled)
```

## Data Flow

```
OrganismData.js (config)
    │
    └──> SpriteGenerator.generateAllTextures()
             │
             └──> Creates textures at boot
                      │
                      └──> SpawningSystem.spawnOrganism()
                               │
                               └──> new FishSprite(scene, config)
                                        │
                                        └──> SchoolManager detects nearby
                                                 │
                                                 └──> Creates dynamic school
```

## System Interactions

```
GameScene
   │
   ├── SpawningSystem → Creates organisms
   │       │
   │       └── Spawns FishSprite instances
   │
   ├── SchoolManager → Detects clusters, creates schools
   │       │
   │       └── Updates fish orientations
   │
   ├── FoodChainSystem → Predator-prey interactions
   │       │
   │       └── Triggers hunting in FishAI
   │
   └── FishAI → Decision making for predators
           │
           ├── Baitfish detection
           ├── Lure evaluation
           └── Strike behavior
```

## Composition Pattern

FishSprite uses composition over inheritance:

```javascript
FishSprite {
    // Core organism properties from OrganismData
    + species, size, baseSpeed, color

    // Behavioral components (added dynamically)
    + schoolingComponent  // if type='bait'
    + huntingComponent    // if type='predator'
    + biologyComponent    // metabolism, energy
}
```

This allows one class to handle both baitfish and predators with different behaviors.
