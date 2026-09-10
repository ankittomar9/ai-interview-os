import { useState, useRef, useCallback, useEffect } from 'react';
import { convertBlobTo16kHzWav } from '../../../lib/audio-encoder';
import { transcribeAudio } from '../../../services/api';
import { playTtsUtterance } from '../../../lib/audio-tts';

export type PttState = 'IDLE' | 'RECORDING' | 'TRANSCRIBING' | 'SPEAKING';

export interface TurnMetrics {
  sttLatencyMs: number | null;
  recordingDurationMs: number | null;
  turnCompletedAt: number | null;
}

export interface UseCoachVoiceProps {
  onCandidateSpeechFinal?: (text: string, metadata?: Record<string, string>) => void;
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
  const [pttState, setPttState] = useState<PttState>('IDLE');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [lastTurnMetrics, setLastTurnMetrics] = useState<TurnMetrics>({
    sttLatencyMs: null,
    recordingDurationMs: null,
    turnCompletedAt: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isAbortedRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
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

  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Abort mid-turn cleanly: stops active recording or cancels in-flight STT / TTS
  const abortTurn = useCallback(() => {
    isAbortedRef.current = true;

    // 1. Cancel in-flight transcription fetch if any
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch {}
      abortControllerRef.current = null;
    }

    // 2. Stop media recorder and release mic
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    mediaRecorderRef.current = null;
    cleanupStream();
    audioChunksRef.current = [];

    // 3. Halt TTS if speaking
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // 4. Reset states cleanly to IDLE
    setPttState('IDLE');
    setIsListening(false);
    setIsSpeakingNow(false);
    setIsAiSpeaking(false);
    setInterimTranscript('');
  }, [cleanupStream]);

  // Start Push-to-Talk Recording (Press)
  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // If AI is currently speaking, interrupt it
    if (window.speechSynthesis?.speaking || isSpeakingNow) {
      window.speechSynthesis?.cancel();
      setIsSpeakingNow(false);
      setIsAiSpeaking(false);
    }

    isAbortedRef.current = false;
    setMicError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });

      if (isAbortedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      mediaStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (isAbortedRef.current) return;
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        cleanupStream();

        if (isAbortedRef.current) {
          audioChunksRef.current = [];
          setInterimTranscript('');
          setPttState('IDLE');
          setIsListening(false);
          return;
        }

        const duration = Date.now() - recordingStartTimeRef.current;
        if (duration < 250) {
          // Micro-tap ignore
          audioChunksRef.current = [];
          setInterimTranscript('');
          setPttState('IDLE');
          setIsListening(false);
          return;
        }

        if (audioChunksRef.current.length > 0) {
          const rawBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (rawBlob.size > 50 * 1024 * 1024) {
            setMicError('Recording too long (>50MB)');
            setPttState('IDLE');
            setIsListening(false);
            return;
          }

          let uploadBlob: Blob = rawBlob;
          try {
            uploadBlob = await convertBlobTo16kHzWav(rawBlob);
          } catch (convErr) {
            console.warn('[useCoachVoice] 16kHz WAV conversion notice, uploading webm fallback:', convErr);
          }

          if (isAbortedRef.current) {
            setPttState('IDLE');
            setIsListening(false);
            setInterimTranscript('');
            return;
          }

          setPttState('TRANSCRIBING');
          setIsListening(false);
          setInterimTranscript('Transcribing with Whisper...');

          const abortCtrl = new AbortController();
          abortControllerRef.current = abortCtrl;

          try {
            const t0 = Date.now();
            const result = await transcribeAudio(
              uploadBlob,
              apiKeyRef.current,
              promptContextRef.current,
              sessionIdRef.current,
              'en',
              abortCtrl.signal
            );
            const sttLatency = Date.now() - t0;

            if (isAbortedRef.current) {
              setInterimTranscript('');
              setPttState('IDLE');
              return;
            }

            const isLowConfidence = (result as any).sttLowConfidence === 'true' || (result as any).status === 'TOO_SHORT';
            if (isLowConfidence) {
              const msg = (result as any).message || 'Recording too short — hold/toggle and speak your full approach.';
              setMicError(msg);
              setInterimTranscript('');
              setPttState('IDLE');
              return;
            }

            const text = (result as any).transcript || (result as any).text;
            if (text && text.trim()) {
              setLastTurnMetrics({
                sttLatencyMs: sttLatency,
                recordingDurationMs: duration,
                turnCompletedAt: Date.now()
              });
              setInterimTranscript('');
              setPttState('IDLE');
              const meta: Record<string, string> = {
                isStt: 'true',
                captureTimestamp: String(recordingStartTimeRef.current || Date.now())
              };
              onCandidateSpeechFinalRef.current?.(text.trim(), meta);
            } else {
              setMicError('No speech detected');
              setInterimTranscript('');
              setPttState('IDLE');
            }
          } catch (err: any) {
            if (isAbortedRef.current || err?.name === 'AbortError') {
              // Clean abort mid-turn
              setInterimTranscript('');
              setPttState('IDLE');
              return;
            }
            setMicError('Transcription failed');
            setInterimTranscript('');
            setPttState('IDLE');
          } finally {
            abortControllerRef.current = null;
          }
        } else {
          setInterimTranscript('');
          setPttState('IDLE');
          setIsListening(false);
        }
      };

      mediaRecorder.start();
      setPttState('RECORDING');
      setIsListening(true);
      setInterimTranscript('Recording speech… (Release or click to send)');
    } catch {
      setMicError('Mic blocked — allow permission');
      setPttState('IDLE');
      setIsListening(false);
    }
  }, [cleanupStream, isSpeakingNow]);

  // Stop Push-to-Talk Recording (Release)
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  }, []);

  // Toggle PTT (Click-to-talk convenience)
  const toggleListening = useCallback(() => {
    if (pttState === 'RECORDING') {
      stopListening();
    } else if (pttState === 'TRANSCRIBING' || pttState === 'SPEAKING') {
      abortTurn();
    } else {
      void startListening();
    }
  }, [pttState, startListening, stopListening, abortTurn]);

  // Speak response text via browser TTS
  const speakText = useCallback((text: string) => {
    playTtsUtterance({
      text,
      voiceOutputEnabled,
      onStart: () => {
        setPttState('SPEAKING');
        setIsSpeakingNow(true);
        setIsAiSpeaking(true);
      },
      onEnd: () => {
        ttsEndedAtRef.current = Date.now();
        setPttState('IDLE');
        setIsSpeakingNow(false);
        setIsAiSpeaking(false);
      },
      onError: () => {
        ttsEndedAtRef.current = Date.now();
        setPttState('IDLE');
        setIsSpeakingNow(false);
        setIsAiSpeaking(false);
      }
    });
  }, [voiceOutputEnabled]);

  // Cleanup on unmount
  useEffect(() => () => {
    abortTurn();
  }, [abortTurn]);

  return {
    isAiPanelOpen,
    setIsAiPanelOpen,
    toggleAiPanel,
    voiceOutputEnabled,
    setVoiceOutputEnabled,
    pttState,
    isListening,
    isSpeakingNow,
    isAiSpeaking,
    interimTranscript,
    micError,
    clearMicError,
    speakText,
    startListening,
    stopListening,
    toggleListening,
    abortTurn,
    lastTurnMetrics
  };
}
