# Wolfpack - Project Status

**Last Updated:** 2025-11-06
**Current Branch:** `refactor-entity-model-relationship`

## Recent Major Refactor ✅

Successfully completed unified organism architecture refactor (Phases 1-4):

### What Changed
- **DELETED** old entity classes (Baitfish, Fish, Crayfish, Zooplankton, BaitfishCloud)
- **DELETED** old model classes (AquaticOrganism, species-specific models)
- **DELETED** old component (SchoolingBehavior)
- **CREATED** unified sprite architecture with OrganismSprite base class
- **UNIFIED** FishSprite to handle both bait and predator fish
- **CONSOLIDATED** all organism data into OrganismData.js

### New Architecture

```
OrganismSprite (base)
├── FishSprite (bait + predators)
├── CrayfishSprite
└── ZooplanktonSprite

SchoolManager (emergent flocking)
SpriteGenerator (procedural textures)
```

## Current File Structure

### Core Config
- `src/config/GameConfig.js` - Physics, AI, lure constants
- `src/config/OrganismData.js` - **PRIMARY** organism definitions
- `src/config/SpeciesData.js` - ⚠️ Legacy, being phased out

### Sprites (New)
- `src/sprites/OrganismSprite.js` - Base class for all water life
- `src/sprites/FishSprite.js` - Unified fish (type: 'bait' or 'predator')
- `src/sprites/CrayfishSprite.js` - Bottom feeders
- `src/sprites/ZooplanktonSprite.js` - Microscopic prey

### Entities (Game Logic)
- `src/entities/FishAI.js` - Predator hunting behavior
- `src/entities/FishFight.js` - Fight mechanics
- `src/entities/FishingLine.js` - Line rendering
- `src/entities/Lure.js` - Player control

### Systems
- `src/systems/SchoolManager.js` - Dynamic emergent schooling
- `src/systems/FoodChainSystem.js` - Predator-prey
- `src/scenes/systems/SpawningSystem.js` - Population management

### Utilities
- `src/utils/SpriteGenerator.js` - Procedural texture generation

## Known Issues

### High Priority
1. **Broken Tests** - Multiple test files reference deleted entities:
   - `__tests__/models/AquaticOrganism.test.js`
   - `__tests__/models/fish.test.js`
   - `__tests__/models/species.test.js`

2. **Redundant Config** - Both OrganismData.js and SpeciesData.js exist

### Recently Fixed
- ✅ Boot screen texture display (z-depth issue resolved)

## Species Available

**Predators:** Lake Trout, Northern Pike, Smallmouth Bass, Yellow Perch
**Baitfish:** Alewife, Rainbow Smelt, Yellow Perch, Sculpin, Cisco
**Other:** Zooplankton, Crayfish

## Development Commands

```bash
npm start          # Start dev server (localhost:8080)
npm test           # Run test suite
npm run build      # Production build
```

## Next Steps
1. Update/remove broken test files
2. Deprecate SpeciesData.js fully
3. Update any remaining imports in scene files
4. Consider adding more Lake Champlain species
