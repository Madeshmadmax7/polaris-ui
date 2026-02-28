import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { Menu, X, LogOut, LayoutDashboard, Zap, BookOpen, Settings, UserCircle, Shield, ChevronDown, GitBranch, BarChart3, Loader2 } from 'lucide-react';
import { getUser, clearToken, auth as authApi, setToken, setUser as storeUser } from './api';

// Gamification
import { XPProvider } from './gamification/context/XPContext';
import XPBar from './gamification/components/XPBar';

// Lazy-loaded gamification pages
const SkillTreePage = lazy(() => import('./pages/SkillTree'));
const AnalyticsPage = lazy(() => import('./pages/Analytics'));

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductivityPage from './pages/ProductivityPage';
import LearningPage from './pages/LearningPage';
import QuizPage from './pages/QuizPage';
import ParentalPage from './pages/ParentalPage';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import { ManifestoPage, PrivacyPage, LogsPage, OptimizationPage, SecurityPage } from './pages/StaticPages';

// ── Auth Context ────────────────────────────────────────
const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}

function AuthProvider({ children }) {
    const [user, setUserState] = useState(() => getUser());
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        const res = await authApi.login({ email, password });
        setToken(res.access_token);
        storeUser(res.user);
        setUserState(res.user);
        return res;
    };

    const register = async (data) => {
        const res = await authApi.register(data);
        setToken(res.access_token);
        storeUser(res.user);
        setUserState(res.user);
        return res;
    };

    const logout = () => {
        clearToken();
        setUserState(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// ── Protected Route ─────────────────────────────────────
function ProtectedRoute({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

// ── Navbar ─────────────────────────────────────────────
function Navbar() {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const navItems = user ? (user.role === 'parent' ? [
        { to: '/dashboard', label: 'Overview' },
        { to: '/parental', label: 'Children' },
        { to: '/settings', label: 'Settings' },
    ] : [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/productivity', label: 'Productivity' },
        { to: '/learning', label: 'Learning' },
        { to: '/quiz', label: 'Quizzes' },
        { to: '/skill-tree', label: 'Skills' },
        { to: '/analytics', label: 'Analytics' },
        { to: '/settings', label: 'Settings' },
    ]) : [
        { to: '/', label: 'Home' },
        { to: '/features', label: 'Features' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-xl text-white z-[100] border-b border-white/5 font-outfit" style={{ overflow: 'hidden' }}>
            <div style={{ width: '100%', maxWidth: '100vw', padding: '0 16px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', height: '56px', gap: '0' }}>

                    {/* LOGO — far left */}
                    <div style={{ flexShrink: 0, marginRight: '16px' }}>
                        <Link to="/" style={{ textDecoration: 'none' }}>
                            <span className="text-[15px] font-bold tracking-[0.4em] text-white uppercase" style={{ whiteSpace: 'nowrap' }}>
                                Polaris
                            </span>
                        </Link>
                    </div>

                    {/* NAV LINKS — center, scrollable if needed */}
                    <div className="hidden md:flex" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: '2px', overflow: 'hidden', minWidth: 0 }}>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `text-[10px] font-semibold uppercase tracking-[0.12em] transition-all ${isActive ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`
                                }
                                style={{ padding: '6px 10px', borderRadius: '20px', whiteSpace: 'nowrap', textDecoration: 'none' }}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    {/* RIGHT — XP bar + user + logout */}
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '12px' }}>
                            <div style={{ maxWidth: '200px' }}>
                                <XPBar />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                <span className="text-[11px] font-medium text-white" style={{ whiteSpace: 'nowrap' }}>{user.username}</span>
                                <span className="text-[8px] text-zinc-600 uppercase tracking-widest leading-none" style={{ marginTop: '2px' }}>{user.role}</span>
                            </div>
                            <button
                                onClick={() => { logout(); navigate('/'); }}
                                className="rounded-lg bg-white/5 border border-white/10 text-zinc-500 hover:bg-white hover:text-black transition-all"
                                title="Sign Out"
                                style={{ padding: '6px', flexShrink: 0 }}
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '12px' }}>
                            <Link to="/login" className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500 hover:text-white transition-colors" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>Sign In</Link>
                            <Link to="/register" className="bg-white text-black text-[11px] font-bold uppercase tracking-[0.15em] hover:opacity-90 transition-all" style={{ padding: '6px 16px', borderRadius: '20px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                Register
                            </Link>
                        </div>
                    )}

                    {/* Mobile menu button */}
                    <div className="md:hidden" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-white hover:bg-white/5 rounded-xl transition-all">
                            {isOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-black border-t border-white/5 py-6 px-4 space-y-3 animate-in">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                `block px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] rounded-full transition-all ${isActive ? 'bg-white text-black' : 'bg-white/5 text-zinc-500 hover:text-white'}`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                    {!user && (
                        <Link
                            to="/login"
                            onClick={() => setIsOpen(false)}
                            className="block px-6 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-center bg-white text-black rounded-full"
                        >
                            Authorize session
                        </Link>
                    )}
                    {user && (
                        <button
                            onClick={() => { logout(); navigate('/'); setIsOpen(false); }}
                            className="w-full text-center px-6 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white bg-red-950/20 border border-red-900/20 rounded-full flex items-center justify-center gap-3 transition-all"
                        >
                            <LogOut size={14} /> Sign Out
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
}

// ── Footer ─────────────────────────────────────────────
function Footer() {
    return (
        <footer className="bg-black border-t border-white/5 pt-24 pb-12 mt-auto font-outfit">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 mb-24">
                    <div className="md:col-span-12 lg:col-span-4">
                        <Link to="/" className="text-xl font-bold tracking-[0.5em] text-white mb-8 block uppercase">
                            Polaris
                        </Link>
                        <p className="text-zinc-600 font-light text-[14px] tracking-wide leading-relaxed max-w-sm">
                            The definitive operating system for high-performance productivity, adaptive learning, and cognitive clarity.
                        </p>
                    </div>

                    <div className="md:col-span-4 lg:col-span-2 lg:ml-auto">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-700 mb-10">Architecture</h4>
                        <ul className="space-y-5 text-zinc-500 font-medium text-[12px] tracking-widest uppercase">
                            <li><Link to="/features" className="hover:text-white transition-colors">Neural Matrix</Link></li>
                            <li><Link to="/optimization" className="hover:text-white transition-colors">Optimization</Link></li>
                        </ul>
                    </div>

                    <div className="md:col-span-4 lg:col-span-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-700 mb-10">Terminal</h4>
                        <ul className="space-y-5 text-zinc-500 font-medium text-[12px] tracking-widest uppercase">
                            <li><Link to="/manifesto" className="hover:text-white transition-colors">Manifesto</Link></li>
                            <li><Link to="/logs" className="hover:text-white transition-colors">Kernel Logs</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
                    <p className="text-zinc-800 font-bold tracking-[0.5em] text-[9px] uppercase">
                        © {new Date().getFullYear()} POLARIS OPERATIONAL SYSTEM.
                    </p>
                    <div className="flex gap-4">
                        {[Zap, LayoutDashboard, UserCircle].map((Icon, i) => (
                            <button key={i} className="text-zinc-800 hover:text-white transition-all">
                                <Icon size={16} strokeWidth={1} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ── App Layout ──────────────────────────────────────────
function AppLayout({ children, noFooter = false }) {
    return (
        <div className="flex flex-col min-h-screen pt-14 font-outfit selection:bg-white selection:text-black">
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
            {!noFooter && <Footer />}
        </div>
    );
}

// ── App ─────────────────────────────────────────────────
// Suspense fallback for lazy-loaded pages
function GamificationFallback() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <div style={{ textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
                <Loader2 size={24} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Loading...</div>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <XPProvider>
                <AuthProvider>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
                        <Route path="/features" element={<AppLayout><FeaturesPage /></AppLayout>} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Protected Private Routes */}
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <AppLayout><DashboardPage /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/productivity" element={
                            <ProtectedRoute>
                                <AppLayout><ProductivityPage /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/learning" element={
                            <ProtectedRoute>
                                <AppLayout><LearningPage /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/quiz" element={
                            <ProtectedRoute>
                                <AppLayout><QuizPage /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/parental" element={
                            <ProtectedRoute>
                                <AppLayout><ParentalPage /></AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                            <ProtectedRoute>
                                <AppLayout><SettingsPage /></AppLayout>
                            </ProtectedRoute>
                        } />

                        {/* Gamification Routes (lazy loaded) */}
                        <Route path="/skill-tree" element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Suspense fallback={<GamificationFallback />}>
                                        <SkillTreePage />
                                    </Suspense>
                                </AppLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/analytics" element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Suspense fallback={<GamificationFallback />}>
                                        <AnalyticsPage />
                                    </Suspense>
                                </AppLayout>
                            </ProtectedRoute>
                        } />

                        {/* Static Information Routes */}
                        <Route path="/manifesto" element={<AppLayout><ManifestoPage /></AppLayout>} />
                        <Route path="/privacy" element={<AppLayout><PrivacyPage /></AppLayout>} />
                        <Route path="/logs" element={<AppLayout><LogsPage /></AppLayout>} />
                        <Route path="/optimization" element={<AppLayout><OptimizationPage /></AppLayout>} />
                        <Route path="/security" element={<AppLayout><SecurityPage /></AppLayout>} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AuthProvider>
            </XPProvider>
        </BrowserRouter>
    );
}
