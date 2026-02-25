import { describe, it, expect } from 'vitest';
import { parseSRT, secondsToTimeString } from '../SubtitleParser';

const sampleSrt = `
1
00:00:01,000 --> 00:00:03,000
Hello world!

2
00:00:04.500 --> 00:00:06.000
Second line
`.trim();

describe('SubtitleParser', () => {
  it('parses valid SRT into subtitles', () => {
    const subs = parseSRT(sampleSrt);

    expect(subs).toHaveLength(2);
    expect(subs[0].id).toBe('1');
    expect(subs[0].text).toBe('Hello world!');
    expect(subs[0].startTime).toBeCloseTo(1);
    expect(subs[0].endTime).toBeCloseTo(3);

    expect(subs[1].id).toBe('2');
    expect(subs[1].startTime).toBeCloseTo(4.5);
    expect(subs[1].endTime).toBeCloseTo(6);
  });

  it('returns empty array for invalid data', () => {
    // @ts-expect-error intentional invalid input
    expect(parseSRT(null)).toEqual([]);
    expect(parseSRT('')).toEqual([]);
  });

  it('skips invalid blocks gracefully', () => {
    const invalid = `
invalid block without timing

1
00:00:01,000 --> 00:00:02,000
Valid line
`.trim();

    const subs = parseSRT(invalid);
    expect(subs).toHaveLength(1);
    expect(subs[0].id).toBe('1');
  });

  it('formats seconds to SRT time string', () => {
    expect(secondsToTimeString(0)).toBe('00:00:00,000');
    expect(secondsToTimeString(1.5)).toBe('00:00:01,500');
    expect(secondsToTimeString(3661.123)).toBe('01:01:01,123');
  });
});

