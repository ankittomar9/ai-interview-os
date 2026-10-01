import { useEffect } from 'react';
import type { GenerateQuestionResponse, ModelProvider, SessionPlan, SectionGate } from '../../../types';
import { useExecution } from './useExecution';
import { useCoachVoice } from './useCoachVoice';
import { useProctoring } from './useProctoring';
import { useDialogue } from './useDialogue';
import { useSessionRecorder } from '../../../hooks/useSessionRecorder';
import { useMicRecorder } from '../../../hooks/useMicRecorder';
import { mergeSalvageText } from '../../../lib/salvage-dedup';
import { isApproachGateLocked } from '../../../lib/approachGate';

interface UseArenaEnginesProps {
  sessionId: number;
  provider: ModelProvider;
  apiKey: string;
  sessionMode: 'INTERVIEW' | 'PLAYGROUND';
  candidateName?: string;
  initialQuestion: GenerateQuestionResponse;
  activeQuestion: GenerateQuestionResponse;
  activeQuestionIndex: number;
  questionsList: GenerateQuestionResponse[];
  fallbackStarter: string;
  code: string;
  language: string;
  plan?: SessionPlan;
  navSections: Array<{ stage: any; sectionType: string; label: string }>;
  sectionGates: SectionGate[];
  welcomeMessage: string;
  jobDescription?: string;
  targetCompany?: string;
  resumeSummary?: string;
  onShareLost: () => void;
  onRegisterFinishRecorder?: (fn: () => Promise<void>) => void;
  markQuestionStatus: (slug: string, status: 'PASSED' | 'ATTEMPTED') => void;
  handleAiTurnCompleted: () => Promise<void>;
  onSectionChanged: (idx: number, stage: any) => void;
  activeSectionIndex?: number;
  onSectionIndexChange?: (index: number) => void;
}

export function useArenaEngines({
  sessionId,
  provider,
  apiKey,
  sessionMode,
  candidateName,
  initialQuestion,
  activeQuestion,
  activeQuestionIndex,
  questionsList,
  fallbackStarter,
  code,
  language,
  plan,
  navSections,
  sectionGates,
  welcomeMessage,
  jobDescription,
  targetCompany,
  resumeSummary,
  onShareLost,
  onRegisterFinishRecorder,
  markQuestionStatus,
  handleAiTurnCompleted,
  onSectionChanged,
  activeSectionIndex,
  onSectionIndexChange
}: UseArenaEnginesProps) {
  const isPlayground = sessionMode === 'PLAYGROUND';

  const { isExecuting, executionResult, runCode, submitSolution } = useExecution({
    sessionId,
    activeQuestion
  });

  const voice = useCoachVoice({
    onCandidateSpeechFinal: (text, meta) => dialogue.triggerCandidateTurn(text, code, undefined, meta),
    onCandidateSpeechPartialSalvage: (text) => dialogue.setChatInput((prev) => mergeSalvageText(prev, text)),
    apiKey,
    promptContext: [candidateName, initialQuestion.track, activeQuestion?.title, activeQuestion?.difficulty]
      .filter(Boolean)
      .join(', '),
    sessionId
  });

  const proctoring = useProctoring({ sessionId, isPlayground });

  const dialogue = useDialogue({
    sessionId,
    provider,
    apiKey,
    isPlayground,
    getQuestionContext: () => activeQuestion?.problemStatement || '',
    getSectionQuestionTitle: () => activeQuestion?.title,
    problemSlug: activeQuestion?.problemSlug || activeQuestion?.slug,
    starterCode: fallbackStarter,
    getStarterCode: () => activeQuestion?.starterCode || fallbackStarter,
    getQuestionIndex: () => activeQuestionIndex,
    getTotalQuestionsInSection: () => questionsList.length,
    activeSectionIndex,
    onSectionIndexChange,
    getIsApproachGateLocked: () =>
      isApproachGateLocked({
        sessionMode,
        sectionType:
          plan?.sections?.[activeSectionIndex ?? dialogue?.activeSectionIndex ?? 0]?.sectionType ||
          navSections[activeSectionIndex ?? dialogue?.activeSectionIndex ?? 0]?.sectionType ||
          initialQuestion.track,
        sectionIndex: activeSectionIndex ?? dialogue?.activeSectionIndex ?? 0,
        sectionGates
      }),
    candidateName,
    initialWelcome: welcomeMessage,
    sections: plan?.sections,
    onAiSpeechRequested: voice.speakText,
    getIntegritySignals: proctoring.getIntegritySignals,
    onSectionChanged: (idx, sec) => onSectionChanged(idx, sec.stage),
    onAiTurnCompleted: handleAiTurnCompleted,
    jobDescription,
    targetCompany,
    resumeSummary
  });

  const recorder = useSessionRecorder({ sessionId, isPlayground, onShareLost });
  const audioConsent = isPlayground || sessionStorage.getItem('interview.audioConsent') !== 'false';
  const micRecorder = useMicRecorder({ sessionId, enabled: !isPlayground && audioConsent });

  useEffect(() => {
    onRegisterFinishRecorder?.(async () => {
      await Promise.allSettled([recorder.finish(), micRecorder.finish()]);
    });
  }, [onRegisterFinishRecorder, recorder.finish, micRecorder.finish]);

  const handleRunCode = async () => {
    await runCode(code, language);
  };

  const handleSubmitSolution = async () => {
    const result = await submitSolution(code, language);
    const isPassed =
      result &&
      (result.status === 'Accepted' ||
        (result.passedTests > 0 && result.passedTests === result.totalTests));
    markQuestionStatus(activeQuestion.slug || `q${activeQuestionIndex + 1}`, isPassed ? 'PASSED' : 'ATTEMPTED');

    await dialogue.triggerCandidateTurn(
      `I have submitted my solution for ${activeQuestion.title || 'the problem'}.`,
      code,
      result
    );
  };

  return {
    voice,
    proctoring,
    dialogue,
    recorder,
    micRecorder,
    audioConsent,
    isExecuting,
    executionResult,
    handleRunCode,
    handleSubmitSolution
  };
}
