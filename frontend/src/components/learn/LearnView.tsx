import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Code2,
  Database,
  Layers,
  Cpu,
  RefreshCw,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { TopicRail } from './TopicRail';
import { QuestionTable } from './QuestionTable';
import { SubmissionsDrawer } from './SubmissionsDrawer';
import { QuestionDetailModal } from './QuestionDetailModal';
import { RetryQueueCard } from './RetryQueueCard';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ViewToggle } from './ViewToggle';
import { HubView } from './HubView';
import {
  useLearnData,
  resolveInitialViewMode,
  buildLearnUrl,
  parseLearnUrl,
  STORAGE_KEY_VIEW_MODE,
  type LearnViewMode
} from './useLearnData';

interface LearnViewProps {
  onBackToSetup: () => void;
  onSolveQuestion: (slug: string) => void;
  onNavigateToDashboard?: () => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  onBackToSetup,
  onSolveQuestion,
  onNavigateToDashboard
}) => {
  const [viewMode, setViewMode] = useState<LearnViewMode>(() => {
    if (typeof window === 'undefined') return 'hub';
    return resolveInitialViewMode(
      window.location.search,
      window.localStorage.getItem(STORAGE_KEY_VIEW_MODE)
    );
  });

  const {
    track,
    setTrack,
    questions,
    progressMap,
    selectedTopic,
    setSelectedTopic,
    loading,
    treeState,
    retryState,
    verdictMap,
    enrichedTopics,
    totalQuestions,
    totalSolved,
    percentage,
    isStale,
    loadData
  } = useLearnData();

  // Modals state
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [submissionsTarget, setSubmissionsTarget] = useState<{
    slug: string;
    title: string;
  } | null>(null);

  // Sync /learn/question/{slug} and view parameters via popstate
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseLearnUrl(window.location.pathname, window.location.search);
      setViewMode(parsed.viewMode);
      setDetailSlug(parsed.detailSlug);
      if (parsed.topicId !== null) {
        setSelectedTopic(parsed.topicId);
      }
    };
    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setSelectedTopic]);

  const handleViewModeChange = (mode: LearnViewMode) => {
    setViewMode(mode);
    try {
      window.localStorage.setItem(STORAGE_KEY_VIEW_MODE, mode);
    } catch {
      // Ignore storage write errors in restricted contexts
    }
    const nextUrl = buildLearnUrl({
      viewMode: mode,
      topicId: mode === 'modules' ? selectedTopic : null,
      detailSlug
    });
    window.history.pushState({}, '', nextUrl);
  };

  const handleOpenDetail = (slug: string) => {
    setDetailSlug(slug);
    const nextUrl = buildLearnUrl({
      viewMode,
      topicId: selectedTopic,
      detailSlug: slug
    });
    window.history.pushState({}, '', nextUrl);
  };

  const handleCloseDetail = () => {
    setDetailSlug(null);
    const nextUrl = buildLearnUrl({
      viewMode,
      topicId: selectedTopic,
      detailSlug: null
    });
    window.history.pushState({}, '', nextUrl);
  };

  const trackTabs = [
    { id: 'ALGORITHMS_DATA_STRUCTURES', label: 'Algorithms & DSA', icon: Code2, countKey: 'ALGORITHMS_DATA_STRUCTURES' },
    { id: 'SYSTEM_DESIGN', label: 'System Design', icon: Layers, countKey: 'SYSTEM_DESIGN' },
    { id: 'SPRING_LLD', label: 'Low-Level Design', icon: Cpu, countKey: 'SPRING_LLD' },
    { id: 'SQL', label: 'SQL & DB', icon: Database, countKey: 'SQL' },
    { id: 'BEHAVIORAL_STAR', label: 'Behavioral STAR', icon: Award, countKey: 'BEHAVIORAL_STAR' }
  ];

  return (
    <div className="h-screen flex flex-col bg-bg text-text overflow-hidden font-sans select-none">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-surface px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
        {/* Left: Back + Brand */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onBackToSetup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-2 hover:text-text hover:bg-elevated transition-colors cursor-pointer border border-border shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Setup</span>
          </button>

          <div className="h-5 w-px bg-border shrink-0" />

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-text truncate flex items-center gap-2">
                Playground Practice Center
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success font-mono font-bold">
                  LOCAL
                </span>
                {isStale && (
                  <span
                    title="Live tree updates degraded; displaying cached state"
                    className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono font-bold flex items-center gap-1 border border-amber-500/30"
                  >
                    <AlertCircle className="w-3 h-3" />
                    STALE
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-text-3 truncate">
                LMS Curriculum · Persistent Attempt Ledger · Deliberate Practice
              </p>
            </div>
          </div>
        </div>

        {/* Center: Scaler Progress Counter */}
        <div className="hidden md:flex flex-col items-center gap-1 max-w-xs w-full px-4">
          <div className="flex items-center justify-between w-full text-xs font-semibold">
            <span className="flex items-center gap-1 text-text-2">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span>
                <strong className="text-text">{totalSolved}</strong> / {totalQuestions} Solved
              </span>
            </span>
            <span className="font-mono text-[11px] text-primary font-bold">
              {percentage}%
            </span>
          </div>
          <div className="w-full bg-elevated rounded-full h-1.5 overflow-hidden border border-border">
            <div
              className="h-full bg-gradient-to-r from-primary via-indigo-500 to-success rounded-full transition-all duration-500"
              style={{ width: `${Math.max(percentage, 2)}%` }}
            />
          </div>
        </div>

        {/* Right: Actions + Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              title="Performance & Mastery Dashboard"
              className="px-2.5 py-1.5 rounded-lg text-text-3 hover:text-text hover:bg-elevated transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}
          <button
            type="button"
            onClick={loadData}
            title="Refresh progress & catalog"
            className="p-2 rounded-lg text-text-3 hover:text-text hover:bg-elevated transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading || treeState.isChecking ? 'animate-spin text-primary' : ''}`} />
          </button>
          <ThemeToggle size="sm" />
        </div>
      </header>

      {/* Track Tabs Bar */}
      <div className="bg-elevated/40 border-b border-border px-4 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          {trackTabs.map((t) => {
            const Icon = t.icon;
            const isActive = track === t.id;
            const count = treeState.data?.trackTotals?.[t.countKey];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTrack(t.id);
                  setSelectedTopic(null);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-surface text-primary border border-border shadow-xs'
                    : 'text-text-3 hover:text-text hover:bg-surface/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-text-3'}`} />
                <span>{t.label}</span>
                {count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-elevated text-text-3'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile counter */}
        <div className="md:hidden text-xs font-mono text-text-3 whitespace-nowrap">
          {totalSolved}/{totalQuestions} Solved ({percentage}%)
        </div>
      </div>

      {/* View Content: HubView or Modules / Classic View */}
      {viewMode === 'hub' ? (
        <HubView
          track={track}
          enrichedTopics={enrichedTopics}
          questions={questions}
          progressMap={progressMap}
          verdictMap={verdictMap}
          treeState={treeState}
          retryState={retryState}
          loading={loading}
          totalQuestions={totalQuestions}
          totalSolved={totalSolved}
          percentage={percentage}
          onSolveQuestion={onSolveQuestion}
          onOpenDetail={handleOpenDetail}
          onOpenSubmissions={(slug, title) => setSubmissionsTarget({ slug, title })}
          onSelectTopicModule={(topicId) => {
            setSelectedTopic(topicId);
            handleViewModeChange('modules');
          }}
        />
      ) : (
        <>
          {/* Retry Queue (Weak-Spot Resurfacing) */}
          <RetryQueueCard
            items={retryState.items}
            isStale={retryState.isStale}
            isChecking={retryState.isChecking}
            onSelectQuestion={handleOpenDetail}
          />

          <main className="flex-1 flex min-h-0 overflow-hidden">
            <TopicRail
              topics={enrichedTopics}
              selectedTopic={selectedTopic}
              onSelectTopic={setSelectedTopic}
              totalQuestions={totalQuestions}
              totalSolved={totalSolved}
            />

            <QuestionTable
              questions={questions}
              progressMap={progressMap}
              verdictMap={verdictMap}
              loading={loading}
              selectedTopic={selectedTopic}
              onSolve={onSolveQuestion}
              onOpenDetail={handleOpenDetail}
              onOpenSubmissions={(slug, title) => setSubmissionsTarget({ slug, title })}
            />
          </main>
        </>
      )}

      {/* Submissions History Drawer */}
      {submissionsTarget && (
        <SubmissionsDrawer
          slug={submissionsTarget.slug}
          questionTitle={submissionsTarget.title}
          onClose={() => setSubmissionsTarget(null)}
          onSolve={(slug) => {
            setSubmissionsTarget(null);
            onSolveQuestion(slug);
          }}
        />
      )}

      {/* Question Detail Modal with Locked/Unlocked Solution */}
      {detailSlug && (
        <QuestionDetailModal
          slug={detailSlug}
          progress={progressMap[detailSlug]}
          onClose={handleCloseDetail}
          onSolve={(slug) => {
            handleCloseDetail();
            onSolveQuestion(slug);
          }}
        />
      )}
    </div>
  );
};
