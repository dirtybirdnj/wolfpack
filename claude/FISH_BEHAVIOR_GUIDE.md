# Fish Behavior Mechanics Guide

## Overview

The fish AI system is the most complex part of the game, consisting of a sophisticated 7-state machine with species-specific behaviors. This guide explains how fish detect, evaluate, and react to the player's lure, their natural hunting behaviors, and the complete ecosystem simulation including baitfish flocking.

**Primary Files:**
- `/src/entities/FishAI.js` (896 lines) - AI state machine and decision logic
- `/src/entities/Fish.js` (1,145 lines) - Fish entity with species rendering
- `/src/config/SpeciesData.js` (924 lines) - All species definitions
- `/src/config/GameConfig.js` (165 lines) - Tunable parameters
- `/src/entities/Baitfish.js` (638 lines) - Baitfish flocking behavior
- `/src/entities/BaitfishCloud.js` (464 lines) - Cloud management

---

## Species System (10 Total Species)

### Predator Fish (5 Species)

#### 1. Lake Trout (50% spawn weight)
**Biology:**
- Size: 2-40 lbs (Small/Medium/Large/Trophy categories)
- Temperature: Optimal 50°F, range 38-52°F
- Diet: Alewife (55%), Rainbow Smelt (25%), Sculpin (8%), Perch (8%), Cisco (4%)
- Depth: 40-100ft (winter), 50-120ft (summer thermocline)

**Behavior:**
- **Pursuit hunter** - Classic chase predator
- Cold-water specialist (avoids warm surface in summer)
- Thermocline-aware (stays below 35ft in warm weather)
- Active during low-light conditions (dawn/dusk)
- Deep dives during fight

**AI Characteristics:**
- State progression: IDLE → INTERESTED → CHASING → STRIKING
- Interest threshold: 40 (mid-column), 30 (surface), 50 (bottom)
- Strike distance: 25 pixels (standard)
- Chase speed multiplier: 1.8x
- No special behaviors (baseline species)

---

#### 2. Northern Pike (25% spawn weight)
**Biology:**
- Size: 3-35 lbs (Medium/Large/Trophy most common)
- Temperature: Optimal 65°F, range 50-75°F
- Habitat: Shallow structure (5-30ft), weed beds, drop-offs
- Diet: Opportunistic ambush feeder

**Behavior:**
- **AMBUSH PREDATOR** - Unique AI pattern
- Sits motionless at ambush point
- Patrols small area (50px radius around ambush spot)
- Patience timer: Waits 180-360 frames before attacking
- Explosive burst speed when striking (2.5x multiplier)
- Shallow water preference (5-30ft)

**AI Characteristics:**
- **Special State:** AMBUSH (sub-state of IDLE)
- Ambush point selection: Random within territory
- Patrol radius: 50 pixels
- Patience duration: 3-6 seconds before strike
- **Extended strike range:** 60 pixels (vs 25px standard)
- Burst speed: 2.5x (fastest in game)
- Aggression bonus in shallow water (+0.3)

**How It Works:**
```javascript
// Pike-specific AI loop:
1. Enter IDLE state
2. Select ambush point (random x/y in territory)
3. Move to ambush point slowly
4. Wait (patience timer: 180-360 frames)
5. When lure enters extended range (60px):
   - Calculate interest score
   - If interested: BURST toward lure at 2.5x speed
6. Either strike or return to new ambush point
```

**Strategic Implications:**
- Pike appear inactive but are waiting
- Sudden explosive strikes
- Easier to catch in shallow water
- Best tactic: Drop lure near structure and wait

---

#### 3. Smallmouth Bass (15% spawn weight)
**Biology:**
- Size: 1-22 lbs (Small/Medium/Large common, Trophy rare)
- Temperature: Optimal 68°F, range 55-78°F
- Habitat: Rocky structure (10-50ft), ledges, boulders
- Diet: Crayfish, small fish, insects

**Behavior:**
- **ACTIVE PREDATOR** - Investigates before striking
- **Circling behavior** - Unique to bass (35px radius)
- Circles lure for 0.5-2 seconds before commitment
- Highly acrobatic fight (40% jump chance)
- Line-shy but opportunistic
- Territorial during spawn

