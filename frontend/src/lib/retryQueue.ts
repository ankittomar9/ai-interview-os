import type { RetryQueueItem } from '../services/api';

export interface RetryQueuePollState {
  items: RetryQueueItem[];
  isChecking: boolean;
  isStale: boolean;
  lastSuccessfulPollTime: string | null;
  latestSequenceId: number;
  error: string | null;
}

export const createInitialRetryQueueState = (): RetryQueuePollState => ({
  items: [],
  isChecking: false,
  isStale: false,
  lastSuccessfulPollTime: null,
  latestSequenceId: 0,
  error: null,
});

export type RetryQueuePollAction =
  | { type: 'POLL_START'; sequenceId: number }
  | { type: 'POLL_SUCCESS'; sequenceId: number; items: RetryQueueItem[]; timestamp: string }
  | { type: 'POLL_FAILURE'; sequenceId: number; error: string; timestamp: string }
  | { type: 'RESET' };

export function retryQueuePollReducer(
  state: RetryQueuePollState,
  action: RetryQueuePollAction
): RetryQueuePollState {
  switch (action.type) {
    case 'POLL_START':
      return {
        ...state,
        isChecking: true,
        latestSequenceId: Math.max(state.latestSequenceId, action.sequenceId),
      };

    case 'POLL_SUCCESS':
      if (action.sequenceId < state.latestSequenceId) {
        return state;
      }
      return {
        ...state,
        items: action.items,
        isChecking: false,
        isStale: false,
        error: null,
        lastSuccessfulPollTime: action.timestamp,
      };

    case 'POLL_FAILURE':
      if (action.sequenceId < state.latestSequenceId) {
        return state;
      }
      return {
        ...state,
        isChecking: false,
        isStale: state.items.length > 0,
        error: action.error,
      };

    case 'RESET':
      return createInitialRetryQueueState();

    default:
      return state;
  }
}
