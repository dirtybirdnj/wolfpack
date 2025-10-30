/**
 * Shared Test Utilities
 *
 * Common mock factories and helpers used across multiple test files.
 * Reduces duplication and ensures consistent test setup.
 */

import { jest } from '@jest/globals';
import GameConfig from '../../src/config/GameConfig.js';

/**
 * Create a minimal mock scene for testing
 * Includes all commonly accessed scene properties
 */
export const createMockScene = (options = {}) => {
  return {
    add: {
      graphics: jest.fn(() => ({ setDepth: jest.fn() }))
    },
    time: {
      now: options.time || 0
    },
    fishingType: options.fishingType || GameConfig.FISHING_TYPE_ICE,
    maxDepth: options.maxDepth || GameConfig.MAX_DEPTH,
    iceHoleManager: options.iceHoleManager || null,
    sonarDisplay: options.sonarDisplay || null,
    cameras: options.cameras || {
      main: {
        scrollX: 0,
        scrollY: 0,
        width: GameConfig.CANVAS_WIDTH,
        height: GameConfig.CANVAS_HEIGHT
      }
    }
  };
};

/**
 * Create mock scene with ice hole manager for ice fishing mode
 */
export const createMockSceneWithIceHole = (holeX = 1000, holeDepth = 50) => {
  return {
    ...createMockScene(),
    iceHoleManager: {
      getCurrentHole: jest.fn(() => ({ x: holeX, depth: holeDepth })),
      getDepthAtPosition: jest.fn((x) => holeDepth),
      currentHole: { x: holeX, depth: holeDepth }
    }
  };
};

/**
 * Create mock scene for nature mode (no ice hole)
 */
export const createMockSceneNatureMode = () => {
  return {
    ...createMockScene(),
    fishingType: GameConfig.FISHING_TYPE_NATURE,
    iceHoleManager: null
  };
};

/**
 * Create mock lure for AI testing
 */
export const createMockLure = (options = {}) => {
  return {
    x: options.x || 500,
    y: options.y || 100,
    worldX: options.worldX || 500,
    depth: options.depth || (options.y || 100) / GameConfig.DEPTH_SCALE,
    velocity: options.velocity || 0,
    state: options.state || 'idle',
    visible: options.visible !== undefined ? options.visible : true
  };
};

/**
 * Create mock fish for testing
 */
export const createMockFish = (options = {}) => {
  return {
    x: options.x || 500,
    y: options.y || 100,
    worldX: options.worldX || 500,
    depth: options.depth || (options.y || 100) / GameConfig.DEPTH_SCALE,
    weight: options.weight || 10,
    species: options.species || 'lake_trout',
    hunger: options.hunger !== undefined ? options.hunger : 50,
    health: options.health !== undefined ? options.health : 80,
    depthZone: options.depthZone || {
      name: 'Mid-Column',
      min: 40,
      max: 100,
      aggressivenessBonus: 0.1
    },
    inFrenzy: options.inFrenzy || false,
    frenzyTimer: options.frenzyTimer || 0,
    frenzyIntensity: options.frenzyIntensity || 0,
    triggerInterestFlash: jest.fn(),
    ai: options.ai || null
  };
};

/**
 * Create mock baitfish cloud for testing
 */
export const createMockBaitfishCloud = (options = {}) => {
  return {
    x: options.x || 600,
    y: options.y || 150,
    worldX: options.worldX || 600,
    baitfish: options.baitfish || [],
    active: options.active !== undefined ? options.active : true,
    individualFish: options.individualFish || []
  };
};

/**
 * Create array of mock fish for frenzy testing
 */
export const createMockFishArray = (count, state, baseX = 500, baseY = 100) => {
  return Array.from({ length: count }, (_, i) => {
    return createMockFish({
      x: baseX + (i * 30),
      y: baseY + (i * 10),
      ai: {
        state: state
      }
    });
  });
};

/**
 * Mock Math.random for deterministic tests
 * Returns a function that cycles through provided values
 */
export const mockRandom = (values) => {
  let index = 0;
  return jest.fn(() => {
    const value = values[index % values.length];
    index++;
    return value;
  });
};

/**
 * Restore Math.random to original implementation
 */
export const restoreRandom = (originalRandom) => {
  global.Math.random = originalRandom;
};

/**
 * Create deterministic test values for randomness
 */
export const deterministicValues = {
  low: [0.1, 0.15, 0.2, 0.12],
  medium: [0.5, 0.55, 0.45, 0.52],
  high: [0.8, 0.85, 0.9, 0.82]
};
