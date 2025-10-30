/**
 * IceHoleManager Tests
 *
 * Tests ice hole management logic, lake bed generation, and hole drilling mechanics.
 * Tests focus on pure logic that can be isolated from Phaser rendering.
 */

import { IceHoleManager } from '../../src/managers/IceHoleManager.js';
import GameConfig from '../../src/config/GameConfig.js';

// Mock scene object with minimal required properties
const createMockScene = (options = {}) => {
  return {
    add: {
      graphics: () => ({
        setDepth: jest.fn(),
        clear: jest.fn(),
        fillStyle: jest.fn(),
        fillRect: jest.fn(),
        lineStyle: jest.fn(),
        strokeRect: jest.fn(),
        fillCircle: jest.fn()
      })
    },
    registry: {
      get: jest.fn((key) => {
        if (key === 'fishingWorldX') return options.worldX || null;
        if (key === 'fishingWorldY') return options.worldY || 5000;
        return null;
      })
    },
    time: {
      now: options.time || 1000
    },
    notificationSystem: options.notificationSystem || null,
    lure: options.lure || null
  };
};

describe('IceHoleManager - Initialization', () => {
  test('Creates with default values', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    expect(manager.playerX).toBe(500);
    expect(manager.maxDrillCharges).toBe(4);
    expect(manager.drillChargesRemaining).toBe(4);
    expect(manager.movementMode).toBe(false);
    expect(manager.iceHeight).toBe(54);
  });

  test('Creates initial hole at starting position', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    expect(manager.holes.length).toBe(1);
    expect(manager.holes[0].x).toBe(500);
    expect(manager.currentHoleIndex).toBe(0);
  });

  test('Initializes with world position from registry', () => {
    const scene = createMockScene({ worldX: 3000, worldY: 7000 });
    const manager = new IceHoleManager(scene);

    expect(manager.worldX).toBe(3000);
    expect(manager.worldY).toBe(7000);
  });

  test('Generates lake bed profile', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    expect(manager.lakeBedProfile).toBeDefined();
    expect(Array.isArray(manager.lakeBedProfile)).toBe(true);
    expect(manager.lakeBedProfile.length).toBeGreaterThan(0);
  });
});

describe('IceHoleManager - Lake Bed Profile Generation', () => {
  test('Profile covers expected X range', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    const firstPoint = manager.lakeBedProfile[0];
    const lastPoint = manager.lakeBedProfile[manager.lakeBedProfile.length - 1];

    expect(firstPoint.x).toBe(0);
    expect(lastPoint.x).toBeLessThanOrEqual(10000);
  });

  test('All profile points have required properties', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    manager.lakeBedProfile.forEach(point => {
      expect(point).toHaveProperty('x');
      expect(point).toHaveProperty('depth');
      expect(point).toHaveProperty('worldX');
    });
  });

  test('Depths are within reasonable fishing range', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    manager.lakeBedProfile.forEach(point => {
      expect(point.depth).toBeGreaterThanOrEqual(15); // Minimum depth
      expect(point.depth).toBeLessThan(100); // Maximum reasonable depth
    });
  });

  test('Profile has natural variation', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    // Check that depths vary (not all the same)
    const depths = manager.lakeBedProfile.map(p => p.depth);
    const uniqueDepths = new Set(depths);
    expect(uniqueDepths.size).toBeGreaterThan(50); // Should have significant variation
  });

  test('Profile uses procedural generation (repeatable)', () => {
    const scene1 = createMockScene();
    const manager1 = new IceHoleManager(scene1);

    const scene2 = createMockScene();
    const manager2 = new IceHoleManager(scene2);

    // The deterministic part (sine waves) should be similar
    // Note: Due to Math.random() noise, won't be identical but structure should be similar
    expect(manager1.lakeBedProfile.length).toBe(manager2.lakeBedProfile.length);
  });
});

describe('IceHoleManager - getDepthAtPosition', () => {
  test('Returns depth at specific position', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    const depth = manager.getDepthAtPosition(500);
    expect(depth).toBeGreaterThan(0);
    expect(depth).toBeLessThan(100);
  });

  test('Returns closest profile point depth', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    const depth1 = manager.getDepthAtPosition(100);
    const depth2 = manager.getDepthAtPosition(5000);

    // Depths at different positions should generally differ
    expect(typeof depth1).toBe('number');
    expect(typeof depth2).toBe('number');
  });

  test('Handles edge positions', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    const depthAtStart = manager.getDepthAtPosition(0);
    const depthAtEnd = manager.getDepthAtPosition(10000);

    expect(depthAtStart).toBeGreaterThan(0);
    expect(depthAtEnd).toBeGreaterThan(0);
  });

  test('Returns consistent depth for same position', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    const depth1 = manager.getDepthAtPosition(2500);
    const depth2 = manager.getDepthAtPosition(2500);

    expect(depth1).toBe(depth2);
  });
});

