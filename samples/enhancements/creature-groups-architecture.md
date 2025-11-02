# Creature Groups Architecture - Ecological Organization

## Overview

Unified Phaser Groups system for ALL life forms in Lake Champlain ecosystem. Designed for scalability, performance, and ecological accuracy.

## Core Design Principles

1. **Ecological Hierarchy** - Mirror real food chain and habitat zones
2. **Multiple Group Membership** - Creatures can belong to multiple functional groups
3. **Fast Queries** - Pre-organized groups eliminate filtering overhead
4. **Shader Ready** - All groups support batch rendering with shaders
5. **Future Proof** - Easy to add new species and behaviors

---

## Group Organization

### Primary Structure: `this.creatures` (Ecological Roles)

```javascript
this.creatures = {
    // BASE OF FOOD CHAIN
    zooplankton: Phaser.Group,      // Microscopic drifters (copepods, daphnia)

    // INVERTEBRATES
    invertebrates: Phaser.Group,    // Bottom dwellers (crayfish)
    mussels: Phaser.Group,          // Filter feeders (zebra mussels, native mussels)

    // SMALL FISH (Baitfish)
    baitfish: Phaser.Group,         // Schooling prey fish (smelt, alewife, sculpin)

    // LARGE FISH (Predators)
    predators: Phaser.Group,        // Top predators (lake trout, pike, bass)

    // BENTHIC SPECIALISTS
    bottomFeeders: Phaser.Group,    // Bottom hunters (freshwater drum, burbot)

    // VEGETATION
    vegetation: Phaser.Group,       // Aquatic plants, algae (future)

    // DETRITUS
    debris: Phaser.Group            // Organic matter, fallen logs (future)
};
```

### Secondary Structure: `this.interactionGroups` (Functional Roles)

```javascript
this.interactionGroups = {
    // DETECTION
    sonarTargets: Phaser.Group,     // Everything visible on fish finder

    // FOOD CHAIN
    prey: Phaser.Group,             // Everything that can be eaten
    hunters: Phaser.Group,          // Everything that actively hunts

    // PHYSICS
    swimming: Phaser.Group,         // Active swimmers (affected by current)
    floating: Phaser.Group,         // Passive drifters (plankton)
    sessile: Phaser.Group,          // Stationary (mussels, plants)

    // RENDERING
    schooling: Phaser.Group,        // Uses Boids algorithm
    aiControlled: Phaser.Group      // Uses AI for behavior
};
```

---

## Species Implementation Guide

### Zooplankton
```javascript
const plankton = new Zooplankton(scene, x, y);

// Add to groups
creatures.zooplankton.add(plankton);
interactionGroups.prey.add(plankton);
interactionGroups.sonarTargets.add(plankton);
interactionGroups.floating.add(plankton);

// Properties
plankton.roles = ['prey', 'sonar', 'floating'];
plankton.trophicLevel = 1; // Primary producers
```

### Zebra Mussels (NEW)
```javascript
const mussel = new ZebraMussel(scene, x, y);

// Add to groups
creatures.mussels.add(mussel);
interactionGroups.prey.add(mussel);
interactionGroups.sessile.add(mussel);

// Properties
mussel.roles = ['prey', 'filter_feeder'];
mussel.trophicLevel = 2;
mussel.feedsOn = ['zooplankton', 'detritus'];
mussel.predators = ['freshwater_drum'];
mussel.crushResistance = 0.8; // Hard to eat (requires pharyngeal teeth)
```

**Zebra Mussel Mechanics:**
- Stationary attachment to rocks/substrate
- Filter zooplankton from water (reduces zooplankton density nearby)
- Dense colonies (spawn in clusters of 20-50)
- Provide unique food source for Freshwater Drum
- Invasive species marker (educational element)

### Crayfish
```javascript
const crayfish = new Crayfish(scene, x, y);

// Add to groups
creatures.invertebrates.add(crayfish);
interactionGroups.prey.add(crayfish);
interactionGroups.hunters.add(crayfish); // Hunts zooplankton!
interactionGroups.sonarTargets.add(crayfish);

// Properties
crayfish.roles = ['prey', 'hunter', 'sonar', 'benthic'];
crayfish.trophicLevel = 2.5;
crayfish.feedsOn = ['zooplankton', 'detritus'];
crayfish.predators = ['smallmouth_bass', 'freshwater_drum', 'burbot'];
crayfish.escapeSpeed = 4.0; // Fast backward burst
```

