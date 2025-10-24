import GameConfig from '../config/GameConfig.js';

export class FishFight {
    constructor(scene, fish, lure) {
        this.scene = scene;
        this.fish = fish;
        this.lure = lure;

        // Fight state
        this.active = true;
        this.lineTension = 20; // Start with some tension
        this.fishDistance = Math.abs(this.fish.y - 0); // Distance to surface
        this.initialDepth = this.fish.y; // Starting depth for visual tracking

        // Reel tracking
        this.lastReelTime = 0;
        this.reelCount = 0;

        // Fight properties based on fish biology
        // High health + low hunger = strong, spirited fight
        // Low health or high hunger = weak, easier fight
        const healthFactor = this.fish.health / 100; // 0-1
        const hungerFactor = 1 - (this.fish.hunger / 100); // 0-1 (low hunger = high fight)
        const biologicalCondition = (healthFactor + hungerFactor) / 2; // Average of both

        this.fishStrength = (this.fish.weight / 5) * biologicalCondition; // Biology affects strength
        this.fishTiredness = (1 - biologicalCondition) * 30; // Poor condition = starts more tired
        this.fightTime = 0;

        // Thrashing animation
        this.thrashAmount = 0;
        this.thrashSpeed = 0.15 + (biologicalCondition * 0.1); // Healthier fish thrash faster

        console.log(`Fish condition - Health: ${this.fish.health.toFixed(0)}%, Hunger: ${this.fish.hunger.toFixed(0)}%, Strength: ${this.fishStrength.toFixed(1)}, Initial Tiredness: ${this.fishTiredness.toFixed(1)}`);


        // Visual
        this.tensionBar = scene.add.graphics();
        this.tensionBar.setDepth(500);

        // Attach fish to lure visually
        this.attachFishToLure();

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

        // Healthy, well-fed fish fight harder with more aggressive pulls
        const healthFactor = this.fish.health / 100;
        const energyFactor = 1 - (this.fish.hunger / 100); // Lower hunger = more energy

        // Combine all factors for realistic fight behavior
        const fightIntensity = tirednessMultiplier * healthFactor * energyFactor;

        const pullStrength = GameConfig.FISH_PULL_BASE * this.fishStrength * fightIntensity;

        // Strong, healthy fish can make sudden surges
        if (fightIntensity > 0.7 && Math.random() < 0.05) {
            // Surge! Extra tension
            this.lineTension += pullStrength * 0.5;
        } else {
            this.lineTension += pullStrength * 0.1; // Apply pull gradually
        }

        this.lineTension = Math.min(GameConfig.MAX_LINE_TENSION, this.lineTension);
    }

    attachFishToLure() {
        // Position fish at lure initially
        this.fish.x = this.lure.x;
        this.fish.y = this.lure.y;
        this.fish.depth = this.fish.y / GameConfig.DEPTH_SCALE;
    }

    updateFishPosition() {
        // Calculate how much the fish has been reeled in
        const reelProgress = 1 - (this.fishDistance / this.initialDepth);

        // Move both lure and fish upward as fish is reeled in
        const targetY = this.initialDepth - (this.initialDepth * reelProgress);

        // Fish thrashing animation - left/right oscillation
        this.thrashAmount = Math.sin(this.fightTime * this.thrashSpeed) * 15;

        // Tired fish thrash less
        const tirednessMultiplier = 1 - (this.fishTiredness / 100);
        const actualThrash = this.thrashAmount * tirednessMultiplier;

        // Position fish at depth with thrashing
        this.fish.x = this.lure.x + actualThrash;
        this.fish.y = targetY;
        this.fish.depth = this.fish.y / GameConfig.DEPTH_SCALE;

        // Position lure at fish's mouth (slightly offset for visual realism)
        // Fish mouth is slightly forward, so offset lure by a few pixels in thrash direction
        const mouthOffset = actualThrash > 0 ? 8 : -8; // Lure at mouth edge
        this.lure.x = this.fish.x + mouthOffset;
        this.lure.y = this.fish.y;
        this.lure.depth = this.lure.y / GameConfig.DEPTH_SCALE;
    }

