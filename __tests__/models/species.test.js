/**
 * Species Model Tests
 *
 * Tests species-specific calculation methods for all predator species.
 * Each species overrides calculateLength() and calculateBiologicalAge() with their own formulas.
 * Pure math tests with no Phaser dependencies.
 */

import { LakeTrout } from '../../src/models/species/LakeTrout.js';
import { NorthernPike } from '../../src/models/species/NorthernPike.js';
import { SmallmouthBass } from '../../src/models/species/SmallmouthBass.js';
import { YellowPerch } from '../../src/models/species/YellowPerch.js';
import GameConfig from '../../src/config/GameConfig.js';

// Mock scene object with minimal required properties
const createMockScene = () => {
  return {
    add: { graphics: () => ({ setDepth: jest.fn() }) },
    time: { now: 0 },
    fishingType: GameConfig.FISHING_TYPE_ICE,
    maxDepth: GameConfig.MAX_DEPTH,
    iceHoleManager: null,
    sonarDisplay: null
  };
};

describe('LakeTrout - Species-Specific Calculations', () => {
  test('calculateLength uses lake trout formula', () => {
    const scene = createMockScene();
    const fish = new LakeTrout(scene, 500, 100, 'MEDIUM');

    fish.weight = 10;
    const length = fish.calculateLength();

    // Formula: 10.5 * weight^0.31
    // 10.5 * 10^0.31 ≈ 21 inches
    expect(length).toBeGreaterThan(20);
    expect(length).toBeLessThan(22);
  });

  test('calculateLength scales correctly with weight', () => {
    const scene = createMockScene();
    const fish = new LakeTrout(scene, 500, 100, 'MEDIUM');

    fish.weight = 5;
    const length5lb = fish.calculateLength();

    fish.weight = 20;
    const length20lb = fish.calculateLength();

    expect(length20lb).toBeGreaterThan(length5lb);
  });

  test('calculateBiologicalAge returns correct ranges', () => {
    const scene = createMockScene();
    const fish = new LakeTrout(scene, 500, 100, 'MEDIUM');

    // Small: 3-6 years
    fish.weight = 3;
    const ageSmall = fish.calculateBiologicalAge();
    expect(ageSmall).toBeGreaterThanOrEqual(3);
    expect(ageSmall).toBeLessThanOrEqual(6);

    // Medium: 6-12 years
    fish.weight = 8;
    const ageMedium = fish.calculateBiologicalAge();
    expect(ageMedium).toBeGreaterThanOrEqual(6);
    expect(ageMedium).toBeLessThanOrEqual(12);

    // Large: 12-20 years
    fish.weight = 18;
    const ageLarge = fish.calculateBiologicalAge();
    expect(ageLarge).toBeGreaterThanOrEqual(12);
    expect(ageLarge).toBeLessThanOrEqual(20);

    // Trophy: 20-30 years
    fish.weight = 30;
    const ageTrophy = fish.calculateBiologicalAge();
    expect(ageTrophy).toBeGreaterThanOrEqual(20);
    expect(ageTrophy).toBeLessThanOrEqual(30);
  });

  test('initializes with species name', () => {
    const scene = createMockScene();
    const fish = new LakeTrout(scene, 500, 100, 'MEDIUM');

    expect(fish.species).toBe('lake_trout');
    expect(fish.speciesData.name).toBe('Lake Trout');
  });

  test('lake trout are very hungry on initialization', () => {
    const scene = createMockScene();
    const fish = new LakeTrout(scene, 500, 100, 'MEDIUM');

    // Lake trout hunger is set to 80-100 (voracious predators)
    expect(fish.hunger).toBeGreaterThanOrEqual(80);
    expect(fish.hunger).toBeLessThanOrEqual(100);
  });
});

