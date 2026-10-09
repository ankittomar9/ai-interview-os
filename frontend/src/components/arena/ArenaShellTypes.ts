import type { GenerateQuestionResponse, InterviewTrack, ModelProvider, PlannedSection, SectionType } from '../../types';
import type { InterviewStage } from '../StageStepper';
import type { QuestionStatus } from '../ide/QuestionRail';
import type { ExecutionResult } from '../ide/TestcasePanel';
import type { ProviderErrorState } from './hooks/useDialogue';

export type TrackKey = InterviewTrack | 'ALL';

export interface ResolveSectionTypeArgs {
  sectionType?: SectionType;
  track?: TrackKey;
  questionTrack?: string;
  isPlayground?: boolean;
}

export function resolveSectionType({
  sectionType,
  track,
  questionTrack,
  isPlayground
}: ResolveSectionTypeArgs): SectionType {
  if (!isPlayground && sectionType) return sectionType;
  const targetTrack = questionTrack || track;
  switch (targetTrack) {
    case 'SQL':
      return 'SQL';
    case 'SPRING_LLD':
    case 'JAVA_SPRING_BOOT':
    case 'LLD_HLD':
      return 'LLD';
    case 'SYSTEM_DESIGN':
      return 'SYSTEM_DESIGN';
    case 'BEHAVIORAL_STAR':
      return 'BEHAVIORAL';
    case 'RESUME_BASED':
      return 'RESUME';
    case 'ALGORITHMS_DATA_STRUCTURES':
    case 'DSA_LLD':
    case 'DSA_LLD_HLD':
    case 'FULL_LOOP':
      return 'DSA';
    default:
      return sectionType || 'DSA';
  }
}

export interface ArenaShellProps {
  sessionId: number;
  track: TrackKey;
  onSwitchTrack?: (targetTrack: TrackKey) => void;
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
  isRequestingMic?: boolean;
  isSpeakingNow: boolean;
  isAiSpeaking: boolean;
  voiceOutputEnabled: boolean;
  onToggleVoice: () => void;
  onMicToggle: () => void;
  onStartListening?: () => void;
  onStopListening?: () => void;
  onAbortVoice?: () => void;
  onAbortTurn?: () => void;
  onRecallLastDraft?: () => void;
  interimTranscript?: string;
  micError?: string | null;
  onClearMicError?: () => void;
  canRetryStt?: boolean;
  onRetryStt?: () => void;
  hasUnreadAi: boolean;
  isWindowBlurred?: boolean;
  tabSwitches?: number;
  pasteDumps?: number;
  isRecording?: boolean;
  recordingSeconds?: number;
  recordingInterrupted?: boolean;
  failedChunkCount?: number;
  cameraActive?: boolean;
  screenActive?: boolean;
  verificationBroken?: boolean;
  isVoiceRecording?: boolean;
  voiceUnsentCount?: number;
  voiceLostAt?: string | null;
  audioConsent?: boolean;
  sections?: PlannedSection[];
  activeSectionIndex?: number;
  onSectionClick?: (index: number, stage: InterviewStage) => void;
  sectionQuestions?: GenerateQuestionResponse[][];
  salvageHint?: string | null;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  isApproachGateLocked?: boolean;
}
