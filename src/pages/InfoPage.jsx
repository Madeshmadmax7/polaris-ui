import React from 'react';
import { Shield, Zap, Target, Cpu, ChevronRight } from 'lucide-react';

const InfoPage = ({ title, subtitle, content, icon: Icon }) => {
    return (
        <div className="min-h-screen bg-black font-outfit">
            {/* Header section */}
            <div className="bg-black text-white pt-40 pb-24 px-6 border-b border-white/5">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 mb-8 translate-in">
                        {Icon && (
                            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                                <Icon size={20} className="text-zinc-400" />
                            </div>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-700">System Documentation</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-light tracking-tight text-white mb-6 leading-[0.9]">
                        {title}
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm uppercase tracking-widest leading-relaxed max-w-xl">
                        {subtitle}
                    </p>
                </div>
            </div>

            {/* Content section */}
            <div className="max-w-5xl mx-auto px-6 py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                    <div className="lg:col-span-8 space-y-20">
                        {content.map((section, idx) => (
                            <section key={idx} className="space-y-8 animate-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    <h2 className="text-2xl font-medium tracking-tight text-white">
                                        {section.heading}
                                    </h2>
                                </div>
                                <p className="text-zinc-500 text-base leading-relaxed font-light tracking-wide max-w-2xl">
                                    {section.text}
                                </p>
                                {section.list && (
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {section.list.map((item, i) => (
                                            <li key={i} className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl group hover:border-white/20 transition-all">
                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-white transition-colors shrink-0"></div>
                                                <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest group-hover:text-white transition-colors">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        ))}
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        <div className="p-10 bg-white/5 border border-white/5 rounded-[40px] shadow-3xl">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-700 mb-10">Security Clearance</h4>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Protocol</span>
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">AES-256</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Status</span>
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">VERIFIED</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Access</span>
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">UNRESTRICTED</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-white text-black rounded-[40px] shadow-3xl group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.05] rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-black/[0.1] transition-all"></div>
                            <Zap className="mb-8 relative z-10" size={24} />
                            <h4 className="text-xl font-semibold tracking-tight mb-4 relative z-10">Initialize Protocol</h4>
                            <p className="text-[12px] text-zinc-600 font-medium leading-relaxed mb-10 relative z-10">
                                Ready to integrate the Polaris architecture into your daily workflow?
                            </p>
                            <button className="w-full py-4 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-90 transition-all relative z-10">
                                Deploy System
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoPage;
