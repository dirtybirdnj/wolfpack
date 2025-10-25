# Lake Champlain Species Reference

Quick reference guide for real Lake Champlain fish species to help inform game development.

## Currently Implemented Species ✅

### Predator Species (4 implemented)

1. **Lake Trout** (Salvelinus namaycush) ✅
   - Native coldwater apex predator
   - Real weight: 2-40 lbs (record: 41.5 lbs in Champlain)
   - Real depth: 15-120 ft (deeper in summer)
   - Status: Implemented as main gamefish

2. **Northern Pike** (Esox lucius) ✅
   - Aggressive shallow-water ambush predator
   - Real weight: 3-35 lbs (record: 31 lbs in Champlain)
   - Real depth: 5-30 ft (weedy areas, structure)
   - Status: Implemented with ambush AI

3. **Smallmouth Bass** (Micropterus dolomieu) ✅
   - Popular sportfish, rocky structure specialist
   - Real weight: 1-8 lbs (record: 8 lbs in Champlain)
   - Real depth: 10-40 ft (shallower in spring)
   - Status: Implemented with circling behavior

4. **Yellow Perch** (Perca flavescens) - Large specimens ✅
   - Abundant panfish, beginner-friendly
   - Real weight: 0.3-3 lbs (record: 3.5 lbs in Champlain)
   - Real depth: 5-25 ft
   - Status: Implemented as beginner species

### Baitfish Species (5 implemented)

1. **Alewife** (Alosa pseudoharengus) ✅
2. **Rainbow Smelt** (Osmerus mordax) ✅
3. **Yellow Perch** (juvenile) ✅
4. **Sculpin** (Cottus species) ✅
5. **Cisco/Lake Herring** (Coregonus artedi) ✅

## Species to Add Next

### Tier 1 Priority - Easy Implementation

Species that fit existing behavior patterns and fill gameplay niches:

#### 1. **Chain Pickerel** (Esox niger)
**Why add**: Smaller pike relative, uses existing ambush AI
- **Weight**: 0.5-4 lbs (much smaller than pike)
- **Depth**: 5-20 ft (shallow weedy areas)
- **Behavior**: Ambush (reuse pike AI with smaller strike zone)
- **Difficulty**: Easy-Medium
- **Spawn Rate**: 15-20% (common in Champlain)
- **Unique Feature**: Smaller, more aggressive strikes than pike
- **Implementation**: Reuse pike ambush code, adjust size/speed
- **Visual**: Chain-like pattern on sides, greenish body

#### 2. **Rock Bass** (Ambloplites rupestris)
**Why add**: Another beginner panfish, very common
- **Weight**: 0.2-2 lbs
- **Depth**: 5-30 ft (rocky areas)
- **Behavior**: Opportunistic (like yellow perch)
- **Difficulty**: Easy
- **Spawn Rate**: 20-30% (very common)
- **Unique Feature**: Schools near rocky structure
- **Implementation**: Similar to yellow perch, slightly deeper
- **Visual**: Dark olive with red eyes, stocky body

#### 3. **White Perch** (Morone americana)
**Why add**: School fish, invasive but common
- **Weight**: 0.3-2 lbs
- **Depth**: 10-40 ft (open water schools)
- **Behavior**: Opportunistic schooling
- **Difficulty**: Easy
- **Spawn Rate**: 15-20%
- **Unique Feature**: Travel in large schools
- **Implementation**: Like yellow perch, mid-depth
- **Visual**: Silver-white body, darker back

### Tier 2 Priority - Moderate Implementation

Species requiring new AI behaviors or mechanics:

#### 4. **Walleye** (Sander vitreus)
**Why add**: Popular sportfish, unique low-light hunting
- **Weight**: 2-15 lbs
- **Depth**: 15-50 ft (mid-depth structure)
- **Behavior**: NEW - Pack hunting, light-sensitive
- **Difficulty**: Medium
- **Spawn Rate**: 10-15%
- **Unique Feature**: More active at dawn/dusk/night
- **Implementation**: New time-of-day preference system
- **Visual**: Golden-olive with white-tipped tail, large eyes
- **AI Challenge**: Need time-based activity modifier

