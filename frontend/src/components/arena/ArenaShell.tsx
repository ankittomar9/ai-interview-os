import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Group, Panel, Separator, type PanelImperativeHandle } from 'react-resizable-panels';
import type { InterviewTrack } from '../../types';
import { TrackNavMenu } from '../ui/TrackNavMenu';
import { StageStepper } from '../StageStepper';
import { QuestionRail, type QuestionRailItem } from '../ide/QuestionRail';
import { ProblemPanel } from '../ide/ProblemPanel';
import { FloatingAiOrb } from '../ai/FloatingAiOrb';
import { AiAssistantPanel } from '../ai/AiAssistantPanel';
import { WebcamTile } from '../WebcamTile';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Chip } from '../ui/Chip';
import { SelfTimer } from '../ide/SelfTimer';
import { getPersona } from '../../lib/personas';
import { TrackScreenRouter } from './TrackScreenRouter';
import { ProviderToast } from './ProviderToast';
import { StageSwitchModal } from './StageSwitchModal';
import { FocusModeToggle } from './FocusModeToggle';
import { LocalPurityBadge } from '../LocalPurityBadge';
import { VoiceCoachIndicator } from './VoiceCoachIndicator';
import { ArenaRecordingBadges } from './ArenaRecordingBadges';
import { ArenaIntroductionPanel } from './ArenaIntroductionPanel';
import type { ArenaShellProps } from './ArenaShellTypes';

export type { ArenaShellProps };

