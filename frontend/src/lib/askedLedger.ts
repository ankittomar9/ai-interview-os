import type { AiDialogueResponse } from '../types';

export function formatUsedSeedIds(usedFollowUpSeedIds?: number[] | string | null): string {
  if (usedFollowUpSeedIds == null) {
    return '';
  }
  if (Array.isArray(usedFollowUpSeedIds)) {
    return usedFollowUpSeedIds.map((id) => Number(id)).filter((n) => !isNaN(n)).join(',');
  }
  return String(usedFollowUpSeedIds).trim();
}

export function parseUsedSeedIds(raw?: string | null): number[] {
  if (!raw || !raw.trim()) {
    return [];
  }
  return raw
    .replace(/[\[\]\s]/g, '')
    .split(',')
    .filter((s) => s.length > 0)
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n));
}

export interface AiTurnMetadataInput {
  aiResponse: Partial<AiDialogueResponse> & { model?: string };
  stage?: string;
  sectionType?: string;
  provider?: string;
  model?: string;
}

export function buildAiTurnMetadata(input: AiTurnMetadataInput): Record<string, string> {
  const { aiResponse, stage = '', sectionType = '', provider = '', model = '' } = input;
  const usedSeeds = formatUsedSeedIds(aiResponse.usedFollowUpSeedIds);
  return {
    stage,
    sectionType,
    provider,
    model: (aiResponse as any).model || model || '',
    followUpQuestion: aiResponse.followUpQuestion || '',
    recommendedAction: aiResponse.recommendedAction || '',
    approachAssessment: aiResponse.approachAssessment || 'NOT_APPLICABLE',
    usedFollowUpSeedIds: usedSeeds,
    turnSummary: aiResponse.turnSummary || '',
    detectedIntent: aiResponse.detectedIntent || ''
  };
}
