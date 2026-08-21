import React, { useState } from 'react';
import {
    Network,
    Server,
    Database,
    Layers,
    HardDrive,
    Cpu,
    Plus,
    Trash2,
    RotateCcw,
    Boxes
} from 'lucide-react';

export interface ArchitectureNode {
    id: string;
    type: 'GATEWAY' | 'LOAD_BALANCER' | 'SERVICE' | 'CACHE' | 'QUEUE' | 'DATABASE' | 'STORAGE';
    name: string;
    x: number;
    y: number;
    qps?: string;
    notes?: string;
}

export interface ArchitectureLink {
    id: string;
    from: string;
    to: string;
    label?: string;
}

interface Props {
    onArchitectureUpdate?: (summaryText: string) => void;
}

const DEFAULT_NODES: ArchitectureNode[] = [
    { id: '1', type: 'GATEWAY', name: 'API Gateway', x: 60, y: 140, qps: '100k QPS' },
    { id: '2', type: 'LOAD_BALANCER', name: 'Load Balancer', x: 240, y: 140, qps: '100k QPS' },
    { id: '3', type: 'SERVICE', name: 'Core Microservice', x: 440, y: 80, qps: '60k QPS' },
    { id: '4', type: 'CACHE', name: 'Redis Cache Cluster', x: 660, y: 50, qps: '120k read/sec' },
    { id: '5', type: 'QUEUE', name: 'Kafka Event Bus', x: 440, y: 220, qps: '40k msgs/sec' },
    { id: '6', type: 'DATABASE', name: 'PostgreSQL Shards', x: 660, y: 200, qps: '10k write/sec' },
];

const DEFAULT_LINKS: ArchitectureLink[] = [
    { id: 'l1', from: '1', to: '2', label: 'HTTP/2' },
    { id: 'l2', from: '2', to: '3', label: 'gRPC' },
    { id: 'l3', from: '3', to: '4', label: 'O(1) Cache' },
    { id: 'l4', from: '2', to: '5', label: 'Async Log' },
    { id: 'l5', from: '5', to: '6', label: 'Batch Write' },
];

