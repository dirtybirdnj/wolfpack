# Ecosystem Integration - Crayfish & Zooplankton

**Date:** 2025-11-05
**Status:** CRITICAL ADDITION TO REFACTOR PLAN

---

## The Missing Pieces

The entity/model refactor plan focused on **fish** but missed two critical ecosystem members:
- **Zooplankton** - Food for baitfish (bottom of food chain)
- **Crayfish** - Food for predators, hunter of zooplankton (middle of chain)

These follow the same entity/model pattern as fish and need the same treatment!

---

## Current Architecture (Same Problem!)

### Zooplankton
```
Zooplankton (entity wrapper)
├── graphics: Graphics object
└── model: ZooplanktonModel
    └── extends: AquaticOrganism
```

**Same issues as fish:**
- Entity/model split (unnecessary)
- Manual graphics rendering
- Not using Sprites

### Crayfish
```
Crayfish (entity wrapper)
├── graphics: Graphics object
└── model: CrayfishModel
    └── extends: AquaticOrganism
```

**Same issues:**
- Entity/model split
- Manual graphics rendering
- No Phaser features used

---

## Food Chain Hierarchy

Understanding the relationships:

```
FOOD CHAIN:
├── Zooplankton (prey only)
│   └── Eaten by: Baitfish, Crayfish
│
├── Crayfish (predator + prey)
│   ├── Eats: Zooplankton
│   └── Eaten by: Bass, Lake Trout, Pike
│
├── Baitfish (predator + prey)
│   ├── Eats: Zooplankton
│   └── Eaten by: ALL predator fish
│
└── Predator Fish (predator, some can be prey)
    ├── Yellow Perch: Eats baitfish, eaten by larger fish
    ├── Smallmouth Bass: Eats baitfish + crayfish + perch
    ├── Northern Pike: Top predator, eats everything
    └── Lake Trout: Top predator, eats everything
```

---

## Proposed Unified Architecture

### Option A: Extend to All Organisms (RECOMMENDED)

Create a unified **OrganismSprite** base class:

```
Phaser.GameObjects.Sprite
└── OrganismSprite (base for ALL water creatures)
    ├── FishSprite (schooling, hunting, biology)
    ├── CrayfishSprite (hunting zooplankton, fleeing predators)
    └── ZooplanktonSprite (drifting, consumed by others)
```

**Benefits:**
- Consistent architecture across entire ecosystem
- Shared behaviors (consumed, position, depth)
- All use Phaser Sprites (GPU rendering)
- Can use Groups for pooling

**Implementation:**
```javascript
// sprites/OrganismSprite.js (base class)
export class OrganismSprite extends Phaser.GameObjects.Sprite {
    constructor(scene, worldX, y, texture) {
        super(scene, 0, y, texture);
        scene.add.existing(this);

        this.worldX = worldX;
        this.consumed = false;
        this.age = 0;
    }

    // Common methods all organisms share
    markConsumed() {
        this.consumed = true;
        this.setActive(false);
        this.setVisible(false);
    }

    updateScreenPosition() {
        const canvasWidth = this.scene.scale.width;
        const playerWorldX = canvasWidth / 2;
        const offsetFromPlayer = this.worldX - playerWorldX;
        this.x = (canvasWidth / 2) + offsetFromPlayer;
    }
}

// sprites/FishSprite.js
export class FishSprite extends OrganismSprite {
    constructor(scene, worldX, y, species) {
        super(scene, worldX, y, `fish_${species}`);
        // Fish-specific: schooling, hunting, biology
    }
}

// sprites/CrayfishSprite.js
export class CrayfishSprite extends OrganismSprite {
    constructor(scene, worldX, y) {
        super(scene, worldX, y, 'crayfish');

        // Crayfish-specific behavior
        this.speed = 0.5;
        this.burstSpeed = 5.0; // Escape burst
        this.burstState = 'idle';
        this.currentTarget = null; // Zooplankton target
        this.threatened = false;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Hunt zooplankton
        if (!this.threatened && this.currentTarget) {
            this.huntZooplankton(delta);
        }

        // Flee from predators
        if (this.threatened) {
            this.performBurstEscape(delta);
        }

        this.updateScreenPosition();
    }

    huntZooplankton(delta) {
        // Move toward target zooplankton
        // Consume if close enough
    }

    performBurstEscape(delta) {
        // Rapid backward swim
        // Gradually slow down
    }
}

// sprites/ZooplanktonSprite.js
export class ZooplanktonSprite extends OrganismSprite {
    constructor(scene, worldX, y) {
        super(scene, worldX, y, 'zooplankton');

        // Zooplankton-specific
        this.speed = 0.2; // Slow drift
        this.hue = Phaser.Math.Between(0, 360);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Slow vertical drift
        this.worldX += this.speed * Math.sin(time * 0.001);
        this.y += this.speed * Math.cos(time * 0.002);

        // Keep within bounds
        this.enforceBoundaries();
        this.updateScreenPosition();
    }
}
```

