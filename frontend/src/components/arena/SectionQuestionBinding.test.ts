import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveSectionQuestions } from './hooks/useSessionCatalog';
import { SessionSectionFaultState } from './SessionSectionFaultState';

const arenaDir = import.meta.dirname;

test('T1: ArenaRoom source contract — useSessionCatalog call block contains no literal activeSectionIndex: 0 and binds live index', () => {
  const arenaRoomPath = path.resolve(arenaDir, 'ArenaRoom.tsx');
  const code = fs.readFileSync(arenaRoomPath, 'utf-8');

  // Verify no literal activeSectionIndex: 0 exists anywhere in ArenaRoom.tsx
  assert.equal(
    code.includes('activeSectionIndex: 0'),
    false,
    'ArenaRoom.tsx MUST NOT contain literal activeSectionIndex: 0'
  );

  // Verify lifted state declaration exists in ArenaRoom
  assert.ok(
    code.includes('const [activeSectionIndex, setActiveSectionIndex] = useState(0);'),
    'ArenaRoom.tsx must declare lifted state [activeSectionIndex, setActiveSectionIndex]'
  );

  // Extract useSessionCatalog call block
  const catalogCallMatch = code.match(/useSessionCatalog\(\s*\{([\s\S]*?)\}\s*\)/);
  assert.ok(catalogCallMatch, 'ArenaRoom.tsx must invoke useSessionCatalog');
  const catalogBlock = catalogCallMatch[1];

  // Must bind the lifted activeSectionIndex
  assert.ok(
    /\bactiveSectionIndex\b/.test(catalogBlock),
    'useSessionCatalog call block must bind activeSectionIndex'
  );

  // Must forward activeSectionIndex and onSectionIndexChange to useArenaEngines
  assert.ok(
    code.includes('onSectionIndexChange: setActiveSectionIndex'),
    'ArenaRoom must forward setActiveSectionIndex to useArenaEngines'
  );
});

test('T2: TrackScreenRouter source contract — EmptyTrackState gate is playground-scoped and SessionSectionFaultState branch exists', () => {
  const routerPath = path.resolve(arenaDir, 'TrackScreenRouter.tsx');
  const code = fs.readFileSync(routerPath, 'utf-8');

  // Verify SessionSectionFaultState is imported
  assert.ok(
    code.includes('SessionSectionFaultState'),
    'TrackScreenRouter.tsx must import SessionSectionFaultState'
  );

  // Verify EmptyTrackState gate is scoped to isPlayground
  assert.ok(
    code.includes('if (isPlayground) {\n        return <EmptyTrackState'),
    'EmptyTrackState in TrackScreenRouter must be strictly guarded by isPlayground'
  );

  // Verify SessionSectionFaultState is rendered for non-playground mode
  assert.ok(
    code.includes('<SessionSectionFaultState'),
    'TrackScreenRouter must render SessionSectionFaultState when isPlayground is false'
  );

  // Verify default branch also gates EmptyTrackState on isPlayground
  const defaultIdx = code.indexOf('default:');
  assert.ok(defaultIdx > -1, 'TrackScreenRouter must have a default branch');
  const defaultBlock = code.slice(defaultIdx);
  assert.ok(
    defaultBlock.includes('if (isPlayground)'),
    'Default branch must guard EmptyTrackState with isPlayground'
  );
});

