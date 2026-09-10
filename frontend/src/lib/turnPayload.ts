/**
 * Stage-gating for candidate code attachment in dialogue turns (SPEC-PLAN-3 D1).
 *
 * Only coding stages (DSA, LLD) should attach candidate code snapshots.
 * Non-coding stages (INTRODUCTION, HLD, BEHAVIORAL, RESUME) must never
 * bundle code snapshots into dialogue turns.
 * During INTRODUCTION, question context, problem slug, and title are also nulled
 * to prevent the AI orchestrator from treating warm-up turns as coding questions.
 */

export function shouldAttachCode(
  sectionType?: string,
  isApproachGateLocked?: boolean,
  codeSnapshot?: string,
  starterCode?: string
): boolean {
  if (!sectionType) return false;
  const normalized = sectionType.trim().toUpperCase();
  if (normalized !== 'DSA' && normalized !== 'LLD') return false;
  // F2.1: If Approach Gate is LOCKED, do not attach candidate code
  if (isApproachGateLocked) return false;
  // F2.1: If code has not changed from starterCode, do not attach candidate code
  if (starterCode !== undefined && codeSnapshot !== undefined) {
    if (codeSnapshot.trim() === starterCode.trim()) return false;
  }
  return true;
}

export interface CandidateTurnInput {
  sectionType?: string;
  textToSend: string;
  codeSnapshot?: string;
  starterCode?: string;
  isApproachGateLocked?: boolean;
  questionContext?: string;
  problemSlug?: string;
  sectionQuestionTitle?: string;
}

export interface CandidateTurnPayload {
  candidateExplanation: string;
  codeSnippet: string;
  candidateCode: string;
  questionContext: string;
  problemSlug: string;
  sectionQuestionTitle: string;
}

export function buildCandidateTurnPayload(input: CandidateTurnInput): CandidateTurnPayload {
  const attachCode = shouldAttachCode(
    input.sectionType,
    input.isApproachGateLocked,
    input.codeSnapshot,
    input.starterCode
  );
  const isIntro = (input.sectionType || '').trim().toUpperCase() === 'INTRODUCTION';

  return {
    candidateExplanation: input.textToSend,
    codeSnippet: attachCode ? (input.codeSnapshot || '') : '',
    candidateCode: attachCode ? (input.codeSnapshot || '') : '',
    questionContext: isIntro ? '' : (input.questionContext || ''),
    problemSlug: isIntro ? '' : (input.problemSlug || ''),
    sectionQuestionTitle: isIntro ? '' : (input.sectionQuestionTitle || ''),
  };
}
