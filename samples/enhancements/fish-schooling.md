# Fish Schooling with Phaser Groups

## Overview

Convert individual baitfish management to Phaser Groups with Boids algorithm for realistic schooling behavior.

## Phaser Groups Architecture

### Basic Group Setup

```javascript
// Create fish group
this.fishSchool = this.add.group({
    classType: Fish3D,
    maxSize: 100,
    runChildUpdate: true  // Auto-calls update on each fish
});

// Add fish to group
this.fishSchool.add(new Fish3D(scene, x, y, z, 'smelt'));

// Group operations
this.fishSchool.getChildren().forEach(fish => {
    // Do something to each fish
});
```

## Boids Algorithm for Schooling

Three fundamental rules implemented through group iteration:

### 1. Separation (Avoid Crowding)

```javascript
updateSeparation(fish) {
    const separationRadius = 20; // feet
    const separationForce = new Phaser.Math.Vector3();

    // Find nearby fish
    const neighbors = this.fishSchool.getChildren().filter(other => {
        if (other === fish) return false;
        const distance = Phaser.Math.Distance.Between(
            fish.x, fish.y,
            other.x, other.y
        );
        return distance < separationRadius;
    });

    // Calculate repulsion from each neighbor
    neighbors.forEach(neighbor => {
        const diff = new Phaser.Math.Vector3(
            fish.x - neighbor.x,
            fish.y - neighbor.y,
            fish.z - neighbor.z
        );
        const distance = diff.length();

        if (distance > 0 && distance < separationRadius) {
            diff.normalize();
            diff.scale(1.0 / distance); // Stronger when closer
            separationForce.add(diff);
        }
    });

    return separationForce;
}
```

### 2. Alignment (Steer Toward Average Heading)

```javascript
updateAlignment(fish) {
    const alignmentRadius = 50; // feet
    const avgVelocity = new Phaser.Math.Vector3();
    let count = 0;

    // Find nearby fish
    const neighbors = this.fishSchool.getChildren().filter(other => {
        if (other === fish) return false;
        const distance = Phaser.Math.Distance.Between(
            fish.x, fish.y,
            other.x, other.y
        );
        return distance < alignmentRadius;
    });

    // Calculate average velocity
    neighbors.forEach(neighbor => {
        avgVelocity.add(neighbor.velocity);
        count++;
    });

    if (count > 0) {
        avgVelocity.scale(1.0 / count);
        avgVelocity.normalize();
        avgVelocity.scale(fish.maxSpeed);

        // Steering force
        const steer = avgVelocity.clone().subtract(fish.velocity);
        steer.limit(fish.maxForce);
        return steer;
    }

    return new Phaser.Math.Vector3();
}
```

### 3. Cohesion (Steer Toward Center of Neighbors)

```javascript
updateCohesion(fish) {
    const cohesionRadius = 50; // feet
    const avgPosition = new Phaser.Math.Vector3();
    let count = 0;

    // Find nearby fish
    const neighbors = this.fishSchool.getChildren().filter(other => {
        if (other === fish) return false;
        const distance = Phaser.Math.Distance.Between(
            fish.x, fish.y,
            other.x, other.y
        );
        return distance < cohesionRadius;
    });

    // Calculate center of mass
    neighbors.forEach(neighbor => {
        avgPosition.add(new Phaser.Math.Vector3(
            neighbor.x, neighbor.y, neighbor.z
        ));
        count++;
    });

    if (count > 0) {
        avgPosition.scale(1.0 / count);

        // Seek toward center
        return this.seek(fish, avgPosition);
    }

    return new Phaser.Math.Vector3();
}

seek(fish, target) {
    const desired = target.clone().subtract(
        new Phaser.Math.Vector3(fish.x, fish.y, fish.z)
    );
    desired.normalize();
    desired.scale(fish.maxSpeed);

    const steer = desired.subtract(fish.velocity);
    steer.limit(fish.maxForce);
    return steer;
}
```

## Combined Boids Behavior

```javascript
updateBoids(fish) {
    // Weight factors for each behavior
    const separationWeight = 1.5;
    const alignmentWeight = 1.0;
    const cohesionWeight = 1.0;

    // Calculate forces
    const separation = this.updateSeparation(fish);
    const alignment = this.updateAlignment(fish);
    const cohesion = this.updateCohesion(fish);

    // Apply weights
    separation.scale(separationWeight);
    alignment.scale(alignmentWeight);
    cohesion.scale(cohesionWeight);

    // Combine forces
    const acceleration = new Phaser.Math.Vector3();
    acceleration.add(separation);
    acceleration.add(alignment);
    acceleration.add(cohesion);

    // Apply to fish
    fish.applyForce(acceleration);
}
```

## Optimized Spatial Hashing

### Using Phaser's QuadTree

```javascript
// Enable spatial optimization in scene
create() {
    // QuadTree for fast neighbor queries
    this.physics.world.useTree = true;

    // Set world bounds for QuadTree
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
}

// Query only nearby fish (much faster than checking all)
findNearbyFish(fish, radius) {
    // Use Phaser's built-in spatial query
    const bodies = this.physics.overlapCirc(fish.x, fish.y, radius);

    return bodies
        .map(body => body.gameObject)
        .filter(obj => obj !== fish && obj.isFish);
}
```

### Custom Grid-Based Optimization

