/**
 * SpeciesData Tests
 *
 * Tests species configuration data and helper functions.
 * Pure data validation and calculation tests with no Phaser dependencies.
 */

import {
  BAITFISH_SPECIES,
  PREDATOR_SPECIES,
  getBaitfishSpecies,
  getPredatorSpecies,
  calculateDietPreference,
  getSpawnableSpecies,
  selectRandomSpecies
} from '../../src/config/SpeciesData.js';

describe('SpeciesData - Baitfish Species Structure', () => {
  test('All expected baitfish species are defined', () => {
    expect(BAITFISH_SPECIES.alewife).toBeDefined();
    expect(BAITFISH_SPECIES.rainbow_smelt).toBeDefined();
    expect(BAITFISH_SPECIES.sculpin).toBeDefined();
    expect(BAITFISH_SPECIES.yellow_perch).toBeDefined();
    expect(BAITFISH_SPECIES.cisco).toBeDefined();
  });

  test('Each baitfish species has required properties', () => {
    const requiredProps = ['name', 'scientificName', 'status', 'sizeRange', 'weightRange'];

    Object.values(BAITFISH_SPECIES).forEach(species => {
      requiredProps.forEach(prop => {
        expect(species).toHaveProperty(prop);
      });
    });
  });

  test('Each baitfish has valid size and weight ranges', () => {
    Object.values(BAITFISH_SPECIES).forEach(species => {
      expect(species.sizeRange.min).toBeGreaterThan(0);
      expect(species.sizeRange.max).toBeGreaterThan(species.sizeRange.min);
      expect(species.weightRange.min).toBeGreaterThan(0);
      expect(species.weightRange.max).toBeGreaterThan(species.weightRange.min);
    });
  });

  test('Each baitfish has valid depth ranges', () => {
    Object.values(BAITFISH_SPECIES).forEach(species => {
      expect(species.depthRange.min).toBeGreaterThanOrEqual(0);
      expect(species.depthRange.max).toBeGreaterThan(species.depthRange.min);
    });
  });

  test('Each baitfish has valid school sizes', () => {
    Object.values(BAITFISH_SPECIES).forEach(species => {
      expect(species.schoolSize.min).toBeGreaterThan(0);
      expect(species.schoolSize.max).toBeGreaterThan(species.schoolSize.min);
    });
  });

  test('Each baitfish has speed properties', () => {
    Object.values(BAITFISH_SPECIES).forEach(species => {
      expect(species.speed.base).toBeGreaterThan(0);
      expect(species.speed.panic).toBeGreaterThan(species.speed.base);
    });
  });

  test('Each baitfish has color and appearance', () => {
    Object.values(BAITFISH_SPECIES).forEach(species => {
      expect(species.color).toBeDefined();
      expect(typeof species.color).toBe('number');
      expect(species.appearance).toBeDefined();
      expect(species.appearance.bodyShape).toBeDefined();
    });
  });

  test('Each baitfish has game mechanics properties', () => {
    Object.values(BAITFISH_SPECIES).forEach(species => {
      expect(species.nutritionValue).toBeGreaterThan(0);
      expect(species.catchDifficulty).toBeDefined();
      expect(species.rarity).toBeDefined();
    });
  });
});

