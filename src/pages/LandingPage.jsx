import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Target, Cpu, Shield } from 'lucide-react';
import bgImage from '../images/bg3.png';

const LandingPage = () => {
    return (
        <div className="flex flex-col min-h-screen bg-black font-outfit">
            <section className="relative min-h-[calc(100vh-80px)] flex items-end justify-start text-white overflow-hidden bg-black px-12 md:px-32 pb-12">
                <div 
                    className="absolute -top-10 inset-x-0 bottom-0 z-0" 
                    style={{ 
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center top'
                    }}
                ></div>
                
                {/* Immersive Overlays */}
                {/* <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent z-0"></div> */}
                {/* <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black to-transparent z-10"></div> */}
                
                <div className="relative z-10 max-w-xl text-left animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-tight leading-[1.1] text-white">
                        Master Your<br />
                        <span className="font-semibold text-white/90">Digital Existence</span>
                    </h1>
                    
                    <p className="text-[13px] md:text-sm mb-10 text-zinc-400 max-w-md font-light tracking-wide leading-relaxed">
                        The definitive operating system for high-performance productivity, adaptive learning, and cognitive clarity.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link to="/register" className="bg-white text-black px-10 py-3 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-all text-center">
                            Initialize
                        </Link>
                        <Link to="/features" className="bg-transparent border border-white/20 text-white backdrop-blur-sm px-10 py-3 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all text-center">
                            View Manifest
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quick Stats/Social Proof */}
            <section className="py-24 bg-black border-y border-white/5">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 text-center">
                        <div className="space-y-3">
                            <p className="text-3xl font-light tracking-tight text-white tabular-nums">10K+</p>
                            <p className="text-zinc-600 font-bold uppercase tracking-[0.4em] text-[9px]">Active Nodes</p>
                        </div>
                        <div className="space-y-3">
                            <p className="text-3xl font-light tracking-tight text-white tabular-nums">500+</p>
                            <p className="text-zinc-600 font-bold uppercase tracking-[0.4em] text-[10px]">Hours Decrypted</p>
                        </div>
                        <div className="space-y-3">
                            <p className="text-3xl font-light tracking-tight text-white tabular-nums">99%</p>
                            <p className="text-zinc-600 font-bold uppercase tracking-[0.4em] text-[9px]">Uptime Stability</p>
                        </div>
                        <div className="space-y-3">
                            <p className="text-3xl font-light tracking-tight text-white tabular-nums">24/7</p>
                            <p className="text-zinc-600 font-bold uppercase tracking-[0.4em] text-[9px]">Kernel Support</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section className="py-32 bg-black">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-24">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.6em] text-zinc-700 mb-6">Core Architecture</h2>
                        <h3 className="text-4xl font-light tracking-tight text-white">System <span className="font-semibold">Capabilities</span></h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-12 bg-white/5 border border-white/5 rounded-[48px] hover:border-white/10 transition-all group shadow-2xl">
                            <Target className="mb-10 text-zinc-700 group-hover:text-white transition-colors" size={32} />
                            <h4 className="text-[18px] font-medium tracking-tight mb-4 text-white">Precision Tracking</h4>
                            <p className="text-[14px] text-zinc-500 font-light leading-relaxed tracking-wide">
                                Millisecond-accurate activity analysis across all digital environments with zero performance overhead.
                            </p>
                        </div>
                        <div className="p-12 bg-white/5 border border-white/5 rounded-[48px] hover:border-white/10 transition-all group shadow-2xl">
                            <Cpu className="mb-10 text-zinc-700 group-hover:text-white transition-colors" size={32} />
                            <h4 className="text-[18px] font-medium tracking-tight mb-4 text-white">Neural Learning</h4>
                            <p className="text-[14px] text-zinc-500 font-light leading-relaxed tracking-wide">
                                AI-driven study plans that adapt to your unique cognitive signature and knowledge retention patterns.
                            </p>
                        </div>
                        <div className="p-12 bg-white/5 border border-white/5 rounded-[48px] hover:border-white/10 transition-all group shadow-2xl">
                            <Shield className="mb-10 text-zinc-700 group-hover:text-white transition-colors" size={32} />
                            <h4 className="text-[18px] font-medium tracking-tight mb-4 text-white">Security Core</h4>
                            <p className="text-[14px] text-zinc-500 font-light leading-relaxed tracking-wide">
                                Encrypted local storage ensuring 100% tactical data sovereignty and private session integrity.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
