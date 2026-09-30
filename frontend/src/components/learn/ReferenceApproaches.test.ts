import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ReferenceApproaches } from './ReferenceApproaches';
import type { ReferenceSolution } from '../../services/api';

describe('V7-06: ReferenceApproaches UI & Masking Defense', () => {
  const threeApproachesFixture: ReferenceSolution[] = [
    {
      approachId: 'canonical-hashmap',
      label: 'Canonical — Hash Map',
      approachClass: 'PRIMARY',
      kind: 'CODE',
      summary: 'Store complement indices in a hash table.',
      keyIdea: 'Single pass lookup with O(1) average time.',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)',
      tradeoffs: ['Fast runtime', 'Additional memory'],
      whenToUse: 'Default accepted solution for general constraints.',
      code: 'class Solution { public int[] twoSum() {} }'
    },
    {
      approachId: 'two-pointers',
      label: 'Alternate — Two Pointers',
      approachClass: 'ALTERNATE',
      kind: 'CODE',
      summary: 'Sort the elements and move two pointers inward.',
      keyIdea: 'Avoid hash table allocations by pre-sorting.',
      timeComplexity: 'O(N log N)',
      spaceComplexity: 'O(1)',
      tradeoffs: ['Constant memory', 'Modifies order / O(N log N) time'],
      whenToUse: 'When memory is strictly bounded.',
      code: 'class Solution2 { public int[] twoSum() {} }'
    },
    {
      approachId: 'binary-search',
      label: 'Alternate — Binary Search',
      approachClass: 'ALTERNATE',
      kind: 'CODE',
      summary: 'Binary search for complement for each element.',
      keyIdea: 'Logarithmic search per element on sorted array.',
      timeComplexity: 'O(N log N)',
      spaceComplexity: 'O(1)',
      tradeoffs: ['Simpler pointer logic', 'Duplicate handling requires care'],
      whenToUse: 'When binary search patterns are explicitly requested.',
      code: 'class Solution3 { public int[] twoSum() {} }'
    }
  ];

  it('Gate V7-06 (a): practice fixture with 3 approaches renders 3 cards with expected labels and chips', () => {
    const html = renderToString(
      React.createElement(ReferenceApproaches, {
        approaches: threeApproachesFixture,
        isInterviewMode: false
      })
    );

    // 1. Container and count
    assert.ok(html.includes('Reference Approaches (3)'), 'Must render container header with total count 3');
    assert.ok(html.includes('Interview-Accepted Standard Approaches'), 'Must render subheader');

    // 2. All 3 approach cards rendered
    assert.ok(html.includes('approach-card-canonical-hashmap'), 'Card 1 must be present');
    assert.ok(html.includes('Canonical — Hash Map'), 'Card 1 label must be present');
    assert.ok(html.includes('PRIMARY'), 'PRIMARY badge must be present');

    assert.ok(html.includes('approach-card-two-pointers'), 'Card 2 must be present');
    assert.ok(html.includes('Alternate — Two Pointers'), 'Card 2 label must be present');

    assert.ok(html.includes('approach-card-binary-search'), 'Card 3 must be present');
    assert.ok(html.includes('Alternate — Binary Search'), 'Card 3 label must be present');

    // 3. Complexity chips rendered
    assert.ok(html.includes('Time: O(N)'), 'Time complexity chip for card 1 must be present');
    assert.ok(html.includes('Space: O(N)'), 'Space complexity chip for card 1 must be present');
    assert.ok(html.includes('Time: O(N log N)'), 'Time complexity chip for card 2 must be present');

    // 4. Content and copy buttons
    assert.ok(html.includes('Copy Code'), 'Copy affordance must be present');
    assert.ok(html.includes('Key Idea:'), 'Key idea callout must be present');
    assert.ok(html.includes('Tradeoffs &amp; Analysis'), 'Tradeoffs section must be present');
  });

  it('Gate V7-06 (b): interview-mode fixture renders zero approach text (defense in depth)', () => {
    const html = renderToString(
      React.createElement(ReferenceApproaches, {
        approaches: threeApproachesFixture,
        isInterviewMode: true
      })
    );

    // Zero approach text must render in interview mode
    assert.strictEqual(html, '', 'Interview mode rendering must be strictly empty');
    assert.strictEqual(html.includes('Canonical — Hash Map'), false, 'Known approach label 1 must not be in DOM');
    assert.strictEqual(html.includes('Alternate — Two Pointers'), false, 'Known approach label 2 must not be in DOM');
    assert.strictEqual(html.includes('Alternate — Binary Search'), false, 'Known approach label 3 must not be in DOM');
    assert.strictEqual(html.includes('Reference Approaches'), false, 'Header must not be in DOM');
    assert.strictEqual(html.includes('twoSum'), false, 'Solution code must not be in DOM');
  });

  it('Gate V7-06 (c): empty approaches array returns empty rendering', () => {
    const html = renderToString(
      React.createElement(ReferenceApproaches, {
        approaches: [],
        isInterviewMode: false
      })
    );
    assert.strictEqual(html, '', 'Empty approaches must render empty');
  });

  it('Gate V7-06 (d) / F1 Remediation: post-submission closed-round review renders full multi-approach suite', () => {
    // In post-submission review, isInterviewMode is false (round completed)
    const html = renderToString(
      React.createElement(ReferenceApproaches, {
        approaches: threeApproachesFixture,
        isInterviewMode: false
      })
    );

    assert.ok(html.includes('Reference Approaches (3)'), 'Closed-round review must render container with count 3');
    assert.ok(html.includes('approach-card-canonical-hashmap'), 'Closed-round review must render PRIMARY card');
    assert.ok(html.includes('approach-card-two-pointers'), 'Closed-round review must render ALTERNATE card 1');
    assert.ok(html.includes('approach-card-binary-search'), 'Closed-round review must render ALTERNATE card 2');
    assert.ok(html.includes('Time: O(N)'), 'Closed-round review must render complexity chips');
  });

  it('Gate V7-06 (e) / F1 Remediation: DiagnosticReportView and PracticeSummary mount ReferenceApproaches', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const reportViewSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/DiagnosticReportView.tsx'),
      'utf-8'
    );
    assert.ok(
      reportViewSrc.includes("import { ReferenceApproaches } from './learn/ReferenceApproaches';"),
      'DiagnosticReportView must import ReferenceApproaches'
    );
    assert.ok(
      reportViewSrc.includes('<ReferenceApproaches'),
      'DiagnosticReportView must mount ReferenceApproaches in closed-round review'
    );

    const practiceSummarySrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/PracticeSummary.tsx'),
      'utf-8'
    );
    assert.ok(
      practiceSummarySrc.includes("import { ReferenceApproaches } from './learn/ReferenceApproaches';"),
      'PracticeSummary must import ReferenceApproaches'
    );
    assert.ok(
      practiceSummarySrc.includes('<ReferenceApproaches'),
      'PracticeSummary must mount ReferenceApproaches for practice review'
    );
  });
});

