/**
 * Polaris Lab — Monaco Code Editor Component
 * A premium dark-themed code editor with syntax highlighting, language selection,
 * and run capabilities. Wraps @monaco-editor/react.
 * Supports: Python, C++, Java, JavaScript, HTML/CSS
 */

import { useRef, useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Copy, Trash2, Download, ChevronDown } from 'lucide-react';

const MONACO_THEME = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '3f3f46', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: '67e8f9' },
        { token: 'function', foreground: '93c5fd' },
        { token: 'variable', foreground: 'e2e8f0' },
        { token: 'operator', foreground: 'f472b6' },
    ],
    colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#e4e4e7',
        'editor.lineHighlightBackground': '#ffffff08',
        'editor.selectionBackground': '#ffffff15',
        'editor.inactiveSelectionBackground': '#ffffff08',
        'editorLineNumber.foreground': '#3f3f46',
        'editorLineNumber.activeForeground': '#71717a',
        'editorCursor.foreground': '#ffffff',
        'editor.selectionHighlightBackground': '#ffffff10',
        'editorWidget.background': '#0a0a0a',
        'editorWidget.border': '#1a1a1a',
        'editorSuggestWidget.background': '#0a0a0a',
        'editorSuggestWidget.border': '#1a1a1a',
        'editorSuggestWidget.selectedBackground': '#ffffff10',
        'input.background': '#0a0a0a',
        'input.border': '#1a1a1a',
        'scrollbarSlider.background': '#ffffff10',
        'scrollbarSlider.hoverBackground': '#ffffff20',
    },
};

const LANGUAGE_MAP = {
    python: 'python',
    javascript: 'javascript',
    cpp: 'cpp',
    java: 'java',
    html: 'html',
    css: 'css',
};

const LANGUAGE_LABELS = {
    python: { name: 'Python 3', color: '#3572A5' },
    cpp: { name: 'C++ 17', color: '#f34b7d' },
    java: { name: 'Java', color: '#b07219' },
    javascript: { name: 'JavaScript', color: '#f1e05a' },
    html: { name: 'HTML/CSS', color: '#e34c26' },
};

export default function CodeEditor({
    code,
    language = 'python',
    onChange,
    onRun,
    onLanguageChange,
    isRunning = false,
    readOnly = false,
}) {
    const editorRef = useRef(null);
    const [showLangMenu, setShowLangMenu] = useState(false);

    const handleEditorDidMount = useCallback((editor, monaco) => {
        editorRef.current = editor;

        // Define and apply custom Polaris theme
        monaco.editor.defineTheme('polaris-dark', MONACO_THEME);
        monaco.editor.setTheme('polaris-dark');

        // Focus the editor
        editor.focus();
    }, []);

    const handleCopy = useCallback(() => {
        if (editorRef.current) {
            const value = editorRef.current.getValue();
            navigator.clipboard.writeText(value).catch(() => { });
        }
    }, []);

    const handleClear = useCallback(() => {
        if (editorRef.current) {
            editorRef.current.setValue('');
            onChange?.('');
        }
    }, [onChange]);

    const handleDownload = useCallback(() => {
        if (!editorRef.current) return;
        const value = editorRef.current.getValue();
        const extMap = { python: '.py', javascript: '.js', cpp: '.cpp', java: '.java', html: '.html' };
        const ext = extMap[language] || '.txt';
        const blob = new Blob([value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solution${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    }, [language]);

    const langInfo = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.python;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a', overflow: 'hidden' }}>
            {/* Editor Toolbar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 12px', background: '#050505', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                {/* Language Selector */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e4e4e7', fontSize: '11px', fontWeight: 600,
                            fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s',
                        }}
                    >
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: langInfo.color,
                        }} />
                        {langInfo.name}
                        <ChevronDown size={11} style={{ color: '#71717a' }} />
                    </button>

                    {showLangMenu && (
                        <>
                            <div
                                style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                                onClick={() => setShowLangMenu(false)}
                            />
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                                background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '10px', padding: '4px', zIndex: 100,
                                minWidth: '140px', boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
                            }}>
                                {Object.entries(LANGUAGE_LABELS).map(([lang, info]) => (
                                    <button
                                        key={lang}
                                        onClick={() => {
                                            onLanguageChange?.(lang);
                                            setShowLangMenu(false);
                                        }}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '7px 10px', background: lang === language ? 'rgba(255,255,255,0.1)' : 'transparent',
                                            border: 'none', cursor: 'pointer', borderRadius: '6px',
                                            transition: 'all 0.15s', color: lang === language ? '#fff' : '#a1a1aa',
                                            textAlign: 'left',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = lang === language ? 'rgba(255,255,255,0.1)' : 'transparent'; }}
                                    >
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: info.color }} />
                                        <span style={{ fontSize: '11px', fontWeight: 500, fontFamily: "'Outfit', sans-serif" }}>
                                            {info.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onClick={handleCopy}
                        title="Copy code"
                        style={{
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px',
                            padding: '4px 7px', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                        onMouseLeave={e => { e.target.style.color = '#71717a'; e.target.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                    >
                        <Copy size={11} />
                    </button>
                    <button
                        onClick={handleDownload}
                        title="Download file"
                        style={{
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px',
                            padding: '4px 7px', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                        onMouseLeave={e => { e.target.style.color = '#71717a'; e.target.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                    >
                        <Download size={11} />
                    </button>
                    <button
                        onClick={handleClear}
                        title="Clear code"
                        style={{
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px',
                            padding: '4px 7px', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.target.style.color = '#ef4444'; e.target.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                        onMouseLeave={e => { e.target.style.color = '#71717a'; e.target.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
            </div>

            {/* Monaco Editor */}
            <div style={{ flex: 1, minHeight: 0 }}>
                <Editor
                    height="100%"
                    language={LANGUAGE_MAP[language] || 'plaintext'}
                    value={code}
                    onChange={(value) => onChange?.(value || '')}
                    onMount={handleEditorDidMount}
                    theme="vs-dark"
                    options={{
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                        fontLigatures: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 },
                        lineNumbers: 'on',
                        renderLineHighlight: 'line',
                        renderWhitespace: 'selection',
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true,
                        bracketPairColorization: { enabled: true },
                        guides: { bracketPairs: true },
                        wordWrap: 'on',
                        readOnly,
                        tabSize: language === 'python' ? 4 : 4,
                        insertSpaces: true,
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: true,
                    }}
                    loading={
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            height: '100%', background: '#0a0a0a',
                        }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#3f3f46', fontFamily: "'Outfit', sans-serif" }}>
                                Loading Editor...
                            </span>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
