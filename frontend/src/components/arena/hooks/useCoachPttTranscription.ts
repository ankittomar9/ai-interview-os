import { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '../../../services/api';
import type { TurnMetrics } from './useCoachVoice';

interface UseCoachPttTranscriptionProps {
  apiKey?: string;
  promptContext?: string;
  sessionId?: number;
  onCandidateSpeechFinal?: (text: string, metadata?: Record<string, string>) => void;
  onCandidateSpeechPartialSalvage?: (text: string) => void;
}

export function useCoachPttTranscription({
  apiKey,
  promptContext,
  sessionId,
  onCandidateSpeechFinal
}: UseCoachPttTranscriptionProps) {
  const [canRetryStt, setCanRetryStt] = useState(false);
  const [lastTurnMetrics, setLastTurnMetrics] = useState<TurnMetrics>({
    sttLatencyMs: null,
    recordingDurationMs: null,
    turnCompletedAt: null
  });
  const [lastSttInfo, setLastSttInfo] = useState<{ provider: 'groq' | 'local'; latencyMs: number } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFailedAudioBlobRef = useRef<{ blob: Blob; durationMs: number } | null>(null);

  const apiKeyRef = useRef(apiKey);
  const promptContextRef = useRef(promptContext);
  const sessionIdRef = useRef(sessionId);
  const onCandidateSpeechFinalRef = useRef(onCandidateSpeechFinal);

  apiKeyRef.current = apiKey;
  promptContextRef.current = promptContext;
  sessionIdRef.current = sessionId;
  onCandidateSpeechFinalRef.current = onCandidateSpeechFinal;

  const cancelInFlight = useCallback(() => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {}
      abortControllerRef.current = null;
    }
  }, []);

  const submitAudioBlobForTranscription = useCallback(
    async (
      uploadBlob: Blob,
      durationMs: number,
      recordingStartTime: number,
      isAborted: () => boolean,
      callbacks: {
        onTranscribing: () => void;
        onSuccess: (text: string) => void;
        onError: (msg: string) => void;
        onAborted: () => void;
      }
    ) => {
      callbacks.onTranscribing();
      setCanRetryStt(false);

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

        if (isAborted()) {
          callbacks.onAborted();
          return;
        }

        const isLowConfidence =
          (result as any).sttLowConfidence === 'true' || (result as any).status === 'TOO_SHORT';
        if (isLowConfidence) {
          const msg = (result as any).message || 'Recording too short — hold/toggle and speak your full approach.';
          callbacks.onError(msg);
          return;
        }

        const text = (result as any).transcript || (result as any).text;
        if (text && text.trim()) {
          lastFailedAudioBlobRef.current = null;
          setCanRetryStt(false);
          const rawProv = (result as any).sttProvider || (result as any).provider;
          const prov: 'groq' | 'local' =
            rawProv && String(rawProv).toLowerCase().includes('groq') ? 'groq' : 'local';
          const latency = Number((result as any).sttMs || (result as any).latencyMs) || sttLatency;
          setLastSttInfo({
            provider: prov,
            latencyMs: latency
          });
          setLastTurnMetrics({
            sttLatencyMs: sttLatency,
            recordingDurationMs: durationMs,
            turnCompletedAt: Date.now()
          });

          const meta: Record<string, string> = {
            isStt: 'true',
            captureTimestamp: String(recordingStartTime || Date.now())
          };
          onCandidateSpeechFinalRef.current?.(text.trim(), meta);
          callbacks.onSuccess(text.trim());
        } else {
          callbacks.onError('No speech detected');
        }
      } catch (err: any) {
        if (isAborted() || err?.name === 'AbortError') {
          callbacks.onAborted();
          return;
        }
        lastFailedAudioBlobRef.current = { blob: uploadBlob, durationMs };
        setCanRetryStt(true);
        callbacks.onError(
          'Transcription failed — your audio recording is saved. Click Retry to re-transcribe.'
        );
      } finally {
        abortControllerRef.current = null;
      }
    },
    []
  );

  const getSavedFailedBlob = useCallback(() => lastFailedAudioBlobRef.current, []);

  const sttChip = lastSttInfo
    ? lastSttInfo.provider === 'groq'
      ? `voice: Groq LPU · ${(lastSttInfo.latencyMs / 1000).toFixed(1)}s`
      : `voice: local · ${(lastSttInfo.latencyMs / 1000).toFixed(1)}s`
    : null;

  return {
    canRetryStt,
    setCanRetryStt,
    lastTurnMetrics,
    lastSttInfo,
    sttChip,
    cancelInFlight,
    submitAudioBlobForTranscription,
    getSavedFailedBlob
  };
}
