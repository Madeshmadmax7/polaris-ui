/**
 * Polaris Lab — File Explorer / Tab System
 * Manages multiple open code files with tab switching and language selection.
 */

import { useState } from 'react';
import { Plus, X, FileCode, Code2, Globe } from 'lucide-react';

const LANGUAGE_CONFIG = {
    python: { label: 'Python', icon: FileCode, color: '#fbbf24', ext: '.py' },
    javascript: { label: 'JavaScript', icon: Code2, color: '#fbbf24', ext: '.js' },
    html: { label: 'HTML/CSS', icon: Globe, color: '#f472b6', ext: '.html' },
};

export default function FileExplorer({
    files,
    activeFileId,
    onSelectFile,
    onAddFile,
    onRemoveFile,
    onRenameFile,
}) {
    const [showNewMenu, setShowNewMenu] = useState(false);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 8px', background: '#030303',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            position: 'relative', zIndex: 100,
        }}>
            {/* Scrollable File Tabs */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '2px',
                overflowX: 'auto', overflowY: 'visible',
                scrollbarWidth: 'none', flex: 1, marginRight: '8px',
            }}>
                {files.map((file) => {
                    const config = LANGUAGE_CONFIG[file.language] || LANGUAGE_CONFIG.python;
                    const isActive = file.id === activeFileId;

                    return (
                        <div
                            key={file.id}
                            onClick={() => onSelectFile(file.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                                border: `1px solid ${isActive ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                                transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0,
                            }}
                        >
                            <div style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: config.color, opacity: isActive ? 1 : 0.3,
                            }} />
                            <span style={{
                                fontSize: '10px', fontWeight: isActive ? 600 : 400,
                                color: isActive ? '#e4e4e7' : '#71717a',
                                fontFamily: "'Outfit', sans-serif",
                                letterSpacing: '0.05em',
                            }}>
                                {file.name}
                            </span>

                            {files.length > 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveFile(file.id); }}
                                    style={{
                                        background: 'transparent', border: 'none',
                                        padding: '1px', cursor: 'pointer',
                                        color: '#3f3f46', display: 'flex', alignItems: 'center',
                                        transition: 'all 0.15s', borderRadius: '4px',
                                    }}
                                    onMouseEnter={e => { e.target.style.color = '#ef4444'; }}
                                    onMouseLeave={e => { e.target.style.color = '#3f3f46'; }}
                                >
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add New File Button */}
            <div style={{ position: 'relative', flexShrink: 0, zIndex: 200 }}>
                <button
                    onClick={() => setShowNewMenu(!showNewMenu)}
                    style={{
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px', padding: '5px 8px', cursor: 'pointer',
                        color: '#3f3f46', display: 'flex', alignItems: 'center',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#3f3f46'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                >
                    <Plus size={12} />
                </button>

                {showNewMenu && (
                    <>
                        {/* Invisible backdrop to dismiss menu on outside click */}
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 190 }}
                            onClick={() => setShowNewMenu(false)}
                        />
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                            background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '12px', padding: '4px', zIndex: 200,
                            minWidth: '150px', boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
                        }}>
                            {Object.entries(LANGUAGE_CONFIG).map(([lang, config]) => (
                                <button
                                    key={lang}
                                    onClick={() => { onAddFile(lang); setShowNewMenu(false); }}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '8px 12px', background: 'transparent', border: 'none',
                                        cursor: 'pointer', borderRadius: '8px', transition: 'all 0.15s',
                                        color: '#a1a1aa', textAlign: 'left',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
                                >
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: config.color }} />
                                    <span style={{
                                        fontSize: '11px', fontWeight: 500,
                                        fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        {config.label}
                                    </span>
                                    <span style={{ fontSize: '9px', color: '#3f3f46', marginLeft: 'auto', fontFamily: 'monospace' }}>
                                        {config.ext}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
