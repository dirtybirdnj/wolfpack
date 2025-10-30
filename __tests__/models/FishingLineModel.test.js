/**
 * FishingLineModel Tests
 *
 * Tests fishing line types, properties, and calculations.
 * Pure logic tests with no Phaser dependencies.
 */

import { FishingLineModel, LINE_TYPES, BRAID_COLORS } from '../../src/models/FishingLineModel.js';

describe('FishingLineModel - Initialization', () => {
  test('Creates with default values', () => {
    const line = new FishingLineModel();

    expect(line.lineType).toBe(LINE_TYPES.BRAID);
    expect(line.braidColor).toBe(BRAID_COLORS.NEON_GREEN);
  });

  test('Properties object is defined for all line types', () => {
    const line = new FishingLineModel();

    expect(line.properties[LINE_TYPES.BRAID]).toBeDefined();
    expect(line.properties[LINE_TYPES.MONOFILAMENT]).toBeDefined();
    expect(line.properties[LINE_TYPES.FLUOROCARBON]).toBeDefined();
  });

  test('Each line type has all required properties', () => {
    const line = new FishingLineModel();
    const requiredProps = ['stretch', 'sensitivity', 'visibility', 'shockAbsorption'];

    Object.values(LINE_TYPES).forEach(lineType => {
      const props = line.properties[lineType];
      requiredProps.forEach(prop => {
        expect(props).toHaveProperty(prop);
        expect(typeof props[prop]).toBe('number');
      });
    });
  });
});

describe('FishingLineModel - Line Type Management', () => {
  test('setLineType changes line type', () => {
    const line = new FishingLineModel();

    line.setLineType(LINE_TYPES.MONOFILAMENT);
    expect(line.lineType).toBe(LINE_TYPES.MONOFILAMENT);

    line.setLineType(LINE_TYPES.FLUOROCARBON);
    expect(line.lineType).toBe(LINE_TYPES.FLUOROCARBON);
  });

  test('setLineType ignores invalid line type', () => {
    const line = new FishingLineModel();
    const originalType = line.lineType;

    line.setLineType('invalid-type');
    expect(line.lineType).toBe(originalType);
  });

  test('getCurrentProperties returns correct properties for current line', () => {
    const line = new FishingLineModel();

    line.setLineType(LINE_TYPES.BRAID);
    expect(line.getCurrentProperties()).toBe(line.properties[LINE_TYPES.BRAID]);

    line.setLineType(LINE_TYPES.MONOFILAMENT);
    expect(line.getCurrentProperties()).toBe(line.properties[LINE_TYPES.MONOFILAMENT]);
  });
});

describe('FishingLineModel - Braid Color Management', () => {
  test('setBraidColor changes braid color', () => {
    const line = new FishingLineModel();

    line.setBraidColor(BRAID_COLORS.YELLOW);
    expect(line.braidColor).toBe(BRAID_COLORS.YELLOW);

    line.setBraidColor(BRAID_COLORS.MOSS_GREEN);
    expect(line.braidColor).toBe(BRAID_COLORS.MOSS_GREEN);
  });

  test('setBraidColor ignores invalid color', () => {
    const line = new FishingLineModel();
    const originalColor = line.braidColor;

    line.setBraidColor('hot-pink');
    expect(line.braidColor).toBe(originalColor);
  });
});

describe('FishingLineModel - Sensitivity Calculations', () => {
  test('getSensitivityMultiplier returns value between 0.5 and 1.0', () => {
    const line = new FishingLineModel();

    Object.values(LINE_TYPES).forEach(lineType => {
      line.setLineType(lineType);
      const multiplier = line.getSensitivityMultiplier();
      expect(multiplier).toBeGreaterThanOrEqual(0.5);
      expect(multiplier).toBeLessThanOrEqual(1.0);
    });
  });

  test('Braid has highest sensitivity (max 1.0)', () => {
    const line = new FishingLineModel();
    line.setLineType(LINE_TYPES.BRAID);

    const sensitivity = line.getSensitivityMultiplier();
    expect(sensitivity).toBe(1.0);
  });

  test('Different line types have different sensitivities', () => {
    const line = new FishingLineModel();

    line.setLineType(LINE_TYPES.BRAID);
    const braidSens = line.getSensitivityMultiplier();

    line.setLineType(LINE_TYPES.MONOFILAMENT);
    const monoSens = line.getSensitivityMultiplier();

    line.setLineType(LINE_TYPES.FLUOROCARBON);
    const fluoroSens = line.getSensitivityMultiplier();

    expect(braidSens).not.toBe(monoSens);
    expect(braidSens).not.toBe(fluoroSens);
    expect(monoSens).not.toBe(fluoroSens);
  });
});

