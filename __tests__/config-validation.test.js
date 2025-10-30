/**
 * Configuration Validation Tests
 *
 * Ensures GameConfig and other constants are properly defined.
 * Catches configuration errors early without running the game.
 */

import GameConfig from '../src/config/GameConfig.js';

describe('GameConfig Validation', () => {
  test('GameConfig exists and is an object', () => {
    expect(GameConfig).toBeDefined();
    expect(typeof GameConfig).toBe('object');
  });

  test('Canvas dimensions are defined', () => {
    expect(GameConfig.CANVAS_WIDTH).toBeDefined();
    expect(GameConfig.CANVAS_HEIGHT).toBeDefined();
    expect(GameConfig.CANVAS_WIDTH).toBeGreaterThan(0);
    expect(GameConfig.CANVAS_HEIGHT).toBeGreaterThan(0);
  });

  test('Depth settings are defined', () => {
    expect(GameConfig.MAX_DEPTH).toBeDefined();
    expect(GameConfig.DEPTH_SCALE).toBeDefined();
    expect(GameConfig.MAX_DEPTH).toBeGreaterThan(0);
  });

  test('Fish spawning constants are defined', () => {
    expect(GameConfig.FISH_SPAWN_CHANCE).toBeDefined();
    expect(GameConfig.BAITFISH_CLOUD_SPAWN_CHANCE).toBeDefined();
  });

  test('Fishing mechanics constants are defined', () => {
    expect(GameConfig.TENSION_PER_REEL).toBeDefined();
    expect(GameConfig.MAX_LINE_TENSION).toBeDefined();
    expect(GameConfig.TENSION_BREAK_THRESHOLD).toBeDefined();
    expect(GameConfig.FISH_PULL_BASE).toBeDefined();
  });

  test('Game modes are defined', () => {
    // Check that at least one game mode is defined
    const hasModes = GameConfig.GAME_MODE_UNLIMITED ||
                     GameConfig.GAME_MODE_ARCADE ||
                     GameConfig.GAME_MODE_NATURE_SIM;
    expect(hasModes).toBeTruthy();
  });

  test('Deleted summer mode constants are not present', () => {
    expect(GameConfig.FISHING_TYPE_KAYAK).toBeUndefined();
    expect(GameConfig.FISHING_TYPE_MOTORBOAT).toBeUndefined();
    expect(GameConfig.SUMMER_MODE).toBeUndefined();
  });

  test('Tension values are within valid ranges', () => {
    expect(GameConfig.TENSION_PER_REEL).toBeLessThanOrEqual(GameConfig.MAX_LINE_TENSION);
    expect(GameConfig.TENSION_BREAK_THRESHOLD).toBeLessThanOrEqual(GameConfig.MAX_LINE_TENSION);
  });

  test('Depth zones are properly configured', () => {
    // If DEPTH_ZONES exists, validate structure
    if (GameConfig.DEPTH_ZONES && typeof GameConfig.DEPTH_ZONES === 'object') {
      // Zones should have min/max values
      Object.values(GameConfig.DEPTH_ZONES).forEach(zone => {
        if (zone && typeof zone === 'object' && zone.min !== undefined) {
          expect(zone.min).toBeLessThan(zone.max);
        }
      });
    } else {
      // If no depth zones, that's okay too (not all games use them)
      expect(true).toBe(true);
    }
  });
});

describe('Constants Module Validation', () => {
  test('Fish states exist and are unique', async () => {
    const { Constants } = await import('../src/utils/Constants.js');

    expect(Constants.FISH_STATE).toBeDefined();
    expect(Constants.FISH_STATE.IDLE).toBeDefined();
    expect(Constants.FISH_STATE.INTERESTED).toBeDefined();
    expect(Constants.FISH_STATE.CHASING).toBeDefined();
    expect(Constants.FISH_STATE.FLEEING).toBeDefined();

    // Check all states are unique
    const states = Object.values(Constants.FISH_STATE);
    const uniqueStates = new Set(states);
    expect(uniqueStates.size).toBe(states.length);
  });

  test('Utils functions exist', async () => {
    const { Utils } = await import('../src/utils/Constants.js');

    expect(Utils.randomBetween).toBeDefined();
    expect(Utils.calculateDistance).toBeDefined();
    expect(typeof Utils.randomBetween).toBe('function');
    expect(typeof Utils.calculateDistance).toBe('function');
  });
});
