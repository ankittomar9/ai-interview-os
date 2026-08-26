import React from 'react';
import { Layers, Compass, ArrowRight } from 'lucide-react';
import type { InterviewTrack } from '../../types';
import { Button } from '../ui/Button';

interface EmptyTrackStateProps {
  track?: InterviewTrack;
  onBrowseCatalog?: () => void;
  onSelectTrack?: (track: InterviewTrack) => void;
}

export const EmptyTrackState: React.FC<EmptyTrackStateProps> = ({
  track = 'ALGORITHMS_DATA_STRUCTURES',
  onBrowseCatalog,
  onSelectTrack
}) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-bg text-center select-none h-full">
      <div className="max-w-md p-8 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
          <Layers className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-text">No Published Questions</h3>
          <p className="text-xs text-text-3 leading-relaxed">
            No published <span className="font-mono text-primary font-semibold">{track}</span> questions are currently available. Please select another track or browse the full question bank.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          {onBrowseCatalog && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onBrowseCatalog}
              className="w-full sm:w-auto text-xs"
            >
              <Compass className="w-3.5 h-3.5 mr-1.5" />
              Browse Catalog
            </Button>
          )}

          {onSelectTrack && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSelectTrack('ALGORITHMS_DATA_STRUCTURES')}
              className="w-full sm:w-auto text-xs"
            >
              Switch to DSA
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
