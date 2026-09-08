import React, { useState, useCallback, useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { GenerateQuestionResponse, InterviewTrack, ModelProvider, PlannedSection } from '../../types';
import { TrackNavMenu } from '../ui/TrackNavMenu';
import { StageStepper, type InterviewStage } from '../StageStepper';
import { QuestionRail, type QuestionRailItem, type QuestionStatus } from '../ide/QuestionRail';
import { ProblemPanel } from '../ide/ProblemPanel';
import { FloatingAiOrb } from '../ai/FloatingAiOrb';
import { AiAssistantPanel } from '../ai/AiAssistantPanel';
import { WebcamTile } from '../WebcamTile';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Chip } from '../ui/Chip';
import { SelfTimer } from '../ide/SelfTimer';
import { getPersona } from '../../lib/personas';
import { TrackScreenRouter } from './TrackScreenRouter';
import type { ExecutionResult } from '../ide/TestcasePanel';
import type { ProviderErrorState } from './hooks/useDialogue';
import { ProviderToast } from './ProviderToast';
import { StageSwitchModal } from './StageSwitchModal';
import { FocusModeToggle } from './FocusModeToggle';
import { LocalPurityBadge } from '../LocalPurityBadge';
import { VoiceCoachIndicator } from './VoiceCoachIndicator';