**AI Characteristics:**
- **Special State:** CIRCLING (sub-state of INTERESTED)
- Circle radius: 35 pixels
- Circle duration: 30-120 frames (0.5-2 seconds)
- Circle direction: Random (clockwise or counter-clockwise)
- After circling: 70% chance to CHASE, 30% to flee
- Strike distance: 25 pixels (standard)
- **Jump chance during fight:** 40% (highest in game)

**How It Works:**
```javascript
// Bass-specific AI loop:
1. Enter IDLE state, monitoring lure
2. If lure detected and interesting:
   → Enter INTERESTED state
3. Move toward lure slowly
4. **Enter CIRCLING sub-state:**
   - Maintain 35px distance from lure
   - Circle around lure (clockwise or counter-clockwise)
   - Duration: 30-120 frames
   - Constantly re-evaluate interest
5. After circling:
   - 70% chance: → CHASING (committed)
   - 30% chance: → FLEEING (spooked, lure looks fake)
6. If CHASING: Standard strike logic
```

**Strategic Implications:**
- Bass "inspect" the lure before biting
- Visible circling behavior on sonar
- Stop jigging during circle (let bass investigate)
- If bass flees, wait and try again
- Acrobatic fight requires careful tension management

---

#### 4. Yellow Perch - Large (10% spawn weight)
**Biology:**
- Size: 0.5-3 lbs (Small/Medium most common)
- Temperature: Optimal 65°F, range 50-75°F
- Habitat: Structure-oriented (15-35ft), schools by size
- Diet: Zooplankton, insects, small fish

**Behavior:**
- **BEGINNER-FRIENDLY** - Easiest to catch
- Aggressive for their size
- Schools by size (loose formations)
- Active all day (not time-dependent)
- Weak fight, easy to land

**AI Characteristics:**
- **Low interest threshold:** 25 (very easy to interest)
- High aggressiveness multiplier: 0.7-1.0 (always high end)
- **High strike chance:** 80% when within range
- Strike distance: 15 pixels (closer than most)
- Schooling: Groups of 3-8 perch often spawn together
- Weak fight: Low pull force, tires quickly

**Strategic Implications:**
- Great for beginners learning the game
- Frequent catches, low points
- Good for practicing fish fight mechanics
- Often multiple perch in same area

---

#### 5. Yellow Perch - Juvenile (Baitfish)
**Biology:**
- Size: 4-8 inches
- Becomes prey for larger predators
- Same habitat as large perch (15-35ft)

**Behavior:**
- See Baitfish Species section below
- Structure-oriented schooling
- Medium-size schools (8-20 individuals)

---

### Baitfish Species (5 Types)

All baitfish use the **3-rule flocking system** (see Flocking Mechanics section).

#### 1. Alewife (Most Abundant)
**Biology:**
- Size: 4-8 inches
- Primary prey for lake trout (55% of diet)
- Invasive species in Lake Champlain
- Temperature: Tolerant (40-70°F)

**Flocking Behavior:**
- **Dense schools:** 20-50 individuals
- High cohesion (tight formation)
- Speed: 1.2 (base), 2.5 (panic)
- Habitat: Open water, all depths

**Visual:**
- Silvery color (0x88ccff)
- Brighter when panicking
- Dark gill spot, forked tail

---

#### 2. Rainbow Smelt (Fast & Cold-Water)
**Biology:**
- Size: 5-10 inches
- Cold-water specialist (40-55°F optimal)
- Native to Lake Champlain
- Seasonal spawning runs (spring, 0-10ft)

**Flocking Behavior:**
- **Extremely tight schools:** 10-30 individuals
- Very high cohesion (tightest formation)
- **Speed: FASTEST** - 1.5 (base), 3.0 (panic)
- Dive deeper when threatened (escape behavior)
- Nocturnal (attracted to light at night)

**Visual:**
- Silvery with rainbow iridescence
- Slender body, large eyes

---

#### 3. Slimy Sculpin (Bottom-Dwelling)
**Biology:**
- Size: 2-5 inches (smallest baitfish)
- Bottom-dwelling (60-120ft)
- Nocturnal, hides during day
- No scales (slimy mucus coating)

**Flocking Behavior:**
- **Solitary:** 1-3 individuals (NOT a schooling species)
- Very low cohesion
- Speed: 0.5 (base), darting bursts to 1.5
- Hides under rocks (not implemented visually)
- Rarely seen on sonar (bottom-hugging)