describe('SpeciesData - Predator Species Structure', () => {
  test('All expected predator species are defined', () => {
    expect(PREDATOR_SPECIES.lake_trout).toBeDefined();
    expect(PREDATOR_SPECIES.northern_pike).toBeDefined();
    expect(PREDATOR_SPECIES.smallmouth_bass).toBeDefined();
    expect(PREDATOR_SPECIES.yellow_perch_large).toBeDefined();
  });

  test('Each predator has required properties', () => {
    const requiredProps = ['name', 'scientificName', 'status', 'spawnWeight', 'sizeCategories'];

    Object.values(PREDATOR_SPECIES).forEach(species => {
      requiredProps.forEach(prop => {
        expect(species).toHaveProperty(prop);
      });
    });
  });

  test('Each predator has valid spawn weights', () => {
    Object.values(PREDATOR_SPECIES).forEach(species => {
      expect(species.spawnWeight).toBeGreaterThan(0);
      expect(species.spawnWeight).toBeLessThanOrEqual(100);
    });
  });

  test('Spawn weights sum to 100', () => {
    const totalWeight = Object.values(PREDATOR_SPECIES).reduce(
      (sum, species) => sum + species.spawnWeight,
      0
    );
    expect(totalWeight).toBe(100);
  });

  test('Each predator has all size categories', () => {
    const requiredCategories = ['small', 'medium', 'large', 'trophy'];

    Object.values(PREDATOR_SPECIES).forEach(species => {
      requiredCategories.forEach(category => {
        expect(species.sizeCategories).toHaveProperty(category);
      });
    });
  });

  test('Size categories have increasing weight ranges', () => {
    Object.values(PREDATOR_SPECIES).forEach(species => {
      const small = species.sizeCategories.small;
      const medium = species.sizeCategories.medium;
      const large = species.sizeCategories.large;
      const trophy = species.sizeCategories.trophy;

      expect(medium.weightRange[0]).toBeGreaterThanOrEqual(small.weightRange[1]);
      expect(large.weightRange[0]).toBeGreaterThanOrEqual(medium.weightRange[1]);
      expect(trophy.weightRange[0]).toBeGreaterThanOrEqual(large.weightRange[1]);
    });
  });

  test('Size categories have increasing length ranges', () => {
    Object.values(PREDATOR_SPECIES).forEach(species => {
      const small = species.sizeCategories.small;
      const medium = species.sizeCategories.medium;
      const large = species.sizeCategories.large;
      const trophy = species.sizeCategories.trophy;

      expect(medium.lengthRange[0]).toBeGreaterThanOrEqual(small.lengthRange[1]);
      expect(large.lengthRange[0]).toBeGreaterThanOrEqual(medium.lengthRange[1]);
      expect(trophy.lengthRange[0]).toBeGreaterThanOrEqual(large.lengthRange[1]);
    });
  });

  test('Each predator has temperature preferences', () => {
    Object.values(PREDATOR_SPECIES).forEach(species => {
      expect(species.tempPreference).toBeDefined();
      expect(species.tempPreference.optimal).toBeDefined();
      expect(species.tempPreference.min).toBeLessThan(species.tempPreference.optimal);
      expect(species.tempPreference.max).toBeGreaterThan(species.tempPreference.optimal);
      expect(species.tempPreference.lethal).toBeGreaterThan(species.tempPreference.max);
    });
  });

  test('Each predator has diet preferences', () => {
    Object.values(PREDATOR_SPECIES).forEach(species => {
      expect(species.dietPreferences).toBeDefined();
      expect(typeof species.dietPreferences).toBe('object');

      // Diet preferences should sum to approximately 1.0
      const dietSum = Object.values(species.dietPreferences).reduce((sum, val) => sum + val, 0);
      expect(dietSum).toBeGreaterThan(0.9);
      expect(dietSum).toBeLessThanOrEqual(1.1);
    });
  });

  test('Each predator has behavior characteristics', () => {
    Object.values(PREDATOR_SPECIES).forEach(species => {
      expect(species.behavior).toBeDefined();
      expect(species.behavior.feedingPeriods).toBeDefined();
      expect(Array.isArray(species.behavior.feedingPeriods)).toBe(true);
    });
  });

  test('Each predator has fight characteristics', () => {
    Object.values(PREDATOR_SPECIES).forEach(species => {
      expect(species.fightCharacteristics).toBeDefined();
      expect(species.fightCharacteristics.initialRun).toBeDefined();
      expect(species.fightCharacteristics.tactics).toBeDefined();
      expect(species.fightCharacteristics.difficulty).toBeDefined();
    });
  });
});

