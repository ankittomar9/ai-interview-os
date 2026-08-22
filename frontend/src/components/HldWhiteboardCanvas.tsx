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
import { Button } from './ui/Button';

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
      case 'GATEWAY': return { border: 'border-primary-2', text: 'text-primary-2' };
      case 'LOAD_BALANCER': return { border: 'border-sky-400', text: 'text-sky-300' };
      case 'SERVICE': return { border: 'border-purple-400', text: 'text-purple-300' };
      case 'CACHE': return { border: 'border-rose-400', text: 'text-rose-300' };
      case 'QUEUE': return { border: 'border-warning', text: 'text-warning' };
      case 'DATABASE': return { border: 'border-success', text: 'text-success' };
      case 'STORAGE': return { border: 'border-cyan-400', text: 'text-cyan-300' };
    }
  };

  const getNodeIcon = (type: ArchitectureNode['type']) => {
    switch (type) {
      case 'GATEWAY': return <Network className="w-4 h-4 shrink-0" />;
      case 'LOAD_BALANCER': return <Boxes className="w-4 h-4 shrink-0" />;
      case 'SERVICE': return <Cpu className="w-4 h-4 shrink-0" />;
      case 'CACHE': return <Layers className="w-4 h-4 shrink-0" />;
      case 'QUEUE': return <Server className="w-4 h-4 shrink-0" />;
      case 'DATABASE': return <Database className="w-4 h-4 shrink-0" />;
      case 'STORAGE': return <HardDrive className="w-4 h-4 shrink-0" />;
    }
  };

  const handleAddNode = (type: ArchitectureNode['type']) => {
    const nextIdx = nodes.length + 1;
    const id = `node_${nextIdx}_${type.toLowerCase()}`;
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
      x: 200 + ((nextIdx * 50) % 250),
      y: 80 + ((nextIdx * 40) % 180),
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
      className="flex flex-col h-full bg-surface rounded-lg border border-border overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Palette Bar */}
      <div className="flex items-center justify-between p-2.5 bg-elevated border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-text-3 mr-1">
            Add Component:
          </span>
          {(['GATEWAY', 'LOAD_BALANCER', 'SERVICE', 'CACHE', 'QUEUE', 'DATABASE', 'STORAGE'] as const).map((t) => (
            <Button
              key={t}
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3 h-3" />}
              onClick={() => handleAddNode(t)}
            >
              {t.replace('_', ' ')}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {selectedNodeId && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-3 h-3" />}
              onClick={handleDeleteSelected}
            >
              Delete Node
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="w-3 h-3" />}
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Interactive Canvas Area */}
      <div className="flex-1 relative bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] min-h-[380px] overflow-hidden">
        {/* SVG Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
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
                  stroke="var(--color-primary-2)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeOpacity="0.6"
                />
                <circle cx={midX} cy={(startY + endY) / 2} r="3.5" fill="var(--color-primary-2)" />
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const colors = getNodeColor(node.type);
          const isSelected = node.id === selectedNodeId;

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleMouseDown(node.id, e)}
              className={`absolute w-40 bg-surface rounded-lg p-2.5 cursor-grab border transition-shadow ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/20 z-20'
                  : `${colors.border} shadow-md shadow-black/40 z-10 hover:border-primary-2`
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`
              }}
            >
              <div className={`flex items-center gap-2 ${colors.text} mb-1`}>
                {getNodeIcon(node.type)}
                <span className="text-xs font-bold truncate">
                  {node.name}
                </span>
              </div>

              <div className="flex justify-between items-center text-[10px] text-text-3">
                <span>{node.type}</span>
                {node.qps && (
                  <span className="text-success font-semibold font-mono">
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
