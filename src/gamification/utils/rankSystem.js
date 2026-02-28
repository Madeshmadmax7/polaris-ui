/**
 * Rank System Utility
 * Maps total XP to rank titles for the gamification system.
 * Designed for encouragement — all titles are positive and aspirational.
 */

const RANK_TIERS = [
    { minXP: 1001, title: 'Master of Discipline', color: '#f59e0b', glow: '#f59e0b' },
    { minXP: 601, title: 'Focus Strategist', color: '#8b5cf6', glow: '#8b5cf6' },
    { minXP: 301, title: 'Deep Work Practitioner', color: '#3b82f6', glow: '#3b82f6' },
    { minXP: 101, title: 'Consistent Learner', color: '#10b981', glow: '#10b981' },
    { minXP: 0, title: 'Distracted Explorer', color: '#6b7280', glow: '#6b7280' },
];

/**
 * Get the rank info for a given XP total
 * @param {number} totalXP
 * @returns {{ title: string, color: string, glow: string, tier: number }}
 */
export function getRank(totalXP) {
    for (let i = 0; i < RANK_TIERS.length; i++) {
        if (totalXP >= RANK_TIERS[i].minXP) {
            return { ...RANK_TIERS[i], tier: RANK_TIERS.length - i };
        }
    }
    return { ...RANK_TIERS[RANK_TIERS.length - 1], tier: 1 };
}

/**
 * Get current level from XP (100 XP per level)
 * @param {number} totalXP
 * @returns {number}
 */
export function getLevel(totalXP) {
    return Math.floor(totalXP / 100);
}

/**
 * Get XP progress within the current level
 * @param {number} totalXP
 * @returns {{ current: number, max: number, percentage: number }}
 */
export function getLevelProgress(totalXP) {
    const current = totalXP % 100;
    return {
        current,
        max: 100,
        percentage: current,
    };
}

/**
 * Get the next rank info
 * @param {number} totalXP
 * @returns {{ title: string, xpNeeded: number } | null}
 */
export function getNextRank(totalXP) {
    const sortedAsc = [...RANK_TIERS].reverse();
    for (const tier of sortedAsc) {
        if (totalXP < tier.minXP) {
            return { title: tier.title, xpNeeded: tier.minXP - totalXP };
        }
    }
    return null; // Already at max rank
}

export { RANK_TIERS };
