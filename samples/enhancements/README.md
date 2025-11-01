# Wolfpack Enhancement Documentation

This directory contains detailed technical documentation for planned enhancements to the Wolfpack fishing simulator.

## Documents

- **[shader-systems.md](./shader-systems.md)** - Comprehensive shader systems for fish rendering, environmental effects, and UI
- **[phaser-architecture.md](./phaser-architecture.md)** - Phaser.js and Matter.js integration patterns
- **[fish-schooling.md](./fish-schooling.md)** - Boids algorithm and group-based fish behavior
- **[technical-specs.md](./technical-specs.md)** - World coordinates, physics parameters, and performance targets

## Current Focus: Baitfish Schooling to Groups

**Goal**: Refactor individual baitfish into unified Fish class using Phaser Groups with Boids algorithm for realistic schooling behavior.

**Key Changes**:
1. Unified Fish class for both baitfish and predator fish
2. Phaser Groups for efficient management
3. Boids algorithm (separation, alignment, cohesion)
4. Spatial hashing with QuadTree for performance
5. Group-level behaviors (threat response, migration)

## Development Workflow

1. **Test in Fish Tank** - Perfect behavior in controlled 50x50x150ft space
2. **Scale to Lake** - Expand tested behaviors to full lake size
3. **Optimize** - Profile and optimize bottlenecks
4. **Polish** - Add visual effects and UI refinement
