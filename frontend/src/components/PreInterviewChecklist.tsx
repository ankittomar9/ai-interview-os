import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Mic, Monitor, Wifi, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

interface Props {
    sessionId: number;
    candidateId: string;
    roleTitle: string;
    onProceed: () => void;
}

export const PreInterviewChecklist: React.FC<Props> = ({
                                                           sessionId,
                                                           roleTitle,
                                                           onProceed
                                                       }) => {
    const [cameraOk, setCameraOk] = useState(false);
    const [micOk, setMicOk] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [screenOk, setScreenOk] = useState(true);
    const [devBypassScreen, setDevBypassScreen] = useState(false);
    const [networkOk] = useState(true);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

    // Dynamic host URL for the QR code
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const phoneProctorUrl = `http://${host}:5173/phone-proctor?session=${sessionId}`;

    useEffect(() => {
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
                console.warn('Hardware access error:', err);
            }

            // Check for extended / multi displays
            if ((window.screen as any).isExtended) {
                setScreenOk(false);
            } else {
                setScreenOk(true);
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
    }, []);

    const isScreenCheckSatisfied = screenOk || devBypassScreen;
    const allChecksPassed = cameraOk && micOk && isScreenCheckSatisfied && networkOk;

    return (
        <div style={{ maxWidth: '850px', margin: '40px auto', padding: '0 20px 60px' }}>
            <div className="glass-card" style={{ padding: '36px' }}>

                <div style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '20px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldCheck size={28} color="#6366f1" />
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Pre-Assessment System Verification</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
                        Candidate Readiness Check for <strong>{roleTitle}</strong> • Session #{sessionId}
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>

                    {/* Left: Camera & Microphone */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                                    <Camera size={16} color={cameraOk ? '#34d399' : '#f87171'} />
                                    <span>1. Frontal Webcam Video</span>
                                </div>
                                <span className={`badge ${cameraOk ? 'badge-success' : 'badge-danger'}`}>
                  {cameraOk ? 'Verified' : 'Access Required'}
                </span>
                            </div>

                            <div style={{ width: '100%', height: '150px', background: '#0a0a0f', borderRadius: '6px', overflow: 'hidden' }}>
                                <video
                                    ref={videoPreviewRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                                />
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                                    <Mic size={16} color={micOk ? '#34d399' : '#f87171'} />
                                    <span>2. Microphone Audio Input</span>
                                </div>
                                <span className={`badge ${micOk ? 'badge-success' : 'badge-warning'}`}>
                  {micOk ? 'Audio Detected' : 'Speak to Test'}
                </span>
                            </div>

                            <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${audioLevel}%`,
                                        background: audioLevel > 50 ? '#34d399' : '#6366f1',
                                        transition: 'width 0.1s ease'
                                    }}
                                />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                Say a sentence aloud to verify your microphone level.
              </span>
                        </div>

                    </div>

                    {/* Right: Displays & Phone Companion QR */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                                    <Monitor size={16} color={isScreenCheckSatisfied ? '#34d399' : '#f87171'} />
                                    <span>3. Single Monitor Check</span>
                                </div>
                                <span className={`badge ${isScreenCheckSatisfied ? 'badge-success' : 'badge-danger'}`}>
                  {screenOk ? 'Single Display' : devBypassScreen ? 'Dev Bypass Active' : 'Multi-Display Detected'}
                </span>
                            </div>

                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                {screenOk
                    ? 'No external monitors detected.'
                    : 'External monitor/HDMI detected. Please disconnect external displays.'}
              </span>

                            {!screenOk && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={devBypassScreen}
                                        onChange={(e) => setDevBypassScreen(e.target.checked)}
                                    />
                                    <span>(Dev Mode: Allow Multi-Monitor Testing)</span>
                                </label>
                            )}
                        </div>

                        <div style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '10px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ background: 'white', padding: '6px', borderRadius: '8px' }}>
                                <QRCodeSVG value={phoneProctorUrl} size={84} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', marginBottom: '4px' }}>
                                    4. Dual-Camera Phone Link (Optional)
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                    Scan with your phone on same Wi-Fi to stream 45° angle desk feed.
                                </p>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                                <Wifi size={16} color="#34d399" />
                                <span>5. Network Connection</span>
                            </div>
                            <span className="badge badge-success">Localhost / LAN (0 ms)</span>
                        </div>

                    </div>

                </div>

                {!allChecksPassed && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <AlertTriangle size={18} color="#fbbf24" />
                        <span style={{ fontSize: '0.85rem', color: '#fbbf24' }}>
              Please satisfy hardware checks (or check Dev Bypass) to unlock the assessment.
            </span>
                    </div>
                )}

                <button
                    className="btn btn-primary"
                    onClick={onProceed}
                    disabled={!allChecksPassed}
                    style={{ width: '100%', padding: '14px', fontSize: '1rem', opacity: allChecksPassed ? 1 : 0.5 }}
                >
                    All Systems Verified ➡️ Start Interview
                    <ArrowRight size={18} />
                </button>

            </div>
        </div>
    );
};