import GameConfig from '../../config/GameConfig.js';
import { Constants, Utils } from '../../utils/Constants.js';
import { FishSprite } from '../../sprites/FishSprite.js';
import { CrayfishSprite } from '../../sprites/CrayfishSprite.js';
import { ZooplanktonSprite } from '../../sprites/ZooplanktonSprite.js';
import { getOrganismData } from '../../config/OrganismData.js';
// Legacy imports for compatibility during transition
import { getBaitfishSpecies, selectRandomSpecies, getPredatorSpecies } from '../../config/SpeciesData.js';

/**
 * SpawningSystem - Handles all entity spawning logic
 *
 * @module scenes/systems/SpawningSystem
 *
 * Responsibilities:
 * - Spawn fish at appropriate depths and locations
 * - Spawn baitfish clouds with varied sizes
 * - Spawn zooplankton near lake bottom
 * - Spawn and maintain crayfish population on bottom
 * - Handle emergency fish spawning in arcade mode
 * - Manage spawn rates and entity limits
 *
 * @example
 * const spawningSystem = new SpawningSystem(scene);
 * spawningSystem.update(time, delta);
 */
export class SpawningSystem {
    /**
     * @param {Phaser.Scene} scene - The game scene
     */
    constructor(scene) {
        this.scene = scene;
        this.emergencyFishSpawned = false;

        // Simple population targets
        this.MAX_BAITFISH = 60; // Reduced back to reasonable level
        this.MAX_PREDATORS = 8;
        this.MIN_BAIT_FOR_PREDATORS = 20; // Require more bait before spawning predators

        // Spawn initial crayfish population (3 on load)
        this.spawnInitialCrayfish();

        // Spawn initial zooplankton (food for baitfish)
        this.spawnInitialZooplankton();

        // Spawn initial baitfish schools and predators swimming in from sides
        this.spawnInitialEcosystem();

        // Set up spawn timers
        this.setupSpawnTimers();
    }

