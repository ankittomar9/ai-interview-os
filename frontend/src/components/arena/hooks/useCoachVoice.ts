import { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudio } from '../../../services/api';

function encodePcm16Wav(samples: Float32Array, sampleRate = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

async function convertBlobTo16kHzWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return blob;
  const audioCtx = new AudioContextClass();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const targetSampleRate = 16000;
    const targetFrames = Math.ceil(audioBuffer.duration * targetSampleRate);
    if (targetFrames === 0) return blob;
    const offlineCtx = new OfflineAudioContext(1, targetFrames, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);
    const rendered = await offlineCtx.startRendering();
    return encodePcm16Wav(rendered.getChannelData(0), targetSampleRate);
  } finally {
    try { void audioCtx.close(); } catch {}
  }
}

// SPEC-008: Endpointing pacing hygiene: 2.0s sustained silence window before finalizing candidate speech turn.
// Note: This is pacing hygiene for natural pauses, NOT a flow-advance timer.
const ENDPOINTING_PACING_SILENCE_MS = 2000;

interface UseCoachVoiceProps {
  onCandidateSpeechFinal?: (text: string) => void;
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
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const onCandidateSpeechFinalRef = useRef(onCandidateSpeechFinal);
  onCandidateSpeechFinalRef.current = onCandidateSpeechFinal;
  const onCandidateSpeechPartialSalvageRef = useRef(onCandidateSpeechPartialSalvage);
  onCandidateSpeechPartialSalvageRef.current = onCandidateSpeechPartialSalvage;
  const apiKeyRef = useRef(apiKey);
  apiKeyRef.current = apiKey;
  const promptContextRef = useRef(promptContext);
  promptContextRef.current = promptContext;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const shouldListenRef = useRef(false);
  const isAiSpeakingRef = useRef(false);
  const ttsEndedAtRef = useRef<number>(0);
  const sessionOverlappedAiRef = useRef<boolean>(false);
  const interimTranscriptRef = useRef<string>('');
  const endpointTimerRef = useRef<any>(null);
  const pendingFinalSpeechRef = useRef<string>('');

  const toggleAiPanel = useCallback(() => setIsAiPanelOpen((prev) => !prev), []);
  const clearMicError = useCallback(() => setMicError(null), []);

