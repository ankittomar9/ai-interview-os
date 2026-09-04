import { useState, useRef, useCallback, useEffect } from 'react';
import { mergeSalvageText } from '../../../lib/salvage-dedup';
import { startMediaRecorderFallback, salvageMediaRecorderChunks } from '../../../lib/audio-recorder-fallback';
import { playTtsUtterance } from '../../../lib/audio-tts';
import { useDuplexGuard } from '../../../lib/audio-duplex-guard';

// SPEC-008: Endpointing pacing hygiene: 2.0s sustained silence window before finalizing candidate speech turn.
const ENDPOINTING_PACING_SILENCE_MS = 2000;

interface UseCoachVoiceProps {
  onCandidateSpeechFinal?: (text: string) => void;
  onCandidateSpeechPartialSalvage?: (text: string) => void;
  apiKey?: string;
  promptContext?: string;
  sessionId?: number;
}

export function useCoachVoice({
  onCandidateSpeechFinal,
  onCandidateSpeechPartialSalvage,
  apiKey,
  promptContext,
  sessionId
}: UseCoachVoiceProps = {}) {
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isAiSpeakingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const endpointTimerRef = useRef<any>(null);
  const pendingFinalSpeechRef = useRef<string>('');
  const interimOnlyRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  const sessionOverlappedAiRef = useRef<boolean>(false);
  const ttsEndedAtRef = useRef<number>(0);

  const apiKeyRef = useRef(apiKey);
  const promptContextRef = useRef(promptContext);
  const sessionIdRef = useRef(sessionId);
  const onCandidateSpeechFinalRef = useRef(onCandidateSpeechFinal);
  const onCandidateSpeechPartialSalvageRef = useRef(onCandidateSpeechPartialSalvage);
  apiKeyRef.current = apiKey;
  promptContextRef.current = promptContext;
  sessionIdRef.current = sessionId;
  onCandidateSpeechFinalRef.current = onCandidateSpeechFinal;
  onCandidateSpeechPartialSalvageRef.current = onCandidateSpeechPartialSalvage;

  const toggleAiPanel = useCallback(() => setIsAiPanelOpen((prev) => !prev), []);
  const clearMicError = useCallback(() => setMicError(null), []);

  const salvageCapturedSpeech = useCallback(() => {
    const preSpeech = mergeSalvageText(pendingFinalSpeechRef.current, interimOnlyRef.current);
    if (preSpeech) {
      onCandidateSpeechPartialSalvageRef.current?.(preSpeech);
      pendingFinalSpeechRef.current = '';
      interimOnlyRef.current = '';
      interimTranscriptRef.current = '';
      setInterimTranscript('');
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const preChunks = [...audioChunksRef.current];
      audioChunksRef.current = [];
      try { mediaRecorderRef.current.stop(); } catch {}
      void salvageMediaRecorderChunks(preChunks, apiKeyRef.current, promptContextRef.current, sessionIdRef.current, onCandidateSpeechPartialSalvageRef.current);
    }
  }, []);

  const speakText = useCallback((text: string) => {
    playTtsUtterance({
      text,
      voiceOutputEnabled,
      onStart: () => {
        setIsSpeakingNow(true);
        setIsAiSpeaking(true);
        isAiSpeakingRef.current = true;
        sessionOverlappedAiRef.current = true;
        if (endpointTimerRef.current) { clearTimeout(endpointTimerRef.current); endpointTimerRef.current = null; }
        salvageCapturedSpeech();
      },
      onEnd: () => {
        ttsEndedAtRef.current = Date.now();
        setIsSpeakingNow(false);
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
      },
      onError: () => {
        ttsEndedAtRef.current = Date.now();
        setIsSpeakingNow(false);
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
      }
    });
  }, [voiceOutputEnabled, salvageCapturedSpeech]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (endpointTimerRef.current) { clearTimeout(endpointTimerRef.current); endpointTimerRef.current = null; }
    pendingFinalSpeechRef.current = '';
    interimOnlyRef.current = '';
    interimTranscriptRef.current = '';
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') { try { mediaRecorderRef.current.stop(); } catch {} }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;
    shouldListenRef.current = true;
    setMicError(null);
    setInterimTranscript('');
    if (window.speechSynthesis?.speaking || isAiSpeakingRef.current || (Date.now() - ttsEndedAtRef.current < 750)) return;

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onstart = () => { sessionOverlappedAiRef.current = false; setIsListening(true); setMicError(null); };
        recognition.onresult = (event: any) => {
          if (window.speechSynthesis?.speaking || isAiSpeakingRef.current || sessionOverlappedAiRef.current) {
            if (endpointTimerRef.current) { clearTimeout(endpointTimerRef.current); endpointTimerRef.current = null; }
            pendingFinalSpeechRef.current = '';
            interimOnlyRef.current = '';
            interimTranscriptRef.current = '';
            setInterimTranscript('');
            return;
          }
          let interim = '';
          let finalStr = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const tr = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) finalStr += tr + ' ';
            else interim += tr + ' ';
          }
          if (finalStr.trim()) pendingFinalSpeechRef.current = (pendingFinalSpeechRef.current + ' ' + finalStr.trim()).trim();
          interimOnlyRef.current = interim.trim();

          const combinedDisplay = [pendingFinalSpeechRef.current, interim.trim()].filter(Boolean).join(' ');
          interimTranscriptRef.current = combinedDisplay;
          if (combinedDisplay) setInterimTranscript(combinedDisplay);

          if (endpointTimerRef.current) { clearTimeout(endpointTimerRef.current); endpointTimerRef.current = null; }
          if (pendingFinalSpeechRef.current) {
            // SPEC-PLAN-2 A1: 2.0s silence window. On commit, park continuation in draft losslessly.
            endpointTimerRef.current = setTimeout(() => {
              const textToCommit = pendingFinalSpeechRef.current.trim();
              const continuation = interimOnlyRef.current.trim();
              pendingFinalSpeechRef.current = '';
              interimOnlyRef.current = '';
              interimTranscriptRef.current = '';
              setInterimTranscript('');
              if (textToCommit && !isAiSpeakingRef.current && !sessionOverlappedAiRef.current) {
                onCandidateSpeechFinalRef.current?.(textToCommit);
                if (continuation) onCandidateSpeechPartialSalvageRef.current?.(continuation);
              }
            }, ENDPOINTING_PACING_SILENCE_MS);
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
        recognition.onend = () => { recognitionRef.current = null; setIsListening(false); setInterimTranscript(''); };
        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err) { console.warn('[useCoachVoice] SpeechRecognition fallback:', err); }
    }

    const fallbackActive = await startMediaRecorderFallback({
      apiKey: apiKeyRef.current,
      promptContext: promptContextRef.current,
      sessionId: sessionIdRef.current,
      onTranscript: (t) => onCandidateSpeechFinalRef.current?.(t),
      onError: (e) => setMicError(e),
      onStatus: (s) => setInterimTranscript(s),
      isAiSpeakingRef,
      audioChunksRef,
      mediaRecorderRef
    });
    setIsListening(fallbackActive);
  }, [salvageCapturedSpeech]);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else void startListening();
  }, [isListening, startListening, stopListening]);

  // SPEC-007: Acoustic duplex guard — monitor TTS state and pause recognition while AI speaks
  useDuplexGuard({
    isListening,
    shouldListenRef,
    recognitionRef,
    mediaRecorderRef,
    audioChunksRef,
    ttsEndedAtRef,
    setIsAiSpeaking,
    isAiSpeakingRef,
    startListening
  });

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
