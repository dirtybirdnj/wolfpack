/**
 * FishAI Tests
 *
 * Tests the complex AI state machine that controls all fish behavior.
 * This is CRITICAL for TypeScript conversion - 909 lines of game logic.
 *
 * Focus areas:
 * - Constructor initialization (species-specific behavior setup)
 * - State machine transitions (7 states: idle, interested, chasing, striking, fleeing, hunting_baitfish, feeding)
 * - Frenzy detection (multi-fish interaction)
 * - Species-specific behaviors (Pike ambush, Bass circling)
 * - Decision-making calculations (aggressiveness, strike distance, depth preference)
 */

import { jest } from '@jest/globals';
import { FishAI } from '../../src/entities/FishAI.js';
import { Constants } from '../../src/utils/Constants.js';
import GameConfig from '../../src/config/GameConfig.js';
import {
  createMockFish,
  createMockLure,
  createMockFishArray,
  createMockBaitfishCloud
} from '../helpers/testUtils.js';

describe('FishAI - Constructor and Initialization', () => {
  test('Creates with default properties', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    expect(ai.fish).toBe(fish);
    expect(ai.fishingType).toBe(GameConfig.FISHING_TYPE_ICE);
    expect(ai.state).toBe(Constants.FISH_STATE.IDLE);
    expect(ai.targetX).toBeNull();
    expect(ai.targetY).toBeNull();
  });

  test('Initializes alertness between 0.5 and 1.0', () => {
    const fish = createMockFish();

    // Test multiple times due to randomness
    for (let i = 0; i < 10; i++) {
      const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
      expect(ai.alertness).toBeGreaterThanOrEqual(0.5);
      expect(ai.alertness).toBeLessThanOrEqual(1.0);
    }
  });

  test('Initializes base aggressiveness between 0.5 and 1.0', () => {
    const fish = createMockFish();

    for (let i = 0; i < 10; i++) {
      const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
      expect(ai.baseAggressiveness).toBeGreaterThanOrEqual(0.5);
      expect(ai.baseAggressiveness).toBeLessThanOrEqual(1.0);
    }
  });

  test('Initializes with random idle direction', () => {
    const fish = createMockFish();
    const directions = new Set();

    for (let i = 0; i < 20; i++) {
      const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
      directions.add(ai.idleDirection);
    }

    // Should have both 1 and -1 in set
    expect(directions.size).toBe(2);
    expect(directions.has(1)).toBe(true);
    expect(directions.has(-1)).toBe(true);
  });

  test('Sets default strike attempts to 1', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    expect(ai.strikeAttempts).toBe(0);
    expect(ai.maxStrikeAttempts).toBe(1);
  });

  test('Calculates depth preference within expected range', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    expect(ai.depthPreference).toBeGreaterThanOrEqual(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MIN);
    expect(ai.depthPreference).toBeLessThanOrEqual(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MAX);
  });

  test('Calculates speed preference within expected range', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    expect(ai.speedPreference).toBeGreaterThanOrEqual(1.5);
    expect(ai.speedPreference).toBeLessThanOrEqual(3.5);
  });

  test('Initializes baitfish hunting properties', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    expect(ai.targetBaitfishCloud).toBeNull();
    expect(ai.targetBaitfish).toBeNull();
    expect(ai.isFrenzying).toBe(false);
  });

  test('Initializes thermocline behavior flag', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    expect(ai.returningToThermocline).toBe(false);
  });

  test('Initializes with no bumped lure flag', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    expect(ai.hasBumpedLure).toBe(false);
  });
});

