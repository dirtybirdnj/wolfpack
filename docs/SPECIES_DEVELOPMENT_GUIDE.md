# Species Development Guide

This guide documents the process for adding new fish species to the Lake Champlain fishing game.

## Current Species Implemented (4 Predators)

1. **Lake Trout** - Deep-water coldwater specialist (15-120 ft)
   - Main gamefish, active pursuit hunter
   - Grayish-olive coloring, streamlined body
   - Weight: 2-40 lbs, Spawn rate: 30%

2. **Northern Pike** - Shallow ambush predator (8-30 ft)
   - Ambush behavior with dead zone mechanic
   - Olive green with spots, elongated body
   - Weight: 3-35 lbs, Spawn rate: 15%

3. **Smallmouth Bass** - Mid-depth structure fighter (10-40 ft)
   - Circling behavior before striking
   - Bronze with vertical bars, red eyes
   - Weight: 1-8 lbs, Spawn rate: 15%

4. **Yellow Perch** - Shallow beginner species (5-25 ft)
   - Opportunistic feeder, easy difficulty
   - Golden yellow with dark bars, orange fins
   - Weight: 0.3-3 lbs, Spawn rate: 40%

## Baitfish Species Implemented (5 Species)

1. **Alewife** - Most abundant invasive (20-80 ft) - 40% spawn
2. **Rainbow Smelt** - Preferred prey (30-80 ft) - 30% spawn
3. **Yellow Perch** (juvenile) - Shallow schools (10-40 ft) - 20% spawn
4. **Sculpin** - Bottom dwellers (80-120 ft) - 10% spawn
5. **Cisco** - Rare deep-water (60-100 ft) - 10% chance in deep water

## Potential Future Species

### High Priority Lake Champlain Species

1. **Walleye** (Sander vitreus)
   - Mid-depth structure-oriented predator (15-50 ft)
   - Excellent low-light hunter (dawn/dusk specialist)
   - Weight: 2-15 lbs
   - Behavior: Coordinated pack hunting, light-sensitive
   - Difficulty: Medium

2. **Chain Pickerel** (Esox niger)
   - Shallow ambush predator like pike (5-20 ft)
   - Weight: 0.5-4 lbs
   - Behavior: Similar to pike but smaller, more aggressive
   - Difficulty: Easy-Medium

3. **Atlantic Salmon** (Salmo salar) - *Landlocked*
   - Deep coldwater sportfish (20-100 ft)
   - Weight: 3-20 lbs
   - Behavior: Active pursuit, strong fighter
   - Difficulty: Hard

4. **Rock Bass** (Ambloplites rupestris)
   - Shallow structure-oriented (5-30 ft)
   - Weight: 0.2-2 lbs
   - Behavior: Opportunistic, easy to catch
   - Difficulty: Easy

5. **White Perch** (Morone americana)
   - School-oriented mid-depth (10-40 ft)
   - Weight: 0.3-2 lbs
   - Behavior: Schools like yellow perch, aggressive
   - Difficulty: Easy

6. **Burbot** (Lota lota) - *Unique coldwater species*
   - Bottom-dwelling nocturnal predator (40-120 ft)
   - Weight: 2-15 lbs
   - Behavior: Night-only activity, slow but strong
   - Difficulty: Medium-Hard

### Premium/Trophy Species

7. **Muskellunge** (Esox masquinongensis) - *Trophy*
   - Large ambush predator (10-50 ft)
   - Weight: 10-50+ lbs
   - Behavior: "Fish of 10,000 casts", ultra-rare
   - Difficulty: Very Hard

8. **Brown Trout** (Salmo trutta)
   - Mid to deep coldwater (20-80 ft)
   - Weight: 2-20 lbs
   - Behavior: Cautious, selective feeder
   - Difficulty: Hard

## Step-by-Step Species Addition Process

### Step 1: Add Species Data (SpeciesData.js)

Location: `/home/user/wolfpack/src/config/SpeciesData.js`

Add new species object with complete configuration:

