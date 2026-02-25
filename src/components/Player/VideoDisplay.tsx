import React, { forwardRef } from 'react';

interface VideoDisplayProps {
    src: string;
    onClick: () => void;
    onDoubleClick: () => void;
    onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
    onEnded: () => void;
    onError?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
    onLoadStart?: () => void;
    onCanPlay?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
}

export const VideoDisplay = forwardRef<HTMLVideoElement, VideoDisplayProps>(
    ({ src, onClick, onDoubleClick, onTimeUpdate, onLoadedMetadata, onEnded, onError, onLoadStart, onCanPlay, onPlay, onPause }, ref) => {
        return (
            <video
                ref={ref}
                src={src}
                className="video-element"
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={onEnded}
                onError={onError}
                onLoadStart={onLoadStart}
                onCanPlay={onCanPlay}
                onPlay={onPlay}
                onPause={onPause}
                aria-label="Відеоплеєр"
            />
        );
    }
);

VideoDisplay.displayName = 'VideoDisplay';