describe('FishAI - Species-Specific Initialization (Northern Pike)', () => {
  test('Northern Pike are initialized as ambush predators', () => {
    const pike = createMockFish({ species: 'northern_pike' });
    const ai = new FishAI(pike, GameConfig.FISHING_TYPE_ICE);

    expect(ai.isAmbushPredator).toBe(true);
  });

  test('Northern Pike get ambush position set to initial location', () => {
    const pike = createMockFish({
      species: 'northern_pike',
      worldX: 1234,
      y: 567
    });
    const ai = new FishAI(pike, GameConfig.FISHING_TYPE_ICE);

    expect(ai.ambushPosition).toEqual({ x: 1234, y: 567 });
  });

  test('Northern Pike have ambush radius property', () => {
    const pike = createMockFish({ species: 'northern_pike' });
    const ai = new FishAI(pike, GameConfig.FISHING_TYPE_ICE);

    expect(ai.ambushRadius).toBe(50);
  });

  test('Northern Pike have extended strike range', () => {
    const pike = createMockFish({ species: 'northern_pike' });
    const ai = new FishAI(pike, GameConfig.FISHING_TYPE_ICE);

    expect(ai.strikeRange).toBe(60);
  });

  test('Northern Pike have burst speed multiplier', () => {
    const pike = createMockFish({ species: 'northern_pike' });
    const ai = new FishAI(pike, GameConfig.FISHING_TYPE_ICE);

    expect(ai.burstSpeed).toBe(2.5);
  });

  test('Non-pike species are not ambush predators', () => {
    const trout = createMockFish({ species: 'lake_trout' });
    const ai = new FishAI(trout, GameConfig.FISHING_TYPE_ICE);

    expect(ai.isAmbushPredator).toBe(false);
  });
});

describe('FishAI - Species-Specific Initialization (Smallmouth Bass)', () => {
  test('Smallmouth Bass are initialized to circle before strike', () => {
    const bass = createMockFish({ species: 'smallmouth_bass' });
    const ai = new FishAI(bass, GameConfig.FISHING_TYPE_ICE);

    expect(ai.circlesBeforeStrike).toBe(true);
  });

  test('Smallmouth Bass start not circling', () => {
    const bass = createMockFish({ species: 'smallmouth_bass' });
    const ai = new FishAI(bass, GameConfig.FISHING_TYPE_ICE);

    expect(ai.isCircling).toBe(false);
  });

  test('Smallmouth Bass have circle angle initialized', () => {
    const bass = createMockFish({ species: 'smallmouth_bass' });
    const ai = new FishAI(bass, GameConfig.FISHING_TYPE_ICE);

    expect(ai.circleAngle).toBeGreaterThanOrEqual(0);
    expect(ai.circleAngle).toBeLessThanOrEqual(Math.PI * 2);
  });

  test('Smallmouth Bass have circle radius', () => {
    const bass = createMockFish({ species: 'smallmouth_bass' });
    const ai = new FishAI(bass, GameConfig.FISHING_TYPE_ICE);

    expect(ai.circleRadius).toBe(35);
  });

  test('Smallmouth Bass have circle speed', () => {
    const bass = createMockFish({ species: 'smallmouth_bass' });
    const ai = new FishAI(bass, GameConfig.FISHING_TYPE_ICE);

    expect(ai.circleSpeed).toBe(0.08);
  });

  test('Smallmouth Bass have circle direction (clockwise or counter)', () => {
    const bass = createMockFish({ species: 'smallmouth_bass' });
    const directions = new Set();

    for (let i = 0; i < 20; i++) {
      const ai = new FishAI(bass, GameConfig.FISHING_TYPE_ICE);
      directions.add(ai.circleDirection);
    }

    expect(directions.size).toBe(2);
    expect(directions.has(1)).toBe(true);
    expect(directions.has(-1)).toBe(true);
  });

  test('Smallmouth Bass have circle time counters', () => {
    const bass = createMockFish({ species: 'smallmouth_bass' });
    const ai = new FishAI(bass, GameConfig.FISHING_TYPE_ICE);

    expect(ai.circleTime).toBe(0);
    expect(ai.maxCircleTime).toBe(120);
  });

  test('Non-bass species do not circle', () => {
    const trout = createMockFish({ species: 'lake_trout' });
    const ai = new FishAI(trout, GameConfig.FISHING_TYPE_ICE);

    expect(ai.circlesBeforeStrike).toBe(false);
  });
});

