/**
 * GameConfig Tests
 *
 * Comprehensive tests for game configuration and constants.
 * Pure configuration validation with no Phaser dependencies.
 */

import GameConfig, { LAKE_CHAMPLAIN_FACTS } from '../../src/config/GameConfig.js';

describe('GameConfig - Fishing Types', () => {
  test('Fishing types are defined', () => {
    expect(GameConfig.FISHING_TYPE_ICE).toBe('ice');
    expect(GameConfig.FISHING_TYPE_NATURE_SIMULATION).toBe('nature_simulation');
  });

  test('Old summer fishing types are removed', () => {
    expect(GameConfig.FISHING_TYPE_KAYAK).toBeUndefined();
    expect(GameConfig.FISHING_TYPE_MOTORBOAT).toBeUndefined();
  });
});

describe('GameConfig - Game Modes', () => {
  test('Game modes are defined', () => {
    expect(GameConfig.GAME_MODE_ARCADE).toBe('arcade');
    expect(GameConfig.GAME_MODE_UNLIMITED).toBe('unlimited');
  });

  test('Arcade mode settings are defined', () => {
    expect(GameConfig.ARCADE_TIME_LIMIT).toBe(120);
    expect(GameConfig.ARCADE_EMERGENCY_SPAWN_TIME).toBe(30);
  });

  test('Arcade time settings are valid', () => {
    expect(GameConfig.ARCADE_TIME_LIMIT).toBeGreaterThan(0);
    expect(GameConfig.ARCADE_EMERGENCY_SPAWN_TIME).toBeGreaterThan(0);
    expect(GameConfig.ARCADE_EMERGENCY_SPAWN_TIME).toBeLessThan(GameConfig.ARCADE_TIME_LIMIT);
  });
});

describe('GameConfig - Canvas Settings', () => {
  test('Canvas dimensions are defined and valid', () => {
    expect(GameConfig.CANVAS_WIDTH).toBe(1400);
    expect(GameConfig.CANVAS_HEIGHT).toBe(650);
    expect(GameConfig.CANVAS_WIDTH).toBeGreaterThan(0);
    expect(GameConfig.CANVAS_HEIGHT).toBeGreaterThan(0);
  });

  test('Canvas has reasonable aspect ratio', () => {
    const aspectRatio = GameConfig.CANVAS_WIDTH / GameConfig.CANVAS_HEIGHT;
    expect(aspectRatio).toBeGreaterThan(1); // Wider than tall
    expect(aspectRatio).toBeLessThan(3); // Not excessively wide
  });
});

describe('GameConfig - Sonar Display Settings', () => {
  test('Sonar settings are defined', () => {
    expect(GameConfig.SONAR_SCROLL_SPEED).toBe(1.35);
    expect(GameConfig.GRID_SIZE).toBe(22);
    expect(GameConfig.MAX_DEPTH).toBe(150);
    expect(GameConfig.DEPTH_SCALE).toBe(3.6);
    expect(GameConfig.LAKE_BOTTOM_RESERVE_PX).toBe(96);
  });

  test('Sonar settings are valid', () => {
    expect(GameConfig.SONAR_SCROLL_SPEED).toBeGreaterThan(0);
    expect(GameConfig.GRID_SIZE).toBeGreaterThan(0);
    expect(GameConfig.MAX_DEPTH).toBeGreaterThan(0);
    expect(GameConfig.DEPTH_SCALE).toBeGreaterThan(0);
    expect(GameConfig.LAKE_BOTTOM_RESERVE_PX).toBeGreaterThan(0);
  });

  test('Max depth fits in canvas with reserve', () => {
    const maxDepthPixels = GameConfig.MAX_DEPTH * GameConfig.DEPTH_SCALE;
    const totalRequired = maxDepthPixels + GameConfig.LAKE_BOTTOM_RESERVE_PX;
    expect(totalRequired).toBeLessThanOrEqual(GameConfig.CANVAS_HEIGHT);
  });
});

