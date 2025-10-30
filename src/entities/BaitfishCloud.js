import GameConfig from '../config/GameConfig.js';
import { Utils } from '../utils/Constants.js';
import Baitfish from './Baitfish.js';
import { getBaitfishSpecies } from '../config/SpeciesData.js';

export class BaitfishCloud {
    constructor(scene, worldX, y, count, speciesType = 'alewife') {
        this.scene = scene;
        this.id = `cloud_${Date.now()}_${Math.random()}`;
        this.worldX = worldX; // World X coordinate (like fish)
        this.centerX = worldX; // Screen X coordinate (calculated in update)
        this.centerY = y;
        // Get dynamic depth scale from scene
        const depthScale = this.scene.sonarDisplay ? this.scene.sonarDisplay.getDepthScale() : GameConfig.DEPTH_SCALE;
        this.depth = y / depthScale;

        // Species information
        this.speciesType = speciesType;
        this.speciesData = getBaitfishSpecies(speciesType);

        // Cloud properties
        this.baitfish = [];
        this.initialCount = count;
        this.visible = true;
        this.age = 0;

        // Movement
        this.velocity = {
            x: Utils.randomBetween(-0.5, 0.5),
            y: Utils.randomBetween(-0.2, 0.2)
        };

        // Cloud state
        this.lakersChasing = [];
        this.beingFrenzyFed = false;
        this.consumedCount = 0;

        // Dynamic schooling properties
        this.scaredLevel = 0; // 0-1, how scared the cloud is
        this.spreadMultiplier = 1.0; // 1.0 = normal, 0.5 = condensed, 2.0 = very spread out

        // Surface trap detection
        this.framesAtSurface = 0; // Track how long stuck at surface

        // Spawn the baitfish
        this.spawnBaitfish(count);
    }

    spawnBaitfish(count) {
        // Adjust spawn pattern based on species behavior
        const schoolingDensity = this.speciesData.schoolingDensity;
        let spreadX = 60;
        let spreadY = 40;

        if (schoolingDensity === 'very_high') {
            // Tighter schools (smelt)
            spreadX = 40;
            spreadY = 25;
        } else if (schoolingDensity === 'none') {
            // Very spread out (sculpin)
            spreadX = 100;
            spreadY = 60;
        }

        for (let i = 0; i < count; i++) {
            // Spawn in a cluster based on species schooling behavior
            const offsetX = Utils.randomBetween(-spreadX, spreadX);
            const offsetY = Utils.randomBetween(-spreadY, spreadY);

            const baitfish = new Baitfish(
                this.scene,
                this.worldX + offsetX,  // Use world coordinates
                this.centerY + offsetY,
                this.id,
                this.speciesType // Pass species type to baitfish
            );

            this.baitfish.push(baitfish);
        }
    }

