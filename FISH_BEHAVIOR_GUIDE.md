# Fish Behavior Mechanics Guide

## Overview

The fish AI system is the most complex part of the game, consisting of a sophisticated state machine with 7 distinct behavioral states. This guide explains how fish detect, evaluate, and react to the player's lure, as well as their natural hunting behaviors.

**Primary Files:**
- `/src/entities/FishAI.js` (560 lines) - AI state machine and decision logic
- `/src/entities/Fish.js` (391 lines) - Fish entity and biological properties
- `/src/config/GameConfig.js` (132 lines) - Tunable parameters

---

## Fish Properties

### Physical Attributes

#### Size Categories
Fish spawn in four size categories with weight ranges:

| Category | Weight Range | Points When Caught | Spawn Probability |
|----------|-------------|-------------------|------------------|
| SMALL    | 2-5 lbs     | 10 points         | Common           |
| MEDIUM   | 5-12 lbs    | 30 points         | Common           |
| LARGE    | 12-25 lbs   | 60 points         | Uncommon         |
| TROPHY   | 25-40 lbs   | 100 points        | Rare             |

*Lake Champlain record: 37 lbs (1987)*

#### Movement Speed
```javascript
baseSpeed = 0.3 to 1.2 units/frame (randomized per fish)
actualSpeed = baseSpeed * depthZoneMultiplier * stateMultiplier
```

**State Speed Multipliers:**
- IDLE: 1.0x (cruise speed)
- INTERESTED: 0.5x (cautious approach)
- CHASING: 1.8x (active pursuit)
- STRIKING: 2.5x (attack burst)
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

#### Depth Preference (40-100 feet)
- Each fish has a preferred depth
- Affects comfort level at different depths
- Lake trout naturally prefer 40-100 feet (thermocline zone)

---

## Detection System

### Detection Ranges

Fish have elliptical detection zones:

```
Horizontal Detection: 80 pixels
Vertical Detection: 280 pixels (40-70 feet in game scale)

Why vertical is larger?
- Fish rely on vision in clear water
- Can see objects above/below more easily than far horizontally
- Mimics real lake trout hunting behavior
```

**Detection Range Visualization:**
Enable debug mode to see green circles (horizontal) and ellipses (vertical) around each fish.

### Lure Interest Scoring

When a lure enters detection range, fish calculate an "interest score" to decide if they should pursue:

#### Interest Score Calculation

```javascript
Base Score = 0

// 1. Distance Factor (closer = more interesting)
distanceScore = (1 - normalizedDistance) * 50
verticalDistance weighted more heavily (2x)

// 2. Speed Match (lure speed vs fish preference)
optimalSpeed = 2.0 units/frame
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

// 7. Frenzy Effect
if (other fish are chasing):
  frenzyBonus = +20 to +50

TOTAL INTEREST = sum of all factors
```

#### Interest Thresholds (varies by depth zone)

| Depth Zone | Threshold | Notes |
|------------|-----------|-------|
| Surface (0-40 ft) | 30 | Easy to interest |
| Mid-Column (40-100 ft) | 40 | Balanced |
| Bottom (100-150 ft) | 50 | Hard to interest |

**If interest score ≥ threshold → Fish enters INTERESTED state**

---

## Fish AI State Machine

### State Diagram

```
         ┌──────────────────────────────────┐
         │                                  │
    ┌────▼────┐    Lure detected      ┌────┴────────┐
    │  IDLE   │────interest ≥ threshold─►INTERESTED │
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
- Monitors environment for:
  - Lures (calculates interest score)
  - Baitfish (if hungry)
  - Other fish states (frenzy detection)
- Randomly changes direction occasionally

**Transitions:**
- → INTERESTED: If lure interest ≥ threshold
- → HUNTING_BAITFISH: If hungry (>60%) and baitfish in range
- → IDLE: Stays in IDLE otherwise

**Code Location:** `FishAI.js:updateIdleState()`

---

#### 2. INTERESTED State
**Curiosity state** - Fish watches lure from distance

**Behavior:**
- Slow approach toward lure (0.5x speed)
- Maintains distance (~30-50 pixels)
- Observes lure movement
- Duration: ~60-120 frames (1-2 seconds)

**Decision Logic:**
```javascript
Random roll vs aggressiveness:
  if (Math.random() < aggressiveness * 0.8):
    → CHASING
  else:
    → IDLE (lost interest)
```

**Triggers Visual Feedback:**
- Orange "interest flash" indicator above fish
- Visible to player as feedback

**Code Location:** `FishAI.js:updateInterestedState()`

---

#### 3. CHASING State
**Active pursuit** - Fish commits to chasing lure

**Behavior:**
- Fast swimming toward lure (1.8x speed)
- Close following distance (<30 pixels)
- Continuously tracks lure position
- Can chase for extended periods

**Strike Check (every frame):**
```javascript
if (distance to lure < 15 pixels):
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
- Fish loses stamina (future implementation)
- Random chance based on low aggressiveness

