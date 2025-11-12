# Restoration Plan: Main Gameplay + Refactor Architecture

**Created:** Nov 12, 2025
**Goal:** Combine working gameplay from `main` with clean architecture from `refactor-entity-model-relationship`

---

## 🎯 Vision: Minimal Playable Demo

### **Scope:**
- **1 Predator Species:** Lake Trout (proven, working AI)
- **1 Baitfish Species:** Alewife (tight schooling, good prey)
- **Bug Fixes Only:** No new features
- **Core Loop:** Drop lure → Fish chase → Strike → Fight → Catch

### **Success Criteria:**
✅ Fish chase and strike lure reliably (like current main)
✅ Schools form and move naturally
✅ Predator-prey interactions work
✅ Reel/drag mechanics functional
✅ Game feels responsive and fun

---

## 📊 Current State Analysis

### **Main Branch (Working Gameplay)** ✅
**Last Good Commit:** `68a72ee` - Nov 2, 2024

**What Works:**
- ✅ Fish AI chases lure aggressively
- ✅ Strike detection reliable
- ✅ Baitfish schools move naturally
- ✅ Predators hunt baitfish
- ✅ FPS stable, no lag

**What's Broken:**
- ❌ Reel/drag balance issues (sticking point)
- ❌ Some fish species AI inconsistent
- ❌ Code duplication across species

**Key Files:**
- `src/entities/FishAI.js` (546 lines) - **GOOD AI LOGIC**
- `src/entities/Fish.js` (1010 lines) - Species factory
- `src/models/BaitfishCloud.js` (170 lines) - Working schools
- `src/entities/FishFight.js` (443 lines) - Fight mechanics

---

### **Refactor Branch (Clean Architecture)** 🔧
**Current HEAD:** `3ae63e1` - Nov 12, 2024

**What's Better:**
- ✅ TypeScript (type safety)
- ✅ Unified organism architecture
- ✅ No code duplication
- ✅ Clean data-driven species
- ✅ Better separation of concerns

**What's Broken:**
- ❌ Gameplay feel changed
- ❌ Fish less aggressive
- ❌ Encounter rates reduced
- ❌ TypeScript conversion incomplete

**Key Files:**
- `src/entities/FishAI.ts` - Same logic, TypeScript
- `src/sprites/FishSprite.ts` - Unified sprite class
- `src/config/OrganismData.js` - Clean species data
- `src/systems/SchoolManager.js` - Emergent schooling

---

## 🔀 Restoration Strategy

### **Approach: Cherry-Pick Gameplay from Main into Refactor**

**Why this direction:**
1. Refactor has better architecture (keep it)
2. Main has better gameplay (port it)
3. TypeScript is valuable (keep it)
4. Clean species system is good (keep it)

**Steps:**
1. Start from refactor branch (clean architecture)
2. Port FishAI behavior values from main
3. Restore aggressive AI parameters
4. Test with 1 predator + 1 bait only
5. Fix bugs, tune values
6. Get playable demo working

---

## 📋 Restoration Checklist

### **Phase 1: Simplify to Minimal Demo** (2 hours)

**1.1 Disable All Species Except Lake Trout + Alewife**

**File:** `src/scenes/systems/SpawningSystem.ts`

```typescript
// TEMPORARY: Only spawn lake trout and alewife
spawnFish() {
  const species = 'lake_trout'; // Force lake trout only
  // ... spawn logic
}

spawnBaitfishSchool() {
  const species = 'alewife'; // Force alewife only
  // ... spawn logic
}
```

**Goal:** Reduce variables, focus on one working predator-prey pair

---

**1.2 Restore Main's Aggressive AI Values**

**File:** `src/entities/FishAI.ts`

Compare and port these values from main:

```typescript
// FROM MAIN (working values):
this.baseAggressiveness = Math.random() * 0.5 + 0.5; // 50-100% aggressive
this.decisionCooldown = 500; // Fast decisions
// NO migration logic
// NO abandon cooldowns
// NO commitment timers

// CURRENT REFACTOR (too cautious):
// Has migration, abandon cooldowns, etc.
```

