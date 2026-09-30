import { useState, useEffect, useCallback } from 'react';
import { toast } from '../../../hooks/useToast';
import { getSavedCodeForSlug } from '../ArenaRoom';

interface UseArenaCodeSessionProps {
  sessionId: number;
  activeSlug: string;
  fallbackStarter: string;
}

export function useArenaCodeSession({
  sessionId,
  activeSlug,
  fallbackStarter
}: UseArenaCodeSessionProps) {
  const [codeMap, setCodeMap] = useState<Record<string, string>>(() => {
    const initial = getSavedCodeForSlug(sessionId, activeSlug, fallbackStarter);
    return { [activeSlug]: initial.code };
  });

  // Reset entire map ONLY when sessionId changes
  useEffect(() => {
    const initial = getSavedCodeForSlug(sessionId, activeSlug, fallbackStarter);
    setCodeMap({ [activeSlug]: initial.code });
  }, [sessionId]);

  // When switching questions or when starter code resolves, initialize new slug if not already set
  useEffect(() => {
    setCodeMap((prev) => {
      const existing = prev[activeSlug];
      if (existing !== undefined && existing !== null && !existing.startsWith('// No starter code shipped')) {
        return prev;
      }
      const restored = getSavedCodeForSlug(sessionId, activeSlug, fallbackStarter);
      if (restored.source === 'submission') {
        toast.info('Restored your last submission for this question');
      }
      return { ...prev, [activeSlug]: restored.code };
    });
  }, [sessionId, activeSlug, fallbackStarter]);

  const code = codeMap[activeSlug] ?? fallbackStarter;

  // Debounced autosave to localStorage per slug
  useEffect(() => {
    if (!code || code === fallbackStarter) return;
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(`editor.autosave.${sessionId}.${activeSlug}`, code);
        }
      } catch {
        // quota exceeded or storage disabled
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [sessionId, activeSlug, code, fallbackStarter]);

  const setCode = useCallback(
    (newCode: string) => {
      setCodeMap((prev) => ({ ...prev, [activeSlug]: newCode }));
    },
    [activeSlug]
  );

  return { code, setCode, codeMap };
}
