import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { InterviewTrack, SectionType } from '../../types';
import { Button } from '../ui/Button';

export interface SessionSectionFaultStateProps {
  sectionType: SectionType;
  track?: InterviewTrack | string;
  hasAssignedQuestions?: boolean;
  onRetry?: () => void;
}

export const SessionSectionFaultState: React.FC<SessionSectionFaultStateProps> = ({
  sectionType,
  track = 'ALGORITHMS_DATA_STRUCTURES',
  hasAssignedQuestions = false,
  onRetry
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    try {
      onRetry?.();
    } finally {
      setTimeout(() => setIsRetrying(false), 600);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-bg text-center select-none h-full">
      <div className="max-w-md p-8 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-bold text-text">
            {hasAssignedQuestions ? 'Question Resolution Notice' : 'No Questions Configured for Round'}
          </h3>
          <p className="text-xs text-text-3 leading-relaxed">
            {hasAssignedQuestions ? (
              <>
                Questions are assigned to this session, but the catalog failed to resolve active questions for the{' '}
                <span className="font-mono text-primary font-semibold">{sectionType}</span> ({track}) section.
              </>
            ) : (
              <>
                No coding questions are assigned to the <span className="font-mono text-primary font-semibold">{sectionType}</span> section in this interview plan.
                Please discuss the current stage with your AI interviewer via chat.
              </>
            )}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying…' : 'Retry Resolution'}
          </Button>
        </div>
      </div>
    </div>
  );
};
