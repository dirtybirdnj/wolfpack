# Wolfpack Frenzy Feature Documentation

## Overview

The Wolfpack Frenzy feature implements a dynamic feast-and-famine spawn cycle system that creates periods of intense fishing action ("Wolfpack" frenzies) alternating with calmer periods. This creates a more engaging gameplay experience with dramatic shifts in fish population density.

## Gameplay Experience

- **Normal Play**: Regular fish spawning at base rates
- **Building Tension**: Gradual increase in spawn rates as fish begin to gather
- **Wolfpack Frenzy**: Intense 30-60 second periods where fish spawn at 4x normal rate with a red visual tint
- **Dispersal**: Fish scatter and spawn rates drop to near-zero for a recovery period
- **Quiet Period**: Minimal spawning before the cycle begins again

The full cycle takes approximately 2-4 minutes, with Wolfpack events occurring roughly every 2 minutes on average.

## Spawn Cycle State Machine

### States

1. **QUIET** (15-30 seconds)
   - Spawn rate: 10% of normal
   - Very few fish present
   - Recovery period after dispersal
   - Probability: 40%

2. **NORMAL** (30-60 seconds)
   - Spawn rate: 100% (base rate)
   - Standard fishing gameplay
   - Probability: 35%

3. **BUILDING** (20-40 seconds)
   - Spawn rate: 150% of normal
   - Tension builds as more fish appear
   - Probability: 15%

4. **WOLFPACK** (30-60 seconds)
   - Spawn rate: 400% of normal (4x)
   - All spawned fish have RED TINT (0xff8888)
   - "WOLFPACK FRENZY!" notification displayed
   - Maximum chaos and action
   - Probability: 5%

5. **DISPERSING** (20-40 seconds)
   - Spawn rate: 50% of normal
   - Fish scatter after frenzy
   - Probability: 5%

### State Transitions

```
QUIET → NORMAL → BUILDING → WOLFPACK → DISPERSING → QUIET
  ↓       ↓         ↓           ↓           ↓
(any state can transition to any other state based on random roll)
```

## Critical Implementation Details

### Timing Bug Fix

**CRITICAL**: The original implementation had a catastrophic bug where cycle durations were calculated using frames instead of milliseconds.

❌ **WRONG (causes Wolfpack every 2 seconds)**:
```javascript
this.cycleDuration = Utils.randomBetween(30, 60) * 60; // 30-60 frames!
```

✅ **CORRECT (Wolfpack every ~2 minutes)**:
```javascript
this.cycleDuration = Utils.randomBetween(30, 60) * 1000; // 30-60 seconds in milliseconds
```

All cycle duration calculations MUST use `* 1000` to convert seconds to milliseconds, not `* 60` which converts to frames.

### Wolfpack Protection

The system includes protection against overlapping Wolfpack events:

```javascript
// In enterWolfpack():
if (this.wolfpackActive) {
    Logger.warn('Wolfpack already active - skipping new event');
    return;
}
this.wolfpackActive = true;

// In exitWolfpack():
this.wolfpackActive = false;
```

This prevents multiple simultaneous Wolfpack notifications and ensures clean state transitions.

## Code Implementation

### SpawningSystem.js Changes

#### 1. Initialize State Variables

```javascript
constructor(scene) {
    this.scene = scene;

    // Spawn cycle system (feast/famine mechanics)
    this.spawnCycleState = 'NORMAL';
    this.cycleDuration = 60 * 1000; // 60 seconds in milliseconds
    this.cycleTimer = 0;
    this.wolfpackActive = false; // Protection against overlapping Wolfpack events

    Logger.cycle('SpawningSystem initialized - Cycle: NORMAL');
}
```

#### 2. Update Cycle Logic

```javascript
update(delta) {
    this.cycleTimer += delta;

    if (this.cycleTimer >= this.cycleDuration) {
        this.transitionSpawnCycle();
        this.cycleTimer = 0;
    }

    // Apply spawn multiplier based on cycle state
    let spawnMultiplier = 1.0;
    switch (this.spawnCycleState) {
        case 'QUIET': spawnMultiplier = 0.1; break;
        case 'NORMAL': spawnMultiplier = 1.0; break;
        case 'BUILDING': spawnMultiplier = 1.5; break;
        case 'WOLFPACK': spawnMultiplier = 4.0; break;
        case 'DISPERSING': spawnMultiplier = 0.5; break;
    }

    // Spawn fish with multiplier
    if (Math.random() < GameConfig.FISH_SPAWN_CHANCE * spawnMultiplier) {
        this.spawnFish();
    }
}
```