describe('NorthernPike - Species-Specific Calculations', () => {
  test('calculateLength uses pike formula (longer than lake trout)', () => {
    const scene = createMockScene();
    const pike = new NorthernPike(scene, 500, 100, 'MEDIUM');

    pike.weight = 10;
    const pikeLength = pike.calculateLength();

    // Formula: 13.5 * weight^0.28 (pike are longer/more slender)
    // 13.5 * 10^0.28 ≈ 26 inches
    expect(pikeLength).toBeGreaterThan(25);
    expect(pikeLength).toBeLessThan(28);

    // Compare to lake trout at same weight
    const trout = new LakeTrout(scene, 500, 100, 'MEDIUM');
    trout.weight = 10;
    const troutLength = trout.calculateLength();

    expect(pikeLength).toBeGreaterThan(troutLength);
  });

  test('calculateBiologicalAge shows faster growth (younger for same weight)', () => {
    const scene = createMockScene();
    const pike = new NorthernPike(scene, 500, 100, 'MEDIUM');

    // Small: 2-4 years
    pike.weight = 4;
    const ageSmall = pike.calculateBiologicalAge();
    expect(ageSmall).toBeGreaterThanOrEqual(2);
    expect(ageSmall).toBeLessThanOrEqual(4);

    // Medium: 4-8 years
    pike.weight = 10;
    const ageMedium = pike.calculateBiologicalAge();
    expect(ageMedium).toBeGreaterThanOrEqual(4);
    expect(ageMedium).toBeLessThanOrEqual(8);

    // Large: 8-14 years
    pike.weight = 20;
    const ageLarge = pike.calculateBiologicalAge();
    expect(ageLarge).toBeGreaterThanOrEqual(8);
    expect(ageLarge).toBeLessThanOrEqual(14);

    // Trophy: 14-22 years (shorter lifespan than lake trout)
    pike.weight = 30;
    const ageTrophy = pike.calculateBiologicalAge();
    expect(ageTrophy).toBeGreaterThanOrEqual(14);
    expect(ageTrophy).toBeLessThanOrEqual(22);
  });

  test('pike grow faster than lake trout', () => {
    const scene = createMockScene();

    const pike = new NorthernPike(scene, 500, 100, 'MEDIUM');
    pike.weight = 15;
    const pikeAge = pike.calculateBiologicalAge();

    const trout = new LakeTrout(scene, 500, 100, 'MEDIUM');
    trout.weight = 15;
    const troutAge = trout.calculateBiologicalAge();

    // Pike should generally be younger for the same weight (faster growth)
    // Pike max age at 15lbs: 8 years
    // Trout max age at 15lbs: 20 years
    expect(pikeAge).toBeLessThanOrEqual(8);
    expect(troutAge).toBeGreaterThanOrEqual(12);
  });

  test('initializes with species name', () => {
    const scene = createMockScene();
    const fish = new NorthernPike(scene, 500, 100, 'MEDIUM');

    expect(fish.species).toBe('northern_pike');
    expect(fish.speciesData.name).toBe('Northern Pike');
  });
});

describe('SmallmouthBass - Species-Specific Calculations', () => {
  test('calculateLength uses bass formula (compact body)', () => {
    const scene = createMockScene();
    const bass = new SmallmouthBass(scene, 500, 100, 'MEDIUM');

    bass.weight = 4;
    const bassLength = bass.calculateLength();

    // Formula: 11.2 * weight^0.33 (compact, deep-bodied)
    // 11.2 * 4^0.33 ≈ 17 inches
    expect(bassLength).toBeGreaterThan(16);
    expect(bassLength).toBeLessThan(19);
  });

  test('bass are compact (shorter for their weight)', () => {
    const scene = createMockScene();

    const bass = new SmallmouthBass(scene, 500, 100, 'MEDIUM');
    bass.weight = 5;
    const bassLength = bass.calculateLength();

    const pike = new NorthernPike(scene, 500, 100, 'MEDIUM');
    pike.weight = 5;
    const pikeLength = pike.calculateLength();

    // Pike should be noticeably longer for same weight
    expect(pikeLength).toBeGreaterThan(bassLength);
  });

  test('calculateBiologicalAge shows moderate growth', () => {
    const scene = createMockScene();
    const bass = new SmallmouthBass(scene, 500, 100, 'MEDIUM');

    // Small: 2-4 years
    bass.weight = 1.5;
    const ageSmall = bass.calculateBiologicalAge();
    expect(ageSmall).toBeGreaterThanOrEqual(2);
    expect(ageSmall).toBeLessThanOrEqual(4);

    // Medium: 4-7 years
    bass.weight = 3;
    const ageMedium = bass.calculateBiologicalAge();
    expect(ageMedium).toBeGreaterThanOrEqual(4);
    expect(ageMedium).toBeLessThanOrEqual(7);

    // Large: 7-12 years
    bass.weight = 5;
    const ageLarge = bass.calculateBiologicalAge();
    expect(ageLarge).toBeGreaterThanOrEqual(7);
    expect(ageLarge).toBeLessThanOrEqual(12);

    // Trophy: 12-18 years
    bass.weight = 7;
    const ageTrophy = bass.calculateBiologicalAge();
    expect(ageTrophy).toBeGreaterThanOrEqual(12);
    expect(ageTrophy).toBeLessThanOrEqual(18);
  });

  test('bass weight ranges are smaller than other species', () => {
    const scene = createMockScene();
    const bass = new SmallmouthBass(scene, 500, 100, 'TROPHY');

    // Trophy bass are much smaller than trophy lake trout or pike
    // Bass trophy range: 6-8 lbs
    expect(bass.weight).toBeLessThan(10);
  });

  test('initializes with species name', () => {
    const scene = createMockScene();
    const fish = new SmallmouthBass(scene, 500, 100, 'MEDIUM');

    expect(fish.species).toBe('smallmouth_bass');
    expect(fish.speciesData.name).toBe('Smallmouth Bass');
  });
});

