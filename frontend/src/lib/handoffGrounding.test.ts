import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldTriggerHandoff,
  buildHandoffPayload,
  resolveIntroContext,
  handleHandoffFailure
} from './handoffGrounding';

describe('Gate VP19 & VP20: Handoff Narration, Dedup Guard, and Intro Grounding', () => {
  describe('Gate VP19: shouldTriggerHandoff dedup guard', () => {
    it('returns true when transitioning to a new section index with valid sessionId', () => {
      assert.equal(shouldTriggerHandoff(null, 0, 101), true);
      assert.equal(shouldTriggerHandoff(0, 1, 101), true);
      assert.equal(shouldTriggerHandoff(1, 2, 101), true);
    });

    it('returns false when repeated transition targets the same section index (prevents stacking duplicate handoff calls)', () => {
      assert.equal(shouldTriggerHandoff(1, 1, 101), false);
      assert.equal(shouldTriggerHandoff(2, 2, 101), false);
    });

    it('returns false when sessionId is missing', () => {
      assert.equal(shouldTriggerHandoff(null, 1, undefined), false);
      assert.equal(shouldTriggerHandoff(0, 1, 0), false);
    });
  });

  describe('Gate VP19: buildHandoffPayload', () => {
    it('constructs handoff payload with toSectionGated=true for gated rounds (DSA, LLD, SQL)', () => {
      const dsaPayload = buildHandoffPayload({
        sessionId: 42,
        fromSectionType: 'INTRODUCTION',
        toSectionType: 'DSA',
        toSectionTitle: 'Algorithms & Data Structures',
        candidateName: 'John',
        apiKey: 'key-123',
        modelProvider: 'GEMINI'
      });
      assert.equal(dsaPayload.sessionId, 42);
      assert.equal(dsaPayload.fromSectionType, 'INTRODUCTION');
      assert.equal(dsaPayload.toSectionType, 'DSA');
      assert.equal(dsaPayload.toSectionTitle, 'Algorithms & Data Structures');
      assert.equal(dsaPayload.toSectionGated, true);
      assert.equal(dsaPayload.candidateName, 'John');

      const lldPayload = buildHandoffPayload({
        sessionId: 42,
        fromSectionType: 'DSA',
        toSectionType: 'LLD',
        toSectionTitle: 'Low-Level Design',
        candidateName: 'John'
      });
      assert.equal(lldPayload.toSectionGated, true);

      const sqlPayload = buildHandoffPayload({
        sessionId: 42,
        fromSectionType: 'LLD',
        toSectionType: 'SQL',
        toSectionTitle: 'Database Queries',
        candidateName: 'John'
      });
      assert.equal(sqlPayload.toSectionGated, true);
    });

    it('constructs handoff payload with toSectionGated=false for non-gated rounds', () => {
      const sdPayload = buildHandoffPayload({
        sessionId: 42,
        fromSectionType: 'DSA',
        toSectionType: 'SYSTEM_DESIGN',
        toSectionTitle: 'High-Level Distributed Systems'
      });
      assert.equal(sdPayload.toSectionGated, false);

      const behPayload = buildHandoffPayload({
        sessionId: 42,
        fromSectionType: 'DSA',
        toSectionType: 'BEHAVIORAL',
        toSectionTitle: 'Culture Fit & STAR'
      });
      assert.equal(behPayload.toSectionGated, false);
    });
  });

  describe('Gate VP19: handleHandoffFailure fallback', () => {
    it('returns null on orchestrator/LLM failure to guarantee zero client-fabricated text', () => {
      const error = new Error('Network timeout or LLM failure');
      const fallbackResult = handleHandoffFailure(error);
      assert.equal(fallbackResult, null);
    });
  });

  describe('Gate VP20: resolveIntroContext grounding', () => {
    const fullContext = {
      jobDescription: 'Senior Backend Engineer responsible for distributed caching and Kafka streaming.',
      targetCompany: 'Uber',
      resumeSummary: '7 years designing large-scale high-throughput microservices in Java/Go.'
    };

    it('returns provided candidate context fields when section is INTRODUCTION', () => {
      const introCtx = resolveIntroContext('INTRODUCTION', fullContext);
      assert.equal(introCtx.jobDescription, fullContext.jobDescription);
      assert.equal(introCtx.targetCompany, fullContext.targetCompany);
      assert.equal(introCtx.resumeSummary, fullContext.resumeSummary);
    });

    it('clears candidate context fields when section is NOT INTRODUCTION', () => {
      const dsaCtx = resolveIntroContext('DSA', fullContext);
      assert.equal(dsaCtx.jobDescription, undefined);
      assert.equal(dsaCtx.targetCompany, undefined);
      assert.equal(dsaCtx.resumeSummary, undefined);

      const lldCtx = resolveIntroContext('LLD', fullContext);
      assert.equal(lldCtx.jobDescription, undefined);
      assert.equal(lldCtx.targetCompany, undefined);
      assert.equal(lldCtx.resumeSummary, undefined);
    });

    it('handles empty or whitespace-only fields gracefully', () => {
      const emptyCtx = resolveIntroContext('INTRODUCTION', {
        jobDescription: '   ',
        targetCompany: '',
        resumeSummary: undefined
      });
      assert.equal(emptyCtx.jobDescription, undefined);
      assert.equal(emptyCtx.targetCompany, undefined);
      assert.equal(emptyCtx.resumeSummary, undefined);
    });
  });
});
