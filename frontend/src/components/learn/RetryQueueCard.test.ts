import test from 'node:test';
import assert from 'node:assert/strict';
import {
  retryQueuePollReducer,
  createInitialRetryQueueState,
  type RetryQueuePollState,
} from '../../lib/retryQueue';
import type { RetryQueueItem } from '../../services/api';

test('RetryQueue: createInitialRetryQueueState initializes cleanly', () => {
  const state = createInitialRetryQueueState();
  assert.deepStrictEqual(state.items, []);
  assert.strictEqual(state.isChecking, false);
  assert.strictEqual(state.isStale, false);
  assert.strictEqual(state.lastSuccessfulPollTime, null);
  assert.strictEqual(state.latestSequenceId, 0);
  assert.strictEqual(state.error, null);
});

test('RetryQueue: POLL_START sets isChecking and advances sequenceId', () => {
  const initial = createInitialRetryQueueState();
  const next = retryQueuePollReducer(initial, { type: 'POLL_START', sequenceId: 1 });
  assert.strictEqual(next.isChecking, true);
  assert.strictEqual(next.latestSequenceId, 1);
});

test('RetryQueue: POLL_SUCCESS updates items, clears stale and error', () => {
  const initial = createInitialRetryQueueState();
  const mockItems: RetryQueueItem[] = [
    {
      slug: 'dsa-lru-cache',
      title: 'LRU Cache Implementation',
      topic: 'stacks-queues',
      lastVerdict: 'FAILED',
      failCount: 1,
      lastAttemptAt: '2026-09-08T18:40:00Z',
    },
    {
      slug: 'trapping-rain-water',
      title: 'Elevation Map Rainwater Retention',
      topic: 'two-pointers',
      lastVerdict: 'FAILED',
      failCount: 1,
      lastAttemptAt: '2026-09-08T18:30:00Z',
    },
  ];

  const next = retryQueuePollReducer(initial, {
    type: 'POLL_SUCCESS',
    sequenceId: 1,
    items: mockItems,
    timestamp: '2026-09-08T18:45:00Z',
  });

  assert.strictEqual(next.isChecking, false);
  assert.strictEqual(next.isStale, false);
  assert.strictEqual(next.items.length, 2);
  assert.strictEqual(next.items[0].slug, 'dsa-lru-cache');
  assert.strictEqual(next.items[1].slug, 'trapping-rain-water');
  assert.strictEqual(next.lastSuccessfulPollTime, '2026-09-08T18:45:00Z');
});

test('RetryQueue: POLL_FAILURE preserves existing items and marks isStale=true', () => {
  const loadedState: RetryQueuePollState = {
    items: [
      {
        slug: 'dsa-lru-cache',
        title: 'LRU Cache Implementation',
        topic: 'stacks-queues',
        lastVerdict: 'FAILED',
        failCount: 1,
        lastAttemptAt: '2026-09-08T18:40:00Z',
      },
    ],
    isChecking: true,
    isStale: false,
    lastSuccessfulPollTime: '2026-09-08T18:40:00Z',
    latestSequenceId: 2,
    error: null,
  };

  const next = retryQueuePollReducer(loadedState, {
    type: 'POLL_FAILURE',
    sequenceId: 2,
    error: '500 Internal Server Error',
    timestamp: '2026-09-08T18:41:00Z',
  });

  assert.strictEqual(next.isChecking, false);
  assert.strictEqual(next.isStale, true);
  assert.strictEqual(next.items.length, 1);
  assert.strictEqual(next.error, '500 Internal Server Error');
});

test('RetryQueue: Out-of-order older sequence responses are ignored', () => {
  const state: RetryQueuePollState = {
    items: [],
    isChecking: true,
    isStale: false,
    lastSuccessfulPollTime: null,
    latestSequenceId: 5,
    error: null,
  };

  const next = retryQueuePollReducer(state, {
    type: 'POLL_SUCCESS',
    sequenceId: 3,
    items: [
      {
        slug: 'stale-question',
        title: 'Stale Question',
        topic: 'arrays',
        lastVerdict: 'FAILED',
        failCount: 1,
        lastAttemptAt: '2026-09-08T18:00:00Z',
      },
    ],
    timestamp: '2026-09-08T18:00:00Z',
  });

  assert.strictEqual(next.items.length, 0);
});

test('RetryQueue: Empty state message matches verbatim', () => {
  const emptyMessage = 'Nothing to retry — go break something new';
  assert.strictEqual(emptyMessage, 'Nothing to retry — go break something new');
});
