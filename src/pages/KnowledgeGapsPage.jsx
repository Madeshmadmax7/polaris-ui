import React, { useState, useEffect, useCallback } from 'react';
import { knowledgeGap } from '../api';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Target,
    Zap,
    RefreshCw,
    BookOpen,
    PlayCircle,
    FileText,
    Activity,
    ChevronDown,
    ChevronRight,
    Loader2,
    ShieldAlert,
    ExternalLink,
    Sparkles,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
//  CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════

const PRIORITY_CONFIG = {
    critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: ShieldAlert },
    high: { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: AlertTriangle },
    medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Target },
    low: { label: 'Low', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: Activity },
};

const RESOURCE_ICONS = {
    tutorial: BookOpen,
    documentation: FileText,
    video: PlayCircle,
    practice: Target,
    article: FileText,
};

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
    return d.toLocaleDateString();
}


// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function KnowledgeGapsPage() {
    const [data, setData] = useState(null);
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingRecs, setGeneratingRecs] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const [expandedGap, setExpandedGap] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await knowledgeGap.getAll();
            setData(res);
            if (res?.gaps?.length > 0) {
                setExpandedGap(res.gaps[0].id);
            }
        } catch (err) {
            console.error('[KnowledgeGaps] Error:', err);
            setError('Failed to load knowledge gaps');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAnalyze = async () => {
        try {
            setAnalyzing(true);
            await knowledgeGap.triggerAnalysis();
            setTimeout(() => {
                fetchData();
                setAnalyzing(false);
            }, 3000);
        } catch (err) {
            setError('Failed to trigger analysis');
            setAnalyzing(false);
        }
    };

    const handleGenerateRecs = async () => {
        try {
            setGeneratingRecs(true);
            const res = await knowledgeGap.getRecommendations();
            setRecs(res.recommendations || []);
        } catch (err) {
            console.error('Rec generation error:', err);
        } finally {
            setGeneratingRecs(false);
        }
    };

    // ── Render ──
    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.headerIcon}>
                        <AlertTriangle size={28} color="#ef4444" />
                    </div>
                    <div>
                        <h1 style={styles.title}>Knowledge Gaps</h1>
                        <p style={styles.subtitle}>
                            Missing prerequisites detected in your learning paths
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        style={{ ...styles.actionBtn, ...styles.recBtn }}
                        onClick={handleGenerateRecs}
                        disabled={generatingRecs || !data?.gaps?.length}
                    >
                        {generatingRecs ? (
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <Sparkles size={16} />
                        )}
                        Action Plan
                    </button>
                    <button
                        style={{ ...styles.actionBtn, opacity: analyzing ? 0.6 : 1 }}
                        onClick={handleAnalyze}
                        disabled={analyzing}
                    >
                        {analyzing ? (
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        Scan Graph
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div style={styles.errorBanner}>
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div style={styles.loadingContainer}>
                    <Loader2 size={32} color="#ef4444" style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={styles.loadingText}>Analyzing dependency chains…</p>
                </div>
            ) : !data?.gaps?.length ? (
                /* Empty State */
                <EmptyState onAnalyze={handleAnalyze} analyzing={analyzing} />
            ) : (
                /* Content */
                <div style={styles.contentGrid}>
                    
                    {/* Left Column: Gaps List */}
                    <div style={styles.mainCol}>
                        <SummaryBanner summary={data.summary} />
                        
                        <div style={styles.gapList}>
                            <h3 style={styles.sectionHeader}>Detected Gaps</h3>
                            {data.gaps.map((gap) => (
                                <GapCard
                                    key={gap.id}
                                    gap={gap}
                                    isExpanded={expandedGap === gap.id}
                                    onToggle={() => setExpandedGap(expandedGap === gap.id ? null : gap.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Recommendations & Stats */}
                    <div style={styles.sideCol}>
                        {recs.length > 0 ? (
                            <div style={styles.recsPanel}>
                                <div style={styles.recsHeader}>
                                    <Sparkles size={18} color="#a855f7" />
                                    <h3 style={styles.recsTitle}>AI Study Plan</h3>
                                </div>
                                <p style={styles.recsDesc}>Suggested resources to close your top gaps.</p>
                                <div style={styles.recsList}>
                                    {recs.map((rec, idx) => (
                                        <RecommendationCard key={idx} rec={rec} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={styles.emptyRecsPanel}>
                                <Target size={32} color="#52525b" />
                                <p style={styles.emptyRecsText}>
                                    Generate an AI Action Plan to get personalized study resources for your gaps.
                                </p>
                                <button
                                    style={{ ...styles.actionBtn, ...styles.recBtn, marginTop: 12 }}
                                    onClick={handleGenerateRecs}
                                    disabled={generatingRecs}
                                >
                                    {generatingRecs ? 'Generating…' : 'Generate Action Plan'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Spin keyframe */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
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
                <CheckCircle size={48} color="#10b981" />
            </div>
            <h2 style={styles.emptyTitle}>No Knowledge Gaps Detected</h2>
            <p style={styles.emptyDesc}>
                Your foundational knowledge looks solid! The AI hasn't found any critical missing prerequisites for your current learning paths.
            </p>
            <button
                style={{ ...styles.actionBtn, marginTop: 24, padding: '10px 24px' }}
                onClick={onAnalyze}
                disabled={analyzing}
            >
                {analyzing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                {analyzing ? 'Scanning Graph…' : 'Scan Graph Again'}
            </button>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════
//  SUMMARY BANNER
// ═══════════════════════════════════════════════════════════

function SummaryBanner({ summary }) {
    if (!summary) return null;

    return (
        <div style={styles.summaryBanner}>
            <div style={styles.summaryStats}>
                <div style={styles.statBox}>
                    <div style={styles.statLabel}>Total Gaps</div>
                    <div style={styles.statValue}>{summary.total_gaps}</div>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.statBox}>
                    <div style={styles.statLabel}>Critical Risk</div>
                    <div style={{ ...styles.statValue, color: summary.critical_gaps > 0 ? '#ef4444' : '#fafafa' }}>
                        {summary.critical_gaps}
                    </div>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.statBox}>
                    <div style={styles.statLabel}>Avg Severity</div>
                    <div style={styles.statValue}>{(summary.avg_severity * 100).toFixed(0)}%</div>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.statBox}>
                    <div style={styles.statLabel}>Impacted Path</div>
                    <div style={{ ...styles.statValue, fontSize: 16 }}>{summary.most_impacted_path || '—'}</div>
                </div>
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════
//  GAP CARD
// ═══════════════════════════════════════════════════════════

function GapCard({ gap, isExpanded, onToggle }) {
    const pConf = PRIORITY_CONFIG[gap.priority] || PRIORITY_CONFIG.medium;
    const PIcon = pConf.icon;

    return (
        <div style={{
            ...styles.gapCard,
            borderColor: isExpanded ? pConf.color : 'rgba(255,255,255,0.06)',
        }}>
            <div style={styles.gapCardHeader} onClick={onToggle}>
                <div style={styles.gapCardLeft}>
                    <div style={{ ...styles.priorityIcon, background: pConf.bg }}>
                        <PIcon size={20} color={pConf.color} />
                    </div>
                    <div>
                        <h4 style={styles.gapConcept}>{gap.concept}</h4>
                        <div style={styles.gapMeta}>
                            <span style={{ color: pConf.color, fontWeight: 600 }}>{pConf.label} Priority</span>
                            <span style={{ color: '#52525b' }}>•</span>
                            <span>{gap.learning_path_name || 'General'}</span>
                        </div>
                    </div>
                </div>
                <div style={styles.gapCardRight}>
                    <div style={styles.severityBar}>
                        <div style={styles.severityFillBg}>
                            <div style={{
                                ...styles.severityFill,
                                width: `${gap.severity * 100}%`,
                                background: pConf.color,
                            }} />
                        </div>
                        <span style={styles.severityText}>{(gap.severity * 100).toFixed(0)}% Severity</span>
                    </div>
                    <ChevronDown size={18} color="#71717a" style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                    }} />
                </div>
            </div>

            {isExpanded && (
                <div style={styles.gapExpanded}>
                    {/* Reason */}
                    <div style={styles.reasonBox}>
                        <div style={styles.reasonHeader}>
                            <Zap size={14} color="#f59e0b" />
                            <span>Why this matters</span>
                        </div>
                        <p style={styles.reasonText}>{gap.reason}</p>
                    </div>

                    {/* Blocked Concepts */}
                    {gap.blocks_concepts && gap.blocks_concepts.length > 0 && (
                        <div style={styles.blocksSection}>
                            <span style={styles.blocksLabel}>Blocks understanding of:</span>
                            <div style={styles.blocksList}>
                                {gap.blocks_concepts.map((b, i) => (
                                    <div key={i} style={styles.blockChip}>
                                        <AlertTriangle size={12} color="#f97316" />
                                        {b}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Meta Footer */}
                    <div style={styles.gapFooter}>
                        <div style={styles.footerItem}>
                            <Clock size={12} /> {gap.estimated_study_minutes} mins estimated
                        </div>
                        <div style={styles.footerItem}>
                            <Activity size={12} /> {gap.difficulty} difficulty
                        </div>
                        <div style={styles.footerItem}>
                            <ShieldAlert size={12} /> Detected by {gap.detection_method === 'ai' ? 'AI Analysis' : 'Prerequisite Chain'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════
//  RECOMMENDATION CARD
// ═══════════════════════════════════════════════════════════

function RecommendationCard({ rec }) {
    const Icon = RESOURCE_ICONS[rec.resource_type] || BookOpen;
    
    return (
        <div style={styles.recCard}>
            <div style={styles.recHeader}>
                <div style={styles.recIconWrap}>
                    <Icon size={16} color="#a855f7" />
                </div>
                <div style={styles.recTarget}>For: {rec.concept}</div>
            </div>
            <h4 style={styles.recTitle}>{rec.title}</h4>
            <p style={styles.recDesc}>{rec.description}</p>
            <div style={styles.recMeta}>
                <span>{rec.estimated_minutes} min {rec.resource_type}</span>
                <span style={{ color: '#52525b' }}>•</span>
                <span style={{ textTransform: 'capitalize' }}>{rec.difficulty}</span>
            </div>
        </div>
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
        background: 'rgba(239,68,68,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(239,68,68,0.2)',
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
    actionBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.04)',
        color: '#e4e4e7',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
    },
    recBtn: {
        border: '1px solid rgba(168,85,247,0.4)',
        background: 'rgba(168,85,247,0.15)',
        color: '#d8b4fe',
    },

    // Loading & Empty
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 0',
        gap: 16,
    },
    loadingText: { color: '#71717a', fontSize: 14 },
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
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '80px 40px',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.1)',
    },
    emptyIcon: {
        width: 80, height: 80,
        borderRadius: 20,
        background: 'rgba(16,185,129,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: { fontSize: 20, fontWeight: 700, color: '#fafafa', margin: '0 0 8px' },
    emptyDesc: { fontSize: 14, color: '#71717a', maxWidth: 480, lineHeight: 1.6, margin: 0 },

    // Layout
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 24,
        alignItems: 'start',
    },
    mainCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    sideCol: {
        position: 'sticky',
        top: 24,
    },

    // Summary
    summaryBanner: {
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(249,115,22,0.06))',
        border: '1px solid rgba(239,68,68,0.1)',
        padding: '20px 24px',
        animation: 'fadeIn 0.3s ease-out',
    },
    summaryStats: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statBox: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#a1a1aa',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: 600,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 700,
        color: '#fafafa',
    },
    statDivider: {
        width: 1,
        height: 32,
        background: 'rgba(255,255,255,0.06)',
    },

    // Gap List
    sectionHeader: {
        fontSize: 14,
        fontWeight: 700,
        color: '#a1a1aa',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        margin: '0 0 12px 4px',
    },
    gapList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    gapCard: {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        animation: 'fadeIn 0.3s ease-out',
    },
    gapCardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        cursor: 'pointer',
    },
    gapCardLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
    },
    priorityIcon: {
        width: 36, height: 36,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    gapConcept: {
        fontSize: 16,
        fontWeight: 700,
        color: '#fafafa',
        margin: '0 0 4px',
    },
    gapMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: '#a1a1aa',
    },
    gapCardRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    },
    severityBar: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6,
        width: 100,
    },
    severityFillBg: {
        width: '100%',
        height: 4,
        borderRadius: 2,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    severityFill: {
        height: '100%',
        borderRadius: 2,
    },
    severityText: {
        fontSize: 10,
        color: '#71717a',
        fontWeight: 600,
        textTransform: 'uppercase',
    },
    
    // Expanded
    gapExpanded: {
        padding: '0 20px 20px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        marginTop: 4,
        paddingTop: 16,
    },
    reasonBox: {
        background: 'rgba(255,255,255,0.015)',
        borderLeft: '3px solid #f59e0b',
        padding: '12px 16px',
        borderRadius: '0 8px 8px 0',
        marginBottom: 16,
    },
    reasonHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 700,
        color: '#f59e0b',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: 6,
    },
    reasonText: {
        margin: 0,
        fontSize: 13,
        color: '#e4e4e7',
        lineHeight: 1.6,
    },
    blocksSection: {
        marginBottom: 16,
    },
    blocksLabel: {
        fontSize: 12,
        color: '#a1a1aa',
        display: 'block',
        marginBottom: 8,
    },
    blocksList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
    },
    blockChip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 6,
        background: 'rgba(249,115,22,0.08)',
        border: '1px solid rgba(249,115,22,0.15)',
        color: '#fdba74',
        fontSize: 11,
        fontWeight: 600,
    },
    gapFooter: {
        display: 'flex',
        gap: 16,
        paddingTop: 12,
        borderTop: '1px dashed rgba(255,255,255,0.06)',
    },
    footerItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        color: '#71717a',
    },

    // Recommendations Panel
    recsPanel: {
        background: 'rgba(168,85,247,0.04)',
        border: '1px solid rgba(168,85,247,0.15)',
        borderRadius: 14,
        padding: 20,
        animation: 'fadeIn 0.4s ease-out',
    },
    recsHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    recsTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: '#d8b4fe',
        margin: 0,
    },
    recsDesc: {
        fontSize: 12,
        color: '#a1a1aa',
        margin: '0 0 16px',
    },
    recsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    recCard: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: 14,
    },
    recHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    recIconWrap: {
        width: 24, height: 24,
        borderRadius: 6,
        background: 'rgba(168,85,247,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    recTarget: {
        fontSize: 11,
        fontWeight: 600,
        color: '#c084fc',
        textTransform: 'uppercase',
    },
    recTitle: {
        fontSize: 14,
        fontWeight: 700,
        color: '#fafafa',
        margin: '0 0 6px',
        lineHeight: 1.4,
    },
    recDesc: {
        fontSize: 12,
        color: '#a1a1aa',
        margin: '0 0 10px',
        lineHeight: 1.5,
    },
    recMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11,
        color: '#71717a',
        fontWeight: 600,
    },
    emptyRecsPanel: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.01)',
        border: '1px dashed rgba(255,255,255,0.1)',
        borderRadius: 14,
        padding: 32,
    },
    emptyRecsText: {
        fontSize: 13,
        color: '#71717a',
        lineHeight: 1.6,
        marginTop: 12,
        marginBottom: 0,
    },
};
