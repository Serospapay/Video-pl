import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VideoDisplay } from './VideoDisplay';
import { Controls } from './Controls';
import { parseSRT, type Subtitle } from '../../utils/SubtitleParser';
import { saveVideoPosition, getVideoHistory, SAVE_INTERVAL } from '../../utils/watchHistory';
import { captureVideoFrame, saveScreenshot, generateScreenshotName } from '../../utils/screenshot';
import { Captions, Camera } from 'lucide-react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { CONTROLS_HIDE_TIMEOUT, VOLUME_STEP } from '../../utils/constants';
import { useVideoControls } from '../../hooks/useVideoControls';
import './Player.css';

interface PlayerProps {
    src: string;
    onEnded?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
}

export const Player: React.FC<PlayerProps> = ({ src, onEnded, onNext, onPrev }) => {
    const {
        videoRef,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        isFullscreen,
        isLoading,
        error,
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
    } = useVideoControls();
    const [showControls, setShowControls] = useState(true);
    const [screenshotMessage, setScreenshotMessage] = useState<string | null>(null);
    const [showHelpOverlay, setShowHelpOverlay] = useState(false);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savePositionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // A-B repeat: pointA and pointB in seconds; when both set, loop between them
    const [abPointA, setAbPointA] = useState<number | null>(null);
    const [abPointB, setAbPointB] = useState<number | null>(null);

    // Subtitles state
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

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
    }, [src, duration, videoRef, setCurrentTime]);

    // Auto-save position periodically using the live video currentTime.
    useEffect(() => {
        if (savePositionIntervalRef.current) {
            clearInterval(savePositionIntervalRef.current);
        }

        if (isPlaying && duration > 0) {
            savePositionIntervalRef.current = setInterval(() => {
                const liveTime = videoRef.current?.currentTime ?? currentTime;
                saveVideoPosition(src, liveTime, duration);
            }, SAVE_INTERVAL);
        }

        return () => {
            if (savePositionIntervalRef.current) {
                clearInterval(savePositionIntervalRef.current);
            }
        };
    }, [isPlaying, duration, src, videoRef, currentTime]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            let time = videoRef.current.currentTime;

            // A-B repeat works only with a valid forward segment.
            if (abPointA !== null && abPointB !== null && abPointB > abPointA + 0.05 && time >= abPointB) {
                videoRef.current.currentTime = abPointA;
                time = abPointA;
            }
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
    }, [videoRef]);

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
    }, [src, currentTime, videoRef]);

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

    const setAbAAtCurrentTime = useCallback(() => {
        if (!videoRef.current || duration <= 0) return;
        const time = videoRef.current.currentTime;
        setAbPointA(time);
        if (abPointB !== null && time >= abPointB) {
            setAbPointB(null);
        }
    }, [videoRef, duration, abPointB]);

    const setAbBAtCurrentTime = useCallback(() => {
        if (!videoRef.current || duration <= 0) return;
        const time = videoRef.current.currentTime;
        if (abPointA === null) {
            setAbPointA(time);
            setAbPointB(null);
            return;
        }
        if (time <= abPointA + 0.05) {
            return;
        }
        setAbPointB(time);
    }, [videoRef, duration, abPointA]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onPlayPause: togglePlay,
        onSeekForward: (amount) => handleSeek(Math.min(duration, currentTime + amount)),
        onSeekBackward: (amount) => handleSeek(Math.max(0, currentTime - amount)),
        onVolumeUp: () => handleVolumeChange(Math.min(1, volume + VOLUME_STEP)),
        onVolumeDown: () => handleVolumeChange(Math.max(0, volume - VOLUME_STEP)),
        onToggleFullscreen: toggleFullscreen,
        onToggleMute: toggleMute,
        onNextTrack: onNext,
        onPrevTrack: onPrev,
        onShowHelp: () => setShowHelpOverlay((v) => !v),
    });

    // S = screenshot; Escape = close help
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            if (e.code === 'KeyS') {
                e.preventDefault();
                void takeScreenshot();
            }
            if (e.code === 'Escape' && showHelpOverlay) {
                setShowHelpOverlay(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [takeScreenshot, showHelpOverlay]);

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
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
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
                        <p className="error-title">Помилка</p>
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

            {showHelpOverlay && (
                <div
                    className="help-overlay"
                    role="dialog"
                    aria-label="Допомога з клавішами"
                    onClick={() => setShowHelpOverlay(false)}
                >
                    <div className="help-content glass" onClick={(e) => e.stopPropagation()}>
                        <div className="help-header">
                            <h3>Гарячі клавіші</h3>
                            <button
                                type="button"
                                className="help-close"
                                onClick={() => setShowHelpOverlay(false)}
                                aria-label="Закрити"
                            >
                                Esc
                            </button>
                        </div>
                        <dl className="help-list">
                            <dt>Пробіл / K</dt><dd>Пуск / пауза</dd>
                            <dt>J / L</dt><dd>Перемотка назад / вперед 10 с</dd>
                            <dt>Стрілки вліво / вправо</dt><dd>5 с назад / вперед</dd>
                            <dt>Стрілки вгору / вниз</dt><dd>Гучність</dd>
                            <dt>F</dt><dd>Повний екран</dd>
                            <dt>M</dt><dd>Звук вкл/викл</dd>
                            <dt>N / PgDn</dt><dd>Наступне відео</dd>
                            <dt>P / PgUp</dt><dd>Попереднє відео</dd>
                            <dt>S</dt><dd>Скріншот</dd>
                            <dt>?</dt><dd>Ця підказка</dd>
                        </dl>
                    </div>
                </div>
            )}

            <div className={`controls-wrapper ${showControls ? '' : 'hidden'}`}>
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
                    onNext={onNext}
                    onPrev={onPrev}
                    onShowHelp={() => setShowHelpOverlay(true)}
                    abPointA={abPointA}
                    abPointB={abPointB}
                    onSetAbA={setAbAAtCurrentTime}
                    onSetAbB={setAbBAtCurrentTime}
                    onResetAb={() => { setAbPointA(null); setAbPointB(null); }}
                />

                <div className="subtitle-control-container">
                    <input
                        type="file"
                        accept=".srt"
                        id="subtitle-upload"
                        className="subtitle-upload-input"
                        onChange={handleSubtitleUpload}
                        aria-label="Завантажити субтитри"
                    />
                    <label
                        htmlFor="subtitle-upload"
                        className="subtitle-btn"
                        title="Завантажити субтитри (.srt)"
                        aria-label="Завантажити субтитри"
                    >
                        <Captions size={20} />
                    </label>

                    <button
                        onClick={() => { void takeScreenshot(); }}
                        className="subtitle-btn subtitle-btn-spaced"
                        title="Зробити скріншот (S)"
                        aria-label="Зробити скріншот"
                    >
                        <Camera size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
