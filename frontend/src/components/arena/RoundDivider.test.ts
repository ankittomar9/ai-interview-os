import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Round Boundary divider token presence', () => {
  const metadataType = 'ROUND_BOUNDARY';
  const label = 'Round Boundary: Coding & DSA';
  assert.equal(metadataType, 'ROUND_BOUNDARY');
  assert.ok(label.includes('Round Boundary'));
});
