# Loading Fish Artwork in the Game

This guide explains how to add the preload functionality to load your custom fish artwork.

## Quick Start

To enable fish artwork loading, add a preload method to your main game scene (e.g., `src/index.js` or a dedicated preload scene).

## Implementation Example

### Option 1: Add to index.js (Simple)

Add this code to your main game configuration in `src/index.js`:

```javascript
// In your boot scene or main game config
class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Load fish artwork for each species
        this.loadFishArtwork('lake_trout');
        this.loadFishArtwork('northern_pike');
        this.loadFishArtwork('smallmouth_bass');
        this.loadFishArtwork('yellow_perch');
    }

    loadFishArtwork(species) {
        const sizes = ['small', 'medium', 'large', 'trophy'];
        const basePath = `assets/fish/${species}/`;

        // Try to load size-specific artwork
        sizes.forEach(size => {
            const key = `fish_${species}_${size}`;
            const pngPath = `${basePath}${species}_${size}.png`;
            const svgPath = `${basePath}${species}_${size}.svg`;

            // Try PNG first, then SVG
            this.load.image(key, pngPath);
            this.load.svg(key + '_svg', svgPath);
        });

        // Load default species artwork
        const defaultKey = `fish_${species}`;
        this.load.image(defaultKey, `${basePath}${species}.png`);
        this.load.svg(defaultKey + '_svg', `${basePath}${species}.svg`);
    }

    create() {
        // Start your game scene
        this.scene.start('MenuScene');
    }
}
```

### Option 2: Add to Existing GameScene

If you already have a GameScene, add a preload method:

```javascript
// In src/scenes/GameScene.js

export class GameScene extends Phaser.Scene {
    preload() {
        // Load fish artwork
        const species = ['lake_trout', 'northern_pike', 'smallmouth_bass', 'yellow_perch'];
        const sizes = ['small', 'medium', 'large', 'trophy'];

        species.forEach(sp => {
            sizes.forEach(size => {
                const key = `fish_${sp}_${size}`;
                this.load.image(key, `assets/fish/${sp}/${sp}_${size}.png`);
            });
            // Load default
            this.load.image(`fish_${sp}`, `assets/fish/${sp}/${sp}.png`);
        });
    }

    // ... rest of your GameScene code
}
```

## How It Works

1. **Texture Loading**: The preload method loads PNG/SVG files from the assets directory
2. **Texture Keys**: Each file is loaded with a key like `fish_lake_trout_trophy`
3. **Automatic Detection**: The Fish class automatically checks for these texture keys
4. **Fallback**: If no texture is found, the fish renders using the procedural drawing system

## Texture Key Format

The Fish class looks for textures with these naming patterns:

- Size-specific: `fish_{species}_{size}` (e.g., `fish_lake_trout_trophy`)
- Species default: `fish_{species}` (e.g., `fish_lake_trout`)

Where:
- `{species}` = `lake_trout`, `northern_pike`, `smallmouth_bass`, or `yellow_perch`
- `{size}` = `small`, `medium`, `large`, or `trophy`

## File Paths Expected

```
assets/fish/lake_trout/lake_trout.png           -> fish_lake_trout
assets/fish/lake_trout/lake_trout_small.png     -> fish_lake_trout_small
assets/fish/lake_trout/lake_trout_medium.png    -> fish_lake_trout_medium
assets/fish/lake_trout/lake_trout_large.png     -> fish_lake_trout_large
assets/fish/lake_trout/lake_trout_trophy.png    -> fish_lake_trout_trophy
```

## Testing

To test if your artwork is loading:

1. Add PNG files to the appropriate directories (e.g., `assets/fish/lake_trout/lake_trout.png`)
2. Add the preload code to your scene
3. Run the game
4. Check the console for messages like: `✓ Loaded artwork for lake_trout (medium): fish_lake_trout`

## Troubleshooting

**Problem**: Fish artwork not showing up
- Check that the preload method is being called
- Verify file paths match the expected structure
- Check browser console for 404 errors on asset files
- Ensure texture keys match the format: `fish_{species}_{size}`

**Problem**: Files are 404ing
- Make sure files are in the correct directory structure
- Verify file names match exactly (case-sensitive)
- Check that your web server is serving files from the assets directory

## Next Steps

Once you've added the preload code:

1. Add your fish artwork files to the `assets/fish/` directories
2. Restart your game/refresh the browser
3. Fish with available artwork will automatically use the images
4. Fish without artwork will continue using the procedural rendering
