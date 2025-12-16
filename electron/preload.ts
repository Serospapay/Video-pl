import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
    log: (message: string) => ipcRenderer.send('log-message', message),
    openFile: () => ipcRenderer.invoke('open-file'),
    saveScreenshot: (dataUrl: string, defaultName: string) =>
        ipcRenderer.invoke('save-screenshot', dataUrl, defaultName),
});
