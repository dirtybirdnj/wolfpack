import GameConfig from '../config/GameConfig.js';
import { PREDATOR_SPECIES } from '../config/SpeciesData.js';

export class FishFight {
    constructor(scene, fish, lure, fishingLineModel, reelModel) {
        this.scene = scene;
        this.fish = fish;
        this.lure = lure;
        this.fishingLine = fishingLineModel;
        this.reelModel = reelModel;

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

        // Store ice hole center position for fish positioning
        this.centerX = this.lure.x;

        // Initialize line out based on fish depth
        if (this.reelModel) {
            const initialLineOut = this.fishDistance / GameConfig.DEPTH_SCALE; // Convert pixels to feet
            this.reelModel.lineOut = initialLineOut;
        }

        // Determine hookset quality based on fish engagement and timing
        this.hookset = this.determineHooksetQuality();

        console.log(`Fish condition - Health: ${this.fish.health.toFixed(0)}%, Hunger: ${this.fish.hunger.toFixed(0)}%, Strength: ${this.fishStrength.toFixed(1)}, Initial Energy: ${this.fishEnergy.toFixed(1)}`);
        if (this.reelModel && this.fishingLine) {
            const currentDragForce = this.reelModel.getCurrentDragForce();
            const optimalMin = this.fish.weight * 0.5;
            const optimalMax = this.fish.weight * 1.2; // Updated to 120% (sweet spot max)

            console.log(`Reel: ${this.reelModel.getDisplayName()}, Drag: ${this.reelModel.dragSetting}% (${currentDragForce.toFixed(1)} lbs), Line: ${this.reelModel.lineTestStrength} lb test ${this.fishingLine.getDisplayName()}`);
            console.log(`🎣 DRAG GUIDE: Fish weighs ${this.fish.weight.toFixed(1)} lbs. Optimal drag: ${optimalMin.toFixed(1)}-${optimalMax.toFixed(1)} lbs (${Math.round((optimalMin/this.reelModel.maxDragLimit)*100)}-${Math.round((optimalMax/this.reelModel.maxDragLimit)*100)}%)`);
            console.log(`🪝 HOOKSET: ${this.hookset.toUpperCase()} - ${this.getHooksetDescription()}`);
        }


        // Attach fish to lure visually
        this.attachFishToLure();

        console.log(`Fish fight started! Fish: ${this.fish.weight.toFixed(1)} lbs, Distance: ${this.fishDistance.toFixed(0)}px, State: ${this.fightState}`);
    }

    /**
     * Determine hookset quality based on fish engagement and chance
     * Returns: 'barely', 'bad', 'good', or 'great'
     */
    determineHooksetQuality() {
        // Factors that affect hookset quality:
        // 1. Fish engagement state (striking = best, fleeing = worst)
        // 2. Fish hunger (hungry fish commit harder = better hookset)
        // 3. Random chance

        let hooksetScore = 0;

        // Engagement state bonus (0-40 points)
        if (this.fish.engagementState === 'striking') {
            hooksetScore += 40; // Fish committed hard to the strike
        } else if (this.fish.engagementState === 'waiting' || this.fish.engagementState === 'loitering') {
            hooksetScore += 30; // Fish was cautious but took it
        } else if (this.fish.engagementState === 'following') {
            hooksetScore += 20; // Fish was interested
        } else {
            hooksetScore += 10; // Default/fleeing - barely hooked
        }

        // Hunger bonus (0-30 points) - hungry fish bite harder
        const hungerFactor = this.fish.hunger / 100; // 0-1
        hooksetScore += hungerFactor * 30;

        // Random variance (0-30 points) - luck of the hookset
        hooksetScore += Math.random() * 30;

        // Convert score to quality (0-100 scale)
        // 0-25: barely
        // 26-50: bad
        // 51-75: good
        // 76-100: great
        if (hooksetScore < 25) {
            return 'barely';
        } else if (hooksetScore < 50) {
            return 'bad';
        } else if (hooksetScore < 75) {
            return 'good';
        } else {
            return 'great';
        }
    }

    /**
     * Get description of hookset quality
     */
    getHooksetDescription() {
        switch (this.hookset) {
            case 'barely':
                return 'Hook barely caught, high risk of losing fish';
            case 'bad':
                return 'Poor hookset, fish may shake loose';
            case 'good':
                return 'Solid hookset, normal fight';
            case 'great':
                return 'Perfect hookset! Hook is deep and secure';
            default:
                return 'Unknown';
        }
    }

