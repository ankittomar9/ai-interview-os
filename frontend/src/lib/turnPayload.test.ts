import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAttachCode, buildCandidateTurnPayload } from './turnPayload';

test('shouldAttachCode: gates coding vs non-coding section types', () => {
  assert.equal(shouldAttachCode('INTRODUCTION'), false);
  assert.equal(shouldAttachCode('DSA'), true);
  assert.equal(shouldAttachCode('LLD'), true);
  assert.equal(shouldAttachCode('HLD'), false);
  assert.equal(shouldAttachCode('SYSTEM_DESIGN'), false);
  assert.equal(shouldAttachCode('BEHAVIORAL'), false);
  assert.equal(shouldAttachCode('RESUME'), false);
  assert.equal(shouldAttachCode(undefined), false);
  assert.equal(shouldAttachCode(''), false);
});

test('buildCandidateTurnPayload: nulls code and context fields during INTRODUCTION', () => {
  const payload = buildCandidateTurnPayload({
    sectionType: 'INTRODUCTION',
    textToSend: 'Hello, I am John Doe and I have 5 years experience.',
    codeSnapshot: 'function twoSum() {}',
    questionContext: 'Given an array of integers...',
    problemSlug: 'two-sum',
    sectionQuestionTitle: 'Two Sum'
  });

  assert.equal(payload.candidateExplanation, 'Hello, I am John Doe and I have 5 years experience.');
  assert.equal(payload.codeSnippet, '');
  assert.equal(payload.candidateCode, '');
  assert.equal(payload.questionContext, '');
  assert.equal(payload.problemSlug, '');
  assert.equal(payload.sectionQuestionTitle, '');
});

test('buildCandidateTurnPayload: preserves code and context fields during DSA and LLD', () => {
  const dsaPayload = buildCandidateTurnPayload({
    sectionType: 'DSA',
    textToSend: 'I am using a hash map to achieve O(n) time complexity.',
    codeSnapshot: 'function twoSum(nums, target) { return []; }',
    questionContext: 'Given an array of integers...',
    problemSlug: 'two-sum',
    sectionQuestionTitle: 'Two Sum'
  });

  assert.equal(dsaPayload.candidateExplanation, 'I am using a hash map to achieve O(n) time complexity.');
  assert.equal(dsaPayload.codeSnippet, 'function twoSum(nums, target) { return []; }');
  assert.equal(dsaPayload.candidateCode, 'function twoSum(nums, target) { return []; }');
  assert.equal(dsaPayload.questionContext, 'Given an array of integers...');
  assert.equal(dsaPayload.problemSlug, 'two-sum');
  assert.equal(dsaPayload.sectionQuestionTitle, 'Two Sum');

  const lldPayload = buildCandidateTurnPayload({
    sectionType: 'LLD',
    textToSend: 'Here is my parking lot class design.',
    codeSnapshot: 'class ParkingLot {}',
    questionContext: 'Design a parking lot...',
    problemSlug: 'design-parking-lot',
    sectionQuestionTitle: 'Design Parking Lot'
  });

  assert.equal(lldPayload.codeSnippet, 'class ParkingLot {}');
  assert.equal(lldPayload.candidateCode, 'class ParkingLot {}');
});

test('buildCandidateTurnPayload: nulls code fields but retains discussion context for HLD / BEHAVIORAL', () => {
  const hldPayload = buildCandidateTurnPayload({
    sectionType: 'HLD',
    textToSend: 'I will use a distributed message queue for ingestion.',
    codeSnapshot: 'const stale = true;',
    questionContext: 'Design Twitter Feed System',
    problemSlug: 'design-twitter',
    sectionQuestionTitle: 'Design Twitter'
  });

  assert.equal(hldPayload.candidateExplanation, 'I will use a distributed message queue for ingestion.');
  assert.equal(hldPayload.codeSnippet, '');
  assert.equal(hldPayload.candidateCode, '');
  assert.equal(hldPayload.questionContext, 'Design Twitter Feed System');
  assert.equal(hldPayload.problemSlug, 'design-twitter');
  assert.equal(hldPayload.sectionQuestionTitle, 'Design Twitter');
});