#### 3. State Transition Logic

```javascript
transitionSpawnCycle() {
    const previousState = this.spawnCycleState;

    // Exit current state
    if (previousState === 'WOLFPACK') {
        this.exitWolfpack();
    }

    // Random roll for next state
    const roll = Math.random();

    if (roll < 0.40) {
        // 40% chance - QUIET
        this.spawnCycleState = 'QUIET';
        this.cycleDuration = Utils.randomBetween(15, 30) * 1000; // 15-30 seconds
        Logger.cycle(`QUIET cycle started (${this.cycleDuration/1000}s) - 10% spawn rate`);

    } else if (roll < 0.75) {
        // 35% chance - NORMAL
        this.spawnCycleState = 'NORMAL';
        this.cycleDuration = Utils.randomBetween(30, 60) * 1000; // 30-60 seconds
        Logger.cycle(`NORMAL cycle started (${this.cycleDuration/1000}s) - 100% spawn rate`);

    } else if (roll < 0.90) {
        // 15% chance - BUILDING
        this.spawnCycleState = 'BUILDING';
        this.cycleDuration = Utils.randomBetween(20, 40) * 1000; // 20-40 seconds
        Logger.cycle(`BUILDING cycle started (${this.cycleDuration/1000}s) - 150% spawn rate`);

    } else if (roll < 0.95) {
        // 5% chance - WOLFPACK
        this.enterWolfpack();

    } else {
        // 5% chance - DISPERSING
        this.spawnCycleState = 'DISPERSING';
        this.cycleDuration = Utils.randomBetween(20, 40) * 1000; // 20-40 seconds
        Logger.cycle(`DISPERSING cycle started (${this.cycleDuration/1000}s) - 50% spawn rate`);
    }
}
```

#### 4. Wolfpack Entry/Exit

```javascript
enterWolfpack() {
    // Protection against overlapping Wolfpack events
    if (this.wolfpackActive) {
        Logger.warn('Wolfpack already active - skipping new event');
        return;
    }

    this.spawnCycleState = 'WOLFPACK';
    this.cycleDuration = Utils.randomBetween(30, 60) * 1000; // 30-60 seconds
    this.wolfpackActive = true;

    Logger.event(`WOLFPACK FRENZY started! (${this.cycleDuration/1000}s) - 400% spawn rate`);

    // Show notification
    if (this.scene.notificationSystem) {
        this.scene.notificationSystem.showWolfpackAlert();
    }
}

exitWolfpack() {
    this.wolfpackActive = false;
    Logger.event('WOLFPACK FRENZY ended - fish dispersing');

    // Clear notification
    if (this.scene.notificationSystem) {
        this.scene.notificationSystem.hideWolfpackAlert();
    }
}
```

#### 5. Red Tint for Wolfpack Fish

```javascript
spawnFish() {
    // ... existing spawn logic ...

    // Apply red tint if spawned during Wolfpack
    if (this.spawnCycleState === 'WOLFPACK' && this.wolfpackActive) {
        fish.isWolfpackFish = true;
        if (fish.sprite) {
            fish.sprite.setTint(0xff8888); // Red tint
        }
        Logger.spawn(`Spawned WOLFPACK ${species} with red tint`);
    } else {
        Logger.spawn(`Spawned ${species} at ${depth.toFixed(0)}ft (${this.spawnCycleState} cycle)`);
    }

    return fish;
}
```

### NotificationSystem.js Changes

#### Wolfpack Alert Display

```javascript
showWolfpackAlert() {
    this.hideAllMessages(); // Clear any existing messages

    const alert = this.scene.add.text(
        GameConfig.CANVAS_WIDTH / 2,
        100,
        'WOLFPACK FRENZY!',
        {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#ff0000',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }
    );
    alert.setOrigin(0.5);
    alert.setDepth(1500);

    // Pulsing animation
    this.scene.tweens.add({
        targets: alert,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1
    });

    this.wolfpackAlert = alert;
}

hideWolfpackAlert() {
    if (this.wolfpackAlert) {
        this.scene.tweens.killTweensOf(this.wolfpackAlert);
        this.wolfpackAlert.destroy();
        this.wolfpackAlert = null;
    }
}
```

