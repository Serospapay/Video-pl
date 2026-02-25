/**
 * Save state to localStorage with type safety
 */
export const saveState = <T>(key: string, value: T): void => {
    try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
    } catch (error) {
        console.error(`Failed to save state for key "${key}":`, error);
    }
};

/**
 * Load state from localStorage with type safety and default value
 */
export const loadState = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        if (item === null) {
            return defaultValue;
        }
        return JSON.parse(item) as T;
    } catch (error) {
        console.error(`Failed to load state for key "${key}":`, error);
        return defaultValue;
    }
};

