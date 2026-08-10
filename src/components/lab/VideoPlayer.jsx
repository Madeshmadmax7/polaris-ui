/**
 * Polaris Lab — Video Player Component
 * Embeds a YouTube video player using the standard iframe embed API.
 * Styled to match the Polaris dark theme.
 */

import { Youtube, ExternalLink, Minimize2, Maximize2 } from 'lucide-react';
import { useState } from 'react';

/**
 * Extract YouTube video ID from various URL formats.
 */
function extractVideoId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export default function VideoPlayer({ url, title, onMinimize, isMinimized = false }) {
    const videoId = extractVideoId(url);
    const [loaded, setLoaded] = useState(false);

    if (!videoId) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '100%', background: '#0a0a0a', borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)', gap: '12px',
            }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '16px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Youtube size={20} style={{ color: '#27272a' }} />
                </div>
                <span style={{
                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.2em', color: '#27272a', fontFamily: "'Outfit', sans-serif",
                }}>
                    No video assigned
                </span>
                <span style={{
                    fontSize: '11px', color: '#3f3f46', fontFamily: "'Outfit', sans-serif",
                    maxWidth: '200px', textAlign: 'center', lineHeight: '1.5',
                }}>
                    Connect a chapter from the Learning page to load its video here.
                </span>
            </div>
        );
    }

    if (isMinimized) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', background: '#0a0a0a', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
            }}
                onClick={onMinimize}
            >
                <Youtube size={14} style={{ color: '#ef4444' }} />
                <span style={{
                    fontSize: '11px', fontWeight: 500, color: '#e4e4e7',
                    fontFamily: "'Outfit', sans-serif", flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {title || 'YouTube Video'}
                </span>
                <Maximize2 size={12} style={{ color: '#71717a' }} />
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: '#0a0a0a', borderRadius: '16px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.05)',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: '#050505',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <Youtube size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <span style={{
                        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.15em', color: '#71717a', fontFamily: "'Outfit', sans-serif",
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {title || 'Video Player'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {onMinimize && (
                        <button
                            onClick={onMinimize}
                            title="Minimize video"
                            style={{
                                background: 'transparent', border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#71717a',
                                display: 'flex', alignItems: 'center', transition: 'all 0.2s',
                            }}
                        >
                            <Minimize2 size={10} />
                        </button>
                    )}
                    <a
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in YouTube"
                        style={{
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#71717a',
                            display: 'flex', alignItems: 'center', textDecoration: 'none', transition: 'all 0.2s',
                        }}
                    >
                        <ExternalLink size={10} />
                    </a>
                </div>
            </div>

            {/* Video iframe */}
            <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                {!loaded && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', background: '#0a0a0a', zIndex: 1,
                    }}>
                        <span style={{
                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.3em', color: '#3f3f46', fontFamily: "'Outfit', sans-serif",
                        }}>
                            Loading Video...
                        </span>
                    </div>
                )}
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                    title={title || 'YouTube Video'}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setLoaded(true)}
                />
            </div>
        </div>
    );
}
