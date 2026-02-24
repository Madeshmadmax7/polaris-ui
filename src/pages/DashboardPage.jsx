import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { productivity, tracking, connectDashboardWS } from '../api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function formatSeconds(secs) {
    if (!secs || secs <= 0) return '0s';
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

const CATEGORY_COLORS = {
    productive: '#00e68a',
    neutral: '#60a5fa',
    distracting: '#ff6b6b',
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [today, setToday] = useState(null);
    const [trend, setTrend] = useState(null);
    const [dashStats, setDashStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liveActivity, setLiveActivity] = useState(null);
    const [expandedSite, setExpandedSite] = useState(null);
    const wsRef = useRef(null);

    // Load initial data
    useEffect(() => {
        async function load() {
            try {
                const todayStr = new Date().toISOString().slice(0, 10);
                const [t, tr, stats] = await Promise.all([
                    productivity.getToday().catch(() => null),
                    productivity.getTrend(14).catch(() => null),
                    productivity.getDashboardStats({ start: todayStr }).catch(() => null),
                ]);
                setToday(t);
                setTrend(tr);
                setDashStats(stats);
            } catch (e) {
                console.log('Dashboard load:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // WebSocket for live tracking updates
    useEffect(() => {
        const token = localStorage.getItem('lifeos_token');
        if (!token) return;

        const conn = connectDashboardWS(token, (msg) => {
            if (msg.type === 'live_tracking' && msg.data) {
                setLiveActivity({ ...msg.data, receivedAt: Date.now() });
            }
        });
        wsRef.current = conn;

        return () => { if (conn) conn.close(); };
    }, []);

    // Auto-refresh dashboard data every 10s
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const todayStr = new Date().toISOString().slice(0, 10);
                const [t, stats] = await Promise.all([
                    productivity.getToday().catch(() => null),
                    productivity.getDashboardStats({ start: todayStr }).catch(() => null),
                ]);
                if (t) setToday(t);
                if (stats) setDashStats(stats);
            } catch {}
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
            </div>
        );
    }

    const score = today?.productivity_score || 0;
    const focusFactor = today?.focus_factor || 0;
    const totalSeconds = dashStats?.total_seconds || 0;
    const catSummary = dashStats?.category_summary || {};
    const sites = dashStats?.sites || [];
    const courseProgress = dashStats?.course_progress || {};

    // Pie chart data
    const pieData = [
        { name: 'Productive', value: catSummary.productive?.seconds || 0, color: CATEGORY_COLORS.productive },
        { name: 'Neutral', value: catSummary.neutral?.seconds || 0, color: CATEGORY_COLORS.neutral },
        { name: 'Distracting', value: catSummary.distracting?.seconds || 0, color: CATEGORY_COLORS.distracting },
    ].filter(d => d.value > 0);

    return (
        <div>
            <div className="page-header">
                <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.username} 👋</h1>
                <p>Here's your digital well-being overview</p>
            </div>

            {/* Live Activity Card */}
            {liveActivity && liveActivity.domain && (
                <div className="stat-card" style={{ borderLeft: '3px solid #7c5cff', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="stat-label">🔴 Live Activity</div>
                            <div className="stat-value" style={{ fontSize: '18px' }}>
                                {liveActivity.page_title || liveActivity.domain}
                            </div>
                            {liveActivity.page_title && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {liveActivity.domain}
                                </div>
                            )}
                        </div>
                        <span className={`badge badge-${liveActivity.category || 'neutral'}`}>
                            {liveActivity.category || 'neutral'}
                        </span>
                    </div>
                </div>
            )}

            {/* Top Stat Cards */}
            <div className="stat-grid">
                <div className="stat-card primary">
                    <div className="stat-label">Productivity Score</div>
                    <div className="stat-value">{Math.round(score)}</div>
                    {trend && (
                        <div className={`stat-change ${trend.trend === 'improving' ? 'positive' : trend.trend === 'declining' ? 'negative' : ''}`}>
                            {trend.trend === 'improving' ? '↑' : trend.trend === 'declining' ? '↓' : '→'} {trend.trend}
                        </div>
                    )}
                </div>

                <div className="stat-card success">
                    <div className="stat-label">Focus Factor</div>
                    <div className="stat-value">{(focusFactor * 100).toFixed(0)}%</div>
                    <div className="stat-change">{today?.tab_switches || 0} tab switches</div>
                </div>

                <div className="stat-card info">
                    <div className="stat-label">Total Active Time</div>
                    <div className="stat-value">{formatSeconds(totalSeconds)}</div>
                    <div className="stat-change" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {totalSeconds.toLocaleString()}s total
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-label">Distracting Time</div>
                    <div className="stat-value" style={{ color: '#f87171' }}>
                        {catSummary.distracting?.formatted_time || '0s'}
                    </div>
                    <div className="stat-change" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {catSummary.distracting?.percentage || 0}% of total
                    </div>
                </div>
            </div>

            {/* Category Breakdown Stacked Bar */}
            {totalSeconds > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <div className="card-title">⏱️ Time Distribution</div>
                        <div className="card-subtitle">{formatSeconds(totalSeconds)} total today</div>
                    </div>
                    <div style={{ padding: '0 16px 16px 16px' }}>
                        <div style={{ display: 'flex', height: '28px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                            {catSummary.productive?.seconds > 0 && (
                                <div style={{ width: `${catSummary.productive.percentage}%`, background: CATEGORY_COLORS.productive, minWidth: '2px' }} title={`Productive: ${catSummary.productive.formatted_time}`} />
                            )}
                            {catSummary.neutral?.seconds > 0 && (
                                <div style={{ width: `${catSummary.neutral.percentage}%`, background: CATEGORY_COLORS.neutral, minWidth: '2px' }} title={`Neutral: ${catSummary.neutral.formatted_time}`} />
                            )}
                            {catSummary.distracting?.seconds > 0 && (
                                <div style={{ width: `${catSummary.distracting.percentage}%`, background: CATEGORY_COLORS.distracting, minWidth: '2px' }} title={`Distracting: ${catSummary.distracting.formatted_time}`} />
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            {Object.entries(catSummary).map(([cat, data]) => (
                                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: CATEGORY_COLORS[cat] }} />
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}: <strong>{data.formatted_time}</strong> ({data.percentage}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid-2">
                {/* Productivity Trend Chart */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">📈 Productivity Trend</div>
                            <div className="card-subtitle">Last 14 days</div>
                        </div>
                        <span className={`badge badge-${trend?.trend === 'improving' ? 'productive' : trend?.trend === 'declining' ? 'distracting' : 'neutral'}`}>
                            {trend?.trend || 'stable'}
                        </span>
                    </div>

                    {trend?.scores?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={trend.scores}>
                                <defs>
                                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{
                                        background: '#1e1e3a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#eeeeff',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="productivity_score"
                                    stroke="#7c5cff"
                                    fill="url(#scoreGrad)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state">
                            <h3>No data yet</h3>
                            <p>Install the extension and start browsing to see your productivity trend</p>
                        </div>
                    )}
                </div>

                {/* Category Pie Chart */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">🍩 Usage Breakdown</div>
                        <div className="card-subtitle">By category</div>
                    </div>

                    {pieData.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '10px 0' }}>
                            <ResponsiveContainer width={180} height={180}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatSeconds(value)}
                                        contentStyle={{
                                            background: '#1e1e3a',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#eeeeff',
                                            fontSize: '12px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {pieData.map((d, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: d.color }} />
                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {d.name}: {formatSeconds(d.value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h3>No data yet</h3>
                            <p>Start browsing to see category distribution</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Per-Site Detailed Breakdown */}
            {sites.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <div className="card-title">🌐 Per-Site Breakdown</div>
                        <div className="card-subtitle">Seconds, time, and percentage for each site</div>
                    </div>
                    <div style={{ padding: '0 16px 16px 16px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                    <th style={{ padding: '8px 4px', fontWeight: 600 }}>Site</th>
                                    <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>Seconds</th>
                                    <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right', width: '100px' }}>Time</th>
                                    <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right', width: '70px' }}>%</th>
                                    <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'center', width: '80px' }}>Category</th>
                                    <th style={{ padding: '8px 4px', width: '30px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sites.map((site, i) => {
                                    const hasDetails = (site.videos && site.videos.length > 0) || (site.sessions && site.sessions.length > 0);
                                    const isExpanded = expandedSite === site.domain;
                                    return (
                                        <SiteRow
                                            key={i}
                                            site={site}
                                            hasDetails={hasDetails}
                                            isExpanded={isExpanded}
                                            onToggle={() => setExpandedSite(isExpanded ? null : site.domain)}
                                            maxSeconds={sites[0]?.total_seconds || 1}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Course Progress */}
            {courseProgress.total_plans > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <div className="card-title">📚 Course Progress</div>
                        <span className="badge badge-primary">
                            {courseProgress.completed_chapters}/{courseProgress.total_chapters} chapters
                        </span>
                    </div>

                    <div style={{ padding: '0 16px 16px 16px' }}>
                        {/* Overall stats row */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '140px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    {courseProgress.overall_completion_percentage}%
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overall Completion</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '140px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    {courseProgress.formatted_watched}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    Total Watch Time ({courseProgress.total_watched_seconds?.toLocaleString()}s)
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: '140px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    {courseProgress.overall_watch_percentage}%
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    Watch Progress ({courseProgress.formatted_watched} / {courseProgress.formatted_duration})
                                </div>
                            </div>
                        </div>

                        {/* Per-plan cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {courseProgress.plans?.map((plan) => (
                                <div
                                    key={plan.plan_id}
                                    style={{
                                        padding: '14px',
                                        background: 'var(--bg-elevated)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-subtle)',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{plan.title}</h4>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
                                            {plan.completion_percentage}%
                                        </span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                                        <div style={{ width: `${plan.completion_percentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', transition: 'width 0.3s ease' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        <span>{plan.completed_chapters}/{plan.total_chapters} chapters</span>
                                        <span>{plan.formatted_watched} watched ({plan.total_watched_seconds?.toLocaleString()}s)</span>
                                        <span>{plan.quiz_unlocked ? '🎯 Quiz ready' : '🔒 Quiz locked'}</span>
                                    </div>

                                    {/* Chapter rows */}
                                    {plan.chapters?.length > 0 && (
                                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {plan.chapters.map((ch) => (
                                                <div
                                                    key={ch.chapter_index}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '6px 8px',
                                                        background: 'var(--bg-card)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', color: ch.is_completed ? CATEGORY_COLORS.productive : 'var(--text-muted)' }}>
                                                        {ch.is_completed ? '✓' : '○'}
                                                    </span>
                                                    <span style={{ flex: 1, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {ch.title}
                                                    </span>
                                                    {ch.creator_name && (
                                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {ch.creator_name}
                                                        </span>
                                                    )}
                                                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                                                        {ch.watched_seconds}s/{ch.video_duration_seconds}s
                                                    </span>
                                                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                        {ch.formatted_watched}/{ch.formatted_duration}
                                                    </span>
                                                    <span style={{ fontWeight: 600, color: ch.is_completed ? CATEGORY_COLORS.productive : 'var(--color-primary)', whiteSpace: 'nowrap', minWidth: '35px', textAlign: 'right' }}>
                                                        {ch.watch_percentage}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Time by Site — Horizontal Bar Chart */}
            {sites.length > 0 && (() => {
                const maxSeconds = Math.max(...sites.map(d => d.total_seconds || 0), 1);
                return (
                    <div className="card" style={{ marginTop: '20px' }}>
                        <div className="card-header">
                            <div className="card-title">📊 Time by Site</div>
                            <div className="card-subtitle">Horizontal bar chart</div>
                        </div>
                        <div style={{ padding: '4px 16px 16px 16px' }}>
                            {sites.map((d, i) => {
                                const pct = (d.total_seconds / maxSeconds) * 100;
                                const barColor = CATEGORY_COLORS[d.category] || '#60a5fa';
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                        <div style={{ width: '140px', fontSize: '12px', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }} title={d.domain}>
                                            {d.domain}
                                        </div>
                                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '5px', height: '18px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${Math.max(pct, 3)}%`,
                                                height: '100%',
                                                background: barColor,
                                                borderRadius: '5px',
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                        <div style={{ width: '100px', fontSize: '11px', color: '#999', textAlign: 'right', flexShrink: 0 }}>
                                            {formatSeconds(d.total_seconds)} ({d.percentage}%)
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

/* Expandable site detail row for the per-site table */
function SiteRow({ site, hasDetails, isExpanded, onToggle, maxSeconds }) {
    const barWidth = Math.max((site.total_seconds / maxSeconds) * 100, 3);
    const barColor = CATEGORY_COLORS[site.category] || '#60a5fa';

    return (
        <>
            <tr
                style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: hasDetails ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                }}
                onClick={hasDetails ? onToggle : undefined}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <td style={{ padding: '10px 4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            background: site.domain?.includes('youtube') ? 'linear-gradient(135deg, #ff0000, #cc0000)' :
                                site.domain?.includes('chatgpt') || site.domain?.includes('openai') ? 'linear-gradient(135deg, #10a37f, #0d8c6d)' :
                                site.domain?.includes('claude') ? 'linear-gradient(135deg, #d97706, #b45309)' :
                                    'var(--bg-elevated)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '12px', fontWeight: 700, flexShrink: 0,
                        }}>
                            {site.domain?.includes('youtube') ? '▶' :
                                site.domain?.includes('chatgpt') || site.domain?.includes('openai') ? 'AI' :
                                site.domain?.includes('claude') ? 'AI' :
                                    site.domain?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{site.domain}</div>
                            <div style={{ width: '80px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '3px' }}>
                                <div style={{ width: `${barWidth}%`, height: '100%', background: barColor, borderRadius: '2px' }} />
                            </div>
                        </div>
                    </div>
                </td>
                <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {site.total_seconds?.toLocaleString()}
                </td>
                <td style={{ padding: '10px 4px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {site.formatted_time}
                </td>
                <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {site.percentage}%
                </td>
                <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                    <span className={`badge badge-${site.category}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {site.category}
                    </span>
                </td>
                <td style={{ padding: '10px 4px', textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
                    {hasDetails ? (isExpanded ? '▲' : '▼') : ''}
                </td>
            </tr>

            {/* Expanded YouTube videos */}
            {isExpanded && site.videos && site.videos.map((v, vi) => (
                <tr key={`v-${vi}`} style={{ background: 'rgba(124, 92, 255, 0.04)', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '6px 4px 6px 48px', fontSize: '12px' }}>
                        <span style={{ color: '#ff0000', marginRight: '6px' }}>▶</span>
                        <span style={{ color: 'var(--text-secondary)' }} title={v.title}>
                            {v.title?.length > 50 ? v.title.slice(0, 50) + '...' : v.title}
                        </span>
                        {v.category && (
                            <span className={`badge badge-${v.category}`} style={{ fontSize: '9px', padding: '1px 5px', marginLeft: '6px' }}>
                                {v.category}
                            </span>
                        )}
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {v.seconds?.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {v.formatted_time}
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {v.percentage}%
                    </td>
                    <td colSpan={2} />
                </tr>
            ))}

            {/* Expanded ChatGPT/AI sessions */}
            {isExpanded && site.sessions && site.sessions.map((s, si) => (
                <tr key={`s-${si}`} style={{ background: 'rgba(16, 163, 127, 0.04)', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '6px 4px 6px 48px', fontSize: '12px' }}>
                        <span style={{ color: '#10a37f', marginRight: '6px' }}>💬</span>
                        <span style={{ color: 'var(--text-secondary)' }} title={s.title}>
                            {s.title?.length > 50 ? s.title.slice(0, 50) + '...' : s.title}
                        </span>
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {s.seconds?.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {s.formatted_time}
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {s.percentage}%
                    </td>
                    <td colSpan={2} />
                </tr>
            ))}
        </>
    );
}