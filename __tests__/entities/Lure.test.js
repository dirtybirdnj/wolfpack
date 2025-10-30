/**
 * Lure Entity Tests
 *
 * These tests verify the Lure class functionality, including:
 * - Basic instantiation and initialization
 * - Physics and movement
 * - Boundary checking with dynamic depth scaling
 * - State transitions
 *
 * IMPORTANT: This test would have caught the duplicate 'depthScale' declaration bug!
 */

import { Lure } from '../../src/entities/Lure.js';
import GameConfig from '../../src/config/GameConfig.js';
import { Constants } from '../../src/utils/Constants.js';

// Mock Phaser scene
class MockScene {
    constructor(options = {}) {
        this.add = {
            graphics: () => ({
                setDepth: () => {},
                clear: () => {},
                lineStyle: () => {},
                lineBetween: () => {},
                fillStyle: () => {},
                fillCircle: () => {},
                strokeCircle: () => {},
                destroy: () => {}
            })
        };

        this.time = {
            now: 0
        };

        // Mock sonar display with dynamic depth scale
        this.sonarDisplay = options.hasSonarDisplay !== false ? {
            getDepthScale: () => options.depthScale || 3.6,
            canvasHeight: options.canvasHeight || 650
        } : null;

        // Mock ice hole manager
        this.iceHoleManager = options.hasIceHoleManager !== false ? {
            getDepthAtPosition: (x) => options.maxDepth || GameConfig.MAX_DEPTH
        } : null;
    }
}