describe('FishAI - Aggressiveness Getter', () => {
  test('Returns value between 0.1 and 1.0', () => {
    const fish = createMockFish({
      depthZone: {
        name: 'Mid-Column',
        aggressivenessBonus: 0
      }
    });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    const aggressiveness = ai.aggressiveness;
    expect(aggressiveness).toBeGreaterThanOrEqual(0.1);
    expect(aggressiveness).toBeLessThanOrEqual(1.0);
  });

  test('Applies depth zone bonus to base aggressiveness', () => {
    const fish = createMockFish({
      depthZone: {
        name: 'Thermocline',
        aggressivenessBonus: 0.3
      }
    });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    ai.baseAggressiveness = 0.5;

    expect(ai.aggressiveness).toBe(0.8); // 0.5 + 0.3
  });

  test('Clamps aggressiveness to maximum of 1.0', () => {
    const fish = createMockFish({
      depthZone: {
        name: 'Thermocline',
        aggressivenessBonus: 0.8
      }
    });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    ai.baseAggressiveness = 0.9;

    expect(ai.aggressiveness).toBe(1.0); // Clamped from 1.7
  });

  test('Clamps aggressiveness to minimum of 0.1', () => {
    const fish = createMockFish({
      depthZone: {
        name: 'Surface',
        aggressivenessBonus: -0.5
      }
    });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    ai.baseAggressiveness = 0.2;

    expect(ai.aggressiveness).toBe(0.1); // Clamped from -0.3
  });

  test('Zero bonus returns base aggressiveness', () => {
    const fish = createMockFish({
      depthZone: {
        name: 'Mid-Column',
        aggressivenessBonus: 0
      }
    });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    ai.baseAggressiveness = 0.7;

    expect(ai.aggressiveness).toBe(0.7);
  });
});

describe('FishAI - getStrikeDistance', () => {
  test('Northern Pike have longer strike distance', () => {
    const pike = createMockFish({ species: 'northern_pike' });
    const ai = new FishAI(pike, GameConfig.FISHING_TYPE_ICE);

    expect(ai.getStrikeDistance()).toBe(60); // Pike-specific strike range
  });

  test('Non-pike species use default strike distance', () => {
    const trout = createMockFish({ species: 'lake_trout' });
    const ai = new FishAI(trout, GameConfig.FISHING_TYPE_ICE);

    expect(ai.getStrikeDistance()).toBe(GameConfig.STRIKE_DISTANCE);
  });

  test('Pike strike distance is greater than default', () => {
    const pike = createMockFish({ species: 'northern_pike' });
    const pikeAi = new FishAI(pike, GameConfig.FISHING_TYPE_ICE);

    const trout = createMockFish({ species: 'lake_trout' });
    const troutAi = new FishAI(trout, GameConfig.FISHING_TYPE_ICE);

    expect(pikeAi.getStrikeDistance()).toBeGreaterThan(troutAi.getStrikeDistance());
  });
});

describe('FishAI - calculateDepthPreference', () => {
  test('Returns depth within preferred range', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    const depth = ai.calculateDepthPreference();
    expect(depth).toBeGreaterThanOrEqual(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MIN);
    expect(depth).toBeLessThanOrEqual(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MAX);
  });

  test('Different calls return different values (uses randomness)', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    const depths = new Set();
    for (let i = 0; i < 10; i++) {
      depths.add(ai.calculateDepthPreference());
    }

    // Should have multiple different values (statistically very unlikely to be all the same)
    expect(depths.size).toBeGreaterThan(1);
  });
});

