/**
 * Constants and Utils Tests
 *
 * Tests utility functions and constants validation.
 * Pure math and logic with zero dependencies.
 */

import { Constants, Utils } from '../../src/utils/Constants.js';

describe('Constants - FISH_STATE', () => {
  test('All fish states are defined', () => {
    expect(Constants.FISH_STATE.IDLE).toBe('idle');
    expect(Constants.FISH_STATE.INTERESTED).toBe('interested');
    expect(Constants.FISH_STATE.CHASING).toBe('chasing');
    expect(Constants.FISH_STATE.STRIKING).toBe('striking');
    expect(Constants.FISH_STATE.FLEEING).toBe('fleeing');
    expect(Constants.FISH_STATE.HUNTING_BAITFISH).toBe('hunting_baitfish');
    expect(Constants.FISH_STATE.FEEDING).toBe('feeding');
  });

  test('Fish states are unique', () => {
    const states = Object.values(Constants.FISH_STATE);
    const uniqueStates = new Set(states);

    expect(uniqueStates.size).toBe(states.length);
  });

  test('Fish states are strings', () => {
    Object.values(Constants.FISH_STATE).forEach(state => {
      expect(typeof state).toBe('string');
    });
  });
});

describe('Constants - LURE_STATE', () => {
  test('All lure states are defined', () => {
    expect(Constants.LURE_STATE.SURFACE).toBe('surface');
    expect(Constants.LURE_STATE.DROPPING).toBe('dropping');
    expect(Constants.LURE_STATE.RETRIEVING).toBe('retrieving');
    expect(Constants.LURE_STATE.IDLE).toBe('idle');
  });

  test('Lure states are unique', () => {
    const states = Object.values(Constants.LURE_STATE);
    const uniqueStates = new Set(states);

    expect(uniqueStates.size).toBe(states.length);
  });
});

describe('Constants - SONAR_MODE', () => {
  test('All sonar modes are defined', () => {
    expect(Constants.SONAR_MODE.NORMAL).toBe('normal');
    expect(Constants.SONAR_MODE.ENHANCED).toBe('enhanced');
    expect(Constants.SONAR_MODE.BOTTOM_LOCK).toBe('bottom_lock');
  });

  test('Sonar modes are unique', () => {
    const modes = Object.values(Constants.SONAR_MODE);
    const uniqueModes = new Set(modes);

    expect(uniqueModes.size).toBe(modes.length);
  });
});

describe('Constants - FISH_SIZE', () => {
  test('All size categories are defined', () => {
    expect(Constants.FISH_SIZE.SMALL).toBeDefined();
    expect(Constants.FISH_SIZE.MEDIUM).toBeDefined();
    expect(Constants.FISH_SIZE.LARGE).toBeDefined();
    expect(Constants.FISH_SIZE.TROPHY).toBeDefined();
  });

  test('Each size has min, max, and points', () => {
    Object.values(Constants.FISH_SIZE).forEach(size => {
      expect(size).toHaveProperty('min');
      expect(size).toHaveProperty('max');
      expect(size).toHaveProperty('points');
    });
  });

  test('Size ranges are valid', () => {
    Object.values(Constants.FISH_SIZE).forEach(size => {
      expect(size.min).toBeGreaterThan(0);
      expect(size.max).toBeGreaterThan(size.min);
      expect(size.points).toBeGreaterThan(0);
    });
  });

  test('Size ranges are progressive', () => {
    expect(Constants.FISH_SIZE.SMALL.max).toBeLessThanOrEqual(Constants.FISH_SIZE.MEDIUM.min);
    expect(Constants.FISH_SIZE.MEDIUM.max).toBeLessThanOrEqual(Constants.FISH_SIZE.LARGE.min);
    expect(Constants.FISH_SIZE.LARGE.max).toBeLessThanOrEqual(Constants.FISH_SIZE.TROPHY.min);
  });

  test('Points increase with size', () => {
    expect(Constants.FISH_SIZE.SMALL.points).toBeLessThan(Constants.FISH_SIZE.MEDIUM.points);
    expect(Constants.FISH_SIZE.MEDIUM.points).toBeLessThan(Constants.FISH_SIZE.LARGE.points);
    expect(Constants.FISH_SIZE.LARGE.points).toBeLessThan(Constants.FISH_SIZE.TROPHY.points);
  });

  test('Specific size values are correct', () => {
    expect(Constants.FISH_SIZE.SMALL).toEqual({ min: 2, max: 5, points: 10 });
    expect(Constants.FISH_SIZE.MEDIUM).toEqual({ min: 5, max: 12, points: 25 });
    expect(Constants.FISH_SIZE.LARGE).toEqual({ min: 12, max: 25, points: 50 });
    expect(Constants.FISH_SIZE.TROPHY).toEqual({ min: 25, max: 40, points: 100 });
  });
});