    setupSpawnTimers() {
        // Spawn predator fish every 2 seconds
        this.scene.time.addEvent({
            delay: 2000,
            callback: () => this.trySpawnFish(),
            callbackScope: this,
            loop: true
        });

        // Spawn baitfish schools every 3 seconds (more frequent than before)
        this.scene.time.addEvent({
            delay: 3000,
            callback: () => this.trySpawnBaitfishSchool(),
            callbackScope: this,
            loop: true
        });

        // Spawn zooplankton every 0.75 seconds (doubled rate from 1.5s)
        this.scene.time.addEvent({
            delay: 750,
            callback: () => this.trySpawnZooplankton(),
            callbackScope: this,
            loop: true
        });

        // Maintain crayfish population every 30 seconds
        this.scene.time.addEvent({
            delay: 30000,
            callback: () => this.maintainCrayfishPopulation(),
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Try to spawn a fish based on current conditions
     * @returns {Fish|null} The spawned fish or null if spawn failed
     */
    trySpawnFish() {
        // Count current populations
        const predatorCount = this.scene.fishes.length;
        const baitCount = this.countBaitfish();

        // Don't spawn if we're at max predators
        if (predatorCount >= this.MAX_PREDATORS) {
            return null;
        }

        // Only spawn predators if there's enough bait
        if (baitCount < this.MIN_BAIT_FOR_PREDATORS) {
            return null;
        }

        // Random spawn chance (25% - increased from 15%)
        if (Math.random() > 0.25) {
            return null;
        }

        // Get player position in world coordinates (depends on fishing type)
        // In nature simulation mode, there is no player, so spawn randomly across screen
        let playerWorldX;
        let isNatureSimulation = false;

        // Always use center of screen as player position (CURRENT width for resize support)
        playerWorldX = this.scene.scale.width / 2;

        // Select species based on Lake Champlain distribution
        // Lake Trout: 50%, Northern Pike: 25%, Smallmouth Bass: 25%
        let species = 'lake_trout';
        const speciesRoll = Math.random();
        if (speciesRoll < 0.50) {
            species = 'lake_trout'; // Dominant coldwater predator
        } else if (speciesRoll < 0.75) {
            species = 'northern_pike'; // Aggressive shallow-water ambusher
        } else {
            species = 'smallmouth_bass'; // Structure-oriented fighter
        }

        // Determine fish spawn depth based on species-specific behavior
        let depth;
        const tempFactor = (this.scene.waterTemp - 38) / 7; // 0 to 1 based on temp range

        if (species === 'northern_pike') {
            // Pike prefer shallow, structure-oriented water
            // Always spawn in top 30 feet regardless of temperature
            depth = Utils.randomBetween(8, 30);
        } else if (species === 'smallmouth_bass') {
            // Smallmouth bass prefer mid-depth rocky structure
            // 10-40 feet, slightly deeper in warmer water
            if (tempFactor < 0.5) {
                depth = Utils.randomBetween(10, 30); // Shallower in cold water
            } else {
                depth = Utils.randomBetween(15, 40); // Deeper in warm water
            }
        } else {
            // Lake trout prefer different depths based on temperature
            if (tempFactor < 0.3) {
                // Cold water - fish can be shallower
                depth = Utils.randomBetween(15, 80);
            } else {
                // Warmer water - fish go deeper
                depth = Utils.randomBetween(30, 120);
            }
        }

        // Check if water is deep enough for this fish
        const actualDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
        const minRequiredDepth = species === 'northern_pike' ? 15 :
                                 species === 'smallmouth_bass' ? 20 : 30; // Lake trout need deeper water

        if (actualDepth < minRequiredDepth) {
            // Water too shallow for this species, skip spawning
            console.log(`⚠️ Water too shallow (${actualDepth}ft) for ${species} (needs ${minRequiredDepth}ft)`);
            return null;
        }

        // Constrain depth to actual water depth (spawn at least 5ft above bottom)
        const maxFishDepth = Math.max(10, actualDepth - 5);
        depth = Math.min(depth, maxFishDepth);

        // Determine fish size
        const sizeRoll = Math.random();
        let size;
        if (sizeRoll < 0.5) {
            size = 'SMALL';
        } else if (sizeRoll < 0.8) {
            size = 'MEDIUM';
        } else if (sizeRoll < 0.95) {
            size = 'LARGE';
        } else {
            size = 'TROPHY';
        }

        // Spawn randomly within the visible game area (CURRENT width for resize support)
        // Fish will fade in using Phaser FX
        const canvasWidth = this.scene.scale.width;
        const worldX = Utils.randomBetween(100, canvasWidth - 100);

        // Random initial swim direction
        const fromLeft = Math.random() < 0.5;

        // Use dynamic depth scale from scene
        const depthScale = this.scene.depthConverter.depthScale;
        let y = depth * depthScale;

        // Validate Y is within canvas bounds (safety check)
        const canvasHeight = this.scene.scale.height;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
        if (y > waterFloorY) {
            console.warn(`⚠️ Spawn Y (${y.toFixed(1)}) exceeds water floor (${waterFloorY.toFixed(1)}) for depth ${depth}ft - clamping to floor`);
            y = waterFloorY;
        }

        // Create the fish using FishSprite with pooling
        const fish = new FishSprite(this.scene, worldX, y, size, species);

        // Set initial movement direction
        if (fish.ai) {
            fish.ai.idleDirection = fromLeft ? 1 : -1;
        }

        // Add to legacy array for compatibility (will be removed later)
        this.scene.fishes.push(fish);
        return fish;
    }

    /**
    /**
     * Try to spawn a baitfish school
     * @returns {boolean} True if school was spawned
     */
    trySpawnBaitfishSchool() {
        const baitCount = this.countBaitfish();
        const schoolCount = this.scene.schools ? this.scene.schools.length : 0;

        // Don't spawn if we're at max baitfish
        if (baitCount >= this.MAX_BAITFISH) {
            console.log(`🚫 Baitfish spawn blocked: at max (${baitCount}/${this.MAX_BAITFISH})`);
            return false;
        }

        // Random spawn chance (50% - increased to keep population healthy)
        if (Math.random() > 0.5) {
            // DEBUG: Log failed spawn attempts when population is low
            if (baitCount < 10) {
                console.log(`🎲 Baitfish spawn chance failed (${baitCount}/${this.MAX_BAITFISH})`);
            }
            return false;
        }

        console.log(`✅ Spawning baitfish school (current: ${baitCount}/${this.MAX_BAITFISH}, ${schoolCount} schools)`);

        // Select species based on weighted spawn rates (realistic Lake Champlain distribution)
        // NOTE: Sculpin excluded - they are solitary bottom-dwellers, not schooling fish
        let speciesType = 'alewife';
        const speciesRoll = Math.random();
        if (speciesRoll < 0.44) {
            speciesType = 'alewife'; // Most abundant (invasive species)
        } else if (speciesRoll < 0.78) {
            speciesType = 'rainbow_smelt'; // Common, preferred prey
        } else {
            speciesType = 'yellow_perch'; // Common in shallows
        }

        // Rare cisco spawn (10% of the time, only in deep water)
        if (Math.random() < 0.10 && speciesType === 'alewife') {
            speciesType = 'cisco';
        }

        // Load species data to determine spawn parameters
        const speciesData = getBaitfishSpecies(speciesType);

        // Determine school size based on species schooling behavior
        let schoolSize;
        const schoolSizeRange = speciesData.schoolSize;

        if (speciesData.schoolingDensity === 'none') {
            // Solitary or small groups (sculpin)
            schoolSize = Math.floor(Utils.randomBetween(schoolSizeRange.min, schoolSizeRange.max));
        } else {
            // Schooling species - use weighted distribution
            const sizeRoll = Math.random();
            if (sizeRoll < 0.6) {
                // Small schools
                schoolSize = Math.floor(Utils.randomBetween(schoolSizeRange.min, schoolSizeRange.min + 10));
            } else if (sizeRoll < 0.9) {
                // Medium schools
                schoolSize = Math.floor(Utils.randomBetween(schoolSizeRange.min + 10, schoolSizeRange.max));
            } else {
                // Large schools (massive aggregations) - capped at 100 max
                const maxCloudSize = Math.min(100, schoolSizeRange.max + 20);
                schoolSize = Math.floor(Utils.randomBetween(schoolSizeRange.max, maxCloudSize));
            }
        }

        // Spawn depth based on species preferences
        const depthRange = speciesData.depthRange;
        let depth = Utils.randomBetween(depthRange.min, depthRange.max);

        // Species-specific depth tweaks
        if (speciesType === 'sculpin') {
            depth = Utils.randomBetween(80, 120);
        } else if (speciesType === 'cisco') {
            depth = Utils.randomBetween(60, 100);
        } else if (speciesType === 'yellow_perch') {
            depth = Utils.randomBetween(10, 40);
        } else if (speciesType === 'rainbow_smelt') {
            depth = Utils.randomBetween(30, 80);
        }

        // Check if water is deep enough
        const actualDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
        const minRequiredDepth = speciesType === 'yellow_perch' ? 15 : 25;

        if (actualDepth < minRequiredDepth) {
            console.log(`⚠️ Water too shallow (${actualDepth}ft) for ${speciesType} (needs ${minRequiredDepth}ft)`);
            return false;
        }

        // Constrain depth to actual water depth
        const maxBaitfishDepth = Math.max(10, actualDepth - 5);
        depth = Math.min(depth, maxBaitfishDepth);

        // Always spawn FAR off-screen so schools swim into view from sides
        // Use CURRENT canvas width (handles window resize)
        const canvasWidth = this.scene.scale.width;
        const playerWorldX = canvasWidth / 2;
        const fromLeft = Math.random() < 0.5;
        // Spawn distance relative to screen width (1-1.5x half screen width)
        const baseSpawnDistance = canvasWidth / 2;
        const spawnDistance = Utils.randomBetween(baseSpawnDistance, baseSpawnDistance * 1.5);

        const worldX = fromLeft ?
            (playerWorldX - canvasWidth / 2 - spawnDistance) :
            (playerWorldX + canvasWidth / 2 + spawnDistance);

        // Convert depth to screen Y
        const depthScale = this.scene.depthConverter.depthScale;
        let y = depth * depthScale;

        // Validate Y is within canvas bounds (safety check)
        const canvasHeight = this.scene.scale.height;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
        if (y > waterFloorY) {
            console.warn(`⚠️ Baitfish spawn Y (${y.toFixed(1)}) exceeds water floor (${waterFloorY.toFixed(1)}) for depth ${depth}ft - clamping to floor`);
            y = waterFloorY;
        }

        // Spawn the school using GameScene's method
        this.scene.spawnBaitfishSchool(worldX, y, schoolSize, speciesType);

        // Log rare species spawns
        if (speciesType === 'cisco') {
            console.log('🐟 RARE: Cisco school spotted at', Math.floor(depth), 'feet!');
        }

        return true;
    }

    /**
     * Try to spawn zooplankton near the bottom
     * @returns {number} Number of zooplankton spawned
     */
    trySpawnZooplankton() {
        // Increased maximum for abundant food source (gives baitfish reason to stay)
        if (this.scene.zooplankton.length >= 200) {
            return 0;
        }

        // Get player world position
        // In nature simulation mode, spawn randomly across screen
        let playerWorldX;
        let isNatureSimulation = false;

        // Always use center of screen as player position (CURRENT width for resize support)
        playerWorldX = this.scene.scale.width / 2;

        // Spawn 3-6 zooplankton at a time (increased to create abundant food)
        const spawnCount = Math.floor(Utils.randomBetween(3, 6));

        for (let i = 0; i < spawnCount; i++) {
            // Spawn at random position around player in world coordinates
            // In nature simulation mode, spawn randomly across screen
            let worldX;

            if (isNatureSimulation) {
                const canvasWidth = this.scene.scale.width;
                const screenLeft = -200;
                const screenRight = canvasWidth + 200;
                worldX = Utils.randomBetween(screenLeft, screenRight);
            } else {
                // Doubled spawn range from -300/+300 to -600/+600
                const offsetX = Utils.randomBetween(-600, 600);
                worldX = playerWorldX + offsetX;
            }

            // Spawn heavily weighted toward bottom, with some at mid-depths
            // 70% spawn at bottom (85-100 feet), 30% at mid-depth (60-85 feet)
            let depth;
            if (Math.random() < 0.7) {
                // Bottom layer - abundant zooplankton near lake floor
                depth = Utils.randomBetween(85, 100);
            } else {
                // Mid-depth layer - less common but available for shallow feeders
                depth = Utils.randomBetween(60, 85);
            }

            // Use dynamic depth scale from scene
            const depthScale = this.scene.sonarDisplay ?
                this.scene.sonarDisplay.getDepthScale() :
                GameConfig.DEPTH_SCALE;
            let y = depth * depthScale;

            // Validate Y is within canvas bounds (safety check)
            const canvasHeight = this.scene.scale.height;
            const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
            if (y > waterFloorY) {
                // Silently clamp to floor (warning was polluting logs)
                y = waterFloorY;
            }

            // Create zooplankton using new sprite class
            const zp = new ZooplanktonSprite(this.scene, worldX, y);
            this.scene.zooplankton.push(zp);
        }

        return spawnCount;
    }

    /**
     * Spawn initial crayfish population (3 on game load)
     */
    spawnInitialCrayfish() {
        const initialCount = 3;

        for (let i = 0; i < initialCount; i++) {
            this.spawnSingleCrayfish();
        }

        console.log(`🦞 Spawned ${initialCount} initial crayfish`);
    }

    /**
     * Spawn initial zooplankton population (80-120 on game load - abundant food source)
     */
    spawnInitialZooplankton() {
        const initialCount = Math.floor(Utils.randomBetween(80, 120));

        for (let i = 0; i < initialCount; i++) {
            this.trySpawnZooplankton();
        }

        console.log(`🦠 Spawned ${initialCount} initial zooplankton`);
    }

    /**
     * Spawn initial ecosystem when game starts
     * Spawns 4-6 baitfish schools and 4-6 predators IMMEDIATELY
     */
    spawnInitialEcosystem() {
        // Spawn 4-6 baitfish schools from sides - synchronously (no delay!)
        const schoolCount = Math.floor(Utils.randomBetween(4, 6));

        for (let i = 0; i < schoolCount; i++) {
            this.spawnSchoolFromSide();
        }

        // Spawn 4-6 predators from sides - synchronously (increased from 2-3)
        const predatorCount = Math.floor(Utils.randomBetween(4, 6));

        for (let i = 0; i < predatorCount; i++) {
            this.spawnPredatorFromSide();
        }

        console.log(`🌊 Initial ecosystem: ${schoolCount} baitfish schools, ${predatorCount} predators spawned`);
    }

    /**
     * Spawn a baitfish school from the left or right edge of screen
     */
    spawnSchoolFromSide() {
        // Select species
        // NOTE: Sculpin excluded - they are solitary bottom-dwellers, not schooling fish
        let speciesType = 'alewife';
        const speciesRoll = Math.random();
        if (speciesRoll < 0.44) {
            speciesType = 'alewife';
        } else if (speciesRoll < 0.78) {
            speciesType = 'rainbow_smelt';
        } else {
            speciesType = 'yellow_perch';
        }

        const speciesData = getBaitfishSpecies(speciesType);

        // Determine school size
        const schoolSizeRange = speciesData.schoolSize;
        const schoolSize = Math.floor(Utils.randomBetween(schoolSizeRange.min, schoolSizeRange.max));

        // Spawn depth
        const depthRange = speciesData.depthRange;
        let depth = Utils.randomBetween(depthRange.min, depthRange.max);

        const actualDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
        const maxBaitfishDepth = Math.max(10, actualDepth - 5);
        depth = Math.min(depth, maxBaitfishDepth);

        // Spawn randomly within the visible game area (CURRENT width for resize support)
        // Fish will fade in using Phaser FX
        const canvasWidth = this.scene.scale.width;
        const worldX = Utils.randomBetween(100, canvasWidth - 100);

        // Convert depth to screen Y
        const depthScale = this.scene.depthConverter.depthScale;
        let y = depth * depthScale;

        // Validate Y is within canvas bounds (safety check)
        const canvasHeight = this.scene.game.canvas.height;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
        if (y > waterFloorY) {
            console.warn(`⚠️ Baitfish spawn Y (${y.toFixed(1)}) exceeds water floor (${waterFloorY.toFixed(1)}) for depth ${depth}ft - clamping to floor`);
            y = waterFloorY;
        }

        // Spawn the school
        this.scene.spawnBaitfishSchool(worldX, y, schoolSize, speciesType);

        console.log(`🐟 ${speciesType} school (${schoolSize}) spawning`);
    }

    /**
     * Spawn a predator from the left or right edge of screen
     * Spawns appropriate predator based on game mode depth
     */
    spawnPredatorFromSide() {
        const actualDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;

        // Select appropriate predator for depth
        let species = 'lake_trout'; // Default

        if (actualDepth <= 25) {
            // Shallow water (Perch mode) - mostly perch, some bass
            species = Math.random() < 0.7 ? 'yellow_perch_large' : 'smallmouth_bass';
        } else if (actualDepth <= 45) {
            // Medium depth (Bass mode) - bass, pike, occasional trout
            const roll = Math.random();
            if (roll < 0.5) {
                species = 'smallmouth_bass';
            } else if (roll < 0.8) {
                species = 'northern_pike';
            } else {
                species = 'lake_trout';
            }
        } else {
            // Deep water (Lake Trout mode) - trout, pike, bass
            const roll = Math.random();
            if (roll < 0.6) {
                species = 'lake_trout';
            } else if (roll < 0.85) {
                species = 'northern_pike';
            } else {
                species = 'smallmouth_bass';
            }
        }

        // Spawn at random depth appropriate for the water depth
        // Don't use species depth range for initial spawns - just scatter them throughout the water column
        let depth = Utils.randomBetween(10, actualDepth - 5);

        // Spawn randomly within the visible game area (CURRENT width for resize support)
        // Fish will fade in using Phaser FX
        const canvasWidth = this.scene.scale.width;
        const worldX = Utils.randomBetween(100, canvasWidth - 100);

        // Convert depth to screen Y
        const depthScale = this.scene.depthConverter.depthScale;
        let y = depth * depthScale;

        // Validate Y is within canvas bounds (safety check)
        const canvasHeight = this.scene.game.canvas.height;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
        if (y > waterFloorY) {
            console.warn(`⚠️ Predator spawn Y (${y.toFixed(1)}) exceeds water floor (${waterFloorY.toFixed(1)}) for depth ${depth}ft - clamping to floor`);
            y = waterFloorY;
        }

        // Random size
        const sizes = ['SMALL', 'MEDIUM', 'LARGE', 'TROPHY'];
        const size = sizes[Math.floor(Math.random() * sizes.length)];

        // Create fish using FishSprite
        const fish = new FishSprite(this.scene, worldX, y, size, species);
        this.scene.fishes.push(fish);

        console.log(`🎣 ${species} (${size}) spawning at ${depth.toFixed(0)}ft`);
    }

    /**
     * Maintain crayfish population (called every 30 seconds)
     * Spawns crayfish to reach maximum of 5 total
     */
    maintainCrayfishPopulation() {
        const maxCrayfish = 5;
        const currentCount = this.scene.crayfish.length;

        if (currentCount < maxCrayfish) {
            const toSpawn = maxCrayfish - currentCount;

            for (let i = 0; i < toSpawn; i++) {
                this.spawnSingleCrayfish();
            }

            console.log(`🦞 Maintained crayfish population: added ${toSpawn}, now ${maxCrayfish} total`);
        }
    }

    /**
     * Spawn a single crayfish on the lake bottom
     * @returns {Crayfish|null} The spawned crayfish or null if spawn failed
     */
    spawnSingleCrayfish() {
        // Get player world position (CURRENT width for resize support)
        let playerWorldX;
        let isNatureSimulation = false;

        // Always use center of screen as player position
        playerWorldX = this.scene.scale.width / 2;

        // Random horizontal position
        let worldX;
        if (isNatureSimulation) {
            const canvasWidth = this.scene.scale.width;
            const screenLeft = -200;
            const screenRight = canvasWidth + 200;
            worldX = Utils.randomBetween(screenLeft, screenRight);
        } else {
            // Spawn around player (wider range than zooplankton)
            const offsetX = Utils.randomBetween(-400, 400);
            worldX = playerWorldX + offsetX;
        }

        // Spawn on the actual bottom depth (use MAX_DEPTH which is the lake's bottom)
        const depth = GameConfig.MAX_DEPTH;

        // Use dynamic depth scale from scene
        const depthScale = this.scene.depthConverter.depthScale;

        // Place crayfish on bottom with same offset as lure uses to appear grounded
        const BOTTOM_OFFSET_PX = 12;
        let y = (depth * depthScale) + BOTTOM_OFFSET_PX;

        // Validate Y is within canvas bounds (safety check)
        const canvasHeight = this.scene.game.canvas.height;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
        if (y > waterFloorY) {
            console.warn(`⚠️ Crayfish spawn Y (${y.toFixed(1)}) exceeds water floor (${waterFloorY.toFixed(1)}) for depth ${depth}ft - clamping to floor`);
            y = waterFloorY;
        }

        // Create crayfish using new sprite class
        const crayfish = new CrayfishSprite(this.scene, worldX, y);
        this.scene.crayfish.push(crayfish);

        return crayfish;
    }

    /**
     * Spawn an emergency fish in arcade mode when time is running out
     * @returns {Fish|null} The emergency fish or null if spawn failed
     */
    spawnEmergencyFish() {
        console.log('Spawning emergency fish!');

        // Get player position in world coordinates (CURRENT width for resize support)
        // In nature simulation mode, there is no player, so spawn randomly across screen
        let playerWorldX;
        let isNatureSimulation = false;

        // Always use center of screen as player position
        const canvasWidth = this.scene.scale.width;
        playerWorldX = canvasWidth / 2;

        // Spawn from random side using world coordinates
        // Use distance relative to screen width
        const fromLeft = Math.random() < 0.5;
        const spawnDistance = canvasWidth * 0.25; // 25% of screen width from center
        const worldX = playerWorldX + (fromLeft ? -spawnDistance : spawnDistance);

        // Use dynamic depth scale from scene
        const depthScale = this.scene.depthConverter.depthScale;

        // Spawn at mid-column depth (preferred lake trout zone)
        let y = Utils.randomBetween(
            GameConfig.DEPTH_ZONES.MID_COLUMN.min * depthScale,
            GameConfig.DEPTH_ZONES.MID_COLUMN.max * depthScale
        );

        // Validate Y is within canvas bounds (safety check)
        const canvasHeight = this.scene.game.canvas.height;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
        if (y > waterFloorY) {
            console.warn(`⚠️ Emergency fish spawn Y (${y.toFixed(1)}) exceeds water floor (${waterFloorY.toFixed(1)}) - clamping to floor`);
            y = waterFloorY;
        }

        // Create fish with max hunger and low health (size MEDIUM for balance)
        // Emergency fish is always lake trout for consistency
        const fish = new FishSprite(this.scene, worldX, y, 'MEDIUM', 'lake_trout');
        fish.hunger = 100; // Max hunger - very motivated!
        fish.health = 30; // Low health makes it easier to catch
        fish.isEmergencyFish = true; // Mark as emergency fish

        // Set initial movement direction toward player
        if (fromLeft) {
            fish.ai.idleDirection = 1; // Swim right (toward player)
        } else {
            fish.ai.idleDirection = -1; // Swim left (toward player)
        }

        this.scene.fishes.push(fish);
        this.emergencyFishSpawned = true;

        // Show notification (reuse canvasWidth from above)
        const text = this.scene.add.text(canvasWidth / 2, 200,
            'HUNGRY FISH APPEARED!',
            {
                fontSize: '20px',
                fontFamily: 'Courier New',
                color: '#ff6600',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            delay: 1000,
            onComplete: () => text.destroy()
        });

        return fish;
    }

    /**
     * Update emergency fish behavior
     * @param {Fish} fish - The emergency fish to update
     */
    updateEmergencyFish(fish) {
        // Emergency fish moves between bait clouds
        // If no target or target is gone, find a new bait cloud
        if (!fish.emergencyTarget || !this.scene.baitfishClouds.includes(fish.emergencyTarget)) {
            // Find nearest bait cloud
            if (this.scene.baitfishClouds.length > 0) {
                let nearestCloud = null;
                let nearestDist = Infinity;

                this.scene.baitfishClouds.forEach(cloud => {
                    const dist = Utils.calculateDistance(fish.x, fish.y, cloud.centerX, cloud.centerY);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestCloud = cloud;
                    }
                });

                fish.emergencyTarget = nearestCloud;
            }
        }

        // Move toward target bait cloud using AI system
        if (fish.emergencyTarget) {
            // Set AI target to the bait cloud
            fish.ai.targetX = fish.emergencyTarget.centerX;
            fish.ai.targetY = fish.emergencyTarget.centerY;
            fish.ai.state = Constants.FISH_STATE.CHASING;

            // Check if passing near the lure - trigger frenzy!
            const lureDist = Utils.calculateDistance(fish.x, fish.y, this.scene.lure.x, this.scene.lure.y);
            if (lureDist < GameConfig.DETECTION_RANGE * 1.5 && !fish.hasTriggeredFrenzy) {
                this.triggerEmergencyFrenzy(fish);
                fish.hasTriggeredFrenzy = true;
            }
        }
    }

    /**
     * Trigger a feeding frenzy caused by emergency fish
     * @param {Fish} emergencyFish - The emergency fish triggering the frenzy
     */
    triggerEmergencyFrenzy(emergencyFish) {
        console.log('Emergency fish passing lure - TRIGGERING FRENZY!');

        // Show notification (CURRENT width for resize support)
        const canvasWidth = this.scene.scale.width;
        const text = this.scene.add.text(canvasWidth / 2, 180,
            'FEEDING FRENZY!',
            {
                fontSize: '24px',
                fontFamily: 'Courier New',
                color: '#ff0000',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            scale: 1.5,
            duration: 2000,
            onComplete: () => text.destroy()
        });

        // Trigger frenzy in all fish within emergency fish's vision range
        this.scene.fishes.forEach(fish => {
            if (fish === emergencyFish) return;
            if (fish.caught) return;

            const dist = Utils.calculateDistance(fish.x, fish.y, emergencyFish.x, emergencyFish.y);

            // Use double the normal detection range for frenzy trigger
            if (dist < GameConfig.DETECTION_RANGE * 2) {
                // Force frenzy state
                fish.inFrenzy = true;
                fish.frenzyTimer = 600; // 10 seconds of frenzy
                fish.frenzyIntensity = 1.0; // Maximum intensity

                // Give fish multiple strike attempts
                fish.ai.maxStrikeAttempts = 3;
                fish.ai.strikeAttempts = 0;

                // Make them immediately interested in the lure
                if (fish.ai.state === Constants.FISH_STATE.IDLE) {
                    fish.ai.state = Constants.FISH_STATE.INTERESTED;
                    fish.ai.decisionCooldown = 50; // Very quick response
                }

                // Visual feedback
                fish.triggerInterestFlash(1.0);

                console.log(`Fish ${fish.getInfo().name} entered feeding frenzy!`);
            }
        });
    }

    /**
     * Update spawning system each frame
     * @param {number} time - Current game time
     * @param {number} delta - Time since last frame
     */
    update(time, delta) {
        // Note: Main spawning is handled by timers in setupSpawnTimers()
        // No per-frame random spawning to avoid redundancy and unpredictability

        // Update emergency fish if any exist
        this.scene.fishes.forEach(fish => {
            if (fish.isEmergencyFish && !fish.caught) {
                this.updateEmergencyFish(fish);
            }
        });
    }

    /**
     * Check if we need to spawn emergency fish (removed - no arcade mode)
     * @returns {boolean} Always false now
     */
    checkEmergencySpawn() {
        // No longer used - arcade mode removed
        return false;
    }

    /**
     * Count total baitfish in all schools
     * @returns {number} Total baitfish count
     */
    countBaitfish() {
        const schoolsArray = this.scene.schools || [];
        let total = 0;
        schoolsArray.forEach(school => {
            if (school && school.members) {
                // Only count ACTIVE and VISIBLE baitfish
                const activeFish = school.members.filter(fish => fish.active && fish.visible);
                total += activeFish.length;
            }
        });
        return total;
    }

    /**
     * Reset the spawning system (for new game)
     */
    reset() {
        this.emergencyFishSpawned = false;
    }

    /**
     * Clean up spawning system
     */
    destroy() {
        // Timers are managed by Phaser scene, no cleanup needed
    }
}

export default SpawningSystem;
