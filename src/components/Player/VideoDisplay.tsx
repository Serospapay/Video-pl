import React, { forwardRef } from 'react';

interface VideoDisplayProps {
    src: string;
    onClick: () => void;
    onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
    onEnded: () => void;
}

export const VideoDisplay = forwardRef<HTMLVideoElement, VideoDisplayProps>(
    ({ src, onClick, onTimeUpdate, onLoadedMetadata, onEnded }, ref) => {
        return (
            <video
                ref={ref}
                src={src}
                className="video-element"
                onClick={onClick}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={onEnded}
            />
        );
    }
);