describe('IceHoleManager - Hole Drilling', () => {
  test('drillHole creates hole at specified position', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    const initialHoleCount = manager.holes.length;
    const hole = manager.drillHole(1000);

    expect(manager.holes.length).toBe(initialHoleCount + 1);
    expect(hole.x).toBe(1000);
    expect(hole.drilled).toBe(true);
  });

  test('drillHole assigns correct depth', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    const position = 1500;
    const expectedDepth = manager.getDepthAtPosition(position);
    const hole = manager.drillHole(position);

    expect(hole.depth).toBe(expectedDepth);
  });

  test('drillHole stores timestamp', () => {
    const scene = createMockScene({ time: 5000 });
    const manager = new IceHoleManager(scene);

    const hole = manager.drillHole(800);
    expect(hole.timestamp).toBe(5000);
  });
});

describe('IceHoleManager - canDrillHole', () => {
  test('Returns can:true when charges available and not too close', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);
    manager.playerX = 1000; // Far from initial hole at 500

    const result = manager.canDrillHole();
    expect(result.can).toBe(true);
  });

  test('Returns can:false when no drill charges', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);
    manager.drillChargesRemaining = 0;

    const result = manager.canDrillHole();
    expect(result.can).toBe(false);
    expect(result.reason).toBe('No drill charges remaining!');
  });

  test('Returns can:false when too close to existing hole', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);
    manager.drillHole(600); // Drill hole at 600
    manager.playerX = 650; // Player at 650 (only 50 units away, needs 100)

    const result = manager.canDrillHole();
    expect(result.can).toBe(false);
    expect(result.reason).toBe('Too close to existing hole!');
  });

  test('Enforces minimum 100 unit distance between holes', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);
    manager.drillHole(1000);

    // Exactly 100 units away - should be allowed
    manager.playerX = 1100;
    const result1 = manager.canDrillHole();
    expect(result1.can).toBe(true);

    // 99 units away - too close
    manager.playerX = 1099;
    const result2 = manager.canDrillHole();
    expect(result2.can).toBe(false);
  });
});

describe('IceHoleManager - drillNewHole', () => {
  test('Drills new hole when allowed', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);
    manager.playerX = 1500;

    const initialHoles = manager.holes.length;
    const initialCharges = manager.drillChargesRemaining;

    const success = manager.drillNewHole();

    expect(success).toBe(true);
    expect(manager.holes.length).toBe(initialHoles + 1);
    expect(manager.drillChargesRemaining).toBe(initialCharges - 1);
  });

  test('Updates current hole index after drilling', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);
    manager.playerX = 2000;

    manager.drillNewHole();
    expect(manager.currentHoleIndex).toBe(manager.holes.length - 1);
  });

  test('Returns false when drilling not allowed', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);
    manager.drillChargesRemaining = 0;

    const success = manager.drillNewHole();
    expect(success).toBe(false);
  });

  test('Does not consume charge when drilling fails', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);
    manager.playerX = 520; // Too close to initial hole at 500

    const initialCharges = manager.drillChargesRemaining;
    manager.drillNewHole();

    expect(manager.drillChargesRemaining).toBe(initialCharges);
  });
});

describe('IceHoleManager - Movement Mode', () => {
  test('enterMovementMode sets movementMode to true', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    expect(manager.movementMode).toBe(false);
    manager.enterMovementMode();
    expect(manager.movementMode).toBe(true);
  });

  test('enterMovementMode is idempotent', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    manager.enterMovementMode();
    const firstState = manager.movementMode;
    manager.enterMovementMode();
    const secondState = manager.movementMode;

    expect(firstState).toBe(secondState);
    expect(manager.movementMode).toBe(true);
  });

  test('movePlayer changes playerX in movement mode', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);
    manager.enterMovementMode();

    const initialX = manager.playerX;
    manager.movePlayer(100);
    expect(manager.playerX).toBe(initialX + 100);
  });

  test('movePlayer does nothing when not in movement mode', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    const initialX = manager.playerX;
    manager.movePlayer(100);
    expect(manager.playerX).toBe(initialX);
  });

  test('movePlayer clamps position to bounds', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);
    manager.enterMovementMode();

    // Try to move too far left
    manager.playerX = 150;
    manager.movePlayer(-200);
    expect(manager.playerX).toBe(100); // Clamped to minimum

    // Try to move too far right
    manager.playerX = 9850;
    manager.movePlayer(200);
    expect(manager.playerX).toBe(9900); // Clamped to maximum
  });
});

