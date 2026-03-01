import { memo, useMemo } from 'react';
import { Sword } from 'lucide-react';
import { useXP } from '../hooks/useXP';

/**
 * XPBar — Game-style daily energy bar.
 * XP computed from real backend data: productive ratio.
 * ⚔ [██ ██ ██ ██ ██ ░░ ░░ ░░ ░░ ░░] 58 XP
 */
function XPBarInner() {
    const { totalXP, maxXP = 100 } = useXP();

    const pct = Math.round((totalXP / maxXP) * 100);

    // Color based on energy level
    const barColor = useMemo(() => {
        if (pct >= 70) return '#22c55e';       // Green — healthy
        if (pct >= 40) return '#f59e0b';       // Amber — warning
        return '#ef4444';                       // Red — critical
    }, [pct]);

    const totalSegments = 10;
    const filledSegments = Math.floor(totalXP / (maxXP / totalSegments));
    const partialFill = (totalXP % (maxXP / totalSegments)) / (maxXP / totalSegments);

    return (
        <div style={styles.wrapper}>
            {/* Sword icon — straight, no circle, just the icon */}
            <div style={{
                ...styles.swordIcon,
                filter: `drop-shadow(0 0 4px ${barColor}60)`,
            }}>
                <Sword
                    size={18}
                    color={barColor}
                    strokeWidth={2.5}
                    style={{ transform: 'rotate(45deg)' }}
                />
            </div>

            {/* Segmented bar */}
            <div style={{
                ...styles.barOuter,
                borderColor: `${barColor}30`,
            }}>
                <div style={styles.segmentRow}>
                    {Array.from({ length: totalSegments }).map((_, i) => {
                        let fill = 0;
                        if (i < filledSegments) fill = 100;
                        else if (i === filledSegments) fill = partialFill * 100;

                        const isEmpty = fill === 0;

                        return (
                            <div key={i} style={{
                                ...styles.segment,
                                background: isEmpty ? 'rgba(255,255,255,0.15)' : 'transparent',
                                border: isEmpty
                                    ? '1px solid rgba(255,255,255,0.1)'
                                    : `1px solid ${barColor}50`,
                            }}>
                                {fill > 0 && (
                                    <div style={{
                                        width: `${fill}%`,
                                        height: '100%',
                                        background: barColor,
                                        borderRadius: '1.5px',
                                        boxShadow: `0 0 4px ${barColor}60`,
                                        transition: 'width 0.5s ease',
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* XP count */}
            <div style={styles.xpSide}>
                <span style={{ ...styles.xpNum, color: barColor }}>{totalXP}</span>
                <span style={styles.xpLabel}>XP</span>
            </div>
        </div>
    );
}

const XPBar = memo(XPBarInner);
XPBar.displayName = 'XPBar';
export default XPBar;

const styles = {
    wrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontFamily: "'Outfit', sans-serif",
        position: 'relative',
        height: '32px',
    },
    swordIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginRight: '2px',
        /* No circle — just a raw icon */
    },
    barOuter: {
        display: 'flex',
        alignItems: 'center',
        padding: '3px 6px',
        background: 'rgba(0,0,0,0.5)',
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
        marginLeft: '4px',
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