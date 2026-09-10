/**
 * Polaris Lab — LeetCode-Style Interactive Code IDE
 * 
 * Accessible only from Learning page via ?plan=...&chapter=... params.
 * If accessed without params, redirects to /learning.
 *
 * Layout (3-panel):
 *   LEFT top:    Problem statement / description
 *   LEFT bottom: YouTube video (from learning chapter)
 *   RIGHT:       Code editor (top) + Output panel (bottom)
 *
 * Multi-language: Python, C++, Java, JavaScript, HTML/CSS
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import {
    Code2, Play, BookOpen, Beaker, ChevronDown, ChevronUp,
    RotateCcw, Loader2, CheckCircle2, XCircle,
    ChevronRight, Send, Lightbulb,
    ArrowLeft, Clock, History, FileText,
    Youtube
} from 'lucide-react';
import { ai, lab } from '../api';
import CodeEditor from '../components/lab/CodeEditor';
import OutputPanel from '../components/lab/OutputPanel';
import VideoPlayer from '../components/lab/VideoPlayer';

// ── Default code templates per language ─────────────────────
const DEFAULT_CODE = {
    python: `# Write your solution here
def solution():
    pass

# Read input and call your function
`,
    cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}
`,
    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        
    }
}
`,
    javascript: `// Write your solution here
function solution() {
    
}

// Read input and call your function
`,
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000; color: #fff;
      font-family: 'Outfit', system-ui, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px; padding: 40px;
      text-align: center; max-width: 400px;
    }
    h1 { font-size: 1.5rem; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 12px; }
    p { color: #71717a; font-size: 0.85rem; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Polaris Lab</h1>
    <p>Edit this HTML and see live preview changes instantly.</p>
  </div>
</body>
</html>
`,
};

function executeJavaScriptInBrowser(code) {
    const logs = [];
    const errors = [];
    const startTime = performance.now();

    const sandboxConsole = {
        log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        error: (...args) => errors.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        warn: (...args) => logs.push('[warn] ' + args.map(a => String(a)).join(' ')),
        info: (...args) => logs.push('[info] ' + args.map(a => String(a)).join(' ')),
        table: (data) => logs.push(JSON.stringify(data, null, 2)),
        clear: () => { logs.length = 0; },
    };

    try {
        // eslint-disable-next-line no-new-func
        const fn = new Function('console', code);
        fn(sandboxConsole);
    } catch (e) {
        errors.push(e.toString());
    }

    const elapsed = performance.now() - startTime;
    return {
        stdout: logs.join('\n'),
        stderr: errors.join('\n'),
        exit_code: errors.length > 0 ? 1 : 0,
        execution_time_ms: Math.round(elapsed * 100) / 100,
        timed_out: false,
        language: 'javascript',
    };
}

// ── Difficulty badge colors ─────────────────────────────────
const DIFF_COLORS = {
    easy: { text: '#4ade80', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
    medium: { text: '#fcd34d', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
    hard: { text: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
};

// ── Main Lab Page ───────────────────────────────────────────
export default function LabPage() {
    const [searchParams] = useSearchParams();
    const planId = searchParams.get('plan');
    const chapterNum = searchParams.get('chapter');

    // ── REDIRECT: if no plan/chapter, go to Learning page ───
    if (!planId || !chapterNum) {
        return <Navigate to="/learning" replace />;
    }

    return <LabContent planId={planId} chapterNum={chapterNum} searchParams={searchParams} />;
}

// Separated so the Navigate doesn't interfere with hooks
function LabContent({ planId, chapterNum, searchParams }) {
    // Code state
    const [code, setCode] = useState(DEFAULT_CODE.python);
    const [language, setLanguage] = useState('python');

    // Execution state
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    // Chapter context
    const [chapterInfo, setChapterInfo] = useState(null);
    const [loadingChapter, setLoadingChapter] = useState(false);

    // Coding tasks state
    const [tasks, setTasks] = useState([]);
    const [activeTask, setActiveTask] = useState(null);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [showHints, setShowHints] = useState(false);

    // Layout state
    const [leftPanelWidth, setLeftPanelWidth] = useState(42); // percentage
    const [outputHeight, setOutputHeight] = useState(260);
    const [problemTab, setProblemTab] = useState('description');
    const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);
    const [customInput, setCustomInput] = useState('');
    const [videoCollapsed, setVideoCollapsed] = useState(false);

    // HTML preview
    const [htmlPreview, setHtmlPreview] = useState('');
    const iframeRef = useRef(null);

    // ── Load chapter context ────────────────────────────────
    useEffect(() => {
        if (!planId) return;
        async function loadChapter() {
            setLoadingChapter(true);
            try {
                const progress = await ai.getStudyPlanProgress(planId);
                if (progress && chapterNum) {
                    const chapter = progress.chapters?.find(c => c.chapter_index === parseInt(chapterNum));
                    if (chapter) {
                        setChapterInfo({
                            title: chapter.youtube_title || `Chapter ${chapterNum}`,
                            youtube_url: chapter.youtube_url,
                            chapter_number: parseInt(chapterNum),
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to load chapter:', err);
            } finally {
                setLoadingChapter(false);
            }
        }
        loadChapter();
    }, [planId, chapterNum]);

    // ── Load task into editor ───────────────────────────────
    const loadTask = useCallback((task) => {
        setActiveTask(task);
        setVerificationResult(null);
        setShowHints(false);
        setActiveTestCaseIdx(0);
        if (task.starter_code) {
            setCode(task.starter_code);
            setLanguage(task.language || 'python');
        }
    }, []);

    // ── Load coding tasks ───────────────────────────────────
    useEffect(() => {
        if (!planId || !chapterNum) return;
        async function loadTasks() {
            setLoadingTasks(true);
            try {
                const taskList = await lab.getChapterTasks(planId, parseInt(chapterNum));
                setTasks(taskList || []);
                if (taskList && taskList.length > 0) {
                    const taskId = searchParams.get('taskId');
                    const target = taskId ? taskList.find(t => t.id === taskId) : taskList[0];
                    if (target) loadTask(target);
                }
            } catch (err) {
                console.error('Failed to load tasks:', err);
            } finally {
                setLoadingTasks(false);
            }
        }
        loadTasks();
    }, [planId, chapterNum, searchParams, loadTask]);

    // ── Handle language change ──────────────────────────────
    const handleLanguageChange = useCallback((newLang) => {
        setLanguage(newLang);
        if (!activeTask || !activeTask.starter_code) {
            setCode(DEFAULT_CODE[newLang] || '');
        }
    }, [activeTask]);

    // ── Code execution ──────────────────────────────────────
    const handleRun = useCallback(async () => {
        if (isRunning) return;
        setIsRunning(true);
        setOutput(null);

        try {
            if (language === 'html') {
                setHtmlPreview(code);
                setOutput({ stdout: 'HTML preview updated.', stderr: '', exit_code: 0, execution_time_ms: 0, timed_out: false, language: 'html' });
            } else if (language === 'javascript') {
                const result = executeJavaScriptInBrowser(code);
                setOutput(result);
            } else {
                const result = await lab.execute(code, language);
                setOutput(result);
            }
        } catch (err) {
            setOutput({ stdout: '', stderr: err.message || 'Execution failed', exit_code: 1, execution_time_ms: 0, timed_out: false, language });
        } finally {
            setIsRunning(false);
        }
    }, [code, language, isRunning]);

    // ── Submit code for verification ────────────────────────
    const handleSubmit = useCallback(async () => {
        if (!activeTask || submitting) return;
        setSubmitting(true);
        setVerificationResult(null);
        try {
            const result = await lab.submit(activeTask.id, code, language);
            setVerificationResult(result);
            if (result) {
                setTasks(prev => prev.map(t => t.id === activeTask.id ? {
                    ...t,
                    solved: result.passed || t.solved,
                    best_score: Math.max(t.best_score || 0, result.score || 0)
                } : t));
            }
        } catch (err) {
            setVerificationResult({
                passed: false, score: 0, total_tests: 0, passed_tests: 0,
                feedback: err.message || 'Submission failed',
                failed_tests: [], test_results: [], status: 'Runtime Error',
            });
        } finally {
            setSubmitting(false);
        }
    }, [activeTask, code, language, submitting]);

    // ── Keyboard shortcut ───────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleRun();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleRun]);

    // ── Persist code ────────────────────────────────────────
    useEffect(() => {
        const key = `polaris_lab_${planId}_${chapterNum}_${activeTask?.id || 'scratch'}`;
        try { localStorage.setItem(key, JSON.stringify({ code, language })); } catch {}
    }, [code, language, planId, chapterNum, activeTask]);

    useEffect(() => {
        const key = `polaris_lab_${planId}_${chapterNum}_${activeTask?.id || 'scratch'}`;
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.code) setCode(parsed.code);
                if (parsed.language) setLanguage(parsed.language);
            }
        } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planId, chapterNum]);

    // ── Resize handlers ─────────────────────────────────────
    const handleHorizontalResize = useCallback((e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = leftPanelWidth;
        const containerWidth = document.body.clientWidth;
        const onMouseMove = (e) => {
            const delta = ((e.clientX - startX) / containerWidth) * 100;
            setLeftPanelWidth(Math.max(25, Math.min(60, startWidth + delta)));
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [leftPanelWidth]);

    const handleVerticalResize = useCallback((e) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = outputHeight;
        const onMouseMove = (e) => {
            const delta = startY - e.clientY;
            setOutputHeight(Math.max(100, Math.min(500, startHeight + delta)));
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [outputHeight]);

    const sampleCases = activeTask?.sample_test_cases || activeTask?.test_cases || [];
    const diffColor = DIFF_COLORS[activeTask?.difficulty] || DIFF_COLORS.easy;

    return (
        <div className="font-outfit" style={{
            display: 'flex', flexDirection: 'column',
            height: 'calc(100vh - 56px)',
            background: '#000', color: '#fff', overflow: 'hidden',
        }}>
            {/* ── Top Bar ──────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: '#000', flexShrink: 0,
            }}>
                {/* Left: Back + Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link
                        to="/learning"
                        className="text-zinc-500 hover:text-white transition-all"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            fontSize: '10px', fontWeight: 600, textDecoration: 'none',
                            padding: '5px 12px', borderRadius: '20px',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        }}
                    >
                        <ArrowLeft size={11} /> Learning
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                            <Beaker size={14} className="text-white" />
                        </div>
                        <div>
                            <div className="text-[13px] font-semibold tracking-wide text-white">Polaris Lab</div>
                            <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em]">
                                Day {chapterInfo?.chapter_number || chapterNum} • {chapterInfo?.title || 'Loading...'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Problem pills */}
                {tasks.length > 1 && (
                    <div className="flex bg-white/5 p-1 rounded-full border border-white/5">
                        {tasks.map((t, idx) => (
                            <button
                                key={t.id}
                                onClick={() => loadTask(t)}
                                className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                                    activeTask?.id === t.id
                                        ? 'bg-white text-black shadow-xl'
                                        : 'text-zinc-500 hover:text-white'
                                }`}
                            >
                                {t.solved && <CheckCircle2 size={9} />}
                                Q{idx + 1}
                            </button>
                        ))}
                    </div>
                )}

                {/* Right: Reset */}
                <button
                    onClick={() => {
                        setCode(activeTask?.starter_code || DEFAULT_CODE[language] || '');
                        setOutput(null);
                        setVerificationResult(null);
                    }}
                    className="text-zinc-500 hover:text-white transition-all"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 600,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer',
                    }}
                >
                    <RotateCcw size={10} /> Reset Code
                </button>
            </div>

            {/* ── Main Workspace ───────────────────────────────── */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* ══════════════ LEFT PANEL ══════════════ */}
                <div style={{
                    width: `${leftPanelWidth}%`, display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.05)',
                }}>
                    {/* ── TOP: Problem Description ─────────────── */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {/* Problem Tabs */}
                        <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5">
                            <button
                                onClick={() => setProblemTab('description')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-[0.08em] transition-all flex items-center gap-1.5 ${
                                    problemTab === 'description' ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                            >
                                <FileText size={11} /> Description
                            </button>
                            <button
                                onClick={() => setProblemTab('submissions')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-[0.08em] transition-all flex items-center gap-1.5 ${
                                    problemTab === 'submissions' ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                            >
                                <History size={11} /> Submissions
                            </button>
                        </div>

                        {/* Problem Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                            {problemTab === 'description' ? (
                                activeTask ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {/* Title + Badges */}
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                <span className="text-[9px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-md" style={{
                                                    background: diffColor.bg, color: diffColor.text, border: `1px solid ${diffColor.border}`,
                                                }}>
                                                    {activeTask.difficulty}
                                                </span>
                                                {activeTask.solved && (
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-md flex items-center gap-1"
                                                        style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                                                        <CheckCircle2 size={9} /> Solved
                                                    </span>
                                                )}
                                                {activeTask.best_score != null && activeTask.best_score > 0 && (
                                                    <span className="text-[9px] font-medium text-zinc-500 bg-white/5 px-2.5 py-1 rounded-md">
                                                        Best: {activeTask.best_score}%
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-lg font-semibold text-white leading-snug">{activeTask.title}</h2>
                                        </div>

                                        {/* Problem Description */}
                                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                                            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-2">Problem Statement</div>
                                            <div className="text-[13px] text-zinc-300 leading-[1.8] whitespace-pre-wrap">
                                                {activeTask.description}
                                            </div>
                                        </div>

                                        {/* Sample Test Cases */}
                                        {sampleCases.length > 0 && (
                                            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3 flex items-center justify-between">
                                                    <span>Examples</span>
                                                    <span className="text-zinc-600 bg-white/5 px-2 py-0.5 rounded text-[8px]">{sampleCases.length} sample + 2 hidden</span>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {sampleCases.map((tc, idx) => (
                                                        <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-3 font-mono text-[12px]">
                                                            <div className="text-[9px] font-bold text-zinc-600 mb-2 uppercase tracking-wider">Example {idx + 1}</div>
                                                            <div className="mb-1">
                                                                <span className="text-zinc-600 text-[10px] font-semibold">Input: </span>
                                                                <span className="text-zinc-300">{tc.input}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-zinc-600 text-[10px] font-semibold">Output: </span>
                                                                <span className="text-emerald-400">{tc.expected_output}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="text-[10px] text-zinc-600 flex items-center gap-1.5 mt-1">
                                                        🔒 2 Hidden test cases evaluated on Submit
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Hints */}
                                        {activeTask.hints && activeTask.hints.length > 0 && (
                                            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
                                                <button
                                                    onClick={() => setShowHints(!showHints)}
                                                    className="w-full flex items-center justify-between px-4 py-3 text-zinc-400 hover:text-white transition-all"
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <Lightbulb size={12} /> Hints ({activeTask.hints.length})
                                                    </div>
                                                    {showHints ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                </button>
                                                {showHints && (
                                                    <div className="px-4 pb-3">
                                                        <ul className="list-disc pl-4 space-y-1">
                                                            {activeTask.hints.map((hint, i) => (
                                                                <li key={i} className="text-[12px] text-zinc-400 leading-relaxed">{hint}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* I/O note for compiled languages */}
                                        {(language === 'cpp' || language === 'java') && (
                                            <div className="bg-indigo-950/30 border border-indigo-900/30 rounded-xl p-3 text-[11px] text-indigo-300 leading-relaxed">
                                                <strong>💡 {language === 'cpp' ? 'C++' : 'Java'} I/O:</strong> Read from{' '}
                                                <code className="text-emerald-400">{language === 'cpp' ? 'cin' : 'Scanner'}</code> and print to{' '}
                                                <code className="text-emerald-400">{language === 'cpp' ? 'cout' : 'System.out'}</code>. Test cases use stdin.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-zinc-600">
                                        <Code2 size={28} className="mx-auto mb-3 opacity-30" />
                                        <div className="text-[13px] font-medium text-zinc-500 mb-1">
                                            {loadingTasks ? 'Loading problems...' : 'No Problem Selected'}
                                        </div>
                                        <div className="text-[11px]">Select a problem from the top bar.</div>
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-16 text-zinc-600">
                                    <History size={22} className="mx-auto mb-2 opacity-30" />
                                    <div className="text-[12px]">Submission history coming soon.</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── BOTTOM: Video Player ─────────────────── */}
                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        flexShrink: 0,
                    }}>
                        {/* Collapse toggle */}
                        <button
                            onClick={() => setVideoCollapsed(!videoCollapsed)}
                            className="w-full flex items-center justify-between px-4 py-2 text-zinc-500 hover:text-white transition-all"
                            style={{ background: 'rgba(255,255,255,0.02)', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}
                        >
                            <div className="flex items-center gap-2">
                                <Youtube size={12} /> Lecture Video
                            </div>
                            {videoCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {!videoCollapsed && (
                            <div style={{ height: '240px', background: '#000' }}>
                                {chapterInfo?.youtube_url ? (
                                    <VideoPlayer
                                        url={chapterInfo.youtube_url}
                                        title={chapterInfo.title}
                                        onMinimize={() => setVideoCollapsed(true)}
                                        isMinimized={false}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-zinc-700 text-[11px]">
                                        <div className="text-center">
                                            <Youtube size={24} className="mx-auto mb-2 opacity-30" />
                                            <div>No video available for this chapter</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Horizontal Resize Handle ─────────────────── */}
                <div
                    onMouseDown={handleHorizontalResize}
                    style={{
                        width: '4px', cursor: 'col-resize', background: 'transparent',
                        transition: 'background 0.15s', flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                />

                {/* ══════════════ RIGHT PANEL ══════════════ */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                    {/* Code Editor */}
                    <div style={{ flex: 1, minHeight: 0 }}>
                        {language === 'html' && htmlPreview ? (
                            <div style={{ display: 'flex', height: '100%' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <CodeEditor
                                        code={code} language={language} onChange={setCode}
                                        onRun={handleRun} onLanguageChange={handleLanguageChange} isRunning={isRunning}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="px-3 py-1.5 bg-black border-b border-white/5 text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600">
                                        Live Preview
                                    </div>
                                    <iframe ref={iframeRef} srcDoc={htmlPreview} title="HTML Preview"
                                        style={{ width: '100%', height: 'calc(100% - 28px)', border: 'none', background: '#fff' }}
                                        sandbox="allow-scripts"
                                    />
                                </div>
                            </div>
                        ) : (
                            <CodeEditor
                                code={code} language={language} onChange={setCode}
                                onRun={handleRun} onLanguageChange={handleLanguageChange} isRunning={isRunning}
                            />
                        )}
                    </div>

                    {/* Vertical Resize Handle */}
                    <div
                        onMouseDown={handleVerticalResize}
                        style={{ height: '4px', cursor: 'row-resize', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    />

                    {/* Output Panel */}
                    <div style={{ height: `${outputHeight}px`, flexShrink: 0 }}>
                        <OutputPanel
                            output={output}
                            isRunning={isRunning || submitting}
                            onClear={() => { setOutput(null); setVerificationResult(null); }}
                            verificationResult={verificationResult}
                            activeTestCaseIdx={activeTestCaseIdx}
                            onTestCaseSelect={setActiveTestCaseIdx}
                            sampleTestCases={sampleCases}
                            customInput={customInput}
                            onCustomInputChange={setCustomInput}
                        />
                    </div>

                    {/* ── Bottom Action Bar ───────────────────── */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-white/5" style={{ background: '#000', flexShrink: 0 }}>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRun}
                                disabled={isRunning}
                                className="flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.08em] transition-all"
                                style={{
                                    background: isRunning ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
                                    color: '#fff', border: '1px solid rgba(255,255,255,0.12)',
                                    cursor: isRunning ? 'wait' : 'pointer',
                                }}
                            >
                                {isRunning
                                    ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                                    : <Play size={11} fill="currentColor" />
                                }
                                {isRunning ? 'Running...' : 'Run'}
                            </button>
                            <span className="text-[8px] text-zinc-700 uppercase tracking-widest">Ctrl+Enter</span>
                        </div>

                        {activeTask && (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.08em] transition-all shadow-lg"
                                style={{
                                    background: submitting ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                    color: '#fff', border: 'none',
                                    cursor: submitting ? 'wait' : 'pointer',
                                    boxShadow: submitting ? 'none' : '0 0 25px rgba(34,197,94,0.25)',
                                }}
                            >
                                {submitting
                                    ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                                    : <Send size={11} />
                                }
                                {submitting ? 'Judging...' : 'Submit'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
