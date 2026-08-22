import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  BackgroundVariant
} from '@xyflow/react';
import type { Connection, Edge, Node, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toBlob, toPng } from 'html-to-image';
import {
  Network,
  Server,
  Database,
  Layers,
  HardDrive,
  Cpu,
  Boxes,
  Trash2,
  RotateCcw,
  Download,
  Save,
  Sparkles,
  Calculator,
  CheckCircle2,
  X,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { Input } from './ui/Input';
import {
  uploadCanvasPngAttachment,
  uploadCanvasJsonAttachment,
  evaluateArchitectureDesign,
  addMessageToSession
} from '../services/api';
import type { ModelProvider, DesignEvaluateResponse } from '../types';

export type NodeType = 'GATEWAY' | 'LOAD_BALANCER' | 'SERVICE' | 'CACHE' | 'QUEUE' | 'DATABASE' | 'STORAGE';

export interface ArchitectureNodeData {
  type: NodeType;
  name: string;
  qps?: string;
  notes?: string;
}

interface Props {
  sessionId?: number;
  provider?: ModelProvider;
  apiKey?: string;
  onArchitectureUpdate?: (summaryText: string) => void;
}

const getNodeStyle = (type: NodeType) => {
  switch (type) {
    case 'GATEWAY': return { border: 'border-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-500/10' };
    case 'LOAD_BALANCER': return { border: 'border-sky-500', text: 'text-sky-400', bg: 'bg-sky-500/10' };
    case 'SERVICE': return { border: 'border-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10' };
    case 'CACHE': return { border: 'border-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10' };
    case 'QUEUE': return { border: 'border-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' };
    case 'DATABASE': return { border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    case 'STORAGE': return { border: 'border-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10' };
  }
};

const getNodeIcon = (type: NodeType) => {
  switch (type) {
    case 'GATEWAY': return <Network className="w-4 h-4" />;
    case 'LOAD_BALANCER': return <Boxes className="w-4 h-4" />;
    case 'SERVICE': return <Cpu className="w-4 h-4" />;
    case 'CACHE': return <Layers className="w-4 h-4" />;
    case 'QUEUE': return <Server className="w-4 h-4" />;
    case 'DATABASE': return <Database className="w-4 h-4" />;
    case 'STORAGE': return <HardDrive className="w-4 h-4" />;
  }
};

// --- Custom React Flow Node Component ---
const ArchitectureNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as ArchitectureNodeData;
  const style = getNodeStyle(nodeData.type || 'SERVICE');

  return (
    <div
      className={`min-w-44 bg-surface rounded-lg border-2 p-3 shadow-lg transition-all select-none ${
        selected ? 'ring-2 ring-primary border-primary shadow-primary/30' : style.border
      }`}
    >
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-primary-2 border-border" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-primary-2 border-border" />
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-primary-2 border-border" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-primary-2 border-border" />

      {/* Header with icon and type */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/50">
        <div className="flex items-center gap-1.5">
          <span className={`${style.text}`}>{getNodeIcon(nodeData.type || 'SERVICE')}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">
            {nodeData.type || 'SERVICE'}
          </span>
        </div>
      </div>

      {/* Node Name */}
      <div className="pt-1.5 font-bold text-xs text-white leading-tight break-words">
        {nodeData.name || 'Component'}
      </div>

      {/* Node QPS / Capacity Tag */}
      {nodeData.qps && (
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono font-medium text-emerald-400 bg-elevated px-2 py-0.5 rounded border border-border/80">
          <span>Capacity:</span>
          <span>{nodeData.qps}</span>
        </div>
      )}
    </div>
  );
};

const INITIAL_NODES: Node[] = [
  {
    id: 'gateway-1',
    type: 'architectureNode',
    position: { x: 50, y: 120 },
    data: { type: 'GATEWAY', name: 'API Gateway', qps: '100k QPS' }
  },
  {
    id: 'lb-1',
    type: 'architectureNode',
    position: { x: 280, y: 120 },
    data: { type: 'LOAD_BALANCER', name: 'L4/L7 Load Balancer', qps: '100k QPS' }
  },
  {
    id: 'service-1',
    type: 'architectureNode',
    position: { x: 520, y: 50 },
    data: { type: 'SERVICE', name: 'App Microservice Cluster', qps: '60k QPS' }
  },
  {
    id: 'cache-1',
    type: 'architectureNode',
    position: { x: 780, y: 20 },
    data: { type: 'CACHE', name: 'Redis Cache Cluster', qps: '120k read/sec' }
  },
  {
    id: 'queue-1',
    type: 'architectureNode',
    position: { x: 520, y: 220 },
    data: { type: 'QUEUE', name: 'Kafka Event Bus', qps: '40k msgs/sec' }
  },
  {
    id: 'db-1',
    type: 'architectureNode',
    position: { x: 780, y: 180 },
    data: { type: 'DATABASE', name: 'PostgreSQL Sharded Store', qps: '10k write/sec' }
  }
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e1', source: 'gateway-1', target: 'lb-1', label: 'HTTP/2', animated: true },
  { id: 'e2', source: 'lb-1', target: 'service-1', label: 'gRPC', animated: true },
  { id: 'e3', source: 'service-1', target: 'cache-1', label: 'O(1) Cache', animated: false },
  { id: 'e4', source: 'lb-1', target: 'queue-1', label: 'Async Ingest', animated: true },
  { id: 'e5', source: 'queue-1', target: 'db-1', label: 'Batch Sync', animated: false }
];

export const HldWhiteboardCanvas: React.FC<Props> = ({
  sessionId,
  provider = 'GEMINI',
  apiKey = '',
  onArchitectureUpdate
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // --- Drawers & Modals ---
  const [isCapacityOpen, setIsCapacityOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<DesignEvaluateResponse | null>(null);

  // --- Capacity Calculator Inputs ---
  const [dau, setDau] = useState<number>(10000000); // 10M
  const [requestsPerDay, setRequestsPerDay] = useState<number>(50);
  const [peakFactor, setPeakFactor] = useState<number>(3.0);
  const [avgObjectKb, setAvgObjectKb] = useState<number>(2.0);
  const [readRatio, setReadRatio] = useState<number>(10);
  const [writeRatio, setWriteRatio] = useState<number>(1);

  // Memoize nodeTypes mapping for React Flow
  const nodeTypes = useMemo(() => ({ architectureNode: ArchitectureNodeComponent }), []);

  const onConnect = useCallback(
    (params: Connection) => {
      const label = window.prompt('Connection Protocol / Label (e.g. gRPC, HTTP/2, Kafka, TCP):', 'gRPC') || 'gRPC';
      setEdges((eds) => addEdge({ ...params, label, animated: true }, eds));
    },
    [setEdges]
  );

  // Broadcast architecture update summary to AI dialogue engine
  useEffect(() => {
    if (!onArchitectureUpdate) return;
    const summary = nodes.map((n) => {
      const d = n.data as unknown as ArchitectureNodeData;
      const outgoing = edges
        .filter((e) => e.source === n.id)
        .map((e) => {
          const target = nodes.find((tn) => tn.id === e.target);
          const td = target?.data as unknown as ArchitectureNodeData;
          return `${e.label || 'connected'} -> ${td?.name || e.target}`;
        })
        .join(', ');
      return `• [${d.type}] ${d.name} (${d.qps || 'Standard Capacity'})${outgoing ? ` ➔ ${outgoing}` : ''}`;
    }).join('\n');

    onArchitectureUpdate(summary);
  }, [nodes, edges, onArchitectureUpdate]);

  const handleAddNode = (type: NodeType) => {
    const nextIdx = nodes.length + 1;
    const id = `node-${nextIdx}-${type.toLowerCase()}`;
    const defaultNames: Record<NodeType, string> = {
      GATEWAY: 'API Gateway',
      LOAD_BALANCER: 'L4/L7 Balancer',
      SERVICE: 'App Microservice',
      CACHE: 'Redis / Memcached',
      QUEUE: 'Kafka / RabbitMQ',
      DATABASE: 'SQL/NoSQL Store',
      STORAGE: 'Object Store (S3)'
    };

    const newNode: Node = {
      id,
      type: 'architectureNode',
      position: { x: 200 + ((nextIdx * 40) % 200), y: 100 + ((nextIdx * 30) % 150) },
      data: {
        type,
        name: defaultNames[type],
        qps: '10k QPS'
      }
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const handleReset = () => {
    if (window.confirm('Reset whiteboard architecture to default blueprint?')) {
      setNodes(INITIAL_NODES);
      setEdges(INITIAL_EDGES);
      setEvaluationResult(null);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  // Selected Node Data
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeData = selectedNode ? (selectedNode.data as unknown as ArchitectureNodeData) : null;

  const updateSelectedNode = (field: keyof ArchitectureNodeData, value: string) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              [field]: value
            }
          };
        }
        return n;
      })
    );
  };

  // --- Capacity Math Calculations ---
  const capacityCalculations = useMemo(() => {
    const totalDailyRequests = dau * requestsPerDay;
    const avgQps = totalDailyRequests / 86400;
    const peakQps = avgQps * peakFactor;
    const totalRatio = readRatio + writeRatio;
    const peakReadQps = peakQps * (readRatio / totalRatio);
    const peakWriteQps = peakQps * (writeRatio / totalRatio);

    const dailyWrites = totalDailyRequests * (writeRatio / totalRatio);
    const dailyStorageKb = dailyWrites * avgObjectKb;
    const yearlyStorageGb = (dailyStorageKb * 365) / (1024 * 1024);
    const yearlyStorageTb = yearlyStorageGb / 1024;

    const ingressMbps = (peakWriteQps * avgObjectKb * 8) / 1024;
    const egressMbps = (peakReadQps * avgObjectKb * 8) / 1024;

    const formatNum = (n: number) => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
      if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
      return n.toFixed(0);
    };

    return {
      avgQps: formatNum(avgQps),
      peakQps: formatNum(peakQps),
      peakReadQps: formatNum(peakReadQps),
      peakWriteQps: formatNum(peakWriteQps),
      yearlyStorage: yearlyStorageTb >= 1 ? `${yearlyStorageTb.toFixed(2)} TB/yr` : `${yearlyStorageGb.toFixed(1)} GB/yr`,
      ingressMbps: `${ingressMbps.toFixed(1)} Mbps`,
      egressMbps: `${egressMbps.toFixed(1)} Mbps`,
      stampValue: `${formatNum(peakQps)} QPS`
    };
  }, [dau, requestsPerDay, peakFactor, avgObjectKb, readRatio, writeRatio]);

  const exportFilter = (node: HTMLElement) => {
    if (node.classList && (node.classList.contains('exclude-export') || node.classList.contains('react-flow__controls'))) {
      return false;
    }
    return true;
  };

  // --- Export PNG to User Machine ---
  const handleExportPng = async () => {
    if (!reactFlowWrapper.current) return;
    try {
      const dataUrl = await toPng(reactFlowWrapper.current, {
        backgroundColor: '#090D16',
        filter: exportFilter
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `system-design-architecture-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('Failed to export architecture PNG');
    }
  };

  // --- Save Design & Persist to GridFS & Transcript ---
  const handleSaveDesign = async () => {
    if (!reactFlowWrapper.current) return;
    setIsSaving(true);
    try {
      const blob = await toBlob(reactFlowWrapper.current, {
        backgroundColor: '#090D16',
        filter: exportFilter
      });
      if (!blob) throw new Error('Canvas render blob failed');

      const canvasJson = JSON.stringify({ nodes, edges }, null, 2);

      let pngAttId = '';
      let jsonAttId = '';

      if (sessionId) {
        const pngRes = await uploadCanvasPngAttachment(sessionId, blob);
        const jsonRes = await uploadCanvasJsonAttachment(sessionId, canvasJson);
        pngAttId = pngRes.attachmentId;
        jsonAttId = jsonRes.attachmentId;

        const summaryText = `[System Design Architecture Blueprint Snapshot Saved]\nComponents:\n${nodes.map(n => {
          const d = n.data as unknown as ArchitectureNodeData;
          return `• ${d.name} (${d.type}) [${d.qps || 'Standard'}]`;
        }).join('\n')}\nAttachments: PNG #${pngAttId}, JSON #${jsonAttId}`;

        await addMessageToSession(sessionId, {
          senderRole: 'CANDIDATE',
          messageType: 'SYSTEM_DESIGN',
          content: summaryText,
          codeSnippet: canvasJson
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return { pngAttId, jsonAttId };
    } catch (err: any) {
      console.error('Save design error:', err);
      alert(`Save design failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Evaluate Architecture via AI Vision / Text Bar-Raiser ---
  const handleEvaluateDesign = async () => {
    if (!sessionId) {
      alert('Please start an active session to evaluate architecture.');
      return;
    }
    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      // 1. Upload latest attachments first
      const saved = await handleSaveDesign();
      if (!saved) throw new Error('Failed to capture canvas attachments for evaluation');

      // 2. Call AI evaluation endpoint
      const result = await evaluateArchitectureDesign({
        sessionId,
        pngAttachmentId: saved.pngAttId,
        canvasJsonAttachmentId: saved.jsonAttId,
        requirements: {
          dau: `${(dau / 1000000).toFixed(0)}M DAU`,
          peakFactor: `${peakFactor}x Peak`,
          readWriteRatio: `${readRatio}:${writeRatio} R/W`
        },
        modelProvider: provider,
        apiKey
      });

      setEvaluationResult(result);
    } catch (err: any) {
      console.error('Evaluation error:', err);
      alert(`Architecture evaluation failed: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-lg overflow-hidden relative select-none">

      {/* TOP TOOLBAR: Palette Buttons, Actions, Capacity & Evaluation */}
      <div className="p-2.5 bg-elevated/70 border-b border-border flex items-center justify-between flex-wrap gap-2 z-10">

        {/* Node Palette */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-text-3 mr-1">Add:</span>
          <Button size="sm" variant="ghost" icon={<Network className="w-3.5 h-3.5 text-indigo-400" />} onClick={() => handleAddNode('GATEWAY')}>
            Gateway
          </Button>
          <Button size="sm" variant="ghost" icon={<Boxes className="w-3.5 h-3.5 text-sky-400" />} onClick={() => handleAddNode('LOAD_BALANCER')}>
            Balancer
          </Button>
          <Button size="sm" variant="ghost" icon={<Cpu className="w-3.5 h-3.5 text-purple-400" />} onClick={() => handleAddNode('SERVICE')}>
            Service
          </Button>
          <Button size="sm" variant="ghost" icon={<Layers className="w-3.5 h-3.5 text-rose-400" />} onClick={() => handleAddNode('CACHE')}>
            Cache
          </Button>
          <Button size="sm" variant="ghost" icon={<Server className="w-3.5 h-3.5 text-amber-400" />} onClick={() => handleAddNode('QUEUE')}>
            Queue
          </Button>
          <Button size="sm" variant="ghost" icon={<Database className="w-3.5 h-3.5 text-emerald-400" />} onClick={() => handleAddNode('DATABASE')}>
            DB
          </Button>
          <Button size="sm" variant="ghost" icon={<HardDrive className="w-3.5 h-3.5 text-cyan-400" />} onClick={() => handleAddNode('STORAGE')}>
            S3 Store
          </Button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={isCapacityOpen ? 'primary' : 'ghost'}
            icon={<Calculator className="w-3.5 h-3.5 text-amber-400" />}
            onClick={() => setIsCapacityOpen(!isCapacityOpen)}
          >
            Capacity Math
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportPng}
            title="Export PNG to local machine"
          >
            Export PNG
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Save className="w-3.5 h-3.5 text-primary-2" />}
            onClick={handleSaveDesign}
            loading={isSaving}
          >
            {saveSuccess ? 'Saved!' : 'Save Design'}
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={<Sparkles className="w-3.5 h-3.5 text-white" />}
            onClick={handleEvaluateDesign}
            loading={isEvaluating}
            className="bg-gradient-to-r from-primary to-primary-2 text-white font-bold"
          >
            {isEvaluating ? 'Evaluating...' : 'Evaluate Design'}
          </Button>

          <Button size="sm" variant="ghost" icon={<RotateCcw className="w-3.5 h-3.5 text-text-3" />} onClick={handleReset} title="Reset Diagram" />
        </div>
      </div>

      {/* MAIN CANVAS AREA */}
      <div className="flex-1 relative overflow-hidden" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
          colorMode="dark"
        >
          <Background color="#1E293B" gap={16} variant={BackgroundVariant.Dots} />
          <Controls className="bg-elevated border border-border text-text rounded-md shadow-lg" />
        </ReactFlow>

        {/* CAPACITY MATH DRAWER (Top Right Overlay) */}
        {isCapacityOpen && (
          <div className="exclude-export absolute top-3 right-3 w-80 bg-surface/95 backdrop-blur-md border border-border rounded-lg shadow-2xl p-4 z-20 space-y-3 max-h-[85%] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <Calculator className="w-4 h-4 text-amber-400" />
                <span>Capacity Planning Estimator</span>
              </div>
              <button onClick={() => setIsCapacityOpen(false)} className="text-text-3 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[11px] text-text-3 font-medium">Daily Active Users (DAU)</label>
                <input
                  type="number"
                  value={dau}
                  onChange={(e) => setDau(Number(e.target.value) || 1)}
                  className="w-full bg-elevated border border-border rounded px-2 py-1 text-xs font-mono text-white mt-0.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-text-3 font-medium">Reqs / Day / User</label>
                  <input
                    type="number"
                    value={requestsPerDay}
                    onChange={(e) => setRequestsPerDay(Number(e.target.value) || 1)}
                    className="w-full bg-elevated border border-border rounded px-2 py-1 text-xs font-mono text-white mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-3 font-medium">Peak Factor</label>
                  <input
                    type="number"
                    step="0.5"
                    value={peakFactor}
                    onChange={(e) => setPeakFactor(Number(e.target.value) || 1)}
                    className="w-full bg-elevated border border-border rounded px-2 py-1 text-xs font-mono text-white mt-0.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-text-3 font-medium">Avg Object Size (KB)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={avgObjectKb}
                    onChange={(e) => setAvgObjectKb(Number(e.target.value) || 0.1)}
                    className="w-full bg-elevated border border-border rounded px-2 py-1 text-xs font-mono text-white mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-3 font-medium">R / W Ratio</label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      value={readRatio}
                      onChange={(e) => setReadRatio(Number(e.target.value) || 1)}
                      className="w-12 bg-elevated border border-border rounded px-1.5 py-1 text-xs font-mono text-white"
                    />
                    <span className="text-text-3">:</span>
                    <input
                      type="number"
                      value={writeRatio}
                      onChange={(e) => setWriteRatio(Number(e.target.value) || 1)}
                      className="w-12 bg-elevated border border-border rounded px-1.5 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated Estimates */}
            <div className="p-3 bg-elevated rounded-lg border border-border/80 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-text-3">
                <span>Avg Throughput:</span>
                <span className="text-white font-bold">{capacityCalculations.avgQps} QPS</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>Peak Load (QPS):</span>
                <span>{capacityCalculations.peakQps} QPS</span>
              </div>
              <div className="flex items-center justify-between text-sky-400">
                <span>Peak Reads:</span>
                <span>{capacityCalculations.peakReadQps} read/s</span>
              </div>
              <div className="flex items-center justify-between text-amber-400">
                <span>Peak Writes:</span>
                <span>{capacityCalculations.peakWriteQps} write/s</span>
              </div>
              <div className="flex items-center justify-between text-purple-400">
                <span>Storage / Year:</span>
                <span>{capacityCalculations.yearlyStorage}</span>
              </div>
              <div className="flex items-center justify-between text-text-3 text-[11px]">
                <span>Network I/O:</span>
                <span>{capacityCalculations.ingressMbps} in / {capacityCalculations.egressMbps} out</span>
              </div>
            </div>

            {/* Stamp Button */}
            {selectedNode && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => updateSelectedNode('qps', capacityCalculations.stampValue)}
                className="w-full text-xs font-bold"
              >
                Stamp {capacityCalculations.stampValue} to {selectedNodeData?.name || 'Selected'}
              </Button>
            )}
          </div>
        )}

        {/* SELECTED NODE INSPECTOR (Bottom Left Overlay) */}
        {selectedNode && selectedNodeData && (
          <div className="exclude-export absolute bottom-3 left-3 bg-surface/95 backdrop-blur-md border border-border rounded-lg shadow-2xl p-3 z-20 w-72 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-border">
              <div className="flex items-center gap-1.5">
                <span className={getNodeStyle(selectedNodeData.type).text}>{getNodeIcon(selectedNodeData.type)}</span>
                <span className="text-xs font-bold text-white">{selectedNodeData.type} Node</span>
              </div>
              <Button size="sm" variant="danger" icon={<Trash2 className="w-3 h-3" />} onClick={handleDeleteSelected} title="Delete Component" />
            </div>

            <Input
              label="Component Name"
              value={selectedNodeData.name}
              onChange={(e) => updateSelectedNode('name', e.target.value)}
              className="text-xs"
            />

            <Input
              label="QPS / Capacity Specification"
              placeholder="e.g. 50k QPS, 5k write/s"
              value={selectedNodeData.qps || ''}
              onChange={(e) => updateSelectedNode('qps', e.target.value)}
              className="text-xs font-mono"
            />
          </div>
        )}

        {/* AI ARCHITECTURE EVALUATION RESULT CARD (Bottom Center Overlay) */}
        {evaluationResult && (
          <div className="exclude-export absolute bottom-3 right-3 left-3 md:left-80 max-h-60 overflow-y-auto bg-surface/95 backdrop-blur-md border border-primary/40 rounded-lg shadow-2xl p-4 z-20 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-2" />
                <span className="text-xs font-bold text-white">Staff Architect Feedback</span>
                <Chip variant="primary" size="sm">
                  {evaluationResult.score} / 100
                </Chip>
                <Chip variant="neutral" size="sm">
                  {evaluationResult.modality === 'VISION' ? 'Vision Eval' : 'Text Eval'}
                </Chip>
              </div>
              <button onClick={() => setEvaluationResult(null)} className="text-text-3 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {evaluationResult.feedback.map((fb, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-text-2 leading-relaxed">
                  <ArrowRight className="w-3.5 h-3.5 text-primary-2 shrink-0 mt-0.5" />
                  <span>{fb}</span>
                </div>
              ))}
            </div>

            {evaluationResult.evidence && (
              <div className="bg-elevated p-2 rounded text-[11px] font-mono text-text-3 border border-border">
                <span className="text-text-2 font-semibold">Evidence: </span>
                {evaluationResult.evidence}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
