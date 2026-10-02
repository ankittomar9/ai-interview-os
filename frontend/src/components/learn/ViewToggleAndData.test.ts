import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveInitialViewMode,
  buildLearnUrl,
  parseLearnUrl,
  STORAGE_KEY_VIEW_MODE,
  type LearnViewMode
} from './useLearnData';

test('F1 - resolveInitialViewMode: URL ?view= wins over localStorage and default', () => {
  // 1. URL ?view=modules wins over null localStorage
  assert.equal(resolveInitialViewMode('?view=modules', null), 'modules');

  // 2. URL ?view=hub wins over 'modules' localStorage
  assert.equal(resolveInitialViewMode('?view=hub', 'modules'), 'hub');

  // 3. URL ?view=modules wins over 'hub' localStorage
  assert.equal(resolveInitialViewMode('?view=modules', 'hub'), 'modules');

  // 4. URL without ?view falls back to valid localStorage
  assert.equal(resolveInitialViewMode('', 'modules'), 'modules');
  assert.equal(resolveInitialViewMode('', 'hub'), 'hub');

  // 5. URL with other params falls back to localStorage
  assert.equal(resolveInitialViewMode('?topic=arrays', 'modules'), 'modules');

  // 6. Invalid URL view falls back to valid localStorage
  assert.equal(resolveInitialViewMode('?view=invalid', 'modules'), 'modules');

  // 7. Invalid URL and invalid/empty localStorage falls back to default 'hub'
  assert.equal(resolveInitialViewMode('', null), 'hub');
  assert.equal(resolveInitialViewMode('?view=other', 'corrupt'), 'hub');
});

test('F1 - buildLearnUrl: formats hub and modules paths with query params', () => {
  // Hub view
  const hubUrl = buildLearnUrl({ viewMode: 'hub' });
  assert.equal(hubUrl, '/learn?view=hub');

  // Modules view without topic
  const modUrl = buildLearnUrl({ viewMode: 'modules' });
  assert.equal(modUrl, '/learn?view=modules');

  // Modules view with topic
  const modTopicUrl = buildLearnUrl({ viewMode: 'modules', topicId: 'arrays' });
  assert.equal(modTopicUrl, '/learn?view=modules&topic=arrays');

  // Detail modal opened in Hub view
  const hubDetailUrl = buildLearnUrl({ viewMode: 'hub', detailSlug: 'two-sum' });
  assert.equal(hubDetailUrl, '/learn/question/two-sum?view=hub');

  // Detail modal opened in Modules view with topic
  const modDetailUrl = buildLearnUrl({
    viewMode: 'modules',
    topicId: 'arrays',
    detailSlug: 'dsa-two-sum'
  });
  assert.equal(modDetailUrl, '/learn/question/dsa-two-sum?view=modules&topic=arrays');
});

test('F1 - parseLearnUrl: extracts viewMode, topicId, and detailSlug correctly', () => {
  // Simple hub URL
  const parsed1 = parseLearnUrl('/learn', '?view=hub');
  assert.equal(parsed1.viewMode, 'hub');
  assert.equal(parsed1.topicId, null);
  assert.equal(parsed1.detailSlug, null);

  // Modules URL with topic
  const parsed2 = parseLearnUrl('/learn', '?view=modules&topic=dp');
  assert.equal(parsed2.viewMode, 'modules');
  assert.equal(parsed2.topicId, 'dp');
  assert.equal(parsed2.detailSlug, null);

  // Question modal with modules view
  const parsed3 = parseLearnUrl('/learn/question/merge-intervals', '?view=modules&topic=arrays');
  assert.equal(parsed3.viewMode, 'modules');
  assert.equal(parsed3.topicId, 'arrays');
  assert.equal(parsed3.detailSlug, 'merge-intervals');

  // Unknown view falls back to 'hub'
  const parsed4 = parseLearnUrl('/learn', '?view=unknown');
  assert.equal(parsed4.viewMode, 'hub');
});

test('F1 - STORAGE_KEY_VIEW_MODE matches specification', () => {
  assert.equal(STORAGE_KEY_VIEW_MODE, 'aiio.learn.viewMode');
});