describe('FishAI - detectFrenzy (Multi-Fish Interaction)', () => {
  test('Does not enter frenzy when alone', () => {
    const fish = createMockFish({ inFrenzy: false });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    const lure = createMockLure();

    ai.detectFrenzy(lure, [fish]); // Only this fish

    expect(fish.inFrenzy).toBe(false);
  });

  test('Can enter frenzy when other fish are interested', () => {
    const fish = createMockFish({ inFrenzy: false });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    // Create other excited fish nearby
    const excitedFish = createMockFishArray(2, Constants.FISH_STATE.INTERESTED, 490, 95);
    const lure = createMockLure({ x: 500, y: 100 });

    const allFish = [fish, ...excitedFish];

    // Run multiple times due to 75% probability
    let enteredFrenzy = false;
    for (let i = 0; i < 20; i++) {
      fish.inFrenzy = false;
      ai.state = Constants.FISH_STATE.IDLE;
      ai.detectFrenzy(lure, allFish);
      if (fish.inFrenzy) {
        enteredFrenzy = true;
        break;
      }
    }

    expect(enteredFrenzy).toBe(true);
  });

  test('Frenzy duration scales with number of excited fish', () => {
    const fish = createMockFish({ inFrenzy: false });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    // Test with 1 excited fish
    const excitedFish1 = createMockFishArray(1, Constants.FISH_STATE.CHASING, 490, 95);
    const lure = createMockLure({ x: 500, y: 100 });

    ai.state = Constants.FISH_STATE.IDLE;
    fish.inFrenzy = false;

    // Force frenzy entry by running multiple times
    for (let i = 0; i < 50; i++) {
      ai.state = Constants.FISH_STATE.IDLE;
      fish.inFrenzy = false;
      ai.detectFrenzy(lure, [fish, ...excitedFish1]);
      if (fish.inFrenzy) break;
    }

    const timer1 = fish.frenzyTimer;

    // Test with 3 excited fish
    const excitedFish3 = createMockFishArray(3, Constants.FISH_STATE.CHASING, 490, 95);
    ai.state = Constants.FISH_STATE.IDLE;
    fish.inFrenzy = false;

    for (let i = 0; i < 50; i++) {
      ai.state = Constants.FISH_STATE.IDLE;
      fish.inFrenzy = false;
      ai.detectFrenzy(lure, [fish, ...excitedFish3]);
      if (fish.inFrenzy) break;
    }

    const timer3 = fish.frenzyTimer;

    // More fish should result in longer frenzy
    expect(timer3).toBeGreaterThan(timer1);
  });

  test('Frenzy intensity scales with number of excited fish', () => {
    const fish = createMockFish({ inFrenzy: false });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    const excitedFish = createMockFishArray(3, Constants.FISH_STATE.STRIKING, 490, 95);
    const lure = createMockLure({ x: 500, y: 100 });

    ai.state = Constants.FISH_STATE.IDLE;

    // Force frenzy entry
    for (let i = 0; i < 50; i++) {
      fish.inFrenzy = false;
      ai.state = Constants.FISH_STATE.IDLE;
      ai.detectFrenzy(lure, [fish, ...excitedFish]);
      if (fish.inFrenzy) break;
    }

    expect(fish.frenzyIntensity).toBeGreaterThan(0);
    expect(fish.frenzyIntensity).toBeLessThanOrEqual(1.0);
  });

  test('Frenzying fish get multiple strike attempts', () => {
    const fish = createMockFish({ inFrenzy: false });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    const excitedFish = createMockFishArray(2, Constants.FISH_STATE.CHASING, 490, 95);
    const lure = createMockLure({ x: 500, y: 100 });

    ai.state = Constants.FISH_STATE.IDLE;

    // Force frenzy entry
    for (let i = 0; i < 50; i++) {
      fish.inFrenzy = false;
      ai.state = Constants.FISH_STATE.IDLE;
      ai.detectFrenzy(lure, [fish, ...excitedFish]);
      if (fish.inFrenzy) break;
    }

    expect(ai.maxStrikeAttempts).toBeGreaterThan(1);
    expect(ai.maxStrikeAttempts).toBeLessThanOrEqual(3);
  });

  test('Fish in frenzy state changes to interested', () => {
    const fish = createMockFish({ inFrenzy: false });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    const excitedFish = createMockFishArray(2, Constants.FISH_STATE.CHASING, 490, 95);
    const lure = createMockLure({ x: 500, y: 100 });

    ai.state = Constants.FISH_STATE.IDLE;

    // Force frenzy entry
    for (let i = 0; i < 50; i++) {
      fish.inFrenzy = false;
      ai.state = Constants.FISH_STATE.IDLE;
      ai.detectFrenzy(lure, [fish, ...excitedFish]);
      if (fish.inFrenzy) break;
    }

    expect(ai.state).toBe(Constants.FISH_STATE.INTERESTED);
  });

  test('Frenzy triggers interest flash on fish', () => {
    const fish = createMockFish({ inFrenzy: false });
    fish.triggerInterestFlash = jest.fn();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    const excitedFish = createMockFishArray(2, Constants.FISH_STATE.CHASING, 490, 95);
    const lure = createMockLure({ x: 500, y: 100 });

    ai.state = Constants.FISH_STATE.IDLE;

    // Force frenzy entry
    for (let i = 0; i < 50; i++) {
      fish.inFrenzy = false;
      fish.triggerInterestFlash.mockClear();
      ai.state = Constants.FISH_STATE.IDLE;
      ai.detectFrenzy(lure, [fish, ...excitedFish]);
      if (fish.inFrenzy) break;
    }

    expect(fish.triggerInterestFlash).toHaveBeenCalled();
    expect(fish.triggerInterestFlash).toHaveBeenCalledWith(0.8);
  });

  test('Does not count self when detecting excited fish', () => {
    const fish = createMockFish({ inFrenzy: false });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    ai.state = Constants.FISH_STATE.CHASING; // This fish is excited

    const lure = createMockLure();

    // Only this fish exists, but it's excited
    ai.detectFrenzy(lure, [fish]);

    // Should not enter frenzy from seeing itself
    expect(fish.inFrenzy).toBe(false);
  });

  test('Detects excited fish in HUNTING_BAITFISH state', () => {
    const fish = createMockFish({ inFrenzy: false });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    const huntingFish = createMockFishArray(2, Constants.FISH_STATE.HUNTING_BAITFISH, 490, 95);
    const lure = createMockLure({ x: 500, y: 100 });

    ai.state = Constants.FISH_STATE.IDLE;

    // Force frenzy entry
    let enteredFrenzy = false;
    for (let i = 0; i < 50; i++) {
      fish.inFrenzy = false;
      ai.state = Constants.FISH_STATE.IDLE;
      ai.detectFrenzy(lure, [fish, ...huntingFish]);
      if (fish.inFrenzy) {
        enteredFrenzy = true;
        break;
      }
    }

    expect(enteredFrenzy).toBe(true);
  });

  test('Detects excited fish in FEEDING state', () => {
    const fish = createMockFish({ inFrenzy: false });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    const feedingFish = createMockFishArray(2, Constants.FISH_STATE.FEEDING, 490, 95);
    const lure = createMockLure({ x: 500, y: 100 });

    ai.state = Constants.FISH_STATE.IDLE;

    // Force frenzy entry
    let enteredFrenzy = false;
    for (let i = 0; i < 50; i++) {
      fish.inFrenzy = false;
      ai.state = Constants.FISH_STATE.IDLE;
      ai.detectFrenzy(lure, [fish, ...feedingFish]);
      if (fish.inFrenzy) {
        enteredFrenzy = true;
        break;
      }
    }

    expect(enteredFrenzy).toBe(true);
  });

  test('Only detects fish within detection range', () => {
    const fish = createMockFish({ x: 500, y: 100, inFrenzy: false });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    // Create excited fish FAR away (beyond detection range * 3)
    const farFish = createMockFish({
      x: 5000,
      y: 100,
      ai: { state: Constants.FISH_STATE.CHASING }
    });

    const lure = createMockLure({ x: 500, y: 100 });

    ai.state = Constants.FISH_STATE.IDLE;

    // Try multiple times
    for (let i = 0; i < 20; i++) {
      fish.inFrenzy = false;
      ai.state = Constants.FISH_STATE.IDLE;
      ai.detectFrenzy(lure, [fish, farFish]);
    }

    // Should not enter frenzy from far fish
    expect(fish.inFrenzy).toBe(false);
  });
});

