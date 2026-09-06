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