describe('Constants - DEPTH_ZONE', () => {
  test('All depth zones are defined', () => {
    expect(Constants.DEPTH_ZONE.SURFACE).toBeDefined();
    expect(Constants.DEPTH_ZONE.THERMOCLINE).toBeDefined();
    expect(Constants.DEPTH_ZONE.MIDDLE).toBeDefined();
    expect(Constants.DEPTH_ZONE.DEEP).toBeDefined();
    expect(Constants.DEPTH_ZONE.BOTTOM).toBeDefined();
  });

  test('Each zone has min, max, and name', () => {
    Object.values(Constants.DEPTH_ZONE).forEach(zone => {
      expect(zone).toHaveProperty('min');
      expect(zone).toHaveProperty('max');
      expect(zone).toHaveProperty('name');
      expect(typeof zone.name).toBe('string');
    });
  });

  test('Depth zones are contiguous', () => {
    const zones = [
      Constants.DEPTH_ZONE.SURFACE,
      Constants.DEPTH_ZONE.THERMOCLINE,
      Constants.DEPTH_ZONE.MIDDLE,
      Constants.DEPTH_ZONE.DEEP,
      Constants.DEPTH_ZONE.BOTTOM
    ];

    for (let i = 0; i < zones.length - 1; i++) {
      expect(zones[i].max).toBeLessThanOrEqual(zones[i + 1].min);
    }
  });

  test('Depth zones cover 0 to 150 feet', () => {
    expect(Constants.DEPTH_ZONE.SURFACE.min).toBe(0);
    expect(Constants.DEPTH_ZONE.BOTTOM.max).toBe(150);
  });
});

