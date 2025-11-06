# Species Testing Checklist

Use this checklist when adding a new fish species to ensure all functionality works correctly.

## Pre-Implementation Testing

- [ ] Research real-world species data (weight ranges, depth preferences, behavior)
- [ ] Decide spawn rate and verify it maintains game balance
- [ ] Choose depth range that makes sense for species biology
- [ ] Design unique visual appearance (colors, patterns, body shape)

## Code Implementation Checklist

### SpeciesData.js
- [ ] Species data object created with correct structure
- [ ] All size categories defined (small, medium, large, trophy)
- [ ] Weight ranges are realistic and non-overlapping
- [ ] Behavior properties set (huntingStyle, territorialBehavior, feedingPeriods)
- [ ] Diet preferences configured (if species hunts baitfish)
- [ ] Fight characteristics defined (stamina, difficulty, runDistance)
- [ ] Appearance data complete (colorScheme, bodyShape)
- [ ] No syntax errors (check browser console)

### Fish.js
- [ ] Rendering method created (`renderSpeciesName()`)
- [ ] Body colors match species data
- [ ] Patterns rendered correctly (bars, spots, etc.)
- [ ] Fins positioned and colored appropriately
- [ ] Eye color and position look natural
- [ ] Species check added to `render()` method
- [ ] Species check added to `renderAtPosition()` method (catch screen)
- [ ] Length formula added with appropriate constants
- [ ] Age calculation adjusted if needed

### FishAI.js (if unique behavior needed)
- [ ] Constructor sets up unique behavior flags
- [ ] Custom movement logic implemented
- [ ] Behavior parameters tuned and tested
- [ ] AI state transitions work correctly
- [ ] No conflicts with existing behaviors

### GameScene.js
- [ ] Spawn distribution updated (percentages total 100%)
- [ ] Depth range added to spawn logic
- [ ] Species spawns at intended depths
- [ ] Spawn rate feels balanced during gameplay

## Visual Testing

### Rendering Tests
- [ ] **Small size** - Fish renders correctly at small size
- [ ] **Medium size** - Fish renders correctly at medium size
- [ ] **Large size** - Fish renders correctly at large size
- [ ] **Trophy size** - Fish renders correctly at trophy size
- [ ] **Left-facing** - Fish looks correct when swimming left
- [ ] **Right-facing** - Fish looks correct when swimming right
- [ ] **Color accuracy** - Colors match species design
- [ ] **Pattern clarity** - Bars/spots/mottling are visible
- [ ] **Proportions** - Body length/height ratio looks natural
- [ ] **Fin placement** - Fins positioned naturally

### In-Game Appearance
- [ ] Fish visible on sonar display
- [ ] Fish renders at different depths (near surface, mid-depth, deep)
- [ ] Fish scales appropriately with body size
- [ ] Fish is distinguishable from other species
- [ ] Catch screen shows fish correctly

## Behavior Testing

### AI Behavior
- [ ] Fish spawns at correct depth range (verify multiple spawns)
- [ ] Fish moves naturally when idle
- [ ] Fish detects lure at appropriate distance
- [ ] Fish becomes interested in lure correctly
- [ ] Fish chases lure when aggressive
- [ ] **Unique behavior** works as designed (if applicable):
  - [ ] Ambush: Fish holds position and strikes explosively
  - [ ] Circling: Fish circles lure before striking
  - [ ] Pack hunting: Fish coordinates with others
  - [ ] Other: _________________

### Strike Behavior
- [ ] Fish strikes lure at correct distance
- [ ] Strike animation looks natural
- [ ] Hook-up triggers fish fight correctly
- [ ] Small fish strike more readily than large fish
- [ ] Species aggressiveness feels appropriate

### Diet Preferences (if applicable)
- [ ] Fish hunts preferred baitfish species
- [ ] Fish ignores non-preferred baitfish appropriately
- [ ] Diet preferences affect behavior noticeably

## Fight Testing

### Fight Mechanics
- [ ] Line tension mechanics work correctly
- [ ] Fish stamina matches species data
- [ ] Run distance feels appropriate for species
- [ ] Strip line chance is balanced (not too easy/hard)
- [ ] Fight difficulty matches species data rating
- [ ] **Easy species** - Can land consistently without losing
- [ ] **Medium species** - Challenging but fair
- [ ] **Hard species** - Requires skill and attention
- [ ] **Very hard species** - Trophy-level challenge

