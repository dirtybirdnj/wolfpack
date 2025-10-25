import GameConfig from '../config/GameConfig.js';

export class FishFight {
    constructor(scene, fish, lure) {
        this.scene = scene;
        this.fish = fish;
        this.lure = lure;

        // Fight state
        this.active = true;
        this.hasLanded = false; // Prevent duplicate scoring
        this.lineTension = 20; // Start with some tension
        this.fishDistance = Math.abs(this.fish.y - 0); // Distance to surface
        this.initialDepth = this.fish.y; // Starting depth for visual tracking

        // Fight states: 'hookset', 'fighting', 'thrashing', 'giving_up'
        this.fightState = 'hookset';
        this.stateTimer = 0;
        this.nextThrashTime = 300; // Frames until next potential thrash (~5 seconds at 60fps)
        this.thrashDuration = 0;
        this.thrashIntensity = 0;

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
        this.fishEnergy = 100 - ((1 - biologicalCondition) * 30); // Energy level (starts lower if in poor condition)
        this.fightTime = 0;

        // Downward swimming behavior
        this.swimDownForce = 0;
        this.swimDownTarget = this.fish.y; // Target depth to swim to

        // Thrashing animation
        this.thrashAmount = 0;
        this.thrashSpeed = 0.15 + (biologicalCondition * 0.1); // Healthier fish thrash faster

        console.log(`Fish condition - Health: ${this.fish.health.toFixed(0)}%, Hunger: ${this.fish.hunger.toFixed(0)}%, Strength: ${this.fishStrength.toFixed(1)}, Initial Energy: ${this.fishEnergy.toFixed(1)}`);


        // Visual
        this.tensionBar = scene.add.graphics();
        this.tensionBar.setDepth(500);

        // Attach fish to lure visually
        this.attachFishToLure();

        console.log(`Fish fight started! Fish: ${this.fish.weight.toFixed(1)} lbs, Distance: ${this.fishDistance.toFixed(0)}px, State: ${this.fightState}`);
    }

    update(currentTime, spacePressed) {
        if (!this.active) return;

        this.fightTime++;
        this.stateTimer++;

        // Update fight state based on energy and time
        this.updateFightState();

        // Handle spacebar reeling
        if (spacePressed && currentTime - this.lastReelTime > GameConfig.MIN_REEL_INTERVAL) {
            this.reel(currentTime);
        }

        // Fish pulls on line and tries to swim down based on state
        this.applyFishBehavior();

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

        // Update fish position (pulled toward surface, swims down)
        this.updateFishPosition();

        // Render tension bar
        this.renderTensionBar();
    }

    updateFightState() {
        const energyPercent = this.fishEnergy;

        // State transitions
        switch (this.fightState) {
            case 'hookset':
                // Initial fight lasts about 3 seconds
                if (this.stateTimer > 180) {
                    this.fightState = 'fighting';
                    this.stateTimer = 0;
                    console.log('Fish transitioned to FIGHTING state');
                }
                break;

            case 'fighting':
                // Check for thrashing every 5 seconds
                if (this.stateTimer >= this.nextThrashTime) {
                    this.enterThrashingState();
                }

                // Check if giving up
                if (energyPercent < 25) {
                    this.fightState = 'giving_up';
                    this.stateTimer = 0;
                    console.log('Fish is GIVING UP - energy below 25%');
                }
                break;

            case 'thrashing':
                // Thrash for about 2-3 seconds
                if (this.thrashDuration <= 0) {
                    this.fightState = 'fighting';
                    this.stateTimer = 0;
                    // Next thrash in about 5 seconds
                    this.nextThrashTime = 300 + Math.random() * 120; // 5-7 seconds
                    console.log('Fish returned to FIGHTING state');
                }
                break;

            case 'giving_up':
                // Once giving up, stays in this state
                break;
        }
    }

