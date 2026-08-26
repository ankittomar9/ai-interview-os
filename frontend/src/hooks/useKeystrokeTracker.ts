import { useEffect, useRef, useCallback } from 'react';

export interface KeystrokeEvent {
  key: string;
  timestamp: number;
  duration: number; // key press duration in ms
  interval: number; // time since last keystroke in ms
}

export interface KeystrokeAnalytics {
  totalKeystrokes: number;
  avgInterval: number; // ms between keys
  variance: number; // typing consistency (lower = more robotic)
  wpm: number; // words per minute estimate
  isSuspicious: boolean; // too fast (< 50ms avg) or too consistent (variance < 100)
}

export const useKeystrokeTracker = (enabled: boolean) => {
  const events = useRef<KeystrokeEvent[]>([]);
  const lastKeyTime = useRef<number>(0);
  const keyDownTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys alone
      if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock'].includes(e.key)) return;
      keyDownTime.current = Date.now();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock'].includes(e.key)) return;

      const now = Date.now();
      const duration = now - keyDownTime.current;
      const interval = lastKeyTime.current ? now - lastKeyTime.current : 0;

      events.current.push({
        key: e.key,
        timestamp: now,
        duration,
        interval
      });
      lastKeyTime.current = now;

      // Keep only last 1000 events to prevent memory bloat
      if (events.current.length > 1000) {
        events.current = events.current.slice(-1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled]);

  const getAnalytics = useCallback((): KeystrokeAnalytics | null => {
    if (events.current.length < 20) return null; // Need minimum sample size

    const intervals = events.current
      .map(e => e.interval)
      .filter(i => i > 0 && i < 2000); // Ignore first keypress and long pauses

    if (intervals.length < 10) return null;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const wpm = Math.round(60000 / avgInterval / 5); // chars per word = 5

    // Suspicious thresholds:
    // - avgInterval < 50ms = 1200+ WPM (impossible for humans)
    // - variance < 100 = too consistent (bot-like)
    const isSuspicious = avgInterval < 50 || variance < 100;

    return {
      totalKeystrokes: events.current.length,
      avgInterval: Math.round(avgInterval),
      variance: Math.round(variance),
      wpm,
      isSuspicious
    };
  }, []);

  const reset = useCallback(() => {
    events.current = [];
    lastKeyTime.current = 0;
    keyDownTime.current = 0;
  }, []);

  return { getAnalytics, reset, events: events.current };
};
