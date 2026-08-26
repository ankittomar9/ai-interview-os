import React, { useState, useRef } from 'react';
import { Mic } from 'lucide-react';
import { WaveformBars } from './AiOrbAvatar';

export interface FloatingAiOrbProps {
  isOpen: boolean;
  onToggle: () => void;
  isAiSpeaking: boolean;
  isListening?: boolean;
  hasUnread?: boolean;
  sessionMode?: 'INTERVIEW' | 'PLAYGROUND';
  stackAbove?: 'webcam' | 'none';
  className?: string;
}

export const FloatingAiOrb: React.FC<FloatingAiOrbProps> = ({
  isOpen,
  onToggle,
  isAiSpeaking,
  isListening = false,
  hasUnread = false,
  sessionMode = 'INTERVIEW',
  stackAbove = 'none',
  className = ''
}) => {
  const isPlayground = sessionMode === 'PLAYGROUND';
  const personaLabel = isPlayground ? 'Coach Sam' : 'Mickey';
  const personaDesc = isPlayground ? 'Coach Sam (Senior Tech Lead)' : 'Mickey (Principal Engineer & Bar Raiser)';
  // Dragging support with localStorage position persistence
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('ai.coach.pos');
      if (saved) return JSON.parse(saved);
    } catch {
      return null;
    }
    return null;
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const initialX = pos ? pos.x : window.innerWidth - 90;
    const initialY = pos ? pos.y : window.innerHeight - (stackAbove === 'webcam' ? 175 : 95);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: initialX,
      posY: initialY
    };
    isDraggingRef.current = false;

    const handlePointerMove = (ev: PointerEvent) => {
      const dx = ev.clientX - dragStartRef.current.startX;
      const dy = ev.clientY - dragStartRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        isDraggingRef.current = true;
        const newX = Math.max(16, Math.min(window.innerWidth - 80, dragStartRef.current.posX + dx));
        const newY = Math.max(50, Math.min(window.innerHeight - 80, dragStartRef.current.posY + dy));
        setPos({ x: newX, y: newY });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (isDraggingRef.current) {
        setPos((current) => {
          if (current) {
            localStorage.setItem('ai.coach.pos', JSON.stringify(current));
          }
          return current;
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const defaultPosClass = !pos
    ? stackAbove === 'webcam'
      ? 'fixed bottom-36 right-5'
      : 'fixed bottom-5 right-5'
    : '';

  return (
    <div
      /* eslint-disable-next-line no-restricted-syntax */
      style={pos ? { left: `${pos.x}px`, top: `${pos.y}px`, position: 'fixed' } : undefined}
      className={`${defaultPosClass} z-40 select-none flex flex-col items-center gap-1 ${className}`}
    >
      <div className="relative group">
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onClick={() => {
            if (!isDraggingRef.current) {
              onToggle();
            }
          }}
          aria-label={isOpen ? `Close ${personaLabel}` : `Open ${personaLabel}`}
          aria-expanded={isOpen}
          title={
            isListening
              ? `Listening to microphone… (Click to toggle ${personaLabel})`
              : isAiSpeaking
              ? `${personaLabel} is speaking… (Click to toggle)`
              : isOpen
              ? `Collapse ${personaLabel}`
              : `Open ${personaDesc}`
          }
          className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 cursor-pointer shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isListening
              ? 'bg-primary text-on-accent ring-4 ring-success/50 shadow-success/30 scale-105 animate-pulse'
              : isAiSpeaking
              ? 'bg-primary text-on-accent ring-4 ring-primary/50 shadow-primary/30 scale-105'
              : isOpen
              ? 'bg-surface border-2 border-primary text-primary ring-2 ring-primary/30 scale-105'
              : 'bg-surface border border-border text-text hover:border-primary/60 hover:scale-105'
          }`}
        >
          {/* Animated Waveform when speaking, Mic otherwise */}
          {isAiSpeaking ? (
            <WaveformBars isSpeaking={true} className="text-on-accent" />
          ) : isListening ? (
            <Mic className="w-5 h-5 text-success animate-bounce" />
          ) : (
            <Mic className="w-5 h-5" />
          )}

          {/* Unread Message Dot */}
          {hasUnread && !isOpen && (
            <span
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-danger rounded-full ring-2 ring-surface animate-bounce"
              aria-label={`Unread ${personaLabel} message`}
            />
          )}
        </button>

        {/* State Tooltip / Indicator */}
        {isListening && (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-success text-on-accent text-[10px] font-bold shadow-md whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
            Listening…
          </span>
        )}
        {isAiSpeaking && (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-primary text-on-accent text-[10px] font-bold shadow-md whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
            Speaking…
          </span>
        )}
      </div>

      {/* Visible Persona Badge */}
      <span className="text-[10px] font-bold tracking-tight text-text-3 px-1.5 py-0.5 rounded bg-surface/90 border border-border/80 shadow-xs pointer-events-none">
        {personaLabel}
      </span>
    </div>
  );
};
