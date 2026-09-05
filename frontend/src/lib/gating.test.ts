import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCanNavigate, canNavigateToSection, evaluateNavigationGate } from './gating';

test('gating: forward jump index > active+1 throws/blocks in INTERVIEW mode and passes in PLAYGROUND mode', () => {
  const activeIndex = 1;

  // In INTERVIEW mode:
  // Forward jump > active + 1 is blocked and throws
  assert.equal(canNavigateToSection(3, activeIndex, false), false);
  assert.throws(
    () => assertCanNavigate(3, activeIndex, false),
    /Finish current round first — or end the round early/
  );

  const lockedGate = evaluateNavigationGate(3, activeIndex, false, 'Low-Level Design');
  assert.equal(lockedGate.isLocked, true);
  assert.equal(lockedGate.allowed, false);
  assert.equal(lockedGate.tooltip, 'Finish Low-Level Design first — or end the round early');

  // Immediately next (active + 1) is allowed
  assert.equal(canNavigateToSection(2, activeIndex, false), true);
  assert.doesNotThrow(() => assertCanNavigate(2, activeIndex, false));

  // Backward (review) is allowed with reviewing badge
  assert.equal(canNavigateToSection(0, activeIndex, false), true);
  const reviewGate = evaluateNavigationGate(0, activeIndex, false);
  assert.equal(reviewGate.isReviewing, true);

  // In PLAYGROUND mode: free jumps are preserved (all passes)
  assert.equal(canNavigateToSection(3, activeIndex, true), true);
  assert.doesNotThrow(() => assertCanNavigate(3, activeIndex, true));
  const playgroundGate = evaluateNavigationGate(3, activeIndex, true);
  assert.equal(playgroundGate.isLocked, false);
  assert.equal(playgroundGate.allowed, true);
});
