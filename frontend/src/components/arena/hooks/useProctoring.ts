import { useState, useEffect, useCallback } from 'react';
import { useProctorSentinel } from '../../../hooks/useProctorSentinel';
import { useKeystrokeTracker } from '../../../hooks/useKeystrokeTracker';
import type { IntegritySignals } from '../../../types';

interface UseProctoringProps {
  sessionId: number;
  isPlayground?: boolean;
}

export function useProctoring({
  sessionId,
  isPlayground = false
}: UseProctoringProps) {
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [pasteDumps, setPasteDumps] = useState(0);

  // Background Sentinel
  const sentinel = useProctorSentinel(sessionId, !isPlayground);

  // Keystroke dynamics tracker
  const keystroke = useKeystrokeTracker(!isPlayground);

  useEffect(() => {
    if (isPlayground) return;

    const handleBlur = () => {
      setIsWindowBlurred(true);
      setTabSwitches((c) => c + 1);
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    const handlePaste = () => {
      setPasteDumps((p) => p + 1);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('paste', handlePaste);
    };
  }, [isPlayground]);

  const getIntegritySignals = useCallback((): IntegritySignals | undefined => {
    if (isPlayground) return undefined;
    const analytics = keystroke.getAnalytics();
    if (!analytics) return undefined;

    return {
      keystrokeCount: analytics.totalKeystrokes,
      avgKeystrokeIntervalMs: Math.round(analytics.avgInterval),
      keystrokeVariance: Math.round(analytics.variance),
      estimatedWpm: Math.round(analytics.wpm),
      suspiciousTyping: analytics.isSuspicious,
      tabSwitchCount: sentinel.tabSwitches + tabSwitches,
      pasteCount: sentinel.pasteDumps + pasteDumps
    };
  }, [isPlayground, keystroke, sentinel, tabSwitches, pasteDumps]);

  return {
    isWindowBlurred,
    tabSwitches: sentinel.tabSwitches + tabSwitches,
    pasteDumps: sentinel.pasteDumps + pasteDumps,
    sentinel,
    keystroke,
    getIntegritySignals
  };
}
