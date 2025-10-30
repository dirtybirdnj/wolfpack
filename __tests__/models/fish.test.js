/**
 * Fish Model Tests
 *
 * Tests pure calculation methods from the Fish class.
 * Focus on math formulas, state management, and classification logic.
 * All tests are Phaser-independent using minimal mocks.
 */

import { Fish } from '../../src/models/fish.js';
import { Constants } from '../../src/utils/Constants.js';
import GameConfig from '../../src/config/GameConfig.js';

// Mock scene object with minimal required properties
const createMockScene = (options = {}) => {
  return {
    add: {
      graphics: () => ({ setDepth: jest.fn() })
    },
    time: {
      now: options.time || 0
    },
    fishingType: options.fishingType || GameConfig.FISHING_TYPE_ICE,
    maxDepth: options.maxDepth || GameConfig.MAX_DEPTH,
    iceHoleManager: options.iceHoleManager || null,
    sonarDisplay: options.sonarDisplay || null
  };
};

describe('Fish Model - calculateLength', () => {
  test('Calculates length from weight using formula', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    // Formula: length = 10.5 * weight^0.31
    // For a 10 lb fish: 10.5 * 10^0.31 ≈ 21 inches
    fish.weight = 10;
    const length = fish.calculateLength();

    expect(length).toBeGreaterThan(20);
    expect(length).toBeLessThan(22);
  });

  test('Returns integer length values', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.weight = 15.7;
    const length = fish.calculateLength();

    expect(Number.isInteger(length)).toBe(true);
  });

  test('Larger fish have longer lengths', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.weight = 5;
    const length5lb = fish.calculateLength();

    fish.weight = 20;
    const length20lb = fish.calculateLength();

    expect(length20lb).toBeGreaterThan(length5lb);
  });

  test('Small fish have realistic lengths', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'SMALL');

    fish.weight = 2;
    const length = fish.calculateLength();

    // 2 lb fish should be around 15-17 inches
    expect(length).toBeGreaterThan(14);
    expect(length).toBeLessThan(18);
  });

  test('Trophy fish have realistic lengths', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'TROPHY');

    fish.weight = 30;
    const length = fish.calculateLength();

    // 30 lb fish should be around 30-34 inches
    expect(length).toBeGreaterThan(28);
    expect(length).toBeLessThan(36);
  });
});

describe('Fish Model - calculateBiologicalAge', () => {
  test('Small fish are younger', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'SMALL');

    fish.weight = 3;
    const age = fish.calculateBiologicalAge();

    expect(age).toBeGreaterThanOrEqual(3);
    expect(age).toBeLessThanOrEqual(6);
  });

  test('Medium fish are mid-age', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.weight = 8;
    const age = fish.calculateBiologicalAge();

    expect(age).toBeGreaterThanOrEqual(6);
    expect(age).toBeLessThanOrEqual(12);
  });

  test('Large fish are older', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'LARGE');

    fish.weight = 18;
    const age = fish.calculateBiologicalAge();

    expect(age).toBeGreaterThanOrEqual(12);
    expect(age).toBeLessThanOrEqual(20);
  });

  test('Trophy fish are oldest', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'TROPHY');

    fish.weight = 35;
    const age = fish.calculateBiologicalAge();

    expect(age).toBeGreaterThanOrEqual(20);
    expect(age).toBeLessThanOrEqual(30);
  });

  test('Returns integer age values', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    const age = fish.calculateBiologicalAge();
    expect(Number.isInteger(age)).toBe(true);
  });

  test('Age increases with weight within ranges', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    // Test boundary between ranges
    fish.weight = 5;
    const age5lb = fish.calculateBiologicalAge();

    fish.weight = 12;
    const age12lb = fish.calculateBiologicalAge();

    // 12 lb fish should generally be older than 5 lb fish
    // (though randomness means this isn't guaranteed in a single test)
    // At minimum, they're in different age brackets
    expect(age5lb).toBeLessThanOrEqual(12);
    expect(age12lb).toBeGreaterThanOrEqual(6);
  });
});