---

### Option B: Keep Separate (NOT RECOMMENDED)

Keep crayfish and zooplankton as-is, only refactor fish.

**Problems:**
- Inconsistent architecture
- Still using manual graphics for crayfish/zooplankton
- Can't use Groups/pooling for them
- Harder to maintain

**Only choose this if:** Time is critical and you want to ship fish refactor first.

---

## Updated SpeciesData Structure

Add organism types:

```javascript
// config/OrganismData.js (renamed from SpeciesData.js)

export const ORGANISM_TYPES = {
    // ZOOPLANKTON (base of food chain)
    zooplankton: {
        type: 'zooplankton',
        category: 'prey',
        size: 1,
        speed: { base: 0.2 },
        canBeEaten: true,
        canEat: [],
        depthRange: { min: 20, max: 100 },
        spawnInGroups: true,
        groupSize: { min: 50, max: 200 }
    },

    // CRAYFISH (middle predator)
    crayfish: {
        type: 'crayfish',
        category: 'predator_prey',
        size: 2,
        speed: { base: 0.5, burst: 5.0 },
        canBeEaten: true,
        canEat: ['zooplankton'],
        depthRange: { min: 80, max: 100 }, // Bottom dwellers
        burstEscape: {
            duration: 500,  // ms
            cooldown: 3000, // ms
            triggerRadius: 100 // Distance from predator
        }
    },

    // BAITFISH
    alewife: {
        type: 'fish',
        category: 'prey',
        subtype: 'bait',
        canBeEaten: true,
        canEat: ['zooplankton'],
        schooling: { /* ... */ }
    },

    // PREDATOR FISH
    smallmouth_bass: {
        type: 'fish',
        category: 'predator',
        subtype: 'gamefish',
        canBeEaten: false,
        canEat: ['zooplankton', 'crayfish', 'bait', 'yellow_perch'],
        hunting: {
            preferredPrey: ['crayfish', 'bait'], // Bass love crayfish!
            /* ... */
        }
    }
};

export function getOrganismData(type) {
    return ORGANISM_TYPES[type];
}

export function canEat(predator, prey) {
    const predatorData = getOrganismData(predator);
    const preyData = getOrganismData(prey);
    return predatorData.canEat.includes(preyData.category) ||
           predatorData.canEat.includes(preyData.subtype);
}
```

---

## Food Chain System

Create a system to manage ecosystem interactions:

