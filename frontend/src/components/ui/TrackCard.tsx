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
      className={`relative flex items-start gap-3.5 p-4 rounded-lg transition-colors cursor-pointer select-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        selected
          ? 'bg-elevated border-2 border-primary'
          : 'bg-surface border border-border hover:border-zinc-600'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
          selected
            ? 'bg-elevated text-primary border-primary'
            : 'bg-elevated text-text-3 border-border'
        }`}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0 pr-5">
        <h4 className={`text-sm font-bold truncate ${selected ? 'text-text' : 'text-text'}`}>
          {title}
        </h4>
        <p className="text-xs text-text-3 mt-1 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {selected && (
        <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
          <Check className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};