describe('SpeciesData - Lake Trout Specifics', () => {
  test('Lake trout is defined correctly', () => {
    const lakeTrout = PREDATOR_SPECIES.lake_trout;

    expect(lakeTrout.name).toBe('Lake Trout');
    expect(lakeTrout.scientificName).toBe('Salvelinus namaycush');
    expect(lakeTrout.spawnWeight).toBe(30);
  });

  test('Lake trout prefers cold water', () => {
    const lakeTrout = PREDATOR_SPECIES.lake_trout;

    expect(lakeTrout.tempPreference.optimal).toBe(50);
    expect(lakeTrout.tempPreference.max).toBe(52);
  });

  test('Lake trout has deeper depth preferences than other species', () => {
    const lakeTrout = PREDATOR_SPECIES.lake_trout;
    const pike = PREDATOR_SPECIES.northern_pike;

    expect(lakeTrout.depthPreference.summer[0]).toBeGreaterThan(pike.depthPreference.summer[0]);
  });

  test('Lake trout primary diet is alewife', () => {
    const lakeTrout = PREDATOR_SPECIES.lake_trout;

    expect(lakeTrout.dietPreferences.alewife).toBe(0.55);
    expect(lakeTrout.dietPreferences.alewife).toBeGreaterThan(lakeTrout.dietPreferences.rainbow_smelt);
  });
});

describe('SpeciesData - Species Differentiation', () => {
  test('Lake trout and northern pike have different hunting styles', () => {
    const lakeTrout = PREDATOR_SPECIES.lake_trout;
    const pike = PREDATOR_SPECIES.northern_pike;

    expect(lakeTrout.behavior.ambushAndPursuit).toBe(true);
    expect(pike.behavior.huntingStyle).toBe('ambush');
  });

  test('Yellow perch is easiest to catch', () => {
    const perch = PREDATOR_SPECIES.yellow_perch_large;

    expect(perch.fightCharacteristics.difficulty).toBe('easy');
    expect(perch.spawnWeight).toBe(40); // Most abundant
  });

  test('Smallmouth bass is most acrobatic', () => {
    const smallmouth = PREDATOR_SPECIES.smallmouth_bass;

    expect(smallmouth.fightCharacteristics.acrobatic).toBe(true);
    expect(smallmouth.fightCharacteristics.jumpProbability).toBeDefined();
  });

  test('Northern pike has explosive strikes', () => {
    const pike = PREDATOR_SPECIES.northern_pike;

    expect(pike.fightCharacteristics.initialRun).toBe('explosive');
    expect(pike.behavior.ambushBehavior).toBeDefined();
  });
});

describe('SpeciesData - Helper Functions', () => {
  test('getBaitfishSpecies returns correct species', () => {
    const alewife = getBaitfishSpecies('alewife');
    expect(alewife.name).toBe('Alewife');

    const smelt = getBaitfishSpecies('rainbow_smelt');
    expect(smelt.name).toBe('Rainbow Smelt');
  });

  test('getBaitfishSpecies returns default for invalid species', () => {
    const invalid = getBaitfishSpecies('invalid_species');
    expect(invalid).toBeDefined();
    expect(invalid.name).toBe('Alewife'); // Default
  });

  test('getPredatorSpecies returns correct species', () => {
    const lakeTrout = getPredatorSpecies('lake_trout');
    expect(lakeTrout.name).toBe('Lake Trout');

    const pike = getPredatorSpecies('northern_pike');
    expect(pike.name).toBe('Northern Pike');
  });

  test('getPredatorSpecies returns default for invalid species', () => {
    const invalid = getPredatorSpecies('invalid_species');
    expect(invalid).toBeDefined();
    expect(invalid.name).toBe('Lake Trout'); // Default
  });

  test('calculateDietPreference returns correct values', () => {
    const preference = calculateDietPreference('lake_trout', 'alewife');
    expect(preference).toBe(0.55);

    const lowPreference = calculateDietPreference('lake_trout', 'cisco');
    expect(lowPreference).toBe(0.04);
  });

  test('calculateDietPreference returns low default for invalid prey', () => {
    const preference = calculateDietPreference('lake_trout', 'invalid_prey');
    expect(preference).toBe(0.1);
  });

  test('getSpawnableSpecies returns all predators with spawn weights', () => {
    const spawnable = getSpawnableSpecies();

    expect(spawnable.length).toBe(4);
    expect(spawnable.every(s => s.weight > 0)).toBe(true);
    expect(spawnable.every(s => s.name)).toBe(true);
    expect(spawnable.every(s => s.data)).toBe(true);
  });

  test('getSpawnableSpecies returns species with correct weights', () => {
    const spawnable = getSpawnableSpecies();

    const lakeTrout = spawnable.find(s => s.name === 'lake_trout');
    const perch = spawnable.find(s => s.name === 'yellow_perch_large');

    expect(lakeTrout.weight).toBe(30);
    expect(perch.weight).toBe(40);
  });

  test('getSpawnableSpecies weights sum to 100', () => {
    const spawnable = getSpawnableSpecies();
    const totalWeight = spawnable.reduce((sum, s) => sum + s.weight, 0);

    expect(totalWeight).toBe(100);
  });
});

