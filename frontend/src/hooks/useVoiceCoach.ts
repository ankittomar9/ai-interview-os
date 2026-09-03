import { useState, useEffect, useRef } from 'react';

interface UseVoiceCoachProps {
  enabled?: boolean;
  elapsedSeconds?: number;
  testFailures?: number;
  candidateWords?: number;
  currentTrack?: string;
  problemTitle?: string;
}

export function useVoiceCoach({
  enabled = true,
  elapsedSeconds = 0,
  testFailures = 0,
  candidateWords = 0,
  currentTrack = 'ALGORITHMS_DATA_STRUCTURES',
  problemTitle = ''
}: UseVoiceCoachProps = {}) {
  const [tip, setTip] = useState<string | undefined>();
  const [category, setCategory] = useState<string>('COACH');
  const [shouldSpeak, setShouldSpeak] = useState<boolean>(false);
  const lastCheckTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Check periodically (every 45 seconds or on failure count increase)
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 30000 && testFailures === 0) return;
    lastCheckTimeRef.current = now;

    const fetchTip = async () => {
      try {
        const res = await fetch('/api/v1/ai/voice-coach/tip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            elapsedSeconds,
            testFailures,
            consecutiveFailures: testFailures,
            candidateWords,
            currentTrack,
            problemTitle
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.tip) {
            setTip(data.tip);
            setCategory(data.category || 'COACH');
            setShouldSpeak(!!data.shouldSpeak);
          }
        }
      } catch {
        // Voice coach is non-blocking
      }
    };

    const timer = setTimeout(fetchTip, 1000);
    return () => clearTimeout(timer);
  }, [enabled, elapsedSeconds, testFailures, candidateWords, currentTrack, problemTitle]);

  return { tip, category, shouldSpeak };
}
