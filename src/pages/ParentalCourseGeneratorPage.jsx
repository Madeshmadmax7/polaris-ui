import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Upload, Brain, Loader2, FileText, Users, Calendar, RefreshCw, ChevronRight, X } from 'lucide-react';
import { parental } from '../api';

export default function ParentalCourseGeneratorPage() {
    const [connections, setConnections] = useState([]);
    const [selectedChildId, setSelectedChildId] = useState('');
    const [documents, setDocuments] = useState([]);
    const [studyPlans, setStudyPlans] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [quizAttemptsMap, setQuizAttemptsMap] = useState({});

    const [uploading, setUploading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    const [planForm, setPlanForm] = useState({ goal: '', duration_days: 14, document_id: '' });
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedQuizData, setSelectedQuizData] = useState(null);

    const selectedChild = useMemo(
        () => connections.find((c) => c.user_id === selectedChildId),
        [connections, selectedChildId]
    );

    useEffect(() => {
        loadChildren();
    }, []);

    useEffect(() => {
        if (!selectedChildId) return;
        loadChildData(selectedChildId);
    }, [selectedChildId]);

    async function loadChildren() {
        setLoading(true);
        try {
            const res = await parental.getMyConnections();
            const linkedChildren = (res.connections || []).filter((c) => c.role === 'child');
            setConnections(linkedChildren);
            if (linkedChildren.length > 0) {
                setSelectedChildId(linkedChildren[0].user_id);
            }
        } catch (e) {
            console.error('Failed to load linked children', e);
        } finally {
            setLoading(false);
        }
    }

    async function loadChildData(childId) {
        try {
            const [docsRes, plansRes] = await Promise.all([
                parental.getChildDocuments(childId),
                parental.getChildStudyPlans(childId),
            ]);

            const docs = docsRes.documents || [];
            const plans = plansRes.study_plans || [];
            setDocuments(docs);
            setStudyPlans(plans);

            const progressEntries = await Promise.all(
                plans.map(async (plan) => {
                    try {
                        const p = await parental.getChildStudyPlanProgress(childId, plan.id);
                        return [plan.id, p];
                    } catch {
                        return [plan.id, null];
                    }
                })
            );
            setProgressMap(Object.fromEntries(progressEntries));

            // Load quiz attempts for all plans
            const quizEntries = await Promise.all(
                plans.map(async (plan) => {
                    try {
                        const q = await parental.getChildStudyPlanQuizAttempts(childId, plan.id);
                        return [plan.id, q];
                    } catch {
                        return [plan.id, null];
                    }
                })
            );
            setQuizAttemptsMap(Object.fromEntries(quizEntries));
        } catch (e) {
            console.error('Failed to load child course data', e);
            setDocuments([]);
            setStudyPlans([]);
            setProgressMap({});
            setQuizAttemptsMap({});
        }
    }

    async function handleUpload(e) {
        const file = e.target.files?.[0];
        if (!file || !selectedChildId) return;

        setUploading(true);
        try {
            await parental.uploadChildDocument(selectedChildId, file);
            await loadChildData(selectedChildId);
            alert('✓ Material uploaded and visible to child.');
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }

    async function handleCreatePlan(e) {
        e.preventDefault();
        if (!selectedChildId) return;

        setCreating(true);
        try {
            await parental.createChildStudyPlan(selectedChildId, {
                goal: planForm.goal,
                duration_days: Number(planForm.duration_days),
                document_id: planForm.document_id || null,
            });
            await loadChildData(selectedChildId);
            setPlanForm({ goal: '', duration_days: 14, document_id: '' });
            alert('✓ Course generated and child notified about enrollment!');
        } catch (err) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    }

    function openCourseModal(plan) {
        setSelectedPlan(plan);
        const quizData = quizAttemptsMap[plan.id];
        setSelectedQuizData(quizData);
    }

    function closeCourseModal() {
        setSelectedPlan(null);
        setSelectedQuizData(null);
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black font-outfit">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600">Loading Course Generator</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-6xl font-outfit">
            {connections.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-10 text-center">
                    <Users className="text-zinc-800 mb-4" size={40} />
                    <h4 className="text-[13px] font-medium text-white mb-1">No Linked Children</h4>
                    <p className="text-zinc-600 text-[11px] font-light">Connect a child first from the Connections page.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Child Selector */}
                    <div className="bg-zinc-900/40 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-sm">
                        <div className="p-8 border-b border-white/5 bg-white/5 flex items-center gap-3">
                            <Users size={18} className="text-zinc-400" />
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Select Child</h3>
                        </div>
                        <div className="p-8">
                            <select
                                value={selectedChildId}
                                onChange={(e) => setSelectedChildId(e.target.value)}
                                className="w-full md:w-96 bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-[13px] font-medium text-white focus:outline-none focus:border-white/20 transition-all appearance-none"
                            >
                                {connections.map((child) => (
                                    <option key={child.user_id} value={child.user_id} className="bg-zinc-900">
                                        {child.username} ({child.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Materials & Plan Generator Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Materials Upload */}
                        <div className="bg-zinc-900/40 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-sm">
                            <div className="p-8 border-b border-white/5 bg-white/5 flex items-center gap-3">
                                <Upload size={18} className="text-zinc-400" />
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Upload Material</h3>
                            </div>

                            <div className="p-8">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-6 cursor-pointer inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-black font-semibold hover:opacity-90 transition-all">
                                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                    {uploading ? 'Uploading...' : 'Choose PDF File'}
                                    <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                                </label>

                                {documents.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">Materials on File</div>
                                        {documents.map((doc) => (
                                            <div key={doc.id} className="group cursor-pointer p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <FileText size={16} className="text-zinc-500 group-hover:text-white transition-colors mt-0.5" />
                                                    <div>
                                                        <div className="text-[13px] font-medium text-white truncate max-w-[200px]">{doc.filename}</div>
                                                        <div className="text-[9px] font-medium uppercase text-zinc-600 tracking-widest">
                                                            {new Date(doc.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-700">Ready</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-10 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        <FileText className="text-zinc-800 mb-4" size={40} />
                                        <h4 className="text-[13px] font-medium text-white mb-1">Materials Empty</h4>
                                        <p className="text-zinc-600 text-[11px] font-light">Upload PDFs to assist course generation.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Study Plan Generator */}
                        <div className="bg-zinc-900/40 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-sm">
                            <div className="p-8 border-b border-white/5 bg-white/5 flex items-center gap-3">
                                <Brain size={18} className="text-zinc-400" />
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Create Course</h3>
                            </div>

                            <form onSubmit={handleCreatePlan} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Course Goal</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-[13px] font-medium text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-700"
                                        value={planForm.goal}
                                        onChange={(e) => setPlanForm({ ...planForm, goal: e.target.value })}
                                        placeholder={`e.g. Master algebra fundamentals for ${selectedChild?.username || 'child'}`}
                                        required
                                        minLength={5}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Commitment (days)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-[13px] font-medium text-white focus:outline-none focus:border-white/20 transition-all"
                                            value={planForm.duration_days}
                                            onChange={(e) => setPlanForm({ ...planForm, duration_days: parseInt(e.target.value) })}
                                            min={1}
                                            max={365}
                                        />
                                    </div>

                                    {documents.length > 0 && (
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Base (Optional)</label>
                                            <select
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-[13px] font-medium text-white focus:outline-none focus:border-white/20 transition-all appearance-none"
                                                value={planForm.document_id}
                                                onChange={(e) => setPlanForm({ ...planForm, document_id: e.target.value })}
                                            >
                                                <option value="" className="bg-zinc-900">AI Generated</option>
                                                {documents.map((d) => (
                                                    <option key={d.id} value={d.id} className="bg-zinc-900">{d.filename}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-white text-black py-4 rounded-full font-bold uppercase tracking-widest text-[11px] hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:bg-zinc-800 disabled:text-zinc-600"
                                    disabled={creating}
                                >
                                    {creating ? <RefreshCw size={14} className="animate-spin" /> : <Brain size={14} />}
                                    {creating ? 'Generating Path' : 'Generate & Enroll'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Study Plans List */}
                    {studyPlans.length > 0 && (
                        <div className="bg-white/5 border border-white/5 rounded-[24px] p-6 shadow-xl">
                            <div className="flex items-center gap-2 mb-6">
                                <Calendar size={14} className="text-zinc-600" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">Generated Courses</h3>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {studyPlans.map((plan) => {
                                    const progress = progressMap[plan.id];
                                    const quizData = quizAttemptsMap[plan.id];
                                    const completed = progress?.completed_chapters || 0;
                                    const total = progress?.total_chapters || 0;
                                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                                    const bestAttempt = quizData?.attempts?.[0];
                                    const isCourseCompleted = pct === 100;

                                    return (
                                        <div key={plan.id} className="group flex-1 min-w-[280px] p-5 rounded-[20px] border border-white/10 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-white/20 transition-all cursor-pointer" onClick={() => openCourseModal(plan)}>
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <h4 className="text-[12px] font-semibold text-white line-clamp-2">{plan.title}</h4>
                                                <ChevronRight size={12} className="text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0 mt-0.5" />
                                            </div>
                                            <p className="text-[11px] text-zinc-500 line-clamp-1 mb-3">{plan.goal}</p>
                                            <div className="space-y-2 mb-3">
                                                <div className="flex items-center justify-between text-[9px] font-medium uppercase tracking-widest text-zinc-600">
                                                    <span>Progress</span>
                                                    <span>{pct}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-white transition-all duration-300"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <div className="text-[9px] text-zinc-600 font-medium">
                                                    {completed}/{total} chapters • {plan.duration_days}d course
                                                </div>
                                            </div>
                                            {isCourseCompleted && bestAttempt && (
                                                <div className="pt-3 border-t border-white/10 text-[9px] text-zinc-500 font-medium">
                                                    <div className="text-[8px] font-bold uppercase tracking-widest text-zinc-700 mb-2">Quiz Results</div>
                                                    <div className="flex items-center justify-between">
                                                        <span>Score: {bestAttempt.score}/{bestAttempt.max_score} ({bestAttempt.percentage}%)</span>
                                                        <span>{quizData.attempts.length} {quizData.attempts.length === 1 ? 'attempt' : 'attempts'}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Course Detail Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-outfit">
                    <div className="bg-zinc-900 border border-white/10 rounded-[24px] max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-b from-zinc-900 to-zinc-900/80 border-b border-white/10 p-6 flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <h2 className="text-[18px] font-bold text-white mb-1">{selectedPlan.title}</h2>
                                <p className="text-[12px] text-zinc-500">{selectedPlan.goal}</p>
                            </div>
                            <button onClick={closeCourseModal} className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
                                <X size={16} className="text-zinc-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Course Overview */}
                            <div className="space-y-4">
                                <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Course Details</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/5 border border-white/10 rounded-[12px]">
                                        <div className="text-[9px] font-medium uppercase text-zinc-600 mb-1">Duration</div>
                                        <div className="text-[13px] font-semibold text-white">{selectedPlan.duration_days} Days</div>
                                    </div>
                                    <div className="p-3 bg-white/5 border border-white/10 rounded-[12px]">
                                        <div className="text-[9px] font-medium uppercase text-zinc-600 mb-1">Status</div>
                                        <div className="text-[13px] font-semibold text-white">
                                            {progressMap[selectedPlan.id]?.completed_chapters === progressMap[selectedPlan.id]?.total_chapters ? 'Completed ✓' : 'In Progress'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Overview */}
                            {progressMap[selectedPlan.id] && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Chapter Progress</span>
                                        <span className="text-[9px] font-bold text-zinc-400">
                                            {progressMap[selectedPlan.id].completed_chapters}/{progressMap[selectedPlan.id].total_chapters}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all"
                                            style={{
                                                width: `${progressMap[selectedPlan.id].total_chapters > 0 ? Math.round((progressMap[selectedPlan.id].completed_chapters / progressMap[selectedPlan.id].total_chapters) * 100) : 0}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Quiz Attempts */}
                            {selectedQuizData && (
                                <div className="space-y-4">
                                    <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-600">Quiz Performance</div>
                                    {selectedQuizData.attempts && selectedQuizData.attempts.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedQuizData.attempts.map((attempt, idx) => (
                                                <div key={attempt.id} className="p-4 bg-white/5 border border-white/10 rounded-[12px]">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Attempt {idx + 1}</div>
                                                            <div className="text-[12px] font-semibold text-white mt-1">
                                                                {attempt.score.toFixed(1)}/{attempt.max_score.toFixed(1)} ({attempt.percentage.toFixed(1)}%)
                                                            </div>
                                                        </div>
                                                        <div className="text-[9px] text-zinc-600 text-right">
                                                            {new Date(attempt.created_at).toLocaleDateString()}
                                                            <br />
                                                            {new Date(attempt.created_at).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[9px] text-zinc-500 mt-2">
                                                        <span className="uppercase tracking-widest">
                                                            {attempt.total_questions} questions • {attempt.difficulty || 'Standard'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-white/5 border border-dashed border-white/10 rounded-[12px] text-center">
                                            <p className="text-[11px] text-zinc-500">No quiz attempts yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
