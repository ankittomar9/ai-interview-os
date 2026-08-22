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
    <div
      className={`w-40 h-28 rounded-lg overflow-hidden relative bg-surface border transition-all select-none ${
        isTabBlurred
          ? 'border-danger shadow-lg shadow-danger/50 ring-2 ring-danger'
          : 'border-border shadow-md shadow-black/50'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1]"
      />

      {/* Top Status Pill */}
      <div
        className={`absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm text-white ${
          isTabBlurred ? 'bg-danger/90' : 'bg-elevated/80'
        }`}
      >
        <div className="flex items-center gap-1">
          {isTabBlurred ? (
            <>
              <ShieldAlert className="w-3 h-3 text-white" />
              <span>FOCUS LOST</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3 h-3 text-success" />
              <span>PROCTOR LOCKED</span>
            </>
          )}
        </div>
      </div>

      {/* Bottom Meta */}
      <div className="absolute bottom-1 left-1.5 right-1.5 flex justify-between text-[9px] text-text-3 bg-bg/80 px-1 py-0.5 rounded backdrop-blur-xs font-mono">
        <span>Switches: {tabSwitchCount}</span>
        <span>Pastes: {pasteCount}</span>
      </div>
    </div>
  );
};
