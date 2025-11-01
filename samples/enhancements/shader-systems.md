# Shader Systems for Wolfpack

## Core Concept: Shader-Based Fish Rendering

**Approach**: Start with simple base fish silhouettes (PNG with alpha channel, 128x64px), then use shaders to add:
- Procedural scale patterns
- Color gradients based on depth/lighting
- Species-specific patterns (spots, stripes)
- Dynamic effects (shimmer, iridescence)
- Physics-driven animations (body flex, speed-based effects)

**Benefits**:
- Single base sprite generates infinite variations
- Memory efficient (1-2KB base vs 100KB+ pre-rendered variations)
- Real-time parameter tweaking
- Context-aware rendering (depth, lighting, motion)

## Fish Rendering Shaders

### 1. Base Fish Shader (Species-Specific)

```glsl
// Uniforms needed:
uniform float uTime;
uniform vec3 uBaseColor;        // Species color
uniform float uSpotDensity;     // 0.0-1.0
uniform float uStripeIntensity; // 0.0-1.0
uniform float uDepth;           // Normalized 0.0-1.0
uniform float uBodyBend;        // From physics
uniform float uSpeed;           // From physics velocity

// Features to implement:
- Procedural spots using noise function
- Horizontal stripes with sin waves
- Belly-to-back gradient
- Depth-based color shifting (deeper = darker/bluer)
- Body flex distortion from tail beat
- Speed-based shimmer effects
```

**Species Parameters**:
```javascript
lakeTrout: {
    baseColor: [0.2, 0.5, 0.3],
    spotDensity: 0.8,
    stripeIntensity: 0.3
}
landlockSalmon: {
    baseColor: [0.6, 0.6, 0.7],
    spotDensity: 0.4,
    stripeIntensity: 0.1
}
smallmouthBass: {
    baseColor: [0.4, 0.3, 0.2],
    spotDensity: 0.2,
    stripeIntensity: 0.6
}
```

### 2. Normal Map Enhancement

Optional grayscale normal map (128x64px) defines 3D-ness:
- White = raised areas (scales, fins)
- Black = recessed areas
- Gray = flat areas

Enables depth-based lighting without 3D geometry.

## Fish State Shaders

### 3. Hooked/Fighting State
```glsl
uniform float uFightIntensity; // 0.0-1.0

Effects:
- Rapid color pulsing (stress response)
- Darken with stress hormones
- Red tint around gills (oxygenation)
- Shake/distortion (struggling)
```

### 4. Fatigued State
```glsl
uniform float uFatigueLevel; // 0.0-1.0

Effects:
- Desaturation (loss of color)
- Overall darkening
- Slow breathing pulse
- Blur edges (loss of muscle control)
```

### 5. Spooked/Fleeing State
```glsl
uniform float uSpookLevel;
uniform vec2 uThreatDirection;

Effects:
- Motion blur away from threat
- Bright flash (stress response)
- Silver flash on sides (turning reflection)
```

### 6. Curious/Investigating State
```glsl
uniform float uCuriosityLevel;
uniform vec2 uLurePosition;

Effects:
- Heightened brightness and saturation
- Eye highlight (focus)
- Subtle scanning shimmer
```

### 7. Feeding Frenzy State
```glsl
uniform float uFrenzyIntensity;

Effects:
- Rapid color shifts (excitement)
- Intense saturation
- Aggressive red tones
- Rapid shimmer (thrashing)
- Speed lines
```

## Environmental Shaders

### 8. Deep Water / Low Light
```glsl
uniform float uDepth; // in feet
uniform vec3 uWaterColor; // Lake-specific

Effects:
- Light absorption (red disappears first at depth)
- Water color tint increases with depth
- Reduced contrast
- Particulate matter (murk)
```

### 9. Murky/Turbid Water
```glsl
uniform float uTurbidity; // 0.0-1.0

Effects:
- Reduced visibility/fading
- Suspended sediment color overlay
- Dappled light through particles
- Blur effect
```

### 10. Thermocline Shimmer
```glsl
uniform float uThermoclineDepth;
uniform float uCurrentDepth;

Effects:
- Wavy distortion at temperature boundary
- Refraction shimmer
- Heat wave effect where cold/warm water meets
```

### 11. Dawn/Dusk Magic Hour
```glsl
uniform float uTimeOfDay; // 0-24 hours

Effects:
- Warm golden tint during golden hour
- Rim lighting from low angle sun
- Long shadows (darker bottom areas)
```

### 12. Storm/Overcast Conditions
```glsl
uniform float uStormIntensity;

Effects:
- Desaturation and darkening
- Blue-gray tint
- Diffused lighting (no highlights)
- Rain streak effects
```

## Lure Shaders

