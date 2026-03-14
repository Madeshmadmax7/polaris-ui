import { memo, useState, useEffect, useRef, useMemo } from 'react';
import { Egg, Bug, CircleDot, Sparkles, Bird, ArrowUp } from 'lucide-react';

/**
 * Avatar Evolution Component
 * Renders an evolving avatar based on lesson completion percentage.
 * Uses lucide-react icons instead of emojis.
 * Stages: Egg → Caterpillar → Cocoon → Emerging → Butterfly
 *
 * Props:
 *   completionPercentage: number (0-100)
 *
 * Triggers a full-screen overlay animation on stage transitions.
 * Each transition only fires once per stage.
 * Does NOT interfere with any lesson tracking logic.
 */

const STAGES = [
    { id: 'egg', name: 'Egg', min: 0, max: 20, Icon: Egg, color: '#f5f5dc', particleIcon: Sparkles },
    { id: 'caterpillar', name: 'Caterpillar', min: 21, max: 40, Icon: Bug, color: '#22c55e', particleIcon: Sparkles },
    { id: 'cocoon', name: 'Cocoon', min: 41, max: 60, Icon: CircleDot, color: '#a855f7', particleIcon: Sparkles },
    { id: 'emerging', name: 'Emerging', min: 61, max: 80, Icon: ArrowUp, color: '#3b82f6', particleIcon: Sparkles },
    { id: 'butterfly', name: 'Butterfly', min: 81, max: 100, Icon: Bird, color: '#f59e0b', particleIcon: Sparkles },
];

function getStage(percentage) {
    const clamped = Math.max(0, Math.min(100, percentage));
    for (const stage of STAGES) {
        if (clamped >= stage.min && clamped <= stage.max) return stage;
    }
    return STAGES[0];
}

function getStageIndex(percentage) {
    const clamped = Math.max(0, Math.min(100, percentage));
    for (let i = 0; i < STAGES.length; i++) {
        if (clamped >= STAGES[i].min && clamped <= STAGES[i].max) return i;
    }
    return 0;
}

const SEEN_STAGES_KEY = 'polaris_avatar_seen_stages';

function loadSeenStages() {
    try {
        const stored = localStorage.getItem(SEEN_STAGES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveSeenStages(stages) {
    try {
        localStorage.setItem(SEEN_STAGES_KEY, JSON.stringify(stages));
    } catch { /* Silently fail */ }
}

function AvatarEvolutionInner({ completionPercentage = 0 }) {
    const stage = useMemo(() => getStage(completionPercentage), [completionPercentage]);
    const stageIndex = useMemo(() => getStageIndex(completionPercentage), [completionPercentage]);
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayStage, setOverlayStage] = useState(null);
    const prevStageRef = useRef(null);

    useEffect(() => {
        const seenStages = loadSeenStages();

        if (
            prevStageRef.current !== null &&
            prevStageRef.current !== stage.id &&
            !seenStages.includes(stage.id)
        ) {
            setOverlayStage(stage);
            setShowOverlay(true);
            const updated = [...seenStages, stage.id];
            saveSeenStages(updated);
            const timer = setTimeout(() => setShowOverlay(false), 3000);
            return () => clearTimeout(timer);
        }

        prevStageRef.current = stage.id;
    }, [stage]);

    const StageIcon = stage.Icon;

    return (
        <>
            {/* Avatar Display */}
            <div style={styles.avatarContainer}>
                <div
                    style={{
                        ...styles.avatarCircle,
                        background: `radial-gradient(circle at 30% 30%, ${stage.color}22, ${stage.color}08)`,
                        borderColor: `${stage.color}33`,
                        boxShadow: `0 0 40px ${stage.color}15, inset 0 0 30px ${stage.color}08`,
                    }}
                >
                    <StageIcon size={26} color={stage.color} strokeWidth={1.5} />
                </div>
                <div style={styles.info}>
                    <span style={{ ...styles.stageName, color: stage.color }}>{stage.name}</span>
                    <div style={styles.progressRow}>
                        {STAGES.map((s, i) => (
                            <div
                                key={s.id}
                                style={{
                                    ...styles.dot,
                                    background: i <= stageIndex ? stage.color : 'rgba(255,255,255,0.1)',
                                    boxShadow: i <= stageIndex ? `0 0 6px ${stage.color}60` : 'none',
                                }}
                            />
                        ))}
                    </div>
                    <span style={styles.percentage}>{completionPercentage}% complete</span>
                </div>
            </div>

            {/* Full-screen overlay animation */}
            {showOverlay && overlayStage && (
                <div style={styles.overlay}>
                    <div style={styles.overlayContent}>
                        <div style={styles.particles}>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <span
                                    key={i}
                                    style={{
                                        ...styles.particle,
                                        left: `${10 + Math.random() * 80}%`,
                                        top: `${10 + Math.random() * 80}%`,
                                        animationDelay: `${Math.random() * 1.5}s`,
                                    }}
                                >
                                    <Sparkles size={16 + Math.random() * 12} color={overlayStage.color} strokeWidth={1.5} />
                                </span>
                            ))}
                        </div>
                        <div style={styles.overlayIconWrap}>
                            <overlayStage.Icon size={64} color={overlayStage.color} strokeWidth={1.5} />
                        </div>
                        <h2 style={{ ...styles.overlayTitle, color: overlayStage.color }}>
                            Evolution!
                        </h2>
                        <p style={styles.overlaySubtext}>
                            You've become a <strong>{overlayStage.name}</strong>
                        </p>
                    </div>
                </div>
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes avatarPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes overlayFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes particleFloat {
                    0% { opacity: 0; transform: translateY(0) scale(0.5); }
                    30% { opacity: 1; transform: translateY(-20px) scale(1); }
                    100% { opacity: 0; transform: translateY(-80px) scale(0.3); }
                }
                @keyframes emojiPop {
                    0% { transform: scale(0); opacity: 0; }
                    60% { transform: scale(1.3); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </>
    );
}

const AvatarEvolution = memo(AvatarEvolutionInner);
AvatarEvolution.displayName = 'AvatarEvolution';
export default AvatarEvolution;

// ── Inline styles ────────────────────────────────────────
const styles = {
    avatarContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.12)',
    },
    avatarCircle: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: '2px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'avatarPulse 3s ease-in-out infinite',
        flexShrink: 0,
    },
    info: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    stageName: {
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        fontFamily: "'Outfit', sans-serif",
    },
    progressRow: {
        display: 'flex',
        gap: '4px',
    },
    dot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        transition: 'all 0.5s ease',
    },
    percentage: {
        fontSize: '9px',
        color: 'rgba(255,255,255,0.3)',
        fontFamily: "'Outfit', sans-serif",
    },
    // Overlay
    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'overlayFadeIn 0.5s ease forwards',
    },
    overlayContent: {
        textAlign: 'center',
        position: 'relative',
    },
    particles: {
        position: 'absolute',
        inset: '-100px',
        pointerEvents: 'none',
    },
    particle: {
        position: 'absolute',
        animation: 'particleFloat 2.5s ease-out infinite',
    },
    overlayIconWrap: {
        marginBottom: '20px',
        animation: 'emojiPop 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        display: 'inline-block',
    },
    overlayTitle: {
        fontSize: '28px',
        fontWeight: 800,
        fontFamily: "'Outfit', sans-serif",
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        margin: 0,
    },
    overlaySubtext: {
        fontSize: '14px',
        color: 'rgba(255,255,255,0.5)',
        marginTop: '8px',
        fontFamily: "'Outfit', sans-serif",
    },
};
