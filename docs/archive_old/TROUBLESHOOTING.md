# Wolfpack - Troubleshooting Guide

**Last Updated**: 2025-10-29
**Recent Fixes**: Fish rendering, lure positioning, catch popup input

---

## 🐛 Recent Bugs Fixed (October 2025)

### Fish Not Appearing in Catch Popup

**Date Fixed**: 2025-10-29
**Commits**: 944180e, e7416f2, 865579c, 6559f40, 4af060d

**Problem**:
Fish would not render in the catch popup screen after landing a fish. The popup would show but the fish image was missing.

**Root Cause**:
Phaser's Graphics objects don't work like standard canvas - setting `graphics.x` and `graphics.y` does **NOT** control where shapes are drawn! This is a critical Phaser-specific behavior.

**Attempted Fixes** (unsuccessful):
1. Passing absolute coordinates to `renderBody()` - didn't work
2. Setting `graphics.x = x; graphics.y = y` - **doesn't affect drawing position!**
3. Using `renderAtPosition()` with direct coordinates - still didn't work

**Final Solution**:
Use Phaser's canvas transformation methods:

```javascript
// ❌ WRONG - doesn't work with Phaser Graphics
renderAtPosition(graphics, x, y, bodySize) {
    graphics.x = x;  // This doesn't control drawing position!
    graphics.y = y;
    this.renderBody(graphics, bodySize, colors, 0, 0);
}

// ✅ CORRECT - use translateCanvas
renderAtPosition(graphics, x, y, bodySize) {
    graphics.save();
    graphics.translateCanvas(x, y);  // Shift coordinate system
    this.renderBody(graphics, bodySize, colors, 0, 0);  // Draw at origin
    graphics.restore();
}
```

**Files Modified**:
- `src/models/species/LakeTrout.js:100-109`
- `src/models/species/NorthernPike.js:124-135`
- `src/models/species/SmallmouthBass.js:140-151`
- `src/models/species/YellowPerch.js:133-144`

**Lesson Learned**: Phaser Graphics uses a different coordinate system than Sprites. Always use `translateCanvas()` for positioning, never set `graphics.x/y`!

---

### Lure Staying Fixed During Fish Fight

**Date Fixed**: 2025-10-29
**Commits**: 865579c

**Problem**:
During fish fights, the lure would appear frozen in one position instead of following the fish's mouth as it moved.

**Root Cause**:
The lure's `update()` method (which includes `render()`) was being skipped during fish fights to prevent physics updates. However, this also prevented the lure from being **drawn**, making it appear frozen even though its position was being updated by `FishFight.updateFishPosition()`.

**Solution**:
Call `lure.render()` during fish fights while still skipping `lure.update()`:

```javascript
// In GameScene.js:449-455
if (!this.currentFight || !this.currentFight.active) {
    this.lure.update();  // Normal mode: full update including render
} else {
    // During fight: only render (position updated by FishFight)
    this.lure.render();
}
```

**Files Modified**:
- `src/scenes/GameScene.js:449-455`

**Lesson Learned**: Separate update logic from rendering logic. Physics updates should be paused during fights, but rendering should continue.

---

### Lure Drifting Away from Ice Hole

**Date Fixed**: 2025-10-29
**Commits**: 74d47a5

**Problem**:
The lure would gradually drift away from the ice hole center during fish fights, eventually moving off-screen.

**Root Cause**:
Circular reference in position calculations:
```javascript
// Line 362: Fish position based on lure
this.fish.x = this.lure.x + actualThrash;

// Line 368: Lure position based on fish
this.lure.x = this.fish.x + mouthOffset;
```
This created a feedback loop where small rounding errors would accumulate, causing drift.

**Solution**:
Store the ice hole center position and use it as the reference point:

