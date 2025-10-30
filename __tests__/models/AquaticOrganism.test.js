/**
 * AquaticOrganism Tests
 *
 * Tests the base class for all aquatic life forms.
 * Focus on position calculations, distance checks, and coordinate transformations.
 */

import { AquaticOrganism } from '../../src/models/AquaticOrganism.js';
import GameConfig from '../../src/config/GameConfig.js';

// Mock scene objects for different game modes
const createMockSceneWithIceHole = (holeX = 1000) => {
  return {
    iceHoleManager: {
      getCurrentHole: jest.fn(() => ({ x: holeX, depth: 50 })),
      getDepthAtPosition: jest.fn((x) => 50)
    },
    maxDepth: GameConfig.MAX_DEPTH
  };
};

const createMockSceneNatureMode = () => {
  return {
    iceHoleManager: null, // No ice hole manager in nature mode
    maxDepth: GameConfig.MAX_DEPTH
  };
};

describe('AquaticOrganism - Initialization', () => {
  test('Creates with basic properties', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 500, 100);

    expect(organism.scene).toBe(scene);
    expect(organism.worldX).toBe(500);
    expect(organism.y).toBe(100);
    expect(organism.visible).toBe(true);
  });

  test('Initializes with species data when provided', () => {
    const scene = createMockSceneNatureMode();
    const speciesData = { name: 'Test Species', size: 10 };
    const organism = new AquaticOrganism(scene, 500, 100, 'test', speciesData);

    expect(organism.species).toBe('test');
    expect(organism.speciesData).toBe(speciesData);
  });

  test('Initializes without species data', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 500, 100);

    expect(organism.species).toBeNull();
    expect(organism.speciesData).toBeNull();
  });

  test('Calculates depth from y position', () => {
    const scene = createMockSceneNatureMode();
    const y = 360; // At depth scale 3.6, this is 100 feet
    const organism = new AquaticOrganism(scene, 500, y);

    expect(organism.depth).toBe(y / GameConfig.DEPTH_SCALE);
  });

  test('Initializes movement properties', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 500, 100);

    expect(organism.speed).toBe(0);
    expect(organism.angle).toBe(0);
    expect(organism.size).toBe(0);
    expect(organism.length).toBe(0);
    expect(organism.age).toBe(0);
  });
});

describe('AquaticOrganism - Screen Position Updates (Ice Fishing Mode)', () => {
  test('Positions relative to ice hole in ice fishing mode', () => {
    const scene = createMockSceneWithIceHole(1000);
    const organism = new AquaticOrganism(scene, 1200, 100); // 200 units from hole

    organism.updateScreenPosition();

    const expectedX = (GameConfig.CANVAS_WIDTH / 2) + 200; // Center + offset
    expect(organism.x).toBe(expectedX);
  });

  test('Updates position when organism moves in world space', () => {
    const scene = createMockSceneWithIceHole(1000);
    const organism = new AquaticOrganism(scene, 1000, 100);

    organism.updateScreenPosition();
    const initialX = organism.x;

    organism.worldX = 1300; // Move 300 units in world space
    organism.updateScreenPosition();

    expect(organism.x).toBe(initialX + 300);
  });

  test('Centers organism when at same position as hole', () => {
    const scene = createMockSceneWithIceHole(2000);
    const organism = new AquaticOrganism(scene, 2000, 100);

    organism.updateScreenPosition();

    expect(organism.x).toBe(GameConfig.CANVAS_WIDTH / 2);
  });

  test('Positions left of center when west of hole', () => {
    const scene = createMockSceneWithIceHole(1000);
    const organism = new AquaticOrganism(scene, 800, 100); // 200 units west

    organism.updateScreenPosition();

    const expectedX = (GameConfig.CANVAS_WIDTH / 2) - 200;
    expect(organism.x).toBe(expectedX);
  });

  test('Responds to hole position changes', () => {
    const scene = createMockSceneWithIceHole(1000);
    const organism = new AquaticOrganism(scene, 1500, 100);

    organism.updateScreenPosition();
    const positionAtHole1 = organism.x;

    // Change hole position
    scene.iceHoleManager.getCurrentHole.mockReturnValue({ x: 1200, depth: 50 });
    organism.updateScreenPosition();
    const positionAtHole2 = organism.x;

    expect(positionAtHole2).not.toBe(positionAtHole1);
  });
});

