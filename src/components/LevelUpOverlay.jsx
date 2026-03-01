import { useState, useEffect, useRef, useCallback } from 'react';
import { ai } from '../api';

// Import level GIFs
import lvl1Gif from '../gifs/lvl1.gif';
import lvl2Gif from '../gifs/lvl2.gif';
import lvl3Gif from '../gifs/lvl3.gif';
import lvl4Gif from '../gifs/lvl4.gif';
import lvl5Gif from '../gifs/lvl5.gif';

const LEVEL_GIFS = [lvl1Gif, lvl2Gif, lvl3Gif, lvl4Gif, lvl5Gif];
const LEVEL_NAMES = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];
const LEVEL_STORAGE_KEY = 'polaris_learning_level';

// GIF approximate durations in ms (play once then stop)
// These are estimated — adjust if GIFs are longer/shorter
const GIF_DURATIONS = [4000, 3000, 3000, 2000, 3000];

/**
 * LevelUpOverlay — Fullscreen GIF animation when user reaches a new learning level.
 *
 * Levels based on overall chapter completion across ALL study plans:
 *   Level 1: 20% completed
 *   Level 2: 40% completed
 *   Level 3: 60% completed
 *   Level 4: 80% completed
 *   Level 5: 100% completed
 *
 * Shows on dashboard only (progress increases while watching YouTube).
 * Plays GIF once → shows "Level X Completed" text → fades out.
 */
export default function LevelUpOverlay({ onComplete }) {
    const [currentLevel, setCurrentLevel] = useState(0); // 0 = no level reached
    const [lastSeenLevel, setLastSeenLevel] = useState(0);
    const [showOverlay, setShowOverlay] = useState(false);
    const [showText, setShowText] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const [gifSrc, setGifSrc] = useState(null);
    const timerRef = useRef(null);

    // Load last seen level
    useEffect(() => {
        try {
            const stored = localStorage.getItem(LEVEL_STORAGE_KEY);
            if (stored) setLastSeenLevel(parseInt(stored, 10) || 0);
        } catch { /* ignore */ }
    }, []);

    // Compute current learning level from all study plans
    useEffect(() => {
        async function computeLevel() {
            try {
                const plans = await ai.getStudyPlans().catch(() => []);
                if (!plans || plans.length === 0) return;

                let totalChapters = 0;
                let completedChapters = 0;

                // Fetch progress for each plan — the backend returns
                // { total_chapters, completed_chapters, chapters: [...] }
                const progressPromises = plans.map(plan =>
                    ai.getStudyPlanProgress(plan.id).catch(() => null)
                );
                const allProgress = await Promise.all(progressPromises);

                for (let i = 0; i < plans.length; i++) {
                    const progress = allProgress[i];
                    if (!progress) continue;

                    // Use backend's pre-computed totals
                    totalChapters += progress.total_chapters || 0;

                    // Count chapters that are either formally completed OR >= 80% watched
                    // (a 99% watched chapter should count for level-up)
                    if (progress.chapters && progress.chapters.length > 0) {
                        for (const ch of progress.chapters) {
                            if (ch.is_completed || (ch.progress_percentage && ch.progress_percentage >= 80)) {
                                completedChapters++;
                            }
                        }
                    } else {
                        // Fallback to backend's completed count
                        completedChapters += progress.completed_chapters || 0;
                    }
                }

                if (totalChapters === 0) return;

                const pct = (completedChapters / totalChapters) * 100;
                console.log(`[LevelUp] Progress: ${completedChapters}/${totalChapters} chapters = ${pct.toFixed(1)}%`);

                let level = 0;
                if (pct >= 100) level = 5;
                else if (pct >= 80) level = 4;
                else if (pct >= 60) level = 3;
                else if (pct >= 40) level = 2;
                else if (pct >= 20) level = 1;

                console.log(`[LevelUp] Computed level: ${level}`);
                setCurrentLevel(level);
            } catch (err) {
                console.debug('[LevelUp] Failed to compute level:', err);
            }
        }

        computeLevel();
    }, []);

    // Trigger animation if new level reached
    useEffect(() => {
        if (currentLevel > 0 && currentLevel > lastSeenLevel) {
            // New level reached! Show the animation
            const levelIndex = currentLevel - 1; // 0-indexed
            // Force GIF to replay by appending a cache-buster
            setGifSrc(LEVEL_GIFS[levelIndex] + '?t=' + Date.now());
            setShowOverlay(true);
            setShowText(false);
            setFadeOut(false);

            // After GIF plays once, show text
            const gifDuration = GIF_DURATIONS[levelIndex] || 3000;
            timerRef.current = setTimeout(() => {
                setShowText(true);

                // After text displays for 2 seconds, fade out
                timerRef.current = setTimeout(() => {
                    setFadeOut(true);

                    // After fade animation (1s), remove overlay
                    timerRef.current = setTimeout(() => {
                        setShowOverlay(false);
                        // Save this level as seen
                        try {
                            localStorage.setItem(LEVEL_STORAGE_KEY, String(currentLevel));
                        } catch { /* ignore */ }
                        setLastSeenLevel(currentLevel);
                        if (onComplete) onComplete();
                    }, 1000);
                }, 2500);
            }, gifDuration);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [currentLevel, lastSeenLevel, onComplete]);

    if (!showOverlay) return null;

    const levelIndex = currentLevel - 1;

    return (
        <div style={{
            ...styles.overlay,
            opacity: fadeOut ? 0 : 1,
            transition: 'opacity 1s ease-out',
        }}>
            {/* GIF — plays once */}
            <img
                src={gifSrc}
                alt={`Level ${currentLevel} animation`}
                style={styles.gif}
            />

            {/* Level text — appears after GIF loop */}
            {showText && (
                <div style={styles.textContainer}>
                    <div style={styles.levelNumber}>{currentLevel}</div>
                    <div style={styles.levelLabel}>{LEVEL_NAMES[levelIndex]} Completed</div>
                    <div style={styles.levelSubtext}>Keep up the great work!</div>
                </div>
            )}
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        background: 'radial-gradient(circle at center, #0a0a2e 0%, #000000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif",
    },
    gif: {
        maxWidth: '400px',
        maxHeight: '400px',
        objectFit: 'contain',
        marginBottom: '20px',
    },
    textContainer: {
        textAlign: 'center',
        animation: 'levelTextFadeIn 0.8s ease-out forwards',
    },
    levelNumber: {
        fontSize: '80px',
        fontWeight: 900,
        color: '#fff',
        lineHeight: 1,
        textShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(34,197,94,0.2)',
        letterSpacing: '-0.02em',
    },
    levelLabel: {
        fontSize: '28px',
        fontWeight: 700,
        color: '#22c55e',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        marginTop: '8px',
    },
    levelSubtext: {
        fontSize: '14px',
        fontWeight: 400,
        color: 'rgba(255,255,255,0.4)',
        marginTop: '12px',
        letterSpacing: '0.1em',
    },
};
