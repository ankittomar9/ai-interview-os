import React from 'react';
import { ChevronRight, FileCode } from 'lucide-react';

interface BreadcrumbBarProps {
  segments: string[];
}

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({ segments }) => {
  const safeSegments = segments && segments.length > 0 ? segments : ['Solution.java'];

  return (
    <div className="h-7 bg-surface border-b border-border text-[11px] text-text-3 flex items-center px-3 gap-1 shrink-0 overflow-x-auto select-none font-mono whitespace-nowrap">
      <FileCode className="w-3.5 h-3.5 text-primary-2/70 shrink-0 mr-1" />
      {safeSegments.map((segment, index) => {
        const isLast = index === safeSegments.length - 1;
        return (
          <React.Fragment key={`${segment}-${index}`}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-text-3/60 shrink-0 mx-0.5" />
            )}
            <span
              className={
                isLast
                  ? 'text-text-2 font-semibold'
                  : 'text-text-3 hover:text-text-2 transition-colors cursor-default'
              }
            >
              {segment}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};
