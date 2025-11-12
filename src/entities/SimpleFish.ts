/**
 * SimpleFish - Size-based fish with 3-rule AI
 *
 * Replaces all the complex species system.
 * AI Rules:
 *   1. Flee from bigger fish
 *   2. Chase smaller fish/bugs
 *   3. Wander with neighbors
 *
 * Physics:
 *   - Realistic turn radius
 *   - Acceleration/deceleration
 *   - Burst and cruise speeds
 */

import { EntityRegistry, WorldEntity } from '../systems/EntityRegistry.ts';

export class SimpleFish extends Phaser.GameObjects.Sprite {
    public size: number;
    public id: string;
    private registry: EntityRegistry;

    // Matter.js physics body
    public body!: MatterJS.BodyType;

    // Movement state
    private heading: number; // Current direction in degrees

    // Physics constants
    private readonly cruiseSpeed: number;
    private readonly sprintSpeed: number;
    private readonly maxTurnRate: number = 540;  // degrees per second (1.5 rotations per sec)
    private readonly viewDistance: number; // Scales with size - larger fish see farther
    private readonly neighborDistance: number = 100;

    // Lateral line detection - proximity sensing independent of vision
    // Oval shape: wider horizontally (side-to-side), narrower vertically (above/below)
    private readonly lateralLineRadiusX: number; // Horizontal radius
    private readonly lateralLineRadiusY: number; // Vertical radius

    // Burst-and-coast swimming - HEAVILY REDUCED for calm, lazy behavior
    private readonly thrustPower: number;      // Force per tail beat
    private readonly cruiseBeatInterval: number = 800;   // ms between beats when cruising (1.25 Hz - lazy)
    private readonly sprintBeatInterval: number = 150;   // ms between beats when sprinting (6.7 Hz - active)
    private readonly idleBeatInterval: number = 1500;    // ms between beats when idle/wandering (0.67 Hz - VERY lazy)
    private lastBeatTime: number = 0;
    private currentBeatInterval: number;

    // AI state
    private target: WorldEntity | null = null;
    private targetLockTime: number = 0;
    private lastDistanceToPrey: number = Infinity; // Track if closing gap
    private desiredHeading: number = 0;  // Where fish wants to go
    private targetHeading: number = 0;   // AI's raw target (smoothed into desiredHeading)
    private currentBehavior: 'chase' | 'flee' | 'wander' = 'wander'; // Current AI mode

    // Strike mechanics (C-start burst behavior)
    private isStriking: boolean = false;  // True when in strike burst mode
    private strikeStartTime: number = 0;  // When current strike started (ms)
    private readonly strikeDuration: number = 1500; // 1.5 second strike burst
    private postStrikePause: number = 0;  // Cooldown after eating (ms)

    // Boost meter system (simple and game-like)
    private boostMeter: number = 3000;    // Current boost available (ms)
    private readonly maxBoost: number = 3000;      // 3 seconds max boost
    private readonly boostRechargeRate: number = 1500; // 1500ms per second = 2 seconds to full charge
    private isBoostActive: boolean = false;
    private boostCooldown: number = 0; // 10 second cooldown after boost depleted
    private readonly boostCooldownDuration: number = 10000; // 10 seconds in ms

    // Flee cooldown - after escaping a predator, fish won't retarget prey for a while
    private fleeCooldown: number = 0; // Milliseconds remaining before fish can hunt again

    // Spawn protection - prevents immediate despawn after entering game
    private spawnProtectionTime: number = 10000; // 10 seconds of protection after spawn

    // Debug visualization - NEW FADING SYSTEM
    private debugGraphics: Phaser.GameObjects.Graphics;
    private statusText: Phaser.GameObjects.Text;
    public static DEBUG_ENABLED = true; // Toggle debug visuals

    // Trail system: Each point stores position, speed, and age
    private pathTrail: {
        x: number;
        y: number;
        speed: number;
        age: number; // Milliseconds since this point was created
    }[] = [];
    private readonly maxTrailLength: number = 1800; // Keep last 1800 positions (~30 seconds at 60 FPS)
    private readonly maxTrailAge: number = 10000; // Fade out over 10 seconds

    // Arrow history: Every 100th position gets an arrow
    private arrowHistory: {
        x: number;
        y: number;
        heading: number; // Desired heading (green) or physics heading (magenta)
        type: 'desired' | 'physics'; // Alternates
        age: number; // Milliseconds since created
    }[] = [];
    private arrowCounter: number = 0; // Counts positions to know when to drop arrow

