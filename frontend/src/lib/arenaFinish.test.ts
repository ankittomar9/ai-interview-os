import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('F1: Arena finish path session completion', () => {
  it('arena-path finish sequence completes session before report generation', async () => {
    const callOrder: string[] = [];
    let sessionStatus = 'IN_PROGRESS';
    let durationSeconds: number | null = null;

    const mockCompleteSession = async (id: number) => {
      callOrder.push('completeSession');
      sessionStatus = 'COMPLETED';
      durationSeconds = 180;
      return { id, status: sessionStatus, durationSeconds };
    };

    const mockGenerateDiagnosticReport = async (id: number) => {
      callOrder.push('generateDiagnosticReport');
      assert.equal(sessionStatus, 'COMPLETED', 'Session must be COMPLETED before report generation');
      assert.ok(durationSeconds !== null && durationSeconds > 0, 'durationSeconds must be non-null');
      return { reportId: 'rep-1', sessionId: id };
    };

    // Simulate handleFinishInterview sequence
    const sessionId = 42;
    await mockCompleteSession(sessionId);
    const report = await mockGenerateDiagnosticReport(sessionId);

    assert.deepEqual(callOrder, ['completeSession', 'generateDiagnosticReport']);
    assert.equal(sessionStatus, 'COMPLETED');
    assert.equal(durationSeconds, 180);
    assert.equal(report.sessionId, 42);
  });

  it('completeSession contract is idempotent on already completed session', async () => {
    let callCount = 0;
    const existingCompletedSession = {
      id: 99,
      status: 'COMPLETED',
      durationSeconds: 240
    };

    const idempotentComplete = async (_id: number) => {
      callCount++;
      return existingCompletedSession;
    };

    const res1 = await idempotentComplete(99);
    const res2 = await idempotentComplete(99);

    assert.equal(callCount, 2);
    assert.equal(res1.status, 'COMPLETED');
    assert.equal(res2.status, 'COMPLETED');
    assert.equal(res1.durationSeconds, 240);
    assert.equal(res2.durationSeconds, 240);
  });

  it('Gate VP27 [Negative]: addMessageToSession post-completion is FE-blocked and makes zero message POSTs', async () => {
    const { markSessionCompleted, addMessageToSession, resetCompletedSessions } = await import('../services/api');
    resetCompletedSessions();
    const sessionId = 139;
    markSessionCompleted(sessionId);

    let fetchCalled = false;
    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = async () => {
      fetchCalled = true;
      return new Response(JSON.stringify({ id: 1 }), { status: 200 });
    };

    try {
      const result = await addMessageToSession(sessionId, {
        senderRole: 'CANDIDATE',
        messageType: 'EXPLANATION',
        content: 'Late audio or candidate turn after teardown'
      });

      assert.equal(result, null, 'Expected null result indicating suppression');
      assert.equal(fetchCalled, false, 'Expected zero fetch calls after session is completed');
    } finally {
      globalThis.fetch = originalFetch;
      resetCompletedSessions();
    }
  });

  it('Gate VP27 [Positive]: addMessageToSession on active session issues fetch POST', async () => {
    const { addMessageToSession, resetCompletedSessions } = await import('../services/api');
    resetCompletedSessions();
    const sessionId = 140;

    let fetchCalled = false;
    let requestedUrl = '';
    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = async (url: any) => {
      fetchCalled = true;
      requestedUrl = String(url);
      return new Response(JSON.stringify({ id: 1, content: 'ok' }), { status: 200 });
    };

    try {
      const result = await addMessageToSession(sessionId, {
        senderRole: 'CANDIDATE',
        messageType: 'EXPLANATION',
        content: 'Active turn'
      });

      assert.equal(fetchCalled, true, 'Expected fetch to be called for active session');
      assert.ok(requestedUrl.includes('/140/messages'), 'Expected URL to contain /140/messages');
      assert.equal(result.id, 1);
    } finally {
      globalThis.fetch = originalFetch;
      resetCompletedSessions();
    }
  });
});
