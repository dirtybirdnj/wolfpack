# Fish Models

This directory contains the biological models for all fish species in the game.

## Architecture

The fish system now uses a modular, object-oriented architecture where each species is its own class that inherits from a base Fish class.

### Base Fish Class (`fish.js`)

The `Fish` class contains all the common biological properties and behaviors shared by all fish species:

- **Biological Properties**: hunger, health, metabolism, age, weight, length
- **Movement & Physics**: position, speed, depth, angle
- **AI Integration**: integrates with FishAI for decision-making
- **State Management**: engagement state, frenzy behavior, visual feedback
- **Rendering**: base rendering logic and sonar trail management

### Species Classes

Each species extends the base Fish class and provides species-specific implementations:

#### Lake Trout (`lake-trout.js`)
- **Scientific Name**: *Salvelinus namaycush*
- **Hunting Style**: Pursuit predator
- **Characteristics**: Cold-water specialist, slower growth, long-lived
- **Length Formula**: `10.5 * weight^0.31`
- **Age Range**: 3-30+ years
- **Visual**: Grayish-olive body with cream belly

#### Northern Pike (`northern-pike.js`)
- **Scientific Name**: *Esox lucius*
- **Hunting Style**: Ambush predator
- **Characteristics**: Explosive strikes, torpedo-shaped body, faster growth
- **Length Formula**: `13.5 * weight^0.28` (longer, more slender)
- **Age Range**: 2-22 years
- **Visual**: Olive green with cream oval spots in horizontal rows

#### Smallmouth Bass (`smallmouth-bass.js`)
- **Scientific Name**: *Micropterus dolomieu*
- **Hunting Style**: Active pursuit, circles before striking
- **Characteristics**: Compact, muscular, acrobatic fighter
- **Length Formula**: `11.2 * weight^0.33`
- **Age Range**: 2-18 years
- **Visual**: Bronze/brown with vertical bars and red eyes

#### Yellow Perch (`yellow-perch.js`)
- **Scientific Name**: *Perca flavescens*
- **Hunting Style**: Opportunistic feeder
- **Characteristics**: Beginner-friendly, fast growth, shorter lifespan
- **Length Formula**: `9.5 * weight^0.35`
- **Age Range**: 1-12 years
- **Visual**: Golden yellow with dark vertical bars

## Usage

The fish system uses a factory pattern for backward compatibility. Existing code can continue to use:

```javascript
const fish = new Fish(scene, x, y, size, fishingType, species);
```

The factory automatically creates the appropriate species-specific instance based on the `species` parameter:

- `'lake_trout'` → Creates a `LakeTrout` instance
- `'northern_pike'` → Creates a `NorthernPike` instance
- `'smallmouth_bass'` → Creates a `SmallmouthBass` instance
- `'yellow_perch_large'` → Creates a `YellowPerch` instance

## Extending the System

To add a new fish species:

1. Create a new file in `src/models/` (e.g., `walleye.js`)
2. Import and extend the base Fish class:
   ```javascript
   import Fish from './fish.js';

   export class Walleye extends Fish {
       constructor(scene, x, y, size = 'MEDIUM', fishingType = null) {
           super(scene, x, y, size, fishingType, 'walleye');
       }

       // Override species-specific methods
       calculateLength() { /* ... */ }
       calculateBiologicalAge() { /* ... */ }
       renderBody(bodySize, isMovingRight) { /* ... */ }
       renderBodyAtPosition(graphics, bodySize) { /* ... */ }
   }
   ```
3. Update `src/entities/Fish.js` to include the new species in the factory
4. Add species data to `src/config/SpeciesData.js`

## Methods That Can Be Overridden

- `calculateLength()` - Species-specific length-weight formula
- `calculateBiologicalAge()` - Species-specific age-weight relationship
- `renderBody(bodySize, isMovingRight)` - Species-specific visual rendering
- `renderBodyAtPosition(graphics, bodySize)` - Rendering for catch popup

All other biological behaviors (hunger, health, movement, etc.) are inherited from the base Fish class and remain consistent across species.

## Benefits of This Architecture

1. **Modularity**: Each species is self-contained and easy to modify
2. **Reusability**: Common fish behaviors are shared via inheritance
3. **Maintainability**: Changes to one species don't affect others
4. **Extensibility**: New species can be added easily
5. **Type Safety**: Each species has its own class with type-specific behavior
6. **Backward Compatibility**: Existing code continues to work without changes
