import React, { useState } from 'react';
import {
  Code,
  Database,
  FileText,
  Copy,
  Check,
  Clock,
  Cpu,
  Sparkles,
  Lightbulb,
  Layers
} from 'lucide-react';
import type { ReferenceSolution } from '../../services/api';

export interface ReferenceApproachesProps {
  approaches?: ReferenceSolution[];
  isInterviewMode?: boolean;
}

export const ReferenceApproaches: React.FC<ReferenceApproachesProps> = ({
  approaches,
  isInterviewMode = false
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Defence in depth: during an active interview, never render reference approaches
  if (isInterviewMode || !approaches || approaches.length === 0) {
    return null;
  }

  const handleCopy = (id: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6" data-testid="reference-approaches-container">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-text uppercase tracking-wider font-mono">
            {`Reference Approaches (${approaches.length})`}
          </h3>
        </div>
        <span className="text-[11px] text-text-3 font-mono">
          Interview-Accepted Standard Approaches
        </span>
      </div>

      <div className="space-y-6">
        {approaches.map((approach) => {
          const isPrimary = approach.approachClass === 'PRIMARY';

          return (
            <div
              key={approach.approachId}
              data-testid={`approach-card-${approach.approachId}`}
              className={`rounded-2xl border p-5 transition-all ${
                isPrimary
                  ? 'bg-elevated/40 border-primary/40 shadow-sm'
                  : 'bg-surface border-border hover:border-border/80'
              }`}
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
                      isPrimary
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-elevated text-text-3 border border-border'
                    }`}
                  >
                    {approach.approachClass}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-elevated/70 text-text-2 border border-border/50">
                    {approach.kind}
                  </span>
                  <h4 className="text-sm font-bold text-text truncate">
                    {approach.label}
                  </h4>
                </div>

                {/* Complexities */}
                <div className="flex items-center gap-2 shrink-0">
                  {approach.timeComplexity && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-surface border border-border text-text-2">
                      <Clock className="w-3.5 h-3.5 text-text-3" />
                      <span>{`Time: ${approach.timeComplexity}`}</span>
                    </span>
                  )}
                  {approach.spaceComplexity && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-surface border border-border text-text-2">
                      <Cpu className="w-3.5 h-3.5 text-text-3" />
                      <span>{`Space: ${approach.spaceComplexity}`}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Summary & Key Idea */}
              <div className="pt-4 space-y-3">
                {approach.summary && (
                  <p className="text-xs text-text-2 leading-relaxed">
                    {approach.summary}
                  </p>
                )}

                {approach.keyIdea && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs text-text leading-relaxed">
                      <span className="font-semibold text-primary">Key Idea: </span>
                      {approach.keyIdea}
                    </div>
                  </div>
                )}

                {/* Tradeoffs */}
                {approach.tradeoffs && approach.tradeoffs.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-text-3 font-semibold">
                      Tradeoffs &amp; Analysis
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-xs text-text-2">
                      {approach.tradeoffs.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* When To Use */}
                {approach.whenToUse && (
                  <div className="text-xs text-text-3 leading-relaxed">
                    <span className="font-semibold text-text-2">When to use: </span>
                    {approach.whenToUse}
                  </div>
                )}

                {/* Diagram Notes for Writeup */}
                {approach.diagramNotes && (
                  <div className="p-3 rounded-xl bg-elevated/40 border border-border flex items-start gap-2.5">
                    <Layers className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-text-2 leading-relaxed">
                      <span className="font-semibold text-indigo-400">Whiteboard Layout: </span>
                      {approach.diagramNotes}
                    </div>
                  </div>
                )}

                {/* Payload rendering */}
                {approach.kind === 'CODE' && approach.code && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-text-3">
                      <span className="font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-primary" />
                        Implementation Code
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(approach.approachId, approach.code || '')}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-elevated hover:bg-elevated/80 border border-border text-[11px] text-text-2 cursor-pointer transition-colors"
                      >
                        {copiedId === approach.approachId ? (
                          <>
                            <Check className="w-3 h-3 text-success" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-text-3" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-[#18181b] text-slate-100 p-4 rounded-xl border border-zinc-800 text-xs font-mono overflow-x-auto leading-relaxed max-h-[400px]">
                      {approach.code}
                    </pre>
                  </div>
                )}

                {approach.kind === 'SQL' && approach.sql && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-text-3">
                      <span className="font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-primary" />
                        SQL Query
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(approach.approachId, approach.sql || '')}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-elevated hover:bg-elevated/80 border border-border text-[11px] text-text-2 cursor-pointer transition-colors"
                      >
                        {copiedId === approach.approachId ? (
                          <>
                            <Check className="w-3 h-3 text-success" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-text-3" />
                            <span>Copy SQL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-[#18181b] text-slate-100 p-4 rounded-xl border border-zinc-800 text-xs font-mono overflow-x-auto leading-relaxed">
                      {approach.sql}
                    </pre>
                  </div>
                )}

                {approach.kind === 'WRITEUP' && approach.writeUp && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-text-3">
                      <span className="font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        System Architecture Writeup
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(approach.approachId, approach.writeUp || '')}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-elevated hover:bg-elevated/80 border border-border text-[11px] text-text-2 cursor-pointer transition-colors"
                      >
                        {copiedId === approach.approachId ? (
                          <>
                            <Check className="w-3 h-3 text-success" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-text-3" />
                            <span>Copy Notes</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-4 rounded-xl bg-surface border border-border text-xs text-text-2 whitespace-pre-wrap leading-relaxed max-h-[450px] overflow-y-auto">
                      {approach.writeUp}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
