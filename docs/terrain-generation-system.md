# Bathymetric Terrain Generation System

## Overview

The game now uses real bathymetric data from NOAA chart 14782 (Lake Champlain - Burlington Bay) to generate accurate underwater terrain for all three fishing modes.

## Features Implemented

### 1. BathymetricData.js Utility

Located in `src/utils/BathymetricData.js`, this module provides:

- **Realistic depth profiles** based on Burlington Bay bathymetry
- **Grid-based interpolation** for smooth depth transitions
- **Underwater structure** including ledges, drop-offs, and humps
- **Helper methods** for finding good fishing spots and analyzing structure

Key depth zones in Burlington Bay:
- **0-1500 units (East)**: Very shallow near Burlington waterfront (10-25 feet)
- **1500-3500 units**: Gradual shelf (25-50 feet) - excellent for perch and bass
- **3500-6000 units**: Transitional zone with drop-offs (50-90 feet)
- **6000-10000 units (West)**: Deep water (90-150 feet) - lake trout territory

### 2. NavigationScene - Top-Down Lake Exploration

A new scene (`src/scenes/NavigationScene.js`) provides a top-down view for kayak and motorboat modes:

#### Movement Controls
- **X button**: Hold to move forward
- **D-pad/Arrow keys**: Steer left/right
- **Triangle/W**: Start fishing (when stopped)

#### Movement Physics
**Kayak:**
- Max speed: 3.0 (slower, realistic paddling)
- Quick deceleration: 0.15 (stops fairly fast)
- Tiredness system carries over from existing implementation

**Motorboat:**
- Max speed: 8.0 (much faster)
- Coasts longer: deceleration 0.08
- Gas consumption system carries over

#### Fishfinder Minimap
Located in bottom-right corner, shows:
- Real-time depth profile ahead of the boat
- Current depth reading
- Bottom structure (flat, sloping, drop-off/ledge)
- Depth description (very shallow → very deep)

### 3. Updated Terrain Generation

Both `IceHoleManager.js` and `BoatManager.js` now use bathymetric data:

**Before:**
```javascript
// Procedural sine wave generation
depth = 80 + Math.sin(x * 0.003) * 30 + Math.sin(x * 0.01) * 20
```

**After:**
```javascript
// Real bathymetric data from navigation position
const depth = this.bathyData.getDepthAtPosition(worldX, this.worldY);
```

The terrain profile centers on the player's position from NavigationScene, or uses sensible defaults if launched directly.

### 4. Game Flow Integration

**Menu → Navigation → Fishing:**

1. **Ice Fishing**: Menu → GameScene (no navigation needed)
2. **Kayak/Motorboat**: Menu → NavigationScene → GameScene

**Mode-Specific Starting Positions:**

- **Arcade Mode**: Spawns in good fishing spot (25-45 feet, perch territory)
- **Unlimited Mode**: Spawns near shore (800 units), must explore to find fish

### 5. Depth-Based Fish Spawning

The bathymetric data influences fish behavior and spawning:

- **Shallow areas (10-40 ft)**: Yellow perch, smallmouth bass
- **Mid-depth (40-100 ft)**: Lake trout, walleye
- **Deep water (100-150 ft)**: Large lake trout

## Technical Implementation

### Data Flow

```
BathymetricData (singleton)
    ↓
NavigationScene (top-down exploration)
    → Sets registry: fishingWorldX, fishingWorldY
    ↓
GameScene (side-scrolling fishing)
    ↓
IceHoleManager / BoatManager
    → Reads world position from registry
    → Generates terrain using bathymetric data
```

### World Coordinate System

- **X-axis**: 0-10000 units (East to West)
  - 0 = Burlington waterfront (shallow)
  - 5000 = Mid-bay
  - 10000 = Western deep water

- **Y-axis**: 0-10000 units (South to North)
  - 5000 = Default central latitude

### Fishing Session Mapping

When you start fishing, the game maps a 10000-unit horizontal range centered on your navigation position:

```
Game X: 0 -------- 5000 -------- 10000
          ↑          ↑           ↑
World X:  (pos-5000) pos      (pos+5000)
```

This gives you about ±5000 units of fishing range around your chosen spot.

## User Experience

### Arcade Mode
- **Start**: Instantly placed in proven fishing spot with ideal depth
- **Goal**: Maximize catch in 2 minutes
- **Strategy**: Focus on fishing, minimal navigation

### Unlimited Mode
- **Start**: Near shore in shallow water
- **Goal**: Explore the lake to find structure and depth
- **Strategy**: Use fishfinder to locate drop-offs, humps, and deep channels
- **Gameplay Loop**:
  1. Navigate with X button (hold to move)
  2. Watch fishfinder for interesting structure
  3. Stop in promising area (release X)
  4. Press Triangle to start fishing
  5. Catch fish, then explore more

## Future Enhancements

Potential additions to the terrain system:

1. **Multiple lake regions**: Expand beyond Burlington Bay
2. **Seasonal depth changes**: Different water levels
3. **Real GPS coordinates**: Map actual lat/lon to game positions
4. **Structure labels**: Mark known fishing spots
5. **Minimap overview**: Show entire lake with your position
6. **Waypoints**: Mark and return to productive spots

## Data Source

Bathymetric data derived from:
- **NOAA Chart 14782**: Cumberland Head to Four Brothers Islands
- **Survey Date**: Various (most recent updates)
- **Soundings**: In feet (Lake Champlain standard)

## Files Modified/Created

### New Files
- `src/utils/BathymetricData.js` - Core terrain data and utilities
- `src/scenes/NavigationScene.js` - Top-down lake navigation
- `docs/terrain-generation-system.md` - This documentation

### Modified Files
- `src/managers/IceHoleManager.js` - Now uses bathymetric data
- `src/managers/BoatManager.js` - Now uses bathymetric data
- `src/scenes/MenuScene.js` - Routes to NavigationScene for boat modes
- `src/index.js` - Added NavigationScene to scene list

## Testing

To test the new system:

1. **Start kayak or motorboat mode** from menu
2. **Navigate around** using X button and D-pad
3. **Watch the fishfinder** in bottom-right corner
4. **Find interesting depth/structure**
5. **Stop and press Triangle** to start fishing
6. **Notice the terrain** matches your chosen depth

The sidescroller view should now show realistic bottom contours based on where you stopped in the navigation view.
