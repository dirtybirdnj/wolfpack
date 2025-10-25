# Fish Artwork Assets

This directory contains fish artwork assets used in the game.

## Directory Structure

```
assets/
└── fish/
    ├── lake_trout/
    ├── northern_pike/
    ├── smallmouth_bass/
    └── yellow_perch/
```

## How to Add Fish Artwork

To add custom fish artwork for a species:

1. Create your artwork as PNG or SVG files
2. Place them in the appropriate species directory:
   - `assets/fish/lake_trout/` - Lake trout artwork
   - `assets/fish/northern_pike/` - Northern pike artwork
   - `assets/fish/smallmouth_bass/` - Smallmouth bass artwork
   - `assets/fish/yellow_perch/` - Yellow perch artwork

3. Name your files using this convention:
   - `{species}_small.png` or `{species}_small.svg` - For small size fish
   - `{species}_medium.png` or `{species}_medium.svg` - For medium size fish
   - `{species}_large.png` or `{species}_large.svg` - For large size fish
   - `{species}_trophy.png` or `{species}_trophy.svg` - For trophy size fish
   - `{species}.png` or `{species}.svg` - Default (used for all sizes if specific size not found)

## Examples

```
assets/fish/lake_trout/lake_trout.png          - Default lake trout
assets/fish/lake_trout/lake_trout_trophy.png   - Trophy lake trout
assets/fish/northern_pike/northern_pike.svg    - Default northern pike
```

## Fallback Behavior

If no artwork file is found for a species, the game will use the built-in procedural rendering (drawn shapes). This ensures the game always works even without custom artwork.

## Artwork Guidelines

- **Format**: PNG (raster) or SVG (vector) recommended
- **Orientation**: Fish should face RIGHT (swimming direction)
- **Background**: Transparent background
- **Aspect Ratio**: Approximately 3:1 (length:height) for realistic proportions
- **Size**:
  - PNG: 300-600px width recommended
  - SVG: Any size (will scale automatically)
- **Style**: Realistic or stylized, matching the game's aesthetic

## Loading Priority

The game checks for artwork in this order:
1. Size-specific file (e.g., `lake_trout_trophy.png`)
2. Species default file (e.g., `lake_trout.png`)
3. SVG version (if PNG not found)
4. Procedural rendering (fallback)
