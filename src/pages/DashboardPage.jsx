import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { productivity, tracking, connectDashboardWS } from '../api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatMinutes(mins) {
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}h ${m}m`;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [today, setToday] = useState(null);
    const [trend, setTrend] = useState(null);
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liveActivity, setLiveActivity] = useState(null);
    const wsRef = useRef(null);

    // Load initial data
    useEffect(() => {
        async function load() {
            try {
                const todayStr = new Date().toISOString().slice(0, 10);
                const [t, tr, d] = await Promise.all([
                    productivity.getToday().catch(() => null),
                    productivity.getTrend(14).catch(() => null),
                    tracking.getDomains({ start: todayStr }).catch(() => []),
                ]);
                setToday(t);
                setTrend(tr);
                setDomains(d);
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
                const [t, d] = await Promise.all([
                    productivity.getToday().catch(() => null),
                    tracking.getDomains({ start: todayStr }).catch(() => []),
                ]);
                if (t) setToday(t);
                if (d && d.length > 0) setDomains(d);
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

    // Derive active & distracting from domains data for consistency
    // Note: Tracking service group by domain, and for YouTube it includes 'videos' list.
    // The 'total_seconds' in the domain entry already includes all segments.
    const totalActiveFromDomains = domains.reduce((sum, d) => sum + (d.total_seconds || 0), 0) / 60;
    const distractingFromDomains = domains.filter(d => d.category === 'distracting').reduce((sum, d) => sum + (d.total_seconds || 0), 0) / 60;

    return (
        <div>
            <div className="page-header">
                <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.username} 👋</h1>
                <p>Here's your digital well-being overview</p>
            </div>

            {/* Stat Cards */}
            <div className="stat-grid">
                {/* Live Activity Card */}
                {liveActivity && liveActivity.domain && (
                    <div className="stat-card" style={{ borderLeft: '3px solid #7c5cff', gridColumn: '1 / -1' }}>
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
                    <div className="stat-label">Active Time</div>
                    <div className="stat-value">{formatMinutes(totalActiveFromDomains)}</div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-label">Distracting</div>
                    <div className="stat-value" style={{ color: '#f87171' }}>
                        {formatMinutes(distractingFromDomains)}
                    </div>
                </div>
            </div>

            <div className="grid-2">
                {/* Productivity Trend Chart */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Productivity Trend</div>
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

                {/* Top Domains */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Top Sites</div>
                            <div className="card-subtitle">By time spent today</div>
                        </div>
                    </div>

                    {domains.length > 0 ? (
                        <ul className="domain-list">
                            {domains.flatMap((d, i) => {
                                // YouTube: show each video as its own row
                                if (d.videos && d.videos.length > 0) {
                                    return d.videos.map((v, vi) => (
                                        <li key={`${i}-v${vi}`} className="domain-item">
                                            <div className="domain-info">
                                                <div className="domain-favicon" style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)', color: '#fff', fontSize: '10px' }}>
                                                    ▶
                                                </div>
                                                <div>
                                                    <div className="domain-name" style={{ fontSize: '13px' }} title={v.title}>
                                                        {v.title?.length > 45 ? v.title.slice(0, 45) + '...' : v.title}
                                                    </div>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>youtube.com</span>
                                                    {' '}
                                                    <span className={`badge badge-${d.category}`}>{d.category}</span>
                                                </div>
                                            </div>
                                            <div className="domain-time">{formatMinutes(v.seconds / 60)}</div>
                                        </li>
                                    ));
                                }

                                // Non-YouTube: normal domain row
                                return [(
                                    <li key={i} className="domain-item">
                                        <div className="domain-info">
                                            <div className="domain-favicon">
                                                {d.domain?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="domain-name">{d.domain}</div>
                                                <span className={`badge badge-${d.category}`}>{d.category}</span>
                                            </div>
                                        </div>
                                        <div className="domain-time">{formatMinutes(d.total_seconds / 60)}</div>
                                    </li>
                                )];
                            }).slice(0, 10)}
                        </ul>
                    ) : (
                        <div className="empty-state">
                            <h3>No browsing data</h3>
                            <p>Activity will appear here once the extension starts tracking</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Time by Site — Horizontal Bar Chart */}
            {domains.length > 0 && (() => {
                const categoryColors = { productive: '#00e68a', neutral: '#60a5fa', distracting: '#ff6b6b' };
                const maxSeconds = Math.max(...domains.map(d => d.total_seconds || 0), 1);
                return (
                    <div className="card" style={{ marginTop: '20px' }}>
                        <div className="card-header">
                            <div className="card-title">Time by Site</div>
                            <div className="card-subtitle">Today's browsing breakdown</div>
                        </div>
                        <div style={{ padding: '4px 0' }}>
                            {domains.filter(d => !d.videos).concat(
                                domains.filter(d => d.videos?.length > 0).flatMap(d =>
                                    d.videos.map(v => ({
                                        domain: v.title?.length > 35 ? v.title.slice(0, 35) + '...' : (v.title || 'YouTube Video'),
                                        total_seconds: v.seconds,
                                        category: d.category,
                                        isVideo: true,
                                    }))
                                )
                            ).sort((a, b) => (b.total_seconds || 0) - (a.total_seconds || 0)).slice(0, 8).map((d, i) => {
                                const mins = (d.total_seconds || 0) / 60;
                                const pct = ((d.total_seconds || 0) / maxSeconds) * 100;
                                const barColor = categoryColors[d.category] || '#60a5fa';
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', padding: '0 4px' }}>
                                        <div style={{ width: '140px', fontSize: '12px', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }} title={d.domain}>
                                            {d.isVideo ? '▶ ' : ''}{d.domain}
                                        </div>
                                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '5px', height: '20px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${Math.max(pct, 4)}%`,
                                                height: '100%',
                                                background: barColor,
                                                borderRadius: '5px',
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                        <div style={{ width: '40px', fontSize: '11px', color: '#999', textAlign: 'right', flexShrink: 0 }}>
                                            {Math.round(mins)}m
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