## Spawn Rate Balance

### Base Rates (GameConfig.js)
- `FISH_SPAWN_CHANCE`: 0.015 per frame
- `BAITFISH_CLOUD_SPAWN_CHANCE`: 0.007 per frame
- `MAX_FISH`: 8
- `MAX_BAITFISH_CLOUDS`: 8

### Multiplied Rates During Wolfpack
- Fish: 0.015 × 4.0 = 0.06 per frame (6% chance)
- Baitfish: 0.007 × 4.0 = 0.028 per frame (2.8% chance)

At 60 FPS, this creates approximately 3.6 fish per second during Wolfpack frenzy.

## Visual Feedback

### Red Tint
- Color: `0xff8888` (light red)
- Applied to: All fish spawned during Wolfpack state
- Purpose: Visual indicator of frenzy fish
- Persists: Until fish is caught or despawns

### Notification
- Text: "WOLFPACK FRENZY!"
- Color: Red (#ff0000)
- Position: Top center of screen
- Animation: Pulsing alpha (1.0 ↔ 0.5)
- Duration: Entire Wolfpack cycle (30-60s)

## Future Enhancement Ideas

1. **Audio Feedback**: Add dramatic music or sound effects during Wolfpack
2. **Particle Effects**: Visual water disturbance effects during frenzy
3. **Trophy Fish Bonus**: Increased trophy fish spawn rate during Wolfpack
4. **Combo System**: Bonus points for catching multiple fish during frenzy
5. **Warning System**: Brief "Building..." notification before Wolfpack starts
6. **Statistics Tracking**: Track Wolfpack catches separately in player stats
7. **Difficulty Scaling**: Longer/more frequent Wolfpacks at higher skill levels

## Known Issues

### Resolved
- ✅ Timing bug (frames vs milliseconds) - CRITICAL FIX REQUIRED
- ✅ Overlapping Wolfpack events - Protected with wolfpackActive flag

### Potential Issues
- Red tint may not clear if fish state changes during Wolfpack
- Notification may not hide properly if scene transitions during Wolfpack
- Very rapid Wolfpack events possible with bad RNG (5% chance each cycle)

## Testing Checklist

When re-implementing this feature:

- [ ] Verify cycle transitions occur at correct intervals (30-60s, not 0.5-1s)
- [ ] Confirm Wolfpack occurs approximately every 2 minutes
- [ ] Check that red tint applies to all Wolfpack fish
- [ ] Verify notification appears and disappears correctly
- [ ] Test that wolfpackActive flag prevents overlapping events
- [ ] Confirm spawn rates multiply correctly in each state
- [ ] Verify Logger messages appear with correct [CYCLE] and [EVENT] tags
- [ ] Test scene transitions during Wolfpack (proper cleanup)
- [ ] Verify fish counter doesn't exceed MAX_FISH during Wolfpack

## Logging Tokens

Use these Logger tokens to debug the system:

- `Logger.cycle()` - State transitions and cycle changes
- `Logger.event()` - Wolfpack start/end events
- `Logger.spawn()` - Fish spawning with cycle state
- `Logger.warn()` - Overlapping Wolfpack prevention

Example console output:
```
[CYCLE] NORMAL cycle started (45s) - 100% spawn rate
[SPAWN] Spawned LAKE_TROUT at 67ft (NORMAL cycle)
[CYCLE] BUILDING cycle started (32s) - 150% spawn rate
[EVENT] WOLFPACK FRENZY started! (48s) - 400% spawn rate
[SPAWN] Spawned WOLFPACK LAKE_TROUT with red tint
[EVENT] WOLFPACK FRENZY ended - fish dispersing
[CYCLE] DISPERSING cycle started (28s) - 50% spawn rate
```

## Reversion Notes

This feature was implemented and then reverted because the Wolfpack events were "too chaotic" for the desired gameplay experience. The user described it as "funny because it's so chaotic" but ultimately decided against keeping it in the game.

The core implementation was sound after the critical timing bug fix, but the gameplay feel didn't match the vision for the game. This documentation preserves the implementation for potential future use with adjusted parameters or as a special game mode.
