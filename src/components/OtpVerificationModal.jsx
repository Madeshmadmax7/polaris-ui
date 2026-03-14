import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Check, Loader } from 'lucide-react';
import { parental } from '../api';

export default function OtpVerificationModal({ isOpen, onClose, connectionData, onVerified }) {
    const [otp, setOtp] = useState(['', '', '', '']);
    const [childEmail, setChildEmail] = useState(connectionData?.child_email || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [expiresIn, setExpiresIn] = useState(null);
    const inputRefs = useRef([]);

    // Auto-focus first input
    useEffect(() => {
        if (isOpen && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [isOpen]);

    // Countdown timer
    useEffect(() => {
        if (!connectionData?.expires_in_seconds) return;

        setExpiresIn(connectionData.expires_in_seconds);
        const interval = setInterval(() => {
            setExpiresIn((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [connectionData?.expires_in_seconds]);

    useEffect(() => {
        setChildEmail(connectionData?.child_email || '');
    }, [connectionData?.child_email, isOpen]);

    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return; // Only digits

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-focus previous on backspace
        if (!value && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pastedData = e.clipboardData.getData('text').slice(0, 4);
        if (!/^\d{1,4}$/.test(pastedData)) return;

        e.preventDefault();
        const newOtp = pastedData.split('');
        while (newOtp.length < 4) newOtp.push('');
        setOtp(newOtp);

        // Focus last filled input
        const lastIndex = newOtp.findIndex((v) => !v);
        if (lastIndex === -1) {
            inputRefs.current[3]?.focus();
        } else if (lastIndex > 0) {
            inputRefs.current[lastIndex]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');

        if (otpCode.length !== 4) {
            setError('Please enter all 4 digits');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let data;
            if (connectionData?.connection_id) {
                data = await parental.verifyConnection(connectionData.connection_id, otpCode);
            } else {
                if (!childEmail) {
                    throw new Error('Enter child email');
                }
                data = await parental.verifyConnectionByEmail(childEmail, otpCode);
            }
            setSuccess(true);

            setTimeout(() => {
                if (onVerified) {
                    onVerified(data);
                }
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.message);
            setOtp(['', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !connectionData) return null;

    const isExpired = expiresIn <= 0;
    const otpFilled = otp.every((digit) => digit !== '');

    return (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Verify Connection</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded transition-all"
                    >
                        <X size={20} className="text-white/60" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {!success ? (
                        <>
                            <div className="space-y-2">
                                {connectionData.child_name && (
                                    <p className="text-sm font-semibold text-white">Connecting to: {connectionData.child_name}</p>
                                )}
                                <p className="text-sm text-white/60">
                                    Ask your child for the OTP code they received. They will see a 4-digit code in their notification.
                                </p>
                                {connectionData.parent_name && (
                                    <p className="text-xs font-semibold text-white/50">
                                        Parent: {connectionData.parent_name}
                                    </p>
                                )}
                            </div>

                            {error && (
                                <div className="flex gap-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {!connectionData?.connection_id && (
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                                            Child Email
                                        </label>
                                        <input
                                            type="email"
                                            value={childEmail}
                                            onChange={(e) => setChildEmail(e.target.value)}
                                            placeholder="child@example.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                                        Enter 4-Digit OTP
                                    </label>
                                    <div
                                        className="flex gap-3 justify-center"
                                        onPaste={handlePaste}
                                    >
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => (inputRefs.current[index] = el)}
                                                type="text"
                                                inputMode="numeric"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                maxLength="1"
                                                disabled={isExpired || loading}
                                                className="w-12 h-14 text-2xl font-bold text-center bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all disabled:opacity-50"
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Countdown timer */}
                                <div className="flex items-center justify-center">
                                    <span className={`text-xs font-semibold ${
                                        expiresIn <= 60 ? 'text-red-400' : 'text-white/50'
                                    }`}>
                                        Expires in {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, '0')}
                                    </span>
                                </div>

                                {isExpired && (
                                    <div className="flex gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                        <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-300">OTP has expired. Please request a new connection.</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!otpFilled || loading || isExpired}
                                    className="w-full py-3 bg-white text-black rounded-lg font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader size={16} className="animate-spin" />
                                            Verifying…
                                        </span>
                                    ) : (
                                        'Verify OTP'
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="space-y-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 mx-auto">
                                <Check size={24} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-white font-semibold">Connection Verified!</p>
                                <p className="text-sm text-white/60 mt-2">
                                    You now have access to {connectionData.parent_name}'s analytics.
                                </p>
                                <p className="text-xs text-white/40 mt-2">
                                    OTP expires in 2 minutes.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}