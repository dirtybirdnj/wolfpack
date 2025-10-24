import GameConfig from '../../config/GameConfig.js';
import { Constants, Utils } from '../../utils/Constants.js';
import Fish from '../../entities/Fish.js';
import BaitfishCloud from '../../entities/BaitfishCloud.js';
import Zooplankton from '../../entities/Zooplankton.js';

/**
 * SpawningSystem - Handles all entity spawning logic
 *
 * @module scenes/systems/SpawningSystem
 *
 * Responsibilities:
 * - Spawn fish at appropriate depths and locations
 * - Spawn baitfish clouds with varied sizes
 * - Spawn zooplankton near lake bottom
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
    }

    /**
     * Try to spawn a fish based on current conditions
     * @returns {Fish|null} The spawned fish or null if spawn failed
     */
    trySpawnFish() {
        // Don't spawn too many fish at once
        if (this.scene.fishes.length >= 4) {
            return null;
        }

        // Get player position in world coordinates (depends on fishing type)
        let playerWorldX;
        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            if (!currentHole) return null;
            playerWorldX = currentHole.x;
        } else if (this.scene.boatManager) {
            playerWorldX = this.scene.boatManager.playerX;
        } else {
            return null; // No manager available
        }

        // Determine fish spawn depth based on realistic lake trout behavior
        let depth;
        const tempFactor = (this.scene.waterTemp - 38) / 7; // 0 to 1 based on temp range

        // Lake trout prefer different depths based on temperature
        if (tempFactor < 0.3) {
            // Cold water - fish can be shallower
            depth = Utils.randomBetween(15, 80);
        } else {
            // Warmer water - fish go deeper
            depth = Utils.randomBetween(30, 120);
        }

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
        const spawnDistance = Utils.randomBetween(200, 400);
        const fromLeft = Math.random() < 0.5;
        const worldX = playerWorldX + (fromLeft ? -spawnDistance : spawnDistance);
        const y = depth * GameConfig.DEPTH_SCALE;

        // Create the fish (worldX will be used internally, x will be calculated for screen)
        const fish = new Fish(this.scene, worldX, y, size);

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
     * Try to spawn a baitfish cloud
     * @returns {BaitfishCloud|null} The spawned cloud or null if spawn failed
     */
    trySpawnBaitfishCloud() {
        // Don't spawn too many clouds at once - increased to sustain hungry lakers
        if (this.scene.baitfishClouds.length >= 5) {
            return null;
        }

        // Determine cloud size using weighted distribution for more variety
        // Increased sizes to sustain aggressive lake trout feeding behavior
        // 60% small (5-15), 30% medium (16-30), 10% large (31-50)
        let cloudSize;
        const sizeRoll = Math.random();
        if (sizeRoll < 0.6) {
            // Small clouds (most common) - increased from 3-8 to 5-15
            cloudSize = Math.floor(Utils.randomBetween(5, 15));
        } else if (sizeRoll < 0.9) {
            // Medium clouds (less common) - increased from 9-15 to 16-30
            cloudSize = Math.floor(Utils.randomBetween(16, 30));
        } else {
            // Large clouds (rare - massive feeding frenzies!) - increased from 16-24 to 31-50
            cloudSize = Math.floor(Utils.randomBetween(31, 50));
        }

        // Baitfish prefer certain depth zones (typically shallower than lake trout)
        let depth;
        const depthRoll = Math.random();
        if (depthRoll < 0.4) {
            // Shallow - 20-40 ft
            depth = Utils.randomBetween(20, 40);
        } else if (depthRoll < 0.8) {
            // Mid depth - 40-70 ft
            depth = Utils.randomBetween(40, 70);
        } else {
            // Deeper - 70-100 ft
            depth = Utils.randomBetween(70, 100);
        }

        // Get player world position
        let playerWorldX;
        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            playerWorldX = currentHole ? currentHole.x : 0;
        } else if (this.scene.boatManager) {
            playerWorldX = this.scene.boatManager.playerX;
        } else {
            playerWorldX = 0;
        }

        // Spawn in world coordinates at a distance from player (200-400 units away)
        const spawnDistance = Utils.randomBetween(200, 400);
        const fromLeft = Math.random() < 0.5;
        const worldX = playerWorldX + (fromLeft ? -spawnDistance : spawnDistance);
        const y = depth * GameConfig.DEPTH_SCALE;

        // Create the baitfish cloud
        const cloud = new BaitfishCloud(this.scene, worldX, y, cloudSize);

        // Set initial drift direction (drift toward and past player)
        cloud.velocity.x = fromLeft ? Utils.randomBetween(0.3, 0.8) : Utils.randomBetween(-0.8, -0.3);

        this.scene.baitfishClouds.push(cloud);
        return cloud;
    }

    /**
     * Try to spawn zooplankton near the bottom
     * @returns {number} Number of zooplankton spawned
     */
    trySpawnZooplankton() {
        // Don't spawn too many zooplankton at once
        if (this.scene.zooplankton.length >= 30) {
            return 0;
        }

        // Get player world position
        let playerWorldX;
        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            playerWorldX = currentHole ? currentHole.x : 0;
        } else if (this.scene.boatManager) {
            playerWorldX = this.scene.boatManager.playerX;
        } else {
            playerWorldX = 0;
        }

        // Spawn 1-3 zooplankton at a time
        const spawnCount = Math.floor(Utils.randomBetween(1, 3));

        for (let i = 0; i < spawnCount; i++) {
            // Spawn at random position around player in world coordinates
            const offsetX = Utils.randomBetween(-300, 300);
            const worldX = playerWorldX + offsetX;

            // Spawn near the bottom (95-100 feet deep)
            const depth = Utils.randomBetween(95, 100);
            const y = depth * GameConfig.DEPTH_SCALE;

            // Create zooplankton
            const zp = new Zooplankton(this.scene, worldX, y);
            this.scene.zooplankton.push(zp);
        }

        return spawnCount;
    }

    /**
     * Spawn an emergency fish in arcade mode when time is running out
     * @returns {Fish|null} The emergency fish or null if spawn failed
     */
    spawnEmergencyFish() {
        console.log('Spawning emergency fish!');

        // Get player position in world coordinates (depends on fishing type)
        let playerWorldX;
        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            if (!currentHole) return null;
            playerWorldX = currentHole.x;
        } else if (this.scene.boatManager) {
            playerWorldX = this.scene.boatManager.playerX;
        } else {
            return null; // No manager available
        }

        // Spawn from random side using world coordinates
        const fromLeft = Math.random() < 0.5;
        const spawnDistance = 300;
        const worldX = playerWorldX + (fromLeft ? -spawnDistance : spawnDistance);

        // Spawn at mid-column depth (preferred lake trout zone)
        const y = Utils.randomBetween(
            GameConfig.DEPTH_ZONES.MID_COLUMN.min * GameConfig.DEPTH_SCALE,
            GameConfig.DEPTH_ZONES.MID_COLUMN.max * GameConfig.DEPTH_SCALE
        );

        // Create fish with max hunger and low health (size MEDIUM for balance)
        const fish = new Fish(this.scene, worldX, y, 'MEDIUM');
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
