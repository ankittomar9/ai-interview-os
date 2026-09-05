import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { GenerateQuestionResponse, InterviewTrack, ModelProvider, SessionPlan } from '../../types';
import { useSessionCatalog } from './hooks/useSessionCatalog';
import { useExecution } from './hooks/useExecution';
import { useDialogue } from './hooks/useDialogue';
import { useProctoring } from './hooks/useProctoring';
import { useCoachVoice } from './hooks/useCoachVoice';
import { useSessionRecorder } from '../../hooks/useSessionRecorder';
import { ArenaShell } from './ArenaShell';
import { ShareLostOverlay } from '../ShareLostOverlay';
import { clearVerificationStreams } from '../../services/verificationStreams';
import { evaluateNavigationGate } from '../../lib/gating';
import { getPersona } from '../../lib/personas';
import { mergeSalvageText } from '../../lib/salvage-dedup';
import type { InterviewStage } from '../StageStepper';
import { buildNavSections } from '../../lib/plan-navigation';

interface ArenaRoomProps {
  sessionId: number;
  question: GenerateQuestionResponse;
  initialQuestionsList?: GenerateQuestionResponse[];
  sectionQuestions?: GenerateQuestionResponse[][];
  provider: ModelProvider;
  apiKey: string;
  sessionMode?: 'INTERVIEW' | 'PLAYGROUND';
  candidateName?: string;
  plan?: SessionPlan;
  onFinish: () => void;
}

