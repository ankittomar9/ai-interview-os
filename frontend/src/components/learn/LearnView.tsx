import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Code2,
  Database,
  Layers,
  Cpu,
  RefreshCw
} from 'lucide-react';
import {
  getCatalogTopics,
  getCatalogQuestions,
  getPracticeProgress,
  type CatalogTopicSummary,
  type CatalogQuestionSummary,
  type QuestionProgress
} from '../../services/api';
import { TopicRail } from './TopicRail';
import { QuestionTable } from './QuestionTable';
import { SubmissionsDrawer } from './SubmissionsDrawer';
import { QuestionDetailModal } from './QuestionDetailModal';
import { ThemeToggle } from '../ui/ThemeToggle';

interface LearnViewProps {
  onBackToSetup: () => void;
  onSolveQuestion: (slug: string) => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  onBackToSetup,
  onSolveQuestion
}) => {
  const [track, setTrack] = useState<string>('ALGORITHMS_DATA_STRUCTURES');
  const [topics, setTopics] = useState<CatalogTopicSummary[]>([]);
  const [questions, setQuestions] = useState<CatalogQuestionSummary[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, QuestionProgress>>({});
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [submissionsTarget, setSubmissionsTarget] = useState<{
    slug: string;
    title: string;
  } | null>(null);

  // Sync /learn/question/{slug} URL with detailSlug
  useEffect(() => {
    const parseUrlSlug = () => {
      const match = window.location.pathname.match(/\/learn\/question\/([^/]+)/);
      if (match && match[1]) {
        setDetailSlug(decodeURIComponent(match[1]));
      }
    };
    parseUrlSlug();
    window.addEventListener('popstate', parseUrlSlug);
    return () => window.removeEventListener('popstate', parseUrlSlug);
  }, []);

  const handleOpenDetail = (slug: string) => {
    setDetailSlug(slug);
    if (!window.location.pathname.includes(`/learn/question/${encodeURIComponent(slug)}`)) {
      window.history.pushState({}, '', `/learn/question/${encodeURIComponent(slug)}`);
    }
  };

  const handleCloseDetail = () => {
    setDetailSlug(null);
    if (window.location.pathname.includes('/learn/question/')) {
      window.history.pushState({}, '', '/learn');
    }
  };

  // Load topics and progress
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedTopics, fetchedQuestions, fetchedProgress] = await Promise.all([
        getCatalogTopics(track).catch(() => []),
        getCatalogQuestions({ track, size: 500 }).catch(() => ({ content: [] } as any)),
        getPracticeProgress('local').catch(() => ({}))
      ]);

      setTopics(fetchedTopics);
      setQuestions(fetchedQuestions.content || []);
      setProgressMap(fetchedProgress || {});
    } catch (err) {
      console.error('Failed to load learn view data:', err);
    } finally {
      setLoading(false);
    }
  }, [track]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Overall counts
  const totalQuestions = questions.length;
  const totalSolved = Object.values(progressMap).filter(
    (p) => p && p.solveCount > 0 && questions.some((q) => q.slug === p.questionId)
  ).length;
  const percentage = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;

  // Topics enriched with solved counts from progressMap
  const enrichedTopics = topics.map((t) => {
    // Count how many questions in this topic have solveCount > 0
    const topicQuestions = questions.filter((q) => q.topics && q.topics.includes(t.topic));
    const solvedInTopic = topicQuestions.filter(
      (q) => progressMap[q.slug] && progressMap[q.slug].solveCount > 0
    ).length;
    return {
      ...t,
      solved: solvedInTopic
    };
  });

  const trackTabs = [
    { id: 'ALGORITHMS_DATA_STRUCTURES', label: 'Algorithms & DSA', icon: Code2 },
    { id: 'SYSTEM_DESIGN', label: 'System Design', icon: Layers },
    { id: 'SPRING_LLD', label: 'Low-Level Design', icon: Cpu },
    { id: 'SQL', label: 'SQL & DB', icon: Database }
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
          <button
            type="button"
            onClick={loadData}
            title="Refresh progress & catalog"
            className="p-2 rounded-lg text-text-3 hover:text-text hover:bg-elevated transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
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
              </button>
            );
          })}
        </div>

        {/* Mobile counter */}
        <div className="md:hidden text-xs font-mono text-text-3 whitespace-nowrap">
          {totalSolved}/{totalQuestions} Solved ({percentage}%)
        </div>
      </div>

      {/* Main Content: Topic Rail + Question Table */}
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
          loading={loading}
          selectedTopic={selectedTopic}
          onSolve={onSolveQuestion}
          onOpenDetail={handleOpenDetail}
          onOpenSubmissions={(slug, title) => setSubmissionsTarget({ slug, title })}
        />
      </main>

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
