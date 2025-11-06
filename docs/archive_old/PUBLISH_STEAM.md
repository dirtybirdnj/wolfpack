# Publishing Wolfpack to Steam

This guide explains how to build and publish Wolfpack to Steam using Electron.

## Prerequisites

1. **Node.js** (v20+)
2. **npm** with dependencies installed
3. **Steamworks account** and app configured
4. **Icon file**: Place a 512x512 PNG icon at `assets/icon.png`

## Building for Steam

### Full Build (Recommended)

This creates both itch.io and Steam distributions:

```bash
npm run build
```

This will:
1. Build the web version in `dist/`
2. Create `wolfpack-itch-dist-v{version}.zip` for itch.io
3. Build Electron app in `electron-dist/`
4. Create `wolfpack-steam-dist-v{version}.zip` for Steam

### Steam-only Build

If you only need the Steam build:

```bash
npm run build:electron
```

## What Gets Built

The Steam distribution includes platform-specific builds:

- **Windows**: `electron-dist/win-unpacked/` - Ready to upload to Steam
- **macOS**: `electron-dist/mac/` - Universal binary (x64 + ARM64)
- **Linux**: `electron-dist/linux-unpacked/` - x64 build

## Steam Upload Process

### 1. Configure Steamworks

In your Steamworks partner portal:

1. Create a new application (or use existing app ID)
2. Set up depots for each platform:
   - Depot for Windows
   - Depot for macOS
   - Depot for Linux

### 2. Install Steamworks SDK

Download the [Steamworks SDK](https://partner.steamgames.com/downloads/list)

### 3. Configure Build Scripts

In the SDK's `ContentBuilder` directory, create app build scripts for each platform:

**app_build.vdf** (example):
```vdf
"AppBuild"
{
  "AppID" "YOUR_APP_ID"
  "Desc" "Wolfpack v0.25.0"
  "BuildOutput" "./output"
  "ContentRoot" "../path/to/wolfpack/electron-dist"
  "SetLive" "default"

  "Depots"
  {
    "YOUR_WINDOWS_DEPOT_ID"
    {
      "FileMapping"
      {
        "LocalPath" "win-unpacked\*"
        "DepotPath" "."
        "Recursive" "1"
      }
    }

    "YOUR_MAC_DEPOT_ID"
    {
      "FileMapping"
      {
        "LocalPath" "mac\*"
        "DepotPath" "."
        "Recursive" "1"
      }
    }

    "YOUR_LINUX_DEPOT_ID"
    {
      "FileMapping"
      {
        "LocalPath" "linux-unpacked\*"
        "DepotPath" "."
        "Recursive" "1"
      }
    }
  }
}
```

### 4. Upload to Steam

```bash
cd steamworks_sdk/tools/ContentBuilder
./builder_linux/steamcmd.sh +login YOUR_USERNAME +run_app_build ../scripts/app_build.vdf +quit
```

## Steam Deck Compatibility

The Electron app is configured for Steam Deck compatibility:

- **Controller Support**: Steam Input is disabled (Electron 27+ requirement)
- **Resolution**: Default 1280x720, scales to Steam Deck's 800p display
- **Controls**: Gamepad API enabled for native controller support

### Testing on Steam Deck

1. Upload a build to Steam (can be private/beta branch)
2. Install on Steam Deck
3. Test all controls work without keyboard/mouse
4. Verify display scaling and performance

## Build Options

### Custom Build Targets

Edit `electron-builder.json` to customize build targets:

```json
{
  "win": {
    "target": ["nsis", "portable"]  // Create installer + portable
  },
  "mac": {
    "target": ["dmg", "zip"]
  },
  "linux": {
    "target": ["AppImage", "deb"]
  }
}
```

### Platform-Specific Builds

Build for specific platforms only:

```bash
# Windows only
electron-builder --win --config electron-builder.json

# macOS only
electron-builder --mac --config electron-builder.json

# Linux only
electron-builder --linux --config electron-builder.json
```

## Troubleshooting

### Electron Build Fails

Make sure dependencies are installed:
```bash
npm install
```

### Icon Not Found

Create or obtain a 512x512 PNG icon and place it at:
```
assets/icon.png
```

### Steam Upload Fails

- Verify your Steamworks credentials
- Check depot IDs match your app configuration
- Ensure file paths in VDF scripts are correct
- Check ContentBuilder logs for specific errors

### Controller Not Working

The app disables Steam Input for Electron 27+ compatibility. If controllers don't work:

1. Verify Gamepad API is enabled in your browser
2. Test with a supported controller (PS4, Xbox, 8BitDo)
3. Check Electron version in `package.json`

## Resources

- [Steamworks Documentation](https://partner.steamgames.com/doc/home)
- [Electron Builder Docs](https://www.electron.build/)
- [Steam Deck Developer Guidelines](https://partner.steamgames.com/doc/steamdeck/recommendations)
- [Phaser + Steam Tutorial](https://phaser.io/news/2025/03/publishing-web-games-on-steam-with-electron)

## Version Management

Update version in `package.json` before building:

```json
{
  "version": "0.25.0"
}
```

This version is used in:
- Steam build filenames
- Build info metadata
- Electron app version

## Support

For Steam publishing questions, consult:
- Steamworks Partner Support
- [Steam Developer Community](https://steamcommunity.com/groups/steamworks)
