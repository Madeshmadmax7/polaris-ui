/**
 * Polaris Lab — Monaco Code Editor Component
 * A premium dark-themed code editor with syntax highlighting, language selection,
 * and run capabilities. Wraps @monaco-editor/react.
 */

import { useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Copy, Trash2, Download } from 'lucide-react';

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
    html: 'html',
    css: 'css',
};

export default function CodeEditor({
    code,
    language = 'python',
    onChange,
    onRun,
    isRunning = false,
    readOnly = false,
}) {
    const editorRef = useRef(null);

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
        const ext = language === 'python' ? '.py' : language === 'javascript' ? '.js' : '.html';
        const blob = new Blob([value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `polaris-lab${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    }, [language]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Editor Toolbar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: '#050505', borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: language === 'python' ? '#fbbf24' : language === 'javascript' ? '#fbbf24' : '#f472b6' }} />
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#71717a', fontFamily: "'Outfit', sans-serif" }}>
                        {language === 'python' ? 'Python 3' : language === 'javascript' ? 'JavaScript' : 'HTML/CSS'}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onClick={handleCopy}
                        title="Copy code"
                        style={{
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                            padding: '5px 8px', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                        onMouseLeave={e => { e.target.style.color = '#71717a'; e.target.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                    >
                        <Copy size={12} />
                    </button>
                    <button
                        onClick={handleDownload}
                        title="Download file"
                        style={{
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                            padding: '5px 8px', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                        onMouseLeave={e => { e.target.style.color = '#71717a'; e.target.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                    >
                        <Download size={12} />
                    </button>
                    <button
                        onClick={handleClear}
                        title="Clear code"
                        style={{
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                            padding: '5px 8px', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.target.style.color = '#ef4444'; e.target.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                        onMouseLeave={e => { e.target.style.color = '#71717a'; e.target.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                    >
                        <Trash2 size={12} />
                    </button>
                    <button
                        onClick={onRun}
                        disabled={isRunning}
                        title="Run code (Ctrl+Enter)"
                        style={{
                            background: isRunning ? 'rgba(255,255,255,0.05)' : '#fff',
                            color: isRunning ? '#71717a' : '#000',
                            border: 'none', borderRadius: '8px',
                            padding: '5px 14px', cursor: isRunning ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em',
                            fontFamily: "'Outfit', sans-serif",
                            transition: 'all 0.2s',
                            opacity: isRunning ? 0.5 : 1,
                        }}
                    >
                        <Play size={10} fill={isRunning ? '#71717a' : '#000'} />
                        {isRunning ? 'Running...' : 'Run'}
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
                        fontSize: 13,
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
                        tabSize: 4,
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