test('Gate VP26 [Negative]: buildCandidateTurnPayload serializes candidateCode as empty when gate is LOCKED', () => {
  const payload = buildCandidateTurnPayload({
    sectionType: 'DSA',
    textToSend: 'Here is my initial thought.',
    codeSnapshot: 'class Solution { public int solve() { return 1; } }',
    starterCode: 'class Solution {}',
    isApproachGateLocked: true,
    questionContext: 'Some problem',
    problemSlug: 'some-problem'
  });

  assert.equal(payload.candidateCode, '', 'candidateCode must be empty when gate is locked');
  assert.equal(payload.codeSnippet, '', 'codeSnippet must be empty when gate is locked');
});

test('Gate VP26 [Negative]: buildCandidateTurnPayload serializes candidateCode as empty when code equals starterCode', () => {
  const starter = 'class Solution {\n    // starter\n}';
  const payload = buildCandidateTurnPayload({
    sectionType: 'DSA',
    textToSend: 'Looking at the problem.',
    codeSnapshot: starter,
    starterCode: starter,
    isApproachGateLocked: false,
    questionContext: 'Some problem',
    problemSlug: 'some-problem'
  });

  assert.equal(payload.candidateCode, '', 'candidateCode must be empty when code equals starterCode');
  assert.equal(payload.codeSnippet, '', 'codeSnippet must be empty when code equals starterCode');
});

test('Gate VP26 [Positive]: buildCandidateTurnPayload serializes candidateCode when gate is OPEN and code modified', () => {
  const starter = 'class Solution {\n    // starter\n}';
  const modified = 'class Solution {\n    int x = 42;\n}';
  const payload = buildCandidateTurnPayload({
    sectionType: 'DSA',
    textToSend: 'I implemented the hash map logic.',
    codeSnapshot: modified,
    starterCode: starter,
    isApproachGateLocked: false,
    questionContext: 'Some problem',
    problemSlug: 'some-problem'
  });

  assert.equal(payload.candidateCode, modified, 'candidateCode must be serialized when gate is open and code modified');
  assert.equal(payload.codeSnippet, modified, 'codeSnippet must be serialized when gate is open and code modified');
});

test('VP-2 / F-2: isPlayground=true attaches code and preserves context regardless of section, gate lock, or starter equality', () => {
  const code = 'class Solution { public static String reverseString(String s) { ... } }';
  const starter = code;
  const payload = buildCandidateTurnPayload({
    isPlayground: true,
    sectionType: 'INTRODUCTION',
    textToSend: 'what is the issue in this code?',
    codeSnapshot: code,
    starterCode: starter,
    isApproachGateLocked: true,
    questionContext: 'Reverse a string challenge',
    problemSlug: 'reverse-a-string',
    sectionQuestionTitle: 'Reverse a String'
  });

  assert.equal(payload.candidateExplanation, 'what is the issue in this code?');
  assert.equal(payload.candidateCode, code, 'Playground must attach candidateCode');
  assert.equal(payload.codeSnippet, code, 'Playground must attach codeSnippet');
  assert.equal(payload.questionContext, 'Reverse a string challenge', 'Playground must preserve questionContext');
  assert.equal(payload.problemSlug, 'reverse-a-string', 'Playground must preserve problemSlug');
  assert.equal(payload.sectionQuestionTitle, 'Reverse a String', 'Playground must preserve sectionQuestionTitle');
});

test('VP-2 (Regression): isPlayground=false or undefined retains strict code and context stripping during INTRODUCTION', () => {
  const payload = buildCandidateTurnPayload({
    isPlayground: false,
    sectionType: 'INTRODUCTION',
    textToSend: 'Tell me about the interview.',
    codeSnapshot: 'const secret = 123;',
    starterCode: '',
    isApproachGateLocked: false,
    questionContext: 'Some problem',
    problemSlug: 'some-problem',
    sectionQuestionTitle: 'Some Problem'
  });

  assert.equal(payload.candidateCode, '', 'Interview INTRODUCTION must null candidateCode');
  assert.equal(payload.codeSnippet, '', 'Interview INTRODUCTION must null codeSnippet');
  assert.equal(payload.questionContext, '', 'Interview INTRODUCTION must null questionContext');
  assert.equal(payload.problemSlug, '', 'Interview INTRODUCTION must null problemSlug');
  assert.equal(payload.sectionQuestionTitle, '', 'Interview INTRODUCTION must null sectionQuestionTitle');
});

