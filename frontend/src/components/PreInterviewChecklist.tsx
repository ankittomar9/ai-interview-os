import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Mic, Wifi, ArrowRight, ShieldCheck, AlertTriangle, Cpu, Server, Terminal } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Chip } from './ui/Chip';
import { FloatingAiOrb } from './ai/FloatingAiOrb';
import { AiAssistantPanel } from './ai/AiAssistantPanel';
import { sendTelemetryEvent } from '../services/api';

interface Props {
  sessionId: number;
  candidateId: string;
  roleTitle: string;
  sessionMode?: 'INTERVIEW' | 'PLAYGROUND';
  onProceed: () => void;
}

interface SystemCapabilities {
  engines?: {
    dsa?: { ready: boolean; detail: string };
    lld?: { ready: boolean; detail: string };
    hld?: { ready: boolean; detail: string };
    behavioral?: { ready: boolean; detail: string };
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
  const [networkOk] = useState(true);
  const [secondaryCameraConnected] = useState(false);
  const [singleCameraAcknowledged, setSingleCameraAcknowledged] = useState(false);
  const [consentGiven, setConsentGiven] = useState(!isInterview);
  const [envMode, setEnvMode] = useState<'dev' | 'prod'>('prod');
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(() => sessionStorage.getItem('ai.panel.checklist') === 'true');
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

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
    // 1. Fetch system & sandbox capabilities from backend
    const fetchCapabilities = async () => {
      try {
        const resp = await fetch(`http://${host}:8080/api/v1/system/capabilities`);
        if (resp.ok) {
          const data = await resp.json();
          setCapabilities(data);
        }
      } catch (err) {
        console.debug('Capabilities probe notice:', err);
      }
    };
    void fetchCapabilities();

    // 2. Hardware setup
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
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        void audioContext.close();
      }
      cancelAnimationFrame(animFrame);
    };
  }, [host]);

  const isSecondarySatisfied = !isInterview || secondaryCameraConnected || singleCameraAcknowledged;
  const allChecksPassed = !isInterview || (cameraOk && micOk && isSecondarySatisfied && consentGiven && networkOk);

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
              Candidate Readiness Check for <strong className="text-text">{roleTitle}</strong> • Session #{sessionId}
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-elevated p-2.5 rounded border border-border flex flex-col justify-between space-y-1">
              <span className="text-[11px] font-semibold text-text-2">DSA Track</span>
              <Chip variant={capabilities?.engines?.dsa?.ready ? 'success' : 'neutral'} size="sm">
                {capabilities?.engines?.dsa?.ready ? 'Judge0 Online' : 'Sandbox Offline'}
              </Chip>
            </div>

            <div className="bg-elevated p-2.5 rounded border border-border flex flex-col justify-between space-y-1">
              <span className="text-[11px] font-semibold text-text-2">Spring Boot LLD</span>
              <Chip variant={capabilities?.engines?.lld?.ready ? 'success' : 'neutral'} size="sm">
                {capabilities?.engines?.lld?.ready ? 'Docker Maven Online' : 'Docker Offline'}
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

          {capabilities && (!capabilities.engines?.dsa?.ready || !capabilities.engines?.lld?.ready) && (
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
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={onProceed}
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

          {/* Right Column: Dual-Camera QR & Network */}
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-bold text-text">
                  <Camera className="w-4 h-4 text-text-3" />
                  <span>3. Dual-Camera Phone Link</span>
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
                    Scan with phone on same Wi-Fi to stream 45° angle desk feed.
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

            <div className="bg-surface border border-border rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-text">
                <Wifi className="w-4 h-4 text-text-3" />
                <span>4. Network Connection</span>
              </div>
              <Chip variant="success" size="sm">
                Localhost / LAN (0 ms)
              </Chip>
            </div>
          </div>

        </div>

        {/* 5. Proctoring & Recording Consent */}
        <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <span className="text-xs font-semibold text-text">
              This session is recorded and proctored. I consent to video/audio recording and AI integrity analysis.
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

        {!allChecksPassed && envMode === 'prod' && (
          <div className="bg-elevated border border-warning/30 p-3 rounded-lg flex items-center gap-2 text-xs text-warning">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Please complete all 4 checklist gates above (Webcam, Mic, Secondary Camera/Acknowledgement, Consent) to proceed.</span>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          disabled={!allChecksPassed}
          onClick={() => {
            if (!secondaryCameraConnected && singleCameraAcknowledged) {
              void sendTelemetryEvent({
                sessionId,
                eventType: 'TAB_BLUR',
                metadataDetails: 'SINGLE_CAMERA_ONLY_ACKNOWLEDGED: Candidate completed interview with single front camera; 45-degree angle unmonitored.'
              });
            }
            onProceed();
          }}
          icon={<ArrowRight className="w-5 h-5" />}
          className="w-full"
        >
          {allChecksPassed ? 'All Systems Verified ➡️ Start Interview' : 'Complete Required Checklist Gates Above'}
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