import React from 'react';
import type { InterviewTrack } from '../../types';
import { Check } from 'lucide-react';

export interface TrackCardProps {
  track: InterviewTrack;
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  title,
  description,
  icon,
  selected,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative flex items-start gap-3.5 p-4 rounded-lg border transition-all duration-150 cursor-pointer select-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        selected
          ? 'bg-primary/10 border-primary shadow-sm shadow-primary/20 ring-1 ring-primary/40'
          : 'bg-surface border-border hover:border-text-3/40 hover:bg-elevated/60'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
          selected
            ? 'bg-primary text-white border-primary-2'
            : 'bg-elevated text-primary-2 border-border'
        }`}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0 pr-6">
        <h4 className={`text-sm font-bold truncate ${selected ? 'text-white' : 'text-text'}`}>
          {title}
        </h4>
        <p className="text-xs text-text-3 mt-1 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
          <Check className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
};