```javascript
// systems/FoodChainSystem.js

export class FoodChainSystem {
    constructor(scene) {
        this.scene = scene;
    }

    update() {
        // Crayfish hunt zooplankton
        this.updateCrayfishFeeding();

        // Baitfish hunt zooplankton
        this.updateBaitfishFeeding();

        // Predators hunt crayfish
        this.updatePredatorFeeding();

        // Predators hunt baitfish (already exists)
    }

    updateCrayfishFeeding() {
        this.scene.crayfish.forEach(crayfish => {
            if (crayfish.consumed || !crayfish.active) return;

            // Find nearby zooplankton
            const nearby = this.scene.zooplankton.filter(zp =>
                zp.active && !zp.consumed &&
                Phaser.Math.Distance.Between(
                    crayfish.worldX, crayfish.y,
                    zp.worldX, zp.y
                ) < 50
            );

            // Target closest
            if (nearby.length > 0) {
                crayfish.currentTarget = nearby[0];

                // Check if close enough to eat
                const dist = Phaser.Math.Distance.Between(
                    crayfish.worldX, crayfish.y,
                    crayfish.currentTarget.worldX, crayfish.currentTarget.y
                );

                if (dist < 10) {
                    crayfish.currentTarget.markConsumed();
                    crayfish.currentTarget = null;
                }
            }
        });
    }

    updateBaitfishFeeding() {
        // Similar logic for baitfish eating zooplankton
        // (Already exists in current code, just needs cleanup)
    }

    updatePredatorFeeding() {
        this.scene.fishes.forEach(fish => {
            if (fish.type !== 'predator') return;

            const preyData = getOrganismData(fish.species);

            // Can this fish eat crayfish?
            if (preyData.canEat.includes('crayfish')) {
                this.checkCrayfishConsumption(fish);
            }
        });
    }

    checkCrayfishConsumption(fish) {
        const nearby = this.scene.crayfish.filter(cf =>
            cf.active && !cf.consumed &&
            Phaser.Math.Distance.Between(
                fish.worldX, fish.y,
                cf.worldX, cf.y
            ) < fish.hunting.visionRange
        );

        if (nearby.length > 0 && fish.hunting.canStrike()) {
            const target = nearby[0];
            // Trigger crayfish escape burst
            target.threatened = true;
            target.burstState = 'escaping';

            // Fish tries to catch
            // ... hunting logic
        }
    }
}
```

---

## Updated Refactor Plan

### NEW Phase 1b: Extend to All Organisms

After creating unified FishSprite, apply same pattern to others:

**Step 1: Create OrganismSprite base**
- Location: `src/sprites/OrganismSprite.js`
- Common properties: worldX, consumed, age, updateScreenPosition()

**Step 2: Create CrayfishSprite**
- Location: `src/sprites/CrayfishSprite.js`
- Extends: OrganismSprite
- Behavior: Hunt zooplankton, burst escape from predators
- Merge: `entities/Crayfish.js` + `models/crayfish.js`

**Step 3: Create ZooplanktonSprite**
- Location: `src/sprites/ZooplanktonSprite.js`
- Extends: OrganismSprite
- Behavior: Slow drift, consumed by baitfish/crayfish
- Merge: `entities/Zooplankton.js` + `models/zooplankton.js`

**Step 4: Create FoodChainSystem**
- Location: `src/systems/FoodChainSystem.js`
- Manages all predator-prey interactions
- Replaces scattered feeding logic

**Step 5: Create OrganismData.js**
- Location: `src/config/OrganismData.js`
- Unified config for ALL organisms
- Includes fish, crayfish, zooplankton

---

## Spawning Updates

```javascript
// SpawningSystem.js

spawnOrganism(type, worldX, y) {
    const data = getOrganismData(type);
    let organism;

    switch(data.category) {
        case 'prey':
            if (type === 'zooplankton') {
                organism = new ZooplanktonSprite(this.scene, worldX, y);
            } else {
                organism = new FishSprite(this.scene, worldX, y, type);
            }
            break;

        case 'predator_prey':
            organism = new CrayfishSprite(this.scene, worldX, y);
            break;

        case 'predator':
            organism = new FishSprite(this.scene, worldX, y, type);
            break;
    }

    // Add to appropriate collection
    this.addToCollection(organism);
    return organism;
}

addToCollection(organism) {
    const data = getOrganismData(organism.type || organism.species);

    if (data.type === 'zooplankton') {
        this.scene.zooplanktonGroup.add(organism);
    } else if (data.type === 'crayfish') {
        this.scene.crayfishGroup.add(organism);
    } else if (data.type === 'fish') {
        this.scene.fishGroup.add(organism);
    }
}
```

---

## GameScene Collections (Updated)

