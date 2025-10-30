/**
 * ReelModel Tests
 *
 * Tests reel types, drag calculations, and line management.
 * Pure logic tests with no Phaser dependencies.
 */

import { ReelModel, REEL_TYPES } from '../../src/models/ReelModel.js';

describe('ReelModel - Initialization', () => {
  test('Creates with default values', () => {
    const reel = new ReelModel();

    expect(reel.reelType).toBe(REEL_TYPES.BAITCASTER);
    expect(reel.lineTestStrength).toBe(15);
    expect(reel.lineCapacity).toBe(300);
    expect(reel.lineOut).toBe(0);
    expect(reel.dragSetting).toBe(50);
    expect(reel.maxDragLimit).toBe(25);
  });

  test('Properties object is defined for all reel types', () => {
    const reel = new ReelModel();

    expect(reel.properties[REEL_TYPES.BAITCASTER]).toBeDefined();
    expect(reel.properties[REEL_TYPES.SPINCASTER]).toBeDefined();
  });

  test('Each reel type has all required properties', () => {
    const reel = new ReelModel();
    const requiredProps = ['gearRatio', 'dragPrecision', 'backlashRisk', 'maxDragLimit', 'lineCapacity', 'description'];

    Object.values(REEL_TYPES).forEach(reelType => {
      const props = reel.properties[reelType];
      requiredProps.forEach(prop => {
        expect(props).toHaveProperty(prop);
      });
    });
  });

  test('updateReelProperties is called during initialization', () => {
    const reel = new ReelModel();
    const props = reel.properties[REEL_TYPES.BAITCASTER];

    expect(reel.maxDragLimit).toBe(props.maxDragLimit);
    expect(reel.lineCapacity).toBe(props.lineCapacity);
    expect(reel.lineOut).toBe(0);
  });
});

describe('ReelModel - Reel Type Management', () => {
  test('setReelType changes reel type', () => {
    const reel = new ReelModel();

    reel.setReelType(REEL_TYPES.SPINCASTER);
    expect(reel.reelType).toBe(REEL_TYPES.SPINCASTER);

    reel.setReelType(REEL_TYPES.BAITCASTER);
    expect(reel.reelType).toBe(REEL_TYPES.BAITCASTER);
  });

  test('setReelType updates reel properties', () => {
    const reel = new ReelModel();

    reel.setReelType(REEL_TYPES.SPINCASTER);
    const spincasterProps = reel.properties[REEL_TYPES.SPINCASTER];
    expect(reel.maxDragLimit).toBe(spincasterProps.maxDragLimit);
    expect(reel.lineCapacity).toBe(spincasterProps.lineCapacity);

    reel.setReelType(REEL_TYPES.BAITCASTER);
    const baitcasterProps = reel.properties[REEL_TYPES.BAITCASTER];
    expect(reel.maxDragLimit).toBe(baitcasterProps.maxDragLimit);
    expect(reel.lineCapacity).toBe(baitcasterProps.lineCapacity);
  });

  test('setReelType resets lineOut to zero', () => {
    const reel = new ReelModel();
    reel.addLineOut(50);

    expect(reel.lineOut).toBe(50);

    reel.setReelType(REEL_TYPES.SPINCASTER);
    expect(reel.lineOut).toBe(0);
  });

  test('setReelType ignores invalid reel type', () => {
    const reel = new ReelModel();
    const originalType = reel.reelType;
    const originalMaxDrag = reel.maxDragLimit;

    reel.setReelType('invalid-reel');
    expect(reel.reelType).toBe(originalType);
    expect(reel.maxDragLimit).toBe(originalMaxDrag);
  });

  test('getCurrentProperties returns correct properties for current reel', () => {
    const reel = new ReelModel();

    reel.setReelType(REEL_TYPES.BAITCASTER);
    expect(reel.getCurrentProperties()).toBe(reel.properties[REEL_TYPES.BAITCASTER]);

    reel.setReelType(REEL_TYPES.SPINCASTER);
    expect(reel.getCurrentProperties()).toBe(reel.properties[REEL_TYPES.SPINCASTER]);
  });
});

