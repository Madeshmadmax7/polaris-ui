import { useState, useEffect } from 'react';
import { ai } from '../api';
import { useNavigate } from 'react-router-dom';

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
        return <div className="loading-spinner"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1>Quiz Engine 🧩</h1>
                <p>Quizzes are now integrated with study plans!</p>
            </div>

            <div className="card">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
                    <h2 style={{ marginBottom: '16px' }}>Quizzes Are Now Part of Study Plans!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6' }}>
                        We've improved the learning experience! Quizzes are automatically generated 
                        when you create a study plan. Complete all chapters to unlock the quiz.
                    </p>
                    
                    <button 
                        className="btn btn-primary btn-lg"
                        onClick={() => navigate('/learning')}
                        style={{ marginBottom: '16px' }}
                    >
                        Go to Learning Page →
                    </button>

                    {studyPlans.length > 0 && (
                        <div style={{ marginTop: '32px', textAlign: 'left' }}>
                            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Your Study Plans with Quizzes</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {studyPlans.map((plan) => {
                                    const chaptersCount = plan.plan_data?.chapters?.length || 0;
                                    const quizCount = plan.plan_data?.quiz?.length || 0;
                                    
                                    return (
                                        <div
                                            key={plan.id}
                                            onClick={() => navigate('/learning')}
                                            style={{
                                                padding: '16px',
                                                background: 'var(--bg-elevated)',
                                                borderRadius: 'var(--radius-md)',
                                                cursor: 'pointer',
                                                border: '1px solid var(--border-subtle)',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                                        {plan.title || plan.goal}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                                        {chaptersCount} chapters • {quizCount} quiz questions
                                                        {plan.quiz_unlocked && ' • ✓ Quiz unlocked'}
                                                    </div>
                                                </div>
                                                <span className="badge badge-primary">
                                                    {plan.duration_days}d
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {studyPlans.length === 0 && (
                        <div style={{ marginTop: '32px', padding: '24px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>
                                You don't have any study plans yet. Create one on the Learning page to get started!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
