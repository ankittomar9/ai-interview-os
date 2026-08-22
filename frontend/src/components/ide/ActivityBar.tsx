import React from 'react';
import { Files, Search, Play, ShieldCheck, ShieldAlert } from 'lucide-react';

interface ActivityBarProps {
  active?: 'explorer';
  onRun?: () => void;
  proctorClean?: boolean;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  active = 'explorer',
  onRun,
  proctorClean = true
}) => {
  return (
    <div className="w-10 bg-elevated border-r border-border flex flex-col items-center py-2.5 justify-between shrink-0 select-none z-10">
      {/* Top Group: Explorer, Search, Run */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Explorer Tab */}
        <button
          type="button"
          title="Explorer"
          className={`relative w-full py-2 flex items-center justify-center transition-colors cursor-pointer ${
            active === 'explorer'
              ? 'text-primary-2'
              : 'text-text-3 hover:text-text'
          }`}
        >
          {active === 'explorer' && (
            <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-r" />
          )}
          <Files className="w-4 h-4" />
        </button>

        {/* Search (Disabled) */}
        <button
          type="button"
          disabled
          title="Search (Coming soon)"
          className="w-full py-2 flex items-center justify-center text-text-3 opacity-40 cursor-not-allowed"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Run / Execute */}
        {onRun && (
          <button
            type="button"
            onClick={onRun}
            title="Run Test Suite (Ctrl+Enter)"
            className="w-8 h-8 rounded flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-surface/80 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
        )}
      </div>

      {/* Bottom Group: Proctor Sentinel Indicator */}
      <div className="flex flex-col items-center gap-2 w-full pb-1">
        <div
          title={proctorClean ? 'Proctor Sentinel: Live feed verified' : 'Proctor Sentinel: Review anomaly logged'}
          className={`p-1.5 rounded transition-colors ${
            proctorClean ? 'text-success/80' : 'text-warning'
          }`}
        >
          {proctorClean ? (
            <ShieldCheck className="w-4 h-4" />
          ) : (
            <ShieldAlert className="w-4 h-4" />
          )}
        </div>
      </div>
    </div>
  );
};
