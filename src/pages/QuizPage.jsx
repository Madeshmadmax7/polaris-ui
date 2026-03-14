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
            <div className="fixed inset-0 flex items-center justify-center bg-black z-[1000] font-outfit">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600">Initializing Assessment Matrix</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-20 max-w-7xl animate-in font-outfit">
            <div className="mb-20 text-center max-w-3xl mx-auto">
                <div className="inline-block p-6 bg-white/5 border border-white/10 rounded-[40px] mb-10 translate-in">
                    <Brain size={48} strokeWidth={1} className="text-white" />
                </div>
                <h1 className="text-5xl md:text-6xl font-light tracking-tight text-white mb-6">
                    Neural <span className="font-semibold italic">Assessment</span>
                </h1>
                <p className="text-zinc-600 font-medium uppercase tracking-[0.4em] text-[10px] max-w-md mx-auto leading-relaxed">
                    Knowledge validation protocols are now synchronized with active learning modules for high-fidelity mastery.
                </p>
            </div>

            <div className="max-w-5xl mx-auto">
                <div className="bg-zinc-900 border border-white/5 rounded-[64px] p-20 shadow-3xl text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-white opacity-10"></div>
                    <div className="absolute bottom-0 right-0 p-20 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                        <Activity size={320} />
                    </div>
                    
                    <div className="relative z-10">
                        <h2 className="text-3xl font-semibold tracking-tight text-white mb-8">Integrated Intelligence</h2>
                        <p className="text-zinc-500 font-light leading-relaxed mb-16 text-[14px] max-w-2xl mx-auto tracking-wide">
                            We have optimized the assessment architecture. Quizzes are now dynamically generated during study plan synthesis. Complete your training curriculum to initialize the final mastery verification.
                        </p>
                        
                        <button 
                            className="bg-white text-black px-12 py-6 rounded-full font-bold uppercase tracking-[0.4em] text-[10px] hover:opacity-90 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-6 mx-auto mb-24"
                            onClick={() => navigate('/learning')}
                        >
                            Initialize Learning <ArrowRight size={16} />
                        </button>

                        {studyPlans.length > 0 && (
                            <div className="text-left bg-black/40 rounded-[48px] p-12 border border-white/5">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-700 mb-10 border-b border-white/5 pb-6">Active Synchronization Queues</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {studyPlans.map((plan) => {
                                        const chaptersCount = plan.plan_data?.chapters?.length || 0;
                                        const quizCount = plan.plan_data?.quiz?.length || 0;
                                        
                                        return (
                                            <div
                                                key={plan.id}
                                                onClick={() => navigate('/learning')}
                                                className="group p-8 bg-zinc-900/40 border border-white/5 rounded-[40px] hover:border-white/20 hover:bg-white text-white hover:text-black transition-all cursor-pointer"
                                            >
                                                <div className="flex flex-col h-full">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-2 h-2 rounded-full bg-current group-hover:animate-ping"></div>
                                                        <div className="font-semibold tracking-tight text-lg leading-tight uppercase">
                                                            {plan.title || plan.goal}
                                                        </div>
                                                    </div>
                                                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] mb-8 opacity-60 group-hover:opacity-100">
                                                        {chaptersCount} Modules • {quizCount} Assessment Points
                                                    </div>
                                                    <div className="mt-auto flex justify-between items-center">
                                                        <span className="px-4 py-1.5 border border-current opacity-40 group-hover:opacity-100 rounded-full text-[8px] font-bold uppercase tracking-widest">
                                                            {plan.duration_days}D Horizon
                                                        </span>
                                                        {plan.quiz_unlocked ? (
                                                            <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                                <CheckCircle2 size={12} /> Ready
                                                            </span>
                                                        ) : (
                                                            <ChevronRight size={14} className="opacity-20 group-hover:opacity-100" />
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
                            <div className="py-16 bg-black/40 rounded-[48px] border border-dashed border-white/5">
                                <p className="text-zinc-800 font-bold uppercase tracking-[0.4em] text-[10px]">
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
