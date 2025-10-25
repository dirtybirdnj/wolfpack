import GameConfig from '../config/GameConfig.js';

/**
 * Manages kayak and motor boat fishing modes
 */
export class BoatManager {
    constructor(scene, fishingType) {
        this.scene = scene;
        this.fishingType = fishingType;

        // Lake bed depth variation (for different positions) - MUST be first!
        this.lakeBedProfile = this.generateLakeBedProfile();

        // Player position on water (horizontal, in game units)
        this.playerX = this.getStartingPosition();

        // Kayak-specific properties
        this.tiredness = 0; // 0-100
        this.isPaddling = false;
        this.isResting = false;

        // Motor boat-specific properties
        this.gasLevel = GameConfig.MOTORBOAT_START_GAS; // 0-100
        this.isMoving = false;

        // Graphics
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(1000); // On top of most things

        // Water surface height (in pixels from top)
        this.waterHeight = 0; // No ice, water starts at top

        // Initialize UI
        this.updateUI();

        const modeText = fishingType === GameConfig.FISHING_TYPE_KAYAK ? 'kayak' : 'motor boat';
        console.log(`🚣 Boat Manager initialized - Starting ${modeText} fishing`);
    }

    getStartingPosition() {
        if (this.fishingType === GameConfig.FISHING_TYPE_KAYAK) {
            // Kayak: Start in middle of lake at depth between 70-120 feet
            // Find a position with the right depth
            for (let x = 3000; x < 7000; x += 100) {
                const depth = this.getDepthAtPosition(x);
                if (depth >= GameConfig.KAYAK_START_DEPTH_MIN &&
                    depth <= GameConfig.KAYAK_START_DEPTH_MAX) {
                    return x;
                }
            }
            return 5000; // Default to middle
        } else {
            // Motor boat: Start at docks (shallow water)
            return GameConfig.MOTORBOAT_DOCK_POSITION;
        }
    }

    generateLakeBedProfile() {
        // Generate varying lake bottom depths across the horizontal distance
        // This gives different depths at different positions
        const profile = [];
        for (let x = 0; x < 10000; x += 50) {
            // Shallow near docks, deep in middle
            let depth;
            if (x < 500) {
                // Shallow near docks (10-30 feet)
                depth = 10 + (x / 500) * 20;
            } else if (x < 1500) {
                // Gradually deepening (30-80 feet)
                depth = 30 + ((x - 500) / 1000) * 50;
            } else {
                // Deep water with variation (80-150 feet)
                depth = 80 + Math.sin(x * 0.003) * 30 +
                        Math.sin(x * 0.01) * 20 +
                        Math.cos(x * 0.007) * 15;
            }
            profile.push({ x, depth: Math.max(10, Math.min(150, depth)) });
        }
        return profile;
    }

    getDepthAtPosition(x) {
        // Get lake bottom depth at specific X position
        const closest = this.lakeBedProfile.reduce((prev, curr) =>
            Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
        );
        return closest.depth;
    }

    movePlayer(direction) {
        // direction: -1 = left, 1 = right
        if (this.fishingType === GameConfig.FISHING_TYPE_KAYAK) {
            // Kayak mode
            if (this.tiredness >= GameConfig.KAYAK_TIREDNESS_THRESHOLD) {
                // Too tired to paddle
                this.isResting = true;
                this.isPaddling = false;
                return false;
            }

            this.isPaddling = true;
            this.isResting = false;
            this.playerX += direction * GameConfig.KAYAK_MOVE_SPEED;
            this.playerX = Math.max(100, Math.min(9900, this.playerX)); // Keep in bounds
            return true;
        } else {
            // Motor boat mode
            if (this.gasLevel <= 0) {
                // Out of gas
                this.isMoving = false;
                return false;
            }

            this.isMoving = true;
            this.playerX += direction * GameConfig.MOTORBOAT_MOVE_SPEED;
            this.playerX = Math.max(100, Math.min(9900, this.playerX)); // Keep in bounds
            return true;
        }
    }

    stopMoving() {
        this.isPaddling = false;
        this.isMoving = false;
    }

    update() {
        // Update meters
        if (this.fishingType === GameConfig.FISHING_TYPE_KAYAK) {
            this.updateKayak();
        } else {
            this.updateMotorboat();
        }

        this.updateUI();
        this.render();
    }

    updateKayak() {
        if (this.isPaddling) {
            // Increase tiredness when paddling
            this.tiredness += GameConfig.KAYAK_TIREDNESS_RATE;
            this.tiredness = Math.min(100, this.tiredness);

            if (this.tiredness >= GameConfig.KAYAK_TIREDNESS_THRESHOLD) {
                this.isResting = true;
                this.isPaddling = false;
                if (this.scene.notificationSystem) {
                    this.scene.notificationSystem.showMessage('Too Tired!', 'Rest to recover stamina');
                }
            }
        } else {
            // Decrease tiredness when resting
            this.tiredness -= GameConfig.KAYAK_RECOVERY_RATE;
            this.tiredness = Math.max(0, this.tiredness);

            if (this.tiredness < GameConfig.KAYAK_TIREDNESS_THRESHOLD && this.isResting) {
                this.isResting = false;
                if (this.scene.notificationSystem) {
                    this.scene.notificationSystem.showMessage('Rested', 'Ready to paddle again!');
                }
            }
        }
    }

