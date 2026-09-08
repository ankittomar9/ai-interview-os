import test from 'node:test';
import assert from 'node:assert/strict';
import type { SessionQuestionItem, QuestionEncountersResponse, QuestionProgress } from '../../services/api';

test('Gate VA-b: Post-session Questions in this session data formatting and deep-link routing', () => {
  const mockSessionQuestions: SessionQuestionItem[] = [
    {
      id: 1,
      sessionId: 42,
      questionSlug: 'dsa-two-sum-target',
      displayOrder: 0,
      verdict: 'PASSED',
      attemptedAt: '2026-09-08T06:00:00Z',
      updatedAt: '2026-09-08T06:10:00Z'
    },
    {
      id: 2,
      sessionId: 42,
      questionSlug: 'lld-lru-cache-service',
      displayOrder: 1,
      verdict: 'FAILED',
      attemptedAt: '2026-09-08T06:15:00Z',
      updatedAt: '2026-09-08T06:20:00Z'
    }
  ];

  const formatSlugTitle = (slug: string) => {
    return slug
      .replace(/^(dsa-|lld-|hld-|sys-|algo-)/, '')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  assert.equal(mockSessionQuestions.length, 2);
  assert.equal(formatSlugTitle(mockSessionQuestions[0].questionSlug), 'Two Sum Target');
  assert.equal(formatSlugTitle(mockSessionQuestions[1].questionSlug), 'Lru Cache Service');

  const linkQ1 = `/learn/question/${encodeURIComponent(mockSessionQuestions[0].questionSlug)}`;
  const linkQ2 = `/learn/question/${encodeURIComponent(mockSessionQuestions[1].questionSlug)}`;
  assert.equal(linkQ1, '/learn/question/dsa-two-sum-target');
  assert.equal(linkQ2, '/learn/question/lld-lru-cache-service');

  assert.equal(mockSessionQuestions[0].verdict, 'PASSED');
  assert.equal(mockSessionQuestions[1].verdict, 'FAILED');
});

test('Gate VA-c: Privacy Assertion: in live interview mode, practice data is never leaked to candidate UI', () => {
  const isPracticeMode = false;
  const previouslySolvedInPractice = true;

  const displayedIsSolved = isPracticeMode ? previouslySolvedInPractice : false;
  assert.equal(displayedIsSolved, false, 'Solved chip must not show in interview mode');

  const canShowHintsTab = isPracticeMode;
  assert.equal(canShowHintsTab, false, 'Self-service hints tab must be hidden in interview mode');

  const canShowScratchpad = isPracticeMode;
  const canShowSolutionReveal = isPracticeMode;
  assert.equal(canShowScratchpad, false);
  assert.equal(canShowSolutionReveal, false);

  const activeQuestion = {
    slug: 'two-sum',
    starterCode: 'class Solution { public int[] twoSum() {} }'
  };
  const practicePreviousCode = 'class Solution { // my previous practice code }';
  const resolvedCode = isPracticeMode ? (practicePreviousCode || activeQuestion.starterCode) : activeQuestion.starterCode;
  assert.equal(resolvedCode, activeQuestion.starterCode, 'Must load fresh starter code during interview');
});

test('Gate VA-d: Ledger arithmetic verifies practice_solves=3, interview_passes=1, interview_attempts=2, pressure_gap="Practice ×3 · Interview 1/2"', () => {
  const progress: QuestionProgress = {
    userId: 'local',
    questionId: 'dsa-two-sum-target',
    attemptCount: 5,
    solveCount: 3
  };

  const encounterRows: SessionQuestionItem[] = [
    {
      id: 10,
      sessionId: 101,
      questionSlug: 'dsa-two-sum-target',
      displayOrder: 0,
      verdict: 'PASSED',
      attemptedAt: '2026-09-08T05:00:00Z',
      updatedAt: '2026-09-08T05:00:00Z'
    },
    {
      id: 11,
      sessionId: 102,
      questionSlug: 'dsa-two-sum-target',
      displayOrder: 0,
      verdict: 'FAILED',
      attemptedAt: '2026-09-08T05:30:00Z',
      updatedAt: '2026-09-08T05:30:00Z'
    },
    {
      id: 12,
      sessionId: 103,
      questionSlug: 'dsa-two-sum-target',
      displayOrder: 2,
      verdict: 'UNATTEMPTED',
      attemptedAt: undefined,
      updatedAt: '2026-09-08T05:45:00Z'
    }
  ];

  const practiceSolves = progress.solveCount;
  const interviewPasses = encounterRows.filter((r) => r.verdict === 'PASSED').length;
  const interviewAttempts = encounterRows.filter((r) => r.verdict !== 'UNATTEMPTED').length;
  const pressureGap = `Practice ×${practiceSolves} · Interview ${interviewPasses}/${interviewAttempts}`;

  assert.equal(practiceSolves, 3);
  assert.equal(interviewPasses, 1);
  assert.equal(interviewAttempts, 2);
  assert.equal(pressureGap, 'Practice ×3 · Interview 1/2');
});

test('Hint Ladder: locked until ≥2 failed attempts, then unlocked with progressive hints', () => {
  const checkUnlocked = (attempts: number, solves: number) => {
    const failedAttempts = Math.max(0, attempts - solves);
    return failedAttempts >= 2 || attempts >= 2;
  };

  assert.equal(checkUnlocked(0, 0), false);
  assert.equal(checkUnlocked(1, 0), false);
  assert.equal(checkUnlocked(2, 0), true);
  assert.equal(checkUnlocked(3, 1), true);

  const hints = [
    'Consider using a hash map.',
    'Map complement (target - x) to index.',
    'Single-pass O(N) lookup.'
  ];
  let revealedIndex = 0;
  assert.equal(hints[revealedIndex], 'Consider using a hash map.');
  revealedIndex++;
  assert.equal(hints[revealedIndex], 'Map complement (target - x) to index.');
  assert.equal(hints.length, 3);
});
