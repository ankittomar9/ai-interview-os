import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Clock, Cpu, Calendar, History, Loader2 } from 'lucide-react';
import { getPracticeAttempts, type PracticeAttempt } from '../../services/api';

interface SubmissionsDrawerProps {
  slug: string | null;
  questionTitle?: string;
  onClose: () => void;
  onSolve?: (slug: string) => void;
}

export const SubmissionsDrawer: React.FC<SubmissionsDrawerProps> = ({
  slug,
  questionTitle,
  onClose,
  onSolve
}) => {
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    getPracticeAttempts(slug)
      .then((data) => {
        if (isMounted) {
          setAttempts(data.sort((a, b) => b.attemptSeq - a.attemptSeq));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load submissions history');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!slug) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="flex-1 cursor-pointer" onClick={onClose} />
      <div className="w-full max-w-md bg-surface border-l border-border h-full flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
        <div className="p-5 border-b border-border flex items-center justify-between bg-elevated/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-text truncate">Submission History</h2>
              <p className="text-xs text-text-3 truncate">{questionTitle || slug}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-3 hover:text-text hover:bg-elevated transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-text-3 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs">Fetching past runs...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Error Loading History
              </div>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && attempts.length === 0 && (
            <div className="text-center py-16 text-text-3 space-y-3">
              <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center mx-auto text-text-3">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-text-2">No Submissions Recorded Yet</p>
              <p className="text-xs max-w-xs mx-auto">
                Execute or submit code for this question in the Playground Arena to record attempts.
              </p>
              {onSolve && (
                <button
                  onClick={() => onSolve(slug)}
                  className="mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-primary text-on-accent text-xs font-bold hover:bg-primary-2 cursor-pointer shadow-sm"
                >
                  Solve Now
                </button>
              )}
            </div>
          )}

          {!loading && !error && attempts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-text-3 px-1">
                <span>Total Attempts: {attempts.length}</span>
                <span>
                  Passed: <strong className="text-success">{attempts.filter((a) => a.verdict === 'PASSED').length}</strong>
                </span>
              </div>

              {attempts.map((attempt) => {
                const isPassed = attempt.verdict === 'PASSED';
                const isError = attempt.verdict === 'ERROR';

                return (
                  <div
                    key={attempt.id || attempt.attemptSeq}
                    className={`p-4 rounded-xl border transition-all ${
                      isPassed
                        ? 'bg-success/5 border-success/30 hover:border-success/50'
                        : isError
                        ? 'bg-warning/5 border-warning/30 hover:border-warning/50'
                        : 'bg-danger/5 border-danger/30 hover:border-danger/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : isError ? (
                          <AlertTriangle className="w-4 h-4 text-warning" />
                        ) : (
                          <XCircle className="w-4 h-4 text-danger" />
                        )}
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isPassed ? 'text-success' : isError ? 'text-warning' : 'text-danger'
                          }`}
                        >
                          {attempt.verdict}
                        </span>
                        <span className="text-[11px] font-mono text-text-3">
                          #{attempt.attemptSeq}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-text-3">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(attempt.createdAt)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50 text-[11px] font-mono">
                      <div>
                        <span className="text-text-3 block text-[10px]">Test Cases</span>
                        <span className="font-semibold text-text">
                          {attempt.testsPassed} / {attempt.testsTotal}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-3 block text-[10px]">Runtime</span>
                        <span className="font-semibold text-text flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-text-3" />
                          {attempt.runtimeMs !== undefined && attempt.runtimeMs !== null
                            ? `${attempt.runtimeMs} ms`
                            : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-3 block text-[10px]">Memory</span>
                        <span className="font-semibold text-text flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5 text-text-3" />
                          {attempt.memoryKb !== undefined && attempt.memoryKb !== null
                            ? `${Math.round(attempt.memoryKb / 1024)} MB`
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {onSolve && (
          <div className="p-4 border-t border-border bg-elevated/30 flex justify-end">
            <button
              onClick={() => onSolve(slug)}
              className="px-5 py-2 rounded-lg bg-primary text-on-accent text-xs font-bold hover:bg-primary-2 cursor-pointer shadow-sm transition-all"
            >
              Practice in Playground
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