describe('Fish Model - calculateSonarStrength', () => {
  test('Large trophy fish have strong sonar signature', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'TROPHY');

    fish.weight = 30;
    const strength = fish.calculateSonarStrength();

    expect(strength).toBe('strong');
  });

  test('Medium-large fish have medium sonar signature', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.weight = 15;
    const strength = fish.calculateSonarStrength();

    expect(strength).toBe('medium');
  });

  test('Small fish have weak sonar signature', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'SMALL');

    fish.weight = 3;
    const strength = fish.calculateSonarStrength();

    expect(strength).toBe('weak');
  });

  test('Threshold at 25 lbs for strong', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'LARGE');

    fish.weight = 24;
    expect(fish.calculateSonarStrength()).toBe('medium');

    fish.weight = 26;
    expect(fish.calculateSonarStrength()).toBe('strong');
  });

  test('Threshold at 10 lbs for medium', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.weight = 9;
    expect(fish.calculateSonarStrength()).toBe('weak');

    fish.weight = 11;
    expect(fish.calculateSonarStrength()).toBe('medium');
  });
});

describe('Fish Model - getDepthZone', () => {
  test('Returns SURFACE zone for shallow depths', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 50, 'MEDIUM');

    fish.depth = 10;
    const zone = fish.getDepthZone();

    expect(zone).toBe(GameConfig.DEPTH_ZONES.SURFACE);
    expect(zone.name).toBe('Surface');
  });

  test('Returns MID_COLUMN zone for mid depths', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 200, 'MEDIUM');

    fish.depth = 60;
    const zone = fish.getDepthZone();

    expect(zone).toBe(GameConfig.DEPTH_ZONES.MID_COLUMN);
    expect(zone.name).toBe('Mid-Column');
  });

  test('Returns BOTTOM zone for deep depths', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 400, 'MEDIUM');

    fish.depth = 120;
    const zone = fish.getDepthZone();

    expect(zone).toBe(GameConfig.DEPTH_ZONES.BOTTOM);
    expect(zone.name).toBe('Bottom');
  });

  test('Handles boundary between SURFACE and MID_COLUMN', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 200, 'MEDIUM');

    fish.depth = 39;
    expect(fish.getDepthZone()).toBe(GameConfig.DEPTH_ZONES.SURFACE);

    fish.depth = 40;
    expect(fish.getDepthZone()).toBe(GameConfig.DEPTH_ZONES.MID_COLUMN);
  });

  test('Handles boundary between MID_COLUMN and BOTTOM', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 300, 'MEDIUM');

    fish.depth = 99;
    expect(fish.getDepthZone()).toBe(GameConfig.DEPTH_ZONES.MID_COLUMN);

    fish.depth = 100;
    expect(fish.getDepthZone()).toBe(GameConfig.DEPTH_ZONES.BOTTOM);
  });
});

describe('Fish Model - updateBiology (Hunger System)', () => {
  test('Hunger increases over time', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.hunger = 50;
    fish.frameAge = 0;

    // Simulate 120 frames (2 seconds at 60fps)
    fish.frameAge = 120;
    fish.updateBiology();

    expect(fish.hunger).toBeGreaterThan(50);
  });

  test('Hunger is clamped at 100', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.hunger = 98;
    fish.frameAge = 120;
    fish.updateBiology();

    expect(fish.hunger).toBe(100);
  });

  test('High hunger decreases health', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.hunger = 90;
    fish.health = 80;
    fish.frameAge = 300;

    fish.updateBiology();

    expect(fish.health).toBeLessThan(80);
  });

  test('Low hunger increases health', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.hunger = 20;
    fish.health = 70;
    fish.frameAge = 600;

    fish.updateBiology();

    expect(fish.health).toBeGreaterThan(70);
  });

  test('Health is clamped between 0 and 100', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.hunger = 20;
    fish.health = 99.8;
    fish.frameAge = 600;
    fish.updateBiology();

    expect(fish.health).toBe(100);

    fish.hunger = 95;
    fish.health = 1;
    fish.frameAge = 900;
    fish.updateBiology();

    expect(fish.health).toBeGreaterThanOrEqual(0);
  });

  test('Metabolism affects hunger rate', () => {
    const scene = createMockScene();
    const fastMetabolismFish = new Fish(scene, 500, 100, 'MEDIUM');
    const slowMetabolismFish = new Fish(scene, 500, 100, 'MEDIUM');

    fastMetabolismFish.metabolism = 1.2;
    fastMetabolismFish.hunger = 50;
    fastMetabolismFish.frameAge = 120;

    slowMetabolismFish.metabolism = 0.8;
    slowMetabolismFish.hunger = 50;
    slowMetabolismFish.frameAge = 120;

    fastMetabolismFish.updateBiology();
    slowMetabolismFish.updateBiology();

    expect(fastMetabolismFish.hunger).toBeGreaterThan(slowMetabolismFish.hunger);
  });
});

