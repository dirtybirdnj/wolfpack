# Screenshot API - GitHub Issue Creation

The screenshot feature now creates GitHub issues automatically via a local API server.

## How It Works

1. **Browser Side**: User clicks camera icon, captures screenshot, fills in title and description
2. **API Server**: Receives the data and creates a GitHub issue using the Octokit API
3. **GitHub**: Issue is created with the screenshot label

## Setup

### 1. Configure Environment Variables

Make sure your `scripts/.env` file is set up (copy from `.env.example` if needed):

```bash
cd scripts
cp .env.example .env
```

Edit `scripts/.env` with your values:
```bash
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=dirtybirdnj
GITHUB_REPO=wolfpack
API_PORT=3000  # Optional, defaults to 3000
```

### 2. Install Dependencies

From the project root:
```bash
npm install
```

This installs:
- `express` - Web framework for the API
- `cors` - Enable cross-origin requests
- `@octokit/rest` - GitHub API client
- `dotenv` - Environment variable management

### 3. Start the Servers

Simply run:
```bash
npm run dev
```

or

```bash
npm start
```

This will automatically start **both** the API server (port 3000) and the game server (port 8080) concurrently.

**Individual Server Commands** (if needed):
```bash
npm run api   # API server only
npm run game  # Game server only
```

## Usage

1. Start both servers: `npm run dev` (starts API + game automatically)
2. Open the game in your browser: http://localhost:8080
3. Click the camera icon (📷) in the top bar
4. Fill in title and description
5. Click "Create GitHub Issue"
6. The issue will be created automatically!

## API Endpoints

### Health Check
```
GET http://localhost:3000/api/health
```
Returns server status and timestamp.

### Create Issue
```
POST http://localhost:3000/api/issues/create
Content-Type: application/json

{
  "title": "Issue title",
  "description": "Issue description",
  "imageData": "data:image/png;base64,...",
  "labels": ["bug", "screenshot"]
}
```

Returns:
```json
{
  "success": true,
  "issue": {
    "number": 42,
    "url": "https://github.com/user/repo/issues/42",
    "title": "Issue title"
  }
}
```

### Get Repository Info
```
GET http://localhost:3000/api/repo/info
```
Returns repository details and open issue count.

## Features

- ✅ Automatic issue creation from screenshots
- ✅ Duplicate detection (checks if title already exists)
- ✅ Automatic labeling with "screenshot" and custom labels
- ✅ Fallback to localStorage if API is unavailable
- ✅ Real-time feedback with clickable issue links
- ✅ Error handling and retry functionality

## Fallback Behavior

If the API server is not running:
- Screenshot data is saved to localStorage as backup
- User sees an error message explaining the issue
- User can click "Retry" once the API is started
- Screenshot data persists across browser sessions

## Troubleshooting

### "API Error: Failed to fetch"
- Make sure you started with `npm run dev` (which starts both servers)
- If you only ran `npm run game`, the API server won't be running
- Check the console for server logs
- Verify the server is on port 3000: http://localhost:3000/api/health

### "Missing required environment variables"
- Ensure `scripts/.env` exists and has all required variables
- Check that GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO are set

### "An issue with this title already exists"
- The API detected a duplicate issue
- Change the title slightly to create a new issue
- Or close/rename the existing issue first

### CORS Errors
- The API server has CORS enabled by default
- Make sure you're accessing the game from http://localhost:8080
- Check browser console for specific CORS error messages

## Screenshot Data Format

Screenshots are saved to localStorage as:
```javascript
{
  "title": "Issue title",
  "description": "Issue description",
  "imageData": "data:image/png;base64,iVBORw0...",
  "timestamp": "2025-10-30T21:45:00.000Z"
}
```

Access in browser console:
```javascript
JSON.parse(localStorage.getItem('wolfpack-screenshots'))
```

## Security Notes

1. **Never commit `.env` file** - It contains your GitHub token
2. **API runs locally only** - Not exposed to the internet
3. **Token has repo scope** - Can create/modify issues
4. **Screenshot images** - Currently stored as base64 data URLs (not uploaded as attachments)

## Future Enhancements

- [ ] Upload screenshot as GitHub issue attachment
- [ ] Support for image hosting services (Imgur, Cloudinary)
- [ ] Batch issue creation from localStorage
- [ ] Template selection (bug, feature request, etc.)
- [ ] Automatic category/label detection