**Visual:**
- Mottled brown/grey (camouflage)
- Large pectoral fins
- Bottom-dwelling behavior

**Strategic Implications:**
- Rare sightings (hard to see)
- Indicator of good lake trout habitat (deep structure)
- Pike and bass don't target them (too deep)

---

#### 4. Cisco / Lake Herring (RARE - Legendary Encounter)
**Biology:**
- Size: 8-16 inches (**LARGE prey**)
- Native, cold-water (45-55°F only)
- Depth: 50-100ft (mid to deep)
- **RARE:** 0.1x spawn rate multiplier

**Flocking Behavior:**
- Dense schools: 15-40 individuals
- High cohesion (tight formation)
- Speed: 1.8 (base), 3.5 (panic) - Very fast
- Dive when threatened
- Plankton followers (stay near zooplankton)

**Visual:**
- Large silvery fish
- Deeply forked tail
- Schooling pelagic fish

**Strategic Implications:**
- **Legendary encounter:** Very rare to see
- Triggers achievement: "Cisco Sighting"
- Indicates pristine cold water
- Lake trout LOVE them (4% of diet but highly prized)
- Best chance: Deep water (80-100ft), cold temperatures

---

#### 5. Yellow Perch - Juvenile
**Biology:**
- Size: 4-8 inches
- Structure-oriented (10-35ft)
- Abundant, native

**Flocking Behavior:**
- Medium schools: 8-20 individuals
- Moderate cohesion
- Speed: 1.0 (base), 2.2 (panic)
- Structure-oriented (stay near rocks/weeds)
- Loose formation

**Visual:**
- Golden yellow with dark vertical bars
- Orange fins
- Distinctive perch shape

---

## Fish Properties (All Predators)

### Physical Attributes

#### Size Categories

| Category | Weight Range | Points | Spawn Probability |
|----------|-------------|--------|-------------------|
| SMALL    | 2-5 lbs     | 10     | Common (40%)      |
| MEDIUM   | 5-12 lbs    | 30     | Common (35%)      |
| LARGE    | 12-25 lbs   | 60     | Uncommon (20%)    |
| TROPHY   | 25-40 lbs   | 100    | Rare (5%)         |

#### Movement Speed

```javascript
baseSpeed = 0.3 to 1.2 units/frame (randomized per fish)
actualSpeed = baseSpeed * depthZoneMultiplier * stateMultiplier * speciesMultiplier
```

**State Speed Multipliers:**
- IDLE: 1.0x (cruise speed)
- INTERESTED: 0.5x (cautious approach)
- CHASING: 1.8x (active pursuit, trout/bass/perch)
- CHASING (Pike burst): 2.5x (explosive)
- STRIKING: 2.5x (attack burst, all species)
- FLEEING: 2.0x (escape)
- HUNTING_BAITFISH: 2.2x (predation)
- FEEDING: 0.0x (stationary)

### Biological Stats

#### Hunger (0-100)
- Starts at random value: 30-80
- Increases over time: +0.1 per frame (6 points/second)
- Reduced by eating baitfish: -15 per meal
- **Effects:**
  - High hunger (>60%): More likely to hunt baitfish
  - High hunger increases lure interest by up to +20 points
  - Hungry fish are more aggressive

#### Health (0-100)
- Currently always 100 (not yet implemented in gameplay)
- Future: Could affect swim speed or behavior

#### Age (frames)
- Tracks how long the fish has existed
- Used for behavior variation over time
- No current gameplay effects

### Personality Traits

Each fish has unique personality values that affect behavior:

#### Alertness (0.5 - 1.0)
- Randomized at spawn
- Higher alertness = more reactive to stimuli
- Affects detection range and response time

#### Aggressiveness (0.3 - 1.0)
- Randomized at spawn
- **Critical for lure strikes:**
  - Strike chance = aggressiveness * 0.7 (minimum 21%, maximum 70%)
  - In baitfish cloud: Strike chance increases to 80%+
- Aggressive fish:
  - Chase lures more readily
  - Less likely to flee
  - More strike attempts when frenzied

