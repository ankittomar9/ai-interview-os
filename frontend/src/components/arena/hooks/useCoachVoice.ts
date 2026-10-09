import { useState, useRef, useCallback, useEffect } from 'react';
import { playTtsUtterance } from '../../../lib/audio-tts';
import { useAudioCapture } from './useAudioCapture';
import { useCoachPttTranscription } from './useCoachPttTranscription';

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
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [pttState, setPttState] = useState<PttState>('IDLE');
  const [isListening, setIsListening] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const isAbortedRef = useRef<boolean>(false);
  const ttsEndedAtRef = useRef<number>(0);

  const capture = useAudioCapture();
  const transcription = useCoachPttTranscription({
    apiKey,
    promptContext,
    sessionId,
    onCandidateSpeechFinal,
    onCandidateSpeechPartialSalvage
  });

  const toggleAiPanel = useCallback(() => setIsAiPanelOpen((prev) => !prev), []);
  const clearMicError = useCallback(() => {
    setMicError(null);
    transcription.setCanRetryStt(false);
  }, [transcription]);

  // Abort mid-turn cleanly: stops active recording or cancels in-flight STT / TTS
  const abortTurn = useCallback(() => {
    isAbortedRef.current = true;
    setIsRequestingMic(false);
    transcription.cancelInFlight();
    capture.abortCapture();

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setPttState('IDLE');
    setIsListening(false);
    setIsSpeakingNow(false);
    setIsAiSpeaking(false);
    setInterimTranscript('');
  }, [capture, transcription]);

  const sendBlobForTranscription = useCallback(
    async (blob: Blob, duration: number) => {
      await transcription.submitAudioBlobForTranscription(
        blob,
        duration,
        capture.recordingStartTimeRef.current,
        () => isAbortedRef.current,
        {
          onTranscribing: () => {
            setPttState('TRANSCRIBING');
            setIsListening(false);
            setMicError(null);
            setInterimTranscript('Transcribing with Whisper...');
          },
          onSuccess: () => {
            setInterimTranscript('');
            setPttState('IDLE');
          },
          onError: (msg) => {
            setMicError(msg);
            setInterimTranscript('');
            setPttState('IDLE');
          },
          onAborted: () => {
            setInterimTranscript('');
            setPttState('IDLE');
          }
        }
      );
    },
    [transcription, capture.recordingStartTimeRef]
  );

  // Start Push-to-Talk Recording (Press)
  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;

    if (window.speechSynthesis?.speaking || isSpeakingNow) {
      window.speechSynthesis?.cancel();
      setIsSpeakingNow(false);
      setIsAiSpeaking(false);
    }

    isAbortedRef.current = false;
    setMicError(null);
    setIsRequestingMic(true);

    try {
      await capture.startCapture({
        onBlobReady: sendBlobForTranscription,
        onMicroTap: () => {
          setIsRequestingMic(false);
          setInterimTranscript('');
          setPttState('IDLE');
          setIsListening(false);
        },
        onError: (msg) => {
          setIsRequestingMic(false);
          setMicError(msg);
          setPttState('IDLE');
          setIsListening(false);
        },
        onStateRecording: () => {
          setIsRequestingMic(false);
          setPttState('RECORDING');
          setIsListening(true);
          setInterimTranscript('Recording speech… (Release or click to send)');
        }
      });
    } finally {
      setIsRequestingMic(false);
    }
  }, [capture, isSpeakingNow, sendBlobForTranscription]);

  const retryLastTranscription = useCallback(async () => {
    const saved = transcription.getSavedFailedBlob();
    if (!saved) return;
    isAbortedRef.current = false;
    await sendBlobForTranscription(saved.blob, saved.durationMs);
  }, [transcription, sendBlobForTranscription]);

  // Stop Push-to-Talk Recording (Release)
  const stopListening = useCallback(() => {
    capture.stopCapture();
  }, [capture]);

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
  const speakText = useCallback(
    (text: string) => {
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
    },
    [voiceOutputEnabled]
  );

  const abortTurnRef = useRef(abortTurn);
  useEffect(() => {
    abortTurnRef.current = abortTurn;
  });

  useEffect(() => {
    return () => {
      abortTurnRef.current();
    };
  }, []);

  return {
    isAiPanelOpen,
    setIsAiPanelOpen,
    toggleAiPanel,
    voiceOutputEnabled,
    setVoiceOutputEnabled,
    pttState,
    isListening,
    isRequestingMic,
    isSpeakingNow,
    isAiSpeaking,
    interimTranscript,
    micError,
    canRetryStt: transcription.canRetryStt,
    retryLastTranscription,
    clearMicError,
    speakText,
    startListening,
    stopListening,
    toggleListening,
    abortTurn,
    lastTurnMetrics: transcription.lastTurnMetrics,
    lastSttInfo: transcription.lastSttInfo,
    sttChip: transcription.sttChip
  };
}
