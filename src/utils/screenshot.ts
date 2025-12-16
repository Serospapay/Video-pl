/**
 * Capture current frame from video element as screenshot
 */
export const captureVideoFrame = (videoElement: HTMLVideoElement): string | null => {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Return as base64 data URL
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Failed to capture video frame:', error);
        return null;
    }
};

/**
 * Download screenshot via Electron
 */
export const saveScreenshot = async (dataUrl: string, defaultName: string): Promise<boolean> => {
    try {
        if (!window.electron?.saveScreenshot) {
            // Fallback for non-Electron environment
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = defaultName;
            link.click();
            return true;
        }

        // Use Electron dialog
        const saved = await window.electron.saveScreenshot(dataUrl, defaultName);
        return saved;
    } catch (error) {
        console.error('Failed to save screenshot:', error);
        return false;
    }
};

/**
 * Generate screenshot filename based on video name and timestamp
 */
export const generateScreenshotName = (videoPath: string, currentTime: number): string => {
    const videoName = videoPath.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'video';
    const timestamp = formatTimeForFilename(currentTime);
    const date = new Date().toISOString().split('T')[0];

    return `${videoName}_${timestamp}_${date}.png`;
};

/**
 * Format time for filename (HH-MM-SS)
 */
const formatTimeForFilename = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    return `${String(h).padStart(2, '0')}-${String(m).padStart(2, '0')}-${String(s).padStart(2, '0')}`;
};