interface ArenaShellProps {
  sessionId: number;
  track: InterviewTrack;
  onSwitchTrack?: (targetTrack: InterviewTrack) => void;
  question: GenerateQuestionResponse;
  questionsList: GenerateQuestionResponse[];
  activeQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  questionStatusMap: Record<string, QuestionStatus>;
  code: string;
  onChangeCode: (val: string) => void;
  language: string;
  onChangeLanguage: (lang: string) => void;
  onRunCode: () => Promise<void>;
  onSubmitSolution: () => Promise<void>;
  isExecuting: boolean;
  executionResult: ExecutionResult | null;
  provider: ModelProvider;
  apiKey: string;
  sessionMode?: 'INTERVIEW' | 'PLAYGROUND';
  onFinish: () => void;
  messages: any[];
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendTurn: (text?: string) => Promise<void>;
  isAiResponding: boolean;
  currentStage: InterviewStage;
  onStageClick?: (stage: InterviewStage) => void;
  stageTurnCounts?: Record<InterviewStage, number>;
  stageTransitionReasons?: Record<InterviewStage, any>;
  providerError?: ProviderErrorState | null;
  onRetryProvider?: () => void;
  onClearProviderError?: () => void;
  onOpenProviderSettings?: () => void;
  pendingStageSwitch?: { stage: InterviewStage; targetTrack: InterviewTrack } | null;
  onConfirmStageSwitch?: () => void;
  onCancelStageSwitch?: () => void;
  onNextQuestion?: () => void;
  onNextStage?: () => void;
  isAiPanelOpen: boolean;
  onToggleAiPanel: () => void;
  onCloseAiPanel: () => void;
  isListening: boolean;
  isSpeakingNow: boolean;
  isAiSpeaking: boolean;
  voiceOutputEnabled: boolean;
  onToggleVoice: () => void;
  onMicToggle: () => void;
  onStartListening?: () => void;
  onStopListening?: () => void;
  onAbortVoice?: () => void;
  interimTranscript?: string;
  micError?: string | null;
  onClearMicError?: () => void;
  hasUnreadAi: boolean;
  isWindowBlurred?: boolean;
  tabSwitches?: number;
  pasteDumps?: number;
  isRecording?: boolean;
  recordingSeconds?: number;
  recordingInterrupted?: boolean;
  failedChunkCount?: number;
  cameraActive?: boolean; screenActive?: boolean; verificationBroken?: boolean;
  isVoiceRecording?: boolean;
  voiceUnsentCount?: number;
  voiceLostAt?: string | null;
  audioConsent?: boolean;
  sections?: PlannedSection[]; activeSectionIndex?: number; onSectionClick?: (index: number, stage: InterviewStage) => void;
  sectionQuestions?: GenerateQuestionResponse[][];
  salvageHint?: string | null;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const ArenaShell: React.FC<ArenaShellProps> = (props) => {
  const {
    sessionId, track, onSwitchTrack, question, questionsList, activeQuestionIndex, onSelectQuestion,
    questionStatusMap, code, onChangeCode, language, onChangeLanguage, onRunCode, onSubmitSolution,
    isExecuting, executionResult, provider, apiKey, sessionMode = 'INTERVIEW', onFinish, messages,
    chatInput, setChatInput, onSendTurn, isAiResponding, currentStage, onStageClick, stageTurnCounts,
    stageTransitionReasons, providerError, onRetryProvider, onClearProviderError, onOpenProviderSettings,
    pendingStageSwitch, onConfirmStageSwitch, onCancelStageSwitch, onNextQuestion, onNextStage,
    isAiPanelOpen, onToggleAiPanel, onCloseAiPanel, isListening, isSpeakingNow, isAiSpeaking,
    voiceOutputEnabled, onToggleVoice, onMicToggle, onStartListening, onStopListening, onAbortVoice,
    interimTranscript = '', micError = null,
    onClearMicError, hasUnreadAi, isWindowBlurred = false, tabSwitches = 0, pasteDumps = 0,
    isRecording, recordingSeconds, recordingInterrupted, failedChunkCount = 0, cameraActive, screenActive, verificationBroken = false,
    isVoiceRecording = false, voiceUnsentCount = 0, voiceLostAt = null, audioConsent = true,
    isFocusMode = false, onToggleFocusMode, sectionQuestions
  } = props;
  const isPlayground = sessionMode === 'PLAYGROUND';
  const persona = getPersona(isPlayground);

  const [hintsRevealed, setHintsRevealed] = useState<Record<string, number>>({}); const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});

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

  const activeSlug = question.slug || ('q' + (activeQuestionIndex + 1));

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg text-text select-none relative">
      {providerError && (
        <ProviderToast error={providerError} onRetry={onRetryProvider} onOpenSettings={onOpenProviderSettings} onClose={onClearProviderError} />
      )}
      {pendingStageSwitch && onConfirmStageSwitch && onCancelStageSwitch && (
        <StageSwitchModal targetTrack={pendingStageSwitch.targetTrack} onConfirm={onConfirmStageSwitch} onCancel={onCancelStageSwitch} />
      )}
      {isAiSpeaking && (
        <div className="fixed top-4 right-4 bg-amber-500 text-white px-3 py-1.5 rounded-lg shadow-lg z-50 animate-pulse text-xs font-semibold flex items-center gap-1.5">🔇 Mic muted (AI speaking)</div>
      )}
      <div className="h-12 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <TrackNavMenu activeTrack={track} onSelectTrack={handleTrackSelect} isPlayground={isPlayground} />
          <Chip variant={isPlayground ? 'success' : 'primary'} size="sm">
            {isPlayground ? 'PLAYGROUND' : 'PROCTORED INTERVIEW'}
          </Chip>
          {!isPlayground && (
            <>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-elevated border border-border text-[11px] font-mono">
                <span className={`w-2 h-2 rounded-full ${recordingInterrupted ? 'bg-danger animate-ping' : failedChunkCount > 0 ? 'bg-amber-500 animate-pulse' : isRecording ? 'bg-danger animate-pulse' : 'bg-text-3'}`} />
                <span className="font-bold text-text-2">{recordingInterrupted ? 'REC INTERRUPTED' : failedChunkCount > 0 ? `REC ⚠ ${failedChunkCount} unsent` : isRecording ? 'REC' : 'STANDBY'}</span>
                {isRecording && <span className="text-text-3">({Math.floor((recordingSeconds || 0) / 60)}:{String((recordingSeconds || 0) % 60).padStart(2, '0')})</span>}
                {isRecording && (
                  <span className="text-text-3 border-l border-border pl-1.5 ml-0.5">
                    {cameraActive && '🎥 Cam'} {screenActive ? '· 🖥️ Screen' : verificationBroken ? '· ⚠ Unverified' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-elevated border border-border text-[11px] font-mono">
                <span className={`w-2 h-2 rounded-full ${
                  !audioConsent
                    ? 'bg-text-3'
                    : voiceLostAt
                    ? 'bg-danger animate-ping'
                    : (voiceUnsentCount ?? 0) > 0
                    ? 'bg-amber-500 animate-pulse'
                    : isVoiceRecording
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-text-3'
                }`} />
                <span className="font-bold text-text-2">
                  {!audioConsent
                    ? 'VOICE OFF (no consent)'
                    : voiceLostAt
                    ? `VOICE ✕ lost at ${voiceLostAt}`
                    : (voiceUnsentCount ?? 0) > 0
                    ? `VOICE ⚠ ${voiceUnsentCount} unsent`
                    : isVoiceRecording
                    ? 'VOICE ●'
                    : 'VOICE STANDBY'}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <LocalPurityBadge provider={provider} apiKey={apiKey} />
          <FocusModeToggle isFocusMode={isFocusMode} onToggle={onToggleFocusMode || (() => {})} />
          <SelfTimer />
          <ThemeToggle />
          <Chip variant={isSpeakingNow ? 'success' : isListening ? 'warning' : 'neutral'} size="sm">
            {isSpeakingNow ? 'Speaking' : isListening ? 'Mic Active' : 'Mic Ready'}
          </Chip>
          <button type="button" onClick={onFinish} className={'text-xs font-semibold hover:underline cursor-pointer ' + (isPlayground ? 'text-primary' : 'text-danger')}>
            {isPlayground ? 'Finish Practice' : 'End & Report'}
          </button>
        </div>
      </div>
      {!isFocusMode && <StageStepper currentStage={currentStage} currentSectionIndex={props.activeSectionIndex} sections={props.sections} isPlayground={isPlayground} onStageClick={onStageClick} onSectionClick={props.onSectionClick} stageTurnCounts={stageTurnCounts} stageTransitionReasons={stageTransitionReasons} />}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <QuestionRail items={railItems} selectedIndex={activeQuestionIndex} onSelect={onSelectQuestion} sessionMode={isPlayground ? 'PLAYGROUND' : 'INTERVIEW'} className={isFocusMode || (!isPlayground && (props.sections?.[props.activeSectionIndex ?? 0]?.sectionType === 'INTRODUCTION' || currentStage === 'INTRODUCTION')) ? "w-0 hidden" : "w-12 shrink-0 border-r border-border h-full"} />
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <Group orientation="horizontal" id="arena-shell-group" className="h-full w-full flex-1 min-w-0">
            <Panel defaultSize="32%" minSize="24%" maxSize="45%" id="problem-panel" className="min-w-0 flex flex-col h-full overflow-hidden">
              {!isPlayground && (props.sections?.[props.activeSectionIndex ?? 0]?.sectionType === 'INTRODUCTION' || currentStage === 'INTRODUCTION') ? (
                <div className="flex flex-col h-full bg-surface border-r border-border p-6 overflow-y-auto space-y-6 text-text select-none">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">Stage 1 · Warm-Up</span>
                    </div>
                    <h2 className="text-lg font-bold tracking-tight text-text">Session Introduction</h2>
                    <p className="text-xs text-text-3">Get settled, verify your environment, and introduce yourself to the AI interviewer.</p>
                  </div>

                  <div className="p-4 rounded-lg bg-elevated/60 border border-border space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-2 font-mono">Session Plan</h3>
                    <div className="space-y-2 text-xs">
                      {props.sections?.map((s, idx) => (
                        <div key={idx} className={`flex items-center justify-between py-1.5 px-2.5 rounded ${idx === props.activeSectionIndex ? 'bg-primary/10 border border-primary/30 text-primary font-medium' : 'text-text-3'}`}>
                          <span>{idx + 1}. {s.note || s.sectionType}</span>
                          <span className="font-mono text-[11px]">{s.softTimeBudgetMinutes ? `${s.softTimeBudgetMinutes} min` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-elevated/60 border border-border space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-2 font-mono">Readiness Summary</h3>
                    <ul className="space-y-1.5 text-xs text-text-2 list-disc list-inside">
                      <li>Microphone & audio input verified</li>
                      <li>Screen share monitoring active</li>
                      <li>AI dialogue pipeline connected</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-elevated/60 border border-border space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-2 font-mono">What Happens Next</h3>
                    <p className="text-xs text-text-3 leading-relaxed">
                      Speak naturally with the AI interviewer to discuss your background and experience. Once the introduction concludes, you will advance to the technical evaluation rounds.
                    </p>
                  </div>
                </div>
              ) : (
                <ProblemPanel
                  question={question}
                  sessionId={sessionId}
                  isPracticeMode={isPlayground}
                  hasRunAttempt={executionResult !== null}
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
              />
            </Panel>
          </Group>
        </div>
      </div>
      {!isPlayground && !isFocusMode && <WebcamTile isTabBlurred={isWindowBlurred} tabSwitchCount={tabSwitches} pasteCount={pasteDumps} />}
      <VoiceCoachIndicator problemTitle={!isPlayground && (props.sections?.[props.activeSectionIndex ?? 0]?.sectionType === 'INTRODUCTION' || currentStage === 'INTRODUCTION') ? "Session Introduction" : question.title} currentTrack={track} voiceEnabled={voiceOutputEnabled} />
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
        voiceEnabled={voiceOutputEnabled}
        onToggleVoice={onToggleVoice}
        onMicToggle={onMicToggle}
        onStartListening={onStartListening}
        onStopListening={onStopListening}
        onAbortTurn={onAbortVoice}
        interimTranscript={interimTranscript}
        salvageHint={props.salvageHint}
        micError={micError}
        onClearMicError={onClearMicError}
        stackAbove="webcam"
      />
    </div>
  );
};
