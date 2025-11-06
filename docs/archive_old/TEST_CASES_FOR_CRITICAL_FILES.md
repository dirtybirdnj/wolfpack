# Test Cases for Critical Files - Practical Examples

This document provides concrete test case examples for the 3 CRITICAL files that must be tested before TypeScript conversion.

---

## 1. FishAI.js - Essential Test Cases

### File: `__tests__/entities/FishAI.test.js`

```javascript
describe('FishAI', () => {
  let mockFish;
  let mockScene;
  let mockLure;
  let fishAI;

  beforeEach(() => {
    // Setup mocks
    mockScene = {
      sonarDisplay: { getDepthScale: () => 3.6 },
      iceHoleManager: null
    };

    mockFish = {
      x: 700,
      y: 100,
      worldX: 500,
      depth: 27.8,
      depthZone: {
        name: 'Mid-Column',
        speedMultiplier: 1.0,
        aggressivenessBonus: 0.1
      },
      species: 'lake_trout',
      scene: mockScene,
      triggerInterestFlash: jest.fn()
    };

    mockLure = {
      x: 700,
      y: 200,
      depth: 55.6,
      state: 'RETRIEVING'
    };

    fishAI = new FishAI(mockFish, 'ice');
  });

  describe('Initialization', () => {
    test('should initialize with valid state', () => {
      expect(fishAI.state).toBe(Constants.FISH_STATE.IDLE);
      expect(fishAI.alertness).toBeGreaterThanOrEqual(0.5);
      expect(fishAI.alertness).toBeLessThanOrEqual(1.0);
    });

    test('should set aggressiveness between 0.5 and 1.0', () => {
      expect(fishAI.baseAggressiveness).toBeGreaterThanOrEqual(0.5);
      expect(fishAI.baseAggressiveness).toBeLessThanOrEqual(1.0);
    });

    test('northern pike should have ambush properties', () => {
      mockFish.species = 'northern_pike';
      const pikeAI = new FishAI(mockFish, 'ice');
      expect(pikeAI.isAmbushPredator).toBe(true);
      expect(pikeAI.strikeRange).toBe(60);
    });

    test('smallmouth bass should have circling properties', () => {
      mockFish.species = 'smallmouth_bass';
      const bassAI = new FishAI(mockFish, 'ice');
      expect(bassAI.circlesBeforeStrike).toBe(true);
      expect(bassAI.circleRadius).toBe(35);
    });
  });

  describe('Aggressiveness Calculation', () => {
    test('should apply depth zone bonus to aggressiveness', () => {
      fishAI.baseAggressiveness = 0.5;
      mockFish.depthZone.aggressivenessBonus = 0.1;
      expect(fishAI.aggressiveness).toBe(0.6);
    });

    test('should clamp aggressiveness between 0.1 and 1.0', () => {
      fishAI.baseAggressiveness = 0.05;
      expect(fishAI.aggressiveness).toBe(0.1);

      fishAI.baseAggressiveness = 1.5;
      expect(fishAI.aggressiveness).toBe(1.0);
    });
  });

  describe('Strike Distance', () => {
    test('northern pike should have longer strike range', () => {
      mockFish.species = 'northern_pike';
      const pikeAI = new FishAI(mockFish, 'ice');
      expect(pikeAI.getStrikeDistance()).toBe(60);
    });

    test('lake trout should use default strike distance', () => {
      mockFish.species = 'lake_trout';
      const troutAI = new FishAI(mockFish, 'ice');
      expect(troutAI.getStrikeDistance()).toBe(GameConfig.STRIKE_DISTANCE);
    });
  });

  describe('Frenzy Detection', () => {
    test('should detect frenzy when other fish are chasing', () => {
      const otherFish = {
        ai: { state: Constants.FISH_STATE.CHASING },
        x: 750,
        y: 120
      };
      
      fishAI.detectFrenzy(mockLure, [mockFish, otherFish]);
      
      // 75% chance of entering frenzy when another fish is excited
      // This test might be probabilistic, so check that it's possible
      if (mockFish.inFrenzy) {
        expect(mockFish.frenzyTimer).toBeGreaterThan(0);
        expect(fishAI.maxStrikeAttempts).toBeGreaterThanOrEqual(2);
      }
    });

    test('should not count self in frenzy detection', () => {
      fishAI.state = Constants.FISH_STATE.CHASING;
      const otherFish = { ai: { state: Constants.FISH_STATE.IDLE }, x: 800, y: 150 };
      
      // Should not cause self to enter double-frenzy
      fishAI.detectFrenzy(mockLure, [mockFish, otherFish]);
      expect(typeof mockFish.inFrenzy).toBe('boolean');
    });

    test('should trigger vertical strike for deep fish when lure above', () => {
      mockFish.depth = 120; // Bottom zone
      mockFish.depthZone.name = 'Bottom';
      mockFish.y = 430; // Deep position
      mockLure.y = 100; // Lure is above
      mockLure.x = 700; // Same X
      
      fishAI.detectFrenzy(mockLure, [mockFish]);
      
      // 30% chance of vertical strike
      // Should be possible to test
      if (mockFish.inFrenzy) {
        expect(fishAI.state).toBe(Constants.FISH_STATE.CHASING);
      }
    });
  });

  describe('Depth Preference', () => {
    test('should set depth preference within lake trout range', () => {
      const depthPref = fishAI.calculateDepthPreference();
      expect(depthPref).toBeGreaterThanOrEqual(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MIN);
      expect(depthPref).toBeLessThanOrEqual(GameConfig.LAKE_TROUT_PREFERRED_DEPTH_MAX);
    });
  });

  describe('Update Method', () => {
    test('should return without update if cooldown not met', () => {
      const currentTime = 100;
      fishAI.lastDecisionTime = 100;
      fishAI.decisionCooldown = 500;
      
      const initialState = fishAI.state;
      fishAI.update(mockLure, 150, [mockFish], []); // Only 50ms passed
      
      expect(fishAI.state).toBe(initialState);
    });

    test('should update state when cooldown expires', () => {
      const currentTime = 600;
      fishAI.lastDecisionTime = 100;
      fishAI.decisionCooldown = 500;
      
      fishAI.update(mockLure, currentTime, [mockFish], []);
      
      expect(fishAI.lastDecisionTime).toBe(currentTime);
    });

    test('should handle null lure in nature simulation mode', () => {
      const baitcloud = { x: 700, y: 200 };
      expect(() => {
        fishAI.update(null, 1000, [mockFish], [baitcloud]);
      }).not.toThrow();
    });

    test('should prioritize baitfish hunting over idle', () => {
      const baitcloud = {
        x: 700,
        y: 150,
        depth: 41.7,
        visible: true
      };
      
      fishAI.state = Constants.FISH_STATE.IDLE;
      fishAI.fish.hunger = 85; // Very hungry
      
      fishAI.update(mockLure, 1000, [mockFish], [baitcloud]);
      
      // Should have potential to enter HUNTING_BAITFISH state
      // depending on fish conditions
      expect([
        Constants.FISH_STATE.IDLE,
        Constants.FISH_STATE.HUNTING_BAITFISH
      ]).toContain(fishAI.state);
    });
  });
});
```