test('T3: behavior test — pure resolveSectionQuestions isolates questions per round without cross-round bleed', () => {
  const dsaQ1 = { slug: 'reverse-a-string', title: 'Reverse a String', track: 'ALGORITHMS_DATA_STRUCTURES' } as any;
  const dsaQ2 = { slug: 'longest-substring', title: 'Longest Substring', track: 'ALGORITHMS_DATA_STRUCTURES' } as any;
  const lldQ = { slug: 'parking-lot', title: 'Design Parking Lot', track: 'SPRING_LLD' } as any;

  // Session #155 style layout: Section 0 is Intro (empty), Section 1 is DSA (2 questions), Section 2 is LLD (1 question)
  const sectionQuestions = [[], [dsaQ1, dsaQ2], [lldQ]];

  // Round 0 (INTRODUCTION): must resolve to empty list
  const round0 = resolveSectionQuestions(sectionQuestions, 0, true);
  assert.ok(Array.isArray(round0));
  assert.equal(round0.length, 0);

  // Round 1 (DSA): must resolve to exactly [dsaQ1, dsaQ2]
  const round1 = resolveSectionQuestions(sectionQuestions, 1, true);
  assert.ok(Array.isArray(round1));
  assert.equal(round1.length, 2);
  assert.equal(round1[0].slug, 'reverse-a-string');
  assert.equal(round1[1].slug, 'longest-substring');

  // Round 2 (LLD): must resolve to [lldQ] without bleeding DSA questions
  const round2 = resolveSectionQuestions(sectionQuestions, 2, true);
  assert.ok(Array.isArray(round2));
  assert.equal(round2.length, 1);
  assert.equal(round2[0].slug, 'parking-lot');
  assert.ok(!round2.some((q) => q.slug === 'reverse-a-string'));

  // Out of range indices: must return empty array without throwing
  const outOfRangeHigh = resolveSectionQuestions(sectionQuestions, 99, true);
  assert.deepEqual(outOfRangeHigh, []);
  const outOfRangeLow = resolveSectionQuestions(sectionQuestions, -1, true);
  assert.deepEqual(outOfRangeLow, []);

  // When not in interview mode (isInterview = false): returns null to trigger catalog/playlist fallback
  const nonInterview = resolveSectionQuestions(sectionQuestions, 1, false);
  assert.equal(nonInterview, null);

  // When sectionQuestions is undefined: returns null
  const undefinedQuestions = resolveSectionQuestions(undefined, 0, true);
  assert.equal(undefinedQuestions, null);
});

test('T4: PLAYGROUND non-regression — 8cfacc6 rider playlist fallback and targetSlug anchoring preserved', () => {
  const catalogPath = path.resolve(arenaDir, 'hooks', 'useSessionCatalog.ts');
  const code = fs.readFileSync(catalogPath, 'utf-8');

  // 1. Verify playlist fallback does NOT require isInterview gate (8cfacc6 rider behavior)
  assert.ok(
    code.includes('if (playlistQuestions && playlistQuestions.length > 0) {\n      setQuestionsList(playlistQuestions);\n      return;\n    }'),
    'Playlist fallback must not require isInterview gate (8cfacc6 rider)'
  );

  // 2. Verify targetSlug anchoring in fetch path is preserved (8cfacc6 rider behavior)
  assert.ok(
    code.includes('const targetSlug = defaultQuestion?.problemSlug || defaultQuestion?.slug;'),
    'targetSlug resolution must be preserved'
  );
  assert.ok(
    code.includes('const targetIdx = filtered.findIndex((q) => (q.problemSlug === targetSlug || q.slug === targetSlug));'),
    'targetSlug index matching in filtered catalog must be preserved'
  );
  assert.ok(
    code.includes('setActiveQuestionIndex(targetIdx);'),
    'Matched target question index must be activated'
  );
});

test('T5: production code import verification — SectionQuestionBinding imports and exercises real production code', () => {
  // Verifies that the tests bind to real production code rather than mock arrays
  assert.equal(typeof resolveSectionQuestions, 'function', 'resolveSectionQuestions must be an exported function');
  assert.equal(typeof SessionSectionFaultState, 'function', 'SessionSectionFaultState must be an exported component');

  // Verify that resolveSectionQuestions correctly executes real logic
  const testRes = resolveSectionQuestions([[ { slug: 'test-q' } as any ]], 0, true);
  assert.equal(testRes?.[0]?.slug, 'test-q');
});
