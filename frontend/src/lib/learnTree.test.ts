import { test } from 'node:test';
import assert from 'node:assert';
import {
  createInitialLearnTreeState,
  learnTreePollReducer,
  calculateTreeTotals,
  filterTopicsByTrack,
  getVerdictBadgeStyle,
  formatPressureGapPill,
  type LearnTreePollState
} from './learnTree';
import type { LearnTreeResponse, LearnTopicNode } from '../services/api';

test('createInitialLearnTreeState returns clean empty state', () => {
  const state = createInitialLearnTreeState();
  assert.strictEqual(state.data, null);
  assert.strictEqual(state.isChecking, false);
  assert.strictEqual(state.isStale, false);
  assert.strictEqual(state.lastSuccessfulPollTime, null);
  assert.strictEqual(state.latestSequenceId, 0);
  assert.strictEqual(state.errorMessage, null);
});

test('learnTreePollReducer: POLL_START marks isChecking and increments sequenceId', () => {
  const initial = createInitialLearnTreeState();
  const next = learnTreePollReducer(initial, { type: 'POLL_START', sequenceId: 1 });
  assert.strictEqual(next.isChecking, true);
  assert.strictEqual(next.latestSequenceId, 1);
});

test('learnTreePollReducer: POLL_SUCCESS stores data and clears errors', () => {
  const initial = createInitialLearnTreeState();
  const started = learnTreePollReducer(initial, { type: 'POLL_START', sequenceId: 1 });
  const mockTree: LearnTreeResponse = {
    topics: [],
    trackTotals: { ALGORITHMS_DATA_STRUCTURES: 316 },
    stale: false
  };
  const success = learnTreePollReducer(started, {
    type: 'POLL_SUCCESS',
    sequenceId: 1,
    data: mockTree,
    timestamp: '2026-09-08T18:00:00Z'
  });
  assert.strictEqual(success.isChecking, false);
  assert.strictEqual(success.isStale, false);
  assert.strictEqual(success.data, mockTree);
  assert.strictEqual(success.lastSuccessfulPollTime, '2026-09-08T18:00:00Z');
  assert.strictEqual(success.errorMessage, null);
});

test('learnTreePollReducer: drops out-of-order responses with older sequenceId', () => {
  const initial = createInitialLearnTreeState();
  const poll1 = learnTreePollReducer(initial, { type: 'POLL_START', sequenceId: 1 });
  const poll2 = learnTreePollReducer(poll1, { type: 'POLL_START', sequenceId: 2 });

  const stalePayload: LearnTreeResponse = { topics: [], trackTotals: {}, stale: true };
  const dropped = learnTreePollReducer(poll2, {
    type: 'POLL_SUCCESS',
    sequenceId: 1,
    data: stalePayload,
    timestamp: '2026-09-08T17:59:00Z'
  });
  // State remains untouched
  assert.strictEqual(dropped.data, null);
  assert.strictEqual(dropped.latestSequenceId, 2);
});

test('learnTreePollReducer: anti-freeze preserves existing data on POLL_FAILURE with isStale=true', () => {
  const mockTree: LearnTreeResponse = {
    topics: [],
    trackTotals: { ALGORITHMS_DATA_STRUCTURES: 316 },
    stale: false
  };
  const withData: LearnTreePollState = {
    data: mockTree,
    isChecking: true,
    isStale: false,
    lastSuccessfulPollTime: '2026-09-08T18:00:00Z',
    latestSequenceId: 3,
    errorMessage: null
  };

  const failed = learnTreePollReducer(withData, {
    type: 'POLL_FAILURE',
    sequenceId: 3,
    error: 'HTTP 500 Internal Server Error',
    timestamp: '2026-09-08T18:00:15Z'
  });

  assert.strictEqual(failed.isChecking, false);
  assert.strictEqual(failed.isStale, true);
  assert.strictEqual(failed.data, mockTree); // Data not erased!
  assert.strictEqual(failed.errorMessage, 'HTTP 500 Internal Server Error');
});

