import type { SectionGate } from '../types';

export const GATED_SECTION_TYPES: readonly string[] = ['DSA', 'LLD', 'SQL'] as const;

export const APPROACH_GATE_OVERLAY_MESSAGE =
  'Approach gate — explain your approach in the chat; the editor unlocks once the interviewer agrees.';

export const APPROACH_GATE_LOCKED_DEFAULT_MESSAGE =
  'Explain your approach to the interviewer before coding.';

/**
 * Returns true if the section type is subject to the approach gate (DSA, LLD, SQL).
 */
export function isGatedSectionType(sectionType?: string | null): boolean {
  if (!sectionType) return false;
  return GATED_SECTION_TYPES.includes(sectionType.toUpperCase());
}

/**
 * Determines whether the approach gate is currently LOCKED for a given section.
 * Rules:
 * - Applies ONLY to SectionType in {DSA, LLD, SQL} in INTERVIEW mode.
 * - PLAYGROUND is never gated.
 * - Missing gateStatus or legacy sessions without gateStatus read as OPEN (fail-open back-compat).
 */
export function isApproachGateLocked(params: {
  sessionMode?: 'INTERVIEW' | 'PLAYGROUND';
  sectionType?: string | null;
  sectionIndex?: number;
  sectionGates?: SectionGate[];
}): boolean {
  const { sessionMode = 'INTERVIEW', sectionType, sectionIndex, sectionGates } = params;

  if (sessionMode === 'PLAYGROUND') {
    return false;
  }

  if (!isGatedSectionType(sectionType)) {
    return false;
  }

  if (!sectionGates || sectionGates.length === 0) {
    return false;
  }

  const gate = sectionGates.find((g) => g.index === sectionIndex);
  if (!gate) {
    return false;
  }

  return gate.gateStatus === 'LOCKED';
}

/**
 * Checks if an API or execution error corresponds to GATE_LOCKED (HTTP 409 or code GATE_LOCKED).
 */
export function isGateLockedError(err: any): boolean {
  if (!err) return false;
  if (err.status === 409) return true;
  if (err.data?.code === 'GATE_LOCKED') return true;
  if (typeof err.message === 'string' && (err.message.includes('GATE_LOCKED') || err.message.toLowerCase().includes('approach to the interviewer'))) return true;
  return false;
}

/**
 * Extracts a candidate-friendly message from a GATE_LOCKED error.
 */
export function getGateLockedMessage(err: any): string {
  if (err?.data?.message && typeof err.data.message === 'string') {
    return err.data.message;
  }
  if (err?.message && typeof err.message === 'string' && !err.message.startsWith('HTTP ') && !err.message.startsWith('{')) {
    return err.message;
  }
  return APPROACH_GATE_LOCKED_DEFAULT_MESSAGE;
}
