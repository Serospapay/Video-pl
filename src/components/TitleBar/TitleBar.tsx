import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import './TitleBar.css';

interface TitleBarProps {
    title?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ title = 'Video Player' }) => {
    const handleMinimize = () => window.electron.minimize();
    const handleMaximize = () => window.electron.maximize();
    const handleClose = () => window.electron.close();

    return (
        <div className="titlebar">
            <div className="titlebar-drag-region">
                <span className="titlebar-title">{title}</span>
            </div>
            <div className="titlebar-controls">
                <button
                    onClick={handleMinimize}
                    className="titlebar-button"
                    title="Згорнути"
                    aria-label="Згорнути вікно"
                >
                    <Minus size={16} />
                </button>
                <button
                    onClick={handleMaximize}
                    className="titlebar-button"
                    title="Розгорнути"
                    aria-label="Розгорнути вікно"
                >
                    <Square size={14} />
                </button>
                <button
                    onClick={handleClose}
                    className="titlebar-button close"
                    title="Закрити"
                    aria-label="Закрити вікно"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
