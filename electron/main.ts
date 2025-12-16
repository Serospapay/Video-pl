import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron';
import path from 'path';
import log from 'electron-log';
import url from 'url';

// Configure logging
log.transports.file.level = 'info';
log.info('App starting...');

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // Frameless for custom title bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow loading local resources
    },
    backgroundColor: '#000000', // Dark background
  });

  // In production, load the index.html.
  // In development, load the Vite dev server URL.
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Window controls handlers
  ipcMain.on('minimize-window', () => mainWindow?.minimize());
  ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('close-window', () => mainWindow?.close());

  // Log handler
  ipcMain.on('log-message', (_event, message) => {
    log.info(message);
  });

  // File open handler
  ipcMain.handle('open-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4', 'webm', 'mov'] }]
    });
    if (canceled) {
      return null;
    } else {
      return filePaths[0];
    }
  });
}

// Register privileges for media protocol
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { secure: true, supportFetchAPI: true, bypassCSP: true, stream: true } }
]);

app.whenReady().then(() => {
  protocol.handle('media', (request) => {
    const filePath = request.url.slice('media://'.length);
    const decodedPath = decodeURIComponent(filePath);
    const fileUrl = url.pathToFileURL(decodedPath).toString();

    log.info(`Media request: ${request.url} -> ${decodedPath} -> ${fileUrl}`);

    return net.fetch(fileUrl);
  });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
