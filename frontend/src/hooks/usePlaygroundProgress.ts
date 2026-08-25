import { useState, useCallback } from 'react';

export type QuestionProgressStatus = 'solved' | 'assisted' | 'attempted' | 'untouched';

export interface PlaygroundQuestionProgress {
  status: QuestionProgressStatus;
  bestTimeMs?: number;
  bestMemoryMb?: number;
  attempts: number;
  lastAttemptAt?: string;
  solutionViewed: boolean;
  notes?: string;
}

const STORAGE_PREFIX = 'playground.progress.';

export const getStoredProgress = (slug: string): PlaygroundQuestionProgress => {
  if (!slug) {
    return { status: 'untouched', attempts: 0, solutionViewed: false };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore JSON parse errors
  }
  return { status: 'untouched', attempts: 0, solutionViewed: false };
};

export const getAllStoredProgress = (): Record<string, PlaygroundQuestionProgress> => {
  const result: Record<string, PlaygroundQuestionProgress> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const slug = key.substring(STORAGE_PREFIX.length);
        const raw = localStorage.getItem(key);
        if (raw) {
          result[slug] = JSON.parse(raw);
        }
      }
    }
  } catch {
    // Ignore storage iteration errors
  }
  return result;
};

export const saveStoredProgress = (slug: string, progress: PlaygroundQuestionProgress) => {
  if (!slug) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${slug}`, JSON.stringify(progress));
  } catch {
    // Ignore storage write errors
  }
};

export const usePlaygroundProgress = () => {
  const [allProgress, setAllProgress] = useState<Record<string, PlaygroundQuestionProgress>>(() => getAllStoredProgress());

  const refresh = useCallback(() => {
    setAllProgress(getAllStoredProgress());
  }, []);

  const recordRun = useCallback(
    (slug: string, passed: boolean, timeMs?: number, memoryMb?: number) => {
      if (!slug) return;
      const prev = getStoredProgress(slug);
      const newAttempts = (prev.attempts || 0) + 1;
      let newStatus: QuestionProgressStatus = prev.status;

      if (passed) {
        newStatus = prev.solutionViewed ? 'assisted' : 'solved';
      } else if (prev.status !== 'solved' && prev.status !== 'assisted') {
        newStatus = 'attempted';
      }

      const bestTimeMs = passed && timeMs !== undefined
        ? prev.bestTimeMs !== undefined ? Math.min(prev.bestTimeMs, timeMs) : timeMs
        : prev.bestTimeMs;

      const bestMemoryMb = passed && memoryMb !== undefined
        ? prev.bestMemoryMb !== undefined ? Math.min(prev.bestMemoryMb, memoryMb) : memoryMb
        : prev.bestMemoryMb;

      const updated: PlaygroundQuestionProgress = {
        ...prev,
        status: newStatus,
        bestTimeMs,
        bestMemoryMb,
        attempts: newAttempts,
        lastAttemptAt: new Date().toISOString()
      };

      saveStoredProgress(slug, updated);
      refresh();
    },
    [refresh]
  );

  const recordSolutionView = useCallback(
    (slug: string) => {
      if (!slug) return;
      const prev = getStoredProgress(slug);
      const updated: PlaygroundQuestionProgress = {
        ...prev,
        solutionViewed: true,
        status: prev.status === 'solved' ? 'solved' : 'assisted'
      };
      saveStoredProgress(slug, updated);
      refresh();
    },
    [refresh]
  );

  const saveNotes = useCallback(
    (slug: string, notes: string) => {
      if (!slug) return;
      const prev = getStoredProgress(slug);
      const updated: PlaygroundQuestionProgress = {
        ...prev,
        notes
      };
      saveStoredProgress(slug, updated);
      refresh();
    },
    [refresh]
  );

  return {
    allProgress,
    getProgress: getStoredProgress,
    recordRun,
    recordSolutionView,
    saveNotes,
    refresh
  };
};