#### Depth Preference (Species-Specific)
- Lake Trout: 40-100ft (seasonal variation)
- Northern Pike: 5-30ft (shallow specialist)
- Smallmouth Bass: 10-50ft (structure-oriented)
- Yellow Perch: 15-35ft (mid-depth)

---

## Detection System

### Detection Ranges

Fish have elliptical detection zones:

```
Horizontal Detection: 150 pixels (updated from 80)
Vertical Detection: 280 pixels (40-70 feet in game scale)

Pike Extended Strike Range: 60 pixels (ambush specialist)
Standard Strike Range: 25 pixels
Perch Strike Range: 15 pixels (close approach)
```

**Why vertical is larger?**
- Fish rely on vision in clear water
- Can see objects above/below more easily than far horizontally
- Mimics real lake trout hunting behavior

**Detection Range Visualization:**
Enable debug mode to see yellow circles (horizontal) and ellipses (vertical) around each fish.

### Lure Interest Scoring

When a lure enters detection range, fish calculate an "interest score" to decide if they should pursue:

#### Interest Score Calculation

```javascript
Base Score = 0

// 1. Distance Factor (closer = more interesting)
distanceScore = (1 - normalizedDistance) * 50
verticalDistance weighted more heavily (2x)

// 2. Speed Match (lure speed vs fish preference)
optimalSpeed = 2.0 units/frame (species-dependent)
speedTolerance = 1.5
if (lure speed within tolerance):
  speedScore = +10 to +20

// 3. Depth Compatibility
if (fish at preferred depth):
  depthBonus = +10

// 4. Lure Action
if (lure is moving - not stationary):
  actionBonus = +15

// 5. Hunger Factor
hungerBonus = (hunger / 100) * 20  // Up to +20 points

// 6. Personality
baseInterest = aggressiveness * 30 + alertness * 10

// 7. Species Modifiers
// Pike: +15 in shallow water
// Bass: +10 near structure (not fully implemented)
// Perch: +20 (naturally aggressive)

// 8. Frenzy Effect
if (other fish are chasing):
  frenzyBonus = +20 to +50

TOTAL INTEREST = sum of all factors
```

#### Interest Thresholds (varies by depth zone and species)

| Species | Surface (0-40ft) | Mid-Column (40-100ft) | Bottom (100-150ft) |
|---------|------------------|----------------------|-------------------|
| Lake Trout | 30 | 40 | 50 |
| Northern Pike | 25 | 35 (rarely here) | N/A |
| Smallmouth Bass | 30 | 35 | 45 |
| Yellow Perch | 25 | 25 | 30 |

**If interest score ≥ threshold → Fish enters INTERESTED state**

---

## Fish AI State Machine

### State Diagram

```
         ┌──────────────────────────────────┐
         │                                  │
    ┌────▼────┐    Lure detected      ┌────┴────────┐
    │  IDLE   │──interest ≥ threshold─►  INTERESTED │
    │ (Pike:  │                        │  (Bass:     │
    │ AMBUSH) │                        │  CIRCLING)  │
    └────┬────┘                        └─────┬───────┘
         │                                   │
         │  Baitfish nearby                  │ Aggression check
         │  & hungry                         │
         │                              ┌────▼────┐
    ┌────▼──────────┐                   │ CHASING │
    │HUNTING_BAITFISH│◄──────────────────└────┬────┘
    └────┬──────────┘   Lost interest        │
         │                                    │ Within strike range
         │ Catch baitfish                     │
         │                              ┌─────▼────┐
    ┌────▼────┐                         │ STRIKING │
    │ FEEDING │                         └─────┬────┘
    └────┬────┘                               │
         │                                    │ Contact with lure
         │ Brief pause                        │
         │                              ┌─────▼────┐
         └──────────────────────────────►  CAUGHT  │
                                        └──────────┘
              ┌─────────┐
              │ FLEEING │◄─── Spooked/missed strike
              └────┬────┘
                   │
                   └─────► IDLE (after cooldown)
```

### State Descriptions

#### 1. IDLE State
**Default state** - Fish cruises horizontally at current depth

**Behavior:**
- Swims in current direction at base speed
- **Pike:** Enters AMBUSH sub-state (see species section)
- Monitors environment for:
  - Lures (calculates interest score)
  - Baitfish (if hungry >60%)
  - Zooplankton (if very hungry >80%)
  - Other fish states (frenzy detection)
