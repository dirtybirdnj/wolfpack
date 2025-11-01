import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from '@cheprasov/qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Enable gamepad support
      enableRemoteModule: false
    },
    title: 'Wolfpack - Lake Champlain Fishing Game',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false // Don't show until ready
  });

  // Load the game from the dist folder
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  mainWindow.loadFile(indexPath);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development (comment out for production)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', function () {
  // On macOS it is common for applications to stay open until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On macOS re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Disable Steam Input if using Electron 27+ for controller support
// This is important for Steam Deck compatibility
app.commandLine.appendSwitch('disable-features', 'SteamInput');

// IPC Handler for QR Code Generation
ipcMain.handle('generate-qr-code', async (event, data) => {
  try {
    console.log('[Electron Main] Generating QR code for data:', data);

    // Create QR code instance
    const qrCode = new QRCode.QRCodeCanvas(JSON.stringify(data), {
      scale: 8,
      fgColor: '#000000',
      bgColor: '#ffffff',
      level: 'M',
      padding: 1
    });

    // Generate PNG data URL
    const dataUrl = qrCode.toDataUrl();

    console.log('[Electron Main] QR code generated successfully');
    return { success: true, dataUrl };
  } catch (error) {
    console.error('[Electron Main] Error generating QR code:', error);
    return { success: false, error: error.message };
  }
});