    /**
     * Get hookset multiplier for hook spit/pop-off chance
     * Lower multiplier = less chance of losing fish
     */
    getHooksetSecurityMultiplier() {
        switch (this.hookset) {
            case 'barely':
                return 2.5; // 2.5x more likely to pop off
            case 'bad':
                return 1.5; // 1.5x more likely to pop off
            case 'good':
                return 1.0; // Normal chance
            case 'great':
                return 0.3; // 70% less likely to pop off!
            default:
                return 1.0;
        }
    }

    update(currentTime, spacePressed) {
        if (!this.active) {return;}

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

        // Check for line break - scientifically accurate formula
        // Line breaks when tension exceeds test strength, modified by shock absorption
        if (this.reelModel && this.fishingLine) {
            const testStrength = this.reelModel.lineTestStrength; // pounds
            const shockAbsorptionMult = this.fishingLine.getShockAbsorptionMultiplier();

            // Convert tension percentage to approximate force
            // Tension of 100 = roughly equivalent to a 20 lb fish thrashing
            const approximateForce = (this.lineTension / 100) * 20;

            // Apply shock absorption to effective break threshold
            const effectiveBreakStrength = testStrength * shockAbsorptionMult * 1.2;
            // Monofilament: 15 lb test * 0.9 shock * 1.2 = 16.2 lb effective
            // Braid: 15 lb test * 0.5 shock * 1.2 = 9 lb effective (breaks easier)

            if (approximateForce >= effectiveBreakStrength) {
                console.log(`Line break! Force: ${approximateForce.toFixed(1)} lbs exceeded ${effectiveBreakStrength.toFixed(1)} lbs effective strength`);
                this.breakLine();
                return;
            }
        } else {
            // Fallback to old logic if models not available
            if (this.lineTension >= GameConfig.TENSION_BREAK_THRESHOLD) {
                this.breakLine();
                return;
            }
        }

        // Check if fish reached surface
        if (this.fishDistance <= 10) {
            this.landFish();
            return;
        }

        // Update fish position (pulled toward surface, swims down)
        this.updateFishPosition();

        // Emit tension update to scene for header display
        this.scene.events.emit('updateLineTension', this.lineTension);
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
        let finalChance = baseChance * (0.5 + energyFactor);

        // Apply hookset quality modifier - HUGE impact!
        const hooksetMultiplier = this.getHooksetSecurityMultiplier();
        finalChance *= hooksetMultiplier;

        // Log for debugging (occasionally)
        if (Math.random() < 0.1) {
            console.log(`Hook spit chance: ${(finalChance * 100).toFixed(1)}% (base: ${(baseChance * 100).toFixed(1)}%, hookset: ${this.hookset}, mult: ${hooksetMultiplier.toFixed(1)}x)`);
        }

        return finalChance;
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

        // Calculate tension from reeling - affected by line stretch
        // More stretch = less immediate tension increase
        const stretchFactor = this.fishingLine ? this.fishingLine.getStretchFactor() : 0.7;
        const tensionIncrease = GameConfig.TENSION_PER_REEL * (2.0 - stretchFactor);
        // Monofilament (stretch=0.9): 1.1x multiplier = 16.5 tension
        // Braid (stretch=0.5): 1.5x multiplier = 22.5 tension

        this.lineTension += tensionIncrease;
        this.lineTension = Math.min(GameConfig.MAX_LINE_TENSION, this.lineTension);

        // Only reel in if tension is manageable
        if (this.lineTension < GameConfig.TENSION_BREAK_THRESHOLD - 10) {
            // Calculate reel distance based on gear ratio
            const gearRatio = this.reelModel ? this.reelModel.getGearRatio() : 6.0;
            const reelDistance = GameConfig.REEL_DISTANCE_PER_TAP * (gearRatio / 6.0);

            this.fishDistance -= reelDistance;
            this.fishDistance = Math.max(0, this.fishDistance);

            // Track line being retrieved
            if (this.reelModel) {
                this.reelModel.retrieveLine(reelDistance / GameConfig.DEPTH_SCALE); // Convert pixels to feet
            }
        }

        // Drain fish energy based on drag setting
        const dragMultiplier = this.reelModel ? (this.reelModel.dragSetting / 100) : 0.5;
        const energyDrain = GameConfig.FISH_TIRE_RATE * (0.5 + dragMultiplier);
        // Higher drag = fish tires faster
        this.fishEnergy -= energyDrain;
        this.fishEnergy = Math.max(0, this.fishEnergy);
    }

