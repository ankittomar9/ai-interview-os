import React from 'react';
import { Video, Monitor } from 'lucide-react';

export interface ReplayStreamToggleProps {
  available: { camera: boolean; screen: boolean };
  value: 'camera' | 'screen';
  onChange: (kind: 'camera' | 'screen') => void;
}

export const ReplayStreamToggle: React.FC<ReplayStreamToggleProps> = ({
  available,
  value,
  onChange
}) => {
  return (
    <div className="inline-flex items-center p-0.5 rounded-lg bg-elevated border border-border text-xs font-medium">
      <button
        type="button"
        disabled={!available.camera}
        onClick={() => onChange('camera')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          value === 'camera'
            ? 'bg-surface text-text font-semibold shadow-sm border border-border'
            : 'text-text-3 hover:text-text'
        }`}
      >
        <Video className="w-3.5 h-3.5" />
        <span>Camera Feed</span>
      </button>

      <button
        type="button"
        disabled={!available.screen}
        onClick={() => onChange('screen')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          value === 'screen'
            ? 'bg-surface text-text font-semibold shadow-sm border border-border'
            : 'text-text-3 hover:text-text'
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>Screen Capture</span>
      </button>
    </div>
  );
};