```javascript
// OLD (manual arrays):
this.fishes = [];
this.baitfishSchools = [];
this.crayfish = [];
this.zooplankton = [];

// NEW (Phaser Groups with pooling):
this.fishGroup = this.add.group({
    classType: FishSprite,
    maxSize: 150,
    runChildUpdate: true
});

this.crayfishGroup = this.add.group({
    classType: CrayfishSprite,
    maxSize: 50,
    runChildUpdate: true
});

this.zooplanktonGroup = this.add.group({
    classType: ZooplanktonSprite,
    maxSize: 500, // Lots of zooplankton!
    runChildUpdate: true
});
```

---

## Deletion Targets (UPDATED)

### Legacy Entity Files (Add to delete list)
- ❌ `entities/Fish.js` (1010 lines)
- ❌ `entities/Baitfish.js` (120 lines)
- ❌ `entities/BaitfishCloud.js` (170 lines)
- ❌ **`entities/Crayfish.js`** (205 lines) ← NEW
- ❌ **`entities/Zooplankton.js`** (174 lines) ← NEW

### Legacy Model Files (Add to delete list)
- ❌ `models/fish.js` (593 lines)
- ❌ `models/baitfish.js` (604 lines)
- ❌ **`models/crayfish.js`** (83 lines) ← NEW
- ❌ **`models/zooplankton.js`** (82 lines) ← NEW
- ⚠️ `models/AquaticOrganism.js` (89 lines) - Can delete if using OrganismSprite base

**NEW Total Deletion:** ~2,800 lines (was 2,300)

---

## Testing Checklist (UPDATED)

### Organism Spawning
- [ ] Zooplankton spawn in groups
- [ ] Crayfish spawn on bottom
- [ ] Alewife spawn and school
- [ ] All fish species spawn

### Food Chain Interactions
- [ ] Baitfish eat zooplankton
- [ ] Crayfish eat zooplankton
- [ ] Crayfish perform burst escape when threatened
- [ ] Bass hunt crayfish
- [ ] Lake trout hunt crayfish
- [ ] Pike hunt crayfish
- [ ] Predators hunt baitfish (existing)

### Visual Verification
- [ ] Zooplankton render correctly (small particles)
- [ ] Crayfish render on bottom (claws, body)
- [ ] Burst escape looks good (fast backward motion)
- [ ] All organisms use Sprites (not Graphics)

### Performance
- [ ] 60fps with 200 zooplankton
- [ ] 60fps with 30 crayfish
- [ ] 60fps with 100+ fish
- [ ] No memory leaks

---

## Recommended Approach

### Option 1: Do It All Together (RECOMMENDED)
Refactor fish, crayfish, and zooplankton in one go.

**Pros:**
- Consistent architecture across ecosystem
- Only one round of testing
- Cleaner end result

**Cons:**
- Larger scope
- More to test
- ~2 hours more work

**Timeline:** 10-14 hours (was 8-12)

### Option 2: Fish First, Others Later
Complete fish refactor, then come back for crayfish/zooplankton.

**Pros:**
- Smaller initial scope
- Can ship fish improvements sooner
- Learn from fish refactor

**Cons:**
- Two rounds of testing
- Inconsistent architecture temporarily
- Might forget to come back

**Timeline:** 8-12 hours (fish), then 2-3 hours (others)

---

## My Recommendation

**Do Option 1: All together**

**Reasoning:**
1. **Already in refactor mode** - might as well finish the job
2. **Crayfish/zooplankton are simpler** than fish (no AI, no schooling)
3. **Only +2 hours** to include them
4. **Cleaner result** - entire ecosystem uses same pattern
5. **Easier to test** - verify food chain works end-to-end

**Updated phases:**
- Phase 1a: Fish refactor (6 hours)
- Phase 1b: Crayfish & Zooplankton (2 hours)
- Phase 2-6: Same as before (2-4 hours)

**Total: 10-14 hours** (manageable in 1-2 sessions)

---

## Next Steps

1. **Update ENTITY_REFACTOR.md** to include crayfish/zooplankton
2. **Update TODO list** to add organism sprites
3. **Decide:** All together or fish first?
4. **Launch!** 🚀

---

*Last Updated: 2025-11-05*
*Critical Addition: Ecosystem-wide refactor*
