import React from 'react';
import { X, Plus, Play, Trash2, Repeat, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const getFileName = (path: string) => {
        // Handle both Windows and Unix paths
        const name = path.split(/[/\\]/).pop();
        return name ? decodeURIComponent(name) : path;
    };

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
                    >
                        <Shuffle size={18} />
                    </button>
                    <button
                        onClick={onToggleLoop}
                        className={`action-button ${isLooping ? 'active' : ''}`}
                        title="Loop Playlist"
                    >
                        <Repeat size={18} />
                    </button>
                    <button onClick={onAddFile} className="add-button">
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            <div className="playlist-items">
                <AnimatePresence>
                    {items.map((item, index) => (
                        <motion.div
                            key={`${item}-${index}`}
                            className={`playlist-item ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => onItemClick(index)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="item-info">
                                {index === currentIndex && <Play size={12} className="playing-indicator" />}
                                <span className="item-name">
                                    {decodeURIComponent(item.split('/').pop() || '')}
                                </span>
                            </div>
                            <button
                                className="remove-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveItem(index);
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </motion.div>
                    ))}
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
