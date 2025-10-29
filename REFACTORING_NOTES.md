# Fish System Refactoring

## Overview

The fish system has been refactored to separate concerns between game logic and rendering.

## Architecture

### Before
- **`src/entities/Fish.js`** - 1,185 lines containing everything: game logic, biology, AI, AND rendering
- **`src/models/fish.js`** - 473 lines, mostly unused stub code
- Massive code duplication (~600+ lines)
- Species logic embedded with if/else statements

### After

#### Models (Game Logic) - Game Engine Agnostic
- **`src/models/fish.js`** - Base Fish model class containing:
  - Biological properties (hunger, health, metabolism)
  - Movement and position logic
  - AI integration
  - World coordinates
  - Biology updates
  - **NO Phaser-specific code**

- **`src/models/LakeTrout.js`** - Lake trout specific:
  - Length-weight formula (10.5 * weight^0.31)
  - Age ranges (slow growth, long-lived: 3-30+ years)
  - Higher base hunger (80-100%)

- **`src/models/NorthernPike.js`** - Pike specific:
  - Length-weight formula (13.5 * weight^0.28 - longer, slender)
  - Age ranges (fast growth, shorter lifespan: 2-22 years)

- **`src/models/SmallmouthBass.js`** - Bass specific:
  - Length-weight formula (11.2 * weight^0.33 - compact, deep)
  - Age ranges (moderate growth: 2-18 years)

- **`src/models/YellowPerch.js`** - Perch specific:
  - Length-weight formula (9.5 * weight^0.35 - smaller, deep)
  - Age ranges (fast growth, short lifespan: 1-12 years)

#### Entity (Rendering) - Phaser-Specific
- **`src/entities/Fish.js`** - Phaser rendering entity containing:
  - Phaser graphics and sprites
  - Procedural rendering methods (renderLakeTrout, renderNorthernPike, etc.)
  - Artwork loading
  - Sonar trail visualization
  - **Composes with model via `this.model`**
  - Delegates all logic to model

## Key Benefits

### 1. **Separation of Concerns**
- Game logic is isolated from rendering
- Models can be tested without Phaser
- Rendering code is isolated in entity layer

### 2. **Species Extensibility**
- Easy to add new species: extend Fish model, override calculateLength() and calculateBiologicalAge()
- No more if/else chains for species logic
- Each species is self-contained

### 3. **Code Reusability**
- Models could be reused in different rendering engines
- Logic is game-engine agnostic
- Clear contract between model and entity

### 4. **Reduced Duplication**
- Eliminated ~600 lines of duplicate code
- Single source of truth for game logic
- Single source of truth for rendering

## Usage Example

```javascript
// Entity automatically creates the appropriate model
const fish = new Fish(scene, x, y, 'MEDIUM', 'ice_fishing', 'northern_pike');

// Entity delegates to model
fish.update(lure, allFish, baitfishClouds);

// Access properties (delegated to model)
console.log(fish.hunger, fish.health, fish.weight);

// Model handles logic, entity handles rendering
```

## Adding a New Species

1. Create model class in `src/models/NewSpecies.js`:
```javascript
import { Fish } from './fish.js';
import { Utils } from '../utils/Constants.js';

export class NewSpecies extends Fish {
    constructor(scene, x, y, size, fishingType) {
        super(scene, x, y, size, fishingType, 'new_species');
    }

    calculateLength() {
        // Species-specific formula
        return Math.round(12.0 * Math.pow(this.weight, 0.30));
    }

    calculateBiologicalAge() {
        // Species-specific age ranges
        if (this.weight <= 5) return Math.round(Utils.randomBetween(2, 5));
        // ... more weight brackets
    }
}
```

2. Update entity factory in `src/entities/Fish.js`:
```javascript
import NewSpecies from '../models/NewSpecies.js';

createModel(scene, x, y, size, fishingType, species) {
    switch(species) {
        case 'new_species': return new NewSpecies(scene, x, y, size, fishingType);
        // ... other species
    }
}
```

3. Add rendering method to entity (optional, if not using sprites):
```javascript
renderNewSpecies(bodySize, isMovingRight) {
    // Species-specific rendering code
}
```

## Testing

- Build succeeds: ✅
- No import errors: ✅
- All species models created: ✅ (LakeTrout, NorthernPike, SmallmouthBass, YellowPerch)
- Entity properly delegates to models: ✅

## Files Modified

- `src/models/fish.js` - Enhanced base model
- `src/entities/Fish.js` - Refactored to composition pattern
- Created: `src/models/LakeTrout.js`
- Created: `src/models/NorthernPike.js`
- Created: `src/models/SmallmouthBass.js`
- Created: `src/models/YellowPerch.js`

## Migration Notes

- **No breaking changes** - existing imports still work
- Entity exports `Fish` class (same name)
- All property access delegated via getters
- Update method signature unchanged
- Backward compatible with existing code