describe('GameConfig - Lure Physics', () => {
  test('Lure physics constants are defined', () => {
    expect(GameConfig.LURE_GRAVITY).toBe(0.15);
    expect(GameConfig.LURE_MAX_FALL_SPEED).toBe(3.5);
    expect(GameConfig.LURE_MIN_RETRIEVE_SPEED).toBe(0.5);
    expect(GameConfig.LURE_MAX_RETRIEVE_SPEED).toBe(5.0);
    expect(GameConfig.LURE_SPEED_INCREMENT).toBe(0.5);
  });

  test('Lure physics constants are valid', () => {
    expect(GameConfig.LURE_GRAVITY).toBeGreaterThan(0);
    expect(GameConfig.LURE_MAX_FALL_SPEED).toBeGreaterThan(0);
    expect(GameConfig.LURE_MIN_RETRIEVE_SPEED).toBeGreaterThan(0);
    expect(GameConfig.LURE_MAX_RETRIEVE_SPEED).toBeGreaterThan(GameConfig.LURE_MIN_RETRIEVE_SPEED);
    expect(GameConfig.LURE_SPEED_INCREMENT).toBeGreaterThan(0);
  });

  test('Optimal lure speed is within retrieve range', () => {
    expect(GameConfig.OPTIMAL_LURE_SPEED).toBeGreaterThanOrEqual(GameConfig.LURE_MIN_RETRIEVE_SPEED);
    expect(GameConfig.OPTIMAL_LURE_SPEED).toBeLessThanOrEqual(GameConfig.LURE_MAX_RETRIEVE_SPEED);
  });
});

describe('GameConfig - Fish Spawning', () => {
  test('Fish spawning constants are defined', () => {
    expect(GameConfig.FISH_SPAWN_CHANCE).toBe(0.008);
    expect(GameConfig.MIN_FISH_DEPTH).toBe(20);
    expect(GameConfig.MAX_FISH_DEPTH).toBe(140);
    expect(GameConfig.FISH_SPEED_MIN).toBe(0.3);
    expect(GameConfig.FISH_SPEED_MAX).toBe(1.2);
  });

  test('Fish spawning constants are valid', () => {
    expect(GameConfig.FISH_SPAWN_CHANCE).toBeGreaterThan(0);
    expect(GameConfig.FISH_SPAWN_CHANCE).toBeLessThan(1);
    expect(GameConfig.MIN_FISH_DEPTH).toBeGreaterThan(0);
    expect(GameConfig.MAX_FISH_DEPTH).toBeGreaterThan(GameConfig.MIN_FISH_DEPTH);
    expect(GameConfig.MAX_FISH_DEPTH).toBeLessThanOrEqual(GameConfig.MAX_DEPTH);
    expect(GameConfig.FISH_SPEED_MAX).toBeGreaterThan(GameConfig.FISH_SPEED_MIN);
  });
});

describe('GameConfig - Fish AI', () => {
  test('Fish AI detection ranges are defined', () => {
    expect(GameConfig.DETECTION_RANGE).toBe(150);
    expect(GameConfig.VERTICAL_DETECTION_RANGE).toBe(280);
    expect(GameConfig.OPTIMAL_LURE_SPEED).toBe(2.0);
    expect(GameConfig.SPEED_TOLERANCE).toBe(2.0);
    expect(GameConfig.CHASE_SPEED_MULTIPLIER).toBe(1.8);
    expect(GameConfig.STRIKE_DISTANCE).toBe(25);
  });

  test('Fish AI constants are valid', () => {
    expect(GameConfig.DETECTION_RANGE).toBeGreaterThan(0);
    expect(GameConfig.VERTICAL_DETECTION_RANGE).toBeGreaterThan(0);
    expect(GameConfig.CHASE_SPEED_MULTIPLIER).toBeGreaterThan(1);
    expect(GameConfig.STRIKE_DISTANCE).toBeGreaterThan(0);
    expect(GameConfig.STRIKE_DISTANCE).toBeLessThan(GameConfig.DETECTION_RANGE);
  });

  test('Vertical detection range is larger than horizontal', () => {
    expect(GameConfig.VERTICAL_DETECTION_RANGE).toBeGreaterThan(GameConfig.DETECTION_RANGE);
  });
});

