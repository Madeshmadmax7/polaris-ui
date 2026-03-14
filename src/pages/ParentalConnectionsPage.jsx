import { useEffect, useState } from 'react';
import { Link2, Unlink2, Clock } from 'lucide-react';
import { parental } from '../api';
import ParentConnectModal from '../components/ParentConnectModal';
import OtpVerificationModal from '../components/OtpVerificationModal';

export default function ParentalConnectionsPage() {
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [connectionData, setConnectionData] = useState(null);
    const [connections, setConnections] = useState([]);
    const [pendingConnections, setPendingConnections] = useState([]);

    useEffect(() => {
        loadConnections();
    }, []);

    async function loadConnections() {
        try {
            const response = await parental.getMyConnections();
            setConnections(response.connections || []);
            await loadPendingConnections();
        } catch (e) {
            console.log('Failed to load connections:', e);
        }
    }

    async function loadPendingConnections() {
        try {
            const data = await parental.getPendingRequests();
            if (data.pending_requests && Array.isArray(data.pending_requests)) {
                const formatted = data.pending_requests.map((req, idx) => ({
                    id: `pending-${idx}`,
                    data: {
                        connection_id: req.connection_id,
                        child_name: req.child_name,
                        child_email: req.child_email,
                        expires_in_seconds: req.expires_in_seconds,
                    },
                    created_at: req.otp_created_at,
                }));
                setPendingConnections(formatted);
            } else {
                setPendingConnections([]);
            }
        } catch (e) {
            console.log('Failed to load pending:', e);
            setPendingConnections([]);
        }
    }

    function handleRequestSent(payload) {
        const localPending = {
            id: `pending-local-${Date.now()}`,
            data: {
                connection_id: payload?.connection_id,
                child_name: payload?.child_email || 'Child',
                child_email: payload?.child_email || null,
                expires_in_seconds: 120,
            },
            created_at: new Date().toISOString(),
        };

        setPendingConnections((prev) => [localPending, ...prev]);
        setShowConnectModal(false);

        setTimeout(() => {
            loadPendingConnections();
        }, 400);
    }

    function openPendingOtpModal(notification) {
        setConnectionData({
            connection_id: notification.data.connection_id,
            child_name: notification.data.child_name,
            child_email: notification.data.child_email,
            expires_in_seconds: notification.data.expires_in_seconds || 120,
        });
        setShowOtpModal(true);
    }

    async function handleCancelPending(notificationId, connectionId) {
        if (!window.confirm('Cancel this connection request?')) return;

        try {
            await parental.cancelPending(connectionId);
            setPendingConnections((pending) => pending.filter((n) => n.id !== notificationId));
        } catch (err) {
            alert(`Failed to cancel: ${err.message}`);
        }
    }

    async function handleVerifyConnection(result) {
        if (result.success) {
            alert('Connection verified! Child is now linked.');
            await loadConnections();
            setShowOtpModal(false);
        }
    }

    async function handleDisconnect(connectionId) {
        if (!window.confirm('Disconnect this child connection?')) return;

        try {
            await parental.disconnect(connectionId);
            await loadConnections();
        } catch (err) {
            alert(err.message);
        }
    }

    return (
        <div className="container mx-auto px-6 py-16 max-w-7xl font-outfit">
            <div className="mb-12">
                <h1 className="text-4xl font-light tracking-tight text-white mb-2">
                    Parent <span className="font-semibold">Connections</span>
                </h1>
                <p className="text-zinc-500 text-[13px] tracking-wide">Manage OTP requests, verify connections, and unlink when needed.</p>
            </div>

            <div className="mb-10">
                <button
                    onClick={() => setShowConnectModal(true)}
                    className="w-full md:w-auto px-8 py-4 bg-white hover:opacity-90 text-black font-bold uppercase tracking-[0.3em] text-[10px] rounded-[32px] flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
                >
                    <Link2 size={16} />
                    Connect to Child via OTP
                </button>
            </div>

            {pendingConnections.length > 0 && (
                <div className="mb-14">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold tracking-tight text-white">Pending OTP Verification</h2>
                        <p className="text-zinc-500 text-[12px] mt-1">Use Enter OTP after your child shares the 4-digit code.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {pendingConnections.map((notif) => (
                            <div key={notif.id} className="p-5 bg-zinc-900 border border-white/10 rounded-[24px] flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-white">{notif.data?.child_name || 'Child'}</p>
                                    <p className="text-[11px] text-zinc-400 mt-1">{notif.data?.child_email || 'Awaiting OTP'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openPendingOtpModal(notif)}
                                        className="px-4 py-2 bg-white text-black rounded-lg font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
                                    >
                                        Enter OTP
                                    </button>
                                    <button
                                        onClick={() => handleCancelPending(notif.id, notif.data?.connection_id)}
                                        className="px-3 py-2 bg-red-950/30 border border-red-900/30 text-red-400 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-red-950/50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold tracking-tight text-white">Active Connections</h2>
                    <p className="text-zinc-500 text-[12px] mt-1">Verified links valid for 30 days.</p>
                </div>

                {connections.length === 0 ? (
                    <div className="p-8 bg-zinc-900 border border-white/10 rounded-[24px] text-zinc-500 text-sm">
                        No active connections yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {connections.map((conn) => (
                            <div key={conn.connection_id} className="p-6 bg-zinc-900 border border-white/10 rounded-[32px] hover:border-white/25 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Active</span>
                                    </div>
                                    <button
                                        onClick={() => handleDisconnect(conn.connection_id)}
                                        className="p-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 rounded-lg text-red-400 transition-colors"
                                        title="Disconnect"
                                    >
                                        <Unlink2 size={14} />
                                    </button>
                                </div>
                                <h3 className="text-sm font-semibold text-white mb-2">{conn.username}</h3>
                                <p className="text-[11px] text-zinc-400 mb-4">{conn.email}</p>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 pt-4 border-t border-white/5">
                                    <Clock size={12} />
                                    <span>Connected {formatDate(conn.connected_at)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ParentConnectModal
                isOpen={showConnectModal}
                onClose={() => setShowConnectModal(false)}
                onRequestSent={handleRequestSent}
            />

            {connectionData && (
                <OtpVerificationModal
                    isOpen={showOtpModal}
                    onClose={() => setShowOtpModal(false)}
                    connectionData={connectionData}
                    onVerified={handleVerifyConnection}
                />
            )}
        </div>
    );
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
