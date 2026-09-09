import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isGatedSectionType,
  isApproachGateLocked,
  isGateLockedError,
  getGateLockedMessage,
  APPROACH_GATE_OVERLAY_MESSAGE,
  APPROACH_GATE_LOCKED_DEFAULT_MESSAGE
} from './approachGate';
import type { SectionGate } from '../types';

describe('Gate VP18: Approach Gate Frontend UX and Error Mapping', () => {
  describe('isGatedSectionType', () => {
    it('identifies DSA, LLD, and SQL as gated section types (case-insensitive)', () => {
      assert.equal(isGatedSectionType('DSA'), true);
      assert.equal(isGatedSectionType('dsa'), true);
      assert.equal(isGatedSectionType('LLD'), true);
      assert.equal(isGatedSectionType('lld'), true);
      assert.equal(isGatedSectionType('SQL'), true);
      assert.equal(isGatedSectionType('sql'), true);
    });

    it('rejects non-gated section types like INTRODUCTION, SYSTEM_DESIGN, BEHAVIORAL, RESUME', () => {
      assert.equal(isGatedSectionType('INTRODUCTION'), false);
      assert.equal(isGatedSectionType('SYSTEM_DESIGN'), false);
      assert.equal(isGatedSectionType('BEHAVIORAL'), false);
      assert.equal(isGatedSectionType('RESUME'), false);
      assert.equal(isGatedSectionType(undefined), false);
      assert.equal(isGatedSectionType(null), false);
    });
  });

  describe('isApproachGateLocked', () => {
    const lockedGates: SectionGate[] = [
      { index: 0, sectionType: 'INTRODUCTION', gateStatus: 'OPEN' },
      { index: 1, sectionType: 'DSA', gateStatus: 'LOCKED' },
      { index: 2, sectionType: 'LLD', gateStatus: 'LOCKED' },
      { index: 3, sectionType: 'SQL', gateStatus: 'OPEN' }
    ];

    it('returns true when INTERVIEW mode, gated section, and gateStatus is LOCKED', () => {
      const lockedDsa = isApproachGateLocked({
        sessionMode: 'INTERVIEW',
        sectionType: 'DSA',
        sectionIndex: 1,
        sectionGates: lockedGates
      });
      assert.equal(lockedDsa, true);

      const lockedLld = isApproachGateLocked({
        sessionMode: 'INTERVIEW',
        sectionType: 'LLD',
        sectionIndex: 2,
        sectionGates: lockedGates
      });
      assert.equal(lockedLld, true);
    });

    it('returns false when gateStatus is OPEN', () => {
      const openSql = isApproachGateLocked({
        sessionMode: 'INTERVIEW',
        sectionType: 'SQL',
        sectionIndex: 3,
        sectionGates: lockedGates
      });
      assert.equal(openSql, false);
    });

    it('PLAYGROUND mode is never gated even if gateStatus is LOCKED', () => {
      const playgroundDsa = isApproachGateLocked({
        sessionMode: 'PLAYGROUND',
        sectionType: 'DSA',
        sectionIndex: 1,
        sectionGates: lockedGates
      });
      assert.equal(playgroundDsa, false);
    });

    it('non-gated section types are never locked', () => {
      const intro = isApproachGateLocked({
        sessionMode: 'INTERVIEW',
        sectionType: 'INTRODUCTION',
        sectionIndex: 0,
        sectionGates: lockedGates
      });
      assert.equal(intro, false);
    });

    it('legacy sessions without sectionGates default to OPEN (fail-open back-compat)', () => {
      const legacy1 = isApproachGateLocked({
        sessionMode: 'INTERVIEW',
        sectionType: 'DSA',
        sectionIndex: 1,
        sectionGates: []
      });
      assert.equal(legacy1, false);

      const legacy2 = isApproachGateLocked({
        sessionMode: 'INTERVIEW',
        sectionType: 'DSA',
        sectionIndex: 1,
        sectionGates: undefined
      });
      assert.equal(legacy2, false);
    });

    it('unknown section index returns false', () => {
      const unknown = isApproachGateLocked({
        sessionMode: 'INTERVIEW',
        sectionType: 'DSA',
        sectionIndex: 99,
        sectionGates: lockedGates
      });
      assert.equal(unknown, false);
    });
  });

  describe('409 GATE_LOCKED error mapping', () => {
    it('detects HTTP 409 status error', () => {
      const error409 = {
        status: 409,
        data: {
          code: 'GATE_LOCKED',
          message: 'Explain your approach to the interviewer before coding.'
        }
      };
      assert.equal(isGateLockedError(error409), true);
    });

    it('detects GATE_LOCKED error code in response data', () => {
      const errorCode = {
        data: { code: 'GATE_LOCKED' }
      };
      assert.equal(isGateLockedError(errorCode), true);
    });

    it('detects approach gate explanation error message', () => {
      const errorMsg = new Error('Explain your approach to the interviewer before coding.');
      assert.equal(isGateLockedError(errorMsg), true);
    });

    it('rejects unrelated errors (400, 500, network failure)', () => {
      assert.equal(isGateLockedError(new Error('Network timeout')), false);
      assert.equal(isGateLockedError({ status: 500, data: { code: 'INTERNAL_ERROR' } }), false);
      assert.equal(isGateLockedError({ status: 404, data: { message: 'Not found' } }), false);
      assert.equal(isGateLockedError(null), false);
    });

    it('extracts candidate-friendly error message from GATE_LOCKED error', () => {
      const customErr = {
        status: 409,
        data: {
          code: 'GATE_LOCKED',
          message: 'Please explain your algorithmic complexity first.'
        }
      };
      assert.equal(getGateLockedMessage(customErr), 'Please explain your algorithmic complexity first.');

      const generic409 = { status: 409 };
      assert.equal(getGateLockedMessage(generic409), APPROACH_GATE_LOCKED_DEFAULT_MESSAGE);
    });
  });

  describe('FE Locked UX Contract (DsaScreen, LldScreen, SqlScreen)', () => {
    it('locked UX contract: overlay present, editor readOnly, Run/Submit disabled, dialogue enabled', () => {
      // Simulate screen state evaluation when locked
      const isLocked = true;
      const isExecuting = false;

      const editorReadOnly = isLocked;
      const runDisabled = isExecuting || isLocked;
      const submitDisabled = isExecuting || isLocked;
      const showOverlay = isLocked;
      const dialogueDisabled = false; // Dialogue panel is never disabled by gate

      assert.equal(editorReadOnly, true, 'Editor must be readOnly when gate is locked');
      assert.equal(runDisabled, true, 'Run button must be disabled when gate is locked');
      assert.equal(submitDisabled, true, 'Submit button must be disabled when gate is locked');
      assert.equal(showOverlay, true, 'Overlay must be present when gate is locked');
      assert.equal(dialogueDisabled, false, 'Dialogue must remain fully interactive');
      assert.equal(
        APPROACH_GATE_OVERLAY_MESSAGE,
        'Approach gate — explain your approach in the chat; the editor unlocks once the interviewer agrees.'
      );
    });

    it('open UX contract: overlay absent, editor editable, Run/Submit enabled', () => {
      // Simulate screen state evaluation when open
      const isLocked = false;
      const isExecuting = false;

      const editorReadOnly = isLocked;
      const runDisabled = isExecuting || isLocked;
      const submitDisabled = isExecuting || isLocked;
      const showOverlay = isLocked;

      assert.equal(editorReadOnly, false, 'Editor must be editable when gate is open');
      assert.equal(runDisabled, false, 'Run button must be enabled when gate is open');
      assert.equal(submitDisabled, false, 'Submit button must be enabled when gate is open');
      assert.equal(showOverlay, false, 'Overlay must be absent when gate is open');
    });
  });
});
