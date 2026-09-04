export type ModelProvider = 'GEMINI' | 'GROQ' | 'OPENAI' | 'ANTHROPIC' | 'QWEN' | 'GLM' | 'KIMI' | 'DEEPSEEK' | 'OLLAMA';

export type InterviewTrack = 'JAVA_SPRING_BOOT' | 'ALGORITHMS_DATA_STRUCTURES' | 'SYSTEM_DESIGN' | 'BEHAVIORAL_STAR' | 'SPRING_LLD' | 'SQL' | 'RESUME_BASED' | 'FULL_LOOP';

export type DifficultyLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF';

export type SectionType = 'INTRODUCTION' | 'CORE_TECH' | 'DSA' | 'LLD' | 'SYSTEM_DESIGN' | 'SQL' | 'BEHAVIORAL' | 'RESUME';

export interface PlannedSection {
    sectionType: SectionType;
    track: InterviewTrack;
    itemCount: number;
    softTimeBudgetMinutes: number;
    note?: string;
    problemSlugs?: string[];
}

export interface SessionPlan {
    source: 'SETUP_SELECTION' | 'RESUME_INFERRED_CONFIRMED';
    level: DifficultyLevel;
    sections: PlannedSection[];
    plannedTotalMinutes: number;
}

export type SessionStatus = 'INITIALIZED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'EVALUATED';

export type MessageType = 'QUESTION' | 'EXPLANATION' | 'CODE_SUBMISSION' | 'HINT' | 'FEEDBACK' | 'SYSTEM_EVENT' | 'SYSTEM_DESIGN' | 'CODE_EXECUTION';

export type HiringVerdict = 'STRONG_HIRE' | 'HIRE' | 'LEAN_HIRE' | 'NO_HIRE';

export type TelemetryEventType = 'TAB_BLUR' | 'TAB_FOCUS' | 'PASTE_DUMP' | 'KEYSTROKE_BURST' | 'IDLE_TIMEOUT' | 'COPY_ATTEMPT';

export interface IntegritySignals {
    keystrokeCount?: number;
    avgKeystrokeIntervalMs?: number;
    keystrokeVariance?: number;
    estimatedWpm?: number;
    suspiciousTyping?: boolean;
    copyCount?: number;
    pasteCount?: number;
    tabSwitchCount?: number;
    echoFilteredCount?: number;
}

export interface SessionMessage {
    id: number;
    senderRole: string;
    messageType: MessageType;
    content: string;
    codeSnippet?: string;
    timestamp: string;
    metadata?: Record<string, string>;
    keystrokeCount?: number;
    avgKeystrokeIntervalMs?: number;
    keystrokeVariance?: number;
    estimatedWpm?: number;
    suspiciousTyping?: boolean;
    copyCount?: number;
    pasteCount?: number;
    tabSwitchCount?: number;
    echoFilteredCount?: number;
}

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
    sessionMode?: 'INTERVIEW' | 'PLAYGROUND';
    plannedSlugs?: string[];
    messages: SessionMessage[];
    plan?: SessionPlan;
}

export interface GenerateQuestionResponse {
    slug?: string;
    problemSlug?: string;
    title: string;
    track: InterviewTrack;
    difficulty: DifficultyLevel;
    problemStatement: string;
    starterCode: string;
    starterCodeMap?: Record<string, string>;
    starterFiles?: Record<string, string>;
    editablePaths?: string[];
    buildProfile?: string;
    dbEngine?: string;
    setupSql?: string;
    schemaMarkdown?: string;
    expectedCsv?: string;
    ordered?: boolean;
    solutionCode?: string;
    solutionSql?: string;
    editorialMarkdown?: string;
    tags?: string[];
    sampleTests?: Array<{ name: string; input?: string; expectedOutput?: string; description?: string; explanation?: string }>;
    hints: string[];
    coaching?: {
        presentationTips?: string[];
        commonMistakes?: string[];
        modelAnswerOutline?: string[];
        approachHint?: string;
    };
    constraints?: string[];
    evaluationCriteria: string[];
}

export interface ExecutionDto {
    status: string;
    passedTests: number;
    totalTests: number;
    executionTimeMs: number;
    memoryUsedMb: number;
}

export interface AiDialogueResponse {
    interviewerReply: string;
    followUpQuestion: string;
    isSolutionComplete: boolean;
    codeAnalysis?: string;
    keyStrengths: string[];
    areasToImprove: string[];
    detectedIntent?: 'CLARIFYING' | 'EXPLAINING_APPROACH' | 'CODING' | 'STUCK' | 'COMPLETE' | string;
    turnSummary?: string;
    recommendedAction?: 'PROBE_DEEPER' | 'OFFER_HINT' | 'ADVANCE_STAGE' | 'ANSWER_CLARIFICATION' | string;
}

export interface DimensionScore {
    dimension: string;
    score: number;
    rationale: string;
    evidence: string;
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
        requirementsClarification?: number;
    };
    executiveSummary: string;
    keyStrengths: string[];
    areasForImprovement: string[];
    sevenDayStudyPlan: string[];
    dimensions?: DimensionScore[];
    llmGenerated?: boolean;
    requirementsClarityScore?: number;
    generatedAt: string;
    integrity?: {
        echoFilteredCount: number;
        droppedChunks: number;
        consentDowngrades: number;
        workspaceProvenance: string;
    };
}

export interface AttachmentUploadResponse {
    attachmentId: string;
    kind: 'CANVAS_PNG' | 'CANVAS_JSON';
    sizeBytes: number;
}

export interface DesignEvaluateRequest {
    sessionId: number;
    canvasJsonAttachmentId?: string;
    pngAttachmentId?: string;
    requirements?: {
        dau?: string;
        peakFactor?: string;
        readWriteRatio?: string;
    };
    modelProvider?: ModelProvider;
    apiKey?: string;
}

export interface DesignEvaluateResponse {
    feedback: string[];
    score: number;
    evidence: string;
    llmGenerated: boolean;
    modality?: 'VISION' | 'TEXT';
}

export interface ResumeDocument {
    id?: string;
    candidateId?: string;
    candidateName?: string;
    email?: string;
    inferredRoleLevel?: string;
    suggestedDifficulty?: DifficultyLevel;
    resumeTitle?: string;
    fileName?: string;
    rawText?: string;
    skills?: string[];
    projectExperiences?: string[];
    education?: string[];
    yearsOfExperience?: number;
    characterCount?: number;
    wordCount?: number;
    summary?: string;
    uploadedAt?: string;
}