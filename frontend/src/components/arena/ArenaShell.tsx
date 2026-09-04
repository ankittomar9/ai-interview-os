import React, { useState, useCallback, useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { GenerateQuestionResponse, InterviewTrack, ModelProvider } from '../../types';
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
  cameraActive?: boolean;
  screenActive?: boolean;
  recordScreen?: boolean;
  salvageHint?: string | null;
  onStartScreenShare?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const ArenaShell: React.FC<ArenaShellProps> = (props) => {
  const {
    sessionId, track, onSwitchTrack, question, questionsList, activeQuestionIndex, onSelectQuestion,
    questionStatusMap, code, onChangeCode, language, onChangeLanguage, onRunCode, onSubmitSolution,
    isExecuting, executionResult, provider, apiKey, sessionMode = 'INTERVIEW', onFinish, messages,
    chatInput, setChatInput, onSendTurn, isAiResponding, currentStage, onStageClick, providerError,
    onRetryProvider, onClearProviderError, onOpenProviderSettings, pendingStageSwitch,
    onConfirmStageSwitch, onCancelStageSwitch, onNextQuestion, onNextStage, isAiPanelOpen,
    onToggleAiPanel, onCloseAiPanel, isListening, isSpeakingNow, isAiSpeaking, voiceOutputEnabled,
    onToggleVoice, onMicToggle, interimTranscript = '', micError = null, onClearMicError,
    hasUnreadAi, isWindowBlurred = false, tabSwitches = 0, pasteDumps = 0,
    isRecording, recordingSeconds, recordingInterrupted, cameraActive, screenActive,
    recordScreen, onStartScreenShare, isFocusMode = false, onToggleFocusMode
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
    if (currentStage === 'INTRODUCTION' && !isPlayground) {
      document.getElementById('chat-input')?.focus();
    }
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
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-elevated border border-border text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${recordingInterrupted ? 'bg-danger animate-ping' : isRecording ? 'bg-danger animate-pulse' : 'bg-text-3'}`} />
              <span className="font-bold text-text-2">{recordingInterrupted ? 'REC INTERRUPTED' : isRecording ? 'REC' : 'STANDBY'}</span>
              {isRecording && <span className="text-text-3">({Math.floor((recordingSeconds || 0) / 60)}:{String((recordingSeconds || 0) % 60).padStart(2, '0')})</span>}
              {isRecording && (cameraActive || screenActive) && (
                <span className="text-text-3 border-l border-border pl-1.5 ml-0.5">
                  {cameraActive && '🎥 Cam'} {screenActive && '· 🖥️ Screen'}
                </span>
              )}
              {isRecording && recordScreen && !screenActive && onStartScreenShare && (
                <button type="button" onClick={onStartScreenShare} className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 transition-colors cursor-pointer" title="Share Screen">Share Screen</button>
              )}
            </div>
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
      {!isFocusMode && <StageStepper currentStage={currentStage} isPlayground={isPlayground} onStageClick={onStageClick} />}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <QuestionRail items={railItems} selectedIndex={activeQuestionIndex} onSelect={onSelectQuestion} sessionMode={isPlayground ? 'PLAYGROUND' : 'INTERVIEW'} className={isFocusMode ? "w-0 hidden" : "w-12 shrink-0 border-r border-border h-full"} />
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <Group orientation="horizontal" id="arena-shell-group" className="h-full w-full flex-1 min-w-0">
            <Panel defaultSize="32%" minSize="24%" maxSize="45%" id="problem-panel" className="min-w-0 flex flex-col h-full overflow-hidden">
              <ProblemPanel
                question={question}
                sessionId={sessionId}
                isPracticeMode={isPlayground}
                hasRunAttempt={executionResult !== null}
                isSolved={questionStatusMap[activeSlug] === 'PASSED'} isBookmarked={!!bookmarkedMap[activeSlug]}
                onToggleBookmark={() => setBookmarkedMap((p) => ({ ...p, [activeSlug]: !p[activeSlug] }))}
                hintsRevealed={hintsRevealed[activeSlug] || 0} onRevealHint={() => setHintsRevealed((p) => ({ ...p, [activeSlug]: (p[activeSlug] || 0) + 1 }))}
              />
            </Panel>
            <Separator className="w-[3px] bg-border/60 hover:bg-primary/60 cursor-col-resize relative flex items-center justify-center z-10 select-none" />
            <Panel defaultSize="68%" minSize="50%" id="router-screen-panel" className="min-w-0 flex flex-col h-full overflow-hidden">
              <TrackScreenRouter
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
      <VoiceCoachIndicator problemTitle={question.title} currentTrack={track} voiceEnabled={voiceOutputEnabled} />
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
        interimTranscript={interimTranscript}
        salvageHint={props.salvageHint}
        micError={micError}
        onClearMicError={onClearMicError}
        stackAbove="webcam"
      />
    </div>
  );
};
