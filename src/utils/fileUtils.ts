import { VIDEO_EXTENSIONS } from './constants';

export type VideoExtension = (typeof VIDEO_EXTENSIONS)[number];

/**
 * Extract filename from a file path (supports both Windows and Unix paths)
 */
export const getFileName = (path: string): string => {
    const name = path.split(/[/\\]/).pop();
    return name ? decodeURIComponent(name) : path;
};

/**
 * Validate if a file path is a video file based on extension
 */
export const isVideoFile = (path: string): path is `${string}.${VideoExtension}` => {
    const extension = path.split('.').pop()?.toLowerCase() as VideoExtension | undefined;
    return extension ? VIDEO_EXTENSIONS.includes(extension) : false;
};

/**
 * Convert a local file path to media:// URL for Electron protocol
 */
export const pathToFileUrl = (path: string): string => {
    const normalizedPath = path
        .replace(/\\/g, '/')
        .replace(/\/{2,}/g, '/');
    const encodedPath = encodeURIComponent(normalizedPath);
    return `media://${encodedPath}`;
};

/**
 * Validate file path (basic security check)
 */
export const isValidFilePath = (path: string): boolean => {
    if (!path || typeof path !== 'string') return false;

    // Check for suspicious patterns
    const suspiciousPatterns = [
        /\.\./,  // Parent directory traversal
        /[<>"|?*]/,  // Invalid Windows filename characters
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(path));
};

/**
 * Get file extension from path
 */
export const getFileExtension = (path: string): string => {
    if (!path.includes('.')) {
        return '';
    }
    const extension = path.split('.').pop()?.toLowerCase();
    return extension ?? '';
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
