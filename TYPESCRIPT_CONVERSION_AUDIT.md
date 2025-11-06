# TypeScript Conversion Audit

**Created:** November 6, 2025
**Purpose:** Identify blockers and create migration plan for TS conversion
**Total JS Files:** 36

---

## Executive Summary

The codebase is well-structured for TypeScript conversion with minimal blockers. The recent refactor unified the organism architecture, which makes type definitions cleaner.

### Key Wins
- ✅ Consistent class-based architecture (ES6 classes)
- ✅ Clear separation of concerns (sprites, systems, AI, config)
- ✅ Component composition pattern (FishAI, SchoolManager)
- ✅ Data-driven design (OrganismData.js)
- ✅ Phaser 3 has excellent TypeScript support

### Main Blockers
1. **Dynamic property addition** - Some classes add properties dynamically
2. **Loose typing** - Many method parameters lack type validation
3. **Legacy SpeciesData.js** - Still using old species data format alongside OrganismData
4. **Mixed module patterns** - Some files use default export, others named exports

---

## Conversion Strategy

### Phase 1: Foundation (Low Risk)
Convert utility files and config first - they have minimal dependencies.

**Files:**
- `src/utils/Constants.js` → `Constants.ts`
- `src/utils/DepthConverter.js` → `DepthConverter.ts`
- `src/utils/SpriteGenerator.js` → `SpriteGenerator.ts`
- `src/config/GameConfig.js` → `GameConfig.ts`
- `src/config/OrganismData.js` → `OrganismData.ts`

**Estimated Effort:** 2-3 hours
**Risk:** Low - Pure functions and data structures

### Phase 2: Base Classes (Medium Risk)
Convert sprite base classes - foundation for all organisms.

**Files:**
- `src/sprites/OrganismSprite.js` → `OrganismSprite.ts`
- `src/sprites/FishSprite.js` → `FishSprite.ts`
- `src/sprites/CrayfishSprite.js` → `CrayfishSprite.ts`
- `src/sprites/ZooplanktonSprite.js` → `ZooplanktonSprite.ts`

**Estimated Effort:** 4-6 hours
**Risk:** Medium - Phaser.GameObjects.Sprite inheritance

### Phase 3: Systems (Medium Risk)
Convert game systems - they depend on sprites but are isolated.

**Files:**
- `src/systems/SchoolManager.js` → `SchoolManager.ts`
- `src/systems/BoidsSystem.js` → `BoidsSystem.ts`
- `src/systems/FoodChainSystem.js` → `FoodChainSystem.ts`
- `src/scenes/systems/SpawningSystem.js` → `SpawningSystem.ts`
- `src/scenes/systems/CollisionSystem.js` → `CollisionSystem.ts`
- `src/scenes/systems/InputSystem.js` → `InputSystem.ts`
- `src/scenes/systems/DebugSystem.js` → `DebugSystem.ts`
- `src/scenes/systems/NotificationSystem.js` → `NotificationSystem.ts`

**Estimated Effort:** 6-8 hours
**Risk:** Medium - Complex interdependencies

### Phase 4: AI and Components (High Risk)
Convert AI and behavior components - most complex code.

**Files:**
- `src/entities/FishAI.js` → `FishAI.ts`
- `src/components/Player.js` → `Player.ts`
- `src/components/Lure.js` → `Lure.ts`
- `src/components/LureSwimmer.js` → `LureSwimmer.ts`

**Estimated Effort:** 6-8 hours
**Risk:** High - Complex state machines and behaviors

### Phase 5: Scenes (High Risk)
Convert Phaser scenes last - they tie everything together.

**Files:**
- `src/scenes/BootScene.js` → `BootScene.ts`
- `src/scenes/MenuScene.js` → `MenuScene.ts`
- `src/scenes/GameScene.js` → `GameScene.ts` (largest file!)
- `src/scenes/GameHUD.js` → `GameHUD.ts`
- `src/scenes/GameOverScene.js` → `GameOverScene.ts`
- `src/scenes/UIScene.js` → `UIScene.ts`
- `src/scenes/NatureSimulationScene.js` → `NatureSimulationScene.ts`
- `src/scenes/WaterColumn.js` → `WaterColumn.ts`
- `src/scenes/InfoBar.js` → `InfoBar.ts`

**Estimated Effort:** 10-12 hours
**Risk:** High - Complex scene lifecycle and Phaser integration

### Phase 6: Entry Point
Convert main entry point last.

**Files:**
- `src/index.js` → `index.ts`

**Estimated Effort:** 1 hour
**Risk:** Low

---

## Specific Blockers and Solutions

### 1. Dynamic Property Addition

**Problem:**
```javascript
// FishSprite.js - properties added conditionally
if (this.type === 'predator') {
    this.hunger = 75;
    this.health = 50;
}
```

**Solution:**
```typescript
interface PredatorProperties {
    hunger?: number;
    health?: number;
    lastFed?: number;
    metabolism?: number;
}

class FishSprite extends OrganismSprite implements PredatorProperties {
    hunger?: number;
    health?: number;
    // ... declare all optional predator properties
}
```

### 2. Loose Phaser Types

**Problem:**
```javascript
constructor(scene, worldX, y, texture)
```

**Solution:**
```typescript
constructor(scene: Phaser.Scene, worldX: number, y: number, texture: string)
```

### 3. Array Type Ambiguity

**Problem:**
```javascript
this.scene.fishes.forEach(fish => {...})
this.scene.schools.forEach(school => {...})
```

