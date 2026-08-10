/**
 * Polaris Lab — Interactive Code IDE & Practice Sandbox
 * 
 * A full split-pane IDE with:
 * - Embedded YouTube video player (from study plan chapters)
 * - Monaco code editor with multi-language support
 * - Terminal output panel with execution results
 * - Multi-file tab system
 * - Chapter-linked lab sessions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Code2, Play, BookOpen, Beaker, ChevronDown,
    PanelLeftClose, PanelLeftOpen, RotateCcw,
    Sparkles, Loader2, CheckCircle2, XCircle,
    ListChecks, ChevronRight, Send, Eye, Lightbulb
} from 'lucide-react';
import { ai } from '../api';
import CodeEditor from '../components/lab/CodeEditor';
import OutputPanel from '../components/lab/OutputPanel';
import VideoPlayer from '../components/lab/VideoPlayer';
import FileExplorer from '../components/lab/FileExplorer';

// ── API helpers for Lab ─────────────────────────────────────
const API_BASE = 'http://localhost:8000/api';

async function executeCodeOnServer(code, language) {
    const token = localStorage.getItem('polaris_token');
    const res = await fetch(`${API_BASE}/lab/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code, language }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Execution failed' }));
        throw new Error(err.detail || 'Execution failed');
    }
    return res.json();
}

async function fetchChapterTasks(planId, chapterNum) {
    const token = localStorage.getItem('polaris_token');
    const res = await fetch(`${API_BASE}/lab/tasks/${planId}/${chapterNum}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    return res.json();
}

async function submitCodeForVerification(taskId, code, language) {
    const token = localStorage.getItem('polaris_token');
    const res = await fetch(`${API_BASE}/lab/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ task_id: taskId, code, language }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Submission failed' }));
        throw new Error(err.detail || 'Submission failed');
    }
    return res.json();
}

function executeJavaScriptInBrowser(code) {
    const logs = [];
    const errors = [];
    const startTime = performance.now();

    // Create sandboxed console
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

// ── Default code templates ──────────────────────────────────
const DEFAULT_CODE = {
    python: `# Polaris Lab — Python Sandbox
# Write your code here and press Run (or Ctrl+Enter)

def greet(name):
    return f"Hello, {name}! Welcome to Polaris Lab."

print(greet("Developer"))
print()

# Try some data structures
skills = ["Python", "JavaScript", "React", "FastAPI"]
for i, skill in enumerate(skills, 1):
    print(f"  {i}. {skill}")
`,
    javascript: `// Polaris Lab — JavaScript Sandbox
// Write your code here and press Run (or Ctrl+Enter)

function greet(name) {
  return \`Hello, \${name}! Welcome to Polaris Lab.\`;
}

console.log(greet("Developer"));
console.log();

// Try some data structures
const skills = ["Python", "JavaScript", "React", "FastAPI"];
skills.forEach((skill, i) => {
  console.log(\`  \${i + 1}. \${skill}\`);
});
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
    h1 {
      font-size: 1.5rem; letter-spacing: 0.3em;
      text-transform: uppercase; margin-bottom: 12px;
    }
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

let fileCounter = 1;

// ── Main Lab Page ───────────────────────────────────────────
export default function LabPage() {
    const [searchParams] = useSearchParams();
    const planId = searchParams.get('plan');
    const chapterNum = searchParams.get('chapter');

    // File system state
    const [files, setFiles] = useState([
        { id: 'file-0', name: 'main.py', language: 'python', code: DEFAULT_CODE.python },
    ]);
    const [activeFileId, setActiveFileId] = useState('file-0');

    // Execution state
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    // Layout state
    const [videoMinimized, setVideoMinimized] = useState(false);
    const [videoPanelOpen, setVideoPanelOpen] = useState(true);
    const [outputHeight, setOutputHeight] = useState(200);

    // Chapter context
    const [chapterInfo, setChapterInfo] = useState(null);
    const [loadingChapter, setLoadingChapter] = useState(false);

    // HTML preview
    const [htmlPreview, setHtmlPreview] = useState('');
    const iframeRef = useRef(null);

    // Coding tasks state
    const [tasks, setTasks] = useState([]);
    const [activeTask, setActiveTask] = useState(null);
    const [tasksPanelOpen, setTasksPanelOpen] = useState(false);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [showHints, setShowHints] = useState(false);

    const activeFile = files.find(f => f.id === activeFileId) || files[0];

    // ── Load chapter context if plan/chapter params are present ──
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

    // ── Load coding tasks for this chapter ────────────────────
    useEffect(() => {
        if (!planId || !chapterNum) return;
        async function loadTasks() {
            setLoadingTasks(true);
            try {
                const taskList = await fetchChapterTasks(planId, chapterNum);
                setTasks(taskList);
                if (taskList.length > 0) {
                    setTasksPanelOpen(true);
                }
            } catch (err) {
                console.error('Failed to load tasks:', err);
            } finally {
                setLoadingTasks(false);
            }
        }
        loadTasks();
    }, [planId, chapterNum]);

    // ── Load task into editor ────────────────────────────────
    const loadTask = useCallback((task) => {
        setActiveTask(task);
        setVerificationResult(null);
        setShowHints(false);
        if (task.starter_code) {
            const ext = task.language === 'python' ? '.py' : '.js';
            const newFile = {
                id: `task-${task.id}`,
                name: `${task.title.toLowerCase().replace(/\s+/g, '_')}${ext}`,
                language: task.language || 'python',
                code: task.starter_code,
            };
            // Add or replace task file
            setFiles(prev => {
                const existing = prev.findIndex(f => f.id === `task-${task.id}`);
                if (existing >= 0) {
                    return prev.map((f, i) => i === existing ? newFile : f);
                }
                return [...prev, newFile];
            });
            setActiveFileId(`task-${task.id}`);
        }
    }, []);

    // ── Submit code for verification ─────────────────────────
    const handleSubmit = useCallback(async () => {
        if (!activeTask || !activeFile || submitting) return;
        setSubmitting(true);
        setVerificationResult(null);
        try {
            const result = await submitCodeForVerification(
                activeTask.id, activeFile.code, activeFile.language
            );
            setVerificationResult(result);
        } catch (err) {
            setVerificationResult({
                passed: false, score: 0, total_tests: 0, passed_tests: 0,
                feedback: err.message || 'Submission failed',
                failed_tests: [],
            });
        } finally {
            setSubmitting(false);
        }
    }, [activeTask, activeFile, submitting]);

    // ── File management ─────────────────────────────────────
    const handleAddFile = useCallback((language) => {
        const ext = language === 'python' ? '.py' : language === 'javascript' ? '.js' : '.html';
        const newFile = {
            id: `file-${++fileCounter}`,
            name: `untitled${ext}`,
            language,
            code: DEFAULT_CODE[language] || '',
        };
        setFiles(prev => [...prev, newFile]);
        setActiveFileId(newFile.id);
    }, []);

    const handleRemoveFile = useCallback((fileId) => {
        setFiles(prev => {
            const remaining = prev.filter(f => f.id !== fileId);
            if (remaining.length === 0) return prev;
            if (activeFileId === fileId) {
                setActiveFileId(remaining[remaining.length - 1].id);
            }
            return remaining;
        });
    }, [activeFileId]);

    const handleCodeChange = useCallback((newCode) => {
        setFiles(prev => prev.map(f =>
            f.id === activeFileId ? { ...f, code: newCode } : f
        ));

        // Update HTML preview if editing HTML
        if (activeFile?.language === 'html') {
            setHtmlPreview(newCode);
        }
    }, [activeFileId, activeFile]);

    // ── Code execution ──────────────────────────────────────
    const handleRun = useCallback(async () => {
        if (!activeFile || isRunning) return;

        const { code, language } = activeFile;
        setIsRunning(true);
        setOutput(null);

        try {
            if (language === 'html') {
                // HTML = live preview in iframe
                setHtmlPreview(code);
                setOutput({
                    stdout: 'HTML preview updated.',
                    stderr: '',
                    exit_code: 0,
                    execution_time_ms: 0,
                    timed_out: false,
                    language: 'html',
                });
            } else if (language === 'javascript') {
                // JS runs in-browser
                const result = executeJavaScriptInBrowser(code);
                setOutput(result);
            } else {
                // Python runs on server
                const result = await executeCodeOnServer(code, language);
                setOutput(result);
            }
        } catch (err) {
            setOutput({
                stdout: '',
                stderr: err.message || 'Execution failed',
                exit_code: 1,
                execution_time_ms: 0,
                timed_out: false,
                language,
            });
        } finally {
            setIsRunning(false);
        }
    }, [activeFile, isRunning]);

    // ── Keyboard shortcut: Ctrl+Enter to run ────────────────
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

    // ── Save to localStorage ────────────────────────────────
    useEffect(() => {
        const key = planId && chapterNum ? `polaris_lab_${planId}_${chapterNum}` : 'polaris_lab_scratch';
        try {
            localStorage.setItem(key, JSON.stringify(files));
        } catch { /* quota exceeded */ }
    }, [files, planId, chapterNum]);

    // ── Restore from localStorage ───────────────────────────
    useEffect(() => {
        const key = planId && chapterNum ? `polaris_lab_${planId}_${chapterNum}` : 'polaris_lab_scratch';
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setFiles(parsed);
                    setActiveFileId(parsed[0].id);
                }
            }
        } catch { /* parse error */ }
    }, [planId, chapterNum]);

    // ── Resize handler for output panel ─────────────────────
    const handleOutputResize = useCallback((e) => {
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
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [outputHeight]);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)',
            background: '#000', fontFamily: "'Outfit', sans-serif",
        }}>
            {/* ── Top Bar ──────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: '#000', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Beaker size={14} style={{ color: '#a78bfa' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', letterSpacing: '0.05em' }}>
                            Polaris Lab
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#3f3f46' }}>
                            {chapterInfo ? `Chapter ${chapterInfo.chapter_number} — ${chapterInfo.title}` : 'Scratch Pad'}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Toggle video panel */}
                    <button
                        onClick={() => setVideoPanelOpen(!videoPanelOpen)}
                        title={videoPanelOpen ? 'Hide video panel' : 'Show video panel'}
                        style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#71717a',
                            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                            fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                        }}
                    >
                        {videoPanelOpen ? <PanelLeftClose size={12} /> : <PanelLeftOpen size={12} />}
                        Video
                    </button>

                    {/* Reset */}
                    <button
                        onClick={() => {
                            if (confirm('Reset all files to default code?')) {
                                setFiles([
                                    { id: 'file-0', name: 'main.py', language: 'python', code: DEFAULT_CODE.python },
                                ]);
                                setActiveFileId('file-0');
                                setOutput(null);
                            }
                        }}
                        title="Reset lab"
                        style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#71717a',
                            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                            fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                        }}
                    >
                        <RotateCcw size={12} />
                        Reset
                    </button>
                </div>
            </div>

            {/* ── Main Content Area ────────────────────────── */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Panel — Video */}
                {videoPanelOpen && (
                    <div style={{
                        width: videoMinimized ? 'auto' : '40%', minWidth: videoMinimized ? 0 : '300px',
                        maxWidth: '50%', borderRight: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', flexDirection: 'column',
                        padding: videoMinimized ? '8px' : '8px',
                        transition: 'width 0.3s ease',
                    }}>
                        <VideoPlayer
                            url={chapterInfo?.youtube_url}
                            title={chapterInfo?.title}
                            onMinimize={() => setVideoMinimized(!videoMinimized)}
                            isMinimized={videoMinimized}
                        />
                    </div>
                )}

                {/* Tasks Panel — shows coding challenges */}
                {tasksPanelOpen && tasks.length > 0 && (
                    <div style={{
                        width: '260px', minWidth: '220px',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', flexDirection: 'column',
                        background: '#030303', overflow: 'hidden',
                    }}>
                        {/* Tasks Header */}
                        <div style={{
                            padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ListChecks size={12} style={{ color: '#a78bfa' }} />
                                <span style={{
                                    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                                    letterSpacing: '0.15em', color: '#71717a',
                                }}>Tasks ({tasks.length})</span>
                            </div>
                            <button
                                onClick={() => setTasksPanelOpen(false)}
                                style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    color: '#3f3f46', padding: '2px',
                                }}
                            >
                                <PanelLeftClose size={12} />
                            </button>
                        </div>

                        {/* Task List */}
                        <div style={{ flex: 1, overflow: 'auto', padding: '6px' }}>
                            {tasks.map((task, idx) => (
                                <button
                                    key={task.id}
                                    onClick={() => loadTask(task)}
                                    style={{
                                        width: '100%', textAlign: 'left', padding: '10px',
                                        borderRadius: '10px', cursor: 'pointer', marginBottom: '4px',
                                        background: activeTask?.id === task.id ? 'rgba(167,139,250,0.08)' : 'transparent',
                                        border: `1px solid ${activeTask?.id === task.id ? 'rgba(167,139,250,0.2)' : 'transparent'}`,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        {task.solved ? (
                                            <CheckCircle2 size={11} style={{ color: '#22c55e', flexShrink: 0 }} />
                                        ) : (
                                            <div style={{
                                                width: '11px', height: '11px', borderRadius: '50%',
                                                border: '1.5px solid #27272a', flexShrink: 0,
                                            }} />
                                        )}
                                        <span style={{
                                            fontSize: '10px', fontWeight: 600, color: '#d4d4d8',
                                            lineHeight: '1.3',
                                        }}>{task.title}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '17px' }}>
                                        <span style={{
                                            fontSize: '8px', fontWeight: 700, textTransform: 'uppercase',
                                            letterSpacing: '0.1em', padding: '2px 6px', borderRadius: '4px',
                                            background: task.difficulty === 'easy' ? 'rgba(34,197,94,0.1)'
                                                : task.difficulty === 'hard' ? 'rgba(239,68,68,0.1)'
                                                : 'rgba(251,191,36,0.1)',
                                            color: task.difficulty === 'easy' ? '#22c55e'
                                                : task.difficulty === 'hard' ? '#ef4444'
                                                : '#fbbf24',
                                        }}>{task.difficulty}</span>
                                        <span style={{
                                            fontSize: '8px', color: '#3f3f46', fontWeight: 600,
                                        }}>{task.test_count} tests</span>
                                        {task.best_score != null && (
                                            <span style={{
                                                fontSize: '8px', fontWeight: 700,
                                                color: task.best_score >= 80 ? '#22c55e' : '#fbbf24',
                                            }}>{task.best_score}%</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Active task description */}
                        {activeTask && (
                            <div style={{
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                padding: '10px 12px', maxHeight: '200px', overflow: 'auto',
                            }}>
                                <div style={{
                                    fontSize: '10px', fontWeight: 600, color: '#a78bfa',
                                    marginBottom: '6px', textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                }}>Description</div>
                                <p style={{
                                    fontSize: '10px', color: '#71717a', lineHeight: '1.6',
                                    margin: 0,
                                }}>{activeTask.description}</p>

                                {/* Hints toggle */}
                                {activeTask.hints?.length > 0 && (
                                    <div style={{ marginTop: '8px' }}>
                                        <button
                                            onClick={() => setShowHints(!showHints)}
                                            style={{
                                                background: 'transparent', border: 'none', cursor: 'pointer',
                                                fontSize: '9px', fontWeight: 700, color: '#fbbf24',
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                padding: 0, textTransform: 'uppercase', letterSpacing: '0.1em',
                                            }}
                                        >
                                            <Lightbulb size={10} />
                                            {showHints ? 'Hide Hints' : 'Show Hints'}
                                        </button>
                                        {showHints && (
                                            <ul style={{
                                                margin: '6px 0 0 0', padding: '0 0 0 14px',
                                                listStyle: 'disc',
                                            }}>
                                                {activeTask.hints.map((hint, i) => (
                                                    <li key={i} style={{
                                                        fontSize: '9px', color: '#71717a', lineHeight: '1.5',
                                                        marginBottom: '3px',
                                                    }}>{hint}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Right Panel — Editor + Output */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* File Tabs */}
                    <FileExplorer
                        files={files}
                        activeFileId={activeFileId}
                        onSelectFile={setActiveFileId}
                        onAddFile={handleAddFile}
                        onRemoveFile={handleRemoveFile}
                    />

                    {/* Editor */}
                    <div style={{ flex: 1, minHeight: 0 }}>
                        {activeFile?.language === 'html' && htmlPreview ? (
                            <div style={{ display: 'flex', height: '100%' }}>
                                {/* Code side */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <CodeEditor
                                        code={activeFile.code}
                                        language={activeFile.language}
                                        onChange={handleCodeChange}
                                        onRun={handleRun}
                                        isRunning={isRunning}
                                    />
                                </div>
                                {/* Live preview side */}
                                <div style={{
                                    flex: 1, minWidth: 0,
                                    borderLeft: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <div style={{
                                        padding: '6px 12px', background: '#030303',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                        letterSpacing: '0.15em', color: '#71717a',
                                    }}>
                                        Live Preview
                                    </div>
                                    <iframe
                                        ref={iframeRef}
                                        srcDoc={htmlPreview}
                                        title="HTML Preview"
                                        style={{
                                            width: '100%', height: 'calc(100% - 32px)',
                                            border: 'none', background: '#fff',
                                        }}
                                        sandbox="allow-scripts"
                                    />
                                </div>
                            </div>
                        ) : (
                            <CodeEditor
                                code={activeFile?.code || ''}
                                language={activeFile?.language || 'python'}
                                onChange={handleCodeChange}
                                onRun={handleRun}
                                isRunning={isRunning}
                            />
                        )}
                    </div>

                    {/* Resize Handle */}
                    <div
                        onMouseDown={handleOutputResize}
                        style={{
                            height: '4px', cursor: 'row-resize',
                            background: 'rgba(255,255,255,0.03)',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                    />

                    {/* Output Panel */}
                    <div style={{ height: `${outputHeight}px`, flexShrink: 0 }}>
                        <OutputPanel
                            output={output}
                            isRunning={isRunning}
                            onClear={() => setOutput(null)}
                        />

                        {/* Verification Results (overlays output when present) */}
                        {verificationResult && (
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.08)',
                                padding: '12px 16px', maxHeight: '220px', overflow: 'auto',
                                zIndex: 10,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {verificationResult.passed ? (
                                            <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                                        ) : (
                                            <XCircle size={16} style={{ color: '#ef4444' }} />
                                        )}
                                        <span style={{
                                            fontSize: '12px', fontWeight: 700,
                                            color: verificationResult.passed ? '#22c55e' : '#ef4444',
                                        }}>
                                            {verificationResult.passed ? 'All Tests Passed!' : `${verificationResult.passed_tests}/${verificationResult.total_tests} Tests Passed`}
                                        </span>
                                        <span style={{
                                            fontSize: '10px', fontWeight: 700,
                                            padding: '2px 8px', borderRadius: '6px',
                                            background: verificationResult.score >= 80 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: verificationResult.score >= 80 ? '#22c55e' : '#ef4444',
                                        }}>Score: {verificationResult.score}%</span>
                                    </div>
                                    <button
                                        onClick={() => setVerificationResult(null)}
                                        style={{
                                            background: 'transparent', border: 'none', cursor: 'pointer',
                                            color: '#3f3f46', fontSize: '8px', fontWeight: 700,
                                            textTransform: 'uppercase', letterSpacing: '0.1em',
                                        }}
                                    >Dismiss</button>
                                </div>

                                {/* Feedback */}
                                <pre style={{
                                    fontSize: '10px', color: '#a1a1aa', lineHeight: '1.6',
                                    margin: '0 0 8px 0', whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', monospace",
                                }}>{verificationResult.feedback}</pre>

                                {/* AI Review */}
                                {verificationResult.ai_review && (
                                    <div style={{
                                        padding: '8px 10px', borderRadius: '8px',
                                        background: 'rgba(167,139,250,0.05)',
                                        border: '1px solid rgba(167,139,250,0.15)',
                                    }}>
                                        <div style={{
                                            fontSize: '8px', fontWeight: 700, color: '#a78bfa',
                                            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px',
                                        }}>AI Review</div>
                                        <p style={{
                                            fontSize: '10px', color: '#71717a', lineHeight: '1.5', margin: 0,
                                        }}>{verificationResult.ai_review}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit bar (when a task is active) */}
                    {activeTask && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)',
                            background: '#030303', flexShrink: 0,
                        }}>
                            <span style={{
                                fontSize: '9px', fontWeight: 600, color: '#3f3f46',
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                            }}>
                                {activeTask.title}
                            </span>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 16px', borderRadius: '8px', cursor: submitting ? 'wait' : 'pointer',
                                    background: submitting ? 'rgba(167,139,250,0.2)' : '#a78bfa',
                                    border: 'none', color: '#000',
                                    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                                    letterSpacing: '0.1em', transition: 'all 0.2s',
                                }}
                            >
                                {submitting ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={11} />}
                                {submitting ? 'Verifying...' : 'Submit & Verify'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
