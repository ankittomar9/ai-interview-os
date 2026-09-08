import type { LearnTreeResponse, LearnTopicNode } from '../services/api';

export interface LearnTreePollState {
  data: LearnTreeResponse | null;
  isChecking: boolean;
  isStale: boolean;
  lastSuccessfulPollTime: string | null;
  latestSequenceId: number;
  errorMessage: string | null;
}

export const createInitialLearnTreeState = (): LearnTreePollState => ({
  data: null,
  isChecking: false,
  isStale: false,
  lastSuccessfulPollTime: null,
  latestSequenceId: 0,
  errorMessage: null
});

export type LearnTreePollAction =
  | { type: 'POLL_START'; sequenceId: number }
  | { type: 'POLL_SUCCESS'; sequenceId: number; data: LearnTreeResponse; timestamp: string }
  | { type: 'POLL_FAILURE'; sequenceId: number; error: string; timestamp: string }
  | { type: 'RESET' };

export function learnTreePollReducer(
  state: LearnTreePollState,
  action: LearnTreePollAction
): LearnTreePollState {
  switch (action.type) {
    case 'POLL_START':
      return {
        ...state,
        isChecking: true,
        latestSequenceId: Math.max(state.latestSequenceId, action.sequenceId)
      };

    case 'POLL_SUCCESS':
      if (action.sequenceId < state.latestSequenceId) {
        return state;
      }
      return {
        ...state,
        data: action.data,
        isChecking: false,
        isStale: action.data.stale || false,
        errorMessage: null,
        lastSuccessfulPollTime: action.timestamp
      };

    case 'POLL_FAILURE':
      if (action.sequenceId < state.latestSequenceId) {
        return state;
      }
      return {
        ...state,
        isChecking: false,
        isStale: state.data !== null,
        errorMessage: action.error
      };

    case 'RESET':
      return createInitialLearnTreeState();

    default:
      return state;
  }
}

export interface TreeTotals {
  totalQuestions: number;
  totalSolved: number;
  totalAttempted: number;
  percentage: number;
}

export function calculateTreeTotals(topics: LearnTopicNode[]): TreeTotals {
  let totalQuestions = 0;
  let totalSolved = 0;
  let totalAttempted = 0;

  for (const topic of topics) {
    if (topic.total !== null) {
      totalQuestions += topic.total;
    }
    totalSolved += topic.solved;
    totalAttempted += topic.attempted;
  }

  const percentage = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    totalSolved,
    totalAttempted,
    percentage
  };
}

export function filterTopicsByTrack(topics: LearnTopicNode[], track: string): LearnTopicNode[] {
  if (!track) return topics;
  return topics.filter(
    (t) => t.track.toLowerCase() === track.toLowerCase()
  );
}

export function getVerdictBadgeStyle(verdict: string): {
  label: string;
  className: string;
} {
  switch (verdict) {
    case 'PASSED':
      return {
        label: 'PASSED',
        className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
      };
    case 'FAILED':
      return {
        label: 'FAILED',
        className: 'bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold'
      };
    default:
      return {
        label: 'UNATTEMPTED',
        className: 'bg-elevated/40 text-text-3 border border-border font-medium'
      };
  }
}

export function formatPressureGapPill(pressureGap: string): string {
  if (!pressureGap || !pressureGap.trim()) {
    return 'Practice ×0 · Interview 0/0';
  }
  return pressureGap;
}
