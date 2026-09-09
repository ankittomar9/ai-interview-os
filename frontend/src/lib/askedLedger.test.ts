import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatUsedSeedIds, parseUsedSeedIds, buildAiTurnMetadata } from './askedLedger';
import type { AiDialogueResponse } from '../types';

describe('askedLedger helper module (Gate VP22)', () => {
  describe('formatUsedSeedIds', () => {
    it('returns empty string for null, undefined, or empty array', () => {
      assert.equal(formatUsedSeedIds(null), '');
      assert.equal(formatUsedSeedIds(undefined), '');
      assert.equal(formatUsedSeedIds([]), '');
    });

    it('formats number arrays into comma-separated strings', () => {
      assert.equal(formatUsedSeedIds([0]), '0');
      assert.equal(formatUsedSeedIds([0, 1, 2]), '0,1,2');
      assert.equal(formatUsedSeedIds([3, 5]), '3,5');
    });

    it('handles string input cleanly', () => {
      assert.equal(formatUsedSeedIds('1,2,3'), '1,2,3');
    });
  });

  describe('parseUsedSeedIds', () => {
    it('returns empty array for empty inputs', () => {
      assert.deepEqual(parseUsedSeedIds(''), []);
      assert.deepEqual(parseUsedSeedIds(null), []);
      assert.deepEqual(parseUsedSeedIds('   '), []);
    });

    it('parses comma-separated and bracketed lists of integers', () => {
      assert.deepEqual(parseUsedSeedIds('0,1,2'), [0, 1, 2]);
      assert.deepEqual(parseUsedSeedIds('[0, 1, 2]'), [0, 1, 2]);
      assert.deepEqual(parseUsedSeedIds('  3 ,  4 , 5 '), [3, 4, 5]);
    });

    it('gracefully skips non-integer tokens', () => {
      assert.deepEqual(parseUsedSeedIds('0, abc, 2'), [0, 2]);
    });
  });

  describe('buildAiTurnMetadata (VP22 Turn Persistence)', () => {
    it('builds complete metadata record including followUpQuestion, approachAssessment, and usedFollowUpSeedIds', () => {
      const aiResponse: Partial<AiDialogueResponse> & { model?: string } = {
        interviewerReply: 'Good thought process.',
        followUpQuestion: 'How will you handle duplicate entries?',
        recommendedAction: 'PROBE_DEEPER',
        approachAssessment: 'PROBE_MORE',
        usedFollowUpSeedIds: [0, 2],
        turnSummary: 'Candidate explained two pointers approach.',
        detectedIntent: 'EXPLAINING_APPROACH',
        model: 'gemini-2.0-flash'
      };

      const metadata = buildAiTurnMetadata({
        aiResponse,
        stage: 'IN_PROGRESS',
        sectionType: 'DSA',
        provider: 'GEMINI'
      });

      assert.equal(metadata.stage, 'IN_PROGRESS');
      assert.equal(metadata.sectionType, 'DSA');
      assert.equal(metadata.provider, 'GEMINI');
      assert.equal(metadata.model, 'gemini-2.0-flash');
      assert.equal(metadata.followUpQuestion, 'How will you handle duplicate entries?');
      assert.equal(metadata.recommendedAction, 'PROBE_DEEPER');
      assert.equal(metadata.approachAssessment, 'PROBE_MORE');
      assert.equal(metadata.usedFollowUpSeedIds, '0,2');
      assert.equal(metadata.turnSummary, 'Candidate explained two pointers approach.');
      assert.equal(metadata.detectedIntent, 'EXPLAINING_APPROACH');
    });

    it('falls back to safe defaults when optional fields are omitted', () => {
      const minimalResponse: Partial<AiDialogueResponse> = {
        interviewerReply: 'Understood.'
      };

      const metadata = buildAiTurnMetadata({
        aiResponse: minimalResponse,
        stage: 'INTRODUCTION',
        sectionType: 'INTRODUCTION',
        provider: 'GROQ'
      });

      assert.equal(metadata.followUpQuestion, '');
      assert.equal(metadata.recommendedAction, '');
      assert.equal(metadata.approachAssessment, 'NOT_APPLICABLE');
      assert.equal(metadata.usedFollowUpSeedIds, '');
      assert.equal(metadata.turnSummary, '');
      assert.equal(metadata.detectedIntent, '');
    });
  });
});
