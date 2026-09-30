import { useRef, useCallback } from 'react';
import { convertBlobTo16kHzWav } from '../../../lib/audio-encoder';

interface StartCaptureOptions {
  onBlobReady: (blob: Blob, durationMs: number) => Promise<void>;
  onMicroTap?: () => void;
  onError?: (msg: string) => void;
  onStateRecording?: () => void;
}

export function useAudioCapture() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const abortCapture = useCallback(() => {
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
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
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
            const rawBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
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
      } catch {
        options.onError?.('Mic blocked — allow permission');
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