describe('FishAI - detectFrenzy (Vertical Strike)', () => {
  test('Mid-column fish can streak upward to lure above', () => {
    const fish = createMockFish({
      x: 500,
      y: 200, // Deep
      depthZone: {
        name: 'Mid-Column',
        aggressivenessBonus: 0.1
      },
      inFrenzy: false
    });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    // Lure above fish
    const lure = createMockLure({ x: 510, y: 100 });

    ai.state = Constants.FISH_STATE.IDLE;

    // Try multiple times due to 30% probability
    let streaked = false;
    for (let i = 0; i < 50; i++) {
      fish.inFrenzy = false;
      ai.state = Constants.FISH_STATE.IDLE;
      ai.detectFrenzy(lure, [fish]);
      if (ai.state === Constants.FISH_STATE.CHASING) {
        streaked = true;
        break;
      }
    }

    expect(streaked).toBe(true);
  });

  test('Bottom fish can streak upward to lure above', () => {
    const fish = createMockFish({
      x: 500,
      y: 400, // Very deep
      depthZone: {
        name: 'Bottom',
        aggressivenessBonus: 0
      },
      inFrenzy: false
    });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    // Lure above fish (needs to be at least 20px above and within horizontal range)
    const lure = createMockLure({ x: 510, y: 370 }); // Changed from 100 to 370 to be closer

    ai.state = Constants.FISH_STATE.IDLE;

    // Try multiple times (increased from 50 to 100 due to 30% probability)
    let streaked = false;
    for (let i = 0; i < 100; i++) {
      fish.inFrenzy = false;
      ai.state = Constants.FISH_STATE.IDLE;
      ai.detectFrenzy(lure, [fish]);
      if (ai.state === Constants.FISH_STATE.CHASING) {
        streaked = true;
        break;
      }
    }

    expect(streaked).toBe(true);
  });

  test('Vertical strike enters frenzy state', () => {
    const fish = createMockFish({
      x: 500,
      y: 200,
      depthZone: {
        name: 'Mid-Column',
        aggressivenessBonus: 0.1
      },
      inFrenzy: false
    });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    const lure = createMockLure({ x: 510, y: 100 });

    ai.state = Constants.FISH_STATE.IDLE;

    // Force vertical strike
    for (let i = 0; i < 50; i++) {
      fish.inFrenzy = false;
      ai.state = Constants.FISH_STATE.IDLE;
      ai.detectFrenzy(lure, [fish]);
      if (ai.state === Constants.FISH_STATE.CHASING) break;
    }

    expect(fish.inFrenzy).toBe(true);
    expect(fish.frenzyIntensity).toBe(0.8);
  });

  test('Vertical strike sets target to lure position', () => {
    const fish = createMockFish({
      x: 500,
      y: 200,
      depthZone: {
        name: 'Mid-Column',
        aggressivenessBonus: 0.1
      },
      inFrenzy: false
    });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    const lure = createMockLure({ x: 510, y: 95 });

    ai.state = Constants.FISH_STATE.IDLE;

    // Force vertical strike
    for (let i = 0; i < 50; i++) {
      fish.inFrenzy = false;
      ai.state = Constants.FISH_STATE.IDLE;
      ai.targetX = null;
      ai.targetY = null;
      ai.detectFrenzy(lure, [fish]);
      if (ai.state === Constants.FISH_STATE.CHASING) break;
    }

    expect(ai.targetX).toBe(510);
    expect(ai.targetY).toBe(95);
  });

  test('Surface fish do not streak upward', () => {
    const fish = createMockFish({
      x: 500,
      y: 50, // Shallow
      depthZone: {
        name: 'Surface',
        aggressivenessBonus: 0.2
      },
      inFrenzy: false
    });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    const lure = createMockLure({ x: 510, y: 30 });

    ai.state = Constants.FISH_STATE.IDLE;

    // Try multiple times
    for (let i = 0; i < 20; i++) {
      fish.inFrenzy = false;
      ai.state = Constants.FISH_STATE.IDLE;
      ai.detectFrenzy(lure, [fish]);
    }

    // Should not trigger vertical strike
    expect(ai.state).toBe(Constants.FISH_STATE.IDLE);
  });
});

