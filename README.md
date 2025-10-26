# Wolfpack

![Wolf Pack SNES Box Art]([image_url](https://github.com/dirtybirdnj/wolfpack/blob/main/samples/snes-wolfpack.jpg?raw=true) "Wolfpack SNES box art")

A Lake Champlain ice fishing simulator that mimics the sonar/fish finder view, built with Phaser 3. Hunt for lake trout in packs across the deep, cold waters of Lake Champlain.

## 🎣 About

Experience ice fishing on Lake Champlain through the lens of a fish finder display. Target lake trout in the deep waters between Vermont's Green Mountains and New York's Adirondacks.

## 🚀 Quick Start

1. **Install Node.js LTS** (v20 or higher)
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the game:**
   ```bash
   npm start
   ```
4. **Open your browser to:** `http://localhost:8080`

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

- Watch the sonar display scroll from right to left
- Lake trout appear as yellow/orange marks on the display
- Drop your lure to the right depth
- Vary your retrieve speed to entice strikes
- Fish will chase if you're at the right depth with the right action
- Land as many lake trout as you can!

## 📁 Project Structure

```
wolfpack/
├── index.html           # Main HTML file
├── package.json         # Node.js dependencies
├── README.md           # This file
└── src/
    ├── index.js        # Game initialization
    ├── config/
    │   └── GameConfig.js    # Game constants and settings
    ├── scenes/
    │   ├── BootScene.js     # Asset loading
    │   ├── GameScene.js     # Main game logic
    │   └── UIScene.js       # HUD and interface
    ├── entities/
    │   ├── Lure.js          # Player lure logic
    │   ├── Fish.js          # Fish entity and behavior
    │   └── FishAI.js        # Fish decision making
    └── utils/
        ├── SonarDisplay.js  # Sonar rendering logic
        └── Constants.js      # Game constants
```

## 🏔️ Setting

Set in the deep, cold waters of Lake Champlain - the sixth largest freshwater lake in the United States. Fish for trophy lake trout (togue) in waters that stretch between Vermont's Green Mountains and New York's Adirondack peaks, with views north to Quebec's Eastern Townships.

## 🛠️ Technical Details

- Built with Phaser 3.80.1
- ES6+ JavaScript modules
- Runs on Node.js LTS (v20+)
- Canvas-based rendering
- No build step required - runs directly in browser

## 📝 License

MIT License - Feel free to modify and share!
