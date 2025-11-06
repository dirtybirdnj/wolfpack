# Wolfpack - Fish Mechanics Deep Dive

**Last Updated**: 2025-10-29
**Current Branch**: `claude/fix-scaling-bugs-011CUcEqhv4DwqPffmdgdk6q`

---

## 📋 Overview

This document explains the fish AI, behavior systems, and rendering architecture in Wolfpack. It covers the 7-state AI machine, species-specific behaviors, baitfish flocking, fight mechanics, and the modular species rendering system.

---

## 🧠 Fish AI - 7-State Machine

All predator fish (Lake Trout, Northern Pike, Smallmouth Bass, Yellow Perch) use the same AI state machine implemented in `src/entities/FishAI.js`. The AI switches between states based on hunger, distance to lure/prey, energy levels, and species-specific modifiers.

### State Diagram

```
    IDLE ←→ INTERESTED ←→ CHASING ←→ STRIKING → HOOKED (fight starts)
      ↓          ↓            ↓          ↓
    HUNTING_BAITFISH ←→ FEEDING          FLEEING
```

### State Transitions

**IDLE** → **INTERESTED**
- Lure enters detection range (350px horizontal, 260px vertical)
- Lure speed matches fish speed preference (within 0.5 units)
- Interest score exceeds depth zone threshold (40 for surface, 35 for mid-column, 30 for bottom)
- Frenzy bonus increases interest score by up to 30 points

**INTERESTED** → **CHASING**
- Distance < 60% of detection range (210px) AND aggressiveness check passes
- Persistence: 80% chance to continue chasing based on aggressiveness

**CHASING** → **STRIKING**
- Distance < strike distance (25px for trout/bass/perch, 60px for pike)
- Strike chance: aggressiveness × 0.85 (85% for max aggression)
- Increased 1.5× if lure is inside baitfish cloud

**STRIKING** → **HOOKED** (if successful) or **FLEEING** (if missed)
- Distance < 5px triggers bite attempt
- Fish scene emits `fishStrike` event
- Player must press hookset button (SPACE) to hook fish
- Engaged fish lose 2 swipe chances on miss; non-engaged fish can retry if frenzying

**Any State** → **HUNTING_BAITFISH**
- Baitfish cloud within detection range (400px)
- Hunt score > 0.35 (based on hunger, distance, frenzy, diet preference, size)
- Fish prioritize natural food over lures when hungry

**HUNTING_BAITFISH** → **FEEDING**
- Distance to baitfish < 10px
- Fish consumes baitfish, reduces hunger by nutrition value (15-30 based on species)

**FEEDING** → **HUNTING_BAITFISH** or **IDLE**
- If hunger > 30% and baitfish available: continue hunting (rapid feeding)
- Otherwise: return to idle after 2 seconds

**Any State** → **FLEEING**
- Lure speed too fast (> 2× speed preference) or too slow (< 0.1)
- Fish tries to strike but another fight is in progress
- Engaged fish runs out of swipe chances (fast flee mode)

---

## 🐟 Species-Specific Behaviors

Each species has unique behavioral patterns defined in their AI and species model files.

### Northern Pike (Esox lucius)

**File**: `src/models/species/NorthernPike.js` (138 lines)

**Behavior Type**: Ambush predator

**Key Characteristics** (`src/entities/FishAI.js:37-48`):
```javascript
this.isAmbushPredator = true;
this.ambushPosition = { x: this.fish.worldX, y: this.fish.y };
this.ambushRadius = 50; // Patrol radius
this.strikeRange = 60; // Longer strike range (vs 25 for trout)
this.burstSpeed = 2.5; // Explosive burst multiplier
```

**Movement Patterns**:
- **IDLE**: Stays within 50px of ambush position
- **Dead Zone**: If within 10px of ambush position, becomes nearly motionless (0 horizontal velocity, 0.08 vertical hovering)
- **Patrol**: Drifts slowly back to ambush position at 0.1-0.3× base speed
- **Chase**: Slower chase speed (1.2× instead of 1.8×)
- **Strike**: EXPLOSIVE burst at 5× normal speed (2.5× burst × 2.0× strike multiplier)