describe('FishingLineModel - Visibility Calculations', () => {
  test('getVisibilityFactor returns value between 0.2 and 1.0', () => {
    const line = new FishingLineModel();

    Object.values(LINE_TYPES).forEach(lineType => {
      line.setLineType(lineType);
      const visibility = line.getVisibilityFactor();
      expect(visibility).toBeGreaterThanOrEqual(0.2);
      expect(visibility).toBeLessThanOrEqual(1.0);
    });
  });

  test('Fluorocarbon has lowest visibility (stealthiest)', () => {
    const line = new FishingLineModel();

    line.setLineType(LINE_TYPES.BRAID);
    const braidVis = line.getVisibilityFactor();

    line.setLineType(LINE_TYPES.FLUOROCARBON);
    const fluoroVis = line.getVisibilityFactor();

    expect(fluoroVis).toBeLessThan(braidVis);
  });

  test('Braid has highest visibility (most visible)', () => {
    const line = new FishingLineModel();

    line.setLineType(LINE_TYPES.BRAID);
    const braidVis = line.getVisibilityFactor();

    line.setLineType(LINE_TYPES.MONOFILAMENT);
    const monoVis = line.getVisibilityFactor();

    line.setLineType(LINE_TYPES.FLUOROCARBON);
    const fluoroVis = line.getVisibilityFactor();

    expect(braidVis).toBeGreaterThan(monoVis);
    expect(braidVis).toBeGreaterThan(fluoroVis);
  });
});

describe('FishingLineModel - Shock Absorption Calculations', () => {
  test('getShockAbsorptionMultiplier returns value between 0.5 and 1.0', () => {
    const line = new FishingLineModel();

    Object.values(LINE_TYPES).forEach(lineType => {
      line.setLineType(lineType);
      const absorption = line.getShockAbsorptionMultiplier();
      expect(absorption).toBeGreaterThanOrEqual(0.5);
      expect(absorption).toBeLessThanOrEqual(1.0);
    });
  });

  test('Monofilament has highest shock absorption', () => {
    const line = new FishingLineModel();

    line.setLineType(LINE_TYPES.MONOFILAMENT);
    const monoAbsorption = line.getShockAbsorptionMultiplier();

    line.setLineType(LINE_TYPES.BRAID);
    const braidAbsorption = line.getShockAbsorptionMultiplier();

    line.setLineType(LINE_TYPES.FLUOROCARBON);
    const fluoroAbsorption = line.getShockAbsorptionMultiplier();

    expect(monoAbsorption).toBeGreaterThan(braidAbsorption);
    expect(monoAbsorption).toBeGreaterThan(fluoroAbsorption);
  });

  test('Braid has lowest shock absorption', () => {
    const line = new FishingLineModel();

    line.setLineType(LINE_TYPES.BRAID);
    const braidAbsorption = line.getShockAbsorptionMultiplier();

    expect(braidAbsorption).toBe(0.5); // Minimum value
  });
});

describe('FishingLineModel - Stretch Calculations', () => {
  test('getStretchFactor returns value between 0.5 and 1.0', () => {
    const line = new FishingLineModel();

    Object.values(LINE_TYPES).forEach(lineType => {
      line.setLineType(lineType);
      const stretch = line.getStretchFactor();
      expect(stretch).toBeGreaterThanOrEqual(0.5);
      expect(stretch).toBeLessThanOrEqual(1.0);
    });
  });

  test('Braid has no stretch (min 0.5)', () => {
    const line = new FishingLineModel();
    line.setLineType(LINE_TYPES.BRAID);

    const stretch = line.getStretchFactor();
    expect(stretch).toBe(0.5);
  });

  test('Monofilament has highest stretch', () => {
    const line = new FishingLineModel();

    line.setLineType(LINE_TYPES.MONOFILAMENT);
    const monoStretch = line.getStretchFactor();

    line.setLineType(LINE_TYPES.BRAID);
    const braidStretch = line.getStretchFactor();

    line.setLineType(LINE_TYPES.FLUOROCARBON);
    const fluoroStretch = line.getStretchFactor();

    expect(monoStretch).toBeGreaterThan(braidStretch);
    expect(monoStretch).toBeGreaterThan(fluoroStretch);
  });
});

