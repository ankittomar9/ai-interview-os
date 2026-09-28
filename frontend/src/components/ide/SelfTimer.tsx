import React, { useState, useEffect, useRef } from 'react';
import { Timer, Plus, Pause, Play, RotateCcw } from 'lucide-react';
import { toast } from '../../hooks/useToast';

interface Props {
  initialMinutes?: number;
  defaultMinutes?: number;
  autoStart?: boolean;
  mode?: 'INTERVIEW' | 'PLAYGROUND';
  sectionIndex?: number;
  onExpire?: () => void;
}

export const SelfTimer: React.FC<Props> = ({
  initialMinutes = 30,
  defaultMinutes,
  autoStart = false,
  mode = 'INTERVIEW',
  sectionIndex,
  onExpire
}) => {
  // Unsafe fallback removed: missing mode defaults strictly to INTERVIEW
  const effectiveMode: 'INTERVIEW' | 'PLAYGROUND' = mode;
  const startingMinutes = defaultMinutes !== undefined ? defaultMinutes : initialMinutes;
  const [secondsLeft, setSecondsLeft] = useState(startingMinutes * 60);
  const [isRunning, setIsRunning] = useState(autoStart);
  const prevSectionRef = useRef<number | undefined>(sectionIndex);
  const deadlineRef = useRef<number | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (prevSectionRef.current !== undefined && sectionIndex !== undefined && prevSectionRef.current !== sectionIndex) {
      console.info(`TIMER_TRANSITION fromSection=${prevSectionRef.current} toSection=${sectionIndex} displayed=${formatTime(secondsLeft)}`);
      setSecondsLeft(startingMinutes * 60);
      prevSectionRef.current = sectionIndex;
      if (isRunning) {
        deadlineRef.current = Date.now() + startingMinutes * 60 * 1000;
      }
    } else if (prevSectionRef.current === undefined && sectionIndex !== undefined) {
      prevSectionRef.current = sectionIndex;
    } else if (sectionIndex === undefined) {
      setSecondsLeft(startingMinutes * 60);
      if (isRunning) {
        deadlineRef.current = Date.now() + startingMinutes * 60 * 1000;
      }
    }
  }, [sectionIndex, startingMinutes, isRunning]);

  useEffect(() => {
    if (autoStart) {
      setIsRunning(true);
    }
  }, [autoStart]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && secondsLeft > 0) {
      if (!deadlineRef.current) {
        deadlineRef.current = Date.now() + secondsLeft * 1000;
      }
      interval = setInterval(() => {
        if (!deadlineRef.current) return;
        const now = Date.now();
        const diffMs = deadlineRef.current - now;
        const remaining = Math.max(0, Math.ceil(diffMs / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          deadlineRef.current = null;
          if (effectiveMode === 'PLAYGROUND') {
            toast.info('Your practice timer has expired! You can add 15 minutes or continue untimed.', 'Practice Timer Expiry');
          } else {
            toast.info('Section time budget reached. Wrap up your current point or advance to the next stage.', 'Section Time Budget');
          }
          onExpire?.();
          setIsRunning(false);
        }
      }, 1000);
    } else {
      deadlineRef.current = null;
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, effectiveMode, onExpire]);

  const handleToggleRunning = () => {
    if (isRunning) {
      deadlineRef.current = null;
      setIsRunning(false);
    } else {
      deadlineRef.current = Date.now() + secondsLeft * 1000;
      setIsRunning(true);
    }
  };

  const handleAddMinutes = (mins: number) => {
    if (effectiveMode === 'INTERVIEW') {
      console.warn('TIMER_EXTEND_BLOCKED mode=INTERVIEW');
      return;
    }
    if (deadlineRef.current) {
      deadlineRef.current += mins * 60 * 1000;
    }
    setSecondsLeft((s) => s + mins * 60);
  };

  const handleReset = (mins: number) => {
    if (effectiveMode === 'INTERVIEW') {
      console.warn('TIMER_EXTEND_BLOCKED mode=INTERVIEW');
      return;
    }
    deadlineRef.current = null;
    setSecondsLeft(mins * 60);
    setIsRunning(false);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <Timer className="w-3.5 h-3.5 text-slate-400" />
      <span className={`font-mono text-xs font-bold ${secondsLeft === 0 ? 'text-amber-500 animate-pulse' : 'text-slate-800 dark:text-slate-200'}`}>
        {formatTime(secondsLeft)}
      </span>

      <button
        type="button"
        onClick={handleToggleRunning}
        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer transition-colors"
        title={isRunning ? 'Pause Timer' : 'Start Timer'}
      >
        {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>

      {effectiveMode === 'PLAYGROUND' && (
        <>
          <button
            type="button"
            onClick={() => handleAddMinutes(15)}
            className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded transition-colors cursor-pointer"
            title="Add 15 minutes"
          >
            <Plus className="w-3 h-3" />
            <span>15m</span>
          </button>

          <button
            type="button"
            onClick={() => handleReset(initialMinutes)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
};
