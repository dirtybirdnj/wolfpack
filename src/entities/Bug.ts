/**
 * Bug - Minimal prey entity
 *
 * Replaces zooplankton, crayfish, etc.
 * Just drifts around slowly, gets eaten by fish.
 */

import { EntityRegistry } from '../systems/EntityRegistry.ts';

export class Bug extends Phaser.GameObjects.Sprite {
    public size: number;
    public id: string;
    private registry: EntityRegistry;
    private driftVelocity: { x: number; y: number };
    private driftChangeTimer: number;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Use a simple circle sprite (will create this or use existing)
        super(scene, x, y, 'bug');

        this.id = `bug_${Date.now()}_${Math.random()}`;
        this.size = 0.3; // Small, edible by most fish
        this.registry = EntityRegistry.getInstance();

        // Random drift direction
        this.driftVelocity = {
            x: Phaser.Math.Between(-10, 10),
            y: Phaser.Math.Between(-10, 10)
        };
        this.driftChangeTimer = 0;

        // Visual setup
        this.setScale(0.5);
        this.setTint(0x888888);

        // Register in the world phonebook
        this.registry.register({
            id: this.id,
            x: this.x,
            y: this.y,
            size: this.size,
            type: 'bug',
            sprite: this
        });

        scene.add.existing(this);
    }

    update(deltaTime: number): void {
        // Change drift direction occasionally
        this.driftChangeTimer += deltaTime;
        if (this.driftChangeTimer > 2000) { // Every 2 seconds
            this.driftVelocity.x += Phaser.Math.Between(-5, 5);
            this.driftVelocity.y += Phaser.Math.Between(-5, 5);

            // Clamp max drift speed
            const speed = Math.sqrt(this.driftVelocity.x ** 2 + this.driftVelocity.y ** 2);
            if (speed > 15) {
                this.driftVelocity.x = (this.driftVelocity.x / speed) * 15;
                this.driftVelocity.y = (this.driftVelocity.y / speed) * 15;
            }

            this.driftChangeTimer = 0;
        }

        // Move
        const dt = deltaTime / 1000;
        this.x += this.driftVelocity.x * dt;
        this.y += this.driftVelocity.y * dt;

        // Horizontal: Despawn if off-screen
        const worldWidth = this.scene.scale.width;
        if (this.x < 0 || this.x > worldWidth) {
            this.destroy();
            return;
        }

        // Vertical: Hard boundaries with bounce
        const surfaceY = 0;
        const floorY = this.scene.scale.height;
        if (this.y < surfaceY) {
            this.y = surfaceY;
            this.driftVelocity.y = Math.abs(this.driftVelocity.y);
        }
        if (this.y > floorY) {
            this.y = floorY;
            this.driftVelocity.y = -Math.abs(this.driftVelocity.y);
        }

        // Update position in registry
        this.registry.updatePosition(this.id, this.x, this.y);
    }

    destroy(fromScene?: boolean): void {
        // Unregister from world
        this.registry.unregister(this.id);
        super.destroy(fromScene);
    }
}
