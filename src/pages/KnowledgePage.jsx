import React, { useState, useEffect, useRef } from 'react';
import { knowledge } from '../api';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    Brain,
    Search,
    Trash2,
    Activity,
    Clock,
    Globe,
    Network,
    BookOpen,
    RefreshCw,
    ZoomIn,
    ZoomOut,
    Maximize2,
    AlertCircle,
    ArrowRight,
    Sparkles,
    CheckCircle,
    FileText,
    TrendingUp,
    ListFilter
} from 'lucide-react';

// Color palette for concept nodes based on category
const CATEGORY_COLORS = {
    'Web Development': '#3b82f6', // Blue
    'Backend Development': '#6366f1', // Indigo
    'Database': '#a855f7', // Purple
    'Machine Learning': '#ec4899', // Pink
    'Data Science': '#f43f5e', // Rose
    'DevOps': '#f97316', // Orange
    'Cloud Computing': '#06b6d4', // Cyan
    'Programming': '#10b981', // Emerald
    'General': '#71717a', // Zinc
};

const CHART_COLORS = ['#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#71717a'];

export default function KnowledgePage() {
    // API data states
    const [graphData, setGraphData] = useState({ nodes: [], edges: [], stats: { total_nodes: 0, total_edges: 0 } });
    const [stats, setStats] = useState(null);
    const [sources, setSources] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [categories, setCategories] = useState([]);

    // UI/Filter states
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNode, setSelectedNode] = useState(null);
    const [nodeSummary, setNodeSummary] = useState('');
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ingestingDemo, setIngestingDemo] = useState(false);

    // Canvas references for physics rendering
    const canvasRef = useRef(null);
    const nodesRef = useRef([]); // Stores physics states of nodes: { id, x, y, vx, vy, ... }
    const edgesRef = useRef([]);
    const animationFrameRef = useRef(null);

    // Canvas interaction states
    const [zoomScale, setZoomScale] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const isPanningRef = useRef(false);
    const dragNodeRef = useRef(null);
    const startMouseRef = useRef({ x: 0, y: 0 });
    const panOffsetStartRef = useRef({ x: 0, y: 0 });

    // Load initial data
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Load graph, stats, sources, sessions, and categories in parallel
            const [graphRes, statsRes, sourcesRes, sessionsRes, topicsRes] = await Promise.all([
                knowledge.getGraph(selectedCategory === 'All' ? null : selectedCategory),
                knowledge.getStats(),
                knowledge.getSources({ limit: 10 }),
                knowledge.getSessions({ limit: 10 }),
                knowledge.getTopics()
            ]);

            setGraphData(graphRes);
            setStats(statsRes);
            setSources(sourcesRes);
            setSessions(sessionsRes);
            setCategories(topicsRes);

            // Re-initialize physics nodes when graphData changes
            initPhysicsNodes(graphRes.nodes, graphRes.edges);
        } catch (err) {
            console.error('[LCIE] Error loading page data:', err);
            setError('Failed to fetch knowledge graph. Ensure your backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedCategory]);

    // Setup force-directed node positioning
    const initPhysicsNodes = (newNodes, newEdges) => {
        const currentPhysicsNodes = nodesRef.current;
        const nodeMap = new Map(currentPhysicsNodes.map(n => [n.id, n]));

        const canvas = canvasRef.current;
        const width = canvas ? canvas.width : 800;
        const height = canvas ? canvas.height : 500;

        // Map and preserve coordinates if node existed, otherwise spread them out in the center
        nodesRef.current = newNodes.map((node, i) => {
            const existing = nodeMap.get(node.id);
            if (existing) {
                return { ...existing, ...node }; // Keep position/velocity
            } else {
                // Circular layout around center
                const angle = (i / Math.max(newNodes.length, 1)) * Math.PI * 2;
                const r = 50 + Math.random() * 100;
                return {
                    ...node,
                    x: width / 2 + Math.cos(angle) * r,
                    y: height / 2 + Math.sin(angle) * r,
                    vx: 0,
                    vy: 0,
                    radius: 12 + Math.min((node.encounter_count || 1) * 3, 25),
                };
            }
        });

        edgesRef.current = newEdges;
    };

    // Run physics simulation inside canvas loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const physicsLoop = () => {
            const width = canvas.width;
            const height = canvas.height;
            const nodes = nodesRef.current;
            const edges = edgesRef.current;

            // 1. Force Calculations
            // Coulomb Repulsion (push nodes apart)
            const kRepulsion = 150;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const u = nodes[i];
                    const v = nodes[j];
                    const dx = u.x - v.x;
                    const dy = u.y - v.y;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq) || 0.1;
                    if (dist < 220) {
                        const force = kRepulsion / dist;
                        u.vx += force * (dx / dist);
                        u.vy += force * (dy / dist);
                        v.vx -= force * (dx / dist);
                        v.vy -= force * (dy / dist);
                    }
                }
            }

            // Hooke's Law Spring Attraction (pull connected nodes together)
            const kSpring = 0.04;
            const restLength = 120;
            const nodeMap = new Map(nodes.map(n => [n.id, n]));

            edges.forEach(edge => {
                const u = nodeMap.get(edge.source_node_id);
                const v = nodeMap.get(edge.target_node_id);
                if (u && v) {
                    const dx = v.x - u.x;
                    const dy = v.y - u.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
                    const force = kSpring * (dist - restLength) * (edge.weight || 1.0);
                    u.vx += force * (dx / dist);
                    u.vy += force * (dy / dist);
                    v.vx -= force * (dx / dist);
                    v.vy -= force * (dy / dist);
                }
            });

            // Gravity (pull towards canvas center to avoid drifting off screen)
            const kGravity = 0.005;
            const cx = width / 2;
            const cy = height / 2;
            nodes.forEach(u => {
                const dx = cx - u.x;
                const dy = cy - u.y;
                u.vx += kGravity * dx;
                u.vy += kGravity * dy;
            });

            // Update Positions
            const damping = 0.85;
            nodes.forEach(u => {
                if (dragNodeRef.current && dragNodeRef.current.id === u.id) {
                    // Node is being dragged, pin to mouse position
                    // Position is updated in mouseMove handler
                    u.vx = 0;
                    u.vy = 0;
                } else {
                    u.x += u.vx;
                    u.y += u.vy;
                    u.vx *= damping;
                    u.vy *= damping;
                }
            });

            // 2. Rendering
            ctx.clearRect(0, 0, width, height);

            // Draw technical space background (dark grid)
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(zoomScale, zoomScale);

            // Sub grid
            ctx.strokeStyle = 'rgba(255,255,255,0.02)';
            ctx.lineWidth = 1;
            const gridSize = 40;
            const startGridX = Math.floor((-offsetX) / zoomScale / gridSize) * gridSize - gridSize;
            const endGridX = startGridX + (width / zoomScale) + gridSize * 2;
            const startGridY = Math.floor((-offsetY) / zoomScale / gridSize) * gridSize - gridSize;
            const endGridY = startGridY + (height / zoomScale) + gridSize * 2;

            for (let x = startGridX; x < endGridX; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, startGridY);
                ctx.lineTo(x, endGridY);
                ctx.stroke();
            }
            for (let y = startGridY; y < endGridY; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(startGridX, y);
                ctx.lineTo(endGridX, y);
                ctx.stroke();
            }

            // Draw Edges (relationships)
            edges.forEach((edge, idx) => {
                const source = nodeMap.get(edge.source_node_id);
                const target = nodeMap.get(edge.target_node_id);
                if (source && target) {
                    const isHoveredEdge = selectedNode && (selectedNode.id === source.id || selectedNode.id === target.id);
                    ctx.strokeStyle = isHoveredEdge ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)';
                    ctx.lineWidth = isHoveredEdge ? 2 : 1;

                    // Draw line
                    ctx.beginPath();
                    ctx.moveTo(source.x, source.y);
                    ctx.lineTo(target.x, target.y);
                    ctx.stroke();

                    // Draw relationship particle flow (premium micro-animation)
                    const particleSpeed = 1500; // ms
                    const timeParam = (Date.now() / particleSpeed + idx * 0.2) % 1.0;
                    const px = source.x + (target.x - source.x) * timeParam;
                    const py = source.y + (target.y - source.y) * timeParam;

                    ctx.fillStyle = isHoveredEdge ? '#ffffff' : '#a855f7'; // Purple flow or White glow
                    ctx.beginPath();
                    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Draw Nodes
            nodes.forEach(node => {
                const color = CATEGORY_COLORS[node.category] || CATEGORY_COLORS['General'];
                const isSelected = selectedNode && selectedNode.id === node.id;
                const isSearched = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

                // Glowing background shadow
                if (isSelected || isSearched) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 15;
                } else {
                    ctx.shadowBlur = 0;
                }

                // Draw central circle
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0; // Reset shadow

                // Mastery ring border
                ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.15)';
                ctx.lineWidth = isSelected ? 3 : 1.5;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
                ctx.stroke();

                // Draw mastery fill indicator on outer ring
                const masteryAngle = (node.mastery_level || 0) * Math.PI * 2;
                if (masteryAngle > 0) {
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    // Draw arc representing level
                    ctx.arc(node.x, node.y, node.radius + 4, -Math.PI / 2, -Math.PI / 2 + masteryAngle);
                    ctx.stroke();
                }

                // Draw Node text (adjusted by zoom level)
                ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)';
                ctx.font = isSelected
                    ? 'bold 12px "Outfit", sans-serif'
                    : '500 10px "Outfit", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(node.name, node.x, node.y + node.radius + 10);
            });

            ctx.restore();

            // Loop animation
            animationFrameRef.current = requestAnimationFrame(physicsLoop);
        };

        // Initialize size
        const resizeCanvas = () => {
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = 420;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Start loop
        animationFrameRef.current = requestAnimationFrame(physicsLoop);

        return () => {
            cancelAnimationFrame(animationFrameRef.current);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [zoomScale, offsetX, offsetY, selectedNode, searchQuery]);

    // Translate client mouse position to Graph (Canvas) coordinates
    const getGraphCoords = (clientX, clientY) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        return {
            x: (mouseX - offsetX) / zoomScale,
            y: (mouseY - offsetY) / zoomScale
        };
    };

    // Canvas Interactions
    const handleMouseDown = (e) => {
        if (e.button !== 0) return; // Left click only
        const coords = getGraphCoords(e.clientX, e.clientY);

        // Check if we hit a node
        const hit = nodesRef.current.find(node => {
            const dx = node.x - coords.x;
            const dy = node.y - coords.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist <= node.radius + 8;
        });

        if (hit) {
            dragNodeRef.current = hit;
            setSelectedNode(hit);
            setNodeSummary(''); // Reset summary view
            // Check if node already has a summary, generate it on click if desired, or let user click button
        } else {
            // Start panning
            isPanningRef.current = true;
            startMouseRef.current = { x: e.clientX, y: e.clientY };
            panOffsetStartRef.current = { x: offsetX, y: offsetY };
        }
    };

    const handleMouseMove = (e) => {
        const coords = getGraphCoords(e.clientX, e.clientY);

        if (dragNodeRef.current) {
            // Update node coordinate
            dragNodeRef.current.x = coords.x;
            dragNodeRef.current.y = coords.y;
        } else if (isPanningRef.current) {
            const dx = e.clientX - startMouseRef.current.x;
            const dy = e.clientY - startMouseRef.current.y;
            setOffsetX(panOffsetStartRef.current.x + dx);
            setOffsetY(panOffsetStartRef.current.y + dy);
        }
    };

    const handleMouseUp = () => {
        dragNodeRef.current = null;
        isPanningRef.current = false;
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const zoomIntensity = 0.08;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom calculations centered on mouse
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoomFactor = Math.exp(wheel * zoomIntensity);

        const nextZoom = Math.min(Math.max(zoomScale * zoomFactor, 0.15), 4.0);

        setOffsetX(mouseX - (mouseX - offsetX) * (nextZoom / zoomScale));
        setOffsetY(mouseY - (mouseY - offsetY) * (nextZoom / zoomScale));
        setZoomScale(nextZoom);
    };

    // Zoom Controls
    const zoomIn = () => {
        setZoomScale(prev => Math.min(prev * 1.25, 4.0));
    };

    const zoomOut = () => {
        setZoomScale(prev => Math.max(prev / 1.25, 0.15));
    };

    const resetZoom = () => {
        setZoomScale(1.0);
        setOffsetX(0);
        setOffsetY(0);
    };

    // Node API operations
    const handleGenerateSummary = async (nodeId) => {
        setGeneratingSummary(true);
        setNodeSummary('');
        try {
            const res = await knowledge.getNodeSummary(nodeId);
            setNodeSummary(res.summary);
        } catch (err) {
            console.error('[LCIE] Error generating summary:', err);
            setNodeSummary('Failed to generate summary. Verify model settings.');
        } finally {
            setGeneratingSummary(false);
        }
    };

    const handleDeleteNode = async (nodeId) => {
        if (!window.confirm(`Are you sure you want to forget this concept? This deletes its graph nodes and relationships.`)) {
            return;
        }
        try {
            await knowledge.deleteNode(nodeId);
            setSelectedNode(null);
            loadData();
        } catch (err) {
            console.error('[LCIE] Error deleting node:', err);
            alert('Failed to delete node.');
        }
    };

    // Ingest Demo Data Utility (for test verification without extension)
    const handleIngestDemoData = async () => {
        setIngestingDemo(true);
        try {
            const samplePayloads = [
                {
                    url: 'https://react.dev/reference/react/useEffect',
                    page_title: 'Synchronizing with Effects – React',
                    domain: 'react.dev',
                    source_type: 'documentation',
                    content: 'useEffect is a React Hook that lets you synchronize a component with an external system. Some Components need to synchronize with external systems. For example, you might want to control a non-React component, set up a server connection, or send an analytics log when a component appears on the screen. Effects let you run some code after rendering so that you can synchronize your component with some system outside of React.',
                    detected_languages: ['javascript', 'typescript'],
                    detected_technologies: ['react', 'vite'],
                    headings: ['useEffect', 'Parameters', 'Setup code', 'Cleanups', 'Connecting to Chat Room'],
                    learning_intent: 'learning',
                    estimated_reading_minutes: 5
                },
                {
                    url: 'https://dbms-tutorials.com/joins/normalization',
                    page_title: 'Database Normalization: 1NF, 2NF, 3NF and BCNF Explained',
                    domain: 'dbms-tutorials.com',
                    source_type: 'tutorial',
                    content: 'Database normalization is the process of structuring a database, usually a relational database, in accordance with a series of so-called normal forms in order to reduce data redundancy and improve data integrity. It was first proposed by Edgar F. Codd. We will study Joins, primary keys, foreign keys, and dependency mappings to achieve Third Normal Form (3NF). Normalization prevents update anomalies, insertion anomalies, and deletion anomalies.',
                    detected_languages: ['sql'],
                    detected_technologies: ['postgresql', 'mysql'],
                    headings: ['Normalization Overview', 'First Normal Form 1NF', 'Second Normal Form 2NF', 'Third Normal Form 3NF', 'Primary Keys', 'Data Anomalies'],
                    learning_intent: 'interview_prep',
                    estimated_reading_minutes: 8
                },
                {
                    url: 'https://fastapi.tiangolo.com/tutorial/bigger-applications/',
                    page_title: 'Bigger Applications - Multiple Files - FastAPI',
                    domain: 'fastapi.tiangolo.com',
                    source_type: 'documentation',
                    content: 'FastAPI provides APIRouter to structure larger applications into multiple files. You can create router definitions, include path parameters, and configure API sub-routes. We will mount router modules, pass dependency injections, and handle auth protocols like OAuth2.0 and JWT verification to secure all paths.',
                    detected_languages: ['python'],
                    detected_technologies: ['fastapi', 'uvicorn', 'pydantic'],
                    headings: ['APIRouter', 'Path Parameters', 'Dependency Injection', 'JWT security', 'Bigger Applications'],
                    learning_intent: 'project_dev',
                    estimated_reading_minutes: 6
                }
            ];

            for (const payload of samplePayloads) {
                await knowledge.ingest(payload);
            }

            alert('Ingestion queued! 3 demo educational pages are processing in the background. Wait 3-5 seconds and click Refresh.');
            loadData();
        } catch (err) {
            console.error('[LCIE] Demo ingestion failed:', err);
            alert('Failed to trigger demo ingestion.');
        } finally {
            setIngestingDemo(false);
        }
    };

    // Prepare recharts data
    const pieData = stats?.categories?.map((cat, i) => ({
        name: cat.name || 'General',
        value: cat.count,
        color: CHART_COLORS[i % CHART_COLORS.length]
    })) || [];

    const masteryData = stats?.mastery_overview ? [
        { name: 'Beginner (<0.25)', value: stats.mastery_overview.beginner, fill: '#71717a' },
        { name: 'Developing (<0.50)', value: stats.mastery_overview.developing, fill: '#3b82f6' },
        { name: 'Proficient (<0.75)', value: stats.mastery_overview.proficient, fill: '#8b5cf6' },
        { name: 'Mastered (>=0.75)', value: stats.mastery_overview.mastered, fill: '#10b981' },
    ] : [];

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl animate-in font-outfit">
            
            {/* Header section */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">LCIE / Intelligence Engine</span>
                    </div>
                    <h1 className="text-4xl font-light tracking-tight text-white mb-2">
                        Learning <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Knowledge Graph</span>
                    </h1>
                    <p className="text-zinc-500 text-[13px] font-light tracking-wide max-w-xl">
                        Synthesizes browsing habits, tutorials, and documentation into a dynamic concept network, automatically filtering noise from structure.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleIngestDemoData}
                        disabled={ingestingDemo}
                        className="px-5 py-2.5 rounded-2xl bg-zinc-900 border border-white/5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <Sparkles size={13} />
                        {ingestingDemo ? 'Queuing Demo...' : 'Demo Ingestion'}
                    </button>
                    <button
                        onClick={loadData}
                        className="p-3 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
                        title="Reload Graph"
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Filters & Search controls */}
            <div className="flex flex-col md:flex-row gap-5 items-center justify-between mb-8">
                {/* Category Pill Filters */}
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mr-2 flex items-center gap-1.5">
                        <ListFilter size={12} /> Filter:
                    </span>
                    {['All', ...categories.map(c => c.category)].slice(0, 7).map((cat) => (
                        <button
                            key={cat}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${
                                selectedCategory === cat
                                    ? 'bg-white text-black font-extrabold shadow-md'
                                    : 'bg-zinc-900 text-zinc-500 hover:text-white border border-white/5'
                            }`}
                            onClick={() => {
                                setSelectedCategory(cat);
                                setSelectedNode(null);
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Search Inputs */}
                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="SEARCH GRAPH CONCEPTS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/60 border border-white/5 focus:border-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl py-3 px-5 pl-11 focus:outline-none placeholder-zinc-700 transition-all"
                    />
                    <Search className="absolute left-4 top-3 text-zinc-600" size={14} />
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* MAIN GRAPH PANE + INSPECTOR GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                
                {/* Left Graph Pane */}
                <div className="lg:col-span-8 bg-zinc-900/40 border border-white/5 rounded-[40px] shadow-3xl overflow-hidden relative group">
                    <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/5 text-[9px] font-bold tracking-widest text-zinc-400 rounded-full flex items-center gap-2">
                            <Network size={11} className="text-indigo-400" />
                            {graphData.nodes.length} Concepts Linked
                        </span>
                        {selectedCategory !== 'All' && (
                            <span className="px-3 py-1 bg-white/10 text-white text-[9px] font-bold tracking-widest rounded-full">
                                {selectedCategory}
                            </span>
                        )}
                    </div>

                    {/* Canvas Controls */}
                    <div className="absolute top-6 right-6 z-10 flex gap-1">
                        <button onClick={zoomIn} className="p-2 bg-black/60 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white rounded-lg transition-all" title="Zoom In"><ZoomIn size={14} /></button>
                        <button onClick={zoomOut} className="p-2 bg-black/60 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white rounded-lg transition-all" title="Zoom Out"><ZoomOut size={14} /></button>
                        <button onClick={resetZoom} className="p-2 bg-black/60 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white rounded-lg transition-all" title="Fit to Screen"><Maximize2 size={14} /></button>
                    </div>

                    {/* Instructions hint */}
                    <div className="absolute bottom-6 left-6 z-10 text-[8px] font-semibold tracking-widest text-zinc-600 uppercase pointer-events-none">
                        Drag nodes to study • Click to inspect • Scroll to zoom
                    </div>

                    {/* Interactive Canvas Viewport */}
                    <div className="relative w-full h-[420px] bg-black/50 cursor-grab active:cursor-grabbing">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onWheel={handleWheel}
                            className="block w-full h-full"
                        />

                        {graphData.nodes.length === 0 && !loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-center">
                                <Brain size={48} className="text-zinc-700 mb-4 animate-pulse" />
                                <h3 className="text-lg font-medium text-white mb-2">No concepts indexed yet</h3>
                                <p className="text-xs text-zinc-500 max-w-sm mb-6 leading-relaxed">
                                    Your personal knowledge graph is empty. Open browser pages, read documentation, or click the 'Demo Ingestion' button to backfill sample concept paths.
                                </p>
                                <button
                                    onClick={handleIngestDemoData}
                                    disabled={ingestingDemo}
                                    className="px-6 py-2 bg-white text-black font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all text-[9px] disabled:opacity-50"
                                >
                                    {ingestingDemo ? 'Queuing Demo Concepts...' : 'Load Sample Graph Data'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side Concept Inspector */}
                <div className="lg:col-span-4 bg-zinc-900 border border-white/5 p-8 rounded-[40px] shadow-3xl flex flex-col min-h-[420px]">
                    {selectedNode ? (
                        <div className="flex-1 flex flex-col h-full animate-in justify-between">
                            
                            {/* Concept Head */}
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-[8px] font-bold uppercase tracking-widest text-zinc-400 rounded-lg">
                                            {selectedNode.node_type || 'concept'}
                                        </span>
                                        <h3 className="text-xl font-semibold tracking-tight text-white mt-3 leading-snug">
                                            {selectedNode.name}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteNode(selectedNode.id)}
                                        className="p-2.5 text-zinc-600 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-xl transition-all"
                                        title="Forget Concept"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>

                                {/* Node Details Stats */}
                                <div className="grid grid-cols-2 gap-4 bg-black/40 p-4 rounded-3xl border border-white/5 mb-6 text-xs">
                                    <div>
                                        <div className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest mb-1">Category</div>
                                        <div className="text-white truncate font-medium">{selectedNode.category || 'General'}</div>
                                    </div>
                                    <div>
                                        <div className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest mb-1">Encounters</div>
                                        <div className="text-white font-medium">{selectedNode.encounter_count || 1} Times</div>
                                    </div>
                                </div>

                                {/* Mastery level visual bar */}
                                <div className="mb-6 bg-black/20 p-4 rounded-3xl border border-white/5">
                                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest mb-2">
                                        <span className="text-zinc-500">Mastery Level</span>
                                        <span className="text-white">{(selectedNode.mastery_level * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                            style={{ width: `${selectedNode.mastery_level * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[7.5px] text-zinc-600 font-medium tracking-wide mt-2 block leading-relaxed">
                                        Encountering concepts in multiple websites increases mastery calibration.
                                    </span>
                                </div>

                                {/* On Demand Summary Generation */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">AI SUMMARY BASELINE</span>
                                        <button
                                            onClick={() => handleGenerateSummary(selectedNode.id)}
                                            disabled={generatingSummary}
                                            className="text-indigo-400 hover:text-white disabled:text-zinc-600 text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer disabled:pointer-events-none transition-all"
                                        >
                                            <Sparkles size={11} className={generatingSummary ? 'animate-spin' : ''} />
                                            {generatingSummary ? 'Synthesizing...' : 'Generate On Demand'}
                                        </button>
                                    </div>

                                    {nodeSummary ? (
                                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-3xl text-zinc-400 text-xs leading-relaxed max-h-40 overflow-y-auto custom-scrollbar font-light whitespace-pre-line animate-in">
                                            {nodeSummary}
                                        </div>
                                    ) : (
                                        <div className="p-5 border border-dashed border-white/5 rounded-3xl text-center">
                                            <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">
                                                No summary cached. Summaries are created dynamically on-demand.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Context Snippets (provenance) */}
                                <div>
                                    <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest block mb-3">CONTEXT EXCERPTS</span>
                                    {selectedNode.context_snippets && selectedNode.context_snippets.length > 0 ? (
                                        <div className="flex flex-col gap-2 max-h-28 overflow-y-auto custom-scrollbar">
                                            {selectedNode.context_snippets.map((snip, i) => (
                                                <div key={i} className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] text-zinc-500 font-light italic">
                                                    "{snip.length > 120 ? snip.substring(0, 120) + '...' : snip}"
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[9px] font-semibold text-zinc-700 uppercase tracking-widest">No context snippets logged.</p>
                                    )}
                                </div>

                            </div>

                            <button
                                onClick={() => setSelectedNode(null)}
                                className="w-full mt-6 py-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white hover:text-black hover:border-white text-zinc-400 text-[9px] font-bold uppercase tracking-widest transition-all"
                            >
                                Back to Analytics
                            </button>

                        </div>
                    ) : (
                        // If no node selected, show general stats & graphs
                        <div className="flex-1 flex flex-col justify-between animate-in">
                            <div>
                                <h3 className="text-lg font-semibold tracking-tight text-white mb-6">Graph Intelligence</h3>
                                
                                {/* Micro stats summary */}
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Concepts (Nodes)</span>
                                        <span className="text-white text-sm font-semibold tabular-nums">{stats?.total_nodes || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Relationships (Edges)</span>
                                        <span className="text-white text-sm font-semibold tabular-nums">{stats?.total_edges || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Sources Audited</span>
                                        <span className="text-white text-sm font-semibold tabular-nums">{stats?.total_sources || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Total Learning Time</span>
                                        <span className="text-white text-sm font-semibold tabular-nums">{stats?.total_learning_minutes || 0} Min</span>
                                    </div>
                                </div>

                                {/* Recharts Category split pie */}
                                {pieData.length > 0 ? (
                                    <div className="mb-6">
                                        <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest block mb-4">Category Distribution</span>
                                        <div className="h-44 w-full flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={45}
                                                        outerRadius={65}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                                                        itemStyle={{ color: '#fff', textTransform: 'uppercase' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {/* Legend key */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2 max-h-20 overflow-y-auto custom-scrollbar">
                                            {pieData.slice(0, 6).map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5 text-[8px] font-semibold text-zinc-500 uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span>{item.name}: {item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-10 text-center border border-dashed border-white/5 rounded-3xl">
                                        <p className="text-[9px] font-semibold text-zinc-700 uppercase tracking-widest">No Category Data</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-zinc-900 border border-white/5 rounded-3xl text-zinc-600 text-[8px] leading-relaxed uppercase tracking-wider font-semibold">
                                Browse tutorials, StackOverflow, or frameworks. The extension intercepts education urls to compile this node network automatically.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* BOTTOM SEGMENT: STATS GRID & LISTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                
                {/* Mastery Distribution Chart */}
                <div className="bg-zinc-900 border border-white/5 p-10 rounded-[40px] shadow-3xl">
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-2">Mastery Calibration</h3>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em]">Concepts classified by mastery index</p>
                    </div>

                    {masteryData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={masteryData}>
                                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#52525b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#52525b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                        itemStyle={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                    />
                                    <Bar dataKey="value" name="Concepts Count" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center border border-dashed border-white/5 rounded-3xl">
                            <p className="text-[9px] font-semibold text-zinc-700 uppercase tracking-widest">No Mastery Metrics Available</p>
                        </div>
                    )}
                </div>

                {/* Top Concepts by Encounter Count */}
                <div className="bg-zinc-900 border border-white/5 p-10 rounded-[40px] shadow-3xl">
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white mb-2">Top Concepts</h3>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em]">Highest encounter frequencies</p>
                    </div>

                    {stats?.top_concepts && stats.top_concepts.length > 0 ? (
                        <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                            {stats.top_concepts.slice(0, 5).map((concept, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3.5 bg-black/20 hover:bg-black/40 border border-white/5 rounded-2xl transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-semibold">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">{concept.name}</h4>
                                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{concept.category || 'General'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-white text-xs font-semibold tabular-nums block">{concept.encounters} Hits</span>
                                        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">{(concept.mastery * 100).toFixed(0)}% Mastery</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center border border-dashed border-white/5 rounded-3xl">
                            <p className="text-[9px] font-semibold text-zinc-700 uppercase tracking-widest">No Top Concepts Available</p>
                        </div>
                    )}
                </div>

            </div>

            {/* AUDITED SOURCES LOG TABLE */}
            <div className="bg-zinc-900 border border-white/5 rounded-[40px] overflow-hidden shadow-3xl mb-12">
                <div className="p-10 border-b border-white/5 bg-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-xl font-semibold text-white mb-1 flex items-center gap-3">
                            <Globe size={20} className="text-zinc-500" /> Audited Educational Sources
                        </h3>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em]">Provenance trace representing learning feeds</p>
                    </div>
                </div>

                {sources.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-600 border-b border-white/5 bg-black/20">
                                    <th className="pl-10 pr-4 py-6">Source Website / Title</th>
                                    <th className="px-4 py-6">Category / Domain</th>
                                    <th className="px-4 py-6">Learning Intent</th>
                                    <th className="px-4 py-6 text-center">AI confidence</th>
                                    <th className="px-4 py-6 text-center">Reading Time</th>
                                    <th className="pr-10 pl-4 py-6 text-right">Extracted Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sources.map((source, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        
                                        {/* Source Title & link */}
                                        <td className="pl-10 pr-4 py-6 max-w-sm">
                                            <div className="flex items-center gap-3">
                                                <FileText size={15} className="text-zinc-600 flex-shrink-0" />
                                                <div className="truncate">
                                                    <a
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-semibold text-white hover:text-indigo-400 transition-all truncate block"
                                                        title={source.page_title}
                                                    >
                                                        {source.page_title}
                                                    </a>
                                                    <span className="text-[8px] text-zinc-500 font-light truncate block mt-0.5">{source.url}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Category/Domain */}
                                        <td className="px-4 py-6">
                                            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{source.domain}</div>
                                            <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">{source.content_type || 'webpage'}</span>
                                        </td>

                                        {/* Inferred learning intent */}
                                        <td className="px-4 py-6">
                                            <span className="px-2.5 py-1 rounded-full text-[8.5px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                                {source.learning_intent || 'learning'}
                                            </span>
                                        </td>

                                        {/* Confidence of extraction */}
                                        <td className="px-4 py-6 text-center">
                                            <span className={`text-xs font-semibold tabular-nums ${
                                                source.ai_confidence >= 0.75 ? 'text-emerald-400' :
                                                source.ai_confidence >= 0.55 ? 'text-amber-400' : 'text-zinc-500'
                                            }`}>
                                                {source.ai_confidence > 0 ? `${(source.ai_confidence * 100).toFixed(0)}%` : 'Rule-Based'}
                                            </span>
                                        </td>

                                        {/* Reading time */}
                                        <td className="px-4 py-6 text-center font-medium text-white text-xs tabular-nums">
                                            {source.estimated_reading_minutes || 0} Min
                                        </td>

                                        {/* Date */}
                                        <td className="pr-10 pl-4 py-6 text-right text-[10px] font-semibold text-zinc-500 tabular-nums uppercase">
                                            {new Date(source.created_at).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-12 text-center border-t border-white/5">
                        <p className="text-[10px] font-semibold text-zinc-700 uppercase tracking-widest">No educational sources analyzed yet.</p>
                    </div>
                )}
            </div>
            
        </div>
    );
}
