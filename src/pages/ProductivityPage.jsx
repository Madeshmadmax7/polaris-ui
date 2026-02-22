import { useState, useEffect } from 'react';
import { productivity } from '../api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Legend,
    PieChart, Pie, Cell
} from 'recharts';

export default function ProductivityPage() {
    const [trend, setTrend] = useState(null);
    const [days, setDays] = useState(14);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await productivity.getTrend(days);
                setTrend(data);
            } catch (e) {
                console.log('Productivity load:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [days]);

    if (loading) {
        return <div className="loading-spinner"><div className="spinner"></div></div>;
    }

    const scores = trend?.scores || [];

    return (
        <div>
            <div className="page-header">
                <h1>Productivity Analytics ⚡</h1>
                <p>Deep dive into your focus patterns and productivity metrics</p>
            </div>

            {/* Period Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {[7, 14, 30, 60].map((d) => (
                    <button
                        key={d}
                        className={`btn ${days === d ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => setDays(d)}
                    >
                        {d} days
                    </button>
                ))}
            </div>

            {/* Summary Stats */}
            <div className="stat-grid">
                <div className="stat-card primary">
                    <div className="stat-label">Avg Score</div>
                    <div className="stat-value">{Math.round(trend?.average_score || 0)}</div>
                </div>
                <div className="stat-card success">
                    <div className="stat-label">Best Day</div>
                    <div className="stat-value">
                        {Math.round(Math.max(...scores.map(s => s.productivity_score), 0))}
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-label">Trend</div>
                    <div className="stat-value" style={{ fontSize: '20px' }}>
                        {trend?.trend === 'improving' ? '📈 Improving' :
                            trend?.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-label">Avg Focus</div>
                    <div className="stat-value">
                        {Math.round((scores.reduce((a, s) => a + s.focus_factor, 0) / Math.max(scores.length, 1)) * 100)}%
                    </div>
                </div>
            </div>

            {/* Score + Focus Chart */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <div className="card-title">Score & Focus Factor</div>
                </div>
                {scores.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={scores}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="score" domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="focus" orientation="right" domain={[0, 1]} tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{
                                    background: '#1e1e3a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#eeeeff',
                                }}
                            />
                            <Legend />
                            <Line
                                yAxisId="score"
                                type="monotone"
                                dataKey="productivity_score"
                                stroke="#7c5cff"
                                strokeWidth={2}
                                name="Score"
                                dot={{ fill: '#7c5cff', r: 3 }}
                            />
                            <Line
                                yAxisId="focus"
                                type="monotone"
                                dataKey="focus_factor"
                                stroke="#00d4ff"
                                strokeWidth={2}
                                name="Focus Factor"
                                dot={{ fill: '#00d4ff', r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="empty-state">
                        <h3>No data for this period</h3>
                    </div>
                )}
            </div>

            {/* Daily Time Breakdown — Stacked Bar Chart */}
            <div className="card">
                <div className="card-header">
                    <div className="card-title">Daily Time Breakdown</div>
                    <div className="card-subtitle">Minutes by category per day</div>
                </div>
                {scores.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={scores}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#999' }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#999' }} />
                            <Tooltip
                                contentStyle={{
                                    background: '#1e1e3a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#eeeeff',
                                }}
                                formatter={(value, name) => [`${Math.round(value)}m`, name]}
                            />
                            <Legend />
                            <Bar dataKey="productive_minutes" name="Productive" stackId="a" fill="#00e68a" />
                            <Bar dataKey="neutral_minutes" name="Neutral" stackId="a" fill="#60a5fa" />
                            <Bar dataKey="distracting_minutes" name="Distracting" stackId="a" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="empty-state">
                        <h3>No data for this period</h3>
                    </div>
                )}
            </div>

            {/* Per-Domain Time — Horizontal Bar Chart */}
            {scores.length > 0 && (() => {
                // Aggregate top_domains across all selected days
                const domainMap = {};
                const categoryColors = { productive: '#00e68a', neutral: '#60a5fa', distracting: '#ff6b6b' };
                scores.forEach(s => {
                    (s.top_domains || []).forEach(d => {
                        if (!domainMap[d.domain]) domainMap[d.domain] = { domain: d.domain, seconds: 0 };
                        domainMap[d.domain].seconds += d.seconds;
                    });
                });
                const domainList = Object.values(domainMap).sort((a, b) => b.seconds - a.seconds).slice(0, 10);

                // Get categories from the most recent domains API data or infer
                // We'll look up each domain category from the first score that has it
                const domainCategories = {};
                scores.forEach(s => {
                    (s.top_domains || []).forEach(d => {
                        if (!domainCategories[d.domain] && d.category) domainCategories[d.domain] = d.category;
                    });
                });

                return (
                    <div className="card" style={{ marginTop: '20px' }}>
                        <div className="card-header">
                            <div className="card-title">Time by Site</div>
                            <div className="card-subtitle">Top domains across selected period</div>
                        </div>
                        <div style={{ padding: '4px 0' }}>
                            {domainList.map((d, i) => {
                                const mins = d.seconds / 60;
                                const maxMins = domainList[0].seconds / 60;
                                const pct = (mins / Math.max(maxMins, 1)) * 100;
                                const cat = domainCategories[d.domain] || 'neutral';
                                const barColor = categoryColors[cat] || '#60a5fa';
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', padding: '0 4px' }}>
                                        <div style={{ width: '140px', fontSize: '13px', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }} title={d.domain}>
                                            {d.domain}
                                        </div>
                                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '6px', height: '24px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${Math.max(pct, 3)}%`,
                                                height: '100%',
                                                background: barColor,
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                paddingLeft: '8px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: '#111',
                                                transition: 'width 0.5s ease',
                                            }}>
                                                {mins >= 1 ? `${Math.round(mins)}m` : ''}
                                            </div>
                                        </div>
                                        <div style={{ width: '50px', fontSize: '12px', color: '#999', textAlign: 'right', flexShrink: 0 }}>
                                            {Math.round(mins)}m
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* Daily Details */}
            {scores.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <div className="card-title">Daily Breakdown</div>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Score</th>
                                    <th>Focus</th>
                                    <th>Active</th>
                                    <th>Productive</th>
                                    <th>Distracting</th>
                                    <th>Switches</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.map((s, i) => (
                                    <tr key={i}>
                                        <td>{s.date}</td>
                                        <td>
                                            <span style={{
                                                color: s.productivity_score > 60 ? 'var(--color-success)' :
                                                    s.productivity_score > 30 ? 'var(--color-warning)' : 'var(--color-danger)',
                                                fontWeight: 600,
                                            }}>
                                                {Math.round(s.productivity_score)}
                                            </span>
                                        </td>
                                        <td>{(s.focus_factor * 100).toFixed(0)}%</td>
                                        <td>{Math.round(s.total_active_minutes)}m</td>
                                        <td style={{ color: 'var(--color-success)' }}>{Math.round(s.productive_minutes)}m</td>
                                        <td style={{ color: 'var(--color-danger)' }}>{Math.round(s.distracting_minutes)}m</td>
                                        <td>{s.tab_switches}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