**Solution:**
```typescript
interface GameScene extends Phaser.Scene {
    fishes: FishSprite[];
    schools: School[];
    zooplankton: ZooplanktonSprite[];
    crayfish: CrayfishSprite[];
}
```

### 4. OrganismData Return Types

**Problem:**
```javascript
const speciesData = getOrganismData(species); // returns unknown type
```

**Solution:**
```typescript
interface OrganismData {
    type: 'fish' | 'crayfish' | 'zooplankton';
    category: 'prey' | 'predator' | 'predator_prey';
    species: string;
    name: string;
    sizeRange?: { min: number; max: number };
    weightRange?: { min: number; max: number };
    speed: { base: number; panic?: number };
    // ... rest of properties
}

function getOrganismData(species: string): OrganismData | null
```

### 5. Callback Function Types

**Problem:**
```javascript
this.scene.time.addEvent({
    delay: 2000,
    callback: () => this.trySpawnFish(),
    callbackScope: this,
    loop: true
});
```

**Solution:**
```typescript
// Phaser already has types for this, just use them
this.scene.time.addEvent({
    delay: 2000,
    callback: this.trySpawnFish,
    callbackScope: this,
    loop: true
} as Phaser.Time.TimerEventConfig);
```

### 6. FishAI State Machine

**Problem:**
```javascript
this.currentState = 'idle'; // string literals everywhere
```

**Solution:**
```typescript
type FishAIState = 'idle' | 'hunting' | 'fleeing' | 'pursuing_lure' | 'schooling';

class FishAI {
    private currentState: FishAIState = 'idle';
}
```

---

## Build Configuration

### Required Dependencies
```bash
npm install --save-dev typescript @types/node
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install phaser@^3.86.0 # Already have types built-in
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "removeComments": false,
    "noEmit": true,
    "allowJs": true,
    "checkJs": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Vite Config Update
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2020',
    sourcemap: true
  }
});
```

---

## Migration Checklist

### Pre-Migration
- [ ] Commit all current changes
- [ ] Create branch `feature/typescript-conversion`
- [ ] Install TypeScript dependencies
- [ ] Create initial tsconfig.json
- [ ] Set up build pipeline to handle .ts files
- [ ] Test that .js and .ts can coexist during migration

### During Migration
- [ ] Convert files in phases (1-6 as outlined above)
- [ ] Run `npm run build` after each phase
- [ ] Test game functionality after each phase
- [ ] Fix type errors incrementally
- [ ] Document any tricky type conversions

### Post-Migration
- [ ] Remove all .js files (keep .js for build output only)
- [ ] Enable strict mode fully
- [ ] Run full test suite
- [ ] Update README with TS instructions
- [ ] Merge to main

---

## Type Definitions Needed

### Core Interfaces

```typescript
// src/types/game.types.ts

export interface Position {
    worldX: number;
    y: number;
}

export interface Velocity {
    x: number;
    y: number;
}

export interface DepthRange {
    min: number;
    max: number;
}

export interface SizeRange {
    min: number;
    max: number;
}

export interface Speed {
    base: number;
    panic?: number;
}

export interface SchoolingConfig {
    enabled: boolean;
    searchRadius: number;
    separationRadius: number;
    alignmentRadius: number;
    cohesionRadius: number;
    maxSchoolSize: number;
    fleeSpeed?: number;
}

export interface HuntingBehavior {
    enabled: boolean;
    detectionRadius: number;
    pursuitSpeed: number;
    ambushPreference?: number;
}

export interface BiologyConfig {
    hungerRate: number;
    metabolismRange: { min: number; max: number };
    starvationThreshold: number;
}

export interface DietPreferences {
    [preySpecies: string]: number; // 0-1 preference weight
}

export type OrganismCategory = 'prey' | 'predator' | 'predator_prey';
export type OrganismType = 'fish' | 'crayfish' | 'zooplankton';
export type FishType = 'bait' | 'predator';
export type SizeCategory = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface School {
    id: string;
    species: string;
    centerWorldX: number;
    centerY: number;
    velocity: Velocity;
    members: FishSprite[];
    age: number;
}
```

---

## Estimated Total Effort

- **Phase 1:** 2-3 hours
- **Phase 2:** 4-6 hours
- **Phase 3:** 6-8 hours
- **Phase 4:** 6-8 hours
- **Phase 5:** 10-12 hours
- **Phase 6:** 1 hour
- **Testing & Fixes:** 4-6 hours

**Total:** 33-44 hours (~1 week of dedicated work)

---

## Risk Assessment

### Low Risk ✅
- Utils conversion
- Config files
- Base sprite classes

### Medium Risk ⚠️
- Systems with complex state
- AI state machines
- Phaser scene lifecycle

### High Risk 🔴
- GameScene.js (1000+ lines)
- FishAI.js (complex behavior trees)
- Dynamic property additions

---

## Benefits After Conversion

1. **Catch errors at compile time** - No more `undefined is not a function`
2. **Better IDE support** - Autocomplete for all methods and properties
3. **Self-documenting code** - Types serve as inline documentation
4. **Easier refactoring** - Rename/move with confidence
5. **Better collaboration** - Types make expectations clear
6. **Performance** - Modern bundlers optimize TS better

---

## Next Steps

1. **Review this audit** with team
2. **Create GitHub issue** for TS conversion (#66 already exists!)
3. **Set up TypeScript tooling** (Phase 0)
4. **Start Phase 1** (utils and config)
5. **Test incrementally** - game should work after each phase

---

**Status:** Ready to begin
**Blocking Issues:** None - all 4 bugs fixed
**Recommended Start Date:** After current stability verification
