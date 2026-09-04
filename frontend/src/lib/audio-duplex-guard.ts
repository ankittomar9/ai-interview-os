import { useEffect } from 'react';

export interface UseDuplexGuardOptions {
  isListening: boolean;
  shouldListenRef: { current: boolean };
  recognitionRef: { current: any };
  mediaRecorderRef: { current: MediaRecorder | null };
  audioChunksRef: { current: Blob[] };
  ttsEndedAtRef: { current: number };
  setIsAiSpeaking: (speaking: boolean) => void;
  isAiSpeakingRef: { current: boolean };
  startListening: () => Promise<void>;
}

export function useDuplexGuard({
  isListening,
  shouldListenRef,
  recognitionRef,
  mediaRecorderRef,
  audioChunksRef,
  ttsEndedAtRef,
  setIsAiSpeaking,
  isAiSpeakingRef,
  startListening
}: UseDuplexGuardOptions) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const checkSpeaking = () => {
      const speaking = Boolean(window.speechSynthesis && window.speechSynthesis.speaking);
      setIsAiSpeaking(speaking);
      isAiSpeakingRef.current = speaking;
      if (speaking) {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
          recognitionRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try { mediaRecorderRef.current.stop(); } catch {}
          audioChunksRef.current = [];
        }
      } else if (
        shouldListenRef.current &&
        !isListening &&
        !recognitionRef.current &&
        (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') &&
        (Date.now() - ttsEndedAtRef.current >= 750)
      ) {
        void startListening();
      }
    };
    const interval = setInterval(checkSpeaking, 100);
    return () => clearInterval(interval);
  }, [isListening, startListening]);
}
