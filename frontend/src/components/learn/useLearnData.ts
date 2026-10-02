import { useState, useEffect, useCallback, useReducer, useRef, useMemo } from 'react';
import {
  getCatalogTopics,
  getCatalogQuestions,
  getPracticeProgress,
  getLearnTree,
  getRetryQueue,
  type CatalogTopicSummary,
  type CatalogQuestionSummary,
  type QuestionProgress
} from '../../services/api';
import {
  learnTreePollReducer,
  createInitialLearnTreeState,
  type LearnTreePollState
} from '../../lib/learnTree';
import {
  retryQueuePollReducer,
  createInitialRetryQueueState,
  type RetryQueuePollState
} from '../../lib/retryQueue';

export type LearnViewMode = 'hub' | 'modules';

export const STORAGE_KEY_VIEW_MODE = 'aiio.learn.viewMode';

/**
 * Pure resolver for initial view mode.
 * Rule: URL ?view= wins over localStorage; localStorage wins over default 'hub'.
 */
export function resolveInitialViewMode(
  search: string,
  storageValue: string | null
): LearnViewMode {
  const params = new URLSearchParams(search);
  const viewParam = params.get('view');
  if (viewParam === 'hub' || viewParam === 'modules') {
    return viewParam;
  }
  if (storageValue === 'hub' || storageValue === 'modules') {
    return storageValue;
  }
  return 'hub';
}

/**
 * Builds standard pathname + search for Playground navigation.
 */
export function buildLearnUrl(params: {
  viewMode: LearnViewMode;
  topicId?: string | null;
  detailSlug?: string | null;
}): string {
  const { viewMode, topicId, detailSlug } = params;
  const pathname = detailSlug
    ? `/learn/question/${encodeURIComponent(detailSlug)}`
    : '/learn';

  const searchParams = new URLSearchParams();
  searchParams.set('view', viewMode);
  if (viewMode === 'modules' && topicId) {
    searchParams.set('topic', topicId);
  }

  const qs = searchParams.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Parses /learn location pathname and search parameters.
 */
export function parseLearnUrl(pathname: string, search: string): {
  viewMode: LearnViewMode;
  topicId: string | null;
  detailSlug: string | null;
} {
  const params = new URLSearchParams(search);
  const viewParam = params.get('view');
  const viewMode: LearnViewMode =
    viewParam === 'hub' || viewParam === 'modules' ? viewParam : 'hub';

  const topicId = params.get('topic');

  const match = pathname.match(/\/learn\/question\/([^/]+)/);
  const detailSlug = match && match[1] ? decodeURIComponent(match[1]) : null;

  return { viewMode, topicId, detailSlug };
}

export interface UseLearnDataOptions {
  initialTrack?: string;
  userId?: string;
  pollIntervalMs?: number;
}

export interface UseLearnDataReturn {
  track: string;
  setTrack: (track: string) => void;
  topics: CatalogTopicSummary[];
  questions: CatalogQuestionSummary[];
  progressMap: Record<string, QuestionProgress>;
  selectedTopic: string | null;
  setSelectedTopic: (topic: string | null) => void;
  loading: boolean;
  treeState: LearnTreePollState;
  retryState: RetryQueuePollState;
  verdictMap: Record<string, string>;
  enrichedTopics: CatalogTopicSummary[];
  totalQuestions: number;
  totalSolved: number;
  percentage: number;
  isStale: boolean;
  loadData: () => Promise<void>;
  pollTree: () => Promise<void>;
  pollRetry: () => Promise<void>;
}

export function useLearnData(options?: UseLearnDataOptions): UseLearnDataReturn {
  const initialTrack = options?.initialTrack ?? 'ALGORITHMS_DATA_STRUCTURES';
  const userId = options?.userId ?? 'local';
  const pollIntervalMs = options?.pollIntervalMs ?? 15000;

  const [track, setTrack] = useState<string>(initialTrack);
  const [topics, setTopics] = useState<CatalogTopicSummary[]>([]);
  const [questions, setQuestions] = useState<CatalogQuestionSummary[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, QuestionProgress>>({});
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Anti-freeze learn tree state
  const [treeState, dispatchTree] = useReducer(
    learnTreePollReducer,
    undefined,
    createInitialLearnTreeState
  );
  const pollSeqRef = useRef<number>(0);

  // Anti-freeze retry queue state
  const [retryState, dispatchRetry] = useReducer(
    retryQueuePollReducer,
    undefined,
    createInitialRetryQueueState
  );
  const retryPollSeqRef = useRef<number>(0);

  // Poll learn tree with anti-freeze protection (5s timeout)
  const pollTree = useCallback(async () => {
    const seq = ++pollSeqRef.current;
    dispatchTree({ type: 'POLL_START', sequenceId: seq });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const treeData = await getLearnTree(userId, controller.signal);
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
  }, [userId]);

  // Poll retry queue with anti-freeze protection (5s timeout)
  const pollRetry = useCallback(async () => {
    const seq = ++retryPollSeqRef.current;
    dispatchRetry({ type: 'POLL_START', sequenceId: seq });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const retryItems = await getRetryQueue(userId, controller.signal);
      clearTimeout(timer);
      dispatchRetry({
        type: 'POLL_SUCCESS',
        sequenceId: seq,
        items: retryItems,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name !== 'AbortError') {
        dispatchRetry({
          type: 'POLL_FAILURE',
          sequenceId: seq,
          error: err.message || 'Retry queue poll failed',
          timestamp: new Date().toISOString()
        });
      }
    }
  }, [userId]);

  // Unified single polling effect: exactly one tree poll and one retry poll per interval
  useEffect(() => {
    pollTree();
    pollRetry();
    const interval = setInterval(() => {
      pollTree();
      pollRetry();
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollTree, pollRetry, pollIntervalMs]);

  // Load catalog data & progress
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedTopics, fetchedQuestions, fetchedProgress] = await Promise.all([
        getCatalogTopics(track).catch(() => []),
        getCatalogQuestions({ track, size: 500 }).catch(() => ({ content: [] } as any)),
        getPracticeProgress(userId).catch(() => ({}))
      ]);

      setTopics(fetchedTopics);
      setQuestions(fetchedQuestions.content || []);
      setProgressMap(fetchedProgress || {});
      pollTree();
      pollRetry();
    } catch (err) {
      console.error('Failed to load learn view data:', err);
    } finally {
      setLoading(false);
    }
  }, [track, userId, pollTree, pollRetry]);

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
          pressureGap: t.pressureGap,
          interviewAttempted: t.interviewAttempted,
          interviewPassed: t.interviewPassed
        }));
      }
    }

    return topics.map((t) => {
      const topicId = t.topic || (t as any).id || '';
      const topicQuestions = questions.filter((q) => q.topics && q.topics.includes(topicId));
      const solvedInTopic = topicQuestions.filter(
        (q) => progressMap[q.slug] && progressMap[q.slug].solveCount > 0
      ).length;
      return {
        ...t,
        topic: topicId,
        displayName: t.displayName || (t as any).name || (topicId ? topicId.replace(/-/g, ' ') : 'Topic'),
        solved: solvedInTopic
      };
    });
  }, [treeState.data, track, topics, questions, progressMap]);

  const isStale = !!(treeState.isStale || treeState.data?.stale);

  return {
    track,
    setTrack,
    topics,
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
    loadData,
    pollTree,
    pollRetry
  };
}
