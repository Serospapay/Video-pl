import { useState, useEffect } from 'react';
import type { DragEvent } from 'react';
import { TitleBar } from './components/TitleBar/TitleBar';
import { Player } from './components/Player/Player';
import { Playlist } from './components/Playlist/Playlist';
import { Upload, List } from 'lucide-react';
import { saveState, loadState } from './utils/storage';
import './App.css';

function App() {
  const [playlist, setPlaylist] = useState<string[]>(() => loadState('playlist', []));
  const [currentIndex, setCurrentIndex] = useState<number>(() => loadState('currentIndex', -1));
  const [showPlaylist, setShowPlaylist] = useState(true);

  // Playlist modes
  const [isLooping, setIsLooping] = useState(() => loadState('isLooping', false));
  const [isShuffling, setIsShuffling] = useState(() => loadState('isShuffling', false));

  // Save state on changes
  useEffect(() => {
    saveState('playlist', playlist);
    saveState('currentIndex', currentIndex);
    saveState('isLooping', isLooping);
    saveState('isShuffling', isShuffling);
  }, [playlist, currentIndex, isLooping, isShuffling]);

  const handleOpenFile = async () => {
    const filePath = await window.electron.openFile();
    if (filePath) {
      // Ensure we use file:/// for Windows paths to be safe
      const path = `file:///${filePath.replace(/\\/g, '/')}`;
      setPlaylist(prev => [...prev, path]);
      if (currentIndex === -1) {
        setCurrentIndex(playlist.length); // It will be the next index
      }
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const videoFiles = files.filter(f => f.type.startsWith('video/'));

    if (videoFiles.length > 0) {
      const newPaths = videoFiles.map(f => {
        // @ts-expect-error
        const path = f.path;
        // Use file:/// for local paths
        return path ? `file:///${path.replace(/\\/g, '/')}` : URL.createObjectURL(f);
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

  const playItem = (index: number) => {
    setCurrentIndex(index);
  };

  const removeItem = (index: number) => {
    setPlaylist(prev => prev.filter((_, i) => i !== index));
    if (currentIndex === index) {
      setCurrentIndex(-1); // Stop playing if removed
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
      className="app-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <TitleBar />
      <div className="main-layout">
        <div className="content">
          {currentSrc ? (
            <Player src={currentSrc} onEnded={handleVideoEnded} />
          ) : (
            <div className="empty-state">
              <button onClick={handleOpenFile} className="open-button">
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
            // Pass mode props here (need to update Playlist component first)
            isLooping={isLooping}
            isShuffling={isShuffling}
            onToggleLoop={() => setIsLooping(!isLooping)}
            onToggleShuffle={() => setIsShuffling(!isShuffling)}
          />
        )}
      </div>

      <button
        className="playlist-toggle"
        onClick={() => setShowPlaylist(!showPlaylist)}
      >
        <List size={20} />
      </button>
    </div>
  );
}

export default App;