### Fight Duration
- [ ] Small fish are quick to land
- [ ] Medium fish take moderate time
- [ ] Large fish put up good fight
- [ ] Trophy fish are memorable battles

## Spawn Testing

### Spawn Rate
- [ ] Species spawns at intended frequency
- [ ] Not too common (feels cheap)
- [ ] Not too rare (frustrating to find)
- [ ] Spawn rate balanced with other species
- [ ] Catch 20 fish, verify distribution matches intended percentages

### Spawn Location
- [ ] Species spawns at correct depths
- [ ] Depth range feels realistic for species
- [ ] Easy to find where it should be
- [ ] Not spawning where it shouldn't be

### Size Distribution
- [ ] Small size spawns correctly (50% chance)
- [ ] Medium size spawns correctly (30% chance)
- [ ] Large size spawns correctly (15% chance)
- [ ] Trophy size spawns correctly (5% chance)
- [ ] Catch multiple fish, verify size distribution

## Integration Testing

### Game Balance
- [ ] New species doesn't break game economy
- [ ] Points awarded feel fair for difficulty
- [ ] Spawn rate doesn't overwhelm other species
- [ ] Species fits the intended player experience
- [ ] Beginner/intermediate/advanced players can enjoy species

### Multi-Species Interactions
- [ ] New species works alongside existing species
- [ ] No AI conflicts between species
- [ ] Baitfish interactions work correctly
- [ ] Multiple species can spawn in same session

### Performance
- [ ] No lag when species spawns
- [ ] Rendering doesn't slow down game
- [ ] AI doesn't cause performance issues
- [ ] Multiple instances can exist simultaneously

## User Experience Testing

### Catch Experience
- [ ] First catch feels exciting
- [ ] Species identification is clear (name, weight, length)
- [ ] Catch screen displays correctly
- [ ] Points awarded accurately
- [ ] Species info saves to caught fish data

### Information Display
- [ ] Species name displays correctly in UI
- [ ] Weight displays correctly
- [ ] Length displays correctly
- [ ] Age calculation makes sense
- [ ] Catch popup shows correct info

### Gamepad/Controller
- [ ] All controls work during fight
- [ ] Rumble works appropriately (if implemented)
- [ ] Button mappings respond correctly

## Edge Cases

- [ ] Fish at minimum depth renders correctly
- [ ] Fish at maximum depth renders correctly
- [ ] Smallest possible fish (min weight) works
- [ ] Largest possible fish (max trophy weight) works
- [ ] Fish near screen edges renders correctly
- [ ] Multiple fish of same species can exist
- [ ] Line break works correctly
- [ ] Fish escape works correctly

## Cross-Mode Testing

Test species in all fishing modes:

### Ice Fishing Mode
- [ ] Species spawns correctly
- [ ] Depth range appropriate
- [ ] Fight mechanics work
- [ ] Catch screen displays

### Kayak Mode
- [ ] Species spawns correctly
- [ ] Depth range appropriate
- [ ] Fight mechanics work
- [ ] Catch screen displays

### Motorboat Mode
- [ ] Species spawns correctly
- [ ] Depth range appropriate
- [ ] Fight mechanics work
- [ ] Catch screen displays

## Final Checks

- [ ] No console errors when species spawns
- [ ] No console errors during fish fight
- [ ] No console errors on catch
- [ ] Game doesn't freeze or crash
- [ ] All code changes committed
- [ ] Commit message describes changes clearly
- [ ] Code follows existing patterns
- [ ] Comments added where needed

## Sign-Off

**Species**: ___________________
**Tested By**: ___________________
**Date**: ___________________
**Result**: ⬜ Pass ⬜ Needs Work

**Notes**:
___________________
___________________
___________________

---

## Testing Tips

- Test each species in isolation first (increase spawn rate to 100% temporarily)
- Use browser dev tools to check for JavaScript errors
- Test on different screen sizes if possible
- Catch at least 10-20 fish to verify weight/size distribution
- Try both keyboard and gamepad controls
- Test in both arcade and unlimited modes
- Take screenshots of any visual bugs

## Known Issues Template

If you find bugs during testing, document them:

**Bug**: _________________
**Steps to Reproduce**: _________________
**Expected Behavior**: _________________
**Actual Behavior**: _________________
**Severity**: ⬜ Critical ⬜ Major ⬜ Minor
**Status**: ⬜ Open ⬜ Fixed ⬜ Won't Fix
