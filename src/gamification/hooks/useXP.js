import { useContext } from 'react';
import { XPContext } from '../context/XPContext';

/**
 * Hook to access the XP system.
 * Must be used within an XPProvider.
 *
 * XP Rules Reference:
 *   Increase:
 *     +10 → learning video watched
 *     +20 → completed focus session
 *     +15 → quiz passed
 *     +5  → stayed within focus time
 *   Decrease:
 *     -10 → distraction video watched
 *     -3  → neutral video watched
 *     -5  → rapid switch (<30s)
 *     -3  → skipped >50%
 *
 * @returns {{ totalXP: number, level: number, increaseXP: (n: number) => void, decreaseXP: (n: number) => void, handleVideoClassification: (type: string) => void }}
 */
export function useXP() {
    const context = useContext(XPContext);
    if (!context) {
        throw new Error('useXP must be used within an XPProvider');
    }
    return context;
}
