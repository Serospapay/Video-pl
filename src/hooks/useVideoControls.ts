import { useState, useCallback, useRef, useEffect } from 'react';
import { saveState, loadState } from '../utils/storage';
import {
    DEFAULT_VOLUME,
    DEFAULT_PLAYBACK_SPEED,
    STORAGE_KEYS
} from '../utils/constants';

interface UseVideoControlsReturn {
    // State
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    playbackRate: number;
    isFullscreen: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    togglePlay: () => void;
    handleSeek: (time: number) => void;
    handleVolumeChange: (newVolume: number) => void;
    toggleMute: () => void;
    toggleFullscreen: () => void;
    handlePlaybackRateChange: (rate: number) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setIsPlaying: (playing: boolean) => void;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Refs
    videoRef: React.RefObject<HTMLVideoElement | null>;
}

/**
 * Custom hook for managing video player controls and state
 */
export const useVideoControls = (): UseVideoControlsReturn => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Load initial state from localStorage
    const [volume, setVolume] = useState(() =>
        loadState(STORAGE_KEYS.PLAYER_VOLUME, DEFAULT_VOLUME)
    );
    const [isMuted, setIsMuted] = useState(() =>
        loadState(STORAGE_KEYS.PLAYER_MUTED, false)
    );
    const [playbackRate, setPlaybackRate] = useState(() =>
        loadState(STORAGE_KEYS.PLAYER_SPEED, DEFAULT_PLAYBACK_SPEED)
    );

    // Runtime state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync video element with state
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
            videoRef.current.playbackRate = playbackRate;
        }

        // Save state to localStorage
        saveState(STORAGE_KEYS.PLAYER_VOLUME, volume);
        saveState(STORAGE_KEYS.PLAYER_MUTED, isMuted);
        saveState(STORAGE_KEYS.PLAYER_SPEED, playbackRate);
    }, [volume, isMuted, playbackRate]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch((err) => {
                    console.error('Failed to play video:', err);
                    setError('Failed to play video');
                });
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying]);

    const handleSeek = useCallback((time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const handleVolumeChange = useCallback((newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setVolume(clampedVolume);
        setIsMuted(clampedVolume === 0);
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(!isMuted);
    }, [isMuted]);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error('Failed to enter fullscreen:', err);
                setError('Failed to enter fullscreen');
            });
        } else {
            document.exitFullscreen().catch((err) => {
                console.error('Failed to exit fullscreen:', err);
            });
        }
    }, []);

    const handlePlaybackRateChange = useCallback((rate: number) => {
        setPlaybackRate(rate);
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
        }
    }, []);

    return {
        // State
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        isFullscreen,
        isLoading,
        error,

        // Actions
        togglePlay,
        handleSeek,
        handleVolumeChange,
        toggleMute,
        toggleFullscreen,
        handlePlaybackRateChange,
        setCurrentTime,
        setDuration,
        setIsPlaying,
        setIsLoading,
        setError,

        // Refs
        videoRef,
    };
};
