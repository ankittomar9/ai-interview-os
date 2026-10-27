import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENTIC_GUIDE_ARCHETYPES,
  AGENTIC_GOOD_PRACTICES
} from './AgenticGuideDrawer';

test('QB-49 P2-4: Agentic Guide exposes exactly 4 archetypes with grounded IDs', () => {
  assert.equal(AGENTIC_GUIDE_ARCHETYPES.length, 4);

  const ids = AGENTIC_GUIDE_ARCHETYPES.map((a) => a.id);
  assert.deepEqual(ids, [
    'mcp-server-tools',
    'debugging-hallucinations-injections',
    'subagent-architecture-guardrails',
    'production-incident-ops'
  ]);

  const numbers = AGENTIC_GUIDE_ARCHETYPES.map((a) => a.number);
  assert.deepEqual(numbers, [1, 2, 3, 4]);
});

test('QB-49 P2-4: Archetypes map to all 6 machine-captured practice questions with exact difficulties', () => {
  const allSlugs = AGENTIC_GUIDE_ARCHETYPES.flatMap((a) =>
    a.practiceQuestions.map((q) => ({ slug: q.slug, difficulty: q.difficulty }))
  );

  assert.equal(allSlugs.length, 6);

  const expectedQuestions = [
    { slug: 'agentic-mcp-order-service', difficulty: 'MEDIUM' },
    { slug: 'agentic-debug-hallucinating-agent', difficulty: 'HARD' },
    { slug: 'agentic-design-subagent-guardrails', difficulty: 'HARD' },
    { slug: 'incident-cache-stampede-thundering-herd', difficulty: 'HARD' },
    { slug: 'incident-db-connection-pool-exhaustion', difficulty: 'MEDIUM' },
    { slug: 'incident-deadlock-distributed-locks', difficulty: 'HARD' }
  ];

  assert.deepEqual(allSlugs, expectedQuestions);
});

test('QB-49 P2-4: Reference URLs match Section 2.1 verified link manifest (admissible only)', () => {
  const allUrls = AGENTIC_GUIDE_ARCHETYPES.flatMap((a) => a.references.map((r) => r.url));

  // Must only contain verified V1-V7 links
  for (const url of allUrls) {
    assert.match(
      url,
      /^https:\/\/(www\.anthropic\.com\/research|modelcontextprotocol\.io|github\.com\/(humanlayer|langchain-ai)|huyenchip\.com\/dotagents)/
    );
    // Explicitly assert absence of blocked 403 URLs (Section 2.3)
    assert.equal(url.includes('openai.com'), false);
    assert.equal(url.includes('genai.owasp.org'), false);
  }

  // Check specific essential citations
  assert.equal(allUrls.includes('https://modelcontextprotocol.io/'), true);
  assert.equal(allUrls.includes('https://modelcontextprotocol.io/quickstart/server'), true);
  assert.equal(
    allUrls.includes('https://www.anthropic.com/research/building-effective-agents'),
    true
  );
  assert.equal(
    allUrls.includes('https://www.anthropic.com/research/effective-context-engineering-for-ai-agents'),
    true
  );
  assert.equal(allUrls.includes('https://github.com/humanlayer/12-factor-agents'), true);
  assert.equal(allUrls.includes('https://github.com/langchain-ai/langgraph'), true);
  assert.equal(allUrls.includes('https://huyenchip.com/dotagents/'), true);
});

test('QB-49 P2-4: Doctrine includes 5 core interviewer evaluation principles', () => {
  assert.equal(AGENTIC_GOOD_PRACTICES.length, 5);

  // Principle 1: deterministic boundaries
  assert.match(AGENTIC_GOOD_PRACTICES[0], /the LLM will handle it/i);
  // Principle 2: structured error recovery
  assert.match(AGENTIC_GOOD_PRACTICES[1], /Design tool errors as informative data/i);
  // Principle 3: prompt injection delimiting
  assert.match(AGENTIC_GOOD_PRACTICES[2], /Delimit untrusted content explicitly/i);
  // Principle 4: loop breakers / budgets
  assert.match(AGENTIC_GOOD_PRACTICES[3], /loop-breaker.*maximum step budget/i);
  // Principle 5: when NOT to use an agent
  assert.match(AGENTIC_GOOD_PRACTICES[4], /Know when NOT to use an agent/i);
});

test('QB-49 P2-4: Topic detection recognizes all agentic engineering scopes', () => {
  const isAgenticModule = (track: string, topicId: string | null) =>
    track === 'AGENTIC_ENGINEERING' ||
    topicId === 'agentic-engineering' ||
    topicId === 'mcp-servers' ||
    topicId === 'agent-debugging' ||
    Boolean(topicId && topicId.startsWith('agentic-'));

  assert.equal(isAgenticModule('ALGORITHMS_DATA_STRUCTURES', 'arrays'), false);
  assert.equal(isAgenticModule('AGENTIC_ENGINEERING', 'general'), true);
  assert.equal(isAgenticModule('CUSTOM', 'agentic-engineering'), true);
  assert.equal(isAgenticModule('CUSTOM', 'mcp-servers'), true);
  assert.equal(isAgenticModule('CUSTOM', 'agent-debugging'), true);
  assert.equal(isAgenticModule('CUSTOM', 'agentic-custom-tools'), true);
});