```javascript
// In constructor (FishFight.js:47):
this.centerX = this.lure.x;  // Store ice hole center

// In updateFishPosition (FishFight.js:365):
this.fish.x = this.centerX + actualThrash;  // Use centerX, not lure.x
this.lure.x = this.fish.x + mouthOffset;
```

**Files Modified**:
- `src/entities/FishFight.js:47, 365`

**Lesson Learned**: Avoid circular references in position calculations. Always have one authoritative reference point.

---

### Catch Popup Dismissing with Any Button

**Date Fixed**: 2025-10-29
**Commits**: 28c302c

**Problem**:
The catch popup would dismiss when pressing any gamepad button, making it easy to accidentally skip the catch screen.

**Solution**:
Only accept X button (button 2) on gamepad, Spacebar or Enter on keyboard:

```javascript
// Gamepad handler - only accept X button (button 2)
const gamepadHandler = (pad, button, value) => {
    if (button.index === 2) {  // X button only
        dismissPopup();
    }
};
```

**Files Modified**:
- `src/entities/FishFight.js:685-695`

---

### Start Menu Interfering with Catch Popup

**Date Fixed**: 2025-10-29
**Commits**: 4af060d

**Problem**:
Pressing buttons on the catch popup would also trigger pause menu actions because the NotificationSystem was still processing input.

**Solution**:
Add `catchPopupActive` flag and block input systems:

```javascript
// In FishFight.js (showCatchPopup):
this.scene.catchPopupActive = true;  // Set flag
overlay.setInteractive();  // Block input to objects below

// In GameScene.js (update):
if (!this.catchPopupActive) {
    this.notificationSystem.update(time, delta);  // Skip when popup active
}
```

**Files Modified**:
- `src/entities/FishFight.js:579, 700`
- `src/scenes/GameScene.js:98, 307, 312`

---

### Fish Scaling Too Large in Catch Popup

**Date Fixed**: 2025-10-29
**Commits**: 74d47a5

**Problem**:
Large fish (40-50 lbs) were rendering too large in the catch popup, extending beyond the popup boundaries.

**Solution**:
Reduced display scale from 2 to 1:

```javascript
// In FishFight.js:627
this.fish.renderAtPosition(fishGraphics, popupX, popupY - 40, 1);  // Was 2
```

**Effect**:
- 30lb fish: Now ~48px instead of ~96px
- 50lb trophy fish: Now ~80px instead of ~160px

**Files Modified**:
- `src/entities/FishFight.js:627`

---

## 🔧 Common Issues & Solutions

### Graphics Rendering Problems

**Symptom**: Shapes not appearing where expected, or not appearing at all

**Common Causes**:
1. Setting `graphics.x/y` instead of using `translateCanvas()`
2. Forgetting `graphics.save()` and `graphics.restore()`
3. Drawing outside visible canvas bounds

**Solution**:
```javascript
// Always use this pattern for positioned rendering
graphics.save();
graphics.translateCanvas(x, y);  // Move coordinate system
// Draw at (0, 0) relative to translated position
graphics.fillCircle(0, 0, radius);
graphics.restore();  // Reset coordinate system
```

**Files to Check**:
- `src/models/species/*.js` - All species rendering
- `src/entities/Fish.js` - Fish wrapper rendering
- `src/entities/Baitfish.js` - Baitfish rendering

---

### Coordinate System Bugs

**Symptom**: Entities appearing in wrong locations or not visible

**Common Causes**:
1. Not detecting nature simulation mode
2. Not checking for manager existence
3. Hardcoding screen coordinates

**Solution**:
```javascript
// Always detect mode and convert coordinates
if (this.scene.iceHoleManager) {
    // Ice mode
    const hole = this.scene.iceHoleManager.getCurrentHole();
    const playerWorldX = hole.x;
    this.x = (GameConfig.CANVAS_WIDTH / 2) + (this.worldX - playerWorldX);
} else if (this.scene.boatManager) {
    // Boat/kayak mode
    const playerWorldX = this.scene.boatManager.getPlayerWorldX();
    this.x = (GameConfig.CANVAS_WIDTH / 2) + (this.worldX - playerWorldX);
} else {
    // Nature simulation mode
    this.x = this.worldX;  // Direct assignment
}
```

