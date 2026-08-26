import { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudio } from '../../../services/api';

interface UseCoachVoiceProps {
  onCandidateSpeechFinal?: (text: string) => void;
  apiKey?: string;
}

export function useCoachVoice({ onCandidateSpeechFinal, apiKey }: UseCoachVoiceProps = {}) {
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const onCandidateSpeechFinalRef = useRef(onCandidateSpeechFinal);
  onCandidateSpeechFinalRef.current = onCandidateSpeechFinal;
  const apiKeyRef = useRef(apiKey);
  apiKeyRef.current = apiKey;

  const toggleAiPanel = useCallback(() => setIsAiPanelOpen((prev) => !prev), []);
  const clearMicError = useCallback(() => setMicError(null), []);

  const speakText = useCallback((text: string) => {
    if (!voiceOutputEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\`\`\`[\s\S]*?\`\`\`/g, '').replace(/[*_#\`]/g, '').replace(/\n+/g, ' ').trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => { setIsSpeakingNow(true); setIsAiSpeaking(true); };
    utterance.onend = () => { setIsSpeakingNow(false); setIsAiSpeaking(false); };
    utterance.onerror = () => { setIsSpeakingNow(false); setIsAiSpeaking(false); };
    window.speechSynthesis.speak(utterance);
  }, [voiceOutputEnabled]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setMicError(null);
    setInterimTranscript('');

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onstart = () => { setIsListening(true); setMicError(null); };
        recognition.onresult = (event: any) => {
          let interim = '';
          let finalStr = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const tr = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) finalStr += tr + ' ';
            else interim += tr + ' ';
          }
          if (interim) setInterimTranscript(interim.trim());
          if (finalStr.trim()) {
            setInterimTranscript('');
            onCandidateSpeechFinalRef.current?.(finalStr.trim());
          }
        };
        recognition.onerror = (event: any) => {
          const err = event.error;
          if (err === 'not-allowed' || err === 'service-not-allowed') setMicError('Mic blocked — allow permission');
          else if (err === 'no-speech') setMicError('No speech detected');
          else if (err !== 'aborted') setMicError(`Mic error: ${err}`);
          setIsListening(false);
          setInterimTranscript('');
        };
        recognition.onend = () => { setIsListening(false); setInterimTranscript(''); };
        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err) {
        console.warn('[useCoachVoice] SpeechRecognition fallback:', err);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          try {
            setInterimTranscript('Transcribing speech...');
            const result = await transcribeAudio(audioBlob, apiKeyRef.current);
            const text = (result as any).transcript || (result as any).text;
            if (text && text.trim()) onCandidateSpeechFinalRef.current?.(text.trim());
            else setMicError('No speech detected');
          } catch {
            setMicError('Transcription failed');
          } finally {
            setInterimTranscript('');
          }
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch {
      setMicError('Mic blocked — allow permission');
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else void startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => () => {
    stopListening();
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
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
    interimTranscript,
    micError,
    clearMicError,
    speakText,
    startListening,
    stopListening,
    toggleListening
  };
}
