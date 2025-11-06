![Wolf Pack ](https://github.com/dirtybirdnj/wolfpack/blob/main/samples/screenshots/pr7-snes-wolfpack-artwork.jpg?raw=true)

A Lake Champlain ice fishing simulator recreates the experience of vertical jigging, built with Phaser 3.

Hunt for Lake Trout Wolfpacks across the deep, cold waters of Lake Champlain.

Observe the ambush behavior of Northern Pike, wait for them to stalk prey and drop your lure to trigger a strike!
Smallmouth Bass and Yellow Perch are in the mix too, see if you can figure out what makes them strike!

## 🚀 Development Quick Start

1. **Install Node.js LTS** (v20 or higher)
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the game:**
   ```bash
   npm run dev
   ```
   This starts the game server on port 8080.

4. **Open your browser to:** `http://localhost:8080`

📖 **See [QUICK_START.md](QUICK_START.md) for detailed setup instructions and troubleshooting.**

## 🌐 Deployment

This game is automatically deployed to GitHub Pages whenever changes are pushed to the main branch.

**Play online:** The latest version is available at your GitHub Pages URL (once enabled in repository settings)

### Setting Up GitHub Pages (One-Time Setup)

1. Go to your repository settings on GitHub
2. Navigate to **Settings > Pages**
3. Under "Build and deployment":
   - **Source:** Select "GitHub Actions"
4. The workflow will automatically deploy on the next push to main

No build step is required - the game runs directly from static files!

## 🎮 Controls

- **SPACE** or **DOWN ARROW**: Drop the lure (let it fall)
- **UP ARROW**: Retrieve the lure (hold for continuous retrieval)
- **LEFT/RIGHT ARROWS**: Adjust retrieve speed
- **R**: Reset lure to surface

## 🐟 Gameplay

- Drop your lure to the right depth
- Vary your retrieve speed to entice strikes
- Fish will chase if you're at the right depth with the right action
- Land as many fish as you can!

## 📁 Project Structure

**⚠️ Updated Nov 2025** - Major refactor to unified organism architecture

```
wolfpack/
├── index.html           # Main HTML file
├── package.json         # Node.js dependencies
└── src/
    ├── index.js         # Game initialization
    ├── config/
    │   ├── GameConfig.js    # Game constants and settings
    │   └── OrganismData.js  # All organism definitions (NEW)
    ├── sprites/         # NEW unified architecture
    │   ├── OrganismSprite.js    # Base class for all organisms
    │   ├── FishSprite.js        # Unified fish (bait + predators)
    │   ├── CrayfishSprite.js    # Crayfish organisms
    │   └── ZooplanktonSprite.js # Zooplankton organisms
    ├── scenes/
    │   ├── BootScene.js     # Boot screen with texture generation
    │   ├── GameScene.js     # Main game logic
    │   └── systems/         # Scene systems
    │       └── SpawningSystem.js # Population management
    ├── entities/
    │   ├── Lure.js          # Player lure logic
    │   ├── FishAI.js        # Predator hunting AI
    │   └── FishFight.js     # Fight mechanics
    ├── systems/
    │   ├── SchoolManager.js     # Emergent schooling behavior
    │   └── FoodChainSystem.js   # Predator-prey interactions
    └── utils/
        ├── SpriteGenerator.js   # Procedural texture generation
        └── Constants.js         # Game constants
```

See `docs/FILE_MAP.md` for detailed file navigation.

## 🏔️ Setting

Set in the deep, cold waters of Lake Champlain - the sixth largest freshwater lake in the United States. Fish for trophy lake trout (togue) in waters that stretch between Vermont's Green Mountains and New York's Adirondack peaks, with views north to Quebec's Eastern Townships.

## 🛠️ Technical Details

- Built with Phaser 3.80.1
- ES6+ JavaScript modules
- Runs on Node.js LTS (v20+)
- Canvas-based rendering
- No build step required - runs directly in browser

## 🐠 Species Development

### Currently Implemented
- Lake Trout (*Salvelinus namaycush*) - Deep cold water apex predator
- Northern Pike (*Esox lucius*) - Shallow water ambush predator
- Smallmouth Bass (*Micropterus dolomieu*) - Rocky structure specialist
- Yellow Perch (*Perca flavescens*) - Abundant beginner species

### Species Waitlist
Future species under consideration for implementation:
- **Chain Pickerel** (*Esox niger*) - Smaller, more aggressive pike relative
- **Bowfin** (*Amia calva*) - Living fossil with fierce "death roll" fight mechanic
- **Longnose Gar** (*Lepisosteus osseus*) - Prehistoric appearance, unique low hook-rate challenge
- **Muskellunge** (*Esox masquinongy*) - Legendary "fish of 10,000 casts" endgame species

See `docs/NEW_SPECIES_TRACKING.md` for detailed species research and implementation plans.

## 📝 License

MIT License - Feel free to modify and share!
