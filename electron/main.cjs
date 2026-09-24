// Safe Electron / Web entry point
// Detects whether the runtime is Electron (desktop) or Node.js / LiteSpeed (web hosting like Hostinger).

const isElectron = Boolean(process.versions && process.versions.electron);

if (!isElectron) {
  // Running in a Web Hosting / Server environment (such as Hostinger, LiteSpeed lsnode, Cloud Run, VPS)
  console.log('[Runtime] Running in Node.js Web Server mode (Hostinger / LiteSpeed detected).');
  console.log('[Runtime] Loading Express web server...');
  module.exports = require('../server.cjs');
} else {
  // Running in an Electron desktop environment
  try {
    const { app, BrowserWindow } = require('electron');
    const path = require('path');

    function createWindow() {
      const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
      win.loadFile(distIndex).catch(() => {
        win.loadURL('http://localhost:3000');
      });
    }

    app.whenReady().then(() => {
      createWindow();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit();
    });
  } catch (err) {
    console.warn('[Runtime] Electron package not found. Falling back to web server:', err.message);
    module.exports = require('../server.cjs');
  }
}
