import { useState, useEffect } from 'react';
import type { DragEvent } from 'react';
import { TitleBar } from './components/TitleBar/TitleBar';
import { Player } from './components/Player/Player';
import { Playlist } from './components/Playlist/Playlist';
import { Upload, List } from 'lucide-react';
import { saveState, loadState } from './utils/storage';
import { pathToFileUrl, isValidFilePath } from './utils/fileUtils';
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
        setPlaylist(prev => [...prev, fileUrl]);
        if (currentIndex === -1) {
          setCurrentIndex(playlist.length);
        }
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
    const videoFiles = files.filter(f => f.type.startsWith('video/'));

    if (videoFiles.length > 0) {
      const newPaths = videoFiles.map(f => {
        const path = f.path;
        if (path && isValidFilePath(path)) {
          return pathToFileUrl(path);
        }
        // Fallback to blob URL for non-Electron environments
        return URL.createObjectURL(f);
      });

      setPlaylist(prev => [...prev, ...newPaths]);
      if (currentIndex === -1) {
        setCurrentIndex(playlist.length);
      }
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
            <Player src={currentSrc} onEnded={handleVideoEnded} />
          ) : (
            <div className="empty-state">
              <button onClick={handleOpenFile} className="open-button" aria-label="Open video file">
                <Upload size={48} />
                <span>Open Video</span>
              </button>
              <p className="drag-hint">or drag and drop here</p>
            </div>
          )}
        </div>

        {showPlaylist && (
          <Playlist
            items={playlist}
            currentIndex={currentIndex}
            onItemClick={playItem}
            onRemoveItem={removeItem}
            onAddFile={handleOpenFile}
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
            <p>Drop video files here</p>
          </div>
        </div>
      )}

      <button
        className="playlist-toggle"
        onClick={() => setShowPlaylist(!showPlaylist)}
        aria-label={showPlaylist ? 'Hide playlist' : 'Show playlist'}
        title={showPlaylist ? 'Hide playlist' : 'Show playlist'}
      >
        <List size={20} />
      </button>
    </div>
  );
}

export default App;