#### 5. **Atlantic Salmon** (Salmo salar) - Landlocked
**Why add**: Premium sportfish, strong fighter
- **Weight**: 3-20 lbs
- **Depth**: 20-100 ft (coldwater)
- **Behavior**: Active pursuit (like lake trout but faster)
- **Difficulty**: Hard
- **Spawn Rate**: 5-10% (stocked, less common)
- **Unique Feature**: Acrobatic jumps (could add jump mechanic)
- **Implementation**: Enhanced pursuit AI, stronger fight
- **Visual**: Silver with black spots, forked tail

#### 6. **Burbot** (Lota lota)
**Why add**: Only freshwater cod, unique nocturnal behavior
- **Weight**: 2-15 lbs
- **Depth**: 40-120 ft (bottom-dwelling)
- **Behavior**: NEW - Nocturnal bottom hunter
- **Difficulty**: Medium-Hard
- **Spawn Rate**: 5-8% (night only)
- **Unique Feature**: Only active at night, winter spawner
- **Implementation**: Night-only spawning, slow movement
- **Visual**: Mottled brown, barbel on chin, eel-like tail
- **AI Challenge**: Bottom-hugging behavior, night-only

### Tier 3 Priority - Advanced Implementation

Species requiring significant new features:

#### 7. **Muskellunge** (Esox masquinongensis)
**Why add**: Ultimate trophy species, "fish of 10,000 casts"
- **Weight**: 10-50+ lbs (record: 50+ lbs in Champlain)
- **Depth**: 10-50 ft (structure)
- **Behavior**: Ultra-rare ambush (like pike but HUGE)
- **Difficulty**: Very Hard
- **Spawn Rate**: 1-3% (very rare)
- **Unique Feature**: Extremely rare, massive size, hard to hook
- **Implementation**: Enhanced pike AI, much lower strike chance
- **Visual**: Tiger stripes or barred pattern, huge size
- **AI Challenge**: "Following" behavior without striking

#### 8. **Brown Trout** (Salmo trutta)
**Why add**: Wary predator, challenging for advanced players
- **Weight**: 2-20 lbs
- **Depth**: 20-80 ft (coldwater, structure)
- **Behavior**: NEW - Highly selective, cautious
- **Difficulty**: Hard
- **Spawn Rate**: 5-8%
- **Unique Feature**: Inspects lure carefully, easily spooked
- **Implementation**: New "caution" mechanic, lure selection matters
- **Visual**: Golden-brown with red/black spots
- **AI Challenge**: Lure-type preferences, spook mechanic

## Species Biology Reference

### Depth Preferences by Season

**Spring (Cold Water)**
- Shallow: Pike, Bass, Perch, Pickerel (5-30 ft)
- Mid: Walleye, Salmon (20-50 ft)
- Deep: Lake Trout (30-80 ft)

**Summer (Warm Water)**
- Shallow: Pickerel, Rock Bass, White Perch (5-25 ft)
- Mid: Pike, Bass, Walleye (15-50 ft)
- Deep: Lake Trout, Salmon, Burbot (60-120 ft)

**Fall (Cooling Water)**
- All species more active, wider depth ranges
- Lake Trout move shallower (15-60 ft)
- Pike very aggressive (8-35 ft)

**Winter (Ice Fishing)**
- Most species go deep (40-120 ft)
- Perch relatively shallow (15-40 ft)
- Burbot most active (spawning season)

### Size Classifications

**Panfish** (< 3 lbs)
- Yellow Perch, Rock Bass, White Perch, small Bass

**Medium Gamefish** (3-10 lbs)
- Smallmouth Bass, Walleye, Chain Pickerel, Brown Trout

