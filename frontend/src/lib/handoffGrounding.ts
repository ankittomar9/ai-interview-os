import type { AiHandoffPayload } from '../services/api';
import { isGatedSectionType } from './approachGate';

export interface GroundedCandidateContext {
  jobDescription?: string;
  targetCompany?: string;
  resumeSummary?: string;
}

export function shouldTriggerHandoff(
  lastHandoffIndex: number | null,
  targetIndex: number,
  sessionId?: number
): boolean {
  if (!sessionId) return false;
  return lastHandoffIndex !== targetIndex;
}

export function buildHandoffPayload(params: {
  sessionId: number;
  fromSectionType?: string;
  toSectionType: string;
  toSectionTitle: string;
  candidateName?: string;
  apiKey?: string;
  modelProvider?: string;
}): AiHandoffPayload {
  const isGated = isGatedSectionType(params.toSectionType);
  return {
    sessionId: params.sessionId,
    fromSectionType: params.fromSectionType || '',
    toSectionType: params.toSectionType,
    toSectionTitle: params.toSectionTitle,
    toSectionGated: isGated,
    candidateName: params.candidateName,
    apiKey: params.apiKey,
    modelProvider: params.modelProvider
  };
}

export function resolveIntroContext(
  sectionType: string,
  context: GroundedCandidateContext
): GroundedCandidateContext {
  if (sectionType && sectionType.toUpperCase() === 'INTRODUCTION') {
    return {
      jobDescription: context.jobDescription?.trim() || undefined,
      targetCompany: context.targetCompany?.trim() || undefined,
      resumeSummary: context.resumeSummary?.trim() || undefined
    };
  }
  return {
    jobDescription: undefined,
    targetCompany: undefined,
    resumeSummary: undefined
  };
}

export function handleHandoffFailure(_err?: unknown): null {
  // Gate VP19 mandate: on orchestrator/LLM failure, fall back to divider only.
  // NEVER fabricate handoff text client-side.
  return null;
}
