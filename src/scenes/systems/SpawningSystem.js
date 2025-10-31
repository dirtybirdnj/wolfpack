import GameConfig from '../../config/GameConfig.js';
import { Constants, Utils } from '../../utils/Constants.js';
import Fish from '../../entities/Fish.js';
import BaitfishCloud from '../../entities/BaitfishCloud.js';
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

        // Spawn initial crayfish population (3 on load)
        this.spawnInitialCrayfish();

        // Set up spawn timers
        this.setupSpawnTimers();
    }

    setupSpawnTimers() {
        // Start spawning fish
        this.scene.time.addEvent({
            delay: 1000,
            callback: () => this.trySpawnFish(),
            callbackScope: this,
            loop: true
        });

        // Start spawning baitfish clouds
        this.scene.time.addEvent({
            delay: 2000,
            callback: () => this.trySpawnBaitfishCloud(),
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
        // Don't spawn too many fish at once
        if (this.scene.fishes.length >= 20) {
            return null;
        }

        // Get player position in world coordinates (depends on fishing type)
        // In nature simulation mode, there is no player, so spawn randomly across screen
        let playerWorldX;
        let isNatureSimulation = false;

        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            if (!currentHole) return null;
            playerWorldX = currentHole.x;
        } else {
            // Nature simulation mode - spawn randomly across the screen
            isNatureSimulation = true;
            playerWorldX = GameConfig.CANVAS_WIDTH / 2;
        }

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
        const fish = new Fish(this.scene, worldX, y, size, this.scene.fishingType || 'observation', species);

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
     * Try to spawn a baitfish cloud with species-specific behavior
     * @returns {BaitfishCloud|null} The spawned cloud or null if spawn failed
     */
    trySpawnBaitfishCloud() {
        // Don't spawn too many clouds at once - increased to sustain hungry lakers
        if (this.scene.baitfishClouds.length >= 5) {
            return null;
        }

        // Select species based on weighted spawn rates (realistic Lake Champlain distribution)
        // Alewife: 40%, Smelt: 30%, Perch: 20%, Sculpin: 10%, Cisco: rare (handled separately)
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

        // Determine cloud size based on species schooling behavior
        let cloudSize;
        const schoolSize = speciesData.schoolSize;

        if (speciesData.schoolingDensity === 'none') {
            // Solitary or small groups (sculpin)
            cloudSize = Math.floor(Utils.randomBetween(schoolSize.min, schoolSize.max));
        } else {
            // Schooling species - use weighted distribution
            const sizeRoll = Math.random();
            if (sizeRoll < 0.6) {
                // Small schools
                cloudSize = Math.floor(Utils.randomBetween(schoolSize.min, schoolSize.min + 10));
            } else if (sizeRoll < 0.9) {
                // Medium schools
                cloudSize = Math.floor(Utils.randomBetween(schoolSize.min + 10, schoolSize.max));
            } else {
                // Large schools (massive aggregations)
                cloudSize = Math.floor(Utils.randomBetween(schoolSize.max, schoolSize.max + 20));
            }
        }

        // Spawn depth based on species preferences
        const depthRange = speciesData.depthRange;
        let depth = Utils.randomBetween(depthRange.min, depthRange.max);

        // Species-specific depth tweaks
        if (speciesType === 'sculpin') {
            // Sculpin prefer deeper, bottom areas
            depth = Utils.randomBetween(80, 120);
        } else if (speciesType === 'cisco') {
            // Cisco are deep-water specialists
            depth = Utils.randomBetween(60, 100);
        } else if (speciesType === 'yellow_perch') {
            // Perch prefer shallower, warmer water
            depth = Utils.randomBetween(10, 40);
        } else if (speciesType === 'rainbow_smelt') {
            // Smelt prefer mid-depth cold water
            depth = Utils.randomBetween(30, 80);
        }

        // Check if water is deep enough for this baitfish species
        const actualDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
        const minRequiredDepth = speciesType === 'yellow_perch' ? 15 : 25; // Perch shallow, others deeper

        if (actualDepth < minRequiredDepth) {
            // Water too shallow for this baitfish species, skip spawning
            console.log(`⚠️ Water too shallow (${actualDepth}ft) for ${speciesType} (needs ${minRequiredDepth}ft)`);
            return null;
        }

        // Constrain depth to actual water depth (spawn at least 5ft above bottom)
        const maxBaitfishDepth = Math.max(10, actualDepth - 5);
        depth = Math.min(depth, maxBaitfishDepth);

        // Get player world position
        // In nature simulation mode, spawn randomly across screen
        let playerWorldX;
        let isNatureSimulation = false;

        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            playerWorldX = currentHole ? currentHole.x : 0;
        } else {
            isNatureSimulation = true;
            playerWorldX = GameConfig.CANVAS_WIDTH / 2;
        }

        // Spawn in world coordinates at a distance from player (200-400 units away)
        // In nature simulation mode, spawn randomly across screen
        let worldX;
        const fromLeft = Math.random() < 0.5;

        if (isNatureSimulation) {
            const screenLeft = -200;
            const screenRight = GameConfig.CANVAS_WIDTH + 200;
            worldX = Utils.randomBetween(screenLeft, screenRight);
        } else {
            const spawnDistance = Utils.randomBetween(200, 400);
            worldX = playerWorldX + (fromLeft ? -spawnDistance : spawnDistance);
        }

        // Use dynamic depth scale from scene
        const depthScale = this.scene.sonarDisplay ?
            this.scene.sonarDisplay.getDepthScale() :
            GameConfig.DEPTH_SCALE;
        const y = depth * depthScale;

        // Create the baitfish cloud with species type
        const cloud = new BaitfishCloud(this.scene, worldX, y, cloudSize, speciesType);

        // Set initial drift direction
        if (isNatureSimulation) {
            // Nature mode: random horizontal drift in either direction (not toward center!)
            cloud.velocity.x = Utils.randomBetween(-0.8, 0.8);
            cloud.velocity.y = Utils.randomBetween(-0.3, 0.3);
        } else {
            // Normal mode: drift toward and past player
            cloud.velocity.x = fromLeft ? Utils.randomBetween(0.3, 0.8) : Utils.randomBetween(-0.8, -0.3);
        }

        this.scene.baitfishClouds.push(cloud);

        // Log rare species spawns
        if (speciesType === 'cisco') {
            console.log('🐟 RARE: Cisco school spotted at', Math.floor(depth), 'feet!');
        }

        return cloud;
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

        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            playerWorldX = currentHole ? currentHole.x : 0;
        } else {
            isNatureSimulation = true;
            playerWorldX = GameConfig.CANVAS_WIDTH / 2;
        }

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

        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            playerWorldX = currentHole ? currentHole.x : 0;
        } else {
            isNatureSimulation = true;
            playerWorldX = GameConfig.CANVAS_WIDTH / 2;
        }

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

        // Spawn on the actual bottom depth at this position (with small offset to rest on ground)
        let depth;
        if (this.scene.iceHoleManager) {
            // Ice fishing mode: use actual bottom depth at this position
            depth = this.scene.iceHoleManager.getDepthAtPosition(worldX);
        } else {
            // Nature simulation: use max depth
            depth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
        }

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

        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            if (!currentHole) return null;
            playerWorldX = currentHole.x;
        } else {
            // Nature simulation mode - spawn randomly across the screen
            isNatureSimulation = true;
            playerWorldX = GameConfig.CANVAS_WIDTH / 2;
        }

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
        const fish = new Fish(this.scene, worldX, y, 'MEDIUM', this.scene.fishingType, 'lake_trout');
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
            this.trySpawnBaitfishCloud();
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
