/**
 * Polaris Focus Widget — Floating Focus Timer
 * Persistent bottom-right widget visible across all pages.
 * Triggers real-time blocking via backend WebSocket on START.
 * YouTube remains unblocked for learning; Shorts & social media are blocked.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../App';
import {
    Timer, Play, Pause, RotateCcw, Coffee,
    ChevronDown, ChevronUp, Shield, ShieldOff,
    Minimize2, Maximize2, X
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const PRESETS = [
    { label: '25m', seconds: 25 * 60, description: 'Sprint Focus' },
    { label: '50m', seconds: 50 * 60, description: 'Deep Work' },
    { label: '90m', seconds: 90 * 60, description: 'Ultra Focus' },
    { label: '5m', seconds: 5 * 60, description: 'Quick Break' },
];

export default function FocusWidget() {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    // Timer state
    const [selectedPreset, setSelectedPreset] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(PRESETS[0].seconds);
    const [totalTime, setTotalTime] = useState(PRESETS[0].seconds);
    const [isRunning, setIsRunning] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [blockingActive, setBlockingActive] = useState(false);
    const intervalRef = useRef(null);

    // Don't render for unauthenticated users or parents
    if (!user || user.role === 'parent') return null;

    // ── API: Start focus session ────────────────────────────
    const notifyFocusStart = useCallback(async (durationMins) => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/productivity/focus-session/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    duration_minutes: durationMins,
                    preset_label: PRESETS[selectedPreset].label,
                }),
            });
            if (res.ok) {
                setBlockingActive(true);
                console.log('[Focus Widget] Session started — blocking enforced');
            }
        } catch (e) {
            console.debug('[Focus Widget] Start failed:', e.message);
        }
    }, [selectedPreset]);

    // ── API: Stop focus session ─────────────────────────────
    const notifyFocusStop = useCallback(async () => {
        const token = localStorage.getItem('polaris_token');
        if (!token) return;
        try {
            await fetch(`${API_BASE}/productivity/focus-session/stop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            setBlockingActive(false);
            console.log('[Focus Widget] Session stopped — blocking removed');
        } catch (e) {
            console.debug('[Focus Widget] Stop failed:', e.message);
        }
    }, []);

    // ── Timer countdown logic ───────────────────────────────
    useEffect(() => {
        if (isRunning && timeRemaining > 0) {
            intervalRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current);
                        setIsRunning(false);
                        setSessionsCompleted(s => s + 1);
                        notifyFocusStop();
                        // Notification sound
                        try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==').play().catch(() => {}); } catch {}
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, timeRemaining, notifyFocusStop]);

    // ── Actions ─────────────────────────────────────────────
    const selectPreset = (idx) => {
        if (isRunning) notifyFocusStop();
        setSelectedPreset(idx);
        setTimeRemaining(PRESETS[idx].seconds);
        setTotalTime(PRESETS[idx].seconds);
        setIsRunning(false);
    };

    const toggleTimer = () => {
        if (timeRemaining === 0) {
            setTimeRemaining(PRESETS[selectedPreset].seconds);
            setTotalTime(PRESETS[selectedPreset].seconds);
        }
        const newRunning = !isRunning || timeRemaining === 0;
        setIsRunning(newRunning);
        if (newRunning) {
            notifyFocusStart(Math.ceil(PRESETS[selectedPreset].seconds / 60));
            if (!isExpanded) setIsExpanded(true);
        } else {
            notifyFocusStop();
        }
    };

    const resetTimer = () => {
        if (isRunning) notifyFocusStop();
        setIsRunning(false);
        setTimeRemaining(PRESETS[selectedPreset].seconds);
        setTotalTime(PRESETS[selectedPreset].seconds);
    };

    // ── Computed ─────────────────────────────────────────────
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) : 0;
    const isComplete = timeRemaining === 0 && totalTime > 0;
    const circumference = 2 * Math.PI * 26;

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                style={{
                    position: 'fixed', bottom: '20px', right: '20px', zIndex: 9990,
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#3f3f46', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                    transition: 'all 0.2s',
                }}
                title="Show Focus Timer"
            >
                <Timer size={16} />
            </button>
        );
    }

    return (
        <div
            style={{
                position: 'fixed', bottom: '20px', right: '20px', zIndex: 9990,
                fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            <div
                style={{
                    background: '#0a0a0a',
                    border: `1px solid ${isRunning ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: isExpanded ? '20px' : '16px',
                    overflow: 'hidden',
                    boxShadow: isRunning
                        ? '0 8px 40px rgba(34,197,94,0.15), 0 0 0 1px rgba(34,197,94,0.1)'
                        : '0 8px 40px rgba(0,0,0,0.6)',
                    width: isExpanded ? '260px' : '180px',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {/* Header */}
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: isRunning ? '#22c55e' : blockingActive ? '#fbbf24' : '#27272a',
                            animation: isRunning ? 'pulse 2s ease-in-out infinite' : 'none',
                        }} />
                        <span style={{
                            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            color: isRunning ? '#22c55e' : '#3f3f46',
                        }}>
                            {isRunning ? 'Focusing' : isComplete ? 'Complete' : 'Focus'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {/* Mini timer display when collapsed */}
                        {!isExpanded && isRunning && (
                            <span style={{
                                fontSize: '12px', fontWeight: 500, color: '#fff',
                                fontVariantNumeric: 'tabular-nums', marginRight: '4px',
                            }}>
                                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                            </span>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
                            style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: '#27272a', display: 'flex', padding: '2px',
                            }}
                        >
                            <X size={10} />
                        </button>
                    </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                    <div style={{ padding: '12px 14px' }}>
                        {/* Circular timer */}
                        <div style={{
                            display: 'flex', justifyContent: 'center', marginBottom: '14px',
                        }}>
                            <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                                <svg viewBox="0 0 64 64" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                                    <circle
                                        cx="32" cy="32" r="26" fill="none"
                                        stroke={isComplete ? '#22c55e' : isRunning ? '#fff' : '#27272a'}
                                        strokeWidth="3" strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={circumference * (1 - progress)}
                                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                                    />
                                </svg>
                                <div style={{
                                    position: 'absolute', inset: 0, display: 'flex',
                                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {isComplete ? (
                                        <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>✓</span>
                                    ) : (
                                        <span style={{
                                            fontSize: '14px', fontWeight: 300, color: '#fff',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}>
                                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Preset buttons */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', justifyContent: 'center' }}>
                            {PRESETS.map((preset, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => selectPreset(idx)}
                                    disabled={isRunning}
                                    style={{
                                        padding: '4px 10px', borderRadius: '999px', cursor: isRunning ? 'not-allowed' : 'pointer',
                                        background: selectedPreset === idx ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        border: `1px solid ${selectedPreset === idx ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                                        color: selectedPreset === idx ? '#fff' : '#3f3f46',
                                        fontSize: '8px', fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                        letterSpacing: '0.1em', textTransform: 'uppercase',
                                        opacity: isRunning && selectedPreset !== idx ? 0.3 : 1,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginBottom: '10px' }}>
                            <button
                                onClick={resetTimer}
                                style={{
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '10px', padding: '7px 10px', cursor: 'pointer',
                                    color: '#3f3f46', display: 'flex', alignItems: 'center',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <RotateCcw size={12} />
                            </button>
                            <button
                                onClick={toggleTimer}
                                style={{
                                    background: isRunning ? 'rgba(255,255,255,0.08)' : '#fff',
                                    border: 'none', borderRadius: '10px',
                                    padding: '7px 24px', cursor: 'pointer',
                                    color: isRunning ? '#fff' : '#000',
                                    fontSize: '9px', fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                    letterSpacing: '0.15em', textTransform: 'uppercase',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {isRunning ? <Pause size={10} /> : <Play size={10} />}
                                {isComplete ? 'Again' : isRunning ? 'Pause' : 'Start'}
                            </button>
                        </div>

                        {/* Blocking status indicator */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '6px 10px', borderRadius: '10px',
                            background: blockingActive ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${blockingActive ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)'}`,
                        }}>
                            {blockingActive ? (
                                <Shield size={10} style={{ color: '#22c55e' }} />
                            ) : (
                                <ShieldOff size={10} style={{ color: '#27272a' }} />
                            )}
                            <span style={{
                                fontSize: '8px', fontWeight: 600, color: blockingActive ? '#22c55e' : '#27272a',
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                            }}>
                                {blockingActive ? 'Sites Blocked' : 'No Active Blocking'}
                            </span>
                        </div>

                        {/* Sessions */}
                        {sessionsCompleted > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                marginTop: '8px',
                            }}>
                                <Coffee size={9} style={{ color: '#27272a' }} />
                                <span style={{ fontSize: '8px', color: '#27272a', fontWeight: 600 }}>
                                    {sessionsCompleted} session{sessionsCompleted !== 1 ? 's' : ''} today
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
