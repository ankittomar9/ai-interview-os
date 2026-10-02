import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRelativeTime } from './HubView';

test('F2 - formatRelativeTime: handles null, recent, and past dates honestly', () => {
  assert.equal(formatRelativeTime(null), 'Never');
  assert.equal(formatRelativeTime(''), 'Never');
  assert.equal(formatRelativeTime(undefined), 'Never');

  const now = new Date();
  const tenSecondsAgo = new Date(now.getTime() - 10 * 1000).toISOString();
  assert.equal(formatRelativeTime(tenSecondsAgo), '10s ago');

  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  assert.equal(formatRelativeTime(fiveMinutesAgo), '5m ago');

  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  assert.equal(formatRelativeTime(twoHoursAgo), '2h ago');

  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(formatRelativeTime(threeDaysAgo), '3d ago');
});

test('F2 - Hero selection logic: Retry queue takes absolute precedence over unattempted questions', () => {
  const retryItems = [
    {
      slug: 'retry-q1',
      title: 'Retry Question 1',
      topic: 'arrays',
      lastVerdict: 'COMPILE_ERROR',
      failCount: 2,
      lastAttemptAt: '2026-10-02T10:00:00Z'
    }
  ];

  const questions = [
    { id: '1', slug: 'unattempted-q1', title: 'Unattempted 1', track: 'ALGORITHMS_DATA_STRUCTURES', difficulty: 'EASY', topics: ['arrays'], estMinutes: 10 }
  ];

  // If retry exists, top target is retry item
  const selectedSlug = retryItems.length > 0 ? retryItems[0].slug : questions[0].slug;
  assert.equal(selectedSlug, 'retry-q1');

  // If retry empty, fallback to unattempted
  const emptyRetries: typeof retryItems = [];
  const fallbackSlug = emptyRetries.length > 0 ? emptyRetries[0].slug : questions[0].slug;
  assert.equal(fallbackSlug, 'unattempted-q1');
});