**Hunting Style**:
- Wait for prey to come close
- Minimal movement while waiting
- When prey enters range: lightning-fast strike

**Pike Formula** (`NorthernPike.js:14`):
```javascript
length = 13.5 × weight^0.28  // Longer, more slender than trout
```

**Age Range**: 2-22 years (shorter lifespan, faster growth than trout)

---

### Smallmouth Bass (Micropterus dolomieu)

**File**: `src/models/species/SmallmouthBass.js` (154 lines)

**Behavior Type**: Investigative circler

**Key Characteristics** (`src/entities/FishAI.js:51-62`):
```javascript
this.circlesBeforeStrike = true;
this.isCircling = false;
this.circleAngle = Math.random() * Math.PI * 2;
this.circleRadius = 35; // Circle radius around lure
this.circleSpeed = 0.08; // Radians per frame
this.circleDirection = ±1; // Random clockwise/counter-clockwise
this.circleTime = 0;
this.maxCircleTime = 120; // 2 seconds max
```

**Movement Patterns**:
- **Investigation**: Circles lure at 35px radius for up to 2 seconds
- **Direction**: Random clockwise or counter-clockwise
- **Bump Behavior**: 40% chance to bump lure while loitering/investigating
- **Decision**: After circling, decides whether to strike or lose interest

**Engagement Behavior** (`FishAI.js:434-443`):
```javascript
if (this.fish.species === 'smallmouth_bass' && distance < strikeDistance * 1.8) {
    if (Math.random() < 0.4 && !this.hasBumpedLure) {
        this.hasBumpedLure = true;
        this.fish.scene.events.emit('fishBump', this.fish);
    }
}
```

**Bass Formula** (`SmallmouthBass.js:14`):
```javascript
length = 12.0 × weight^0.32  // Stockier than pike, more compressed
```

**Age Range**: 2-18 years

---

### Lake Trout (Salvelinus namaycush)

**File**: `src/models/species/LakeTrout.js` (112 lines)

**Behavior Type**: Pursuit predator (classic chase)

**Key Characteristics**:
- No special behavioral flags (uses base AI behavior)
- Thermocline awareness in summer modes (kayak/motorboat)
- Depth preference: 60-200ft in winter, below thermocline in summer

**Movement Patterns**:
- **IDLE**: Cruises horizontally at preferred depth
- **Chase**: Full speed pursuit (1.8× base speed)
- **Strike**: Standard strike speed (2.5× base speed)
- **Thermocline Behavior** (`FishAI.js:676-701`):
  - If above thermocline (45ft): slowly return below it
  - Drift downward at 0.3× speed until reaching thermocline + 5ft
  - Normal cruising below thermocline

**Depth Preference Calculation** (`FishAI.js:79-94`):
```javascript
// Summer: Stay below thermocline
const minDepth = GameConfig.THERMOCLINE_DEPTH + 5; // 50 feet
const maxDepth = 200; // feet

// Winter: Prefer deeper, cooler water
const minDepth = 60; // feet
const maxDepth = 200; // feet
```

**Trout Formula** (`fish.js:123`):
```javascript
length = 10.5 × weight^0.31  // Balanced proportions
```

**Age Range**: 3-30 years (longest-lived species)

---

### Yellow Perch (Perca flavescens)

**File**: `src/models/species/YellowPerch.js` (147 lines)

**Behavior Type**: Aggressive for size (beginner-friendly)

**Key Characteristics**:
- Small size (2-12 inches, 0.25-2 lbs)
- Higher base aggressiveness for size
- No special behavioral modifiers
- Dual role: Small perch are prey, large perch are predators

**Movement Patterns**:
- Standard pursuit behavior
- More aggressive than size would suggest
- Structure-oriented (prefers areas near bottom/cover)

**Perch Formula** (`YellowPerch.js:14`):
```javascript
length = 11.5 × weight^0.31  // Similar to trout proportions
```

**Age Range**: 2-12 years

---

## 🎣 Engagement System - Swipe Chances

**File**: `src/entities/FishAI.js:333-346, 392-504`