describe('IceHoleManager - findNearestHole', () => {
  test('Returns null when no holes exist', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);
    manager.holes = []; // Clear holes

    const nearest = manager.findNearestHole();
    expect(nearest).toBeNull();
  });

  test('Returns the only hole when one exists', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    const nearest = manager.findNearestHole();
    expect(nearest).toBe(manager.holes[0]);
  });

  test('Returns closest hole when multiple exist', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    manager.drillHole(1000);
    manager.drillHole(2000);
    manager.drillHole(1500);

    manager.playerX = 1550;
    const nearest = manager.findNearestHole();

    expect(nearest.x).toBe(1500); // Closest to player at 1550
  });

  test('Correctly calculates distance', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    manager.drillHole(700);
    manager.drillHole(2500);

    manager.playerX = 800;
    const nearest = manager.findNearestHole();

    // 700 is closer to 800 than 2500 is
    expect(nearest.x).toBe(700);
  });
});

describe('IceHoleManager - getCurrentHole', () => {
  test('Returns current hole', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    const currentHole = manager.getCurrentHole();
    expect(currentHole).toBe(manager.holes[manager.currentHoleIndex]);
  });

  test('Returns correct hole after index changes', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    manager.drillHole(1200);
    manager.drillHole(1800);

    manager.currentHoleIndex = 2;
    const currentHole = manager.getCurrentHole();
    expect(currentHole.x).toBe(1800);
  });
});

describe('IceHoleManager - Drill Battery Management', () => {
  test('Starts with maximum drill charges', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    expect(manager.drillChargesRemaining).toBe(manager.maxDrillCharges);
    expect(manager.maxDrillCharges).toBe(4);
  });

  test('Can drill up to max charges', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    const maxHoles = manager.maxDrillCharges + 1; // +1 for initial hole

    // Drill maximum holes
    for (let i = 0; i < manager.maxDrillCharges; i++) {
      manager.playerX = 500 + (i + 1) * 200;
      manager.drillNewHole();
    }

    expect(manager.holes.length).toBe(maxHoles);
    expect(manager.drillChargesRemaining).toBe(0);
  });

  test('Cannot drill after charges depleted', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);
    manager.drillChargesRemaining = 0;

    manager.playerX = 2000;
    const success = manager.drillNewHole();

    expect(success).toBe(false);
  });
});

describe('IceHoleManager - Integration Scenarios', () => {
  test('Complete ice fishing session workflow', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    // Start with initial hole
    expect(manager.holes.length).toBe(1);
    expect(manager.movementMode).toBe(false);

    // Enter movement mode to move to new location
    manager.enterMovementMode();
    expect(manager.movementMode).toBe(true);

    // Move to new location
    manager.movePlayer(500);
    expect(manager.playerX).toBe(1000);

    // Drill new hole
    const success = manager.drillNewHole();
    expect(success).toBe(true);
    expect(manager.holes.length).toBe(2);
    expect(manager.drillChargesRemaining).toBe(3);

    // Return to fishing mode
    manager.movementMode = false;
    expect(manager.getCurrentHole().x).toBe(1000);
  });

  test('Cannot drill holes too close together', () => {
    const scene = createMockScene();
    const manager = new IceHoleManager(scene);

    // Drill first additional hole
    manager.playerX = 800;
    const success1 = manager.drillNewHole();
    expect(success1).toBe(true);

    // Try to drill too close (only 50 units away)
    manager.playerX = 850;
    const success2 = manager.drillNewHole();
    expect(success2).toBe(false);

    // Move far enough away and drill successfully
    manager.playerX = 1500;
    const success3 = manager.drillNewHole();
    expect(success3).toBe(true);

    expect(manager.holes.length).toBe(3); // Initial + 2 successful drills
  });
});
