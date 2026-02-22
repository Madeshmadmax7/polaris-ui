import { useState, useEffect } from 'react';
import { ai } from '../api';

export default function LearningPage() {
    const [documents, setDocuments] = useState([]);
    const [studyPlans, setStudyPlans] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [queryText, setQueryText] = useState('');
    const [queryResult, setQueryResult] = useState(null);
    const [querying, setQuerying] = useState(false);
    const [planForm, setPlanForm] = useState({ goal: '', duration_days: 14, document_id: '' });
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const doc = await ai.uploadDocument(file);
            setDocuments([doc, ...documents]);
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
        } catch (err) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleQuery = async (e) => {
        e.preventDefault();
        if (!queryText.trim()) return;
        setQuerying(true);
        try {
            const result = await ai.query({ query: queryText });
            setQueryResult(result);
        } catch (err) {
            alert(err.message);
        } finally {
            setQuerying(false);
        }
    };

    if (loading) {
        return <div className="loading-spinner"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1>Adaptive Learning 📚</h1>
                <p>Upload syllabi, generate AI study plans, and query your documents</p>
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
                                                {doc.chunk_count} chunks
                                            </span>
                                        </div>
                                    </div>
                                    <span className="badge badge-productive">indexed</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state">
                            <h3>No documents yet</h3>
                            <p>Upload a syllabus PDF to get started</p>
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
                            <label className="form-label">Study Goal</label>
                            <input
                                className="form-input"
                                value={planForm.goal}
                                onChange={(e) => setPlanForm({ ...planForm, goal: e.target.value })}
                                placeholder="e.g. Prepare for Data Structures exam in 20 days"
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
                                    <option value="">All documents</option>
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
                            {creating ? '🔄 Generating plan...' : '✨ Generate Study Plan'}
                        </button>
                    </form>
                </div>
            </div>

            {/* RAG Query */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">🔍 Ask Your Documents</div>
                </div>
                <form onSubmit={handleQuery} style={{ display: 'flex', gap: '12px' }}>
                    <input
                        className="form-input"
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                        placeholder="Ask anything about your uploaded materials..."
                        required
                        style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary" disabled={querying}>
                        {querying ? '...' : 'Ask'}
                    </button>
                </form>

                {queryResult && (
                    <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                            {queryResult.answer}
                        </div>
                        {queryResult.sources?.length > 0 && (
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Sources:</div>
                                {queryResult.sources.map((s, i) => (
                                    <div key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '4px 0' }}>
                                        {s.snippet}...
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Study Plans List */}
            {studyPlans.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <div className="card-title">📋 Your Study Plans</div>
                    </div>

                    {studyPlans.map((plan) => (
                        <div
                            key={plan.id}
                            style={{
                                padding: '16px',
                                background: selectedPlan === plan.id ? 'var(--bg-elevated)' : 'transparent',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: '8px',
                                cursor: 'pointer',
                                border: '1px solid var(--border-subtle)',
                            }}
                            onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{plan.title}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        {plan.duration_days} days • {new Date(plan.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <span className="badge badge-primary">
                                    {plan.duration_days}d
                                </span>
                            </div>

                            {selectedPlan === plan.id && plan.plan_data && (
                                <div style={{ marginTop: '16px', fontSize: '14px', lineHeight: '1.7' }}>
                                    {plan.plan_data.overview && (
                                        <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
                                            {plan.plan_data.overview}
                                        </p>
                                    )}
                                    {plan.plan_data.daily_plan?.slice(0, 7).map((day, i) => (
                                        <div key={i} style={{
                                            padding: '10px',
                                            background: 'var(--bg-card)',
                                            borderRadius: 'var(--radius-sm)',
                                            marginBottom: '6px',
                                            border: '1px solid var(--border-subtle)',
                                        }}>
                                            <div style={{ fontWeight: 600, fontSize: '13px' }}>
                                                Day {day.day}: {day.topic}
                                            </div>
                                            {day.subtopics && (
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    {day.subtopics.join(' • ')}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {plan.plan_data.daily_plan?.length > 7 && (
                                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                            + {plan.plan_data.daily_plan.length - 7} more days...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
