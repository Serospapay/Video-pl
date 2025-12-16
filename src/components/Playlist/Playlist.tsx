import React from 'react';
import { Plus, Play, Trash2, Repeat, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFileName } from '../../utils/fileUtils';
import { getVideoProgress } from '../../utils/watchHistory';
import './Playlist.css';

interface PlaylistProps {
    items: string[];
    currentIndex: number;
    onItemClick: (index: number) => void;
    onRemoveItem: (index: number) => void;
    onAddFile: () => void;
    isLooping: boolean;
    isShuffling: boolean;
    onToggleLoop: () => void;
    onToggleShuffle: () => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
    items,
    currentIndex,
    onItemClick,
    onRemoveItem,
    onAddFile,
    isLooping,
    isShuffling,
    onToggleLoop,
    onToggleShuffle
}) => {
    return (
        <motion.div
            className="playlist-container glass"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
            <div className="playlist-header">
                <h2>Playlist</h2>
                <div className="playlist-actions">
                    <button
                        onClick={onToggleShuffle}
                        className={`action-button ${isShuffling ? 'active' : ''}`}
                        title="Shuffle"
                        aria-label={isShuffling ? 'Disable shuffle' : 'Enable shuffle'}
                    >
                        <Shuffle size={18} />
                    </button>
                    <button
                        onClick={onToggleLoop}
                        className={`action-button ${isLooping ? 'active' : ''}`}
                        title="Loop Playlist"
                        aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
                    >
                        <Repeat size={18} />
                    </button>
                    <button
                        onClick={onAddFile}
                        className="add-button"
                        title="Add video"
                        aria-label="Add video to playlist"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            <div className="playlist-items">
                <AnimatePresence>
                    {items.map((item, index) => {
                        const progress = getVideoProgress(item);

                        return (
                            <motion.div
                                key={`${item}-${index}`}
                                className={`playlist-item ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => onItemClick(index)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Play ${getFileName(item)}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onItemClick(index);
                                    }
                                }}
                            >
                                <div className="item-info">
                                    {index === currentIndex && <Play size={12} className="playing-indicator" />}
                                    <span className="item-name" title={getFileName(item)}>
                                        {getFileName(item)}
                                    </span>
                                </div>
                                {progress > 0 && (
                                    <div className="progress-indicator" style={{ width: `${progress}%` }} />
                                )}
                                <button
                                    className="remove-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveItem(index);
                                    }}
                                    aria-label={`Remove ${getFileName(item)}`}
                                    title="Remove from playlist"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {items.length === 0 && (
                    <div className="empty-playlist">
                        <p>No videos in playlist</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
