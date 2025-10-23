import GameConfig from '../config/GameConfig.js';

export class FishFight {
    constructor(scene, fish, lure) {
        this.scene = scene;
        this.fish = fish;
        this.lure = lure;

        // Fight state
        this.active = true;
        this.lineTension = 20; // Start with some tension
        this.fishTiredness = 0; // 0 = fresh, 100 = exhausted
        this.fishDistance = Math.abs(this.fish.y - 0); // Distance to surface

        // Reel tracking
        this.lastReelTime = 0;
        this.reelCount = 0;

        // Fight properties based on fish
        this.fishStrength = this.fish.weight / 5; // Bigger fish = stronger
        this.fightTime = 0;

        // Visual
        this.tensionBar = scene.add.graphics();
        this.tensionBar.setDepth(500);

        console.log(`Fish fight started! Fish: ${this.fish.weight.toFixed(1)} lbs, Distance: ${this.fishDistance.toFixed(0)}px`);
    }

    update(currentTime, spacePressed) {
        if (!this.active) return;

        this.fightTime++;

        // Handle spacebar reeling
        if (spacePressed && currentTime - this.lastReelTime > GameConfig.MIN_REEL_INTERVAL) {
            this.reel(currentTime);
        }

        // Fish pulls on line based on tiredness
        this.applyFishPull();

        // Tension naturally decays (line gives)
        this.lineTension -= GameConfig.TENSION_DECAY_RATE;
        this.lineTension = Math.max(0, this.lineTension);

        // Check for line break
        if (this.lineTension >= GameConfig.TENSION_BREAK_THRESHOLD) {
            this.breakLine();
            return;
        }

        // Check if fish reached surface
        if (this.fishDistance <= 10) {
            this.landFish();
            return;
        }

        // Update fish position (pulled toward surface)
        this.updateFishPosition();

        // Render tension bar
        this.renderTensionBar();
    }

    reel(currentTime) {
        this.lastReelTime = currentTime;
        this.reelCount++;

        // Add tension from reeling
        this.lineTension += GameConfig.TENSION_PER_REEL;
        this.lineTension = Math.min(GameConfig.MAX_LINE_TENSION, this.lineTension);

        // Only reel in if tension is manageable
        if (this.lineTension < GameConfig.TENSION_BREAK_THRESHOLD - 10) {
            this.fishDistance -= GameConfig.REEL_DISTANCE_PER_TAP;
            this.fishDistance = Math.max(0, this.fishDistance);
        }

        // Tire the fish slightly
        this.fishTiredness += GameConfig.FISH_TIRE_RATE;
        this.fishTiredness = Math.min(100, this.fishTiredness);
    }

    applyFishPull() {
        // Fish fights back based on strength and tiredness
        const tirednessMultiplier = 1 - (this.fishTiredness / 100);
        const pullStrength = GameConfig.FISH_PULL_BASE * this.fishStrength * tirednessMultiplier;

        this.lineTension += pullStrength * 0.1; // Apply pull gradually
        this.lineTension = Math.min(GameConfig.MAX_LINE_TENSION, this.lineTension);
    }

    updateFishPosition() {
        // Move fish toward surface based on reel progress
        const targetY = Math.max(0, this.lure.y + this.fishDistance);
        this.fish.y = targetY;
        this.fish.depth = this.fish.y / GameConfig.DEPTH_SCALE;
    }

    renderTensionBar() {
        this.tensionBar.clear();

        const barX = 50;
        const barY = 100;
        const barWidth = 200;
        const barHeight = 30;

        // Background
        this.tensionBar.fillStyle(0x000000, 0.8);
        this.tensionBar.fillRect(barX, barY, barWidth, barHeight);

        // Tension fill
        const tensionPercent = this.lineTension / GameConfig.MAX_LINE_TENSION;
        const fillWidth = barWidth * tensionPercent;

        // Color based on tension level
        let color = 0x00ff00; // Green
        if (tensionPercent > 0.9) {
            color = 0xff0000; // Red - critical!
        } else if (tensionPercent > 0.7) {
            color = 0xff8800; // Orange - warning
        } else if (tensionPercent > 0.5) {
            color = 0xffff00; // Yellow - caution
        }

        this.tensionBar.fillStyle(color, 0.9);
        this.tensionBar.fillRect(barX, barY, fillWidth, barHeight);

        // Border
        this.tensionBar.lineStyle(2, 0xffffff, 1);
        this.tensionBar.strokeRect(barX, barY, barWidth, barHeight);

        // Text
        const tensionText = this.scene.add.text(barX + barWidth / 2, barY + barHeight / 2,
            `TENSION: ${Math.floor(this.lineTension)}%`,
            {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        tensionText.setOrigin(0.5, 0.5);
        tensionText.setDepth(501);

        // Fish stats
        const statsText = this.scene.add.text(barX, barY + barHeight + 10,
            `Fish: ${this.fish.weight.toFixed(1)} lbs | Tiredness: ${Math.floor(this.fishTiredness)}% | Distance: ${Math.floor(this.fishDistance / GameConfig.DEPTH_SCALE)} ft`,
            {
                fontSize: '12px',
                fontFamily: 'Courier New',
                color: '#00ff00'
            }
        );
        statsText.setDepth(501);

        // Instructions
        const instructText = this.scene.add.text(barX, barY - 25,
            'TAP SPACEBAR TO REEL - Manage tension or line breaks!',
            {
                fontSize: '11px',
                fontFamily: 'Courier New',
                color: '#ffff00'
            }
        );
        instructText.setDepth(501);

        // Clean up text objects after render
        this.scene.time.delayedCall(10, () => {
            tensionText.destroy();
            statsText.destroy();
            instructText.destroy();
        });
    }

    breakLine() {
        console.log('LINE BROKE! Fish escaped.');

        // Show message
        const text = this.scene.add.text(400, 300,
            'LINE BROKE!\nFish Escaped!',
            {
                fontSize: '32px',
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
            duration: 2000,
            onComplete: () => text.destroy()
        });

        // Update stats
        this.scene.fishLost++;
        this.scene.events.emit('updateFishLost', this.scene.fishLost);

        // Clean up
        this.endFight();
        this.fish.visible = false;
        this.fish.destroy();
    }

    landFish() {
        console.log('Fish landed!');

        // Show success message
        const info = this.fish.getInfo();
        const text = this.scene.add.text(400, 300,
            `FISH LANDED!\n${info.weight}\n+${this.fish.points} points\nReels: ${this.reelCount}`,
            {
                fontSize: '28px',
                fontFamily: 'Courier New',
                color: '#00ff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            y: 250,
            alpha: 0,
            duration: 3000,
            onComplete: () => text.destroy()
        });

        // Update score
        this.scene.score += this.fish.points;
        this.scene.fishCaught++;
        this.scene.events.emit('updateScore', { score: this.scene.score, caught: this.scene.fishCaught });
        this.scene.checkAchievements();

        // Clean up
        this.endFight();
        this.fish.visible = false;
        this.fish.destroy();
    }

    endFight() {
        this.active = false;
        this.tensionBar.destroy();

        // Remove from scene
        if (this.scene.currentFight === this) {
            this.scene.currentFight = null;
        }
    }
}

export default FishFight;
