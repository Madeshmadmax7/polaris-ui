import React, { useState } from 'react';
import { X, Mail, AlertCircle } from 'lucide-react';
import { parental } from '../api';

export default function ParentConnectModal({ isOpen, onClose, onRequestSent }) {
    const [childEmail, setChildEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [connectionId, setConnectionId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await parental.requestConnection(childEmail);
            setConnectionId(data.connection_id);
            setSuccess(true);
            if (onRequestSent) {
                onRequestSent({
                    connection_id: data.connection_id,
                    child_email: childEmail,
                });
            }
            setChildEmail('');
            // Don't call onConnectionRequested - that shows OTP to parent (WRONG)
            // Parent must wait for notification and click it to enter OTP
        } catch (err) {
            // If a pending request already exists, reuse it and route user to Enter OTP flow.
            if ((err?.message || '').toLowerCase().includes('pending verification')) {
                try {
                    const pending = await parental.getPendingRequests();
                    const existing = (pending?.pending_requests || []).find(
                        (p) => (p.child_email || '').toLowerCase() === childEmail.toLowerCase()
                    );

                    if (existing && onRequestSent) {
                        onRequestSent({
                            connection_id: existing.connection_id,
                            child_email: existing.child_email || childEmail,
                        });
                        setError('Pending request found. Use Enter OTP below.');
                        return;
                    }
                } catch {
                    // Fall through to default error below.
                }
            }

            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Connect to Child</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded transition-all"
                    >
                        <X size={20} className="text-white/60" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {!success ? (
                        <>
                            <p className="text-sm text-white/60">
                                Enter your child's email address. They will receive an OTP on their notification panel.
                            </p>

                            {error && (
                                <div className="flex gap-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                                        Child's Email
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30" />
                                        <input
                                            type="email"
                                            value={childEmail}
                                            onChange={(e) => setChildEmail(e.target.value)}
                                            placeholder="child@example.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pl-9 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !childEmail}
                                    className="w-full py-3 bg-white text-black rounded-lg font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending Request…' : 'Send Connection Request'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="space-y-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 mx-auto">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-semibold">Request Sent!</p>
                                <p className="text-sm text-white/60 mt-2">
                                    Your child will receive an OTP on their notification panel. Once they verify it, you'll have access to their analytics.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/15 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
