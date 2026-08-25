import React from 'react';
import type { GenerateQuestionResponse } from '../types';
import { usePlaygroundProgress } from '../hooks/usePlaygroundProgress';
import { CheckCircle2, Eye, HelpCircle, ArrowRight, RotateCcw, Home, Sparkles } from 'lucide-react';

interface Props {
  questions: GenerateQuestionResponse[];
  onReviewSolutions?: () => void;
  onPracticeAgain?: () => void;
  onBackToSetup?: () => void;
  onReturnHome?: () => void;
  onBrowseCatalog?: () => void;
}

export const PracticeSummary: React.FC<Props> = ({
  questions,
  onReviewSolutions,
  onPracticeAgain,
  onBackToSetup,
  onReturnHome,
  onBrowseCatalog
}) => {
  const { allProgress } = usePlaygroundProgress();

  let solvedCount = 0;
  let assistedCount = 0;
  let attemptedCount = 0;
  let skippedCount = 0;

  questions.forEach((q) => {
    const slug = q.problemSlug || q.slug || '';
    const p = allProgress[slug];
    if (!p || p.status === 'untouched') {
      skippedCount++;
    } else if (p.status === 'solved') {
      solvedCount++;
    } else if (p.status === 'assisted') {
      assistedCount++;
    } else if (p.status === 'attempted') {
      attemptedCount++;
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 grid place-items-center p-4 sm:p-8 select-text font-sans">
      <div className="max-w-3xl w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-8 lg:p-10 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Practice Session Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review your problem-solving metrics and mastery across this session.
            </p>
          </div>
        </div>

        {/* Metrics Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attempted</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {questions.length - skippedCount}/{questions.length}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Solved Clean</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{solvedCount}</div>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Assisted</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{assistedCount}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Skipped</div>
            <div className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-1">{skippedCount}</div>
          </div>
        </div>

        {/* Question Results Breakdown Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Challenge</th>
                <th className="py-3 px-4">Track / Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Best Runtime</th>
                <th className="py-3 px-4 text-right">Runs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {questions.map((q) => {
                const slug = q.problemSlug || q.slug || '';
                const prog = allProgress[slug] || { status: 'untouched', attempts: 0, solutionViewed: false };

                return (
                  <tr key={slug} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {q.title}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {q.track} · {q.difficulty}
                    </td>
                    <td className="py-3 px-4">
                      {prog.status === 'solved' && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                        </span>
                      )}
                      {prog.status === 'assisted' && (
                        <span className="inline-flex items-center gap-1 text-purple-600 font-bold">
                          <Eye className="w-3.5 h-3.5" /> Assisted
                        </span>
                      )}
                      {prog.status === 'attempted' && (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                          <HelpCircle className="w-3.5 h-3.5" /> Attempted
                        </span>
                      )}
                      {(!prog.status || prog.status === 'untouched') && (
                        <span className="text-slate-400 font-medium">Skipped</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {prog.bestTimeMs !== undefined ? `${prog.bestTimeMs.toFixed(0)}ms` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {prog.attempts || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onReturnHome || onBackToSetup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Setup Screen</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBrowseCatalog || onPracticeAgain}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-900 dark:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Browse Catalog</span>
            </button>
            {onReviewSolutions && (
              <button
                type="button"
                onClick={onReviewSolutions}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <span>Review Practice Arena</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