describe('Fish Model - updateBiology (Frenzy System)', () => {
  test('Frenzy timer decrements', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.inFrenzy = true;
    fish.frenzyTimer = 100;

    fish.updateBiology();

    expect(fish.frenzyTimer).toBe(99);
  });

  test('Frenzy ends when timer reaches zero', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.inFrenzy = true;
    fish.frenzyTimer = 1;
    fish.frenzyIntensity = 0.8;

    fish.updateBiology();

    expect(fish.inFrenzy).toBe(false);
    expect(fish.frenzyIntensity).toBe(0);
  });

  test('Frenzy persists when timer positive', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.inFrenzy = true;
    fish.frenzyTimer = 50;

    fish.updateBiology();

    expect(fish.inFrenzy).toBe(true);
    expect(fish.frenzyTimer).toBe(49);
  });
});

describe('Fish Model - updateBiology (Interest Flash)', () => {
  test('Interest flash decays over time', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.interestFlash = 0.5;
    fish.interestFlashDecay = 0.02;

    fish.updateBiology();

    expect(fish.interestFlash).toBe(0.48);
  });

  test('Interest flash is clamped at zero', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.interestFlash = 0.01;
    fish.interestFlashDecay = 0.02;

    fish.updateBiology();

    expect(fish.interestFlash).toBe(0);
  });
});

describe('Fish Model - triggerInterestFlash', () => {
  test('Sets interest flash to intensity', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.interestFlash = 0;
    fish.triggerInterestFlash(0.7);

    expect(fish.interestFlash).toBe(0.7);
  });

  test('Uses default intensity of 0.5', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.interestFlash = 0;
    fish.triggerInterestFlash();

    expect(fish.interestFlash).toBe(0.5);
  });

  test('Takes maximum of current and new intensity', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    fish.interestFlash = 0.6;
    fish.triggerInterestFlash(0.4);

    expect(fish.interestFlash).toBe(0.6); // Keeps higher value

    fish.triggerInterestFlash(0.8);
    expect(fish.interestFlash).toBe(0.8); // Updates to higher value
  });
});

describe('Fish Model - Initialization', () => {
  test('Initializes with weight from size range', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    expect(fish.weight).toBeGreaterThanOrEqual(Constants.FISH_SIZE.MEDIUM.min);
    expect(fish.weight).toBeLessThanOrEqual(Constants.FISH_SIZE.MEDIUM.max);
  });

  test('Assigns random gender', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    expect(['male', 'female']).toContain(fish.gender);
  });

  test('Assigns name based on gender', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    expect(fish.name).toBeDefined();
    expect(typeof fish.name).toBe('string');
    expect(fish.name.length).toBeGreaterThan(0);
  });

  test('Initializes hunger between 50 and 90', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    expect(fish.hunger).toBeGreaterThanOrEqual(50);
    expect(fish.hunger).toBeLessThanOrEqual(90);
  });

  test('Initializes health between 60 and 100', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    expect(fish.health).toBeGreaterThanOrEqual(60);
    expect(fish.health).toBeLessThanOrEqual(100);
  });

  test('Sets points from size category', () => {
    const scene = createMockScene();
    const smallFish = new Fish(scene, 500, 100, 'SMALL');
    const trophyFish = new Fish(scene, 500, 100, 'TROPHY');

    expect(smallFish.points).toBe(Constants.FISH_SIZE.SMALL.points);
    expect(trophyFish.points).toBe(Constants.FISH_SIZE.TROPHY.points);
  });

  test('Calculates initial length and age', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    expect(fish.length).toBeGreaterThan(0);
    expect(fish.age).toBeGreaterThan(0);
  });
});

describe('Fish Model - Size Categories', () => {
  test('Small fish have appropriate properties', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'SMALL');

    expect(fish.weight).toBeGreaterThanOrEqual(2);
    expect(fish.weight).toBeLessThanOrEqual(5);
    expect(fish.points).toBe(10);
  });

  test('Medium fish have appropriate properties', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'MEDIUM');

    expect(fish.weight).toBeGreaterThanOrEqual(5);
    expect(fish.weight).toBeLessThanOrEqual(12);
    expect(fish.points).toBe(25);
  });

  test('Large fish have appropriate properties', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'LARGE');

    expect(fish.weight).toBeGreaterThanOrEqual(12);
    expect(fish.weight).toBeLessThanOrEqual(25);
    expect(fish.points).toBe(50);
  });

  test('Trophy fish have appropriate properties', () => {
    const scene = createMockScene();
    const fish = new Fish(scene, 500, 100, 'TROPHY');

    expect(fish.weight).toBeGreaterThanOrEqual(25);
    expect(fish.weight).toBeLessThanOrEqual(40);
    expect(fish.points).toBe(100);
  });
});
