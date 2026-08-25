import type {
    SessionResponse,
    GenerateQuestionResponse,
    AiDialogueResponse,
    DiagnosticReportResponse,
    InterviewTrack,
    DifficultyLevel,
    TelemetryEventType,
    AttachmentUploadResponse,
    DesignEvaluateRequest,
    DesignEvaluateResponse,
    MessageType
} from '../types';
import { fetchJson } from './http';

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
    mode?: 'INTERVIEW' | 'PLAYGROUND';
}): Promise<SessionResponse> => {
    return fetchJson<SessionResponse>(SESSION_API, {
        method: 'POST',
        body: JSON.stringify(payload),
        timeoutMs: 15000
    });
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
        messageType: MessageType;
        content: string;
        codeSnippet?: string;
        metadata?: Record<string, string>;
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

// --- Attachments & Canvas Snapshot Engine (:8081) ---
export const uploadCanvasPngAttachment = async (
    sessionId: number,
    pngBlob: Blob
): Promise<AttachmentUploadResponse> => {
    const formData = new FormData();
    formData.append('file', pngBlob, 'canvas-architecture.png');
    formData.append('kind', 'CANVAS_PNG');

    const res = await fetch(`${SESSION_API}/${sessionId}/attachments`, {
        method: 'POST',
        body: formData
    });
    if (!res.ok) throw new Error('Failed to upload canvas PNG attachment');
    return res.json();
};

export const uploadCanvasJsonAttachment = async (
    sessionId: number,
    canvasData: string
): Promise<AttachmentUploadResponse> => {
    const res = await fetch(`${SESSION_API}/${sessionId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            kind: 'CANVAS_JSON',
            canvasData
        })
    });
    if (!res.ok) throw new Error('Failed to upload canvas JSON snapshot');
    return res.json();
};

export const getAttachmentUrl = (sessionId: number, attachmentId: string): string => {
    return `${SESSION_API}/${sessionId}/attachments/${attachmentId}`;
};

// --- AI Orchestrator Service (Routed via Gateway -> :8082) ---
export const generateQuestion = async (payload: {
    roleTitle?: string;
    targetCompany?: string;
    track: InterviewTrack;
    difficulty: DifficultyLevel;
    jobDescription?: string;
    modelProvider?: string;
    apiKey?: string;
    resumeSkills?: string[];
}): Promise<GenerateQuestionResponse> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (payload.apiKey) {
        headers['X-InterviewOS-Key'] = payload.apiKey;
    }
    const res = await fetch(`${AI_API}/generate-question`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to generate interview question');
    return res.json();
};

export const processDialogueTurn = async (payload: {
    questionContext: string;
    sessionId?: number;
    problemSlug?: string;
    candidateExplanation: string;
    candidateCode?: string;
    modelProvider?: string;
    apiKey?: string;
    sessionMode?: 'INTERVIEW' | 'PLAYGROUND' | string;
    latestExecution?: {
        status: string;
        passedTests: number;
        totalTests: number;
        executionTimeMs: number;
        memoryUsedMb: number;
    };
}): Promise<AiDialogueResponse> => {
    return fetchJson<AiDialogueResponse>(`${AI_API}/dialogue`, {
        method: 'POST',
        body: JSON.stringify(payload),
        apiKey: payload.apiKey,
        timeoutMs: 70000
    });
};

export const evaluateArchitectureDesign = async (
    payload: DesignEvaluateRequest
): Promise<DesignEvaluateResponse> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (payload.apiKey) {
        headers['X-InterviewOS-Key'] = payload.apiKey;
    }
    const res = await fetch(`${AI_API}/design-evaluate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to evaluate system design architecture');
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

    const headers: Record<string, string> = {};
    if (apiKey) {
        headers['X-InterviewOS-Key'] = apiKey;
    }

    const res = await fetch(`${AI_API}/transcribe`, {
        method: 'POST',
        headers,
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
    status: 'PASSED' | 'ACCEPTED' | 'PARTIAL' | 'FAILED' | 'COMPILE_ERROR' | 'SYNTAX_ERROR' | 'RUNTIME_ERROR' | 'TIMEOUT' | 'MEMORY_EXCEEDED' | 'ENGINE_UNAVAILABLE' | 'PROBLEM_NOT_FOUND';
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

export const executeProject = async (
    sessionId: number,
    payload: {
        problemSlug: string;
        files?: Record<string, string>;
        source?: 'inline' | 'workspace';
        workspaceVolume?: string;
    }
): Promise<ExecutionResultResponse> => {
    const res = await fetch(`${SESSION_API}/${sessionId}/execute-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to execute project tests');
    return res.json();
};

// --- M9 Embedded VS Code Workspace (:8081) ---
export interface WorkspaceProvisionResponse {
    workspaceId: string;
    url: string;
    status: 'PROVISIONING' | 'READY' | 'FALLBACK' | 'TERMINATED' | 'ERROR';
    volumeName?: string;
    message?: string;
}

export interface WorkspaceStatusResponse {
    workspaceId: string;
    url: string;
    status: 'PROVISIONING' | 'READY' | 'FALLBACK' | 'TERMINATED' | 'ERROR';
    volumeName?: string;
}

export const provisionWorkspace = async (
    sessionId: number,
    problemSlug: string
): Promise<WorkspaceProvisionResponse> => {
    const res = await fetch(`${SESSION_API}/${sessionId}/workspace/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemSlug })
    });
    if (!res.ok) throw new Error('Failed to provision workspace');
    return res.json();
};

export const getWorkspaceStatus = async (
    sessionId: number
): Promise<WorkspaceStatusResponse> => {
    const res = await fetch(`${SESSION_API}/${sessionId}/workspace/status`);
    if (!res.ok) throw new Error('Failed to check workspace status');
    return res.json();
};

export const destroyWorkspace = async (
    sessionId: number
): Promise<void> => {
    try {
        await fetch(`${SESSION_API}/${sessionId}/workspace/destroy`, {
            method: 'POST'
        });
    } catch (e) {
        console.warn('Workspace destruction notice:', e);
    }
};

// --- Question Bank Service (Routed via Gateway -> :8086) ---
export const listQuestions = async (params?: {
    track?: string;
    difficulty?: string;
    tags?: string[];
    q?: string;
}): Promise<GenerateQuestionResponse[]> => {
    const query = new URLSearchParams();
    if (params?.track && params.track !== 'ALL') query.append('track', params.track);
    if (params?.difficulty && params.difficulty !== 'ALL') query.append('difficulty', params.difficulty);
    if (params?.q) query.append('q', params.q);
    if (params?.tags && params.tags.length > 0) {
        params.tags.forEach(t => query.append('tags', t));
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<GenerateQuestionResponse[]>(`${GATEWAY_BASE}/questions${queryString}`, {
        method: 'GET',
        timeoutMs: 15000
    });
};

export const getQuestionBySlug = async (slug: string): Promise<GenerateQuestionResponse> => {
    return fetchJson<GenerateQuestionResponse>(`${GATEWAY_BASE}/questions/${slug}`, {
        method: 'GET',
        timeoutMs: 15000
    });
};