    update(lakers = [], zooplankton = []) {
        if (!this.visible) return null;

        this.age++;

        // Check for nearby lakers first to determine behavior
        const lakersNearby = this.checkForLakersNearby(lakers);

        // Check for nearby zooplankton (food source)
        const nearbyZooplankton = this.findNearbyZooplankton(zooplankton);

        // Update scared level based on laker proximity
        if (lakersNearby) {
            // Get scared quickly when lakers approach
            this.scaredLevel = Math.min(1.0, this.scaredLevel + 0.15);

            // Determine flee direction (away from nearest laker)
            if (this.lakersChasing.length > 0) {
                const nearestLaker = this.lakersChasing[0];
                const dx = this.worldX - nearestLaker.worldX;
                const dy = this.centerY - nearestLaker.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    const fleeSpeed = 1.2;

                    // SMART FLEE: Detect if trapped at surface
                    const surfaceLimit = 50; // Within 50px (~14 feet) of surface
                    const trappedAtSurface = this.centerY <= surfaceLimit;

                    if (trappedAtSurface && nearestLaker.y > this.centerY) {
                        // Lakers are below us and we're at surface - DIVE THROUGH or flee horizontally
                        const shouldDive = Math.random() < 0.3; // 30% chance to dive through

                        if (shouldDive) {
                            // Bold escape: dive down and sideways to break through
                            this.velocity.x = (dx / dist) * fleeSpeed * 1.5; // Fast horizontal
                            this.velocity.y = 1.5; // Force downward dive
                            console.log('Baitfish cloud diving through lakers to escape surface trap!');
                        } else {
                            // Flee horizontally only (no upward component)
                            this.velocity.x = (dx / dist) * fleeSpeed * 1.5;
                            this.velocity.y = Math.max(0, this.velocity.y * 0.5); // Allow down, prevent up
                        }
                    } else {
                        // Normal flee behavior
                        this.velocity.x = (dx / dist) * fleeSpeed;
                        this.velocity.y = (dy / dist) * fleeSpeed * 0.7; // Slower vertical
                    }
                }
            } else {
                // No specific laker, add erratic movement but keep it moderate
                this.velocity.x += Utils.randomBetween(-0.4, 0.4);
                this.velocity.y += Utils.randomBetween(-0.2, 0.2);
            }

            // Keep velocity reasonable - slower than before to prevent line formation
            this.velocity.x = Math.max(-1.5, Math.min(1.5, this.velocity.x));
            this.velocity.y = Math.max(-1.0, Math.min(1.0, this.velocity.y));

            // Condense the school when scared BUT maintain larger minimum size
            // Changed from 0.4-0.7 to 0.8-1.0 to keep clouds looser when frenzying
            // This prevents fish from bunching into a tight ball
            this.spreadMultiplier = Math.max(0.8, 1.0 - (this.scaredLevel * 0.2));
        } else {
            // Calm down slowly when no lakers nearby
            this.scaredLevel = Math.max(0, this.scaredLevel - 0.02);

            // Spread out when safe (1.5 to 2.0 multiplier)
            this.spreadMultiplier = Math.min(2.0, 1.5 + (1 - this.scaredLevel) * 0.5);

            // Normal active wandering - much more mobile now
            // Increased from 1% to 5% chance per frame for more frequent direction changes
            if (Math.random() < 0.05) {
                this.velocity.x += Utils.randomBetween(-0.4, 0.4);
                this.velocity.y += Utils.randomBetween(-0.2, 0.2);
            }

            // Reduced velocity decay when calm - keeps clouds moving longer
            // Changed from 0.95 to 0.98 (5% decay -> 2% decay)
            this.velocity.x *= 0.98;
            this.velocity.y *= 0.98;

            // Keep velocity reasonable - increased max speeds for more wandering
            this.velocity.x = Math.max(-1.5, Math.min(1.5, this.velocity.x));
            this.velocity.y = Math.max(-0.8, Math.min(0.8, this.velocity.y));
        }

        // Update center position (cloud drifts or flees) - use world coordinates
        this.worldX += this.velocity.x;
        this.centerY += this.velocity.y;
        // Get dynamic depth scale from scene
        const depthScale = this.scene.sonarDisplay ? this.scene.sonarDisplay.getDepthScale() : GameConfig.DEPTH_SCALE;
        this.depth = this.centerY / depthScale;

        // SURFACE TRAP DETECTION: Track if stuck at surface
        const surfaceLimit = 50;
        if (this.centerY <= surfaceLimit) {
            this.framesAtSurface++;

            // If stuck for too long (3 seconds = 180 frames), force a dive
            if (this.framesAtSurface > 180 && lakersNearby) {
                console.log('Cloud stuck at surface for too long - forcing escape dive!');
                this.velocity.y = 2.0; // Strong downward push
                this.framesAtSurface = 0; // Reset counter
            }
        } else {
            // Not at surface, reset counter
            this.framesAtSurface = Math.max(0, this.framesAtSurface - 5); // Decay faster
        }

        // Get lake bottom depth at cloud's current world position
        let bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
        } else if (this.scene.iceHoleManager) {
            // For ice fishing, use hole manager's depth calculation
            bottomDepth = this.scene.iceHoleManager.getDepthAtPosition(this.centerX);
        } else {
            // Nature simulation mode - bottom profile is drawn at maxDepth - 5 feet (deepest point)
            // Subtract 5 to match the visual bottom profile from SonarDisplay.generateBottomProfile()
            bottomDepth = (this.scene.maxDepth || GameConfig.MAX_DEPTH) - 5;
        }

        // Keep cloud in vertical bounds based on water depth
        // Allow baitfish clouds near surface but not at absolute top (prevents sticking at Y=0)
        const minY = 0.5 * depthScale; // 0.5 feet from surface
        const maxY = (bottomDepth - 5) * depthScale; // 5 feet from bottom
        this.centerY = Math.max(minY, Math.min(maxY, this.centerY));

        // Convert world position to screen position based on player position
        // In nature simulation mode, use worldX directly as screen X
        if (this.scene.iceHoleManager) {
            const currentHole = this.scene.iceHoleManager.getCurrentHole();
            const playerWorldX = currentHole ? currentHole.x : this.worldX;
            const offsetFromPlayer = this.worldX - playerWorldX;
            this.centerX = (GameConfig.CANVAS_WIDTH / 2) + offsetFromPlayer;