describe('SpeciesData - Random Species Selection', () => {
  test('selectRandomSpecies returns a valid species', () => {
    const species = selectRandomSpecies();
    expect(PREDATOR_SPECIES[species]).toBeDefined();
  });

  test('selectRandomSpecies distribution matches spawn weights', () => {
    // Run many selections to test distribution
    const selections = {};
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      const species = selectRandomSpecies();
      selections[species] = (selections[species] || 0) + 1;
    }

    // Check that yellow_perch_large (40% weight) is most common
    expect(selections.yellow_perch_large).toBeGreaterThan(selections.lake_trout);
    expect(selections.yellow_perch_large).toBeGreaterThan(selections.northern_pike);

    // Check that distribution is roughly correct (within 5% for large sample)
    const perchPercent = (selections.yellow_perch_large / iterations) * 100;
    expect(perchPercent).toBeGreaterThan(35);
    expect(perchPercent).toBeLessThan(45);

    const troutPercent = (selections.lake_trout / iterations) * 100;
    expect(troutPercent).toBeGreaterThan(25);
    expect(troutPercent).toBeLessThan(35);
  });

  test('selectRandomSpecies never returns undefined', () => {
    for (let i = 0; i < 100; i++) {
      const species = selectRandomSpecies();
      expect(species).toBeDefined();
      expect(typeof species).toBe('string');
    }
  });
});

describe('SpeciesData - Cisco Special Properties', () => {
  test('Cisco is marked as rare', () => {
    const cisco = BAITFISH_SPECIES.cisco;

    expect(cisco.rarity).toBe('rare');
    expect(cisco.special.legendary).toBe(true);
    expect(cisco.special.spawnRateMultiplier).toBe(0.1);
  });

  test('Cisco has higher nutrition value than common baitfish', () => {
    const cisco = BAITFISH_SPECIES.cisco;
    const alewife = BAITFISH_SPECIES.alewife;

    expect(cisco.nutritionValue).toBeGreaterThan(alewife.nutritionValue);
  });
});

describe('SpeciesData - Temperature Ranges', () => {
  test('Lake trout prefers coldest water', () => {
    const lakeTrout = PREDATOR_SPECIES.lake_trout;
    const pike = PREDATOR_SPECIES.northern_pike;
    const bass = PREDATOR_SPECIES.smallmouth_bass;

    expect(lakeTrout.tempPreference.optimal).toBeLessThan(pike.tempPreference.optimal);
    expect(lakeTrout.tempPreference.optimal).toBeLessThan(bass.tempPreference.optimal);
  });

  test('Smallmouth bass and yellow perch prefer warmer water', () => {
    const bass = PREDATOR_SPECIES.smallmouth_bass;
    const perch = PREDATOR_SPECIES.yellow_perch_large;

    expect(bass.tempPreference.optimal).toBe(68);
    expect(perch.tempPreference.optimal).toBe(68);
  });
});

describe('SpeciesData - Activity Patterns', () => {
  test('All predators have activity by time patterns', () => {
    const requiredTimes = ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'night'];

    Object.values(PREDATOR_SPECIES).forEach(species => {
      expect(species.activityByTime).toBeDefined();
      requiredTimes.forEach(time => {
        expect(species.activityByTime[time]).toBeDefined();
        expect(species.activityByTime[time]).toBeGreaterThan(0);
      });
    });
  });

  test('Dawn and dusk are peak feeding times for most species', () => {
    const lakeTrout = PREDATOR_SPECIES.lake_trout;
    const pike = PREDATOR_SPECIES.northern_pike;
    const bass = PREDATOR_SPECIES.smallmouth_bass;

    expect(lakeTrout.activityByTime.dawn).toBeGreaterThan(lakeTrout.activityByTime.midday);
    expect(pike.activityByTime.dusk).toBeGreaterThan(pike.activityByTime.midday);
    expect(bass.activityByTime.dawn).toBeGreaterThan(bass.activityByTime.midday);
  });

  test('Yellow perch is active all day', () => {
    const perch = PREDATOR_SPECIES.yellow_perch_large;

    // Perch should have relatively consistent activity throughout day
    const middayActivity = perch.activityByTime.midday;
    const dawnActivity = perch.activityByTime.dawn;

    const activityDifference = dawnActivity - middayActivity;
    expect(activityDifference).toBeLessThan(0.5); // Less variation than other species
  });
});

