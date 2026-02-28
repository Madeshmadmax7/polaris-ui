
import { memo, useMemo } from 'react';
import { Sword } from 'lucide-react';
import { useXP } from '../hooks/useXP';
import { getRank, getLevelProgress } from '../utils/rankSystem';

/**
 * XPBar — Pixel-art game-style XP bar.
 * Sword icon overlapping the bar on the left, segmented fill, XP on the right.
 * Matches the classic RPG sword health bar aesthetic.
 *   ⚔️ [██ ██ ██ ░░ ░░ ░░ ░░ ░░] 42 XP
 */
function XPBarInner() {
    const { totalXP, level } = useXP();
    const rank = useMemo(() => getRank(totalXP), [totalXP]);
    const progress = useMemo(() => getLevelProgress(totalXP), [totalXP]);

    const totalSegments = 10;
    const filledSegments = Math.floor(progress.percentage / totalSegments);
    const partialFill = (progress.percentage % totalSegments) / totalSegments;

    return (
        <div style={styles.wrapper}>
            {/* Sword icon — overlapping the bar on the left */}
            <div style={{
                ...styles.swordIcon,
                color: rank.color,
                filter: `drop-shadow(0 0 4px ${rank.color}50)`,
            }}>
                <Sword size={18} strokeWidth={2.5} />
            </div>

            {/* Bar container */}
            <div style={{
                ...styles.barOuter,
                borderColor: `${rank.color}40`,
                boxShadow: `0 0 6px ${rank.color}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}>
                {/* Segments */}
                <div style={styles.segmentRow}>
                    {Array.from({ length: totalSegments }).map((_, i) => {
                        let fillPct = 0;
                        if (i < filledSegments) fillPct = 100;
                        else if (i === filledSegments) fillPct = partialFill * 100;

                        const isEmpty = fillPct === 0;

                        return (
                            <div key={i} style={{
                                ...styles.segment,
                                background: isEmpty
                                    ? 'rgba(255,255,255,0.12)'
                                    : 'transparent',
                                border: isEmpty
                                    ? '1px solid rgba(255,255,255,0.08)'
                                    : `1px solid ${rank.color}60`,
                            }}>
                                {fillPct > 0 && (
                                    <div style={{
                                        width: `${fillPct}%`,
                                        height: '100%',
                                        background: rank.color,
                                        borderRadius: '1px',
                                        boxShadow: `0 0 3px ${rank.color}80`,
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* XP count on the right */}
            <div style={styles.xpSide}>
                <span style={{ ...styles.xpNum, color: rank.color }}>{totalXP}</span>
                <span style={styles.xpLabel}>XP</span>
            </div>
        </div>
    );
}

const XPBar = memo(XPBarInner);
XPBar.displayName = 'XPBar';
export default XPBar;

// ── Inline styles ───────────────────────────────────────
const styles = {
    wrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '0px',
        fontFamily: "'Outfit', sans-serif",
        position: 'relative',
        height: '32px',
    },
    swordIcon: {
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '26px',
        height: '26px',
        background: 'rgba(0,0,0,0.8)',
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.15)',
        flexShrink: 0,
        marginRight: '-8px',
    },
    barOuter: {
        display: 'flex',
        alignItems: 'center',
        padding: '3px 6px 3px 12px',
        background: 'rgba(0,0,0,0.7)',
        borderRadius: '6px',
        border: '1.5px solid',
        flex: 1,
        minWidth: '120px',
        maxWidth: '180px',
    },
    segmentRow: {
        display: 'flex',
        gap: '2px',
        flex: 1,
        height: '10px',
    },
    segment: {
        flex: 1,
        height: '100%',
        borderRadius: '2px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
    },
    xpSide: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '2px',
        marginLeft: '6px',
        flexShrink: 0,
    },
    xpNum: {
        fontSize: '14px',
        fontWeight: 800,
        lineHeight: 1,
    },
    xpLabel: {
        fontSize: '8px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
    },
};