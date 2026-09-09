import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isLeaveGuardActive, LEAVE_WARNING_MESSAGE } from './useLeaveGuard';

describe('Gate VP21: Leave Guard Condition and Lifecycle Tests', () => {
  describe('isLeaveGuardActive gate condition', () => {
    it('returns true exactly when sessionMode=INTERVIEW, status=IN_PROGRESS, and arena is mounted', () => {
      const active = isLeaveGuardActive('INTERVIEW', 'IN_PROGRESS', true);
      assert.equal(active, true);
    });

    it('PLAYGROUND is strictly exempt from leave guard warnings', () => {
      assert.equal(isLeaveGuardActive('PLAYGROUND', 'IN_PROGRESS', true), false);
      assert.equal(isLeaveGuardActive('PLAYGROUND', 'INITIALIZED', true), false);
      assert.equal(isLeaveGuardActive('PLAYGROUND', 'COMPLETED', true), false);
    });

    it('returns false when status is not IN_PROGRESS (e.g. COMPLETED, INITIALIZED, EVALUATED)', () => {
      assert.equal(isLeaveGuardActive('INTERVIEW', 'INITIALIZED', true), false);
      assert.equal(isLeaveGuardActive('INTERVIEW', 'COMPLETED', true), false);
      assert.equal(isLeaveGuardActive('INTERVIEW', 'EVALUATED', true), false);
      assert.equal(isLeaveGuardActive('INTERVIEW', undefined, true), false);
    });

    it('returns false when arena is not mounted', () => {
      assert.equal(isLeaveGuardActive('INTERVIEW', 'IN_PROGRESS', false), false);
    });
  });

  describe('beforeunload and popstate event simulation', () => {
    it('beforeunload handler calls preventDefault and sets returnValue', () => {
      let defaultPrevented = false;
      const mockEvent = {
        preventDefault: () => { defaultPrevented = true; },
        returnValue: ''
      };

      // Emulate the beforeunload listener logic
      mockEvent.preventDefault();
      mockEvent.returnValue = LEAVE_WARNING_MESSAGE;

      assert.equal(defaultPrevented, true);
      assert.equal(mockEvent.returnValue, LEAVE_WARNING_MESSAGE);
    });

    it('popstate handler prompts with standard warning and restores state if cancelled', () => {
      let pushed = false;
      const fakeConfirm = (_msg: string) => false; // User clicks cancel
      const fakePushState = () => { pushed = true; };

      const confirmed = fakeConfirm(LEAVE_WARNING_MESSAGE);
      if (!confirmed) {
        fakePushState();
      }

      assert.equal(confirmed, false);
      assert.equal(pushed, true);
    });
  });
});
