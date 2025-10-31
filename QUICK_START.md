# Quick Start Guide

## First Time Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

## Running the Game

**Simple - Just run one command:**
```bash
npm run dev
```

This starts the game server on http://localhost:8080

## Using the Screenshot Feature

1. Open http://localhost:8080
2. Click the camera icon (📷) in the top navigation
3. Fill in title and description (optional)
4. Choose one of the following:
   - **Download PNG**: Saves the screenshot as a PNG file to your computer
   - **Copy Issue Markdown**: Copies formatted markdown to your clipboard
5. To create a GitHub issue:
   - Download the screenshot
   - Copy the markdown using "Copy Issue Markdown"
   - Go to GitHub and create a new issue
   - Paste the markdown and attach the screenshot file

## Other Commands

```bash
npm test              # Run tests
npm run lint          # Check code style
npm run build         # Build for production
npm run electron      # Run as Electron app
npm run kill-ports    # Kill processes on port 8080
```

## Troubleshooting

**"EADDRINUSE: address already in use" or Port Conflict**
- Another process is using port 8080
- Run `npm run kill-ports` to kill any processes using port 8080
- Or manually find and kill the process: `lsof -ti:8080 | xargs kill`

**Screenshot feature not working**
- Make sure you're using a modern browser (Chrome, Firefox, Edge, Safari)
- Check browser console for errors (F12 → Console tab)
- If "Copy Issue Markdown" doesn't work, your browser may not support clipboard API

## Learn More

- 🎫 Ticket Generator: `scripts/README.md`
- 📚 Full Documentation: `docs/` folder
