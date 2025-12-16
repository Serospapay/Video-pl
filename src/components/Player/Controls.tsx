import React from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, PictureInPicture, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { PLAYBACK_SPEEDS } from '../../utils/constants';

interface ControlsProps {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    isFullscreen: boolean;
    playbackRate: number;
    onPlayPause: () => void;
    onSeek: (time: number) => void;
    onVolumeChange: (volume: number) => void;
    onToggleMute: () => void;
    onToggleFullscreen: () => void;
    onPlaybackRateChange: (rate: number) => void;
    onTogglePiP: () => void;
}

const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const Controls: React.FC<ControlsProps> = ({
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    playbackRate,
    onPlayPause,
    onSeek,
    onVolumeChange,
    onToggleMute,
    onToggleFullscreen,
    onPlaybackRateChange,
    onTogglePiP,
}) => {
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    return (
        <motion.div
            className="controls-container glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="progress-bar-container">
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="progress-bar"
                    aria-label="Video progress"
                    title={`${formatTime(currentTime)} / ${formatTime(duration)}`}
                />
            </div>

            <div className="controls-row">
                <div className="controls-left">
                    <motion.button
                        onClick={onPlayPause}
                        className="control-button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </motion.button>

                    <div className="volume-control">
                        <motion.button
                            onClick={onToggleMute}
                            className="control-button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                        >
                            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </motion.button>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={(e) => onVolumeChange(Number(e.target.value))}
                            className="volume-slider"
                            aria-label="Volume"
                            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                        />
                    </div>

                    <span className="time-display" aria-label="Current time and duration">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>

                <div className="controls-right">
                    <div className="speed-control-wrapper">
                        <motion.button
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            className="control-button speed-button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={`Playback speed: ${playbackRate}x`}
                            title={`Playback speed: ${playbackRate}x`}
                        >
                            <Gauge size={18} />
                            <span className="speed-text">{playbackRate}x</span>
                        </motion.button>

                        <AnimatePresence>
                            {showSpeedMenu && (
                                <motion.div
                                    className="speed-menu glass"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    role="menu"
                                    aria-label="Playback speed options"
                                >
                                    {PLAYBACK_SPEEDS.map(speed => (
                                        <button
                                            key={speed}
                                            onClick={() => {
                                                onPlaybackRateChange(speed);
                                                setShowSpeedMenu(false);
                                            }}
                                            className={`speed-option ${playbackRate === speed ? 'active' : ''}`}
                                            role="menuitem"
                                            aria-label={`Set speed to ${speed}x`}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.button
                        onClick={onTogglePiP}
                        className="control-button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Picture in Picture"
                        aria-label="Toggle picture in picture"
                    >
                        <PictureInPicture size={20} />
                    </motion.button>

                    <motion.button
                        onClick={onToggleFullscreen}
                        className="control-button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
                    >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};
