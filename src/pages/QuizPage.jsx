import { useState, useEffect } from 'react';
import { ai } from '../api';

export default function QuizPage() {
    const [quizzes, setQuizzes] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ topic: '', difficulty: 'medium' });
    const [documents, setDocuments] = useState([]);

    useEffect(() => {
        async function load() {
            try {
                const [q, d] = await Promise.all([
                    ai.getQuizzes().catch(() => []),
                    ai.getDocuments().catch(() => []),
                ]);
                setQuizzes(q); setDocuments(d);
            } finally { setLoading(false); }
        }
        load();
    }, []);

    const handleGenerate = async (e) => {
        e.preventDefault(); setGenerating(true); setResult(null); setAnswers({});
        try {
            const quiz = await ai.generateQuiz(form);
            setCurrentQuiz(quiz); setQuizzes([quiz, ...quizzes]);
        } catch (err) { alert(err.message); }
        finally { setGenerating(false); }
    };

    const handleSubmit = async () => {
        if (!currentQuiz) return; setSubmitting(true);
        try {
            const res = await ai.submitQuiz({ quiz_id: currentQuiz.id, answers });
            setResult(res);
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const resetQuiz = () => { setCurrentQuiz(null); setResult(null); setAnswers({}); };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1>Quiz Engine 🧩</h1>
                <p>AI-generated quizzes with adaptive difficulty</p>
            </div>

            {!currentQuiz && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <div className="card-header"><div className="card-title">Generate New Quiz</div></div>
                    <form onSubmit={handleGenerate}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Topic</label>
                                <input className="form-input" value={form.topic}
                                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                                    placeholder="e.g. Binary Search Trees" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Difficulty</label>
                                <select className="form-select" value={form.difficulty}
                                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={generating} style={{ width: '100%' }}>
                            {generating ? '🔄 Generating...' : '✨ Generate Quiz'}
                        </button>
                    </form>
                </div>
            )}

            {currentQuiz && !result && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h2>{form.topic} <span className="badge badge-neutral">{form.difficulty}</span></h2>
                        <button className="btn btn-secondary btn-sm" onClick={resetQuiz}>← Back</button>
                    </div>
                    {currentQuiz.questions?.map((q, i) => (
                        <div key={i} className="card" style={{ marginBottom: '16px' }}>
                            <p style={{ fontWeight: 600, marginBottom: '12px' }}>Q{i + 1}. {q.question}</p>
                            {q.type === 'mcq' && q.options?.map((opt, oi) => (
                                <label key={oi} style={{ display: 'flex', gap: '10px', padding: '8px 12px', background: answers[String(q.id)] === oi ? 'var(--color-primary-dim)' : 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '6px', cursor: 'pointer' }}>
                                    <input type="radio" name={`q-${q.id}`} checked={answers[String(q.id)] === oi}
                                        onChange={() => setAnswers({ ...answers, [String(q.id)]: oi })} />
                                    <span>{opt}</span>
                                </label>
                            ))}
                            {(q.type === 'conceptual' || q.type === 'coding') && (
                                <textarea className="form-textarea" placeholder="Your answer..." value={answers[String(q.id)] || ''}
                                    onChange={(e) => setAnswers({ ...answers, [String(q.id)]: e.target.value })}
                                    style={{ fontFamily: q.type === 'coding' ? 'monospace' : 'inherit' }} />
                            )}
                        </div>
                    ))}
                    <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting} style={{ width: '100%' }}>
                        {submitting ? '📝 Submitting...' : '✅ Submit'}
                    </button>
                </div>
            )}

            {result && (
                <div className="card">
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div className="score-circle" style={{ margin: '0 auto' }}>
                            <div className="score-value">{Math.round(result.score)}</div>
                            <div className="score-label">Score</div>
                        </div>
                        <h3 style={{ marginTop: '12px' }}>
                            {result.score >= 80 ? '🎉 Excellent!' : result.score >= 50 ? '👍 Good job!' : '📖 Keep studying!'}
                        </h3>
                    </div>
                    <button className="btn btn-primary" onClick={resetQuiz} style={{ width: '100%', marginTop: '16px' }}>
                        Take Another Quiz
                    </button>
                </div>
            )}
        </div>
    );
}