### Baitfish (Smelt, Alewife, Sculpin)
```javascript
const smelt = new Fish(scene, x, y, 'TINY', 'rainbow_smelt');

// Add to groups
creatures.baitfish.add(smelt);
interactionGroups.prey.add(smelt);
interactionGroups.sonarTargets.add(smelt);
interactionGroups.swimming.add(smelt);
interactionGroups.schooling.add(smelt);

// Properties
smelt.roles = ['prey', 'hunter', 'sonar', 'swimming', 'schooling'];
smelt.trophicLevel = 3;
smelt.feedsOn = ['zooplankton'];
smelt.predators = ['lake_trout', 'northern_pike', 'smallmouth_bass', 'freshwater_drum'];
```

### Predator Fish (Lake Trout, Pike, Bass)
```javascript
const laker = new Fish(scene, x, y, 'LARGE', 'lake_trout');

// Add to groups
creatures.predators.add(laker);
interactionGroups.hunters.add(laker);
interactionGroups.sonarTargets.add(laker);
interactionGroups.swimming.add(laker);
interactionGroups.aiControlled.add(laker);

// Properties
laker.roles = ['hunter', 'sonar', 'swimming', 'ai'];
laker.trophicLevel = 4;
laker.feedsOn = ['rainbow_smelt', 'alewife', 'sculpin'];
laker.schooling = false; // Solitary as adults
```

### Freshwater Drum (NEW - Bottom Specialist)
```javascript
const drum = new Fish(scene, x, y, 'MEDIUM', 'freshwater_drum');

// Add to groups
creatures.bottomFeeders.add(drum);
interactionGroups.hunters.add(drum);
interactionGroups.sonarTargets.add(drum);
interactionGroups.swimming.add(drum);
interactionGroups.aiControlled.add(drum);

// Properties
drum.roles = ['hunter', 'sonar', 'swimming', 'ai', 'benthic'];
drum.trophicLevel = 3.5;
drum.feedsOn = ['zebra_mussel', 'crayfish', 'sculpin']; // Unique diet!
drum.pharyngealTeeth = true; // Special adaptation
drum.preferredDepth = { min: 40, max: 100 }; // Deep water specialist
drum.soundProduction = 'drumming'; // Males drum during spawn
```

**Freshwater Drum Species Data:**
```javascript
freshwater_drum: {
    name: 'Freshwater Drum',
    scientificName: 'Aplodinotus grunniens',
    commonNames: ['Sheepshead', 'Grunter', 'Croaker'],
    status: 'Native',

    // Physical
    sizeRange: { min: 12, max: 30 }, // inches
    weightRange: { min: 1, max: 15 }, // lbs
    maxSize: { length: 35, weight: 25 }, // Lake Champlain record potential

    // Behavior
    habitat: 'benthic', // Bottom oriented
    depth: { preferred: [40, 100], max: 130 },
    temperature: { optimal: 70, range: [50, 85] },

    // Unique adaptations
    pharyngealTeeth: true, // Throat teeth for crushing shells
    lateralLine: 'extends_to_tail', // Excellent sensory system
    swimBladder: 'sound_production', // Drumming sounds

    // Diet
    diet: {
        zebra_mussel: 0.40,    // 40% (primary food)
        crayfish: 0.30,        // 30%
        sculpin: 0.15,         // 15%
        insect_larvae: 0.10,   // 10%
        clams: 0.05           // 5%
    },

    // Feeding behavior
    feedingStyle: 'bottom_grubbing', // Uses barbels to find food
    feedingTime: 'dawn_dusk',        // Most active twilight

    // Spawning
    spawnSeason: 'late_spring',      // May-June
    spawnDepth: [20, 40],            // Shallow spawning
    spawnSound: true,                // Males drum to attract females

    // Game mechanics
    fightStyle: 'steady_pull',       // Not jumpers, strong steady fight
    tableQuality: 'fair',            // Edible but not prized
    sportValue: 'underrated',        // Fun to catch, often overlooked

    notes: 'Only freshwater fish in North America with pharyngeal teeth. Excellent for controlling invasive zebra mussel populations. Males produce drumming/croaking sounds during spawn using swim bladder.'
}
```

