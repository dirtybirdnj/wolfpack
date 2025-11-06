# November 6th Bug List

## 1. Crayfish Not Spawning on Lake Floor
**Issue:** Crayfish are appearing mid-water column instead of on the bottom
**Expected:** Crayfish should spawn and stay near the lake floor
**Priority:** Medium
**Status:** Not started

## 2. Zooplankton Positioning Wrong
**Issue:** Zooplankton appear in center of water column instead of bottom
**Expected:** Zooplankton should start at bottom and migrate upward
**Priority:** Medium
**Status:** Not started

## 3. Lake Trout Movement Unnatural
**Issue:** Lake trout movement doesn't match baitfish fluidity
- Often not traveling in direction arrow is pointing
- Movement appears jerky or unnatural compared to baitfish
**Expected:** Smooth, directional movement like baitfish
**Priority:** High
**Status:** Not started

## 4. Lake Trout Spawning in Huge Clouds (CRITICAL)
**Issue:** Game appears to be spawning massive clouds of lake trout instead of baitfish
- Large schools of lakers appearing
- No baitfish schools visible
**Expected:** Baitfish should spawn in schools, predators spawn individually or in small groups
**Priority:** CRITICAL
**Status:** Not started

---

## Future Features (Post-Refactor Stability)

### Environmental Features
- [ ] **Piles of rocks on lake floor** - Crayfish and baitfish can hide in them
- [ ] **Plants growing from lake floor** - Appear in shallower depths for realism
- [ ] **Zebra mussels on rocks** - Special food source for freshwater drum

### New Species
- [ ] **Panfish species** - Add bluegill, crappie, etc.
- [ ] **Freshwater drum** - Feeds on zebra mussels
- [ ] **Brook trout** - Small stream trout for shallow/cold areas

### Tutorial Game Modes (Progressive Skill Building)
Each mode teaches specific fishing techniques and game dynamics:

1. [ ] **Rainbow Smelt Mode (Level 1: Basics)** - Medium depth, night time
   - **Teaches:** Reeling mechanics and feeling the bump when fish strikes
   - **Objective:** Learn fundamental rod control and bite detection

2. [ ] **Yellow Perch Mode (Level 2: Lure Action)** - 30ft depth, daytime
   - **Teaches:** Jiggling the lure with analog sticks
   - **Objective:** Master active lure manipulation to attract fish

3. [ ] **Smallmouth Bass Mode (Level 3: Targeting & Drag)** - 40ft depth, afternoon
   - **Teaches:** Targeting crayfish in rock piles + drag system mechanics
   - **Objective:** Learn to fish structure and manage line tension

4. [ ] **Northern Pike Mode (Level 4: Ambush Tactics)** - 25ft depth, afternoon
   - **Teaches:** Spotting pike waiting in grass, exploiting ambush behavior
   - **Objective:** Learn predator patterns and strategic lure placement

5. [ ] **Lake Trout Mode (Level 5: Advanced Techniques)** - 80ft depth, sunset
   - **Teaches:** Bottom pounding technique + baitcaster reel type + WOLF PACK flurry dynamic
   - **Objective:** Master deep water fishing and handling multiple strikes

6. [ ] **Brook Trout Mode (Secret/Bonus Level)** - 15ft depth, morning
   - **Teaches:** TBD (marketing opportunity - beautiful patterns attract fishermen)
   - **Objective:** Unlock reward for skilled players, showcase stunning visuals
   - **Note:** Secret level for marketing appeal - brook trout patterns are gorgeous

### Lure System
- [ ] **Jig lure type** - Vertical jigging action
- [ ] **Spoon lure type** - Wobbling/fluttering action
- [ ] **Rattle lure type** - Sound-based attraction
- [ ] **VTJ lure type** - Vermont Tackle Jig (premium lure)
- [ ] **Lure-specific behaviors** - Different movement patterns and predator attraction rates

### Fish Tagging System
- [ ] **Tagged property for predator fish** - Boolean flag for tagged status
- [ ] **Tag visual indicator** - Show tag on tagged fish sprites
- [ ] **Rarity system** - Make tagged fish uncommon encounters (5-10% spawn rate)
- [ ] **Tag information** - Display tag number, date, location when caught
- [ ] **Conservation context** - Tags placed by fish and wildlife conservation workers

### Bottom Substrate & Environmental Interaction
- [ ] **Bottom type property** - hard_rock, sandy_bottom, silty_bottom
- [ ] **"Pounding the bottom" mechanic** - Player action for sandy/silty bottoms
- [ ] **Sediment stirring effect** - Stirs up sand, mud, and debris
- [ ] **Zooplankton uncovering** - Pounding reveals hidden zooplankton
- [ ] **Baitfish attraction** - Stirred sediment attracts baitfish to feed
- [ ] **Predator response** - Predators follow baitfish or get scared if overdone
- [ ] **Water muddying effect** - Visual feedback for sediment in water column
- [ ] **Shader effects** - Fog/particle effects for muddy water
- [ ] **Overdoing penalty** - Too much pounding scares fish away temporarily

---

## Notes
- Created: November 6, 2025 at 3:29 AM
- All bugs discovered after fixing frameAge/predator rendering issue
- Future features added for post-refactor roadmap
