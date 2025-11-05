import GameConfig from '../config/GameConfig.js';

/**
 * SchoolingBehavior Component - Boids Algorithm for Fish Schooling
 *
 * Implements classic Boids flocking behavior with predator avoidance:
 * - Separation: Avoid crowding neighbors
 * - Alignment: Match velocity with neighbors
 * - Cohesion: Steer towards center of mass
 * - Flee: Escape from predators
 * - Boundary avoidance: Stay within visible area
 *
 * Can be attached to any fish (baitfish or predators) for schooling behavior
 */
export class SchoolingBehavior {
    /**
     * @param {Object} fish - Fish sprite this behavior is attached to
     * @param {Object} config - Schooling configuration from OrganismData
     */
    constructor(fish, config) {
        this.fish = fish;
        this.config = config;

        // Boids parameters (from config)
        this.baseSeparationRadius = config.separationRadius || 15;
        this.baseAlignmentRadius = config.alignmentRadius || 40;
        this.baseCohesionRadius = config.cohesionRadius || 50;
        this.perceptionRadius = config.perceptionRadius || 100;

        // Current radii (modified dynamically by scared level)
        this.separationRadius = this.baseSeparationRadius;
        this.alignmentRadius = this.baseAlignmentRadius;
        this.cohesionRadius = this.baseCohesionRadius;

        // Force weights
        this.separationWeight = config.separationWeight || 1.5;
        this.alignmentWeight = config.alignmentWeight || 1.0;
        this.cohesionWeight = config.cohesionWeight || 1.0;
        this.fleeWeight = config.fleeWeight || 2.0;

        // Speed parameters
        this.maxSpeed = config.maxSpeed || 2.0;
        this.panicSpeed = config.panicSpeed || 4.0;

        // State
        this.velocity = { x: 0, y: 0 };
        this.isPanicking = false;
        this.panicTimer = 0;
        this.scaredLevel = 0; // 0 = calm, 1 = terrified
        this.spreadMultiplier = 1.0; // Dynamic school density

        // School membership
        this.schoolId = null;
        this.schoolCenter = null; // { worldX, y }
        this.schoolingOffset = null; // Position offset from center

        // Optimization
        this.frameCount = 0;
        this.updateFrequency = config.updateFrequency || 1; // Update every N frames

        // Frozen detection (prevents fish from getting stuck)
        this.lastPosition = null;
        this.frozenFrames = 0;
    }