When a fish's speed preference is perfectly matched by the lure, it becomes "engaged" - locked onto the lure with guaranteed pursuit behavior.

### Engagement Trigger (`FishAI.js:276-283`)

```javascript
const speedDiff = Math.abs(lureSpeed - this.fish.speedPreference);
const speedTolerance = 0.5;

if (speedDiff < speedTolerance && distance < GameConfig.DETECTION_RANGE * 0.8) {
    this.engageFish(); // Lock on!
}
```

### Engagement States

**Attacking**: Aggressively chases lure
- Tries to strike if within strike distance
- 85% strike chance based on aggressiveness

**Waiting**: Moves back and forth past lure
- Oscillates around lure position
- `targetX = lure.x + sin(age × 0.05) × 40`

**Loitering**: Stops and watches lure
- Stays in place (`targetX = fish.x`)
- Smallmouth bass: 40% chance to bump lure while loitering

**State Changes**: Every 3 seconds (180 frames), fish randomly picks new engagement state

### Swipe Mechanics (`FishAI.js:336-338`)

```javascript
this.fish.isEngaged = true;
this.fish.swipeChances = Math.floor(Math.random() * 4) + 1; // 1-4 swipes
this.fish.maxSwipeChances = this.fish.swipeChances;
```

**On Miss** (`FishAI.js:557-558`):
- Lose 2 swipe chances
- If swipes remain > 0: return to chasing
- If swipes = 0: **fast flee** mode (4× speed, swims off screen)

**Fast Flee Behavior** (`FishAI.js:506-522, 595-623`):
- Fish swims off screen at 4× normal speed
- 50% chance to "calm down" and stop fleeing before exiting
- If reaches screen edge without calming: marked invisible and removed

---

## 🐠 Baitfish Flocking - 3-Rule Boids Algorithm

**File**: `src/entities/Baitfish.js:160-239`

Baitfish use Craig Reynolds' classic boids algorithm with three flocking rules: separation, cohesion, and alignment.

### Rule 1: Separation

**Purpose**: Prevent overlapping

**Code** (`Baitfish.js:183-188`):
```javascript
const separationRadius = 12; // Minimum distance between fish

if (distance < separationRadius && distance > 0) {
    const strength = (separationRadius - distance) / separationRadius;
    separationX += (dx / distance) * strength * 5;
    separationY += (dy / distance) * strength * 5;
}
```

**Effect**: Baitfish within 12px push away from each other with force inversely proportional to distance.

### Rule 2: Cohesion

**Purpose**: Stay close to neighbors

**Code** (`Baitfish.js:191-194`):
```javascript
const neighborRadius = 50; // Detection range

if (distance < neighborRadius && distance > 0) {
    cohesionX += other.worldX;
    cohesionY += other.y;
    neighborCount++;
}
```

**Effect**: Baitfish steer toward average position of nearby neighbors (within 50px).

### Rule 3: Alignment

**Purpose**: Match swimming direction

**Code** (`Baitfish.js:196-199`):
```javascript
if (distance < neighborRadius && distance > 0) {
    alignmentX += other.velocityX;
    alignmentY += other.velocityY;
    neighborCount++;
}
```

**Effect**: Baitfish match velocity with neighbors, creating synchronized movement.

### Final Movement Calculation (`Baitfish.js:215-235`)

```javascript
// Apply all three rules
if (neighborCount > 0) {
    // Cohesion: Steer toward average position
    const avgX = cohesionX / neighborCount;
    const avgY = cohesionY / neighborCount;
    targetWorldX += (avgX - this.worldX) * 0.05;
    targetY += (avgY - this.y) * 0.05;

    // Alignment: Match average velocity
    const avgVelX = alignmentX / neighborCount;
    const avgVelY = alignmentY / neighborCount;
    velocityX += avgVelX * 0.1;
    velocityY += avgVelY * 0.1;
}

// Separation: Immediate repulsion
velocityX += separationX;
velocityY += separationY;
```

### Panic Response (`Baitfish.js:240-260`)

When predators (lake trout) are nearby:

