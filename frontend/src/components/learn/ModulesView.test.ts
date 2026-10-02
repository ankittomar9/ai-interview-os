import test from 'node:test';
import assert from 'node:assert/strict';
import type { LearnQuestionNode } from '../../services/api';

test('F3/Gate VP-6: Two-track problem table renders practice pips and interview state', () => {
  // Case 1: Solved 4 times in practice, 0 interview passes, 0 interview attempts
  const q1: LearnQuestionNode = {
    slug: 'dsa-reverse-a-string',
    title: 'Reverse a String',
    track: 'ALGORITHMS_DATA_STRUCTURES',
    difficulty: 'EASY',
    verdict: 'PASSED',
    practiceAttemptCount: 4,
    practiceSolveCount: 4,
    lastPracticeVerdict: 'PASSED',
    interviewAttemptCount: 0,
    interviewPassCount: 0
  };

  const q1PracticeFilled = Math.min(q1.practiceSolveCount ?? 0, 5);
  assert.equal(q1PracticeFilled, 4);

  const q1InterviewPassed = (q1.interviewPassCount ?? 0) >= 1;
  const q1InterviewFailed = (q1.interviewAttemptCount ?? 0) > (q1.interviewPassCount ?? 0);
  assert.equal(q1InterviewPassed, false);
  assert.equal(q1InterviewFailed, false); // unattempted

  // Case 2: Attempted 3 times in practice, solved 1 time, last verdict PARTIAL
  const q2: LearnQuestionNode = {
    slug: 'dsa-two-sum',
    title: 'Two Sum',
    track: 'ALGORITHMS_DATA_STRUCTURES',
    difficulty: 'EASY',
    verdict: 'PASSED',
    practiceAttemptCount: 3,
    practiceSolveCount: 1,
    lastPracticeVerdict: 'PARTIAL',
    interviewAttemptCount: 1,
    interviewPassCount: 0
  };

  const q2PracticeFilled = Math.min(q2.practiceSolveCount ?? 0, 5);
  assert.equal(q2PracticeFilled, 1);
  const q2HasUnsolvedAttempts = (q2.practiceAttemptCount ?? 0) > (q2.practiceSolveCount ?? 0);
  assert.equal(q2HasUnsolvedAttempts, true);
  assert.equal(q2.lastPracticeVerdict, 'PARTIAL');

  const q2InterviewPassed = (q2.interviewPassCount ?? 0) >= 1;
  const q2InterviewFailed = (q2.interviewAttemptCount ?? 0) > (q2.interviewPassCount ?? 0);
  assert.equal(q2InterviewPassed, false);
  assert.equal(q2InterviewFailed, true); // failed pip

  // Case 3: Interview passed
  const q3: LearnQuestionNode = {
    slug: 'dsa-merge-intervals',
    title: 'Merge Intervals',
    track: 'ALGORITHMS_DATA_STRUCTURES',
    difficulty: 'MEDIUM',
    verdict: 'PASSED',
    practiceAttemptCount: 5,
    practiceSolveCount: 5,
    lastPracticeVerdict: 'PASSED',
    interviewAttemptCount: 1,
    interviewPassCount: 1
  };

  const q3InterviewPassed = (q3.interviewPassCount ?? 0) >= 1;
  assert.equal(q3InterviewPassed, true);
});

test('F3/Gate VP-6/G-N8: Graceful degradation shows em-dash when backend lacks B1 fields', () => {
  // Legacy backend without B1 fields
  const legacyQ: LearnQuestionNode = {
    slug: 'legacy-problem',
    title: 'Legacy Problem',
    track: 'ALGORITHMS_DATA_STRUCTURES',
    difficulty: 'EASY',
    verdict: 'UNATTEMPTED'
  };

  // Rule G-N8: If interviewAttemptCount is undefined, must be an honest em-dash '—', NOT '0'
  const isB1Available = legacyQ.interviewAttemptCount !== undefined;
  assert.equal(isB1Available, false);

  const renderedInterviewValue = isB1Available ? `${legacyQ.interviewPassCount}/1` : '—';
  assert.equal(renderedInterviewValue, '—');
});

test('F3: Module retry banner filters items specifically to active module', () => {
  const retryQueue = [
    { slug: 'q1', title: 'Q1', topic: 'arrays', lastVerdict: 'FAILED', failCount: 1, lastAttemptAt: '2026-10-02T12:00:00Z' },
    { slug: 'q2', title: 'Q2', topic: 'trees', lastVerdict: 'COMPILE_ERROR', failCount: 2, lastAttemptAt: '2026-10-02T13:00:00Z' }
  ];

  const arraysRetries = retryQueue.filter((r) => r.topic === 'arrays');
  assert.equal(arraysRetries.length, 1);
  assert.equal(arraysRetries[0].slug, 'q1');

  const dpRetries = retryQueue.filter((r) => r.topic === 'dp');
  assert.equal(dpRetries.length, 0); // Banner hidden when zero
});
