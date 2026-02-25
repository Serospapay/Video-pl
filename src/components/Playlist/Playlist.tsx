import React, { useMemo } from 'react';
import { Plus, Play, Trash2, Repeat, Shuffle, ListX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFileName } from '../../utils/fileUtils';
import { getVideoProgress, getVideoHistory } from '../../utils/watchHistory';
import './Playlist.css';

interface PlaylistProps {
    items: string[];
    currentIndex: number;
    onItemClick: (index: number) => void;
    onRemoveItem: (index: number) => void;
    onAddFile: () => void;
    onClearPlaylist?: () => void;
    onClearWatched?: () => void;
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
    onClearPlaylist,
    onClearWatched,
    isLooping,
    isShuffling,
    onToggleLoop,
    onToggleShuffle
}) => {
    const progressMap = useMemo(() => {
        return new Map(items.map((url) => [url, getVideoProgress(url)]));
    }, [items]);

    const watchedCount = useMemo(() => {
        return items.filter((url) => getVideoHistory(url)?.completed === true).length;
    }, [items]);
    const hasClearActions = onClearPlaylist != null || onClearWatched != null;
    return (
        <motion.div
            className="playlist-container glass"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
            <div className="playlist-header">
                <h2>Плейлист</h2>
                <div className="playlist-actions">
                    <button
                        onClick={onToggleShuffle}
                        className={`action-button ${isShuffling ? 'active' : ''}`}
                        title="Перемішувати"
                        aria-label={isShuffling ? 'Вимкнути перемішування' : 'Увімкнути перемішування'}
                    >
                        <Shuffle size={18} />
                    </button>
                    <button
                        onClick={onToggleLoop}
                        className={`action-button ${isLooping ? 'active' : ''}`}
                        title="Повтор плейлиста"
                        aria-label={isLooping ? 'Вимкнути повтор' : 'Увімкнути повтор'}
                    >
                        <Repeat size={18} />
                    </button>
                    <button
                        onClick={onAddFile}
                        className="add-button"
                        title="Додати відео"
                        aria-label="Додати відео до плейлиста"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
            {items.length > 0 && hasClearActions && (
                <div className="playlist-clear-row">
                    {onClearPlaylist && (
                        <button
                            type="button"
                            className="clear-list-button"
                            onClick={onClearPlaylist}
                            title="Очистити плейлист"
                            aria-label="Очистити плейлист"
                        >
                            <Trash2 size={14} />
                            <span>Очистити все</span>
                        </button>
                    )}
                    {onClearWatched && watchedCount > 0 && (
                        <button
                            type="button"
                            className="clear-list-button watched"
                            onClick={onClearWatched}
                            title="Видалити переглянуті"
                            aria-label="Видалити переглянуті з плейлиста"
                        >
                            <ListX size={14} />
                            <span>Видалити переглянуті ({watchedCount})</span>
                        </button>
                    )}
                </div>
            )}
            <div className="playlist-items">
                <AnimatePresence>
                    {items.map((item, index) => {
                        const progress = progressMap.get(item) ?? 0;

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
                                aria-label={`Відтворити ${getFileName(item)}`}
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
                                    aria-label={`Видалити ${getFileName(item)}`}
                                    title="Видалити з плейлиста"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {items.length === 0 && (
                    <div className="empty-playlist">
                        <p>Немає відео в плейлисті</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
