import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRoomUrl, resolvePopStateView } from './sessionUrl';

test('VP-4 / F-3: buildRoomUrl produces /session/:id', () => {
  assert.equal(buildRoomUrl(42), '/session/42');
  assert.equal(buildRoomUrl('101'), '/session/101');
});

test('VP-4 / F-3: popstate routing contract for /session/ paths', () => {
  // 1. With active session in state -> ROOM
  assert.equal(resolvePopStateView('/session/42', 42), 'ROOM');
  assert.equal(resolvePopStateView('/session/101', 101), 'ROOM');

  // 2. Without active session in state (e.g. fresh navigation / abandoned) -> SETUP
  assert.equal(resolvePopStateView('/session/42', null), 'SETUP');
  assert.equal(resolvePopStateView('/session/42', undefined), 'SETUP');
  assert.equal(resolvePopStateView('/session/', null), 'SETUP');

  // 3. Other application routes
  assert.equal(resolvePopStateView('/dashboard', null), 'DASHBOARD');
  assert.equal(resolvePopStateView('/dashboard/metrics', 42), 'DASHBOARD');
  assert.equal(resolvePopStateView('/learn', null), 'LEARN');
  assert.equal(resolvePopStateView('/learn?view=modules', 42), 'LEARN');
  assert.equal(resolvePopStateView('/', null), 'SETUP');
  assert.equal(resolvePopStateView('', null), 'SETUP');
});
