import type { DashboardStatsResponse } from '../services/api';

export interface DashboardPollState {
  data: DashboardStatsResponse | null;
  isChecking: boolean;
  isStale: boolean;
  lastSuccessfulPollTime: string | null;
  latestSequenceId: number;
  errorMessage: string | null;
}

export const createInitialDashboardState = (): DashboardPollState => ({
  data: null,
  isChecking: false,
  isStale: false,
  lastSuccessfulPollTime: null,
  latestSequenceId: 0,
  errorMessage: null
});

export type DashboardPollAction =
  | { type: 'POLL_START'; sequenceId: number }
  | { type: 'POLL_SUCCESS'; sequenceId: number; data: DashboardStatsResponse; timestamp: string }
  | { type: 'POLL_FAILURE'; sequenceId: number; error: string; timestamp: string }
  | { type: 'RESET' };

export function dashboardPollReducer(
  state: DashboardPollState,
  action: DashboardPollAction
): DashboardPollState {
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
        isStale: false,
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
      return createInitialDashboardState();

    default:
      return state;
  }
}

export function formatRate(rate: number): string {
  if (isNaN(rate) || !isFinite(rate)) return '0.0%';
  return `${rate.toFixed(1)}%`;
}

export function calculatePressureGapText(practiceSolves: number, interviewPasses: number, interviewAttempts: number): string {
  return `Practice ×${practiceSolves} · Interview ${interviewPasses}/${interviewAttempts}`;
}