- Randomly changes direction occasionally
- Maintains preferred depth range

**Transitions:**
- → INTERESTED: If lure interest ≥ threshold
- → HUNTING_BAITFISH: If hungry and prey in range
- → IDLE: Stays in IDLE otherwise

**Code Location:** `FishAI.js:updateIdleState()`

---

#### 2. INTERESTED State
**Curiosity state** - Fish watches lure from distance

**Behavior:**
- Slow approach toward lure (0.5x speed)
- Maintains distance (~30-50 pixels)
- **Bass:** Enters CIRCLING sub-state (see species section)
- Observes lure movement
- Duration: ~60-120 frames (1-2 seconds)

**Decision Logic:**
```javascript
// Standard (Trout, Pike, Perch):
Random roll vs aggressiveness:
  if (Math.random() < aggressiveness * 0.8):
    → CHASING
  else:
    → IDLE (lost interest)

// Bass (after circling):
if (circling complete):
  if (Math.random() < 0.7):  // 70% chance
    → CHASING
  else:
    → FLEEING (spooked by fake lure)
```

**Triggers Visual Feedback:**
- Orange "interest flash" indicator above fish
- Visible to player as feedback

**Code Location:** `FishAI.js:updateInterestedState()`

---

#### 3. CHASING State
**Active pursuit** - Fish commits to chasing lure

**Behavior:**
- Fast swimming toward lure (1.8x speed standard, 2.5x pike burst)
- Close following distance (<30 pixels)
- Continuously tracks lure position
- Can chase for extended periods
- **Pike:** Explosive burst from ambush point

**Strike Check (every frame):**
```javascript
// Species-specific strike distances:
const strikeDistance = {
  'northern_pike': 60,      // Extended range
  'yellow_perch': 15,       // Close approach
  'default': 25             // Standard
};

if (distance to lure < strikeDistance):
  strikeRoll = Math.random()
  strikeChance = aggressiveness * 0.7

  // Bonus in baitfish cloud
  if (lure in baitfish cloud):
    strikeChance += 0.2

  if (strikeRoll < strikeChance):
    → STRIKING
```

**Abandon Chase Conditions:**
- Lure speed becomes unrealistic (>6.0 units/frame)
- Pike patience runs out (returns to ambush)
- Random chance based on low aggressiveness
- Lure exits vertical detection range

**Code Location:** `FishAI.js:updateChasingState()`

---

#### 4. STRIKING State
**Attack committed** - Fish lunges at lure

**Behavior:**
- Maximum burst speed (2.5x multiplier, all species)
- Direct path to lure
- **Critical distance: 5 pixels**
  - If fish gets within 5px of lure → **CAUGHT!**
  - Game transitions to Fish Fight mode

**Miss Behavior:**
- If fish overshoots (>30 pixels past lure):
  - **Non-frenzied fish:** → FLEEING (spooked)
  - **Frenzied fish:** → Re-attempt strike (2-3 total attempts)
  - **Pike:** Return to ambush point
  - **Bass:** May circle again (30% chance)

**Vertical Strikes:**
When frenzied and lure is above:
- Fish strikes upward at increased angle
- More realistic predator behavior
- Higher success rate in frenzy

**Code Location:** `FishAI.js:updateStrikingState()`

---

#### 5. FLEEING State
**Escape behavior** - Spooked fish swims away

**Triggers:**
- Missed strike on lure
- Unrealistic lure movement (too fast)
- Bass spooked during circling
- Predator nearby (larger fish)

**Behavior:**
- Fast swim in opposite direction (2.0x speed)
- Ignores lures and baitfish
- Duration: ~120-180 frames (2-3 seconds)

**Species Variations:**
- **Pike:** Returns to new ambush point
- **Bass:** More likely to flee (line-shy)
- **Perch:** Short flee, returns quickly
- **Trout:** Standard flee behavior

**Return:**
- → IDLE when far enough from lure
- Cooldown period before re-engaging same lure

**Code Location:** `FishAI.js:updateFleeingState()`

---

#### 6. HUNTING_BAITFISH State
**Natural predation** - Fish hunts real food

**Triggers:**
- Fish hunger >60%
- Baitfish or zooplankton within detection range
- Not currently chasing lure (natural behavior priority)

