import React from 'react';
import { LayoutGrid, ListTree } from 'lucide-react';
import type { LearnViewMode } from './useLearnData';

export interface ViewToggleProps {
  viewMode: LearnViewMode;
  onViewModeChange: (mode: LearnViewMode) => void;
  className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  viewMode,
  onViewModeChange,
  className = ''
}) => {
  return (
    <div
      role="group"
      aria-label="Playground view mode"
      className={`inline-flex items-center p-0.5 rounded-lg bg-elevated border border-border shrink-0 select-none ${className}`}
    >
      <button
        type="button"
        aria-pressed={viewMode === 'hub'}
        onClick={() => onViewModeChange('hub')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus:outline-hidden ${
          viewMode === 'hub'
            ? 'bg-surface text-primary font-semibold shadow-xs'
            : 'text-text-3 hover:text-text'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Hub</span>
      </button>

      <button
        type="button"
        aria-pressed={viewMode === 'modules'}
        onClick={() => onViewModeChange('modules')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus:outline-hidden ${
          viewMode === 'modules'
            ? 'bg-surface text-primary font-semibold shadow-xs'
            : 'text-text-3 hover:text-text'
        }`}
      >
        <ListTree className="w-3.5 h-3.5" />
        <span>Modules</span>
      </button>
    </div>
  );
};
