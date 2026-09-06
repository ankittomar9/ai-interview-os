/**
 * Stage-gating for candidate code attachment in dialogue turns (SPEC-PLAN-3 D1).
 *
 * Only coding stages (DSA, LLD) should attach candidate code snapshots.
 * Non-coding stages (INTRODUCTION, HLD, BEHAVIORAL, RESUME) must never
 * bundle code snapshots into dialogue turns.
 * During INTRODUCTION, question context, problem slug, and title are also nulled
 * to prevent the AI orchestrator from treating warm-up turns as coding questions.
 */

export function shouldAttachCode(sectionType?: string): boolean {
  if (!sectionType) return false;
  const normalized = sectionType.trim().toUpperCase();
  return normalized === 'DSA' || normalized === 'LLD';
}

export interface CandidateTurnInput {
  sectionType?: string;
  textToSend: string;
  codeSnapshot?: string;
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
  const attachCode = shouldAttachCode(input.sectionType);
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
