import type {
    SessionResponse,
    AiDialogueResponse,
    DiagnosticReportResponse,
    InterviewTrack,
    DifficultyLevel,
    TelemetryEventType
} from '../types';

const GATEWAY_BASE = '/api/v1';
const SESSION_API = `${GATEWAY_BASE}/sessions`;
const AI_API = `${GATEWAY_BASE}/ai`;
const PROCTOR_API = `${GATEWAY_BASE}/proctor`;
const REPORT_API = `${GATEWAY_BASE}/reports`;

// Helper: Read stored BYOK Keys
export const getStoredApiKey = (provider: string): string => {
    return localStorage.getItem(`byok_${provider}`) || '';
};

export const setStoredApiKey = (provider: string, key: string): void => {
    if (key.trim()) {
        localStorage.setItem(`byok_${provider}`, key.trim());
    } else {
        localStorage.removeItem(`byok_${provider}`);
    }
};

// --- Session Service (Routed via Gateway -> :8081) ---
export const createSession = async (payload: {
    candidateId: string;
    candidateName?: string;
    roleTitle: string;
    track: InterviewTrack;
    difficulty: DifficultyLevel;
    targetCompany?: string;
    jobDescription?: string;
}): Promise<SessionResponse> => {
    const res = await fetch(SESSION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create session via Gateway');
    return res.json();
};

export const startSession = async (sessionId: number): Promise<SessionResponse> => {
    const res = await fetch(`${SESSION_API}/${sessionId}/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start session via Gateway');
    return res.json();
};

export const addMessageToSession = async (
    sessionId: number,
    payload: {
        senderRole: 'AI' | 'CANDIDATE';
        messageType: 'EXPLANATION' | 'CODE_SUBMISSION' | 'CLARIFICATION' | 'FEEDBACK';
        content: string;
        codeSnippet?: string;
    }
) => {
    const res = await fetch(`${SESSION_API}/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to add message to session');
    return res.json();
};

export const completeSession = async (sessionId: number): Promise<SessionResponse> => {
    const res = await fetch(`${SESSION_API}/${sessionId}/complete`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to complete session via Gateway');
    return res.json();
};

// --- AI Orchestrator Service (Routed via Gateway -> :8082) ---
export const generateQuestion = async (payload: {
    roleTitle: string;
    track: InterviewTrack;
    difficulty: DifficultyLevel;
    targetCompany?: string;
    jobDescription?: string;
    modelProvider?: string;
    apiKey?: string;
}) => {
    const res = await fetch(`${AI_API}/generate-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to generate interview question');
    return res.json();
};

export const processDialogueTurn = async (payload: {
    questionContext: string;
    candidateExplanation: string;
    candidateCode?: string;
    modelProvider?: string;
    apiKey?: string;
    latestExecution?: {
        status: string;
        passedTests: number;
        totalTests: number;
        executionTimeMs: number;
        memoryUsedMb: number;
    };
}): Promise<AiDialogueResponse> => {
    const res = await fetch(`${AI_API}/dialogue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to process dialogue turn');
    return res.json();
};

// --- Groq Whisper Speech-To-Text Transcription Endpoint (:8082) ---
export const transcribeAudio = async (
    audioBlob: Blob,
    apiKey?: string,
    promptContext?: string
): Promise<{ transcript: string; durationSeconds: number; provider: string }> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'candidate_speech.webm');
    formData.append('audio', audioBlob, 'candidate_speech.webm');
    if (apiKey) formData.append('apiKey', apiKey);
    if (promptContext) formData.append('promptContext', promptContext);

    const res = await fetch(`${AI_API}/transcribe`, {
        method: 'POST',
        body: formData
    });
    if (!res.ok) throw new Error('Speech transcription request failed');
    return res.json();
};

// --- Proctor Sentinel Service (Routed via Gateway -> :8083) ---
export const sendProctorTelemetry = async (payload: {
    sessionId: number;
    eventType: TelemetryEventType | string;
    characterCount?: number;
    durationSeconds?: number;
    metadataDetails?: string;
}) => {
    try {
        await fetch(`${PROCTOR_API}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.warn('Telemetry event send failed:', err);
    }
};

export const sendTelemetryEvent = sendProctorTelemetry;

// --- Evaluation Report (Routed via Gateway -> :8084) ---
export const generateDiagnosticReport = async (sessionId: number): Promise<DiagnosticReportResponse> => {
    const res = await fetch(`${REPORT_API}/generate/${sessionId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate diagnostic report via Gateway');
    return res.json();
};

// --- Resume Ingestion Engine (Routed via Gateway -> :8081) ---
export const uploadResumeFile = async (
    file: File,
    candidateId: string,
    candidateName: string,
    resumeTitle?: string
) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('candidateId', candidateId);
    formData.append('candidateName', candidateName);
    if (resumeTitle) formData.append('resumeTitle', resumeTitle);

    const res = await fetch(`${SESSION_API}/resume/upload`, {
        method: 'POST',
        body: formData
    });
    if (!res.ok) throw new Error('Failed to upload and parse resume');
    return res.json();
};

export const uploadResumeText = async (payload: {
    candidateId: string;
    candidateName: string;
    resumeTitle?: string;
    resumeText: string;
}) => {
    const res = await fetch(`${SESSION_API}/resume/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to ingest resume text');
    return res.json();
};

export const fetchSessionTranscript = async (sessionId: number) => {
    const res = await fetch(`${SESSION_API}/resume/transcript/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch session transcript');
    return res.json();
};

// --- Judge0 CE Zero-Trust Code Execution Sandbox (:8081) ---
export interface TestCaseResult {
    name: string;
    status: 'PASS' | 'FAIL' | 'ERROR';
    durationMs: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    error?: string;
    isHidden: boolean;
}

export interface ExecutionResultResponse {
    status: 'PASSED' | 'PARTIAL' | 'FAILED' | 'COMPILE_ERROR' | 'TIMEOUT' | 'MEMORY_EXCEEDED' | 'ENGINE_UNAVAILABLE' | 'PROBLEM_NOT_FOUND';
    totalTests: number;
    passedTests: number;
    executionTimeMs: number;
    memoryUsedMb: number;
    stdout: string;
    stderr: string;
    compilerOutput: string;
    testResults: TestCaseResult[];
}

export const executeCode = async (
    sessionId: number,
    payload: {
        language: string;
        codeSnippet: string;
        problemSlug?: string;
    }
): Promise<ExecutionResultResponse> => {
    const res = await fetch(`${SESSION_API}/${sessionId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to execute code in sandbox');
    return res.json();
};