---

## Update Loop Organization

```javascript
update(time, delta) {
    // 1. UPDATE BASE OF FOOD CHAIN
    // (Zooplankton drift with current)
    this.updateFloatingCreatures(delta);

    // 2. UPDATE FILTER FEEDERS
    // (Mussels consume nearby zooplankton)
    this.updateMussels(delta);

    // 3. UPDATE SCHOOLING FISH
    // (Baitfish use Boids algorithm)
    this.creatures.baitfish.getChildren().forEach(fish => {
        fish.updateSchooling(); // Already called via runChildUpdate
    });

    // 4. UPDATE HUNTERS
    // (Predators and bottom feeders use AI)
    this.interactionGroups.aiControlled.getChildren().forEach(creature => {
        creature.updateAI(delta);
    });

    // 5. UPDATE SONAR DISPLAY
    const targets = this.interactionGroups.sonarTargets.getChildren();
    this.sonarDisplay.update(targets);

    // 6. CHECK PREDATOR-PREY INTERACTIONS
    this.checkPredation();
}

checkPredation() {
    // Efficient collision detection using groups
    this.physics.overlap(
        this.interactionGroups.hunters,
        this.interactionGroups.prey,
        this.handlePredationAttempt,
        null,
        this
    );
}
```

---

## Food Chain Visualization

```
TROPHIC LEVEL 5: [PLAYER with Lure]
                      ↓
TROPHIC LEVEL 4: [Lake Trout, Northern Pike, Smallmouth Bass]
                      ↓
TROPHIC LEVEL 3.5: [Freshwater Drum] ← (specialized bottom feeder)
                      ↓                    ↓
TROPHIC LEVEL 3: [Rainbow Smelt, Alewife, Sculpin]
                      ↓
TROPHIC LEVEL 2.5: [Crayfish] ← eats zooplankton
                      ↓
TROPHIC LEVEL 2: [Zebra Mussels] ← filter feeders
                      ↓
TROPHIC LEVEL 1: [Zooplankton] ← base of food chain
                      ↓
PRODUCERS: [Phytoplankton, Algae] (future)
```

**Unique Food Web Relationships:**
- **Freshwater Drum** → Zebra Mussels (only fish that can crush shells)
- **Smallmouth Bass** → Crayfish (preferred prey)
- **Lake Trout** → Rainbow Smelt (cold water specialists together)
- **Northern Pike** → Alewife (ambush predator)
- **All Baitfish** → Zooplankton (energy transfer)
- **Zebra Mussels** → Zooplankton (invasive competitor, reduces food for baitfish)

---

## Spawning System

```javascript
// Ecological spawning - respect natural distributions
spawnEcosystem(centerX, centerY, depth) {
    // 1. Base: Zooplankton bloom
    if (depth < 80) {
        this.spawnZooplanktonCloud(centerX, centerY, 100);
    }

    // 2. Filter feeders (if shallow/rocky)
    if (depth < 40 && this.hasRockyBottom(centerX, centerY)) {
        this.spawnMusselColony(centerX, centerY + 20, 30);
    }

    // 3. Invertebrates
    if (depth < 60) {
        this.spawnCrayfish(centerX, centerY, 5);
    }

    // 4. Baitfish schools (species varies by depth/temp)
    if (depth < 80) {
        const species = depth < 50 ? 'alewife' : 'rainbow_smelt';
        this.spawnBaitfishSchool(centerX, centerY, 40, species);
    }

    // 5. Bottom feeders (if mussels/crayfish present)
    if (this.creatures.mussels.getLength() > 20) {
        this.spawnFreshwaterDrum(centerX, centerY + 10);
    }

    // 6. Predators (top of food chain)
    if (this.creatures.baitfish.getLength() > 30) {
        this.spawnPredator(centerX - 50, centerY, 'lake_trout');
    }
}
```

---

## Performance Optimization

