import React from 'react';

export interface RoundDividerProps {
  title: string;
  roundNumber?: number;
  sectionType?: string;
}

export const RoundDivider: React.FC<RoundDividerProps> = ({ title, roundNumber: _roundNumber, sectionType }) => {
  return (
    <div className="my-4 flex items-center justify-center gap-3 select-none" data-testid="round-boundary-divider">
      <div className="h-px bg-border flex-1" />
      <div className="px-3 py-1 rounded-full bg-surface border border-border text-[11px] font-semibold text-text-2 tracking-wide uppercase flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>Round Boundary: {title}</span>
        {sectionType && <span className="text-text-3 font-mono text-[10px]">({sectionType})</span>}
      </div>
      <div className="h-px bg-border flex-1" />
    </div>
  );
};
