import React, { useState, useEffect } from 'react';
import { productivity } from '../api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Legend,
    AreaChart, Area
} from 'recharts';
import { 
    TrendingUp, 
    BarChart3, 
    Zap, 
    Target, 
    Globe, 
    ChevronRight,
    Calendar,
    Activity,
    Clock,
    MousePointer2
} from 'lucide-react';

function AnalyticCard({ label, value, icon, isTrend }) {
    return (
        <div className="bg-zinc-900 border border-white/5 p-8 rounded-[32px] hover:border-white/10 transition-all group overflow-hidden relative shadow-2xl">
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white group-hover:text-black transition-all border border-white/10 group-hover:border-white">
                    {React.cloneElement(icon, { size: 16 })}
                </div>
                {isTrend && (
                    <div className="px-3 py-1 bg-white text-black rounded-full text-[8px] font-bold uppercase tracking-widest">
                        Stream
                    </div>
                )}
            </div>
            <div className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em] mb-2 relative z-10">{label}</div>
            <div className={`text-4xl font-light text-white tracking-tight tabular-nums relative z-10 ${String(value).length > 8 ? 'text-2xl' : ''}`}>
                {value}
            </div>
        </div>
    );
}

function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 ${color} rounded-full`} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">{label}</span>
        </div>
    );
}


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
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black z-[1000] font-outfit">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600">Compiling Analytical Baseline</span>
                </div>
            </div>
        );
    }

    const scores = trend?.scores || [];

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl animate-in font-outfit">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">Neural / Intelligence / Baseline</span>
                    </div>
                    <h1 className="text-4xl font-light tracking-tight text-white mb-2">
                        Productivity <span className="font-semibold">Performance</span>
                    </h1>
                    <p className="text-zinc-500 text-[13px] font-light tracking-wide max-w-sm">
                        Real-time analytical mapping of cognitive output and temporal allocation cycles.
                    </p>
                </div>
                
                <div className="flex bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-md">
                    {[7, 14, 30, 60].map((d) => (
                        <button
                            key={d}
                            className={`px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ${
                                days === d 
                                ? 'bg-white text-black shadow-2xl' 
                                : 'text-zinc-500 hover:text-white'
                            }`}
                            onClick={() => setDays(d)}
                        >
                            {d} Days
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <AnalyticCard 
                    label="Aggregate Velocity" 
                    value={Math.round(trend?.average_score || 0)} 
                    icon={<BarChart3 size={18} />} 
                />
                <AnalyticCard 
                    label="Peak Performance" 
                    value={Math.round(Math.max(...scores.map(s => s.productivity_score), 0))} 
                    icon={<Target size={18} />} 
                />
                <AnalyticCard 
                    label="Neural Momentum" 
                    value={trend?.trend || 'Stable'} 
                    icon={<Activity size={18} />} 
                    isTrend
                />
                <AnalyticCard 
                    label="Resonance Frequency" 
                    value={`${Math.round((scores.reduce((a, s) => a + s.focus_factor, 0) / Math.max(scores.length, 1)) * 100)}%`} 
                    icon={<Zap size={18} />} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
                {/* Score Trends */}
                <div className="lg:col-span-8 bg-zinc-900/40 border border-white/5 p-12 rounded-[40px] shadow-3xl backdrop-blur-sm">
                    <div className="mb-12 flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-semibold tracking-tight text-white mb-2">Neural Intensity Mapping</h3>
                            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em]">Productivity Index vs Focus Resonance</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <TrendingUp size={20} className="text-white" />
                        </div>
                    </div>
                    
                    {scores.length > 0 ? (
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={scores}>
                                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700, fill: '#52525b' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis yAxisId="score" domain={[0, 100]} tick={{ fontSize: 9, fontWeight: 700, fill: '#52525b' }} axisLine={false} tickLine={false} dx={-10} />
                                    <YAxis yAxisId="focus" orientation="right" domain={[0, 1]} hide />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#000',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '24px',
                                            padding: '20px',
                                            boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
                                        }}
                                        itemStyle={{ textTransform: 'uppercase', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em' }}
                                        labelStyle={{ color: '#52525b', fontWeight: 700, marginBottom: '8px', fontSize: '9px', textTransform: 'uppercase' }}
                                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                    />
                                    <Legend 
                                        wrapperStyle={{ paddingTop: '30px', fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.2em', color: '#52525b' }} 
                                        iconType="circle"
                                        align="left"
                                    />
                                    <Line
                                        yAxisId="score"
                                        type="monotone"
                                        dataKey="productivity_score"
                                        stroke="#fff"
                                        name="Efficiency Index"
                                        strokeWidth={3}
                                        dot={{ r: 0 }}
                                        activeDot={{ r: 6, fill: '#fff', stroke: '#000', strokeWidth: 2 }}
                                    />
                                    <Line
                                        yAxisId="focus"
                                        type="monotone"
                                        dataKey="focus_factor"
                                        stroke="rgba(255,255,255,0.15)"
                                        name="Focus Resonance"
                                        strokeWidth={2}
                                        strokeDasharray="8 8"
                                        dot={{ r: 0 }}
                                        activeDot={{ r: 5, fill: 'rgba(255,255,255,0.2)', stroke: '#000', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[400px] flex items-center justify-center bg-white/5 rounded-[40px] border border-dashed border-white/5">
                            <p className="text-zinc-700 font-bold uppercase tracking-[0.5em] text-[10px]">Awaiting Neural Feedback</p>
                        </div>
                    )}
                </div>

                {/* Vertical Distribution */}
                <div className="lg:col-span-4 bg-zinc-900 border border-white/5 p-12 rounded-[40px] shadow-3xl">
                    <div className="mb-12">
                        <h3 className="text-xl font-semibold tracking-tight text-white mb-2">Cycle Log</h3>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Temporal Component Breakdown</p>
                    </div>
                    
                    {scores.length > 0 ? (
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={scores.slice(-7)} layout="vertical">
                                    <CartesianGrid strokeDasharray="6 6" horizontal={false} stroke="rgba(255,255,255,0.03)" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="date" type="category" tick={{ fontSize: 9, fontWeight: 700, fill: '#52525b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                                        formatter={(v) => [`${Math.round(v)} min`, '']}
                                    />
                                    <Bar dataKey="productive_minutes" name="Efficient" stackId="a" fill="#fff" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="neutral_minutes" name="Baseline" stackId="a" fill="#3f3f46" />
                                    <Bar dataKey="distracting_minutes" name="Leakage" stackId="a" fill="#18181b" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Daily Time Breakdown — Large Stacked Bar */}
            <div className="bg-zinc-900 border border-white/5 p-12 rounded-[40px] mb-16 shadow-3xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-10">
                    <div>
                        <h3 className="text-2xl font-semibold tracking-tight text-white mb-2">Temporal Composition</h3>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.4em]">Mass distribution across active cycles</p>
                    </div>
                    <div className="flex flex-wrap gap-8 bg-black/40 px-10 py-6 rounded-full border border-white/5">
                        <LegendItem color="bg-white" label="Efficient" />
                        <LegendItem color="bg-zinc-600" label="Baseline" />
                        <LegendItem color="bg-zinc-800" label="Leakage" />
                    </div>
                </div>

                {scores.length > 0 ? (
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scores}>
                                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700, fill: '#52525b' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#52525b' }} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', color: '#fff', padding: '16px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                    formatter={(v) => [`${Math.round(v)} MINS`, '']}
                                />
                                <Bar dataKey="productive_minutes" stackId="a" fill="#fff" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="neutral_minutes" stackId="a" fill="#3f3f46" />
                                <Bar dataKey="distracting_minutes" stackId="a" fill="#18181b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : null}
            </div>

            {/* Top Domain Intelligence */}
            {scores.length > 0 && (() => {
                const domainMap = {};
                scores.forEach(s => {
                    (s.top_domains || []).forEach(d => {
                        if (!domainMap[d.domain]) domainMap[d.domain] = { domain: d.domain, seconds: 0 };
                        domainMap[d.domain].seconds += d.seconds;
                    });
                });
                const domainList = Object.values(domainMap).sort((a, b) => b.seconds - a.seconds).slice(0, 10);
                const domainCategories = {};
                scores.forEach(s => {
                    (s.top_domains || []).forEach(d => {
                        if (!domainCategories[d.domain] && d.category) domainCategories[d.domain] = d.category;
                    });
                });

                return (
                    <div className="bg-black border border-white/5 rounded-[48px] overflow-hidden mb-16 shadow-3xl">
                        <div className="p-10 border-b border-white/5 bg-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
                            <div>
                                <h3 className="text-2xl font-semibold tracking-tight text-white mb-2 flex items-center gap-4">
                                    <Globe size={24} className="text-zinc-500" /> Interface Dominance
                                </h3>
                                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.4em]">Aggregated influence mapping by domain</p>
                            </div>
                            <div className="px-6 py-2.5 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                Top 10 Identified Nodes
                            </div>
                        </div>
                        <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                            {domainList.map((d, i) => {
                                const mins = d.seconds / 60;
                                const maxMins = domainList[0].seconds / 60;
                                const pct = (mins / Math.max(maxMins, 1)) * 100;
                                const cat = domainCategories[d.domain] || 'neutral';
                                return (
                                    <div key={i} className="group/item">
                                        <div className="flex justify-between items-end mb-4 px-1">
                                            <div className="text-[14px] font-medium text-white tracking-tight truncate max-w-[200px]" title={d.domain}>
                                                {d.domain}
                                            </div>
                                            <div className="text-[9px] font-bold tabular-nums text-zinc-600 uppercase tracking-widest whitespace-nowrap ml-4">
                                                {Math.round(mins)}M / <span className={cat === 'productive' ? 'text-white' : 'text-zinc-700'}>{cat}</span>
                                            </div>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${cat === 'productive' ? 'bg-white' : cat === 'neutral' ? 'bg-zinc-700' : 'bg-zinc-800'}`} 
                                                style={{ width: `${Math.max(pct, 2)}%` }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* Detailed Log Table */}
            {scores.length > 0 && (
                <div className="bg-zinc-900 border border-white/5 rounded-[48px] overflow-hidden shadow-3xl">
                    <div className="p-12 border-b border-white/5 bg-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div>
                            <h3 className="text-2xl font-semibold tracking-tight text-white mb-2 flex items-center gap-4">
                                <Calendar size={28} className="text-zinc-500" /> Operational Log
                            </h3>
                            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.4em]">Historical cycle audit trail</p>
                        </div>
                        <Activity className="text-zinc-800" size={48} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 border-b border-white/5 bg-black/20">
                                    <th className="pl-12 pr-8 py-8">Cycle Timestamp</th>
                                    <th className="px-4 py-8 text-center">Protocol Index</th>
                                    <th className="px-4 py-8 text-center">Resonance</th>
                                    <th className="px-4 py-8 text-right">Magnitude</th>
                                    <th className="px-4 py-8 text-right text-white">Efficient Component</th>
                                    <th className="px-4 py-8 text-right text-zinc-700">Leakage</th>
                                    <th className="pr-12 pl-8 py-8 text-center">Nodes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.slice().reverse().map((s, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="pl-12 pr-8 py-7 text-[13px] font-medium text-white tracking-tight">{s.date}</td>
                                        <td className="px-4 py-7 text-center">
                                            <span className={`px-5 py-1.5 rounded-full text-[10px] font-bold tabular-nums uppercase border ${
                                                s.productivity_score > 60 ? 'bg-white text-black border-white' :
                                                s.productivity_score > 30 ? 'bg-black text-white border-white/10' : 
                                                'bg-zinc-900 text-zinc-700 border-transparent'
                                            }`}>
                                                {Math.round(s.productivity_score)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-7 text-center font-medium text-white text-[13px] tabular-nums">{(s.focus_factor * 100).toFixed(0)}%</td>
                                        <td className="px-4 py-7 text-right text-[10px] font-bold text-zinc-600 tabular-nums uppercase">{Math.round(s.total_active_minutes)}M ACTV</td>
                                        <td className="px-4 py-7 text-right text-[13px] font-medium text-white tabular-nums">{Math.round(s.productive_minutes)}M</td>
                                        <td className="px-4 py-7 text-right text-[13px] font-medium text-zinc-700 tabular-nums">{Math.round(s.distracting_minutes)}M</td>
                                        <td className="pr-12 pl-8 py-7 text-center">
                                            <div className="inline-flex items-center gap-2 text-[10px] font-bold text-zinc-600 tabular-nums">
                                               {s.tab_switches} <MousePointer2 size={10}/>
                                            </div>
                                        </td>
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
