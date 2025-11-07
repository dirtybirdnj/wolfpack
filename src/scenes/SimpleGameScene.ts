/**
 * SimpleGameScene - Minimal scene with ONLY simplified ecosystem
 *
 * Purpose: Test simplified fish AI without any complex system interference
 *
 * This scene is a FIREWALL - it shares ZERO code with the complex ecosystem.
 * If this works, we can either:
 *   A) Migrate changes back to GameScene
 *   B) Replace GameScene entirely with this
 */

import Lure from '../entities/Lure.ts';
import FishingLine from '../entities/FishingLine.ts';
import { SimpleEcosystemSpawner } from '../systems/SimpleEcosystemSpawner.ts';
import { EntityRegistry } from '../systems/EntityRegistry.ts';

export class SimpleGameScene extends Phaser.Scene {
    // Core game objects
    private lure!: Lure;
    private fishingLine!: FishingLine;

    // Simplified ecosystem
    private ecosystem!: SimpleEcosystemSpawner;
    private registry!: EntityRegistry;

    // Input
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

    // Debug
    private debugText?: Phaser.GameObjects.Text;
    private statsText?: Phaser.GameObjects.Text;

    // Spawn zones
    private spawnZoneGraphics?: Phaser.GameObjects.Graphics;
    private readonly spawnZoneWidth: number = 96; // 1 inch at 96 DPI

    constructor() {
        super({
            key: 'SimpleGameScene',
            physics: {
                default: 'matter',
                matter: {
                    gravity: { y: 0 },  // No gravity in water
                    debug: false
                }
            }
        });
    }

    create(): void {
        console.log('🌿 SIMPLE GAME SCENE LOADED');

        // Background (simple gradient)
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x001122, 0x001122, 0x003355, 0x003355, 1);
        bg.fillRect(0, 0, this.scale.width, this.scale.height);

        // Create lure (centered, above water)
        this.lure = new Lure(this, this.scale.width / 2, -20);

        // Create fishing line
        this.fishingLine = new FishingLine(this);

        // Initialize simplified ecosystem
        console.log('🐟 Initializing simplified ecosystem...');
        this.registry = EntityRegistry.getInstance();
        this.ecosystem = new SimpleEcosystemSpawner(this);

        this.ecosystem.spawn({
            bugCount: 100,      // LOTS of bugs - motivates greens to stay and feed
            smallFishCount: 10, // Increased bait fish
            mediumFishCount: 3, // Keep some medium
            largeFishCount: 3,  // Only 3 predators
            worldWidth: this.scale.width,
            worldHeight: this.scale.height,
            spawnZoneWidth: this.spawnZoneWidth // Pass spawn zone width for natural fish trajectories
        });

        // Input
        this.cursors = this.input.keyboard?.createCursorKeys();

        // ESC to exit
        this.input.keyboard?.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });

        // Debug text
        this.debugText = this.add.text(10, 10, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });
        this.debugText.setDepth(1000);

        // Stats text (population)
        this.statsText = this.add.text(10, 60, '', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });
        this.statsText.setDepth(1000);

        // Draw spawn zones (orange boxes with 30% opacity)
        this.spawnZoneGraphics = this.add.graphics();
        this.spawnZoneGraphics.setDepth(50); // Behind most things, above background
        this.drawSpawnZones();

        console.log('✅ SimpleGameScene ready');
    }

    update(time: number, delta: number): void {
        // Handle simple keyboard input - VERTICAL ONLY for testing fish targeting
        if (this.cursors) {
            const speed = 5;
            // Only up/down movement
            if (this.cursors.up.isDown) this.lure.y -= speed;
            if (this.cursors.down.isDown) this.lure.y += speed;

            // Clamp to screen bounds
            const maxY = this.scale.height;
            if (this.lure.y < 0) this.lure.y = 0;
            if (this.lure.y > maxY) this.lure.y = maxY;

            // Keep centered horizontally
            this.lure.x = this.scale.width / 2;
        }

        // DON'T call lure.update() - we're controlling it manually

        // Update fishing line
        this.fishingLine.update(this.lure, null);

        // Update ecosystem
        this.ecosystem.update(delta);

        // Update debug display
        const stats = this.ecosystem.getStats();
        if (this.debugText) {
            this.debugText.setText([
                `FPS: ${Math.round(this.game.loop.actualFps)}`,
                `Lure: (${Math.round(this.lure.x)}, ${Math.round(this.lure.y)})`,
                `Entities: ${stats.total}`
            ]);
        }

        if (this.statsText) {
            this.statsText.setText([
                `🐛 Bugs: ${stats.bugs}`,
                `🐟 Small Fish: ${stats.smallFish} (green)`,
                `🐟 Medium Fish: ${stats.mediumFish} (blue)`,
                `🐟 Large Fish: ${stats.largeFish} (red)`,
                ``,
                `Total Fish: ${stats.smallFish + stats.mediumFish + stats.largeFish}`
            ]);
        }
    }

    /**
     * Draw spawn zones on left and right sides of screen
     * Left zone: Spawns fish moving right
     * Right zone: Spawns fish moving left
     * Each zone divided into 3 depth areas: Top (0-33%), Middle (33-66%), Bottom (66-100%)
     */
    private drawSpawnZones(): void {
        if (!this.spawnZoneGraphics) return;

        this.spawnZoneGraphics.clear();

        const height = this.scale.height;
        const width = this.scale.width;

        // Orange with 30% opacity
        const color = 0xff8800;
        const alpha = 0.3;

        // LEFT SPAWN ZONE (fish swim right →)
        this.spawnZoneGraphics.fillStyle(color, alpha);
        this.spawnZoneGraphics.fillRect(0, 0, this.spawnZoneWidth, height);

        // RIGHT SPAWN ZONE (fish swim left ←)
        this.spawnZoneGraphics.fillStyle(color, alpha);
        this.spawnZoneGraphics.fillRect(width - this.spawnZoneWidth, 0, this.spawnZoneWidth, height);

        // Draw horizontal dividers to show Top/Middle/Bottom areas
        const dividerColor = 0xffffff;
        const dividerAlpha = 0.2;
        this.spawnZoneGraphics.lineStyle(1, dividerColor, dividerAlpha);

        // Top/Middle divider (33%)
        const topDivider = height * 0.33;
        this.spawnZoneGraphics.beginPath();
        this.spawnZoneGraphics.moveTo(0, topDivider);
        this.spawnZoneGraphics.lineTo(this.spawnZoneWidth, topDivider);
        this.spawnZoneGraphics.strokePath();

        this.spawnZoneGraphics.beginPath();
        this.spawnZoneGraphics.moveTo(width - this.spawnZoneWidth, topDivider);
        this.spawnZoneGraphics.lineTo(width, topDivider);
        this.spawnZoneGraphics.strokePath();

        // Middle/Bottom divider (66%)
        const bottomDivider = height * 0.66;
        this.spawnZoneGraphics.beginPath();
        this.spawnZoneGraphics.moveTo(0, bottomDivider);
        this.spawnZoneGraphics.lineTo(this.spawnZoneWidth, bottomDivider);
        this.spawnZoneGraphics.strokePath();

        this.spawnZoneGraphics.beginPath();
        this.spawnZoneGraphics.moveTo(width - this.spawnZoneWidth, bottomDivider);
        this.spawnZoneGraphics.lineTo(width, bottomDivider);
        this.spawnZoneGraphics.strokePath();
    }
}

export default SimpleGameScene;