### Spatial Partitioning
```javascript
// Enable QuadTree for fast neighbor queries
this.physics.world.useTree = true;

// All groups use spatial indexing
this.creatures.baitfish.enableBody = true;
```

### Level of Detail (LOD)
```javascript
updateLOD(camera) {
    const viewDistance = 300;

    // Reduce update frequency for distant creatures
    this.interactionGroups.sonarTargets.getChildren().forEach(creature => {
        const distance = Phaser.Math.Distance.Between(
            camera.scrollX, camera.scrollY,
            creature.x, creature.y
        );

        if (distance > viewDistance) {
            creature.updateFrequency = 5; // Every 5 frames
            creature.detailLevel = 'low';
        } else {
            creature.updateFrequency = 1;
            creature.detailLevel = 'high';
        }
    });
}
```

### Object Pooling
```javascript
// Pre-allocate common creatures
initializePools() {
    // Pool for zooplankton (frequent spawn/despawn)
    this.pools.zooplankton = this.add.group({
        classType: Zooplankton,
        maxSize: 500,
        createCallback: (plankton) => {
            plankton.setActive(false).setVisible(false);
        }
    });

    // Pool for baitfish
    this.pools.baitfish = this.add.group({
        classType: Fish,
        maxSize: 200,
        createCallback: (fish) => {
            fish.setActive(false).setVisible(false);
        }
    });
}
```

---

## Shader Integration (Future)

All groups are shader-ready for batch rendering:

```javascript
// Render entire baitfish school with single shader
renderBaitfishSchool(school) {
    const positions = school.getChildren().map(f => ({
        x: f.x,
        y: f.y,
        velocity: f.schooling.velocity,
        isPanicking: f.schooling.isPanicking
    }));

    // Pass to instanced shader
    this.baitfishShader.setPositions(positions);
    this.baitfishShader.render();
}

// Render mussel colony with shader
renderMusselColony(colony) {
    // Static positions, can use texture atlas
    this.musselShader.setColony(colony.getChildren());
    this.musselShader.render();
}
```

---

## Migration Path

### Phase 1: Create Group Structure ✅
- Add `this.creatures` and `this.interactionGroups` to GameScene
- Document all creature types

### Phase 2: Migrate Existing Creatures
- ✅ Baitfish → Fish with schooling
- ⏳ Keep Zooplankton as-is
- ⏳ Keep Crayfish as-is
- ❌ Remove BaitfishCloud

### Phase 3: Add New Creatures
- 🆕 ZebraMussel class
- 🆕 Freshwater Drum species
- 🆕 Vegetation (future)

### Phase 4: Optimize
- Spatial partitioning
- Object pooling
- LOD system
- Shader rendering

---

## Educational Value

This system teaches real ecology:
- **Food chains** - Energy flow from plankton to top predators
- **Invasive species** - Zebra mussels impact native ecosystem
- **Adaptation** - Freshwater Drum's pharyngeal teeth
- **Habitat preferences** - Depth zones, temperature, substrate
- **Predator-prey dynamics** - Schooling, fleeing, hunting

---

## Future Additions

**Vegetation Group:**
- Aquatic plants (milfoil, pondweed)
- Provide cover for baitfish
- Spawning habitat for bass
- Oxygenate water

**Insects:**
- Mayfly larvae
- Dragonfly nymphs
- Food for bass and perch

**Detritus/Debris:**
- Fallen logs (bass cover)
- Rocky outcrops (mussel attachment)
- Organic matter (decomposers)

**Seasonal Migrations:**
- Smelt spawn runs (spring)
- Deep water thermal refuges (summer)
- Shallow water feeding (fall)

---

## Summary

This ecological group architecture provides:
- ✅ **Scalable** - Easy to add new species
- ✅ **Performant** - Pre-organized groups, no filtering
- ✅ **Realistic** - Mirrors actual Lake Champlain ecology
- ✅ **Educational** - Teaches food web relationships
- ✅ **Shader Ready** - Batch rendering support
- ✅ **Future Proof** - Extensible for vegetation, detritus, etc.

**Next Step:** Implement `this.creatures` and `this.interactionGroups` in GameScene.js