**Action:** Copy the constructor from main's `FishAI.js` → refactor's `FishAI.ts`

---

**1.3 Restore Main's Detection/Strike Values**

**File:** `src/config/GameConfig.ts`

```typescript
// FROM MAIN (generous values):
DETECTION_RANGE: 150,  // pixels
STRIKE_DISTANCE: 25,   // pixels (not too far, not too close)
FISH_SPAWN_CHANCE: 0.008,  // Frequent encounters

// Check refactor values and restore if changed
```

---

**1.4 Remove Ecosystem Restrictions**

**File:** `src/scenes/systems/SpawningSystem.ts`

```typescript
// REMOVE ecosystem state checks that reduce spawns
// REMOVE migration logic
// REMOVE recovery periods

// Just spawn fish at consistent rate
```

---

### **Phase 2: Port Working Mechanics** (3 hours)

**2.1 Baitfish Following Lure**

**Status:** Removed in main at commit `bf6492b`
**Action:** Check if this was fun, consider re-adding

**File:** `src/models/BaitfishCloud.js` (main) → `src/systems/SchoolManager.ts` (refactor)

```javascript
// From main - baitfish were attracted to lure
// Evaluate if this made gameplay more fun
```

---

**2.2 Strike Detection Logic**

**File:** `src/entities/FishAI.ts` - `strikingBehavior()` method

Compare main vs. refactor:

```typescript
// MAIN (simple, reliable):
if (distance < STRIKE_DISTANCE && Math.random() < 0.8) {
  this.state = 'striking';
}

// REFACTOR (complex, restrictive):
if (distance < STRIKE_DISTANCE) {
  if (hasBumpedLure && !engaged && cooldown < 50 && ...) {
    this.state = 'striking';
  }
}
```

**Action:** Use main's simple logic

---

**2.3 Schooling Behavior**

**File:** `src/systems/SchoolManager.ts`

**Main used:** `BaitfishCloud.js` with simple flocking
**Refactor uses:** `SchoolManager.ts` with emergent flocking

**Action:** Test if refactor's schooling looks as good as main's
- If yes: keep refactor
- If no: port main's logic

---

### **Phase 3: Reel/Drag Tuning** (2 hours)

**Problem:** Main got stuck on reel/drag balance

**File:** `src/entities/FishFight.ts` & `src/models/ReelModel.ts`

**Goal:** Make fights exciting but winnable

**Values to tune:**
```typescript
// Fish pull strength
FISH_PULL_BASE: 5,        // Base tension from fish

// Reeling
TENSION_PER_REEL: 15,     // Tension per spacebar tap
MIN_REEL_INTERVAL: 100,   // ms between taps
REEL_DISTANCE_PER_TAP: 5, // Progress per tap

// Line strength
MAX_LINE_TENSION: 100,
TENSION_BREAK_THRESHOLD: 95,
```

**Test scenarios:**
1. Small lake trout (3-5 lbs) - Should be easy
2. Medium lake trout (10-15 lbs) - Challenging
3. Large lake trout (20+ lbs) - Hard but winnable

---

### **Phase 4: Bug Fixes** (1 hour)

**Known Issues:**

