import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCoachVoiceProps {
  onCandidateSpeechFinal?: (text: string) => void;
}

export function useCoachVoice({ onCandidateSpeechFinal }: UseCoachVoiceProps = {}) {
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const onCandidateSpeechFinalRef = useRef(onCandidateSpeechFinal);
  onCandidateSpeechFinalRef.current = onCandidateSpeechFinal;

  const toggleAiPanel = useCallback(() => {
    setIsAiPanelOpen((prev) => !prev);
  }, []);

  const speakText = useCallback((text: string) => {
    if (!voiceOutputEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\`\`\`[\s\S]*?\`\`\`/g, '')
      .replace(/[*_#\`]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeakingNow(true);
      setIsAiSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeakingNow(false);
      setIsAiSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeakingNow(false);
      setIsAiSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [voiceOutputEnabled]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let finalStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript + ' ';
          }
        }
        if (finalStr.trim() && onCandidateSpeechFinalRef.current) {
          onCandidateSpeechFinalRef.current(finalStr.trim());
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopListening]);

  return {
    isAiPanelOpen,
    setIsAiPanelOpen,
    toggleAiPanel,
    voiceOutputEnabled,
    setVoiceOutputEnabled,
    isListening,
    isSpeakingNow,
    isAiSpeaking,
    speakText,
    startListening,
    stopListening
  };
}
