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

// Dynamic host resolution: Works on localhost AND from other devices on your local Wi-Fi!
const HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

const SESSION_API = `http://${HOST}:8081/api/v1/sessions`;
const AI_API = `http://${HOST}:8082/api/v1/ai`;
const PROCTOR_API = `http://${HOST}:8083/api/v1/proctor`;
const REPORT_API = `http://${HOST}:8084/api/v1/reports`;

// --- BYOK Local Storage ---
export const getStoredApiKey = (provider: ModelProvider): string => {
    return localStorage.getItem(`byok_${provider}`) || '';
};

export const setStoredApiKey = (provider: ModelProvider, key: string): void => {
    localStorage.setItem(`byok_${provider}`, key);
};

// --- Session Service (:8081) ---
export const createSession = async (payload: {
    candidateId: string;
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
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
};

export const startSession = async (sessionId: number): Promise<SessionResponse> => {
    const res = await fetch(`${SESSION_API}/${sessionId}/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start session');
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
    if (!res.ok) throw new Error('Failed to save message');
    return res.json();
};

export const completeSession = async (sessionId: number): Promise<SessionResponse> => {
    const res = await fetch(`${SESSION_API}/${sessionId}/complete`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to complete session');
    return res.json();
};

// --- AI Orchestrator (:8082) ---
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
        throw new Error(errorData.message || 'Failed to generate question');
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
    if (!res.ok) throw new Error('Dialogue turn failed');
    return res.json();
};

// --- Proctor Sentinel (:8083) ---
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

// --- Evaluation Report (:8084) ---
export const generateDiagnosticReport = async (sessionId: number): Promise<DiagnosticReportResponse> => {
    const res = await fetch(`${REPORT_API}/generate/${sessionId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate diagnostic report');
    return res.json();
};