**Code Location:** `FishAI.js:updateChasingState()`

---

#### 4. STRIKING State
**Attack committed** - Fish lunges at lure

**Behavior:**
- Maximum burst speed (2.5x multiplier)
- Direct path to lure
- **Critical distance: 5 pixels**
  - If fish gets within 5px of lure → **CAUGHT!**
  - Game transitions to Fish Fight mode

**Miss Behavior:**
- If fish overshoots (>30 pixels past lure):
  - **Non-frenzied fish:** → FLEEING (spooked)
  - **Frenzied fish:** → Re-attempt strike (2-3 total attempts)

**Vertical Strikes:**
When frenzied and lure is above:
- Fish strikes upward at increased angle
- More realistic lake trout behavior
- Higher success rate in frenzy

**Code Location:** `FishAI.js:updateStrikingState()`

---

#### 5. FLEEING State
**Escape behavior** - Spooked fish swims away

**Triggers:**
- Missed strike on lure
- Unrealistic lure movement
- Player movement (future: drilling noise)

**Behavior:**
- Fast swim in opposite direction (2.0x speed)
- Ignores lures and baitfish
- Duration: ~120-180 frames (2-3 seconds)

**Return:**
- → IDLE when far enough from lure
- Cooldown period before re-engaging same lure

**Code Location:** `FishAI.js:updateFleeingState()`

---

#### 6. HUNTING_BAITFISH State
**Natural predation** - Fish hunts real food

**Triggers:**
- Fish hunger >60%
- Baitfish within detection range
- Not currently chasing lure

**Behavior:**
- Pursues nearest baitfish (2.2x speed)
- Vertical range scales with hunger:
  ```javascript
  verticalRange = 50 + (hunger * 0.5)  // 50-100 pixels
  ```
- Ignores lures while hunting (focused)

**Catch Baitfish:**
- If within 10 pixels of baitfish:
  - Baitfish consumed
  - Hunger -15
  - → FEEDING state

**Can Confuse Lure for Baitfish:**
- If lure is in same baitfish cloud
- Fish may strike lure accidentally
- Realistic predator behavior

**Code Location:** `FishAI.js:updateHuntingBaitfishState()`

---

#### 7. FEEDING State
**Post-consumption pause** - Brief stationary state

**Behavior:**
- Fish stops swimming
- Duration: ~60 frames (1 second)
- Hunger reduced
- Recovery period

**Transition:**
- → IDLE or HUNTING_BAITFISH (if still hungry)

**Code Location:** `FishAI.js:updateFeedingState()`

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
   - Higher strike chance

3. **Reduced Caution**
   - Lower interest threshold needed
   - Faster transition INTERESTED → CHASING
   - Less likely to flee

4. **Visual Indicator**
   - Fish render with red tint when frenzied
   - Dev panel shows frenzy status and intensity

### Strategic Use of Frenzy

**For Players:**
- Keep lure in area where multiple fish are interested
- Jigging attracts more fish to same zone
- Creates "hot spots" where multiple fish compete

**Realistic Behavior:**
- Lake trout do exhibit competitive feeding
- Multiple fish on same baitball create frenzy
- One fish striking can trigger others to strike

---

## Depth Zones

Lake trout behavior varies significantly by depth. The lake is divided into three zones:

### Zone Comparison Table

| Zone | Depth Range | Speed Modifier | Aggression Modifier | Interest Threshold | Fish Behavior |
|------|-------------|----------------|--------------------|--------------------|---------------|
| **Surface** | 0-40 ft | +30% | +0.3 | 30 | Fast, aggressive, easy to interest |
| **Mid-Column** | 40-100 ft | Normal (1.0x) | Normal | 40 | Optimal lake trout zone, balanced |
| **Bottom** | 100-150 ft | -40% | -0.2 | 50 | Slow, cautious, hard to interest |

### Zone-Specific Behavior

#### Surface Zone (0-40 feet)
- **Warmer water (not ideal for lake trout)**
- Fish are more active (faster swimming)
- Higher aggression (+0.3 bonus)
- Easier to interest (threshold only 30)
- **Strategic implication:** Fast action, easy catches but smaller fish

#### Mid-Column Zone (40-100 feet) ⭐ **OPTIMAL**
- **Lake trout's preferred depth**
- Normal behavior (baseline)
- Best balance of action and size
- Most realistic behavior
- **Strategic implication:** Best zone for trophy fish

#### Bottom Zone (100-150 feet)
- **Cold, low-light environment**
- Fish swim 40% slower
- Reduced aggression (-0.2)
- Hardest to interest (threshold 50)
- **Strategic implication:** Slower fishing, requires patience, larger fish possible

