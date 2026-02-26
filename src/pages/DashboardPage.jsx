import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { productivity, tracking, connectDashboardWS } from '../api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
    Activity, 
    BarChart3, 
    Clock, 
    TrendingUp, 
    TrendingDown, 
    Minus, 
    Monitor, 
    Globe, 
    ChevronDown, 
    ChevronUp, 
    Youtube, 
    MessageSquare, 
    Bot,
    GraduationCap,
    CheckCircle2,
    Lock
} from 'lucide-react';

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
    productive: '#ffffff',
    neutral: '#71717a',
    distracting: '#3f3f46',
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
        const token = localStorage.getItem('polaris_token');
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
            <div className="fixed inset-0 flex items-center justify-center bg-black z-[1000]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-white/5 border-t-white rounded-full animate-spin"></div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.5em] text-zinc-500">Authenticating Data Stream</span>
                </div>
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
        { name: 'Productive', value: catSummary.productive?.seconds || 0, color: '#000000' },
        { name: 'Neutral', value: catSummary.neutral?.seconds || 0, color: '#a1a1aa' },
        { name: 'Distracting', value: catSummary.distracting?.seconds || 0, color: '#e4e4e7' },
    ].filter(d => d.value > 0);

    return (
        <div className="container mx-auto px-6 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 px-1 font-outfit">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">Core / Dashboard</span>
                    </div>
                    <h1 className="text-3xl font-light tracking-tight text-white">
                        Welcome, <span className="font-semibold">{user?.username}</span>
                    </h1>
                </div>
                <div className="text-left md:text-right">
                    <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-1">Active Session</div>
                    <div className="text-2xl font-light text-white tabular-nums">
                        {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* Live Activity Card */}
            {liveActivity && liveActivity.domain && (
                <div className="bg-zinc-900 border border-white/5 p-8 rounded-[40px] mb-12 flex flex-col md:flex-row items-center justify-between shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/[0.05] transition-all duration-1000"></div>
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 text-white rounded-[20px] flex items-center justify-center animate-pulse">
                            <Activity size={24} />
                        </div>
                        <div>
                            <div className="text-[9px] uppercase tracking-[0.4em] text-zinc-600 font-bold mb-2">Real-time Stream</div>
                            <div className="text-xl font-medium truncate max-w-xl text-white tracking-tight">
                                {liveActivity.page_title || liveActivity.domain}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mt-1 opacity-60">{liveActivity.domain}</div>
                        </div>
                    </div>
                    <div className="mt-6 md:mt-0 px-6 py-2 bg-white text-black rounded-full text-[9px] font-bold uppercase tracking-[0.2em] relative z-10 hover:opacity-90 transition-all">
                        {liveActivity.category || 'neutral'}
                    </div>
                </div>
            )}

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 px-1">
                <StatCard 
                    label="Productivity Index" 
                    value={Math.round(score)} 
                    icon={<TrendingUp size={20} />} 
                    trend={trend}
                />
                <StatCard 
                    label="Focus Resonance" 
                    value={`${(focusFactor * 100).toFixed(0)}%`} 
                    icon={<Activity size={20} />} 
                    subvalue={`${today?.tab_switches || 0} switches`}
                />
                <StatCard 
                    label="Active Horizon" 
                    value={formatSeconds(totalSeconds)} 
                    icon={<Clock size={20} />} 
                />
                <StatCard 
                    label="Distraction Leakage" 
                    value={catSummary.distracting?.formatted_time || '0s'} 
                    icon={<Monitor size={20} />} 
                    subvalue={`${catSummary.distracting?.percentage || 0}% of cycle`}
                    isAlert={catSummary.distracting?.percentage > 30}
                />
            </div>

            {/* Main Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
                {/* Trend Chart */}
                <div className="lg:col-span-8 bg-black border border-white/10 rounded-[40px] p-10 shadow-2xl">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h3 className="text-xl font-semibold tracking-tight text-white mb-2">Trajectory Analysis</h3>
                            <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-[0.2em]">14 Cycle Performance Mapping</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                           <BarChart3 size={20} className="text-zinc-400" />
                        </div>
                    </div>

                    <div className="h-[350px]">
                        {trend?.scores?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trend.scores}>
                                    <defs>
                                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#fff" stopOpacity={0.1} />
                                            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 500, fill: '#71717a' }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fontWeight: 500, fill: '#71717a' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#000',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '16px',
                                            color: '#fff',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ color: '#fff', fontWeight: 500, textTransform: 'uppercase', fontSize: '10px' }}
                                        labelStyle={{ color: '#71717a', fontWeight: 500, marginBottom: '6px', fontSize: '9px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="productivity_score"
                                        stroke="#fff"
                                        fill="url(#scoreGrad)"
                                        strokeWidth={3}
                                        dot={{ r: 0 }}
                                        activeDot={{ r: 6, fill: '#fff', stroke: '#000', strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-800">
                                <BarChart3 size={48} strokeWidth={1} />
                                <p className="text-[10px] font-medium uppercase tracking-[0.5em] mt-6 text-zinc-600">Awaiting Historical Baseline</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pie Chart / Breakdown */}
                <div className="lg:col-span-4 bg-black border border-white/5 rounded-[40px] p-10 shadow-3xl">
                    <div className="mb-12">
                        <h3 className="text-xl font-semibold tracking-tight mb-2 text-white">Cycle Allocation</h3>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Usage Breakdown by Sector</p>
                    </div>

                    <div className="flex flex-col items-center justify-center h-[280px] mb-10">
                        {pieData.length > 0 ? (
                            <div className="w-full h-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={90}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, idx) => (
                                                <Cell key={idx} fill={idx === 0 ? '#fff' : idx === 1 ? '#3f3f46' : '#18181b'} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            content={({ payload }) => {
                                                if (payload && payload[0]) {
                                                    return (
                                                        <div className="bg-white text-black p-3 rounded-xl font-semibold text-[10px] uppercase shadow-2xl">
                                                            {payload[0].name}: {formatSeconds(payload[0].value)}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">{catSummary.productive?.percentage || 0}%</div>
                                        <div className="text-[8px] font-medium uppercase tracking-widest text-zinc-600">Efficiency</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Activity className="text-zinc-800" size={48} strokeWidth={1} />
                        )}
                    </div>

                    <div className="space-y-2">
                        {pieData.map((d, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3.5 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1 h-1 rounded-full ${idx === 0 ? 'bg-white' : idx === 1 ? 'bg-zinc-700' : 'bg-zinc-900'}`} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{d.name}</span>
                                </div>
                                <span className="text-[11px] font-medium text-white">{formatSeconds(d.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Per-Site Detailed Breakdown */}
            {sites.length > 0 && (
                <div className="bg-black border border-white/10 rounded-[40px] overflow-hidden mb-12 shadow-2xl">
                    <div className="p-10 border-b border-white/10 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-semibold tracking-tight text-white mb-1">Domain Intelligence</h3>
                            <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-[0.4em]">Granular analysis of active interfaces</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-5 py-2.5 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-widest">
                                {sites.length} Active Nodes
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-600 border-b border-white/5">
                                    <th className="pl-10 pr-8 py-5">Identity</th>
                                    <th className="px-4 py-5 text-right">Magnitude</th>
                                    <th className="px-4 py-5 text-right">Temporal</th>
                                    <th className="px-4 py-5 text-right">Share</th>
                                    <th className="px-4 py-5 text-center">Class</th>
                                    <th className="pr-10 pl-8 py-5"></th>
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

            {/* Course Progress Section */}
            {courseProgress.total_plans > 0 && (
                <div className="bg-black border border-white/5 text-white rounded-[48px] p-12 overflow-hidden relative group shadow-3xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.01] rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-white/[0.02] transition-all"></div>
                    
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-16 px-4">
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-zinc-500">
                                        <GraduationCap size={24} />
                                    </div>
                                    <h3 className="text-2xl font-semibold tracking-tight">Knowledge Mastery</h3>
                                </div>
                                <p className="text-zinc-600 font-bold uppercase tracking-[0.3em] text-[9px] max-w-sm">Synchronized tracking across all active educational neural paths.</p>
                            </div>
                            <div className="text-left md:text-right">
                                <div className="text-5xl font-light text-white mb-2 tabular-nums">{courseProgress.overall_completion_percentage}%</div>
                                <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-700">Aggregate completion Rate</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <LearningStat 
                                label="Completed Nodes" 
                                value={`${courseProgress.completed_chapters}/${courseProgress.total_chapters}`} 
                                icon={<CheckCircle2 size={18} />} 
                            />
                            <LearningStat 
                                label="Retention Duration" 
                                value={courseProgress.formatted_watched} 
                                icon={<Clock size={18} />} 
                            />
                            <LearningStat 
                                label="Neural Intake" 
                                value={`${courseProgress.overall_watch_percentage}%`} 
                                icon={<Monitor size={18} />} 
                            />
                        </div>

                        <div className="space-y-6">
                            {courseProgress.plans?.map((plan) => (
                                <div key={plan.plan_id} className="bg-white/5 border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.07] transition-all">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                        <div>
                                            <h4 className="text-xl font-medium tracking-tight mb-2">{plan.title}</h4>
                                            <div className="flex items-center gap-4">
                                                <div className="px-4 py-1.5 bg-black/40 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                                                    {plan.total_chapters} Lessons Defined
                                                </div>
                                                {plan.quiz_unlocked && (
                                                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/80">
                                                       <CheckCircle2 size={12} /> Quiz Core Active
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-light text-white mb-2">{plan.completion_percentage}%</div>
                                            <div className="w-40 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="bg-white h-full transition-all duration-1000" style={{ width: `${plan.completion_percentage}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {plan.chapters?.slice(0, 6).map((ch) => (
                                            <div key={ch.chapter_index} className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/20 transition-all group/item">
                                                <div className={`p-1.5 rounded-lg transition-all ${ch.is_completed ? 'bg-white text-black' : 'bg-white/5 text-zinc-800'}`}>
                                                    {ch.is_completed ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] font-bold uppercase truncate group-hover/item:text-white transition-colors">{ch.title}</div>
                                                    <div className="text-[9px] font-bold uppercase text-zinc-700 mt-1">{ch.watch_percentage}% Intake</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {plan.chapters?.length > 6 && (
                                        <div className="mt-6 text-center">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-800">And {plan.chapters.length - 6} Additional Nodes</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon, trend, subvalue, isAlert }) {
    return (
        <div className={`bg-zinc-900 border border-white/5 p-7 rounded-[40px] hover:border-white/10 transition-all font-outfit shadow-3xl ${isAlert ? 'ring-1 ring-white/10' : ''}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-zinc-400">
                    {React.cloneElement(icon, { size: 18 })}
                </div>
                {trend && (
                    <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white text-black`}>
                        {trend.trend}
                    </div>
                )}
            </div>
            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">{label}</div>
            <div className="text-2xl font-medium text-white tracking-tight tabular-nums mb-2">{value}</div>
            {subvalue && (
                <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-700">{subvalue}</div>
            )}
        </div>
    );
}

function LearningStat({ label, value, icon }) {
    return (
        <div className="bg-white/5 p-6 rounded-[28px] border border-white/5 hover:border-white/10 transition-all flex items-center gap-5">
            <div className="p-3 bg-white/5 rounded-xl text-white">
                {icon}
            </div>
            <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-700 mb-1">{label}</div>
                <div className="text-xl font-medium text-white tabular-nums">{value}</div>
            </div>
        </div>
    );
}

function SiteRow({ site, hasDetails, isExpanded, onToggle, maxSeconds }) {
    const barWidth = Math.max((site.total_seconds / maxSeconds) * 100, 3);

    return (
        <>
            <tr
                className={`transition-all border-b border-white/5 ${hasDetails ? 'cursor-pointer hover:bg-white/5' : ''}`}
                onClick={hasDetails ? onToggle : undefined}
            >
                <td className="pl-10 pr-8 py-6">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-white/5 text-white flex items-center justify-center font-bold text-lg border border-white/10">
                            {site.domain?.includes('youtube') ? <Youtube size={20} /> :
                             site.domain?.includes('chatgpt') || site.domain?.includes('openai') ? <Bot size={20} /> :
                             site.domain?.includes('claude') ? <Bot size={20} /> :
                             site.domain?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white tracking-tight text-base mb-2 truncate max-w-[280px]">{site.domain}</div>
                            <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="bg-white/60 h-full transition-all duration-1000" 
                                    style={{ width: `${barWidth}%` }} 
                                />
                            </div>
                        </div>
                    </div>
                </td>
                <td className="px-4 py-6 text-right font-medium text-[10px] text-zinc-700 tabular-nums">
                    {site.total_seconds?.toLocaleString()}S
                </td>
                <td className="px-4 py-6 text-right text-lg font-semibold text-white tabular-nums tracking-tight">
                    {site.formatted_time}
                </td>
                <td className="px-4 py-6 text-right text-[10px] font-medium text-zinc-600 tabular-nums uppercase tracking-widest">
                    {site.percentage}%
                </td>
                <td className="px-4 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        site.category === 'productive' ? 'bg-white text-black border-white' : 
                        site.category === 'neutral' ? 'bg-transparent text-zinc-400 border-white/10' : 
                        'bg-zinc-900 text-zinc-600 border-transparent'
                    }`}>
                        {site.category}
                    </span>
                </td>
                <td className="pr-10 pl-8 py-6 text-center text-zinc-600">
                    {hasDetails && (
                        <div className={`p-2 rounded-lg border border-white/5 transition-all ${isExpanded ? 'bg-white text-black border-white' : 'bg-transparent'}`}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                    )}
                </td>
            </tr>

            {/* Expanded Content */}
            {isExpanded && (
                <tr className="bg-zinc-50/50">
                    <td colSpan={6} className="px-10 py-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {site.videos && site.videos.map((v, vi) => (
                                <ExpandedItem 
                                    key={vi} 
                                    title={v.title} 
                                    category={v.category} 
                                    time={v.formatted_time} 
                                    share={v.percentage} 
                                    icon={<Youtube size={16} />} 
                                />
                            ))}

                            {site.sessions && site.sessions.map((s, si) => (
                                <ExpandedItem 
                                    key={si} 
                                    title={s.title} 
                                    category="Interaction Session" 
                                    time={s.formatted_time} 
                                    share={s.percentage} 
                                    icon={<MessageSquare size={16} />} 
                                />
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

function ExpandedItem({ title, category, time, share, icon }) {
    return (
        <div className="flex items-center justify-between p-7 bg-white/5 rounded-[32px] border border-white/5 transition-all animate-in slide-in-from-top-2 duration-300 shadow-xl overflow-hidden">
            <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="p-3 bg-white/5 rounded-2xl text-zinc-500">
                    {icon}
                </div>
                <div className="truncate flex-1">
                    <div className="text-[13px] font-semibold text-white tracking-tight truncate mb-1">{title}</div>
                    <div className="text-[9px] font-medium uppercase text-zinc-600 tracking-wider">{category || 'uncategorized'}</div>
                </div>
            </div>
            <div className="text-right ml-6 pl-6 border-l border-white/5 flex flex-col justify-center min-w-max">
                <div className="text-[13px] font-semibold text-white tabular-nums">{time}</div>
                <div className="text-[9px] font-medium uppercase text-zinc-700 mt-1 tracking-widest">{share}% Share</div>
            </div>
        </div>
    );
}