export const ArenaShell: React.FC<ArenaShellProps> = (props) => {
  const {
    sessionId, track, onSwitchTrack, question, questionsList, activeQuestionIndex, onSelectQuestion,
    questionStatusMap, code, onChangeCode, language, onChangeLanguage, onRunCode, onSubmitSolution,
    isExecuting, executionResult, provider, apiKey, sessionMode = 'INTERVIEW', onFinish, messages,
    chatInput, setChatInput, onSendTurn, isAiResponding, currentStage, onStageClick, stageTurnCounts,
    stageTransitionReasons, providerError, onRetryProvider, onClearProviderError, onOpenProviderSettings,
    pendingStageSwitch, onConfirmStageSwitch, onCancelStageSwitch, onNextQuestion, onNextStage,
    isAiPanelOpen, onToggleAiPanel, onCloseAiPanel, isListening, isRequestingMic, isSpeakingNow, isAiSpeaking,
    voiceOutputEnabled, onToggleVoice, onMicToggle, onStartListening, onStopListening, onAbortVoice,
    onAbortTurn, onRecallLastDraft,
    interimTranscript = '', micError = null,
    onClearMicError, canRetryStt = false, onRetryStt, hasUnreadAi, isWindowBlurred = false, tabSwitches = 0, pasteDumps = 0,
    isRecording, recordingSeconds, recordingInterrupted, failedChunkCount = 0, cameraActive, screenActive, verificationBroken = false,
    isVoiceRecording = false, voiceUnsentCount = 0, voiceLostAt = null, audioConsent = true,
    isFocusMode = false, onToggleFocusMode, sectionQuestions
  } = props;
  const isPlayground = sessionMode === 'PLAYGROUND';
  const persona = getPersona(isPlayground);

  const [hintsRevealed, setHintsRevealed] = useState<Record<string, number>>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [hasWorkspaceRunAttempt, setHasWorkspaceRunAttempt] = useState(false);

  const problemPanelRef = useRef<PanelImperativeHandle | null>(null);

  useEffect(() => {
    const panel = problemPanelRef.current;
    if (!panel) return;
    if (isFocusMode) {
      if (!panel.isCollapsed()) {
        panel.collapse();
      }
    } else {
      if (panel.isCollapsed()) {
        panel.expand();
      }
    }
  }, [isFocusMode]);

  useEffect(() => {
    setHasWorkspaceRunAttempt(false);
  }, [question?.slug, props.activeQuestionIndex]);

  useEffect(() => {
    if (!providerError || !onClearProviderError) return;
    const timer = setTimeout(onClearProviderError, 8000);
    return () => clearTimeout(timer);
  }, [providerError, onClearProviderError]);

  useEffect(() => {
    if (currentStage === 'INTRODUCTION' && !isPlayground) document.getElementById('chat-input')?.focus();
  }, [currentStage, isPlayground]);

  const handleTrackSelect = useCallback((trackKey: string) => {
    if (onSwitchTrack && trackKey !== 'ALL') onSwitchTrack(trackKey as InterviewTrack);
  }, [onSwitchTrack]);

  const railItems: QuestionRailItem[] = questionsList.map((q, idx) => ({
    slug: q.slug || ('q' + (idx + 1)),
    title: q.title || ('Problem ' + (idx + 1)),
    difficulty: q.difficulty,
    status: questionStatusMap[q.slug || ('q' + (idx + 1))] || 'UNTOUCHED'
  }));

  const expectedRailItem = railItems[activeQuestionIndex];
  if (expectedRailItem && question && question.slug && expectedRailItem.slug !== question.slug) {
    console.error(`[RAIL_BINDING_MISMATCH] Rail item slug "${expectedRailItem.slug}" does not match active question slug "${question.slug}" at index ${activeQuestionIndex}`);
  }

  const activeSlug = question.slug || ('q' + (activeQuestionIndex + 1));
  const sections = props.sections || [];
  const activeSection = sections[props.activeSectionIndex ?? 0];
  const currentSectionBudget = activeSection?.softTimeBudgetMinutes || 20;
  const recorderRestarts = typeof window !== 'undefined' && window.sessionStorage && props.sessionId
    ? parseInt(window.sessionStorage.getItem(`rec_restarts_${props.sessionId}`) || '0', 10)
    : 0;

  const isIntroRound = !isPlayground && (sections[props.activeSectionIndex ?? 0]?.sectionType === 'INTRODUCTION' || currentStage === 'INTRODUCTION');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg text-text select-none relative">
      {providerError && (
        <ProviderToast error={providerError} onRetry={onRetryProvider} onOpenSettings={onOpenProviderSettings} onClose={onClearProviderError} />
      )}
      {pendingStageSwitch && onConfirmStageSwitch && onCancelStageSwitch && (
        <StageSwitchModal targetTrack={pendingStageSwitch.targetTrack} onConfirm={onConfirmStageSwitch} onCancel={onCancelStageSwitch} />
      )}
      {isAiSpeaking && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-3 py-1.5 rounded-lg shadow-lg z-40 animate-pulse text-xs font-semibold flex items-center gap-1.5">🔇 Mic muted (AI speaking)</div>
      )}
      <div className="h-12 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <TrackNavMenu activeTrack={track} onSelectTrack={handleTrackSelect} isPlayground={isPlayground} />
          <Chip variant={isPlayground ? 'success' : 'primary'} size="sm">
            {isPlayground ? 'PLAYGROUND' : 'PROCTORED INTERVIEW'}
          </Chip>
          <ArenaRecordingBadges
            isPlayground={isPlayground}
            isRecording={isRecording}
            recordingSeconds={recordingSeconds}
            recordingInterrupted={recordingInterrupted}
            failedChunkCount={failedChunkCount}
            cameraActive={cameraActive}
            screenActive={screenActive}
            verificationBroken={verificationBroken}
            recorderRestarts={recorderRestarts}
            audioConsent={audioConsent}
            voiceLostAt={voiceLostAt}
            voiceUnsentCount={voiceUnsentCount}
            isVoiceRecording={isVoiceRecording}
          />
        </div>
        <div className="flex items-center gap-2.5">
          <LocalPurityBadge provider={provider} apiKey={apiKey} />
          <FocusModeToggle isFocusMode={isFocusMode} onToggle={onToggleFocusMode || (() => {})} />
          <SelfTimer initialMinutes={currentSectionBudget} autoStart={!isPlayground} mode={sessionMode} sectionIndex={props.activeSectionIndex} />
          <ThemeToggle />
          <Chip variant={isSpeakingNow ? 'success' : isListening ? 'warning' : 'neutral'} size="sm">
            {isSpeakingNow ? 'Speaking' : isListening ? 'Mic Active' : 'Mic Ready'}
          </Chip>
          <button type="button" onClick={onFinish} className={'text-xs font-semibold hover:underline cursor-pointer ' + (isPlayground ? 'text-primary' : 'text-danger')}>
            {isPlayground ? 'Finish Practice' : 'End & Report'}
          </button>
        </div>
      </div>
      {!isFocusMode && !(isPlayground && sections.length <= 1) && <StageStepper currentStage={currentStage} currentSectionIndex={props.activeSectionIndex} sections={sections} isPlayground={isPlayground} onStageClick={onStageClick} onSectionClick={props.onSectionClick} stageTurnCounts={stageTurnCounts} stageTransitionReasons={stageTransitionReasons} />}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <QuestionRail items={railItems} selectedIndex={activeQuestionIndex} onSelect={onSelectQuestion} sessionMode={isPlayground ? 'PLAYGROUND' : 'INTERVIEW'} className={isFocusMode || isIntroRound || (isPlayground && railItems.length <= 1) ? "w-0 hidden" : "w-12 shrink-0 border-r border-border h-full"} />
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <Group orientation="horizontal" id="arena-shell-group" className="h-full w-full flex-1 min-w-0">
            <Panel
              defaultSize="32%"
              minSize="24%"
              maxSize="45%"
              collapsible={true}
              collapsedSize={0}
              panelRef={problemPanelRef}
              id="problem-panel"
              className="min-w-0 flex flex-col h-full overflow-hidden"
            >
              {isIntroRound ? (
                <ArenaIntroductionPanel sections={props.sections} activeSectionIndex={props.activeSectionIndex} />
              ) : (
                <ProblemPanel
                  question={question}
                  sessionId={sessionId}
                  isPracticeMode={isPlayground}
                  hasRunAttempt={executionResult !== null || hasWorkspaceRunAttempt}
                  isSolved={isPlayground && questionStatusMap[activeSlug] === 'PASSED'}
                  isBookmarked={!!bookmarkedMap[activeSlug]}
                  onToggleBookmark={() => setBookmarkedMap((p) => ({ ...p, [activeSlug]: !p[activeSlug] }))}
                  hintsRevealed={hintsRevealed[activeSlug] || 0} onRevealHint={() => setHintsRevealed((p) => ({ ...p, [activeSlug]: (p[activeSlug] || 0) + 1 }))}
                />
              )}
            </Panel>
            <Separator className="w-[3px] bg-border/60 hover:bg-primary/60 cursor-col-resize relative flex items-center justify-center z-10 select-none" />
            <Panel defaultSize="68%" minSize="50%" id="router-screen-panel" className="min-w-0 flex flex-col h-full overflow-hidden">
              <TrackScreenRouter
                sectionType={props.sections?.[props.activeSectionIndex ?? 0]?.sectionType}
                sectionQuestions={sectionQuestions}
                track={track}
                sessionId={sessionId}
                question={question}
                questionsCount={questionsList.length}
                code={code}
                onChangeCode={onChangeCode}
                language={language}
                onChangeLanguage={onChangeLanguage}
                onRunCode={onRunCode}
                onSubmitSolution={onSubmitSolution}
                isExecuting={isExecuting}
                executionResult={executionResult}
                provider={provider}
                apiKey={apiKey}
                isPlayground={isPlayground}
                onNextQuestion={onNextQuestion}
                onNextStage={onNextStage}
                onSelectTrack={onSwitchTrack}
                isApproachGateLocked={props.isApproachGateLocked}
                onRunAttempt={() => setHasWorkspaceRunAttempt(true)}
              />
            </Panel>
          </Group>
        </div>
      </div>
      {!isPlayground && !isFocusMode && <WebcamTile isTabBlurred={isWindowBlurred} tabSwitchCount={tabSwitches} pasteCount={pasteDumps} />}
      <VoiceCoachIndicator
        problemTitle={isIntroRound ? "Session Introduction" : question.title}
        currentTrack={track}
        voiceEnabled={voiceOutputEnabled}
        candidateTurns={messages.filter(m => m.role === 'candidate').length}
      />
      <FloatingAiOrb isOpen={isAiPanelOpen} onToggle={onToggleAiPanel} isAiSpeaking={isAiSpeaking} isListening={isListening} hasUnread={hasUnreadAi} sessionMode={sessionMode} />
      <AiAssistantPanel
        open={isAiPanelOpen}
        onClose={onCloseAiPanel}
        mode="live"
        personaName={persona.name}
        personaTitle={persona.title}
        currentStage={currentStage}
        isAiSpeaking={isAiSpeaking}
        messages={messages}
        isAiResponding={isAiResponding}
        chatInput={chatInput}
        setChatInput={setChatInput}
        onSend={(text) => void onSendTurn(text)}
        isListening={isListening}
        isRequestingMic={isRequestingMic}
        voiceEnabled={voiceOutputEnabled}
        onToggleVoice={onToggleVoice}
        onMicToggle={onMicToggle}
        onStartListening={onStartListening}
        onStopListening={onStopListening}
        onAbortVoice={onAbortVoice}
        onAbortTurn={onAbortTurn || onAbortVoice}
        onRecallLastDraft={onRecallLastDraft}
        interimTranscript={interimTranscript}
        salvageHint={props.salvageHint}
        micError={micError}
        onClearMicError={onClearMicError}
        canRetryStt={canRetryStt}
        onRetryStt={onRetryStt}
        stackAbove={!isPlayground && cameraActive ? "webcam" : "none"}
      />
    </div>
  );
};