describe('ReelModel - Line Test Strength', () => {
  test('setLineTestStrength updates line test', () => {
    const reel = new ReelModel();

    reel.setLineTestStrength(10);
    expect(reel.lineTestStrength).toBe(10);

    reel.setLineTestStrength(30);
    expect(reel.lineTestStrength).toBe(30);
  });

  test('Accepts standard test values', () => {
    const reel = new ReelModel();
    const standardTests = [10, 15, 20, 30];

    standardTests.forEach(test => {
      reel.setLineTestStrength(test);
      expect(reel.lineTestStrength).toBe(test);
    });
  });
});

describe('ReelModel - Drag Management', () => {
  test('adjustDrag increases drag setting', () => {
    const reel = new ReelModel();
    const initialDrag = reel.dragSetting;

    reel.adjustDrag(10);
    expect(reel.dragSetting).toBe(initialDrag + 10);
  });

  test('adjustDrag decreases drag setting', () => {
    const reel = new ReelModel();
    const initialDrag = reel.dragSetting;

    reel.adjustDrag(-10);
    expect(reel.dragSetting).toBe(initialDrag - 10);
  });

  test('adjustDrag clamps to 0-100 range', () => {
    const reel = new ReelModel();

    reel.setDrag(90);
    reel.adjustDrag(20);
    expect(reel.dragSetting).toBe(100);

    reel.setDrag(10);
    reel.adjustDrag(-20);
    expect(reel.dragSetting).toBe(0);
  });

  test('setDrag sets exact percentage', () => {
    const reel = new ReelModel();

    reel.setDrag(75);
    expect(reel.dragSetting).toBe(75);

    reel.setDrag(25);
    expect(reel.dragSetting).toBe(25);
  });

  test('setDrag clamps to 0-100 range', () => {
    const reel = new ReelModel();

    reel.setDrag(150);
    expect(reel.dragSetting).toBe(100);

    reel.setDrag(-50);
    expect(reel.dragSetting).toBe(0);
  });

  test('getCurrentDragForce calculates correctly', () => {
    const reel = new ReelModel();
    reel.setReelType(REEL_TYPES.BAITCASTER); // maxDragLimit = 25

    reel.setDrag(0);
    expect(reel.getCurrentDragForce()).toBe(0);

    reel.setDrag(50);
    expect(reel.getCurrentDragForce()).toBe(12.5);

    reel.setDrag(100);
    expect(reel.getCurrentDragForce()).toBe(25);
  });

  test('getCurrentDragForce respects reel max drag limit', () => {
    const reel = new ReelModel();

    reel.setReelType(REEL_TYPES.BAITCASTER); // maxDragLimit = 25
    reel.setDrag(100);
    expect(reel.getCurrentDragForce()).toBe(25);

    reel.setReelType(REEL_TYPES.SPINCASTER); // maxDragLimit = 18
    reel.setDrag(100);
    expect(reel.getCurrentDragForce()).toBe(18);
  });
});

