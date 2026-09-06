import { useEffect, useRef, useState, useCallback } from 'react';
import type { StreamKind } from '../types';

interface QueuedMicChunk {
  blob: Blob;
  seq: number;
  kind: StreamKind;
  retries: number;
}

interface UseMicRecorderProps {
  sessionId: number;
  enabled?: boolean;
  onInterrupted?: (reason: string) => void;
}

function pickAudioMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm'
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return 'audio/webm';
}

export function useMicRecorder({
  sessionId,
  enabled = true,
  onInterrupted
}: UseMicRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [unsentCount, setUnsentCount] = useState(0);
  const [lostAt, setLostAt] = useState<string | null>(null);

  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSeqRef = useRef(0);
  const micCodecRef = useRef('audio/webm;codecs=opus');

  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const failedChunksRef = useRef<Array<QueuedMicChunk>>([]);

  const createFormData = (blob: Blob, seq: number) => {
    const fd = new FormData();
    fd.append('chunk', blob, `chunk_mic_audio_${seq}.webm`);
    return fd;
  };

  const reportDrop = useCallback((seq: number, reason: string) => {
    fetch(`/api/v1/sessions/${sessionId}/recordings/drop?seq=${seq}&kind=mic-audio&reason=${encodeURIComponent(reason)}`, {
      method: 'POST'
    }).catch(() => {});
  }, [sessionId]);

  const uploadChunk = useCallback(async (blob: Blob, seq: number) => {
    if (blob.size === 0) return;
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/recordings/chunk?seq=${seq}&kind=mic-audio`, {
        method: 'POST',
        body: createFormData(blob, seq)
      });
      if (res.ok) {
        setUploadedChunks((prev) => prev + 1);
      } else if (res.status === 413) {
        console.error(`Mic audio chunk ${seq} exceeds size limit. Discarding.`);
        reportDrop(seq, 'PAYLOAD_TOO_LARGE_413');
      } else {
        console.warn(`Mic audio chunk ${seq} upload failed (${res.status})`);
        failedChunksRef.current.push({ blob, seq, kind: 'mic-audio', retries: 0 });
        setUnsentCount(failedChunksRef.current.length);
      }
    } catch (err) {
      console.warn(`Mic audio chunk ${seq} network notice:`, err);
      failedChunksRef.current.push({ blob, seq, kind: 'mic-audio', retries: 0 });
      setUnsentCount(failedChunksRef.current.length);
    }
  }, [sessionId, reportDrop]);

  const retryFailedChunks = useCallback(async () => {
    if (failedChunksRef.current.length === 0) return;
    const candidates = [...failedChunksRef.current];
    for (const chunk of candidates) {
      if (chunk.retries >= 3) continue;
      try {
        const res = await fetch(`/api/v1/sessions/${sessionId}/recordings/chunk?seq=${chunk.seq}&kind=mic-audio`, {
          method: 'POST',
          body: createFormData(chunk.blob, chunk.seq)
        });
        if (res.ok) {
          setUploadedChunks((prev) => prev + 1);
          failedChunksRef.current = failedChunksRef.current.filter((c) => c.seq !== chunk.seq);
          setUnsentCount(failedChunksRef.current.length);
        } else {
          chunk.retries += 1;
        }
      } catch {
        chunk.retries += 1;
      }
    }
  }, [sessionId]);

  const markLost = useCallback((reason: string) => {
    setIsRecording(false);
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setLostAt((prev) => prev || hhmm);
    if (onInterrupted) {
      onInterrupted(reason);
    }
  }, [onInterrupted]);

  useEffect(() => {
    if (!sessionId || !enabled) return;

    let isCancelled = false;

    const startMicRecording = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          markLost('Microphone API not supported');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        micStreamRef.current = stream;

        // Monitor stream tracks for mid-session disconnection or permission revocation
        stream.getAudioTracks().forEach((track) => {
          track.onended = () => {
            console.warn('Microphone audio track ended mid-session');
            markLost('Microphone disconnected or permission revoked');
          };
        });

        const mime = pickAudioMime();
        micCodecRef.current = mime;

        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream, {
            mimeType: mime,
            audioBitsPerSecond: 64000
          });
        } catch {
          recorder = new MediaRecorder(stream);
        }

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            const seq = micSeqRef.current++;
            uploadQueueRef.current = uploadQueueRef.current.then(() => uploadChunk(e.data, seq));
          }
        };

        recorder.onerror = (e) => {
          console.error('Mic recorder error:', e);
          markLost('Microphone recorder error');
        };

        recorder.start(5000);
        micRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (err: any) {
        console.warn('Dedicated mic recording start notice:', err);
        markLost(err?.message || 'Microphone capture unavailable');
      }
    };

    void startMicRecording();

    return () => {
      isCancelled = true;
      if (micRecorderRef.current && micRecorderRef.current.state !== 'inactive') {
        try {
          micRecorderRef.current.stop();
        } catch (_) {}
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      micRecorderRef.current = null;
      micStreamRef.current = null;
      setIsRecording(false);
    };
  }, [sessionId, enabled, uploadChunk, markLost]);

  const finish = useCallback(async (): Promise<void> => {
    if (micRecorderRef.current && micRecorderRef.current.state !== 'inactive') {
      try {
        micRecorderRef.current.stop();
      } catch (_) {}
    }

    const queueDrain = uploadQueueRef.current;
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 15000));
    await Promise.race([queueDrain, timeout]);

    await retryFailedChunks();

    try {
      await fetch(`/api/v1/sessions/${sessionId}/recordings/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'mic-audio',
          attempted: micSeqRef.current,
          uploaded: uploadedChunks,
          failedSeqs: failedChunksRef.current.map((c) => c.seq),
          codec: micCodecRef.current,
          bitrateBps: 64000,
          qualityPreset: 'OPUS_64KBPS'
        })
      });
    } catch (_) {}
  }, [sessionId, uploadedChunks, retryFailedChunks]);

  return {
    isRecording,
    uploadedChunks,
    unsentCount,
    lostAt,
    finish
  };
}
