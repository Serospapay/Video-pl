"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
const url_1 = __importDefault(require("url"));
// Configure logging
electron_log_1.default.transports.file.level = 'info';
electron_log_1.default.info('App starting...');
let mainWindow;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        frame: false, // Frameless for custom title bar
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false, // Need to disable for file:// protocol
            webSecurity: false, // Required for loading local video files via file://
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
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Window controls handlers
    electron_1.ipcMain.on('minimize-window', () => mainWindow?.minimize());
    electron_1.ipcMain.on('maximize-window', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.restore();
        }
        else {
            mainWindow?.maximize();
        }
    });
    electron_1.ipcMain.on('close-window', () => mainWindow?.close());
    // Log handler
    electron_1.ipcMain.on('log-message', (_event, message) => {
        electron_log_1.default.info(message);
    });
    // File open handler
    electron_1.ipcMain.handle('open-file', async () => {
        try {
            const { canceled, filePaths } = await electron_1.dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4', 'webm', 'mov', 'flv', 'wmv', 'm4v'] }]
            });
            if (canceled || !filePaths || filePaths.length === 0) {
                return null;
            }
            const filePath = filePaths[0];
            electron_log_1.default.info(`File selected: ${filePath}`);
            return filePath;
        }
        catch (error) {
            electron_log_1.default.error('Error opening file:', error);
            return null;
        }
    });
    // Screenshot save handler
    electron_1.ipcMain.handle('save-screenshot', async (_event, dataUrl, defaultName) => {
        try {
            const { canceled, filePath } = await electron_1.dialog.showSaveDialog({
                defaultPath: defaultName,
                filters: [{ name: 'Images', extensions: ['png'] }]
            });
            if (canceled || !filePath) {
                return false;
            }
            // Convert base64 to buffer
            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            // Write file
            const fs = require('fs');
            fs.writeFileSync(filePath, buffer);
            electron_log_1.default.info(`Screenshot saved: ${filePath}`);
            return true;
        }
        catch (error) {
            electron_log_1.default.error('Error saving screenshot:', error);
            return false;
        }
    });
}
// Register privileges for media protocol
electron_1.protocol.registerSchemesAsPrivileged([
    { scheme: 'media', privileges: { secure: true, supportFetchAPI: true, bypassCSP: true, stream: true } }
]);
electron_1.app.whenReady().then(() => {
    electron_1.protocol.handle('media', (request) => {
        const filePath = request.url.slice('media://'.length);
        const decodedPath = decodeURIComponent(filePath);
        const fileUrl = url_1.default.pathToFileURL(decodedPath).toString();
        electron_log_1.default.info(`Media request: ${request.url} -> ${decodedPath} -> ${fileUrl}`);
        return electron_1.net.fetch(fileUrl);
    });
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
