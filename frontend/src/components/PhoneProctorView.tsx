import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, CheckCircle, Video } from 'lucide-react';
import { sendTelemetryEvent } from '../services/api';

interface Props {
    sessionId: number;
}

export const PhoneProctorView: React.FC<Props> = ({ sessionId }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [cameraOk, setCameraOk] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;

        const startMobileCamera = async () => {
            try {
                // Request back camera (environment) or front camera on mobile
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
                    audio: false
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setCameraOk(true);

                // Send telemetry: Mobile Companion Connected
                sendTelemetryEvent({
                    sessionId,
                    eventType: 'TAB_FOCUS',
                    metadataDetails: 'Secondary Mobile Companion Camera Connected and Streaming.'
                });
            } catch (err: any) {
                console.warn('Mobile camera error:', err);
                setErrorMsg('Please allow camera permissions on your phone.');
            }
        };

        startMobileCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach((t) => t.stop());
            }
        };
    }, [sessionId]);

    return (
        <div style={{ height: '100vh', background: '#0a0a0f', color: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Smartphone size={24} color="#6366f1" />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Mobile Dual-Proctor</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cameraOk ? '#10b981' : '#f59e0b' }} />
                    <span style={{ fontSize: '0.8rem', color: cameraOk ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
            {cameraOk ? 'Streaming Desk Feed' : 'Connecting Camera...'}
          </span>
                </div>

                <div style={{ width: '100%', height: '240px', background: '#000', borderRadius: '10px', overflow: 'hidden', position: 'relative', marginBottom: '16px' }}>
                    {errorMsg ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
                            <Video size={32} color="#f87171" style={{ marginBottom: '8px' }} />
                            <span style={{ fontSize: '0.85rem', color: '#f87171' }}>{errorMsg}</span>
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                </div>

                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <CheckCircle size={16} color="#818cf8" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    Position your phone to view your <strong>desk, keyboard, and screen</strong> at a 45° angle. Keep this tab open during your interview.
                </div>
            </div>
        </div>
    );
};