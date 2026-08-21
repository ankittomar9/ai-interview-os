import React, { useEffect, useRef } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface Props {
    isTabBlurred: boolean;
    tabSwitchCount: number;
    pasteCount: number;
}

export const WebcamTile: React.FC<Props> = ({ isTabBlurred, tabSwitchCount, pasteCount }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        navigator.mediaDevices?.getUserMedia({ video: { width: 240, height: 160 } })
            .then((s) => {
                stream = s;
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                }
            })
            .catch((err) => {
                console.warn('Webcam feed unavailable:', err);
            });

        return () => {
            if (stream) {
                stream.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    return (
        <div style={{
            width: '160px',
            height: '110px',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative',
            background: '#040711',
            border: isTabBlurred ? '2px solid #ef4444' : '1.5px solid #1e293b',
            boxShadow: isTabBlurred
                ? '0 0 16px rgba(239, 68, 68, 0.6)'
                : '0 4px 12px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.3s ease'
        }}>
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

            {/* Top Status Pill */}
            <div style={{
                position: 'absolute',
                top: '6px',
                left: '6px',
                right: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: isTabBlurred ? 'rgba(239, 68, 68, 0.85)' : 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                backdropFilter: 'blur(4px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isTabBlurred ? (
                        <>
                            <ShieldAlert size={11} color="#ffffff" />
                            <span>FOCUS LOST</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck size={11} color="#34d399" />
                            <span>PROCTOR LOCKED</span>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Meta */}
            <div style={{
                position: 'absolute',
                bottom: '4px',
                left: '6px',
                right: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.6rem',
                color: '#94a3b8',
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '1px 4px',
                borderRadius: '3px'
            }}>
                <span>Switches: {tabSwitchCount}</span>
                <span>Pastes: {pasteCount}</span>
            </div>
        </div>
    );
};
