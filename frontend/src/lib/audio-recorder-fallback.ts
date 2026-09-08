import { convertBlobTo16kHzWav } from './audio-encoder';
import { transcribeAudio } from '../services/api';

export interface StartMediaRecorderFallbackOptions {
  apiKey?: string;
  promptContext?: string;
  sessionId?: number;
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
  onStatus: (status: string) => void;
  isAiSpeakingRef: { current: boolean };
  audioChunksRef: { current: Blob[] };
  mediaRecorderRef: { current: MediaRecorder | null };
  isAbortedRef?: { current: boolean };
  abortControllerRef?: { current: AbortController | null };
  onLatency?: (latencyMs: number) => void;
}

export async function startMediaRecorderFallback({
  apiKey,
  promptContext,
  sessionId,
  onTranscript,
  onError,
  onStatus,
  isAiSpeakingRef,
  audioChunksRef,
  mediaRecorderRef,
  isAbortedRef,
  abortControllerRef,
  onLatency
}: StartMediaRecorderFallbackOptions): Promise<boolean> {
  try {
    if (window.speechSynthesis?.speaking || isAiSpeakingRef.current) return false;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      }
    });

    if (window.speechSynthesis?.speaking || isAiSpeakingRef.current || isAbortedRef?.current) {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }

    const startTime = Date.now();
    audioChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorder.ondataavailable = (e) => {
      if (window.speechSynthesis?.speaking || isAiSpeakingRef.current || isAbortedRef?.current) return;
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      if (isAbortedRef?.current) {
        audioChunksRef.current = [];
        onStatus('');
        return;
      }
      if (window.speechSynthesis?.speaking || isAiSpeakingRef.current) {
        audioChunksRef.current = [];
        onStatus('');
        return;
      }

      // Guard: Ignore accidental micro-taps (<250ms)
      const duration = Date.now() - startTime;
      if (duration < 250) {
        audioChunksRef.current = [];
        onStatus('');
        return;
      }

      if (audioChunksRef.current.length > 0) {
        const rawBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (rawBlob.size > 50 * 1024 * 1024) {
          onError('Recording too long (>50MB)');
          return;
        }
        let uploadBlob: Blob = rawBlob;
        try {
          uploadBlob = await convertBlobTo16kHzWav(rawBlob);
        } catch (convErr) {
          console.warn('[useCoachVoice] 16kHz WAV conversion notice, uploading webm fallback:', convErr);
        }
        if (isAbortedRef?.current) {
          onStatus('');
          return;
        }
        const abortCtrl = new AbortController();
        if (abortControllerRef) abortControllerRef.current = abortCtrl;

        try {
          onStatus('Transcribing speech...');
          const t0 = Date.now();
          const result = await transcribeAudio(uploadBlob, apiKey, promptContext, sessionId, 'en', abortCtrl.signal);
          const sttLatency = Date.now() - t0;
          onLatency?.(sttLatency);

          if (isAbortedRef?.current) {
            onStatus('');
            return;
          }
          const text = (result as any).transcript || (result as any).text;
          if (text && text.trim()) onTranscript(text.trim());
          else onError('No speech detected');
        } catch (err: any) {
          if (isAbortedRef?.current || err?.name === 'AbortError') {
            // Clean abort mid-turn: do not emit error
            return;
          }
          onError('Transcription failed');
        } finally {
          if (abortControllerRef) abortControllerRef.current = null;
          onStatus('');
        }
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    return true;
  } catch {
    onError('Mic blocked — allow permission');
    return false;
  }
}

export async function salvageMediaRecorderChunks(
  chunks: Blob[],
  apiKey?: string,
  promptContext?: string,
  sessionId?: number,
  onSalvage?: (text: string) => void
): Promise<void> {
  if (!chunks || chunks.length === 0) return;
  try {
    const rawBlob = new Blob(chunks, { type: 'audio/webm' });
    let uploadBlob: Blob = rawBlob;
    try { uploadBlob = await convertBlobTo16kHzWav(rawBlob); } catch {}
    const res = await transcribeAudio(uploadBlob, apiKey, promptContext, sessionId);
    const text = (res as any).transcript || (res as any).text;
    if (text && text.trim()) onSalvage?.(text.trim());
  } catch (err) {
    console.warn('[audio-recorder] Pre-TTS salvage notice:', err);
  }
}