describe('FishAI - update() Method (Decision Cooldown)', () => {
  test('Does not make decisions during cooldown', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    const lure = createMockLure();

    ai.lastDecisionTime = 1000;
    ai.decisionCooldown = 500;
    const currentTime = 1200; // Only 200ms elapsed, cooldown is 500ms

    const initialState = ai.state;
    ai.update(lure, currentTime, [fish], []);

    expect(ai.state).toBe(initialState); // State unchanged
  });

  test('Makes decisions after cooldown expires', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    const lure = createMockLure();

    ai.lastDecisionTime = 1000;
    ai.decisionCooldown = 500;
    const currentTime = 1600; // 600ms elapsed, cooldown expired

    ai.update(lure, currentTime, [fish], []);

    expect(ai.lastDecisionTime).toBe(1600); // Decision was made
  });

  test('Updates lastDecisionTime when decision is made', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    const lure = createMockLure();

    ai.lastDecisionTime = 0;
    const currentTime = 1000;

    ai.update(lure, currentTime, [fish], []);

    expect(ai.lastDecisionTime).toBe(currentTime);
  });
});

describe('FishAI - update() Method (Nature Mode - No Lure)', () => {
  test('Fish idle when no lure and no baitfish', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    ai.update(null, 1000, [fish], []);

    expect(ai.state).toBe(Constants.FISH_STATE.IDLE);
  });

  test('Nature mode does not crash without lure', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    expect(() => {
      ai.update(null, 1000, [fish], []);
    }).not.toThrow();
  });
});

