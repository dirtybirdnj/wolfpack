# Unified Fish Architecture Refactoring

## Current Architecture

### Baitfish
- **Entity**: `Baitfish.js` (Phaser view layer)
- **Model**: `BaitfishModel.js` (game logic)
- **Management**: `BaitfishCloud.js` (array-based collection)
- **Behavior**: Simple flocking within cloud
- **No AI**: Lightweight, optimized for many instances

### Predator Fish
- **Entity**: `Fish.js` (Phaser view layer)
- **Models**: Species-specific (`LakeTrout.js`, `NorthernPike.js`, etc.)
- **Management**: Individual instances
- **Behavior**: `FishAI.js` for complex behavior
- **Full simulation**: Detailed physics and state

### Problems with Current Approach

1. **Duplication**: Separate classes for baitfish vs predators
2. **Inconsistency**: Different update patterns and interfaces
3. **Scalability**: Hard to add shared behaviors (schooling, fleeing)
4. **Performance**: Array iteration instead of Phaser's optimized Groups
5. **Complexity**: BaitfishCloud manages individual fish updates

## Proposed Unified Architecture

### Core Principle
**All fish are Fish3D instances, differentiated by species data and behavioral roles**

### Class Structure

```
Fish3D (Base class for ALL fish)
├── model: FishModel (shared base model)
│   ├── species: SpeciesData (lake_trout, smelt, alewife, etc.)
│   ├── role: 'predator' | 'baitfish' | 'neutral'
│   ├── physics: FishPhysics (3D movement, depth)
│   └── state: FishState (hungry, fleeing, curious, etc.)
├── view: Graphics/Sprite (Phaser rendering)
├── ai: FishAI (optional, for complex behavior)
└── schooling: SchoolingBehavior (Boids, optional)
```

### Phaser Groups Integration

```javascript
// In GameScene.js
create() {
    // Enable spatial optimization
    this.physics.world.useTree = true;

    // Create fish groups
    this.predatorGroup = this.add.group({
        classType: Fish3D,
        maxSize: 20,
        runChildUpdate: true
    });

    this.baitfishGroup = this.add.group({
        classType: Fish3D,
        maxSize: 200,
        runChildUpdate: true
    });

    // Spawn predators
    const lakeTrout = new Fish3D(this, 100, 100, 50, {
        species: 'lake_trout',
        role: 'predator',
        enableAI: true,
        enableSchooling: false
    });
    this.predatorGroup.add(lakeTrout);

    // Spawn baitfish school
    for (let i = 0; i < 50; i++) {
        const smelt = new Fish3D(this, 200, 200, 30, {
            species: 'smelt',
            role: 'baitfish',
            enableAI: false,
            enableSchooling: true
        });
        this.baitfishGroup.add(smelt);
    }
}

update(time, delta) {
    // Groups automatically call update() on each fish
    // We can add group-level behaviors here

    // Check for predator-prey interactions
    this.physics.overlap(
        this.predatorGroup,
        this.baitfishGroup,
        this.onPredatorEncounter,
        null,
        this
    );
}
```

## Fish3D Class Design

### Constructor

```javascript
class Fish3D {
    constructor(scene, worldX, y, depth, config) {
        this.scene = scene;

        // 3D position (world coordinates in feet)
        this.worldX = worldX;
        this.y = y;
        this.depth = depth; // feet below surface

        // Configuration
        this.config = {
            species: 'smelt',
            role: 'baitfish', // 'predator' | 'baitfish' | 'neutral'
            enableAI: false,
            enableSchooling: true,
            ...config
        };

        // Load species data
        this.speciesData = getSpeciesData(this.config.species);

        // Model (game logic)
        this.model = new FishModel(this.speciesData);

        // View (Phaser graphics)
        this.graphics = scene.add.graphics();
        this.sprite = null; // Optional sprite

        // Behavior modules (optional based on config)
        this.ai = this.config.enableAI ? new FishAI(this) : null;
        this.schooling = this.config.enableSchooling ? new SchoolingBehavior(this) : null;

        // State
        this.state = 'idle'; // idle, fleeing, feeding, curious, hooked, etc.
        this.target = null;
        this.velocity = { x: 0, y: 0, z: 0 };

        // Sonar trail
        this.sonarTrail = [];
        this.maxTrailLength = 30;

        // Lifecycle
        this.active = true;
        this.visible = true;
        this.age = 0;
    }

    update(time, delta) {
        if (!this.active) return;

        this.age++;

        // Update behavior based on role
        if (this.config.role === 'baitfish' && this.schooling) {
            // Baitfish use schooling behavior
            this.updateSchooling();
        } else if (this.config.role === 'predator' && this.ai) {
            // Predators use AI
            this.ai.update(delta);
        }

        // Update physics (all fish)
        this.updatePhysics(delta);

        // Update visuals
        this.updateGraphics();

        // Update sonar trail
        this.updateSonarTrail();
    }

    updateSchooling() {
        // Delegates to SchoolingBehavior
        if (this.schooling) {
            this.schooling.update();
        }
    }

    updatePhysics(delta) {
        // Apply velocity
        this.worldX += this.velocity.x * delta;
        this.y += this.velocity.y * delta;
        this.depth += this.velocity.z * delta;

        // Apply drag
        const drag = this.speciesData.drag;
        this.velocity.x *= drag;
        this.velocity.y *= drag;
        this.velocity.z *= drag;

        // Clamp depth
        this.depth = Phaser.Math.Clamp(this.depth, 5, GameConfig.MAX_DEPTH);
    }

    setState(newState) {
        this.state = newState;
        // Notify AI and schooling modules
        if (this.ai) this.ai.onStateChange(newState);
        if (this.schooling) this.schooling.onStateChange(newState);
    }

    // ... other methods
}
```

