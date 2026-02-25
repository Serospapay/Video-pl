import { useEffect, useRef } from 'react';
import { KEYBOARD_SHORTCUTS } from '../utils/constants';

interface KeyboardShortcutsHandlers {
    onPlayPause?: () => void;
    onSeekForward?: (amount: number) => void;
    onSeekBackward?: (amount: number) => void;
    onVolumeUp?: () => void;
    onVolumeDown?: () => void;
    onToggleFullscreen?: () => void;
    onToggleMute?: () => void;
    onNextTrack?: () => void;
    onPrevTrack?: () => void;
    onShowHelp?: () => void;
}

/**
 * Custom hook for handling keyboard shortcuts
 * Automatically ignores shortcuts when user is typing in input/textarea
 */
export const useKeyboardShortcuts = (handlers: KeyboardShortcutsHandlers) => {
    const handlersRef = useRef(handlers);

    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const current = handlersRef.current;

            // Ignore shortcuts when user is typing
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            const { code } = e;
            const isIn = (keys: readonly string[]) => keys.includes(code);

            // Play/Pause
            if (isIn(KEYBOARD_SHORTCUTS.PLAY_PAUSE)) {
                e.preventDefault();
                current.onPlayPause?.();
            }
            // Seek forward (small)
            else if (isIn(KEYBOARD_SHORTCUTS.SEEK_FORWARD_SMALL)) {
                e.preventDefault();
                current.onSeekForward?.(5);
            }
            // Seek backward (small)
            else if (isIn(KEYBOARD_SHORTCUTS.SEEK_BACKWARD_SMALL)) {
                e.preventDefault();
                current.onSeekBackward?.(5);
            }
            // Seek forward (large)
            else if (isIn(KEYBOARD_SHORTCUTS.SEEK_FORWARD_LARGE)) {
                e.preventDefault();
                current.onSeekForward?.(10);
            }
            // Seek backward (large)
            else if (isIn(KEYBOARD_SHORTCUTS.SEEK_BACKWARD_LARGE)) {
                e.preventDefault();
                current.onSeekBackward?.(10);
            }
            // Volume up
            else if (isIn(KEYBOARD_SHORTCUTS.VOLUME_UP)) {
                e.preventDefault();
                current.onVolumeUp?.();
            }
            // Volume down
            else if (isIn(KEYBOARD_SHORTCUTS.VOLUME_DOWN)) {
                e.preventDefault();
                current.onVolumeDown?.();
            }
            // Toggle fullscreen
            else if (isIn(KEYBOARD_SHORTCUTS.TOGGLE_FULLSCREEN)) {
                e.preventDefault();
                current.onToggleFullscreen?.();
            }
            // Toggle mute
            else if (isIn(KEYBOARD_SHORTCUTS.TOGGLE_MUTE)) {
                e.preventDefault();
                current.onToggleMute?.();
            }
            // Next track
            else if (isIn(KEYBOARD_SHORTCUTS.NEXT_TRACK)) {
                e.preventDefault();
                current.onNextTrack?.();
            }
            // Previous track
            else if (isIn(KEYBOARD_SHORTCUTS.PREV_TRACK)) {
                e.preventDefault();
                current.onPrevTrack?.();
            }
            // Help (? key is Shift+Slash)
            else if (code === 'Slash' && e.shiftKey) {
                e.preventDefault();
                current.onShowHelp?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
};