    applyFishBehavior() {
        // Fish behavior varies by state
        const energyMultiplier = this.fishEnergy / 100;

        // NEW: Fish pull force is based directly on fish weight in pounds
        // This creates realistic drag scenarios
        const basePullForce = this.fish.weight; // Fish pulls with force proportional to its weight

        // State multipliers determine how hard the fish fights
        let stateMultiplier = 1.0;
        let swimDownStrength = 0;

        switch (this.fightState) {
            case 'hookset':
                // Initial panic - fish pulls at 150% of its weight
                stateMultiplier = 1.5;
                swimDownStrength = this.fishStrength * 2.0;
                break;

            case 'fighting':
                // Normal fighting - fish pulls at its body weight
                stateMultiplier = 1.0;
                swimDownStrength = this.fishStrength * 1.2 * energyMultiplier;

                // Occasional surges - fish suddenly pulls harder
                if (energyMultiplier > 0.5 && Math.random() < 0.03) {
                    stateMultiplier = 1.5;
                    swimDownStrength *= 1.5;
                }
                break;

            case 'thrashing':
                // Violent thrashing - fish pulls at 200% of its weight!
                this.thrashDuration--;
                stateMultiplier = 2.0 * this.thrashIntensity;
                swimDownStrength = this.fishStrength * 2.5 * this.thrashIntensity;

                // Drain energy faster during thrashing
                this.fishEnergy -= 0.2;
                this.fishEnergy = Math.max(0, this.fishEnergy);
                break;

            case 'giving_up':
                // Weak fighting - fish only pulls at 30% of its weight
                stateMultiplier = 0.3;
                swimDownStrength = this.fishStrength * 0.4;
                break;
        }

        // Energy affects how hard the fish can pull (tired fish pulls less)
        const fishPullForce = basePullForce * stateMultiplier * energyMultiplier;

        // REALISTIC DRAG SYSTEM: Check if fish pull exceeds drag setting
        if (this.reelModel) {
            const currentDragForce = this.reelModel.getCurrentDragForce(); // in pounds
            const shockAbsorption = this.fishingLine ? this.fishingLine.getShockAbsorptionMultiplier() : 0.7;
            const stretchFactor = this.fishingLine ? this.fishingLine.getStretchFactor() : 0.7;

            // If fish pull force exceeds drag force, line slips out (fish takes line)
            if (fishPullForce > currentDragForce) {
                // Calculate how much line slips based on excess force
                const excessForce = fishPullForce - currentDragForce;
                const forceRatio = excessForce / fishPullForce; // 0 to 1

                // Line slips faster when fish pulls much harder than drag
                // A 12 lb fish vs 10 lb drag (2 lb excess) = 16.7% slip rate = ~0.08 ft/frame
                // A 12 lb fish vs 5 lb drag (7 lb excess) = 58% slip rate = ~0.3 ft/frame
                const lineSlip = forceRatio * 0.5; // feet of line going out per frame

                const spoolEmpty = this.reelModel.addLineOut(lineSlip);

                // If spool empties, line breaks automatically
                if (spoolEmpty) {
                    console.log(`SPOOL EMPTY! Line capacity exhausted. Fish pull: ${fishPullForce.toFixed(1)} lbs > Drag: ${currentDragForce.toFixed(1)} lbs`);
                    this.breakLine();
                    return;
                }

                // When line slips, tension is RELIEVED (drag absorbs the force)
                // The drag system prevents tension from building when fish pulls
                this.lineTension *= 0.85; // Significant tension relief

                // Visual feedback - show that line is slipping
                if (Math.random() < 0.1) { // Occasional console log (10% of frames)
                    console.log(`Line slipping! Fish: ${fishPullForce.toFixed(1)} lbs > Drag: ${currentDragForce.toFixed(1)} lbs (${lineSlip.toFixed(2)} ft out)`);
                }
            } else {
                // Drag is holding - fish CANNOT pull line out
                // Proper drag (50-100% of fish pull) maintains pressure and prevents hook spitting
                // Only excessive drag (150%+) causes tension buildup

                const dragRatio = currentDragForce / fishPullForce;

                if (dragRatio > 1.5) {
                    // Drag is TOO TIGHT (150%+ of fish pull) - creates significant tension
                    const dampeningFactor = shockAbsorption * (2.0 - stretchFactor);
                    const tensionIncrease = (fishPullForce * 0.3) * (2.0 - dampeningFactor);
                    this.lineTension += tensionIncrease;
                    this.lineTension = Math.min(GameConfig.MAX_LINE_TENSION, this.lineTension);
                } else if (dragRatio > 1.2) {
                    // Drag is tight but manageable (120-150%) - minor tension buildup
                    const dampeningFactor = shockAbsorption * (2.0 - stretchFactor);
                    const tensionIncrease = (fishPullForce * 0.1) * (2.0 - dampeningFactor);
                    this.lineTension += tensionIncrease;
                    this.lineTension = Math.min(GameConfig.MAX_LINE_TENSION, this.lineTension);
                } else {
                    // Drag is in the sweet spot (50-120% of fish pull)
                    // This is IDEAL - maintains pressure, prevents hook spitting, no tension buildup
                    // Tension actually decreases slightly as the drag does its job
                    this.lineTension *= 0.98;
                }
            }
        }

        // Apply downward swimming force
        this.swimDownForce = swimDownStrength;

        // Set swim down target based on state
        // Fish can now pull harder and dive deeper thanks to hookset system preventing pop-offs
        if (this.fightState === 'thrashing' || this.fightState === 'hookset') {
            // Try to swim much deeper - aggressive diving!
            this.swimDownTarget = this.fish.y + 80; // Increased from 50
        } else if (this.fightState === 'giving_up') {
            // Just maintain position
            this.swimDownTarget = this.fish.y;
        } else {
            // Normal fighting - moderate diving
            this.swimDownTarget = this.fish.y + 40; // Increased from 20
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
        const swimDownEffect = this.swimDownForce * 0.4; // Increased from 0.3 - stronger swim down
        targetY += swimDownEffect;

        // Clamp to prevent fish from swimming too deep or going above starting point
        // Fish can now dive up to 60 feet deeper than start (increased from 30)
        const maxDepth = Math.min(this.initialDepth + 60, GameConfig.MAX_DEPTH * GameConfig.DEPTH_SCALE);
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

        // Position fish at depth with thrashing (relative to ice hole center, not current lure position)
        this.fish.x = this.centerX + actualThrash;
        this.fish.y = targetY + verticalThrash;
        this.fish.depth = this.fish.y / GameConfig.DEPTH_SCALE;

        // Position lure at fish's mouth (slightly offset for visual realism)
        const mouthOffset = actualThrash > 0 ? 8 : -8;
        this.lure.x = this.fish.x + mouthOffset;
        this.lure.y = this.fish.y;
        this.lure.depth = this.lure.y / GameConfig.DEPTH_SCALE;
    }

    // Tension bar moved to header UI - method kept for reference but not used
    renderTensionBar() {
        // Commented out - tension now displayed in header
        /* this.tensionBar.clear();

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

        // Calculate line remaining color
        let lineRemainingPercent = 100;
        let lineRemainingColor = '#00ff00';
        if (this.reelModel) {
            lineRemainingPercent = this.reelModel.getLineRemainingPercent();
            if (lineRemainingPercent < 25) {
                lineRemainingColor = '#ff6666'; // Red - critical
            } else if (lineRemainingPercent < 50) {
                lineRemainingColor = '#ffaa00'; // Orange - warning
            } else {
                lineRemainingColor = '#00ff00'; // Green - safe
            }
        }

        const statsText = this.scene.add.text(barX, barY + barHeight + 8,
            `Fish: ${this.fish.weight.toFixed(1)} lbs | Energy: ${Math.floor(this.fishEnergy)}% | Dist: ${Math.floor(this.fishDistance / GameConfig.DEPTH_SCALE)} ft | Line: ${this.reelModel ? Math.floor(this.reelModel.lineCapacity - this.reelModel.lineOut) : '?'}/${this.reelModel ? this.reelModel.lineCapacity : '?'} ft`,
            {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: energyColor
            }
        );
        statsText.setDepth(501);

        // Add drag and line info with effectiveness indicator
        let dragColor = lineRemainingColor;
        let dragStatus = '';

        if (this.reelModel) {
            const currentDragForce = this.reelModel.getCurrentDragForce();
            const basePullForce = this.fish.weight;

            // Calculate drag effectiveness ranges
            // Optimal: 50-120% of fish weight (sweet spot - prevents spitting, no tension)
            // OK: 40-50% or 120-150% (workable)
            // Too low: < 40% (fish runs easily)
            // Too high: > 150% (builds tension quickly)

            if (currentDragForce < basePullForce * 0.4) {
                dragColor = '#ff6666'; // Red - too low, fish will run
                dragStatus = ' TOO LOW!';
            } else if (currentDragForce > basePullForce * 1.5) {
                dragColor = '#ff6666'; // Red - too high, line will break
                dragStatus = ' TOO HIGH!';
            } else if (currentDragForce >= basePullForce * 0.5 && currentDragForce <= basePullForce * 1.2) {
                dragColor = '#00ff00'; // Green - perfect sweet spot!
                dragStatus = ' OPTIMAL';
            } else {
                dragColor = '#ffaa00'; // Orange - workable but not ideal
                dragStatus = ' OK';
            }
        }

        const dragText = this.scene.add.text(barX + 300, barY + barHeight + 8,
            `Drag: ${this.reelModel ? this.reelModel.dragSetting : '?'}% (${this.reelModel ? this.reelModel.getCurrentDragForce().toFixed(1) : '?'} lbs)${dragStatus}`,
            {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: dragColor,
                fontStyle: dragStatus ? 'bold' : 'normal'
            }
        );
        dragText.setDepth(501);

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

        // Instructions with drag adjustment controls
        const instructText = this.scene.add.text(barX, barY - 20,
            'SPACEBAR: Reel | Q/E or D-Pad: Adjust Drag | Manage tension or line breaks!',
            {
                fontSize: '9px',
                fontFamily: 'Courier New',
                color: '#ffff00'
            }
        );
        instructText.setDepth(501);

        // Show fish pull force vs drag force comparison
        if (this.reelModel) {
            const basePullForce = this.fish.weight;
            const energyMultiplier = this.fishEnergy / 100;

            // Estimate current state multiplier
            let stateMultiplier = 1.0;
            if (this.fightState === 'hookset') stateMultiplier = 1.5;
            else if (this.fightState === 'thrashing') stateMultiplier = 2.0;
            else if (this.fightState === 'giving_up') stateMultiplier = 0.3;

            const estimatedPullForce = basePullForce * stateMultiplier * energyMultiplier;
            const currentDragForce = this.reelModel.getCurrentDragForce();

            let pullVsDragColor = '#ffffff';
            let pullVsDragText = '';

            if (estimatedPullForce > currentDragForce) {
                pullVsDragColor = '#ff6666';
                pullVsDragText = `⚠ Fish pulling ${estimatedPullForce.toFixed(1)} lbs > Drag ${currentDragForce.toFixed(1)} lbs - LINE SLIPPING!`;
            } else {
                pullVsDragColor = '#00ff00';
                pullVsDragText = `✓ Drag ${currentDragForce.toFixed(1)} lbs > Fish ${estimatedPullForce.toFixed(1)} lbs - HOLDING!`;
            }

            const pullCompareText = this.scene.add.text(barX, barY + barHeight + 34,
                pullVsDragText,
                {
                    fontSize: '9px',
                    fontFamily: 'Courier New',
                    color: pullVsDragColor,
                    fontStyle: 'bold'
                }
            );
            pullCompareText.setDepth(501);

            // Clean up this text too
            this.scene.time.delayedCall(10, () => {
                pullCompareText.destroy();
            });
        }

        // Clean up text objects after render
        this.scene.time.delayedCall(10, () => {
            tensionText.destroy();
            statsText.destroy();
            dragText.destroy();
            conditionText.destroy();
            instructText.destroy();
        }); */
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

        // Update caught count
        this.scene.fishCaught++;

        // Show catch popup
        this.showCatchPopup(info);
    }

    /**
     * Draw a measurement ruler below the fish (simulates real fishing ruler)
     * Tournament style: starts at fish mouth (left edge)
     * Returns array of all created elements for cleanup
     */
    drawMeasurementRuler(startX, centerY, fishLengthInches, pixelsPerInch) {
        const elements = []; // Track all elements for cleanup

        const rulerGraphics = this.scene.add.graphics();
        rulerGraphics.setDepth(2002);
        elements.push(rulerGraphics);

        // Ruler dimensions - exact scale matching fish (larger for 4x fish)
        const rulerLengthPx = fishLengthInches * pixelsPerInch;
        const rulerHeight = 30; // Taller ruler for larger fish
        const rulerStartX = startX;
        const rulerEndX = startX + rulerLengthPx;

        // Draw ruler background (white like a real fishing ruler)
        rulerGraphics.fillStyle(0xffffff, 1.0);
        rulerGraphics.fillRect(rulerStartX, centerY - rulerHeight / 2, rulerLengthPx, rulerHeight);

        // Draw ruler border (black)
        rulerGraphics.lineStyle(3, 0x000000, 1.0);
        rulerGraphics.strokeRect(rulerStartX, centerY - rulerHeight / 2, rulerLengthPx, rulerHeight);

        // Draw tick marks and numbers for EVERY inch
        rulerGraphics.lineStyle(2, 0x000000, 1.0);
        for (let i = 0; i <= fishLengthInches; i++) {
            const tickX = rulerStartX + (i * pixelsPerInch);

            // Full-height tick marks at every inch
            rulerGraphics.lineBetween(
                tickX, centerY - rulerHeight / 2,
                tickX, centerY + rulerHeight / 2
            );

            // Add number label for every inch
            if (i > 0) {
                const label = this.scene.add.text(tickX, centerY,
                    `${i}`,
                    {
                        fontSize: '14px',
                        fontFamily: 'Courier New',
                        color: '#000000',
                        align: 'center',
                        fontStyle: 'bold'
                    }
                );
                label.setOrigin(0.5, 0.5);
                label.setDepth(2003);
                elements.push(label);
            }
        }

        // Add "LENGTH" label on left side
        const lengthLabel = this.scene.add.text(rulerStartX - 5, centerY,
            'LENGTH',
            {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'right',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        lengthLabel.setOrigin(1, 0.5);
        lengthLabel.setDepth(2003);
        elements.push(lengthLabel);

        // Add fish length display on right side
        const lengthValue = this.scene.add.text(rulerEndX + 5, centerY,
            `${fishLengthInches}"`,
            {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#00ff00',
                align: 'left',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        lengthValue.setOrigin(0, 0.5);
        lengthValue.setDepth(2003);
        elements.push(lengthValue);

        return elements;
    }

    /**
     * Draw size classification ruler showing SMALL/MEDIUM/LARGE/TROPHY zones
     * Greys out size classes the fish hasn't reached yet
     * Shows ALL size classes (including unreached ones) for visual progress tracking
     * Clipped to popup width to prevent overflow on the right side
     * Returns array of all created elements for cleanup
     */
    drawClassificationRuler(startX, centerY, speciesName, fishLength, pixelsPerInch, popupWidth) {
        const elements = [];

        // Get species data from imported PREDATOR_SPECIES
        const speciesData = PREDATOR_SPECIES[speciesName];

        if (!speciesData || !speciesData.sizeCategories) {
            return elements; // No classification data available
        }

        const rulerGraphics = this.scene.add.graphics();
        rulerGraphics.setDepth(2002);
        elements.push(rulerGraphics);

        const rulerHeight = 35;
        const categories = speciesData.sizeCategories;

        // Size classification colors
        const colors = {
            small: 0x4a7c59,    // Green
            medium: 0xf4a460,   // Sandy brown
            large: 0xff6b35,    // Orange-red
            trophy: 0xffd700    // Gold
        };

        const textColors = {
            small: '#88ff88',
            medium: '#ffdd88',
            large: '#ffaa66',
            trophy: '#ffff00'
        };

        // Calculate max available width for ruler (popup center +/- half width, with margin)
        const popupCenterX = GameConfig.CANVAS_WIDTH / 2;
        const maxRulerEndX = popupCenterX + (popupWidth / 2) - 10; // 10px margin from popup edge

        // Draw each size zone - show ALL zones, clip on right side if needed
        ['small', 'medium', 'large', 'trophy'].forEach(sizeName => {
            const category = categories[sizeName];
            if (!category || !category.lengthRange) {return;}

            const minLength = category.lengthRange[0];
            const maxLength = category.lengthRange[1];

            const zoneStartX = startX + (minLength * pixelsPerInch);
            let zoneWidth = (maxLength - minLength) * pixelsPerInch;
            const zoneEndX = zoneStartX + zoneWidth;

            // Skip if zone starts beyond popup boundary
            if (zoneStartX >= maxRulerEndX) {return;}

            // Clip zone width if it extends beyond popup boundary
            if (zoneEndX > maxRulerEndX) {
                zoneWidth = maxRulerEndX - zoneStartX;
            }

            // Check if fish has reached this size class
            const fishReachedClass = fishLength >= minLength;
            const opacity = fishReachedClass ? 0.7 : 0.2; // Grey out unreached classes
            const borderOpacity = fishReachedClass ? 1.0 : 0.3;

            // Draw zone background (clipped)
            rulerGraphics.fillStyle(colors[sizeName], opacity);
            rulerGraphics.fillRect(zoneStartX, centerY - rulerHeight / 2, zoneWidth, rulerHeight);

            // Draw zone border (clipped)
            rulerGraphics.lineStyle(3, colors[sizeName], borderOpacity);
            rulerGraphics.strokeRect(zoneStartX, centerY - rulerHeight / 2, zoneWidth, rulerHeight);

            // Add zone label (greyed text for unreached classes) - only if visible
            const labelX = zoneStartX + zoneWidth / 2;
            if (labelX < maxRulerEndX) {
                const labelColor = fishReachedClass ? textColors[sizeName] : '#666666';
                const labelText = this.scene.add.text(labelX, centerY,
                    sizeName.toUpperCase(),
                    {
                        fontSize: '12px',
                        fontFamily: 'Courier New',
                        color: labelColor,
                        align: 'center',
                        stroke: '#000000',
                        strokeThickness: 3,
                        fontStyle: 'bold'
                    }
                );
                labelText.setOrigin(0.5, 0.5);
                labelText.setDepth(2003);
                elements.push(labelText);
            }

            // Add length markers at boundaries - only if visible
            if (sizeName !== 'small' && zoneStartX < maxRulerEndX) {
                const markerColor = fishReachedClass ? '#ffffff' : '#666666';
                const markerText = this.scene.add.text(zoneStartX, centerY + rulerHeight / 2 + 5,
                    `${minLength}"`,
                    {
                        fontSize: '11px',
                        fontFamily: 'Courier New',
                        color: markerColor,
                        align: 'center',
                        fontStyle: 'bold'
                    }
                );
                markerText.setOrigin(0.5, 0);
                markerText.setDepth(2003);
                elements.push(markerText);
            }
        });

        // Add "SIZE CLASS" label on left
        const classLabel = this.scene.add.text(startX - 5, centerY,
            'SIZE',
            {
                fontSize: '10px',
                fontFamily: 'Courier New',
                color: '#ffff00',
                align: 'right',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        classLabel.setOrigin(1, 0.5);
        classLabel.setDepth(2003);
        elements.push(classLabel);

        return elements;
    }

    showCatchPopup(info) {
        // Pause the game AND prevent input systems from processing
        this.scene.physics.pause();
        this.scene.catchPopupActive = true; // Flag to prevent other input handlers

        // Create dark overlay
        const overlay = this.scene.add.rectangle(
            0, 0,
            GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT,
            0x000000, 0.8
        );
        overlay.setOrigin(0, 0);
        overlay.setDepth(2000);
        overlay.setInteractive(); // Block input to objects below

        // Create larger popup background (was 500x400, now 900x600)
        const popupWidth = 900;
        const popupHeight = 600;
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
        const title = this.scene.add.text(popupX, popupY - 260,
            'FISH CAUGHT!',
            {
                fontSize: '48px',
                fontFamily: 'Courier New',
                color: '#00ff00',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        title.setOrigin(0.5, 0.5);
        title.setDepth(2002);

        // Create graphics for fish rendering
        const fishGraphics = this.scene.add.graphics();
        fishGraphics.setDepth(2002);

        // Tournament-style fish photo: fish above ruler with nose at ruler start
        // NOTE: this.fish is the model (LakeTrout, SmallmouthBass, etc.), not the entity wrapper

        // NEW LAYOUT:
        // 1. Center white ruler horizontally and vertically in popup
        // 2. Move ruler down 1 inch (24px)
        // 3. Ruler extends 4 inches past fish tail
        // 4. Fish nose exactly at ruler start, above ruler
        // 5. Trophy scale below white ruler, clipped to popup width

        const desiredPixelsPerInch = 24; // 24 pixels per inch scale
        const fishLengthInches = this.fish.length;
        const extraInches = 4; // Ruler extends 4 inches past fish tail
        const rulerLengthInches = fishLengthInches + extraInches;
        const rulerLengthPx = rulerLengthInches * desiredPixelsPerInch;

        // Center ruler horizontally and vertically, then move down 1 inch
        const rulerCenterY = popupY + (1 * desiredPixelsPerInch); // Center + 1 inch down = 24px
        const rulerStartX = popupX - (rulerLengthPx / 2); // Centered horizontally

        // Fish body is drawn at roughly 2.5-3.2x bodySize depending on species
        // Use average of 2.8x as estimate
        const desiredFishLengthPx = fishLengthInches * desiredPixelsPerInch;
        const bodySize = desiredFishLengthPx / 2.8;

        // Fish positioned above ruler with nose exactly at ruler start
        const fishCenterX = rulerStartX + (desiredFishLengthPx / 2);
        const fishRenderY = rulerCenterY - 80; // Fish positioned above ruler

        if (this.fish && typeof this.fish.renderAtPosition === 'function') {
            // Render fish facing LEFT (tournament photo style)
            // Fish centered at fishCenterX, so nose touches rulerStartX
            this.fish.renderAtPosition(fishGraphics, fishCenterX, fishRenderY, bodySize, true);
        } else {
            console.warn('Fish renderAtPosition method not available, skipping fish rendering in popup');
        }

        // Draw white measurement ruler (centered, extends 4 inches past fish tail)
        const rulerElements = this.drawMeasurementRuler(
            rulerStartX, rulerCenterY, rulerLengthInches, desiredPixelsPerInch
        );

        // Draw size classification ruler below the white ruler
        // Clip to popup width to prevent overflow
        const classificationY = rulerCenterY + 40;
        const classificationElements = this.drawClassificationRuler(
            rulerStartX, classificationY, this.fish.species, this.fish.length,
            desiredPixelsPerInch, popupWidth
        );

        // Fish stats - moved to TOP LEFT with smaller font
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

        const statsText = this.scene.add.text(popupX - 420, popupY - 250,
            `${info.name} (${info.gender})\n` +
            `Weight: ${info.weight}\n` +
            `Length: ${info.length}\n` +
            `Age: ${ageDisplay}\n` +
            `Points: +${this.fish.points}`,
            {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#ffffff',
                align: 'left',
                stroke: '#000000',
                strokeThickness: 2,
                lineSpacing: 4
            }
        );
        statsText.setOrigin(0, 0);  // Anchor at top-left
        statsText.setDepth(2002);

        // Continue prompt - positioned well below stats
        const continueText = this.scene.add.text(popupX, popupY + 240,
            'Press X button to continue',
            {
                fontSize: '20px',
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

        // Track gamepad button state for debouncing
        let lastXButtonState = false;

        // Gamepad polling interval
        let gamepadPollInterval = null;

        // Input handler to dismiss popup
        const dismissPopup = () => {
            // Remove all popup elements
            overlay.destroy();
            popupBg.destroy();
            title.destroy();
            fishGraphics.destroy();
            statsText.destroy();
            continueText.destroy();

            // Destroy ruler elements
            rulerElements.forEach(element => element.destroy());
            classificationElements.forEach(element => element.destroy());

            // Remove input listeners
            this.scene.input.keyboard.off('keydown', keyboardHandler);

            // Stop gamepad polling
            if (gamepadPollInterval) {
                gamepadPollInterval.remove();
            }

            // Clear catch popup flag BEFORE resuming
            this.scene.catchPopupActive = false;

            // Resume game and finish cleanup
            this.scene.physics.resume();
            this.lure.reset();
            this.endFight();
            this.fish.visible = false;
            this.fish.destroy();
        };

        // Keyboard handler - accept X, spacebar, or enter
        const keyboardHandler = (event) => {
            if (event.keyCode === 88 || event.keyCode === 32 || event.keyCode === 13) { // X, Space, or Enter
                dismissPopup();
            }
        };

        // Listen for keyboard input
        this.scene.input.keyboard.on('keydown', keyboardHandler);

        // Poll gamepad X button using native gamepad manager
        if (window.gamepadManager && window.gamepadManager.isConnected()) {
            gamepadPollInterval = this.scene.time.addEvent({
                delay: 50, // Check every 50ms
                callback: () => {
                    const xButton = window.gamepadManager.getButton('X'); // X on PS4, A on Xbox

                    // Check for button press (not held)
                    if (xButton.pressed && !lastXButtonState) {
                        dismissPopup();
                    }

                    lastXButtonState = xButton.pressed;
                },
                loop: true
            });
        }
    }

    endFight() {
        this.active = false;

        // Clear tension display in header
        this.scene.events.emit('updateLineTension', 0);

        // Remove from scene
        if (this.scene.currentFight === this) {
            this.scene.currentFight = null;
        }
    }
}

export default FishFight;