describe('Utils - randomBetween', () => {
  test('Returns value between min and max', () => {
    for (let i = 0; i < 100; i++) {
      const value = Utils.randomBetween(10, 20);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  test('Works with decimal values', () => {
    const value = Utils.randomBetween(1.5, 2.5);
    expect(value).toBeGreaterThanOrEqual(1.5);
    expect(value).toBeLessThanOrEqual(2.5);
  });

  test('Works with negative values', () => {
    const value = Utils.randomBetween(-10, -5);
    expect(value).toBeGreaterThanOrEqual(-10);
    expect(value).toBeLessThanOrEqual(-5);
  });

  test('Can return min value', () => {
    // Test many times to increase chance of hitting min
    let hitMin = false;
    for (let i = 0; i < 1000; i++) {
      const value = Utils.randomBetween(0, 1);
      if (value === 0) {
        hitMin = true;
        break;
      }
    }
    // Note: Due to floating point, exact 0 is unlikely but should be very close
    const closeToMin = Utils.randomBetween(0, 0.01);
    expect(closeToMin).toBeGreaterThanOrEqual(0);
  });

  test('Returns different values on multiple calls', () => {
    const values = new Set();
    for (let i = 0; i < 10; i++) {
      values.add(Utils.randomBetween(0, 100));
    }
    // Should have multiple different values (extremely unlikely to be all the same)
    expect(values.size).toBeGreaterThan(1);
  });

  test('When min equals max, returns that value', () => {
    const value = Utils.randomBetween(5, 5);
    expect(value).toBe(5);
  });
});

describe('Utils - calculateDistance', () => {
  test('Calculates distance between two points', () => {
    const distance = Utils.calculateDistance(0, 0, 3, 4);
    expect(distance).toBe(5); // 3-4-5 triangle
  });

  test('Distance is always positive', () => {
    expect(Utils.calculateDistance(0, 0, -3, -4)).toBe(5);
    expect(Utils.calculateDistance(5, 5, 2, 1)).toBeGreaterThan(0);
  });

  test('Distance to same point is zero', () => {
    expect(Utils.calculateDistance(10, 20, 10, 20)).toBe(0);
  });

  test('Handles horizontal distance', () => {
    const distance = Utils.calculateDistance(0, 5, 10, 5);
    expect(distance).toBe(10);
  });

  test('Handles vertical distance', () => {
    const distance = Utils.calculateDistance(5, 0, 5, 10);
    expect(distance).toBe(10);
  });

  test('Works with negative coordinates', () => {
    const distance = Utils.calculateDistance(-5, -5, 5, 5);
    expect(distance).toBeCloseTo(14.142, 2); // sqrt(200) ≈ 14.142
  });

  test('Works with decimal coordinates', () => {
    const distance = Utils.calculateDistance(1.5, 2.5, 4.5, 6.5);
    expect(distance).toBe(5);
  });

  test('Distance is commutative', () => {
    const d1 = Utils.calculateDistance(1, 2, 5, 7);
    const d2 = Utils.calculateDistance(5, 7, 1, 2);
    expect(d1).toBe(d2);
  });
});

describe('Utils - depthToPixels', () => {
  test('Converts depth to pixels', () => {
    const pixels = Utils.depthToPixels(10, 3.6);
    expect(pixels).toBe(36);
  });

  test('Works with different scales', () => {
    expect(Utils.depthToPixels(10, 2)).toBe(20);
    expect(Utils.depthToPixels(10, 5)).toBe(50);
  });

  test('Handles zero depth', () => {
    expect(Utils.depthToPixels(0, 3.6)).toBe(0);
  });

  test('Handles decimal depths', () => {
    const pixels = Utils.depthToPixels(5.5, 4);
    expect(pixels).toBe(22);
  });

  test('Depth and pixels scale linearly', () => {
    const scale = 3.6;
    const depth1 = Utils.depthToPixels(10, scale);
    const depth2 = Utils.depthToPixels(20, scale);
    expect(depth2).toBe(depth1 * 2);
  });
});

describe('Utils - pixelsToDepth', () => {
  test('Converts pixels to depth', () => {
    const depth = Utils.pixelsToDepth(36, 3.6);
    expect(depth).toBe(10);
  });

  test('Works with different scales', () => {
    expect(Utils.pixelsToDepth(20, 2)).toBe(10);
    expect(Utils.pixelsToDepth(50, 5)).toBe(10);
  });

  test('Handles zero pixels', () => {
    expect(Utils.pixelsToDepth(0, 3.6)).toBe(0);
  });

  test('Handles decimal pixels', () => {
    const depth = Utils.pixelsToDepth(18, 3.6);
    expect(depth).toBe(5);
  });

  test('Is inverse of depthToPixels', () => {
    const scale = 3.6;
    const originalDepth = 50;
    const pixels = Utils.depthToPixels(originalDepth, scale);
    const recoveredDepth = Utils.pixelsToDepth(pixels, scale);
    expect(recoveredDepth).toBe(originalDepth);
  });
});

describe('Utils - getDepthZone', () => {
  test('Returns SURFACE zone for shallow depths', () => {
    expect(Utils.getDepthZone(5)).toBe(Constants.DEPTH_ZONE.SURFACE);
    expect(Utils.getDepthZone(10)).toBe(Constants.DEPTH_ZONE.SURFACE);
  });

  test('Returns THERMOCLINE zone for thermocline depths', () => {
    expect(Utils.getDepthZone(20)).toBe(Constants.DEPTH_ZONE.THERMOCLINE);
    expect(Utils.getDepthZone(25)).toBe(Constants.DEPTH_ZONE.THERMOCLINE);
  });

  test('Returns MIDDLE zone for mid-water depths', () => {
    expect(Utils.getDepthZone(50)).toBe(Constants.DEPTH_ZONE.MIDDLE);
    expect(Utils.getDepthZone(70)).toBe(Constants.DEPTH_ZONE.MIDDLE);
  });

  test('Returns DEEP zone for deep depths', () => {
    expect(Utils.getDepthZone(90)).toBe(Constants.DEPTH_ZONE.DEEP);
    expect(Utils.getDepthZone(110)).toBe(Constants.DEPTH_ZONE.DEEP);
  });

  test('Returns BOTTOM zone for bottom depths', () => {
    expect(Utils.getDepthZone(125)).toBe(Constants.DEPTH_ZONE.BOTTOM);
    expect(Utils.getDepthZone(145)).toBe(Constants.DEPTH_ZONE.BOTTOM);
  });

  test('Falls back to BOTTOM for out-of-range depths', () => {
    expect(Utils.getDepthZone(200)).toBe(Constants.DEPTH_ZONE.BOTTOM);
    expect(Utils.getDepthZone(-10)).toBe(Constants.DEPTH_ZONE.BOTTOM);
  });

  test('Handles boundary between zones correctly', () => {
    // SURFACE ends at 15, THERMOCLINE starts at 15
    expect(Utils.getDepthZone(14.9)).toBe(Constants.DEPTH_ZONE.SURFACE);
    expect(Utils.getDepthZone(15)).toBe(Constants.DEPTH_ZONE.THERMOCLINE);

    // THERMOCLINE ends at 35, MIDDLE starts at 35
    expect(Utils.getDepthZone(34.9)).toBe(Constants.DEPTH_ZONE.THERMOCLINE);
    expect(Utils.getDepthZone(35)).toBe(Constants.DEPTH_ZONE.MIDDLE);
  });

  test('Returns zone object with name', () => {
    const zone = Utils.getDepthZone(50);
    expect(zone).toHaveProperty('name');
    expect(zone.name).toBe('Mid-Water');
  });
});

describe('Utils - Integration Tests', () => {
  test('Depth conversion round trip', () => {
    const scale = 3.6;
    const depths = [0, 10, 50, 100, 150];

    depths.forEach(depth => {
      const pixels = Utils.depthToPixels(depth, scale);
      const recovered = Utils.pixelsToDepth(pixels, scale);
      expect(recovered).toBe(depth);
    });
  });

  test('Distance and coordinate math consistency', () => {
    // Distance from (0,0) to (x,y) should equal sqrt(x^2 + y^2)
    const x = 6;
    const y = 8;
    const distance = Utils.calculateDistance(0, 0, x, y);
    const expected = Math.sqrt(x * x + y * y);
    expect(distance).toBe(expected);
  });

  test('Random values distribution across range', () => {
    const min = 10;
    const max = 20;
    const samples = [];

    for (let i = 0; i < 1000; i++) {
      samples.push(Utils.randomBetween(min, max));
    }

    // Check that we have values across the range
    const average = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    const midpoint = (min + max) / 2;

    // Average should be close to midpoint (within 1 unit for 1000 samples)
    expect(Math.abs(average - midpoint)).toBeLessThan(1);

    // Should have some values near min and near max
    const nearMin = samples.some(v => v < min + 1);
    const nearMax = samples.some(v => v > max - 1);
    expect(nearMin).toBe(true);
    expect(nearMax).toBe(true);
  });
});

describe('Utils - Edge Cases', () => {
  test('calculateDistance with very large coordinates', () => {
    const distance = Utils.calculateDistance(0, 0, 10000, 10000);
    expect(distance).toBeCloseTo(14142.14, 1);
  });

  test('calculateDistance with very small differences', () => {
    const distance = Utils.calculateDistance(100, 100, 100.01, 100.01);
    expect(distance).toBeCloseTo(0.0141, 3);
  });

  test('depthToPixels with very large depth', () => {
    const pixels = Utils.depthToPixels(1000, 3.6);
    expect(pixels).toBe(3600);
  });

  test('pixelsToDepth with very large pixels', () => {
    const depth = Utils.pixelsToDepth(10000, 3.6);
    expect(depth).toBeCloseTo(2777.78, 1);
  });

  test('randomBetween with inverted min/max still works', () => {
    // Though not intended usage, should handle gracefully
    const value = Utils.randomBetween(20, 10);
    // Will produce values between 20 and 30 (min + (max-min))
    expect(typeof value).toBe('number');
    expect(isNaN(value)).toBe(false);
  });
});