describe('FishAI - Edge Cases and Type Safety', () => {
  test('Handles undefined allFish array', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    const lure = createMockLure();

    expect(() => {
      ai.update(lure, 1000);
    }).not.toThrow();
  });

  test('Handles empty allFish array', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    const lure = createMockLure();

    expect(() => {
      ai.update(lure, 1000, [], []);
    }).not.toThrow();
  });

  test('Handles undefined baitfishClouds array', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    const lure = createMockLure();

    expect(() => {
      ai.update(lure, 1000, [fish]);
    }).not.toThrow();
  });

  test('Handles empty baitfishClouds array', () => {
    const fish = createMockFish();
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    const lure = createMockLure();

    expect(() => {
      ai.update(lure, 1000, [fish], []);
    }).not.toThrow();
  });

  test('Handles fish without depthZone property', () => {
    const fish = createMockFish();
    delete fish.depthZone;

    // FishAI doesn't validate depthZone in constructor
    // This test verifies it doesn't crash, but accessing aggressiveness will fail
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);
    expect(ai).toBeDefined();

    // Accessing aggressiveness getter should throw because it accesses fish.depthZone.aggressivenessBonus
    expect(() => {
      const _ = ai.aggressiveness;
    }).toThrow();
  });

  test('Handles fish with invalid species', () => {
    const fish = createMockFish({ species: 'invalid_species' });
    const ai = new FishAI(fish, GameConfig.FISHING_TYPE_ICE);

    // Should not crash, should just not have species-specific behaviors
    expect(ai.isAmbushPredator).toBe(false);
    expect(ai.circlesBeforeStrike).toBe(false);
  });
});
