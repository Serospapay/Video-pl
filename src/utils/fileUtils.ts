import { VIDEO_EXTENSIONS } from './constants';

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
export const isVideoFile = (path: string): boolean => {
    const extension = path.split('.').pop()?.toLowerCase();
    return extension ? VIDEO_EXTENSIONS.includes(extension as any) : false;
};

/**
 * Convert a local file path to file:/// URL
 */
export const pathToFileUrl = (path: string): string => {
    // Normalize path separators to forward slashes
    const normalizedPath = path.replace(/\\/g, '/');
    // Ensure it starts with file:///
    return `file:///${normalizedPath}`;
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
    const extension = path.split('.').pop()?.toLowerCase();
    return extension || '';
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
