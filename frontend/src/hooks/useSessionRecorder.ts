import { useEffect, useRef, useState, useCallback } from 'react';

export type StreamKind = 'camera' | 'screen';

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
  recordScreen?: boolean;
}

export function useSessionRecorder({
  sessionId,
  isPlayground = false,
  onInterrupted,
  recordScreen = false
}: UseSessionRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [recordingInterrupted, setRecordingInterrupted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);

  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraSeqRef = useRef(0);

  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenSeqRef = useRef(0);

  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const failedChunksRef = useRef<Array<QueuedChunk>>([]);

  const createFormData = (blob: Blob, seq: number) => {
    const formData = new FormData();
    formData.append('chunk', blob, `chunk_${seq}.webm`);
    return formData;
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
        setUploadedChunks((prev) => prev + 1);
      } else if (res.status === 413) {
        console.error(`Recording ${kind} chunk ${seq} exceeds size limit. Discarding and recording drop.`);
        reportDrop(seq, kind, 'PAYLOAD_TOO_LARGE_413');
      } else {
        console.warn(`Recording ${kind} chunk ${seq} upload failed with status ${res.status}, queuing for retry`);
        failedChunksRef.current.push({ blob, seq, kind, retries: 0 });
      }
    } catch (err) {
      console.warn(`Recording ${kind} chunk ${seq} network notice, queuing for retry:`, err);
      failedChunksRef.current.push({ blob, seq, kind, retries: 0 });
    }
  }, [sessionId, reportDrop]);

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
          setUploadedChunks((prev) => prev + 1);
          failedChunksRef.current = failedChunksRef.current.filter(
            (c) => !(c.seq === chunk.seq && c.kind === chunk.kind)
          );
        } else if (res.status === 413) {
          console.error(`Retried chunk ${chunk.seq} (${chunk.kind}) returned 413 limit. Dropping from retry queue.`);
          reportDrop(chunk.seq, chunk.kind, 'PAYLOAD_TOO_LARGE_413');
          failedChunksRef.current = failedChunksRef.current.filter(
            (c) => !(c.seq === chunk.seq && c.kind === chunk.kind)
          );
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
    const retryInterval = setInterval(() => {
      void retryFailedChunks();
    }, 8000);
    return () => clearInterval(retryInterval);
  }, [sessionId, isPlayground, retryFailedChunks]);

  const pickMime = () => {
    return MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';
  };

  const startScreenShare = useCallback(async () => {
    if (!recordScreen || screenRecorderRef.current || screenActive) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 8 },
        audio: false
      });
      screenStreamRef.current = screenStream;
      const screenRec = new MediaRecorder(screenStream, {
        mimeType: pickMime(),
        videoBitsPerSecond: 400000
      });
      screenRecorderRef.current = screenRec;

      screenRec.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          const seq = screenSeqRef.current++;
          const blob = event.data;
          uploadQueueRef.current = uploadQueueRef.current.then(() => uploadChunk(blob, seq, 'screen'));
        }
      };

      screenStream.getVideoTracks()[0].onended = () => {
        if (screenRec.state !== 'inactive') {
          try { screenRec.stop(); } catch {}
        }
        screenRecorderRef.current = null;
        screenStreamRef.current = null;
        setScreenActive(false);
      };

      screenRec.start(5000);
      setScreenActive(true);
    } catch (err) {
      console.warn('Screen recording consent denied or cancelled:', err);
      setScreenActive(false);
    }
  }, [recordScreen, screenActive, uploadChunk]);

  useEffect(() => {
    if (isPlayground || !sessionId) return;

    let timer: any;
    let isCancelled = false;

    const startRecording = async () => {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, frameRate: 15 },
          audio: true
        });

        if (isCancelled) {
          cameraStream.getTracks().forEach((t) => t.stop());
          return;
        }

        cameraStreamRef.current = cameraStream;
        const cameraRec = new MediaRecorder(cameraStream, {
          mimeType: pickMime(),
          videoBitsPerSecond: 400000
        });
        cameraRecorderRef.current = cameraRec;

        cameraRec.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            const seq = cameraSeqRef.current++;
            const blob = event.data;
            uploadQueueRef.current = uploadQueueRef.current.then(() => uploadChunk(blob, seq, 'camera'));
          }
        };

        cameraRec.onerror = (event: any) => {
          console.error('Camera MediaRecorder error:', event);
          setRecordingInterrupted(true);
          if (onInterrupted) onInterrupted('Camera recording error');
        };

        cameraRec.onstop = () => {
          setCameraActive(false);
        };

        cameraRec.start(5000);
        setCameraActive(true);
        setIsRecording(true);

        timer = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err: any) {
        console.warn('Session camera recording initial capture notice:', err);
        setRecordingInterrupted(true);
        if (onInterrupted) onInterrupted(err.message || 'Webcam feed unavailable for recording');
      }
    };

    void startRecording();

    return () => {
      isCancelled = true;
      clearInterval(timer);
      [cameraRecorderRef, screenRecorderRef].forEach((ref) => {
        if (ref.current && ref.current.state !== 'inactive') {
          try { ref.current.stop(); } catch {}
        }
      });
      [cameraStreamRef, screenStreamRef].forEach((ref) => {
        if (ref.current) {
          ref.current.getTracks().forEach((t) => t.stop());
        }
      });
      screenRecorderRef.current = null;
      screenStreamRef.current = null;
      setIsRecording(false);
      setCameraActive(false);
      setScreenActive(false);
    };
  }, [sessionId, isPlayground, onInterrupted, uploadChunk]);

  return {
    isRecording,
    recordingSeconds,
    uploadedChunks,
    recordingInterrupted,
    cameraActive,
    screenActive,
    startScreenShare
  };
}