**Large Gamefish** (10-25 lbs)
- Northern Pike, Lake Trout, Atlantic Salmon

**Trophy Fish** (25+ lbs)
- Large Lake Trout, Large Pike, Muskellunge

### Aggressiveness Scale

**Very Aggressive** (strike readily)
- Yellow Perch, Rock Bass, White Perch, Chain Pickerel

**Moderately Aggressive** (selective but willing)
- Smallmouth Bass, Northern Pike, Walleye

**Selective** (picky about conditions)
- Lake Trout, Atlantic Salmon

**Very Selective** (difficult to entice)
- Brown Trout, Muskellunge

### Fight Characteristics

**Weak Fighters** (easy to land)
- Yellow Perch, White Perch, Rock Bass

**Moderate Fighters** (some resistance)
- Chain Pickerel, Walleye, Burbot

**Strong Fighters** (challenging)
- Smallmouth Bass, Brown Trout, Northern Pike

**Powerful Fighters** (very challenging)
- Lake Trout, Atlantic Salmon, Muskellunge

## Real Lake Champlain Data

### Most Common Species (by abundance)
1. Yellow Perch - Extremely abundant
2. White Perch - Very common (invasive)
3. Rock Bass - Very common
4. Smallmouth Bass - Common
5. Alewife - Common (invasive baitfish)

### Premier Sportfish (by popularity)
1. Lake Trout - Main coldwater target
2. Smallmouth Bass - Main warmwater target
3. Northern Pike - Popular spring/fall target
4. Walleye - Growing in popularity
5. Atlantic Salmon - Premium stocked species

### Rare/Trophy Species
1. Muskellunge - Very rare, ultimate trophy
2. Large Lake Trout (20+ lbs) - Rare trophy
3. Large Northern Pike (25+ lbs) - Rare trophy
4. Burbot - Uncommon, night fishing specialty

## Implementation Strategy

### Recommended Addition Order

**Phase 1: Fill Beginner Niches**
1. Rock Bass (easy panfish for shallow water)
2. White Perch (easy schooling fish)
3. Chain Pickerel (easy small predator)

**Phase 2: Add Variety**
4. Walleye (new hunting mechanic)
5. Atlantic Salmon (premium fighter)

**Phase 3: Add Challenge**
6. Brown Trout (selective feeder)
7. Burbot (nocturnal specialist)

**Phase 4: Trophy Species**
8. Muskellunge (ultimate rare trophy)

### Gameplay Balance Goals

**Beginner Species** (50-60% combined spawn)
- Yellow Perch, Rock Bass, White Perch, Chain Pickerel
- Easy to find, easy to catch, teaches mechanics

**Intermediate Species** (30-40% combined)
- Smallmouth Bass, Northern Pike, Walleye, Lake Trout
- Moderate challenge, main gameplay

**Advanced Species** (10-20% combined)
- Atlantic Salmon, Brown Trout, Burbot
- Skilled players, special conditions

**Trophy Species** (1-5% combined)
- Muskellunge, Trophy-sized Lake Trout/Pike
- Rare, memorable encounters

## Additional Notes

### Invasive Species in Champlain
- Alewife (baitfish) - Major prey base
- White Perch - Compete with native species
- Sea Lamprey - Parasite (could be underwater hazard?)

### Conservation Considerations
- Lake Trout are native and protected
- Atlantic Salmon are stocked, catch-and-release encouraged
- Some species have size/bag limits (not modeled in game)

### Seasonal Patterns
- **Spring**: Shallow spawning activity, aggressive feeding
- **Summer**: Depth stratification, early morning/evening feeding
- **Fall**: Pre-winter feeding frenzy, wider depth distribution
- **Winter**: Deep water concentration, slower metabolism

---

**Data Sources**: Vermont Fish & Wildlife, NY DEC, Lake Champlain Basin Program
**Last Updated**: Based on current game implementation (4 species)
