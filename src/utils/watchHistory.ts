import { saveState, loadState } from './storage';

type WatchHistory = Record<string, {
    position: number;
    duration: number;
    lastWatched: number;
    completed: boolean;
}>;

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
 * Get progress percentage for a video
 */
export const getVideoProgress = (videoPath: string): number => {
    const videoHistory = getVideoHistory(videoPath);
    if (!videoHistory || videoHistory.duration === 0) return 0;

    return (videoHistory.position / videoHistory.duration) * 100;
};

export { SAVE_INTERVAL };