describe('ReelModel - Line Management', () => {
  test('addLineOut increases line out', () => {
    const reel = new ReelModel();

    reel.addLineOut(50);
    expect(reel.lineOut).toBe(50);

    reel.addLineOut(30);
    expect(reel.lineOut).toBe(80);
  });

  test('addLineOut returns false when spool not empty', () => {
    const reel = new ReelModel();

    const spoolEmpty = reel.addLineOut(100);
    expect(spoolEmpty).toBe(false);
  });

  test('addLineOut returns true when spool empties', () => {
    const reel = new ReelModel();

    const spoolEmpty = reel.addLineOut(400); // Exceeds 300 ft capacity
    expect(spoolEmpty).toBe(true);
    expect(reel.lineOut).toBe(reel.lineCapacity);
  });

  test('addLineOut clamps at lineCapacity', () => {
    const reel = new ReelModel();

    reel.addLineOut(350);
    expect(reel.lineOut).toBe(300);

    reel.resetLineOut();
    reel.addLineOut(250);
    reel.addLineOut(100);
    expect(reel.lineOut).toBe(300);
  });

  test('retrieveLine decreases line out', () => {
    const reel = new ReelModel();
    reel.addLineOut(100);

    reel.retrieveLine(30);
    expect(reel.lineOut).toBe(70);

    reel.retrieveLine(40);
    expect(reel.lineOut).toBe(30);
  });

  test('retrieveLine clamps at zero', () => {
    const reel = new ReelModel();
    reel.addLineOut(50);

    reel.retrieveLine(100);
    expect(reel.lineOut).toBe(0);
  });

  test('resetLineOut sets lineOut to zero', () => {
    const reel = new ReelModel();
    reel.addLineOut(150);

    reel.resetLineOut();
    expect(reel.lineOut).toBe(0);
  });

  test('isSpoolEmpty returns false when line available', () => {
    const reel = new ReelModel();
    reel.addLineOut(100);

    expect(reel.isSpoolEmpty()).toBe(false);
  });

  test('isSpoolEmpty returns true when spool emptied', () => {
    const reel = new ReelModel();
    reel.addLineOut(300);

    expect(reel.isSpoolEmpty()).toBe(true);
  });

  test('getLineRemainingPercent calculates correctly', () => {
    const reel = new ReelModel();
    // lineCapacity = 300

    expect(reel.getLineRemainingPercent()).toBe(100);

    reel.addLineOut(150);
    expect(reel.getLineRemainingPercent()).toBe(50);

    reel.addLineOut(150);
    expect(reel.getLineRemainingPercent()).toBe(0);
  });
});

describe('ReelModel - Property Getters', () => {
  test('getGearRatio returns correct value for each reel type', () => {
    const reel = new ReelModel();

    reel.setReelType(REEL_TYPES.BAITCASTER);
    expect(reel.getGearRatio()).toBe(6.2);

    reel.setReelType(REEL_TYPES.SPINCASTER);
    expect(reel.getGearRatio()).toBe(5.2);
  });

  test('getDragPrecision returns correct value for each reel type', () => {
    const reel = new ReelModel();

    reel.setReelType(REEL_TYPES.BAITCASTER);
    expect(reel.getDragPrecision()).toBe(0.95);

    reel.setReelType(REEL_TYPES.SPINCASTER);
    expect(reel.getDragPrecision()).toBe(0.85);
  });

  test('getBacklashRisk returns correct value for each reel type', () => {
    const reel = new ReelModel();

    reel.setReelType(REEL_TYPES.BAITCASTER);
    expect(reel.getBacklashRisk()).toBe(0.15);

    reel.setReelType(REEL_TYPES.SPINCASTER);
    expect(reel.getBacklashRisk()).toBe(0.0);
  });

  test('Baitcaster has higher performance stats than Spincaster', () => {
    const reel = new ReelModel();

    reel.setReelType(REEL_TYPES.BAITCASTER);
    const baitcasterGear = reel.getGearRatio();
    const baitcasterPrecision = reel.getDragPrecision();
    const baitcasterMaxDrag = reel.maxDragLimit;

    reel.setReelType(REEL_TYPES.SPINCASTER);
    const spincasterGear = reel.getGearRatio();
    const spincasterPrecision = reel.getDragPrecision();
    const spincasterMaxDrag = reel.maxDragLimit;

    expect(baitcasterGear).toBeGreaterThan(spincasterGear);
    expect(baitcasterPrecision).toBeGreaterThan(spincasterPrecision);
    expect(baitcasterMaxDrag).toBeGreaterThan(spincasterMaxDrag);
  });

  test('Spincaster has no backlash risk', () => {
    const reel = new ReelModel();
    reel.setReelType(REEL_TYPES.SPINCASTER);

    expect(reel.getBacklashRisk()).toBe(0);
  });
});

