export type SubmissionStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Compile Error'
  | 'Runtime Error'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Engine Unavailable'
  | 'Execution Error';

export interface SubmissionCaseResult {
  name?: string;
  passed?: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  error?: string;
  isHidden?: boolean;
}

export interface SubmissionRecord {
  id: string;
  at: string; // ISO date string
  language: string;
  status: SubmissionStatus;
  type?: 'RUN' | 'SUBMIT';
  runtimeMs: number;
  memoryMb: number;
  passedTests: number;
  totalTests: number;
  rawOutput?: string;
  compilerOutput?: string;
  cases?: SubmissionCaseResult[];
}

const buildStorageKey = (sessionId: number | string, slug: string): string => {
  return `submissions.${sessionId}.${slug || 'q1'}`;
};

export const getSubmissions = (sessionId: number | string, slug: string): SubmissionRecord[] => {
  if (!sessionId || !slug) return [];
  try {
    const raw = localStorage.getItem(buildStorageKey(sessionId, slug));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return [];
};

export const saveSubmission = (
  sessionId: number | string,
  slug: string,
  entry: Omit<SubmissionRecord, 'id' | 'at'>
): SubmissionRecord => {
  const fullRecord: SubmissionRecord = {
    ...entry,
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    at: new Date().toISOString()
  };

  try {
    const existing = getSubmissions(sessionId, slug);
    // Newest first
    const updated = [fullRecord, ...existing];
    localStorage.setItem(buildStorageKey(sessionId, slug), JSON.stringify(updated));
  } catch {
    // Ignore storage write errors
  }

  return fullRecord;
};

export const formatTimeAgo = (isoDate: string): string => {
  try {
    const now = Date.now();
    const past = new Date(isoDate).getTime();
    const diffSec = Math.max(0, Math.floor((now - past) / 1000));

    if (diffSec < 10) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'just now';
  }
};