    /**
     * Update schooling behavior (called from fish's preUpdate)
     * @param {Array} allFish - All fish in scene
     * @param {Array} predators - Predator fish in scene
     */
    update(allFish, predators) {
        // Optimize: only update every N frames
        this.frameCount++;
        if (this.frameCount % this.updateFrequency !== 0) {
            return;
        }

        // Find nearby schoolmates
        const neighbors = this.findNearbySchoolmates(allFish);

        // Calculate Boids forces
        const separation = this.calculateSeparation(neighbors);
        const alignment = this.calculateAlignment(neighbors);
        const cohesion = this.calculateCohesion(neighbors);

        // Check for predators and flee if needed
        const flee = this.calculateFlee(predators);

        // Update scared level based on predator proximity
        this.updateScaredLevel(predators);

        // Dynamic spread multiplier - cluster tighter when scared
        this.updateSpreadMultiplier();

        // School center attraction (if part of a managed school)
        const centerAttraction = this.calculateCenterAttraction();

        // Boundary avoidance
        const boundaryForce = this.calculateBoundaryForce();
        const nearBoundary = boundaryForce.x !== 0 || boundaryForce.y !== 0;

        // Combine forces with dynamic weights
        const fleeActive = flee.x !== 0 || flee.y !== 0;
        const fleeMod = nearBoundary ? 0.1 : 1.0; // Reduce flee near boundaries
        const cohesionMod = fleeActive ? 0.3 : 1.0; // Reduce cohesion when fleeing
        const centerWeight = fleeActive ? 0.5 : (2.0 + (this.scaredLevel * 3.0));

        const forceX =
            separation.x * this.separationWeight +
            alignment.x * this.alignmentWeight +
            cohesion.x * this.cohesionWeight * cohesionMod +
            centerAttraction.x * centerWeight +
            flee.x * this.fleeWeight * fleeMod +
            boundaryForce.x;

        const forceY =
            separation.y * this.separationWeight +
            alignment.y * this.alignmentWeight +
            cohesion.y * this.cohesionWeight * cohesionMod +
            centerAttraction.y * centerWeight +
            flee.y * this.fleeWeight;

        // Apply forces to velocity
        this.velocity.x += forceX;
        this.velocity.y += forceY;

        // Limit speed (use panic speed when scared or fleeing)
        const usePanicSpeed = this.isPanicking || this.scaredLevel > 0.3 || fleeActive;
        const currentSpeed = usePanicSpeed ? this.panicSpeed : this.maxSpeed;

        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        if (speed > currentSpeed) {
            this.velocity.x = (this.velocity.x / speed) * currentSpeed;
            this.velocity.y = (this.velocity.y / speed) * currentSpeed;
        }

        // Extra speed boost when actively fleeing
        if (fleeActive && speed < currentSpeed * 0.8) {
            const boostFactor = 1.3;
            this.velocity.x *= boostFactor;
            this.velocity.y *= boostFactor;
        }

        // Apply velocity to fish position
        this.fish.worldX += this.velocity.x;
        this.fish.y += this.velocity.y;

        // Enforce boundaries
        this.enforceBoundaries();

        // Apply damping
        this.velocity.x *= 0.95;
        this.velocity.y *= 0.95;

        // Update panic state
        if (this.isPanicking) {
            this.panicTimer--;
            if (this.panicTimer <= 0) {
                this.isPanicking = false;
            }
        }

        // Frozen detection
        this.checkFrozen();
    }

    /**
     * Find nearby fish for schooling
     */
    findNearbySchoolmates(allFish) {
        if (!allFish || !Array.isArray(allFish)) return [];

        const neighbors = [];
        const radius = this.perceptionRadius;
        const radiusSq = radius * radius;

        allFish.forEach(other => {
            // Skip self
            if (other === this.fish) return;

            // Only school with same type (bait with bait, predators with predators)
            if (other.type !== this.fish.type) return;

            // Check if other fish has schooling
            if (!other.velocity) return;

            // Quick distance check
            const dx = other.worldX - this.fish.worldX;
            const dy = other.y - this.fish.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < radiusSq) {
                const distance = Math.sqrt(distSq);
                neighbors.push({
                    fish: other,
                    distance,
                    dx,
                    dy
                });
            }
        });

