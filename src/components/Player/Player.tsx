import React, { useRef, useState, useEffect, useCallback } from 'react';
import { VideoDisplay } from './VideoDisplay';
import { Controls } from './Controls';
import { parseSRT, type Subtitle } from '../../utils/SubtitleParser';
import { saveState, loadState } from '../../utils/storage';
import { Captions } from 'lucide-react';
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

    // Load initial state
    const [volume, setVolume] = useState(() => loadState('player_volume', 1));
    const [isMuted, setIsMuted] = useState(() => loadState('player_muted', false));
    const [playbackRate, setPlaybackRate] = useState(() => loadState('player_speed', 1));

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Subtitles state
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
            videoRef.current.playbackRate = playbackRate;
        }
        // Save state
        saveState('player_volume', volume);
        saveState('player_muted', isMuted);
        saveState('player_speed', playbackRate);
    }, [volume, isMuted, playbackRate]);

    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
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

    const handleSeek = useCallback((time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const handleVolumeChange = useCallback((newVolume: number) => {
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(!isMuted);
    }, [isMuted]);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
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
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else if (videoRef.current) {
            await videoRef.current.requestPictureInPicture();
        }
    }, []);

    const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setSubtitles(parseSRT(text));
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
        }, 3000);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.code) {
                case 'Space':
                case 'KeyK':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handleSeek(Math.min(duration, currentTime + 5));
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handleSeek(Math.max(0, currentTime - 5));
                    break;
                case 'KeyL':
                    handleSeek(Math.min(duration, currentTime + 10));
                    break;
                case 'KeyJ':
                    handleSeek(Math.max(0, currentTime - 10));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    handleVolumeChange(Math.min(1, volume + 0.1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    handleVolumeChange(Math.max(0, volume - 0.1));
                    break;
                case 'KeyF':
                    toggleFullscreen();
                    break;
                case 'KeyM':
                    toggleMute();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, currentTime, duration, volume, togglePlay, handleSeek, handleVolumeChange, toggleFullscreen, toggleMute]);

    return (
        <div
            className="player-container"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            tabIndex={0}
        >
            <VideoDisplay
                ref={videoRef}
                src={src}
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                    setIsPlaying(false);
                    onEnded?.();
                }}
            />

            {currentSubtitle && (
                <div className="subtitle-overlay">
                    {currentSubtitle}
                </div>
            )}

            <div className={`controls-wrapper ${showControls ? 'visible' : 'hidden'}`}>
                <div className="subtitle-control-container">
                    <input
                        type="file"
                        accept=".srt"
                        id="subtitle-upload"
                        style={{ display: 'none' }}
                        onChange={handleSubtitleUpload}
                    />
                    <label htmlFor="subtitle-upload" className="control-button subtitle-btn" title="Upload Subtitles (.srt)">
                        <Captions size={20} />
                    </label>
                </div>

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
            </div>
        </div>
    );
};
