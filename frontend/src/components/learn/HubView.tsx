import React, { useMemo } from 'react';
import {
  Play,
  RotateCcw,
  Clock,
  Layers,
  ChevronRight,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Award,
  Zap,
  BookOpen
} from 'lucide-react';
import type {
  CatalogTopicSummary,
  CatalogQuestionSummary,
  QuestionProgress
} from '../../services/api';
import type { LearnTreePollState } from '../../lib/learnTree';
import type { RetryQueuePollState } from '../../lib/retryQueue';
import { QuestionTable } from './QuestionTable';
import { VerdictChip } from './verdictChips';

export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (isNaN(diffSec) || diffSec < 0) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export interface HubViewProps {
  track: string;
  enrichedTopics: CatalogTopicSummary[];
  questions: CatalogQuestionSummary[];
  progressMap: Record<string, QuestionProgress>;
  verdictMap: Record<string, string>;
  treeState: LearnTreePollState;
  retryState: RetryQueuePollState;
  loading: boolean;
  totalQuestions: number;
  totalSolved: number;
  percentage: number;
  onSolveQuestion: (slug: string) => void;
  onOpenDetail: (slug: string) => void;
  onOpenSubmissions: (slug: string, title: string) => void;
  onSelectTopicModule: (topicId: string) => void;
}