  const speakText = useCallback((text: string) => {
    if (!voiceOutputEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\`\`\`[\s\S]*?\`\`\`/g, '').replace(/[*_#\`]/g, '').replace(/\n+/g, ' ').trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => {
      setIsSpeakingNow(true);
      setIsAiSpeaking(true);
      isAiSpeakingRef.current = true;
      sessionOverlappedAiRef.current = true;

      if (endpointTimerRef.current) {
        clearTimeout(endpointTimerRef.current);
        endpointTimerRef.current = null;
      }

      // Salvage pre-TTS captured speech (both pending committed and interim)
      const preSpeech = (pendingFinalSpeechRef.current + ' ' + interimTranscriptRef.current).trim();
      if (preSpeech) {
        onCandidateSpeechPartialSalvageRef.current?.(preSpeech);
        pendingFinalSpeechRef.current = '';
        interimTranscriptRef.current = '';
        setInterimTranscript('');
      }

      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        const preChunks = [...audioChunksRef.current];
        audioChunksRef.current = [];
        try { mediaRecorderRef.current.stop(); } catch {}
        if (preChunks.length > 0) {
          void (async () => {
            try {
              const rawBlob = new Blob(preChunks, { type: 'audio/webm' });
              let uploadBlob: Blob = rawBlob;
              try { uploadBlob = await convertBlobTo16kHzWav(rawBlob); } catch {}
              const result = await transcribeAudio(uploadBlob, apiKeyRef.current, promptContextRef.current, sessionIdRef.current);
              const salvagedText = (result as any).transcript || (result as any).text;
              if (salvagedText && salvagedText.trim()) {
                onCandidateSpeechPartialSalvageRef.current?.(salvagedText.trim());
              }
            } catch (err) {
              console.warn('[useCoachVoice] Pre-TTS salvage transcription notice:', err);
            }
          })();
        }
      }
    };
    utterance.onend = () => {
      ttsEndedAtRef.current = Date.now();
      setIsSpeakingNow(false);
      setIsAiSpeaking(false);
      isAiSpeakingRef.current = false;
    };
    utterance.onerror = () => {
      ttsEndedAtRef.current = Date.now();
      setIsSpeakingNow(false);
      setIsAiSpeaking(false);
      isAiSpeakingRef.current = false;
    };
    window.speechSynthesis.speak(utterance);
  }, [voiceOutputEnabled]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (endpointTimerRef.current) {
      clearTimeout(endpointTimerRef.current);
      endpointTimerRef.current = null;
    }
    pendingFinalSpeechRef.current = '';
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;
    shouldListenRef.current = true;
    setMicError(null);
    setInterimTranscript('');

    if (window.speechSynthesis?.speaking || isAiSpeakingRef.current || (Date.now() - ttsEndedAtRef.current < 750)) {
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onstart = () => {
          sessionOverlappedAiRef.current = false;
          setIsListening(true);
          setMicError(null);
        };
        recognition.onresult = (event: any) => {
          if (window.speechSynthesis?.speaking || isAiSpeakingRef.current || sessionOverlappedAiRef.current) {
            if (endpointTimerRef.current) {
              clearTimeout(endpointTimerRef.current);
              endpointTimerRef.current = null;
            }
            pendingFinalSpeechRef.current = '';
            interimTranscriptRef.current = '';
            setInterimTranscript('');
            return;
          }
          let interim = '';
          let finalStr = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const tr = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) finalStr += tr + ' ';
            else interim += tr + ' ';
          }

          if (finalStr.trim()) {
            pendingFinalSpeechRef.current = (pendingFinalSpeechRef.current + ' ' + finalStr.trim()).trim();
          }

          const combinedDisplay = [pendingFinalSpeechRef.current, interim.trim()].filter(Boolean).join(' ');
          interimTranscriptRef.current = combinedDisplay;
          if (combinedDisplay) setInterimTranscript(combinedDisplay);

          if (endpointTimerRef.current) {
            clearTimeout(endpointTimerRef.current);
            endpointTimerRef.current = null;
          }

          if (pendingFinalSpeechRef.current) {
            // ENDPOINTING PACING HYGIENE (SPEC-008): 2.0s silence window before finalizing speech utterance. NOT a flow-advance timer.
            endpointTimerRef.current = setTimeout(() => {
              const textToCommit = pendingFinalSpeechRef.current.trim();
              pendingFinalSpeechRef.current = '';
              interimTranscriptRef.current = '';
              setInterimTranscript('');
              if (textToCommit && !isAiSpeakingRef.current && !sessionOverlappedAiRef.current) {
                onCandidateSpeechFinalRef.current?.(textToCommit);
              }
            }, ENDPOINTING_PACING_SILENCE_MS);
          }
        };
        recognition.onerror = (event: any) => {
          const err = event.error;
          if (err === 'not-allowed' || err === 'service-not-allowed') setMicError('Mic blocked — allow permission');
          else if (err === 'no-speech') setMicError('No speech detected');
          else if (err !== 'aborted') setMicError(`Mic error: ${err}`);
          setIsListening(false);
          setInterimTranscript('');
        };
        recognition.onend = () => {
          recognitionRef.current = null;
          setIsListening(false);
          setInterimTranscript('');
        };
        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err) {
        console.warn('[useCoachVoice] SpeechRecognition fallback:', err);
      }
    }

    try {
      if (window.speechSynthesis?.speaking || isAiSpeakingRef.current) {
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });
      if (window.speechSynthesis?.speaking || isAiSpeakingRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.ondataavailable = (e) => {
        if (window.speechSynthesis?.speaking || isAiSpeakingRef.current) {
          return; // Discard audio chunk if AI is speaking
        }
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (window.speechSynthesis?.speaking || isAiSpeakingRef.current) {
          audioChunksRef.current = [];
          setIsListening(false);
          setInterimTranscript('');
          return; // Discard recording if AI is speaking
        }
        if (audioChunksRef.current.length > 0) {
          const rawBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (rawBlob.size > 50 * 1024 * 1024) {
            setMicError('Recording too long (>50MB)');
            return;
          }
          let uploadBlob: Blob = rawBlob;
          try {
            uploadBlob = await convertBlobTo16kHzWav(rawBlob);
          } catch (convErr) {
            console.warn('[useCoachVoice] 16kHz WAV conversion notice, uploading webm fallback:', convErr);
          }
          try {
            setInterimTranscript('Transcribing speech...');
            const result = await transcribeAudio(uploadBlob, apiKeyRef.current, promptContextRef.current, sessionIdRef.current);
            const text = (result as any).transcript || (result as any).text;
            if (text && text.trim()) onCandidateSpeechFinalRef.current?.(text.trim());
            else setMicError('No speech detected');
          } catch {
            setMicError('Transcription failed');
          } finally {
            setInterimTranscript('');
          }
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch {
      setMicError('Mic blocked — allow permission');
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else void startListening();
  }, [isListening, startListening, stopListening]);

  // SPEC-007: Acoustic duplex guard — monitor TTS state and pause recognition while AI speaks
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const checkSpeaking = () => {
      const speaking = Boolean(window.speechSynthesis && window.speechSynthesis.speaking);
      setIsAiSpeaking(speaking);
      isAiSpeakingRef.current = speaking;

      if (speaking) {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
          recognitionRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try { mediaRecorderRef.current.stop(); } catch {}
          audioChunksRef.current = [];
        }
      } else if (
        shouldListenRef.current &&
        !isListening &&
        !recognitionRef.current &&
        (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') &&
        (Date.now() - ttsEndedAtRef.current >= 750)
      ) {
        void startListening();
      }
    };

    const interval = setInterval(checkSpeaking, 100);
    return () => clearInterval(interval);
  }, [isListening, startListening]);

  useEffect(() => () => {
    stopListening();
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }, [stopListening]);

  return {
    isAiPanelOpen,
    setIsAiPanelOpen,
    toggleAiPanel,
    voiceOutputEnabled,
    setVoiceOutputEnabled,
    isListening,
    isSpeakingNow,
    isAiSpeaking,
    interimTranscript,
    micError,
    clearMicError,
    speakText,
    startListening,
    stopListening,
    toggleListening
  };
}
