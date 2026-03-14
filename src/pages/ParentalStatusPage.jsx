import { useEffect, useState } from 'react';
import { Users, ChevronRight } from 'lucide-react';
import { parental } from '../api';
import DashboardPage from './DashboardPage';

export default function ParentalStatusPage() {
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadChildren();
    }, []);

    async function loadChildren() {
        try {
            const c = await parental.getChildren();
            setChildren(c);
            if (c.length > 0) setSelectedChild(c[0]);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black font-outfit">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600">Loading Child Dashboard</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-10 max-w-7xl font-outfit">
            <div className="mb-8">
                <h1 className="text-4xl font-light tracking-tight text-white mb-2">
                    Child <span className="font-semibold">Dashboard</span>
                </h1>
                <p className="text-zinc-500 text-[13px] tracking-wide">Exact dashboard view of linked child data.</p>
            </div>

            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Users size={18} className="text-white" />
                    <h2 className="text-xl font-semibold tracking-tight text-white">Select Child</h2>
                </div>

                {children.length === 0 ? (
                    <div className="p-8 bg-zinc-900 border border-white/10 rounded-[24px] text-zinc-500 text-sm">
                        No linked children found. Use the Connections page to connect a child first.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {children.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedChild(c)}
                                className={`w-full flex items-center justify-between p-6 rounded-[24px] border transition-all duration-300 ${
                                    selectedChild?.id === c.id
                                        ? 'bg-white text-black border-white shadow-2xl scale-[1.01]'
                                        : 'bg-zinc-900 text-zinc-400 border-white/10 hover:border-white/25'
                                }`}
                            >
                                <div className="text-left">
                                    <div className="font-semibold tracking-tight text-sm uppercase">{c.username}</div>
                                    <div className={`text-[10px] font-bold tracking-widest leading-none mt-2 ${selectedChild?.id === c.id ? 'text-zinc-500' : 'text-zinc-700'}`}>
                                        NODE_{c.id.substring(0, 8).toUpperCase()}
                                    </div>
                                </div>
                                <ChevronRight size={16} className={selectedChild?.id === c.id ? 'text-black/20' : 'text-zinc-700'} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedChild && (
                <DashboardPage
                    childId={selectedChild.id}
                    childName={selectedChild.username}
                    parentView={true}
                />
            )}
        </div>
    );
}