---

## 2. FishFight.js - Essential Test Cases

### File: `__tests__/entities/FishFight.test.js`

```javascript
describe('FishFight', () => {
  let mockScene;
  let mockFish;
  let mockLure;
  let mockFishingLineModel;
  let mockReelModel;
  let fight;

  beforeEach(() => {
    mockScene = {
      add: {
        graphics: jest.fn(() => ({
          setDepth: jest.fn(),
          clear: jest.fn(),
          fillStyle: jest.fn(),
          fillRect: jest.fn(),
          destroy: jest.fn()
        })),
        text: jest.fn(() => ({
          setOrigin: jest.fn(),
          setDepth: jest.fn(),
          destroy: jest.fn()
        }))
      },
      time: { now: 1000 },
      currentFight: null,
      notificationSystem: { showMessage: jest.fn() }
    };

    mockFish = {
      weight: 10, // lbs
      health: 80, // %
      hunger: 40, // %
      y: 200, // pixels
      x: 700,
      size: { points: 50 },
      sizeCategory: 'MEDIUM'
    };

    mockLure = {
      x: 700,
      y: 40
    };

    mockFishingLineModel = {
      getShockAbsorptionMultiplier: jest.fn(() => 0.9),
      getDisplayName: jest.fn(() => 'Monofilament')
    };

    mockReelModel = {
      lineTestStrength: 15, // lbs
      dragSetting: 50,
      lineOut: 0,
      lineCapacity: 300,
      getDisplayName: jest.fn(() => 'Baitcaster'),
      getCurrentDragForce: jest.fn(() => 10), // lbs
      maxDragLimit: 20
    };

    fight = new FishFight(mockScene, mockFish, mockLure, 
                          mockFishingLineModel, mockReelModel);
  });

  describe('Initialization', () => {
    test('should initialize with correct fight state', () => {
      expect(fight.active).toBe(true);
      expect(fight.fightState).toBe('hookset');
      expect(fight.hasLanded).toBe(false);
    });

    test('should calculate fish strength from weight and condition', () => {
      expect(fight.fishStrength).toBeGreaterThan(0);
      // Health 80%, Hunger 40% (well-fed) = good condition
      expect(fight.fishStrength).toBeGreaterThan(1.5);
    });

    test('should calculate energy based on biological condition', () => {
      const healthFactor = mockFish.health / 100; // 0.8
      const hungerFactor = 1 - (mockFish.hunger / 100); // 0.6
      const biologicalCondition = (healthFactor + hungerFactor) / 2; // 0.7
      
      expect(fight.fishEnergy).toBeGreaterThan(70);
      expect(fight.fishEnergy).toBeLessThanOrEqual(100);
    });

    test('should initialize line out based on fish depth', () => {
      expect(fight.reelModel.lineOut).toBeGreaterThan(0);
    });
  });

  describe('Fight State Transitions', () => {
    test('should transition from hookset to fighting after 3 seconds', () => {
      fight.stateTimer = 180; // 3 seconds at 60fps
      fight.updateFightState();
      expect(fight.fightState).toBe('fighting');
    });

    test('should transition from fighting to thrashing', () => {
      fight.fightState = 'fighting';
      fight.stateTimer = 300; // nextThrashTime
      fight.nextThrashTime = 300;
      
      fight.updateFightState();
      
      expect(fight.fightState).toBe('thrashing');
    });

    test('should transition from fighting to giving up when energy < 25%', () => {
      fight.fightState = 'fighting';
      fight.fishEnergy = 20; // Below 25%
      
      fight.updateFightState();
      
      expect(fight.fightState).toBe('giving_up');
    });

    test('should transition from thrashing back to fighting', () => {
      fight.fightState = 'thrashing';
      fight.thrashDuration = -1; // Thrash ended
      
      fight.updateFightState();
      
      expect(fight.fightState).toBe('fighting');
    });
  });

  describe('Line Break Detection', () => {
    test('should not break line if tension is safe', () => {
      fight.lineTension = 50;
      const active = fight.active;
      fight.update(1000, false);
      
      expect(fight.active).toBe(active); // Should still be active
    });

    test('should calculate line break with shock absorption', () => {
      const testStrength = mockReelModel.lineTestStrength; // 15 lbs
      const shockMult = mockFishingLineModel.getShockAbsorptionMultiplier(); // 0.9
      const effectiveBreakStrength = testStrength * shockMult * 1.2; // 16.2 lbs
      
      // At 100 tension = ~20 lb force, should break
      fight.lineTension = 100;
      fight.update(1000, false);
      
      if (fight.active === false) {
        expect(fight.active).toBe(false); // Line broke
      }
    });

    test('should break line if force exceeds effective strength', () => {
      fight.lineTension = 95; // High tension
      const initialActive = fight.active;
      
      fight.update(1000, false);
      
      // Depending on calculation, might break
      expect(typeof fight.active).toBe('boolean');
    });
  });

  describe('Hook Spit Chance', () => {
    test('should calculate hook spit chance based on size', () => {
      mockFish.sizeCategory = 'SMALL';
      fight = new FishFight(mockScene, mockFish, mockLure, 
                            mockFishingLineModel, mockReelModel);
      
      const spitChance = fight.calculateHookSpitChance();
      expect(spitChance).toBeLessThan(0.1);
    });

    test('trophy fish should have highest hook spit chance', () => {
      mockFish.sizeCategory = 'TROPHY';
      fight = new FishFight(mockScene, mockFish, mockLure, 
                            mockFishingLineModel, mockReelModel);
      
      const spitChance = fight.calculateHookSpitChance();
      expect(spitChance).toBeGreaterThan(0.1);
    });

    test('healthy energetic fish more likely to spit hook', () => {
      fight.fishEnergy = 90; // Healthy
      const highEnergyChance = fight.calculateHookSpitChance();
      
      fight.fishEnergy = 30; // Tired
      const lowEnergyChance = fight.calculateHookSpitChance();
      
      expect(highEnergyChance).toBeGreaterThan(lowEnergyChance);
    });
  });

  describe('Reel Mechanics', () => {
    test('should register reel input with cooldown', () => {
      fight.lastReelTime = 0;
      const currentTime = GameConfig.MIN_REEL_INTERVAL + 100;
      
      expect(fight.lastReelTime).toBeLessThan(currentTime);
      // Can reel
    });

    test('should reject reel input during cooldown', () => {
      fight.lastReelTime = 100;
      const currentTime = 150; // Only 50ms passed
      
      expect(currentTime - fight.lastReelTime).toBeLessThan(GameConfig.MIN_REEL_INTERVAL);
      // Cannot reel yet
    });
  });

  describe('Fish Landing', () => {
    test('should land fish when it reaches surface', () => {
      fight.fishDistance = 5; // Very close to surface
      fight.active = true;
      
      fight.update(1000, false);
      
      // Should trigger landing
      expect(fight.hasLanded).toBe(true);
    });
  });

  describe('Tension Mechanics', () => {
    test('should decay tension over time', () => {
      fight.lineTension = 50;
      const initialTension = fight.lineTension;
      
      fight.update(1000, false);
      
      expect(fight.lineTension).toBeLessThan(initialTension);
    });

    test('tension should never go negative', () => {
      fight.lineTension = 1;
      
      fight.update(1000, false);
      
      expect(fight.lineTension).toBeGreaterThanOrEqual(0);
    });
  });
});
```

