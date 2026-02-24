import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { tracking } from '../api';

export default function SettingsPage() {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [newDomain, setNewDomain] = useState('');
    const [newCategory, setNewCategory] = useState('productive');
    const [blockingMode, setBlockingMode] = useState('hard'); // hard | soft
    const [resettingToday, setResettingToday] = useState(false);

    useEffect(() => {
        // Fetch current mode from extension
        window.postMessage({ type: 'LIFEOS_STATUS_REQUEST' }, '*');

        const handleResponse = (event) => {
            if (event.data && event.data.type === 'LIFEOS_STATUS_RESPONSE') {
                if (event.data.data.blockingMode) {
                    setBlockingMode(event.data.data.blockingMode);
                }
            }
        };
        window.addEventListener('message', handleResponse);
        return () => window.removeEventListener('message', handleResponse);
    }, []);

    const handleModeChange = (mode) => {
        setBlockingMode(mode);
        window.postMessage({ type: 'LIFEOS_SET_MODE', mode }, '*');
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const cat = await tracking.setCategory({
                domain_pattern: newDomain,
                category: newCategory,
            });
            setCategories([cat, ...categories]);
            setNewDomain('');
        } catch (err) { alert(err.message); }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Settings ⚙️</h1>
                <p>Configure your LifeOS experience</p>
            </div>

            <div className="grid-2">
                {/* Enforcement Mode */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Enforcement Level</div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Choose how strictly sites are blocked. Hard mode is at the network level, while Soft mode uses a smart UI overlay.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className={`btn ${blockingMode === 'hard' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => handleModeChange('hard')}
                            style={{ flex: 1 }}
                        >
                            🛡️ Hard Mode
                        </button>
                        <button
                            className={`btn ${blockingMode === 'soft' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => handleModeChange('soft')}
                            style={{ flex: 1 }}
                        >
                            🎭 Soft Mode
                        </button>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <span className={`badge badge-${blockingMode === 'hard' ? 'distracting' : 'productive'}`}>
                            Current: {blockingMode === 'hard' ? 'Network Block' : 'UI Overlay'}
                        </span>
                    </div>
                </div>

                {/* Profile */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Profile</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <div className="form-label">Username</div>
                            <div style={{ fontWeight: 600 }}>{user?.username}</div>
                        </div>
                        <div>
                            <div className="form-label">Email</div>
                            <div style={{ fontWeight: 600 }}>{user?.email}</div>
                        </div>
                        <div>
                            <div className="form-label">Role</div>
                            <span className={`badge badge-${user?.role === 'parent' ? 'primary' : 'productive'}`}>
                                {user?.role}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Domain Categories */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Domain Classifications</div>
                    </div>
                    <form onSubmit={handleAddCategory}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <input className="form-input" value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                placeholder="domain.com" required style={{ flex: 1 }} />
                            <select className="form-select" value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)} style={{ width: '140px' }}>
                                <option value="productive">Productive</option>
                                <option value="neutral">Neutral</option>
                                <option value="distracting">Distracting</option>
                            </select>
                            <button type="submit" className="btn btn-primary btn-sm">Add</button>
                        </div>
                    </form>
                    {categories.map((c) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '14px' }}>
                            <span>{c.domain_pattern}</span>
                            <span className={`badge badge-${c.category}`}>{c.category}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Extension Info */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">Chrome Extension</div>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                    Install the LifeOS Chrome extension to enable automatic activity tracking,
                    site blocking, and real-time sync.
                </p>
                <ol style={{ color: 'var(--text-muted)', marginTop: '12px', paddingLeft: '20px', lineHeight: '2' }}>
                    <li>Open <code>chrome://extensions</code></li>
                    <li>Enable Developer Mode</li>
                    <li>Click "Load unpacked"</li>
                    <li>Select the <code>extension/</code> folder</li>
                    <li>Sign in via the extension popup</li>
                </ol>
            </div>

            {/* Data Management */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <div className="card-title">🗑️ Data Management</div>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '16px' }}>
                    Reset today's tracking data to start fresh. This removes all activity logs and daily summary for today.
                </p>
                <button
                    className="btn btn-sm"
                    style={{ background: 'var(--color-danger, #ef4444)', color: 'white', border: 'none' }}
                    disabled={resettingToday}
                    onClick={async () => {
                        if (!confirm('Are you sure? This will delete ALL tracking data for today (activity logs, productivity score, etc). This cannot be undone.')) return;
                        setResettingToday(true);
                        try {
                            const result = await tracking.resetToday();
                            alert(`✓ ${result.message}`);
                        } catch (err) {
                            alert('Failed: ' + err.message);
                        } finally {
                            setResettingToday(false);
                        }
                    }}
                >
                    {resettingToday ? '⏳ Resetting...' : '🗑️ Reset Today\'s Tracking Data'}
                </button>
            </div>
        </div>
    );
}
