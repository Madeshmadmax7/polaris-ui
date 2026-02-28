import { useMemo } from 'react';
import { Zap, Target, Award, Monitor, CheckCircle, Timer, RotateCcw, ShieldOff, SkipForward, TrendingUp, TrendingDown } from 'lucide-react';
import FocusHeatmap from '../gamification/components/FocusHeatmap';
import AvatarEvolution from '../gamification/components/AvatarEvolution';
import { useXP } from '../gamification/hooks/useXP';
import { getRank, getLevelProgress, getNextRank } from '../gamification/utils/rankSystem';

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

    const completionPercentage = useMemo(() => {
        return Math.min(100, Math.floor(totalXP / 10));
    }, [totalXP]);

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
    section: {
        marginBottom: '40px',
    },
    sectionTitle: {
        margin: '0 0 16px',
        fontSize: '12px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
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
};