**Behavior:**
- Pursues nearest baitfish/zooplankton (2.2x speed)
- Vertical range scales with hunger:
  ```javascript
  verticalRange = 50 + (hunger * 0.5)  // 50-100 pixels
  ```
- Ignores lures while hunting (focused on prey)
- **Species preferences:**
  - Trout: Prefers alewife and smelt
  - Pike: Opportunistic (any prey)
  - Bass: Prefers perch and sculpin
  - Perch: Only hunts zooplankton

**Catch Prey:**
- If within 10 pixels of baitfish:
  - Baitfish consumed (removed from game)
  - Hunger -15
  - → FEEDING state

**Can Confuse Lure for Baitfish:**
- If lure is in same baitfish cloud
- Fish may strike lure accidentally
- Realistic predator behavior (+20% strike chance)

**Code Location:** `FishAI.js:updateHuntingBaitfishState()`

---

#### 7. FEEDING State
**Post-consumption pause** - Brief stationary state

**Behavior:**
- Fish stops swimming
- Duration: ~60 frames (1 second)
- Hunger reduced by 15 points
- Recovery period
- Vulnerable to other predators (not implemented)

**Transition:**
- → IDLE if hunger <60%
- → HUNTING_BAITFISH if still hungry (>60%)

**Code Location:** `FishAI.js:updateFeedingState()`

---

## Baitfish Flocking Mechanics (3-Rule Boids Algorithm)

All baitfish species use the same flocking algorithm with species-specific parameters.

### Flocking Rules

#### 1. Separation (Avoid Crowding)

```javascript
SEPARATION_RADIUS = 12 pixels

For each nearby baitfish within radius:
  - Calculate vector away from neighbor
  - Weight by distance (closer = stronger push)
  - Sum all separation vectors

Result: Fish maintain personal space, don't overlap
```

**Species Variations:**
- Smelt: Smaller radius (8px) - tighter schools
- Sculpin: Larger radius (20px) - solitary
- Alewife/Cisco/Perch: Standard (12px)

#### 2. Cohesion (Stay with Group)

```javascript
COHESION_RADIUS = 50 pixels

For each nearby baitfish within radius:
  - Calculate group center (average position)
  - Vector toward group center
  - Weighted by group size (larger = stronger pull)

Boundary Penalty:
  - At surface (depth <10ft): Cohesion * 0.7
  - Prevents surface trapping

Result: Fish form schools, stay together
```

**Species Variations:**
- Smelt: Larger radius (70px) - very tight
- Sculpin: Tiny radius (15px) - barely schools
- Cisco: Standard (50px) - dense schools
- Alewife: Standard (50px)
- Perch: Medium (40px) - loose schools

#### 3. Alignment (Match Velocity)

```javascript
For each nearby baitfish:
  - Calculate average velocity of neighbors
  - Adjust own velocity to match
  - Weight: Moderate (0.3-0.5)

Result: Synchronized swimming, smooth movement
```

**All species:** Standard alignment behavior

### Panic Response

**Triggers:**
- Predator within 100 pixels
- Fish in CHASING or STRIKING state
- Lure moving fast through cloud

**Effects:**
```javascript
Speed multiplier:
  - Alewife: 2.5x (base 1.2 → panic 2.5)
  - Smelt: 3.0x (FASTEST, base 1.5 → panic 3.0)
  - Sculpin: 1.5x (darting, base 0.5 → panic 1.5)
  - Cisco: 3.5x (very fast, base 1.8 → panic 3.5)
  - Perch: 2.2x (base 1.0 → panic 2.2)

Behavior changes:
  - Increased separation weight (scatter)
  - Decreased cohesion (break school)
  - Color darkens (visual feedback)
  - Flee vector away from threat
```

**Recovery:**
- Gradual return to normal speed over 120 frames (2 seconds)
- Reform school (cohesion increases)
- Return to normal coloring

### Hunting Mode (Baitfish Hunt Zooplankton)

**When baitfish hunger >60%:**
- Target nearest zooplankton
- Persistent target locking (120+ frames minimum)
- Multi-competitor awareness (avoid crowded targets)
- Approach and consume zooplankton
- Hunger reduced

**Strategic Implications:**
- Baitfish congregate near zooplankton (bottom, 100-150ft)
- Predators follow baitfish
- Creates natural food chain
- Good fishing spots = zooplankton → baitfish → predators

