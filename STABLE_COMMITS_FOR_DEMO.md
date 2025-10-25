# Stable Commits for Demo Deployment

**Urgency**: Demo this afternoon
**Date**: 2025-10-25

## RECOMMENDED: Commit 8ddaac1 ✅

**Full Hash**: `8ddaac1016d9c928b1fbbf87ac37fa75e6788502`
**Branch**: `claude/expand-game-map-011CUTKz4PNoWrVyzi5jFozL`
**Message**: "Fix fish spawning and add solid lake bottom"
**Date**: Sat Oct 25 06:19:59 2025

### Why This Commit?
- ✅ **Fish spawn correctly** (200-400 units from player)
- ✅ **Solid lake bottom** (brown sediment rendering)
- ✅ **Lure uses actual depth** (from previous commit 597da34)
- ✅ **Clean UI** (from previous commits)
- ✅ **Before problematic "fish depth calculation" commit** (240c7d9)

### What Works
1. Fish spawning at correct positions
2. Lake bottom renders properly (solid brown, not broken)
3. Lure stops at actual bathymetric depth
4. UI is clean and uncluttered
5. Boat/kayak rendering on water surface
6. Navigation map with full Lake Champlain

### Deploy This Commit
```bash
git checkout 8ddaac1
npm run build
# Deploy to GitHub Pages
```

---

## Alternative: Commit 597da34

**Full Hash**: `597da34f94892ee2332f57ac5c70341100aa44bd`
**Message**: "Clean up UI and fix critical gameplay issues"
**Date**: Sat Oct 25 05:41:14 2025

### Why This Commit?
- ✅ **Lure depth fix** (uses actual bathymetric data)
- ✅ **Dynamic depth scaling**
- ✅ **Clean UI** (removed dev boxes)
- ✅ **Boats render on water surface**

### Potential Issues
- ⚠️ Fish spawning might have position issue (fixed in next commit 8ddaac1)
- ⚠️ Lake bottom might be transparent (fixed in next commit 8ddaac1)

### Deploy This Commit
```bash
git checkout 597da34
npm run build
# Deploy to GitHub Pages
```

---

## What to Avoid

### ❌ Commit 240c7d9 - "Fix fish depth calculation using correct coordinate system"
- This is AFTER the stable commits
- May have introduced current issues
- Has complex coordinate transformations

### ❌ Commit b7e724f - Latest fixes (current branch HEAD)
- User reports "problem is still there"
- Issues not resolved despite fixes
- Needs more debugging

---

## Quick Deployment Steps

### Option 1: Use Commit 8ddaac1 (RECOMMENDED)

```bash
# 1. Checkout the stable commit
git checkout 8ddaac1

# 2. Verify it works locally
npm run dev
# Test: fish spawning, depth, terrain

# 3. If good, create deployment branch
git checkout -b deploy-for-demo-2025-10-25
git push origin deploy-for-demo-2025-10-25

# 4. Deploy to GitHub Pages
# (Use your deployment script or GitHub Actions)
```

### Option 2: Use Latest Main/Master

```bash
# Check if main branch exists and what commit it's on
git checkout main  # or master
git log -1

# If main is at a good commit, deploy that
# Otherwise, create a branch from 8ddaac1
```

---

## Testing Checklist (2 minutes)

Before deploying, quickly test:

1. **Launch game** ✓
2. **Select Kayak mode** ✓
3. **Navigate on map** ✓
4. **Press X to start fishing** ✓
5. **Check fish spawn** ✓
6. **Drop lure to bottom** ✓
7. **Verify no broken terrain** ✓

If all pass → Deploy!

---

## After Demo: Resume Debugging

Once demo is done, we can resume fixing the depth issues using `FIX_MAP_TERRAIN.md` as a guide.

Current debugging branch: `claude/expand-game-map-fixes-011CUTSYCdp7WykMo7f9UBeH`
Commit with attempted fixes: `b7e724f`

---

## Commit Timeline

```
3643c17 - Expand navigation map (STABLE BASE)
   ↓
597da34 - Clean up UI and fix gameplay (STABLE)
   ↓
8ddaac1 - Fix fish spawning and lake bottom (RECOMMENDED ✅)
   ↓
240c7d9 - Fix fish depth calculation (POSSIBLY PROBLEMATIC)
   ↓
b7e724f - Latest fixes (ISSUES REMAIN)
```

---

## Emergency Fallback

If both recommended commits have issues:

**Commit 3643c17** - "Expand navigation map to cover full Lake Champlain"
```bash
git checkout 3643c17
```

This is the base of the expanded map PR #14, should be very stable.

---

**Decision**: Use commit **8ddaac1** for demo deployment.
