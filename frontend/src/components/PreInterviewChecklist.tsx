import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Camera,
  Mic,
  Wifi,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Server,
  Terminal,
  Monitor,
  Video
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Chip } from './ui/Chip';
import { FloatingAiOrb } from './ai/FloatingAiOrb';
import { AiAssistantPanel } from './ai/AiAssistantPanel';
import { sendTelemetryEvent, submitVerification, startSession } from '../services/api';
import { setScreenStream, setVerifyReceipt } from '../services/verificationStreams';
import {
  getStoredRecordingQuality,
  setStoredRecordingQuality,
  QUALITY_PRESETS,
  type RecordingQualityPreset
} from '../lib/recording-quality';

interface Props {
  sessionId: number;
  candidateId: string;
  roleTitle: string;
  sessionMode?: 'INTERVIEW' | 'PLAYGROUND';
  onProceed: () => void;
}

interface EngineCapability {
  ready: boolean;
  state?: 'ONLINE' | 'STARTING' | 'DOWN';
  detail?: string;
  lastReadyAt?: string | null;
}

interface SystemCapabilities {
  engines?: {
    dsa?: EngineCapability;
    lld?: EngineCapability;
    hld?: EngineCapability;
    behavioral?: EngineCapability;
    sql?: EngineCapability;
  };
  services?: Record<string, boolean>;
  storage?: { gridFsAttachmentCount: number; gridFsBytes: number };
  checkedAt?: string;
}