```javascript
if (lakersNearby) {
    this.panicMode = true;
    // Panic speed: 2.5-3.5× normal speed
    const panicSpeed = this.speciesData.speed.panic;
}
```

**Panic Behaviors by Species** (`SpeciesData.js`):
- **Alewife**: Scatter (random directions)
- **Smelt**: Dive (go deeper)
- **Sculpin**: Hide (seek bottom)
- **Perch**: Scatter
- **Cisco**: Dive

---

## ⚔️ Fight Mechanics

**File**: `src/entities/FishFight.js` (744 lines)

When a fish is hooked, a fight minigame begins with multiple interconnected systems.

### Fight States

**1. Hookset** (0-3 seconds)
- Initial shock phase
- Highest tension period
- Transitions to fighting after 180 frames

**2. Fighting** (main phase)
- Fish actively pulls and swims down
- Thrashing bursts every 5-7 seconds
- Continues until energy < 25%

**3. Thrashing** (2-3 second bursts)
- Violent shaking
- High tension spike
- Hook spit chance (2-15% based on fish size)
- Returns to fighting after thrash

**4. Giving Up** (final phase)
- Energy < 25%
- Reduced resistance
- Easier to reel in

### Biological Condition System (`FishFight.js:28-49`)

Fish strength and energy based on health and hunger:

```javascript
const healthFactor = this.fish.health / 100; // 0-1
const hungerFactor = 1 - (this.fish.hunger / 100); // 0-1 (low hunger = high fight)
const biologicalCondition = (healthFactor + hungerFactor) / 2;

this.fishStrength = (this.fish.weight / 5) * biologicalCondition;
this.fishEnergy = 100 - ((1 - biologicalCondition) * 30);
```

**Example**:
- 20lb fish, 80% health, 40% hunger
- `healthFactor = 0.8`
- `hungerFactor = 0.6` (low hunger = well-fed = strong)
- `biologicalCondition = 0.7`
- `fishStrength = (20/5) × 0.7 = 2.8`
- `fishEnergy = 100 - (0.3 × 30) = 91%`

### Tension System (`FishFight.js:72-87`)

**Tension Sources**:
- Reeling: +15 tension per reel
- Fish pulling: +(strength × energy/100) per frame
- Fish thrashing: +(10-30) during thrash bursts

**Tension Decay**:
- Natural decay: -0.5 per frame
- Line gives when player stops reeling

**Line Break** (`FishFight.js:84-87`):
```javascript
if (this.lineTension >= GameConfig.TENSION_BREAK_THRESHOLD) {
    this.breakLine(); // 100 tension = snap!
}
```

### Hook Spit Chance (`FishFight.js:163-188`)

During thrashing, fish can spit the hook:

```javascript
const baseChance = {
    'SMALL': 0.02,   // 2%
    'MEDIUM': 0.05,  // 5%
    'LARGE': 0.10,   // 10%
    'TROPHY': 0.15   // 15%
};

// Modified by energy
const energyFactor = this.fishEnergy / 100;
const finalChance = baseChance * (0.5 + energyFactor);
```

**Example**: Large fish (10% base) at 80% energy
- `finalChance = 0.10 × (0.5 + 0.8) = 0.13` (13% chance)

### Fish Position During Fight (`FishFight.js:47, 357-371`)

**Critical Fix**: Use fixed reference point to prevent drift

```javascript
// Store ice hole center in constructor
this.centerX = this.lure.x;

// Position fish relative to center (NOT lure!)
this.fish.x = this.centerX + actualThrash;
this.lure.x = this.fish.x + mouthOffset;
```

**Why This Matters**:
- Circular reference (fish → lure → fish) causes accumulating rounding errors
- Using `centerX` as anchor prevents drift
- Fish thrashes around fixed center point
- Lure follows fish mouth position

---

## 🍽️ Diet Preferences & Feeding

**File**: `src/config/SpeciesData.js`, `src/entities/FishAI.js:806-850`

Fish have realistic diet preferences based on Lake Champlain research.

### Diet Matrix (Lake Trout)