    constructor(scene: Phaser.Scene, x: number, y: number, size: number) {
        super(scene, x, y, 'fish');

        this.id = `fish_${Date.now()}_${Math.random()}`;
        this.size = size;
        this.registry = EntityRegistry.getInstance();

        // Speed based on size (bigger = faster)
        // Increased base from 50 to 65 for more active small fish (green)
        // Size 0.5: 75 | Size 1: 85 | Size 2: 105 | Size 5: 165
        this.cruiseSpeed = 65 + (size * 20);
        this.sprintSpeed = this.cruiseSpeed * 2.5;

        // Thrust power - Balanced for calm wandering with capable chasing
        // Size 1: 0.0011 | Size 5: 0.0015 | Size 10: 0.0020 (calm but mobile)
        this.thrustPower = 0.00100 + (size * 0.00010);

        // Vision distance scales with size - larger predators see farther
        // Green (size 1): 250px | Blue (size 3.5): 325px | Red (size 7.5): 412px
        // Prevents red fish from overshooting prey they can't see yet
        this.viewDistance = 250 + (size * 30);

        // Lateral line detection - close-range proximity sensing (oval shape)
        // Wider horizontally (detects movement alongside), narrower vertically
        // Green (1.0): 80x40 | Blue (3.5): 150x75 | Red (7.5): 230x115
        this.lateralLineRadiusX = 60 + (size * 20); // Horizontal radius
        this.lateralLineRadiusY = 30 + (size * 10); // Vertical radius (half of horizontal)

        // Initial heading
        this.heading = Phaser.Math.Between(0, 360);
        this.desiredHeading = this.heading;
        this.targetHeading = this.heading;
        this.currentBeatInterval = this.cruiseBeatInterval;

        // Visual setup - scale and color by size (reduced for red fish arrow visibility)
        this.setScale(0.4 + size * 0.25); // Green: 0.65, Blue: 1.3, Red: 1.65-2.9
        this.setTint(this.getSizeColor(size));
        this.setDepth(1100); // Draw sprite above debug graphics (depth 1000)

        // Add to scene first
        scene.add.existing(this);

        // Create Matter.js body with SIZE-BASED WATER RESISTANCE
        const radius = (this.displayWidth / 2) * 0.7; // Slightly smaller than visual

        // WATER DRAG scales with size - larger fish are more streamlined but need control
        // Small fish: High drag (quick to slow down between tail beats)
        // Large fish: Lower drag (glide farther) but NOT too low (need maneuverability)
        const baseWaterDrag = 0.10;  // Base water resistance for small fish
        const dragReduction = Math.min(0.045, size * 0.006); // Less streamlining = better control
        const waterDrag = baseWaterDrag - dragReduction;
        // Green (1.0): 0.094 | Blue (3.5): 0.079 | Red (7.5): 0.055 (was 0.025 - too slippery!)

        this.body = scene.matter.add.circle(x, y, radius, {
            frictionAir: waterDrag,  // NOTE: Matter.js calls it "frictionAir" but we're simulating WATER
            mass: size,              // Bigger fish = more mass = more momentum
            angle: Phaser.Math.DegToRad(this.heading)
        }) as MatterJS.BodyType;

        // Link sprite to physics body
        scene.matter.add.gameObject(this, this.body);

        // Register in world phonebook
        this.registry.register({
            id: this.id,
            x: this.x,
            y: this.y,
            size: this.size,
            type: 'fish',
            sprite: this
        });

        // Create debug graphics (redrawn every frame with fading)
        this.debugGraphics = scene.add.graphics();
        this.debugGraphics.setDepth(1000); // Draw below sprite

        // Create status text (shows AI state)
        this.statusText = scene.add.text(this.x, this.y + 30, '', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        });
        this.statusText.setOrigin(0.5, 0);
        this.statusText.setDepth(1100); // Same as sprite
    }

    private getSizeColor(size: number): number {
        // Small = greenish, Medium = blue, Large = reddish
        if (size < 2) return 0x44ff44;      // Green
        if (size < 5) return 0x4444ff;      // Blue
        return 0xff4444;                     // Red
    }

    update(deltaTime: number): void {
        const dt = deltaTime / 1000;
        const now = Date.now();

        // Declare decision at function scope for debug access
        let decision: ReturnType<typeof this.makeDecision> | null = null;

        // SPAWN PROTECTION: Decay over time (prevents immediate despawn after entering)
        if (this.spawnProtectionTime > 0) {
            this.spawnProtectionTime -= deltaTime;
            if (this.spawnProtectionTime < 0) {
                this.spawnProtectionTime = 0;
            }
        }

        // BOOST ACTIVE: Reset every frame (only set true during tail beat if conditions met)
        // This prevents fire emoji from sticking when fish stops chasing
        this.isBoostActive = false;

        // BOOST COOLDOWN: Decay over time (10 second wait after boost depleted)
        if (this.boostCooldown > 0) {
            this.boostCooldown -= deltaTime;
            if (this.boostCooldown < 0) {
                this.boostCooldown = 0;
            }
        }

        // BOOST METER: Only recharge when cooldown expired
        if (this.boostMeter < this.maxBoost && this.boostCooldown === 0) {
            const rechargeAmount = (this.boostRechargeRate / 1000) * deltaTime;
            this.boostMeter = Math.min(this.maxBoost, this.boostMeter + rechargeAmount);
        }

        // FLEE COOLDOWN: Decay over time
        if (this.fleeCooldown > 0) {
            this.fleeCooldown -= deltaTime;
        }

        // POST-STRIKE PAUSE: Fish pauses briefly after eating to reorient
        if (this.postStrikePause > 0) {
            this.postStrikePause -= deltaTime;
            // Skip AI and swimming during pause (only drift with current velocity)
            // Continue to boundaries and debug sections below
        } else {
            // THREE RULE AI (runs immediately from spawn, no grace period)
            decision = this.makeDecision();

            // Execute decision (sets targetHeading and beat interval)
            this.executeDecision(decision, dt);

            // Smooth heading changes to prevent sharp vertical bounces
            this.smoothHeading(dt);

            // Gradually turn toward desired heading (realistic turn rate)
            this.applyTurnRate(dt);

            // Burst-and-coast: Apply tail beat if enough time has passed
            if (now - this.lastBeatTime >= this.currentBeatInterval) {
                this.applyTailBeat();
                this.lastBeatTime = now;
            }
        }

        // Horizontal boundaries: Despawn if off-screen (unless spawn protection active)
        const worldWidth = this.scene.scale.width;
        const spawnZoneWidth = 96;

        if (this.spawnProtectionTime > 0) {
            // SPAWN PROTECTION ACTIVE: Turn around instead of despawning
            if (this.x < spawnZoneWidth) {
                // Too close to left edge - turn right (0°)
                // CRITICAL: Set BOTH heading and targetHeading to prevent bounce-back
                this.targetHeading = 0;
                this.heading = 0;
                this.desiredHeading = 0; // Also set desired to break any AI turn commands
                this.x = spawnZoneWidth + 5; // Push back into safe zone

                // Clear any target that might be pulling them back
                this.target = null;
                this.targetLockTime = 0;
            } else if (this.x > worldWidth - spawnZoneWidth) {
                // Too close to right edge - turn left (180°)
                // CRITICAL: Set BOTH heading and targetHeading to prevent bounce-back
                this.targetHeading = 180;
                this.heading = 180;
                this.desiredHeading = 180; // Also set desired to break any AI turn commands
                this.x = worldWidth - spawnZoneWidth - 5; // Push back into safe zone

                // Clear any target that might be pulling them back
                this.target = null;
                this.targetLockTime = 0;
            }
        } else {
            // NO PROTECTION: Despawn if fully off-screen
            if (this.x < 0 || this.x > worldWidth) {
                // Track despawn in scene stats
                const scene = this.scene as any;
                if (scene.despawnCounts) {
                    if (this.size < 2.0) {
                        scene.despawnCounts.green++;
                    } else if (this.size < 5.0) {
                        scene.despawnCounts.blue++;
                    } else {
                        scene.despawnCounts.red++;
                    }
                }
                console.log(`🚪 Fish despawned (size ${this.size.toFixed(1)}) at x=${Math.round(this.x)}`);
                this.destroy();
                return;
            }
        }

        // Vertical: Hard boundaries with velocity bounce
        const surfaceY = 0;
        const floorY = this.scene.scale.height;
        if (this.y < surfaceY) {
            this.scene.matter.body.setPosition(this.body, { x: this.x, y: surfaceY });
            this.scene.matter.body.setVelocity(this.body, { x: this.body.velocity.x, y: Math.abs(this.body.velocity.y) });
        }
        if (this.y > floorY) {
            this.scene.matter.body.setPosition(this.body, { x: this.x, y: floorY });
            this.scene.matter.body.setVelocity(this.body, { x: this.body.velocity.x, y: -Math.abs(this.body.velocity.y) });
        }

        // UPSIDE-DOWN PREVENTION: Monitor velocity and apply corrective forces if needed
        // CRITICAL: We do NOT overwrite this.heading from velocity - that would prevent turning!
        // The heading is controlled by AI (targetHeading → smoothHeading → applyTurnRate)
        // We only correct the velocity if physics would flip the fish upside-down
        const velocity = this.body.velocity;
        if (velocity.x !== 0 || velocity.y !== 0) {
            const velocityHeading = Phaser.Math.RadToDeg(Math.atan2(velocity.y, velocity.x));

            // BIOLOGY: Check if velocity would cause upside-down swimming
            const correctedHeading = this.preventUpsideDown(velocityHeading);

            // ONLY apply correction if upside-down prevention is needed
            if (correctedHeading !== velocityHeading) {
                const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
                const correctedRad = Phaser.Math.DegToRad(correctedHeading);

                // Apply velocity correction immediately
                this.scene.matter.body.setVelocity(this.body, {
                    x: Math.cos(correctedRad) * speed,
                    y: Math.sin(correctedRad) * speed
                });

                // Apply counter-force to prevent physics from pushing back into forbidden zone
                const forceMagnitude = this.thrustPower * 2;
                const counterForce = {
                    x: Math.cos(correctedRad) * forceMagnitude,
                    y: Math.sin(correctedRad) * forceMagnitude
                };
                this.scene.matter.body.applyForce(this.body, this.body.position, counterForce);

                // Update heading ONLY when upside-down correction happens
                // Normal turns are controlled by AI via applyTurnRate()
                this.heading = correctedHeading;
            }
            // If no correction needed, heading remains under AI control
        }

        // Update sprite rotation
        this.angle = this.heading + 180; // Fish faces left by default

        // Update registry
        this.registry.updatePosition(this.id, this.x, this.y);

        // ============================================
        // DEBUG RECORDING - AFTER ALL GAME LOGIC
        // This has ZERO effect on fish behavior
        // ============================================

        // Calculate current state for debug display
        const speed = Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.y ** 2);
        const physicsHeading = Math.atan2(this.body.velocity.y, this.body.velocity.x);

        // Add new trail point
        this.pathTrail.push({
            x: this.x,
            y: this.y,
            speed: speed,
            age: 0 // Just created
        });

        // ALWAYS drop an arrow every 100 positions (regardless of fish state)
        this.arrowCounter++;
        if (this.arrowCounter >= 100) {
            const isDesired = this.arrowHistory.length % 2 === 0; // Alternate types
            this.arrowHistory.push({
                x: this.x,
                y: this.y,
                heading: isDesired ? this.desiredHeading : Phaser.Math.RadToDeg(physicsHeading),
                type: isDesired ? 'desired' : 'physics',
                age: 0 // Just created
            });
            this.arrowCounter = 0;
        }

        // Age all trail points and arrows
        for (const point of this.pathTrail) {
            point.age += deltaTime;
        }
        for (const arrow of this.arrowHistory) {
            arrow.age += deltaTime;
        }

        // Remove old trail points (faded out completely)
        this.pathTrail = this.pathTrail.filter(p => p.age < this.maxTrailAge);

        // Remove old arrows (faded out completely)
        this.arrowHistory = this.arrowHistory.filter(a => a.age < this.maxTrailAge);

        // Trim trail to max length if needed
        if (this.pathTrail.length > this.maxTrailLength) {
            this.pathTrail.shift();
        }

        // Update status text
        // FEEDING = casually eating easy prey (no boost)
        // CHASE = pursuing harder prey (no boost, higher thrust)
        // STRIKE = brief burst when chase failing (boost active, 1-2 sec)
        const statusLabel = this.postStrikePause > 0 ? 'RESTING' :
                           this.isStriking ? 'STRIKE' :
                           decision?.type === 'flee' ? 'FLEE' :
                           decision?.type === 'chase' ? (this.currentBehavior === 'chase' ? 'CHASE' : 'FEEDING') :
                           decision?.neighbors && decision.neighbors.length > 0 ? 'SCHOOL' :
                           'WANDER';
        const vx = this.body.velocity.x.toFixed(1);
        const vy = this.body.velocity.y.toFixed(1);
        const boostPercent = Math.round((this.boostMeter / this.maxBoost) * 100);
        const boostLabel = this.isBoostActive ? '🔥' : '';
        const fleeLabel = this.fleeCooldown > 0 ? `\nFlee CD:${Math.round(this.fleeCooldown)}ms` : '';
        this.statusText.setText(`${statusLabel} ${boostLabel}\nSz:${this.size.toFixed(1)} Spd:${speed.toFixed(0)}\nBoost:${boostPercent}%\nV:(${vx},${vy})${fleeLabel}`);

        // Position text below fish, scale-aware
        const textOffset = 40 + (this.displayHeight / 2);
        this.statusText.setPosition(this.x, this.y + textOffset);

        // Draw debug visuals
        if (SimpleFish.DEBUG_ENABLED) {
            this.drawDebugVisuals();
        }
    }

    /**
     * Check if an entity is within the fish's vision cone
     * Vision cone width scales with predator size:
     * - Green fish (prey): 90° total (cautious, focused forward)
     * - Blue fish (predator): 110° total (active hunters)
     * - Red fish (apex): 130° total (wide scanning)
     * Also uses elliptical range: Longer ahead, shorter above/below
     */
    private isInVisionCone(entity: WorldEntity): boolean {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;

        // Calculate angle to entity
        const angleToEntity = Math.atan2(dy, dx);
        const angleToEntityDeg = Phaser.Math.RadToDeg(angleToEntity);

        // Calculate angle difference (shortest path)
        let angleDiff = angleToEntityDeg - this.heading;
        while (angleDiff > 180) angleDiff -= 360;
        while (angleDiff < -180) angleDiff += 360;

        // WIDER VISION for predators - bigger hunters have better peripheral vision
        // Green (prey): 90° cone (cautious, focused forward)
        // Blue (predator): 110° cone (active hunters)
        // Red (apex): 130° cone (scan wide area for prey)
        let coneAngle: number;
        if (this.size >= 5.0) {
            coneAngle = 65; // Red: 130° total (65° each side)
        } else if (this.size >= 2.0) {
            coneAngle = 55; // Blue: 110° total (55° each side)
        } else {
            coneAngle = 45; // Green: 90° total (45° each side)
        }

        if (Math.abs(angleDiff) > coneAngle) {
            return false; // Outside cone angle
        }

        // ELLIPTICAL VISION: Fish see farther ahead than above/below
        // Project distance onto heading direction (forward component)
        const headingRad = Phaser.Math.DegToRad(this.heading);
        const forwardDist = Math.abs(dx * Math.cos(headingRad) + dy * Math.sin(headingRad));
        const lateralDist = Math.abs(-dx * Math.sin(headingRad) + dy * Math.cos(headingRad));

        // Forward range: Full viewDistance (scales with size: 250-500px)
        // Vertical range: Half of viewDistance (scales with size: 125-250px)
        const maxForwardDist = this.viewDistance;
        const maxVerticalDist = this.viewDistance * 0.5;

        return forwardDist <= maxForwardDist && lateralDist <= maxVerticalDist;
    }

    /**
     * Get emoji for fish based on size
     */
    private getColorEmoji(): string {
        if (this.size < 2.0) return '🟢';
        if (this.size < 5.0) return '🔵';
        return '🔴';
    }

    /**
     * Get emoji for entity based on type and size
     */
    private getEntityEmoji(entity: WorldEntity): string {
        if (entity.type === 'bug') return '🪳';
        if (entity.size < 2.0) return '🟢';
        if (entity.size < 5.0) return '🔵';
        return '🔴';
    }

    /**
     * Get color hex value for this fish based on size
     */
    private getFishColor(): number {
        if (this.size < 2.0) return 0x00ff00; // Green
        if (this.size < 5.0) return 0x0088ff; // Blue
        return 0xff0000; // Red
    }

    /**
     * Check if entity is within lateral line detection oval
     * Lateral line detects nearby movement/vibrations regardless of vision
     * Oval is wider horizontally (side-to-side) than vertically (above/below)
     */
    private isInLateralLineRange(entity: WorldEntity): boolean {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;

        // Ellipse equation: (dx/radiusX)^2 + (dy/radiusY)^2 <= 1
        const normalizedX = dx / this.lateralLineRadiusX;
        const normalizedY = dy / this.lateralLineRadiusY;

        return (normalizedX * normalizedX + normalizedY * normalizedY) <= 1;
    }

    /**
     * THREE RULES:
     * 1. FLEE from bigger fish
     * 2. CHASE smaller fish/bugs (with efficiency checks)
     * 3. WANDER with neighbors
     *
     * SPECIAL VISION:
     * - Green fish (size < 2.0): GOD VISION for bugs (can see all bugs on screen)
     * - Blue/Red fish: Normal elliptical vision cone
     */
    private makeDecision(): { type: 'flee' | 'chase' | 'wander'; target?: WorldEntity; neighbors?: WorldEntity[] } {
        // Look around (circular search first)
        const nearby = this.registry.findNearby(this.x, this.y, this.viewDistance, {
            excludeId: this.id
        });

        // Filter by vision cone - EXCEPT green fish get god vision for bugs
        let visible: WorldEntity[];
        if (this.size < 2.0) {
            // GREEN FISH: God vision for bugs, normal vision for fish
            const visibleFish = nearby.filter(e => e.type === 'fish' && this.isInVisionCone(e));
            const allBugs = this.registry.findNearby(this.x, this.y, 10000, { excludeId: this.id })
                .filter(e => e.type === 'bug');
            visible = [...visibleFish, ...allBugs];
        } else {
            // BLUE/RED FISH: Normal elliptical vision cone for everything
            visible = nearby.filter(e => this.isInVisionCone(e));
        }

        // SPAWN PROTECTION: Don't target anything in spawn zones while protected
        if (this.spawnProtectionTime > 0) {
            const worldWidth = this.scene.scale.width;
            const spawnZoneWidth = 96;

            visible = visible.filter(e => {
                // Filter out entities in left or right spawn zones
                return e.x > spawnZoneWidth && e.x < worldWidth - spawnZoneWidth;
            });
        }

        // RULE 1: FLEE from bigger threats (within vision)
        const threats = visible.filter(e =>
            e.type === 'fish' && e.size > this.size * 1.3
        );
        if (threats.length > 0) {
            // Flee from closest threat
            const closest = this.findClosest(threats);
            return { type: 'flee', target: closest };
        }

        // RULE 2: CHASE prey based on COLOR CLASS (strict hierarchy)
        // BUT: Skip hunting if recently fled from predator (survival priority!)
        if (this.size >= 0.5 && this.fleeCooldown <= 0) {
            let prey: WorldEntity[] = [];

            // COLOR-BASED FOOD CHAIN (no same-color cannibalism!)
            if (this.size >= 5.0) {
                // 🔴 RED FISH (5.0-10.0): Hunt BLUE (2-5) and GREEN (0.5-2) - NEVER other reds!
                prey = visible.filter(e => {
                    if (e.type === 'bug') return true; // Can eat bugs (but prefer fish)
                    if (e.type === 'fish') {
                        // Only hunt fish SMALLER than red threshold (no other reds!)
                        return e.size < 5.0;
                    }
                    return false;
                });

                // EFFICIENCY: Prefer fish over bugs
                const fishPrey = prey.filter(e => e.type === 'fish');
                if (fishPrey.length > 0) {
                    prey = fishPrey; // Only hunt fish, ignore bugs
                }

            } else if (this.size >= 2.0) {
                // 🔵 BLUE FISH (2.0-5.0): Hunt GREEN (0.5-2) only - NEVER other blues or reds!
                prey = visible.filter(e => {
                    if (e.type === 'bug') return true; // Can eat bugs (but prefer fish)
                    if (e.type === 'fish') {
                        // Only hunt GREEN fish (< 2.0)
                        return e.size < 2.0;
                    }
                    return false;
                });

                // EFFICIENCY: Prefer fish over bugs (CRITICAL FIX - blues were eating bugs instead of greens!)
                const fishPrey = prey.filter(e => e.type === 'fish');
                if (fishPrey.length > 0) {
                    prey = fishPrey; // Only hunt fish, ignore bugs
                }

            } else {
                // 🟢 GREEN FISH (0.5-2.0): Hunt bugs only - NEVER other fish!
                prey = visible.filter(e => e.type === 'bug');
            }

            if (prey.length > 0) {
                // DIAGNOSTIC: Log blue/red fish hunting
                if (this.size >= 2.0 && Math.random() < 0.02) { // 2% chance per frame
                    const preyTypes = prey.map(p => `${this.getEntityEmoji(p)}(${p.size.toFixed(1)})`).join(', ');
                    console.log(`🔍 ${this.getColorEmoji()} fish sees ${prey.length} prey: ${preyTypes}`);
                }

                // TARGET LOCK SYSTEM: Prevents retargeting during active pursuit
                // Check lock BEFORE re-evaluating prey to prevent distance-based switching
                if (this.targetLockTime > 0) {
                    this.targetLockTime -= 16; // Decay lock timer

                    // If we have a locked target that's still in prey list, keep it
                    if (this.target) {
                        const targetStillVisible = prey.find(p => p.id === this.target!.id);
                        if (targetStillVisible) {
                            // Target lock active and target still visible - maintain pursuit
                            return { type: 'chase', target: this.target };
                        } else {
                            // Target lost (eaten, fled, or out of vision) - clear lock and find new prey
                            this.target = null;
                            this.targetLockTime = 0;
                        }
                    }
                }

                // PREY PREFERENCE SYSTEM (only runs when lock expired or target lost):
                // 🔴 Red fish (5.0-10.0): Blue fish >> Green fish >> Bugs (NEVER other reds)
                // 🔵 Blue fish (2.0-5.0): Green fish >> Bugs (NEVER other blues/reds)
                // 🟢 Green fish (0.5-2.0): Bugs only (NEVER other fish)
                const preferredPrey = this.selectPreferredPrey(prey);

                // Lock onto new target with duration scaled by size
                // Larger fish need more time to close distance to prey
                // Green (size 1): 800ms | Blue (size 3.5): 1050ms | Red (size 7.5): 1350ms
                this.target = preferredPrey;
                this.targetLockTime = 800 + (this.size * 100); // Scales with predator size

                // DIAGNOSTIC: Log blue/red fish targeting
                if (this.size >= 2.0 && Math.random() < 0.02) {
                    console.log(`🎯 ${this.getColorEmoji()} fish locked onto ${this.getEntityEmoji(preferredPrey)}(${preferredPrey.size.toFixed(1)}) at (${Math.round(preferredPrey.x)}, ${Math.round(preferredPrey.y)})`);
                }

                return { type: 'chase', target: this.target };
            } else {
                // No prey available
                this.target = null;
                this.targetLockTime = 0;

                // DIAGNOSTIC: Log when blue/red fish can't find prey
                if (this.size >= 2.0 && Math.random() < 0.01) {
                    const nearbyCount = this.registry.findNearby(this.x, this.y, this.viewDistance, { excludeId: this.id }).length;
                    console.log(`❌ ${this.getColorEmoji()} fish sees NO prey! Visible in cone: ${visible.length}, Nearby (360°): ${nearbyCount}`);
                }
            }
        }

        // RULE 3: WANDER with neighbors (school behavior - GREEN FISH ONLY)
        // Predators (blue/red) hunt independently and don't school
        // Prey (green) school together for safety
        let neighbors: WorldEntity[] = [];

        if (this.size < 2.0) {
            // Only GREEN fish school (prey behavior)
            neighbors = visible.filter(e =>
                e.type === 'fish' &&
                Math.abs(e.size - this.size) < 1.0 // Similar size
            ).slice(0, 5); // Only track nearest 5
        }
        // Blue/red fish return empty neighbors array (wander alone)

        return { type: 'wander', neighbors };
    }

    private findClosest(entities: WorldEntity[]): WorldEntity {
        let closest = entities[0];
        let minDist = Infinity;

        for (const e of entities) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
            if (dist < minDist) {
                minDist = dist;
                closest = e;
            }
        }

        return closest;
    }

    /**
     * Select preferred prey based on predator size and prey type
     *
     * HIERARCHY (energy efficiency):
     * - RED fish (5.0-10.0): Blue fish >> Green fish >> Bugs (ignore bugs if fish available)
     * - BLUE fish (2.0-5.0): Green fish > Bugs
     * - GREEN fish (0.5-2.0): Bugs (god vision for all bugs on screen)
     *
     * Also prevents target switching unless new prey is significantly more attractive
     */
    private selectPreferredPrey(availablePrey: WorldEntity[]): WorldEntity {
        // Score each prey item
        const scoredPrey = availablePrey.map(prey => {
            let score = 0;
            const dist = Phaser.Math.Distance.Between(this.x, this.y, prey.x, prey.y);

            // NO DISTANCE BONUS - Just use type preference and sticky target
            // Distance will be used for tie-breaking at the end

            // PREFERENCE BONUS based on COLOR CLASS
            if (this.size >= 5.0) {
                // 🔴 RED FISH: Strongly prefer BLUE fish, then GREEN, then bugs
                if (prey.type === 'fish') {
                    score += 50; // Massive bonus for fish
                    // Size preference: Prefer blue fish (2-5) over green fish (0.5-2)
                    score += prey.size * 15; // Bigger prey = better (blue ~30-75, green ~7-30)
                }
                // Bugs get no bonus (only hunt if no fish available)

            } else if (this.size >= 2.0) {
                // 🔵 BLUE FISH: Can only hunt GREEN fish (<2.0) or bugs
                if (prey.type === 'fish') {
                    score += 30; // Good bonus for GREEN fish
                    score += prey.size * 5; // Slightly prefer bigger greens
                } else if (prey.type === 'bug') {
                    score += 5;  // Small bonus for bugs
                }

            } else {
                // 🟢 GREEN FISH: Can ONLY hunt bugs (no cannibalism)
                if (prey.type === 'bug') {
                    score += 10; // Bugs are only food source
                }
                // Note: Green fish cannot hunt other fish
            }

            // STICKY TARGET: Massive bonus to prevent frivolous retargeting
            // Fish should NOT switch targets unless new prey is SIGNIFICANTLY better
            if (this.target && prey.id === this.target.id) {
                score += 200; // Large bonus - fish are committed to their hunt
            }

            return { prey, score, dist };
        });

        // PREDATOR FOCUS: If currently hunting fish, DON'T retarget to bugs
        // Red/blue fish should commit to fish prey, not get distracted by nearby bugs
        if (this.target && this.target.type === 'fish') {
            // Filter out bugs - only consider other fish
            const fishOnly = scoredPrey.filter(sp => sp.prey.type === 'fish');
            if (fishOnly.length > 0) {
                // Sort fish prey by score
                fishOnly.sort((a, b) => b.score - a.score);
                return fishOnly[0].prey;
            }
            // Fallback: If no fish available (shouldn't happen), use all prey
        }

        // Sort by score (highest first), then by distance (closest first) for ties
        scoredPrey.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score; // Higher score wins
            }
            return a.dist - b.dist; // Tie-breaker: closer prey wins
        });

        // Return highest-scoring (and if tied, closest) prey
        return scoredPrey[0].prey;
    }

    /**
     * Apply tail beat thrust force in current heading direction
     * BOOST SYSTEM: Simple boost meter (3 seconds boost, 2 seconds recharge)
     * CHASE BONUS: Extra thrust during all chase behavior (pursuit + strike)
     */
    private applyTailBeat(): void {
        let thrustMultiplier = 1.0;

        // PREY PURSUIT BEHAVIOR: Three levels of effort
        if (this.currentBehavior === 'chase') {
            if (this.isStriking) {
                // STRIKE MODE: Brief burst (1-2 sec) when chase failing
                // Only mode that uses boost - high thrust for explosive acceleration
                if (this.boostMeter > 0 && this.boostCooldown === 0) {
                    this.isBoostActive = true;

                    // Red fish (apex predators) get EXPLOSIVE boost power
                    thrustMultiplier = this.size >= 5.0 ? 12.0 : 6.0; // Reds: 12×, Blues/Greens: 6×

                    // Deplete boost meter during strike (based on time since last beat)
                    const timeSinceLastBeat = Date.now() - this.lastBeatTime;
                    const previousMeter = this.boostMeter;
                    this.boostMeter = Math.max(0, this.boostMeter - timeSinceLastBeat);

                    // If boost just depleted, start 10 second cooldown
                    if (previousMeter > 0 && this.boostMeter === 0) {
                        this.boostCooldown = this.boostCooldownDuration;
                        const sizeClass = this.size < 2.0 ? 'Green' : this.size < 5.0 ? 'Blue' : 'Red';
                        console.log(`🔥 ${sizeClass} fish (size ${this.size.toFixed(1)}) boost depleted - 10s cooldown started`);
                    }
                } else {
                    // Boost unavailable - use chase thrust
                    this.isBoostActive = false;
                    thrustMultiplier = this.size >= 5.0 ? 7.0 : 4.0;
                }
            } else {
                // CHASE MODE: Pursuing faster prey (NO BOOST)
                // Higher thrust than feeding, but sustainable
                this.isBoostActive = false;
                thrustMultiplier = this.size >= 5.0 ? 7.0 : 4.0; // Reds: 7×, Blues/Greens: 4×
            }
        } else if (this.target) {
            // FEEDING MODE: Casually eating slow/easy prey (NO BOOST)
            // Lower thrust - fish is just cruising and snapping up food
            this.isBoostActive = false;
            thrustMultiplier = this.size >= 5.0 ? 3.0 : 2.0; // Reds: 3×, Blues/Greens: 2×
        } else if (this.currentBehavior === 'flee') {
            // FLEE BEHAVIOR: Extra thrust to escape predators
            thrustMultiplier = 1.6; // 60% more thrust when fleeing
            this.isBoostActive = false;
        } else {
            this.isBoostActive = false;
        }

        const force = {
            x: Math.cos(Phaser.Math.DegToRad(this.heading)) * this.thrustPower * thrustMultiplier,
            y: Math.sin(Phaser.Math.DegToRad(this.heading)) * this.thrustPower * thrustMultiplier
        };
        this.scene.matter.body.applyForce(this.body, this.body.position, force);

        // Speed cap to prevent runaway acceleration
        // HEAVILY REDUCED to slow crossing speed
        // SIZE BONUS: Larger fish get higher speed caps (size × 2, was 4)
        const currentSpeed = Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.y ** 2);
        const sizeBonus = this.size * 2; // Size 1: +2, Size 5: +10, Size 10: +20

        let maxSpeed = 20 + sizeBonus; // Default for wander (green 22, blue 27, red 35)

        if (this.currentBehavior === 'chase') {
            // Predators get higher speed when chasing, but still reasonable
            maxSpeed = this.isBoostActive ? (45 + sizeBonus) : (35 + sizeBonus);
            // Green chase: 37/47, Blue chase: 42/52, Red chase: 50/60
        } else if (this.currentBehavior === 'flee') {
            // Prey flee speed LOWER than predator chase speed
            maxSpeed = 30 + sizeBonus; // Green flee: 32, Blue flee: 37, Red flee: 45
        }

        if (currentSpeed > maxSpeed) {
            const scale = maxSpeed / currentSpeed;
            this.scene.matter.body.setVelocity(this.body, {
                x: this.body.velocity.x * scale,
                y: this.body.velocity.y * scale
            });
        }
    }

    /**
     * Smooth heading changes to prevent sharp vertical bounces
     * Gradually blends desiredHeading toward targetHeading for natural movement
     *
     * ADAPTIVE SMOOTHING: Different rates based on behavior
     * - Chase: 540°/sec (very fast, allows immediate pursuit)
     * - Flee: 360°/sec (fast response to threats)
     * - Wander: 180°/sec (smooth, natural cruising)
     */
    private smoothHeading(dt: number): void {
        // Adaptive smoothing rate based on current behavior
        let smoothingRate: number;
        if (this.currentBehavior === 'chase') {
            smoothingRate = 540; // Very fast - predators need immediate response
        } else if (this.currentBehavior === 'flee') {
            smoothingRate = 360; // Fast - quick escape response
        } else {
            smoothingRate = 180; // Smooth - natural wandering
        }

        // Calculate shortest angle difference
        let delta = this.targetHeading - this.desiredHeading;
        while (delta > 180) delta -= 360;
        while (delta < -180) delta += 360;

        // Gradually blend toward target
        const maxChange = smoothingRate * dt;
        const change = Phaser.Math.Clamp(delta, -maxChange, maxChange);
        this.desiredHeading += change;

        // Normalize
        while (this.desiredHeading < 0) this.desiredHeading += 360;
        while (this.desiredHeading >= 360) this.desiredHeading -= 360;
    }

    /**
     * Fish Biology: Prevent upside-down swimming
     * Fish maintain dorsal-ventral orientation (belly down) using their vestibular system.
     * Only truly upside-down headings (150°-210°) are corrected, allowing steep dives/climbs.
     * Uses gradual correction instead of hard snapping to prevent zigzag patterns.
     */
    private preventUpsideDown(heading: number): number {
        // Normalize to 0-360
        let normalized = heading % 360;
        if (normalized < 0) normalized += 360;

        // CORE FORBIDDEN ZONE: 150° to 210° (truly belly-up, ±30° from straight down)
        // Transition zones: 135°-150° and 210°-225° (gradual correction)

        const forbiddenStart = 150;
        const forbiddenEnd = 210;
        const transitionWidth = 15; // Degrees of soft transition

        // Fully forbidden zone (hard snap)
        if (normalized > forbiddenStart && normalized < forbiddenEnd) {
            // Find nearest safe heading
            const distToStart = Math.abs(normalized - forbiddenStart);
            const distToEnd = Math.abs(normalized - forbiddenEnd);

            if (distToStart < distToEnd) {
                return forbiddenStart; // Steep dive (acceptable)
            } else {
                return forbiddenEnd; // Steep climb (acceptable)
            }
        }

        // Soft transition zones (gentle push away)
        const transitionStart = forbiddenStart - transitionWidth;
        const transitionEnd = forbiddenEnd + transitionWidth;

        if (normalized > transitionStart && normalized <= forbiddenStart) {
            // Approaching forbidden zone from above - gently push toward safe angle
            const depth = (normalized - transitionStart) / transitionWidth;
            const correction = depth * (forbiddenStart - normalized);
            return normalized + correction * 0.5; // 50% correction
        }

        if (normalized >= forbiddenEnd && normalized < transitionEnd) {
            // Leaving forbidden zone - gently push toward safe angle
            const depth = 1 - ((normalized - forbiddenEnd) / transitionWidth);
            const correction = depth * (forbiddenEnd - normalized);
            return normalized + correction * 0.5; // 50% correction
        }

        return normalized;
    }

    /**
     * Gradually turn toward desired heading (realistic turn rate limit)
     * Includes 180° quick turn for emergency maneuvers
     * BIOLOGY: Prevents upside-down swimming at all times
     */
    private applyTurnRate(dt: number): void {
        // FIRST: Correct desired heading if it would make fish swim upside-down
        this.desiredHeading = this.preventUpsideDown(this.desiredHeading);

        // Calculate shortest angle difference
        let delta = this.desiredHeading - this.heading;
        while (delta > 180) delta -= 360;
        while (delta < -180) delta += 360;

        const absDelta = Math.abs(delta);

        // PHYSICS: Turn rate scales with speed
        // Slower fish can turn much tighter than fast fish
        const currentSpeed = Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.y ** 2);
        const speedRatio = Math.max(0.3, Math.min(1.0, currentSpeed / 100)); // 0.3-1.0 range
        const effectiveTurnRate = this.maxTurnRate / speedRatio; // Slower = tighter turns

        // 180° QUICK TURN: If turn needed is > 120°, execute emergency turn
        // Cost: Lose some velocity (fish must slow to turn sharply)
        // Benefit: Prevents circling, enables sharp course corrections
        if (absDelta > 120) {
            // Snap to desired heading (instant turn)
            this.heading = this.desiredHeading;

            // Pay velocity cost for quick turn (keep 45% momentum for more natural movement)
            const velocityRetention = 0.45;
            this.scene.matter.body.setVelocity(this.body, {
                x: this.body.velocity.x * velocityRetention,
                y: this.body.velocity.y * velocityRetention
            });
        } else {
            // Normal gradual turn (physics-based: slower = tighter)
            const maxTurn = effectiveTurnRate * dt;
            const turn = Phaser.Math.Clamp(delta, -maxTurn, maxTurn);
            this.heading += turn;
        }

        // SECOND: Ensure current heading is also upright (safety check)
        this.heading = this.preventUpsideDown(this.heading);

        // Normalize heading
        while (this.heading < 0) this.heading += 360;
        while (this.heading >= 360) this.heading -= 360;
    }

    private executeDecision(decision: ReturnType<typeof this.makeDecision>, dt: number): void {
        if (decision.type === 'flee' && decision.target) {
            // Flee: Head away from threat, sprint beat interval
            // CLEAN STATE: Clear any previous chase state - we're running for our life!
            this.currentBehavior = 'flee';
            this.target = null;
            this.targetLockTime = 0;
            this.isStriking = false;
            this.lastDistanceToPrey = Infinity;

            // Set flee cooldown - prevents retargeting prey while actively fleeing
            // Short duration (500ms) - fish are hungry and resume feeding quickly after escaping
            this.fleeCooldown = 500;

            const angle = Math.atan2(
                this.y - decision.target.y,
                this.x - decision.target.x
            );
            this.targetHeading = Phaser.Math.RadToDeg(angle);
            this.currentBeatInterval = this.sprintBeatInterval;

        } else if (decision.type === 'chase' && decision.target) {
            // PREY PURSUIT: Varies by fish type
            // BAITFISH (greens < 2.0): ONLY casual feeding, never chase/strike (they're chill prey)
            // PREDATORS (blues/reds >= 2.0): Three modes (FEEDING -> CHASE -> STRIKE)

            // CRITICAL: Set target reference so applyTailBeat() can detect FEEDING mode
            this.target = decision.target;

            // Calculate distance to prey (needed for both baitfish and predators)
            const distToPrey = Phaser.Math.Distance.Between(this.x, this.y, decision.target.x, decision.target.y);

            // BAITFISH BEHAVIOR: Greens stay in wander mode (casual feeding only)
            if (this.size < 2.0) {
                // GREEN FISH: Just chill and eat bugs casually, never aggressive
                this.currentBehavior = 'wander';
                this.isStriking = false;
                this.lastDistanceToPrey = Infinity; // Don't track gap closing
            } else {
                // PREDATOR BEHAVIOR: Blues/Reds use full pursuit system (FEEDING -> CHASE -> STRIKE)
                if (this.currentBehavior !== 'chase' && this.currentBehavior !== 'flee') {
                    this.currentBehavior = 'wander'; // Default: casual feeding (will use target check in applyTailBeat)
                }

                const now = Date.now();

                // Calculate if closing gap
                const closingGap = distToPrey < this.lastDistanceToPrey - 2; // Allowing 2px tolerance
                this.lastDistanceToPrey = distToPrey;

                // STRIKE TIMEOUT: After 1.5 seconds, return to CHASE
                if (this.isStriking && now - this.strikeStartTime > this.strikeDuration) {
                    this.isStriking = false;
                    this.currentBehavior = 'chase'; // Return to CHASE from STRIKE
                    console.log(`⚡ Strike timeout - returning to CHASE`);
                }

                // STRIKE TRIGGER: Enter strike if in CHASE, not closing gap, and close-ish
                const strikeRange = 80 + (Math.sqrt(this.size) * 20); // Blue: 117px, Red: 135px
                if (!this.isStriking && this.currentBehavior === 'chase' && !closingGap && distToPrey < strikeRange) {
                    // Can't close gap while chasing - enter STRIKE burst
                    if (this.boostMeter > 500) { // Need at least 500ms boost available
                        this.isStriking = true;
                        this.strikeStartTime = now;
                        console.log(`🔥 Entering STRIKE mode - boost burst!`);
                    }
                }

                // CHASE ESCALATION: If not closing gap on slow prey, escalate from FEEDING to CHASE
                if (!this.isStriking && this.currentBehavior !== 'chase' && !closingGap && distToPrey > 50) {
                    this.currentBehavior = 'chase'; // Escalate from FEEDING to CHASE
                }
            }

            // INTERCEPT CALCULATION: Predict prey movement
            let interceptX = decision.target.x;
            let interceptY = decision.target.y;

            if (!this.isStriking) {
                // FEEDING/CHASE: Light prediction for intercept
                if (decision.target.sprite && decision.target.sprite.body && decision.target.sprite.body.velocity) {
                    const predictionTime = 0.15;
                    interceptX = decision.target.x + (decision.target.sprite.body.velocity.x * predictionTime);
                    interceptY = decision.target.y + (decision.target.sprite.body.velocity.y * predictionTime);
                } else if (decision.target.sprite && decision.target.sprite.driftVelocity) {
                    const predictionTime = 0.15;
                    interceptX = decision.target.x + (decision.target.sprite.driftVelocity.x * predictionTime);
                    interceptY = decision.target.y + (decision.target.sprite.driftVelocity.y * predictionTime);
                }
            }
            // STRIKE: No prediction - aim directly at current position

            // Head toward intercept point
            const angle = Math.atan2(
                interceptY - this.y,
                interceptX - this.x
            );
            this.targetHeading = Phaser.Math.RadToDeg(angle);

            // DEBUG: Log fish-on-fish pursuit
            if (decision.target.type === 'fish' && Math.random() < 0.05) { // 5% sample
                const headingDiff = Math.abs(this.targetHeading - this.heading);
                const speed = Math.sqrt(this.body.velocity.x**2 + this.body.velocity.y**2);
                console.log(`🎯 ${this.getColorEmoji()} (${this.size.toFixed(1)}) chasing ${this.getEntityEmoji(decision.target)} (${decision.target.size.toFixed(1)}) | Dist: ${distToPrey.toFixed(0)}px | Heading diff: ${headingDiff.toFixed(0)}° | Mode: ${this.isStriking ? 'STRIKE' : this.currentBehavior} | Speed: ${speed.toFixed(1)}`);
            }

            // Beat interval based on mode
            if (this.isStriking) {
                this.currentBeatInterval = this.sprintBeatInterval * 0.5; // Very fast
            } else if (this.currentBehavior === 'chase') {
                this.currentBeatInterval = this.sprintBeatInterval; // Fast
            } else {
                this.currentBeatInterval = this.cruiseBeatInterval; // Normal (FEEDING)
            }

            // Eat prey if within bite range (scales with predator size)
            // Small fish: 25px | Medium: 35px | Large: 45px
            const biteRange = 20 + (this.size * 2.5); // Green: 22-25px, Blue: 25-32px, Red: 32-45px
            if (distToPrey < biteRange) {
                console.log(`🍽️ BITE! ${this.size.toFixed(1)} fish eating ${decision.target.type} at dist ${distToPrey.toFixed(1)}px (bite range: ${biteRange.toFixed(1)}px)`);
                this.eatPrey(decision.target);
                this.isStriking = false;
                this.lastDistanceToPrey = Infinity; // Reset
            }

        } else if (decision.type === 'wander' && decision.neighbors && decision.neighbors.length > 0) {
            // SCHOOLING BEHAVIOR (GREEN FISH ONLY)
            // Match average heading of neighbors for cohesive movement
            this.currentBehavior = 'wander';

            // CLEAN STATE: Clear any leftover chase/flee state
            this.target = null;
            this.targetLockTime = 0;
            this.isStriking = false;
            this.lastDistanceToPrey = Infinity;
            let avgX = 0, avgY = 0;

            for (const n of decision.neighbors) {
                // FIX: Use NEIGHBOR heading, not self heading
                if (n.sprite && typeof n.sprite.heading === 'number') {
                    const neighborHeading = n.sprite.heading;
                    avgX += Math.cos(Phaser.Math.DegToRad(neighborHeading));
                    avgY += Math.sin(Phaser.Math.DegToRad(neighborHeading));
                } else {
                    // Fallback: calculate heading from position difference
                    const dx = n.x - this.x;
                    const dy = n.y - this.y;
                    const angleToNeighbor = Math.atan2(dy, dx);
                    avgX += Math.cos(angleToNeighbor);
                    avgY += Math.sin(angleToNeighbor);
                }
            }

            avgX /= decision.neighbors.length;
            avgY /= decision.neighbors.length;

            // Add randomness to prevent rigid formations
            avgX += (Math.random() - 0.5) * 1.0;
            avgY += (Math.random() - 0.5) * 0.5; // Less vertical randomness for horizontal bias

            // HORIZONTAL BIAS: Reduce vertical component by 40% to encourage horizontal schooling
            avgY *= 0.6;

            this.targetHeading = Phaser.Math.RadToDeg(Math.atan2(avgY, avgX));
            this.currentBeatInterval = this.cruiseBeatInterval;

        } else {
            // INDEPENDENT WANDER (predators and lone fish)
            // LAZY CRUISING: Fish drift horizontally, only occasionally adjusting
            this.currentBehavior = 'wander';

            // CLEAN STATE: Clear any leftover chase/flee state
            this.target = null;
            this.targetLockTime = 0;
            this.isStriking = false;
            this.lastDistanceToPrey = Infinity;

            // SPAWN ZONE AWARENESS: If fish enters orange spawn zones, head toward center
            // This prevents fish from wandering off-screen
            const worldWidth = this.scene.scale.width;
            const worldHeight = this.scene.scale.height;
            const spawnZoneWidth = 96; // Orange zone width on each side

            let inSpawnZone = false;
            if (this.x < spawnZoneWidth) {
                // In LEFT spawn zone - head toward center-right
                const targetX = worldWidth * 0.5 + Phaser.Math.Between(-100, 100);
                const targetY = worldHeight * 0.5 + Phaser.Math.Between(-100, 100);
                const angle = Math.atan2(targetY - this.y, targetX - this.x);
                this.targetHeading = Phaser.Math.RadToDeg(angle);
                inSpawnZone = true;
            } else if (this.x > worldWidth - spawnZoneWidth) {
                // In RIGHT spawn zone - head toward center-left
                const targetX = worldWidth * 0.5 + Phaser.Math.Between(-100, 100);
                const targetY = worldHeight * 0.5 + Phaser.Math.Between(-100, 100);
                const angle = Math.atan2(targetY - this.y, targetX - this.x);
                this.targetHeading = Phaser.Math.RadToDeg(angle);
                inSpawnZone = true;
            }

            // VERY INFREQUENT direction changes (1% per frame = ~once per 1.5 seconds)
            // Skip if we just did a spawn zone turn
            if (!inSpawnZone && Math.random() < 0.01) {
                // Normalize current heading to -180 to 180
                let normalized = this.targetHeading;
                while (normalized > 180) normalized -= 360;
                while (normalized < -180) normalized += 360;

                // HORIZONTAL BIAS: Pull heading toward horizontal (0° or 180°)
                // Determine if heading left or right
                const headingRight = Math.abs(normalized) < 90;
                const horizontalTarget = headingRight ? 0 : 180;

                // 90% of time: Gentle pull toward horizontal (calm cruising)
                if (Math.random() < 0.90) {
                    // Very gentle adjustments toward horizontal
                    const pullTowardHorizontal = (horizontalTarget - normalized) * 0.15;
                    this.targetHeading += pullTowardHorizontal;
                } else {
                    // 10% of time: Tiny random variations
                    this.targetHeading += Phaser.Math.Between(-10, 10);
                }
            }

            this.currentBeatInterval = this.idleBeatInterval; // Slowest beats when idle (1.5 sec)
        }
    }

    private eatPrey(prey: WorldEntity): void {
        // Draw death marker BEFORE destroying prey sprite
        this.drawDeathMarker(prey);

        // Track deaths in scene stats
        const scene = this.scene as any; // Cast to access deathCounts
        if (scene.deathCounts) {
            if (prey.type === 'bug') {
                scene.deathCounts.bugs++;
            } else if (prey.type === 'fish') {
                if (prey.size < 2.0) {
                    scene.deathCounts.green++;
                } else if (prey.size < 5.0) {
                    scene.deathCounts.blue++;
                } else {
                    scene.deathCounts.red++;
                }
            }
        }

        // Destroy the prey sprite
        if (prey.sprite && prey.sprite.destroy) {
            prey.sprite.destroy();
        }

        // Track consumption (for future stats/debugging)
        console.log(`🍽️ Fish ${this.id} (size ${this.size.toFixed(1)}) ate ${prey.type} (size ${prey.size.toFixed(1)})`);

        // POST-CONSUMPTION PAUSE: Fish briefly slow/pause to reorient after strike
        // Scientific basis: Predators decelerate after capture to process/swallow prey
        this.postStrikePause = 500; // 0.5 second pause

        // Apply deceleration (keep 30% momentum)
        this.scene.matter.body.setVelocity(this.body, {
            x: this.body.velocity.x * 0.3,
            y: this.body.velocity.y * 0.3
        });

        // Clear target
        this.target = null;
        this.targetLockTime = 0;

        // No growth mechanics - fish stay at spawn size
    }

    /**
     * Draw a death marker at the location where prey was consumed
     * Circle color matches the prey's color (green/blue/red for fish, gray for bugs)
     * Fades out over 2 seconds
     */
    private drawDeathMarker(prey: WorldEntity): void {
        console.log(`💀 Drawing death marker for ${prey.type} at (${prey.x}, ${prey.y})`);

        // Determine marker color based on prey type and size
        let markerColor: number;
        if (prey.type === 'bug') {
            markerColor = 0x888888; // Gray for bugs
        } else {
            // Fish - use color based on size (same as getSizeColor)
            if (prey.size < 2) markerColor = 0x44ff44;      // Green
            else if (prey.size < 5) markerColor = 0x4444ff; // Blue
            else markerColor = 0xff4444;                     // Red
        }

        // Create graphics object for the death marker
        const marker = this.scene.add.graphics();
        marker.setDepth(10000); // WAY above everything else
        marker.setAlpha(1.0); // Start fully visible

        // Size death marker based on prey type
        let radius: number;
        if (prey.type === 'bug') {
            radius = 2; // Tiny dots for bugs
        } else {
            radius = 6 + (prey.size * 2); // Fish: Green: 8-10px, Blue: 10-16px, Red: 16-26px
        }
        console.log(`   Marker color: 0x${markerColor.toString(16)}, radius: ${radius.toFixed(1)}px`);

        // Just a simple filled circle - no strokes
        marker.fillStyle(markerColor, 0.8);
        marker.fillCircle(prey.x, prey.y, radius);

        // PERSIST FOREVER: Death markers stay on screen to show consumption history
        console.log(`   Death marker will persist (no fade-out)`);

        console.log(`   Marker created successfully`);
    }

    /**
     * DEBUG VISUALIZATION SYSTEM - Color-coded fish behavior analysis
     *
     * CRITICAL: Each color has a specific meaning. DO NOT change these colors.
     *
     * COLOR KEY:
     * - CYAN trail: Historical path with speed-based brightness (faster = brighter)
     * - GREEN arrow: Desired heading (where AI wants fish to go)
     * - MAGENTA arrow: Physics heading (actual velocity direction)
     * - YELLOW triangle: Dorsal fin (top of fish, should point generally upward toward sun)
     * - BLUE triangle: Pelvic fin (belly of fish, should point generally downward toward water)
     * - YELLOW cone: Elliptical vision cone (300px forward, 150px vertical)
     * - RED line: Current target (prey or threat being pursued/fled)
     *
     * STATUS TEXT:
     * - Shows behavior state (CHASE, FLEE, SCHOOL, WANDER, PAUSE)
     * - 🔥 icon when boost is active
     * - Boost percentage (0-100%)
     * - Size, speed, velocity components
     *
     * ECOSYSTEM HIERARCHY:
     * - GREEN fish (0.5-2.0): Bug hunters with GOD VISION for bugs. Prey for blue/red.
     * - BLUE fish (2.0-5.0): Hunt green fish, flee from red fish. Normal vision cone.
     * - RED fish (5.0-10.0): Top predators. Hunt blue>>green, ignore bugs (not worth energy).
     *
     * UPSIDE-DOWN DETECTION:
     * If YELLOW triangle points down and BLUE triangle points up = fish is swimming upside-down (BUG!)
     *
     * FADING SYSTEM:
     * - Trail and historical arrows fade over 10 seconds
     * - Allows analysis of fish behavior changes over time
     */
    private drawDebugVisuals(): void {
        this.debugGraphics.clear();

        // 0. LATERAL LINE DETECTION ZONE: Thin colored oval around fish
        //    Shows proximity sensing range (independent of vision)
        //    Color matches fish: green/blue/red
        const fishColor = this.getFishColor();
        this.debugGraphics.lineStyle(1, fishColor, 0.4); // Thin line, 40% opacity
        this.debugGraphics.strokeEllipse(this.x, this.y, this.lateralLineRadiusX * 2, this.lateralLineRadiusY * 2);

        // 1. COLORED TRAIL: Historical path with speed-based brightness AND age-based fading
        //    Trail color matches fish color (green/blue/red), width shows speed
        //    Faster swimming = brighter + thicker, Older positions = more transparent
        if (this.pathTrail.length > 1) {
            // Find min/max speed for brightness normalization
            let minSpeed = Infinity;
            let maxSpeed = 0;
            for (const point of this.pathTrail) {
                if (point.speed < minSpeed) minSpeed = point.speed;
                if (point.speed > maxSpeed) maxSpeed = point.speed;
            }
            const speedRange = maxSpeed - minSpeed || 1;

            // Get fish color for trail
            const fishColor = this.getSizeColor(this.size);

            // Draw trail segments
            for (let i = 1; i < this.pathTrail.length; i++) {
                const prevPoint = this.pathTrail[i - 1];
                const currPoint = this.pathTrail[i];

                // Speed-based brightness (0.2 = slow/dark, 1.0 = fast/bright)
                const normalizedSpeed = (currPoint.speed - minSpeed) / speedRange;
                const speedBrightness = 0.2 + (normalizedSpeed * 0.8);

                // Age-based fade (1.0 = new, 0.0 = old/faded)
                const ageFade = 1.0 - (currPoint.age / this.maxTrailAge);

                // Combine: brightness * fade
                const opacity = speedBrightness * ageFade;

                // Line width varies with speed (thin = slow, thick = fast)
                const lineWidth = 1 + (normalizedSpeed * 3); // 1-4px width

                this.debugGraphics.lineStyle(lineWidth, fishColor, opacity);
                this.debugGraphics.beginPath();
                this.debugGraphics.moveTo(prevPoint.x, prevPoint.y);
                this.debugGraphics.lineTo(currPoint.x, currPoint.y);
                this.debugGraphics.strokePath();
            }
        }

        // 2. HISTORICAL ARROWS: GREEN (desired) and MAGENTA (physics) alternating
        //    Shows divergence between AI intent (green) and actual movement (magenta)
        //    If green and magenta differ significantly = physics/turn rate limiting AI
        for (const arrow of this.arrowHistory) {
            // Age-based fade (1.0 = new, 0.0 = old/faded)
            const ageFade = 1.0 - (arrow.age / this.maxTrailAge);

            // Color based on type
            const color = arrow.type === 'desired' ? 0x00ff00 : 0xff00ff; // Green or Magenta

            const headingRad = Phaser.Math.DegToRad(arrow.heading);
            const arrowLength = 30;
            const arrowEndX = arrow.x + Math.cos(headingRad) * arrowLength;
            const arrowEndY = arrow.y + Math.sin(headingRad) * arrowLength;

            // Draw arrow shaft
            this.debugGraphics.lineStyle(2, color, ageFade * 0.8);
            this.debugGraphics.beginPath();
            this.debugGraphics.moveTo(arrow.x, arrow.y);
            this.debugGraphics.lineTo(arrowEndX, arrowEndY);
            this.debugGraphics.strokePath();

            // Draw arrowhead
            const arrowheadSize = 8;
            const angle1 = headingRad + Math.PI * 0.8;
            const angle2 = headingRad - Math.PI * 0.8;
            this.debugGraphics.fillStyle(color, ageFade * 0.8);
            this.debugGraphics.beginPath();
            this.debugGraphics.moveTo(arrowEndX, arrowEndY);
            this.debugGraphics.lineTo(arrowEndX + Math.cos(angle1) * arrowheadSize, arrowEndY + Math.sin(angle1) * arrowheadSize);
            this.debugGraphics.lineTo(arrowEndX + Math.cos(angle2) * arrowheadSize, arrowEndY + Math.sin(angle2) * arrowheadSize);
            this.debugGraphics.closePath();
            this.debugGraphics.fillPath();
        }

        // 3. ORIENTATION INDICATORS: YELLOW (dorsal/top) and BLUE (pelvic/belly) triangles
        //    CRITICAL: These show fish body orientation (not heading!)
        //    Mnemonic: YELLOW = sun = UP (dorsal), BLUE = water = DOWN (pelvic)
        //    If reversed (blue up, yellow down) = UPSIDE-DOWN BUG
        const finSize = 8;

        // 3a. YELLOW TRIANGLE: Dorsal fin (top of fish - points toward sun)
        const dorsalAngle = this.heading + 90; // Perpendicular to heading (corrected direction)
        const dorsalRad = Phaser.Math.DegToRad(dorsalAngle);
        const dorsalOffset = (this.displayHeight / 2) + 15;
        const dorsalCenterX = this.x + Math.cos(dorsalRad) * dorsalOffset;
        const dorsalCenterY = this.y + Math.sin(dorsalRad) * dorsalOffset;

        const dorsalTipX = dorsalCenterX + Math.cos(dorsalRad) * finSize;
        const dorsalTipY = dorsalCenterY + Math.sin(dorsalRad) * finSize;

        const dorsalBaseAngle = dorsalAngle + 90;
        const dorsalBaseRad = Phaser.Math.DegToRad(dorsalBaseAngle);
        const dorsalBaseLeft = {
            x: dorsalCenterX + Math.cos(dorsalBaseRad) * (finSize / 2),
            y: dorsalCenterY + Math.sin(dorsalBaseRad) * (finSize / 2)
        };
        const dorsalBaseRight = {
            x: dorsalCenterX - Math.cos(dorsalBaseRad) * (finSize / 2),
            y: dorsalCenterY - Math.sin(dorsalBaseRad) * (finSize / 2)
        };

        this.debugGraphics.fillStyle(0xffff00, 0.7); // Yellow for dorsal (sun = up)
        this.debugGraphics.beginPath();
        this.debugGraphics.moveTo(dorsalTipX, dorsalTipY);
        this.debugGraphics.lineTo(dorsalBaseLeft.x, dorsalBaseLeft.y);
        this.debugGraphics.lineTo(dorsalBaseRight.x, dorsalBaseRight.y);
        this.debugGraphics.closePath();
        this.debugGraphics.fillPath();

        // 3b. BLUE TRIANGLE: Pelvic fin (belly of fish - points toward water/bottom)
        const pelvicAngle = this.heading - 90; // Opposite of dorsal
        const pelvicRad = Phaser.Math.DegToRad(pelvicAngle);
        const pelvicOffset = (this.displayHeight / 2) + 15;
        const pelvicCenterX = this.x + Math.cos(pelvicRad) * pelvicOffset;
        const pelvicCenterY = this.y + Math.sin(pelvicRad) * pelvicOffset;

        const pelvicTipX = pelvicCenterX + Math.cos(pelvicRad) * finSize;
        const pelvicTipY = pelvicCenterY + Math.sin(pelvicRad) * finSize;

        const pelvicBaseAngle = pelvicAngle + 90;
        const pelvicBaseRad = Phaser.Math.DegToRad(pelvicBaseAngle);
        const pelvicBaseLeft = {
            x: pelvicCenterX + Math.cos(pelvicBaseRad) * (finSize / 2),
            y: pelvicCenterY + Math.sin(pelvicBaseRad) * (finSize / 2)
        };
        const pelvicBaseRight = {
            x: pelvicCenterX - Math.cos(pelvicBaseRad) * (finSize / 2),
            y: pelvicCenterY - Math.sin(pelvicBaseRad) * (finSize / 2)
        };

        this.debugGraphics.fillStyle(0x0088ff, 0.7); // Blue for pelvic (water = down)
        this.debugGraphics.beginPath();
        this.debugGraphics.moveTo(pelvicTipX, pelvicTipY);
        this.debugGraphics.lineTo(pelvicBaseLeft.x, pelvicBaseLeft.y);
        this.debugGraphics.lineTo(pelvicBaseRight.x, pelvicBaseRight.y);
        this.debugGraphics.closePath();
        this.debugGraphics.fillPath();

        // 4. CURRENT MAGENTA ARROW: Physics heading (actual velocity direction RIGHT NOW)
        //    This is where the fish is ACTUALLY moving based on Matter.js physics
        const velocity = this.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > 0.1) {
            const physicsHeadingRad = Math.atan2(velocity.y, velocity.x);
            const arrowLength = 40;
            const arrowEndX = this.x + Math.cos(physicsHeadingRad) * arrowLength;
            const arrowEndY = this.y + Math.sin(physicsHeadingRad) * arrowLength;

            // Draw line
            this.debugGraphics.lineStyle(3, 0xff00ff, 0.8); // Magenta for physics
            this.debugGraphics.beginPath();
            this.debugGraphics.moveTo(this.x, this.y);
            this.debugGraphics.lineTo(arrowEndX, arrowEndY);
            this.debugGraphics.strokePath();

            // Draw arrowhead
            const arrowheadSize = 10;
            const angle1 = physicsHeadingRad + Math.PI * 0.8;
            const angle2 = physicsHeadingRad - Math.PI * 0.8;
            this.debugGraphics.fillStyle(0xff00ff, 0.8);
            this.debugGraphics.beginPath();
            this.debugGraphics.moveTo(arrowEndX, arrowEndY);
            this.debugGraphics.lineTo(arrowEndX + Math.cos(angle1) * arrowheadSize, arrowEndY + Math.sin(angle1) * arrowheadSize);
            this.debugGraphics.lineTo(arrowEndX + Math.cos(angle2) * arrowheadSize, arrowEndY + Math.sin(angle2) * arrowheadSize);
            this.debugGraphics.closePath();
            this.debugGraphics.fillPath();
        }

        // 5. CURRENT GREEN ARROW: Desired heading (where AI WANTS fish to go RIGHT NOW)
        //    This is the AI's target direction after smoothing and turn rate limiting
        const desiredHeadingRad = Phaser.Math.DegToRad(this.desiredHeading);
        const desiredArrowLength = 50;
        const desiredEndX = this.x + Math.cos(desiredHeadingRad) * desiredArrowLength;
        const desiredEndY = this.y + Math.sin(desiredHeadingRad) * desiredArrowLength;

        // Draw line
        this.debugGraphics.lineStyle(3, 0x00ff00, 0.8); // Green for desired
        this.debugGraphics.beginPath();
        this.debugGraphics.moveTo(this.x, this.y);
        this.debugGraphics.lineTo(desiredEndX, desiredEndY);
        this.debugGraphics.strokePath();

        // Draw arrowhead
        const arrowheadSize = 10;
        const angle1 = desiredHeadingRad + Math.PI * 0.8;
        const angle2 = desiredHeadingRad - Math.PI * 0.8;
        this.debugGraphics.fillStyle(0x00ff00, 0.8);
        this.debugGraphics.beginPath();
        this.debugGraphics.moveTo(desiredEndX, desiredEndY);
        this.debugGraphics.lineTo(desiredEndX + Math.cos(angle1) * arrowheadSize, desiredEndY + Math.sin(angle1) * arrowheadSize);
        this.debugGraphics.lineTo(desiredEndX + Math.cos(angle2) * arrowheadSize, desiredEndY + Math.sin(angle2) * arrowheadSize);
        this.debugGraphics.closePath();
        this.debugGraphics.fillPath();

        // 6. YELLOW VISION CONE: ELLIPTICAL field of view
        //    90° cone (45° each side), but ELLIPTICAL range SCALES WITH SIZE:
        //    - Forward: viewDistance (250-500px based on size)
        //    - Vertical: viewDistance * 0.5 (125-250px based on size)
        //    Larger predators see farther to compensate for higher speed
        //    NOTE: Green fish (size < 2.0) have GOD VISION for bugs, so no cone displayed
        if (this.size >= 2.0) {
            // Only draw vision cone for blue/red fish
            const headingRad = Phaser.Math.DegToRad(this.heading);
            const coneAngle = 45; // degrees on each side

            // Elliptical vision ranges
            const forwardRange = this.viewDistance; // 300px
            const verticalRange = this.viewDistance * 0.5; // 150px

            // Draw elliptical vision cone using multiple points to approximate ellipse
            this.debugGraphics.lineStyle(1, 0xffff00, 0.15); // Yellow, very transparent
            this.debugGraphics.fillStyle(0xffff00, 0.05);    // Very faint fill
            this.debugGraphics.beginPath();
            this.debugGraphics.moveTo(this.x, this.y);

            // Draw arc from -45° to +45° relative to heading, using elliptical projection
            const numSegments = 12; // Smooth curve
            for (let i = 0; i <= numSegments; i++) {
                const segmentAngle = -coneAngle + (coneAngle * 2 * i / numSegments);
                const angleRad = headingRad + Phaser.Math.DegToRad(segmentAngle);

                // Project onto ellipse
                // Forward component: how much of the radius is in the heading direction
                const forwardComponent = Math.cos(Phaser.Math.DegToRad(segmentAngle));
                const lateralComponent = Math.sin(Phaser.Math.DegToRad(segmentAngle));

                // Elliptical radius: varies based on angle
                // At 0° (straight ahead): use forwardRange (300px)
                // At ±45° (sides): blend between forward and vertical ranges
                const radius = Math.sqrt(
                    Math.pow(forwardRange * forwardComponent, 2) +
                    Math.pow(verticalRange * lateralComponent, 2)
                );

                const px = this.x + Math.cos(angleRad) * radius;
                const py = this.y + Math.sin(angleRad) * radius;

                this.debugGraphics.lineTo(px, py);
            }

            this.debugGraphics.closePath();
            this.debugGraphics.fillPath();
            this.debugGraphics.strokePath();
        }

        // 7. ORANGE TARGET LINE: Shows current chase/flee target (if any)
        //    Line connects fish to its current target entity
        //    Orange circle highlights the target entity
        if (this.target) {
            this.debugGraphics.lineStyle(2, 0xff8800, 0.8); // Orange line
            this.debugGraphics.beginPath();
            this.debugGraphics.moveTo(this.x, this.y);
            this.debugGraphics.lineTo(this.target.x, this.target.y);
            this.debugGraphics.strokePath();

            // Draw circle around target
            this.debugGraphics.lineStyle(2, 0xff8800, 0.6);
            this.debugGraphics.strokeCircle(this.target.x, this.target.y, 15);
        }
    }

    destroy(fromScene?: boolean): void {
        this.debugGraphics.destroy();
        this.statusText.destroy();
        this.registry.unregister(this.id);
        super.destroy(fromScene);
    }
}
