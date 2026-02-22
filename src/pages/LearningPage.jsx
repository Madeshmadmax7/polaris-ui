import { useState, useEffect } from 'react';
import { ai } from '../api';

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

    useEffect(() => {
        async function load() {
            try {
                const [docs, plans] = await Promise.all([
                    ai.getDocuments().catch(() => []),
                    ai.getStudyPlans().catch(() => []),
                ]);
                setDocuments(docs);
                setStudyPlans(plans);
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
        }
    }, [selectedPlan]);

    const loadPlanProgress = async (planId) => {
        try {
            const progress = await ai.getStudyPlanProgress(planId);
            setPlanProgress(progress);
        } catch (err) {
            console.error('Failed to load progress:', err);
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
    };

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
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmittingQuiz(false);
        }
    };

    if (loading) {
        return <div className="loading-spinner"><div className="spinner"></div></div>;
    }

    const currentPlan = studyPlans.find(p => p.id === selectedPlan);
    const chapters = currentPlan?.plan_data?.chapters || [];
    const quiz = currentPlan?.plan_data?.quiz || [];
    const isQuizUnlocked = currentPlan?.quiz_unlocked || false;

    return (
        <div>
            <div className="page-header">
                <h1>Adaptive Learning 📚</h1>
                <p>Upload PDFs, generate AI study plans with YouTube chapters, and test your knowledge</p>
            </div>

            <div className="grid-2">
                {/* Document Upload */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">📄 Documents</div>
                        <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                            {uploading ? 'Uploading...' : '+ Upload PDF'}
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleUpload}
                                style={{ display: 'none' }}
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    {documents.length > 0 ? (
                        <ul className="domain-list">
                            {documents.map((doc) => (
                                <li key={doc.id} className="domain-item">
                                    <div className="domain-info">
                                        <div className="domain-favicon">📄</div>
                                        <div>
                                            <div className="domain-name">{doc.filename}</div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="badge badge-productive">stored</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state">
                            <h3>No documents yet</h3>
                            <p>Upload a PDF to base your study plan on course materials</p>
                        </div>
                    )}
                </div>

                {/* Study Plan Generator */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">🗓️ Create Study Plan</div>
                    </div>

                    <form onSubmit={handleCreatePlan}>
                        <div className="form-group">
                            <label className="form-label">What do you want to learn?</label>
                            <input
                                className="form-input"
                                value={planForm.goal}
                                onChange={(e) => setPlanForm({ ...planForm, goal: e.target.value })}
                                placeholder="e.g. Master React.js fundamentals"
                                required
                                minLength={5}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Duration (days)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={planForm.duration_days}
                                onChange={(e) => setPlanForm({ ...planForm, duration_days: parseInt(e.target.value) })}
                                min={1}
                                max={365}
                            />
                        </div>

                        {documents.length > 0 && (
                            <div className="form-group">
                                <label className="form-label">Base on Document (optional)</label>
                                <select
                                    className="form-select"
                                    value={planForm.document_id}
                                    onChange={(e) => setPlanForm({ ...planForm, document_id: e.target.value })}
                                >
                                    <option value="">-- Select a document --</option>
                                    {documents.map((d) => (
                                        <option key={d.id} value={d.id}>{d.filename}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={creating}
                            style={{ width: '100%' }}
                        >
                            {creating ? '🔄 Generating plan with chapters & quiz...' : '✨ Generate Study Plan'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Study Plans List */}
            {studyPlans.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <div className="card-title">📋 Your Study Plans</div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '0 16px 16px 16px' }}>
                        {studyPlans.map((plan) => (
                            <button
                                key={plan.id}
                                onClick={() => {
                                    setSelectedPlan(selectedPlan === plan.id ? null : plan.id);
                                    setShowQuiz(false);
                                    setQuizResult(null);
                                }}
                                className={`btn ${selectedPlan === plan.id ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ flex: '0 0 auto' }}
                            >
                                {plan.title || plan.goal}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Plan Details */}
            {selectedPlan && currentPlan && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <div className="card-title">
                            {currentPlan.title || currentPlan.goal}
                        </div>
                        {planProgress && (
                            <span className="badge badge-primary">
                                {planProgress.completed_chapters}/{planProgress.total_chapters} completed
                            </span>
                        )}
                    </div>

                    {currentPlan.plan_data?.overview && (
                        <div style={{ padding: '0 16px 16px 16px' }}>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                {currentPlan.plan_data.overview}
                            </p>
                        </div>
                    )}

                    {/* Chapters */}
                    {!showQuiz && !quizResult && chapters.length > 0 && (
                        <div style={{ padding: '0 16px 16px 16px' }}>
                            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>📺 Video Chapters</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {chapters.map((chapter) => {
                                    const progress = planProgress?.chapters?.find(
                                        c => c.chapter_index === chapter.chapter_number
                                    );
                                    const isCompleted = progress?.is_completed || false;

                                    return (
                                        <div
                                            key={chapter.chapter_number}
                                            style={{
                                                padding: '16px',
                                                background: isCompleted ? 'var(--bg-elevated)' : 'var(--bg-card)',
                                                borderRadius: 'var(--radius-md)',
                                                border: `2px solid ${isCompleted ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span className="badge badge-secondary">
                                                            Chapter {chapter.chapter_number}
                                                        </span>
                                                        {isCompleted && <span style={{ fontSize: '20px' }}>✓</span>}
                                                    </div>
                                                    <h4 style={{ margin: '8px 0', fontSize: '16px', fontWeight: 600 }}>
                                                        {chapter.title}
                                                    </h4>
                                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                                        {chapter.description}
                                                    </p>
                                                    {chapter.key_topics && chapter.key_topics.length > 0 && (
                                                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            {chapter.key_topics.map((topic, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    style={{
                                                                        fontSize: '12px',
                                                                        padding: '4px 8px',
                                                                        background: 'var(--bg-card)',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        color: 'var(--text-muted)',
                                                                    }}
                                                                >
                                                                    {topic}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {chapter.duration_estimate && (
                                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                                            ⏱️ {chapter.duration_estimate}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                <a
                                                    href={chapter.youtube_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-primary"
                                                    style={{ flex: 1 }}
                                                >
                                                    ▶️ Watch on YouTube
                                                </a>
                                                {!isCompleted && (
                                                    <button
                                                        onClick={() => handleMarkComplete(chapter.chapter_number)}
                                                        className="btn btn-secondary"
                                                    >
                                                        Mark Complete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quiz Section */}
                    {!showQuiz && !quizResult && quiz.length > 0 && (
                        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}>
                            {isQuizUnlocked ? (
                                <div>
                                    <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>🎯 Knowledge Quiz</h3>
                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                        Test your understanding with {quiz.length} multiple-choice questions
                                    </p>
                                    <button onClick={handleStartQuiz} className="btn btn-primary">
                                        Start Quiz
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>🔒 Quiz Locked</h3>
                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                        Complete all {chapters.length} chapters to unlock the quiz
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quiz Questions */}
                    {showQuiz && !quizResult && (
                        <div style={{ padding: '16px' }}>
                            <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>🎯 Quiz Time!</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {quiz.map((question, qIdx) => (
                                    <div
                                        key={qIdx}
                                        style={{
                                            padding: '16px',
                                            background: 'var(--bg-elevated)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-subtle)',
                                        }}
                                    >
                                        <p style={{ fontWeight: 600, marginBottom: '12px', fontSize: '15px' }}>
                                            {qIdx + 1}. {question.question}
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {question.options.map((option, oIdx) => (
                                                <label
                                                    key={oIdx}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '12px',
                                                        background: quizAnswers[qIdx] === oIdx ? 'var(--color-primary-alpha)' : 'var(--bg-card)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        cursor: 'pointer',
                                                        border: `2px solid ${quizAnswers[qIdx] === oIdx ? 'var(--color-primary)' : 'transparent'}`,
                                                    }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question_${qIdx}`}
                                                        checked={quizAnswers[qIdx] === oIdx}
                                                        onChange={() => handleQuizAnswer(qIdx, oIdx)}
                                                        style={{ marginRight: '12px' }}
                                                    />
                                                    <span style={{ fontSize: '14px' }}>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSubmitQuiz}
                                className="btn btn-primary"
                                disabled={submittingQuiz}
                                style={{ width: '100%', marginTop: '24px' }}
                            >
                                {submittingQuiz ? '⏳ Submitting...' : 'Submit Quiz'}
                            </button>
                        </div>
                    )}

                    {/* Quiz Results */}
                    {quizResult && (
                        <div style={{ padding: '16px' }}>
                            <div style={{
                                padding: '24px',
                                background: 'var(--bg-elevated)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center',
                                marginBottom: '24px',
                            }}>
                                <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>
                                    {quizResult.score >= 70 ? '🎉' : '📚'} {quizResult.score.toFixed(1)}%
                                </h2>
                                <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
                                    {quizResult.correct_answers} out of {quizResult.total_questions} correct
                                </p>
                                {quizResult.score >= 70 ? (
                                    <p style={{ marginTop: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                        Great job! You've mastered this topic! 🚀
                                    </p>
                                ) : (
                                    <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>
                                        Keep studying! Review the chapters again. 💪
                                    </p>
                                )}
                            </div>

                            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>📊 Answer Review</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {quizResult.results.map((result, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: '16px',
                                            background: result.correct ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            border: `2px solid ${result.correct ? '#22c55e' : '#ef4444'}`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '24px' }}>
                                                {result.correct ? '✓' : '✗'}
                                            </span>
                                            <span style={{ fontWeight: 600, fontSize: '15px' }}>
                                                Question {result.question_number + 1}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                                            {quiz[result.question_number]?.question}
                                        </p>
                                        {!result.correct && (
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                <div>Your answer: <strong>{quiz[result.question_number]?.options[result.user_answer]}</strong></div>
                                                <div>Correct answer: <strong>{quiz[result.question_number]?.options[result.correct_answer]}</strong></div>
                                            </div>
                                        )}
                                        {result.explanation && (
                                            <p style={{
                                                fontSize: '13px',
                                                color: 'var(--text-secondary)',
                                                marginTop: '8px',
                                                padding: '8px',
                                                background: 'var(--bg-card)',
                                                borderRadius: 'var(--radius-sm)',
                                            }}>
                                                💡 {result.explanation}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    setShowQuiz(false);
                                    setQuizResult(null);
                                    setQuizAnswers({});
                                }}
                                className="btn btn-secondary"
                                style={{ width: '100%', marginTop: '24px' }}
                            >
                                Back to Study Plan
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