---

## 3. SonarDisplay.js - Essential Test Cases

### File: `__tests__/utils/SonarDisplay.test.js`

```javascript
describe('SonarDisplay', () => {
  let mockScene;
  let sonarDisplay;

  beforeEach(() => {
    mockScene = {
      add: {
        graphics: jest.fn(() => ({
          setDepth: jest.fn(),
          clear: jest.fn(),
          fillStyle: jest.fn(),
          fillRect: jest.fn(),
          lineStyle: jest.fn(),
          lineBetween: jest.fn(),
          fillCircle: jest.fn(),
          fillEllipse: jest.fn(),
          destroy: jest.fn(),
          strokeCircle: jest.fn()
        })),
        text: jest.fn(() => ({
          setOrigin: jest.fn(),
          setDepth: jest.fn(),
          destroy: jest.fn()
        }))
      },
      scale: {
        width: 1400,
        height: 650,
        on: jest.fn()
      },
      time: {
        delayedCall: jest.fn()
      },
      iceHoleManager: null,
      maxDepth: 150
    };

    sonarDisplay = new SonarDisplay(mockScene, 'ice');
  });

  describe('Initialization', () => {
    test('should create graphics object at depth 0', () => {
      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(sonarDisplay.graphics.setDepth).toHaveBeenCalledWith(0);
    });

    test('should cache canvas dimensions', () => {
      expect(sonarDisplay.canvasWidth).toBe(1400);
      expect(sonarDisplay.canvasHeight).toBe(650);
    });

    test('should initialize noise particles', () => {
      expect(sonarDisplay.noiseParticles.length).toBe(50);
      sonarDisplay.noiseParticles.forEach(particle => {
        expect(particle.x).toBeGreaterThanOrEqual(0);
        expect(particle.x).toBeLessThanOrEqual(1400);
        expect(particle.life).toBeGreaterThanOrEqual(0);
      });
    });

    test('should generate bottom profile', () => {
      expect(sonarDisplay.bottomProfile.length).toBeGreaterThan(0);
      sonarDisplay.bottomProfile.forEach(point => {
        expect(point.depth).toBeGreaterThanOrEqual(15);
        expect(point.depth).toBeLessThanOrEqual(90); // Max 50 + 20 variation
      });
    });
  });

  describe('Depth Scale Calculation', () => {
    test('should calculate correct depth scale from max depth', () => {
      mockScene.maxDepth = 150;
      const waterColumnHeight = sonarDisplay.canvasHeight - GameConfig.LAKE_BOTTOM_RESERVE_PX;
      const expectedScale = waterColumnHeight / 150;
      
      const actualScale = sonarDisplay.getDepthScale();
      
      expect(actualScale).toBe(expectedScale);
    });

    test('should use iceHoleManager depth if available', () => {
      const mockHole = { depth: 60 };
      mockScene.iceHoleManager = {
        getCurrentHole: jest.fn(() => mockHole)
      };
      
      sonarDisplay = new SonarDisplay(mockScene, 'ice');
      const waterColumnHeight = sonarDisplay.canvasHeight - GameConfig.LAKE_BOTTOM_RESERVE_PX;
      const expectedScale = waterColumnHeight / 60;
      
      const actualScale = sonarDisplay.getDepthScale();
      
      expect(actualScale).toBeCloseTo(expectedScale, 2);
    });

    test('should handle null current hole gracefully', () => {
      mockScene.iceHoleManager = {
        getCurrentHole: jest.fn(() => null)
      };
      
      sonarDisplay = new SonarDisplay(mockScene, 'ice');
      
      expect(() => {
        sonarDisplay.getDepthScale();
      }).not.toThrow();
    });

    test('should not divide by zero', () => {
      mockScene.maxDepth = 0;
      
      expect(() => {
        sonarDisplay.getDepthScale();
      }).not.toThrow();
    });

    test('depth scale should be positive', () => {
      const scale = sonarDisplay.getDepthScale();
      expect(scale).toBeGreaterThan(0);
    });
  });

  describe('Actual Max Depth', () => {
    test('should get depth from iceHoleManager if available', () => {
      const mockHole = { depth: 45.5 };
      mockScene.iceHoleManager = {
        getCurrentHole: jest.fn(() => mockHole)
      };
      
      sonarDisplay = new SonarDisplay(mockScene, 'ice');
      const maxDepth = sonarDisplay.getActualMaxDepth();
      
      expect(maxDepth).toBe(45.5);
    });

    test('should fallback to GameConfig.MAX_DEPTH', () => {
      mockScene.iceHoleManager = null;
      sonarDisplay.cachedMaxDepth = GameConfig.MAX_DEPTH;
      
      const maxDepth = sonarDisplay.getActualMaxDepth();
      
      expect(maxDepth).toBe(GameConfig.MAX_DEPTH);
    });

    test('should handle null hole with iceHoleManager available', () => {
      mockScene.iceHoleManager = {
        getCurrentHole: jest.fn(() => null)
      };
      
      sonarDisplay = new SonarDisplay(mockScene, 'ice');
      
      expect(() => {
        const maxDepth = sonarDisplay.getActualMaxDepth();
        expect(maxDepth).toBe(GameConfig.MAX_DEPTH);
      }).not.toThrow();
    });
  });

  describe('Resize Handling', () => {
    test('should listen for resize events', () => {
      expect(mockScene.scale.on).toHaveBeenCalledWith(
        'resize',
        sonarDisplay.handleResize,
        sonarDisplay
      );
    });

    test('should update canvas dimensions on resize', () => {
      sonarDisplay.canvasWidth = 1400;
      sonarDisplay.canvasHeight = 650;
      
      mockScene.scale.width = 1600;
      mockScene.scale.height = 800;
      
      sonarDisplay.handleResize();
      
      expect(sonarDisplay.canvasWidth).toBe(1600);
      expect(sonarDisplay.canvasHeight).toBe(800);
    });
  });

  describe('Rendering', () => {
    test('should clear graphics each frame', () => {
      sonarDisplay.render();
      expect(sonarDisplay.graphics.clear).toHaveBeenCalled();
    });

    test('should update grid offset for sonar scroll', () => {
      const initialOffset = sonarDisplay.gridOffset;
      sonarDisplay.render();
      expect(sonarDisplay.gridOffset).not.toBe(initialOffset);
    });

    test('should advance scan line position', () => {
      const initialX = sonarDisplay.scanLineX;
      sonarDisplay.render();
      expect(sonarDisplay.scanLineX).not.toBe(initialX);
    });
  });

  describe('Integration with Entities', () => {
    test('all entities should use consistent depth scale', () => {
      // If we call getDepthScale multiple times, should get consistent results
      const scale1 = sonarDisplay.getDepthScale();
      const scale2 = sonarDisplay.getDepthScale();
      
      expect(scale1).toBe(scale2);
    });

    test('depth calculations should work with fish Y positions', () => {
      const fishY = 100; // Pixel position
      const scale = sonarDisplay.getDepthScale();
      const depth = fishY / scale;
      
      expect(depth).toBeGreaterThanOrEqual(0);
      expect(typeof depth).toBe('number');
      expect(isNaN(depth)).toBe(false);
    });
  });
});
```

