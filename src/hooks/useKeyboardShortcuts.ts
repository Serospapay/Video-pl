import { useEffect } from 'react';
import { KEYBOARD_SHORTCUTS } from '../utils/constants';

interface KeyboardShortcutsHandlers {
    onPlayPause?: () => void;
    onSeekForward?: (amount: number) => void;
    onSeekBackward?: (amount: number) => void;
    onVolumeUp?: () => void;
    onVolumeDown?: () => void;
    onToggleFullscreen?: () => void;
    onToggleMute?: () => void;
}

/**
 * Custom hook for handling keyboard shortcuts
 * Automatically ignores shortcuts when user is typing in input/textarea
 */
export const useKeyboardShortcuts = (handlers: KeyboardShortcutsHandlers) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore shortcuts when user is typing
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            const { code } = e;

            // Play/Pause
            if (KEYBOARD_SHORTCUTS.PLAY_PAUSE.includes(code as any)) {
                e.preventDefault();
                handlers.onPlayPause?.();
            }
            // Seek forward (small)
            else if (KEYBOARD_SHORTCUTS.SEEK_FORWARD_SMALL.includes(code as any)) {
                e.preventDefault();
                handlers.onSeekForward?.(5);
            }
            // Seek backward (small)
            else if (KEYBOARD_SHORTCUTS.SEEK_BACKWARD_SMALL.includes(code as any)) {
                e.preventDefault();
                handlers.onSeekBackward?.(5);
            }
            // Seek forward (large)
            else if (KEYBOARD_SHORTCUTS.SEEK_FORWARD_LARGE.includes(code as any)) {
                e.preventDefault();
                handlers.onSeekForward?.(10);
            }
            // Seek backward (large)
            else if (KEYBOARD_SHORTCUTS.SEEK_BACKWARD_LARGE.includes(code as any)) {
                e.preventDefault();
                handlers.onSeekBackward?.(10);
            }
            // Volume up
            else if (KEYBOARD_SHORTCUTS.VOLUME_UP.includes(code as any)) {
                e.preventDefault();
                handlers.onVolumeUp?.();
            }
            // Volume down
            else if (KEYBOARD_SHORTCUTS.VOLUME_DOWN.includes(code as any)) {
                e.preventDefault();
                handlers.onVolumeDown?.();
            }
            // Toggle fullscreen
            else if (KEYBOARD_SHORTCUTS.TOGGLE_FULLSCREEN.includes(code as any)) {
                e.preventDefault();
                handlers.onToggleFullscreen?.();
            }
            // Toggle mute
            else if (KEYBOARD_SHORTCUTS.TOGGLE_MUTE.includes(code as any)) {
                e.preventDefault();
                handlers.onToggleMute?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers]);
};
