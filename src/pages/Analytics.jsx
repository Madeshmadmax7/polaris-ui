import { useMemo, useState, useEffect } from 'react';
import { Zap, Target, Award, Monitor, CheckCircle, Timer, RotateCcw, ShieldOff, SkipForward, TrendingUp, TrendingDown, Flame, BarChart2, BookOpen, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import FocusHeatmap from '../gamification/components/FocusHeatmap';
import AvatarEvolution from '../gamification/components/AvatarEvolution';
import { useXP } from '../gamification/hooks/useXP';
import { getRank, getLevelProgress, getNextRank } from '../gamification/utils/rankSystem';
import { productivity } from '../api';

/**
 * Analytics Page — lucide-react icons, subtle white borders.
 * Contains: Focus Heatmap, XP Summary, Current Rank, Avatar Evolution
 * Lazy loaded.
 */

export default function Analytics() {
    const { totalXP, level } = useXP();
    const rank = useMemo(() => getRank(totalXP), [totalXP]);
    const progress = useMemo(() => getLevelProgress(totalXP), [totalXP]);
    const nextRank = useMemo(() => getNextRank(totalXP), [totalXP]);
    const completionPercentage = useMemo(() => Math.min(100, Math.floor(totalXP / 10)), [totalXP]);

    // ── New feature state ──
    const [streak, setStreak] = useState(null);
    const [weeklyReport, setWeeklyReport] = useState(null);
    const [velocity, setVelocity] = useState(null);
    const [topicHeatmap, setTopicHeatmap] = useState(null);
    const [reportExpanded, setReportExpanded] = useState(false);

    useEffect(() => {
        productivity.getStreak().then(setStreak).catch(() => {});
        productivity.getWeeklyReport().then(setWeeklyReport).catch(() => {});
        productivity.getLearningVelocity(30).then(setVelocity).catch(() => {});
        productivity.getTopicHeatmap().then(setTopicHeatmap).catch(() => {});
    }, []);

    return (
        <div style={styles.container}>
            {/* Page Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>Analytics</h1>
                <p style={styles.subtitle}>
                    Track your focus patterns, growth, and mastery progress.
                </p>
            </div>

            {/* Top Stats Grid */}
            <div style={styles.statsGrid}>
                {/* XP Card */}
                <div style={styles.statCard}>
                    <Zap size={22} color={rank.color} strokeWidth={1.5} />
                    <div style={styles.statContent}>
                        <span style={styles.statValue}>{totalXP}</span>
                        <span style={styles.statLabel}>Total XP</span>
                    </div>
                    <div style={styles.miniBar}>
                        <div style={{
                            ...styles.miniBarFill,
                            width: `${progress.percentage}%`,
                            background: `linear-gradient(90deg, ${rank.color}88, ${rank.color})`,
                        }} />
                    </div>
                </div>

                {/* Level Card */}
                <div style={styles.statCard}>
                    <Target size={22} color="#3b82f6" strokeWidth={1.5} />
                    <div style={styles.statContent}>
                        <span style={styles.statValue}>{level}</span>
                        <span style={styles.statLabel}>Current Level</span>
                    </div>
                    <div style={styles.levelProgress}>
                        {progress.current}/100 XP to next level
                    </div>
                </div>

                {/* Rank Card */}
                <div style={{
                    ...styles.statCard,
                    borderColor: `${rank.color}25`,
                    background: `linear-gradient(135deg, ${rank.color}06, transparent)`,
                }}>
                    <Award size={22} color={rank.color} strokeWidth={1.5} />
                    <div style={styles.statContent}>
                        <span style={{ ...styles.statValue, color: rank.color, fontSize: '16px' }}>
                            {rank.title}
                        </span>
                        <span style={styles.statLabel}>Current Rank</span>
                    </div>
                    {nextRank && (
                        <div style={styles.nextRank}>
                            {nextRank.xpNeeded} XP to <span style={{ color: 'rgba(255,255,255,0.5)' }}>{nextRank.title}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Avatar Section */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Evolution Status</h2>
                <AvatarEvolution completionPercentage={completionPercentage} />
            </div>

            {/* Heatmap Section */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Focus Calendar</h2>
                <FocusHeatmap />
            </div>

            {/* XP Breakdown */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>XP Guide</h2>
                <div style={styles.xpGuideGrid}>
                    <div style={styles.xpGuideSection}>
                        <h4 style={styles.guideHeader}>
                            <TrendingUp size={12} color="#34d399" strokeWidth={2} style={{ marginRight: '6px' }} />
                            How to Earn
                        </h4>
                        {[
                            { action: 'Watch learning video (90%+)', xp: '+10 XP', Icon: Monitor },
                            { action: 'Complete focus session', xp: '+20 XP', Icon: Target },
                            { action: 'Pass a quiz', xp: '+15 XP', Icon: CheckCircle },
                            { action: 'Stay within focus time', xp: '+5 XP', Icon: Timer },
                        ].map((item) => (
                            <div key={item.action} style={styles.xpRule}>
                                <item.Icon size={14} color="rgba(255,255,255,0.35)" strokeWidth={1.5} />
                                <span style={styles.ruleAction}>{item.action}</span>
                                <span style={{ ...styles.ruleXP, color: '#34d399' }}>{item.xp}</span>
                            </div>
                        ))}
                    </div>
                    <div style={styles.xpGuideSection}>
                        <h4 style={styles.guideHeader}>
                            <TrendingDown size={12} color="#f87171" strokeWidth={2} style={{ marginRight: '6px' }} />
                            What to Avoid
                        </h4>
                        {[
                            { action: 'Watch distraction video', xp: '-10 XP', Icon: ShieldOff },
                            { action: 'Watch neutral video', xp: '-3 XP', Icon: RotateCcw },
                            { action: 'Rapid switch (<30s)', xp: '-5 XP', Icon: RotateCcw },
                            { action: 'Skipped >50%', xp: '-3 XP', Icon: SkipForward },
                        ].map((item) => (
                            <div key={item.action} style={styles.xpRule}>
                                <item.Icon size={14} color="rgba(255,255,255,0.35)" strokeWidth={1.5} />
                                <span style={styles.ruleAction}>{item.action}</span>
                                <span style={{ ...styles.ruleXP, color: '#f87171' }}>{item.xp}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═ STREAK SECTION ═ */}
            {streak && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Learning Streak</h2>
                    <div style={styles.statsGrid}>
                        <div style={{ ...styles.statCard, borderColor: streak.current_streak > 0 ? 'rgba(251,146,60,0.3)' : 'rgba(255,255,255,0.12)' }}>
                            <Flame size={22} color={streak.current_streak > 0 ? '#fb923c' : 'rgba(255,255,255,0.2)'} strokeWidth={1.5} />
                            <div style={styles.statContent}>
                                <span style={{ ...styles.statValue, color: streak.current_streak > 0 ? '#fb923c' : '#fff' }}>{streak.current_streak}</span>
                                <span style={styles.statLabel}>Current Streak (days)</span>
                            </div>
                            <div style={styles.levelProgress}>{streak.today_active ? '✅ Active today' : '⚠️ No activity today yet'}</div>
                        </div>
                        <div style={styles.statCard}>
                            <TrendingUp size={22} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
                            <div style={styles.statContent}>
                                <span style={styles.statValue}>{streak.longest_streak}</span>
                                <span style={styles.statLabel}>Longest Streak</span>
                            </div>
                            <div style={styles.levelProgress}>Best ever run</div>
                        </div>
                        <div style={styles.statCard}>
                            <Activity size={22} color="rgba(255,255,255,0.45)" strokeWidth={1.5} />
                            <div style={styles.statContent}>
                                <span style={styles.statValue}>{streak.total_active_days}</span>
                                <span style={styles.statLabel}>Total Active Days</span>
                            </div>
                            <div style={styles.levelProgress}>Last: {streak.last_active_date || 'Never'}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═ WEEKLY REPORT ═ */}
            {weeklyReport && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Weekly Report</h2>
                    <div style={{ ...styles.statCard, cursor: 'pointer' }} onClick={() => setReportExpanded(e => !e)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{weeklyReport.this_week.productive_minutes}m</div>
                                    <div style={styles.statLabel}>Productive Time</div>
                                    {weeklyReport.vs_last_week.productive_minutes_change !== null && (
                                        <div style={{ fontSize: '9px', color: weeklyReport.vs_last_week.productive_minutes_change >= 0 ? '#34d399' : '#f87171', marginTop: '2px' }}>
                                            {weeklyReport.vs_last_week.productive_minutes_change >= 0 ? '▲' : '▼'} {Math.abs(weeklyReport.vs_last_week.productive_minutes_change)}% vs last week
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{weeklyReport.this_week.chapters_completed}</div>
                                    <div style={styles.statLabel}>Chapters Done</div>
                                    {weeklyReport.vs_last_week.chapters_change !== null && (
                                        <div style={{ fontSize: '9px', color: weeklyReport.vs_last_week.chapters_change >= 0 ? '#34d399' : '#f87171', marginTop: '2px' }}>
                                            {weeklyReport.vs_last_week.chapters_change >= 0 ? '▲' : '▼'} {Math.abs(weeklyReport.vs_last_week.chapters_change)}% vs last week
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{weeklyReport.this_week.active_days}</div>
                                    <div style={styles.statLabel}>Active Days</div>
                                </div>
                                {weeklyReport.this_week.quiz_average !== null && (
                                    <div>
                                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{weeklyReport.this_week.quiz_average}%</div>
                                        <div style={styles.statLabel}>Quiz Average</div>
                                    </div>
                                )}
                            </div>
                            {reportExpanded ? <ChevronUp size={16} color='rgba(255,255,255,0.3)' /> : <ChevronDown size={16} color='rgba(255,255,255,0.3)' />}
                        </div>
                        {reportExpanded && weeklyReport.this_week.top_topics.length > 0 && (
                            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                <div style={{ ...styles.statLabel, marginBottom: '10px' }}>Top Topics This Week</div>
                                {weeklyReport.this_week.top_topics.map((t, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{t.title}</span>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{Math.round(t.seconds / 60)}m</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═ LEARNING VELOCITY GRAPH ═ */}
            {velocity && velocity.days.length > 0 && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Learning Velocity — Last 30 Days</h2>
                    <div style={styles.statCard}>
                        <div style={{ display: 'flex', gap: '32px', marginBottom: '24px', flexWrap: 'wrap', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{velocity.total_completed}</div>
                                <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>Total Chapters</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{velocity.peak_day}</div>
                                <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>Peak Day</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{velocity.avg_per_day}</div>
                                <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>Avg / Day</div>
                            </div>
                        </div>
                        <VelocityGraph data={velocity.days} />
                    </div>
                </div>
            )}

            {/* ═ TOPIC COVERAGE HEATMAP ═ */}
            {topicHeatmap && topicHeatmap.plans.length > 0 && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Topic Coverage</h2>
                    {topicHeatmap.plans.map(plan => (
                        <div key={plan.plan_id} style={{ ...styles.statCard, marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>{plan.plan_title}</span>
                                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>{plan.total_watch_formatted}</span>
                            </div>
                            {plan.topics.map(t => (
                                <div key={t.chapter} style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                            <div style={{
                                                width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                                                background: t.is_completed ? '#fff' : 'transparent',
                                                border: t.is_completed ? '1.5px solid #fff' : '1.5px solid rgba(255,255,255,0.2)',
                                            }} />
                                            <span style={{ fontSize: '11px', color: t.is_completed ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
                                                {t.title}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.18)', flexShrink: 0, paddingLeft: '12px' }}>
                                            {Math.round(t.watched_seconds / 60)}m
                                            {t.playback_rate !== 1.0 ? <span style={{ color: 'rgba(255,255,255,0.1)' }}> · {t.playback_rate}x</span> : ''}
                                        </span>
                                    </div>
                                    <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${t.watch_pct}%`, background: t.is_completed ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)', borderRadius: '2px', transition: 'width 1.2s ease' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── VelocityGraph (SVG bar + rolling avg line) ─────────
function VelocityGraph({ data }) {
    const W = 620, H = 120, PAD_X = 2, PAD_Y = 8;
    const maxVal = Math.max(1, ...data.map(d => d.chapters));
    const slotW = (W - PAD_X * 2) / data.length;
    const barW = Math.max(2, slotW * 0.45);
    const xOf = i => PAD_X + i * slotW + slotW / 2;
    const yOf = v => H - PAD_Y - (v / maxVal) * (H - PAD_Y * 2);

    // smooth path for rolling avg
    const avgPts = data
        .map((d, i) => d.rolling_avg != null ? [xOf(i), yOf(d.rolling_avg)] : null)
        .filter(Boolean);
    let avgPath = '';
    if (avgPts.length > 1) {
        avgPath = avgPts.reduce((acc, [x, y], i) => {
            if (i === 0) return `M${x},${y}`;
            const [px, py] = avgPts[i - 1];
            const cx = (px + x) / 2;
            return `${acc} C${cx},${py} ${cx},${y} ${x},${y}`;
        }, '');
    }

    return (
        <div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '120px', display: 'block' }}>
                {/* baseline */}
                <line x1={PAD_X} y1={H - PAD_Y} x2={W - PAD_X} y2={H - PAD_Y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                {data.map((d, i) => {
                    const bH = Math.max(d.chapters > 0 ? 2 : 0, (d.chapters / maxVal) * (H - PAD_Y * 2));
                    return (
                        <rect
                            key={i}
                            x={xOf(i) - barW / 2}
                            y={H - PAD_Y - bH}
                            width={barW}
                            height={bH}
                            rx="1.5"
                            fill={d.chapters > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.04)'}
                        />
                    );
                })}
                {avgPath && (
                    <path
                        d={avgPath}
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="4 3"
                    />
                )}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>{data[0]?.date}</span>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'rgba(255,255,255,0.6)', borderRadius: '2px' }} />
                        Daily chapters
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ display: 'inline-block', width: '14px', height: '1.5px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', marginBottom: '1px' }} />
                        Rolling avg
                    </span>
                </div>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>{data[data.length - 1]?.date}</span>
            </div>
        </div>
    );
}

// ── Styles ──────────────────────────────────────────────
const styles = {
    container: {
        minHeight: '100vh',
        background: '#000',
        padding: '48px 24px',
        fontFamily: "'Outfit', sans-serif",
        maxWidth: '1000px',
        margin: '0 auto',
    },
    header: {
        marginBottom: '40px',
    },
    title: {
        margin: 0,
        fontSize: '28px',
        fontWeight: 800,
        color: '#fff',
        letterSpacing: '-0.02em',
    },
    subtitle: {
        margin: '8px 0 0',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.35)',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '40px',
    },
    statCard: {
        padding: '24px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    statContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    statValue: {
        fontSize: '28px',
        fontWeight: 800,
        color: '#fff',
        lineHeight: 1,
    },
    statLabel: {
        fontSize: '10px',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
    },
    miniBar: {
        width: '100%',
        height: '4px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '4px',
        overflow: 'hidden',
    },
    miniBarFill: {
        height: '100%',
        borderRadius: '4px',
        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    levelProgress: {
        fontSize: '9px',
        color: 'rgba(255,255,255,0.2)',
    },
    nextRank: {
        fontSize: '9px',
        color: 'rgba(255,255,255,0.2)',
    },
    xpGuideGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
    },
    xpGuideSection: {
        padding: '20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.12)',
    },
    guideHeader: {
        margin: '0 0 14px',
        fontSize: '11px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        display: 'flex',
        alignItems: 'center',
    },
    xpRule: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    ruleAction: {
        flex: 1,
        fontSize: '12px',
        color: 'rgba(255,255,255,0.5)',
    },
    ruleXP: {
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: "'Outfit', sans-serif",
    },
    section: {
        marginBottom: '40px',
    },
    sectionTitle: {
        margin: '0 0 16px',
        fontSize: '10px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
    },
};