1. **Fish Swimming Backward** - [Issue #78](https://github.com/dirtybirdnj/wolfpack/issues/78)
   - **File:** `src/sprites/FishSprite.ts:360-364`
   - **Fix:** Remove `Math.abs()` from angle calculation

2. **Fish Stuck at Edges**
   - **Status:** Fixed in main at `b1289ae`
   - **Action:** Verify fix exists in refactor

3. **Invisible Baitfish**
   - **Status:** Fixed in main at `77caba5`
   - **Action:** Verify fix exists in refactor

---

## 🎮 Testing Protocol

### **Test 1: Core Fishing Loop** (5 minutes)

1. Start game
2. Drop lure to 50ft depth
3. Wait for lake trout to approach
4. **Success criteria:**
   - ✅ Fish appears within 20 seconds
   - ✅ Fish chases lure
   - ✅ Strike occurs
   - ✅ Fight begins
   - ✅ Can land fish

---

### **Test 2: Baitfish Interaction** (5 minutes)

1. Drop lure near alewife school
2. Watch predator behavior
3. **Success criteria:**
   - ✅ Schools form (15-30 alewife)
   - ✅ Schools move naturally
   - ✅ Lake trout hunts alewife
   - ✅ Lake trout eats alewife
   - ✅ Feeding frenzy occurs

---

### **Test 3: Multiple Fish** (10 minutes)

1. Let 3-5 lake trout spawn
2. Drop lure
3. **Success criteria:**
   - ✅ Multiple fish interested
   - ✅ No fish stuck/frozen
   - ✅ FPS stays above 50
   - ✅ Fish don't clip through each other

---

## 📁 File-by-File Restoration Guide

### **Priority 1: AI Behavior**

| File | Action | Why |
|------|--------|-----|
| `src/entities/FishAI.ts` | Port from main | Core gameplay logic |
| `src/config/GameConfig.ts` | Restore values | Detection/spawn rates |
| `src/scenes/systems/SpawningSystem.ts` | Simplify | Remove ecosystem restrictions |

### **Priority 2: Species Data**

| File | Action | Why |
|------|--------|-----|
| `src/config/OrganismData.js` | Keep refactor, tune values | Clean architecture |
| `src/sprites/FishSprite.ts` | Keep refactor | Unified sprite system |

### **Priority 3: Mechanics**

| File | Action | Why |
|------|--------|-----|
| `src/entities/FishFight.ts` | Tune values | Balance fights |
| `src/models/ReelModel.ts` | Tune values | Balance reeling |
| `src/systems/SchoolManager.ts` | Test & compare | Verify schooling works |

---

## 🚀 Implementation Plan

### **Day 1: Simplify & Restore** (4 hours)

**Morning:**
1. ✅ Create new branch: `restore-gameplay`
   ```bash
   git checkout refactor-entity-model-relationship
   git checkout -b restore-gameplay
   ```

2. ✅ Disable all species except lake trout + alewife
3. ✅ Port FishAI constructor values from main
4. ✅ Remove ecosystem restrictions

**Afternoon:**
5. ✅ Test core fishing loop
6. ✅ Fix any immediate bugs
7. ✅ Document what works/doesn't work

---

### **Day 2: Tune & Polish** (4 hours)

**Morning:**
1. ✅ Restore strike detection logic from main
2. ✅ Tune detection ranges
3. ✅ Test baitfish schooling

**Afternoon:**
4. ✅ Tune reel/drag mechanics
5. ✅ Test fight difficulty
6. ✅ Fix fish swimming backward bug

---

### **Day 3: Demo Ready** (2 hours)

1. ✅ Final testing protocol
2. ✅ Record gameplay video
3. ✅ Create demo build
4. ✅ Share for feedback

---

## 🎯 Success Metrics

### **Playable Demo Checklist:**

- [ ] Game loads without errors
- [ ] Fish spawn within 20 seconds
- [ ] Fish chase lure reliably (80%+ of time)
- [ ] Strikes occur naturally
- [ ] Fights are exciting but winnable
- [ ] Can catch 3 fish in 5 minutes
- [ ] FPS stays above 50
- [ ] No game-breaking bugs

---

## 🔧 Specific Code Changes

### **Change 1: Simplify FishAI Constructor**

**File:** `src/entities/FishAI.ts:60-120`

```typescript
// BEFORE (refactor - too complex):
constructor(fish: FishSprite) {
  this.fish = fish;
  this.state = 'idle';
  // ... lots of initialization

  // Migration logic
  this.lastBaitfishSightingTime = null;
  this.baitfishTimeout = 3000;
  this.leavingArea = false;

  // Commitment logic
  this.minHuntingCommitment = 2000;
  this.huntingStartTime = 0;
  this.abandonCooldown = 3000;
  this.lastAbandonTime = 0;
}

// AFTER (main - simple, aggressive):
constructor(fish: FishSprite) {
  this.fish = fish;
  this.state = 'idle';
  this.targetX = null;
  this.targetY = null;
  this.alertness = Math.random() * 0.5 + 0.5;
  this.baseAggressiveness = Math.random() * 0.5 + 0.5;
  this.lastDecisionTime = 0;
  this.decisionCooldown = 500;

  // NO migration logic
  // NO commitment timers
  // NO abandon cooldowns
}
```

---

### **Change 2: Simplify Strike Detection**

**File:** `src/entities/FishAI.ts:strikingBehavior()`

```typescript
// BEFORE (refactor - too restrictive):
strikingBehavior(lure: Lure) {
  const distance = this.calculateDistance(lure);

  if (distance < STRIKE_DISTANCE) {
    if (this.hasBumpedLure &&
        !this.engaged &&
        this.commitmentTime > this.minHuntingCommitment &&
        this.decisionCooldown < 50 &&
        Math.random() < effectiveness * aggressiveness) {
      this.state = 'striking';
    }
  }
}

// AFTER (main - simple, reliable):
strikingBehavior(lure: Lure) {
  const distance = this.calculateDistance(lure);
  const strikeDistance = this.getStrikeDistance();

  if (distance < strikeDistance && Math.random() < 0.8) {
    this.state = 'striking';
    this.strikeAttempts++;
  }
}
```

---

### **Change 3: Remove Ecosystem Spawn Throttling**

**File:** `src/scenes/systems/SpawningSystem.ts:spawnFish()`

```typescript
// BEFORE (refactor - ecosystem restrictions):
spawnFish() {
  // Check ecosystem state
  if (this.ecosystem === 'RECOVERING') {
    this.spawnChance *= 0.125; // 87.5% reduction!
  }

  if (this.baitfishCount < minBaitfish) {
    this.despawnPredators();
    return; // Don't spawn
  }

  // ... spawn logic
}

// AFTER (main - consistent spawns):
spawnFish() {
  // Just spawn at consistent rate
  if (Math.random() < GameConfig.FISH_SPAWN_CHANCE) {
    const species = 'lake_trout'; // Demo: only lake trout
    this.createFish(species);
  }
}
```

---

## 🎨 Visual Reference

**From your screenshot:**
- ✅ Large play area (good)
- ✅ Fish visible in water column
- ✅ Lure at depth with line
- ✅ Fish status panel showing stats
- ✅ Baitfish schools at bottom
- ✅ Clean UI layout

**Keep this visual style, restore the gameplay feel.**

---

## 📝 Next Steps

1. **Read this plan** - Understand the approach
2. **Create `restore-gameplay` branch** - Start clean
3. **Phase 1: Simplify** - 1 predator, 1 bait only
4. **Test immediately** - Does it work?
5. **Phase 2: Port AI** - Restore aggressive behavior
6. **Test again** - Is it fun?
7. **Phase 3: Tune** - Balance reel/drag
8. **Demo ready** - Share and get feedback

---

## ⚠️ Warnings

**Don't:**
- ❌ Add new features (focus on working demo)
- ❌ Try to fix everything at once
- ❌ Keep complex ecosystem logic
- ❌ Worry about other species yet

**Do:**
- ✅ Start minimal (1 predator, 1 bait)
- ✅ Test frequently (every change)
- ✅ Port working code from main
- ✅ Keep refactor architecture
- ✅ Focus on fun, not realism

---

**Last Updated:** Nov 12, 2025
**Status:** Plan ready for implementation
**Estimated Time:** 10 hours total
**Target:** Playable demo by end of week
