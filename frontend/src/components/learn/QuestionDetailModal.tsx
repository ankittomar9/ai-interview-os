import React, { useEffect, useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Play,
  FileCode2,
  Video,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { getCatalogQuestionDetail, type CatalogQuestionDetail, type QuestionProgress } from '../../services/api';
import { Chip } from '../ui/Chip';

interface QuestionDetailModalProps {
  slug: string | null;
  progress?: QuestionProgress;
  onClose: () => void;
  onSolve: (slug: string) => void;
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  slug,
  progress,
  onClose,
  onSolve
}) => {
  const [detail, setDetail] = useState<CatalogQuestionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showConfirmReveal, setShowConfirmReveal] = useState(false);
  const [activeTab, setActiveTab] = useState<'statement' | 'solution'>('statement');

  const isSolved = (progress?.solveCount ?? 0) > 0;
  const canViewSolution = isSolved || isRevealed;

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setLoading(true);
    setError(null);
    setIsRevealed(false);
    setShowConfirmReveal(false);
    setActiveTab('statement');

    getCatalogQuestionDetail(slug, isSolved)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
          if (!data.solutionMasked) {
            setIsRevealed(true);
          }
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to fetch question details');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, isSolved]);

  const handleConfirmReveal = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const data = await getCatalogQuestionDetail(slug, true);
      setDetail(data);
      setIsRevealed(true);
      setShowConfirmReveal(false);
    } catch (err: any) {
      alert(`Failed to reveal solution: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!slug) return null;

  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    try {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        const parsed = new URL(url);
        videoId = parsed.searchParams.get('v') || '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
      }
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
    } catch {
      return null;
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toUpperCase()) {
      case 'EASY':
        return 'text-success bg-success/10 border-success/20';
      case 'MEDIUM':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'HARD':
        return 'text-danger bg-danger/10 border-danger/20';
      default:
        return 'text-text-3 bg-elevated border-border';
    }
  };

  const embedUrl = getYoutubeEmbedUrl(detail?.solutionVideoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-border bg-elevated/40 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider shrink-0 ${getDifficultyColor(
                detail?.difficulty || 'EASY'
              )}`}
            >
              {detail?.difficulty || 'DSA'}
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-text truncate">
                {detail?.title || slug}
              </h2>
              <div className="flex items-center gap-3 text-xs text-text-3 mt-0.5">
                {detail?.estMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-text-3" />
                    ~{detail.estMinutes} mins
                  </span>
                )}
                {isSolved && (
                  <span className="flex items-center gap-1 text-success font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Solved ({progress?.solveCount}x)
                  </span>
                )}
                {detail?.testCasesCount !== undefined && (
                  <span className="text-text-3">
                    {detail.testCasesCount} Test Cases
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSolve(slug)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-accent text-xs font-bold hover:bg-primary-2 cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Solve
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-3 hover:text-text hover:bg-elevated transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-border bg-surface">
          <button
            onClick={() => setActiveTab('statement')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'statement'
                ? 'text-primary border-primary'
                : 'text-text-3 border-transparent hover:text-text'
            }`}
          >
            Problem Statement
          </button>
          <button
            onClick={() => setActiveTab('solution')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'solution'
                ? 'text-primary border-primary'
                : 'text-text-3 border-transparent hover:text-text'
            }`}
          >
            {canViewSolution ? (
              <Unlock className="w-3.5 h-3.5 text-success" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-text-3" />
            )}
            Official Solution
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-text-3 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs">Loading problem details...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Error Loading Problem
              </div>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {activeTab === 'statement' && (
                <div className="space-y-6">
                  {/* Topics rail */}
                  {detail.topics && detail.topics.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-text-3 mr-1">Topics:</span>
                      {detail.topics.map((t) => (
                        <Chip key={t} size="sm" variant="default">
                          {t}
                        </Chip>
                      ))}
                    </div>
                  )}

                  {/* Problem Description */}
                  <div className="prose prose-sm dark:prose-invert max-w-none text-text leading-relaxed">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-3 mb-2">
                      Description
                    </h3>
                    <div className="whitespace-pre-line text-sm text-text-2 bg-elevated/20 p-4 rounded-xl border border-border/60">
                      {detail.statement}
                    </div>
                  </div>

                  {/* Examples */}
                  {detail.examples && detail.examples.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-3">
                        Examples
                      </h3>
                      {detail.examples.map((ex, idx) => (
                        <div
                          key={idx}
                          className="bg-elevated/40 border border-border rounded-xl p-4 font-mono text-xs text-text-2 whitespace-pre-wrap leading-relaxed"
                        >
                          <span className="text-primary font-bold block mb-1">
                            Example {idx + 1}:
                          </span>
                          {ex}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Constraints */}
                  {detail.constraints && detail.constraints.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-3">
                        Constraints
                      </h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-text-2 font-mono">
                        {detail.constraints.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Test Cases Summary */}
                  {detail.hiddenTestCasesMeta && detail.hiddenTestCasesMeta.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-3">
                        Hidden Test Cases Suite
                      </h3>
                      <p className="text-xs text-text-3">
                        Total {detail.testCasesCount} test cases (including edge cases and stress suites).
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {detail.hiddenTestCasesMeta.map((tc) => (
                          <div
                            key={tc.index}
                            className="bg-elevated/30 border border-border/50 rounded-lg p-2.5 text-xs text-text-2 font-mono flex items-center justify-between"
                          >
                            <span>Test Case #{tc.index}</span>
                            <span className="text-[11px] text-text-3">{tc.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'solution' && (
                <div className="space-y-6">
                  {!canViewSolution ? (
                    <div className="text-center py-12 px-6 bg-elevated/20 border border-border rounded-2xl space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <Lock className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-text">
                        Solution is Locked
                      </h3>
                      <p className="text-xs text-text-3 max-w-md mx-auto leading-relaxed">
                        To preserve active recall and deliberate practice, official solutions unlock after your first passed attempt. You can also reveal it directly.
                      </p>

                      <div className="pt-2 flex items-center justify-center gap-3">
                        <button
                          onClick={() => onSolve(slug)}
                          className="px-5 py-2 rounded-lg bg-primary text-on-accent text-xs font-bold hover:bg-primary-2 cursor-pointer shadow-sm"
                        >
                          Solve in Playground First
                        </button>
                        <button
                          onClick={() => setShowConfirmReveal(true)}
                          className="px-4 py-2 rounded-lg bg-elevated border border-border text-text-2 text-xs font-bold hover:bg-elevated/80 cursor-pointer"
                        >
                          Reveal Anyway
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          Solution Unlocked
                        </span>
                        <span className="text-[11px]">
                          {isSolved ? 'Unlocked via accepted submission' : 'Unlocked via reveal'}
                        </span>
                      </div>

                      {/* Video Embed */}
                      {embedUrl && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-3 flex items-center gap-1.5">
                            <Video className="w-4 h-4 text-primary" />
                            Video Explanation Walkthrough
                          </h3>
                          <div className="aspect-video w-full rounded-xl overflow-hidden border border-border shadow-md bg-black">
                            <iframe
                              src={embedUrl}
                              title="Solution Walkthrough"
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}

                      {/* Text Solution */}
                      {detail.solution ? (
                        <div className="space-y-2">
                          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-3 flex items-center gap-1.5">
                            <FileCode2 className="w-4 h-4 text-primary" />
                            Official Solution Code &amp; Logic
                          </h3>
                          <pre className="bg-[#18181b] text-slate-100 p-4 rounded-xl border border-zinc-800 text-xs font-mono overflow-x-auto leading-relaxed">
                            {detail.solution}
                          </pre>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-elevated/50 text-text-3 text-xs text-center">
                          No text solution provided yet. Check back after next question bank update.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-elevated/30 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-elevated border border-border text-xs font-semibold text-text-2 hover:text-text cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => onSolve(slug)}
            className="px-6 py-2 rounded-lg bg-primary text-on-accent text-xs font-bold hover:bg-primary-2 cursor-pointer shadow-sm flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Solve in Playground
          </button>
        </div>
      </div>

      {/* Reveal Solution Confirmation Dialog */}
      {showConfirmReveal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-2.5 text-warning">
              <HelpCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-text">Reveal Solution Early?</h3>
            </div>
            <p className="text-xs text-text-2 leading-relaxed">
              Viewing the solution before writing your own attempt will forfeit the chance to practice problem synthesis from scratch. Are you sure you want to reveal it?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmReveal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-3 hover:text-text bg-elevated border border-border cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReveal}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-warning text-on-accent hover:bg-warning/90 cursor-pointer shadow-sm"
              >
                Yes, Reveal Solution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
