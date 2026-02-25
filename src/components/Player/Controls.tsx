import React from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, PictureInPicture, Gauge, SkipBack, SkipForward, HelpCircle } from 'lucide-react';
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
    onTogglePiP: () => void | Promise<void>;
    onNext?: () => void;
    onPrev?: () => void;
    onShowHelp?: () => void;
    abPointA: number | null;
    abPointB: number | null;
    onSetAbA: () => void;
    onSetAbB: () => void;
    onResetAb: () => void;
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
    onNext,
    onPrev,
    onShowHelp,
    abPointA,
    abPointB,
    onSetAbA,
    onSetAbB,
    onResetAb,
}) => {
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const hasAb = abPointA !== null && abPointB !== null;
    const canSeek = duration > 0;

    const handleSeekChange = (value: string) => {
        const percent = Number(value);
        if (!Number.isFinite(percent) || !canSeek) return;
        const clampedPercent = Math.max(0, Math.min(percent, 100));
        const targetTime = (clampedPercent / 100) * duration;
        onSeek(targetTime);
    };

    return (
        <motion.div
            className="controls-container glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="ab-repeat-row">
                <button
                    type="button"
                    className={`control-button ab-btn ${abPointA !== null ? 'active' : ''}`}
                    onClick={onSetAbA}
                    title={`A: ${formatTime(abPointA ?? currentTime)}`}
                    aria-label="Позначити точку A"
                    disabled={!canSeek}
                >
                    A
                </button>
                <button
                    type="button"
                    className={`control-button ab-btn ${abPointB !== null ? 'active' : ''}`}
                    onClick={onSetAbB}
                    title={`B: ${formatTime(abPointB ?? currentTime)}`}
                    aria-label="Позначити точку B"
                    disabled={!canSeek}
                >
                    B
                </button>
                {hasAb && (
                    <button
                        type="button"
                        className="control-button ab-btn reset"
                        onClick={onResetAb}
                        title="Скинути A-B"
                        aria-label="Скинути A-B повтор"
                    >
                        Скинути A-B
                    </button>
                )}
            </div>
            <div className="progress-bar-container">
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={duration > 0 ? (currentTime / duration) * 100 : 0}
                    onChange={(e) => handleSeekChange(e.target.value)}
                    className="progress-bar"
                    aria-label="Прогрес відео"
                    title={`${formatTime(currentTime)} / ${formatTime(duration)}`}
                    disabled={!canSeek}
                />
            </div>

            <div className="controls-row">
                <div className="controls-left">
                    {onPrev && (
                        <motion.button
                            onClick={onPrev}
                            className="control-button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Попереднє відео"
                            title="Попереднє (P / PgUp)"
                        >
                            <SkipBack size={20} />
                        </motion.button>
                    )}
                    <motion.button
                        onClick={onPlayPause}
                        className="control-button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={isPlaying ? 'Пауза' : 'Відтворити'}
                        title={isPlaying ? 'Пауза (Space)' : 'Відтворити (Space)'}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </motion.button>
                    {onNext && (
                        <motion.button
                            onClick={onNext}
                            className="control-button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Наступне відео"
                            title="Наступне (N / PgDn)"
                        >
                            <SkipForward size={20} />
                        </motion.button>
                    )}

                    <div className="volume-control">
                        <motion.button
                            onClick={onToggleMute}
                            className="control-button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}
                            title={isMuted ? 'Увімкнути звук (M)' : 'Вимкнути звук (M)'}
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
                            aria-label="Гучність"
                            title={`Гучність: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                        />
                    </div>

                    <span className="time-display" aria-label="Поточний час і тривалість">
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
                            aria-label={`Швидкість відтворення: ${playbackRate}x`}
                            title={`Швидкість відтворення: ${playbackRate}x`}
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
                                >
                                    {PLAYBACK_SPEEDS.map(speed => (
                                        <button
                                            key={speed}
                                            onClick={() => {
                                                onPlaybackRateChange(speed);
                                                setShowSpeedMenu(false);
                                            }}
                                            className={`speed-option ${playbackRate === speed ? 'active' : ''}`}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.button
                        onClick={() => { void onTogglePiP(); }}
                        className="control-button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Картинка в картинці"
                        aria-label="Перемкнути режим картинка в картинці"
                    >
                        <PictureInPicture size={20} />
                    </motion.button>

                    <motion.button
                        onClick={onToggleFullscreen}
                        className="control-button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={isFullscreen ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'}
                        title={isFullscreen ? 'Вийти з повноекранного режиму (F)' : 'Повноекранний режим (F)'}
                    >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </motion.button>
                    {onShowHelp && (
                        <motion.button
                            onClick={onShowHelp}
                            className="control-button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Допомога"
                            title="Допомога (?)"
                        >
                            <HelpCircle size={20} />
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
