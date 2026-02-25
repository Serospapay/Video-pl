import { useState, useEffect } from 'react';
import type { DragEvent } from 'react';
import { TitleBar } from './components/TitleBar/TitleBar';
import { Player } from './components/Player/Player';
import { Playlist } from './components/Playlist/Playlist';
import { Upload, List } from 'lucide-react';
import { saveState, loadState } from './utils/storage';
import { pathToFileUrl, isValidFilePath, isVideoFile } from './utils/fileUtils';
import { getVideoHistory } from './utils/watchHistory';
import { STORAGE_KEYS } from './utils/constants';
import './App.css';

// Extend File interface to include path property (Electron specific)
interface ElectronFile extends File {
  path?: string;
}

function App() {
  const [playlist, setPlaylist] = useState<string[]>(() =>
    loadState(STORAGE_KEYS.PLAYLIST, [])
  );
  const [currentIndex, setCurrentIndex] = useState<number>(() =>
    loadState(STORAGE_KEYS.CURRENT_INDEX, -1)
  );
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Playlist modes
  const [isLooping, setIsLooping] = useState(() =>
    loadState(STORAGE_KEYS.IS_LOOPING, false)
  );
  const [isShuffling, setIsShuffling] = useState(() =>
    loadState(STORAGE_KEYS.IS_SHUFFLING, false)
  );

  // Save state on changes
  useEffect(() => {
    saveState(STORAGE_KEYS.PLAYLIST, playlist);
    saveState(STORAGE_KEYS.CURRENT_INDEX, currentIndex);
    saveState(STORAGE_KEYS.IS_LOOPING, isLooping);
    saveState(STORAGE_KEYS.IS_SHUFFLING, isShuffling);
  }, [playlist, currentIndex, isLooping, isShuffling]);

  const handleOpenFile = async () => {
    try {
      const filePath = await window.electron.openFile();
      if (filePath && isValidFilePath(filePath)) {
        const fileUrl = pathToFileUrl(filePath);
        setPlaylist(prev => {
          setCurrentIndex((idx) => (idx === -1 ? prev.length : idx));
          return [...prev, fileUrl];
        });
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files) as ElectronFile[];
    const videoFiles = files.filter((f) => {
      if (f.type.startsWith('video/')) return true;
      if (f.path) return isVideoFile(f.path);
      return isVideoFile(f.name);
    });

    if (videoFiles.length > 0) {
      const newPaths = videoFiles.map(f => {
        const path = f.path;
        if (path && isValidFilePath(path)) {
          return pathToFileUrl(path);
        }
        // Fallback to blob URL for non-Electron environments
        return URL.createObjectURL(f);
      });

      setPlaylist(prev => {
        setCurrentIndex((idx) => (idx === -1 ? prev.length : idx));
        return [...prev, ...newPaths];
      });
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the app container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const playItem = (index: number) => {
    setCurrentIndex(index);
  };

  const removeItem = (index: number) => {
    setPlaylist(prev => prev.filter((_, i) => i !== index));
    if (currentIndex === index) {
      setCurrentIndex(-1);
    } else if (currentIndex > index) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleVideoEnded = () => {
    if (playlist.length === 0) return;

    if (isShuffling) {
      const nextIndex = Math.floor(Math.random() * playlist.length);
      setCurrentIndex(nextIndex);
    } else if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isLooping) {
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prevIndex) => {
      if (isShuffling) {
        if (playlist.length <= 1) return prevIndex;
        let nextIndex = prevIndex;
        while (nextIndex === prevIndex) {
          nextIndex = Math.floor(Math.random() * playlist.length);
        }
        return nextIndex;
      }
      if (prevIndex < playlist.length - 1) return prevIndex + 1;
      if (isLooping) return 0;
      return prevIndex;
    });
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prevIndex) => {
      if (isShuffling) {
        if (playlist.length <= 1) return prevIndex;
        let nextIndex = prevIndex;
        while (nextIndex === prevIndex) {
          nextIndex = Math.floor(Math.random() * playlist.length);
        }
        return nextIndex;
      }
      if (prevIndex > 0) return prevIndex - 1;
      if (isLooping) return playlist.length - 1;
      return prevIndex;
    });
  };

  const handleClearPlaylist = () => {
    setPlaylist([]);
    setCurrentIndex(-1);
  };

  const handleClearWatched = () => {
    const watchedUrls = new Set(
      playlist.filter((url) => getVideoHistory(url)?.completed === true)
    );
    if (watchedUrls.size === 0) return;
    const newPlaylist = playlist.filter((url) => !watchedUrls.has(url));
    setPlaylist(newPlaylist);
    const oldUrl = currentIndex >= 0 ? playlist[currentIndex] : null;
    if (oldUrl && watchedUrls.has(oldUrl)) {
      setCurrentIndex(newPlaylist.length > 0 ? 0 : -1);
    } else if (oldUrl) {
      const idx = newPlaylist.indexOf(oldUrl);
      setCurrentIndex(idx >= 0 ? idx : Math.max(0, newPlaylist.length - 1));
    } else {
      setCurrentIndex(-1);
    }
  };

  const currentSrc = currentIndex !== -1 && playlist[currentIndex] ? playlist[currentIndex] : null;

  return (
    <div
      className={`app-container ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <TitleBar />
      <div className="main-layout">
        <div className="content">
          {currentSrc ? (
            <Player
              key={currentSrc}
              src={currentSrc}
              onEnded={handleVideoEnded}
              onNext={playlist.length > 1 ? handleNext : undefined}
              onPrev={playlist.length > 1 ? handlePrev : undefined}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-header">
                <h1 className="empty-title">Додайте перше відео</h1>
                <p className="empty-subtitle">
                  Виберіть файл з диска або перетягніть його у вікно
                </p>
              </div>
              <button
                onClick={() => { void handleOpenFile(); }}
                className="open-button"
                aria-label="Відкрити відеофайл"
              >
                <Upload size={40} />
                <span>Відкрити відео</span>
              </button>
              <div className="empty-shortcuts">
                <span className="shortcuts-title">Гарячі клавіші</span>
                <div className="shortcuts-grid">
                  <span>Пробіл</span>
                  <span>Пуск / пауза</span>
                  <span>J / L</span>
                  <span>Перемотка назад / вперед</span>
                  <span>↑ / ↓</span>
                  <span>Гучність</span>
                  <span>F</span>
                  <span>Повний екран</span>
                  <span>M</span>
                  <span>Звук вкл/викл</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {showPlaylist && (
          <Playlist
            items={playlist}
            currentIndex={currentIndex}
            onItemClick={playItem}
            onRemoveItem={removeItem}
            onAddFile={() => { void handleOpenFile(); }}
            onClearPlaylist={handleClearPlaylist}
            onClearWatched={handleClearWatched}
            isLooping={isLooping}
            isShuffling={isShuffling}
            onToggleLoop={() => setIsLooping(!isLooping)}
            onToggleShuffle={() => setIsShuffling(!isShuffling)}
          />
        )}
      </div>

      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-overlay-content">
            <Upload size={64} />
            <p>Перетягніть відеофайли сюди</p>
          </div>
        </div>
      )}

      <button
        className="playlist-toggle"
        onClick={() => setShowPlaylist(!showPlaylist)}
        aria-label={showPlaylist ? 'Сховати плейлист' : 'Показати плейлист'}
        title={showPlaylist ? 'Сховати плейлист' : 'Показати плейлист'}
      >
        <List size={20} />
      </button>
    </div>
  );
}

export default App;