describe('AquaticOrganism - Screen Position Updates (Nature Mode)', () => {
  test('Uses world X directly as screen X in nature mode', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 800, 100);

    organism.updateScreenPosition();

    expect(organism.x).toBe(800);
  });

  test('Screen position matches world position without offset', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 1234, 100);

    organism.updateScreenPosition();

    expect(organism.x).toBe(organism.worldX);
  });

  test('Updates screen position when world position changes', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 500, 100);

    organism.updateScreenPosition();
    expect(organism.x).toBe(500);

    organism.worldX = 750;
    organism.updateScreenPosition();
    expect(organism.x).toBe(750);
  });
});

describe('AquaticOrganism - Bottom Depth Calculation', () => {
  test('Uses ice hole manager depth in ice fishing mode', () => {
    const scene = createMockSceneWithIceHole(1000);
    scene.iceHoleManager.getDepthAtPosition.mockReturnValue(65);
    const organism = new AquaticOrganism(scene, 1000, 100);

    const bottomDepth = organism.getBottomDepthAtPosition();

    expect(bottomDepth).toBe(65);
  });

  test('Uses max depth minus 5 in nature mode', () => {
    const scene = createMockSceneNatureMode();
    scene.maxDepth = 150;
    const organism = new AquaticOrganism(scene, 800, 100);

    const bottomDepth = organism.getBottomDepthAtPosition();

    expect(bottomDepth).toBe(145); // 150 - 5
  });

  test('Falls back to GameConfig max depth if scene maxDepth not set', () => {
    const scene = createMockSceneNatureMode();
    scene.maxDepth = null;
    const organism = new AquaticOrganism(scene, 800, 100);

    const bottomDepth = organism.getBottomDepthAtPosition();

    expect(bottomDepth).toBe(GameConfig.MAX_DEPTH - 5);
  });
});

describe('AquaticOrganism - Distance from Player', () => {
  test('Calculates distance from hole in ice fishing mode', () => {
    const scene = createMockSceneWithIceHole(1000);
    const organism = new AquaticOrganism(scene, 1700, 100); // 700 units away

    const tooFar = organism.isTooFarFromPlayer(600);

    expect(tooFar).toBe(true); // 700 > 600
  });

  test('Returns false when within distance threshold', () => {
    const scene = createMockSceneWithIceHole(1000);
    const organism = new AquaticOrganism(scene, 1400, 100); // 400 units away

    const tooFar = organism.isTooFarFromPlayer(600);

    expect(tooFar).toBe(false); // 400 < 600
  });

  test('Uses absolute distance (works both directions)', () => {
    const scene = createMockSceneWithIceHole(1000);

    const organismEast = new AquaticOrganism(scene, 1500, 100);
    const organismWest = new AquaticOrganism(scene, 500, 100);

    expect(organismEast.isTooFarFromPlayer(600)).toBe(false);
    expect(organismWest.isTooFarFromPlayer(600)).toBe(false);
  });

  test('Checks screen bounds in nature mode', () => {
    const scene = createMockSceneNatureMode();

    const organismOffLeft = new AquaticOrganism(scene, -500, 100);
    const organismOffRight = new AquaticOrganism(scene, GameConfig.CANVAS_WIDTH + 500, 100);
    const organismOnScreen = new AquaticOrganism(scene, 700, 100);

    expect(organismOffLeft.isTooFarFromPlayer()).toBe(true);
    expect(organismOffRight.isTooFarFromPlayer()).toBe(true);
    expect(organismOnScreen.isTooFarFromPlayer()).toBe(false);
  });

  test('Uses custom max distance parameter', () => {
    const scene = createMockSceneWithIceHole(1000);
    const organism = new AquaticOrganism(scene, 1800, 100);

    expect(organism.isTooFarFromPlayer(500)).toBe(true);  // 800 > 500
    expect(organism.isTooFarFromPlayer(1000)).toBe(false); // 800 < 1000
  });

  test('Uses default 600 unit distance when not specified', () => {
    const scene = createMockSceneWithIceHole(1000);
    const organismJustInRange = new AquaticOrganism(scene, 1599, 100);
    const organismJustOutOfRange = new AquaticOrganism(scene, 1601, 100);

    expect(organismJustInRange.isTooFarFromPlayer()).toBe(false);
    expect(organismJustOutOfRange.isTooFarFromPlayer()).toBe(true);
  });
});

