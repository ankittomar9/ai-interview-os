import { useEffect, useRef, useState, useCallback } from 'react';
import { getScreenStream, clearVerificationStreams } from '../services/verificationStreams';
import {
  getStoredRecordingQuality,
  computeScreenBitrate,
  QUALITY_PRESETS
} from '../lib/recording-quality';

export type StreamKind = 'camera' | 'screen' | 'mic-audio';

interface QueuedChunk {
  blob: Blob;
  seq: number;
  kind: StreamKind;
  retries: number;
}

interface UseSessionRecorderProps {
  sessionId: number;
  isPlayground?: boolean;
  onInterrupted?: (reason: string) => void;
  onShareLost?: () => void;
}

export const pickMime = (hasAudio: boolean = false): string => {
  const candidates = hasAudio
    ? [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8',
        'video/webm'
      ]
    : [
        'video/webm;codecs=vp9',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return 'video/webm';
};

export function useSessionRecorder({
  sessionId,
  isPlayground = false,
  onInterrupted,
  onShareLost
}: UseSessionRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [recordingInterrupted, setRecordingInterrupted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [verificationBroken, setVerificationBroken] = useState(false);
  const [failedChunkCount, setFailedChunkCount] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const qualityPreset = getStoredRecordingQuality();

  const onInterruptedRef = useRef(onInterrupted);
  onInterruptedRef.current = onInterrupted;
  const onShareLostRef = useRef(onShareLost);
  onShareLostRef.current = onShareLost;
  const uploadedByKindRef = useRef<{ camera: number; screen: number; 'mic-audio': number }>({
    camera: 0,
    screen: 0,
    'mic-audio': 0
  });

  const screenWidthRef = useRef<number>(1920);
  const screenHeightRef = useRef<number>(1080);
  const screenBitrateRef = useRef<number>(2500000);
  const screenCodecRef = useRef<string>('video/webm');

  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraSeqRef = useRef(0);

  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenSeqRef = useRef(0);

  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const failedChunksRef = useRef<Array<QueuedChunk>>([]);

  const createFormData = (blob: Blob, seq: number) => {
    const fd = new FormData();
    fd.append('chunk', blob, `chunk_${seq}.webm`);
    return fd;
  };

  const reportDrop = useCallback((seq: number, kind: StreamKind, reason: string) => {
    fetch(`/api/v1/sessions/${sessionId}/recordings/drop?seq=${seq}&kind=${kind}&reason=${encodeURIComponent(reason)}`, {
      method: 'POST'
    }).catch(() => {});
  }, [sessionId]);

  const uploadChunk = useCallback(async (blob: Blob, seq: number, kind: StreamKind) => {
    if (blob.size === 0) return;
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/recordings/chunk?seq=${seq}&kind=${kind}`, {
        method: 'POST',
        body: createFormData(blob, seq)
      });
      if (res.ok) {
        uploadedByKindRef.current[kind] = (uploadedByKindRef.current[kind] || 0) + 1;
        setUploadedChunks((prev) => prev + 1);
      } else if (res.status === 413) {
        console.error(`Recording ${kind} chunk ${seq} exceeds size limit. Discarding.`);
        reportDrop(seq, kind, 'PAYLOAD_TOO_LARGE_413');
      } else {
        console.warn(`Recording ${kind} chunk ${seq} upload failed (${res.status})`);
        failedChunksRef.current.push({ blob, seq, kind, retries: 0 }); setFailedChunkCount(failedChunksRef.current.length);
      }
    } catch (err) {
      console.warn(`Recording ${kind} chunk ${seq} network notice:`, err);
      failedChunksRef.current.push({ blob, seq, kind, retries: 0 }); setFailedChunkCount(failedChunksRef.current.length);
    }
  }, [sessionId, reportDrop]);

  const uploadChunkRef = useRef(uploadChunk);
  uploadChunkRef.current = uploadChunk;

  const retryFailedChunks = useCallback(async () => {
    if (failedChunksRef.current.length === 0) return;
    const candidates = [...failedChunksRef.current];
    for (const chunk of candidates) {
      if (chunk.retries >= 3) continue;
      try {
        const res = await fetch(`/api/v1/sessions/${sessionId}/recordings/chunk?seq=${chunk.seq}&kind=${chunk.kind}`, {
          method: 'POST',
          body: createFormData(chunk.blob, chunk.seq)
        });
        if (res.ok) {
          uploadedByKindRef.current[chunk.kind] = (uploadedByKindRef.current[chunk.kind] || 0) + 1;
          setUploadedChunks((prev) => prev + 1);
          failedChunksRef.current = failedChunksRef.current.filter((c) => !(c.seq === chunk.seq && c.kind === chunk.kind)); setFailedChunkCount(failedChunksRef.current.length);
        } else if (res.status === 413) {
          reportDrop(chunk.seq, chunk.kind, 'PAYLOAD_TOO_LARGE_413');
          failedChunksRef.current = failedChunksRef.current.filter((c) => !(c.seq === chunk.seq && c.kind === chunk.kind)); setFailedChunkCount(failedChunksRef.current.length);
        } else {
          chunk.retries++;
        }
      } catch {
        chunk.retries++;
      }
    }
  }, [sessionId, reportDrop]);

  useEffect(() => {
    if (isPlayground || !sessionId) return;
    const retryInterval = setInterval(() => { void retryFailedChunks(); }, 8000);
    return () => clearInterval(retryInterval);
  }, [sessionId, isPlayground, retryFailedChunks]);

  const attachScreenStream = useCallback((stream: MediaStream) => {
    if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
      try { screenRecorderRef.current.stop(); } catch (_) {}
    }
    screenStreamRef.current = stream;
    try {
      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings() || {};
      const height = settings.height || 1080;
      const width = settings.width || 1920;
      screenWidthRef.current = width;
      screenHeightRef.current = height;
      const { bitrateBps, isCapped } = computeScreenBitrate(height, qualityPreset);
      screenBitrateRef.current = bitrateBps;
      const hasAudio = typeof stream.getAudioTracks === 'function' && stream.getAudioTracks().length > 0;
      const mime = pickMime(hasAudio);
      screenCodecRef.current = mime;
      console.info(`[useSessionRecorder] Screen attach: preset=${qualityPreset}, ${width}x${height}, bitrate=${bitrateBps} bps${isCapped ? ' (capped by operator)' : ''}, codec=${mime}`);

      const screenRec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrateBps });
      screenRecorderRef.current = screenRec;

      screenRec.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          const seq = screenSeqRef.current++;
          const blob = event.data;
          uploadQueueRef.current = uploadQueueRef.current.then(() => uploadChunkRef.current(blob, seq, 'screen'));
        }
      };

      if (track) {
        track.onended = () => {
          if (screenRec.state !== 'inactive') try { screenRec.stop(); } catch (_) {}
          screenRecorderRef.current = null;
          screenStreamRef.current = null;
          setScreenActive(false);
          onShareLostRef.current?.();
        };
      }

      screenRec.start(5000);
      setScreenActive(true);
      setVerificationBroken(false);
    } catch (err) {
      console.warn('Failed to start screen recorder on stream:', err);
      setScreenActive(false);
      setVerificationBroken(true);
    }
  }, [qualityPreset]);

  const attachScreenStreamRef = useRef(attachScreenStream);
  attachScreenStreamRef.current = attachScreenStream;

  useEffect(() => {
    if (isPlayground || !sessionId) return;
    let timer: any;
    let isCancelled = false;

    const preScreen = getScreenStream();
    if (preScreen && preScreen.active && preScreen.getVideoTracks().some((t) => t.readyState === 'live')) {
      attachScreenStreamRef.current(preScreen);
    } else {
      setVerificationBroken(true);
      onInterruptedRef.current?.('VERIFICATION_STREAM_MISSING');
    }

    const startRecording = async () => {
      try {
        const qConfig = QUALITY_PRESETS[qualityPreset] || QUALITY_PRESETS.READABLE;
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: qConfig.cameraWidth }, height: { ideal: qConfig.cameraHeight }, frameRate: { ideal: qConfig.cameraFps } },
          audio: false
        });
        if (isCancelled) {
          cameraStream.getTracks().forEach((t) => t.stop());
          return;
        }

        cameraStreamRef.current = cameraStream;
        const hasAudio = typeof cameraStream.getAudioTracks === 'function' && cameraStream.getAudioTracks().length > 0;
        const camMime = pickMime(hasAudio);
        const cameraRec = new MediaRecorder(cameraStream, { mimeType: camMime, videoBitsPerSecond: qConfig.cameraBps });
        cameraRecorderRef.current = cameraRec;

        cameraRec.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            const seq = cameraSeqRef.current++;
            const blob = event.data;
            uploadQueueRef.current = uploadQueueRef.current.then(() => uploadChunkRef.current(blob, seq, 'camera'));
          }
        };

        cameraRec.onerror = (event: any) => {
          console.error('Camera MediaRecorder error:', event);
          setRecordingInterrupted(true);
          onInterruptedRef.current?.('Camera recording error');
        };

        cameraRec.onstop = () => { setCameraActive(false); };
        cameraRec.start(5000);
        setCameraActive(true);
        setIsRecording(true);

        timer = setInterval(() => { setRecordingSeconds((prev) => prev + 1); }, 1000);
      } catch (err: any) {
        console.warn('Session camera recording capture notice:', err);
        setCameraError(err.message || 'Webcam feed unavailable for recording');
        setRecordingInterrupted(true);
        onInterruptedRef.current?.(err.message || 'Webcam feed unavailable for recording');
      }
    };

    void startRecording();

    return () => {
      isCancelled = true;
      clearInterval(timer);
      [cameraRecorderRef, screenRecorderRef].forEach((ref) => {
        if (ref.current && ref.current.state !== 'inactive') try { ref.current.stop(); } catch (_) {}
      });
      [cameraStreamRef, screenStreamRef].forEach((ref) => {
        if (ref.current) ref.current.getTracks().forEach((t) => t.stop());
      });
      screenRecorderRef.current = null;
      screenStreamRef.current = null;
      setIsRecording(false);
      setCameraActive(false);
      setScreenActive(false);
      clearVerificationStreams();
    };
  }, [sessionId, isPlayground]);

  const finish = useCallback(async (): Promise<void> => {
    if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
      try { screenRecorderRef.current.stop(); } catch (_) {}
    }
    if (cameraRecorderRef.current && cameraRecorderRef.current.state !== 'inactive') {
      try { cameraRecorderRef.current.stop(); } catch (_) {}
    }

    // Allow final MediaRecorder.ondataavailable events from .stop() to enqueue into uploadQueueRef
    await new Promise<void>((resolve) => setTimeout(resolve, 150));

    const queueDrain = uploadQueueRef.current;
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 15000));
    await Promise.race([queueDrain, timeout]);

    await retryFailedChunks();

    try {
      await fetch(`/api/v1/sessions/${sessionId}/recordings/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'screen',
          attempted: screenSeqRef.current,
          uploaded: uploadedByKindRef.current.screen,
          failedSeqs: failedChunksRef.current.filter((c) => c.kind === 'screen').map((c) => c.seq),
          codec: screenCodecRef.current,
          width: screenWidthRef.current,
          height: screenHeightRef.current,
          bitrateBps: screenBitrateRef.current,
          qualityPreset
        })
      });
      await fetch(`/api/v1/sessions/${sessionId}/recordings/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'camera',
          attempted: cameraSeqRef.current,
          uploaded: uploadedByKindRef.current.camera,
          failedSeqs: failedChunksRef.current.filter((c) => c.kind === 'camera').map((c) => c.seq),
          qualityPreset
        })
      });
    } catch (_) {}
  }, [sessionId, qualityPreset, retryFailedChunks]);

  return {
    isRecording,
    recordingSeconds,
    uploadedChunks,
    recordingInterrupted,
    failedChunkCount,
    cameraActive,
    cameraError,
    screenActive,
    verificationBroken,
    attachScreenStream,
    finish
  };
}
