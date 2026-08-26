import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../ui/Button';
import type { InterviewTrack } from '../../types';

interface StageSwitchModalProps {
  targetTrack: InterviewTrack;
  onConfirm: () => void;
  onCancel: () => void;
}

export const StageSwitchModal: React.FC<StageSwitchModalProps> = ({
  targetTrack,
  onConfirm,
  onCancel
}) => (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
          <SlidersHorizontal className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text">Switch to {targetTrack} track?</h3>
          <p className="text-xs text-text-3">Your current track progress is saved.</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={onConfirm}>Switch Track</Button>
      </div>
    </div>
  </div>
);
