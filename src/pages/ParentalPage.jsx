import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { parental } from '../api';
import { 
    Users, 
    UserPlus, 
    Activity, 
    ShieldOff, 
    Key, 
    Shield, 
    Globe, 
    TrendingUp, 
    Lock,
    Unlock,
    Search,
    ChevronRight,
    Zap
} from 'lucide-react';

export default function ParentalPage() {
    const { user } = useAuth();
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [childData, setChildData] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [blockDomain, setBlockDomain] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'parent') loadChildren();
        else setLoading(false);
    }, [user]);

    async function loadChildren() {
        try {
            const c = await parental.getChildren();
            setChildren(c);
            if (c.length > 0) await selectChild(c[0].id);
        } catch (e) { console.log(e); }
        finally { setLoading(false); }
    }

    async function selectChild(id) {
        setSelectedChild(id);
        try {
            const data = await parental.getChildOverview(id);
            setChildData(data);
        } catch (e) { console.log(e); }
    }

    async function handleInvite(e) {
        e.preventDefault();
        try {
            const res = await parental.invite(inviteEmail);
            alert(`Invite code: ${res.invite_code}`);
            setInviteEmail('');
        } catch (err) { alert(err.message); }
    }

    async function handleAcceptInvite(e) {
        e.preventDefault();
        try {
            await parental.acceptInvite(inviteCode);
            alert('Invite accepted!'); setInviteCode('');
        } catch (err) { alert(err.message); }
    }

    async function handleBlock(e) {
        e.preventDefault();
        if (!selectedChild || !blockDomain) return;
        try {
            await parental.blockSite({ child_id: selectedChild, domain: blockDomain });
            setBlockDomain('');
            await selectChild(selectedChild);
        } catch (err) { alert(err.message); }
    }

    async function handleUnblock(siteId) {
        try {
            await parental.unblockSite(siteId, selectedChild);
            await selectChild(selectedChild);
        } catch (err) { alert(err.message); }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-black font-outfit">
            <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin"></div>
                <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600">Initializing Control Matrix</span>
            </div>
        </div>
    );

    // Student view — accept invite
    if (user?.role !== 'parent') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-6 font-outfit">
                <div className="max-w-md w-full animate-in">
                    <div className="text-center mb-16">
                        <div className="inline-block p-6 bg-white/5 border border-white/10 rounded-[40px] mb-10 translate-in">
                            <Key size={32} className="text-white" />
                        </div>
                        <h1 className="text-4xl font-light tracking-tight text-white mb-4">Neural <span className="font-semibold">Authorization</span></h1>
                        <p className="text-zinc-600 font-medium uppercase tracking-[0.3em] text-[10px]">Initialize cross-entity synchronization.</p>
                    </div>
                    
                    <div className="bg-white/5 border border-white/5 rounded-[48px] p-12 shadow-3xl backdrop-blur-xl">
                        <form onSubmit={handleAcceptInvite} className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-700 ml-2">Authorization Secret</label>
                                <input 
                                    className="w-full bg-black/40 border border-white/5 rounded-3xl px-8 py-5 text-[14px] font-medium text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)} 
                                    placeholder="Enter Protocol Link Code" 
                                    required 
                                />
                            </div>
                            <button type="submit" className="w-full bg-white text-black py-5 rounded-full font-bold uppercase tracking-[0.3em] text-[10px] hover:opacity-90 active:scale-95 transition-all shadow-2xl">
                                Validate Neural Link
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-16 max-w-7xl animate-in font-outfit">
            <div className="mb-16">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-1 rounded-full bg-white/20"></div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">Security / Managed Entities</span>
                </div>
                <h1 className="text-4xl font-light tracking-tight text-white mb-2 leading-[0.9]">
                    Entity <span className="font-semibold">Supervision</span>
                </h1>
                <p className="text-zinc-500 text-[13px] font-light tracking-wide max-w-sm">
                    Monitor and calibrate digital performance metrics across linked secondary nodes.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
                {/* Entities List */}
                <div className="lg:col-span-4 bg-zinc-900 border border-white/5 rounded-[48px] p-10 flex flex-col shadow-3xl">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white">
                                <Users size={20} />
                            </div>
                            <h3 className="text-lg font-semibold tracking-tight text-white">Linked Nodes</h3>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-700">{children.length} ACTIVE</span>
                    </div>

                    <div className="space-y-4 mb-16 flex-1">
                        {children.map((c) => (
                            <button 
                                key={c.id} 
                                onClick={() => selectChild(c.id)} 
                                className={`w-full flex items-center justify-between p-6 rounded-[32px] border transition-all duration-300 ${
                                    selectedChild === c.id 
                                    ? 'bg-white text-black border-white shadow-2xl scale-[1.02]' 
                                    : 'bg-white/5 text-zinc-500 border-transparent hover:border-white/10'
                                }`}
                            >
                                <div className="text-left">
                                    <div className="font-semibold tracking-tight text-sm uppercase">{c.username}</div>
                                    <div className={`text-[10px] font-bold tracking-widest leading-none mt-2 ${selectedChild === c.id ? 'text-zinc-500' : 'text-zinc-800'}`}>
                                        NODE_{c.id.substring(0, 8).toUpperCase()}
                                    </div>
                                </div>
                                <ChevronRight size={16} className={selectedChild === c.id ? 'text-black/20' : 'text-zinc-800'} />
                            </button>
                        ))}
                    </div>

                    <div className="pt-10 border-t border-white/5">
                        <form onSubmit={handleInvite}>
                            <div className="space-y-6">
                                <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-700 ml-2">Register Core Entity</label>
                                <div className="flex gap-2 p-1.5 bg-black/40 rounded-full border border-white/5 group-focus-within:border-white/10 transition-all">
                                    <input 
                                        className="flex-1 bg-transparent border-none rounded-full px-6 py-3 text-[12px] font-medium text-white focus:outline-none placeholder:text-zinc-800"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)} 
                                        placeholder="Enter target protocol email" 
                                        type="email" 
                                        required 
                                    />
                                    <button type="submit" className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center hover:scale-95 transition-all shadow-xl">
                                        <UserPlus size={18} />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Child Analytics */}
                <div className="lg:col-span-8 bg-black border border-white/5 rounded-[48px] p-12 shadow-3xl flex flex-col min-h-[600px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-all">
                        <Activity size={320} />
                    </div>
                    
                    {childData ? (
                        <>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-3xl text-white">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-semibold tracking-tight text-white">{childData.username} Metrics</h3>
                                        <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">Real-time synaptic feedback loop</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                   <div className="px-5 py-2.5 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                                       Status: <span className="text-white">SYNCHRONIZED</span>
                                   </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 relative z-10">
                                <div className="p-10 bg-white/5 border border-white/5 rounded-[40px] hover:border-white/10 transition-all group/stat">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-700 mb-8">Performance Index</div>
                                    <div className="text-7xl font-light text-white tracking-tighter group-hover/stat:scale-110 transition-transform origin-left tabular-nums">
                                        {Math.round(childData.productivity_score)}
                                    </div>
                                </div>
                                <div className="p-10 bg-white text-black rounded-[40px] shadow-3xl group/stat overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.05] rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400 mb-8 relative z-10">Focus Resonance</div>
                                    <div className="text-7xl font-light text-black tracking-tighter group-hover/stat:scale-110 transition-transform origin-left tabular-nums relative z-10">
                                        {(childData.focus_factor * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>

                            {/* Top domains */}
                            {childData.top_domains?.length > 0 && (
                                <div className="flex-1 relative z-10">
                                    <div className="flex items-center gap-4 mb-10">
                                        <Globe size={16} className="text-zinc-700" />
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-700">Identified Interaction Nodes</h4>
                                    </div>
                                    <div className="space-y-6">
                                        {childData.top_domains.slice(0, 5).map((d, i) => (
                                            <div key={i} className="flex flex-col gap-3 group/item">
                                                <div className="flex justify-between items-end px-1">
                                                    <span className="text-sm font-medium text-white tracking-tight group-hover/item:text-white transition-colors">{d.domain}</span>
                                                    <span className="text-[10px] font-bold text-zinc-700 tabular-nums uppercase tracking-widest">{Math.round(d.seconds / 60)}M Duration</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-zinc-800 group-hover/item:bg-white transition-all duration-500" 
                                                        style={{ width: `${Math.min((d.seconds / 3600) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-900 space-y-10">
                            <div className="w-48 h-48 bg-white/5 rounded-full flex items-center justify-center border border-white/5 animate-pulse">
                                <Users size={64} className="text-zinc-800" strokeWidth={1} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold uppercase tracking-[0.5em] text-[10px] text-zinc-700 mb-4">Awaiting Node Selection</p>
                                <p className="text-zinc-800 text-[12px] font-medium max-w-xs">Initialize entity synchronization via the control matrix to view performance dynamics.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Restrictions */}
            {selectedChild && (
                <div className="bg-zinc-900 border border-white/5 rounded-[48px] p-12 transition-all shadow-3xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-12">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-3xl text-white">
                                <ShieldOff size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold tracking-tight text-white italic">Protocol Restrictions</h3>
                                <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">Manual node blacklisting</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleBlock} className="flex-1 max-w-xl">
                            <div className="flex gap-2 p-1.5 bg-black/40 rounded-full border border-white/5 group-focus-within:border-white/20 transition-all">
                                <input 
                                    className="flex-1 bg-transparent border-none rounded-full px-8 py-3 text-[13px] font-medium text-white focus:outline-none placeholder:text-zinc-800"
                                    value={blockDomain}
                                    onChange={(e) => setBlockDomain(e.target.value)} 
                                    placeholder="Enter domain to restrict..." 
                                    required 
                                />
                                <button type="submit" className="bg-white text-black px-10 py-3 rounded-full font-bold uppercase tracking-[0.3em] text-[10px] hover:opacity-90 active:scale-95 transition-all shadow-2xl flex items-center gap-3">
                                    <Lock size={12} fill="currentColor" /> Block
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {childData?.blocked_sites?.map((site) => (
                            <div key={site.id} className="flex justify-between items-center p-8 bg-white/5 rounded-[32px] border border-transparent hover:border-white/10 group transition-all">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700 mb-2">Restricted</span>
                                    <span className="text-[14px] font-medium text-white tracking-tight">{site.domain}</span>
                                </div>
                                <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-zinc-700 hover:text-white hover:bg-white/10 transition-colors" onClick={() => handleUnblock(site.id)} title="Release Block">
                                    <Unlock size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