describe('FishingLineModel - Haptic Sensitivity', () => {
  test('getHapticSensitivity returns value between 0.4 and 1.0', () => {
    const line = new FishingLineModel();

    Object.values(LINE_TYPES).forEach(lineType => {
      line.setLineType(lineType);
      const haptic = line.getHapticSensitivity();
      expect(haptic).toBeGreaterThanOrEqual(0.4);
      expect(haptic).toBeLessThanOrEqual(1.0);
    });
  });

  test('Braid has maximum haptic sensitivity', () => {
    const line = new FishingLineModel();
    line.setLineType(LINE_TYPES.BRAID);

    const haptic = line.getHapticSensitivity();
    expect(haptic).toBe(1.0);
  });

  test('Monofilament has minimum haptic sensitivity', () => {
    const line = new FishingLineModel();
    line.setLineType(LINE_TYPES.MONOFILAMENT);

    const haptic = line.getHapticSensitivity();
    expect(haptic).toBe(0.4);
  });

  test('Haptic sensitivity descends: Braid > Fluorocarbon > Monofilament', () => {
    const line = new FishingLineModel();

    line.setLineType(LINE_TYPES.BRAID);
    const braidHaptic = line.getHapticSensitivity();

    line.setLineType(LINE_TYPES.FLUOROCARBON);
    const fluoroHaptic = line.getHapticSensitivity();

    line.setLineType(LINE_TYPES.MONOFILAMENT);
    const monoHaptic = line.getHapticSensitivity();

    expect(braidHaptic).toBeGreaterThan(fluoroHaptic);
    expect(fluoroHaptic).toBeGreaterThan(monoHaptic);
  });
});

describe('FishingLineModel - Display Names', () => {
  test('getDisplayName returns proper name for each line type', () => {
    const line = new FishingLineModel();

    line.setLineType(LINE_TYPES.BRAID);
    expect(line.getDisplayName()).toBe('Braided');

    line.setLineType(LINE_TYPES.MONOFILAMENT);
    expect(line.getDisplayName()).toBe('Monofilament');

    line.setLineType(LINE_TYPES.FLUOROCARBON);
    expect(line.getDisplayName()).toBe('Fluorocarbon');
  });

  test('getBraidColorDisplayName returns proper name for each color', () => {
    const line = new FishingLineModel();

    line.setBraidColor(BRAID_COLORS.NEON_GREEN);
    expect(line.getBraidColorDisplayName()).toBe('Neon Green');

    line.setBraidColor(BRAID_COLORS.YELLOW);
    expect(line.getBraidColorDisplayName()).toBe('Yellow');

    line.setBraidColor(BRAID_COLORS.MOSS_GREEN);
    expect(line.getBraidColorDisplayName()).toBe('Moss Green');

    line.setBraidColor(BRAID_COLORS.WHITE);
    expect(line.getBraidColorDisplayName()).toBe('White');
  });
});

describe('FishingLineModel - Line Type Properties Validation', () => {
  test('Braid properties are correct', () => {
    const line = new FishingLineModel();
    line.setLineType(LINE_TYPES.BRAID);
    const props = line.getCurrentProperties();

    expect(props.stretch).toBe(0);
    expect(props.sensitivity).toBe(10);
    expect(props.visibility).toBe(10);
    expect(props.shockAbsorption).toBe(0);
  });

  test('Monofilament properties are correct', () => {
    const line = new FishingLineModel();
    line.setLineType(LINE_TYPES.MONOFILAMENT);
    const props = line.getCurrentProperties();

    expect(props.stretch).toBe(8);
    expect(props.sensitivity).toBe(5);
    expect(props.visibility).toBe(6);
    expect(props.shockAbsorption).toBe(8);
  });

  test('Fluorocarbon properties are correct', () => {
    const line = new FishingLineModel();
    line.setLineType(LINE_TYPES.FLUOROCARBON);
    const props = line.getCurrentProperties();

    expect(props.stretch).toBe(3);
    expect(props.sensitivity).toBe(6);
    expect(props.visibility).toBe(2);
    expect(props.shockAbsorption).toBe(3);
  });
});
