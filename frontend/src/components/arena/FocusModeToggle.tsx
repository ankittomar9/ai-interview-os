import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FocusModeToggleProps {
  isFocusMode: boolean;
  onToggle: () => void;
  className?: string;
}

export const FocusModeToggle: React.FC<FocusModeToggleProps> = ({
  isFocusMode,
  onToggle,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode (Distraction-Free)'}
      aria-label={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-colors border ${
        isFocusMode
          ? 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/25'
          : 'bg-surface text-text-3 border-border hover:text-text hover:bg-elevated'
      } ${className}`}
    >
      {isFocusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{isFocusMode ? 'Focus On' : 'Focus'}</span>
    </button>
  );
};
