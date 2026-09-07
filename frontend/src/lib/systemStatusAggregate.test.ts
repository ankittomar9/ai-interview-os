import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSandboxStatus,
  computeIntelligenceStatus,
  computeDataStatus,
  computeOverallStatus,
  computePillStatus
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

test('Pill status: CHECKING… when poll is in flight and initial load', () => {
  const result = computePillStatus({
    isChecking: true,
    backendOk: false,
    capabilities: null
  });
  assert.equal(result.status, 'CHECKING…');
  assert.deepEqual(result.failingServices, []);
  assert.equal(result.tooltipLines.length, 1);
  assert.match(result.tooltipLines[0], /checking/i);
});

test('Pill status: OFFLINE when backend is unreachable', () => {
  const result = computePillStatus({
    isChecking: false,
    backendOk: false,
    capabilities: null
  });
  assert.equal(result.status, 'OFFLINE');
  assert.deepEqual(result.failingServices, ['API Gateway']);
  assert.equal(result.tooltipLines.length, 1);
  assert.match(result.tooltipLines[0], /API Gateway/);
});

const healthyCapabilities = {
  engines: {
    dsa: { ready: true, state: 'ONLINE', detail: 'Judge0 online' },
    lld: { ready: true, state: 'ONLINE', detail: 'Docker online' },
    sql: { ready: true, state: 'ONLINE', detail: 'SQL runner online' }
  },
  services: {
    postgres: true,
    mongo: true,
    orchestrator: true,
    proctor: true,
    questionBank: true,
    eureka: false // note: eureka is ignored as non-core
  },
  checkedAt: new Date().toISOString()
};

test('Pill status: ONLINE when all core microservices and engines are ready', () => {
  const result = computePillStatus({
    isChecking: false,
    backendOk: true,
    capabilities: healthyCapabilities
  });
  assert.equal(result.status, 'ONLINE');
  assert.deepEqual(result.failingServices, []);
  assert.equal(result.tooltipLines.length, 1);
  assert.match(result.tooltipLines[0], /All core services healthy/);
});

test('Pill status: DEGRADED when question-bank-service is down', () => {
  const cap = {
    ...healthyCapabilities,
    services: {
      ...healthyCapabilities.services,
      questionBank: false
    }
  };
  const result = computePillStatus({
    isChecking: false,
    backendOk: true,
    capabilities: cap
  });
  assert.equal(result.status, 'DEGRADED');
  assert.deepEqual(result.failingServices, ['Question Bank Service']);
  assert.equal(result.tooltipLines.length, 1);
  assert.equal(result.tooltipLines[0], 'Question Bank Service unreachable');
});

test('Pill status: DEGRADED when DSA sandbox engine is down', () => {
  const cap = {
    ...healthyCapabilities,
    engines: {
      ...healthyCapabilities.engines,
      dsa: { ready: false, state: 'DOWN', detail: 'Judge0 unreachable' }
    }
  };
  const result = computePillStatus({
    isChecking: false,
    backendOk: true,
    capabilities: cap
  });
  assert.equal(result.status, 'DEGRADED');
  assert.deepEqual(result.failingServices, ['DSA Sandbox (Judge0)']);
  assert.equal(result.tooltipLines.length, 1);
  assert.equal(result.tooltipLines[0], 'DSA Sandbox (Judge0): Judge0 unreachable');
});

test('Pill status: DEGRADED when postgres database is down', () => {
  const cap = {
    ...healthyCapabilities,
    services: {
      ...healthyCapabilities.services,
      postgres: false
    }
  };
  const result = computePillStatus({
    isChecking: false,
    backendOk: true,
    capabilities: cap
  });
  assert.equal(result.status, 'DEGRADED');
  assert.deepEqual(result.failingServices, ['PostgreSQL Database']);
  assert.equal(result.tooltipLines.length, 1);
  assert.equal(result.tooltipLines[0], 'PostgreSQL Database down');
});

test('Pill status: lists multiple failing services, one line each', () => {
  const cap = {
    ...healthyCapabilities,
    services: {
      ...healthyCapabilities.services,
      questionBank: false,
      postgres: false
    },
    engines: {
      ...healthyCapabilities.engines,
      sql: { ready: false, state: 'DOWN', detail: 'Docker socket unavailable' }
    }
  };
  const result = computePillStatus({
    isChecking: false,
    backendOk: true,
    capabilities: cap
  });
  assert.equal(result.status, 'DEGRADED');
  assert.equal(result.failingServices.length, 3);
  assert.equal(result.tooltipLines.length, 3);
  assert.equal(result.tooltipLines[0], 'Question Bank Service unreachable');
  assert.equal(result.tooltipLines[1], 'PostgreSQL Database down');
  assert.equal(result.tooltipLines[2], 'SQL Sandbox: Docker socket unavailable');
});

test('Pill status: eureka false does NOT cause DEGRADED state', () => {
  const cap = {
    ...healthyCapabilities,
    services: {
      ...healthyCapabilities.services,
      eureka: false
    }
  };
  const result = computePillStatus({
    isChecking: false,
    backendOk: true,
    capabilities: cap
  });
  assert.equal(result.status, 'ONLINE');
});