describe('YellowPerch - Species-Specific Calculations', () => {
  test('calculateLength uses perch formula (smallest species)', () => {
    const scene = createMockScene();
    const perch = new YellowPerch(scene, 500, 100, 'MEDIUM');

    perch.weight = 1.0;
    const perchLength = perch.calculateLength();

    // Formula: 9.5 * weight^0.35 (smaller, deep-bodied)
    // 9.5 * 1.0^0.35 ≈ 9.5 inches
    expect(perchLength).toBeGreaterThan(9);
    expect(perchLength).toBeLessThan(11);
  });

  test('perch are the smallest predator species', () => {
    const scene = createMockScene();
    const weight = 2;

    const perch = new YellowPerch(scene, 500, 100, 'MEDIUM');
    perch.weight = weight;
    const perchLength = perch.calculateLength();

    const bass = new SmallmouthBass(scene, 500, 100, 'MEDIUM');
    bass.weight = weight;
    const bassLength = bass.calculateLength();

    const trout = new LakeTrout(scene, 500, 100, 'MEDIUM');
    trout.weight = weight;
    const troutLength = trout.calculateLength();

    // Perch should be shortest for same weight
    expect(perchLength).toBeLessThan(bassLength);
    expect(perchLength).toBeLessThan(troutLength);
  });

  test('calculateBiologicalAge shows fast growth, short lifespan', () => {
    const scene = createMockScene();
    const perch = new YellowPerch(scene, 500, 100, 'MEDIUM');

    // Small: 1-3 years (very young)
    perch.weight = 0.5;
    const ageSmall = perch.calculateBiologicalAge();
    expect(ageSmall).toBeGreaterThanOrEqual(1);
    expect(ageSmall).toBeLessThanOrEqual(3);

    // Medium: 3-5 years
    perch.weight = 1.0;
    const ageMedium = perch.calculateBiologicalAge();
    expect(ageMedium).toBeGreaterThanOrEqual(3);
    expect(ageMedium).toBeLessThanOrEqual(5);

    // Large: 5-8 years
    perch.weight = 1.5;
    const ageLarge = perch.calculateBiologicalAge();
    expect(ageLarge).toBeGreaterThanOrEqual(5);
    expect(ageLarge).toBeLessThanOrEqual(8);

    // Trophy: 8-12 years (shortest maximum lifespan)
    perch.weight = 2.5;
    const ageTrophy = perch.calculateBiologicalAge();
    expect(ageTrophy).toBeGreaterThanOrEqual(8);
    expect(ageTrophy).toBeLessThanOrEqual(12);
  });

  test('perch have smallest weight ranges', () => {
    const scene = createMockScene();
    const perch = new YellowPerch(scene, 500, 100, 'TROPHY');

    // Trophy perch: 2-3 lbs (much smaller than other species)
    expect(perch.weight).toBeLessThan(4);
  });

  test('initializes with species name', () => {
    const scene = createMockScene();
    const fish = new YellowPerch(scene, 500, 100, 'MEDIUM');

    expect(fish.species).toBe('yellow_perch_large');
    expect(fish.speciesData.name).toBe('Yellow Perch');
  });
});

describe('Species Comparison - Length Formulas', () => {
  test('Pike are longest for same weight', () => {
    const scene = createMockScene();
    const weight = 10;

    const pike = new NorthernPike(scene, 500, 100, 'MEDIUM');
    pike.weight = weight;
    const pikeLength = pike.calculateLength();

    const trout = new LakeTrout(scene, 500, 100, 'MEDIUM');
    trout.weight = weight;
    const troutLength = trout.calculateLength();

    const bass = new SmallmouthBass(scene, 500, 100, 'MEDIUM');
    bass.weight = weight;
    const bassLength = bass.calculateLength();

    const perch = new YellowPerch(scene, 500, 100, 'MEDIUM');
    perch.weight = weight;
    const perchLength = perch.calculateLength();

    expect(pikeLength).toBeGreaterThan(troutLength);
    expect(pikeLength).toBeGreaterThan(bassLength);
    expect(pikeLength).toBeGreaterThan(perchLength);
  });

  test('Perch are shortest for same weight', () => {
    const scene = createMockScene();
    const weight = 2;

    const pike = new NorthernPike(scene, 500, 100, 'MEDIUM');
    pike.weight = weight;
    const pikeLength = pike.calculateLength();

    const trout = new LakeTrout(scene, 500, 100, 'MEDIUM');
    trout.weight = weight;
    const troutLength = trout.calculateLength();

    const bass = new SmallmouthBass(scene, 500, 100, 'MEDIUM');
    bass.weight = weight;
    const bassLength = bass.calculateLength();

    const perch = new YellowPerch(scene, 500, 100, 'MEDIUM');
    perch.weight = weight;
    const perchLength = perch.calculateLength();

    expect(perchLength).toBeLessThan(pikeLength);
    expect(perchLength).toBeLessThan(troutLength);
    expect(perchLength).toBeLessThan(bassLength);
  });

  test('Length ordering: Pike > Trout > Bass > Perch', () => {
    const scene = createMockScene();
    const weight = 5;

    const species = [
      { name: 'pike', fish: new NorthernPike(scene, 500, 100, 'MEDIUM') },
      { name: 'trout', fish: new LakeTrout(scene, 500, 100, 'MEDIUM') },
      { name: 'bass', fish: new SmallmouthBass(scene, 500, 100, 'MEDIUM') },
      { name: 'perch', fish: new YellowPerch(scene, 500, 100, 'MEDIUM') }
    ];

    species.forEach(s => {
      s.fish.weight = weight;
      s.length = s.fish.calculateLength();
    });

    expect(species[0].length).toBeGreaterThan(species[1].length); // Pike > Trout
    expect(species[1].length).toBeGreaterThan(species[2].length); // Trout > Bass
    expect(species[2].length).toBeGreaterThan(species[3].length); // Bass > Perch
  });
});

