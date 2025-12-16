import { saveState, loadState } from './storage';

interface WatchHistory {
    [videoPath: string]: {
        position: number;
        duration: number;
        lastWatched: number;
        completed: boolean;
    };
}

const WATCH_HISTORY_KEY = 'watch_history';
const SAVE_INTERVAL = 5000; // Save every 5 seconds

/**
 * Get watch history for a specific video
 */
export const getVideoHistory = (videoPath: string) => {
    const history = loadState<WatchHistory>(WATCH_HISTORY_KEY, {});
    return history[videoPath] || null;
};

/**
 * Save current position for a video
 */
export const saveVideoPosition = (
    videoPath: string,
    position: number,
    duration: number
) => {
    const history = loadState<WatchHistory>(WATCH_HISTORY_KEY, {});

    const completed = position >= duration * 0.95; // 95% считается просмотренным

    history[videoPath] = {
        position: completed ? 0 : position, // Reset if completed
        duration,
        lastWatched: Date.now(),
        completed,
    };

    saveState(WATCH_HISTORY_KEY, history);
};

/**
 * Get all watch history sorted by last watched
 */
export const getAllHistory = (): Array<{ path: string; data: WatchHistory[string] }> => {
    const history = loadState<WatchHistory>(WATCH_HISTORY_KEY, {});

    return Object.entries(history)
        .map(([path, data]) => ({ path, data }))
        .sort((a, b) => b.data.lastWatched - a.data.lastWatched);
};

/**
 * Clear history for a specific video
 */
export const clearVideoHistory = (videoPath: string) => {
    const history = loadState<WatchHistory>(WATCH_HISTORY_KEY, {});
    delete history[videoPath];
    saveState(WATCH_HISTORY_KEY, history);
};

/**
 * Clear all watch history
 */
export const clearAllHistory = () => {
    saveState(WATCH_HISTORY_KEY, {});
};

/**
 * Get progress percentage for a video
 */
export const getVideoProgress = (videoPath: string): number => {
    const videoHistory = getVideoHistory(videoPath);
    if (!videoHistory || videoHistory.duration === 0) return 0;

    return (videoHistory.position / videoHistory.duration) * 100;
};

export { SAVE_INTERVAL };