export const HubView: React.FC<HubViewProps> = ({
  track,
  enrichedTopics,
  questions,
  progressMap,
  verdictMap,
  treeState,
  retryState,
  loading,
  totalQuestions,
  totalSolved,
  percentage,
  onSolveQuestion,
  onOpenDetail,
  onOpenSubmissions,
  onSelectTopicModule
}) => {
  // 1. Identify primary hero candidate
  // Rule: primary = first item of retry queue; fallback = first unattempted question in tree/questions; fallback = track complete
  const heroCandidate = useMemo(() => {
    if (retryState.items && retryState.items.length > 0) {
      const topRetry = retryState.items[0];
      return {
        slug: topRetry.slug,
        title: topRetry.title,
        topic: topRetry.topic,
        isRetry: true,
        lastVerdict: topRetry.lastVerdict,
        lastAttemptAt: topRetry.lastAttemptAt,
        failCount: topRetry.failCount,
        difficulty: questions.find((q) => q.slug === topRetry.slug)?.difficulty || 'MEDIUM'
      };
    }

    // Fallback: first unattempted question in current track
    const unattempted = questions.find((q) => {
      const v = verdictMap[q.slug];
      const prog = progressMap[q.slug];
      return v === 'UNATTEMPTED' || (!v && (!prog || prog.attemptCount === 0));
    });

    if (unattempted) {
      return {
        slug: unattempted.slug,
        title: unattempted.title,
        topic: unattempted.topics?.[0] || 'Curriculum',
        isRetry: false,
        lastVerdict: 'UNATTEMPTED',
        lastAttemptAt: null,
        failCount: 0,
        difficulty: unattempted.difficulty
      };
    }

    // Fallback: any question in track if available
    if (questions.length > 0) {
      const first = questions[0];
      return {
        slug: first.slug,
        title: first.title,
        topic: first.topics?.[0] || 'Curriculum',
        isRetry: false,
        lastVerdict: verdictMap[first.slug] || 'UNATTEMPTED',
        lastAttemptAt: progressMap[first.slug]?.lastAttemptedAt || null,
        failCount: 0,
        difficulty: first.difficulty
      };
    }

    return null;
  }, [retryState.items, questions, verdictMap, progressMap]);

  // 2. Identify latest practiced question for the Right Rail
  const lastPracticedInfo = useMemo(() => {
    let latestTime: string | null = null;
    let latestSlug: string | null = null;
    let latestProgress: QuestionProgress | null = null;

    for (const [slug, p] of Object.entries(progressMap)) {
      if (p.lastAttemptedAt) {
        if (!latestTime || new Date(p.lastAttemptedAt).getTime() > new Date(latestTime).getTime()) {
          latestTime = p.lastAttemptedAt;
          latestSlug = slug;
          latestProgress = p;
        }
      }
    }

    if (!latestTime || !latestSlug) {
      return null;
    }

    const matchedQ = questions.find((q) => q.slug === latestSlug);
    return {
      slug: latestSlug,
      title: matchedQ?.title || latestSlug,
      timestamp: latestTime,
      relativeTime: formatRelativeTime(latestTime),
      attemptCount: latestProgress?.attemptCount ?? 0,
      solveCount: latestProgress?.solveCount ?? 0
    };
  }, [progressMap, questions]);

  const trackTotals = treeState.data?.trackTotals || {};
  const trackEntries = [
    { key: 'ALGORITHMS_DATA_STRUCTURES', label: 'Algorithms & DSA', icon: Code2 },
    { key: 'SYSTEM_DESIGN', label: 'System Design', icon: Layers },
    { key: 'SPRING_LLD', label: 'Low-Level Design', icon: Cpu },
    { key: 'SQL', label: 'SQL & DB', icon: Database },
    { key: 'BEHAVIORAL_STAR', label: 'Behavioral STAR', icon: Award }
  ];

  const isTrackComplete = totalQuestions > 0 && totalSolved >= totalQuestions;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_310px] gap-6 items-start">
        {/* Left Column: Hero + Retries + Topics + Compact Table */}
        <div className="space-y-6 min-w-0">
          {/* CONTINUE HERO */}
          <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-elevated/80 to-surface p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 min-w-0 flex-1">
                {heroCandidate ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {heroCandidate.isRetry ? 'Continue · Due for Retry' : 'Next Up in Curriculum'}
                      </span>
                      {heroCandidate.lastAttemptAt && (
                        <span className="text-xs text-text-3 font-medium">
                          Last run {formatRelativeTime(heroCandidate.lastAttemptAt)}
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight truncate">
                        {heroCandidate.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-elevated border border-border text-text-2">
                          {heroCandidate.topic}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-elevated border border-border text-text-2">
                          {heroCandidate.difficulty}
                        </span>
                        {heroCandidate.isRetry && heroCandidate.failCount > 0 && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-danger/10 text-danger border border-danger/20 font-mono">
                            {heroCandidate.failCount} failed run{heroCandidate.failCount > 1 ? 's' : ''}
                          </span>
                        )}
                        <VerdictChip verdict={heroCandidate.lastVerdict} />
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-text-3 max-w-xl line-clamp-2">
                      {heroCandidate.isRetry
                        ? 'Resurface this problem to solidify memory and address weak spots observed in recent attempts.'
                        : 'Continue forward through the core problem roadmap and build foundational mastery.'}
                    </p>

                    <div className="flex items-center gap-3 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onSolveQuestion(heroCandidate.slug)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary text-on-accent hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Solve now</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenDetail(heroCandidate.slug)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-surface border border-border text-text-2 hover:text-text hover:bg-elevated transition-colors cursor-pointer"
                      >
                        <span>Preview problem</span>
                        <ChevronRight className="w-4 h-4 text-text-3" />
                      </button>
                    </div>
                  </>
                ) : isTrackComplete ? (
                  <div className="py-4 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-success/15 text-success border border-success/30">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Track 100% Mastered</span>
                    </div>
                    <h2 className="text-xl font-bold text-text">All questions completed!</h2>
                    <p className="text-xs text-text-3">
                      You have solved every problem in this track. Explore other tracks or revisit the retry queue.
                    </p>
                  </div>
                ) : (
                  <div className="py-4 space-y-2">
                    <h2 className="text-lg font-bold text-text">No questions loaded</h2>
                    <p className="text-xs text-text-3">Select another track or refresh catalog.</p>
                  </div>
                )}
              </div>

              {/* Mini Stats Cluster */}
              <div className="flex items-center gap-4 lg:border-l lg:border-border lg:pl-6 shrink-0">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span>Solved</span>
                    <strong className="text-text font-mono ml-auto font-bold">{totalSolved}</strong>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Retry due</span>
                    <strong className="text-text font-mono ml-auto font-bold">
                      {retryState.items.length}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-2">
                    <span className="w-2 h-2 rounded-full bg-text-3" />
                    <span>Total</span>
                    <strong className="text-text font-mono ml-auto font-bold">{totalQuestions}</strong>
                  </div>
                </div>

                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                    <circle
                      cx="36"
                      cy="36"
                      r="30"
                      className="text-border stroke-current"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="36"
                      cy="36"
                      r="30"
                      className="text-primary stroke-current"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={188.5}
                      strokeDashoffset={188.5 - (188.5 * percentage) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-extrabold font-mono text-text leading-tight">
                      {percentage}%
                    </span>
                    <span className="text-[9px] font-bold text-text-3 uppercase tracking-wider">
                      Done
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RETRY QUEUE PANEL */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text tracking-tight flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Retry Queue
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                  {retryState.items.length} due
                </span>
              </div>
              {retryState.items.length > 5 && (
                <span className="text-xs text-text-3 font-medium">
                  Showing top 5 of {retryState.items.length}
                </span>
              )}
            </div>

            {retryState.items.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border bg-surface/50 text-center text-xs text-text-3 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>No retries due · Your practice queue is clean</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {retryState.items.slice(0, 6).map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => onOpenDetail(item.slug)}
                    className="group text-left p-3.5 rounded-xl border border-border bg-surface hover:bg-elevated hover:border-border/80 transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-xs"
                  >
                    <div className="space-y-1 min-w-0 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-3 truncate">
                          {item.topic}
                        </span>
                        <VerdictChip verdict={item.lastVerdict} />
                      </div>
                      <h4 className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-3 pt-1 border-t border-border/50">
                      <span className="flex items-center gap-1 font-mono">
                        <RotateCcw className="w-3 h-3 text-text-3" />
                        {item.failCount} failed run{item.failCount > 1 ? 's' : ''}
                      </span>
                      <span className="group-hover:text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-xs font-bold">
                        Retry →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* TOPIC TILES GRID */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text tracking-tight flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Explore Modules
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 font-mono">
                  {enrichedTopics.length} topics
                </span>
              </div>
              <span className="text-xs text-text-3">Click any module to open detailed curriculum</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {enrichedTopics.map((t) => {
                const topicPercent = t.total > 0 ? Math.round((t.solved / t.total) * 100) : 0;
                const hasInterview =
                  t.interviewAttempted !== undefined && t.interviewAttempted > 0;

                return (
                  <button
                    key={t.topic}
                    type="button"
                    onClick={() => onSelectTopicModule(t.topic)}
                    className="group text-left p-3.5 rounded-xl border border-border bg-surface hover:bg-elevated hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-3 font-mono">
                          Module
                        </span>
                        {hasInterview && (
                          <span
                            title="Includes interview mock encounters"
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/15 text-primary border border-primary/30"
                          >
                            Interview {t.interviewPassed ?? 0}/{t.interviewAttempted}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-text group-hover:text-primary transition-colors line-clamp-1">
                        {t.displayName}
                      </h4>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-text-3">
                          <strong className="text-success font-mono font-bold">{t.solved}</strong> /{' '}
                          <span className="font-mono">{t.total}</span> solved
                        </span>
                        <span className="font-mono text-[10px] text-text-3 font-semibold">
                          {topicPercent}%
                        </span>
                      </div>

                      <div className="w-full bg-elevated rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(topicPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ALL PROBLEMS (Compact Table) */}
          <section className="space-y-3 pt-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-bold text-text tracking-tight flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-text-2" />
                All Problems in Track
              </h3>
              <span className="text-xs text-text-3 font-mono">
                {questions.length} total problems
              </span>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-surface">
              <QuestionTable
                questions={questions}
                progressMap={progressMap}
                verdictMap={verdictMap}
                loading={loading}
                selectedTopic={null}
                onSolve={onSolveQuestion}
                onOpenDetail={onOpenDetail}
                onOpenSubmissions={onOpenSubmissions}
              />
            </div>
          </section>
        </div>

        {/* Right Rail: RetrySnapshot + LastPracticed + TrackTotals */}
        <aside className="space-y-4">
          {/* RETRY SNAPSHOT CARD */}
          <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-3 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Retry Snapshot
              </h4>
              <span className="text-[11px] font-mono font-bold text-amber-500">
                {retryState.items.length}
              </span>
            </div>

            {retryState.items.length === 0 ? (
              <p className="text-xs text-text-3">No retries due · Everything up to date.</p>
            ) : (
              <div className="space-y-2">
                {retryState.items.slice(0, 3).map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => onOpenDetail(item.slug)}
                    className="w-full text-left p-2 rounded-lg bg-elevated/60 hover:bg-elevated border border-border/50 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <span className="truncate font-medium text-text">{item.title}</span>
                    <VerdictChip verdict={item.lastVerdict} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LAST PRACTICED CARD */}
          <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Last Practiced
            </h4>

            {lastPracticedInfo ? (
              <div className="space-y-1.5 pt-1">
                <div className="font-semibold text-xs text-text truncate">
                  {lastPracticedInfo.title}
                </div>
                <div className="text-[11px] text-text-3 flex items-center justify-between font-mono">
                  <span>{lastPracticedInfo.relativeTime}</span>
                  <span>{lastPracticedInfo.attemptCount} attempt{lastPracticedInfo.attemptCount > 1 ? 's' : ''}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenDetail(lastPracticedInfo.slug)}
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <span>Review session</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-text-3 pt-1">Never practiced</p>
            )}
          </div>

          {/* TRACK TOTALS CARD */}
          <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-text-2" />
              Curriculum Tracks
            </h4>

            <div className="space-y-1.5">
              {trackEntries.map((entry) => {
                const count = trackTotals[entry.key];
                const Icon = entry.icon;
                const isSelected = track === entry.key;

                return (
                  <div
                    key={entry.key}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium border ${
                      isSelected
                        ? 'bg-elevated border-primary/40 text-primary font-bold'
                        : 'border-border/50 text-text-2'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{entry.label}</span>
                    </div>
                    <span className="font-mono text-xs text-text-3 font-semibold ml-2">
                      {count !== undefined ? count : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
