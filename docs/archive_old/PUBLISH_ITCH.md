# Publishing Wolfpack to itch.io

This guide will walk you through publishing your Phaser 3 fishing game "Wolfpack" to itch.io.

## Prerequisites

- itch.io account (free) - [Sign up here](https://itch.io/register)
- Your game built and ready in the `dist/` folder
- About 10-15 minutes

## Step 1: Build Your Game

First, create a production build of your game:

```bash
npm run build
```

This will:
- Create a `dist/` folder with all necessary files
- Copy your game source, assets, and HTML
- Generate build metadata
- Create a distribution README

**Verify the build:**
```bash
npm run preview
```

This opens a local server at http://localhost:8081 - test your game to make sure everything works!

## Step 2: Create a ZIP Archive

itch.io requires your game to be uploaded as a ZIP file.

### On macOS/Linux:
```bash
cd dist
zip -r ../wolfpack-v1.0.0.zip .
cd ..
```

### On Windows (PowerShell):
```powershell
Compress-Archive -Path dist\* -DestinationPath wolfpack-v1.0.0.zip
```

### Or use your file manager:
1. Open the `dist/` folder
2. Select all files inside (not the dist folder itself!)
3. Right-click → "Compress" or "Send to ZIP"
4. Name it `wolfpack-v1.0.0.zip`

**Important:** The ZIP should contain the files directly, NOT wrapped in a folder. When you open the ZIP, you should see `index.html` immediately, not a folder containing it.

## Step 3: Create Your itch.io Game Page

1. Go to [itch.io/game/new](https://itch.io/game/new)
2. Fill in the basic information:

### Basic Info

**Title:** `Wolfpack`

**Project URL:** Choose something like `yourname.itch.io/wolfpack`

**Short description / Tagline:**
```
Lake Champlain ice fishing sonar simulator. Drop your lure, track fish on sonar, and land the big one!
```

**Classification:** Game

**Kind of project:** HTML

## Step 4: Upload Your Game

### Uploads Section

1. Click "Upload files"
2. Select your `wolfpack-v1.0.0.zip` file
3. Wait for upload to complete
4. **Check the box:** "This file will be played in the browser"
5. Set the embed options:
   - **Viewport dimensions:**
     - Width: `800` (or your game width)
     - Height: `600` (or your game height)
   - **Embed options:**
     - ✅ Automatically start on page load for me
     - ✅ Mobile friendly
     - ✅ Enable scrollbars
     - ✅ Enable fullscreen button

## Step 5: Game Details

### Description

Write a compelling description. Here's a template:

```markdown
# 🎣 Wolfpack - Lake Champlain Fishing Simulator

Drop your line through the ice and use your sonar to track fish in the depths of Lake Champlain!

## Features
- 🐟 Realistic sonar display showing fish movement
- 🎮 Full gamepad support (PS4, Xbox, 8BitDo)
- ❄️ Authentic ice fishing simulation
- 🏔️ Based on real Lake Champlain between Vermont's Green Mountains and New York's Adirondacks

## Controls
- **Keyboard:** Arrow keys to move lure, Space to drop, R to reset
- **Gamepad:** Full controller support

## Target Species
- Lake Trout (Salvelinus namaycush)
- [Add other species from your game]

Built with Phaser 3. Made in Vermont 🍁
```

### Genre / Tags

Add relevant tags to help people find your game:
- `fishing`
- `simulation`
- `arcade`
- `phaser`
- `html5`
- `sonar`
- `ice-fishing`
- `vermont`
- `casual`
- `gamepad-support`

### Category

- **Engine:** Phaser
- **Made with:** Phaser 3

### Release Status

Choose based on your development stage:
- **In development** - If you're still actively working on it
- **Released** - If it's feature-complete
- **Prototype** - If it's an early version

## Step 6: Pricing & Access

### Pricing

For your first release, I recommend:

**Option A - Free (Recommended for launch):**
- Set price to: **Free**
- Optional: Enable "Support this game" donations
- This gets you maximum players and feedback

**Option B - Name Your Own Price:**
- Minimum price: $0 (or set a minimum like $1)
- Suggested price: $3-5
- Allows players to pay what they want

**Option C - Paid:**
- Set a fixed price: $2.99 - $4.99 typical for indie fishing games
- Can offer discount codes

### Access

- **Public** - Anyone can see and play
- **Restricted** - Only certain people can access
- **Draft** - Hidden until you're ready

Start with **Draft** to preview, then switch to **Public** when ready.

## Step 7: Community Settings

### Comments
- ✅ Enable comments
- Consider enabling comment ratings

### Discussion Board
- ✅ Enable discussion board (good for feedback and community)

## Step 8: Metadata & SEO

### Cover Image

Create a 630x500px cover image showing:
- Your sonar display
- Game title "Wolfpack"
- A nice screenshot of gameplay

You can create this with:
- Photoshop / GIMP
- Canva (free templates)
- Take a screenshot and add text

### Screenshots

Add 3-5 gameplay screenshots showing:
- Sonar display with fish
- Different game states
- Control instructions
- Any special features

### Trailer (Optional)

Not required for initial launch, but a 30-60 second video helps conversions.

## Step 9: Preview & Publish

1. Click **"Save & view page"** at the bottom
2. You'll see a preview of your game page
3. Test the game thoroughly in the browser embed
4. Check all links and descriptions
5. When ready, change from **Draft** to **Public**
6. Click **"Save"**

## Step 10: Share Your Game!

Your game is live! The URL will be:
```
https://[your-username].itch.io/wolfpack
```

Share it on:
- Twitter/X with #indiegame #gamedev #fishing #phaser
- Reddit: r/WebGames, r/IndieGaming, r/Fishing
- Discord communities for game devs
- Your friends and family!

## Updating Your Game

When you have updates:

1. Build a new version: `npm run build`
2. Create a new ZIP with a version number: `wolfpack-v1.1.0.zip`
3. Go to your game's edit page on itch.io
4. Upload the new ZIP
5. Click "Save"

itch.io will automatically use the newest file.

## Troubleshooting

### Game doesn't load

**Problem:** Black screen or "Loading..." forever

**Solutions:**
1. Check browser console for errors (F12)
2. Verify your ZIP contains `index.html` at root level
3. Ensure "This file will be played in the browser" is checked
4. Check that Phaser CDN is accessible (https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js)

### Game is cut off / wrong size

**Problem:** Game viewport is too small or too large

**Solutions:**
1. Check your embed dimensions match your game's canvas size
2. In `GameConfig.js`, verify width/height match itch.io embed settings
3. Enable fullscreen button in embed options
4. Test in different browsers

### Controls don't work

**Problem:** Keyboard/gamepad not responding

**Solutions:**
1. Click inside the game frame to give it focus
2. Check browser console for errors
3. Verify input handlers are initialized in your game code
4. Test locally first with `npm run preview`

### Files missing / 404 errors

**Problem:** Assets or scripts not loading

**Solutions:**
1. Check that all paths in `index.html` are relative (not absolute)
2. Verify folder structure is intact in the ZIP
3. Don't use paths starting with `/` - use relative paths like `src/index.js`
4. Make sure `assets/` folder is included in dist/

## Analytics & Insights

itch.io provides free analytics:
- **Views** - How many people saw your page
- **Downloads** - For downloadable versions
- **Plays** - How many times game was launched
- **Browser** - In-browser plays

Check these regularly to see how your game is performing!

## Tips for Success

### 1. Get Feedback Early
- Launch in "In Development" status
- Ask friends to test
- Iterate based on feedback

### 2. Update Regularly
- Weekly updates keep people engaged
- Post devlogs on itch.io
- Announce updates in your game's community

### 3. Engage Your Community
- Respond to comments
- Create a discussion board post for feedback
- Thank people who support your game

### 4. Cross-Promote Later
- After you get traction on itch.io, consider:
  - Steam release (using Electron/NW.js wrapper)
  - Mobile version (using Capacitor)
  - Submission to CrazyGames, Poki for wider reach

## Next Steps After itch.io

Once your game is successful on itch.io:

1. **Gather feedback** and improve the game
2. **Add analytics** to see what players enjoy most
3. **Submit to web game portals** (Poki, CrazyGames) for more traffic
4. **Consider Steam release** if you get strong engagement
5. **Mobile version** if touch controls work well

## Resources

- [itch.io Creator Documentation](https://itch.io/docs/creators/)
- [itch.io Game Design Page Tips](https://itch.io/docs/creators/design)
- [HTML5 Games on itch.io](https://itch.io/docs/creators/html5)

## Support

If you run into issues:
- itch.io support: https://itch.io/support
- itch.io community forums: https://itch.io/community
- Phaser Discord: https://discord.gg/phaser

---

**Good luck with your launch! 🎣🎮**

Remember: Start small, gather feedback, iterate. Many successful Steam games started as free itch.io prototypes!