    enterThrashingState() {
        this.fightState = 'thrashing';
        this.stateTimer = 0;
        this.thrashDuration = 120 + Math.random() * 60; // 2-3 seconds
        this.thrashIntensity = 1.0;

        console.log('Fish entered THRASHING state!');

        // Check for hook spit based on fish size
        const hookSpitChance = this.calculateHookSpitChance();
        if (Math.random() < hookSpitChance) {
            console.log(`Fish spit the hook! (${(hookSpitChance * 100).toFixed(1)}% chance)`);
            this.spitHook();
        }
    }

    calculateHookSpitChance() {
        // Larger fish have higher chance to spit hook
        const sizeCategory = this.fish.sizeCategory;

        let baseChance = 0;
        switch (sizeCategory) {
            case 'SMALL':
                baseChance = 0.02; // 2% chance
                break;
            case 'MEDIUM':
                baseChance = 0.05; // 5% chance
                break;
            case 'LARGE':
                baseChance = 0.10; // 10% chance
                break;
            case 'TROPHY':
                baseChance = 0.15; // 15% chance
                break;
            default:
                baseChance = 0.03;
        }

        // Higher energy fish more likely to spit hook
        const energyFactor = this.fishEnergy / 100;
        return baseChance * (0.5 + energyFactor);
    }

