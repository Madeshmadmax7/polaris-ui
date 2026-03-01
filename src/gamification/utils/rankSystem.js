/**
 * Rank System Utility — Daily Energy Ranks
 * Maps daily XP (0–100) to rank titles.
 * 100 = full energy, 0 = depleted.
 */

const RANK_TIERS = [
    { minXP: 90, title: 'Laser Focused', color: '#22c55e', glow: '#22c55e' },
    { minXP: 70, title: 'Deep Worker', color: '#34d399', glow: '#34d399' },
    { minXP: 50, title: 'Balanced', color: '#f59e0b', glow: '#f59e0b' },
    { minXP: 30, title: 'Drifting', color: '#f97316', glow: '#f97316' },
    { minXP: 0, title: 'Distracted', color: '#ef4444', glow: '#ef4444' },
];

/**
 * Get the rank info for a given daily XP (0–100)
 */
export function getRank(dailyXP) {
    for (let i = 0; i < RANK_TIERS.length; i++) {
        if (dailyXP >= RANK_TIERS[i].minXP) {
            return { ...RANK_TIERS[i], tier: RANK_TIERS.length - i };
        }
    }
    return { ...RANK_TIERS[RANK_TIERS.length - 1], tier: 1 };
}

/**
 * Get current "level" within daily XP (0–10 scale)
 */
export function getLevel(dailyXP) {
    return Math.floor(dailyXP / 10);
}

/**
 * Get XP progress — for the daily system it's simply current/100
 */
export function getLevelProgress(dailyXP) {
    return {
        current: dailyXP,
        max: 100,
        percentage: dailyXP,
    };
}

/**
 * Get the next rank info
 */
export function getNextRank(dailyXP) {
    const sortedAsc = [...RANK_TIERS].reverse();
    for (const tier of sortedAsc) {
        if (dailyXP < tier.minXP) {
            return { title: tier.title, xpNeeded: tier.minXP - dailyXP };
        }
    }
    return null;
}

export { RANK_TIERS };
