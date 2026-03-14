import React from 'react';
import InfoPage from './InfoPage';
import { Target, Shield, Cpu, Zap, BookOpen } from 'lucide-react';

export const ManifestoPage = () => (
    <InfoPage 
        title="The Manifesto" 
        subtitle="The philosophical kernel of the Polaris protocol. Why we exist and how we think."
        icon={BookOpen}
        content={[
            {
                heading: "Tactical Sovereignty",
                text: "We believe in the absolute sovereignty of individual attention. In an age of algorithmic distraction, reclaiming control of your focus is the ultimate act of rebellion.",
                list: ["Attention as Currency", "Cognitive Independence", "Protocol-First Living"]
            },
            {
                heading: "The Performance Loop",
                text: "Growth is not a destination but a continuous recursive function. We implement systems that measure, analyze, and optimize every facet of human experience.",
                list: ["Data-Driven Evolution", "Recursive Learning", "Feedback Optimization"]
            }
        ]}
    />
);

export const PrivacyPage = () => (
    <InfoPage 
        title="Privacy Specification" 
        subtitle="Zero-knowledge architecture. Your data never leaves your local environment without explicit authorization."
        icon={Shield}
        content={[
            {
                heading: "Local-First Persistence",
                text: "All activity tracking, browser logs, and personal metrics are stored in your localized database. We do not use third-party analytics.",
                list: ["End-to-End Encryption", "Zero Cloud Reliance", "Self-Destruct Sequences"]
            },
            {
                heading: "Transparency Core",
                text: "The underlying logic for our privacy filter is open and inspectable. We believe in trust through verification, not faith.",
                list: ["Open Source Protocols", "Manual Audit Tools", "Granular Permissions"]
            }
        ]}
    />
);

export const LogsPage = () => (
    <InfoPage 
        title="Kernel Logs" 
        subtitle="Historical record of system updates, performance patches, and architectural evolution."
        icon={Cpu}
        content={[
            {
                heading: "Patch 4.2.0-Alpha",
                text: "Implemented the Neural Matrix v2 for improved YouTube classification and faster study plan generation.",
                list: ["30% Latency Reduction", "Improved NLP Accuracy", "Enhanced WebSocket Stability"]
            },
            {
                heading: "System Resilience",
                text: "Hardened the local database against corruption during unexpected system terminations.",
                list: ["WAL Logging Enabled", "Auto-Backup Sequences", "Integrity Checksums"]
            }
        ]}
    />
);

export const OptimizationPage = () => (
    <InfoPage 
        title="Optimization Engine" 
        subtitle="Advanced algorithms for performance tuning and cognitive load balancing."
        icon={Zap}
        content={[
            {
                heading: "Dynamic Scheduling",
                text: "The system automatically adjusts learning paths based on your current focus levels and historical performance data.",
                list: ["Adaptive Difficulty", "Flow-State Detection", "Load Distribution"]
            },
            {
                heading: "Resource Allocation",
                text: "Minimize overhead by prioritizing essential tasks and backgrounding non-critical background processes.",
                list: ["Memory Management", "Tactical Prioritization", "Energy Efficiency"]
            }
        ]}
    />
);

export const SecurityPage = () => (
    <InfoPage 
        title="Security Core" 
        subtitle="Hardened architecture designed to protect your cognitive environment from external interference."
        icon={Shield}
        content={[
            {
                heading: "Intrusion Prevention",
                text: "Real-time monitoring of distraction vectors and malicious algorithmic patterns designed to hijack your dopamine system.",
                list: ["Ad-Block Integration", "Distraction Filtering", "Hostile URL Blocking"]
            },
            {
                heading: "Identity Protection",
                text: "Biometric and multi-factor authentication sequences ensuring that only authorized operators can access the system core.",
                list: ["Encrypted Auth Tokens", "Session Hijack Protection", "Hardware Key Support"]
            }
        ]}
    />
);