describe('GameConfig - Fish Fight Mechanics', () => {
  test('Fight mechanics constants are defined', () => {
    expect(GameConfig.MAX_LINE_TENSION).toBe(100);
    expect(GameConfig.TENSION_BREAK_THRESHOLD).toBe(95);
    expect(GameConfig.TENSION_DECAY_RATE).toBe(2.0);
    expect(GameConfig.TENSION_PER_REEL).toBe(15);
    expect(GameConfig.MIN_REEL_INTERVAL).toBe(100);
    expect(GameConfig.FISH_PULL_BASE).toBe(5);
    expect(GameConfig.FISH_TIRE_RATE).toBe(0.5);
    expect(GameConfig.REEL_DISTANCE_PER_TAP).toBe(2);
  });

  test('Fight mechanics constants are valid', () => {
    expect(GameConfig.MAX_LINE_TENSION).toBeGreaterThan(0);
    expect(GameConfig.TENSION_BREAK_THRESHOLD).toBeLessThanOrEqual(GameConfig.MAX_LINE_TENSION);
    expect(GameConfig.TENSION_BREAK_THRESHOLD).toBeGreaterThan(GameConfig.MAX_LINE_TENSION * 0.8);
    expect(GameConfig.TENSION_DECAY_RATE).toBeGreaterThan(0);
    expect(GameConfig.TENSION_PER_REEL).toBeGreaterThan(0);
    expect(GameConfig.FISH_TIRE_RATE).toBeGreaterThan(0);
  });

  test('Reel interval is reasonable', () => {
    expect(GameConfig.MIN_REEL_INTERVAL).toBeGreaterThan(0);
    expect(GameConfig.MIN_REEL_INTERVAL).toBeLessThan(1000); // Under 1 second
  });
});

describe('GameConfig - Colors', () => {
  test('Color constants are defined', () => {
    expect(GameConfig.COLOR_BACKGROUND).toBeDefined();
    expect(GameConfig.COLOR_BACKGROUND_SURFACE).toBeDefined();
    expect(GameConfig.COLOR_GRID).toBeDefined();
    expect(GameConfig.COLOR_TEXT).toBeDefined();
    expect(GameConfig.COLOR_LURE).toBeDefined();
  });

  test('Fish colors are defined', () => {
    expect(GameConfig.COLOR_FISH_BODY).toBeDefined();
    expect(GameConfig.COLOR_FISH_BELLY).toBeDefined();
    expect(GameConfig.COLOR_FISH_FINS).toBeDefined();
    expect(GameConfig.COLOR_FISH_SPOTS).toBeDefined();
  });

  test('Color values are valid hex numbers', () => {
    const colors = [
      GameConfig.COLOR_BACKGROUND,
      GameConfig.COLOR_TEXT,
      GameConfig.COLOR_LURE,
      GameConfig.COLOR_FISH_BODY
    ];

    colors.forEach(color => {
      expect(typeof color).toBe('number');
      expect(color).toBeGreaterThanOrEqual(0x000000);
      expect(color).toBeLessThanOrEqual(0xFFFFFF);
    });
  });
});

describe('GameConfig - Water Temperature', () => {
  test('Water temperature range is defined', () => {
    expect(GameConfig.WATER_TEMP_MIN).toBe(38);
    expect(GameConfig.WATER_TEMP_MAX).toBe(45);
  });

  test('Water temperature range is valid', () => {
    expect(GameConfig.WATER_TEMP_MIN).toBeGreaterThan(32); // Above freezing
    expect(GameConfig.WATER_TEMP_MAX).toBeGreaterThan(GameConfig.WATER_TEMP_MIN);
    expect(GameConfig.WATER_TEMP_MAX).toBeLessThan(50); // Cold water
  });
});

describe('GameConfig - Lake Trout Preferences', () => {
  test('Lake trout depth preferences are defined', () => {
    expect(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MIN).toBe(40);
    expect(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MAX).toBe(100);
  });

  test('Lake trout depth preferences are valid', () => {
    expect(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MIN).toBeGreaterThan(0);
    expect(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MAX).toBeGreaterThan(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MIN);
    expect(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MAX).toBeLessThanOrEqual(GameConfig.MAX_DEPTH);
  });

  test('Preferred depth overlaps with spawning depth', () => {
    expect(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MIN).toBeGreaterThanOrEqual(GameConfig.MIN_FISH_DEPTH);
    expect(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MAX).toBeLessThanOrEqual(GameConfig.MAX_FISH_DEPTH);
  });
});

describe('GameConfig - UI Settings', () => {
  test('UI settings are defined', () => {
    expect(GameConfig.UI_FONT_SIZE).toBe(14);
    expect(GameConfig.UI_PADDING).toBe(10);
  });

  test('UI settings are valid', () => {
    expect(GameConfig.UI_FONT_SIZE).toBeGreaterThan(0);
    expect(GameConfig.UI_PADDING).toBeGreaterThan(0);
  });
});

