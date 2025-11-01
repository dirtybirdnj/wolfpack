# QR Code Generation via Electron IPC

## Overview

This feature implements QR code generation for game state debugging using Electron's backend process. The QR codes can be scanned by AI vision models (like Claude) from screenshots to provide real-time game state information.

## Architecture

### Backend (Electron Main Process)
- **File**: `electron-main.js`
- **Library**: `@cheprasov/qrcode` (Node.js/CommonJS)
- **IPC Handler**: `generate-qr-code`
- **Function**: Generates PNG data URLs from game state objects

### Bridge (Preload Script)
- **File**: `preload.js`
- **Purpose**: Safely exposes IPC functionality to renderer
- **API**: `window.electron.generateQRCode(data)`

### Frontend (Renderer Process)
- **File**: `src/scenes/BootScene.js`
- **Method**: `generateSingleQR()`
- **Fallback**: Detects Electron vs browser mode

## Implementation Details

### Electron Main Process
```javascript
ipcMain.handle('generate-qr-code', async (event, data) => {
  const qrCode = new QRCode.QRCodeCanvas(JSON.stringify(data), {
    scale: 8,
    fgColor: '#000000',
    bgColor: '#ffffff',
    level: 'M',
    padding: 1
  });

  const dataUrl = qrCode.toDataUrl();
  return { success: true, dataUrl };
});
```

### Preload Script
```javascript
contextBridge.exposeInMainWorld('electron', {
  generateQRCode: async (data) => {
    return await ipcRenderer.invoke('generate-qr-code', data);
  },
  isElectron: true
});
```

### Renderer Usage
```javascript
async generateSingleQR() {
  const testData = {
    ts: Math.floor(Date.now() / 1000),
    state: 'boot',
    scene: 'BootScene',
    test: 'QR-CODE-ELECTRON-IPC'
  };

  if (window.electron && window.electron.generateQRCode) {
    const result = await window.electron.generateQRCode(testData);

    if (result.success) {
      const img = new Image();
      img.onload = () => {
        this.textures.addImage('test-qr', img);
        const qrSprite = this.add.image(x, y, 'test-qr');
      };
      img.src = result.dataUrl;
    }
  }
}
```

## Why Electron Backend?

### Problem
The `@cheprasov/qrcode` library is packaged as a CommonJS module, which doesn't work directly in browsers without bundling:
```
Uncaught ReferenceError: module is not defined
```

### Solution
By generating QR codes in Electron's Node.js backend:
1. ✅ Native CommonJS support (no bundling required)
2. ✅ Works offline (critical for Electron packaging)
3. ✅ Keeps renderer process clean
4. ✅ Better performance (Node.js vs browser)
5. ✅ Centralized QR generation logic

## Files Modified

1. **electron-main.js**
   - Added `ipcMain` import
   - Added `@cheprasov/qrcode` import
   - Added preload script path to webPreferences
   - Added IPC handler for QR generation

2. **preload.js** (new file)
   - Exposes `window.electron.generateQRCode()` API
   - Uses contextBridge for security

3. **src/scenes/BootScene.js**
   - Updated `generateSingleQR()` to use Electron IPC
   - Added async/await for IPC communication
   - Added fallback detection for browser mode

4. **package.json**
   - Dependency: `@cheprasov/qrcode@^0.1.0`

## Testing

### Electron Mode
```bash
npm run build
npm run electron
```
- QR code should appear on boot screen
- Console shows: "QR code generated via Electron backend"

### Browser Mode
```bash
npm run game
```
- QR code generation skipped
- Console shows: "Browser mode detected. Run via `npm run electron` to test QR codes."

## Future Enhancements

1. **QROverlay Utility** (`src/utils/QROverlay.js`)
   - Real-time game state display
   - Toggle with keyboard shortcut
   - Update frequency configuration

2. **Multiple Barcode Types**
   - QR Code (current)
   - Code 128
   - Aztec Code

3. **Game State Encoding**
   - Player position
   - Inventory state
   - Current scene
   - Fish statistics
   - Sonar data

## Known Issues

- Build script (`build.js`) needs ES module conversion
- Browser mode has no QR generation (by design)
- Preload script path assumes root directory

## References

- Library: https://github.com/cheprasov/js-qrcode
- Electron IPC: https://www.electronjs.org/docs/latest/api/ipc-main
- Context Bridge: https://www.electronjs.org/docs/latest/api/context-bridge
