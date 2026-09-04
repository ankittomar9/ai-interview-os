import React, { useState } from 'react';
import { Code2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTimeAgo, type SubmissionRecord } from '../../lib/submissions';

interface SubmissionsTabProps {
  submissions: SubmissionRecord[];
}

export const SubmissionsTab: React.FC<SubmissionsTabProps> = ({ submissions }) => {
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  if (submissions.length === 0) {
    return (
      <div className="bg-elevated border border-border rounded-xl p-8 text-xs text-text-3 text-center space-y-2">
        <Code2 className="w-8 h-8 mx-auto text-text-3/50" />
        <div className="font-semibold text-text-2 text-sm">No Submissions Recorded Yet</div>
        <p className="max-w-xs mx-auto text-text-3">
          Run your test cases or submit code to track your progression and performance metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="text-sm font-bold text-text flex items-center gap-2">
          <span>Submissions History</span>
          <span className="px-2 py-0.5 rounded-full bg-elevated border border-border text-xs font-mono text-text-2">
            Total Attempts: {submissions.length} (Runs: {submissions.filter(s => s.type !== 'SUBMIT').length} / Submits: {submissions.filter(s => s.type === 'SUBMIT').length})
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {submissions.map((sub) => {
          const isExpanded = expandedSubmissionId === sub.id;
          const isAccepted = sub.status === 'Accepted';
          const isWarning =
            sub.status === 'Compile Error' ||
            sub.status === 'Time Limit Exceeded' ||
            sub.status === 'Memory Limit Exceeded' ||
            sub.status === 'Engine Unavailable' ||
            sub.status === 'Execution Error';

          const badgeVariantClass = isAccepted
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            : isWarning
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
            : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';

          return (
            <div
              key={sub.id}
              className="border border-border rounded-lg bg-elevated/40 hover:bg-elevated transition-colors overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                className="w-full p-2.5 sm:p-3 flex items-center justify-between text-xs cursor-pointer select-none text-left gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                    sub.type === 'SUBMIT'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-surface text-text-3 border border-border'
                  }`}>
                    {sub.type || 'RUN'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeVariantClass} shrink-0`}>
                    {sub.status}
                  </span>
                  <span className="font-mono text-text-2 font-semibold text-[11px] shrink-0">
                    {sub.runtimeMs !== undefined ? `${sub.runtimeMs.toFixed(0)} ms` : 'N/A'}
                  </span>
                  {sub.memoryMb !== undefined && sub.memoryMb > 0 && (
                    <span className="font-mono text-text-3 text-[11px] shrink-0">
                      {sub.memoryMb.toFixed(1)} MB
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-text-2 font-bold uppercase shrink-0">
                    {sub.language}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-text-3 font-mono text-[11px] shrink-0">
                  <span>{formatTimeAgo(sub.at)}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-3 border-t border-border/80 bg-surface/50 space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-text-3 text-[11px]">
                    <span>
                      Test Cases Passed: <strong className="text-text font-bold">{sub.passedTests} / {sub.totalTests}</strong>
                    </span>
                    <span>{new Date(sub.at).toLocaleTimeString()}</span>
                  </div>

                  {sub.compilerOutput && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-danger font-bold block">Execution / Compilation Output:</span>
                      <pre className="p-2.5 rounded bg-danger/10 border border-danger/20 text-danger text-[11px] whitespace-pre-wrap overflow-x-auto max-h-48 leading-relaxed">
                        {sub.compilerOutput}
                      </pre>
                    </div>
                  )}

                  {sub.cases && sub.cases.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-text-3 font-bold block">Case Results:</span>
                      {sub.cases.map((c, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded border text-[11px] space-y-1 ${
                            c.passed
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-text'
                              : 'bg-danger/5 border-danger/20 text-text'
                          }`}
                        >
                          <div className="flex justify-between font-bold">
                            <span>Case {i + 1} {c.name ? `(${c.name})` : ''}</span>
                            <span className={c.passed ? 'text-emerald-500' : 'text-danger'}>
                              {c.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                          {!c.passed && c.error && (
                            <div className="text-danger text-[10px] pt-0.5">{c.error}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {sub.rawOutput && !sub.compilerOutput && (
                    <div className="pt-1">
                      <span className="text-[10px] text-text-3 block">Raw Logs:</span>
                      <pre className="mt-1 p-2 rounded bg-elevated border border-border text-[10px] text-text-3 whitespace-pre-wrap overflow-x-auto max-h-32">
                        {sub.rawOutput}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