### Why Depth Matters

**Biologically Accurate:**
- Lake trout are cold-water fish (38-42°F optimal)
- Prefer thermocline zone (40-100 ft in Lake Champlain)
- Hunt where baitfish (alewives) school
- Bottom zone is near lake bed structure

**Gameplay Balance:**
- Rewards realistic fishing (targeting correct depth)
- Creates risk/reward (bottom = harder but bigger fish)
- Encourages depth experimentation

---

## Lure Presentation

### What Attracts Fish?

#### 1. Lure Speed
```javascript
Optimal Speed: 2.0 units/frame
Speed Tolerance: ±1.5 units/frame
Acceptable Range: 0.5 - 3.5 units/frame
```

**Too Slow (<0.5):**
- Fish lose interest
- Looks unnatural (dead bait)
- Interest score penalty: -20

**Too Fast (>3.5):**
- Fish can't catch up
- Unrealistic movement
- May spook fish → FLEEING

**Just Right (0.5-3.5):**
- Looks like swimming baitfish
- Interest score bonus: +10 to +20
- Optimal presentation

#### 2. Lure Action (Jigging)

**Right Stick Jigging:**
- Creates up/down movement (±20 pixels)
- Mimics injured baitfish
- **Action bonus: +15 interest points**

**Why It Works:**
- Movement attracts predators
- Lake trout target wounded prey
- Vertical action triggers strike response

**Best Jigging Technique:**
- Short, quick jigs while dropping
- Pause at mid-column depths
- Resume jigging to attract fish

#### 3. Depth Matching

**Fish prefer lures at or near their current depth:**
- Lure within 20 feet: +10 interest
- Lure at exact preferred depth: +15 interest

**Strategy:**
- Target mid-column (40-100 ft) for best results
- Watch for fish on sonar
- Drop lure to their depth, then jig

#### 4. Retrieve Pattern

**Effective Patterns:**

1. **Drop and Pause**
   - Drop to depth
   - Stop (IDLE state)
   - Wait for fish to notice
   - Jig when fish approaches

2. **Yo-Yo Retrieve**
   - Drop lure
   - Retrieve a few feet
   - Drop again
   - Repeat (mimics fleeing baitfish)

3. **Slow Steady Retrieve**
   - Constant slow speed (0.5-1.5)
   - From bottom to mid-column
   - Covers vertical water column

4. **Fast Aggressive Retrieve**
   - Fast retrieve (3.0+)
   - Triggers aggressive fish
   - Risk: may spook cautious fish

---

## Baitfish Interaction

### Baitfish Cloud System

**Spawning:**
- Clouds spawn every ~2 seconds
- Each cloud: 5-20 individual alewives
- Random depth and position
- Drift slowly

**Fish Behavior with Baitfish:**

1. **Hungry Fish Hunt Baitfish**
   - Hunger >60% triggers hunting
   - Ignore lures while hunting
   - Realistic predation priority

2. **Lure Confusion**
   - If lure is in baitfish cloud:
     - Strike chance increases +20%
     - Fish can't distinguish lure from real food
     - Realistic predator behavior

3. **Competition for Food**
   - Multiple fish may hunt same cloud
   - Can trigger frenzy
   - Fish scatter when fish strikes

### Strategic Use

**For Players:**
- Drop lure into baitfish cloud
- Fish will mistake lure for prey
- Higher strike probability
- Creates natural feeding scenario

**Baitfish as Indicator:**
- Shows where fish are feeding
- Baitfish clouds attract fish
- Watch sonar for cloud formations

---

## Catch Mechanics

### From Strike to Caught

**Sequence:**
1. Fish enters STRIKING state
2. Fish closes to within 5 pixels of lure
3. **CAUGHT!** - Fish Fight begins
4. Game transitions to Fish Fight mode

### Fish Fight Minigame

**See `/src/entities/FishFight.js`**

**Mechanics:**
- Line tension system (0-100)
- Break point: 95
- Rapid spacebar/R2 tapping required
- Fish pulls based on: weight × (1 - tiredness) × 5
- Fish tires over time: +0.5 per reel tap

**Winning:**
- Reel fish from catch depth to surface (0 feet)
- Manage tension (never exceed 95)
- Faster tapping = faster reeling
- Fish exhaustion makes it easier

**Losing:**
- Tension ≥95 → Line breaks
- Score: -10 points
- Fish escapes

**Gamepad Features:**
- R2 trigger rapid-fire (50ms minimum interval)
- Haptic rumble based on tension:
  - >90%: Strong rumble
  - >70%: Medium rumble
  - Each reel: Light pulse

---

## Fish Spawn System

