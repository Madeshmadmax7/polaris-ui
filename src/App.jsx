import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { getUser, clearToken, auth as authApi, setToken, setUser as storeUser } from './api';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductivityPage from './pages/ProductivityPage';
import LearningPage from './pages/LearningPage';
import QuizPage from './pages/QuizPage';
import ParentalPage from './pages/ParentalPage';
import SettingsPage from './pages/SettingsPage';

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

// ── Sidebar ─────────────────────────────────────────────
function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const studentNav = [
        { to: '/dashboard', icon: '📊', label: 'Dashboard' },
        { to: '/productivity', icon: '⚡', label: 'Productivity' },
        { to: '/learning', icon: '📚', label: 'Learning' },
        { to: '/quiz', icon: '🧩', label: 'Quizzes' },
        { to: '/settings', icon: '⚙️', label: 'Settings' },
    ];

    const parentNav = [
        { to: '/dashboard', icon: '📊', label: 'Overview' },
        { to: '/parental', icon: '👨‍👧', label: 'Children' },
        { to: '/settings', icon: '⚙️', label: 'Settings' },
    ];

    const navItems = user?.role === 'parent' ? parentNav : studentNav;

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span className="sidebar-logo-icon">🧠</span>
                <span className="sidebar-logo-text">LifeOS</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {user?.username}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    <span className={`badge badge-${user?.role === 'parent' ? 'primary' : 'productive'}`}>
                        {user?.role}
                    </span>
                </div>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { logout(); navigate('/login'); }}
                    style={{ width: '100%' }}
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

// ── App Layout ──────────────────────────────────────────
function AppLayout({ children }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content animate-in">
                {children}
            </main>
        </div>
    );
}

// ── App ─────────────────────────────────────────────────
export default function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

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

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
