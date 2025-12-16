import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VideoDisplay } from './VideoDisplay';
import { Controls } from './Controls';
import { parseSRT, type Subtitle } from '../../utils/SubtitleParser';
import { saveVideoPosition, getVideoHistory, SAVE_INTERVAL } from '../../utils/watchHistory';
import { captureVideoFrame, saveScreenshot, generateScreenshotName } from '../../utils/screenshot';
import { Captions, Camera } from 'lucide-react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { CONTROLS_HIDE_TIMEOUT, VOLUME_STEP } from '../../utils/constants';
import './Player.css';

interface PlayerProps {
    src: string;
    onEnded?: () => void;
}

export const Player: React.FC<PlayerProps> = ({ src, onEnded }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [screenshotMessage, setScreenshotMessage] = useState<string | null>(null);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savePositionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Subtitles state
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

    // Sync video element with state
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
            videoRef.current.playbackRate = playbackRate;
        }
    }, [volume, isMuted, playbackRate]);

    // Load saved position when video changes
    useEffect(() => {
        const history = getVideoHistory(src);
        if (history && history.position > 0 && !history.completed) {
            // Restore position after video is loaded
            if (videoRef.current && duration > 0) {
                videoRef.current.currentTime = history.position;
                setCurrentTime(history.position);
            }
        }
    }, [src, duration]);

    // Auto-save position periodically
    useEffect(() => {
        if (savePositionIntervalRef.current) {
            clearInterval(savePositionIntervalRef.current);
        }

        if (isPlaying && duration > 0) {
            savePositionIntervalRef.current = setInterval(() => {
                saveVideoPosition(src, currentTime, duration);
            }, SAVE_INTERVAL);
        }

        return () => {
            if (savePositionIntervalRef.current) {
                clearInterval(savePositionIntervalRef.current);
            }
        };
    }, [isPlaying, currentTime, duration, src]);

    // Reset state when source changes
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setIsLoading(true);
        setError(null);
        setSubtitles([]);
        setCurrentSubtitle('');
    }, [src]);

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

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);

            // Find current subtitle
            const subtitle = subtitles.find(s => time >= s.startTime && time <= s.endTime);
            setCurrentSubtitle(subtitle ? subtitle.text : '');
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleLoadStart = () => {
        setIsLoading(true);
        setError(null);
    };

    const handleCanPlay = () => {
        setIsLoading(false);
    };

    const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        console.error('Video error:', e);
        setError('Failed to load video');
        setIsLoading(false);
    };

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
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch((err) => {
                console.error('Failed to exit fullscreen:', err);
            });
            setIsFullscreen(false);
        }
    }, []);

    const handlePlaybackRateChange = useCallback((rate: number) => {
        setPlaybackRate(rate);
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
        }
    }, []);

    const togglePiP = useCallback(async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (videoRef.current) {
                await videoRef.current.requestPictureInPicture();
            }
        } catch (err) {
            console.error('PiP error:', err);
        }
    }, []);

    // Screenshot functionality
    const takeScreenshot = useCallback(async () => {
        if (!videoRef.current) return;

        const dataUrl = captureVideoFrame(videoRef.current);
        if (!dataUrl) {
            setScreenshotMessage('Failed to capture screenshot');
            setTimeout(() => setScreenshotMessage(null), 3000);
            return;
        }

        const filename = generateScreenshotName(src, currentTime);
        const saved = await saveScreenshot(dataUrl, filename);

        if (saved) {
            setScreenshotMessage('Screenshot saved!');
        } else {
            setScreenshotMessage('Failed to save screenshot');
        }

        setTimeout(() => setScreenshotMessage(null), 3000);
    }, [src, currentTime]);

    const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                const parsedSubtitles = parseSRT(text);
                setSubtitles(parsedSubtitles);
            };
            reader.onerror = () => {
                console.error('Failed to read subtitle file');
                setError('Failed to load subtitles');
            };
            reader.readAsText(file);
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, CONTROLS_HIDE_TIMEOUT);
    };

    // Mouse gestures
    const handleDoubleClick = useCallback(() => {
        toggleFullscreen();
    }, [toggleFullscreen]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        handleVolumeChange(Math.max(0, Math.min(1, volume + delta)));
    }, [volume, handleVolumeChange]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onPlayPause: togglePlay,
        onSeekForward: (amount) => handleSeek(Math.min(duration, currentTime + amount)),
        onSeekBackward: (amount) => handleSeek(Math.max(0, currentTime - amount)),
        onVolumeUp: () => handleVolumeChange(Math.min(1, volume + VOLUME_STEP)),
        onVolumeDown: () => handleVolumeChange(Math.max(0, volume - VOLUME_STEP)),
        onToggleFullscreen: toggleFullscreen,
        onToggleMute: toggleMute,
    });

    // Add S key for screenshot
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            if (e.code === 'KeyS') {
                e.preventDefault();
                takeScreenshot();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [takeScreenshot]);

    return (
        <div
            className="player-container"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onWheel={handleWheel}
            tabIndex={0}
        >
            <VideoDisplay
                ref={videoRef}
                src={src}
                onClick={togglePlay}
                onDoubleClick={handleDoubleClick}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                    setIsPlaying(false);
                    saveVideoPosition(src, duration, duration); // Mark as completed
                    onEnded?.();
                }}
                onError={handleError}
                onLoadStart={handleLoadStart}
                onCanPlay={handleCanPlay}
            />

            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading video...</p>
                </div>
            )}

            {error && (
                <div className="error-overlay">
                    <div className="error-content">
                        <p className="error-title">Error</p>
                        <p className="error-message">{error}</p>
                    </div>
                </div>
            )}

            {screenshotMessage && (
                <div className="screenshot-message">
                    {screenshotMessage}
                </div>
            )}

            {currentSubtitle && !error && (
                <div className="subtitle-overlay">
                    {currentSubtitle}
                </div>
            )}

            <div className={`controls-wrapper ${showControls ? 'visible' : 'hidden'}`}>
                <Controls
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    volume={volume}
                    isMuted={isMuted}
                    isFullscreen={isFullscreen}
                    playbackRate={playbackRate}
                    onPlayPause={togglePlay}
                    onSeek={handleSeek}
                    onVolumeChange={handleVolumeChange}
                    onToggleMute={toggleMute}
                    onToggleFullscreen={toggleFullscreen}
                    onPlaybackRateChange={handlePlaybackRateChange}
                    onTogglePiP={togglePiP}
                />

                <div className="subtitle-control-container">
                    <input
                        type="file"
                        accept=".srt"
                        id="subtitle-upload"
                        style={{ display: 'none' }}
                        onChange={handleSubtitleUpload}
                        aria-label="Upload subtitle file"
                    />
                    <label
                        htmlFor="subtitle-upload"
                        className="subtitle-btn"
                        title="Upload Subtitles (.srt)"
                        aria-label="Upload subtitles"
                    >
                        <Captions size={20} />
                    </label>

                    <button
                        onClick={takeScreenshot}
                        className="subtitle-btn"
                        title="Take Screenshot (S)"
                        aria-label="Take screenshot"
                        style={{ marginLeft: '8px' }}
                    >
                        <Camera size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
