import { describe, it, expect, beforeEach } from 'vitest';
import {
  getVideoHistory,
  saveVideoPosition,
  getVideoProgress,
} from '../watchHistory';

describe('watchHistory utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null history for unknown video', () => {
    expect(getVideoHistory('unknown')).toBeNull();
  });

  it('saves and retrieves video position', () => {
    saveVideoPosition('video1', 10, 100);
    const history = getVideoHistory('video1');

    expect(history).not.toBeNull();
    expect(history?.position).toBe(10);
    expect(history?.duration).toBe(100);
    expect(history?.completed).toBe(false);
  });

  it('marks video as completed when watching >=95%', () => {
    saveVideoPosition('video2', 95, 100);
    const history = getVideoHistory('video2');

    expect(history).not.toBeNull();
    expect(history?.completed).toBe(true);
    expect(history?.position).toBe(0);
  });

  it('returns correct progress percentage', () => {
    saveVideoPosition('video1', 25, 100);
    expect(getVideoProgress('video1')).toBe(25);
  });

  it('returns 0 progress when no history or zero duration', () => {
    expect(getVideoProgress('unknown')).toBe(0);

    saveVideoPosition('video1', 0, 0);
    expect(getVideoProgress('video1')).toBe(0);
  });
});