**Files to Check**:
- `src/entities/Fish.js`
- `src/entities/Baitfish.js`
- `src/entities/BaitfishCloud.js`

---

### Depth Scaling Issues

**Symptom**: Fish going through bottom or appearing at wrong depths

**Common Causes**:
1. Hardcoding DEPTH_SCALE (it's dynamic!)
2. Not using scene.maxDepth
3. Assuming fixed depth values

**Solution**:
```javascript
// ❌ WRONG
const maxY = 150 * 1.625;  // Hardcoded!

// ✅ CORRECT
const bottomDepth = this.scene.maxDepth || GameConfig.MAX_DEPTH;
const maxY = (bottomDepth - 5) * GameConfig.DEPTH_SCALE;
```

**Why it's dynamic**:
```javascript
// GameScene.js calculates DEPTH_SCALE based on actual water depth
const TARGET_BOTTOM_RATIO = 0.85;  // Keep bottom at 85% of screen
const idealDisplayRange = this.maxDepth / TARGET_BOTTOM_RATIO;
GameConfig.DEPTH_SCALE = GameConfig.CANVAS_HEIGHT / displayRange;
```

**Files to Check**:
- All entity files that use depth calculations
- `src/scenes/GameScene.js:140-153`

---

### Null Pointer Errors

**Symptom**: `Cannot read properties of null (reading 'x')` or similar

**Common Causes**:
1. Accessing lure in nature simulation mode
2. Accessing manager that doesn't exist
3. Accessing fish that was destroyed

**Solution**:
```javascript
// Always check for null before accessing
if (!lure) {
    // Nature mode or lure not spawned yet
    return;
}

const distance = Utils.calculateDistance(this.x, this.y, lure.x, lure.y);
```

**Most Common Culprit**: FishAI.js accessing lure in nature simulation mode

**Files to Check**:
- `src/entities/FishAI.js` - All lure references
- All manager access code

---

### Baitfish Stuck in Vertical Line

**Symptom**: All baitfish converge to a vertical line at screen center

**Cause**:
In nature simulation mode, giving all baitfish velocity toward center (x=600):

```javascript
// ❌ WRONG - causes vertical line
cloud.velocity.x = fromLeft ? 0.5 : -0.5;  // All move toward center
```

**Solution**:
```javascript
// ✅ CORRECT - random horizontal movement
if (this.scene.iceHoleManager || this.scene.boatManager) {
    // Normal modes: drift toward player
    cloud.velocity.x = fromLeft ? 0.5 : -0.5;
} else {
    // Nature mode: random direction
    cloud.velocity.x = Utils.randomBetween(-0.8, 0.8);
}
```

**Files to Check**:
- `src/scenes/systems/SpawningSystem.js`

---

### Fish Fight Bugs

**Symptom**: Fish or lure not visible during fight, or unusual behavior

**Common Causes**:
1. Circular position references (drift bug)
2. Not rendering lure during fight
3. Input systems still processing

**Solutions**:

**Prevent drift**:
```javascript
// Store reference point in constructor
this.centerX = this.lure.x;

// Use reference point, not lure.x
this.fish.x = this.centerX + actualThrash;
this.lure.x = this.fish.x + mouthOffset;
```

**Render lure during fight**:
```javascript
// In GameScene.update()
if (!this.currentFight || !this.currentFight.active) {
    this.lure.update();  // Full update
} else {
    this.lure.render();  // Just render, position updated by FishFight
}
```

**Block input systems**:
```javascript
// Set flag when fight starts
this.scene.catchPopupActive = true;

// Skip systems that could interfere
if (!this.catchPopupActive) {
    this.notificationSystem.update(time, delta);
}
```

**Files to Check**:
- `src/entities/FishFight.js`
- `src/scenes/GameScene.js`

---

### Console Errors

**Common Errors and Fixes**:

```
Cannot read properties of null (reading 'x')
→ Missing null check for lure or manager

Cannot read properties of undefined (reading 'depthZone')
→ Fish object not fully initialized or corrupted

graphics.translateCanvas is not a function
→ Wrong Phaser version or graphics object type

Maximum call stack size exceeded
→ Circular reference or infinite recursion (check position updates)
```

---

## 🔍 Debugging Techniques

### 1. Enable Debug Mode

Press **backtick (`)** key or click "Toggle Debug Info" button

**Shows**:
- Fish states (color-coded)
- Detection ranges (yellow circles, 350px)
- Strike distances (red circles)
- Connection lines to lure
- Baitfish flock visualization
- FPS counter

### 2. Add Console Logs

```javascript
// Coordinate debugging
console.log('Fish worldX:', this.worldX, 'screenX:', this.x);
console.log('Mode:', this.scene.iceHoleManager ? 'ice' :
                     this.scene.boatManager ? 'boat' : 'nature');

// Rendering debugging
console.log('Rendering at:', x, y);
console.log('Graphics position:', graphics.x, graphics.y);

// Depth debugging
console.log('Depth:', this.depth, 'Y:', this.y,
            'DEPTH_SCALE:', GameConfig.DEPTH_SCALE);
```

### 3. Use Dev Panel

**Fish Status Panel** (updates every 100ms):
- Real-time fish states
- Hunger and health values
- Frenzy status
- Depth zones

**Dev Controls**:
- Spawn fish manually
- Change lure weight
- Change line type
- Reset game

### 4. Check Browser Console

Open browser DevTools (F12) and check for:
- Red error messages
- Yellow warnings
- Network errors (assets not loading)

---

## 📋 Diagnostic Checklist

When encountering a bug:

- [ ] Check browser console for errors
- [ ] Enable debug mode (backtick key)
- [ ] Verify coordinate system (worldX vs screenX)
- [ ] Check for null references (lure, manager)
- [ ] Verify depth calculations use DEPTH_SCALE
- [ ] Test in all game modes (ice, kayak, boat, nature)
- [ ] Check recent git commits for related changes
- [ ] Review ARCHITECTURE.md for system design
- [ ] Add console.log statements at key points
- [ ] Test with dev panel spawn buttons

---

## 🚨 Critical Patterns to Remember

### Graphics Rendering
```javascript
// ALWAYS use translateCanvas for positioning
graphics.save();
graphics.translateCanvas(x, y);
graphics.fillCircle(0, 0, radius);  // Draw at origin
graphics.restore();
```

### Coordinate Conversion
```javascript
// ALWAYS detect mode and convert
const isNatureMode = !this.scene.iceHoleManager && !this.scene.boatManager;
if (isNatureMode) {
    this.x = this.worldX;
} else {
    this.x = (GameConfig.CANVAS_WIDTH / 2) + (this.worldX - playerWorldX);
}
```

### Depth Scaling
```javascript
// NEVER hardcode DEPTH_SCALE
const maxY = (this.scene.maxDepth - 5) * GameConfig.DEPTH_SCALE;
```

### Null Safety
```javascript
// ALWAYS check before accessing
if (!lure || !this.scene.iceHoleManager) {
    return;  // Safe exit
}
```

---

## 📞 Getting Help

1. **Check this file** for known issues
2. **Check ARCHITECTURE.md** for design patterns
3. **Check QUICK_START.md** for common tasks
4. **Enable debug mode** and observe behavior
5. **Check git log** for recent changes
6. **Add console logs** to trace execution
7. **Test in all modes** to isolate the issue

---

**Remember**: Most bugs are related to coordinate systems, graphics rendering, or null references. Check these first!
