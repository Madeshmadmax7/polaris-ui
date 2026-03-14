import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { UserPlus, ArrowRight } from 'lucide-react';

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
        <div className="min-h-screen bg-black flex flex-col justify-center items-center px-6 py-12 font-outfit">
            <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center mb-12">
                    <Link to="/" className="text-4xl font-light tracking-tighter mb-6 inline-block hover:opacity-80 transition-opacity text-white">POLA<span className="font-semibold">RIS</span></Link>
                    <h1 className="text-2xl font-light text-white uppercase tracking-[0.2em] mb-2">New Entity</h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.3em] text-[10px]">Initialize System Integration</p>
                </div>

                {error && (
                    <div className="bg-white text-black px-6 py-4 rounded-2xl text-[11px] font-bold mb-8 border-l-4 border-black animate-pulse uppercase tracking-widest">
                        Core Error: {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700 ml-1" htmlFor="reg-email">Identifier (Email)</label>
                        <input
                            id="reg-email"
                            type="email"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-[13px] font-medium text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="entity@neural.net"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700 ml-1" htmlFor="reg-username">Public ID</label>
                        <input
                            id="reg-username"
                            type="text"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-[13px] font-medium text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            placeholder="unique_handle_01"
                            minLength={3}
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700 ml-1" htmlFor="reg-password">Security Key</label>
                        <input
                            id="reg-password"
                            type="password"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-[13px] font-medium text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="Min 8 characters"
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700 ml-1" htmlFor="reg-role">Role Classification</label>
                        <div className="relative">
                            <select
                                id="reg-role"
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-[13px] font-medium text-white focus:outline-none focus:border-white/20 transition-all appearance-none"
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                            >
                                <option value="student" className="bg-zinc-900">Student / Core Agent</option>
                                <option value="parent" className="bg-zinc-900">Parent / Administrator</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="group w-full bg-white text-black py-5 rounded-full font-bold uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-4 hover:opacity-90 active:scale-[0.98] transition-all shadow-2xl disabled:opacity-50 mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (
                            <>Initialize Core <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </button>
                </form>

                <div className="mt-16 pt-10 border-t border-white/5 text-center">
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                        Already Integrated?{' '}
                        <Link to="/login" className="text-white hover:underline underline-offset-8 ml-2 decoration-1">Resume Session</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