export const HldWhiteboardCanvas: React.FC<Props> = ({ onArchitectureUpdate }) => {
    const [nodes, setNodes] = useState<ArchitectureNode[]>(DEFAULT_NODES);
    const [links, setLinks] = useState<ArchitectureLink[]>(DEFAULT_LINKS);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const getNodeColor = (type: ArchitectureNode['type']) => {
        switch (type) {
            case 'GATEWAY': return { border: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)', text: '#c7d2fe' };
            case 'LOAD_BALANCER': return { border: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', text: '#bae6fd' };
            case 'SERVICE': return { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', text: '#e9d5ff' };
            case 'CACHE': return { border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', text: '#fecdd3' };
            case 'QUEUE': return { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', text: '#fde68a' };
            case 'DATABASE': return { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', text: '#a7f3d0' };
            case 'STORAGE': return { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', text: '#cffafe' };
        }
    };

    const getNodeIcon = (type: ArchitectureNode['type']) => {
        switch (type) {
            case 'GATEWAY': return <Network size={16} />;
            case 'LOAD_BALANCER': return <Boxes size={16} />;
            case 'SERVICE': return <Cpu size={16} />;
            case 'CACHE': return <Layers size={16} />;
            case 'QUEUE': return <Server size={16} />;
            case 'DATABASE': return <Database size={16} />;
            case 'STORAGE': return <HardDrive size={16} />;
        }
    };

    const handleAddNode = (type: ArchitectureNode['type']) => {
        const id = `${Date.now()}`;
        const names: Record<ArchitectureNode['type'], string> = {
            GATEWAY: 'API Gateway',
            LOAD_BALANCER: 'L4/L7 Balancer',
            SERVICE: 'App Microservice',
            CACHE: 'Redis / Memcached',
            QUEUE: 'Kafka / RabbitMQ',
            DATABASE: 'SQL/NoSQL Store',
            STORAGE: 'Object Store (S3)'
        };

        const newNode: ArchitectureNode = {
            id,
            type,
            name: names[type],
            x: 200 + Math.random() * 200,
            y: 100 + Math.random() * 100,
            qps: '10k QPS'
        };

        const updated = [...nodes, newNode];
        setNodes(updated);
        notifyUpdate(updated, links);
    };

    const handleDeleteSelected = () => {
        if (!selectedNodeId) return;
        const updatedNodes = nodes.filter((n) => n.id !== selectedNodeId);
        const updatedLinks = links.filter((l) => l.from !== selectedNodeId && l.to !== selectedNodeId);
        setNodes(updatedNodes);
        setLinks(updatedLinks);
        setSelectedNodeId(null);
        notifyUpdate(updatedNodes, updatedLinks);
    };

    const handleReset = () => {
        setNodes(DEFAULT_NODES);
        setLinks(DEFAULT_LINKS);
        notifyUpdate(DEFAULT_NODES, DEFAULT_LINKS);
    };

    const notifyUpdate = (currentNodes: ArchitectureNode[], currentLinks: ArchitectureLink[]) => {
        if (!onArchitectureUpdate) return;
        let summary = 'Current System Architecture Canvas Nodes:\n';
        currentNodes.forEach((n) => {
            summary += `- [${n.type}] ${n.name} (Estimated Load: ${n.qps || 'N/A'})\n`;
        });
        summary += '\nData Flow Connections:\n';
        currentLinks.forEach((l) => {
            const fromNode = currentNodes.find((n) => n.id === l.from);
            const toNode = currentNodes.find((n) => n.id === l.to);
            if (fromNode && toNode) {
                summary += `- ${fromNode.name} -> ${toNode.name} (${l.label || 'Data Stream'})\n`;
            }
        });
        onArchitectureUpdate(summary);
    };

    // Dragging handlers
    const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
        setSelectedNodeId(nodeId);
        setDraggingNodeId(nodeId);
        const targetNode = nodes.find((n) => n.id === nodeId);
        if (targetNode) {
            setDragOffset({
                x: e.clientX - targetNode.x,
                y: e.clientY - targetNode.y
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingNodeId) return;
        setNodes((prev) =>
            prev.map((n) =>
                n.id === draggingNodeId
                    ? { ...n, x: Math.max(20, e.clientX - dragOffset.x), y: Math.max(20, e.clientY - dragOffset.y) }
                    : n
            )
        );
    };

    const handleMouseUp = () => {
        if (draggingNodeId) {
            setDraggingNodeId(null);
            notifyUpdate(nodes, links);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: '#040711',
                borderRadius: '8px',
                border: '1px solid #1e293b',
                overflow: 'hidden'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* Top Palette Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                background: '#090d16',
                borderBottom: '1px solid #1e293b',
                flexWrap: 'wrap',
                gap: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginRight: '6px' }}>
                        Add Component:
                    </span>
                    {(['GATEWAY', 'LOAD_BALANCER', 'SERVICE', 'CACHE', 'QUEUE', 'DATABASE', 'STORAGE'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => handleAddNode(t)}
                            style={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                color: '#cbd5e1',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <Plus size={12} /> {t.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                    {selectedNodeId && (
                        <button
                            onClick={handleDeleteSelected}
                            style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#f87171',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <Trash2 size={12} /> Delete Node
                        </button>
                    )}
                    <button
                        onClick={handleReset}
                        style={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            color: '#94a3b8',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <RotateCcw size={12} /> Reset Canvas
                    </button>
                </div>
            </div>

            {/* Interactive Canvas */}
            <div style={{
                flex: 1,
                position: 'relative',
                background: 'radial-gradient(#1e293b 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                minHeight: '380px',
                userSelect: 'none',
                overflow: 'hidden'
            }}>
                {/* SVG Connections */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {links.map((link) => {
                        const fromNode = nodes.find((n) => n.id === link.from);
                        const toNode = nodes.find((n) => n.id === link.to);
                        if (!fromNode || !toNode) return null;

                        const startX = fromNode.x + 80;
                        const startY = fromNode.y + 25;
                        const endX = toNode.x + 80;
                        const endY = toNode.y + 25;
                        const midX = (startX + endX) / 2;

                        return (
                            <g key={link.id}>
                                <path
                                    d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                                    fill="none"
                                    stroke="rgba(99, 102, 241, 0.5)"
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                />
                                <circle cx={midX} cy={(startY + endY) / 2} r="3" fill="#818cf8" />
                            </g>
                        );
                    })}
                </svg>

                {/* Nodes */}
                {nodes.map((node) => {
                    const style = getNodeColor(node.type);
                    const isSelected = node.id === selectedNodeId;

                    return (
                        <div
                            key={node.id}
                            onMouseDown={(e) => handleMouseDown(node.id, e)}
                            style={{
                                position: 'absolute',
                                left: `${node.x}px`,
                                top: `${node.y}px`,
                                width: '160px',
                                background: '#090d16',
                                border: `1.5px solid ${isSelected ? '#38bdf8' : style.border}`,
                                borderRadius: '8px',
                                padding: '10px 12px',
                                cursor: 'grab',
                                boxShadow: isSelected
                                    ? '0 0 16px rgba(56, 189, 248, 0.4)'
                                    : '0 4px 12px rgba(0, 0, 0, 0.5)',
                                transition: draggingNodeId === node.id ? 'none' : 'box-shadow 0.2s ease',
                                zIndex: isSelected ? 20 : 10
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: style.text, marginBottom: '4px' }}>
                                {getNodeIcon(node.type)}
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {node.name}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#94a3b8' }}>
                                <span>{node.type}</span>
                                {node.qps && (
                                    <span style={{ color: '#34d399', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                        {node.qps}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
