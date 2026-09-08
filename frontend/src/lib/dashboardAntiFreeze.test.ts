import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialDashboardState,
  dashboardPollReducer,
  formatRate,
  calculatePressureGapText
} from './dashboardAntiFreeze.ts';
import type { DashboardStatsResponse } from '../services/api.ts';

const mockDashboardData: DashboardStatsResponse = {
  userId: 'vp10-candidate',
  generatedAt: '2026-09-08T15:30:00Z',
  practice: {
    totalAttempts: 4,
    passedAttempts: 3,
    failedAttempts: 1,
    successRate: 75.0,
    questionsAttempted: 4,
    questionsSolved: 3,
    trackBreakdown: { ALGORITHMS_DATA_STRUCTURES: 4 }
  },
  interview: {
    totalSessions: 1,
    completedSessions: 1,
    totalQuestions: 2,
    passedQuestions: 1,
    failedQuestions: 1,
    unattemptedQuestions: 0,
    attemptedQuestions: 2,
    successRate: 50.0
  },
  overall: {
    totalSolved: 4,
    totalAttempts: 6,
    overallSuccessRate: 66.7,
    pressureGap: 'Practice ×3 · Interview 1/2'
  },
  recentActivity: []
};

test('Dashboard Anti-Freeze: Initial state is clean and non-stale', () => {
  const state = createInitialDashboardState();
  assert.equal(state.data, null);
  assert.equal(state.isChecking, false);
  assert.equal(state.isStale, false);
  assert.equal(state.latestSequenceId, 0);
  assert.equal(state.errorMessage, null);
});

test('Dashboard Anti-Freeze: POLL_START marks isChecking=true and updates latestSequenceId', () => {
  const initial = createInitialDashboardState();
  const next = dashboardPollReducer(initial, { type: 'POLL_START', sequenceId: 1 });
  assert.equal(next.isChecking, true);
  assert.equal(next.latestSequenceId, 1);
});

test('Dashboard Anti-Freeze: POLL_SUCCESS commits data and clears isChecking and isStale', () => {
  const started = dashboardPollReducer(createInitialDashboardState(), { type: 'POLL_START', sequenceId: 1 });
  const success = dashboardPollReducer(started, {
    type: 'POLL_SUCCESS',
    sequenceId: 1,
    data: mockDashboardData,
    timestamp: '15:30:00'
  });

  assert.equal(success.isChecking, false);
  assert.equal(success.isStale, false);
  assert.equal(success.errorMessage, null);
  assert.equal(success.lastSuccessfulPollTime, '15:30:00');
  assert.deepEqual(success.data, mockDashboardData);
  assert.equal(success.data?.practice.totalAttempts, 4);
  assert.equal(success.data?.practice.passedAttempts, 3);
  assert.equal(success.data?.interview.totalQuestions, 2);
});

test('Dashboard Anti-Freeze: POLL_FAILURE preserves existing numbers and marks isStale=true without freeze', () => {
  // 1. Initial success poll #1
  const poll1Start = dashboardPollReducer(createInitialDashboardState(), { type: 'POLL_START', sequenceId: 1 });
  const poll1Success = dashboardPollReducer(poll1Start, {
    type: 'POLL_SUCCESS',
    sequenceId: 1,
    data: mockDashboardData,
    timestamp: '15:30:00'
  });

  // 2. Subsequent poll #2 fails (network timeout or backend blip)
  const poll2Start = dashboardPollReducer(poll1Success, { type: 'POLL_START', sequenceId: 2 });
  const poll2Failed = dashboardPollReducer(poll2Start, {
    type: 'POLL_FAILURE',
    sequenceId: 2,
    error: 'Request timed out after 5000ms',
    timestamp: '15:30:05'
  });

  // Assert anti-freeze behavior:
  // - UI is NOT checking (spinner stopped)
  // - Existing metrics are PRESERVED intact (not wiped to null or 0)
  // - isStale is TRUE so UI can show "Data may be stale"
  assert.equal(poll2Failed.isChecking, false);
  assert.equal(poll2Failed.isStale, true);
  assert.equal(poll2Failed.errorMessage, 'Request timed out after 5000ms');
  assert.deepEqual(poll2Failed.data, mockDashboardData);

  // 3. Recovery poll #3 succeeds -> instantly restores fresh state
  const updatedData: DashboardStatsResponse = {
    ...mockDashboardData,
    practice: { ...mockDashboardData.practice, totalAttempts: 5, passedAttempts: 4 }
  };
  const poll3Start = dashboardPollReducer(poll2Failed, { type: 'POLL_START', sequenceId: 3 });
  const poll3Success = dashboardPollReducer(poll3Start, {
    type: 'POLL_SUCCESS',
    sequenceId: 3,
    data: updatedData,
    timestamp: '15:30:10'
  });

  assert.equal(poll3Success.isChecking, false);
  assert.equal(poll3Success.isStale, false);
  assert.equal(poll3Success.errorMessage, null);
  assert.equal(poll3Success.data?.practice.totalAttempts, 5);
  assert.equal(poll3Success.data?.practice.passedAttempts, 4);
});

test('Dashboard Anti-Freeze: Out-of-order poll responses are dropped to prevent stale race condition', () => {
  const initial = createInitialDashboardState();
  // Poll 1 starts
  const p1 = dashboardPollReducer(initial, { type: 'POLL_START', sequenceId: 1 });
  // Poll 2 starts before Poll 1 returns
  const p2 = dashboardPollReducer(p1, { type: 'POLL_START', sequenceId: 2 });
  // Poll 2 finishes first
  const p2Success = dashboardPollReducer(p2, {
    type: 'POLL_SUCCESS',
    sequenceId: 2,
    data: mockDashboardData,
    timestamp: '15:30:02'
  });

  // Late Poll 1 arrives afterward with older data
  const olderData: DashboardStatsResponse = {
    ...mockDashboardData,
    practice: { ...mockDashboardData.practice, totalAttempts: 1 }
  };
  const afterLatePoll1 = dashboardPollReducer(p2Success, {
    type: 'POLL_SUCCESS',
    sequenceId: 1,
    data: olderData,
    timestamp: '15:30:03'
  });

  // State must NOT be overwritten with older poll 1 data
  assert.equal(afterLatePoll1.data?.practice.totalAttempts, 4);
  assert.equal(afterLatePoll1.latestSequenceId, 2);
});

test('Dashboard Helper: formatRate formats percentage cleanly', () => {
  assert.equal(formatRate(75.0), '75.0%');
  assert.equal(formatRate(66.666), '66.7%');
  assert.equal(formatRate(0), '0.0%');
  assert.equal(formatRate(NaN), '0.0%');
});

test('Dashboard Helper: calculatePressureGapText formats correctly', () => {
  assert.equal(calculatePressureGapText(3, 1, 2), 'Practice ×3 · Interview 1/2');
  assert.equal(calculatePressureGapText(0, 0, 0), 'Practice ×0 · Interview 0/0');
});