```javascript
species_name: {
    name: 'Display Name',
    sizeCategories: {
        small: { weightRange: [min, max], aggressivenessMultiplier: 1.0 },
        medium: { weightRange: [min, max], aggressivenessMultiplier: 1.2 },
        large: { weightRange: [min, max], aggressivenessMultiplier: 1.4 },
        trophy: { weightRange: [min, max], aggressivenessMultiplier: 1.6 }
    },
    behavior: {
        huntingStyle: 'active_pursuit' | 'ambush' | 'opportunistic',
        territorialBehavior: {
            circlingBehavior: true/false,
            cautionLevel: 'low' | 'medium' | 'high'
        },
        feedingPeriods: ['dawn', 'day', 'dusk', 'night'] // when most active
    },
    dietPreferences: {
        baitfish: {
            alewife: 1.0,
            rainbow_smelt: 1.0,
            // ... other preferences
        }
    },
    fightCharacteristics: {
        stamina: 'low' | 'medium' | 'high' | 'very_high',
        difficulty: 'easy' | 'medium' | 'hard' | 'very_hard',
        runDistance: { min: 10, max: 30 }, // pixels when hooked
        stripLineChance: 0.05 // probability per frame
    },
    appearance: {
        colorScheme: {
            base: 0x6b5d3f, // hex color
            secondary: 0x4a3f2f,
            accent: 0x3a2f1f,
            belly: 0xd4c9a8,
            fins: 0x6b5d3f,
            bars: 0x3a2f1f, // for patterned species
            spots: 0x2a1f0f, // for spotted species
            eyes: 0xcc3333
        },
        bodyShape: {
            lengthRatio: 2.2, // body length multiplier
            heightRatio: 0.9, // body height multiplier
            pattern: 'vertical_bars' | 'spots' | 'mottled' | 'plain'
        }
    }
}
```

### Step 2: Add Rendering Method (Fish.js)

Location: `/home/user/wolfpack/src/entities/Fish.js`

Add species-specific render method:

```javascript
renderSpeciesName(bodySize, isMovingRight) {
    const colors = this.speciesData.appearance.colorScheme;
    const lengthRatio = this.speciesData.appearance.bodyShape.lengthRatio;
    const heightRatio = this.speciesData.appearance.bodyShape.heightRatio;

    const fishLength = bodySize * lengthRatio;
    const fishHeight = bodySize * heightRatio;

    // Draw body
    this.graphics.fillStyle(colors.base, 1.0);
    this.graphics.fillEllipse(0, 0, fishLength, fishHeight);

    // Add patterns (bars, spots, etc.)
    // See existing render methods for examples

    // Draw fins
    this.graphics.fillStyle(colors.fins, 0.9);
    // ... fin rendering code

    // Draw eye
    const eyeX = isMovingRight ? fishLength / 2 - bodySize * 0.2 : -fishLength / 2 + bodySize * 0.2;
    this.graphics.fillStyle(colors.eyes, 1.0);
    this.graphics.fillCircle(eyeX, -fishHeight / 4, bodySize * 0.12);
}
```

Add species check in main render methods:

```javascript
// In render() method
if (species === 'species_name') {
    this.renderSpeciesName(bodySize, isMovingRight);
} else if ...

// In renderAtPosition() method (for caught fish display)
if (species === 'species_name') {
    this.renderSpeciesName(bodySize, isMovingRight);
} else if ...
```

Add species-specific length formula:

```javascript
// In constructor after weight is set
if (species === 'species_name') {
    this.length = Math.round(baseConstant * Math.pow(this.weight, exponent));
} else if ...
```

### Step 3: Add AI Behavior (FishAI.js) - If Needed

Location: `/home/user/wolfpack/src/entities/FishAI.js`

Only add if species has unique hunting behavior:

```javascript
// In constructor - for special behaviors
if (this.fish.species === 'species_name') {
    // Set up unique behavior flags
    this.uniqueBehaviorFlag = true;
    this.customParameter = value;
}

// In getMovement() - implement behavior logic
if (this.uniqueBehaviorFlag) {
    // Custom movement logic
    return { x: ..., y: ... };
}
```

### Step 4: Update Spawn Distribution (GameScene.js)

Location: `/home/user/wolfpack/src/scenes/GameScene.js`

In `trySpawnFish()` method (around line 960):

