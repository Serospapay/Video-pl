/// <reference types="vite/client" />
/// <reference types="vite/client" />

interface Window {
    electron: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        log: (message: string) => void;
        openFile: () => Promise<string | null>;
    };
}
