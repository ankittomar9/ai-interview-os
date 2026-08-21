export type ModelProvider = 'GEMINI' | 'GROQ' | 'OPENAI' | 'ANTHROPIC' | 'QWEN' | 'GLM' | 'KIMI' | 'DEEPSEEK' | 'OLLAMA';

export type InterviewTrack = 'JAVA_SPRING_BOOT' | 'ALGORITHMS_DATA_STRUCTURES' | 'SYSTEM_DESIGN' | 'BEHAVIORAL_STAR';

export type DifficultyLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF';

export type SessionStatus = 'INITIALIZED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'EVALUATED';

export type MessageType = 'QUESTION' | 'EXPLANATION' | 'CODE_SUBMISSION' | 'HINT' | 'FEEDBACK' | 'SYSTEM_EVENT';

export type HiringVerdict = 'STRONG_HIRE' | 'HIRE' | 'LEAN_HIRE' | 'NO_HIRE';

export type TelemetryEventType = 'TAB_BLUR' | 'TAB_FOCUS' | 'PASTE_DUMP' | 'KEYSTROKE_BURST' | 'IDLE_TIMEOUT' | 'COPY_ATTEMPT';

export interface SessionResponse {
    id: number;
    candidateId: string;
    roleTitle: string;
    track: InterviewTrack;
    difficulty: DifficultyLevel;
    targetCompany?: string;
    jobDescription?: string;
    status: SessionStatus;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    durationSeconds?: number;
    messages: Array<{
        id: number;
        senderRole: string;
        messageType: MessageType;
        content: string;
        codeSnippet?: string;
        timestamp: string;
    }>;
}

export interface GenerateQuestionResponse {
    problemSlug?: string;
    title: string;
    track: InterviewTrack;
    difficulty: DifficultyLevel;
    problemStatement: string;
    starterCode: string;
    starterCodeMap?: Record<string, string>;
    sampleTests?: Array<{ name: string; input: string; expectedOutput: string }>;
    hints: string[];
    evaluationCriteria: string[];
}

export interface AiDialogueResponse {
    interviewerReply: string;
    followUpQuestion: string;
    isSolutionComplete: boolean;
    codeAnalysis?: string;
    keyStrengths: string[];
    areasToImprove: string[];
}

export interface DiagnosticReportResponse {
    reportId: number;
    sessionId: number;
    candidateId: string;
    roleTitle: string;
    track: string;
    difficulty: string;
    verdict: HiringVerdict;
    overallScore: number;
    scorecard: {
        technicalAccuracy: number;
        problemSolving: number;
        communicationClarity: number;
        codeQuality: number;
        integrityScore: number;
    };
    executiveSummary: string;
    keyStrengths: string[];
    areasForImprovement: string[];
    sevenDayStudyPlan: string[];
    generatedAt: string;
}