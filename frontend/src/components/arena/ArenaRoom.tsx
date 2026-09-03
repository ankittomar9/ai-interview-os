import React, { useState, useCallback } from 'react';
import type { GenerateQuestionResponse, InterviewTrack, ModelProvider } from '../../types';
import { useSessionCatalog } from './hooks/useSessionCatalog';
import { useExecution } from './hooks/useExecution';
import { useDialogue } from './hooks/useDialogue';
import { useProctoring } from './hooks/useProctoring';
import { useCoachVoice } from './hooks/useCoachVoice';
import { useSessionRecorder } from '../../hooks/useSessionRecorder';
import { ArenaShell } from './ArenaShell';
import { getPersona } from '../../lib/personas';
import type { InterviewStage } from '../StageStepper';

const STAGE_TRACK_MAP: Record<InterviewStage, InterviewTrack> = {
  INTRODUCTION: 'BEHAVIORAL_STAR',
  CORE_TECH: 'SPRING_LLD',
  CODING_DSA: 'ALGORITHMS_DATA_STRUCTURES',
  SYSTEM_DESIGN: 'SYSTEM_DESIGN'
};

interface ArenaRoomProps {
  sessionId: number;
  question: GenerateQuestionResponse;
  initialQuestionsList?: GenerateQuestionResponse[];
  provider: ModelProvider;
  apiKey: string;
  sessionMode?: 'INTERVIEW' | 'PLAYGROUND';
  candidateName?: string;
  onFinish: () => void;
}

