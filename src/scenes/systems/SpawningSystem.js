import GameConfig from '../../config/GameConfig.js';
import { Constants, Utils } from '../../utils/Constants.js';
import Fish from '../../entities/Fish.js';
import Zooplankton from '../../entities/Zooplankton.js';
import Crayfish from '../../entities/Crayfish.js';
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

        // Ecosystem state for ebb and flow dynamics
        // States: RECOVERING (no bait, predators gone) or FEEDING (bait present, predators feeding)
        this.spawnMode = null; // TRICKLE or WOLFPACK
        this.timeSinceBaitGone = 0; // Time since all bait was consumed
        this.timeObservingRecovery = 0; // Time observing recovery with bait but no predators
        this.lastBaitfishCount = 0; // Track baitfish population trend
        this.hasDespawnedPredators = false; // Track if we've cleared predators

        // Spawn initial crayfish population (3 on load)
        this.spawnInitialCrayfish();

        // Set up spawn timers
        this.setupSpawnTimers();

        // Monitor ecosystem health
        this.scene.time.addEvent({
            delay: 2000, // Check every 2 seconds
            callback: () => this.updateEcosystemState(),
            callbackScope: this,
            loop: true
        });
    }

    setupSpawnTimers() {
        // Start spawning fish (fast spawn rate to build population quickly)
        this.scene.time.addEvent({
            delay: 500, // Reduced from 1000 - spawn every 0.5 seconds
            callback: () => this.trySpawnFish(),
            callbackScope: this,
            loop: true
        });

        // Start spawning baitfish schools
        this.scene.time.addEvent({
            delay: 2000,
            callback: () => this.trySpawnBaitfishSchool(),
            callbackScope: this,
            loop: true
        });

        // Start spawning zooplankton at the bottom
        this.scene.time.addEvent({
            delay: 1500,
            callback: () => this.trySpawnZooplankton(),
            callbackScope: this,
            loop: true
        });

        // Maintain crayfish population (check every 30 seconds)
        this.scene.time.addEvent({
            delay: 30000, // 30 seconds
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
        const ecosystemState = this.getEcosystemState();

        // RECOVERING STATE: Only allow 1-2 scout predators
        if (ecosystemState === 'RECOVERING') {
            if (this.scene.fishes.length < 2 && Math.random() < 0.10) {
                // 10% chance to spawn a scout predator during recovery
                // Continue to normal spawn logic
            } else {
                return null; // No spawning during recovery
            }
        }

        // FEEDING STATE: Spawn based on mode
        if (ecosystemState === 'FEEDING') {
            // TRICKLE MODE: Spawn normally until bait starts decreasing
            if (this.spawnMode === 'TRICKLE') {
                // Keep spawning in trickle mode
            }
            // WOLFPACK MODE: Don't spawn more (wolfpack already spawned)
            else if (this.spawnMode === 'WOLFPACK') {
                return null; // Wolfpack already spawned, no more spawning
            }
            // NO MODE: Don't spawn yet (waiting for spawn mode to be set)
            else if (this.spawnMode === null) {
                return null;
            }
        }

        // Don't spawn too many fish at once
        if (this.scene.fishes.length >= 20) {
            return null;
        }

        // Get player position in world coordinates (depends on fishing type)
        // In nature simulation mode, there is no player, so spawn randomly across screen
        let playerWorldX;
        let isNatureSimulation = false;

        // Always use center of screen as player position
        playerWorldX = GameConfig.CANVAS_WIDTH / 2;

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

        // Spawn fish in world coordinates relative to player's hole
        // Fish spawn at random distances around the player (200-400 units away)
        // In nature simulation mode, spawn across full screen width
        let worldX, fromLeft;

        if (isNatureSimulation) {
            // Nature simulation: spawn randomly across screen
            const screenLeft = -200;
            const screenRight = GameConfig.CANVAS_WIDTH + 200;
            worldX = Utils.randomBetween(screenLeft, screenRight);
            fromLeft = Math.random() < 0.5;
        } else {
            // Normal fishing mode: spawn relative to player
            const spawnDistance = Utils.randomBetween(200, 400);
            fromLeft = Math.random() < 0.5;
            worldX = playerWorldX + (fromLeft ? -spawnDistance : spawnDistance);
        }

        // Use dynamic depth scale from scene
        const depthScale = this.scene.sonarDisplay ?
            this.scene.sonarDisplay.getDepthScale() :
            GameConfig.DEPTH_SCALE;
        const y = depth * depthScale;

        // Create the fish with species parameter (worldX will be used internally, x will be calculated for screen)
        const fish = new Fish(this.scene, worldX, y, size, species);

        // Set initial movement direction - fish swim toward and past the player
        if (fromLeft) {
            fish.ai.idleDirection = 1; // Swim right (toward and past player)
        } else {
            fish.ai.idleDirection = -1; // Swim left (toward and past player)
        }

        this.scene.fishes.push(fish);
        return fish;
    }

    /**
    /**
     * Try to spawn a baitfish school with species-specific behavior
     * Uses new unified Fish class with Boids schooling
     * @returns {boolean} True if school was spawned
     */
    trySpawnBaitfishSchool() {
        // Ecosystem-aware spawning: Faster bait recovery when predators are gone
        let maxSchools = 5;
        if (this.ecosystemState === 'RECOVERING') {
            maxSchools = 8; // Allow more bait clouds during recovery
        }

        // Don't spawn too many schools at once
        if (this.scene.schools.length >= maxSchools) {
            return false;
        }

        // Select species based on weighted spawn rates (realistic Lake Champlain distribution)
        let speciesType = 'alewife';
        const speciesRoll = Math.random();
        if (speciesRoll < 0.40) {
            speciesType = 'alewife'; // Most abundant (invasive species)
        } else if (speciesRoll < 0.70) {
            speciesType = 'rainbow_smelt'; // Common, preferred prey
        } else if (speciesRoll < 0.90) {
            speciesType = 'yellow_perch'; // Common in shallows
        } else {
            speciesType = 'sculpin'; // Bottom-dwelling, less common
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
                // Large schools (massive aggregations)
                schoolSize = Math.floor(Utils.randomBetween(schoolSizeRange.max, schoolSizeRange.max + 20));
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

        // Get spawn position
        const playerWorldX = GameConfig.CANVAS_WIDTH / 2;
        const fromLeft = Math.random() < 0.5;
        const spawnDistance = Utils.randomBetween(200, 400);
        const worldX = playerWorldX + (fromLeft ? -spawnDistance : spawnDistance);

        // Convert depth to screen Y
        const depthScale = this.scene.sonarDisplay ?
            this.scene.sonarDisplay.getDepthScale() :
            GameConfig.DEPTH_SCALE;
        const y = depth * depthScale;

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
        // Increased maximum for more abundant food source
        if (this.scene.zooplankton.length >= 50) {
            return 0;
        }

        // Get player world position
        // In nature simulation mode, spawn randomly across screen
        let playerWorldX;
        let isNatureSimulation = false;

        // Always use center of screen as player position
        playerWorldX = GameConfig.CANVAS_WIDTH / 2;

        // Spawn 2-4 zooplankton at a time (increased from 1-3)
        const spawnCount = Math.floor(Utils.randomBetween(2, 4));

        for (let i = 0; i < spawnCount; i++) {
            // Spawn at random position around player in world coordinates
            // In nature simulation mode, spawn randomly across screen
            let worldX;

            if (isNatureSimulation) {
                const screenLeft = -200;
                const screenRight = GameConfig.CANVAS_WIDTH + 200;
                worldX = Utils.randomBetween(screenLeft, screenRight);
            } else {
                const offsetX = Utils.randomBetween(-300, 300);
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
            const y = depth * depthScale;

            // Create zooplankton
            const zp = new Zooplankton(this.scene, worldX, y);
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
        // Get player world position
        let playerWorldX;
        let isNatureSimulation = false;

        // Always use center of screen as player position
        playerWorldX = GameConfig.CANVAS_WIDTH / 2;

        // Random horizontal position
        let worldX;
        if (isNatureSimulation) {
            const screenLeft = -200;
            const screenRight = GameConfig.CANVAS_WIDTH + 200;
            worldX = Utils.randomBetween(screenLeft, screenRight);
        } else {
            // Spawn around player (wider range than zooplankton)
            const offsetX = Utils.randomBetween(-400, 400);
            worldX = playerWorldX + offsetX;
        }

        // Spawn on the actual bottom depth (use maxDepth from scene)
        const depth = this.scene.maxDepth || GameConfig.MAX_DEPTH;

        // Use dynamic depth scale from scene
        const depthScale = this.scene.sonarDisplay ?
            this.scene.sonarDisplay.getDepthScale() :
            GameConfig.DEPTH_SCALE;

        // Place crayfish on bottom with same offset as lure uses to appear grounded
        const BOTTOM_OFFSET_PX = 12;
        const y = (depth * depthScale) + BOTTOM_OFFSET_PX;

        // Create crayfish
        const crayfish = new Crayfish(this.scene, worldX, y);
        this.scene.crayfish.push(crayfish);

        return crayfish;
    }

    /**
     * Spawn an emergency fish in arcade mode when time is running out
     * @returns {Fish|null} The emergency fish or null if spawn failed
     */
    spawnEmergencyFish() {
        console.log('Spawning emergency fish!');

        // Get player position in world coordinates (depends on fishing type)
        // In nature simulation mode, there is no player, so spawn randomly across screen
        let playerWorldX;
        let isNatureSimulation = false;

        // Always use center of screen as player position
        playerWorldX = GameConfig.CANVAS_WIDTH / 2;

        // Spawn from random side using world coordinates
        const fromLeft = Math.random() < 0.5;
        const spawnDistance = 300;
        const worldX = playerWorldX + (fromLeft ? -spawnDistance : spawnDistance);

        // Use dynamic depth scale from scene
        const depthScale = this.scene.sonarDisplay ?
            this.scene.sonarDisplay.getDepthScale() :
            GameConfig.DEPTH_SCALE;

        // Spawn at mid-column depth (preferred lake trout zone)
        const y = Utils.randomBetween(
            GameConfig.DEPTH_ZONES.MID_COLUMN.min * depthScale,
            GameConfig.DEPTH_ZONES.MID_COLUMN.max * depthScale
        );

        // Create fish with max hunger and low health (size MEDIUM for balance)
        // Emergency fish is always lake trout for consistency
        const fish = new Fish(this.scene, worldX, y, 'MEDIUM', 'lake_trout');
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

        // Show notification
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 200,
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

        // Show notification
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 180,
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
        // Random chance spawns each frame
        if (Math.random() < GameConfig.FISH_SPAWN_CHANCE) {
            this.trySpawnFish();
        }

        if (Math.random() < GameConfig.BAITFISH_CLOUD_SPAWN_CHANCE) {
            this.trySpawnBaitfishSchool();
        }

        // Update emergency fish if any exist
        this.scene.fishes.forEach(fish => {
            if (fish.isEmergencyFish && !fish.caught) {
                this.updateEmergencyFish(fish);
            }
        });
    }

    /**
     * Check if we need to spawn emergency fish (arcade mode only)
     * @returns {boolean} True if emergency fish was spawned
     */
    checkEmergencySpawn() {
        if (this.scene.gameMode === GameConfig.GAME_MODE_ARCADE &&
            this.scene.timeRemaining < GameConfig.ARCADE_EMERGENCY_SPAWN_TIME &&
            !this.emergencyFishSpawned &&
            this.scene.fishCaught === 0) {
            this.spawnEmergencyFish();
            return true;
        }
        return false;
    }

    /**
     * Calculate ecosystem state based on what's actually on screen
     * Returns: 'RECOVERING' or 'FEEDING'
     */
    getEcosystemState() {
        // Use NEW school system only
        const schoolsArray = this.scene.schools || [];

        // Don't filter by 'visible' - schools don't have that property!
        // Just count all schools that exist
        const activeSchools = schoolsArray.filter(s => s && s.members);

        // Count total baitfish in all schools
        let totalBaitfish = 0;
        activeSchools.forEach(school => {
            const count = school.members?.length || 0;
            totalBaitfish += count;
        });

        console.log(`🐟 Ecosystem check: ${schoolsArray.length} schools, ${activeSchools.length} active, ${totalBaitfish} total baitfish`);

        // CALCULATED STATE: Based on what's actually on screen
        // RECOVERING: No bait or very little bait (< 10 fish)
        // FEEDING: Bait present (10+ fish)
        const state = totalBaitfish >= 10 ? 'FEEDING' : 'RECOVERING';
        return state;
    }

    /**
     * Update ecosystem dynamics - manage predator spawning based on bait presence
     */
    updateEcosystemState() {
        // Use NEW school system only
        const schoolsArray = this.scene.schools || [];

        // Don't filter by 'visible' - schools don't have that property!
        const activeSchools = schoolsArray.filter(s => s && s.members);

        const predatorCount = this.scene.fishes.length;

        // Count total baitfish in all schools
        let totalBaitfish = 0;
        activeSchools.forEach(school => {
            totalBaitfish += school.members?.length || 0;
        });

        const ecosystemState = this.getEcosystemState();

        // Track when bait is completely gone
        if (totalBaitfish === 0) {
            this.timeSinceBaitGone += 2000; // 2 seconds per check

            // After 5 seconds with no bait, despawn all predators
            if (this.timeSinceBaitGone > 5000 && !this.hasDespawnedPredators) {
                console.log('💀 All bait gone! Clearing predators...');
                this.despawnAllPredators();
                this.hasDespawnedPredators = true;
                this.spawnMode = null; // Clear spawn mode
            }
        } else {
            // Reset timers when bait exists
            this.timeSinceBaitGone = 0;
            this.hasDespawnedPredators = false;
        }

        // OBSERVATION: If we have bait (30+) but no/few predators (≤2), observe for 5 seconds
        // NO STATE GATE - just use baitfish count directly!
        if (totalBaitfish >= 30 && predatorCount <= 2) {
            this.timeObservingRecovery += 2000; // 2 seconds per check

            // After 5 seconds of observing recovery, trigger spawn mode
            if (this.timeObservingRecovery > 5000 && this.spawnMode === null) {
                // 50% chance of TRICKLE or WOLFPACK
                if (Math.random() < 0.5) {
                    this.spawnMode = 'WOLFPACK';
                    this.spawnWolfpack();
                    console.log(`🐺 WOLFPACK arriving! (${totalBaitfish} baitfish, observed for 5s)`);
                } else {
                    this.spawnMode = 'TRICKLE';
                    this.lastBaitfishCount = totalBaitfish; // Track for trickle termination
                    console.log(`💧 TRICKLE mode starting (${totalBaitfish} baitfish, observed for 5s)`);
                }
            }
        } else {
            this.timeObservingRecovery = 0; // Reset if conditions not met
        }

        // TRICKLE MODE: Stop spawning when bait population starts decreasing
        if (this.spawnMode === 'TRICKLE') {
            if (totalBaitfish < this.lastBaitfishCount) {
                console.log(`💧 TRICKLE ended: Bait decreasing (${totalBaitfish} < ${this.lastBaitfishCount})`);
                this.spawnMode = null;
            }
            this.lastBaitfishCount = totalBaitfish;
        }
    }

    /**
     * Despawn ALL predators immediately when bait is gone
     * Makes all fish "swim away" at once
     */
    despawnAllPredators() {
        const count = this.scene.fishes.length;
        console.log(`🏊 Clearing ${count} predators from game area...`);

        // Remove all predators
        while (this.scene.fishes.length > 0) {
            const fish = this.scene.fishes.pop();
            fish.destroy();
        }

        console.log('✅ All predators cleared! Area is safe for bait recovery.');
    }

    /**
     * Spawn a wolfpack - burst spawn 10-15 predators at once
     * Creates intense feeding frenzy right away
     */
    spawnWolfpack() {
        const packSize = Math.floor(Math.random() * 6) + 10; // 10-15 fish
        console.log(`🐺 WOLFPACK incoming! Spawning ${packSize} predators...`);

        // Temporarily clear spawn mode to allow spawning
        const savedMode = this.spawnMode;
        this.spawnMode = null;

        let spawned = 0;
        for (let i = 0; i < packSize; i++) {
            const fish = this.trySpawnFish();
            if (fish) {
                spawned++;
            }
        }

        // Restore wolfpack mode
        this.spawnMode = savedMode;

        console.log(`🐺 WOLFPACK spawned ${spawned} predators!`);
    }

    /**
     * Reset the spawning system (for new game)
     */
    reset() {
        this.emergencyFishSpawned = false;
        this.spawnMode = null;
        this.timeSinceBaitGone = 0;
        this.timeObservingRecovery = 0;
        this.lastBaitfishCount = 0;
        this.hasDespawnedPredators = false;
    }

    /**
     * Clean up spawning system
     */
    destroy() {
        // Timers are managed by Phaser scene, no cleanup needed
    }
}

export default SpawningSystem;
