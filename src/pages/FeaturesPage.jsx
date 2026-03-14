import React from 'react';
import { Zap, Target, Cpu, Shield, BarChart3, Clock, Layout, Fingerprint } from 'lucide-react';

const FeaturesPage = () => {
    const features = [
        {
            icon: <BarChart3 />,
            title: "Advanced Analytics",
            description: "Visualize your entire digital life in one sleek, modern interface. Track everything from habits to progress."
        },
        {
            icon: <Clock />,
            title: "Smart Productivity",
            description: "Our intelligent engine analyzes your focus patterns and helps you optimize your deep work sessions."
        },
        {
            icon: <Cpu />,
            title: "Learning Matrix",
            description: "A comprehensive hub for all your educational content, organized by priority and complexity."
        },
        {
            icon: <Target />,
            title: "Goal Tracking",
            description: "Set ambitious goals and watch your progress with beautiful charts and milestone tracking."
        },
        {
            icon: <Shield />,
            title: "Parental Privacy",
            description: "Secure, non-intrusive monitoring tools that help balance freedom with safety and focus."
        },
        {
            icon: <Layout />,
            title: "Modular Layout",
            description: "Customize your dashboard your way. Drag, drop, and resize components to fit your workflow."
        },
        {
            icon: <Fingerprint />,
            title: "Secure Data",
            description: "Your data stays yours. We use peak encryption to ensure your digital life is for your eyes only."
        },
        {
            icon: <Zap />,
            title: "Lightning Fast",
            description: "Built with the latest technology for a zero-lag experience, no matter how much data you track."
        }
    ];

    return (
        <div className="bg-black min-h-screen pt-24 pb-24 selection:bg-white selection:text-black font-outfit">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="text-center max-w-2xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-block px-4 py-1.5 border border-white/10 rounded-full mb-6 text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500">
                        System Capability Matrix
                    </div>
                    <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-tight text-white leading-none">
                        Peak <span className="font-semibold">Performance</span>
                    </h1>
                    <p className="text-zinc-500 font-light tracking-wide text-[14px] leading-relaxed">
                        Explore the high-fidelity tools engineered to synchronize your focus, mastery, and digital dominance within the POLARIS ecosystem.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {features.map((feature, index) => (
                        <div key={index} className="p-10 bg-zinc-900 border border-white/5 rounded-[40px] hover:border-white/20 transition-all group shadow-2xl">
                            <div className="text-white mb-8 bg-white/5 border border-white/5 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                                {React.cloneElement(feature.icon, { size: 18 })}
                            </div>
                            <h3 className="text-[17px] font-medium text-white tracking-tight mb-4">
                                {feature.title}
                            </h3>
                            <p className="text-zinc-500 text-[13px] font-light leading-relaxed tracking-wide">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeaturesPage;
