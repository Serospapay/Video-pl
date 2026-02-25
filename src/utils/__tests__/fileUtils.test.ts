import { describe, it, expect } from 'vitest';
import {
  getFileName,
  isVideoFile,
  pathToFileUrl,
  isValidFilePath,
  getFileExtension,
  formatFileSize,
} from '../fileUtils';

describe('fileUtils', () => {
  it('extracts file name from paths', () => {
    expect(getFileName('C:\\\\videos\\\\movie.mp4')).toBe('movie.mp4');
    expect(getFileName('/home/user/movie.mp4')).toBe('movie.mp4');
    expect(getFileName('movie.mp4')).toBe('movie.mp4');
  });

  it('detects video files by extension', () => {
    expect(isVideoFile('movie.mp4')).toBe(true);
    expect(isVideoFile('movie.MKV')).toBe(true);
    expect(isVideoFile('image.png')).toBe(false);
    expect(isVideoFile('no-extension')).toBe(false);
  });

  it('builds media protocol URL from path', () => {
    const url = pathToFileUrl('C:\\\\videos\\\\my movie.mp4');
    expect(url.startsWith('media://')).toBe(true);
    expect(decodeURIComponent(url.replace('media://', ''))).toContain('C:/videos/my movie.mp4');
  });

  it('validates file paths', () => {
    expect(isValidFilePath('C:\\\\videos\\\\movie.mp4')).toBe(true);
    expect(isValidFilePath('../secret.txt')).toBe(false);
    expect(isValidFilePath('file<bad>.mp4')).toBe(false);
  });

  it('returns file extension in lowercase', () => {
    expect(getFileExtension('movie.MP4')).toBe('mp4');
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
    expect(getFileExtension('no-extension')).toBe('');
  });

  it('formats file size in human readable format', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });
});