---

## Cloud Interaction System

Managed by CollisionSystem (~130 lines)

### Cloud Splitting

**Trigger:** Lure passes through baitfish cloud

**Logic:**
```javascript
if (lure intersects cloud center):
  if (Math.random() < 0.5):  // 50% chance
    Split cloud into two:
      - Cloud A: 50% of baitfish
      - Cloud B: 50% of baitfish
      - Each cloud continues in different direction
```

**Purpose:**
- Prevents unrealistic static clouds
- Mimics real baitfish scatter behavior
- Creates dynamic environment

### Cloud Merging

**Trigger:** Two clouds within 80 pixels

**Logic:**
```javascript
if (distance between clouds < 80px):
  Merge clouds:
    - Combine all baitfish into single cloud
    - Cloud center = weighted average position
    - Remove original clouds
```

**Purpose:**
- Prevents cloud explosion (too many small clouds)
- Keeps entity count manageable
- Realistic schooling reformation

### Cloud Despawning

**Conditions:**
- Cloud compressed to <5 pixels (all baitfish too close)
- Cloud has 0 baitfish (all consumed)
- Cloud age >600 seconds (10 minutes, rare)

**Purpose:**
- Memory management
- Remove degenerate clouds
- Prevent performance issues

---

## Depth Zones

Predator behavior varies significantly by depth:

### Zone Comparison Table

| Zone | Depth Range | Speed Modifier | Aggression Modifier | Interest Threshold | Fish Behavior |
|------|-------------|----------------|--------------------|--------------------|---------------|
| **Surface** | 0-40 ft | +30% | +0.3 | 30 | Fast, aggressive, easy to interest |
| **Mid-Column** | 40-100 ft | Normal (1.0x) | Normal | 40 | Optimal zone, balanced behavior |
| **Bottom** | 100-150 ft | -40% | -0.2 | 50 | Slow, cautious, hard to interest |

### Zone-Specific Behavior

#### Surface Zone (0-40 feet)
- **Pike territory:** Ambush predators thrive
- Fish are more active (faster swimming)
- Higher aggression (+0.3 bonus)
- Easier to interest (threshold only 30)
- **Strategic implication:** Fast action, pike strikes

#### Mid-Column Zone (40-100 feet) ⭐ **OPTIMAL**
- **Lake trout's preferred depth**
- Normal behavior (baseline)
- Best balance of action and size
- Most realistic behavior
- **Strategic implication:** Best zone for trophy trout

#### Bottom Zone (100-150 feet)
- **Sculpin territory:** Bottom baitfish
- Fish swim 40% slower
- Reduced aggression (-0.2)
- Hardest to interest (threshold 50)
- **Strategic implication:** Slower fishing, patience required

---

## Frenzy Mechanics

### What is a Frenzy?

A **feeding frenzy** occurs when multiple fish simultaneously pursue the same lure, triggering competitive feeding behavior.

### Frenzy Triggers

```javascript
Frenzy occurs when:
1. Fish detects 2+ other fish in states:
   - INTERESTED
   - CHASING
   - STRIKING

2. Within frenzy detection range (100 pixels)

3. Random roll: 50% chance to join frenzy
```

### Frenzy Effects

#### Frenzy Intensity
```javascript
intensity = 0.25 per excited fish nearby
maxIntensity = 1.0 (capped at 4+ fish)
```

#### Frenzy Duration
```javascript
baseDuration = 300 frames (5 seconds)
bonusDuration = 90 frames per excited fish
maxDuration = ~10 seconds
```

#### Behavioral Changes When Frenzied

1. **Multiple Strike Attempts**
   - Normal fish: 1 strike attempt
   - Frenzied fish: 2-3 strike attempts
   - Won't flee after first miss

2. **Increased Strike Success**
   - More vertical strikes (upward lunges)
   - Better tracking of fast-moving lures
   - Higher strike chance (+20%)

3. **Reduced Caution**
   - Lower interest threshold needed
   - Faster transition INTERESTED → CHASING
   - Less likely to flee
   - **Bass:** Less likely to spook during circling

4. **Visual Indicator**
   - Fish render with red tint when frenzied
   - Dev panel shows frenzy status and intensity
   - Debug mode shows frenzy connections

