import React, { useState } from 'react';
import { Eye, Lock, AlertTriangle, Copy, Check } from 'lucide-react';

interface Props {
  solutionCode?: string;
  hasRunAttempt: boolean;
  onViewSolution: () => void;
  isAssisted: boolean;
}

export const SolutionReveal: React.FC<Props> = ({
  solutionCode,
  hasRunAttempt,
  onViewSolution,
  isAssisted
}) => {
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isRevealed, setIsRevealed] = useState(isAssisted);
  const [isCopied, setIsCopied] = useState(false);

  const defaultSolution = solutionCode || '// Reference model solution is available in the Question Bank catalog.';

  const handleOpenPrompt = () => {
    if (isRevealed) return;
    setShowWarningModal(true);
  };

  const handleConfirmReveal = () => {
    setShowWarningModal(false);
    setIsRevealed(true);
    onViewSolution();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultSolution);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!hasRunAttempt) {
    return (
      <div className="p-6 text-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 my-3">
        <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Solution Locked</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Execute at least one code run attempt to unlock the reference solution.
        </p>
      </div>
    );
  }

  return (
    <div className="my-3">
      {!isRevealed ? (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">Reference Model Solution</p>
              <p className="text-[11px] text-slate-500">
                Inspect idiomatic reference code and complexity analysis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenPrompt}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Show Solution</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-xs font-bold text-slate-200">Reference Solution (Read-Only)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-semibold uppercase">
                Assisted Mode
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-all cursor-pointer"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-72 leading-relaxed select-text">
            <code>{defaultSolution}</code>
          </pre>
        </div>
      )}

      {/* Warning Confirmation Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reveal Reference Solution?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Viewing the solution will mark this question as <strong>"Assisted"</strong> in your practice history rather than purely solved independently.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReveal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
              >
                Yes, Show Solution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
