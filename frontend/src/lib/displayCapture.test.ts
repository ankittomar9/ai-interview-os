import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDisplayShareConstraints } from './displayCapture';

function assertNoMinProperty(obj: unknown, path = ''): void {
  if (!obj || typeof obj !== 'object') return;
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    assert.notEqual(key, 'min', `Property 'min' is forbidden in display capture constraints (found at ${currentPath})`);
    if (typeof value === 'object' && value !== null) {
      assertNoMinProperty(value, currentPath);
    }
  }
}

test('buildDisplayShareConstraints: deep-walk asserts zero properties named min', () => {
  const constraints = buildDisplayShareConstraints();
  assertNoMinProperty(constraints);
});

test('buildDisplayShareConstraints: exact shape freeze matches D1 specification', () => {
  const constraints = buildDisplayShareConstraints();
  assert.deepEqual(constraints, {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30, max: 30 }
    },
    audio: false,
    selfBrowserSurface: 'exclude'
  });
});
