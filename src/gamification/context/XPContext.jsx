import { createContext, useState, useCallback, useMemo, useEffect } from 'react';

const XP_STORAGE_KEY = 'polaris_xp_total';

/**
 * XP Context for the gamification system.
 * Provides totalXP, level, increaseXP, decreaseXP, and video classification handlers.
 * Persists to localStorage.
 *
 * Video Classification XP Logic:
 *   - Learning/educational video → +10 XP (encourages productive viewing)
 *   - Distraction video          → -10 XP (strongest penalty)
 *   - Neutral video              → -3 XP  (light penalty, less than distraction)
 *
 * Other XP Events:
 *   +20 → completed focus session
 *   +15 → quiz passed
 *   +5  → stayed within focus time
 *   -5  → rapid switch (<30s)
 *   -3  → skipped >50%
 */
export const XPContext = createContext(null);

function loadXP() {
    try {
        const stored = localStorage.getItem(XP_STORAGE_KEY);
        if (stored !== null) {
            const parsed = parseInt(stored, 10);
            return isNaN(parsed) ? 0 : Math.max(0, parsed);
        }
    } catch {
        // localStorage may be unavailable
    }
    return 0;
}

export function XPProvider({ children }) {
    const [totalXP, setTotalXP] = useState(() => loadXP());

    // Persist XP to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(XP_STORAGE_KEY, String(totalXP));
        } catch {
            // Silently fail if localStorage is full
        }
    }, [totalXP]);

    const increaseXP = useCallback((points) => {
        if (typeof points !== 'number' || points <= 0) return;
        setTotalXP((prev) => prev + Math.floor(points));
    }, []);

    const decreaseXP = useCallback((points) => {
        if (typeof points !== 'number' || points <= 0) return;
        setTotalXP((prev) => Math.max(0, prev - Math.floor(points)));
    }, []);

    /**
     * Handle video classification XP changes.
     * @param {'learning'|'distraction'|'neutral'} classification
     */
    const handleVideoClassification = useCallback((classification) => {
        switch (classification) {
            case 'learning':
                // Reward: educational content viewed
                setTotalXP((prev) => prev + 10);
                break;
            case 'distraction':
                // Strongest penalty: distraction video watched
                setTotalXP((prev) => Math.max(0, prev - 10));
                break;
            case 'neutral':
                // Light penalty: neutral — not productive but not harmful
                setTotalXP((prev) => Math.max(0, prev - 3));
                break;
            default:
                break;
        }
    }, []);

    const level = Math.floor(totalXP / 100);

    const value = useMemo(
        () => ({ totalXP, level, increaseXP, decreaseXP, handleVideoClassification }),
        [totalXP, level, increaseXP, decreaseXP, handleVideoClassification]
    );

    return (
        <XPContext.Provider value={value}>
            {children}
        </XPContext.Provider>
    );
}