export const ArenaRoom: React.FC<ArenaRoomProps> = ({
  sessionId,
  question: initialQuestion,
  initialQuestionsList,
  provider,
  apiKey,
  sessionMode = 'INTERVIEW',
  candidateName,
  onFinish
}) => {
  const isPlayground = sessionMode === 'PLAYGROUND';
  const persona = getPersona(isPlayground);

  const [activeTrack, setActiveTrack] = useState<InterviewTrack>(initialQuestion.track || 'ALGORITHMS_DATA_STRUCTURES');
  const [pendingStageSwitch, setPendingStageSwitch] = useState<{ stage: InterviewStage; targetTrack: InterviewTrack } | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    try { return localStorage.getItem('interview-os:focus-mode') === 'true'; } catch { return false; }
  });

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => {
      const next = !prev;
      try { localStorage.setItem('interview-os:focus-mode', String(next)); } catch {}
      return next;
    });
  }, []);

  // 1. Session Catalog (Strict track query with zero cross-track bleed)
  const {
    questionsList,
    activeQuestion,
    activeQuestionIndex,
    questionStatusMap,
    selectQuestion,
    markQuestionStatus
  } = useSessionCatalog({
    initialQuestion,
    initialQuestionsList,
    track: activeTrack,
    sessionMode,
    sessionId
  });

  // 2. Code State
  const [code, setCode] = useState(activeQuestion.starterCode || '');
  const [language, setLanguage] = useState(
    activeTrack === 'SQL' ? 'sql' : 'java'
  );

  // 3. Execution Engine
  const {
    isExecuting,
    executionResult,
    runCode,
    submitSolution
  } = useExecution({
    sessionId,
    activeQuestion
  });

  // 4. Voice Management
  const voice = useCoachVoice({
    onCandidateSpeechFinal: (text) => dialogue.triggerCandidateTurn(text, code),
    apiKey
  });

  // 5. Proctoring Sentinel
  const proctoring = useProctoring({
    sessionId,
    isPlayground
  });

  // 6. Dialogue Engine
  const dialogue = useDialogue({
    sessionId,
    provider,
    apiKey,
    isPlayground,
    questionContext: activeQuestion.problemStatement || '',
    problemSlug: activeQuestion.problemSlug || activeQuestion.slug,
    candidateName,
    initialWelcome: persona.welcomeMessage,
    onAiSpeechRequested: voice.speakText,
    getIntegritySignals: proctoring.getIntegritySignals
  });

  // 7. Session Video Recording Engine
  const recorder = useSessionRecorder({
    sessionId,
    isPlayground
  });

  // Handlers
  const handleRunCode = async () => {
    await runCode(code, language);
  };

  const handleSubmitSolution = async () => {
    const result = await submitSolution(code, language);
    const isPassed = result && (result.status === 'Accepted' || (result.passedTests > 0 && result.passedTests === result.totalTests));
    if (isPassed) {
      markQuestionStatus(activeQuestion.slug || `q${activeQuestionIndex + 1}`, 'PASSED');
    } else {
      markQuestionStatus(activeQuestion.slug || `q${activeQuestionIndex + 1}`, 'ATTEMPTED');
    }

    await dialogue.triggerCandidateTurn(
      `I have submitted my solution for ${activeQuestion.title || 'the problem'}.`,
      code,
      result
    );
  };

  const handleStageClick = useCallback((targetStage: InterviewStage) => {
    const mappedTrack = STAGE_TRACK_MAP[targetStage];
    if (mappedTrack && mappedTrack !== activeTrack) {
      setPendingStageSwitch({ stage: targetStage, targetTrack: mappedTrack });
    } else {
      dialogue.setCurrentStage(targetStage);
    }
  }, [activeTrack, dialogue]);

  const handleNextQuestion = useCallback(() => {
    if (activeQuestionIndex < questionsList.length - 1) {
      selectQuestion(activeQuestionIndex + 1);
    }
  }, [activeQuestionIndex, questionsList.length, selectQuestion]);

  const handleNextStage = useCallback(() => {
    const STAGES: InterviewStage[] = ['INTRODUCTION', 'CORE_TECH', 'CODING_DSA', 'SYSTEM_DESIGN'];
    const currentIdx = STAGES.indexOf(dialogue.currentStage);
    if (currentIdx < STAGES.length - 1) {
      handleStageClick(STAGES[currentIdx + 1]);
    }
  }, [dialogue.currentStage, handleStageClick]);

  const handleConfirmStageSwitch = useCallback(() => {
    if (pendingStageSwitch) {
      setActiveTrack(pendingStageSwitch.targetTrack);
      dialogue.setCurrentStage(pendingStageSwitch.stage);
      setPendingStageSwitch(null);
    }
  }, [pendingStageSwitch, dialogue]);

  const handleCancelStageSwitch = useCallback(() => {
    setPendingStageSwitch(null);
  }, []);

  return (
    <ArenaShell
      sessionId={sessionId}
      track={activeTrack}
      onSwitchTrack={setActiveTrack}
      question={activeQuestion}
      onNextQuestion={handleNextQuestion}
      onNextStage={handleNextStage}
      questionsList={questionsList}
      activeQuestionIndex={activeQuestionIndex}
      onSelectQuestion={(idx) => {
        selectQuestion(idx);
        const nextQ = questionsList[idx];
        if (nextQ && nextQ.starterCode) {
          setCode(nextQ.starterCode);
        }
      }}
      questionStatusMap={questionStatusMap}
      code={code}
      onChangeCode={setCode}
      language={language}
      onChangeLanguage={setLanguage}
      onRunCode={handleRunCode}
      onSubmitSolution={handleSubmitSolution}
      isExecuting={isExecuting}
      executionResult={executionResult}
      provider={provider}
      apiKey={apiKey}
      sessionMode={sessionMode}
      onFinish={onFinish}
      messages={dialogue.messages}
      chatInput={dialogue.chatInput}
      setChatInput={dialogue.setChatInput}
      onSendTurn={(text) => dialogue.triggerCandidateTurn(text, code)}
      isAiResponding={dialogue.isAiResponding}
      currentStage={dialogue.currentStage}
      onStageClick={handleStageClick}
      providerError={dialogue.providerError}
      onRetryProvider={dialogue.retryLastTurn}
      onClearProviderError={dialogue.clearProviderError}
      onOpenProviderSettings={onFinish}
      pendingStageSwitch={pendingStageSwitch}
      onConfirmStageSwitch={handleConfirmStageSwitch}
      onCancelStageSwitch={handleCancelStageSwitch}
      isAiPanelOpen={voice.isAiPanelOpen}
      onToggleAiPanel={voice.toggleAiPanel}
      onCloseAiPanel={() => voice.setIsAiPanelOpen(false)}
      isListening={voice.isListening}
      isSpeakingNow={voice.isSpeakingNow}
      isAiSpeaking={voice.isAiSpeaking}
      interimTranscript={voice.interimTranscript}
      micError={voice.micError}
      onClearMicError={voice.clearMicError}
      voiceOutputEnabled={voice.voiceOutputEnabled}
      onToggleVoice={() => voice.setVoiceOutputEnabled(!voice.voiceOutputEnabled)}
      onMicToggle={voice.toggleListening}
      hasUnreadAi={dialogue.hasUnread}
      isWindowBlurred={proctoring.isWindowBlurred}
      tabSwitches={proctoring.tabSwitches}
      pasteDumps={proctoring.pasteDumps}
      isRecording={recorder.isRecording}
      recordingSeconds={recorder.recordingSeconds}
      recordingInterrupted={recorder.recordingInterrupted}
      isFocusMode={isFocusMode}
      onToggleFocusMode={toggleFocusMode}
    />
  );
};