```javascript
// From SpeciesData.js calculateDietPreference()
alewife:     0.55  // Highly preferred (55% of diet)
smelt:       0.25  // Common prey (25%)
perch:       0.08  // Opportunistic (8%)
sculpin:     0.08  // Bottom feeding (8%)
cisco:       0.04  // Rare delicacy (4%)
```

### Hunt Score Calculation (`FishAI.js:836-849`)

```javascript
let huntScore = (hungerFactor × 0.6) + (distanceFactor × 0.3) + frenzyBonus;
huntScore += dietPreference × 0.4; // Up to +0.22 for alewife
huntScore += sizeBonus; // Trophy fish: +0.35

// Trophy fish (30+ lbs) hunt much more aggressively
const sizeBonus = this.fish.weight > 30 ? 0.35 :
                 this.fish.weight > 15 ? 0.20 :
                 this.fish.weight > 5 ? 0.10 : 0;

return huntScore > 0.35; // Threshold for hunting
```

### Nutrition Values (`SpeciesData.js`)

```javascript
cisco:   30  // Large, nutritious
smelt:   25  // High fat content
alewife: 20  // Standard
perch:   18  // Moderate
sculpin: 15  // Small, less nutritious
```

### Feeding Mechanics (`fish.js:310-340`)

```javascript
feedOnBaitfish(preySpecies) {
    const nutritionValue = speciesData.nutritionValue;

    // Reduce hunger
    this.hunger = Math.max(0, this.hunger - nutritionValue);

    // If hunger already 0%, excess nutrition heals
    if (previousHunger <= 0) {
        const healthGain = nutritionValue × 0.5;
        this.health = Math.min(100, this.health + healthGain);
    }
}
```

**Example**:
- Fish at 50% hunger eats alewife (nutrition 20)
- Hunger reduced to 30%
- Fish at 0% hunger eats smelt (nutrition 25)
- 0% hunger (already satiated), so 25 × 0.5 = 12.5% health restored

---

## 🌊 Frenzy Mechanics

**File**: `src/entities/FishAI.js:96-174`

Fish enter feeding frenzy when they see others actively hunting or feeding.

### Frenzy Detection (`FishAI.js:96-139`)

**Triggers**:
1. Other fish in INTERESTED, CHASING, STRIKING, **HUNTING_BAITFISH**, or **FEEDING** states
2. Within 3× detection range (1050px visual range)
3. 75% chance to join frenzy (increased from 50%)

**Effects**:
```javascript
this.fish.inFrenzy = true;
this.fish.frenzyIntensity = Math.min(1.0, excitedFish.length × 0.3);
this.fish.frenzyTimer = 300 × (1 + excitedFish.length × 0.4); // 5-15 seconds

// Multiple strike attempts
this.maxStrikeAttempts = Math.floor(Math.random() * 2) + 2; // 2-3 swipes
```

**Intensity Scale**:
- 1 fish feeding: 0.3 intensity
- 2 fish feeding: 0.6 intensity
- 3+ fish feeding: 1.0 intensity (max)

### Vertical Strike Instinct (`FishAI.js:141-174`)

Mid-column and bottom fish can "streak upward" when lure is above them:

**Conditions**:
- Lure at least 20px (5 feet) above fish
- Horizontal distance < 350px (detection range)
- Vertical distance < 260px (vertical detection range)
- 30% chance to trigger

**Effect**:
```javascript
// Streak upward!
this.state = Constants.FISH_STATE.CHASING;
this.fish.inFrenzy = true;
this.fish.frenzyTimer = 400; // Longer duration (6.6 seconds)
this.fish.frenzyIntensity = 0.8;
this.maxStrikeAttempts = 2;
```

**Visual Feedback** (`fish.js:181-183`):
```javascript
triggerInterestFlash(intensity) {
    this.interestFlash = Math.max(this.interestFlash, intensity);
    // Flash renders in debug mode as color overlay
}
```

---

## 🎨 Modular Species Rendering System

**Files**:
- `src/entities/Fish.js` (252 lines) - Factory wrapper
- `src/models/fish.js` (373 lines) - Base biology
- `src/models/species/*.js` - Species-specific rendering

