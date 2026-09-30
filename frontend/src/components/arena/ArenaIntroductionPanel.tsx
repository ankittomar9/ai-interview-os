import React from 'react';
import type { PlannedSection } from '../../types';

export interface ArenaIntroductionPanelProps {
  sections?: PlannedSection[];
  activeSectionIndex?: number;
}

export const ArenaIntroductionPanel: React.FC<ArenaIntroductionPanelProps> = ({
  sections,
  activeSectionIndex
}) => {
  return (
    <div className="flex flex-col h-full bg-surface border-r border-border p-6 overflow-y-auto space-y-6 text-text select-none">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
            Stage 1 · Warm-Up
          </span>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-text">Session Introduction</h2>
        <p className="text-xs text-text-3">
          Get settled, verify your environment, and introduce yourself to the AI interviewer.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-elevated/60 border border-border space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-2 font-mono">
          Session Plan
        </h3>
        <div className="space-y-2 text-xs">
          {sections?.map((s, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between py-1.5 px-2.5 rounded ${
                idx === activeSectionIndex
                  ? 'bg-primary/10 border border-primary/30 text-primary font-medium'
                  : 'text-text-3'
              }`}
            >
              <span>
                {idx + 1}. {s.note || s.sectionType}
              </span>
              <span className="font-mono text-[11px]">
                {s.softTimeBudgetMinutes ? `${s.softTimeBudgetMinutes} min` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-lg bg-elevated/60 border border-border space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-2 font-mono">
          Readiness Summary
        </h3>
        <ul className="space-y-1.5 text-xs text-text-2 list-disc list-inside">
          <li>Microphone & audio input verified</li>
          <li>Screen share monitoring active</li>
          <li>AI dialogue pipeline connected</li>
        </ul>
      </div>

      <div className="p-4 rounded-lg bg-elevated/60 border border-border space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-2 font-mono">
          What Happens Next
        </h3>
        <p className="text-xs text-text-3 leading-relaxed">
          Speak naturally with the AI interviewer to discuss your background and experience. Once
          the introduction concludes, you will advance to the technical evaluation rounds.
        </p>
      </div>
    </div>
  );
};