    spitHook() {
        console.log('HOOK SPIT! Fish escaped.');

        // Show message
        const text = this.scene.add.text(GameConfig.CANVAS_WIDTH / 2, 240,
            'HOOK SPIT!\nFish Escaped!',
            {
                fontSize: '26px',
                fontFamily: 'Courier New',
                color: '#ffaa00',
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

        // Release fish from lure
        this.fish.caught = false;
        this.fish.ai.state = 'FLEEING';

        // Set fast escape velocity - dive deep!
        const escapeDirection = this.fish.x < GameConfig.CANVAS_WIDTH / 2 ? -1 : 1;
        this.fish.ai.targetX = escapeDirection < 0 ? -200 : GameConfig.CANVAS_WIDTH + 200;
        this.fish.ai.targetY = this.fish.y + 150; // Dive deep
        this.fish.ai.decisionCooldown = 5000;

        // Reset lure position
        this.lure.reset();

        // Clean up fight
        this.endFight();
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

        // Drain fish energy
        this.fishEnergy -= GameConfig.FISH_TIRE_RATE;
        this.fishEnergy = Math.max(0, this.fishEnergy);
    }

    applyFishBehavior() {
        // Fish behavior varies by state
        const energyMultiplier = this.fishEnergy / 100;

        let pullStrength = 0;
        let swimDownStrength = 0;

        switch (this.fightState) {
            case 'hookset':
                // Initial panic - strong pull and swim down
                pullStrength = GameConfig.FISH_PULL_BASE * this.fishStrength * 1.5;
                swimDownStrength = this.fishStrength * 2.0;
                break;

            case 'fighting':
                // Normal fighting - moderate pull and swim down
                pullStrength = GameConfig.FISH_PULL_BASE * this.fishStrength * energyMultiplier;
                swimDownStrength = this.fishStrength * 1.2 * energyMultiplier;

                // Occasional surges
                if (energyMultiplier > 0.5 && Math.random() < 0.03) {
                    pullStrength *= 1.5;
                    swimDownStrength *= 1.5;
                }
                break;

            case 'thrashing':
                // Violent thrashing - very strong pull but erratic
                this.thrashDuration--;
                pullStrength = GameConfig.FISH_PULL_BASE * this.fishStrength * 2.0 * this.thrashIntensity;
                swimDownStrength = this.fishStrength * 2.5 * this.thrashIntensity;

                // Drain energy faster during thrashing
                this.fishEnergy -= 0.2;
                this.fishEnergy = Math.max(0, this.fishEnergy);
                break;

            case 'giving_up':
                // Weak fighting
                pullStrength = GameConfig.FISH_PULL_BASE * this.fishStrength * 0.3;
                swimDownStrength = this.fishStrength * 0.4;
                break;
        }

        // Apply pull to line tension
        this.lineTension += pullStrength * 0.1;
        this.lineTension = Math.min(GameConfig.MAX_LINE_TENSION, this.lineTension);

        // Apply downward swimming force
        this.swimDownForce = swimDownStrength;

        // Set swim down target based on state
        if (this.fightState === 'thrashing' || this.fightState === 'hookset') {
            // Try to swim deeper
            this.swimDownTarget = this.fish.y + 50;
        } else if (this.fightState === 'giving_up') {
            // Just maintain position
            this.swimDownTarget = this.fish.y;
        } else {
            // Normal fighting - try to go down a bit
            this.swimDownTarget = this.fish.y + 20;
        }
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

        // Base Y position from reeling
        let targetY = this.initialDepth - (this.initialDepth * reelProgress);

        // Apply downward swimming force - fish tries to swim down
        const swimDownEffect = this.swimDownForce * 0.3; // Scale down for realistic movement
        targetY += swimDownEffect;

        // Clamp to prevent fish from swimming too deep or going above starting point
        const maxDepth = Math.min(this.initialDepth + 30, GameConfig.MAX_DEPTH * GameConfig.DEPTH_SCALE);
        targetY = Math.max(0, Math.min(maxDepth, targetY));

        // Fish thrashing animation - more intense during thrashing state
        // Keep horizontal movement smaller so fish stays closer to ice hole
        let thrashMultiplier = 1.0;
        if (this.fightState === 'thrashing') {
            thrashMultiplier = 1.8; // Violent thrashing (reduced from 2.5)
        } else if (this.fightState === 'giving_up') {
            thrashMultiplier = 0.3; // Weak thrashing
        } else if (this.fightState === 'hookset') {
            thrashMultiplier = 1.3; // Strong initial fight (reduced from 1.8)
        }

        // Reduced base thrash from 15 to 8 to keep fish closer to hole
        this.thrashAmount = Math.sin(this.fightTime * this.thrashSpeed) * 8 * thrashMultiplier;

        // Energy affects thrashing intensity
        const energyMultiplier = this.fishEnergy / 100;
        const actualThrash = this.thrashAmount * energyMultiplier;

        // Add vertical thrashing component (fish also thrashes up/down)
        const verticalThrash = Math.cos(this.fightTime * this.thrashSpeed * 1.3) * 6 * thrashMultiplier * energyMultiplier;

        // Position fish at depth with thrashing
        this.fish.x = this.lure.x + actualThrash;
        this.fish.y = targetY + verticalThrash;
        this.fish.depth = this.fish.y / GameConfig.DEPTH_SCALE;

        // Position lure at fish's mouth (slightly offset for visual realism)
        const mouthOffset = actualThrash > 0 ? 8 : -8;
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

        // Fish stats with energy and state
        const energyColor = this.fishEnergy > 60 ? '#00ff00' : this.fishEnergy > 25 ? '#ffaa00' : '#ff6666';

        // State display with colors
        let stateText = this.fightState.toUpperCase();
        let stateColor = '#00ff00';
        switch (this.fightState) {
            case 'hookset':
                stateColor = '#ffff00';
                break;
            case 'fighting':
                stateColor = '#00ff00';
                break;
            case 'thrashing':
                stateColor = '#ff6666';
                stateText = '⚠️ THRASHING ⚠️';
                break;
            case 'giving_up':
                stateColor = '#888888';
                break;
        }

        const statsText = this.scene.add.text(barX, barY + barHeight + 8,
            `Fish: ${this.fish.weight.toFixed(1)} lbs | Energy: ${Math.floor(this.fishEnergy)}% | Dist: ${Math.floor(this.fishDistance / GameConfig.DEPTH_SCALE)} ft`,
            {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: energyColor
            }
        );
        statsText.setDepth(501);

        // State and condition
        const conditionText = this.scene.add.text(barX, barY + barHeight + 21,
            `State: ${stateText} | Health: ${Math.floor(this.fish.health)}% | Hunger: ${Math.floor(this.fish.hunger)}%`,
            {
                fontSize: '9px',
                fontFamily: 'Courier New',
                color: stateColor
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

        // Reset lure position
        this.lure.reset();

        // Clean up fight
        this.endFight();

        // Don't destroy fish immediately - let it swim away
        // It will be removed when it goes off screen
    }

    landFish() {
        // Prevent duplicate scoring - only land the fish once
        if (this.hasLanded) {
            return;
        }
        this.hasLanded = true;

        console.log('Fish landed!');

        const info = this.fish.getInfo();

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

        // Check for achievements
        if (this.scene.scoreSystem) {
            this.scene.scoreSystem.checkAchievements();
        }

        // Show catch popup
        this.showCatchPopup(info);
    }

    showCatchPopup(info) {
        // Pause the game
        this.scene.physics.pause();

        // Create dark overlay
        const overlay = this.scene.add.rectangle(
            0, 0,
            GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT,
            0x000000, 0.8
        );
        overlay.setOrigin(0, 0);
        overlay.setDepth(2000);

        // Create popup background
        const popupWidth = 500;
        const popupHeight = 400;
        const popupX = GameConfig.CANVAS_WIDTH / 2;
        const popupY = GameConfig.CANVAS_HEIGHT / 2;

        const popupBg = this.scene.add.rectangle(
            popupX, popupY,
            popupWidth, popupHeight,
            0x1a1a1a, 1
        );
        popupBg.setStrokeStyle(4, 0x00ff00);
        popupBg.setDepth(2001);

        // Title
        const title = this.scene.add.text(popupX, popupY - 160,
            'FISH CAUGHT!',
            {
                fontSize: '32px',
                fontFamily: 'Courier New',
                color: '#00ff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        title.setOrigin(0.5, 0.5);
        title.setDepth(2002);

        // Create graphics for fish rendering
        const fishGraphics = this.scene.add.graphics();
        fishGraphics.setDepth(2002);

        // Render enlarged fish
        this.fish.renderAtPosition(fishGraphics, popupX, popupY - 40, 4);

        // Fish stats
        // Format age display (fish.age is already in years from calculateBiologicalAge)
        let ageDisplay;
        if (this.fish.age < 2) {
            // Young fish: show in months
            const ageInMonths = Math.round(this.fish.age * 12);
            ageDisplay = `${ageInMonths} months`;
        } else {
            // Adult fish: show in years
            ageDisplay = `${this.fish.age} years`;
        }

        const statsText = this.scene.add.text(popupX, popupY + 100,
            `${info.name} (${info.gender})\n\n` +
            `Weight: ${info.weight}\n` +
            `Length: ${info.length}\n` +
            `Age: ${ageDisplay}\n\n` +
            `Points: +${this.fish.points}`,
            {
                fontSize: '20px',
                fontFamily: 'Courier New',
                color: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3,
                lineSpacing: 8
            }
        );
        statsText.setOrigin(0.5, 0.5);
        statsText.setDepth(2002);

        // Continue prompt
        const continueText = this.scene.add.text(popupX, popupY + 180,
            'Press any button to continue',
            {
                fontSize: '16px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'center'
            }
        );
        continueText.setOrigin(0.5, 0.5);
        continueText.setDepth(2002);

        // Add blinking animation to continue text
        this.scene.tweens.add({
            targets: continueText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Input handler to dismiss popup
        const dismissPopup = () => {
            // Remove all popup elements
            overlay.destroy();
            popupBg.destroy();
            title.destroy();
            fishGraphics.destroy();
            statsText.destroy();
            continueText.destroy();

            // Remove input listeners
            this.scene.input.keyboard.off('keydown', dismissPopup);
            this.scene.input.gamepad.off('down', dismissPopup);

            // Resume game and finish cleanup
            this.scene.physics.resume();
            this.lure.reset();
            this.endFight();
            this.fish.visible = false;
            this.fish.destroy();
        };

        // Listen for any keyboard input
        this.scene.input.keyboard.once('keydown', dismissPopup);

        // Listen for any gamepad button
        if (this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
            this.scene.input.gamepad.once('down', dismissPopup);
        }
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