test('learnTreePollReducer: RESET returns initial clean state', () => {
  const mockTree: LearnTreeResponse = { topics: [], trackTotals: {}, stale: false };
  const withData: LearnTreePollState = {
    data: mockTree,
    isChecking: false,
    isStale: true,
    lastSuccessfulPollTime: '2026-09-08T18:00:00Z',
    latestSequenceId: 5,
    errorMessage: 'error'
  };
  const reset = learnTreePollReducer(withData, { type: 'RESET' });
  assert.strictEqual(reset.data, null);
  assert.strictEqual(reset.latestSequenceId, 0);
  assert.strictEqual(reset.isStale, false);
});

test('calculateTreeTotals sums totals, solved, and calculates percentage correctly', () => {
  const mockTopics: LearnTopicNode[] = [
    {
      topicId: 'arrays',
      topicName: 'Arrays',
      track: 'ALGORITHMS_DATA_STRUCTURES',
      total: 50,
      attempted: 10,
      solved: 25,
      passed: 5,
      failed: 2,
      pressureGap: 'Practice ×25 · Interview 5/7',
      questions: []
    },
    {
      topicId: 'dp',
      topicName: 'Dynamic Programming',
      track: 'ALGORITHMS_DATA_STRUCTURES',
      total: 50,
      attempted: 5,
      solved: 15,
      passed: 0,
      failed: 1,
      pressureGap: 'Practice ×15 · Interview 0/1',
      questions: []
    }
  ];

  const totals = calculateTreeTotals(mockTopics);
  assert.strictEqual(totals.totalQuestions, 100);
  assert.strictEqual(totals.totalSolved, 40);
  assert.strictEqual(totals.totalAttempted, 15);
  assert.strictEqual(totals.percentage, 40);
});

test('calculateTreeTotals handles degraded null totals gracefully', () => {
  const degradedTopics: LearnTopicNode[] = [
    {
      topicId: 'arrays',
      topicName: 'Arrays',
      track: 'ALGORITHMS_DATA_STRUCTURES',
      total: null,
      attempted: 2,
      solved: 2,
      passed: 0,
      failed: 0,
      pressureGap: 'Practice ×2 · Interview 0/0',
      questions: []
    }
  ];

  const totals = calculateTreeTotals(degradedTopics);
  assert.strictEqual(totals.totalQuestions, 0);
  assert.strictEqual(totals.totalSolved, 2);
  assert.strictEqual(totals.percentage, 0);
});

test('filterTopicsByTrack filters topics by track name case-insensitively', () => {
  const mockTopics: LearnTopicNode[] = [
    {
      topicId: 'arrays',
      topicName: 'Arrays',
      track: 'ALGORITHMS_DATA_STRUCTURES',
      total: 56,
      attempted: 0,
      solved: 0,
      passed: 0,
      failed: 0,
      pressureGap: 'Practice ×0 · Interview 0/0',
      questions: []
    },
    {
      topicId: 'system-design',
      topicName: 'System Design',
      track: 'SYSTEM_DESIGN',
      total: 27,
      attempted: 0,
      solved: 0,
      passed: 0,
      failed: 0,
      pressureGap: 'Practice ×0 · Interview 0/0',
      questions: []
    }
  ];

  const dsa = filterTopicsByTrack(mockTopics, 'algorithms_data_structures');
  assert.strictEqual(dsa.length, 1);
  assert.strictEqual(dsa[0].topicId, 'arrays');

  const sys = filterTopicsByTrack(mockTopics, 'SYSTEM_DESIGN');
  assert.strictEqual(sys.length, 1);
  assert.strictEqual(sys[0].topicId, 'system-design');
});

test('getVerdictBadgeStyle returns correct classes and labels for all verdicts', () => {
  const passed = getVerdictBadgeStyle('PASSED');
  assert.strictEqual(passed.label, 'PASSED');
  assert.ok(passed.className.includes('emerald'));

  const failed = getVerdictBadgeStyle('FAILED');
  assert.strictEqual(failed.label, 'FAILED');
  assert.ok(failed.className.includes('rose'));

  const unattempted = getVerdictBadgeStyle('UNATTEMPTED');
  assert.strictEqual(unattempted.label, 'UNATTEMPTED');
  assert.ok(unattempted.className.includes('elevated'));
});

test('formatPressureGapPill returns valid fallback if empty', () => {
  assert.strictEqual(formatPressureGapPill(''), 'Practice ×0 · Interview 0/0');
  assert.strictEqual(formatPressureGapPill('Practice ×3 · Interview 1/2'), 'Practice ×3 · Interview 1/2');
});
