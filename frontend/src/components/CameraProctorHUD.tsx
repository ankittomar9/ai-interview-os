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

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div
      className={`fixed bottom-5 right-5 bg-surface/95 backdrop-blur-md rounded-xl border shadow-2xl overflow-hidden z-50 transition-all duration-300 ${
        isMinimized ? 'w-44' : 'w-60'
      } ${
        isTabBlurred
          ? 'border-danger ring-2 ring-danger'
          : 'border-border'
      }`}
    >
      {/* HUD Header */}
      <div
        className={`px-2.5 py-1.5 flex items-center justify-between text-xs font-semibold border-b border-border select-none ${
          isTabBlurred ? 'bg-danger/20 text-danger' : 'bg-elevated/80 text-success'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              isTabBlurred ? 'bg-danger shadow-sm shadow-danger' : 'bg-success shadow-sm shadow-success'
            }`}
          />
          <span className="text-[11px] font-bold">
            {isTabBlurred ? 'FOCUS LOST' : 'PROCTOR LOCKED'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsMinimized((prev) => !prev)}
          className="text-text-3 hover:text-text cursor-pointer p-0.5"
        >
          {isMinimized ? '▢' : '—'}
        </button>
      </div>

      {/* Video Stream */}
      {!isMinimized && (
        <div className="relative w-full h-40 bg-bg">
          {cameraError ? (
            <div className="h-full flex flex-col items-center justify-center p-3 text-center">
              <Video className="w-6 h-6 text-danger mb-1.5" />
              <span className="text-xs text-danger">{cameraError}</span>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}

          {isTabBlurred && (
            <div className="absolute inset-0 bg-danger/80 flex items-center justify-center text-white font-bold text-xs text-center p-2">
              ⚠️ Return to Interview Tab!
            </div>
          )}

          <div className="absolute bottom-1 left-1.5 text-[10px] text-white/90 bg-black/60 px-1.5 py-0.5 rounded font-mono">
            Tab Switches: {tabSwitches}
          </div>
        </div>
      )}
    </div>
  );
};