### Architecture Overview

```
Fish (entity wrapper)
  ↓
Fish (model base class) - Biology, movement, hunger, health
  ↓
Species Subclass - Rendering, length/age formulas
```

### Species Subclass Structure

Every species inherits from `Fish` base class and implements:

1. **Constructor**: Calls super with species ID
2. **calculateLength()**: Species-specific length-weight formula
3. **calculateBiologicalAge()**: Age based on weight
4. **render()**: In-game rendering with rotation and flip
5. **renderBody()**: Actual drawing logic (shapes, colors)
6. **renderAtPosition()**: Catch popup rendering (static position)

### Rendering Pattern (Critical!)

**In-Game Rendering** (`NorthernPike.js:38-54`):
```javascript
render(graphics, bodySize, isMovingRight) {
    graphics.save();
    graphics.translateCanvas(this.x, this.y); // Move to fish position

    if (isMovingRight) {
        graphics.rotateCanvas(this.angle);
    } else {
        graphics.scaleCanvas(-1, 1); // Flip horizontally
        graphics.rotateCanvas(-this.angle);
    }

    this.renderBody(graphics, bodySize, colors, 0, 0); // Draw at origin

    graphics.restore();
}
```

**Catch Popup Rendering** (`NorthernPike.js:124-135`):
```javascript
renderAtPosition(graphics, x, y, bodySize) {
    graphics.save();
    graphics.translateCanvas(x, y); // CRITICAL: Use translateCanvas!

    this.renderBody(graphics, bodySize, colors, 0, 0); // Draw at origin

    graphics.restore();
}
```

**Why `translateCanvas()` is Critical**:

Phaser Graphics objects don't use `x` and `y` properties for drawing position (unlike Sprites). Setting `graphics.x = 100` does NOT move where shapes are drawn!

```javascript
// ❌ WRONG - doesn't work with Phaser Graphics
graphics.x = 100;
graphics.y = 100;
graphics.fillCircle(0, 0, 10); // Still draws at (0,0) on screen!

// ✅ CORRECT - use canvas transformation
graphics.save();
graphics.translateCanvas(100, 100); // Shift coordinate system
graphics.fillCircle(0, 0, 10); // Now draws at (100,100)
graphics.restore();
```

This was the root cause of the major "fish not appearing in catch popup" bug (commits 944180e, e7416f2, 865579c).

### Body Rendering Example (`NorthernPike.js:59-119`)

```javascript
renderBody(graphics, bodySize, colors, centerX, centerY) {
    // Pike body - long and cylindrical
    const pikeLength = bodySize × 3.2;
    const pikeHeight = bodySize × 0.6;

    // Main body - olive green
    graphics.fillStyle(colors.base, 1.0);
    graphics.fillEllipse(centerX, centerY, pikeLength, pikeHeight);

    // Belly - light cream
    graphics.fillStyle(colors.belly, 0.9);
    graphics.fillEllipse(centerX, centerY + pikeHeight × 0.15,
                        pikeLength × 0.9, pikeHeight × 0.4);

    // Spots in rows
    graphics.fillStyle(colors.spots, 0.8);
    for (let i = 0; i < spotsPerRow; i++) {
        const spotX = centerX - pikeLength × 0.4 + (i × spotSpacing);
        const spotY = centerY - pikeHeight × 0.15;
        graphics.fillEllipse(spotX, spotY, bodySize × 0.25, bodySize × 0.15);
    }

    // Tail, fins, etc...
}
```

**Color Scheme** (`SpeciesData.js`):
```javascript
appearance: {
    colorScheme: {
        base: 0x4a6a3a,    // Olive green
        belly: 0xf5f5dc,   // Beige/cream
        spots: 0xf5f5dc,   // Cream spots
        fins: 0x3a5a2a     // Dark green fins
    }
}
```

---

## 📊 Key Configuration Values

### Detection Ranges (`GameConfig.js`)

