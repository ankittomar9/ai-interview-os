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
  HelpCircle,
  History,
  Lightbulb,
  ExternalLink,
  BookOpen,
  FileText,
  Save,
  Trash2
} from 'lucide-react';
import {
  getCatalogQuestionDetail,
  getQuestionEncounters,
  getUserNote,
  saveUserNote,
  deleteUserNote,
  type CatalogQuestionDetail,
  type QuestionProgress,
  type QuestionEncountersResponse
} from '../../services/api';
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
  const [activeTab, setActiveTab] = useState<'statement' | 'solution' | 'resources' | 'notes'>('statement');
  const [encounters, setEncounters] = useState<QuestionEncountersResponse | null>(null);
  const [revealedHintIndex, setRevealedHintIndex] = useState<number>(0);
  const [userNote, setUserNote] = useState<string>('');
  const [initialUserNote, setInitialUserNote] = useState<string>('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null);
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<string | null>(null);

  const isNoteDirty = userNote !== initialUserNote;

  const handleTabChange = (newTab: 'statement' | 'solution' | 'resources' | 'notes') => {
    if (activeTab === 'notes' && isNoteDirty) {
      const discard = window.confirm('You have unsaved changes in your personal notes. Discard them?');
      if (!discard) return;
      setUserNote(initialUserNote);
    }
    setActiveTab(newTab);
  };

  const handleClose = () => {
    if (isNoteDirty) {
      const discard = window.confirm('You have unsaved changes in your personal notes. Discard them?');
      if (!discard) return;
    }
    onClose();
  };

  const isSolved = (progress?.solveCount ?? 0) > 0;
  const canViewSolution = isSolved || isRevealed;

  const attemptCount = progress?.attemptCount ?? 0;
  const solveCount = progress?.solveCount ?? 0;
  const failedAttempts = Math.max(0, attemptCount - solveCount);
  const isHintLadderUnlocked = failedAttempts >= 2;
  const hints = detail?.hints || [];

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setLoading(true);
    setError(null);
    setIsRevealed(false);
    setShowConfirmReveal(false);
    setActiveTab('statement');
    setRevealedHintIndex(0);

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

    getQuestionEncounters(slug)
      .then((data) => {
        if (isMounted) setEncounters(data);
      })
      .catch((err) => console.warn('Could not load question encounters:', err));

    setNoteLoading(true);
    setNoteError(null);
    setNoteSuccess(null);
    getUserNote(slug)
      .then((note) => {
        if (isMounted) {
          const body = note?.body || '';
          setUserNote(body);
          setInitialUserNote(body);
          setNoteUpdatedAt(note?.updatedAt || null);
        }
      })
      .catch((err) => {
        if (isMounted) console.warn('Could not load user note:', err);
      })
      .finally(() => {
        if (isMounted) setNoteLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, isSolved]);

  const handleSaveNote = async () => {
    if (!slug) return;
    if (!userNote.trim()) {
      setNoteError('Note body cannot be blank');
      return;
    }
    setNoteSaving(true);
    setNoteError(null);
    setNoteSuccess(null);
    try {
      const saved = await saveUserNote(slug, userNote);
      setInitialUserNote(saved.body);
      setUserNote(saved.body);
      setNoteUpdatedAt(saved.updatedAt || new Date().toISOString());
      setNoteSuccess('Note saved successfully');
      setTimeout(() => setNoteSuccess(null), 3000);
    } catch (err: any) {
      setNoteError(err.message || 'Failed to save note');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!slug) return;
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    setNoteSaving(true);
    setNoteError(null);
    try {
      await deleteUserNote(slug);
      setUserNote('');
      setInitialUserNote('');
      setNoteUpdatedAt(null);
      setNoteSuccess('Note deleted');
      setTimeout(() => setNoteSuccess(null), 3000);
    } catch (err: any) {
      setNoteError(err.message || 'Failed to delete note');
    } finally {
      setNoteSaving(false);
    }
  };

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
              onClick={handleClose}
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
            onClick={() => handleTabChange('statement')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'statement'
                ? 'text-primary border-primary'
                : 'text-text-3 border-transparent hover:text-text'
            }`}
          >
            Problem Statement
          </button>
          <button
            onClick={() => handleTabChange('solution')}
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
          <button
            onClick={() => handleTabChange('resources')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'resources'
                ? 'text-primary border-primary'
                : 'text-text-3 border-transparent hover:text-text'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            Resources
            {detail?.resources && detail.resources.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-primary/10 text-primary">
                {detail.resources.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('notes')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'text-primary border-primary'
                : 'text-text-3 border-transparent hover:text-text'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-primary" />
            Personal Notes
            {userNote.trim().length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Has notes" />
            )}
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

                  {/* Interview Encounters Card (Addendum A3) */}
                  <div className="bg-surface border border-border rounded-xl p-4 space-y-3" data-testid="interview-encounters-card">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text">
                          Interview Encounters
                        </h4>
                      </div>
                      {encounters && encounters.interviewAttemptCount > 0 ? (
                        <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20" data-testid="pressure-gap-indicator">
                          {encounters.pressureGap}
                        </span>
                      ) : (
                        <span className="text-[11px] text-text-3 font-mono">
                          Not yet encountered in an interview
                        </span>
                      )}
                    </div>

                    {encounters && encounters.interviewAttemptCount > 0 ? (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {encounters.encounters.map((enc, idx) => (
                            <div
                              key={idx}
                              className="bg-elevated/40 border border-border rounded-lg p-2.5 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-text font-semibold truncate">
                                  Session #{enc.sessionId}
                                </span>
                                {enc.attemptedAt && (
                                  <span className="text-[11px] text-text-3 font-mono">
                                    {new Date(enc.attemptedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <Chip
                                variant={enc.verdict === 'PASSED' ? 'success' : enc.verdict === 'FAILED' ? 'danger' : 'default'}
                                size="sm"
                              >
                                {enc.verdict}
                              </Chip>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-text-3 bg-elevated/20 p-3 rounded-lg border border-border/50">
                        You have not faced this question in a full mock interview session yet. Complete an assessment to see your interview performance gap tracked here.
                      </p>
                    )}
                  </div>

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

                  {/* Hint Ladder (Addendum A3) */}
                  {hints.length > 0 && (
                    <div className="bg-surface border border-border rounded-xl p-4 space-y-3" data-testid="hint-ladder-block">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-warning" />
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text">
                            Hint Ladder
                          </h4>
                        </div>
                        {isHintLadderUnlocked ? (
                          <span className="text-[11px] font-mono text-success font-semibold flex items-center gap-1">
                            <Unlock className="w-3 h-3" />
                            Unlocked ({failedAttempts} failed attempts)
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-text-3 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Unlocks after ≥2 failed attempts ({failedAttempts}/2)
                          </span>
                        )}
                      </div>

                      {isHintLadderUnlocked ? (
                        <div className="space-y-2 pt-1">
                          {hints.map((hint, idx) => {
                            const isHintRevealed = idx <= revealedHintIndex;
                            return (
                              <div
                                key={idx}
                                className="bg-elevated/30 border border-border rounded-lg p-3 text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-text-2 flex items-center gap-1.5">
                                    <span>Hint {idx + 1}</span>
                                    {idx === hints.length - 1 && (
                                      <span className="text-[10px] text-text-3 uppercase tracking-wider font-mono">
                                        (Key Insight)
                                      </span>
                                    )}
                                  </span>
                                  {!isHintRevealed && idx === revealedHintIndex + 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setRevealedHintIndex(idx)}
                                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                                    >
                                      Reveal Hint {idx + 1}
                                    </button>
                                  )}
                                </div>
                                {isHintRevealed ? (
                                  <p className="text-text leading-relaxed bg-surface p-2.5 rounded border border-border/60">
                                    {hint}
                                  </p>
                                ) : (
                                  <p className="text-[11px] text-text-3 italic">
                                    Hidden to encourage deliberate problem solving.
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-text-3 bg-elevated/20 p-3 rounded-lg border border-border/50 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-text-3 shrink-0" />
                          <span>
                            To promote deliberate problem synthesis, hints are locked until you have made at least 2 attempts in the Playground.
                          </span>
                        </div>
                      )}
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

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div className="space-y-6" data-testid="resources-tab-content">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text">
                        Curated Learning Resources
                      </h3>
                    </div>
                    <span className="text-[11px] text-text-3 font-mono">
                      Git-Curated Reference Material
                    </span>
                  </div>

                  {detail.resources && detail.resources.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs text-text-2 leading-relaxed">
                        The following hand-picked references, canonical write-ups, and video breakdowns are curated for this problem:
                      </p>
                      <div className="grid grid-cols-1 gap-2.5">
                        {detail.resources.map((res, idx) => (
                          <a
                            key={idx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border hover:border-primary/50 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <ExternalLink className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-semibold text-text group-hover:text-primary transition-colors truncate">
                                {res.label}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-text-3 shrink-0 ml-2">
                              Open ↗
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl bg-elevated/30 border border-border text-center space-y-2">
                      <BookOpen className="w-8 h-8 text-text-3 mx-auto opacity-50" />
                      <p className="text-xs font-semibold text-text">No Problem-Specific Resources Yet</p>
                      <p className="text-[11px] text-text-3 max-w-sm mx-auto">
                        Explore canonical topic documentation or refer to standard algorithm textbooks (CLRS / EPI).
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Personal Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-4" data-testid="notes-tab-content">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text">
                        Personal Problem Notes
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {isNoteDirty && (
                        <span className="text-[11px] font-mono text-warning font-semibold px-2 py-0.5 rounded bg-warning/10 border border-warning/20">
                          Unsaved Changes
                        </span>
                      )}
                      {noteUpdatedAt && !isNoteDirty && (
                        <span className="text-[11px] font-mono text-text-3">
                          Last saved: {new Date(noteUpdatedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {noteLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-text-3 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-xs">Loading notes...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <textarea
                          value={userNote}
                          onChange={(e) => setUserNote(e.target.value)}
                          placeholder="Document key insights, edge cases, space/time complexity traps, or your personal walkthrough..."
                          rows={12}
                          className="w-full rounded-xl bg-surface border border-border p-4 text-xs font-mono text-text placeholder:text-text-3/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed resize-y"
                        />
                        <div className="flex items-center justify-between text-[11px] font-mono text-text-3 px-1 pt-1">
                          <span>{userNote.length} characters</span>
                          <span className="text-text-3/80">Private: Stored locally in your personal database</span>
                        </div>
                      </div>

                      {noteError && (
                        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{noteError}</span>
                        </div>
                      )}

                      {noteSuccess && (
                        <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{noteSuccess}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={handleDeleteNote}
                          disabled={noteSaving || (!initialUserNote && !userNote)}
                          className="px-3.5 py-2 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs font-semibold hover:bg-danger/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Note
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveNote}
                          disabled={noteSaving || !userNote.trim()}
                          className="px-5 py-2 rounded-lg bg-primary text-on-accent text-xs font-bold hover:bg-primary-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center gap-1.5 transition-colors"
                        >
                          {noteSaving ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              Save Notes
                            </>
                          )}
                        </button>
                      </div>
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
            onClick={handleClose}
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
