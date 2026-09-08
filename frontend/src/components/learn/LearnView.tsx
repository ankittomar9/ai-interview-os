import React, { useEffect, useState, useCallback, useReducer, useRef, useMemo } from 'react';
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
import {
  getCatalogTopics,
  getCatalogQuestions,
  getPracticeProgress,
  getLearnTree,
  type CatalogTopicSummary,
  type CatalogQuestionSummary,
  type QuestionProgress
} from '../../services/api';
import {
  learnTreePollReducer,
  createInitialLearnTreeState
} from '../../lib/learnTree';
import { TopicRail } from './TopicRail';
import { QuestionTable } from './QuestionTable';
import { SubmissionsDrawer } from './SubmissionsDrawer';
import { QuestionDetailModal } from './QuestionDetailModal';
import { ThemeToggle } from '../ui/ThemeToggle';

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
  const [track, setTrack] = useState<string>('ALGORITHMS_DATA_STRUCTURES');
  const [topics, setTopics] = useState<CatalogTopicSummary[]>([]);
  const [questions, setQuestions] = useState<CatalogQuestionSummary[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, QuestionProgress>>({});
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Anti-freeze learn tree state
  const [treeState, dispatchTree] = useReducer(learnTreePollReducer, undefined, createInitialLearnTreeState);
  const pollSeqRef = useRef<number>(0);

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

  // Poll learn tree with anti-freeze protection
  const pollTree = useCallback(async () => {
    const seq = ++pollSeqRef.current;
    dispatchTree({ type: 'POLL_START', sequenceId: seq });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const treeData = await getLearnTree('local', controller.signal);
      clearTimeout(timer);
      dispatchTree({
        type: 'POLL_SUCCESS',
        sequenceId: seq,
        data: treeData,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name !== 'AbortError') {
        dispatchTree({
          type: 'POLL_FAILURE',
          sequenceId: seq,
          error: err.message || 'Tree poll failed',
          timestamp: new Date().toISOString()
        });
      }
    }
  }, []);

  // Periodic polling for live pressure & progress updates (15s interval)
  useEffect(() => {
    pollTree();
    const interval = setInterval(pollTree, 15000);
    return () => clearInterval(interval);
  }, [pollTree]);

  // Load catalog data & progress
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
      pollTree();
    } catch (err) {
      console.error('Failed to load learn view data:', err);
    } finally {
      setLoading(false);
    }
  }, [track, pollTree]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Build verdict map from tree response
  const verdictMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (treeState.data?.topics) {
      for (const t of treeState.data.topics) {
        if (t.questions) {
          for (const q of t.questions) {
            map[q.slug] = q.verdict;
          }
        }
      }
    }
    return map;
  }, [treeState.data]);

  // Overall counts
  const totalQuestions = questions.length;
  const totalSolved = Object.values(progressMap).filter(
    (p) => p && p.solveCount > 0 && questions.some((q) => q.slug === p.questionId)
  ).length;
  const percentage = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;

  // Enriched topics with tree pressureGap and solved counts
  const enrichedTopics: CatalogTopicSummary[] = useMemo(() => {
    if (treeState.data?.topics && treeState.data.topics.length > 0) {
      const trackTopics = treeState.data.topics.filter(
        (t) => t.track.toUpperCase() === track.toUpperCase()
      );
      if (trackTopics.length > 0) {
        return trackTopics.map((t) => ({
          topic: t.topicId,
          total: t.total ?? 0,
          solved: t.solved,
          displayName: t.topicName,
          pressureGap: t.pressureGap
        }));
      }
    }

    return topics.map((t) => {
      const topicQuestions = questions.filter((q) => q.topics && q.topics.includes(t.topic));
      const solvedInTopic = topicQuestions.filter(
        (q) => progressMap[q.slug] && progressMap[q.slug].solveCount > 0
      ).length;
      return {
        ...t,
        solved: solvedInTopic
      };
    });
  }, [treeState.data, track, topics, questions, progressMap]);

  const trackTabs = [
    { id: 'ALGORITHMS_DATA_STRUCTURES', label: 'Algorithms & DSA', icon: Code2, countKey: 'ALGORITHMS_DATA_STRUCTURES' },
    { id: 'SYSTEM_DESIGN', label: 'System Design', icon: Layers, countKey: 'SYSTEM_DESIGN' },
    { id: 'SPRING_LLD', label: 'Low-Level Design', icon: Cpu, countKey: 'SPRING_LLD' },
    { id: 'SQL', label: 'SQL & DB', icon: Database, countKey: 'SQL' },
    { id: 'BEHAVIORAL_STAR', label: 'Behavioral STAR', icon: Award, countKey: 'BEHAVIORAL_STAR' }
  ];

  const isStale = treeState.isStale || treeState.data?.stale;

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
          verdictMap={verdictMap}
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
