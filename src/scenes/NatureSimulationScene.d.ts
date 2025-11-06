/**
 * NatureSimulationScene - Observe fish AI behavior without player interaction
 *
 * This mode allows players to:
 * - Select water depth (10-100 feet)
 * - Observe natural fish, baitfish, and zooplankton behavior
 * - Debug and understand AI systems
 * - No lure, no player - pure observation
 */
export class NatureSimulationScene {
    fishes: any[];
    baitfishSchools: any[];
    schools: any[];
    zooplankton: any[];
    crayfish: any[];
    baitfishClouds: any[];
    waterTemp: number;
    debugMode: boolean;
    selectedDepth: number;
    depthSelectionActive: boolean;
    gameTime: number;
    selectedButtonIndex: number;
    spawnMode: boolean;
    selectedSpawnButton: number;
    selectedFish: any;
    selectedFishId: any;
    /**
     * Select a fish to show detailed info
     * @param {Fish} fish - The fish to select (or null to deselect)
     */
    selectFish(fish: Fish): void;
    create(): void;
    maxDepth: any;
    sonarDisplay: SonarDisplay | undefined;
    spawningSystem: SpawningSystem | undefined;
    debugSystem: DebugSystem | undefined;
    createDepthSelectionUI(): void;
    depthPanel: any;
    depthTitle: any;
    depthButtons: any[] | undefined;
    depthInstructions: any;
    createTemperatureSlider(width: any, y: any): void;
    tempLabel: any;
    tempSliderContainer: any;
    createDepthButton(x: any, y: any, depth: any, isRandom?: boolean): any;
    updateDepthButtonSelection(): void;
    selectDepth(depth: any): void;
    hideDepthSelectionUI(): void;
    showDepthSelectionUI(): void;
    toggleDepthSelectionUI(): void;
    setupControls(): void;
    cursors: any;
    enterKey: any;
    spaceKey: any;
    gamepadDetected: boolean | undefined;
    gamepadState: {
        lastDpadLeft: boolean;
        lastDpadRight: boolean;
        lastDpadUp: boolean;
        lastDpadDown: boolean;
        lastA: boolean;
        lastCircle: boolean;
        lastX: boolean;
        lastY: boolean;
        lastStart: boolean;
        lastAnalogLeft: boolean;
        lastAnalogRight: boolean;
        lastAnalogUp: boolean;
        lastAnalogDown: boolean;
    } | undefined;
    trySpawnFish(): void;
    /**
     * Get player center X (for nature mode, this is just used for consistency)
     * In nature mode there's no player, so this returns the actual game width center
     */
    getPlayerCenterX(): number;
    /**
     * Spawn a baitfish school using new unified Fish system
     */
    spawnBaitfishSchool(worldX: any, y: any, count: any, species?: string): void;
    trySpawnBaitfishCloud(): void;
    handleDepthSelectionInput(): void;
    /**
     * Adapt new schools to look like old BaitfishClouds for FishAI compatibility
     * This creates a bridge layer so predators can hunt the new baitfish schools
     * @returns {Array} Array of cloud-like objects that FishAI can understand
     */
    getAdaptedSchoolsForAI(): any[];
    /**
     * Render fog effects and fish counts behind baitfish schools
     * Same as GameScene implementation
     */
    renderSchoolEffects(): void;
    schoolEffectsGraphics: any;
    schoolCountTexts: any[] | undefined;
    update(time: any, delta: any): void;
    /**
     * Clean up scene resources to prevent memory leaks
     */
    shutdown(): void;
}
export default NatureSimulationScene;
import SonarDisplay from '../utils/SonarDisplay.js';
import SpawningSystem from './systems/SpawningSystem.js';
import DebugSystem from './systems/DebugSystem.js';
//# sourceMappingURL=NatureSimulationScene.d.ts.map