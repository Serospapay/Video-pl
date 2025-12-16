export interface Subtitle {
    id: string;
    startTime: number;
    endTime: number;
    text: string;
}

export const parseSRT = (data: string): Subtitle[] => {
    const subtitles: Subtitle[] = [];
    const blocks = data.trim().split(/\n\s*\n/);

    blocks.forEach(block => {
        const lines = block.split('\n');
        if (lines.length >= 3) {
            const id = lines[0];
            const timeString = lines[1];
            const text = lines.slice(2).join('\n');

            const [start, end] = timeString.split(' --> ');

            if (start && end) {
                subtitles.push({
                    id,
                    startTime: timeStringToSeconds(start),
                    endTime: timeStringToSeconds(end),
                    text
                });
            }
        }
    });

    return subtitles;
};

const timeStringToSeconds = (timeString: string): number => {
    const [time, milliseconds] = timeString.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + (Number(milliseconds) / 1000);
};
