import { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { productivity } from '../../api';

const XP_STORAGE_KEY = 'polaris_daily_xp';
const REWARD_STORAGE_KEY = 'polaris_reward_mode';
const MAX_DAILY_XP = 100;

/**
 * XP Context — Daily Focus Energy System
 *
 * XP is computed from REAL backend productivity data:
 *   XP = round(100 × productive_minutes / total_active_minutes)
 *
 * If you have 99 min productive + 70 min neutral + 1 min distraction:
 *   total = 170 mins, XP = round(100 × 99/170) = 58
 *
 * The bar starts FULL (100) if you haven't browsed yet.
 * As you browse, XP reflects your productive ratio.
 *
 * WEEKEND REWARD SYSTEM:
 *   If user maintained high avg XP during the week, they get "Reward Mode"
 *   — blocking disabled for a set time period. Tracking continues.
 */
export const XPContext = createContext(null);

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Load reward mode state
 */
function loadRewardMode() {
    try {
        const raw = localStorage.getItem(REWARD_STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data.expiresAt && new Date(data.expiresAt) > new Date()) {
            return data;
        }
        localStorage.removeItem(REWARD_STORAGE_KEY);
    } catch { /* ignore */ }
    return null;
}

/**
 * Get the average XP for the past week
 */
function getWeekAvgXP() {
    try {
        const raw = localStorage.getItem('polaris_xp_history');
        if (!raw) return MAX_DAILY_XP;
        const history = JSON.parse(raw);
        const last7 = history.slice(-7);
        if (last7.length === 0) return MAX_DAILY_XP;
        const sum = last7.reduce((acc, d) => acc + d.xp, 0);
        return Math.round(sum / last7.length);
    } catch {
        return MAX_DAILY_XP;
    }
}

/**
 * Archive each day's final XP into weekly history
 */
function archiveDayXP(dateKey, xp) {
    try {
        const historyKey = 'polaris_xp_history';
        const raw = localStorage.getItem(historyKey);
        const history = raw ? JSON.parse(raw) : [];
        // Don't add duplicate dates
        if (!history.find(h => h.date === dateKey)) {
            history.push({ date: dateKey, xp });
        }
        localStorage.setItem(historyKey, JSON.stringify(history.slice(-14)));
    } catch { /* ignore */ }
}

export function XPProvider({ children }) {
    const [totalXP, setTotalXP] = useState(MAX_DAILY_XP); // Start full
    const [rewardMode, setRewardMode] = useState(() => loadRewardMode());
    const pollRef = useRef(null);
    const lastDateRef = useRef(getTodayKey());

    /**
     * Compute XP from backend productivity data.
     * XP = 100 + productive_bonus - neutral_penalty - distraction_penalty
     * Productive videos actively INCREASE XP.
     * If no activity yet, XP = 100 (full)
     */
    const fetchAndComputeXP = useCallback(async () => {
        try {
            const data = await productivity.getToday();
            const prodMins = data.productive_minutes || 0;
            const neutralMins = data.neutral_minutes || 0;
            const distractMins = data.distracting_minutes || 0;
            const totalMins = prodMins + neutralMins + distractMins;

            if (totalMins <= 0) {
                // No activity yet today — bar stays full
                setTotalXP(MAX_DAILY_XP);
                return;
            }

            // ADDITIVE MODEL:
            // Start at 100.
            // Productive time INCREASES XP:  +0.3 per minute
            // Neutral time DECREASES XP:     -0.5 per minute
            // Distraction time DECREASES XP: -2.0 per minute
            //
            // Example: 99min prod + 70min neutral + 1min distract
            //   = 100 + (99×0.3) - (70×0.5) - (1×2.0) = 100 + 29.7 - 35 - 2 = 92.7 → 93
            // After 10 more productive mins: +3 XP → 96
            const productiveBonus = prodMins * 0.3;
            const neutralPenalty = neutralMins * 0.5;
            const distractionPenalty = distractMins * 2.0;

            const xp = Math.round(100 + productiveBonus - neutralPenalty - distractionPenalty);
            const clampedXP = Math.max(0, Math.min(MAX_DAILY_XP, xp));

            setTotalXP(clampedXP);

            // Save to localStorage for history
            try {
                localStorage.setItem(XP_STORAGE_KEY, JSON.stringify({
                    date: getTodayKey(),
                    xp: clampedXP,
                }));
            } catch { /* ignore */ }
        } catch {
            // API error — keep current XP
        }
    }, []);

    // Initial fetch + periodic polling (every 60s)
    useEffect(() => {
        fetchAndComputeXP();

        pollRef.current = setInterval(() => {
            // Check for day change
            const today = getTodayKey();
            if (lastDateRef.current !== today) {
                // Archive yesterday's XP
                try {
                    const raw = localStorage.getItem(XP_STORAGE_KEY);
                    if (raw) {
                        const data = JSON.parse(raw);
                        archiveDayXP(data.date, data.xp);
                    }
                } catch { /* ignore */ }
                lastDateRef.current = today;
            }

            fetchAndComputeXP();

            // Check if reward mode expired
            setRewardMode(prev => {
                if (prev && prev.expiresAt && new Date(prev.expiresAt) <= new Date()) {
                    localStorage.removeItem(REWARD_STORAGE_KEY);
                    return null;
                }
                return prev;
            });
        }, 60000);

        return () => clearInterval(pollRef.current);
    }, [fetchAndComputeXP]);

    // Manual XP adjustments (for quiz, focus session, etc.)
    const increaseXP = useCallback((points) => {
        if (typeof points !== 'number' || points <= 0) return;
        setTotalXP(prev => Math.min(MAX_DAILY_XP, prev + Math.floor(points)));
    }, []);

    const decreaseXP = useCallback((points) => {
        if (typeof points !== 'number' || points <= 0) return;
        setTotalXP(prev => Math.max(0, prev - Math.floor(points)));
    }, []);

    /**
     * Handle video classification — triggers immediate re-fetch
     */
    const handleVideoClassification = useCallback((classification) => {
        // Small immediate adjustment for responsiveness, then refetch
        switch (classification) {
            case 'learning':
                setTotalXP(prev => Math.min(MAX_DAILY_XP, prev + 5));
                break;
            case 'distraction':
                setTotalXP(prev => Math.max(0, prev - 5));
                break;
            case 'neutral':
                setTotalXP(prev => Math.max(0, prev - 2));
                break;
            default:
                break;
        }
        // Refetch from backend after a short delay for accurate data
        setTimeout(() => fetchAndComputeXP(), 3000);
    }, [fetchAndComputeXP]);

    /**
     * Activate reward mode (free browsing for N minutes)
     */
    const activateRewardMode = useCallback((durationMinutes = 30) => {
        const reward = {
            active: true,
            activatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + durationMinutes * 60000).toISOString(),
            durationMinutes,
        };
        localStorage.setItem(REWARD_STORAGE_KEY, JSON.stringify(reward));
        setRewardMode(reward);
        window.postMessage({ type: 'POLARIS_REWARD_MODE', active: true, expiresAt: reward.expiresAt }, '*');
    }, []);

    const deactivateRewardMode = useCallback(() => {
        localStorage.removeItem(REWARD_STORAGE_KEY);
        setRewardMode(null);
        window.postMessage({ type: 'POLARIS_REWARD_MODE', active: false }, '*');
    }, []);

    const level = Math.floor(totalXP / 10); // 0-10
    const weekAvg = useMemo(() => getWeekAvgXP(), [totalXP]);

    const value = useMemo(
        () => ({
            totalXP,
            level,
            maxXP: MAX_DAILY_XP,
            increaseXP,
            decreaseXP,
            handleVideoClassification,
            rewardMode,
            activateRewardMode,
            deactivateRewardMode,
            weekAvg,
            isRewardEligible: weekAvg >= 70,
            refetch: fetchAndComputeXP,
        }),
        [totalXP, level, increaseXP, decreaseXP, handleVideoClassification, rewardMode, activateRewardMode, deactivateRewardMode, weekAvg, fetchAndComputeXP]
    );

    return (
        <XPContext.Provider value={value}>
            {children}
        </XPContext.Provider>
    );
}
