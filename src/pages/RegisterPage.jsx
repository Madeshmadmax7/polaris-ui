import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: '', username: '', password: '', role: 'student',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(form);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card animate-in">
                <div className="auth-header">
                    <span className="logo-icon">🧠</span>
                    <h1>Create Account</h1>
                    <p>Join LifeOS and take control of your digital life</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
                            type="email"
                            className="form-input"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-username">Username</label>
                        <input
                            id="reg-username"
                            type="text"
                            className="form-input"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            placeholder="your_username"
                            minLength={3}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            type="password"
                            className="form-input"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="Min 8 characters"
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-role">I am a</label>
                        <select
                            id="reg-role"
                            className="form-select"
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="student">Student</option>
                            <option value="parent">Parent</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--color-primary)' }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
