import React from 'react';
import { RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import type { RetryQueueItem } from '../../services/api';

interface RetryQueueCardProps {
  items: RetryQueueItem[];
  isStale?: boolean;
  isChecking?: boolean;
  onSelectQuestion: (slug: string) => void;
}

export const RetryQueueCard: React.FC<RetryQueueCardProps> = ({
  items,
  isStale = false,
  isChecking = false,
  onSelectQuestion,
}) => {
  return (
    <div
      data-testid="retry-queue-card"
      className="bg-elevated/40 border-b border-border px-4 sm:px-6 py-2.5 flex flex-col gap-2 shrink-0 select-none transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-text">
            <RotateCcw className={`w-3.5 h-3.5 text-rose-500 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Retry Queue</span>
          </div>

          <span
            data-testid="retry-queue-count"
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30"
          >
            {items.length}
          </span>

          <span className="hidden sm:inline text-[11px] text-text-3 font-mono">
            · Weak-Spot Resurfacing
          </span>
        </div>

        {isStale && (
          <span
            data-testid="retry-queue-stale"
            title="Retry queue updates degraded; displaying cached items"
            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono font-bold flex items-center gap-1 border border-amber-500/30"
          >
            <AlertCircle className="w-3 h-3" />
            STALE
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div
          data-testid="retry-queue-empty"
          className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-surface/50 border border-border/60 text-xs font-mono text-text-3"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Nothing to retry — go break something new</span>
        </div>
      ) : (
        <div
          data-testid="retry-queue-list"
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin"
        >
          {items.map((item) => {
            const isFailed = item.lastVerdict === 'FAILED';
            return (
              <button
                key={item.slug}
                type="button"
                data-testid={`retry-chip-${item.slug}`}
                onClick={() => onSelectQuestion(item.slug)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-rose-500/50 hover:bg-surface/80 transition-all cursor-pointer whitespace-nowrap shadow-xs shrink-0"
              >
                <span className="text-xs font-medium text-text group-hover:text-rose-400 transition-colors">
                  {item.title || item.slug}
                </span>

                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-elevated text-text-3">
                  {item.topic}
                </span>

                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    isFailed
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {item.lastVerdict}
                </span>

                <span
                  title={`${item.failCount} failed attempt${item.failCount === 1 ? '' : 's'}`}
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300"
                >
                  ×{item.failCount}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