    renderTensionBar() {
        this.tensionBar.clear();

        const barX = 45;
        const barY = 90;
        const barWidth = 180;
        const barHeight = 26;

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
                fontSize: '11px',
                fontFamily: 'Courier New',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        tensionText.setOrigin(0.5, 0.5);
        tensionText.setDepth(501);

        // Fish stats with health/hunger
        const healthColor = this.fish.health > 60 ? '#00ff00' : this.fish.health > 30 ? '#ffaa00' : '#ff6666';
        const hungerColor = this.fish.hunger > 70 ? '#ff6666' : this.fish.hunger > 40 ? '#ffaa00' : '#00ff00';

        const statsText = this.scene.add.text(barX, barY + barHeight + 8,
            `Fish: ${this.fish.weight.toFixed(1)} lbs | Tired: ${Math.floor(this.fishTiredness)}% | Dist: ${Math.floor(this.fishDistance / GameConfig.DEPTH_SCALE)} ft`,
            {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#00ff00'
            }
        );
        statsText.setDepth(501);

        // Condition stats
        const conditionText = this.scene.add.text(barX, barY + barHeight + 21,
            `Health: ${Math.floor(this.fish.health)}% | Hunger: ${Math.floor(this.fish.hunger)}%`,
            {
                fontSize: '9px',
                fontFamily: 'Courier New',
                color: '#888888'
            }
        );
        conditionText.setDepth(501);

        // Instructions
        const instructText = this.scene.add.text(barX, barY - 20,
            'TAP SPACEBAR TO REEL - Manage tension or line breaks!',
            {
                fontSize: '9px',
                fontFamily: 'Courier New',
                color: '#ffff00'
            }
        );
        instructText.setDepth(501);

        // Clean up text objects after render
        this.scene.time.delayedCall(10, () => {
            tensionText.destroy();
            statsText.destroy();
            conditionText.destroy();
            instructText.destroy();
        });
    }

    breakLine() {
        console.log('LINE BROKE! Fish escaped.');

        // Show message
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 240,
            'LINE BROKE!\nFish Escaped!',
            {
                fontSize: '26px',
                fontFamily: 'Courier New',
                color: '#ff0000',
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
            onComplete: () => text.destroy()
        });

        // Update stats
        this.scene.fishLost++;
        this.scene.events.emit('updateFishLost', this.scene.fishLost);

        // Release fish from lure - fish swims away fast!
        this.fish.caught = false;
        this.fish.ai.state = 'FLEEING';

        // Set fast escape velocity
        const escapeDirection = this.fish.x < GameConfig.CANVAS_WIDTH / 2 ? -1 : 1; // Swim away from center
        this.fish.ai.targetX = escapeDirection < 0 ? -200 : GameConfig.CANVAS_WIDTH + 200;
        this.fish.ai.targetY = this.fish.y + 50; // Dive down a bit
        this.fish.ai.decisionCooldown = 5000; // Long cooldown so it doesn't come back

        // Release all follower baitfish
        this.scene.releaseFollowerBaitfish();

        // Reset lure position
        this.lure.reset();

        // Clean up fight
        this.endFight();

        // Don't destroy fish immediately - let it swim away
        // It will be removed when it goes off screen
    }

    landFish() {
        console.log('Fish landed!');

        // Show success message
        const info = this.fish.getInfo();
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 240,
            `FISH LANDED!\n${info.weight}\n+${this.fish.points} points\nReels: ${this.reelCount}`,
            {
                fontSize: '22px',
                fontFamily: 'Courier New',
                color: '#00ff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        this.scene.tweens.add({
            targets: text,
            y: 200,
            alpha: 0,
            duration: 3000,
            onComplete: () => text.destroy()
        });

        // Store caught fish data for end screen
        const fishData = {
            name: info.name,
            weight: info.weight,
            weightValue: this.fish.weight,
            points: this.fish.points,
            size: info.size,
            gender: info.gender,
            health: this.fish.health,
            hunger: this.fish.hunger,
            depth: this.fish.depth,
            depthZone: this.fish.depthZone.name,
            reelCount: this.reelCount,
            fightTime: this.fightTime,
            isEmergencyFish: this.fish.isEmergencyFish || false
        };
        this.scene.caughtFishData.push(fishData);

        // Update score
        this.scene.score += this.fish.points;
        this.scene.fishCaught++;
        this.scene.events.emit('updateScore', { score: this.scene.score, caught: this.scene.fishCaught });
        this.scene.checkAchievements();

        // Release all follower baitfish
        this.scene.releaseFollowerBaitfish();

        // Reset lure to surface
        this.lure.reset();

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
