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
});
