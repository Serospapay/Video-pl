export interface Subtitle {
    id: string;
    startTime: number;
    endTime: number;
    text: string;
}

/**
 * Parse SRT subtitle format
 * @param data - Raw SRT file content
 * @returns Array of parsed subtitles
 */
export const parseSRT = (data: string): Subtitle[] => {
    if (!data || typeof data !== 'string') {
        console.warn('Invalid SRT data provided');
        return [];
    }

    const subtitles: Subtitle[] = [];
    const blocks = data.trim().split(/\n\s*\n/);

    blocks.forEach((block, index) => {
        try {
            const lines = block.split('\n');
            if (lines.length < 3) {
                return; // Skip invalid blocks
            }

            const id = lines[0].trim();
            const timeString = lines[1].trim();
            const text = lines.slice(2).join('\n').trim();

            const [start, end] = timeString.split(' --> ');

            if (start && end) {
                const startTime = timeStringToSeconds(start);
                const endTime = timeStringToSeconds(end);

                // Validate times
                if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
                    console.warn(`Invalid subtitle timing at block ${index + 1}`);
                    return;
                }

                subtitles.push({
                    id,
                    startTime,
                    endTime,
                    text
                });
            }
        } catch (error) {
            console.warn(`Failed to parse subtitle block ${index + 1}:`, error);
        }
    });

    return subtitles;
};

/**
 * Convert SRT time string to seconds
 * Supports formats: HH:MM:SS,mmm or HH:MM:SS.mmm
 */
const timeStringToSeconds = (timeString: string): number => {
    try {
        // Support both comma and dot as millisecond separator
        const [time, milliseconds] = timeString.split(/[,\.]/);
        const [hours, minutes, seconds] = time.split(':').map(Number);

        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            throw new Error('Invalid time format');
        }

        const ms = milliseconds ? Number(milliseconds) / 1000 : 0;
        return hours * 3600 + minutes * 60 + seconds + ms;
    } catch (error) {
        console.error('Failed to parse time string:', timeString, error);
        return 0;
    }
};

/**
 * Format seconds to SRT time string (HH:MM:SS,mmm)
 */
export const secondsToTimeString = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
};