### Spawn Rate
```javascript
FISH_SPAWN_CHANCE = 0.008 per frame
Average spawn: 1 fish every ~2-3 seconds
```

### Spawn Logic

**Random Placement:**
- X position: Random across lake width
- Y position (depth): 10-140 feet (not at surface or bottom)
- Direction: Random left/right

**Size Distribution:**
- SMALL: Common (40%)
- MEDIUM: Common (35%)
- LARGE: Uncommon (20%)
- TROPHY: Rare (5%)

**Personality Randomization:**
- Alertness: 0.5 - 1.0 (random)
- Aggressiveness: 0.3 - 1.0 (random)
- Preferred depth: 40-100 ft (random within optimal zone)

**No Spawn Cap:**
- Fish can accumulate
- Old fish don't despawn
- Creates natural variety

---

## AI Configuration Constants

### Key Tunable Values (GameConfig.js)

```javascript
// Detection
DETECTION_RANGE: 80 pixels (horizontal)
VERTICAL_DETECTION_RANGE: 280 pixels

// Speed
OPTIMAL_LURE_SPEED: 2.0 units/frame
SPEED_TOLERANCE: 1.5
CHASE_SPEED_MULTIPLIER: 1.8
STRIKE_SPEED_MULTIPLIER: 2.5
FLEE_SPEED_MULTIPLIER: 2.0
HUNT_SPEED_MULTIPLIER: 2.2

// Strike
STRIKE_DISTANCE: 15 pixels (chase → strike)
CATCH_DISTANCE: 5 pixels (strike → caught)

// Interest
BASE_INTEREST_THRESHOLD: 40 (mid-column)
SURFACE_THRESHOLD: 30
BOTTOM_THRESHOLD: 50

// Frenzy
FRENZY_DETECTION_RANGE: 100 pixels
MIN_FISH_FOR_FRENZY: 2
FRENZY_BASE_DURATION: 300 frames (5 sec)
FRENZY_BONUS_DURATION: 90 frames per fish
```

### Tweaking Fish Behavior

**Make Fish More Aggressive:**
```javascript
// In GameConfig.js
STRIKE_DISTANCE: 20  // (from 15)
BASE_INTEREST_THRESHOLD: 30  // (from 40)
```

**Make Fish Easier to Catch:**
```javascript
CHASE_SPEED_MULTIPLIER: 2.5  // (from 1.8)
OPTIMAL_LURE_SPEED: 3.0  // (from 2.0)
SPEED_TOLERANCE: 2.5  // (from 1.5)
```

**Increase Frenzy Frequency:**
```javascript
MIN_FISH_FOR_FRENZY: 1  // (from 2)
FRENZY_BASE_DURATION: 600  // (from 300)
```

---

## Tips for Players

### Catching More Fish

1. **Target Mid-Column (40-100 ft)**
   - Drop lure to this depth range
   - Where lake trout naturally prefer
   - Best balance of activity and size

2. **Use Jigging Action**
   - Right stick on gamepad
   - +15 interest bonus
   - Triggers strike response

3. **Match Lure Speed**
   - Keep retrieve speed 0.5-3.5
   - Adjust with D-pad left/right
   - Watch for fish reactions

4. **Create Frenzies**
   - Keep lure where multiple fish are
   - Jig to maintain interest
   - Multiple fish = frenzy = easier catches

5. **Use Baitfish Clouds**
   - Drop lure into schools
   - Fish mistake lure for prey
   - +20% strike chance

6. **Drill Multiple Holes**
   - Move to different lake areas
   - Some holes have more fish
   - Find structure (deeper = bigger fish)

### Understanding Fish Signals

**Visual Indicators:**
- **Orange flash above fish:** Fish is INTERESTED
- **Red tint on fish:** Fish is FRENZIED
- **Fast approach:** Fish is CHASING
- **Burst toward lure:** Fish is STRIKING

**Enable Debug Mode:**
- See detection ranges
- Monitor fish states
- Watch interest calculations
- Track frenzy intensity

---

## Summary

The fish AI system creates realistic lake trout behavior through:

- **7-state state machine** with clear transitions
- **Interest scoring** based on multiple factors
- **Depth zone modifiers** for realistic behavior
- **Frenzy mechanics** creating competitive feeding
- **Personality traits** making each fish unique
- **Natural hunting** behavior with baitfish
- **Strategic depth targeting** rewarding player skill

The system balances realism (biological accuracy) with fun gameplay (responsive, understandable AI). Fish are challenging but not frustrating, rewarding players who understand the mechanics.

**Recommended Reading Order:**
1. This guide (FISH_BEHAVIOR_GUIDE.md)
2. PROJECT_STRUCTURE.md (codebase overview)
3. RECOMMENDATIONS.md (potential improvements)
4. `/src/entities/FishAI.js` (source code)