describe('Lure Entity', () => {
    describe('Basic Instantiation', () => {
        test('should instantiate without errors', () => {
            const scene = new MockScene();

            // This test would have caught the SyntaxError: Identifier 'depthScale' has already been declared
            expect(() => {
                const lure = new Lure(scene, 100, 50);
            }).not.toThrow();
        });

        test('should initialize with correct default values', () => {
            const scene = new MockScene();
            const lure = new Lure(scene, 100, 50);

            expect(lure.x).toBe(100);
            expect(lure.y).toBe(50);
            expect(lure.weight).toBe(0.5);
            expect(lure.velocity).toBe(0);
            expect(lure.state).toBe(Constants.LURE_STATE.IDLE);
        });

        test('should initialize at surface when y=0', () => {
            const scene = new MockScene();
            const lure = new Lure(scene, 100, 0);

            expect(lure.state).toBe(Constants.LURE_STATE.SURFACE);
            expect(lure.depth).toBe(0);
        });
    });

    describe('Update Method - Dynamic Depth Scaling', () => {
        test('should call update() without syntax errors', () => {
            const scene = new MockScene();
            const lure = new Lure(scene, 100, 50);

            // This is the critical test that would have caught the duplicate depthScale bug
            expect(() => {
                lure.update();
            }).not.toThrow();
        });

        test('should use dynamic depth scale from sonarDisplay', () => {
            const customDepthScale = 5.0;
            const scene = new MockScene({ depthScale: customDepthScale });
            const lure = new Lure(scene, 100, 50);

            lure.update();

            // Depth should be calculated using the custom depth scale
            const expectedDepth = 50 / customDepthScale;
            expect(lure.depth).toBeCloseTo(expectedDepth, 1);
        });

        test('should fall back to GameConfig.DEPTH_SCALE if sonarDisplay is null', () => {
            const scene = new MockScene({ hasSonarDisplay: false });
            const lure = new Lure(scene, 100, 50);

            lure.update();

            // Should use fallback
            const expectedDepth = 50 / GameConfig.DEPTH_SCALE;
            expect(lure.depth).toBeCloseTo(expectedDepth, 1);
        });

        test('should stop lure at bottom using dynamic depth scale', () => {
            const maxDepth = 100; // feet
            const depthScale = 4.0; // pixels per foot
            const scene = new MockScene({ maxDepth, depthScale });
            const lure = new Lure(scene, 100, 0);

            // Set lure to very deep position
            lure.y = 500;
            lure.state = Constants.LURE_STATE.DROPPING;
            lure.velocity = 5;

            lure.update();

            // Should stop at bottom (100 feet * 4 pixels/foot = 400 pixels)
            expect(lure.y).toBe(maxDepth * depthScale);
            expect(lure.depth).toBe(maxDepth);
            expect(lure.velocity).toBe(0);
            expect(lure.state).toBe(Constants.LURE_STATE.IDLE);
        });

        test('should handle window resize by using updated depth scale', () => {
            // Simulate initial window size
            const scene = new MockScene({ depthScale: 3.6, canvasHeight: 650 });
            const lure = new Lure(scene, 100, 180); // 50 feet at 3.6 scale

            lure.update();
            const initialDepth = lure.depth;
            expect(initialDepth).toBeCloseTo(50, 1);

            // Simulate window resize - new depth scale
            scene.sonarDisplay.getDepthScale = () => 5.0;
            scene.sonarDisplay.canvasHeight = 900;

            lure.update();

            // Same Y position should now show different depth
            const newDepth = lure.depth;
            expect(newDepth).toBeCloseTo(180 / 5.0, 1);
            expect(newDepth).not.toBe(initialDepth);
        });
    });

    describe('Physics and State Transitions', () => {
        test('should apply gravity when dropping', () => {
            const scene = new MockScene();
            const lure = new Lure(scene, 100, 50);

            lure.state = Constants.LURE_STATE.DROPPING;
            const initialY = lure.y;

            lure.update();

            // Should have moved down
            expect(lure.y).toBeGreaterThan(initialY);
        });

        test('should respect surface boundary', () => {
            const scene = new MockScene();
            const lure = new Lure(scene, 100, 5);

            lure.state = Constants.LURE_STATE.RETRIEVING;
            lure.velocity = -10; // Reeling up fast

            lure.update();

            // Should not go above surface
            expect(lure.y).toBeGreaterThanOrEqual(0);
            expect(lure.state).toBe(Constants.LURE_STATE.SURFACE);
        });

        test('should respect bottom boundary', () => {
            const maxDepth = 80;
            const depthScale = 4.0;
            const scene = new MockScene({ maxDepth, depthScale });
            const lure = new Lure(scene, 100, 0);

            // Try to drop past bottom
            lure.y = 400; // Way past bottom
            lure.state = Constants.LURE_STATE.DROPPING;

            lure.update();

            // Should stop at bottom
            expect(lure.y).toBe(maxDepth * depthScale);
            expect(lure.state).toBe(Constants.LURE_STATE.IDLE);
        });
    });

    describe('Weight Configuration', () => {
        test('should allow changing lure weight', () => {
            const scene = new MockScene();
            const lure = new Lure(scene, 100, 50);

            expect(lure.weight).toBe(0.5);

            lure.weight = 2.0;
            expect(lure.weight).toBe(2.0);
        });

        test('heavier lures should fall faster', () => {
            const scene = new MockScene();

            const lightLure = new Lure(scene, 100, 50);
            lightLure.weight = 0.25;
            lightLure.state = Constants.LURE_STATE.DROPPING;

            const heavyLure = new Lure(scene, 200, 50);
            heavyLure.weight = 4.0;
            heavyLure.state = Constants.LURE_STATE.DROPPING;

            // Run several updates to build velocity
            for (let i = 0; i < 10; i++) {
                lightLure.update();
                heavyLure.update();
            }

            // Heavy lure should have dropped further
            expect(heavyLure.y).toBeGreaterThan(lightLure.y);
        });
    });

    describe('Regression Tests', () => {
        test('REGRESSION: should not declare depthScale twice in update()', () => {
            // This test specifically catches the bug that was introduced
            const scene = new MockScene();
            const lure = new Lure(scene, 100, 50);

            // The bug would cause a SyntaxError during module load
            // If this test runs, the module loaded successfully
            expect(() => {
                lure.update();
            }).not.toThrow();

            // Verify depth calculation still works
            expect(lure.depth).toBeGreaterThan(0);
        });
    });
});
