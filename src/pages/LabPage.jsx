/**
 * Polaris Lab — Interactive Code IDE & Practice Sandbox
 * 
 * A full split-pane IDE with:
 * - Collapsible & resizable YouTube video player
 * - Collapsible & resizable Problem Statement / Tasks panel (with 14px high-contrast readable typography)
 * - Monaco code editor with multi-language support
 * - Resizable Terminal output & automated test verification results
 * - Multi-file tab system
 * - Quick workspace layout switcher (Study, Problem & Code, Zen Mode)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Code2, Play, BookOpen, Beaker, ChevronDown, ChevronUp,
    PanelLeftClose, PanelLeftOpen, RotateCcw,
    Sparkles, Loader2, CheckCircle2, XCircle,
    ListChecks, ChevronRight, Send, Eye, Lightbulb,
    Layout, Maximize2, Minimize2, Terminal as TerminalIcon,
    FileCode, HelpCircle, Columns, Layers, Cpu, ArrowLeft
} from 'lucide-react';
import { ai, lab } from '../api';
import CodeEditor from '../components/lab/CodeEditor';
import OutputPanel from '../components/lab/OutputPanel';
import VideoPlayer from '../components/lab/VideoPlayer';
import FileExplorer from '../components/lab/FileExplorer';

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

    // Layout panels state
    const [videoPanelOpen, setVideoPanelOpen] = useState(true);
    const [tasksPanelOpen, setTasksPanelOpen] = useState(true);
    const [outputPanelOpen, setOutputPanelOpen] = useState(true);
    const [videoMinimized, setVideoMinimized] = useState(false);

    // Resizable dimensions
    const [taskPanelWidth, setTaskPanelWidth] = useState(380); // 380px for readable text
    const [videoWidthPercent, setVideoWidthPercent] = useState(36); // 36% of screen
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
                        // If no video URL assigned yet, collapse video panel to give maximum space to task & editor
                        if (!chapter.youtube_url) {
                            setVideoPanelOpen(false);
                        }
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

    // ── Load coding tasks for this chapter ────────────────────
    useEffect(() => {
        if (!planId || !chapterNum) return;
        async function loadTasks() {
            setLoadingTasks(true);
            try {
                const taskList = await lab.getChapterTasks(planId, parseInt(chapterNum));
                setTasks(taskList || []);
                if (taskList && taskList.length > 0) {
                    setTasksPanelOpen(true);
                    const taskId = searchParams.get('taskId');
                    const target = taskId ? taskList.find(t => t.id === taskId) : taskList[0];
                    if (target) {
                        loadTask(target);
                    }
                }
            } catch (err) {
                console.error('Failed to load tasks:', err);
            } finally {
                setLoadingTasks(false);
            }
        }
        loadTasks();
    }, [planId, chapterNum, searchParams, loadTask]);

    // ── Submit code for verification ─────────────────────────
    const handleSubmit = useCallback(async () => {
        if (!activeTask || !activeFile || submitting) return;
        setSubmitting(true);
        setVerificationResult(null);
        try {
            const result = await lab.submit(
                activeTask.id, activeFile.code, activeFile.language
            );
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
                // Python runs on server sandbox
                const result = await lab.execute(code, language);
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

    // ── Resizing Handlers ────────────────────────────────────
    const handleTaskResize = useCallback((e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = taskPanelWidth;

        const onMouseMove = (e) => {
            const delta = e.clientX - startX;
            setTaskPanelWidth(Math.max(260, Math.min(650, startWidth + delta)));
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [taskPanelWidth]);

    const handleOutputResize = useCallback((e) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = outputHeight;

        const onMouseMove = (e) => {
            const delta = startY - e.clientY;
            setOutputHeight(Math.max(80, Math.min(500, startHeight + delta)));
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [outputHeight]);

    // ── Quick Layout presets ─────────────────────────────────
    const setPresetLayout = (mode) => {
        if (mode === 'study') {
            setVideoPanelOpen(true);
            setTasksPanelOpen(true);
            setOutputPanelOpen(true);
        } else if (mode === 'coding') {
            setVideoPanelOpen(false);
            setTasksPanelOpen(true);
            setOutputPanelOpen(true);
        } else if (mode === 'zen') {
            setVideoPanelOpen(false);
            setTasksPanelOpen(false);
            setOutputPanelOpen(true);
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)',
            background: '#030303', fontFamily: "'Outfit', system-ui, sans-serif",
            color: '#fff', overflow: 'hidden'
        }}>
            {/* ── Top Bar / Workspace Controller ────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: '#080808', flexShrink: 0, gap: '12px', flexWrap: 'wrap'
            }}>
                {/* Left: Branding & Chapter Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {planId && (
                        <Link
                            to="/learning"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                color: '#a1a1aa', textDecoration: 'none', fontSize: '11px',
                                padding: '4px 8px', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
                            }}
                            title="Return to Learning Roadmap"
                        >
                            <ArrowLeft size={12} /> Course
                        </Link>
                    )}

                    <div style={{
                        width: '30px', height: '30px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(99,102,241,0.2) 100%)',
                        border: '1px solid rgba(167,139,250,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <Beaker size={15} style={{ color: '#c084fc' }} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', color: '#fff' }}>
                                Polaris Lab
                            </span>
                            {chapterInfo && (
                                <span style={{
                                    fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
                                    letterSpacing: '0.15em', padding: '2px 8px', borderRadius: '999px',
                                    background: 'rgba(167,139,250,0.12)', color: '#c084fc',
                                    border: '1px solid rgba(167,139,250,0.25)'
                                }}>
                                    Chapter {chapterInfo.chapter_number}
                                </span>
                            )}
                        </div>
                        <div style={{
                            fontSize: '11px', color: '#71717a', whiteSpace: 'nowrap',
                            overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '340px'
                        }}>
                            {chapterInfo ? chapterInfo.title : 'Interactive Code Sandbox & IDE'}
                        </div>
                    </div>
                </div>

                {/* Center: Layout Mode Switches */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <button
                        onClick={() => setPresetLayout('study')}
                        title="Study Mode: Video + Problem + Code"
                        style={{
                            background: videoPanelOpen && tasksPanelOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: videoPanelOpen && tasksPanelOpen ? '#fff' : '#71717a',
                            border: 'none', borderRadius: '7px', padding: '4px 10px',
                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s'
                        }}
                    >
                        <Columns size={12} /> Study
                    </button>
                    <button
                        onClick={() => setPresetLayout('coding')}
                        title="Problem & Code Mode: Hide Video, Maximize Problem & Code"
                        style={{
                            background: !videoPanelOpen && tasksPanelOpen ? 'rgba(167,139,250,0.2)' : 'transparent',
                            color: !videoPanelOpen && tasksPanelOpen ? '#c084fc' : '#71717a',
                            border: 'none', borderRadius: '7px', padding: '4px 10px',
                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s'
                        }}
                    >
                        <BookOpen size={12} /> Problem & Code
                    </button>
                    <button
                        onClick={() => setPresetLayout('zen')}
                        title="Zen Mode: Code Editor Only"
                        style={{
                            background: !videoPanelOpen && !tasksPanelOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: !videoPanelOpen && !tasksPanelOpen ? '#fff' : '#71717a',
                            border: 'none', borderRadius: '7px', padding: '4px 10px',
                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s'
                        }}
                    >
                        <Maximize2 size={12} /> Zen Code
                    </button>
                </div>

                {/* Right: Section Toggle Chips & Reset */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Toggle Problem Statement */}
                    <button
                        onClick={() => setTasksPanelOpen(!tasksPanelOpen)}
                        title={tasksPanelOpen ? 'Hide Problem Description' : 'Show Problem Description'}
                        style={{
                            background: tasksPanelOpen ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${tasksPanelOpen ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
                            color: tasksPanelOpen ? '#c084fc' : '#71717a',
                            display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s',
                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}
                    >
                        <ListChecks size={12} />
                        Problem {tasks.length > 0 ? `(${tasks.length})` : ''}
                    </button>

                    {/* Toggle Video */}
                    <button
                        onClick={() => setVideoPanelOpen(!videoPanelOpen)}
                        title={videoPanelOpen ? 'Hide Video' : 'Show Video'}
                        style={{
                            background: videoPanelOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${videoPanelOpen ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
                            color: videoPanelOpen ? '#fff' : '#71717a',
                            display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s',
                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}
                    >
                        {videoPanelOpen ? <PanelLeftClose size={12} /> : <PanelLeftOpen size={12} />}
                        Video
                    </button>

                    {/* Reset Button */}
                    <button
                        onClick={() => {
                            if (confirm('Reset all files to default starter code?')) {
                                setFiles([
                                    { id: 'file-0', name: 'main.py', language: 'python', code: DEFAULT_CODE.python },
                                ]);
                                setActiveFileId('file-0');
                                setOutput(null);
                                setVerificationResult(null);
                            }
                        }}
                        title="Reset code files"
                        style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px', padding: '5px 9px', cursor: 'pointer', color: '#71717a',
                            display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s',
                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}
                    >
                        <RotateCcw size={11} /> Reset
                    </button>
                </div>
            </div>

            {/* ── Main Workspace Area ────────────────────────── */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                {/* ── Panel 1: Video Player (Collapsible) ──────── */}
                {videoPanelOpen && (
                    <div style={{
                        width: videoMinimized ? 'auto' : `${videoWidthPercent}%`,
                        minWidth: videoMinimized ? 0 : '280px',
                        maxWidth: '50%',
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', flexDirection: 'column',
                        padding: '8px', background: '#050505',
                        transition: 'width 0.25s ease', flexShrink: 0
                    }}>
                        <VideoPlayer
                            url={chapterInfo?.youtube_url}
                            title={chapterInfo?.title}
                            onMinimize={() => setVideoMinimized(!videoMinimized)}
                            isMinimized={videoMinimized}
                        />
                    </div>
                )}

                {/* ── Panel 2: Problem Statement & Tasks ───────── */}
                {tasksPanelOpen && (
                    <div style={{
                        width: `${taskPanelWidth}px`,
                        minWidth: '280px',
                        maxWidth: '650px',
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', flexDirection: 'column',
                        background: '#09090b', overflow: 'hidden',
                        flexShrink: 0, position: 'relative'
                    }}>
                        {/* Task Panel Header / Tabs */}
                        <div style={{
                            padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: '#0c0c0e'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <BookOpen size={14} style={{ color: '#c084fc' }} />
                                    <span style={{
                                        fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                                        letterSpacing: '0.12em', color: '#e4e4e7'
                                    }}>
                                        Challenge
                                    </span>
                                </div>

                                {/* Task Pills if multiple tasks */}
                                {tasks.length > 1 && (
                                    <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                                        {tasks.map((t, idx) => (
                                            <button
                                                key={t.id}
                                                onClick={() => loadTask(t)}
                                                style={{
                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '9px',
                                                    fontWeight: 700, border: 'none', cursor: 'pointer',
                                                    background: activeTask?.id === t.id ? '#c084fc' : 'rgba(255,255,255,0.06)',
                                                    color: activeTask?.id === t.id ? '#000' : '#a1a1aa',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                #{idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setTasksPanelOpen(false)}
                                title="Collapse problem panel"
                                style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    color: '#71717a', padding: '3px', borderRadius: '4px',
                                    display: 'flex', alignItems: 'center'
                                }}
                            >
                                <PanelLeftClose size={13} />
                            </button>
                        </div>

                        {/* Task Content: Full high-contrast readable question */}
                        <div style={{
                            flex: 1, overflowY: 'auto', padding: '16px 18px',
                            display: 'flex', flexDirection: 'column', gap: '16px'
                        }}>
                            {activeTask ? (
                                <>
                                    {/* Task Title & Badges */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                            <span style={{
                                                fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
                                                letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '6px',
                                                background: activeTask.difficulty === 'easy' ? 'rgba(34,197,94,0.12)'
                                                    : activeTask.difficulty === 'hard' ? 'rgba(239,68,68,0.12)'
                                                        : 'rgba(251,191,36,0.12)',
                                                color: activeTask.difficulty === 'easy' ? '#4ade80'
                                                    : activeTask.difficulty === 'hard' ? '#f87171'
                                                        : '#fcd34d',
                                                border: `1px solid ${activeTask.difficulty === 'easy' ? 'rgba(34,197,94,0.25)' : activeTask.difficulty === 'hard' ? 'rgba(239,68,68,0.25)' : 'rgba(251,191,36,0.25)'}`
                                            }}>
                                                {activeTask.difficulty}
                                            </span>

                                            <span style={{
                                                fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                                                letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '6px',
                                                background: 'rgba(255,255,255,0.05)', color: '#a1a1aa',
                                                border: '1px solid rgba(255,255,255,0.08)'
                                            }}>
                                                {activeTask.language || 'Python'}
                                            </span>

                                            {activeTask.solved ? (
                                                <span style={{
                                                    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                                                    letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '6px',
                                                    background: 'rgba(34,197,94,0.12)', color: '#4ade80',
                                                    border: '1px solid rgba(34,197,94,0.25)',
                                                    display: 'flex', alignItems: 'center', gap: '4px'
                                                }}>
                                                    <CheckCircle2 size={10} /> Solved
                                                </span>
                                            ) : (
                                                <span style={{
                                                    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                                                    letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '6px',
                                                    background: 'rgba(167,139,250,0.1)', color: '#c084fc',
                                                    border: '1px solid rgba(167,139,250,0.2)'
                                                }}>
                                                    {activeTask.test_count} Test Cases
                                                </span>
                                            )}
                                        </div>

                                        <h2 style={{
                                            fontSize: '18px', fontWeight: 700, color: '#ffffff',
                                            lineHeight: '1.35', letterSpacing: '-0.01em', margin: 0
                                        }}>
                                            {activeTask.title}
                                        </h2>
                                    </div>

                                    {/* Problem Description with comfortable, large, high-contrast font */}
                                    <div style={{
                                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '14px', padding: '14px 16px'
                                    }}>
                                        <div style={{
                                            fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                                            letterSpacing: '0.15em', color: '#c084fc', marginBottom: '8px'
                                        }}>
                                            Problem Statement
                                        </div>
                                        <div style={{
                                            fontSize: '14px', color: '#f4f4f5', lineHeight: '1.7',
                                            fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 400,
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {activeTask.description}
                                        </div>
                                    </div>

                                    {/* Function Input Guide Box */}
                                    <div style={{
                                        background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)',
                                        borderRadius: '12px', padding: '12px 14px', fontSize: '12px', color: '#e0e7ff', lineHeight: '1.6'
                                    }}>
                                        <div style={{ fontWeight: 800, color: '#a5b4fc', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            <Sparkles size={13} /> How Dynamic Test Verification Works
                                        </div>
                                        <div>
                                            Your function receives dynamic test inputs as arguments (e.g. <code>numbers = [1, 2, 3, 4, 5]</code>).
                                            Make sure your function uses <strong><code style={{ color: '#4ade80' }}>return</code></strong> to return the result value instead of only printing with <code>print()</code>.
                                        </div>
                                    </div>

                                    {/* Sample & Hidden Test Cases Preview */}
                                    {((activeTask.sample_test_cases && activeTask.sample_test_cases.length > 0) || (activeTask.test_cases && activeTask.test_cases.length > 0)) && (
                                        <div style={{
                                            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)',
                                            borderRadius: '14px', padding: '14px 16px'
                                        }}>
                                            <div style={{
                                                fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                                                letterSpacing: '0.15em', color: '#c084fc', marginBottom: '10px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                            }}>
                                                <span>Sample Test Cases</span>
                                                <span style={{
                                                    fontSize: '9px', color: '#a1a1aa', background: 'rgba(255,255,255,0.05)',
                                                    padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)'
                                                }}>
                                                    {(activeTask.sample_test_cases || activeTask.test_cases || []).length} Sample + 2 Hidden
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {(activeTask.sample_test_cases || activeTask.test_cases || []).map((tc, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            background: '#040404', border: '1px solid rgba(255,255,255,0.05)',
                                                            borderRadius: '10px', padding: '10px 12px',
                                                            fontFamily: "'JetBrains Mono', monospace", fontSize: '11px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                                Sample Case {idx + 1}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                                            <span style={{ color: '#71717a', userSelect: 'none', width: '65px', flexShrink: 0 }}>Input:</span>
                                                            <span style={{ color: '#4ade80', fontWeight: 600 }}>{tc.input}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <span style={{ color: '#71717a', userSelect: 'none', width: '65px', flexShrink: 0 }}>Expected:</span>
                                                            <span style={{ color: '#c084fc', fontWeight: 600 }}>{tc.expected_output}</span>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Hidden Cases Notice */}
                                                <div style={{
                                                    background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)',
                                                    borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px',
                                                    fontSize: '11px', color: '#71717a'
                                                }}>
                                                    <span>🔒</span>
                                                    <span>2 Hidden Test Cases evaluated automatically on <strong>Submit</strong></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Collapsible Hints */}
                                    {activeTask.hints && activeTask.hints.length > 0 && (
                                        <div style={{
                                            background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.15)',
                                            borderRadius: '14px', overflow: 'hidden'
                                        }}>
                                            <button
                                                onClick={() => setShowHints(!showHints)}
                                                style={{
                                                    width: '100%', padding: '12px 14px', background: 'transparent',
                                                    border: 'none', cursor: 'pointer', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'space-between',
                                                    color: '#fbbf24', fontSize: '11px', fontWeight: 700,
                                                    textTransform: 'uppercase', letterSpacing: '0.1em'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Lightbulb size={13} />
                                                    <span>Need a Hint? ({activeTask.hints.length})</span>
                                                </div>
                                                {showHints ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                            </button>

                                            {showHints && (
                                                <div style={{ padding: '0 14px 14px 14px' }}>
                                                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
                                                        {activeTask.hints.map((hint, i) => (
                                                            <li key={i} style={{
                                                                fontSize: '12px', color: '#d4d4d8',
                                                                lineHeight: '1.6', marginBottom: '4px'
                                                            }}>
                                                                {hint}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#71717a' }}>
                                    <FileCode size={28} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#d4d4d8', marginBottom: '4px' }}>
                                        No Specific Challenge Selected
                                    </div>
                                    <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                                        Select a challenge from the roadmap or write scratch code directly in the editor.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drag Resize Handle between Problem Panel and Editor */}
                        <div
                            onMouseDown={handleTaskResize}
                            title="Drag to resize Problem Panel"
                            style={{
                                position: 'absolute', top: 0, right: 0, width: '6px', height: '100%',
                                cursor: 'col-resize', background: 'transparent', zIndex: 10
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        />
                    </div>
                )}

                {/* ── Panel 3: Monaco Editor & Output Console ──── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                    {/* File Tabs & Actions */}
                    <FileExplorer
                        files={files}
                        activeFileId={activeFileId}
                        onSelectFile={setActiveFileId}
                        onAddFile={handleAddFile}
                        onRemoveFile={handleRemoveFile}
                    />

                    {/* Editor View */}
                    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                        {activeFile?.language === 'html' && htmlPreview ? (
                            <div style={{ display: 'flex', height: '100%' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <CodeEditor
                                        code={activeFile.code}
                                        language={activeFile.language}
                                        onChange={handleCodeChange}
                                        onRun={handleRun}
                                        isRunning={isRunning}
                                    />
                                </div>
                                <div style={{
                                    flex: 1, minWidth: 0,
                                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <div style={{
                                        padding: '6px 12px', background: '#030303',
                                        borderBottom: '1px solid rgba(255,255,255,0.06)',
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

                    {/* Vertical Resize Handle for Output Terminal */}
                    {outputPanelOpen && (
                        <div
                            onMouseDown={handleOutputResize}
                            title="Drag to resize Terminal"
                            style={{
                                height: '5px', cursor: 'row-resize',
                                background: 'rgba(255,255,255,0.03)',
                                borderTop: '1px solid rgba(255,255,255,0.06)',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        />
                    )}

                    {outputPanelOpen && (
                        <div style={{ height: `${outputHeight}px`, flexShrink: 0, position: 'relative' }}>
                            <OutputPanel
                                output={output}
                                isRunning={isRunning}
                                onClear={() => setOutput(null)}
                            />

                            {verificationResult && (
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    background: '#09090b', borderTop: '1px solid rgba(255,255,255,0.1)',
                                    padding: '14px 18px', maxHeight: '240px', overflowY: 'auto',
                                    zIndex: 20, boxShadow: '0 -10px 25px rgba(0,0,0,0.8)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {verificationResult.passed ? (
                                                <CheckCircle2 size={18} style={{ color: '#4ade80' }} />
                                            ) : (
                                                <XCircle size={18} style={{ color: '#f87171' }} />
                                            )}
                                            <span style={{
                                                fontSize: '13px', fontWeight: 800,
                                                color: verificationResult.passed ? '#4ade80' : '#f87171',
                                            }}>
                                                {verificationResult.passed ? '✓ All Test Cases Passed!' : `${verificationResult.passed_tests}/${verificationResult.total_tests} Tests Passed`}
                                            </span>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 800,
                                                padding: '3px 9px', borderRadius: '6px',
                                                background: verificationResult.score >= 80 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                                color: verificationResult.score >= 80 ? '#4ade80' : '#f87171',
                                                border: `1px solid ${verificationResult.score >= 80 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
                                            }}>Score: {verificationResult.score}%</span>
                                        </div>
                                        <button
                                            onClick={() => setVerificationResult(null)}
                                            style={{
                                                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '6px', padding: '3px 8px',
                                                color: '#71717a', fontSize: '9px', fontWeight: 700,
                                                textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer'
                                            }}
                                        >Dismiss</button>
                                    </div>

                                    {/* Test cases breakdown if returned */}
                                    {verificationResult.test_results && verificationResult.test_results.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a1a1aa' }}>
                                                Test Cases Breakdown ({verificationResult.passed_tests}/{verificationResult.total_tests} Passed)
                                            </div>
                                            {verificationResult.test_results.map((tr, idx) => (
                                                <div key={idx} style={{
                                                    background: tr.passed ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                                                    border: `1px solid ${tr.passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                                    borderRadius: '8px', padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontWeight: 700, color: tr.passed ? '#4ade80' : '#f87171' }}>
                                                            {tr.is_hidden ? (
                                                                tr.passed ? `✓ Test Case ${idx + 1} (Hidden Case) Passed` : `✗ Test Case ${idx + 1} (Hidden Case) Failed`
                                                            ) : (
                                                                tr.passed ? `✓ Test Case ${idx + 1} Passed` : `✗ Test Case ${idx + 1} Failed`
                                                            )}
                                                        </span>
                                                        {tr.is_hidden && (
                                                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#71717a', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px' }}>
                                                                Hidden Edge Case
                                                            </span>
                                                        )}
                                                    </div>
                                                    {!tr.is_hidden ? (
                                                        <>
                                                            <div style={{ display: 'flex', gap: '8px', color: '#a1a1aa' }}>
                                                                <span style={{ width: '75px', color: '#71717a', flexShrink: 0 }}>Input:</span>
                                                                <span style={{ color: '#e4e4e7' }}>{tr.input_data}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px', color: '#a1a1aa' }}>
                                                                <span style={{ width: '75px', color: '#71717a', flexShrink: 0 }}>Expected:</span>
                                                                <span style={{ color: '#c084fc' }}>{tr.expected}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px', color: '#a1a1aa' }}>
                                                                <span style={{ width: '75px', color: '#71717a', flexShrink: 0 }}>Your Output:</span>
                                                                <span style={{ color: tr.passed ? '#4ade80' : '#f87171', fontWeight: 600 }}>{tr.actual}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div style={{ fontSize: '11px', color: '#71717a', fontStyle: 'italic' }}>
                                                            {tr.passed ? 'Passed hidden edge assertions.' : 'Failed edge case requirements. Check your boundary logic.'}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Feedback output */}
                                    <pre style={{
                                        fontSize: '11px', color: '#d4d4d8', lineHeight: '1.6',
                                        margin: '0 0 8px 0', whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', monospace",
                                        background: '#040404', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
                                    }}>{verificationResult.feedback}</pre>

                                    {/* AI Review feedback if available */}
                                    {verificationResult.ai_review && (
                                        <div style={{
                                            padding: '10px 12px', borderRadius: '8px',
                                            background: 'rgba(167,139,250,0.06)',
                                            border: '1px solid rgba(167,139,250,0.2)',
                                        }}>
                                            <div style={{
                                                fontSize: '9px', fontWeight: 800, color: '#c084fc',
                                                textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px',
                                            }}>AI Review & Suggestions</div>
                                            <p style={{
                                                fontSize: '11px', color: '#a1a1aa', lineHeight: '1.6', margin: 0,
                                            }}>{verificationResult.ai_review}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bottom Action Bar (Run + Submit & Verify) */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
                        background: '#060608', flexShrink: 0, gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                                onClick={handleRun}
                                disabled={isRunning}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '7px 16px', borderRadius: '8px', cursor: isRunning ? 'wait' : 'pointer',
                                    background: isRunning ? 'rgba(255,255,255,0.08)' : '#fff',
                                    border: 'none', color: '#000',
                                    fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                                    letterSpacing: '0.1em', transition: 'all 0.15s',
                                    boxShadow: '0 0 15px rgba(255,255,255,0.2)'
                                }}
                            >
                                {isRunning ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={12} fill="currentColor" />}
                                {isRunning ? 'Running...' : 'Run Code (Ctrl+Enter)'}
                            </button>

                            <button
                                onClick={() => setOutputPanelOpen(!outputPanelOpen)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    color: '#71717a', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase'
                                }}
                            >
                                <TerminalIcon size={11} /> {outputPanelOpen ? 'Hide Terminal' : 'Show Terminal'}
                            </button>
                        </div>

                        {activeTask && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '8px 22px', borderRadius: '10px', cursor: submitting ? 'wait' : 'pointer',
                                        background: submitting ? 'rgba(167,139,250,0.2)' : 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                                        border: 'none', color: '#fff',
                                        fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                                        letterSpacing: '0.12em', transition: 'all 0.2s',
                                        boxShadow: '0 0 20px rgba(168,85,247,0.35)'
                                    }}
                                >
                                    {submitting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
                                    {submitting ? 'Verifying Tests...' : 'Submit & Verify'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
