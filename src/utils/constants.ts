// Playback speeds
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export const DEFAULT_PLAYBACK_SPEED = 1;

// Volume
export const DEFAULT_VOLUME = 1;
export const VOLUME_STEP = 0.1;

// Seek times (in seconds)
export const SEEK_STEP_SMALL = 5;
export const SEEK_STEP_LARGE = 10;

// Timeouts (in milliseconds)
export const CONTROLS_HIDE_TIMEOUT = 3000;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
    PLAY_PAUSE: ['Space', 'KeyK'],
    SEEK_FORWARD_SMALL: ['ArrowRight'],
    SEEK_BACKWARD_SMALL: ['ArrowLeft'],
    SEEK_FORWARD_LARGE: ['KeyL'],
    SEEK_BACKWARD_LARGE: ['KeyJ'],
    VOLUME_UP: ['ArrowUp'],
    VOLUME_DOWN: ['ArrowDown'],
    TOGGLE_FULLSCREEN: ['KeyF'],
    TOGGLE_MUTE: ['KeyM'],
    NEXT_TRACK: ['KeyN', 'PageDown'],
    PREV_TRACK: ['KeyP', 'PageUp'],
    HELP: ['Slash'],
} as const;

// Video file extensions
export const VIDEO_EXTENSIONS = ['mkv', 'avi', 'mp4', 'webm', 'mov', 'flv', 'wmv', 'm4v'] as const;

// Storage keys
export const STORAGE_KEYS = {
    PLAYLIST: 'playlist',
    CURRENT_INDEX: 'currentIndex',
    PLAYER_VOLUME: 'player_volume',
    PLAYER_MUTED: 'player_muted',
    PLAYER_SPEED: 'player_speed',
    IS_LOOPING: 'isLooping',
    IS_SHUFFLING: 'isShuffling',
} as const;
