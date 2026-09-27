import { useState, useEffect } from 'react';
import { ai } from '../api';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowRight, CheckCircle2, Zap, Activity, ChevronRight } from 'lucide-react';

export default function QuizPage() {
    const navigate = useNavigate();
    const [studyPlans, setStudyPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const plans = await ai.getStudyPlans().catch(() => []);
                setStudyPlans(plans);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-[1000] font-outfit" style={{ background: 'var(--bg)' }}>
                <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text)' }}></div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em]" style={{ color: 'var(--text-dim)' }}>Initializing Assessment Matrix</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-20 max-w-7xl animate-in font-outfit">
            <div className="mb-20 text-center max-w-3xl mx-auto">
                <div className="inline-block p-6 rounded-[40px] mb-10 translate-in border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
                    <Brain size={48} strokeWidth={1} style={{ color: 'var(--text)' }} />
                </div>
                <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6" style={{ color: 'var(--text)' }}>
                    Neural <span className="font-semibold italic">Assessment</span>
                </h1>
                <p className="font-medium uppercase tracking-[0.4em] text-[10px] max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Knowledge validation protocols are now synchronized with active learning modules for high-fidelity mastery.
                </p>
            </div>

            <div className="max-w-5xl mx-auto">
                <div className="border rounded-[64px] p-20 shadow-3xl text-center relative overflow-hidden group" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="absolute top-0 left-0 w-full h-1 opacity-20" style={{ background: 'var(--text)' }}></div>
                    <div className="absolute bottom-0 right-0 p-20 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none" style={{ color: 'var(--text)' }}>
                        <Activity size={320} />
                    </div>
                    
                    <div className="relative z-10">
                        <h2 className="text-3xl font-semibold tracking-tight mb-8" style={{ color: 'var(--text)' }}>Integrated Intelligence</h2>
                        <p className="font-light leading-relaxed mb-16 text-[14px] max-w-2xl mx-auto tracking-wide" style={{ color: 'var(--text-muted)' }}>
                            We have optimized the assessment architecture. Quizzes are now dynamically generated during study plan synthesis. Complete your training curriculum to initialize the final mastery verification.
                        </p>
                        
                        <button 
                            className="px-12 py-6 rounded-full font-bold uppercase tracking-[0.4em] text-[10px] hover:opacity-90 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-6 mx-auto mb-24 cursor-pointer"
                            style={{ background: 'var(--text)', color: 'var(--bg)' }}
                            onClick={() => navigate('/learning')}
                        >
                            Initialize Learning <ArrowRight size={16} />
                        </button>

                        {studyPlans.length > 0 && (
                            <div className="text-left rounded-[48px] p-12 border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] mb-10 border-b pb-6" style={{ color: 'var(--text-dim)', borderColor: 'var(--border)' }}>Active Synchronization Queues</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {studyPlans.map((plan) => {
                                        const chaptersCount = plan.plan_data?.chapters?.length || 0;
                                        const quizCount = plan.plan_data?.quiz?.length || 0;
                                        
                                        return (
                                            <div
                                                key={plan.id}
                                                onClick={() => navigate('/learning')}
                                                className="group p-8 border rounded-[40px] transition-all cursor-pointer hover:shadow-xl hover:-translate-y-0.5"
                                                style={{
                                                    background: 'var(--bg-card)',
                                                    borderColor: 'var(--border)',
                                                    color: 'var(--text)',
                                                }}
                                            >
                                                <div className="flex flex-col h-full">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-2 h-2 rounded-full group-hover:animate-ping" style={{ background: 'var(--text)' }}></div>
                                                        <div className="font-semibold tracking-tight text-lg leading-tight uppercase" style={{ color: 'var(--text)' }}>
                                                            {plan.title || plan.goal}
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8" style={{ color: 'var(--text-muted)' }}>
                                                        {chaptersCount} Modules • {quizCount} Assessment Points
                                                    </div>
                                                    <div className="mt-auto flex justify-between items-center">
                                                        <span className="px-4 py-1.5 border rounded-full text-[8px] font-bold uppercase tracking-widest" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
                                                            {plan.duration_days}D Horizon
                                                        </span>
                                                        {plan.quiz_unlocked ? (
                                                            <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-emerald-500 font-semibold">
                                                                <CheckCircle2 size={12} /> Ready
                                                            </span>
                                                        ) : (
                                                            <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {studyPlans.length === 0 && (
                            <div className="py-16 rounded-[48px] border border-dashed" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
                                <p className="font-bold uppercase tracking-[0.4em] text-[10px]" style={{ color: 'var(--text-dim)' }}>
                                    No active synchronization detected. Initialize a study plan.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