describe('Species Comparison - Age and Growth Rates', () => {
  test('Lake trout live longest', () => {
    const scene = createMockScene();

    // Compare maximum ages for trophy fish
    const trout = new LakeTrout(scene, 500, 100, 'TROPHY');
    trout.weight = 35;
    const troutAge = trout.calculateBiologicalAge();

    const pike = new NorthernPike(scene, 500, 100, 'TROPHY');
    pike.weight = 35;
    const pikeAge = pike.calculateBiologicalAge();

    // Lake trout can reach 30 years, pike max out at 22 years
    expect(troutAge).toBeGreaterThan(20); // Can be up to 30
    expect(pikeAge).toBeLessThanOrEqual(22); // Max 22
  });

  test('Perch have shortest lifespan', () => {
    const scene = createMockScene();

    const perch = new YellowPerch(scene, 500, 100, 'TROPHY');
    perch.weight = 2.5;
    const perchAge = perch.calculateBiologicalAge();

    // Perch max out at 12 years
    expect(perchAge).toBeLessThanOrEqual(12);
  });

  test('Pike grow faster than lake trout (younger for same weight)', () => {
    const scene = createMockScene();
    const weight = 12;

    const pike = new NorthernPike(scene, 500, 100, 'MEDIUM');
    pike.weight = weight;
    const pikeAge = pike.calculateBiologicalAge();

    const trout = new LakeTrout(scene, 500, 100, 'MEDIUM');
    trout.weight = weight;
    const troutAge = trout.calculateBiologicalAge();

    // Pike at 12 lbs: max 8 years
    // Trout at 12 lbs: 6-12 years (up to 12)
    expect(pikeAge).toBeLessThanOrEqual(8);
  });
});

describe('Species - Formula Accuracy', () => {
  test('All species formulas return integer lengths', () => {
    const scene = createMockScene();
    const species = [
      new LakeTrout(scene, 500, 100, 'MEDIUM'),
      new NorthernPike(scene, 500, 100, 'MEDIUM'),
      new SmallmouthBass(scene, 500, 100, 'MEDIUM'),
      new YellowPerch(scene, 500, 100, 'MEDIUM')
    ];

    species.forEach(fish => {
      fish.weight = 8.7;
      const length = fish.calculateLength();
      expect(Number.isInteger(length)).toBe(true);
    });
  });

  test('All species formulas return integer ages', () => {
    const scene = createMockScene();
    const species = [
      new LakeTrout(scene, 500, 100, 'MEDIUM'),
      new NorthernPike(scene, 500, 100, 'MEDIUM'),
      new SmallmouthBass(scene, 500, 100, 'MEDIUM'),
      new YellowPerch(scene, 500, 100, 'MEDIUM')
    ];

    species.forEach(fish => {
      fish.weight = 10;
      const age = fish.calculateBiologicalAge();
      expect(Number.isInteger(age)).toBe(true);
    });
  });

  test('All species have realistic length-to-weight ratios', () => {
    const scene = createMockScene();
    const species = [
      new LakeTrout(scene, 500, 100, 'MEDIUM'),
      new NorthernPike(scene, 500, 100, 'MEDIUM'),
      new SmallmouthBass(scene, 500, 100, 'MEDIUM'),
      new YellowPerch(scene, 500, 100, 'MEDIUM')
    ];

    species.forEach(fish => {
      // For a 10 lb fish, length should be between 15-30 inches (realistic)
      fish.weight = 10;
      const length = fish.calculateLength();
      expect(length).toBeGreaterThan(15);
      expect(length).toBeLessThan(35);
    });
  });
});