describe('SpeciesData - Baitfish Behavior Patterns', () => {
  test('Rainbow smelt has seasonal behavior', () => {
    const smelt = BAITFISH_SPECIES.rainbow_smelt;

    expect(smelt.seasonal).toBeDefined();
    expect(smelt.seasonal.spring).toBeDefined();
    expect(smelt.seasonal.summer).toBeDefined();
  });

  test('Sculpin is bottom-dwelling and nocturnal', () => {
    const sculpin = BAITFISH_SPECIES.sculpin;

    expect(sculpin.behavior.preferredHabitat).toBe('benthic');
    expect(sculpin.behavior.activityPattern).toBe('nocturnal');
    expect(sculpin.behavior.hidesDuringDay).toBe(true);
  });

  test('Different baitfish have different panic responses', () => {
    const alewife = BAITFISH_SPECIES.alewife;
    const smelt = BAITFISH_SPECIES.rainbow_smelt;
    const sculpin = BAITFISH_SPECIES.sculpin;

    expect(alewife.behavior.panicResponse).toBe('scatter');
    expect(smelt.behavior.panicResponse).toBe('dive');
    expect(sculpin.behavior.panicResponse).toBe('hide');
  });
});

describe('SpeciesData - Size Category Multipliers', () => {
  test('Smaller fish are faster and more aggressive', () => {
    Object.values(PREDATOR_SPECIES).forEach(species => {
      const small = species.sizeCategories.small;
      const trophy = species.sizeCategories.trophy;

      expect(small.speedMultiplier).toBeGreaterThanOrEqual(trophy.speedMultiplier);
      expect(small.aggressivenessMultiplier).toBeGreaterThanOrEqual(trophy.aggressivenessMultiplier);
    });
  });

  test('Larger fish are more cautious', () => {
    Object.values(PREDATOR_SPECIES).forEach(species => {
      const small = species.sizeCategories.small;
      const trophy = species.sizeCategories.trophy;

      expect(trophy.cautiousness).toBeGreaterThanOrEqual(small.cautiousness);
    });
  });
});

describe('SpeciesData - Integration Tests', () => {
  test('Predator diet preferences match available baitfish', () => {
    Object.values(PREDATOR_SPECIES).forEach(predator => {
      Object.keys(predator.dietPreferences).forEach(preyKey => {
        if (preyKey !== 'cannibalism' && preyKey !== 'insects' && preyKey !== 'crayfish' && preyKey !== 'small_perch') {
          expect(BAITFISH_SPECIES[preyKey]).toBeDefined();
        }
      });
    });
  });

  test('All baitfish are preferred by at least one predator', () => {
    Object.keys(BAITFISH_SPECIES).forEach(baitfishKey => {
      const isPreferredBySomePredator = Object.values(PREDATOR_SPECIES).some(predator =>
        predator.dietPreferences[baitfishKey] && predator.dietPreferences[baitfishKey] > 0
      );

      expect(isPreferredBySomePredator).toBe(true);
    });
  });

  test('Species depth ranges are reasonable', () => {
    // Baitfish should have reasonable depth ranges
    Object.values(BAITFISH_SPECIES).forEach(species => {
      expect(species.depthRange.max).toBeLessThanOrEqual(150);
    });

    // Predators should have depth preferences that overlap with prey
    Object.values(PREDATOR_SPECIES).forEach(species => {
      Object.values(species.depthPreference).forEach(depthRange => {
        expect(depthRange[0]).toBeLessThan(depthRange[1]);
        expect(depthRange[1]).toBeLessThanOrEqual(150);
      });
    });
  });
});
