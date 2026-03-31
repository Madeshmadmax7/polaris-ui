import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Chrome, Puzzle, LogIn, MonitorUp, BookOpen, Shield, Zap, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

const DocsPage = () => {
    const EXTENSION_DOWNLOAD_URL = 'https://drive.google.com/uc?export=download&id=1RKIKl8Ey1AYnWbglWAIXEgxKzQJibz3q';

    const steps = [
        {
            number: '01',
            icon: <Download size={20} />,
            title: 'Download the Extension',
            description: 'Click the button below to download the Polaris browser extension as a ZIP file from Google Drive.',
            highlight: true,
        },
        {
            number: '02',
            icon: <MonitorUp size={20} />,
            title: 'Extract the ZIP',
            description: 'Locate the downloaded file and extract/unzip it to a folder on your computer. Remember where you saved it.',
        },
        {
            number: '03',
            icon: <Chrome size={20} />,
            title: 'Open Chrome Extensions',
            description: (
                <span>
                    Navigate to <code style={{
                        background: 'rgba(255,255,255,0.08)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        border: '1px solid rgba(255,255,255,0.1)',
                        letterSpacing: '0.02em',
                    }}>chrome://extensions</code> in your browser's address bar.
                </span>
            ),
        },
        {
            number: '04',
            icon: <Puzzle size={20} />,
            title: 'Enable Developer Mode',
            description: 'Toggle the "Developer mode" switch in the top-right corner of the extensions page.',
        },
        {
            number: '05',
            icon: <MonitorUp size={20} />,
            title: 'Load the Extension',
            description: 'Click "Load unpacked" in the top-left, then select the extracted folder containing the extension files.',
        },
        {
            number: '06',
            icon: <LogIn size={20} />,
            title: 'Sign In & Start',
            description: 'Click the Polaris icon in your browser toolbar, sign in with your account credentials, and you\'re ready to go.',
        },
    ];

    const features = [
        {
            icon: <Zap size={16} />,
            title: 'Real-Time Tracking',
            desc: 'Automatically tracks your browsing activity and categorizes websites as productive, neutral, or distracting.',
        },
        {
            icon: <BookOpen size={16} />,
            title: 'Smart Learning',
            desc: 'Detects YouTube educational content and automatically matches videos to your study plan chapters.',
        },
        {
            icon: <Shield size={16} />,
            title: 'Focus Mode',
            desc: 'Blocks distracting websites with a full-screen overlay when enabled by you or your parent.',
        },
    ];

    return (
        <div className="bg-black min-h-screen pt-24 pb-32 selection:bg-white selection:text-black font-outfit">
            <div className="container mx-auto px-6 max-w-5xl">

                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-block px-4 py-1.5 border border-white/10 rounded-full mb-6 text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500">
                        Deployment Protocol
                    </div>
                    <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-tight text-white leading-none">
                        Get <span className="font-semibold">Started</span>
                    </h1>
                    <p className="text-zinc-500 font-light tracking-wide text-[14px] leading-relaxed max-w-lg mx-auto">
                        Install the Polaris browser extension to unlock real-time activity tracking,
                        intelligent learning detection, and focus management.
                    </p>
                </div>

                {/* Download Card */}
                <div className="mb-24 animate-in fade-in slide-in-from-bottom-6 duration-900">
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '32px',
                        padding: '48px',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Subtle glow */}
                        <div style={{
                            position: 'absolute',
                            top: '-50%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '300px',
                            height: '300px',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '20px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px',
                            }}>
                                <Chrome size={28} style={{ color: 'white' }} />
                            </div>

                            <h2 style={{
                                fontSize: '22px',
                                fontWeight: 500,
                                color: 'white',
                                marginBottom: '8px',
                                letterSpacing: '-0.02em',
                            }}>
                                Polaris Extension
                            </h2>
                            <p style={{
                                fontSize: '13px',
                                color: 'rgba(255,255,255,0.35)',
                                marginBottom: '28px',
                                fontWeight: 300,
                                letterSpacing: '0.03em',
                            }}>
                                Chrome / Edge / Brave — Manifest V3
                            </p>

                            <a
                                href={EXTENSION_DOWNLOAD_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                id="download-extension-btn"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: 'white',
                                    color: 'black',
                                    padding: '14px 36px',
                                    borderRadius: '100px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.2em',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s',
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => { e.target.style.opacity = '0.85'; e.target.style.transform = 'scale(1.02)'; }}
                                onMouseLeave={(e) => { e.target.style.opacity = '1'; e.target.style.transform = 'scale(1)'; }}
                            >
                                <Download size={16} />
                                Download Extension
                            </a>

                            <p style={{
                                fontSize: '10px',
                                color: 'rgba(255,255,255,0.2)',
                                marginTop: '16px',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                            }}>
                                ZIP Archive · ~2 MB
                            </p>
                        </div>
                    </div>
                </div>

                {/* Installation Steps */}
                <div className="mb-28 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="text-center mb-16">
                        <h2 style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.6em',
                            color: 'rgba(255,255,255,0.25)',
                            marginBottom: '16px',
                        }}>
                            Installation Sequence
                        </h2>
                        <h3 style={{
                            fontSize: '32px',
                            fontWeight: 300,
                            color: 'white',
                            letterSpacing: '-0.02em',
                        }}>
                            Setup in <span style={{ fontWeight: 600 }}>6 Steps</span>
                        </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {steps.map((step, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '24px',
                                    padding: '28px 32px',
                                    background: step.highlight
                                        ? 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
                                        : 'rgba(255,255,255,0.02)',
                                    border: `1px solid rgba(255,255,255,${step.highlight ? '0.1' : '0.05'})`,
                                    borderRadius: '24px',
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = `rgba(255,255,255,${step.highlight ? '0.1' : '0.05'})`;
                                    e.currentTarget.style.background = step.highlight
                                        ? 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
                                        : 'rgba(255,255,255,0.02)';
                                }}
                            >
                                {/* Step Number */}
                                <div style={{
                                    flexShrink: 0,
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.5)',
                                }}>
                                    {step.icon}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                        <span style={{
                                            fontSize: '9px',
                                            fontWeight: 700,
                                            color: 'rgba(255,255,255,0.2)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.3em',
                                        }}>
                                            Step {step.number}
                                        </span>
                                    </div>
                                    <h4 style={{
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        color: 'white',
                                        marginBottom: '6px',
                                        letterSpacing: '-0.01em',
                                    }}>
                                        {step.title}
                                    </h4>
                                    <p style={{
                                        fontSize: '13px',
                                        color: 'rgba(255,255,255,0.35)',
                                        fontWeight: 300,
                                        letterSpacing: '0.02em',
                                        lineHeight: 1.6,
                                    }}>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* What the Extension Does */}
                <div className="mb-28">
                    <div className="text-center mb-16">
                        <h2 style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.6em',
                            color: 'rgba(255,255,255,0.25)',
                            marginBottom: '16px',
                        }}>
                            Extension Capabilities
                        </h2>
                        <h3 style={{
                            fontSize: '32px',
                            fontWeight: 300,
                            color: 'white',
                            letterSpacing: '-0.02em',
                        }}>
                            What It <span style={{ fontWeight: 600 }}>Does</span>
                        </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {features.map((f, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: '32px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '28px',
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.5)',
                                    marginBottom: '20px',
                                }}>
                                    {f.icon}
                                </div>
                                <h4 style={{
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    color: 'white',
                                    marginBottom: '8px',
                                    letterSpacing: '-0.01em',
                                }}>
                                    {f.title}
                                </h4>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,0.35)',
                                    fontWeight: 300,
                                    letterSpacing: '0.02em',
                                    lineHeight: 1.6,
                                }}>
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Important Notes */}
                <div style={{
                    padding: '32px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '24px',
                    marginBottom: '48px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <AlertTriangle size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                        <h4 style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3em',
                            color: 'rgba(255,255,255,0.4)',
                        }}>
                            Important Notes
                        </h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            'The extension works on Chrome, Edge, Brave, and other Chromium-based browsers.',
                            'You must create a Polaris account first before signing into the extension.',
                            'The extension uses the Side Panel — click the Polaris icon in your toolbar to open it.',
                            'Keep the extracted folder on your computer. Deleting it will remove the extension.',
                        ].map((note, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <CheckCircle2 size={14} style={{ color: 'rgba(255,255,255,0.15)', marginTop: '2px', flexShrink: 0 }} />
                                <p style={{
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,0.35)',
                                    fontWeight: 300,
                                    letterSpacing: '0.02em',
                                    lineHeight: 1.6,
                                }}>
                                    {note}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <p style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.3)',
                        marginBottom: '20px',
                        fontWeight: 300,
                        letterSpacing: '0.03em',
                    }}>
                        Don't have an account yet?
                    </p>
                    <Link
                        to="/register"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            color: 'white',
                            padding: '12px 28px',
                            borderRadius: '100px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                            textDecoration: 'none',
                            border: '1px solid rgba(255,255,255,0.15)',
                            transition: 'all 0.3s',
                        }}
                        onMouseEnter={(e) => { e.target.style.background = 'white'; e.target.style.color = 'black'; }}
                        onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'white'; }}
                    >
                        Create Account <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DocsPage;