### Strategic Use of Frenzy

**For Players:**
- Keep lure in area where multiple fish are interested
- Jigging attracts more fish to same zone
- Creates "hot spots" where multiple fish compete
- **Works best in mid-column** (40-100ft) where multiple species overlap

**Species Synergy:**
- Trout + Bass: Common in rocky mid-column
- Pike + Perch: Shallow structure
- Mixed species frenzies possible

---

## Lure Presentation

### What Attracts Fish?

#### 1. Lure Speed

```javascript
Optimal Speed: 2.0 units/frame (species-dependent)
Speed Tolerance: ±1.5 units/frame
Acceptable Range: 0.5 - 3.5 units/frame

Species Variations:
  - Pike: Prefers faster (2.5-4.0) or very slow (0.2-0.5, ambush wait)
  - Bass: Prefers moderate (1.5-2.5, investigation speed)
  - Trout: Standard (2.0 optimal)
  - Perch: Aggressive response to any speed
```

**Too Slow (<0.5):**
- Fish lose interest (except pike waiting in ambush)
- Looks unnatural (dead bait)
- Interest score penalty: -20

**Too Fast (>3.5):**
- Fish can't catch up (except smelt-sized prey triggers pike)
- Unrealistic movement
- May spook fish → FLEEING

**Just Right (0.5-3.5):**
- Looks like swimming baitfish
- Interest score bonus: +10 to +20
- Optimal presentation

#### 2. Lure Action (Jigging)

**Right Stick Jigging:**
- Creates up/down movement (±20 pixels = ~5 feet)
- Mimics injured baitfish
- **Action bonus: +15 interest points**

**Why It Works:**
- Movement attracts predators (all species)
- Lake trout target wounded prey
- Vertical action triggers strike response
- **Bass:** Jigging during circling can spook (30% chance to flee)

**Best Jigging Technique:**
- Short, quick jigs while dropping
- Pause at mid-column depths (40-100ft)
- Resume jigging to attract fish
- **For bass:** Stop jigging during circling

#### 3. Depth Matching

**Fish prefer lures at or near their current depth:**

| Species | Preferred Depth | Depth Bonus |
|---------|----------------|-------------|
| Lake Trout | 40-100ft | +15 if within 20ft |
| Northern Pike | 5-30ft | +20 if within 10ft |
| Smallmouth Bass | 10-50ft | +15 if within 15ft |
| Yellow Perch | 15-35ft | +10 if within 20ft |

**Strategy:**
- Target species-specific depths
- Watch for fish on sonar
- Drop lure to their depth, then jig
- **Multi-species:** Mid-column (40-60ft) attracts trout, bass, and perch

---

## Summary

The fish AI system creates realistic multi-species predator behavior through:

- **5 predator species** with unique behaviors:
  - Lake Trout (pursuit hunter, baseline)
  - Northern Pike (ambush predator, explosive)
  - Smallmouth Bass (investigator, circling)
  - Yellow Perch (beginner-friendly, aggressive)

- **5 baitfish species** with ecological roles:
  - Alewife (abundant prey)
  - Rainbow Smelt (fast, cold-water)
  - Slimy Sculpin (bottom-dwelling, rare)
  - Cisco (legendary encounter, rare)
  - Yellow Perch Juvenile (structure-oriented)

- **7-state state machine** with clear transitions
- **3-rule flocking** (separation, cohesion, alignment)
- **Cloud interactions** (splitting, merging, despawning)
- **Interest scoring** based on multiple factors
- **Depth zone modifiers** for realistic behavior
- **Frenzy mechanics** creating competitive feeding
- **Personality traits** making each fish unique
- **Natural hunting** behavior with prey hierarchy
- **Strategic depth targeting** rewarding player skill

The system balances realism (biological accuracy, species-specific behaviors) with fun gameplay (responsive, understandable AI, visible feedback). Fish are challenging but not frustrating, rewarding players who understand the mechanics and species differences.

**Recommended Reading Order:**
1. This guide (FISH_BEHAVIOR_GUIDE.md)
2. AI_REFERENCE.md (quick reference)
3. PROJECT_STRUCTURE.md (codebase overview)
4. `/src/config/SpeciesData.js` (species data)
5. `/src/entities/FishAI.js` (source code)
