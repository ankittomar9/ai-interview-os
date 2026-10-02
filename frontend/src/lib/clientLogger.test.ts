import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clientLog,
  getBuffer,
  clearBuffer,
  preparePayload,
  sanitizeContext,
  setTelemetryContext,
  MAX_BUFFER_SIZE,
  MAX_PAYLOAD_BYTES,
  FLUSH_INTERVAL_MS,
  type ClientLogEvent,
} from './clientLogger';

test('VP-1 / T-2: 50-event ring buffer eviction on overflow', () => {
  clearBuffer();
  setTelemetryContext(101, 'INTERVIEW');

  // Push 55 events into the logger
  for (let i = 1; i <= 55; i++) {
    clientLog.info('TIMER_TRANSITION', `Transition #${i}`);
  }

  const buffer = getBuffer();
  // Buffer must never exceed 50
  assert.equal(buffer.length, MAX_BUFFER_SIZE, 'Buffer length must be capped at 50');

  // Oldest events (1..5) should have been evicted; buffer starts from #6 to #55
  assert.equal(buffer[0].msg, 'Transition #6', 'Oldest event in ring buffer must be #6');
  assert.equal(buffer[buffer.length - 1].msg, 'Transition #55', 'Newest event must be #55');
  assert.equal(buffer[0].sessionId, 101);
  assert.equal(buffer[0].mode, 'INTERVIEW');
});

test('VP-1 / T-2: banned-key stripping (recursive one level, case-insensitive)', () => {
  const dirtyContext = {
    code: 'public class Solution { ... }',
    CODE: 'uppercase should also be stripped',
    transcript: 'Candidate said hello world',
    resume: 'Resume contents and work history',
    explanation: 'Candidate explanation text',
    answer: 'Direct answer snippet',
    apiKey: 'sk-secret-byok-key-12345',
    APIKEY: 'another-key',
    validField: 'allowed diagnostic value',
    sectionId: 2,
    nested: {
      code: 'nested code',
      resume: 'nested resume',
      safeMetric: 42,
    },
  };

  const clean = sanitizeContext(dirtyContext);
  assert.ok(clean);
  assert.equal('code' in clean, false, 'Key "code" must be stripped');
  assert.equal('CODE' in clean, false, 'Key "CODE" must be stripped');
  assert.equal('transcript' in clean, false, 'Key "transcript" must be stripped');
  assert.equal('resume' in clean, false, 'Key "resume" must be stripped');
  assert.equal('explanation' in clean, false, 'Key "explanation" must be stripped');
  assert.equal('answer' in clean, false, 'Key "answer" must be stripped');
  assert.equal('apiKey' in clean, false, 'Key "apiKey" must be stripped');
  assert.equal('APIKEY' in clean, false, 'Key "APIKEY" must be stripped');
  assert.equal(clean.validField, 'allowed diagnostic value');
  assert.equal(clean.sectionId, 2);

  const nested = clean.nested as Record<string, unknown>;
  assert.ok(nested);
  assert.equal('code' in nested, false, 'Nested key "code" must be stripped');
  assert.equal('resume' in nested, false, 'Nested key "resume" must be stripped');
  assert.equal(nested.safeMetric, 42);
});

test('VP-1 / T-2: 64 KB payload body cap enforcement', () => {
  const largeEvents: ClientLogEvent[] = [];
  // Create 50 events each containing a large message (~2 KB each -> ~100 KB total)
  for (let i = 0; i < 50; i++) {
    largeEvents.push({
      ts: new Date().toISOString(),
      level: 'info',
      tag: 'TIMER_TRANSITION',
      msg: 'Large diagnostic trace event '.repeat(20),
      sessionId: 42,
      mode: 'INTERVIEW',
      ctx: { data: 'x'.repeat(1800) },
    });
  }

  const { events } = preparePayload(largeEvents);
  const json = JSON.stringify({ events });
  const byteLength = new TextEncoder().encode(json).length;

  assert.ok(byteLength <= MAX_PAYLOAD_BYTES, `Payload bytes (${byteLength}) must be <= ${MAX_PAYLOAD_BYTES}`);
  assert.ok(events.length > 0, 'Payload must retain valid sub-batch within 64 KB cap');
  assert.ok(events.length < largeEvents.length, 'Payload must truncate excess events to preserve byte cap');
});

test('VP-1 / T-2: flush interval configuration constant', () => {
  assert.equal(FLUSH_INTERVAL_MS, 10000, 'Flush interval must be pinned to 10 seconds (10000ms)');
});

test('VP-1 / T-2: fetch rejects ⇒ no throw, buffer cleared, zero console output', async () => {
  clearBuffer();
  clientLog.info('TIMER_TRANSITION', 'Attempting flush with network error');
  assert.equal(getBuffer().length, 1);

  // Mock globalThis.fetch to reject with a Network Error (e.g. gateway down)
  const originalFetch = (globalThis as any).fetch;
  const originalConsoleError = console.error;
  let consoleErrorCalled = false;

  console.error = () => {
    consoleErrorCalled = true;
  };

  (globalThis as any).fetch = async () => {
    throw new Error('Connection refused: Gateway unreachable :8080');
  };

  try {
    // Calling flush must NOT throw
    await clientLog.flush();
    // Buffer must be cleared (silent drop on failure, no retry storm)
    assert.equal(getBuffer().length, 0, 'Buffer must be cleared after flush attempt');
    // Must NOT log to console.error
    assert.equal(consoleErrorCalled, false, 'No console.error should be emitted on telemetry failure');
  } finally {
    (globalThis as any).fetch = originalFetch;
    console.error = originalConsoleError;
  }
});

test('VP-1 / T-2: single string call preserves literal format and infers tag', () => {
  clearBuffer();
  clientLog.warn('TIMER_EXTEND_BLOCKED mode=INTERVIEW');
  const buffer = getBuffer();
  assert.equal(buffer.length, 1);
  assert.equal(buffer[0].tag, 'TIMER_EXTEND_BLOCKED');
  assert.equal(buffer[0].msg, 'TIMER_EXTEND_BLOCKED mode=INTERVIEW');
  assert.equal(buffer[0].level, 'warn');
});