```javascript
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    insert(fish) {
        const key = this.getCellKey(fish.x, fish.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(fish);
    }

    getNearby(fish, radius) {
        const cells = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerKey = this.getCellKey(fish.x, fish.y);
        const [cx, cy] = centerKey.split(',').map(Number);

        // Check surrounding cells
        for (let x = cx - cellRadius; x <= cx + cellRadius; x++) {
            for (let y = cy - cellRadius; y <= cy + cellRadius; y++) {
                const key = `${x},${y}`;
                if (this.grid.has(key)) {
                    cells.push(...this.grid.get(key));
                }
            }
        }

        return cells;
    }

    clear() {
        this.grid.clear();
    }
}
```

## Group-Level Behaviors

### Threat Response

```javascript
onThreatDetected(threatPosition, threatRadius) {
    this.fishSchool.getChildren().forEach(fish => {
        const distance = Phaser.Math.Distance.Between(
            fish.x, fish.y,
            threatPosition.x, threatPosition.y
        );

        if (distance < threatRadius) {
            // Flee from threat
            fish.setState('fleeing');
            fish.setFleeTarget(threatPosition);

            // Boost speed temporarily
            fish.maxSpeed *= 1.5;
            fish.panicTimer = 3000; // 3 seconds of panic
        }
    });
}
```

### Depth Migration

```javascript
migrateToDepth(targetDepth, variance = 5) {
    this.fishSchool.getChildren().forEach(fish => {
        // Add random variance so fish don't all target exact same depth
        const individualTarget = targetDepth + Phaser.Math.Between(-variance, variance);
        fish.setTargetDepth(individualTarget);
    });
}
```

### Feeding Behavior

```javascript
onFoodDetected(foodPosition, foodRadius) {
    this.fishSchool.getChildren().forEach(fish => {
        const distance = Phaser.Math.Distance.Between(
            fish.x, fish.y,
            foodPosition.x, foodPosition.y
        );

        if (distance < foodRadius) {
            fish.setState('feeding');
            fish.setTarget(foodPosition);
        }
    });
}
```

### Group Formation Patterns

```javascript
// Circular schooling pattern
formCircularSchool(centerX, centerY, radius) {
    const children = this.fishSchool.getChildren();
    const angleStep = (Math.PI * 2) / children.length;

    children.forEach((fish, index) => {
        const angle = angleStep * index;
        const targetX = centerX + Math.cos(angle) * radius;
        const targetY = centerY + Math.sin(angle) * radius;

        fish.setTarget(targetX, targetY, fish.z);
    });
}

// Column/Ball formation (3D)
formBall(centerX, centerY, centerZ, radius) {
    const children = this.fishSchool.getChildren();

    children.forEach(fish => {
        // Random position within sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = radius * Math.cbrt(Math.random());

        const x = centerX + r * Math.sin(phi) * Math.cos(theta);
        const y = centerY + r * Math.sin(phi) * Math.sin(theta);
        const z = centerZ + r * Math.cos(phi);

        fish.setTarget(x, y, z);
    });
}
```

## Object Pooling for Performance

```javascript
class FishPool extends Phaser.GameObjects.Group {
    constructor(scene) {
        super(scene);

        this.classType = Fish3D;
        this.maxSize = 100;
        this.runChildUpdate = true;

        // Pre-spawn inactive fish
        for (let i = 0; i < 50; i++) {
            const fish = new Fish3D(scene, -1000, -1000, -1000, 'smelt');
            fish.setActive(false).setVisible(false);
            this.add(fish);
        }
    }

    spawn(x, y, z, species) {
        // Get inactive fish from pool
        const fish = this.getFirstDead(false);

        if (fish) {
            fish.spawn(x, y, z, species);
            return fish;
        }

        // Pool exhausted, create new (shouldn't happen often)
        const newFish = new Fish3D(this.scene, x, y, z, species);
        this.add(newFish);
        return newFish;
    }

    despawn(fish) {
        fish.setActive(false);
        fish.setVisible(false);
        fish.setPosition(-1000, -1000);
    }
}
```

## Performance Considerations

### Update Optimization

```javascript
update(time, delta) {
    // Only update boids behavior every N frames
    if (this.frameCount % 3 === 0) {
        this.fishSchool.getChildren().forEach(fish => {
            this.updateBoids(fish);
        });
    }

    // Always update physics (every frame)
    this.fishSchool.getChildren().forEach(fish => {
        fish.updatePhysics(delta);
    });

    this.frameCount++;
}
```

### Level of Detail (LOD)

```javascript
updateFishLOD(fish, camera) {
    const distance = Phaser.Math.Distance.Between(
        camera.scrollX, camera.scrollY,
        fish.x, fish.y
    );

    if (distance > 500) {
        // Far away - simple sprite, no boids
        fish.lodLevel = 0;
        fish.skipBoids = true;
    } else if (distance > 200) {
        // Medium distance - simple sprite, simple boids
        fish.lodLevel = 1;
        fish.boidsUpdateFrequency = 5; // Every 5 frames
    } else {
        // Close - full detail
        fish.lodLevel = 2;
        fish.skipBoids = false;
        fish.boidsUpdateFrequency = 1;
    }
}
```

## Integration Example

```javascript
// In GameScene.js
create() {
    // Create baitfish school
    this.baitfishSchool = new FishPool(this);

    // Spawn initial school
    for (let i = 0; i < 30; i++) {
        const x = Phaser.Math.Between(100, 500);
        const y = Phaser.Math.Between(100, 500);
        const z = Phaser.Math.Between(20, 80);

        this.baitfishSchool.spawn(x, y, z, 'smelt');
    }
}

update(time, delta) {
    // Update schooling behavior
    this.baitfishSchool.getChildren().forEach(fish => {
        if (fish.active) {
            this.updateBoids(fish);
        }
    });
}
```
