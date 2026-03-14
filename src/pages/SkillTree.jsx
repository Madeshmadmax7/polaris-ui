import { useState, useEffect, useMemo } from 'react';
import { ai } from '../api';
import { useXP } from '../gamification/hooks/useXP';
import skillTreeConfig from '../gamification/data/skillTreeConfig';
import {
    Code, Calculator, Cpu, Braces, Terminal, Coffee,
    Atom, Server, FileType, Leaf, Globe, Beaker, Network,
    Layers, Database, GitBranch, Brain, GitMerge, Cloud, Blocks,
    Lock, CheckCircle2, Loader2, Zap, ChevronDown,
} from 'lucide-react';

const ICON_MAP = {
    Code, Calculator, Cpu, Braces, Terminal, Coffee,
    Atom, Server, FileType, Leaf, Globe, Beaker, Network,
    Layers, Database, GitBranch, Brain, GitMerge, Cloud, Blocks,
};

/**
 * SMART keyword matching:
 * 1. Normalize text: remove dots, extra spaces, lowercase
 * 2. Use word-boundary regex for precise matching
 * 
 * "react.js fundamentals" → normalized to "reactjs fundamentals" or "react js fundamentals"
 * so "react fundamentals" can still match via individual word checks.
 * 
 * Strategy: check if ALL words of the keyword appear in the search text (order doesn't matter).
 * This way "react fundamentals" matches "React.js Fundamentals in a Day".
 */
function keywordMatches(searchText, keyword) {
    // Normalize: lowercase, remove dots, collapse spaces
    const normalize = (str) => str.toLowerCase()
        .replace(/\./g, ' ')     // "react.js" → "react js"
        .replace(/[^\w\s]/g, ' ') // remove non-alphanumeric except spaces
        .replace(/\s+/g, ' ')    // collapse multiple spaces
        .trim();

    const txt = normalize(searchText);
    const kw = normalize(keyword);

    // All words of the keyword must appear as whole words in the text
    const kwWords = kw.split(' ').filter(w => w.length > 0);
    return kwWords.every((word) => {
        try {
            const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            return regex.test(txt);
        } catch {
            return txt.includes(word);
        }
    });
}

/**
 * For each skill, compute subtopic-level completion from study plans.
 * Returns Map: skillId → { subtopics[], completedCount, totalCount, completionPct, allDone, hasAnyProgress, hasAnyMatch }
 */
