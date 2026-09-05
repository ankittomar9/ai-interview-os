import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSandboxStatus,
  computeIntelligenceStatus,
  computeDataStatus,
  computeOverallStatus
} from './systemStatusAggregate.ts';

test('Sandbox aggregate: DOWN wins if any engine is DOWN', () => {
  const result = computeSandboxStatus({
    dsa: { ready: false, state: 'DOWN', detail: 'Judge0 unreachable' },
    lld: { ready: true, state: 'ONLINE', detail: null },
    sql: { ready: true, state: 'ONLINE', detail: null }
  });
  assert.equal(result.state, 'DOWN');
  assert.equal(result.detail, 'Judge0 unreachable');
});

test('Sandbox aggregate: STARTING if any engine is warming up and none DOWN', () => {
  const result = computeSandboxStatus({
    dsa: { ready: false, state: 'STARTING', detail: 'warming up' },
    lld: { ready: true, state: 'ONLINE', detail: null },
    sql: { ready: true, state: 'ONLINE', detail: null }
  });
  assert.equal(result.state, 'STARTING');
});

test('Sandbox aggregate: ONLINE when all 3 engines ready', () => {
  const result = computeSandboxStatus({
    dsa: { ready: true, state: 'ONLINE', detail: null },
    lld: { ready: true, state: 'ONLINE', detail: null },
    sql: { ready: true, state: 'ONLINE', detail: null }
  });
  assert.equal(result.state, 'ONLINE');
});

test('Intelligence status: Orchestrator DOWN if orchestrator service is false', () => {
  const result = computeIntelligenceStatus(false, null);
  assert.equal(result.state, 'DOWN');
  assert.equal(result.text, 'Orchestrator DOWN');
});

test('Intelligence status: checking when providers status is null', () => {
  const result = computeIntelligenceStatus(true, null);
  assert.equal(result.state, 'CHECKING');
  assert.equal(result.text, '◌ checking');
});

test('Intelligence status: dynamic ready count when providers status loaded', () => {
  const result = computeIntelligenceStatus(true, [
    { provider: 'GEMINI', state: 'READY' },
    { provider: 'GROQ', state: 'READY' },
    { provider: 'OPENAI', state: 'NOT_CONFIGURED' },
    { provider: 'OLLAMA', state: 'UNREACHABLE' }
  ]);
  assert.equal(result.state, 'ONLINE');
  assert.equal(result.text, '2/4 providers ready');
});

test('Data status: ONLINE when postgres, mongo, eureka all true', () => {
  assert.equal(computeDataStatus({ postgres: true, mongo: true, eureka: true }), 'ONLINE');
  assert.equal(computeDataStatus({ postgres: true, mongo: false, eureka: true }), 'DEGRADED');
  assert.equal(computeDataStatus({ postgres: false, mongo: false, eureka: false }), 'DOWN');
});

test('Overall status: OFFLINE when backend not connected', () => {
  assert.equal(computeOverallStatus(false, 'ONLINE', 'ONLINE', 'ONLINE'), 'OFFLINE');
  assert.equal(computeOverallStatus(true, 'ONLINE', 'ONLINE', 'ONLINE'), 'ONLINE');
  assert.equal(computeOverallStatus(true, 'DOWN', 'ONLINE', 'ONLINE'), 'DEGRADED');
});
