import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { tracking } from '../api';
import {
    Settings,
    Shield,
    ShieldAlert,
    User,
    Globe,
    Chrome,
    Trash2,
    RefreshCw,
    ChevronRight,
    Zap,
    Fingerprint
} from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [newDomain, setNewDomain] = useState('');
    const [newCategory, setNewCategory] = useState('productive');
    const [blockingMode, setBlockingMode] = useState('hard'); // hard | soft
    const [resettingToday, setResettingToday] = useState(false);
    const [extensionActive, setExtensionActive] = useState(false);
    const [extensionData, setExtensionData] = useState(null);

    useEffect(() => {
        // Connection to Chrome Extension for live status
        window.postMessage({ type: 'POLARIS_STATUS_REQUEST' }, '*');

        const listener = (event) => {
            if (event.data && event.data.type === 'POLARIS_STATUS_RESPONSE') {
                setExtensionActive(true);
                setExtensionData(event.data.data);
                if (event.data.data.blockingMode) {
                    setBlockingMode(event.data.data.blockingMode);
                }
            }
        };

        window.addEventListener('message', listener);
        return () => window.removeEventListener('message', listener);
    }, []);

    const handleSetMode = (mode) => {
        window.postMessage({ type: 'POLARIS_SET_MODE', mode }, '*');
        setExtensionData(prev => ({ ...prev, blockingMode: mode }));
        setBlockingMode(mode); // Update local state immediately for UI responsiveness
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const cat = await tracking.setCategory({
                domain_pattern: newDomain,
                category: newCategory,
            });
            setCategories([cat, ...categories]);
            setNewDomain('');
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl animate-in font-outfit">
            <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">System / Architecture / Preferences</span>
                    </div>
                    <h1 className="text-4xl font-light tracking-tight text-white mb-2 leading-[0.9]">
                        Operational <span className="font-semibold text-white/90">Parameters</span>
                    </h1>
                    <p className="text-zinc-500 text-[13px] font-light tracking-wide max-w-sm">
                        Configure the core behavioral guardrails and identity protocols of the POLARIS system.
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Node Identity: <span className="text-white ml-2 tabular-nums">4.0.21_GENESIS</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                {/* Enforcement Mode */}
                <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-10 flex flex-col shadow-3xl">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white">
                                <Shield size={20} />
                            </div>
                            <h3 className="text-lg font-semibold tracking-tight text-white">Policy Protocol</h3>
                        </div>
                        <div className={`px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border ${blockingMode === 'hard' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-white/10'
                            }`}>
                            {blockingMode}
                        </div>
                    </div>

                    <p className="text-zinc-500 text-[12px] font-light leading-relaxed mb-12">
                        Specify the strictness of focus enforcement. <span className="text-white font-medium">Hard Mode</span> operates at the network kernel level. <span className="text-white font-medium">Soft Mode</span> utilizes a cognitive UI overlay system.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleSetMode('hard')}
                            className={`flex flex-col items-center justify-center gap-4 py-8 rounded-[24px] font-bold uppercase tracking-[0.3em] text-[10px] transition-all duration-300 border ${blockingMode === 'hard'
                                    ? 'bg-white text-black border-white shadow-2xl scale-[1.02]'
                                    : 'bg-white/5 text-zinc-600 border-white/5 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            <ShieldAlert size={20} className={blockingMode === 'hard' ? 'animate-pulse' : ''} />
                            Hard Mode
                        </button>
                        <button
                            onClick={() => handleSetMode('soft')}
                            className={`flex flex-col items-center justify-center gap-4 py-8 rounded-[24px] font-bold uppercase tracking-[0.3em] text-[10px] transition-all duration-300 border ${blockingMode === 'soft'
                                    ? 'bg-white text-black border-white shadow-2xl scale-[1.02]'
                                    : 'bg-white/5 text-zinc-600 border-white/5 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            <User size={20} />
                            Soft Mode
                        </button>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-black border border-white/5 rounded-[40px] p-10 flex flex-col shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity">
                        <Fingerprint size={280} />
                    </div>
                    <div className="flex items-center gap-4 mb-10 relative z-10">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                            <User size={20} className="text-white" />
                        </div>
                        <h3 className="text-lg font-semibold tracking-tight text-white">Identity Matrix</h3>
                    </div>

                    <div className="space-y-10 relative z-10 flex-1">
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-700 mb-2 flex items-center gap-2">
                                IDENTIFIER_NODE
                            </div>
                            <div className="text-3xl font-light text-white tracking-tight leading-none truncate">{user?.username}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-700 mb-2 flex items-center gap-2">
                                DATA_LINK_STATION
                            </div>
                            <div className="text-[14px] font-medium text-zinc-400 tracking-wide">{user?.email}</div>
                        </div>
                        <div className="mt-4">
                            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-700 mb-2 flex items-center gap-2">
                                PROTOCOL_CLEARANCE
                            </div>
                            <div className="inline-flex">
                                <span className="px-5 py-1.5 bg-white/5 border border-white/10 text-white rounded-full text-[9px] font-bold uppercase tracking-widest">
                                    {user?.role} ACCESS
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Domain Categories */}
                <div className="md:col-span-2 bg-zinc-950/20 border border-white/5 rounded-[48px] p-10 shadow-3xl">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-12">
                        <div>
                            <h3 className="text-2xl font-semibold tracking-tight text-white mb-2 flex items-center gap-4">
                                <Globe size={24} className="text-zinc-600" /> Domain Intelligence
                            </h3>
                            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.4em]">Categorize identified network nodes for priority enforcement</p>
                        </div>
                    </div>

                    <form onSubmit={handleAddCategory} className="mb-12">
                        <div className="flex flex-col md:flex-row gap-4 p-2 bg-white/5 rounded-[32px] border border-white/5 group transition-all">
                            <div className="flex-1 flex items-center gap-4 px-6 py-4 bg-black/40 rounded-[24px] border border-transparent group-focus-within:border-white/10 transition-all">
                                <Globe className="text-zinc-700" size={18} />
                                <input
                                    className="flex-1 bg-transparent border-none text-[13px] font-medium text-white placeholder:text-zinc-800 focus:outline-none"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    placeholder="Enter node domain pattern..."
                                    required
                                />
                            </div>
                            <div className="flex items-center bg-black/40 rounded-[24px] border border-transparent px-6 py-4">
                                <select
                                    className="bg-transparent border-none text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500 focus:outline-none appearance-none cursor-pointer pr-4"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                >
                                    <option value="productive" className="bg-zinc-900">Efficiency Core</option>
                                    <option value="neutral" className="bg-zinc-900">Neutral Hub</option>
                                    <option value="distracting" className="bg-zinc-900">Energy Leakage</option>
                                </select>
                            </div>
                            <button type="submit" className="bg-white text-black px-10 py-4 rounded-full font-bold uppercase tracking-[0.3em] text-[10px] hover:opacity-90 active:scale-95 transition-all flex items-center gap-3">
                                <Zap size={14} fill="currentColor" /> Register
                            </button>
                        </div>
                    </form>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {categories.map((c) => (
                            <div key={c.id} className="group/item flex flex-col justify-between p-7 bg-white/5 border border-white/5 rounded-[32px] hover:border-white/20 transition-all duration-300 relative overflow-hidden">
                                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-700 mb-4">Identified Pattern</div>
                                <span className="text-[13px] font-medium text-white truncate mb-6">{c.domain_pattern}</span>
                                <div className="flex justify-between items-center pt-5 border-t border-white/5">
                                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-[0.2em] transition-all ${c.category === 'productive' ? 'bg-white text-black' :
                                            c.category === 'distracting' ? 'bg-transparent text-white border border-white/20' : 'bg-transparent text-zinc-700 border border-white/5'
                                        }`}>
                                        {c.category}
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-zinc-800 group-hover/item:bg-white transition-colors"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Neural Interface Info */}
                <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-10 flex flex-col shadow-3xl relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-10 relative z-10">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white">
                            <Chrome size={20} />
                        </div>
                        <h3 className="text-lg font-semibold tracking-tight text-white uppercase italic">Protocol_Iface</h3>
                    </div>

                    <p className="text-zinc-600 text-[11px] font-medium leading-relaxed uppercase tracking-[0.1em] mb-12 relative z-10">
                        Execute manual synchronization via the Browser Core to enable high-fidelity monitoring and granular enforcement capabilities.
                    </p>

                    <div className="space-y-6 flex-1 relative z-10">
                        {[
                            'Access CHROME://EXTENSIONS',
                            'Enable DEVELOPER_MODE.EXE',
                            'Execute LOAD_UNPACKED_PROTOCOL',
                            'Target BINARY_ROOT/EXTENSION/'
                        ].map((step, i) => (
                            <div key={i} className="flex items-center gap-6 group/step cursor-default">
                                <span className="text-[10px] font-bold text-zinc-800 group-hover/step:text-white transition-all font-mono italic">
                                    {i + 1}
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-600 group-hover/step:text-white transition-all">
                                    {step}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center relative z-10">
                        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-800">Protocol Release</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 tabular-nums">4.0.21-POLAR</span>
                    </div>
                </div>

                {/* Kernel Reset */}
                <div className="bg-black border border-white/5 rounded-[40px] p-10 flex flex-col shadow-3xl relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-10 relative z-10">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white">
                            <Trash2 size={20} />
                        </div>
                        <h3 className="text-lg font-semibold tracking-tight text-white">Kernel Scrub</h3>
                    </div>

                    <p className="text-zinc-600 text-[12px] font-light leading-relaxed mb-12 relative z-10">
                        Execute a complete purge of all operational metrics and log files for the current 24-hour cycle. Warning: This action is <span className="text-white font-medium">irreversible</span>.
                    </p>

                    <button
                        disabled={resettingToday}
                        onClick={async () => {
                            if (!confirm('Are you sure? This will delete ALL tracking data for today. This cannot be undone.')) return;
                            setResettingToday(true);
                            try {
                                const result = await tracking.resetToday();
                                alert(`✓ ${result.message}`);
                            } catch (err) { alert('Failed: ' + err.message); }
                            finally { setResettingToday(false); }
                        }}
                        className="mt-auto w-full group/btn bg-white text-black py-5 rounded-full font-bold uppercase tracking-[0.3em] text-[10px] hover:opacity-90 transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 relative z-10"
                    >
                        {resettingToday ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        {resettingToday ? 'PURGING_DATA...' : 'EXECUTE_SCRUB'}
                    </button>
                </div>
            </div>
        </div>
    );
}
