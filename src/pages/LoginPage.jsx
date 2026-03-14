import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { LogIn, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                setError('Cannot connect to backend. Is it running on port 8000?');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center items-center px-6 py-12 font-outfit">
            <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center mb-12">
                    <Link to="/" className="text-4xl font-light tracking-tighter mb-6 inline-block hover:opacity-80 transition-opacity text-white">
                        POLA<span className="font-semibold">RIS</span>
                    </Link>
                    <h1 className="text-2xl font-light text-white uppercase tracking-[0.2em] mb-2">Access Portal</h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.3em] text-[10px]">Initialize Authenticated Session</p>
                </div>

                {error && (
                    <div className="bg-white text-black px-6 py-4 rounded-2xl text-[11px] font-bold mb-8 border-l-4 border-black animate-pulse uppercase tracking-widest">
                        Core Fault: {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700 ml-1" htmlFor="login-email">Identifier</label>
                        <input
                            id="login-email"
                            type="email"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-[13px] font-medium text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="entity@neural-link.com"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700" htmlFor="login-password">Security Key</label>
                            <a href="#" className="text-[9px] font-bold uppercase tracking-widest text-zinc-800 hover:text-white transition-colors">Recovery Required?</a>
                        </div>
                        <input
                            id="login-password"
                            type="password"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-[13px] font-medium text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-800"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="group w-full bg-white text-black py-5 rounded-full font-bold uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-4 hover:opacity-90 active:scale-[0.98] transition-all shadow-2xl disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Decrypting...' : (
                            <>Authorize Session <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </button>
                </form>

                <div className="mt-16 pt-10 border-t border-white/5 text-center">
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                        New Entity?{' '}
                        <Link to="/register" className="text-white hover:underline underline-offset-8 ml-2 decoration-1">Initialize Account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
