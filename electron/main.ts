import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron';
import path from 'path';
import log from 'electron-log';
import url from 'url';
import { promises as fs } from 'fs';

// Configure logging
log.transports.file.level = 'info';
log.info('App starting...');

let mainWindow: BrowserWindow | null;

const VIDEO_EXTENSIONS = new Set([
  'mkv',
  'avi',
  'mp4',
  'webm',
  'mov',
  'flv',
  'wmv',
  'm4v',
]);

function isSafeMediaPath(filePath: string): boolean {
  if (!filePath) return false;

  const normalized = path.normalize(filePath);

  if (!path.isAbsolute(normalized)) {
    return false;
  }

  if (normalized.includes('..')) {
    return false;
  }

  const ext = path.extname(normalized).slice(1).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // Frameless for custom title bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for some Electron APIs with custom protocols
      webSecurity: true,
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
}

function registerIpcHandlers() {
  ipcMain.on('minimize-window', () => mainWindow?.minimize());
  ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('close-window', () => mainWindow?.close());
  ipcMain.on('log-message', (_event, message) => {
    log.info(message);
  });

  ipcMain.handle('open-file', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4', 'webm', 'mov', 'flv', 'wmv', 'm4v'] }]
      });

      if (canceled || !filePaths || filePaths.length === 0) {
        return null;
      }

      const filePath = filePaths[0];
      log.info(`File selected: ${filePath}`);
      return filePath;
    } catch (error) {
      log.error('Error opening file:', error);
      return null;
    }
  });

  ipcMain.handle('save-screenshot', async (_event, dataUrl: string, defaultName: string) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: defaultName,
        filters: [{ name: 'Images', extensions: ['png'] }]
      });

      if (canceled || !filePath) {
        return false;
      }

      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      await fs.writeFile(filePath, buffer);

      log.info(`Screenshot saved: ${filePath}`);
      return true;
    } catch (error) {
      log.error('Error saving screenshot:', error);
      return false;
    }
  });
}

// Register privileges for media protocol
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { secure: true, supportFetchAPI: true, stream: true } }
]);

app.whenReady().then(() => {
  registerIpcHandlers();

  protocol.handle('media', (request) => {
    try {
      const rawPath = request.url.slice('media://'.length);
      const decodedPath = decodeURIComponent(rawPath);

      if (!isSafeMediaPath(decodedPath)) {
        log.warn(`Blocked unsafe media request: ${request.url} -> ${decodedPath}`);
        return net.fetch('about:blank');
      }

      const fileUrl = url.pathToFileURL(decodedPath).toString();
      log.info(`Media request: ${request.url} -> ${decodedPath} -> ${fileUrl}`);

      return net.fetch(fileUrl);
    } catch (error) {
      log.error('Error handling media request:', error);
      return net.fetch('about:blank');
    }
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