```javascript
// Update spawn percentages (must total 100%)
const speciesRoll = Math.random();
if (speciesRoll < 0.XX) {
    species = 'species_1';
} else if (speciesRoll < 0.YY) {
    species = 'species_2';
} else if (speciesRoll < 0.ZZ) {
    species = 'new_species'; // Add new species
} else {
    species = 'species_N';
}
```

Add depth range logic:

```javascript
// Add depth range for new species
if (species === 'new_species') {
    depth = Utils.randomBetween(minDepth, maxDepth);
} else if ...
```

### Step 5: Test the Species

Run through testing checklist (see SPECIES_TESTING_CHECKLIST.md)

### Step 6: Commit Changes

```bash
git add .
git commit -m "Add [Species Name] as new predator species

- Added species data to SpeciesData.js
- Implemented species-specific rendering in Fish.js
- [Added unique AI behavior if applicable]
- Updated spawn distribution to [X]%
- Species spawns at [min-max] feet depth

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Code Patterns and Best Practices

### Weight-to-Length Formulas

Species-specific formulas based on real biology:

- **Elongated predators** (pike, pickerel): `13.5 * weight^0.28`
- **Compact fighters** (bass): `11.2 * weight^0.33`
- **Small panfish** (perch, rock bass): `9.5 * weight^0.35`
- **Streamlined trout**: `10.5 * weight^0.31`

### Spawn Rate Guidelines

Balance spawn rates to create good gameplay:

- **Beginner species** (easy to catch): 30-40%
- **Main gamefish**: 25-35%
- **Challenging species**: 10-20%
- **Trophy/rare species**: 1-5%

Total must equal 100%

### Depth Ranges by Species Type

- **Surface feeders**: 5-30 ft
- **Mid-depth**: 15-60 ft
- **Deep coldwater**: 40-120 ft
- **Bottom dwellers**: 80-120 ft

### Behavior Archetypes

1. **Active Pursuit** (trout, salmon)
   - Chase moving lures aggressively
   - High speed, direct approach
   - Multiple strike attempts

2. **Ambush** (pike, muskie)
   - Wait motionless, explosive strikes
   - Dead zone mechanic (no movement when close to ambush point)
   - Short chase distance

3. **Circling** (bass, walleye)
   - Approach cautiously, circle before striking
   - Inspect lure from multiple angles
   - Can be spooked by fast movements

4. **Opportunistic** (panfish, rock bass)
   - Strike readily, not picky
   - Easy difficulty, good for beginners
   - Small but eager

## File Reference Quick Guide

### Files That Need Changes for Every Species

1. **SpeciesData.js** - Species data configuration
2. **Fish.js** - Rendering and display
3. **GameScene.js** - Spawn distribution and depth ranges

### Files That Sometimes Need Changes

1. **FishAI.js** - Only if unique hunting behavior required
2. **GameConfig.js** - Only if adding new game constants

### Files That Don't Need Changes

1. **FishFight.js** - Fight mechanics are generic
2. **Lure.js** - Lure behavior is species-agnostic
3. **SonarDisplay.js** - Rendering is automatic

## Debugging Tips

- Add console.log() in Fish.js constructor to verify species spawning
- Use debug mode (X button on gamepad) to see fish AI states
- Check browser console for species data loading errors
- Test at different depths to verify spawn ranges
- Catch 10-20 fish to verify size distribution

## Current Game Balance

Total spawn distribution (must = 100%):
- Yellow Perch: 40% (beginner-friendly)
- Lake Trout: 30% (main gamefish)
- Northern Pike: 15% (challenge)
- Smallmouth Bass: 15% (challenge)

When adding new species, adjust these percentages while maintaining good balance between easy and hard species.

## Questions for Next Species

Before adding a new species, decide:

1. What role does it play? (beginner, main gamefish, trophy, etc.)
2. What spawn rate? (affects how common it is)
3. What depth range? (affects when players encounter it)
4. What unique behavior? (ambush, circling, pack hunting, etc.)
5. What difficulty? (easy, medium, hard, very hard)
6. What weight range? (affects points and excitement)

---

**Last Updated**: Current as of Yellow Perch implementation (4 predator species)
**Next Recommended Species**: Walleye or Chain Pickerel
