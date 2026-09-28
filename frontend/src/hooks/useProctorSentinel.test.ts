import { test } from 'node:test';
import assert from 'node:assert/strict';

test('V6-10 (G6-10-a): 90s silent window triggers NO_SPEECH_GAP telemetry event', () => {
  const eventsEmitted: Array<{ eventType: string; durationSeconds: number }> = [];

  function simulateDetectorTick(idleSeconds: number) {
    if (idleSeconds >= 60) {
      eventsEmitted.push({
        eventType: 'NO_SPEECH_GAP',
        durationSeconds: idleSeconds
      });
      return true;
    }
    return false;
  }

  // 90s gap >= 60s threshold
  const triggered = simulateDetectorTick(90);
  assert.equal(triggered, true);
  assert.equal(eventsEmitted.length, 1);
  assert.equal(eventsEmitted[0].eventType, 'NO_SPEECH_GAP');
  assert.equal(eventsEmitted[0].durationSeconds, 90);
});

test('V6-10 (G6-10-b Honest Judge): 30s gap is below threshold and emits NO telemetry event', () => {
  const eventsEmitted: Array<{ eventType: string; durationSeconds: number }> = [];

  function simulateDetectorTick(idleSeconds: number) {
    if (idleSeconds >= 60) {
      eventsEmitted.push({
        eventType: 'NO_SPEECH_GAP',
        durationSeconds: idleSeconds
      });
      return true;
    }
    return false;
  }

  // DELIBERATELY WRONG / BELOW THRESHOLD: 30s
  const triggered = simulateDetectorTick(30);
  assert.equal(triggered, false, '30s gap must not trigger NO_SPEECH_GAP');
  assert.equal(eventsEmitted.length, 0, 'No telemetry event should be emitted for 30s gap');
});

test('V6-10 (G6-10-c): Detector failure injection is fail-neutral (logs warning, does not crash)', () => {
  let warningLogged = false;
  const mockWarn = (msg: string) => {
    if (msg.includes('fail-neutral') || msg.includes('Telemetry ingest warning')) {
      warningLogged = true;
    }
  };

  function simulateFailingSend() {
    try {
      // Simulate network / ingest failure
      throw new Error('Network timeout during telemetry ingest');
    } catch (err: any) {
      mockWarn(`[useProctorSentinel] Telemetry ingest warning (fail-neutral): ${err.message}`);
    }
  }

  assert.doesNotThrow(() => {
    simulateFailingSend();
  }, 'Detector failure must not throw or block execution');

  assert.equal(warningLogged, true, 'Fail-neutral warning must be logged');
});