describe('ReelModel - Display Methods', () => {
  test('getDisplayName returns correct name for each reel type', () => {
    const reel = new ReelModel();

    reel.setReelType(REEL_TYPES.BAITCASTER);
    expect(reel.getDisplayName()).toBe('Baitcaster');

    reel.setReelType(REEL_TYPES.SPINCASTER);
    expect(reel.getDisplayName()).toBe('Spincaster');
  });

  test('getInfo returns complete reel information object', () => {
    const reel = new ReelModel();
    reel.setDrag(60);
    reel.setLineTestStrength(20);
    reel.addLineOut(100);

    const info = reel.getInfo();

    expect(info).toHaveProperty('type');
    expect(info).toHaveProperty('dragSetting');
    expect(info).toHaveProperty('dragForce');
    expect(info).toHaveProperty('lineTest');
    expect(info).toHaveProperty('lineOut');
    expect(info).toHaveProperty('lineCapacity');
    expect(info).toHaveProperty('lineRemaining');
    expect(info).toHaveProperty('gearRatio');

    expect(info.dragSetting).toBe(60);
    expect(info.lineTest).toBe(20);
    expect(info.lineOut).toBe(100);
    expect(info.lineCapacity).toBe(300);
    expect(info.lineRemaining).toBe(200);
  });

  test('getInfo dragForce is formatted as string with one decimal', () => {
    const reel = new ReelModel();
    reel.setDrag(50);

    const info = reel.getInfo();
    expect(typeof info.dragForce).toBe('string');
    expect(info.dragForce).toMatch(/^\d+\.\d$/);
  });

  test('getInfo lineOut and lineRemaining are integers', () => {
    const reel = new ReelModel();
    reel.addLineOut(123.7);

    const info = reel.getInfo();
    expect(Number.isInteger(info.lineOut)).toBe(true);
    expect(Number.isInteger(info.lineRemaining)).toBe(true);
  });
});

describe('ReelModel - Reel Type Properties Validation', () => {
  test('Baitcaster properties are correct', () => {
    const reel = new ReelModel();
    reel.setReelType(REEL_TYPES.BAITCASTER);
    const props = reel.getCurrentProperties();

    expect(props.gearRatio).toBe(6.2);
    expect(props.dragPrecision).toBe(0.95);
    expect(props.backlashRisk).toBe(0.15);
    expect(props.maxDragLimit).toBe(25);
    expect(props.lineCapacity).toBe(300);
    expect(props.description).toContain('backlash');
  });

  test('Spincaster properties are correct', () => {
    const reel = new ReelModel();
    reel.setReelType(REEL_TYPES.SPINCASTER);
    const props = reel.getCurrentProperties();

    expect(props.gearRatio).toBe(5.2);
    expect(props.dragPrecision).toBe(0.85);
    expect(props.backlashRisk).toBe(0.0);
    expect(props.maxDragLimit).toBe(18);
    expect(props.lineCapacity).toBe(250);
    expect(props.description).toContain('Beginner');
  });
});

describe('ReelModel - Integration Scenarios', () => {
  test('Complete fishing scenario - line deployment and retrieval', () => {
    const reel = new ReelModel();

    // Cast and deploy line
    reel.addLineOut(150);
    expect(reel.lineOut).toBe(150);
    expect(reel.getLineRemainingPercent()).toBe(50);

    // Fish pulls more line
    reel.addLineOut(50);
    expect(reel.lineOut).toBe(200);

    // Reel in the fish
    reel.retrieveLine(100);
    expect(reel.lineOut).toBe(100);

    // Land the fish
    reel.retrieveLine(100);
    expect(reel.lineOut).toBe(0);
  });

  test('Fight scenario - adjusting drag during battle', () => {
    const reel = new ReelModel();
    reel.setDrag(70);

    // Fish pulling hard, loosen drag
    reel.adjustDrag(-20);
    expect(reel.dragSetting).toBe(50);
    expect(reel.getCurrentDragForce()).toBe(12.5);

    // Gaining ground, tighten drag
    reel.adjustDrag(30);
    expect(reel.dragSetting).toBe(80);
    expect(reel.getCurrentDragForce()).toBe(20);
  });

  test('Spool emptying scenario', () => {
    const reel = new ReelModel();

    // Fish making long run
    let spoolEmpty = reel.addLineOut(250);
    expect(spoolEmpty).toBe(false);

    // Fish continues, spool empties
    spoolEmpty = reel.addLineOut(100);
    expect(spoolEmpty).toBe(true);
    expect(reel.isSpoolEmpty()).toBe(true);
  });
});
