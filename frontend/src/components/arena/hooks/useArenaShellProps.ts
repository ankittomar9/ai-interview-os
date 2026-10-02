import type { ArenaShellProps } from '../ArenaShellTypes';
import type { GenerateQuestionResponse, InterviewTrack, ModelProvider, PlannedSection } from '../../../types';
import type { QuestionStatus } from '../../ide/QuestionRail';

interface UseArenaShellPropsArgs {
  sessionId: number;
  track: InterviewTrack;
  sections?: PlannedSection[];
  activeSectionIndex: number;
  isApproachGateLocked: boolean;
  sectionQuestions?: GenerateQuestionResponse[][];
  onSectionClick: (idx: number, stage: any) => void;
  onSwitchTrack: (track: InterviewTrack) => void;
  question: GenerateQuestionResponse;
  onNextQuestion: () => void;
  onNextStage: (options?: { introSkipped?: boolean }) => void;
  questionsList: GenerateQuestionResponse[];
  activeQuestionIndex: number;
  onSelectQuestion: (idx: number) => void;
  questionStatusMap: Record<string, QuestionStatus>;
  code: string;
  onChangeCode: (code: string) => void;
  language: string;
  onChangeLanguage: (lang: string) => void;
  onRunCode: () => Promise<void>;
  onSubmitSolution: () => Promise<void>;
  isExecuting: boolean;
  executionResult: any;
  provider: ModelProvider;
  apiKey: string;
  sessionMode: 'INTERVIEW' | 'PLAYGROUND';
  onFinish: () => void;
  engines: any;
  nav: any;
}

export function buildArenaShellProps(args: UseArenaShellPropsArgs): ArenaShellProps {
  const { engines, nav } = args;

  return {
    sessionId: args.sessionId,
    track: args.track,
    sections: args.sections,
    activeSectionIndex: args.activeSectionIndex,
    isApproachGateLocked: args.isApproachGateLocked,
    sectionQuestions: args.sectionQuestions,
    onSectionClick: args.onSectionClick,
    onSwitchTrack: args.onSwitchTrack,
    question: args.question,
    onNextQuestion: args.onNextQuestion,
    onNextStage: args.onNextStage,
    questionsList: args.questionsList,
    activeQuestionIndex: args.activeQuestionIndex,
    onSelectQuestion: args.onSelectQuestion,
    questionStatusMap: args.questionStatusMap,
    code: args.code,
    onChangeCode: args.onChangeCode,
    language: args.language,
    onChangeLanguage: args.onChangeLanguage,
    onRunCode: args.onRunCode,
    onSubmitSolution: args.onSubmitSolution,
    isExecuting: args.isExecuting,
    executionResult: args.executionResult,
    provider: args.provider,
    apiKey: args.apiKey,
    sessionMode: args.sessionMode,
    onFinish: args.onFinish,
    messages: engines.dialogue.messages,
    chatInput: engines.dialogue.chatInput,
    setChatInput: engines.dialogue.setChatInput,
    onSendTurn: (text) => engines.dialogue.triggerCandidateTurn(text, args.code),
    isAiResponding: engines.dialogue.isAiResponding,
    currentStage: engines.dialogue.currentStage,
    stageTurnCounts: engines.dialogue.stageTurnCounts,
    stageTransitionReasons: engines.dialogue.stageTransitionReasons,
    onStageClick: nav.handleStageClick,
    providerError: engines.dialogue.providerError,
    onRetryProvider: engines.dialogue.retryLastTurn,
    onClearProviderError: engines.dialogue.clearProviderError,
    onOpenProviderSettings: args.onFinish,
    pendingStageSwitch: nav.pendingStageSwitch,
    onConfirmStageSwitch: nav.handleConfirmStageSwitch,
    onCancelStageSwitch: nav.handleCancelStageSwitch,
    isAiPanelOpen: engines.voice.isAiPanelOpen,
    onToggleAiPanel: engines.voice.toggleAiPanel,
    onCloseAiPanel: () => engines.voice.setIsAiPanelOpen(false),
    isListening: engines.voice.isListening,
    isSpeakingNow: engines.voice.isSpeakingNow,
    isAiSpeaking: engines.voice.isAiSpeaking,
    interimTranscript: engines.voice.interimTranscript,
    micError: engines.voice.micError,
    onClearMicError: engines.voice.clearMicError,
    canRetryStt: engines.voice.canRetryStt,
    onRetryStt: engines.voice.retryLastTranscription,
    voiceOutputEnabled: engines.voice.voiceOutputEnabled,
    onToggleVoice: () => engines.voice.setVoiceOutputEnabled(!engines.voice.voiceOutputEnabled),
    onMicToggle: engines.voice.toggleListening,
    onStartListening: engines.voice.startListening,
    onStopListening: engines.voice.stopListening,
    onAbortVoice: engines.voice.abortTurn,
    onAbortTurn: engines.dialogue.abortTurn,
    onRecallLastDraft: engines.dialogue.recallLastDraft,
    hasUnreadAi: engines.dialogue.hasUnread,
    isWindowBlurred: engines.proctoring.isWindowBlurred,
    tabSwitches: engines.proctoring.tabSwitches,
    pasteDumps: engines.proctoring.pasteDumps,
    isRecording: engines.recorder.isRecording,
    recordingSeconds: engines.recorder.recordingSeconds,
    recordingInterrupted: engines.recorder.recordingInterrupted,
    failedChunkCount: engines.recorder.failedChunkCount,
    cameraActive: engines.recorder.cameraActive,
    screenActive: engines.recorder.screenActive,
    verificationBroken: engines.recorder.verificationBroken,
    isVoiceRecording: engines.micRecorder.isRecording,
    voiceUnsentCount: engines.micRecorder.unsentCount,
    voiceLostAt: engines.micRecorder.lostAt,
    audioConsent: engines.audioConsent,
    isFocusMode: nav.isFocusMode,
    onToggleFocusMode: nav.toggleFocusMode
  };
}