describe('AquaticOrganism - Abstract Methods', () => {
  test('update() throws error when not implemented', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 500, 100);

    expect(() => {
      organism.update();
    }).toThrow('update() must be implemented by subclass');
  });

  test('render() throws error when not implemented', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 500, 100);
    const mockGraphics = {};

    expect(() => {
      organism.render(mockGraphics);
    }).toThrow('render() must be implemented by subclass');
  });

  test('calculateLength() returns 0 by default', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 500, 100);

    expect(organism.calculateLength()).toBe(0);
  });

  test('calculateBiologicalAge() returns 0 by default', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 500, 100);

    expect(organism.calculateBiologicalAge()).toBe(0);
  });
});

describe('AquaticOrganism - Integration Scenarios', () => {
  test('Ice fishing organism tracking', () => {
    const scene = createMockSceneWithIceHole(2000);
    const organism = new AquaticOrganism(scene, 2300, 180);

    // Initial position
    organism.updateScreenPosition();
    expect(organism.x).toBe((GameConfig.CANVAS_WIDTH / 2) + 300);

    // Check if in range
    expect(organism.isTooFarFromPlayer(400)).toBe(true);
    expect(organism.isTooFarFromPlayer(600)).toBe(false);

    // Get bottom depth
    const bottomDepth = organism.getBottomDepthAtPosition();
    expect(scene.iceHoleManager.getDepthAtPosition).toHaveBeenCalled();
  });

  test('Nature mode free swimming', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 800, 200);

    // Position in nature mode
    organism.updateScreenPosition();
    expect(organism.x).toBe(800);
    expect(organism.worldX).toBe(800);

    // Move in world space
    organism.worldX = 1100;
    organism.updateScreenPosition();
    expect(organism.x).toBe(1100);

    // Check screen bounds
    expect(organism.isTooFarFromPlayer()).toBe(false);
  });

  test('Organism visibility and state tracking', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 500, 100, 'test_fish', {
      name: 'Test Fish',
      size: 12
    });

    expect(organism.visible).toBe(true);
    expect(organism.species).toBe('test_fish');
    expect(organism.speciesData.name).toBe('Test Fish');

    organism.visible = false;
    expect(organism.visible).toBe(false);
  });

  test('World to screen coordinate transformation consistency', () => {
    const scene = createMockSceneWithIceHole(5000);
    const positions = [4800, 5000, 5200]; // Left, center, right of hole

    positions.forEach(worldX => {
      const organism = new AquaticOrganism(scene, worldX, 100);
      organism.updateScreenPosition();

      const offsetFromHole = worldX - 5000;
      const expectedScreenX = (GameConfig.CANVAS_WIDTH / 2) + offsetFromHole;

      expect(organism.x).toBe(expectedScreenX);
    });
  });
});

describe('AquaticOrganism - Edge Cases', () => {
  test('Handles null hole in ice fishing mode', () => {
    const scene = createMockSceneWithIceHole(1000);
    scene.iceHoleManager.getCurrentHole.mockReturnValue(null);

    const organism = new AquaticOrganism(scene, 1200, 100);
    organism.updateScreenPosition();

    // Should fall back to organism's worldX when no current hole
    expect(organism.x).toBe((GameConfig.CANVAS_WIDTH / 2) + (1200 - 1200));
  });

  test('Handles very large world coordinates', () => {
    const scene = createMockSceneWithIceHole(50000);
    const organism = new AquaticOrganism(scene, 50500, 100);

    organism.updateScreenPosition();

    const expectedX = (GameConfig.CANVAS_WIDTH / 2) + 500;
    expect(organism.x).toBe(expectedX);
  });

  test('Handles negative world coordinates in nature mode', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, -100, 100);

    organism.updateScreenPosition();
    expect(organism.x).toBe(-100);

    const tooFar = organism.isTooFarFromPlayer();
    expect(tooFar).toBe(true); // Off screen to the left
  });

  test('Depth calculation with zero y position', () => {
    const scene = createMockSceneNatureMode();
    const organism = new AquaticOrganism(scene, 500, 0);

    expect(organism.depth).toBe(0);
  });

  test('Depth calculation at maximum depth', () => {
    const scene = createMockSceneNatureMode();
    const maxY = GameConfig.MAX_DEPTH * GameConfig.DEPTH_SCALE;
    const organism = new AquaticOrganism(scene, 500, maxY);

    expect(organism.depth).toBe(GameConfig.MAX_DEPTH);
  });
});