## SchoolingBehavior Module

```javascript
class SchoolingBehavior {
    constructor(fish) {
        this.fish = fish;
        this.scene = fish.scene;

        // Boids parameters
        this.separationRadius = 20;
        this.alignmentRadius = 50;
        this.cohesionRadius = 50;

        // Weights
        this.separationWeight = 1.5;
        this.alignmentWeight = 1.0;
        this.cohesionWeight = 1.0;

        // Performance optimization
        this.updateFrequency = 3; // Update every N frames
        this.frameCount = 0;
    }

    update() {
        // Only update every N frames for performance
        if (this.frameCount++ % this.updateFrequency !== 0) {
            return;
        }

        // Get nearby fish from the same group
        const group = this.getMyGroup();
        const neighbors = this.findNeighbors(group);

        if (neighbors.length === 0) return;

        // Calculate boids forces
        const separation = this.calculateSeparation(neighbors);
        const alignment = this.calculateAlignment(neighbors);
        const cohesion = this.calculateCohesion(neighbors);

        // Apply weights
        separation.scale(this.separationWeight);
        alignment.scale(this.alignmentWeight);
        cohesion.scale(this.cohesionWeight);

        // Combine and apply
        const force = separation.add(alignment).add(cohesion);
        this.fish.applyForce(force);
    }

    getMyGroup() {
        // Find which group this fish belongs to
        if (this.fish.config.role === 'baitfish') {
            return this.scene.baitfishGroup;
        }
        // Could have predator schools too
        return null;
    }

    findNeighbors(group) {
        const maxRadius = Math.max(
            this.separationRadius,
            this.alignmentRadius,
            this.cohesionRadius
        );

        // Use Phaser's spatial query
        return group.getChildren().filter(other => {
            if (other === this.fish || !other.active) return false;

            const distance = Phaser.Math.Distance.Between(
                this.fish.worldX, this.fish.y,
                other.worldX, other.y
            );

            return distance < maxRadius;
        });
    }

    calculateSeparation(neighbors) {
        // Implementation from fish-schooling.md
    }

    calculateAlignment(neighbors) {
        // Implementation from fish-schooling.md
    }

    calculateCohesion(neighbors) {
        // Implementation from fish-schooling.md
    }

    onStateChange(newState) {
        // Adjust behavior based on state
        if (newState === 'fleeing') {
            this.separationWeight = 2.0; // Spread out when fleeing
            this.cohesionWeight = 0.5;
        } else {
            this.separationWeight = 1.5;
            this.cohesionWeight = 1.0;
        }
    }
}
```

## Species Data Structure

```javascript
// In SpeciesData.js
export const SPECIES_DATA = {
    // Predators
    lake_trout: {
        type: 'predator',
        length: 24, // inches
        maxSpeed: 4.0,
        diet: ['smelt', 'alewife', 'sculpin'],
        enableAI: true,
        enableSchooling: false,
        // ... more data
    },

    // Baitfish
    smelt: {
        type: 'baitfish',
        length: 6, // inches
        maxSpeed: 3.0,
        schoolingDensity: 'very_high',
        enableAI: false,
        enableSchooling: true,
        // ... more data
    },

    alewife: {
        type: 'baitfish',
        length: 8,
        maxSpeed: 3.5,
        schoolingDensity: 'high',
        enableAI: false,
        enableSchooling: true,
        // ... more data
    }
};

export function getSpeciesData(species) {
    return SPECIES_DATA[species] || SPECIES_DATA.smelt;
}
```

## Migration Path

### Phase 1: Create Fish3D Base Class
1. Create `src/entities/Fish3D.js` with unified interface
2. Extract common functionality from Fish and Baitfish
3. Support both old and new classes temporarily

### Phase 2: Create SchoolingBehavior Module
1. Create `src/behaviors/SchoolingBehavior.js`
2. Implement Boids algorithm
3. Test with small group

### Phase 3: Integrate Phaser Groups
1. Update GameScene to use `this.add.group()`
2. Migrate baitfish spawning to use Fish3D
3. Test performance with 50+ fish

### Phase 4: Deprecate Old Classes
1. Remove BaitfishCloud.js
2. Remove Baitfish.js
3. Update Fish.js to extend Fish3D
4. Clean up references

## Benefits

### Code Organization
- ✅ Single Fish3D class for all fish
- ✅ Modular behaviors (AI, Schooling)
- ✅ Consistent update pattern
- ✅ Species-driven configuration

### Performance
- ✅ Phaser Groups with spatial optimization
- ✅ QuadTree neighbor queries
- ✅ Object pooling built-in
- ✅ Configurable update frequency

### Flexibility
- ✅ Easy to add new species
- ✅ Mix behaviors (predator schools, smart baitfish)
- ✅ Group-level effects (threat response, migration)
- ✅ Share code between all fish types

### Maintainability
- ✅ One place to fix bugs
- ✅ Easier to add features
- ✅ Better testing
- ✅ Clear architecture

## Testing Strategy

1. **Unit Tests**: Test Fish3D, SchoolingBehavior separately
2. **Integration Tests**: Test groups with mixed species
3. **Performance Tests**: 100+ fish at 60fps
4. **Visual Tests**: Confirm schooling looks natural
5. **Gameplay Tests**: Predator-prey interactions work correctly

## Next Steps

1. Review this design with team
2. Create Fish3D.js stub
3. Implement SchoolingBehavior.js
4. Convert one baitfish cloud to test
5. Iterate and refine
6. Full migration