```javascript
DETECTION_RANGE: 350,              // Horizontal detection (px)
VERTICAL_DETECTION_RANGE: 260,     // Vertical detection (px)
STRIKE_DISTANCE: 25,                // How close to strike (normal fish)
BAITFISH_DETECTION_RANGE: 400,     // How far fish see baitfish
BAITFISH_VERTICAL_PURSUIT_RANGE: 200, // Vertical range for hunting
```

### Speed Multipliers (`GameConfig.js`)

```javascript
CHASE_SPEED_MULTIPLIER: 1.8,       // Chasing lure
BAITFISH_PURSUIT_SPEED: 1.6,       // Hunting baitfish
FISH_SPEED_MIN: 0.8,                // Minimum base speed
FISH_SPEED_MAX: 1.5,                // Maximum base speed
```

### Depth Zones (`GameConfig.js`)

```javascript
DEPTH_ZONES: {
    SURFACE: {
        min: 0, max: 50,           // 0-50 feet
        speedMultiplier: 1.0,
        aggressivenessBonus: 0,
        interestThreshold: 40      // Higher = less interested
    },
    MID_COLUMN: {
        min: 50, max: 100,         // 50-100 feet
        speedMultiplier: 1.1,
        aggressivenessBonus: 0.1,
        interestThreshold: 35
    },
    BOTTOM: {
        min: 100, max: 400,        // 100-400 feet
        speedMultiplier: 0.9,
        aggressivenessBonus: 0.2,
        interestThreshold: 30      // Lower = more aggressive
    }
}
```

### Tension System (`GameConfig.js`)

```javascript
TENSION_BREAK_THRESHOLD: 100,      // Line snaps at 100 tension
MIN_REEL_INTERVAL: 200,             // Min ms between reels
TENSION_DECAY_RATE: 0.5,            // Tension decay per frame
```

---

## 🔍 Debugging Fish Behavior

### Enable Debug Mode