### 13. Vibrating Lure (Crankbait)
```glsl
uniform float uVibrationSpeed;
uniform float uVibrationIntensity;

Effects:
- Rapid oscillation
- Motion blur from vibration
- Flash effect from movement
```

### 14. Spinning Lure (Spinnerbait)
```glsl
uniform float uRotationSpeed;
uniform vec2 uBladePosition;

Effects:
- Blade catches light at certain angles
- Intense metallic flash
- Trailing sparkle
```

## Game Event Shaders

### 15. Strike Detection
```glsl
uniform float uStrikeTime; // time since strike
uniform vec2 uStrikePoint;

Effects:
- Shockwave from impact point
- White flash
- Chromatic aberration
```

### 16. Line Tension Warning
```glsl
uniform float uTension; // 0.0-1.0

Effects:
- Red pulsing warning when danger > 0.7
- Screen shake effect
- Vignette darkening
```

### 17. Fish Landed (Success)
```glsl
uniform float uSuccessTime;

Effects:
- Golden glow/tint
- Brightness boost
- Sparkle effect
- Slow zoom/glow
```

### 18. Fish Lost (Failure)
```glsl
uniform float uLossTime;

Effects:
- Desaturation
- Darkening
- Motion blur (fish swimming away)
- Fade out alpha
```

## UI & Meter Shaders

### 19. Depth Gauge Shader
```glsl
uniform float uDepth; // 0.0-1.0 normalized

Features:
- Fill from bottom up
- Color gradient: shallow (cyan) -> deep (dark blue)
- Shimmer in filled area
- Animated water line at fill level
- Border glow
```

### 20. Line Tension Meter
```glsl
uniform float uTension; // 0.0-1.0

Features:
- Horizontal fill
- Color shifts: green (safe) -> yellow (warning) -> red (danger)
- Pulse in danger zone
- Scanline effect
- Fiber stress lines at high tension
```

### 21. Digital Readout (CRT Effect)
```glsl
uniform float uValue; // number to display

Features:
- 7-segment digit patterns
- CRT glow (green phosphor)
- Scanlines
- Flicker effect
- Vignette for CRT curve
```

### 22. Circular Sonar Display
```glsl
uniform vec2 uPlayerPos;
uniform vec2 uFishPositions[10];
uniform int uFishCount;

Features:
- Radar sweep animation
- Range rings
- Fish blips with pulse effect
- Center crosshair (player position)
- Scanlines
```

### 23. VHS Tape Distortion (Retro UI)
```glsl
Features:
- Horizontal distortion
- Chromatic aberration
- VHS scanlines
- Random noise
- Tracking errors (horizontal bars)
```

### 24. Holographic Display
```glsl
Features:
- Cyan/blue hologram color
- Scan line moving down
- Flickering
- Edge glow
- Transparency with glow
```

## Sonar Simulation Shaders

### 25. Traditional Scrolling Sonar Graph
```glsl
uniform sampler2D uReturnData; // Texture containing ping history
uniform float uMaxDepth;
uniform float uDepthRange;

Features:
- Color ramp: blue (weak) -> yellow (medium) -> red (strong)
- Scrolling right-to-left
- Depth grid lines
- Vertical time lines (ping marks)
- Current scan line highlight
```

**Sonar Physics Calculations**:
```javascript
// Real-world specifications for Lake Champlain
sonarConfig: {
    frequency: 200000,      // 200kHz
    coneAngle: 20,          // degrees (narrow deep beam)
    maxDepth: 150,          // feet
    pingRate: 15,           // pings per second
    speedOfSound: 4921      // feet per second in water
}

// Calculate cone radius at depth
coneRadius = tan(coneAngle/2) * depth

// Signal strength factors
signalStrength = positionStrength * sizeStrength * swimBladderStrength
where:
    positionStrength = 1.0 - (distanceFromConeCenter * 0.5)
    sizeStrength = fishLength / 100
    swimBladderStrength = swimBladder / 10
```

### 26. Baitfish Cloud Shader
```glsl
uniform float uTime;
uniform vec2 uCloudCenter;
uniform float uCloudSize;
uniform float uDensity;

Features:
- Draw multiple fish in single shader
- Pseudo-random positioning within cloud
- Animated circular motion
- Shimmer based on position
- Depth-based alpha (back fish more transparent)
- Scatter when predator approaches
```

## Shader Uniform Updates

```javascript
// Update every frame
fish.update(time, delta) {
    // ... physics updates ...

    // Update shader
    const pipeline = fish.visual.getPipeline('FishShader');
    pipeline.set1f('uTime', time / 1000);
    pipeline.set3f('uBaseColor', ...color);
    pipeline.set1f('uBodyBend', calculateBodyBend());
    pipeline.set1f('uSpeed', velocity.length() / 100);
    pipeline.set1f('uDepth', depth / 150);
}
```
