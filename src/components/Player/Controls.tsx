import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, PictureInPicture, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

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
                />
            </div>

            <div className="controls-row">
                <div className="controls-left">
                    <motion.button
                        onClick={onPlayPause}
                        className="control-button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </motion.button>

                    <div className="volume-control">
                        <motion.button
                            onClick={onToggleMute}
                            className="control-button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
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
                        />
                    </div>

                    <span className="time-display">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>

                <div className="controls-right">
                    <div className="speed-control-wrapper" style={{ position: 'relative' }}>
                        <motion.button
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            className="control-button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Gauge size={20} />
                            <span style={{ fontSize: '12px', marginLeft: '4px' }}>{playbackRate}x</span>
                        </motion.button>

                        <AnimatePresence>
                            {showSpeedMenu && (
                                <motion.div
                                    className="speed-menu glass"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: -10 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        marginBottom: '8px'
                                    }}
                                >
                                    {speeds.map(speed => (
                                        <button
                                            key={speed}
                                            onClick={() => {
                                                onPlaybackRateChange(speed);
                                                setShowSpeedMenu(false);
                                            }}
                                            className={`speed-option ${playbackRate === speed ? 'active' : ''}`}
                                            style={{
                                                background: playbackRate === speed ? 'rgba(255,255,255,0.2)' : 'transparent',
                                                border: 'none',
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                textAlign: 'center'
                                            }}
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
                    >
                        <PictureInPicture size={20} />
                    </motion.button>

                    <motion.button
                        onClick={onToggleFullscreen}
                        className="control-button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};
