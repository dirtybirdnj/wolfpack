# Quick Reference: Test Coverage Opportunities

## Current Status
- **Lines of Code**: 15,165
- **Lines Tested**: ~367 (2.4%)
- **Test Files**: 3
- **Jest Config**: In place with Phaser mocking

## Top 5 Quick Wins (Start Here!)

### 1. FishingLineModel.test.js (1-2 hours)
**File**: `/src/models/FishingLineModel.js` (156 lines)
**Why**: Core fishing mechanic, pure functions, no Phaser needed
```javascript
// Key tests needed:
- Constructor initialization
- setLineType() with all 3 types
- getSensitivityMultiplier() range validation
- getVisibilityFactor() calculation
- getShockAbsorptionMultiplier() ranges
```

### 2. ReelModel.test.js (2-3 hours)
**File**: `/src/models/ReelModel.js` (219 lines)
**Why**: Complex state management, critical for fishing
```javascript
// Key tests needed:
- Drag clamping (0-100%)
- getCurrentDragForce() calculation
- addLineOut() with capacity limits
- retrieveLine() constraint
- Reel type switching
```

### 3. GameConfig.test.js (1 hour)
**File**: `/src/config/GameConfig.js` (145 lines)
**Why**: Validates all game parameters and relationships
```javascript
// Key tests needed:
- Depth zones: min < max
- Physics: reasonable values
- Colors: valid hex
- Depth scale math check
```

### 4. SpeciesData.test.js (2-3 hours)
**File**: `/src/config/SpeciesData.js` (300+ lines)
**Why**: Validates all fish/baitfish behaviors
```javascript
// Key tests needed:
- All species have required properties
- Depth ranges valid
- Temperature ranges realistic
- Speed values positive
```

### 5. IceHoleManager.test.js (3-4 hours)
**File**: `/src/managers/IceHoleManager.js` (392 lines)
**Why**: Core gameplay mechanic, partially testable
```javascript
// Key tests needed:
- Lake bed profile generation
- getDepthAtPosition()
- Hole drilling constraints
- Player movement bounds
- Nearest hole finding
```

## Test Pattern Template

```javascript
import { FishingLineModel, LINE_TYPES } from '../src/models/FishingLineModel.js';

describe('FishingLineModel', () => {
  let model;

  beforeEach(() => {
    model = new FishingLineModel();
  });

  describe('Line Type Management', () => {
    test('should initialize with BRAID type', () => {
      expect(model.lineType).toBe(LINE_TYPES.BRAID);
    });

    test('should switch line type', () => {
      model.setLineType(LINE_TYPES.FLUOROCARBON);
      expect(model.lineType).toBe(LINE_TYPES.FLUOROCARBON);
    });

    test('should return correct properties for type', () => {
      model.setLineType(LINE_TYPES.MONOFILAMENT);
      const props = model.getCurrentProperties();
      expect(props.stretch).toBe(8);
      expect(props.sensitivity).toBe(5);
    });
  });

  describe('Multiplier Calculations', () => {
    test('getSensitivityMultiplier returns value between 0.5 and 1.0', () => {
      const multiplier = model.getSensitivityMultiplier();
      expect(multiplier).toBeGreaterThanOrEqual(0.5);
      expect(multiplier).toBeLessThanOrEqual(1.0);
    });
  });
});
```

## Mocking Strategy

### No Mock Needed
- GameConfig (pure constants)
- Constants (pure constants)
- SpeciesData (pure data)

### Simple Mocks
```javascript
// For scene-dependent classes
const mockScene = {
  registry: {
    get: (key) => null
  },
  add: {
    graphics: () => ({
      clear: jest.fn(),
      destroy: jest.fn()
    })
  },
  events: {
    emit: jest.fn()
  }
};
```

## File Organization
```
__tests__/
├── models/
│   ├── FishingLineModel.test.js
│   ├── ReelModel.test.js
│   └── AquaticOrganism.test.js
├── managers/
│   └── IceHoleManager.test.js
├── config/
│   ├── GameConfig.test.js
│   └── SpeciesData.test.js
└── [existing files]
    ├── config-validation.test.js
    ├── spawning-logic.test.js
    └── file-integrity.test.js
```

## Commands
```bash
# Run tests
npm test

# Run in watch mode (develops tests interactively)
npm run test:watch

# Check coverage
npm run test:coverage

# Run specific test file
npm test -- __tests__/models/FishingLineModel.test.js
```

## Effort vs Impact

| Module | Hours | Lines | Impact |
|--------|-------|-------|--------|
| FishingLineModel | 1-2 | 156 | HIGH |
| ReelModel | 2-3 | 219 | HIGH |
| GameConfig | 1 | 145 | HIGH |
| SpeciesData | 2-3 | 300+ | MEDIUM |
| IceHoleManager | 3-4 | 200+ | HIGH |
| **Total** | **12-16** | **1,020+** | **10%+ coverage** |

## After Tier 1 (Recommended Next Steps)

### If you have another 12-16 hours:
- AquaticOrganism.test.js (2-3 hours, 125 lines)
- Fish.test.js (3-4 hours, 150+ lines)
- Baitfish.test.js (2-3 hours, 100+ lines)

This achieves 10%+ coverage in ~4 sprints.

## Key Insights

1. **No Phaser Dependency** for FishingLineModel, ReelModel, GameConfig, SpeciesData
2. **Good Test Infrastructure** Already in place (Jest, mocks, patterns)
3. **High-Impact Targets**: Models and managers are the core logic
4. **Existing Patterns**: Follow config-validation.test.js style
5. **Zero Enforcement**: Coverage thresholds are 0%, so adding any tests helps

## Next Steps

1. Create `__tests__/models/FishingLineModel.test.js`
2. Run: `npm test -- __tests__/models/FishingLineModel.test.js`
3. Iterate and expand

**Total time to 10% coverage**: 24-32 hours across 2-4 weeks
**Recommended pace**: 1 module per day