    updateMotorboat() {
        if (this.isMoving) {
            // Decrease gas when moving
            this.gasLevel -= GameConfig.MOTORBOAT_GAS_USAGE;
            this.gasLevel = Math.max(0, this.gasLevel);

            if (this.gasLevel <= 0) {
                this.isMoving = false;
                // Check if we made it back to docks
                if (this.playerX > GameConfig.MOTORBOAT_DOCK_POSITION - 50 &&
                    this.playerX < GameConfig.MOTORBOAT_DOCK_POSITION + 50) {
                    if (this.scene.notificationSystem) {
                        this.scene.notificationSystem.showMessage('Safe!', 'Made it back to the docks');
                    }
                } else {
                    if (this.scene.notificationSystem) {
                        this.scene.notificationSystem.showMessage('Out of Gas!', 'Game Over - stranded on the lake');
                    }
                    if (this.scene.scoreSystem) {
                        this.scene.scoreSystem.endGame();
                    }
                }
            } else if (this.gasLevel < 20) {
                // Low gas warning
                if (Math.random() < 0.01) { // Occasional warning
                    if (this.scene.notificationSystem) {
                        this.scene.notificationSystem.showMessage('Low Gas!', `${Math.floor(this.gasLevel)}% remaining`);
                    }
                }
            }
        }
    }

    render() {
        this.graphics.clear();

        // Draw water surface line
        this.drawWaterSurface();

        // Draw boat
        this.drawBoat();
    }

    drawWaterSurface() {
        // Water surface is at y=0, no ice in summer
        // The black line is drawn by SonarDisplay, we just need to show the boat
    }

    drawBoat() {
        const screenX = GameConfig.CANVAS_WIDTH / 2; // Boat always centered

        if (this.fishingType === GameConfig.FISHING_TYPE_KAYAK) {
            // Draw kayak
            this.graphics.fillStyle(0xff6600, 1.0);
            // Kayak body (elongated ellipse)
            this.graphics.fillEllipse(screenX, 10, 30, 8);
            // Paddle
            if (this.isPaddling) {
                const paddleOffset = Math.sin(Date.now() * 0.01) * 15;
                this.graphics.lineStyle(2, 0x8b4513, 1.0);
                this.graphics.lineBetween(screenX - 10 + paddleOffset, 5, screenX - 15 + paddleOffset, 0);
            }
        } else {
            // Draw motor boat
            this.graphics.fillStyle(0xffffff, 1.0);
            // Boat body (larger)
            this.graphics.fillRoundedRect(screenX - 25, 5, 50, 12, 5);
            // Motor
            this.graphics.fillStyle(0x666666, 1.0);
            this.graphics.fillRect(screenX + 20, 12, 8, 6);
            // Wake if moving
            if (this.isMoving) {
                this.graphics.lineStyle(2, 0xffffff, 0.5);
                this.graphics.lineBetween(screenX - 30, 15, screenX - 40, 20);
                this.graphics.lineBetween(screenX - 30, 15, screenX - 40, 10);
            }
        }

        // Position indicator below boat
        const depthHere = this.getDepthAtPosition(this.playerX);
        const text = this.scene.add.text(screenX, 25, `Depth: ${depthHere.toFixed(0)}ft`, {
            fontSize: '8px',
            fontFamily: 'Courier New',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        });
        text.setOrigin(0.5, 0);
        text.setDepth(1001);

        this.scene.time.delayedCall(50, () => text.destroy());
    }

    updateUI() {
        if (this.fishingType === GameConfig.FISHING_TYPE_KAYAK) {
            // Update tiredness meter
            const tirednessEl = document.getElementById('kayak-tiredness');
            if (tirednessEl) {
                tirednessEl.textContent = `${Math.floor(this.tiredness)}%`;
            }

            const tirednessFillEl = document.getElementById('kayak-tiredness-fill');
            if (tirednessFillEl) {
                tirednessFillEl.style.width = `${this.tiredness}%`;
                // Color changes based on tiredness level
                if (this.tiredness >= GameConfig.KAYAK_TIREDNESS_THRESHOLD) {
                    tirednessFillEl.style.background = '#ff0000';
                } else if (this.tiredness >= 60) {
                    tirednessFillEl.style.background = '#ffaa00';
                } else {
                    tirednessFillEl.style.background = 'var(--border-primary)';
                }
            }
        } else {
            // Update gas meter
            const gasEl = document.getElementById('motorboat-gas');
            if (gasEl) {
                gasEl.textContent = `${Math.floor(this.gasLevel)}%`;
            }

            const gasFillEl = document.getElementById('motorboat-gas-fill');
            if (gasFillEl) {
                gasFillEl.style.width = `${this.gasLevel}%`;
                // Color changes based on gas level
                if (this.gasLevel <= 20) {
                    gasFillEl.style.background = '#ff0000';
                } else if (this.gasLevel <= 40) {
                    gasFillEl.style.background = '#ffaa00';
                } else {
                    gasFillEl.style.background = 'var(--border-primary)';
                }
            }

            // Update distance to docks
            const distanceEl = document.getElementById('motorboat-distance');
            if (distanceEl) {
                const distanceToDocks = Math.abs(this.playerX - GameConfig.MOTORBOAT_DOCK_POSITION);
                distanceEl.textContent = `${Math.floor(distanceToDocks / 10)}ft`;
            }
        }
    }

    destroy() {
        this.graphics.destroy();
    }
}

export default BoatManager;
