import React, { useEffect, useRef, useState } from 'react';
import { Video } from 'lucide-react';

interface Props {
    isTabBlurred: boolean;
    tabSwitches: number;
}

export const CameraProctorHUD: React.FC<Props> = ({ isTabBlurred, tabSwitches }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState<boolean>(false);

    useEffect(() => {
        let activeStream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, facingMode: 'user' },
                    audio: false
                });
                activeStream = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err: any) {
                console.warn('Camera access denied or unavailable:', err);
                setCameraError('Camera feed required for proctoring');
            }
        };

        startCamera();

        // Auto-cleanup on unmount
        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: isMinimized ? '180px' : '240px',
                background: 'rgba(18, 18, 26, 0.95)',
                backdropFilter: 'blur(16px)',
                borderRadius: '12px',
                border: isTabBlurred ? '2px solid #ef4444' : '1px solid var(--border-card)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
                zIndex: 50,
                transition: 'all 0.3s ease'
            }}
        >
            {/* HUD Header - Camera toggle removed */}
            <div
                style={{
                    padding: '6px 10px',
                    background: isTabBlurred ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderBottom: '1px solid var(--border-card)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: isTabBlurred ? '#ef4444' : '#10b981',
                            boxShadow: isTabBlurred ? '0 0 8px #ef4444' : '0 0 8px #10b981'
                        }}
                    />
                    <span style={{ color: isTabBlurred ? '#f87171' : '#34d399' }}>
            {isTabBlurred ? 'FOCUS LOST' : 'PROCTOR LOCKED'}
          </span>
                </div>

                <button
                    type="button"
                    onClick={() => setIsMinimized((prev) => !prev)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                    {isMinimized ? '▢' : '—'}
                </button>
            </div>

            {/* Video Stream */}
            {!isMinimized && (
                <div style={{ position: 'relative', width: '100%', height: '160px', background: '#0a0a0f' }}>
                    {cameraError ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px', textAlign: 'center' }}>
                            <Video size={24} color="#f87171" style={{ marginBottom: '6px' }} />
                            <span style={{ fontSize: '0.7rem', color: '#f87171' }}>{cameraError}</span>
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: 'scaleX(-1)' // Mirror view
                            }}
                        />
                    )}

                    {isTabBlurred && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(239, 68, 68, 0.75)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                textAlign: 'center',
                                padding: '8px'
                            }}
                        >
                            ⚠️ Return to Interview Tab!
                        </div>
                    )}

                    <div
                        style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '6px',
                            fontSize: '0.65rem',
                            color: 'rgba(255, 255, 255, 0.8)',
                            background: 'rgba(0, 0, 0, 0.6)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                        }}
                    >
                        Tab Switches: {tabSwitches}
                    </div>
                </div>
            )}
        </div>
    );
};