Press **backtick (`)** or click "Toggle Debug Info" button

**Shows**:
- Fish states (color-coded by state)
- Detection ranges (yellow circles, 350px)
- Strike distances (red circles, 25px or 60px for pike)
- Connection lines to lure (when tracking/chasing)
- Baitfish cloud boundaries
- Fish info (name, state, hunger, health, frenzy)

### State Colors

```javascript
IDLE:               Green
INTERESTED:         Yellow
CHASING:            Orange
STRIKING:           Red
HOOKED:             Purple
HUNTING_BAITFISH:   Cyan
FEEDING:            Blue
FLEEING:            Gray
```

### Console Logging

**Fish Engagement**:
```javascript
console.log(`Fish ${this.fish.name} engaged with ${this.fish.swipeChances} swipes!`);
console.log(`Fish ${this.fish.name} now ${this.fish.engagementState}`);
console.log(`Engaged fish ${this.fish.name} popped off! Lost 2 swipes, ${this.fish.swipeChances} left`);
```

**Fight Mechanics**:
```javascript
console.log(`Fish condition - Health: ${health}%, Hunger: ${hunger}%, Strength: ${strength}, Energy: ${energy}`);
console.log('Fish transitioned to FIGHTING state');
console.log('Fish entered THRASHING state!');
console.log(`Fish spit the hook! (${chance}% chance)`);
```

### Dev Panel

Located in `index.html`:
- **Spawn Fish** buttons (Trout, Pike, Bass, Perch)
- **Fish Status Panel** - Real-time state, hunger, health, frenzy
- **Lure Weight** selector
- **Fishing Line** type selector
- **Reset Game** button

---

## 🎯 Balance Tuning Guide

### Make Fish More Aggressive

**Increase aggressiveness** (`FishAI.js:13`):
```javascript
this.baseAggressiveness = Math.random() * 0.5 + 0.7; // Was 0.5-1.0, now 0.7-1.2
```

**Lower interest threshold** (`GameConfig.js`):
```javascript
interestThreshold: 25  // Was 30 (lower = more aggressive)
```

**Increase frenzy chance** (`FishAI.js:116`):
```javascript
if (Math.random() < 0.9) {  // Was 0.75 (90% chance to join frenzy)
```

### Make Fish Easier to Catch

**Reduce line tension** (`FishFight.js`):
```javascript
this.fishStrength = (this.fish.weight / 6) * biologicalCondition; // Was /5
```

**Reduce hook spit chance** (`FishFight.js:169-180`):
```javascript
case 'SMALL':  baseChance = 0.01; // Was 0.02
case 'TROPHY': baseChance = 0.10; // Was 0.15
```

**Increase energy drain** (`FishFight.js:207-237`):
```javascript
this.fishEnergy -= energyDrain * 1.5; // Multiply by 1.5 for faster drain
```

### Make Baitfish Tighter

**Reduce spread multiplier** (`BaitfishCloud.js`):
```javascript
this.spreadMultiplier = 0.8; // Was 1.0 when safe
```

**Reduce schooling offset** (`Baitfish.js:33-34`):
```javascript
this.schoolingOffset = {
    x: Utils.randomBetween(-5, 5),  // Was -8, 8
    y: Utils.randomBetween(-3, 3)   // Was -5, 5
};
```

**Increase cohesion weight** (`Baitfish.js:220-221`):
```javascript
targetWorldX += (avgX - this.worldX) * 0.10; // Was 0.05
targetY += (avgY - this.y) * 0.10;
```

---

## 📝 Common Fish AI Patterns

### Check for Lure Before Accessing

```javascript
// ❌ CRASH in nature simulation mode
const distance = Utils.calculateDistance(this.x, this.y, lure.x, lure.y);

// ✅ SAFE - check first
if (!lure) {
    // Nature mode - no lure exists
    return;
}
const distance = Utils.calculateDistance(this.x, this.y, lure.x, lure.y);
```

### Species Detection

```javascript
if (this.fish.species === 'northern_pike') {
    // Pike-specific behavior
} else if (this.fish.species === 'smallmouth_bass') {
    // Bass-specific behavior
}
```

### State Transitions

```javascript
// Always set state, target, cooldown together
this.state = Constants.FISH_STATE.CHASING;
this.targetX = lure.x;
this.targetY = lure.y;
this.decisionCooldown = 100;

// And trigger visual feedback
this.fish.triggerInterestFlash(0.75);
```

### Movement Speed Calculation

```javascript
const movement = this.ai.getMovementVector();
this.worldX += movement.x;  // World coordinates
this.y += movement.y;       // Screen Y (same as world Y)
```

---

## 🐛 Common Issues & Solutions

### Fish Not Responding to Lure

**Check**:
1. Distance within detection range? (350px horizontal, 260px vertical)
2. Lure speed matching fish preference? (check speedPreference property)
3. Fish hunger level? (low hunger = less interested in lure)
4. Interest score calculation (add console.log to idleBehavior)

**Fix**: Lower interest threshold or increase aggressiveness

### Fish Stuck in One Place

**Check**:
1. Is it a Northern Pike in IDLE state? (ambush behavior - intentional)
2. Is targetX/targetY null? (should have movement target)
3. Is movement vector returning 0,0? (check getMovementVector)

**Fix**: Ensure AI state transitions are working

### Baitfish Forming Vertical Line

**Cause**: All baitfish moving toward same x-coordinate (usually screen center)

**Check**: Nature simulation mode detection in SpawningSystem

**Fix** (`SpawningSystem.js`):
```javascript
if (this.scene.iceHoleManager || this.scene.boatManager) {
    cloud.velocity.x = fromLeft ? 0.5 : -0.5;
} else {
    // Nature mode: random direction
    cloud.velocity.x = Utils.randomBetween(-0.8, 0.8);
}
```

### Fish Not Appearing in Catch Popup

**Cause**: Using `graphics.x/y` instead of `translateCanvas()`

**Fix**: See "Modular Species Rendering System" section above

**Files to Check**:
- `src/models/species/LakeTrout.js:100-109`
- `src/models/species/NorthernPike.js:124-135`
- `src/models/species/SmallmouthBass.js:140-151`
- `src/models/species/YellowPerch.js:133-144`

---

**Remember**: Fish behavior is a complex system with many interacting factors. Always test changes in all game modes (ice, kayak, boat, nature simulation) to ensure consistent behavior!