function computeSkillProgress(studyPlans, skills) {
    const result = new Map();

    const planInfos = studyPlans.map((plan) => {
        const chapters = plan.plan_data?.chapters || [];
        const total = chapters.length;
        const completed = chapters.filter(ch => ch.is_completed).length;
        const allDone = total > 0 && completed === total;
        const quizPassed = plan.quiz_unlocked && allDone;
        return {
            searchText: `${(plan.title || '')} ${(plan.goal || '')}`,
            planTitle: plan.title || plan.goal,
            planId: plan.id,
            totalChapters: total,
            completedChapters: completed,
            allDone,
            quizPassed,
            completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    });

    skills.forEach((skill) => {
        const subtopicResults = skill.subtopics.map((sub) => {
            let bestMatch = null;

            planInfos.forEach((pi) => {
                const matched = sub.keywords.some((kw) => keywordMatches(pi.searchText, kw));
                if (matched && (!bestMatch || pi.completionPct > bestMatch.completionPct)) {
                    bestMatch = pi;
                }
            });

            return {
                name: sub.name,
                completed: bestMatch?.allDone && bestMatch?.quizPassed,
                inProgress: bestMatch ? bestMatch.completionPct > 0 && !(bestMatch.allDone && bestMatch.quizPassed) : false,
                matchedPlan: bestMatch?.planTitle || null,
                matchedPlanPct: bestMatch?.completionPct || 0,
                hasMatch: !!bestMatch,
            };
        });

        const completedCount = subtopicResults.filter(s => s.completed).length;
        const inProgressCount = subtopicResults.filter(s => s.inProgress).length;
        const totalCount = subtopicResults.length;
        const hasAnyMatch = subtopicResults.some(s => s.hasMatch);

        let weightedProgress = 0;
        subtopicResults.forEach((s) => {
            if (s.completed) weightedProgress += 100;
            else if (s.inProgress) weightedProgress += s.matchedPlanPct;
        });
        const completionPct = totalCount > 0 ? Math.round(weightedProgress / totalCount) : 0;

        result.set(skill.id, {
            subtopics: subtopicResults,
            completedCount,
            inProgressCount,
            totalCount,
            completionPct,
            allDone: completedCount === totalCount,
            hasAnyProgress: completedCount > 0 || inProgressCount > 0,
            hasAnyMatch, // At least one study plan matches this skill
        });
    });

    return result;
}

/**
 * Skill states:
 *  'completed'   → All subtopics mastered
 *  'in-progress' → Has matching study plans with some progress
 *  'not-started' → No matching study plans exist (greyed out but clickable)
 * 
 * NOTE: No "locked" state. Prerequisites are informational only.
 * If you created a React study plan, React shows progress even if JavaScript isn't done.
 */
function getSkillState(skill, progressMap) {
    const progress = progressMap.get(skill.id);
    if (!progress) return 'not-started';

    if (progress.allDone) return 'completed';
    if (progress.hasAnyProgress || progress.hasAnyMatch) return 'in-progress';
    return 'not-started';
}


export default function SkillTree() {
    const [studyPlans, setStudyPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const { totalXP = 0, level = 0 } = useXP() || {};

    useEffect(() => {
        async function load() {
            try {
                const plans = await ai.getStudyPlans().catch(() => []);
                const enriched = await Promise.all(
                    plans.map(async (plan) => {
                        try { return await ai.getStudyPlan(plan.id); }
                        catch { return plan; }
                    })
                );
                setStudyPlans(enriched);
            } catch {
                setStudyPlans([]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const progressMap = useMemo(() => computeSkillProgress(studyPlans, skillTreeConfig), [studyPlans]);

    const tiers = useMemo(() => {
        const tierMap = {};
        skillTreeConfig.forEach((skill) => {
            if (!tierMap[skill.tier]) tierMap[skill.tier] = [];
            tierMap[skill.tier].push(skill);
        });
        return Object.entries(tierMap).sort(([a], [b]) => a - b);
    }, []);

    const tierLabels = { 1: 'Foundations', 2: 'Core Languages', 3: 'Frameworks & CS', 4: 'Advanced', 5: 'Mastery' };

    // Count stats
    const totalSkills = skillTreeConfig.length;
    const masteredCount = skillTreeConfig.filter(s => getSkillState(s, progressMap) === 'completed').length;
    const inProgressCount = skillTreeConfig.filter(s => getSkillState(s, progressMap) === 'in-progress').length;

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <Loader2 size={24} color="rgba(255,255,255,0.2)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={styles.loadingText}>Loading Skill Tree...</span>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Skill Tree</h1>
                    <p style={styles.subtitle}>
                        Create study plans in Learning to unlock skills.
                        Each skill has subtopics — complete them all to master it.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={styles.statBadge}>
                        <span style={{ color: '#34d399', fontWeight: 800 }}>{masteredCount}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>Mastered</span>
                    </div>
                    <div style={styles.statBadge}>
                        <span style={{ color: '#60a5fa', fontWeight: 800 }}>{inProgressCount}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>Active</span>
                    </div>
                    <div style={styles.statBadge}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>{totalSkills}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>Total</span>
                    </div>
                </div>
            </div>

            <div style={styles.treeContainer}>
                {tiers.map(([tierNum, skills], tierIdx) => (
                    <div key={tierNum}>
                        <div style={styles.tierHeader}>
                            <span style={styles.tierLabel}>{tierLabels[tierNum] || `Tier ${tierNum}`}</span>
                            <div style={styles.tierLine} />
                        </div>

                        <div style={styles.nodeRow}>
                            {skills.map((skill) => {
                                const state = getSkillState(skill, progressMap);
                                const progress = progressMap.get(skill.id);
                                const IconComponent = ICON_MAP[skill.lucideIcon] || Code;
                                const pct = progress?.completionPct || 0;

                                return (
                                    <div
                                        key={skill.id}
                                        style={{
                                            ...styles.nodeWrapper,
                                            opacity: state === 'not-started' ? 0.4 : 1,
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => setSelectedSkill(skill)}
                                    >
                                        <div style={{
                                            ...styles.hexNode,
                                            borderColor: state === 'completed' ? skill.color
                                                : state === 'in-progress' ? `${skill.color}88`
                                                    : 'rgba(255,255,255,0.08)',
                                            boxShadow: state === 'completed'
                                                ? `0 0 20px ${skill.color}40, 0 0 40px ${skill.color}15`
                                                : state === 'in-progress'
                                                    ? `0 0 12px ${skill.color}20`
                                                    : 'none',
                                            background: state === 'completed'
                                                ? `linear-gradient(135deg, ${skill.color}15, ${skill.color}05)`
                                                : 'rgba(0,0,0,0.5)',
                                        }}>
                                            {state === 'not-started' ? (
                                                <IconComponent size={20} color="rgba(255,255,255,0.15)" />
                                            ) : state === 'completed' ? (
                                                <CheckCircle2 size={22} color={skill.color} />
                                            ) : (
                                                <IconComponent size={22} color={skill.color} />
                                            )}
                                        </div>

                                        {/* Progress ring for in-progress */}
                                        {state === 'in-progress' && pct > 0 && (
                                            <div style={styles.progressRing}>
                                                <svg width="70" height="70" style={{ position: 'absolute', top: 0, left: 0 }}>
                                                    <circle cx="35" cy="35" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                                                    <circle
                                                        cx="35" cy="35" r="32" fill="none"
                                                        stroke={skill.color} strokeWidth="2.5" strokeLinecap="round"
                                                        strokeDasharray={`${2 * Math.PI * 32}`}
                                                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
                                                        transform="rotate(-90, 35, 35)"
                                                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                                                    />
                                                </svg>
                                            </div>
                                        )}

                                        <span style={{
                                            ...styles.skillName,
                                            color: state === 'completed' ? skill.color
                                                : state === 'in-progress' ? '#fff'
                                                    : 'rgba(255,255,255,0.2)',
                                        }}>
                                            {skill.name}
                                        </span>

                                        {state === 'completed' && (
                                            <span style={{ ...styles.badge, background: skill.color, color: '#000' }}>Mastered</span>
                                        )}
                                        {state === 'in-progress' && pct > 0 && (
                                            <span style={{ ...styles.badge, background: 'rgba(255,255,255,0.08)', color: skill.color }}>
                                                {pct}% · {progress.completedCount}/{progress.totalCount}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {tierIdx < tiers.length - 1 && (
                            <div style={styles.connectorZone}>
                                <ChevronDown size={20} color="rgba(255,255,255,0.08)" style={{ margin: '8px 0' }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Skill Detail Modal */}
            {selectedSkill && (() => {
                const state = getSkillState(selectedSkill, progressMap);
                const progress = progressMap.get(selectedSkill.id);
                const IconComp = ICON_MAP[selectedSkill.lucideIcon] || Code;

                return (
                    <div style={styles.modalOverlay} onClick={() => setSelectedSkill(null)}>
                        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <button style={styles.modalClose} onClick={() => setSelectedSkill(null)}>×</button>

                            <div style={{ ...styles.modalIcon, borderColor: selectedSkill.color }}>
                                <IconComp size={28} color={selectedSkill.color} />
                            </div>

                            <h2 style={{ ...styles.modalTitle, color: selectedSkill.color }}>
                                {selectedSkill.name}
                            </h2>
                            <p style={styles.modalDesc}>{selectedSkill.description}</p>

                            {/* Overall progress */}
                            {progress && (
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                            Overall Progress
                                        </span>
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: selectedSkill.color }}>
                                            {progress.completionPct}%
                                        </span>
                                    </div>
                                    <div style={styles.progressBarOuter}>
                                        <div style={{ ...styles.progressBarInner, width: `${progress.completionPct}%`, background: selectedSkill.color }} />
                                    </div>
                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                                        {progress.completedCount} of {progress.totalCount} subtopics mastered
                                    </span>
                                </div>
                            )}

                            {/* Prerequisites (informational) */}
                            {selectedSkill.prerequisites.length > 0 && (
                                <div style={styles.modalSection}>
                                    <h4 style={styles.modalSectionTitle}>Recommended Prerequisites</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {selectedSkill.prerequisites.map((preId) => {
                                            const preName = skillTreeConfig.find(s => s.id === preId)?.name || preId;
                                            const preProg = progressMap.get(preId);
                                            const preDone = preProg?.allDone;
                                            return (
                                                <div key={preId} style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                                                    border: `1px solid ${preDone ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                                                    color: preDone ? '#34d399' : 'rgba(255,255,255,0.4)',
                                                }}>
                                                    {preDone ? <CheckCircle2 size={12} color="#34d399" /> : <Lock size={12} />}
                                                    {preName}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Subtopics */}
                            <div style={styles.modalSection}>
                                <h4 style={styles.modalSectionTitle}>
                                    Subtopics ({progress?.completedCount || 0}/{progress?.totalCount || selectedSkill.subtopics.length})
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(progress?.subtopics || selectedSkill.subtopics.map(s => ({ name: s.name, completed: false, inProgress: false, matchedPlan: null, matchedPlanPct: 0 })))
                                        .map((sub, i) => (
                                            <div key={i} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '10px 14px', borderRadius: '12px',
                                                background: sub.completed ? `${selectedSkill.color}10`
                                                    : sub.inProgress ? 'rgba(255,255,255,0.03)'
                                                        : 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${sub.completed ? `${selectedSkill.color}30`
                                                    : sub.inProgress ? `${selectedSkill.color}15`
                                                        : 'rgba(255,255,255,0.05)'}`,
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                                    {sub.completed ? (
                                                        <CheckCircle2 size={14} color={selectedSkill.color} />
                                                    ) : sub.inProgress ? (
                                                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${selectedSkill.color}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                                                    ) : (
                                                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
                                                    )}
                                                    <div style={{ flex: 1 }}>
                                                        <span style={{
                                                            fontSize: '12px', fontWeight: 600,
                                                            color: sub.completed ? selectedSkill.color
                                                                : sub.inProgress ? '#fff'
                                                                    : 'rgba(255,255,255,0.4)',
                                                        }}>
                                                            {sub.name}
                                                        </span>
                                                        {sub.matchedPlan && (
                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>
                                                                📘 {sub.matchedPlan}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {sub.completed ? (
                                                    <span style={{ fontSize: '9px', fontWeight: 800, color: selectedSkill.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Done</span>
                                                ) : sub.inProgress ? (
                                                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{sub.matchedPlanPct}%</span>
                                                ) : (
                                                    <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>—</span>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* How to unlock hint */}
                            {state === 'not-started' && (
                                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                        💡 Go to <strong style={{ color: '#fff' }}>Learning</strong> → create a study plan matching a subtopic above to start tracking progress.
                                    </span>
                                </div>
                            )}

                            {/* Status */}
                            <div style={{
                                ...styles.statusBar,
                                background: state === 'completed' ? `${selectedSkill.color}20` : 'rgba(255,255,255,0.04)',
                                borderColor: state === 'completed' ? selectedSkill.color : 'rgba(255,255,255,0.08)',
                                color: state === 'completed' ? selectedSkill.color : 'rgba(255,255,255,0.4)',
                            }}>
                                {state === 'completed' ? '✦ MASTERED — ALL SUBTOPICS COMPLETE'
                                    : state === 'in-progress' ? `◉ IN PROGRESS — ${progress?.completionPct || 0}%`
                                        : '○ NOT STARTED'}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

const styles = {
    page: { maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px', fontFamily: "'Outfit', sans-serif" },
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '60vh' },
    loadingText: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' },
    subtitle: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0, maxWidth: '500px', lineHeight: 1.6 },
    statBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', fontSize: '14px' },
    treeContainer: { display: 'flex', flexDirection: 'column', gap: '0' },
    tierHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingLeft: '8px' },
    tierLabel: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' },
    tierLine: { flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' },
    nodeRow: { display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '24px', marginBottom: '8px' },
    nodeWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', position: 'relative', transition: 'all 0.3s ease', minWidth: '90px' },
    hexNode: { width: '64px', height: '64px', borderRadius: '20px', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease', position: 'relative' },
    progressRing: { position: 'absolute', top: '-3px', left: '50%', transform: 'translateX(-50%)', width: '70px', height: '70px', pointerEvents: 'none' },
    skillName: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', maxWidth: '90px', lineHeight: 1.3 },
    badge: { fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '8px' },
    connectorZone: { display: 'flex', justifyContent: 'center', margin: '4px 0' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
    modal: { background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '28px', padding: '36px', maxWidth: '460px', width: '100%', position: 'relative', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' },
    modalClose: { position: 'absolute', top: '16px', right: '20px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '24px', cursor: 'pointer', lineHeight: 1 },
    modalIcon: { width: '56px', height: '56px', borderRadius: '18px', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', marginBottom: '20px' },
    modalTitle: { fontSize: '22px', fontWeight: 700, margin: '0 0 8px' },
    modalDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', lineHeight: 1.6 },
    modalSection: { marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' },
    modalSectionTitle: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', margin: '0 0 12px' },
    progressBarOuter: { height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' },
    progressBarInner: { height: '100%', borderRadius: '4px', transition: 'width 0.8s ease' },
    statusBar: { marginTop: '20px', padding: '14px', borderRadius: '14px', border: '1px solid', textAlign: 'center', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' },
};
