/// <reference types="vite/client" />

interface Window {
    electron: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        log: (message: string) => void;
        openFile: () => Promise<string | null>;
        saveScreenshot: (dataUrl: string, defaultName: string) => Promise<boolean>;
    };
}