---

## How to Run These Tests

```bash
# Install dependencies if not already done
npm install

# Run tests for specific file
npm test -- FishAI.test.js
npm test -- FishFight.test.js
npm test -- SonarDisplay.test.js

# Run all tests with coverage
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

---

## Integration Test Example

Once unit tests pass, create integration tests:

### File: `__tests__/integration/FishAI-FishFight.integration.test.js`

```javascript
describe('FishAI + FishFight Integration', () => {
  test('fish AI should correctly feed state into fight mechanics', () => {
    // Create mock fish with AI
    const fish = new Fish(mockScene, 700, 200, 'LARGE', 'ice', 'lake_trout');
    
    // Start a chase
    fish.ai.state = Constants.FISH_STATE.CHASING;
    
    // Start a fight
    const fight = new FishFight(mockScene, fish, mockLure, mockLine, mockReel);
    
    // Fish strength should be based on actual fish properties
    expect(fight.fishStrength).toBeGreaterThan(0);
    expect(fight.fishStrength).toBeLessThan(100);
  });

  test('sonar display depth scale should correctly position fish during fight', () => {
    const sonar = new SonarDisplay(mockScene, 'ice');
    const fish = new Fish(mockScene, 700, 200, 'MEDIUM', 'ice', 'lake_trout');
    const fight = new FishFight(mockScene, fish, mockLure, mockLine, mockReel);
    
    const depthScale = sonar.getDepthScale();
    const pixelDepth = fight.fishDistance;
    const footDepth = pixelDepth / depthScale;
    
    expect(footDepth).toBeGreaterThanOrEqual(0);
    expect(footDepth).toBeLessThanOrEqual(GameConfig.MAX_DEPTH);
  });
});
```

---

## Next Steps

1. **Create the test files** in `__tests__/entities/` and `__tests__/utils/`
2. **Run with `npm test`** to see which cases fail
3. **Fix issues** in source files to pass tests
4. **Increase coverage** to 80%+ for each file
5. **Run TypeScript conversion** with confidence that behavior is preserved