export const ArenaRoom: React.FC<ArenaRoomProps> = ({
  sessionId,
  question: initialQuestion,
  initialQuestionsList,
  sectionQuestions,
  provider,
  apiKey,
  sessionMode = 'INTERVIEW',
  candidateName,
  plan,
  onFinish
}) => {
  const isPlayground = sessionMode === 'PLAYGROUND';
  const persona = getPersona(isPlayground);

  const navSections = useMemo(() => buildNavSections(plan?.sections, initialQuestion.track), [plan?.sections, initialQuestion.track]);
  const [activeTrack, setActiveTrack] = useState<InterviewTrack>(initialQuestion.track || 'ALGORITHMS_DATA_STRUCTURES');
  const [pendingStageSwitch, setPendingStageSwitch] = useState<{ stage: InterviewStage; targetTrack: InterviewTrack; targetIndex?: number } | null>(null);
  const [isShareLost, setIsShareLost] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    try { return localStorage.getItem('interview-os:focus-mode') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    return () => { clearVerificationStreams(); };
  }, []);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => {
      const next = !prev;
      try { localStorage.setItem('interview-os:focus-mode', String(next)); } catch {}
      return next;
    });
  }, []);

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  // 1. Session Catalog (Strict section-scoped query with zero cross-round bleed)
  const { questionsList, activeQuestion, activeQuestionIndex, questionStatusMap, selectQuestion, markQuestionStatus } =
    useSessionCatalog({
      defaultQuestion: initialQuestion,
      sectionQuestions,
      activeSectionIndex,
      playlistQuestions: initialQuestionsList,
      track: activeTrack,
      sessionMode,
      sessionId
    });

  // 2. Code State (Keyed per slug to eliminate A10 cross-question bleed)
  const activeSlug = activeQuestion.problemSlug || activeQuestion.slug || `q_${activeQuestionIndex}`;
  const [codeMap, setCodeMap] = useState<Record<string, string>>(() => ({ [activeSlug]: activeQuestion.starterCode || '' }));
  const code = codeMap[activeSlug] ?? (activeQuestion.starterCode || '');
  const setCode = useCallback((newCode: string) => { setCodeMap((prev) => ({ ...prev, [activeSlug]: newCode })); }, [activeSlug]);
  const [language, setLanguage] = useState(activeTrack === 'SQL' ? 'sql' : 'java');

  // 3. Execution Engine
  const { isExecuting, executionResult, runCode, submitSolution } = useExecution({
    sessionId, activeQuestion
  });

  // 4. Voice Management
  const voice = useCoachVoice({
    onCandidateSpeechFinal: (text) => dialogue.triggerCandidateTurn(text, code),
    onCandidateSpeechPartialSalvage: (text) => dialogue.setChatInput((prev) => mergeSalvageText(prev, text)),
    apiKey,
    promptContext: [candidateName, activeTrack, activeQuestion?.title, activeQuestion?.difficulty].filter(Boolean).join(', '),
    sessionId
  });

  // 5. Proctoring Sentinel
  const proctoring = useProctoring({ sessionId, isPlayground });

  // 6. Dialogue Engine
  const dialogue = useDialogue({
    sessionId,
    provider,
    apiKey,
    isPlayground,
    getQuestionContext: () => activeQuestion?.problemStatement || '',
    getSectionQuestionTitle: () => activeQuestion?.title,
    problemSlug: activeQuestion?.problemSlug || activeQuestion?.slug,
    candidateName,
    initialWelcome: persona.welcomeMessage,
    sections: plan?.sections,
    onAiSpeechRequested: voice.speakText,
    getIntegritySignals: proctoring.getIntegritySignals,
    onSectionChanged: (idx, sec) => {
      setActiveSectionIndex(idx);
      if (sec.track && sec.track !== activeTrack) setActiveTrack(sec.track);
    }
  });

  // 7. Session Video Recording Engine
  const recorder = useSessionRecorder({
    sessionId, isPlayground, onShareLost: () => { if (!isPlayground) setIsShareLost(true); }
  });

  // Handlers
  const handleRunCode = async () => { await runCode(code, language); };

  const handleSubmitSolution = async () => {
    const result = await submitSolution(code, language);
    const isPassed = result && (result.status === 'Accepted' || (result.passedTests > 0 && result.passedTests === result.totalTests));
    markQuestionStatus(activeQuestion.slug || `q${activeQuestionIndex + 1}`, isPassed ? 'PASSED' : 'ATTEMPTED');

    await dialogue.triggerCandidateTurn(
      `I have submitted my solution for ${activeQuestion.title || 'the problem'}.`,
      code,
      result
    );
  };

  const handleSectionClick = useCallback((targetIndex: number, targetStage: InterviewStage) => {
    const sec = navSections[targetIndex];
    if (!sec) return;

    const gate = evaluateNavigationGate(targetIndex, dialogue.activeSectionIndex, isPlayground, navSections[dialogue.activeSectionIndex]?.label);
    if (gate.isLocked) {
      const confirmed = window.confirm(`Finish current round first — or end the round early?\n\nDo you want to end this round early and proceed to ${sec.label}?`);
      if (!confirmed) return;
      dialogue.transitionSection(targetIndex, 'SKIPPED_BY_USER');
      return;
    }

    if (sec.track && sec.track !== activeTrack) {
      setPendingStageSwitch({ stage: targetStage, targetTrack: sec.track, targetIndex });
    } else {
      dialogue.transitionSection(targetIndex, 'MANUAL_JUMP');
    }
  }, [activeTrack, dialogue, navSections, isPlayground]);

  const handleStageClick = useCallback((targetStage: InterviewStage) => {
    const targetIdx = navSections.findIndex((s) => s.stage === targetStage);
    if (targetIdx !== -1) handleSectionClick(targetIdx, targetStage);
    else dialogue.transitionStage(targetStage, 'MANUAL_JUMP');
  }, [handleSectionClick, navSections, dialogue]);

  const handleNextQuestion = useCallback(() => {
    if (activeQuestionIndex < questionsList.length - 1) selectQuestion(activeQuestionIndex + 1);
  }, [activeQuestionIndex, questionsList.length, selectQuestion]);

  const handleNextStage = useCallback(() => {
    if (dialogue.activeSectionIndex < navSections.length - 1) {
      const nextSec = navSections[dialogue.activeSectionIndex + 1];
      handleSectionClick(dialogue.activeSectionIndex + 1, nextSec.stage);
    }
  }, [dialogue.activeSectionIndex, navSections, handleSectionClick]);

  const handleConfirmStageSwitch = useCallback(() => {
    if (pendingStageSwitch) {
      setActiveTrack(pendingStageSwitch.targetTrack);
      if (pendingStageSwitch.targetIndex !== undefined) dialogue.transitionSection(pendingStageSwitch.targetIndex, 'MANUAL_JUMP');
      else dialogue.transitionStage(pendingStageSwitch.stage, 'MANUAL_JUMP');
      setPendingStageSwitch(null);
    }
  }, [pendingStageSwitch, dialogue]);

  const handleCancelStageSwitch = useCallback(() => setPendingStageSwitch(null), []);

  return (
    <>
      {isShareLost && !isPlayground && (
        <ShareLostOverlay
          sessionId={sessionId}
          onRestored={(newStream) => {
            recorder.attachScreenStream(newStream);
            setIsShareLost(false);
          }}
          onAborted={onFinish}
        />
      )}
      <ArenaShell
        sessionId={sessionId}
      track={activeTrack}
      sections={plan?.sections}
      activeSectionIndex={dialogue.activeSectionIndex}
      sectionQuestions={sectionQuestions}
      onSectionClick={handleSectionClick}
      onSwitchTrack={setActiveTrack}
      question={activeQuestion}
      onNextQuestion={handleNextQuestion}
      onNextStage={handleNextStage}
      questionsList={questionsList}
      activeQuestionIndex={activeQuestionIndex}
      onSelectQuestion={(idx) => { selectQuestion(idx); const nextQ = questionsList[idx]; if (nextQ?.starterCode) setCode(nextQ.starterCode); }}
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
      stageTurnCounts={dialogue.stageTurnCounts}
      stageTransitionReasons={dialogue.stageTransitionReasons}
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
      cameraActive={recorder.cameraActive}
      screenActive={recorder.screenActive}
      verificationBroken={recorder.verificationBroken}
      isFocusMode={isFocusMode}
      onToggleFocusMode={toggleFocusMode}
    />
  </>
  );
};
