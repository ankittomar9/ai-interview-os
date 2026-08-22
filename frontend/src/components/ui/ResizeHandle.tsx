import React, { useRef, useState } from 'react';

export interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical'; // 'horizontal' = drag left/right (vertical bar), 'vertical' = drag up/down (horizontal bar)
  onDelta: (deltaPx: number) => void;
  onDoubleClick?: () => void;
  className?: string;
  title?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  direction,
  onDelta,
  onDoubleClick,
  className = '',
  title
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const lastPosRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  const isCol = direction === 'horizontal';

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unavailable
    }
    setIsDragging(true);
    lastPosRef.current = isCol ? e.clientX : e.clientY;

    // Support double-tap on touch screens
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (onDoubleClick) onDoubleClick();
    }
    lastTapRef.current = now;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentPos = isCol ? e.clientX : e.clientY;
    const delta = currentPos - lastPosRef.current;
    lastPosRef.current = currentPos;
    if (delta !== 0) {
      onDelta(delta);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture was already released
      }
      setIsDragging(false);
    }
  };

  return (
    <div
      role="separator"
      aria-orientation={isCol ? 'vertical' : 'horizontal'}
      title={title || (isCol ? 'Drag to resize panel (Double-click to reset)' : 'Drag to resize console (Double-click to reset)')}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={onDoubleClick}
      className={`group relative select-none touch-none shrink-0 transition-colors ${
        isCol
          ? 'w-2 cursor-col-resize h-full flex items-center justify-center'
          : 'h-2 cursor-row-resize w-full flex items-center justify-center'
      } ${
        isDragging
          ? 'bg-primary'
          : 'bg-transparent hover:bg-primary/30'
      } ${className}`}
    >
      {/* 2px visible divider line */}
      <div
        className={`${
          isCol ? 'w-[1px] h-full' : 'h-[1px] w-full'
        } bg-border group-hover:bg-primary/60 transition-colors pointer-events-none`}
      />

      {/* 3 centered grip dots */}
      <div
        className={`absolute flex items-center justify-center gap-0.5 pointer-events-none rounded-full bg-elevated border border-border/80 px-1 py-0.5 transition-opacity ${
          isCol ? 'flex-col' : 'flex-row'
        } ${isDragging ? 'opacity-100 ring-2 ring-primary' : 'opacity-40 group-hover:opacity-100'}`}
      >
        <span className="w-1 h-1 rounded-full bg-text-3" />
        <span className="w-1 h-1 rounded-full bg-text-3" />
        <span className="w-1 h-1 rounded-full bg-text-3" />
      </div>
    </div>
  );
};
