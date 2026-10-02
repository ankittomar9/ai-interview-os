import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ExternalLink,
  Zap
} from 'lucide-react';
import type {
  CatalogTopicSummary,
  CatalogQuestionSummary,
  QuestionProgress,
  LearnQuestionNode
} from '../../services/api';
import type { LearnTreePollState } from '../../lib/learnTree';
import type { RetryQueuePollState } from '../../lib/retryQueue';
import { QuestionTable } from './QuestionTable';
import { VerdictChip } from './verdictChips';

export interface ModulesViewProps {
  track: string;
  enrichedTopics: CatalogTopicSummary[];
  questions: CatalogQuestionSummary[];
  progressMap: Record<string, QuestionProgress>;
  verdictMap: Record<string, string>;
  selectedTopic: string | null;
  onSelectTopic: (topicId: string) => void;
  treeState: LearnTreePollState;
  retryState: RetryQueuePollState;
  loading: boolean;
  onSolveQuestion: (slug: string) => void;
  onOpenDetail: (slug: string) => void;
  onOpenSubmissions: (slug: string, title: string) => void;
}

export const ModulesView: React.FC<ModulesViewProps> = ({
  track,
  enrichedTopics,
  questions,
  progressMap,
  verdictMap,
  selectedTopic,
  onSelectTopic,
  treeState,
  retryState,
  loading,
  onSolveQuestion,
  onOpenDetail,
  onOpenSubmissions
}) => {
  const [activeTab, setActiveTab] = useState<'problems' | 'resources'>('problems');

  // Default to first topic if none is selected
  const activeTopicId = selectedTopic || (enrichedTopics.length > 0 ? enrichedTopics[0].topic : null);
  const activeTopic = enrichedTopics.find((t) => t.topic === activeTopicId) || enrichedTopics[0];

  // Map tree questions for two-track counters
  const treeQuestionsMap = useMemo(() => {
    const map: Record<string, LearnQuestionNode> = {};
    if (treeState.data?.topics) {
      for (const t of treeState.data.topics) {
        if (t.questions) {
          for (const q of t.questions) {
            map[q.slug] = q;
          }
        }
      }
    }
    return map;
  }, [treeState.data]);

  // Retries in this module
  const moduleRetries = useMemo(() => {
    if (!activeTopicId || !retryState.items) return [];
    return retryState.items.filter((item) => item.topic === activeTopicId);
  }, [activeTopicId, retryState.items]);

  const activeTopicPercent =
    activeTopic && activeTopic.total > 0
      ? Math.round((activeTopic.solved / activeTopic.total) * 100)
      : 0;

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden bg-bg">
      {/* MODULE RAIL (D2 Left) */}
      <aside className="w-72 sm:w-80 border-r border-border bg-surface flex flex-col shrink-0 overflow-hidden">
        {/* Rail Header */}
        <div className="p-4 border-b border-border bg-surface select-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-3 font-mono">
            {track ? `${track} ` : ''}Curriculum
          </span>
          <h2 className="text-sm font-bold text-text truncate">
            {enrichedTopics.length} Modules Total
          </h2>
        </div>

        {/* Rail List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {enrichedTopics.map((topic, index) => {
            const isSelected = topic.topic === activeTopicId;
            const percent = topic.total > 0 ? Math.round((topic.solved / topic.total) * 100) : 0;
            const isComplete = topic.total > 0 && topic.solved >= topic.total;
            const isInProgress = topic.solved > 0 && !isComplete;
            const moduleNumber = String(index + 1).padStart(2, '0');

            return (
              <button
                key={topic.topic}
                type="button"
                onClick={() => onSelectTopic(topic.topic)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-elevated border-primary/50 shadow-xs'
                    : 'bg-surface border-border hover:bg-elevated/50 hover:border-border/80'
                }`}
              >
                {/* Row 1: Index + Honest Solved/Total count */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] font-bold text-text-3 uppercase tracking-wider">
                    Module {moduleNumber}
                  </span>
                  <span className="font-mono text-xs font-bold text-text-2">
                    <span className={topic.solved > 0 ? 'text-success' : 'text-text-3'}>
                      {topic.solved}
                    </span>{' '}
                    / {topic.total}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className={`text-xs sm:text-sm font-bold truncate ${
                    isSelected ? 'text-primary' : 'text-text group-hover:text-primary transition-colors'
                  }`}
                >
                  {topic.displayName}
                </h3>

                {/* Status + Progress line */}
                <div className="flex items-center justify-between text-[11px] text-text-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isComplete
                          ? 'bg-success'
                          : isInProgress
                          ? 'bg-primary'
                          : 'border border-border bg-transparent'
                      }`}
                    />
                    {isComplete ? 'Completed' : isInProgress ? 'In progress' : 'Not started'}
                  </span>
                  <span className="font-mono text-[10px]">{percent}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-elevated rounded-full h-1 overflow-hidden border border-border/40">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isComplete ? 'bg-success' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* MODULE WORKSPACE (D2 Center/Right) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg">
        {activeTopic ? (
          <>
            {/* Module Workspace Header */}
            <div className="p-5 border-b border-border bg-surface shrink-0 space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      Module Detail
                    </span>
                    <span className="text-xs text-text-3 font-mono">
                      {activeTopic.solved} of {activeTopic.total} problems solved
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight truncate flex items-center gap-2.5">
                    <span>{activeTopic.displayName}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                      {activeTopic.solved}/{activeTopic.total}
                    </span>
                  </h1>
                </div>

                {/* Topic Progress Bar */}
                <div className="flex items-center gap-3 w-full sm:w-64">
                  <div className="flex-1 bg-elevated rounded-full h-2 overflow-hidden border border-border">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(activeTopicPercent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-text-2 shrink-0">
                    {activeTopicPercent}%
                  </span>
                </div>
              </div>

              {/* Subtitle / Pressure Gap info */}
              <p className="text-xs text-text-3 max-w-3xl">
                {activeTopic.pressureGap
                  ? `${activeTopic.pressureGap}. Each problem carries two lanes — practice runs against the visible test suite, and mock runs under interview constraints.`
                  : 'Deliberate practice curriculum with two-track assessment.'}
              </p>

              {/* Module Tabs: Problems / Resources / Notes (SOON) */}
              <div className="flex items-center gap-1 border-b border-border -mb-5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('problems')}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'problems'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-3 hover:text-text'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Problems</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-elevated text-text-3">
                    {activeTopic.total}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('resources')}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'resources'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-3 hover:text-text'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Resources</span>
                  {activeTopic.resources && activeTopic.resources.length > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-elevated text-text-3">
                      {activeTopic.resources.length}
                    </span>
                  )}
                </button>

                {/* Notes Tab: G-N4 (No Vaporware) explicitly disabled with SOON badge */}
                <button
                  type="button"
                  disabled
                  title="Module-level notes workspace is coming in future scope. Per-question notes are available in the detail modal."
                  className="px-3 py-2 text-xs font-semibold text-text-3/60 cursor-not-allowed flex items-center gap-1.5 select-none"
                >
                  <span>Notes</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-elevated border border-border text-text-3">
                    SOON
                  </span>
                </button>
              </div>
            </div>

            {/* RETRY BANNER (Per Module) */}
            {moduleRetries.length > 0 && activeTab === 'problems' && (
              <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1 rounded-lg bg-amber-500/20 text-amber-500 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-text truncate">
                      {moduleRetries[0].title} is due for retry
                    </div>
                    <div className="text-[11px] text-text-3 flex items-center gap-1.5">
                      <span>{moduleRetries.length} problem{moduleRetries.length > 1 ? 's' : ''} due in this module</span>
                      <span>·</span>
                      <VerdictChip verdict={moduleRetries[0].lastVerdict} />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDetail(moduleRetries[0].slug)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold hover:bg-amber-500/30 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  Review now →
                </button>
              </div>
            )}

            {/* Tab Body: Problems vs Resources */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {activeTab === 'problems' ? (
                <QuestionTable
                  questions={questions}
                  progressMap={progressMap}
                  verdictMap={verdictMap}
                  loading={loading}
                  selectedTopic={activeTopicId}
                  onSolve={onSolveQuestion}
                  onOpenDetail={onOpenDetail}
                  onOpenSubmissions={onOpenSubmissions}
                  twoTrack={true}
                  treeQuestionsMap={treeQuestionsMap}
                />
              ) : (
                <div className="p-6 overflow-y-auto space-y-4">
                  <h3 className="text-sm font-bold text-text">
                    Study Resources · {activeTopic.displayName}
                  </h3>

                  {activeTopic.resources && activeTopic.resources.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeTopic.resources.map((res, i) => (
                        <a
                          key={i}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3.5 rounded-xl border border-border bg-surface hover:bg-elevated hover:border-primary/40 transition-all flex items-center justify-between gap-3 text-xs text-text group cursor-pointer"
                        >
                          <span className="font-medium group-hover:text-primary transition-colors truncate">
                            {res.label}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-text-3 group-hover:text-primary shrink-0" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border border-dashed border-border text-center text-xs text-text-3 space-y-2">
                      <p>No external resources listed for this topic yet.</p>
                      <p className="text-[11px]">
                        Reference approaches and algorithmic breakdown can be found inside individual problem previews.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-text-3 text-xs">
            No modules available for the selected track.
          </div>
        )}
      </main>
    </div>
  );
};
