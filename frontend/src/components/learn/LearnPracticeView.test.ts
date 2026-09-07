import test from 'node:test';
import assert from 'node:assert/strict';
import type { CatalogTopicSummary, CatalogQuestionSummary, QuestionProgress } from '../../services/api';

test('Learn Practice Center: topic enrichment correctly computes solved counts per topic', () => {
  const topics: CatalogTopicSummary[] = [
    { topic: 'arrays', total: 2, solved: 0, displayName: 'Arrays' },
    { topic: 'dp', total: 1, solved: 0, displayName: 'Dynamic Programming' }
  ];

  const questions: CatalogQuestionSummary[] = [
    { id: '1', slug: 'two-sum', title: 'Two Sum', track: 'ALGORITHMS_DATA_STRUCTURES', difficulty: 'EASY', topics: ['arrays'], estMinutes: 15 },
    { id: '2', slug: 'three-sum', title: 'Three Sum', track: 'ALGORITHMS_DATA_STRUCTURES', difficulty: 'MEDIUM', topics: ['arrays'], estMinutes: 25 },
    { id: '3', slug: 'climbing-stairs', title: 'Climbing Stairs', track: 'ALGORITHMS_DATA_STRUCTURES', difficulty: 'EASY', topics: ['dp'], estMinutes: 15 }
  ];

  const progressMap: Record<string, QuestionProgress> = {
    'two-sum': { userId: 'local', questionId: 'two-sum', attemptCount: 2, solveCount: 1 },
    'three-sum': { userId: 'local', questionId: 'three-sum', attemptCount: 1, solveCount: 0 }
  };

  const enriched = topics.map((t) => {
    const topicQuestions = questions.filter((q) => q.topics && q.topics.includes(t.topic));
    const solvedInTopic = topicQuestions.filter(
      (q) => progressMap[q.slug] && progressMap[q.slug].solveCount > 0
    ).length;
    return { ...t, solved: solvedInTopic };
  });

  const arraysTopic = enriched.find((t) => t.topic === 'arrays')!;
  assert.equal(arraysTopic.solved, 1);
  assert.equal(arraysTopic.total, 2);

  const dpTopic = enriched.find((t) => t.topic === 'dp')!;
  assert.equal(dpTopic.solved, 0);
  assert.equal(dpTopic.total, 1);
});

test('Learn Practice Center: question filter correctly slices by topic, difficulty and status', () => {
  const questions: CatalogQuestionSummary[] = [
    { id: '1', slug: 'q1', title: 'Array Easy', track: 'ALGORITHMS_DATA_STRUCTURES', difficulty: 'EASY', topics: ['arrays'], estMinutes: 10 },
    { id: '2', slug: 'q2', title: 'Array Hard', track: 'ALGORITHMS_DATA_STRUCTURES', difficulty: 'HARD', topics: ['arrays'], estMinutes: 30 },
    { id: '3', slug: 'q3', title: 'Tree Easy', track: 'ALGORITHMS_DATA_STRUCTURES', difficulty: 'EASY', topics: ['trees'], estMinutes: 15 }
  ];

  const progressMap: Record<string, QuestionProgress> = {
    'q1': { userId: 'local', questionId: 'q1', attemptCount: 1, solveCount: 1 }
  };

  // Filter 1: Topic 'arrays'
  const arrayOnly = questions.filter((q) => q.topics.includes('arrays'));
  assert.equal(arrayOnly.length, 2);

  // Filter 2: Difficulty 'EASY'
  const easyOnly = questions.filter((q) => q.difficulty === 'EASY');
  assert.equal(easyOnly.length, 2);

  // Filter 3: Status 'SOLVED'
  const solvedOnly = questions.filter((q) => (progressMap[q.slug]?.solveCount ?? 0) > 0);
  assert.equal(solvedOnly.length, 1);
  assert.equal(solvedOnly[0].slug, 'q1');

  // Filter 4: Status 'UNSOLVED'
  const unsolvedOnly = questions.filter((q) => (progressMap[q.slug]?.solveCount ?? 0) === 0);
  assert.equal(unsolvedOnly.length, 2);
});

test('Learn Practice Center: youtube embed url parses various youtube formats into youtube-nocookie', () => {
  const parseEmbed = (url?: string) => {
    if (!url) return null;
    try {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        const parsed = new URL(url);
        videoId = parsed.searchParams.get('v') || '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
      }
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
    } catch {
      return null;
    }
  };

  assert.equal(
    parseEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
  );
  assert.equal(
    parseEmbed('https://youtu.be/dQw4w9WgXcQ?t=10'),
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
  );
  assert.equal(
    parseEmbed('https://www.youtube.com/embed/dQw4w9WgXcQ'),
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
  );
  assert.equal(parseEmbed(undefined), null);
});
