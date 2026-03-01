import { useState, useEffect, useRef } from 'react';
import { ai, connectDashboardWS } from '../api';
import {
    FileText,
    Upload,
    Plus,
    Book,
    Calendar,
    Brain,
    Search,
    CheckCircle2,
    RefreshCw,
    LogOut,
    Maximize,
    Play,
    Clock,
    Youtube,
    Activity,
    Lock,
    AlertTriangle,
    Check,
    X,
    MessageSquare,
    Lightbulb,
    Target,
    ChevronRight
} from 'lucide-react';

export default function LearningPage() {
    const [documents, setDocuments] = useState([]);
    const [studyPlans, setStudyPlans] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [planForm, setPlanForm] = useState({ goal: '', duration_days: 14, document_id: '' });
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [planProgress, setPlanProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [submittingQuiz, setSubmittingQuiz] = useState(false);
    const [quizTerminated, setQuizTerminated] = useState(false); // Track if quiz was terminated due to tab switch
    const [quizAttempts, setQuizAttempts] = useState([]); // Track quiz attempt history
    const [liveActivity, setLiveActivity] = useState(null); // Live tracking from WebSocket
    const wsRef = useRef(null); // WebSocket reference

    // Video selection state
    const [editingChapter, setEditingChapter] = useState(null);
    const [videoSearchQuery, setVideoSearchQuery] = useState('');
    const [creatorName, setCreatorName] = useState('');

    /**
     * Open YouTube search for a chapter and set it as pending assignment.
     * The extension will auto-assign the next video the user watches to this chapter.
     */
    const handleSearchYouTube = async (planId, chapterNumber, searchQuery) => {
        try {
            // Tell backend this chapter is pending video assignment
            await ai.setPendingChapter(planId, chapterNumber);

            // Also tell extension directly via content script (if running on this page)
            window.postMessage({
                type: 'POLARIS_SET_PENDING_CHAPTER',
                data: {
                    plan_id: planId,
                    chapter_index: chapterNumber,
                }
            }, '*');
        } catch (e) {
            console.debug('[Learning] Failed to set pending chapter:', e.message);
        }

        // Open YouTube search in new tab
        window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
    };

    useEffect(() => {
        async function load() {
            try {
                const [docs, plans] = await Promise.all([
                    ai.getDocuments().catch(() => []),
                    ai.getStudyPlans().catch(() => []),
                ]);
                setDocuments(docs);
                setStudyPlans(plans);
                // Auto-select the first study plan
                if (plans.length > 0 && !selectedPlan) {
                    setSelectedPlan(plans[0].id);
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Load progress when a plan is selected
    useEffect(() => {
        if (selectedPlan) {
            loadPlanProgress(selectedPlan);
            loadQuizAttempts(selectedPlan);
        }
    }, [selectedPlan]);

    // WebSocket for live tracking updates
    useEffect(() => {
        const token = localStorage.getItem('polaris_token');
        if (!token) return;

        const conn = connectDashboardWS(token, (msg) => {
            console.log('[Learning] WS message:', msg.type, msg.data?.domain, msg.data?.page_title);
            if (msg.type === 'live_tracking' && msg.data) {
                console.log('[Learning] Setting liveActivity:', msg.data);
                setLiveActivity({ ...msg.data, receivedAt: Date.now() });
            }
        });
        wsRef.current = conn;

        return () => { if (conn) conn.close(); };
    }, []);

    // Auto-refresh progress every 5 seconds when viewing a plan (for real-time updates)
    useEffect(() => {
        if (!selectedPlan) return;

        const refreshInterval = setInterval(() => {
            loadPlanProgress(selectedPlan);
        }, 5000); // Refresh every 5 seconds for dynamic progress bar updates

        return () => clearInterval(refreshInterval);
    }, [selectedPlan]);

    const loadPlanProgress = async (planId) => {
        try {
            const progress = await ai.getStudyPlanProgress(planId);
            setPlanProgress(progress);
        } catch (err) {
            console.error('Failed to load progress:', err);
        }
    };

    const loadQuizAttempts = async (planId) => {
        try {
            const attempts = await ai.getQuizAttempts(planId);
            setQuizAttempts(attempts.attempts || []);
        } catch (err) {
            console.error('Failed to load quiz attempts:', err);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const doc = await ai.uploadDocument(file);
            setDocuments([doc, ...documents]);
            alert(`✓ ${doc.filename} uploaded successfully!`);
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCreatePlan = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const plan = await ai.createStudyPlan(planForm);
            setStudyPlans([plan, ...studyPlans]);
            setPlanForm({ goal: '', duration_days: 14, document_id: '' });
            setSelectedPlan(plan.id);
            alert('✓ Study plan created with chapters and quiz!');
        } catch (err) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleMarkComplete = async (chapterNumber) => {
        if (!selectedPlan) return;
        try {
            const result = await ai.markChapterComplete(selectedPlan, chapterNumber);
            await loadPlanProgress(selectedPlan);

            if (result.all_chapters_completed && result.quiz_unlocked) {
                alert('🎉 All chapters completed! Quiz is now unlocked.');
            } else {
                alert('✓ Chapter marked as complete!');
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleStartQuiz = () => {
        setShowQuiz(true);
        setQuizAnswers({});
        setQuizResult(null);
        setQuizTerminated(false);

        // Enter fullscreen automatically
        setTimeout(() => {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => {
                    console.log('Fullscreen failed:', err);
                });
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        }, 100);
    };

    // Auto-submit quiz if tab is switched
    const handleQuizTermination = async (reason) => {
        if (quizTerminated || quizResult) return; // Already terminated or completed

        setQuizTerminated(true);
        console.log(`[Quiz Terminated] ${reason}`);

        // Exit fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }

        // Auto-submit with current answers
        if (selectedPlan && !quizResult) {
            setSubmittingQuiz(true);
            try {
                const result = await ai.submitPlanQuiz(selectedPlan, quizAnswers);
                setQuizResult({
                    ...result,
                    terminated: true,
                    termination_reason: reason
                });

                // Reload quiz attempts to show new score
                await loadQuizAttempts(selectedPlan);
            } catch (err) {
                alert(err.message);
            } finally {
                setSubmittingQuiz(false);
            }
        }
    };

    // Detect tab switches during quiz
    useEffect(() => {
        if (!showQuiz || quizResult || quizTerminated) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleQuizTermination('Tab switched - Test terminated automatically');
            }
        };

        const handleBlur = () => {
            handleQuizTermination('Window lost focus - Test terminated automatically');
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !quizResult && !quizTerminated) {
                handleQuizTermination('Exited fullscreen - Test terminated automatically');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, [showQuiz, quizResult, quizTerminated, selectedPlan, quizAnswers]);

    useEffect(() => {
        if (quizResult && document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }
    }, [quizResult]);

    const handleQuizAnswer = (questionIdx, optionIdx) => {
        setQuizAnswers({ ...quizAnswers, [questionIdx]: optionIdx });
    };

    const handleSubmitQuiz = async () => {
        if (!selectedPlan) return;

        const plan = studyPlans.find(p => p.id === selectedPlan);
        const totalQuestions = plan?.plan_data?.quiz?.length || 0;

        if (Object.keys(quizAnswers).length < totalQuestions) {
            alert('Please answer all questions before submitting.');
            return;
        }

        setSubmittingQuiz(true);
        try {
            const result = await ai.submitPlanQuiz(selectedPlan, quizAnswers);
            setQuizResult(result);

            // Reload quiz attempts to show new score
            await loadQuizAttempts(selectedPlan);

            // Exit fullscreen after completion
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmittingQuiz(false);
        }
    };

    const handleResetChapter = async (chapterNumber) => {
        if (!selectedPlan) return;
        if (!confirm(`Reset Chapter ${chapterNumber}? This will clear all progress, video assignment, and completion status. You'll need to re-watch a video.`)) return;
        try {
            await ai.resetChapter(selectedPlan, chapterNumber);
            await loadPlanProgress(selectedPlan);
            alert(`✓ Chapter ${chapterNumber} has been reset`);
        } catch (err) {
            alert(err.message);
        }
    };

    const formatDuration = (seconds) => {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black z-[1000] font-outfit">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600">Initializing Knowledge Core</span>
                </div>
            </div>
        );
    }

    const currentPlan = studyPlans.find(p => p.id === selectedPlan);
    const chapters = currentPlan?.plan_data?.chapters || [];
    const quiz = currentPlan?.plan_data?.quiz || [];

    // Check quiz unlock status from progress endpoint (auto-unlocks if all chapters done)
    const isQuizUnlocked = planProgress?.quiz_unlocked || currentPlan?.quiz_unlocked || false;

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl animate-in font-outfit">
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-1 rounded-full bg-white/20"></div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">Core / Learning</span>
                </div>
                <h1 className="text-3xl font-light tracking-tight text-white mb-2">
                    Adaptive <span className="font-semibold">Intelligence</span>
                </h1>
                <p className="text-zinc-500 text-[13px] font-light tracking-wide max-w-lg">
                    Upload course materials to generate custom neural study plans and validate knowledge mastery.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Document Upload */}
                <div className="bg-zinc-900/40 border border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-2xl backdrop-blur-sm">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-3">
                            <FileText size={18} className="text-zinc-400" />
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Documents</h3>
                        </div>
                        <label className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer">
                            {uploading ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                            {uploading ? 'Processing' : 'Upload PDF'}
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    <div className="flex-1 p-8">
                        {documents.length > 0 ? (
                            <div className="space-y-3">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                                                <FileText size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-medium text-white truncate max-w-[200px]">{doc.filename}</div>
                                                <div className="text-[9px] font-medium uppercase text-zinc-600 tracking-widest">
                                                    {new Date(doc.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-700">Stored</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-10 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                <FileText className="text-zinc-800 mb-4" size={40} />
                                <h4 className="text-[13px] font-medium text-white mb-1">Source Empty</h4>
                                <p className="text-zinc-600 text-[11px] font-light">Upload materials to begin synthesis.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Study Plan Generator */}
                <div className="bg-zinc-900/40 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-sm">
                    <div className="p-8 border-b border-white/5 bg-white/5 flex items-center gap-3">
                        <Brain size={18} className="text-zinc-400" />
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Create Study Plan</h3>
                    </div>

                    <form onSubmit={handleCreatePlan} className="p-8 space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Topic / Goal</label>
                            <input
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-[13px] font-medium text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-700"
                                value={planForm.goal}
                                onChange={(e) => setPlanForm({ ...planForm, goal: e.target.value })}
                                placeholder="e.g. Master React fundamentals"
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
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Base Knowledge</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-[13px] font-medium text-white focus:outline-none focus:border-white/20 transition-all appearance-none"
                                        value={planForm.document_id}
                                        onChange={(e) => setPlanForm({ ...planForm, document_id: e.target.value })}
                                    >
                                        <option value="" className="bg-zinc-900">AI Collective</option>
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
                            {creating ? 'Synthesizing Path' : 'Generate Neural Plan'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Study Plans List */}
            {studyPlans.length > 0 && (
                <div className="bg-white/5 border border-white/5 rounded-[24px] p-6 mb-12 shadow-xl">
                    <div className="flex items-center gap-2 mb-6">
                        <Calendar size={14} className="text-zinc-600" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">Training Programs</h3>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {studyPlans.map((plan) => (
                            <button
                                key={plan.id}
                                onClick={() => {
                                    setSelectedPlan(selectedPlan === plan.id ? null : plan.id);
                                    setShowQuiz(false);
                                    setQuizResult(null);
                                }}
                                className={`px-6 py-2.5 rounded-full text-[11px] font-medium uppercase tracking-widest transition-all border ${selectedPlan === plan.id
                                    ? 'bg-white text-black border-white shadow-2xl'
                                    : 'bg-white/5 text-zinc-500 border-white/5 hover:border-white/20 hover:text-white'
                                    }`}
                            >
                                {plan.title || plan.goal}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Plan Details */}
            {selectedPlan && currentPlan && (
                <div className="space-y-12 animate-in">
                    <div className="bg-black border border-white/5 rounded-[40px] p-10 shadow-3xl">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-12">
                            <div className="flex-1">
                                <h2 className="text-2xl font-semibold text-white mb-3 tracking-tight">{currentPlan.title || currentPlan.goal}</h2>
                                {currentPlan.plan_data?.overview && (
                                    <p className="text-zinc-500 text-[13px] font-light leading-relaxed max-w-2xl">
                                        {currentPlan.plan_data.overview}
                                    </p>
                                )}
                            </div>
                            {planProgress ? (
                                <div className="flex flex-col items-end">
                                    <div className="text-5xl font-light text-white mb-2 tabular-nums">
                                        {Math.round((planProgress.completed_chapters / planProgress.total_chapters) * 100)}%
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">Completion Sequence</div>
                                </div>
                            ) : null}
                        </div>

                        {/* Chapters Section */}
                        {!showQuiz && !quizResult && (
                            <div className="space-y-8">
                                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                                    <Youtube size={16} className="text-zinc-400" />
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Knowledge Modules</h3>
                                </div>

                                {/* Live Tracking Indicator */}
                                {liveActivity && liveActivity.domain && (liveActivity.domain === 'youtube.com' || liveActivity.domain === 'youtu.be') && liveActivity.page_title && (
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between animate-in slide-in-from-top-2">
                                        <div className="flex items-center gap-5">
                                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                            <div>
                                                <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-1">Synthesizing Node</div>
                                                <div className="text-[13px] font-medium text-white truncate max-w-md">{liveActivity.page_title}</div>
                                            </div>
                                        </div>
                                        <div className="px-5 py-2 bg-black text-white border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                                            Educational Core
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-6">
                                    {chapters.map((chapter) => {
                                        const progress = planProgress?.chapters?.find(
                                            c => c.chapter_index === chapter.chapter_number
                                        );
                                        const isCompleted = progress?.is_completed || false;
                                        const progressPercentage = Math.min(progress?.progress_percentage || 0, 100);
                                        const watchedSeconds = progress?.watched_seconds || 0;
                                        const videoDuration = progress?.video_duration_seconds || 0;
                                        const hasVideo = progress?.youtube_url && videoDuration > 0;
                                        const searchQuery = chapter.youtube_search_query || chapter.title.toLowerCase().replace(/ /g, '+');

                                        return (
                                            <div
                                                key={chapter.chapter_number}
                                                className={`group relative p-8 rounded-[32px] border border-white/5 transition-all shadow-xl ${isCompleted
                                                    ? 'bg-white/10 border-white/20'
                                                    : 'bg-white/5 hover:border-white/10'
                                                    }`}
                                            >
                                                <div className="flex flex-col md:flex-row gap-8">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-4 mb-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-semibold border transition-all ${isCompleted ? 'bg-white text-black border-white' : 'bg-black text-zinc-500 border-white/5'
                                                                }`}>
                                                                {chapter.chapter_number}
                                                            </div>
                                                            <h4 className="text-xl font-semibold text-white tracking-tight">
                                                                {progress?.youtube_title || chapter.title}
                                                            </h4>
                                                            {isCompleted && <CheckCircle2 size={18} className="text-white" />}
                                                        </div>

                                                        <p className="text-zinc-500 text-[13px] font-light mb-8 leading-relaxed">
                                                            {chapter.description}
                                                        </p>

                                                        {/* Topics Tags */}
                                                        {chapter.key_topics && chapter.key_topics.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mb-8">
                                                                {chapter.key_topics.map((topic, idx) => (
                                                                    <span key={idx} className="px-3 py-1 bg-white/5 text-zinc-500 text-[9px] font-bold uppercase tracking-widest rounded-full border border-white/5">
                                                                        {topic}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Progress Integrated */}
                                                        {hasVideo ? (
                                                            <div className="bg-black border border-white/5 p-5 rounded-2xl">
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                                                        <Clock size={12} /> {formatDuration(watchedSeconds)} / {formatDuration(videoDuration)}
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-white tracking-widest uppercase">{Math.round(progressPercentage)}% Intake</div>
                                                                </div>
                                                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-white transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                                                        style={{ width: `${progressPercentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-5 rounded-2xl bg-white/5 border border-dashed border-white/5 text-center">
                                                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-800">Neural Node Inactive</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-row md:flex-col gap-3 shrink-0 justify-end md:justify-start">
                                                        {hasVideo ? (
                                                            <>
                                                                <a
                                                                    href={progress.youtube_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
                                                                >
                                                                    <Play size={12} fill="currentColor" /> {isCompleted ? 'Review' : 'Sync'}
                                                                </a>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleSearchYouTube(selectedPlan, chapter.chapter_number, searchQuery)}
                                                                className="flex items-center justify-center gap-3 bg-white text-black px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
                                                            >
                                                                <Search size={14} /> Connect Node
                                                            </button>
                                                        )}

                                                        <div className="flex gap-2">
                                                            {hasVideo && (
                                                                <button
                                                                    onClick={() => handleSearchYouTube(selectedPlan, chapter.chapter_number, searchQuery)}
                                                                    className="flex-1 p-3 bg-white/5 border border-white/5 rounded-xl text-zinc-500 hover:text-white hover:border-white/20 transition-all"
                                                                    title="Search for a different video"
                                                                >
                                                                    <Search size={14} />
                                                                </button>
                                                            )}
                                                            {hasVideo && (
                                                                <button
                                                                    onClick={() => handleResetChapter(chapter.chapter_number)}
                                                                    className="flex-1 p-3 bg-white/5 border border-white/5 rounded-xl text-zinc-500 hover:text-red-400 hover:border-red-400/30 transition-all"
                                                                    title="Reset video — clear assignment and pick a new one"
                                                                >
                                                                    <RefreshCw size={14} />
                                                                </button>
                                                            )}
                                                            {!isCompleted && hasVideo && progressPercentage >= 90 && (
                                                                <button
                                                                    onClick={() => handleMarkComplete(chapter.chapter_number)}
                                                                    className="flex-1 p-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white hover:text-black transition-all"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Quiz Section */}
                    {!showQuiz && !quizResult && quiz.length > 0 && (
                        <div className="mt-12 p-12 bg-zinc-900 border border-white/5 rounded-[40px] text-white overflow-hidden relative shadow-3xl">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />

                            {isQuizUnlocked ? (
                                <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                <Target size={24} className="text-white" />
                                            </div>
                                            <h3 className="text-2xl font-semibold tracking-tight">Final Assessment</h3>
                                        </div>
                                        <p className="text-zinc-500 text-[13px] font-light leading-relaxed mb-8 max-w-xl">
                                            Curriculum complete. Complete this {quiz.length}-question assessment to synchronize and validate mastery of this neural path.
                                        </p>

                                        {/* Quiz Attempt History */}
                                        {quizAttempts.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {quizAttempts.slice(-4).map((attempt, idx) => (
                                                    <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-700">Attempt {attempt.attempt_number}</span>
                                                            <span className="text-[13px] font-medium text-white">{new Date(attempt.completed_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <span className={`text-lg font-light ${attempt.score >= 70 ? 'text-white' : 'text-zinc-500'}`}>
                                                            {attempt.score.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleStartQuiz}
                                        className="group w-full md:w-auto bg-white text-black px-12 py-5 rounded-full font-bold uppercase tracking-widest text-[11px] hover:opacity-90 transition-all shadow-2xl"
                                    >
                                        {quizAttempts.length > 0 ? 'Recertify Core' : 'Start Assessment'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-8 py-4 relative z-10">
                                    <div className="p-5 bg-white/5 rounded-[24px] border border-white/10">
                                        <Lock size={32} className="text-zinc-800" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold tracking-tight text-white mb-2">Sequence Locked</h3>
                                        <p className="text-zinc-600 text-[13px] font-light max-w-sm">
                                            Complete all knowledge modules to unlock the final certification assessment for this path.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fullscreen Quiz Interface */}
                    {showQuiz && !quizResult && (
                        <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-y-auto animate-in fade-in zoom-in duration-300 font-outfit">
                            {/* Security Alert */}
                            <div className="bg-white/5 backdrop-blur-md border-b border-white/5 px-8 py-3 flex items-center justify-center gap-4">
                                <AlertTriangle size={14} className="text-white animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">Integrity Guard Active — Maintain Fullscreen Mode</span>
                            </div>

                            <div className="container mx-auto max-w-3xl px-6 py-24 flex-1">
                                <div className="mb-20 flex items-center justify-between border-b border-white/10 pb-10">
                                    <div>
                                        <h1 className="text-3xl font-light text-white tracking-tight mb-2">Knowledge <span className="font-semibold">Validation</span></h1>
                                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">Assessment Sequence v4.0</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-light text-white tabular-nums">{Object.keys(quizAnswers).length}/{quiz.length}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-1">Completion Vector</div>
                                    </div>
                                </div>

                                <div className="space-y-16">
                                    {quiz.map((question, qIdx) => (
                                        <div key={qIdx} className="space-y-8">
                                            <div className="flex gap-8">
                                                <span className="text-5xl font-light text-white/5 select-none tabular-nums">{(qIdx + 1).toString().padStart(2, '0')}</span>
                                                <h3 className="text-xl font-medium text-white leading-relaxed pt-2">
                                                    {question.question}
                                                </h3>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 ml-20">
                                                {question.options.map((option, oIdx) => (
                                                    <label
                                                        key={oIdx}
                                                        className={`group relative flex items-center p-5 rounded-2xl border transition-all cursor-pointer ${quizAnswers[qIdx] === oIdx
                                                            ? 'bg-white text-black border-white shadow-3xl'
                                                            : 'bg-white/5 text-zinc-500 border-white/5 hover:border-white/20 hover:text-white'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`question_${qIdx}`}
                                                            checked={quizAnswers[qIdx] === oIdx}
                                                            onChange={() => handleQuizAnswer(qIdx, oIdx)}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${quizAnswers[qIdx] === oIdx ? 'bg-white border-white' : 'border-zinc-200 group-hover:border-black'
                                                            }`}>
                                                            {quizAnswers[qIdx] === oIdx && <div className="w-2 h-2 bg-black rounded-full" />}
                                                        </div>
                                                        <span className="text-sm font-bold tracking-tight">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleSubmitQuiz}
                                    className="mt-20 w-full bg-black text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl flex items-center justify-center gap-4 disabled:bg-zinc-800 disabled:opacity-50"
                                    disabled={submittingQuiz}
                                >
                                    {submittingQuiz ? <RefreshCw size={24} className="animate-spin" /> : <Brain size={24} />}
                                    {submittingQuiz ? 'Analysing Response Patterns...' : 'Submit Certification Data'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quiz Results Scorecard */}
                    {quizResult && (
                        <div className="mt-12 space-y-12 animate-in scroll-mt-20 overflow-hidden" id="quiz-results">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 rounded-[64px] overflow-hidden bg-zinc-900 shadow-3xl">
                                <div className="bg-white text-black p-16 flex flex-col items-center justify-center text-center">
                                    <div className="text-7xl font-light mb-4 tracking-tighter">
                                        {quizResult.score.toFixed(0)}<span className="text-3xl font-medium">%</span>
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400 mb-10">Neural Quotient</div>
                                    <div className={`px-8 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest border ${quizResult.score >= 70 ? 'bg-black text-white border-black' : 'bg-zinc-100 text-zinc-400 border-transparent'
                                        }`}>
                                        {quizResult.score >= 70 ? 'Certification Granted' : 'Retake Required'}
                                    </div>
                                </div>
                                <div className="md:col-span-2 p-16 flex flex-col justify-center bg-black/40">
                                    {quizResult.terminated && (
                                        <div className="flex items-start gap-4 p-6 bg-white/5 border border-dashed border-white/10 rounded-3xl mb-8">
                                            <AlertTriangle className="text-white shrink-0" size={20} />
                                            <div>
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white mb-2">Integrity Breach Detected</h4>
                                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">{quizResult.termination_reason}</p>
                                            </div>
                                        </div>
                                    )}
                                    <h3 className="text-2xl font-semibold text-white mb-4 tracking-tight">Assessment Analysis</h3>
                                    <p className="text-zinc-500 text-[14px] font-light leading-relaxed tracking-wide">
                                        You correctly identified <span className="text-white font-medium underline underline-offset-4">{quizResult.correct_answers} out of {quizResult.total_questions}</span> key concepts.
                                        {quizResult.score >= 70
                                            ? " Optimal cognitive retention achieved. Knowledge integration successful."
                                            : " Baseline proficiency threshold not met. Theoretical reinforcement recommended."}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-700 flex items-center gap-3 px-4 mb-2">
                                    <MessageSquare size={14} /> Item Response Analysis
                                </h3>

                                <div className="space-y-6">
                                    {quizResult.results.map((result, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-10 rounded-[48px] border transition-all ${result.correct ? 'bg-white/5 border-white/5' : 'bg-zinc-900 border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex flex-col md:flex-row gap-10">
                                                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shrink-0 border transition-all ${result.correct ? 'bg-white text-black border-white' : 'bg-black text-white border-white/10'
                                                    }`}>
                                                    {result.correct ? <Check size={28} strokeWidth={3} /> : <X size={28} strokeWidth={3} />}
                                                </div>
                                                <div className="flex-1 space-y-6">
                                                    <div>
                                                        <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-3">Objective {(idx + 1).toString().padStart(2, '0')}</div>
                                                        <h4 className="text-xl font-medium text-white tracking-tight leading-relaxed">
                                                            {quiz[result.question_number]?.question}
                                                        </h4>
                                                    </div>

                                                    {!result.correct && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                                                                <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-700 mb-2">Your Output</div>
                                                                <div className="text-sm font-medium text-zinc-500 italic">"{quiz[result.question_number]?.options[result.user_answer]}"</div>
                                                            </div>
                                                            <div className="p-6 bg-white text-black rounded-3xl">
                                                                <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Verified Key</div>
                                                                <div className="text-sm font-bold">"{quiz[result.question_number]?.options[result.correct_answer]}"</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {result.explanation && (
                                                        <div className="p-8 bg-black/20 border border-white/5 rounded-3xl flex gap-6 group/expl">
                                                            <Lightbulb className="text-zinc-700 group-hover:text-white transition-colors shrink-0" size={20} />
                                                            <p className="text-[13px] font-light text-zinc-500 leading-relaxed italic">
                                                                {result.explanation}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowQuiz(false);
                                    setQuizResult(null);
                                    setQuizAnswers({});
                                }}
                                className="w-full py-6 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-[0.4em] hover:opacity-90 transition-all shadow-3xl"
                            >
                                Revert to Training Environment
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
