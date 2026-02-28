import { memo, useMemo, useState, useEffect } from 'react';
import { Flame, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { productivity } from '../../api';

/**
 * Focus Heatmap — Full-year, real API data only.
 * Grid generation simplified: iterate day-by-day from 364 days ago to today.
 */

const WEEKS_TO_SHOW = 52;
const DAYS_IN_WEEK = 7;
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getColor(minutes) {
    if (!minutes || minutes === 0) return 'rgba(255,255,255,0.04)';
    if (minutes <= 10) return '#064e3b';
    if (minutes <= 60) return '#059669';
    return '#34d399';
}

/** Format Date as YYYY-MM-DD in LOCAL timezone */
function toDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Add N days to a date (returns new Date) */
function addDays(date, n) {
    const result = new Date(date.getTime());
    result.setDate(result.getDate() + n);
    return result;
}

/**
 * Build the heatmap grid:
 * 1. Find today
 * 2. Go back to find the Monday that starts the grid (52 weeks ago from this week's Monday)
 * 3. Iterate day-by-day, grouping into weeks
 */
function buildGrid(focusHistory) {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Noon to avoid DST edge cases
    const todayStr = toDateStr(today);

    // Find this week's Monday (or today if Monday)
    const todayDow = today.getDay(); // 0=Sun, 1=Mon, ...
    const daysFromMonday = todayDow === 0 ? 6 : todayDow - 1;
    const thisMonday = addDays(today, -daysFromMonday);

    // Grid starts 51 weeks before this Monday (to show 52 total weeks)
    const gridStart = addDays(thisMonday, -(WEEKS_TO_SHOW - 1) * 7);

    const weeks = [];
    let current = new Date(gridStart.getTime());

    for (let w = 0; w < WEEKS_TO_SHOW; w++) {
        const week = [];
        for (let d = 0; d < DAYS_IN_WEEK; d++) {
            const dateStr = toDateStr(current);
            const minutes = focusHistory[dateStr] || 0;
            const isFuture = dateStr > todayStr;
            week.push({
                date: dateStr,
                minutes,
                color: isFuture ? 'rgba(255,255,255,0.02)' : getColor(minutes),
                label: isFuture ? 'Future' : (minutes > 0 ? `${Math.round(minutes)} min` : 'No activity'),
                isFuture,
            });
            current = addDays(current, 1);
        }
        weeks.push(week);
    }

    return weeks;
}

function getMonthLabels(grid) {
    const labels = [];
    let lastMonth = -1;
    grid.forEach((week, wi) => {
        // Use the first day (Monday) of each week to determine month
        const parts = week[0].date.split('-');
        const m = parseInt(parts[1], 10) - 1;
        if (m !== lastMonth) {
            labels.push({ month: MONTH_NAMES[m], weekIndex: wi });
            lastMonth = m;
        }
    });
    return labels;
}

function FocusHeatmapInner() {
    const [focusHistory, setFocusHistory] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            try {
                const trendData = await productivity.getTrend(365);
                if (!cancelled && trendData?.scores?.length > 0) {
                    const history = {};
                    trendData.scores.forEach((score) => {
                        const mins = Math.round(score.total_active_minutes || 0);
                        if (mins > 0) {
                            history[score.date] = mins;
                        }
                    });
                    // Debug: log what dates we got from API
                    console.log('[Heatmap] API dates:', Object.keys(history));
                    console.log('[Heatmap] API data:', history);
                    setFocusHistory(history);
                }
            } catch (err) {
                console.log('[Heatmap] API error:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        try { localStorage.removeItem('focusHistory'); } catch { /* ignore */ }
        fetchData();
        return () => { cancelled = true; };
    }, []);

    const grid = useMemo(() => {
        const g = buildGrid(focusHistory);
        // Debug: log last week of grid dates
        if (g.length > 0) {
            const lastWeek = g[g.length - 1];
            console.log('[Heatmap] Last week grid dates:', lastWeek.map(d => d.date));
            console.log('[Heatmap] Last week minutes:', lastWeek.map(d => d.minutes));
        }
        return g;
    }, [focusHistory]);

    const monthLabels = useMemo(() => getMonthLabels(grid), [grid]);

    const totalMinutes = useMemo(() =>
        Object.values(focusHistory).reduce((sum, v) => sum + (v || 0), 0),
        [focusHistory]);

    const activeDays = useMemo(() =>
        Object.values(focusHistory).filter(v => v > 0).length,
        [focusHistory]);

    const longestStreak = useMemo(() => {
        const dates = Object.keys(focusHistory).filter(d => focusHistory[d] > 0).sort();
        let max = 0, cur = 0;
        for (let i = 0; i < dates.length; i++) {
            if (i === 0) { cur = 1; }
            else {
                const diff = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000;
                cur = Math.round(diff) === 1 ? cur + 1 : 1;
            }
            max = Math.max(max, cur);
        }
        return max;
    }, [focusHistory]);

    if (loading) {
        return (
            <div style={{ ...styles.container, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={20} color="rgba(255,255,255,0.2)" strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>Focus Activity</h3>
                <div style={styles.statsRow}>
                    <div style={styles.stat}>
                        <Flame size={14} color="#34d399" strokeWidth={2} />
                        <span style={styles.statValue}>{Math.round(totalMinutes / 60)}h</span>
                        <span style={styles.statLabel}>Total</span>
                    </div>
                    <div style={styles.stat}>
                        <Calendar size={14} color="#34d399" strokeWidth={2} />
                        <span style={styles.statValue}>{activeDays}</span>
                        <span style={styles.statLabel}>Active Days</span>
                    </div>
                    <div style={styles.stat}>
                        <TrendingUp size={14} color="#34d399" strokeWidth={2} />
                        <span style={styles.statValue}>{longestStreak}</span>
                        <span style={styles.statLabel}>Best Streak</span>
                    </div>
                </div>
            </div>

            {/* Month labels */}
            <div style={styles.monthRow}>
                <div style={{ width: '32px', flexShrink: 0 }} />
                <div style={styles.monthLabelsContainer}>
                    {monthLabels.map((ml, i) => (
                        <span key={i} style={{
                            ...styles.monthLabel,
                            left: `${(ml.weekIndex / WEEKS_TO_SHOW) * 100}%`,
                        }}>
                            {ml.month}
                        </span>
                    ))}
                </div>
            </div>

            <div style={styles.heatmapWrapper}>
                <div style={styles.dayLabels}>
                    {DAY_LABELS.map((label, i) => (
                        <span key={i} style={styles.dayLabel}>{label}</span>
                    ))}
                </div>

                <div style={styles.grid}>
                    {grid.map((week, wi) => (
                        <div key={wi} style={styles.weekColumn}>
                            {week.map((day) => (
                                <div
                                    key={day.date}
                                    style={{
                                        ...styles.cell,
                                        background: day.color,
                                        opacity: day.isFuture ? 0.3 : 1,
                                    }}
                                    title={`${day.date}: ${day.label}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div style={styles.legend}>
                <span style={styles.legendLabel}>Less</span>
                {['rgba(255,255,255,0.04)', '#064e3b', '#059669', '#34d399'].map((c, i) => (
                    <div key={i} style={{ ...styles.legendCell, background: c }} />
                ))}
                <span style={styles.legendLabel}>More</span>
            </div>

            {activeDays === 0 && (
                <div style={styles.emptyState}>
                    No focus data yet. Start using the extension to track your activity.
                </div>
            )}
        </div>
    );
}

const FocusHeatmap = memo(FocusHeatmapInner);
FocusHeatmap.displayName = 'FocusHeatmap';
export default FocusHeatmap;

const styles = {
    container: {
        padding: '24px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.12)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
    },
    title: {
        margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff',
        textTransform: 'uppercase', letterSpacing: '0.15em',
        fontFamily: "'Outfit', sans-serif",
    },
    statsRow: { display: 'flex', gap: '20px' },
    stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' },
    statValue: { fontSize: '16px', fontWeight: 800, color: '#34d399', fontFamily: "'Outfit', sans-serif" },
    statLabel: { fontSize: '8px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Outfit', sans-serif" },
    monthRow: { display: 'flex', marginBottom: '4px' },
    monthLabelsContainer: { position: 'relative', flex: 1, height: '18px' },
    monthLabel: { position: 'absolute', top: 0, fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    heatmapWrapper: { display: 'flex', gap: '4px' },
    dayLabels: { display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 },
    dayLabel: { fontSize: '9px', color: 'rgba(255,255,255,0.2)', height: '14px', display: 'flex', alignItems: 'center', fontFamily: "'Outfit', sans-serif", width: '28px' },
    grid: {
        display: 'grid',
        gridTemplateColumns: `repeat(${WEEKS_TO_SHOW}, 1fr)`,
        gap: '3px',
        flex: 1,
    },
    weekColumn: { display: 'flex', flexDirection: 'column', gap: '3px' },
    cell: {
        width: '100%', aspectRatio: '1 / 1', borderRadius: '3px',
        transition: 'all 0.15s ease', minHeight: '14px',
    },
    legend: { display: 'flex', alignItems: 'center', gap: '4px', marginTop: '16px', justifyContent: 'flex-end' },
    legendLabel: { fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif", margin: '0 4px' },
    legendCell: { width: '12px', height: '12px', borderRadius: '3px' },
    emptyState: {
        marginTop: '16px', padding: '16px', textAlign: 'center', fontSize: '11px',
        color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif",
        background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
    },
};
