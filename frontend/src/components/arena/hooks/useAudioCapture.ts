import { useRef, useCallback } from 'react';
import { convertBlobTo16kHzWav } from '../../../lib/audio-encoder';
import { clientLog } from '../../../lib/clientLogger';

interface StartCaptureOptions {
  onBlobReady: (blob: Blob, durationMs: number) => Promise<void>;
  onMicroTap?: () => void;
  onError?: (msg: string) => void;
  onStateRecording?: () => void;
}

function pickAudioMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

export function useAudioCapture() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const isStartingRef = useRef<boolean>(false);

  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const abortCapture = useCallback(() => {
    isStartingRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;
    cleanupStream();
    audioChunksRef.current = [];
  }, [cleanupStream]);

  const startCapture = useCallback(
    async (options: StartCaptureOptions) => {
      if (typeof window === 'undefined') return;
      if (isStartingRef.current) return;
      isStartingRef.current = true;

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

        mediaStreamRef.current = stream;
        const mimeType = pickAudioMime();
        const mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        recordingStartTimeRef.current = Date.now();

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          cleanupStream();

          const duration = Date.now() - recordingStartTimeRef.current;
          if (duration < 250) {
            audioChunksRef.current = [];
            options.onMicroTap?.();
            return;
          }

          if (audioChunksRef.current.length > 0) {
            const rawBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
            if (rawBlob.size > 50 * 1024 * 1024) {
              options.onError?.('Recording too long (>50MB)');
              return;
            }

            let uploadBlob: Blob = rawBlob;
            try {
              uploadBlob = await convertBlobTo16kHzWav(rawBlob);
            } catch (convErr) {
              console.warn('[useAudioCapture] 16kHz WAV conversion notice, uploading webm fallback:', convErr);
            }

            await options.onBlobReady(uploadBlob, duration);
          } else {
            options.onMicroTap?.();
          }
        };

        mediaRecorder.start();
        options.onStateRecording?.();
      } catch (err: any) {
        console.error('[useAudioCapture] Failed to start audio capture:', err);
        const errMsg =
          err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
            ? 'Mic blocked — allow permission in browser'
            : err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError'
            ? 'No microphone found'
            : 'Mic blocked — allow permission';
        options.onError?.(errMsg);
        clientLog.warn('RECORDER_ERROR', errMsg);
        void clientLog.flush();
      } finally {
        isStartingRef.current = false;
      }
    },
    [cleanupStream]
  );

  const stopCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  }, []);

  return {
    mediaRecorderRef,
    mediaStreamRef,
    recordingStartTimeRef,
    cleanupStream,
    abortCapture,
    startCapture,
    stopCapture
  };
}
