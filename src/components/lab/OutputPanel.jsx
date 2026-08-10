/**
 * Polaris Lab — Output Panel Component
 * Displays code execution results in a terminal-style console.
 */

import { useRef, useEffect } from 'react';
import { Terminal, Clock, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function OutputPanel({ output, isRunning, onClear }) {
    const scrollRef = useRef(null);

    // Auto-scroll to bottom when output changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [output]);

    const hasError = output?.stderr && output.stderr.length > 0;
    const hasOutput = output?.stdout && output.stdout.length > 0;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: '#050505', borderRadius: '16px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.05)',
        }}>
            {/* Panel Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: '#030303',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={12} style={{ color: '#71717a' }} />
                    <span style={{
                        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.15em', color: '#71717a', fontFamily: "'Outfit', sans-serif",
                    }}>
                        Terminal Output
                    </span>

                    {isRunning && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '2px 8px', borderRadius: '999px',
                            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
                        }}>
                            <div style={{
                                width: '5px', height: '5px', borderRadius: '50%',
                                background: '#fbbf24', animation: 'pulse 1s ease-in-out infinite',
                            }} />
                            <span style={{ fontSize: '9px', fontWeight: 600, color: '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>
                                Executing
                            </span>
                        </div>
                    )}

                    {output && !isRunning && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '2px 8px', borderRadius: '999px',
                            background: hasError ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                            border: `1px solid ${hasError ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                        }}>
                            {hasError
                                ? <AlertTriangle size={9} style={{ color: '#ef4444' }} />
                                : <CheckCircle2 size={9} style={{ color: '#22c55e' }} />
                            }
                            <span style={{
                                fontSize: '9px', fontWeight: 600,
                                color: hasError ? '#ef4444' : '#22c55e',
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                {output.exit_code === 0 ? 'Success' : `Exit: ${output.exit_code}`}
                            </span>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {output?.execution_time_ms > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={9} style={{ color: '#3f3f46' }} />
                            <span style={{ fontSize: '9px', color: '#3f3f46', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                {output.execution_time_ms.toFixed(0)}ms
                            </span>
                        </div>
                    )}
                    {output && (
                        <button
                            onClick={onClear}
                            title="Clear output"
                            style={{
                                background: 'transparent', border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '6px', padding: '3px 6px', cursor: 'pointer', color: '#3f3f46',
                                display: 'flex', alignItems: 'center', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.target.style.color = '#71717a'; }}
                            onMouseLeave={e => { e.target.style.color = '#3f3f46'; }}
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>
            </div>

            {/* Output Content */}
            <div
                ref={scrollRef}
                style={{
                    flex: 1, padding: '12px 16px', overflowY: 'auto', overflowX: 'hidden',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                    fontSize: '12px', lineHeight: '1.7',
                }}
            >
                {!output && !isRunning && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        height: '100%', color: '#27272a', textAlign: 'center', gap: '8px',
                    }}>
                        <Terminal size={20} />
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: "'Outfit', sans-serif" }}>
                            Run code to see output
                        </span>
                    </div>
                )}

                {isRunning && !output && (
                    <div style={{ color: '#fbbf24' }}>
                        <span style={{ opacity: 0.5 }}>$ </span>Executing...
                    </div>
                )}

                {/* Stdout */}
                {hasOutput && (
                    <pre style={{
                        margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        color: '#e4e4e7',
                    }}>
                        {output.stdout}
                    </pre>
                )}

                {/* Stderr */}
                {hasError && (
                    <pre style={{
                        margin: hasOutput ? '8px 0 0 0' : 0,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        color: '#ef4444', padding: '8px', borderRadius: '8px',
                        background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)',
                    }}>
                        {output.stderr}
                    </pre>
                )}

                {/* Timed out warning */}
                {output?.timed_out && (
                    <div style={{
                        marginTop: '8px', padding: '8px 12px', borderRadius: '8px',
                        background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)',
                        color: '#fbbf24', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                        <AlertTriangle size={12} />
                        <span>Execution timed out — code ran for too long</span>
                    </div>
                )}
            </div>
        </div>
    );
}
