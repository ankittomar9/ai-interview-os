import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ShieldAlert, ShieldCheck, GripHorizontal, Minimize2, Maximize2, Camera } from 'lucide-react';

interface Props {
  isTabBlurred: boolean;
  tabSwitchCount: number;
  pasteCount: number;
}

const STORAGE_POS_KEY = 'ui.webcam.position';
const STORAGE_MIN_KEY = 'ui.webcam.minimized';

export const WebcamTile: React.FC<Props> = ({ isTabBlurred, tabSwitchCount, pasteCount }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const tileRef = useRef<HTMLDivElement | null>(null);

  // Position state with default bottom-right calculation
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_POS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return parsed;
          }
        }
      } catch {
        // Fallback
      }
      return {
        x: Math.max(16, window.innerWidth - 200),
        y: Math.max(16, window.innerHeight - 200)
      };
    }
    return { x: 800, y: 600 };
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_MIN_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0
  });

  // Webcam video feed attachment
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
  }, [isMinimized]);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return; // Ignore clicks on minimize/action buttons
    }
    e.preventDefault();
    const currentX = position?.x ?? (window.innerWidth - 200);
    const currentY = position?.y ?? (window.innerHeight - 200);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentX,
      initY: currentY
    };

    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const tileWidth = isMinimized ? 150 : 176;
    const tileHeight = isMinimized ? 36 : 140;

    const maxX = Math.max(0, window.innerWidth - tileWidth - 8);
    const maxY = Math.max(0, window.innerHeight - tileHeight - 8);

    const nextX = Math.min(maxX, Math.max(8, dragStartRef.current.initX + deltaX));
    const nextY = Math.min(maxY, Math.max(8, dragStartRef.current.initY + deltaY));

    setPosition({ x: nextX, y: nextY });
  }, [isDragging, isMinimized]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    if (position) {
      localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(position));
    }
  }, [isDragging, position]);

  const toggleMinimized = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_MIN_KEY, String(next));
      return next;
    });
  };

  const posStyle = position
    ? { left: `${position.x}px`, top: `${position.y}px` }
    : { right: '20px', bottom: '100px' };

  if (isMinimized) {
    return (
      <div
        ref={tileRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={posStyle}
        className={`fixed z-50 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-surface/95 border backdrop-blur-md shadow-xl select-none cursor-grab active:cursor-grabbing transition-shadow ${
          isTabBlurred
            ? 'border-danger text-danger ring-2 ring-danger/40 animate-pulse'
            : 'border-border text-text hover:border-primary/50'
        }`}
      >
        <GripHorizontal className="w-3 h-3 text-text-3 opacity-60 shrink-0" />
        {isTabBlurred ? (
          <ShieldAlert className="w-3.5 h-3.5 text-danger shrink-0" />
        ) : (
          <Camera className="w-3.5 h-3.5 text-success shrink-0" />
        )}
        <span className="text-[11px] font-bold tracking-tight">
          {isTabBlurred ? 'FOCUS LOST' : 'PROCTOR ACTIVE'}
        </span>
        <button
          type="button"
          onClick={toggleMinimized}
          title="Expand Camera Tile"
          className="p-0.5 rounded hover:bg-elevated text-text-3 hover:text-text cursor-pointer ml-1"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={tileRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={posStyle}
      className={`fixed z-50 w-44 rounded-lg overflow-hidden bg-surface/95 border backdrop-blur-md shadow-2xl select-none transition-shadow ${
        isDragging ? 'cursor-grabbing ring-2 ring-primary/60' : 'cursor-grab'
      } ${
        isTabBlurred
          ? 'border-danger shadow-danger/30 ring-2 ring-danger animate-pulse'
          : 'border-border shadow-black/60 hover:border-primary/40'
      }`}
    >
      {/* Drag Header Bar */}
      <div
        className={`flex items-center justify-between px-2 py-1 text-[10px] font-bold border-b backdrop-blur-xs ${
          isTabBlurred
            ? 'bg-danger text-white border-danger'
            : 'bg-elevated/90 text-text-2 border-border'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <GripHorizontal className="w-3 h-3 text-text-3 opacity-80 shrink-0" />
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

        <button
          type="button"
          onClick={toggleMinimized}
          title="Minimize Camera Tile"
          className="p-0.5 rounded hover:bg-black/20 text-text-3 hover:text-text cursor-pointer"
        >
          <Minimize2 className="w-3 h-3" />
        </button>
      </div>

      {/* Video Stream */}
      <div className="w-full h-24 bg-black relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
      </div>

      {/* Footer Proctor Telemetry */}
      <div className="px-2 py-1 bg-elevated/80 border-t border-border flex items-center justify-between text-[9px] text-text-3 font-mono">
        <span>Switches: <strong className={tabSwitchCount > 0 ? 'text-amber-400' : 'text-text'}>{tabSwitchCount}</strong></span>
        <span>Pastes: <strong className={pasteCount > 0 ? 'text-amber-400' : 'text-text'}>{pasteCount}</strong></span>
      </div>
    </div>
  );
};
