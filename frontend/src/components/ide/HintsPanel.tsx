import React, { useState } from 'react';
import { Lightbulb, Eye, CheckCircle2, ChevronRight } from 'lucide-react';

interface Props {
  hints: string[];
}

export const HintsPanel: React.FC<Props> = ({ hints }) => {
  const [revealedCount, setRevealedCount] = useState<number>(0);

  const availableHints = hints && hints.length > 0
    ? hints
    : [
        'Think about the core operational invariants and data structure trade-offs.',
        'Analyze boundary conditions: empty input, duplicate elements, and capacity limits.',
        'Consider time and space complexity scaling constraints.'
      ];

  const handleRevealNext = () => {
    if (revealedCount < availableHints.length) {
      setRevealedCount((c) => c + 1);
    }
  };

  const handleRevealAll = () => {
    setRevealedCount(availableHints.length);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">Progressive Hints</h4>
            <p className="text-xs text-slate-500">
              Revealed {revealedCount} of {availableHints.length} hints
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {revealedCount < availableHints.length && (
            <button
              type="button"
              onClick={handleRevealNext}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <span>Reveal Hint {revealedCount + 1}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          {revealedCount < availableHints.length && (
            <button
              type="button"
              onClick={handleRevealAll}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Reveal All</span>
            </button>
          )}
        </div>
      </div>

      {revealedCount === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
          <Lightbulb className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No hints revealed yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try working through the problem first. If you get stuck, reveal progressive hints one by one.
          </p>
          <button
            type="button"
            onClick={handleRevealNext}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Reveal First Hint</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {availableHints.slice(0, revealedCount).map((hint, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed flex items-start gap-3 animate-fade-in"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1">{hint}</div>
            </div>
          ))}

          {revealedCount === availableHints.length && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>All available hints have been revealed.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