describe('GameConfig - Baitfish Settings', () => {
  test('Baitfish spawn settings are defined', () => {
    expect(GameConfig.BAITFISH_CLOUD_SPAWN_CHANCE).toBe(0.004);
    expect(GameConfig.BAITFISH_CLOUD_MIN_COUNT).toBe(5);
    expect(GameConfig.BAITFISH_CLOUD_MAX_COUNT).toBe(50);
    expect(GameConfig.BAITFISH_CLOUD_RADIUS).toBe(100);
  });

  test('Baitfish spawn settings are valid', () => {
    expect(GameConfig.BAITFISH_CLOUD_SPAWN_CHANCE).toBeGreaterThan(0);
    expect(GameConfig.BAITFISH_CLOUD_SPAWN_CHANCE).toBeLessThan(1);
    expect(GameConfig.BAITFISH_CLOUD_MAX_COUNT).toBeGreaterThan(GameConfig.BAITFISH_CLOUD_MIN_COUNT);
    expect(GameConfig.BAITFISH_CLOUD_RADIUS).toBeGreaterThan(0);
  });

  test('Baitfish colors are defined', () => {
    expect(GameConfig.COLOR_BAITFISH).toBeDefined();
    expect(GameConfig.COLOR_BAITFISH_PANIC).toBeDefined();
    expect(typeof GameConfig.COLOR_BAITFISH).toBe('number');
    expect(typeof GameConfig.COLOR_BAITFISH_PANIC).toBe('number');
  });

  test('Baitfish pursuit mechanics are defined', () => {
    expect(GameConfig.BAITFISH_DETECTION_RANGE).toBe(140);
    expect(GameConfig.BAITFISH_PURSUIT_SPEED).toBe(2.8);
    expect(GameConfig.BAITFISH_VERTICAL_PURSUIT_RANGE).toBe(250);
    expect(GameConfig.HUNGER_VERTICAL_SCALING).toBe(0.015);
    expect(GameConfig.BAITFISH_CONSUMPTION_HUNGER_REDUCTION).toBe(15);
  });

  test('Baitfish pursuit mechanics are valid', () => {
    expect(GameConfig.BAITFISH_DETECTION_RANGE).toBeGreaterThan(0);
    expect(GameConfig.BAITFISH_PURSUIT_SPEED).toBeGreaterThan(0);
    expect(GameConfig.BAITFISH_CONSUMPTION_HUNGER_REDUCTION).toBeGreaterThan(0);
    expect(GameConfig.BAITFISH_CONSUMPTION_HUNGER_REDUCTION).toBeLessThanOrEqual(100);
  });
});

describe('GameConfig - Depth Zones', () => {
  test('All depth zones are defined', () => {
    expect(GameConfig.DEPTH_ZONES).toBeDefined();
    expect(GameConfig.DEPTH_ZONES.SURFACE).toBeDefined();
    expect(GameConfig.DEPTH_ZONES.MID_COLUMN).toBeDefined();
    expect(GameConfig.DEPTH_ZONES.BOTTOM).toBeDefined();
  });

  test('Each depth zone has required properties', () => {
    const requiredProps = ['min', 'max', 'name', 'speedMultiplier', 'aggressivenessBonus', 'interestThreshold', 'description'];

    Object.values(GameConfig.DEPTH_ZONES).forEach(zone => {
      requiredProps.forEach(prop => {
        expect(zone).toHaveProperty(prop);
      });
    });
  });

  test('Depth zone ranges are valid', () => {
    Object.values(GameConfig.DEPTH_ZONES).forEach(zone => {
      expect(zone.min).toBeGreaterThanOrEqual(0);
      expect(zone.max).toBeGreaterThan(zone.min);
      expect(zone.max).toBeLessThanOrEqual(GameConfig.MAX_DEPTH);
    });
  });

  test('Depth zones cover complete depth range', () => {
    expect(GameConfig.DEPTH_ZONES.SURFACE.min).toBe(0);
    expect(GameConfig.DEPTH_ZONES.BOTTOM.max).toBe(GameConfig.MAX_DEPTH);
  });

  test('Depth zones are contiguous', () => {
    expect(GameConfig.DEPTH_ZONES.SURFACE.max).toBe(GameConfig.DEPTH_ZONES.MID_COLUMN.min);
    expect(GameConfig.DEPTH_ZONES.MID_COLUMN.max).toBe(GameConfig.DEPTH_ZONES.BOTTOM.min);
  });

  test('Surface zone properties', () => {
    const zone = GameConfig.DEPTH_ZONES.SURFACE;
    expect(zone.min).toBe(0);
    expect(zone.max).toBe(40);
    expect(zone.name).toBe('Surface');
    expect(zone.speedMultiplier).toBe(1.3);
    expect(zone.aggressivenessBonus).toBe(0.35);
    expect(zone.interestThreshold).toBe(22);
  });

  test('Mid-column zone properties', () => {
    const zone = GameConfig.DEPTH_ZONES.MID_COLUMN;
    expect(zone.min).toBe(40);
    expect(zone.max).toBe(100);
    expect(zone.name).toBe('Mid-Column');
    expect(zone.speedMultiplier).toBe(1.0);
    expect(zone.aggressivenessBonus).toBe(0.1);
    expect(zone.interestThreshold).toBe(28);
  });

  test('Bottom zone properties', () => {
    const zone = GameConfig.DEPTH_ZONES.BOTTOM;
    expect(zone.min).toBe(100);
    expect(zone.max).toBe(150);
    expect(zone.name).toBe('Bottom');
    expect(zone.speedMultiplier).toBe(0.6);
    expect(zone.aggressivenessBonus).toBe(-0.1);
    expect(zone.interestThreshold).toBe(35);
  });

  test('Speed multipliers are reasonable', () => {
    Object.values(GameConfig.DEPTH_ZONES).forEach(zone => {
      expect(zone.speedMultiplier).toBeGreaterThan(0);
      expect(zone.speedMultiplier).toBeLessThan(2);
    });
  });

  test('Interest thresholds are reasonable', () => {
    Object.values(GameConfig.DEPTH_ZONES).forEach(zone => {
      expect(zone.interestThreshold).toBeGreaterThan(0);
      expect(zone.interestThreshold).toBeLessThan(100);
    });
  });

  test('Surface zone is most aggressive', () => {
    const surface = GameConfig.DEPTH_ZONES.SURFACE;
    const midColumn = GameConfig.DEPTH_ZONES.MID_COLUMN;
    const bottom = GameConfig.DEPTH_ZONES.BOTTOM;

    expect(surface.aggressivenessBonus).toBeGreaterThan(midColumn.aggressivenessBonus);
    expect(surface.aggressivenessBonus).toBeGreaterThan(bottom.aggressivenessBonus);
  });
});

