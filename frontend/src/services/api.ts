import type {
    DiagnosticReportResponse,
    DifficultyLevel,
    GenerateQuestionResponse,
    InterviewTrack,
    ModelProvider,
    SessionResponse,
    TelemetryEventType,
    AiDialogueResponse
} from '../types';

// Relative paths: Served directly through Nginx/Vite proxy with zero cross-origin issues
const SESSION_API = '/api/v1/sessions';
const AI_API = '/api/v1/ai';
const PROCTOR_API = '/api/v1/proctor';
const REPORT_API = '/api/v1/reports';

// --- BYOK Local Storage ---
export const getStoredApiKey = (provider: ModelProvider): string => {
    return localStorage.getItem(`byok_${provider}`) || '';
};

export const setStoredApiKey = (provider: ModelProvider, key: string): void => {
    localStorage.setItem(`byok_${provider}`, key);
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
    payload: { senderRole: string; messageType: string; content: string; codeSnippet?: string }
) => {
    const res = await fetch(`${SESSION_API}/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save message via Gateway');
    return res.json();
};

export const completeSession = async (sessionId: number): Promise<SessionResponse> => {
    const res = await fetch(`${SESSION_API}/${sessionId}/complete`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to complete session via Gateway');
    return res.json();
};

// --- AI Orchestrator (Routed via Gateway -> :8082) ---
export const generateQuestion = async (payload: {
    roleTitle: string;
    track: InterviewTrack;
    difficulty: DifficultyLevel;
    jobDescription?: string;
    modelProvider: ModelProvider;
    apiKey?: string;
}): Promise<GenerateQuestionResponse> => {
    const res = await fetch(`${AI_API}/generate-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'AI generation failed' }));
        throw new Error(errorData.message || 'Failed to generate question via Gateway');
    }
    return res.json();
};

export const processDialogueTurn = async (payload: {
    questionContext: string;
    candidateExplanation?: string;
    candidateCode?: string;
    modelProvider: ModelProvider;
    apiKey?: string;
}): Promise<AiDialogueResponse> => {
    const res = await fetch(`${AI_API}/dialogue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Dialogue turn failed via Gateway');
    return res.json();
};

/**
 * Groq Whisper Neural Speech-to-Text (180ms LPU transcription).
 */
export const transcribeAudio = async (
    audioBlob: Blob,
    apiKey?: string,
    model?: string
): Promise<{ text: string; status: string; latencyMs?: string }> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    if (apiKey) formData.append('apiKey', apiKey);
    if (model) formData.append('model', model);

    const res = await fetch(`${AI_API}/transcribe`, {
        method: 'POST',
        body: formData
    });
    if (!res.ok) throw new Error('Failed to transcribe audio via Whisper');
    return res.json();
};

// --- Proctor Sentinel (Routed via Gateway -> :8083) ---
export const sendTelemetryEvent = async (payload: {
    sessionId: number;
    eventType: TelemetryEventType;
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