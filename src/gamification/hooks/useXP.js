import { useContext } from 'react';
import { XPContext } from '../context/XPContext';

/**
 * Hook to access the Daily XP system.
 * Must be used within an XPProvider.
 *
 * Daily Focus Energy (0–100):
 *   Starts at 100 each day. Decreases with distractions.
 *
 *   Decrease:
 *     -10 → distraction video watched
 *     -3  → neutral video watched
 *     -5  → rapid switch (<30s)
 *     -3  → skipped >50%
 *   Increase (cap 100):
 *     +10 → learning video watched
 *     +20 → completed focus session
 *     +15 → quiz passed
 *     +5  → stayed within focus time
 *
 * Weekend Reward:
 *   weekAvg >= 70 → eligible for weekend free time
 *   activateRewardMode(minutes) → disables blocking for N minutes
 *   deactivateRewardMode() → re-enables blocking
 *
 * @returns {{
 *   totalXP: number,
 *   level: number,
 *   maxXP: number,
 *   increaseXP: (n: number) => void,
 *   decreaseXP: (n: number) => void,
 *   handleVideoClassification: (type: string) => void,
 *   rewardMode: object|null,
 *   activateRewardMode: (minutes: number) => void,
 *   deactivateRewardMode: () => void,
 *   weekAvg: number,
 *   isRewardEligible: boolean,
 * }}
 */
export function useXP() {
    const context = useContext(XPContext);
    if (!context) {
        throw new Error('useXP must be used within an XPProvider');
    }
    return context;
}