describe('Lake Champlain Facts', () => {
  test('Lake Champlain facts array exists', () => {
    expect(LAKE_CHAMPLAIN_FACTS).toBeDefined();
    expect(Array.isArray(LAKE_CHAMPLAIN_FACTS)).toBe(true);
  });

  test('Lake Champlain facts array is not empty', () => {
    expect(LAKE_CHAMPLAIN_FACTS.length).toBeGreaterThan(0);
  });

  test('All facts are non-empty strings', () => {
    LAKE_CHAMPLAIN_FACTS.forEach(fact => {
      expect(typeof fact).toBe('string');
      expect(fact.length).toBeGreaterThan(0);
    });
  });

  test('Lake Champlain facts contain expected information', () => {
    const factsString = LAKE_CHAMPLAIN_FACTS.join(' ');
    expect(factsString).toMatch(/lake trout/i);
    expect(factsString).toMatch(/120 miles/i);
    expect(factsString).toMatch(/Vermont/i);
  });
});

describe('GameConfig - Integration Validation', () => {
  test('Fish can spawn within preferred lake trout depths', () => {
    const canSpawnInPreferredDepth =
      GameConfig.MIN_FISH_DEPTH <= GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MAX &&
      GameConfig.MAX_FISH_DEPTH >= GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MIN;

    expect(canSpawnInPreferredDepth).toBe(true);
  });

  test('Baitfish detection range is balanced with lure detection', () => {
    expect(GameConfig.BAITFISH_DETECTION_RANGE).toBeLessThanOrEqual(GameConfig.DETECTION_RANGE);
  });

  test('Tension mechanics are balanced', () => {
    // Fish should be able to create tension faster than it decays
    expect(GameConfig.FISH_PULL_BASE).toBeGreaterThan(GameConfig.TENSION_DECAY_RATE);

    // But not so fast that breaking is instant
    const turnsToBreak = GameConfig.TENSION_BREAK_THRESHOLD / GameConfig.FISH_PULL_BASE;
    expect(turnsToBreak).toBeGreaterThan(5);
  });

  test('Reel mechanics allow for recovery', () => {
    // Reeling should reduce tension more than fish adds
    expect(GameConfig.TENSION_PER_REEL).toBeGreaterThan(GameConfig.FISH_PULL_BASE);
  });

  test('Chase speed is faster than optimal lure speed', () => {
    const chaseSpeed = GameConfig.OPTIMAL_LURE_SPEED * GameConfig.CHASE_SPEED_MULTIPLIER;
    expect(chaseSpeed).toBeGreaterThan(GameConfig.OPTIMAL_LURE_SPEED);
  });
});