export const PreInterviewChecklist: React.FC<Props> = ({
  sessionId,
  roleTitle,
  sessionMode = 'INTERVIEW',
  onProceed
}) => {
  const isInterview = sessionMode === 'INTERVIEW';
  const [cameraOk, setCameraOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Screen share state
  const [screenOk, setScreenOk] = useState(false);
  const [screenScope, setScreenScope] = useState<'MONITOR' | 'WINDOW' | 'BROWSER' | 'UNKNOWN' | null>(null);
  const [screenLabel, setScreenLabel] = useState<string>('');
  const [screenError, setScreenError] = useState<string | null>(null);
  const [recordingQuality, setRecordingQuality] = useState<RecordingQualityPreset>(() => getStoredRecordingQuality());

  // D7 Network capability honesty
  const [networkOk, setNetworkOk] = useState(false);

  const [secondaryCameraConnected] = useState(false);
  const [singleCameraAcknowledged, setSingleCameraAcknowledged] = useState(false);
  const [consentGiven, setConsentGiven] = useState(!isInterview);
  const [envMode, setEnvMode] = useState<'dev' | 'prod'>('prod');
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(() => sessionStorage.getItem('ai.panel.checklist') === 'true');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraTelemetrySent = useRef(false);
  const micTelemetrySent = useRef(false);

  const toggleAiPanel = () => {
    setIsAiPanelOpen((prev) => {
      const next = !prev;
      sessionStorage.setItem('ai.panel.checklist', String(next));
      return next;
    });
  };

  // Dynamic host URL for the QR code
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const phoneProctorUrl = `http://${host}:5173/phone-proctor?session=${sessionId}`;

  useEffect(() => {
    // 1. Fetch system & sandbox capabilities from backend (D7 Network Chip probe)
    const fetchCapabilities = async () => {
      try {
        const resp = await fetch(`http://${host}:8080/api/v1/system/capabilities`);
        if (resp.ok) {
          const data = await resp.json();
          setCapabilities(data);
          setNetworkOk(true);
        } else {
          setNetworkOk(false);
        }
      } catch (err) {
        console.debug('Capabilities probe notice:', err);
        setNetworkOk(false);
      }
    };
    void fetchCapabilities();
    const pollInterval = setInterval(() => {
      void fetchCapabilities();
    }, 5000);

    // 2. Frontal webcam & microphone hardware setup
    let mediaStream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animFrame: number;

    const setupHardware = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: true
        });

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = mediaStream;
        }
        setCameraOk(true);
        if (!cameraTelemetrySent.current) {
          cameraTelemetrySent.current = true;
          void sendTelemetryEvent({
            sessionId,
            eventType: 'TAB_BLUR',
            metadataDetails: 'VERIFY_CAMERA_OK'
          });
        }

        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);
        analyser.fftSize = 256;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateAudioMeter = () => {
          if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
            if (average > 10) {
              setMicOk(true);
              if (!micTelemetrySent.current) {
                micTelemetrySent.current = true;
                void sendTelemetryEvent({
                  sessionId,
                  eventType: 'TAB_BLUR',
                  metadataDetails: 'VERIFY_MIC_OK'
                });
              }
            }
          }
          animFrame = requestAnimationFrame(updateAudioMeter);
        };
        updateAudioMeter();
      } catch (err) {
        console.warn('Hardware access note:', err);
      }
    };

    void setupHardware();

    return () => {
      clearInterval(pollInterval);
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        void audioContext.close();
      }
      cancelAnimationFrame(animFrame);
    };
  }, [host, sessionId]);

  // Handle Full Monitor Screen Share Acquisition
  const handleShareScreen = async () => {
    try {
      setScreenError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, min: 15 } } as any,
        audio: false,
        selfBrowserSurface: 'exclude'
      } as any);

      const track = stream.getVideoTracks()[0];
      if (!track) {
        throw new Error('No video track found in screen capture');
      }

      const settings = track.getSettings ? track.getSettings() : ({} as any);
      const displaySurface = (settings as any).displaySurface;

      if (displaySurface === 'monitor') {
        const label = track.label || 'Entire Screen';
        setScreenScope('MONITOR');
        setScreenLabel(label);
        setScreenOk(true);
        setScreenStream(stream);
        if (screenVideoPreviewRef.current) {
          screenVideoPreviewRef.current.srcObject = stream;
        }
        void sendTelemetryEvent({
          sessionId,
          eventType: 'TAB_BLUR',
          metadataDetails: 'VERIFY_SCREEN_OK scope=MONITOR'
        });
      } else if (displaySurface === 'window' || displaySurface === 'browser') {
        track.stop();
        setScreenOk(false);
        setScreenScope(displaySurface === 'window' ? 'WINDOW' : 'BROWSER');
        setScreenError('Window/tab sharing is not accepted â€” share your entire screen.');
        void sendTelemetryEvent({
          sessionId,
          eventType: 'TAB_BLUR',
          metadataDetails: `SHARE_SCOPE_REJECTED scope=${displaySurface}`
        });
        return;
      } else {
        // Display surface property unsupported (e.g. Firefox)
        const label = track.label || 'Screen';
        setScreenScope('UNKNOWN');
        setScreenLabel(label);
        setScreenOk(true);
        setScreenStream(stream);
        if (screenVideoPreviewRef.current) {
          screenVideoPreviewRef.current.srcObject = stream;
        }
        void sendTelemetryEvent({
          sessionId,
          eventType: 'TAB_BLUR',
          metadataDetails: 'VERIFY_SCREEN_OK scope=UNKNOWN'
        });
      }

      track.onended = () => {
        setScreenOk(false);
        setScreenStream(null);
        setScreenScope(null);
        if (screenVideoPreviewRef.current) {
          screenVideoPreviewRef.current.srcObject = null;
        }
      };
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        void sendTelemetryEvent({
          sessionId,
          eventType: 'TAB_BLUR',
          metadataDetails: 'VERIFY_SCREEN_DENIED'
        });
      } else {
        setScreenError(err.message || 'Failed to capture screen');
      }
    }
  };

  const handleStart = async () => {
    setIsSubmitting(true);
    setStartError(null);
    try {
      if (isInterview) {
        const receipt = await submitVerification(sessionId, {
          cameraOk,
          micOk,
          screenOk,
          screenScope: screenScope || 'UNKNOWN',
          screenLabel: screenLabel || 'Entire Screen',
          consent: consentGiven,
          outcome: 'VERIFIED',
          userAgent: navigator.userAgent
        });
        setVerifyReceipt(receipt);
      }
      await startSession(sessionId);
      if (!secondaryCameraConnected && singleCameraAcknowledged) {
        void sendTelemetryEvent({
          sessionId,
          eventType: 'TAB_BLUR',
          metadataDetails: 'SINGLE_CAMERA_ONLY_ACKNOWLEDGED: Candidate completed interview with single front camera; 45-degree angle unmonitored.'
        });
      }
      onProceed();
    } catch (err: any) {
      setStartError(err.message || 'Verification or session start failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevBypass = async () => {
    setIsSubmitting(true);
    setStartError(null);
    try {
      if (isInterview) {
        const receipt = await submitVerification(sessionId, {
          cameraOk: true,
          micOk: true,
          screenOk: true,
          screenScope: 'MONITOR',
          screenLabel: 'Dev Display',
          consent: true,
          outcome: 'DEV_BYPASS',
          userAgent: navigator.userAgent
        });
        setVerifyReceipt(receipt);
      }
      await startSession(sessionId);
      onProceed();
    } catch (err: any) {
      setStartError(err.message || 'Dev launch failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSecondarySatisfied = !isInterview || secondaryCameraConnected || singleCameraAcknowledged;
  const allChecksPassed = !isInterview || (cameraOk && micOk && screenOk && isSecondarySatisfied && consentGiven && networkOk);

  return (
    <div className="min-h-screen bg-bg text-text py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center select-text">
      <Card padding="lg" variant="default" className="w-full max-w-5xl space-y-6 border border-border">

        {/* Header & Mode Switcher */}
        <div className="border-b border-border pb-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-text" />
              <h1 className="text-xl font-bold text-text tracking-tight">Pre-Assessment System Verification</h1>
            </div>
            <p className="text-xs text-text-3 mt-1">
              Candidate Readiness Check for <strong className="text-text">{roleTitle}</strong> â€¢ Session #{sessionId}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-elevated p-1 rounded-md border border-border">
            <button
              type="button"
              onClick={() => setEnvMode('dev')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                envMode === 'dev'
                  ? 'bg-primary text-on-accent'
                  : 'text-text-3 hover:text-text'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Dev Mode
            </button>
            <button
              type="button"
              onClick={() => setEnvMode('prod')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                envMode === 'prod'
                  ? 'bg-elevated text-text border border-border'
                  : 'text-text-3 hover:text-text'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Production (Strict)
            </button>
          </div>
        </div>

        {/* Platform & Execution Sandboxes Readiness */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-text">
              <Server className="w-4 h-4 text-text-3" />
              <span>Platform Capability &amp; Sandbox Readiness</span>
            </div>
            <span className="text-[11px] text-text-3">
              {capabilities?.checkedAt ? `Last checked: ${new Date(capabilities.checkedAt).toLocaleTimeString()}` : 'Probing sandbox engines...'}
            </span>
          </div>

          {(() => {
            const isStarting =
              capabilities?.engines?.dsa?.state === 'STARTING' ||
              capabilities?.engines?.lld?.state === 'STARTING' ||
              capabilities?.engines?.sql?.state === 'STARTING';
            const startingDetails = [
              capabilities?.engines?.dsa?.state === 'STARTING' ? `DSA (${capabilities?.engines?.dsa?.detail || 'warming up'})` : null,
              capabilities?.engines?.lld?.state === 'STARTING' ? `Spring Boot LLD (${capabilities?.engines?.lld?.detail || 'warming up'})` : null,
              capabilities?.engines?.sql?.state === 'STARTING' ? `SQL (${capabilities?.engines?.sql?.detail || 'warming up'})` : null,
            ].filter(Boolean).join(' â€¢ ');

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-elevated p-2.5 rounded border border-border flex flex-col justify-between space-y-1">
                    <span className="text-[11px] font-semibold text-text-2">DSA Track</span>
                    <Chip
                      variant={
                        capabilities?.engines?.dsa?.ready
                          ? 'success'
                          : capabilities?.engines?.dsa?.state === 'STARTING'
                            ? 'warning'
                            : 'neutral'
                      }
                      size="sm"
                    >
                      {capabilities?.engines?.dsa?.ready
                        ? 'Judge0 Online'
                        : capabilities?.engines?.dsa?.state === 'STARTING'
                          ? 'Startingâ€¦'
                          : 'Sandbox Offline'}
                    </Chip>
                  </div>

                  <div className="bg-elevated p-2.5 rounded border border-border flex flex-col justify-between space-y-1">
                    <span className="text-[11px] font-semibold text-text-2">Spring Boot LLD</span>
                    <Chip
                      variant={
                        capabilities?.engines?.lld?.ready
                          ? 'success'
                          : capabilities?.engines?.lld?.state === 'STARTING'
                            ? 'warning'
                            : 'neutral'
                      }
                      size="sm"
                    >
                      {capabilities?.engines?.lld?.ready
                        ? 'Docker Maven Online'
                        : capabilities?.engines?.lld?.state === 'STARTING'
                          ? 'Startingâ€¦'
                          : 'Docker Offline'}
                    </Chip>
                  </div>

                  <div className="bg-elevated p-2.5 rounded border border-border flex flex-col justify-between space-y-1">
                    <span className="text-[11px] font-semibold text-text-2">System Design</span>
                    <Chip variant="neutral" size="sm">
                      Canvas &amp; Vision Ready
                    </Chip>
                  </div>

                  <div className="bg-elevated p-2.5 rounded border border-border flex flex-col justify-between space-y-1">
                    <span className="text-[11px] font-semibold text-text-2">Behavioral STAR</span>
                    <Chip variant="neutral" size="sm">
                      Neural Dialogue Ready
                    </Chip>
                  </div>
                </div>

                {capabilities && isStarting && (
                  <div className="bg-elevated border border-warning/30 rounded p-2.5 flex items-center justify-between flex-wrap gap-2 text-xs text-warning">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                      <span>Startingâ€¦ (engines warming up): {startingDetails || 'Initial probe in progress â€” auto re-polling every 5s'}</span>
                    </div>
                  </div>
                )}

                {capabilities && !isStarting && (!capabilities.engines?.dsa?.ready || !capabilities.engines?.lld?.ready) && (
                  <div className="bg-elevated border border-border rounded p-2.5 flex items-center justify-between flex-wrap gap-2 text-xs text-text-3">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-text-3 shrink-0" />
                      <span>To spin up local Judge0 and Docker Maven execution sandboxes:</span>
                    </div>
                    <code className="bg-surface px-2 py-1 rounded text-text font-mono text-[11px] border border-border">
                      docker compose --profile engines up -d
                    </code>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {envMode === 'dev' && (
          <div className="bg-elevated border border-border p-3.5 rounded-lg flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-text-2">
              <Cpu className="w-4 h-4 text-text-3 shrink-0" />
              <span><strong>Development Mode Active:</strong> Hardware and sandbox verification constraints can be bypassed for rapid testing.</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={handleDevBypass}
            >
              Instant Launch
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Left Column: Camera & Mic */}
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-bold text-text">
                  <Camera className="w-4 h-4 text-text-3" />
                  <span>1. Frontal Webcam Video</span>
                </div>
                <Chip variant={cameraOk ? 'success' : 'danger'} size="sm">
                  {cameraOk ? 'Active' : 'Access Required'}
                </Chip>
              </div>

              <div className="w-full h-36 bg-bg rounded-md overflow-hidden border border-border">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-bold text-text">
                  <Mic className="w-4 h-4 text-text-3" />
                  <span>2. Microphone Audio Input</span>
                </div>
                <Chip variant={micOk ? 'success' : 'neutral'} size="sm">
                  {micOk ? 'Audio Detected' : 'Speak to Test'}
                </Chip>
              </div>

              <div className="h-2.5 bg-elevated rounded-full overflow-hidden border border-border">
                <div
                  className={`h-full transition-all duration-100 rounded-full ${
                    audioLevel > 50 ? 'bg-success' : 'bg-primary'
                  }`}
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <span className="text-[11px] text-text-3 block">
                Say a sentence aloud to verify your microphone level.
              </span>
            </div>
          </div>

          {/* Right Column: Screen Share & Dual Camera */}
          <div className="space-y-4">
            {/* 3. Screen Share â€” Full Monitor */}
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-bold text-text">
                  <Monitor className="w-4 h-4 text-text-3" />
                  <span>3. Screen Share â€” Full Monitor</span>
                </div>
                <Chip
                  variant={
                    screenOk
                      ? screenScope === 'UNKNOWN'
                        ? 'warning'
                        : 'success'
                      : screenError
                        ? 'danger'
                        : 'neutral'
                  }
                  size="sm"
                >
                  {screenOk
                    ? screenScope === 'UNKNOWN'
                      ? 'Shared (unverified scope) â€” Flagged'
                      : `Monitor Shared â€” ${screenLabel || 'Entire Screen'}`
                    : screenError
                      ? 'Window/Tab Rejected'
                      : 'Not Shared'}
                </Chip>
              </div>

              {screenOk ? (
                <div className="space-y-2">
                  <div className="w-full h-36 bg-bg rounded-md overflow-hidden border border-border relative">
                    <video
                      ref={screenVideoPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain bg-black"
                    />
                  </div>
                  <p className="text-[11px] text-text-3">
                    Full monitor stream active. Screen will be recorded throughout the interview.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-text-3 leading-relaxed">
                    Mandatory: Select <strong>Entire Screen</strong> when prompted. Sharing a single window, application, or browser tab is rejected.
                  </p>
                  {screenError && (
                    <div className="p-2 rounded bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{screenError}</span>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleShareScreen}
                    icon={<Monitor className="w-3.5 h-3.5 text-primary" />}
                    className="w-full text-xs font-semibold"
                  >
                    {screenError ? 'Retry Screen Share' : 'Share My Screen'}
                  </Button>
                </div>
              )}
            </div>

            {/* Recording Quality Selector (D10) */}
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-bold text-text">
                  <Video className="w-4 h-4 text-text-3" />
                  <span>Recording Quality</span>
                </div>
                <span className="text-[10px] text-text-3 font-mono">
                  {QUALITY_PRESETS[recordingQuality]?.estSize10Min}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-elevated/60 border border-border rounded-lg">
                {(['COMPACT', 'BALANCED', 'READABLE', 'STUDIO'] as RecordingQualityPreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={isSubmitting || screenOk}
                    onClick={() => {
                      setRecordingQuality(preset);
                      setStoredRecordingQuality(preset);
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-all text-center ${
                      recordingQuality === preset
                        ? 'bg-primary text-on-accent shadow-sm'
                        : 'text-text-3 hover:text-text hover:bg-surface/60'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-3">
                {recordingQuality === 'READABLE' && 'Default high-clarity ladder (2.5â€“4.5 Mbps) â€” code text remains fully legible.'}
                {recordingQuality === 'COMPACT' && 'OBS-efficient tier (0.8â€“1.2 Mbps) â€” minimal storage impact, readable at 100% zoom.'}
                {recordingQuality === 'BALANCED' && 'Balanced rate (1.5â€“2.5 Mbps) â€” good text contrast with moderate file size.'}
                {recordingQuality === 'STUDIO' && 'Maximum fidelity (3.0â€“6.0 Mbps) â€” uncompressed text sharpness.'}
              </p>
            </div>

            {/* 4. Dual-Camera Phone Link */}
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-bold text-text">
                  <Camera className="w-4 h-4 text-text-3" />
                  <span>4. Dual-Camera Phone Link</span>
                </div>
                <Chip variant={secondaryCameraConnected ? 'success' : singleCameraAcknowledged ? 'warning' : 'neutral'} size="sm">
                  {secondaryCameraConnected ? 'Connected' : singleCameraAcknowledged ? 'Single-Camera Acknowledged' : 'Scan QR'}
                </Chip>
              </div>

              <div className="flex gap-4 items-center">
                <div className="bg-white p-1.5 rounded-md shrink-0">
                  <QRCodeSVG value={phoneProctorUrl} size={70} />
                </div>
                <div className="space-y-1 text-xs">
                  <p className="text-[11px] text-text-3 leading-relaxed">
                    Scan with phone on same Wi-Fi to stream 45Â° angle desk feed.
                  </p>
                  <label className="flex items-center gap-2 text-[11px] text-text-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={singleCameraAcknowledged}
                      onChange={(e) => setSingleCameraAcknowledged(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-border text-primary cursor-pointer"
                    />
                    <span>Proceed with single camera only (flags session)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 5. Network Connection (D7 Capabilities probe status) */}
            <div className="bg-surface border border-border rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-text">
                <Wifi className="w-4 h-4 text-text-3" />
                <span>5. Network Connection</span>
              </div>
              <Chip variant={networkOk ? 'success' : 'danger'} size="sm">
                {networkOk ? 'Backend Reachable' : 'Backend Unreachable'}
              </Chip>
            </div>
          </div>

        </div>

        {/* 6. Proctoring & Recording Consent */}
        <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <span className="text-xs font-semibold text-text">
              This session is recorded and proctored. I consent to video/audio recording, full-screen monitor capture, and AI integrity analysis.
            </span>
          </label>
          <Chip variant={consentGiven ? 'success' : 'danger'} size="sm">
            {consentGiven ? 'Consent Confirmed' : 'Consent Required'}
          </Chip>
        </div>

        {capabilities?.engines?.dsa && !capabilities.engines.dsa.ready && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-center gap-2.5 text-xs text-red-500 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <div className="flex-1">
              <strong>DSA Sandbox Offline:</strong> Check <code>judge0-workers</code> logs. ({capabilities.engines.dsa.detail || 'Service unreachable'})
            </div>
          </div>
        )}

        {startError && (
          <div className="bg-danger/10 border border-danger/30 p-3 rounded-lg flex items-center gap-2 text-xs text-danger">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{startError}</span>
          </div>
        )}

        {!allChecksPassed && envMode === 'prod' && (
          <div className="bg-elevated border border-warning/30 p-3 rounded-lg flex items-center gap-2 text-xs text-warning">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Please complete all checklist gates above (Webcam, Mic, Full-Screen Share, Secondary Camera/Acknowledgement, Consent, Network) to proceed.</span>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          disabled={!allChecksPassed || isSubmitting}
          loading={isSubmitting}
          onClick={handleStart}
          icon={<ArrowRight className="w-5 h-5" />}
          className="w-full"
        >
          {allChecksPassed ? 'All Systems Verified âž¡ï¸ Start Interview' : 'Complete Required Checklist Gates Above'}
        </Button>

      </Card>

      {/* FLOATING AI ORB & ASSISTANT PANEL */}
      <FloatingAiOrb
        isOpen={isAiPanelOpen}
        onToggle={toggleAiPanel}
        isAiSpeaking={false}
        hasUnread={false}
        stackAbove="none"
      />

      <AiAssistantPanel
        open={isAiPanelOpen}
        onClose={() => {
          setIsAiPanelOpen(false);
          sessionStorage.setItem('ai.panel.checklist', 'false');
        }}
        mode="intro"
        personaName="Dr. Anya Chen"
        personaTitle="AI Principal Bar Raiser"
        currentStage="System Verification"
        stackAbove="none"
      />
    </div>
  );
};
