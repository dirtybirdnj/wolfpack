/**
 * SimpleEcosystemSpawner
 *
 * Spawns the simplified ecosystem:
 * - Bugs (prey for all fish)
 * - Small fish (0.5-2.0)
 * - Medium fish (2.0-5.0)
 * - Large fish (5.0-10.0)
 *
 * No complex zones, no species - just size-based predation
 */

import { SimpleFish } from '../entities/SimpleFish.ts';
import { Bug } from '../entities/Bug.ts';
import { EntityRegistry } from './EntityRegistry.ts';

export interface SimpleEcosystemConfig {
    bugCount: number;
    smallFishCount: number;
    mediumFishCount: number;
    largeFishCount: number;
    worldWidth: number;
    worldHeight: number;
    spawnZoneWidth?: number; // Width of left/right spawn zones (default: 96px = 1 inch)
}

export class SimpleEcosystemSpawner {
    private scene: Phaser.Scene;
    private registry: EntityRegistry;
    private bugs: Bug[] = [];
    private fish: SimpleFish[] = [];

    // Dynamic spawning
    private lastSpawnCheck: number = 0;
    private spawnCheckInterval: number = 5000; // Check every 5 seconds
    private worldWidth: number = 0;
    private worldHeight: number = 0;

    // Trickle spawn system - gradually build up population over first 60 seconds
    private startupMode: boolean = true;
    private startupStartTime: number = 0;
    private startupDuration: number = 60000; // 60 seconds
    private targetBugCount: number = 0;
    private targetSmallFishCount: number = 0;
    private targetMediumFishCount: number = 0;
    private targetLargeFishCount: number = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.registry = EntityRegistry.getInstance();
    }

    /**
     * Spawn the simplified ecosystem with TRICKLE SPAWN
     * Instead of spawning all at once, spawn a few fish initially
     * then gradually add more over 60 seconds for a natural buildup
     */
    spawn(config: SimpleEcosystemConfig): void {
        console.log('🌍 Spawning simplified ecosystem with trickle spawn...', config);

        // Store world dimensions for dynamic spawning
        this.worldWidth = config.worldWidth;
        this.worldHeight = config.worldHeight;

        const spawnZoneWidth = config.spawnZoneWidth || 96; // Default 1 inch

        // Clear registry
        this.registry.clear();
        this.bugs = [];
        this.fish = [];

        // TRICKLE SPAWN: Save target counts for gradual spawning
        this.targetBugCount = config.bugCount;
        this.targetSmallFishCount = config.smallFishCount;
        this.targetMediumFishCount = config.mediumFishCount;
        this.targetLargeFishCount = config.largeFishCount;

        // INITIAL SPAWN: Start with just a few organisms (20% of target)
        const initialBugs = Math.floor(config.bugCount * 0.2);
        const initialSmall = Math.floor(config.smallFishCount * 0.2);
        const initialMedium = Math.floor(config.mediumFishCount * 0.2);
        const initialLarge = Math.floor(config.largeFishCount * 0.2);

        // Spawn initial bugs
        for (let i = 0; i < initialBugs; i++) {
            const x = Phaser.Math.Between(0, config.worldWidth);
            const y = Phaser.Math.Between(0, config.worldHeight);
            const bug = new Bug(this.scene, x, y);
            this.bugs.push(bug);
        }

        // Spawn initial small fish in spawn zones
        for (let i = 0; i < initialSmall; i++) {
            const size = 0.5 + Math.random() * 1.5; // 0.5 to 2.0
            const fish = this.spawnFishInZone(size, spawnZoneWidth);
            this.fish.push(fish);
        }

        // Spawn initial medium fish in spawn zones
        for (let i = 0; i < initialMedium; i++) {
            const size = 2.0 + Math.random() * 3.0; // 2.0 to 5.0
            const fish = this.spawnFishInZone(size, spawnZoneWidth);
            this.fish.push(fish);
        }

        // Spawn initial large fish in spawn zones
        for (let i = 0; i < initialLarge; i++) {
            const size = 5.0 + Math.random() * 5.0; // 5.0 to 10.0
            const fish = this.spawnFishInZone(size, spawnZoneWidth);
            this.fish.push(fish);
        }

        console.log(`✅ Initial spawn: ${this.bugs.length} bugs, ${this.fish.length} fish`);
        console.log(`   Will gradually spawn to: ${this.targetBugCount} bugs, ${this.targetSmallFishCount + this.targetMediumFishCount + this.targetLargeFishCount} fish over 60s`);

        // Initialize spawn timers and startup mode
        this.lastSpawnCheck = Date.now();
        this.startupStartTime = Date.now();
        this.startupMode = true;
    }

    /**
     * Spawn a fish in either left or right spawn zone with appropriate trajectory
     *
     * Spawn zones:
     * - Left zone (0 to spawnZoneWidth): Fish heading = 0° (right →)
     * - Right zone (worldWidth - spawnZoneWidth to worldWidth): Fish heading = 180° (left ←)
     *
     * Each zone has 3 depth areas:
     * - Top (0-33%): Surface and near-surface waters
     * - Middle (33-66%): Mid-column
     * - Bottom (66-100%): Deep and near-bottom waters
     */
    private spawnFishInZone(size: number, spawnZoneWidth: number): SimpleFish {
        // Randomly choose left or right spawn zone
        const useLeftZone = Math.random() < 0.5;

        let x: number;
        let initialHeading: number;

        if (useLeftZone) {
            // LEFT ZONE: Spawn on left edge, heading right (0°)
            x = Phaser.Math.Between(0, spawnZoneWidth);
            initialHeading = 0; // Right →
        } else {
            // RIGHT ZONE: Spawn on right edge, heading left (180°)
            x = Phaser.Math.Between(this.worldWidth - spawnZoneWidth, this.worldWidth);
            initialHeading = 180; // Left ←
        }

        // Random depth within spawn zone (y can be anywhere in height)
        const y = Phaser.Math.Between(0, this.worldHeight);

        // Create fish at spawn position
        const fish = new SimpleFish(this.scene, x, y, size);

        // Set initial heading to match spawn zone direction
        // Fish AI activates immediately - no grace period
        fish['heading'] = initialHeading;
        fish['desiredHeading'] = initialHeading;
        fish['targetHeading'] = initialHeading;

        // Spawn with ZERO velocity - fish must start swimming with AI
        this.scene.matter.body.setVelocity(fish.body, {
            x: 0,
            y: 0
        });

        return fish;
    }

    /**
     * Update all entities and handle trickle spawning + dynamic replenishment
     */
    update(deltaTime: number): void {
        // Update bugs
        for (const bug of this.bugs) {
            if (bug.active) {
                bug.update(deltaTime);
            }
        }

        // Update fish
        for (const fish of this.fish) {
            if (fish.active) {
                fish.update(deltaTime);
            }
        }

        // Clean up destroyed entities
        this.bugs = this.bugs.filter(b => b.active);
        this.fish = this.fish.filter(f => f.active);

        const now = Date.now();

        // TRICKLE SPAWN: Gradually build up population during startup (first 60 seconds)
        if (this.startupMode) {
            const elapsed = now - this.startupStartTime;

            if (elapsed >= this.startupDuration) {
                // Startup complete - switch to normal replenishment mode
                this.startupMode = false;
                console.log('🌟 Trickle spawn complete - ecosystem fully populated!');
            } else {
                // Still in startup - spawn more organisms gradually
                // Spawn every 2 seconds during startup
                if (now - this.lastSpawnCheck >= 2000) {
                    this.trickleSpawn();
                    this.lastSpawnCheck = now;
                }
            }
        } else {
            // DYNAMIC SPAWNING: Normal replenishment every 5 seconds
            if (now - this.lastSpawnCheck >= this.spawnCheckInterval) {
                this.checkAndReplenish();
                this.lastSpawnCheck = now;
            }
        }
    }

    /**
     * Trickle spawn - gradually add organisms during startup phase
     * Spawns a few at a time every 2 seconds until targets reached
     */
    private trickleSpawn(): void {
        const stats = this.getStats();
        const spawnZoneWidth = 96;
        let spawned = 0;

        // Spawn bugs in larger batches (5-10 at a time) - bugs are eaten quickly!
        if (stats.bugs < this.targetBugCount) {
            const toSpawn = Math.min(Phaser.Math.Between(5, 10), this.targetBugCount - stats.bugs);
            for (let i = 0; i < toSpawn; i++) {
                const x = Phaser.Math.Between(0, this.worldWidth);
                const y = Phaser.Math.Between(0, this.worldHeight);
                const bug = new Bug(this.scene, x, y);
                this.bugs.push(bug);
                spawned++;
            }
        }

        // Spawn small fish (1-2 at a time)
        if (stats.smallFish < this.targetSmallFishCount) {
            const toSpawn = Math.min(Phaser.Math.Between(1, 2), this.targetSmallFishCount - stats.smallFish);
            for (let i = 0; i < toSpawn; i++) {
                const size = 0.5 + Math.random() * 1.5; // 0.5 to 2.0
                const fish = this.spawnFishInZone(size, spawnZoneWidth);
                this.fish.push(fish);
                spawned++;
            }
        }

        // Spawn medium fish (1 at a time)
        if (stats.mediumFish < this.targetMediumFishCount) {
            const toSpawn = Math.min(1, this.targetMediumFishCount - stats.mediumFish);
            for (let i = 0; i < toSpawn; i++) {
                const size = 2.0 + Math.random() * 3.0; // 2.0 to 5.0
                const fish = this.spawnFishInZone(size, spawnZoneWidth);
                this.fish.push(fish);
                spawned++;
            }
        }

        // Spawn large fish (1 at a time, rarely)
        if (stats.largeFish < this.targetLargeFishCount && Math.random() < 0.5) {
            const toSpawn = Math.min(1, this.targetLargeFishCount - stats.largeFish);
            for (let i = 0; i < toSpawn; i++) {
                const size = 5.0 + Math.random() * 5.0; // 5.0 to 10.0
                const fish = this.spawnFishInZone(size, spawnZoneWidth);
                this.fish.push(fish);
                spawned++;
            }
        }

        if (spawned > 0) {
            console.log(`🌱 Trickle spawn: +${spawned} organisms (${stats.bugs + spawned}/${this.targetBugCount} bugs, ${stats.smallFish + stats.mediumFish + stats.largeFish + spawned}/${this.targetSmallFishCount + this.targetMediumFishCount + this.targetLargeFishCount} fish)`);
        }
    }

    /**
     * Check population levels and spawn more entities as needed
     */
    private checkAndReplenish(): void {
        // Count current populations
        const stats = this.getStats();

        // Target populations (minimum levels to maintain)
        const minBugs = 80;          // LOTS of bugs to keep greens feeding in center
        const minSmallFish = 8;      // Green fish - prey for predators
        const minMediumFish = 2;     // Blue fish - fewer needed
        const minLargeFish = 2;      // Red fish - top predators

        let spawned = 0;

        // Replenish bugs (food for small fish)
        if (stats.bugs < minBugs) {
            const toSpawn = minBugs - stats.bugs;
            for (let i = 0; i < toSpawn; i++) {
                const x = Phaser.Math.Between(0, this.worldWidth);
                const y = Phaser.Math.Between(0, this.worldHeight);
                const bug = new Bug(this.scene, x, y);
                this.bugs.push(bug);
                spawned++;
            }
            console.log(`🐛 Spawned ${toSpawn} bugs (total: ${this.bugs.length})`);
        }

        // Replenish small fish (green - prey for predators) in spawn zones
        // TRICKLE SPAWN: Only spawn 1-2 at a time to avoid waves
        if (stats.smallFish < minSmallFish) {
            const needed = minSmallFish - stats.smallFish;
            const toSpawn = Math.min(Phaser.Math.Between(1, 2), needed); // Max 1-2 per cycle
            const spawnZoneWidth = 96;
            for (let i = 0; i < toSpawn; i++) {
                const size = 0.5 + Math.random() * 1.5; // 0.5 to 2.0
                const fish = this.spawnFishInZone(size, spawnZoneWidth);
                this.fish.push(fish);
                spawned++;
            }
            if (toSpawn > 0) {
                console.log(`🐟 Spawned ${toSpawn} small fish (${stats.smallFish + toSpawn}/${minSmallFish})`);
            }
        }

        // Replenish medium fish (blue) in spawn zones
        // TRICKLE SPAWN: Only spawn 1 at a time
        if (stats.mediumFish < minMediumFish) {
            const needed = minMediumFish - stats.mediumFish;
            const toSpawn = Math.min(1, needed); // Max 1 per cycle
            const spawnZoneWidth = 96;
            for (let i = 0; i < toSpawn; i++) {
                const size = 2.0 + Math.random() * 3.0; // 2.0 to 5.0
                const fish = this.spawnFishInZone(size, spawnZoneWidth);
                this.fish.push(fish);
                spawned++;
            }
            if (toSpawn > 0) {
                console.log(`🐟 Spawned ${toSpawn} medium fish (${stats.mediumFish + toSpawn}/${minMediumFish})`);
            }
        }

        // Replenish large fish (red) in spawn zones
        // TRICKLE SPAWN: Only spawn 1 at a time, and only 50% of the time
        if (stats.largeFish < minLargeFish && Math.random() < 0.5) {
            const needed = minLargeFish - stats.largeFish;
            const toSpawn = Math.min(1, needed); // Max 1 per cycle
            const spawnZoneWidth = 96;
            for (let i = 0; i < toSpawn; i++) {
                const size = 5.0 + Math.random() * 5.0; // 5.0 to 10.0
                const fish = this.spawnFishInZone(size, spawnZoneWidth);
                this.fish.push(fish);
                spawned++;
            }
            if (toSpawn > 0) {
                console.log(`🐟 Spawned ${toSpawn} large fish (${stats.largeFish + toSpawn}/${minLargeFish})`);
            }
        }

        if (spawned > 0) {
            console.log(`✅ Dynamic spawn complete: ${spawned} total entities added`);
        }
    }

    /**
     * Get current population stats
     */
    getStats(): {
        bugs: number;
        smallFish: number;
        mediumFish: number;
        largeFish: number;
        total: number;
    } {
        const smallFish = this.fish.filter(f => f.size < 2.0).length;
        const mediumFish = this.fish.filter(f => f.size >= 2.0 && f.size < 5.0).length;
        const largeFish = this.fish.filter(f => f.size >= 5.0).length;

        return {
            bugs: this.bugs.length,
            smallFish,
            mediumFish,
            largeFish,
            total: this.bugs.length + this.fish.length
        };
    }

    /**
     * Cleanup
     */
    destroy(): void {
        for (const bug of this.bugs) {
            bug.destroy();
        }
        for (const fish of this.fish) {
            fish.destroy();
        }
        this.bugs = [];
        this.fish = [];
        this.registry.clear();
    }
}
