import { useEffect, useRef, useState, useCallback } from 'react';

interface UseSessionRecorderProps {
  sessionId: number;
  isPlayground?: boolean;
  onInterrupted?: (reason: string) => void;
}

export function useSessionRecorder({
  sessionId,
  isPlayground = false,
  onInterrupted
}: UseSessionRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [recordingInterrupted, setRecordingInterrupted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const seqRef = useRef(0);
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());

  const uploadChunk = useCallback(async (blob: Blob, seq: number) => {
    if (blob.size === 0) return;
    const formData = new FormData();
    formData.append('chunk', blob, `chunk_${seq}.webm`);
    formData.append('seq', String(seq));

    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/recordings/chunk?seq=${seq}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setUploadedChunks((prev) => prev + 1);
      } else {
        console.warn(`Recording chunk ${seq} upload failed with status ${res.status}`);
      }
    } catch (err) {
      console.warn(`Recording chunk ${seq} network notice:`, err);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isPlayground || !sessionId) return;

    let timer: any;
    let isCancelled = false;

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, frameRate: 15 },
          audio: true
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm';

        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 400000 });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            const currentSeq = seqRef.current++;
            const blob = event.data;
            uploadQueueRef.current = uploadQueueRef.current.then(() => uploadChunk(blob, currentSeq));
          }
        };

        recorder.onerror = (event: any) => {
          console.error('MediaRecorder error event:', event);
          setRecordingInterrupted(true);
          if (onInterrupted) onInterrupted('MediaRecorder runtime exception');
        };

        recorder.onstop = () => {
          setIsRecording(false);
        };

        recorder.start(5000); // 5000ms timeslice chunks
        setIsRecording(true);

        timer = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err: any) {
        console.warn('Session recording initial capture notice:', err);
        setRecordingInterrupted(true);
        if (onInterrupted) onInterrupted(err.message || 'Webcam feed unavailable for recording');
      }
    };

    void startRecording();

    return () => {
      isCancelled = true;
      clearInterval(timer);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [sessionId, isPlayground, onInterrupted, uploadChunk]);

  return {
    isRecording,
    recordingSeconds,
    uploadedChunks,
    recordingInterrupted
  };
}