        return neighbors;
    }

    /**
     * BOID RULE 1: Separation - avoid crowding neighbors
     */
    calculateSeparation(neighbors) {
        let steerX = 0;
        let steerY = 0;

        neighbors.forEach(({ fish, distance, dx, dy }) => {
            if (distance < this.separationRadius && distance > 0) {
                // Repel with force inversely proportional to distance
                const force = 1.0 / distance;
                steerX -= dx * force;
                steerY -= dy * force;
            }
        });

        return { x: steerX, y: steerY };
    }

    /**
     * BOID RULE 2: Alignment - match velocity with neighbors
     */
    calculateAlignment(neighbors) {
        if (neighbors.length === 0) return { x: 0, y: 0 };

        let avgVelX = 0;
        let avgVelY = 0;
        let count = 0;

        neighbors.forEach(({ fish, distance }) => {
            if (distance < this.alignmentRadius && fish.velocity) {
                avgVelX += fish.velocity.x;
                avgVelY += fish.velocity.y;
                count++;
            }
        });

        if (count === 0) return { x: 0, y: 0 };

        avgVelX /= count;
        avgVelY /= count;

        // Steer towards average velocity
        return {
            x: (avgVelX - this.velocity.x) * 0.1,
            y: (avgVelY - this.velocity.y) * 0.1
        };
    }

    /**
     * BOID RULE 3: Cohesion - steer towards center of neighbors
     */
    calculateCohesion(neighbors) {
        if (neighbors.length === 0) return { x: 0, y: 0 };

        let centerX = 0;
        let centerY = 0;
        let count = 0;

        neighbors.forEach(({ fish, distance }) => {
            if (distance < this.cohesionRadius) {
                centerX += fish.worldX;
                centerY += fish.y;
                count++;
            }
        });

        if (count === 0) return { x: 0, y: 0 };

        centerX /= count;
        centerY /= count;

        // Steer towards center
        return {
            x: (centerX - this.fish.worldX) * 0.01,
            y: (centerY - this.fish.y) * 0.01
        };
    }

    /**
     * FLEE BEHAVIOR: Escape from nearby predators
     */
    calculateFlee(predators) {
        if (!predators || predators.length === 0) return { x: 0, y: 0 };

        let fleeX = 0;
        let fleeY = 0;
        const fleeRadius = 150;

        predators.forEach(predator => {
            // Only flee from predators (not same type)
            if (predator.type === this.fish.type) return;

            const dx = predator.worldX - this.fish.worldX;
            const dy = predator.y - this.fish.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < fleeRadius && distance > 0) {
                // Flee with force inversely proportional to distance
                const force = (fleeRadius - distance) / fleeRadius;
                fleeX -= (dx / distance) * force * 5.0;
                fleeY -= (dy / distance) * force * 5.0;

                // Trigger panic
                this.isPanicking = true;
                this.panicTimer = 120; // 2 seconds at 60fps
            }
        });

        return { x: fleeX, y: fleeY };
    }

    /**
     * Update scared level based on predator proximity
     */
    updateScaredLevel(predators) {
        if (!predators || predators.length === 0) {
            // Calm down slowly when no predators
            this.scaredLevel = Math.max(0, this.scaredLevel - 0.02);
            return;
        }

        let closestPredatorDist = Infinity;
        predators.forEach(predator => {
            if (predator.type === this.fish.type) return; // Skip same type

            const dx = predator.worldX - this.fish.worldX;
            const dy = predator.y - this.fish.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            closestPredatorDist = Math.min(closestPredatorDist, dist);
        });

        const threatRadius = 150;
        if (closestPredatorDist < threatRadius) {
            // Get scared quickly when predators approach
            this.scaredLevel = Math.min(1.0, this.scaredLevel + 0.15);
        } else {
            // Calm down slowly
            this.scaredLevel = Math.max(0, this.scaredLevel - 0.02);
        }
    }

    /**
     * Update spread multiplier based on scared level
     * Scared fish cluster tighter
     */
    updateSpreadMultiplier() {
        if (this.scaredLevel > 0.2) {
            // Scared: compress to 0.5-0.8 (tighter clustering)
            this.spreadMultiplier = Math.max(0.5, 0.8 - (this.scaredLevel * 0.3));
        } else {
            // Safe: spread out to 1.2-1.5 (looser, more natural)
            this.spreadMultiplier = Math.min(1.5, 1.2 + (1 - this.scaredLevel) * 0.3);
        }

        // Apply spread multiplier to Boids radii
        this.separationRadius = this.baseSeparationRadius * this.spreadMultiplier;
        this.alignmentRadius = this.baseAlignmentRadius * this.spreadMultiplier;
        this.cohesionRadius = this.baseCohesionRadius * this.spreadMultiplier;
    }

    /**
     * Calculate attraction to school center (if part of managed school)
     */
    calculateCenterAttraction() {
        if (!this.schoolCenter || !this.schoolingOffset) {
            return { x: 0, y: 0 };
        }

        const targetWorldX = this.schoolCenter.worldX + this.schoolingOffset.x;
        const targetY = this.schoolCenter.y + this.schoolingOffset.y;

        const dx = targetWorldX - this.fish.worldX;
        const dy = targetY - this.fish.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            // Pull toward school center - stronger when scared
            const strength = Math.min(dist / 100, 1.0);
            const scaredPull = 0.5 + (this.scaredLevel * 0.8);
            return {
                x: (dx / dist) * strength * scaredPull,
                y: (dy / dist) * strength * scaredPull
            };
        }

        return { x: 0, y: 0 };
    }

    /**
     * Calculate boundary avoidance force
     */
    calculateBoundaryForce() {
        const buffer = 200; // Start turning 200px before screen edge
        const boundaryStrength = 15.0;

        const actualGameWidth = this.fish.scene.scale.width || GameConfig.CANVAS_WIDTH;
        const screenX = this.fish.x; // Fish's screen position

        let forceX = 0;

        // Near left edge - push right
        if (screenX < buffer) {
            const distFromEdge = buffer - screenX;
            const forceMagnitude = Math.min(distFromEdge / buffer, 1.0);
            forceX = forceMagnitude * boundaryStrength;
        }
        // Near right edge - push left
        else if (screenX > actualGameWidth - buffer) {
            const distFromEdge = screenX - (actualGameWidth - buffer);
            const forceMagnitude = Math.min(distFromEdge / buffer, 1.0);
            forceX = -forceMagnitude * boundaryStrength;
        }

        return { x: forceX, y: 0 };
    }

    /**
     * Enforce water boundaries (surface and floor)
     */
    enforceBoundaries() {
        const depthScale = this.fish.scene.sonarDisplay ?
            this.fish.scene.sonarDisplay.getDepthScale() :
            GameConfig.DEPTH_SCALE;

        const canvasHeight = this.fish.scene.scale.height;
        const waterFloorY = GameConfig.getWaterFloorY(canvasHeight);
        const bottomDepth = this.fish.scene.maxDepth || GameConfig.MAX_DEPTH;

        const minY = 0.5 * depthScale; // 0.5 feet from surface
        const maxY = (bottomDepth - 3) * depthScale; // 3 feet from bottom

        // Clamp position
        const oldY = this.fish.y;
        this.fish.y = Math.max(minY, Math.min(maxY, this.fish.y));

        // If at boundary and moving toward it, reverse velocity
        if (this.fish.y <= minY && this.velocity.y < 0) {
            this.velocity.y = Math.abs(this.velocity.y) * 0.5; // Bounce down
        } else if (this.fish.y >= maxY && this.velocity.y > 0) {
            this.velocity.y = -Math.abs(this.velocity.y) * 0.5; // Bounce up
        }
    }

    /**
     * Check if fish is frozen (stuck) and give it a nudge
     */
    checkFrozen() {
        if (!this.lastPosition) {
            this.lastPosition = { worldX: this.fish.worldX, y: this.fish.y };
            this.frozenFrames = 0;
            return;
        }

        const dx = this.fish.worldX - this.lastPosition.worldX;
        const dy = this.fish.y - this.lastPosition.y;
        const distMoved = Math.sqrt(dx * dx + dy * dy);

        // If fish hasn't moved more than 1 pixel in 60 frames (1 second)
        if (distMoved < 1.0) {
            this.frozenFrames++;

            // After 60 frames of being frozen, give it a random nudge
            if (this.frozenFrames > 60) {
                this.velocity.x += (Math.random() - 0.5) * 2.0;
                this.velocity.y += (Math.random() - 0.5) * 1.0;
                this.frozenFrames = 0;
                console.log(`Unfreezing stuck ${this.fish.species} fish`);
            }
        } else {
            // Fish is moving, reset frozen counter
            this.frozenFrames = 0;
            this.lastPosition = { worldX: this.fish.worldX, y: this.fish.y };
        }
    }

    /**
     * Set school membership (called by SchoolManager)
     */
    setSchool(schoolId, center, offset) {
        this.schoolId = schoolId;
        this.schoolCenter = center;
        this.schoolingOffset = offset;
    }

    /**
     * Clear school membership
     */
    clearSchool() {
        this.schoolId = null;
        this.schoolCenter = null;
        this.schoolingOffset = null;
    }

    /**
     * Get current velocity (for rendering direction)
     */
    getVelocity() {
        return { ...this.velocity };
    }
}

export default SchoolingBehavior;
