# Quick Start Guide

## First Time Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure GitHub credentials** (for screenshot feature):
   ```bash
   cd scripts
   cp .env.example .env
   # Edit .env and add your GitHub token
   ```

## Running the Game

**Simple - Just run one command:**
```bash
npm run dev
```

This automatically starts:
- 🎮 **Game server** on http://localhost:8080
- 🔧 **API server** on http://localhost:3000 (for screenshot feature)

## Individual Commands

If you need to run servers separately:

```bash
npm run game  # Game only (no screenshot feature)
npm run api   # API only
```

## Using the Screenshot Feature

1. Make sure you ran `npm run dev` (not just `npm run game`)
2. Open http://localhost:8080
3. Click the camera icon (📷) in the top navigation
4. Fill in title and description
5. Click "Create GitHub Issue"
6. Your issue will be created automatically!

## Other Commands

```bash
npm test              # Run tests
npm run lint          # Check code style
npm run build         # Build for production
npm run electron      # Run as Electron app
npm run kill-ports    # Kill processes on ports 3000 & 8080
```

## Troubleshooting

**"EADDRINUSE: address already in use" or Port Conflict**
- Check your `scripts/.env` file
- Make sure `API_PORT` is set to **3000**, not 8080
- The game uses port 8080, the API uses port 3000
- If you see `API_PORT=8080` in your .env, change it to `API_PORT=3000`
- Or run `npm run kill-ports` to kill any processes using ports 3000 or 8080

**"API Error: Failed to fetch"**
- You probably ran `npm run game` instead of `npm run dev`
- The screenshot feature needs the API server running
- Solution: Stop the game server and run `npm run dev` instead

**"Missing required environment variables"**
- The API server needs GitHub credentials
- Copy `scripts/.env.example` to `scripts/.env`
- Add your GitHub token (get one at https://github.com/settings/tokens)

## Learn More

- 📸 Screenshot API: `scripts/SCREENSHOT_API.md`
- 🎫 Ticket Generator: `scripts/README.md`
- 📚 Full Documentation: `docs/` folder
