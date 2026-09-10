/**
 * Polaris Lab — Output Panel (LeetCode-style)
 * Shows Testcase input, Test Results, and Console output in a tabbed interface.
 */

import { useState } from 'react';
import {
    Terminal, CheckCircle2, XCircle, Clock, Trash2,
    AlertTriangle, Loader2
} from 'lucide-react';

const TAB_STYLE = (isActive) => ({
    padding: '6px 14px', fontSize: '11px', fontWeight: 600,
    border: 'none', cursor: 'pointer', borderRadius: '6px',
    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: isActive ? '#fff' : '#71717a',
    fontFamily: "'Outfit', sans-serif",
    transition: 'all 0.15s', letterSpacing: '0.03em',
});

export default function OutputPanel({
    output,
    isRunning,
    onClear,
    verificationResult,
    activeTestCaseIdx = 0,
    onTestCaseSelect,
    sampleTestCases = [],
    customInput = '',
    onCustomInputChange,
}) {
    const [activeTab, setActiveTab] = useState('testcase'); // testcase | result | console

    // Auto-switch to result tab when verification result arrives
    if (verificationResult && activeTab === 'testcase') {
        // We'll handle this via effect in parent, but also show result when available
    }

    const statusColors = {
        'Accepted': { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', text: '#4ade80' },
        'Wrong Answer': { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#f87171' },
        'Time Limit Exceeded': { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', text: '#fcd34d' },
        'Compilation Error': { bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)', text: '#fb923c' },
        'Runtime Error': { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)', text: '#a855f7' },
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: '#0a0a0a', color: '#e4e4e7', fontFamily: "'Outfit', sans-serif",
        }}>
            {/* Tab Bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '4px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: '#050505', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <button onClick={() => setActiveTab('testcase')} style={TAB_STYLE(activeTab === 'testcase')}>
                        Testcase
                    </button>
                    <button
                        onClick={() => setActiveTab('result')}
                        style={{
                            ...TAB_STYLE(activeTab === 'result'),
                            color: activeTab === 'result'
                                ? (verificationResult?.passed ? '#4ade80' : verificationResult ? '#f87171' : '#fff')
                                : '#71717a',
                        }}
                    >
                        Test Result
                        {verificationResult && (
                            <span style={{ marginLeft: '4px' }}>
                                {verificationResult.passed
                                    ? <CheckCircle2 size={10} style={{ color: '#4ade80', verticalAlign: 'middle' }} />
                                    : <XCircle size={10} style={{ color: '#f87171', verticalAlign: 'middle' }} />
                                }
                            </span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab('console')} style={TAB_STYLE(activeTab === 'console')}>
                        Console
                    </button>
                </div>

                <button
                    onClick={onClear}
                    title="Clear output"
                    style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#3f3f46', padding: '3px', borderRadius: '4px',
                        display: 'flex', alignItems: 'center',
                    }}
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
                {/* ─── Testcase Tab ─── */}
                {activeTab === 'testcase' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {sampleTestCases.length > 0 ? (
                            <>
                                {/* Test case selector pills */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {sampleTestCases.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onTestCaseSelect?.(idx)}
                                            style={{
                                                padding: '4px 12px', borderRadius: '6px', fontSize: '11px',
                                                fontWeight: 600, cursor: 'pointer',
                                                background: activeTestCaseIdx === idx ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                                                color: activeTestCaseIdx === idx ? '#fff' : '#71717a',
                                                border: `1px solid ${activeTestCaseIdx === idx ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            Case {idx + 1}
                                        </button>
                                    ))}
                                </div>

                                {/* Active test case display */}
                                {sampleTestCases[activeTestCaseIdx] && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div>
                                            <div style={{
                                                fontSize: '10px', fontWeight: 700, color: '#71717a',
                                                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px'
                                            }}>Input</div>
                                            <div style={{
                                                background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
                                                padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: '13px', color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.06)',
                                                whiteSpace: 'pre-wrap',
                                            }}>
                                                {sampleTestCases[activeTestCaseIdx].input || 'No input'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{
                                                fontSize: '10px', fontWeight: 700, color: '#71717a',
                                                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px'
                                            }}>Expected Output</div>
                                            <div style={{
                                                background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
                                                padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: '13px', color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.06)',
                                                whiteSpace: 'pre-wrap',
                                            }}>
                                                {sampleTestCases[activeTestCaseIdx].expected_output || '—'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ color: '#3f3f46', fontSize: '12px', fontStyle: 'italic' }}>
                                No sample test cases available. Write your code and click Run to test.
                            </div>
                        )}

                        {/* Custom input */}
                        <div>
                            <div style={{
                                fontSize: '10px', fontWeight: 700, color: '#71717a',
                                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px'
                            }}>Custom Test Input (stdin)</div>
                            <textarea
                                value={customInput}
                                onChange={(e) => onCustomInputChange?.(e.target.value)}
                                placeholder="Enter custom input here..."
                                style={{
                                    width: '100%', minHeight: '60px', background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px',
                                    padding: '10px 12px', color: '#e4e4e7', fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '12px', resize: 'vertical', outline: 'none',
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* ─── Test Result Tab ─── */}
                {activeTab === 'result' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {isRunning ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717a', fontSize: '12px' }}>
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                Running test cases...
                            </div>
                        ) : verificationResult ? (
                            <>
                                {/* Status Header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    flexWrap: 'wrap',
                                }}>
                                    <span style={{
                                        fontSize: '16px', fontWeight: 800,
                                        color: statusColors[verificationResult.status]?.text || '#fff',
                                    }}>
                                        {verificationResult.status || (verificationResult.passed ? 'Accepted' : 'Wrong Answer')}
                                    </span>

                                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#71717a' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={11} />
                                            {verificationResult.execution_time_ms?.toFixed(0) || 0} ms
                                        </span>
                                        <span>
                                            {verificationResult.passed_tests}/{verificationResult.total_tests} passed
                                        </span>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                                            background: verificationResult.score >= 80 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                            color: verificationResult.score >= 80 ? '#4ade80' : '#f87171',
                                        }}>
                                            Score: {verificationResult.score}%
                                        </span>
                                    </div>
                                </div>

                                {/* Test case results */}
                                {verificationResult.test_results && verificationResult.test_results.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {/* Test case pills */}
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {verificationResult.test_results.map((tr, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        padding: '3px 10px', borderRadius: '6px', fontSize: '10px',
                                                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px',
                                                        background: tr.passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                                                        color: tr.passed ? '#4ade80' : '#f87171',
                                                        border: `1px solid ${tr.passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                                    }}
                                                >
                                                    {tr.passed ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                    {tr.is_hidden ? `Hidden ${idx + 1}` : `Case ${idx + 1}`}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Detailed results for non-hidden cases */}
                                        {verificationResult.test_results.filter(tr => !tr.is_hidden).map((tr, idx) => (
                                            <div key={idx} style={{
                                                background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
                                                padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)',
                                            }}>
                                                <div style={{
                                                    fontSize: '10px', fontWeight: 700, color: tr.passed ? '#4ade80' : '#f87171',
                                                    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em',
                                                }}>
                                                    {tr.passed ? '✓' : '✗'} Test Case {idx + 1}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                                                    <div>
                                                        <span style={{ color: '#71717a', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Input: </span>
                                                        <span style={{ color: '#a1a1aa' }}>{tr.input_data}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#71717a', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Expected: </span>
                                                        <span style={{ color: '#4ade80' }}>{tr.expected}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#71717a', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Output: </span>
                                                        <span style={{ color: tr.passed ? '#4ade80' : '#f87171', fontWeight: 600 }}>{tr.actual}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Feedback */}
                                {verificationResult.feedback && (
                                    <pre style={{
                                        fontSize: '11px', color: '#a1a1aa', lineHeight: '1.6',
                                        margin: 0, whiteSpace: 'pre-wrap',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        background: 'rgba(255,255,255,0.02)', padding: '10px 12px',
                                        borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)',
                                    }}>{verificationResult.feedback}</pre>
                                )}

                                {/* AI Review */}
                                {verificationResult.ai_review && (
                                    <div style={{
                                        padding: '10px 12px', borderRadius: '8px',
                                        background: 'rgba(167,139,250,0.06)',
                                        border: '1px solid rgba(167,139,250,0.2)',
                                    }}>
                                        <div style={{
                                            fontSize: '9px', fontWeight: 800, color: '#c084fc',
                                            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px',
                                        }}>AI Review</div>
                                        <p style={{
                                            fontSize: '11px', color: '#a1a1aa', lineHeight: '1.6', margin: 0,
                                        }}>{verificationResult.ai_review}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ color: '#3f3f46', fontSize: '12px', fontStyle: 'italic' }}>
                                Run or submit your code to see test results.
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Console Tab ─── */}
                {activeTab === 'console' && (
                    <div>
                        {isRunning ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717a', fontSize: '12px' }}>
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                Executing...
                            </div>
                        ) : output ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {output.stdout && (
                                    <div>
                                        <div style={{
                                            fontSize: '10px', fontWeight: 700, color: '#71717a',
                                            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px'
                                        }}>stdout</div>
                                        <pre style={{
                                            margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
                                            color: '#e4e4e7', lineHeight: '1.6', whiteSpace: 'pre-wrap',
                                            background: 'rgba(255,255,255,0.03)', padding: '10px 12px',
                                            borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)',
                                        }}>{output.stdout}</pre>
                                    </div>
                                )}
                                {output.stderr && (
                                    <div>
                                        <div style={{
                                            fontSize: '10px', fontWeight: 700, color: '#f87171',
                                            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px',
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                        }}>
                                            <AlertTriangle size={10} /> stderr
                                        </div>
                                        <pre style={{
                                            margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
                                            color: '#f87171', lineHeight: '1.6', whiteSpace: 'pre-wrap',
                                            background: 'rgba(239,68,68,0.05)', padding: '10px 12px',
                                            borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)',
                                        }}>{output.stderr}</pre>
                                    </div>
                                )}
                                <div style={{
                                    fontSize: '10px', color: '#3f3f46',
                                    display: 'flex', gap: '12px',
                                }}>
                                    <span>Exit: {output.exit_code}</span>
                                    <span>{output.execution_time_ms?.toFixed(1)} ms</span>
                                    {output.timed_out && <span style={{ color: '#fbbf24' }}>⚠ Timed Out</span>}
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#3f3f46', fontSize: '12px', fontStyle: 'italic' }}>
                                Run your code to see console output here.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
