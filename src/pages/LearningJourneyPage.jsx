import React, { useState, useEffect, useCallback, useRef } from 'react';
import { learningPath } from '../api';
import {
    Compass,
    Map,
    TrendingUp,
    Target,
    Sparkles,
    RefreshCw,
    ChevronRight,
    ChevronDown,
    AlertCircle,
    CheckCircle,
    Circle,
    Loader2,
    Zap,
    Star,
    Milestone,
    BookOpen,
    ArrowUpRight,
    Clock,
    BarChart3,
    Lightbulb,
    Route,
    Trophy,
    GraduationCap,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
//  CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════════

const STAGE_CONFIG = {
    beginner: { label: 'Beginner', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: BookOpen },
    intermediate: { label: 'Intermediate', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: TrendingUp },
    advanced: { label: 'Advanced', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: Zap },
    expert: { label: 'Expert', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Trophy },
};

const STATUS_CONFIG = {
    growing: { label: 'Growing', color: '#10b981', dot: '🌱' },
    mature: { label: 'Mature', color: '#3b82f6', dot: '🌳' },
    completed: { label: 'Completed', color: '#f59e0b', dot: '🏆' },
    stale: { label: 'Stale', color: '#71717a', dot: '🍂' },
};

const PATH_COLORS = [
    '#6366f1', '#3b82f6', '#a855f7', '#ec4899', '#f97316',
    '#10b981', '#06b6d4', '#f43f5e', '#eab308', '#84cc16',
];

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(dateStr) {
    if (!dateStr) return 'never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 30) return `${diffDay}d ago`;
    return formatDate(dateStr);
}


// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function LearningJourneyPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const [expandedPath, setExpandedPath] = useState(null);
    const [describingPath, setDescribingPath] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await learningPath.getAll();
            setData(res);
            // Auto-expand primary path
            if (res?.paths?.length > 0) {
                const primary = res.paths.find(p => p.is_primary);
                setExpandedPath(primary?.id || res.paths[0]?.id);
            }
        } catch (err) {
            console.error('[LearningJourney] Error:', err);
            setError('Failed to load learning paths');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAnalyze = async () => {
        try {
            setAnalyzing(true);
            await learningPath.triggerAnalysis();
            // Wait a moment for background task, then refresh
            setTimeout(() => {
                fetchData();
                setAnalyzing(false);
            }, 3000);
        } catch (err) {
            setError('Failed to trigger analysis');
            setAnalyzing(false);
        }
    };

    const handleDescribe = async (pathId) => {
        try {
            setDescribingPath(pathId);
            await learningPath.describe(pathId);
            await fetchData();
        } catch (err) {
            console.error('Description error:', err);
        } finally {
            setDescribingPath(null);
        }
    };

    // ── Render ──
    return (
        <div style={styles.page}>
            {/* ── Header ── */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.headerIcon}>
                        <Compass size={28} color="#a855f7" />
                    </div>
                    <div>
                        <h1 style={styles.title}>Learning Journey</h1>
                        <p style={styles.subtitle}>
                            AI-discovered paths from your knowledge graph
                        </p>
                    </div>
                </div>
                <button
                    style={{
                        ...styles.analyzeBtn,
                        opacity: analyzing ? 0.6 : 1,
                    }}
                    onClick={handleAnalyze}
                    disabled={analyzing}
                >
                    {analyzing ? (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <RefreshCw size={16} />
                    )}
                    {analyzing ? 'Analyzing…' : 'Re-analyze'}
                </button>
            </div>

            {/* ── Loading State ── */}
            {loading && (
                <div style={styles.loadingContainer}>
                    <Loader2 size={32} color="#a855f7" style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={styles.loadingText}>Discovering your learning paths…</p>
                </div>
            )}

            {/* ── Error State ── */}
            {error && (
                <div style={styles.errorBanner}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* ── Empty State ── */}
            {!loading && !error && (!data?.paths || data.paths.length === 0) && (
                <EmptyState onAnalyze={handleAnalyze} analyzing={analyzing} />
            )}

            {/* ── Content ── */}
            {!loading && data && data.paths && data.paths.length > 0 && (
                <>
                    {/* Summary Banner */}
                    <SummaryBanner summary={data.summary} paths={data.paths} />

                    {/* Path Cards */}
                    <div style={styles.pathsGrid}>
                        {data.paths.map((path, idx) => (
                            <PathCard
                                key={path.id}
                                path={path}
                                color={PATH_COLORS[idx % PATH_COLORS.length]}
                                isExpanded={expandedPath === path.id}
                                onToggle={() => setExpandedPath(
                                    expandedPath === path.id ? null : path.id
                                )}
                                onDescribe={handleDescribe}
                                isDescribing={describingPath === path.id}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Spin keyframe */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 8px rgba(168,85,247,0.15); } 50% { box-shadow: 0 0 20px rgba(168,85,247,0.35); } }
                @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 2000px; } }
            `}</style>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════
//  EMPTY STATE
// ═══════════════════════════════════════════════════════════

function EmptyState({ onAnalyze, analyzing }) {
    return (
        <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
                <Route size={48} color="#a855f7" />
            </div>
            <h2 style={styles.emptyTitle}>No Learning Paths Discovered Yet</h2>
            <p style={styles.emptyDesc}>
                Browse educational content and your knowledge graph will grow.
                Once you have enough concepts, the AI will automatically discover your learning paths.
            </p>
            <div style={styles.emptySteps}>
                <div style={styles.emptyStep}>
                    <span style={styles.emptyStepNum}>1</span>
                    <span>Browse tutorials, docs & blogs</span>
                </div>
                <ChevronRight size={16} color="#71717a" />
                <div style={styles.emptyStep}>
                    <span style={styles.emptyStepNum}>2</span>
                    <span>Knowledge Graph grows</span>
                </div>
                <ChevronRight size={16} color="#71717a" />
                <div style={styles.emptyStep}>
                    <span style={styles.emptyStepNum}>3</span>
                    <span>AI discovers paths</span>
                </div>
            </div>
            <button
                style={{ ...styles.analyzeBtn, marginTop: 24 }}
                onClick={onAnalyze}
                disabled={analyzing}
            >
                {analyzing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                {analyzing ? 'Analyzing…' : 'Analyze Now'}
            </button>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════
//  SUMMARY BANNER
// ═══════════════════════════════════════════════════════════

function SummaryBanner({ summary, paths }) {
    if (!summary?.primary_path) return null;

    const stageConf = STAGE_CONFIG[summary.stage] || STAGE_CONFIG.beginner;
    const StageIcon = stageConf.icon;
    const totalConcepts = paths.reduce((acc, p) => acc + p.total_concepts, 0);
    const totalMastered = paths.reduce((acc, p) => acc + p.mastered_concepts, 0);

    return (
        <div style={styles.summaryBanner}>
            {/* Primary path callout */}
            <div style={styles.summaryPrimary}>
                <div style={styles.summaryPathLabel}>
                    <GraduationCap size={18} color="#a855f7" />
                    <span style={styles.summaryPathText}>Primary Path</span>
                </div>
                <h2 style={styles.summaryPathName}>{summary.primary_path}</h2>
                <div style={styles.summaryBadge}>
                    <StageIcon size={14} color={stageConf.color} />
                    <span style={{ color: stageConf.color, fontWeight: 600 }}>{stageConf.label}</span>
                </div>
            </div>

            {/* Stats row */}
            <div style={styles.summaryStats}>
                <SummaryStat icon={Map} label="Paths" value={summary.total_paths} color="#6366f1" />
                <SummaryStat icon={Target} label="Concepts" value={totalConcepts} color="#3b82f6" />
                <SummaryStat icon={CheckCircle} label="Mastered" value={totalMastered} color="#10b981" />
                <SummaryStat icon={BarChart3} label="Confidence" value={`${(summary.confidence * 100).toFixed(0)}%`} color="#f97316" />
                <SummaryStat icon={Clock} label="Last Scan" value={formatRelative(summary.last_analysis)} color="#71717a" />
            </div>
        </div>
    );
}

function SummaryStat({ icon: Icon, label, value, color }) {
    return (
        <div style={styles.summaryStatItem}>
            <Icon size={16} color={color} />
            <div>
                <div style={styles.summaryStatValue}>{value}</div>
                <div style={styles.summaryStatLabel}>{label}</div>
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════
//  PATH CARD
// ═══════════════════════════════════════════════════════════

function PathCard({ path, color, isExpanded, onToggle, onDescribe, isDescribing }) {
    const stageConf = STAGE_CONFIG[path.stage] || STAGE_CONFIG.beginner;
    const statusConf = STATUS_CONFIG[path.status] || STATUS_CONFIG.growing;
    const StageIcon = stageConf.icon;

    const completedNodes = path.nodes?.filter(n => n.is_completed) || [];
    const pendingNodes = path.nodes?.filter(n => !n.is_completed) || [];

    return (
        <div style={{
            ...styles.pathCard,
            borderColor: isExpanded ? color : 'rgba(255,255,255,0.06)',
            animation: 'fadeIn 0.3s ease-out',
        }}>
            {/* Card Header */}
            <div style={styles.pathCardHeader} onClick={onToggle}>
                <div style={styles.pathCardLeft}>
                    <div style={{
                        ...styles.pathDot,
                        background: color,
                        boxShadow: `0 0 12px ${color}40`,
                    }} />
                    <div>
                        <div style={styles.pathCardRow}>
                            <h3 style={styles.pathCardTitle}>{path.path_name}</h3>
                            {path.is_primary && (
                                <span style={styles.primaryBadge}>
                                    <Star size={10} /> Primary
                                </span>
                            )}
                        </div>
                        <div style={styles.pathCardMeta}>
                            <span style={{ color: stageConf.color }}>
                                <StageIcon size={12} style={{ marginRight: 4, verticalAlign: -2 }} />
                                {stageConf.label}
                            </span>
                            <span style={{ color: '#71717a' }}>•</span>
                            <span>{statusConf.dot} {statusConf.label}</span>
                            <span style={{ color: '#71717a' }}>•</span>
                            <span>{path.total_concepts} concepts</span>
                        </div>
                    </div>
                </div>

                <div style={styles.pathCardRight}>
                    {/* Circular Progress */}
                    <CircularProgress
                        value={path.completion_pct}
                        size={48}
                        color={color}
                    />
                    <div style={{
                        ...styles.expandIcon,
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>
                        <ChevronDown size={18} color="#71717a" />
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div style={styles.pathExpanded}>
                    {/* Description */}
                    <div style={styles.descriptionSection}>
                        {path.description ? (
                            <p style={styles.descriptionText}>{path.description}</p>
                        ) : (
                            <button
                                style={styles.describeBtn}
                                onClick={(e) => { e.stopPropagation(); onDescribe(path.id); }}
                                disabled={isDescribing}
                            >
                                {isDescribing ? (
                                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <Sparkles size={14} />
                                )}
                                {isDescribing ? 'Generating…' : 'Generate AI Description'}
                            </button>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div style={styles.progressSection}>
                        <div style={styles.progressHeader}>
                            <span style={styles.progressLabel}>
                                Progress: {path.mastered_concepts}/{path.total_concepts} mastered
                            </span>
                            <span style={{ ...styles.progressPct, color }}>{path.completion_pct.toFixed(0)}%</span>
                        </div>
                        <div style={styles.progressBarBg}>
                            <div style={{
                                ...styles.progressBarFill,
                                width: `${Math.min(path.completion_pct, 100)}%`,
                                background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                            }} />
                        </div>
                    </div>

                    {/* Concept Timeline */}
                    {path.nodes && path.nodes.length > 0 && (
                        <div style={styles.timelineSection}>
                            <h4 style={styles.sectionTitle}>
                                <Milestone size={16} color={color} />
                                Learning Timeline
                            </h4>
                            <div style={styles.timeline}>
                                {path.nodes.map((node, idx) => (
                                    <TimelineNode
                                        key={node.id}
                                        node={node}
                                        color={color}
                                        isLast={idx === path.nodes.length - 1}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missing Topics */}
                    {path.missing_topics && path.missing_topics.length > 0 && (
                        <div style={styles.missingSection}>
                            <h4 style={styles.sectionTitle}>
                                <Lightbulb size={16} color="#f59e0b" />
                                Suggested Topics to Explore
                            </h4>
                            <div style={styles.missingGrid}>
                                {path.missing_topics.map((topic, idx) => (
                                    <div key={idx} style={styles.missingChip}>
                                        <ArrowUpRight size={12} color="#f59e0b" />
                                        {topic}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Confidence Details */}
                    <div style={styles.confidenceSection}>
                        <div style={styles.confidenceBar}>
                            <span style={styles.confidenceLabel}>AI Confidence</span>
                            <div style={styles.confidenceTrack}>
                                <div style={{
                                    ...styles.confidenceFill,
                                    width: `${path.confidence * 100}%`,
                                    background: path.confidence >= 0.6
                                        ? '#10b981'
                                        : path.confidence >= 0.3
                                            ? '#f59e0b'
                                            : '#ef4444',
                                }} />
                            </div>
                            <span style={styles.confidenceValue}>{(path.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div style={styles.metaRow}>
                            <span style={styles.metaItem}>
                                <Clock size={12} /> Detected {formatDate(path.detected_at)}
                            </span>
                            <span style={styles.metaItem}>
                                <RefreshCw size={12} /> Updated {formatRelative(path.last_updated)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════
//  TIMELINE NODE
// ═══════════════════════════════════════════════════════════

function TimelineNode({ node, color, isLast }) {
    return (
        <div style={styles.timelineItem}>
            <div style={styles.timelineLine}>
                <div style={{
                    ...styles.timelineDot,
                    background: node.is_completed ? '#10b981' : 'transparent',
                    borderColor: node.is_completed ? '#10b981' : '#52525b',
                }}>
                    {node.is_completed && <CheckCircle size={10} color="#fff" />}
                </div>
                {!isLast && <div style={styles.timelineConnector} />}
            </div>
            <div style={styles.timelineContent}>
                <div style={styles.timelineNodeName}>
                    {node.node_name || 'Unknown'}
                </div>
                <div style={styles.timelineNodeMeta}>
                    {node.node_category && (
                        <span style={styles.timelineCat}>{node.node_category}</span>
                    )}
                    <MasteryDots mastery={node.node_mastery || 0} />
                    <span style={styles.timelineImportance}>
                        imp: {(node.importance_score * 100).toFixed(0)}%
                    </span>
                </div>
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════
//  MICRO COMPONENTS
// ═══════════════════════════════════════════════════════════

function CircularProgress({ value, size, color }) {
    const radius = (size - 6) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size}>
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4}
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={color} strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            <span style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#e4e4e7',
            }}>
                {value.toFixed(0)}%
            </span>
        </div>
    );
}

function MasteryDots({ mastery }) {
    const level = Math.round(mastery * 5);
    return (
        <span style={styles.masteryDots}>
            {[0, 1, 2, 3, 4].map(i => (
                <span key={i} style={{
                    display: 'inline-block',
                    width: 6, height: 6,
                    borderRadius: '50%',
                    marginRight: 2,
                    background: i < level ? '#10b981' : 'rgba(255,255,255,0.08)',
                }} />
            ))}
        </span>
    );
}


// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════

const styles = {
    page: {
        minHeight: '100vh',
        background: '#09090b',
        padding: '24px 32px',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        color: '#e4e4e7',
    },

    // Header
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
    },
    headerIcon: {
        width: 48, height: 48,
        borderRadius: 14,
        background: 'rgba(168,85,247,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(168,85,247,0.2)',
    },
    title: {
        fontSize: 26,
        fontWeight: 700,
        color: '#fafafa',
        margin: 0,
        letterSpacing: '-0.02em',
    },
    subtitle: {
        fontSize: 13,
        color: '#71717a',
        margin: 0,
        marginTop: 2,
    },
    analyzeBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        borderRadius: 10,
        border: '1px solid rgba(168,85,247,0.3)',
        background: 'rgba(168,85,247,0.1)',
        color: '#c084fc',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
    },

    // Loading
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 0',
        gap: 16,
    },
    loadingText: { color: '#71717a', fontSize: 14 },

    // Error
    errorBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 10,
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        color: '#fca5a5',
        fontSize: 13,
        marginBottom: 20,
    },

    // Empty state
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '60px 40px',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
    },
    emptyIcon: {
        width: 80, height: 80,
        borderRadius: 20,
        background: 'rgba(168,85,247,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 700,
        color: '#fafafa',
        margin: '0 0 8px',
    },
    emptyDesc: {
        fontSize: 14,
        color: '#71717a',
        maxWidth: 480,
        lineHeight: 1.6,
        margin: 0,
    },
    emptySteps: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 28,
    },
    emptyStep: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        color: '#a1a1aa',
    },
    emptyStepNum: {
        width: 22, height: 22,
        borderRadius: '50%',
        background: 'rgba(168,85,247,0.15)',
        color: '#c084fc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
    },

    // Summary Banner
    summaryBanner: {
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
        border: '1px solid rgba(168,85,247,0.12)',
        padding: '24px 28px',
        marginBottom: 24,
        animation: 'fadeIn 0.4s ease-out',
    },
    summaryPrimary: {
        marginBottom: 20,
    },
    summaryPathLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: '#a1a1aa',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 600,
        marginBottom: 6,
    },
    summaryPathText: {},
    summaryPathName: {
        fontSize: 22,
        fontWeight: 700,
        color: '#fafafa',
        margin: '0 0 8px',
    },
    summaryBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        fontSize: 12,
        fontWeight: 600,
    },
    summaryStats: {
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        paddingTop: 16,
        borderTop: '1px solid rgba(255,255,255,0.06)',
    },
    summaryStatItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    summaryStatValue: {
        fontSize: 15,
        fontWeight: 700,
        color: '#fafafa',
    },
    summaryStatLabel: {
        fontSize: 11,
        color: '#71717a',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    },

    // Path Cards
    pathsGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    pathCard: {
        borderRadius: 14,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        transition: 'border-color 0.3s ease',
    },
    pathCardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 22px',
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    pathCardLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
    },
    pathDot: {
        width: 14,
        height: 14,
        borderRadius: '50%',
        flexShrink: 0,
    },
    pathCardRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    pathCardTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: '#fafafa',
        margin: 0,
    },
    primaryBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 6,
        background: 'rgba(245,158,11,0.12)',
        color: '#fbbf24',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    pathCardMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: '#a1a1aa',
        marginTop: 4,
    },
    pathCardRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
    },
    expandIcon: {
        transition: 'transform 0.3s ease',
    },

    // Expanded
    pathExpanded: {
        padding: '0 22px 22px',
        animation: 'fadeIn 0.3s ease-out',
    },

    // Description
    descriptionSection: {
        marginBottom: 18,
    },
    descriptionText: {
        fontSize: 13,
        color: '#a1a1aa',
        lineHeight: 1.7,
        margin: 0,
        padding: '12px 16px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.02)',
        borderLeft: '3px solid rgba(168,85,247,0.3)',
    },
    describeBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 8,
        border: '1px dashed rgba(168,85,247,0.3)',
        background: 'transparent',
        color: '#c084fc',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
    },

    // Progress
    progressSection: {
        marginBottom: 20,
    },
    progressHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        color: '#a1a1aa',
    },
    progressPct: {
        fontSize: 13,
        fontWeight: 700,
    },
    progressBarBg: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
        transition: 'width 0.6s ease',
    },

    // Timeline
    timelineSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 700,
        color: '#e4e4e7',
        margin: '0 0 14px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    },
    timeline: {
        display: 'flex',
        flexDirection: 'column',
    },
    timelineItem: {
        display: 'flex',
        gap: 14,
        minHeight: 40,
    },
    timelineLine: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 20,
    },
    timelineDot: {
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: '2px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    timelineConnector: {
        width: 2,
        flex: 1,
        background: 'rgba(255,255,255,0.06)',
        marginTop: 2,
        marginBottom: 2,
    },
    timelineContent: {
        paddingBottom: 12,
        flex: 1,
    },
    timelineNodeName: {
        fontSize: 13,
        fontWeight: 600,
        color: '#e4e4e7',
    },
    timelineNodeMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 11,
        color: '#71717a',
        marginTop: 3,
    },
    timelineCat: {
        padding: '1px 6px',
        borderRadius: 4,
        background: 'rgba(255,255,255,0.04)',
        fontSize: 10,
    },
    masteryDots: {
        display: 'inline-flex',
        alignItems: 'center',
    },
    timelineImportance: {
        fontSize: 10,
        color: '#52525b',
    },

    // Missing topics
    missingSection: {
        marginBottom: 20,
    },
    missingGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
    },
    missingChip: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 8,
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.12)',
        color: '#fbbf24',
        fontSize: 12,
        fontWeight: 500,
    },

    // Confidence
    confidenceSection: {
        padding: '14px 16px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(255,255,255,0.04)',
    },
    confidenceBar: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    confidenceLabel: {
        fontSize: 11,
        color: '#71717a',
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        fontWeight: 600,
    },
    confidenceTrack: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    confidenceFill: {
        height: '100%',
        borderRadius: 2,
        transition: 'width 0.6s ease',
    },
    confidenceValue: {
        fontSize: 12,
        fontWeight: 700,
        color: '#e4e4e7',
        whiteSpace: 'nowrap',
    },
    metaRow: {
        display: 'flex',
        gap: 16,
    },
    metaItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        color: '#52525b',
    },
};
