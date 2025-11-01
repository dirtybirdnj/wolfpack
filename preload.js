/**
 * Preload script for Electron
 * Safely exposes IPC functionality to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // QR Code generation
  generateQRCode: async (data) => {
    return await ipcRenderer.invoke('generate-qr-code', data);
  },

  // Check if running in Electron
  isElectron: true
});

console.log('[Preload] Electron API exposed to renderer');
